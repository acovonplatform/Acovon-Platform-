import crypto from 'crypto';
import fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface IceServerEntry {
  urls: string | string[];
  username?: string;
  credential?: string;
}

export interface RtcCapabilities {
  stunConfigured: boolean;
  turnConfigured: boolean;
  turnProvider: 'cloudflare_turn' | 'custom_turn' | 'stun_only';
  cloudflareStreamConfigured: boolean;
  webhookSecretConfigured: boolean;
  webrtcLiveAvailable: boolean;
}

export interface CloudflareLiveInputResult {
  ok: true;
  inputUid: string;
  whipUrl?: string;
  rtmpsUrl?: string;
  rtmpsStreamKey?: string;
  webrtcPlaybackUrl?: string;
  hlsPlaybackUrl?: string;
  dashPlaybackUrl?: string;
}

interface CachedTurnCreds {
  expiresAtMs: number;
  iceServers: IceServerEntry[];
}

let cachedCloudflareTurn: CachedTurnCreds | null = null;

function parseStaticTurnIceServers(): IceServerEntry[] {
  const rawUrls = (process.env.TURN_SERVER_URLS || '').trim();
  if (!rawUrls) return [];
  const urls = rawUrls
    .split(',')
    .map(u => u.trim())
    .filter(Boolean);
  if (urls.length === 0) return [];
  const username = (process.env.TURN_USERNAME || '').trim() || undefined;
  const credential = (process.env.TURN_CREDENTIAL || '').trim() || undefined;
  return [
    {
      urls,
      ...(username ? { username } : {}),
      ...(credential ? { credential } : {})
    }
  ];
}

export function getStreamingCapabilities(): RtcCapabilities {
  const cfTurnTokenId = (process.env.CLOUDFLARE_TURN_TOKEN_ID || '').trim();
  const cfTurnApiToken = (process.env.CLOUDFLARE_TURN_API_TOKEN || '').trim();
  const staticTurnUrls = parseStaticTurnIceServers();
  const cfAccountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const cfStreamToken = (process.env.CLOUDFLARE_STREAM_API_TOKEN || '').trim();
  const cfWebhookSecret = (process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET || '').trim();

  const hasCloudflareTurn = Boolean(cfTurnTokenId && cfTurnApiToken);
  const hasStaticTurn = staticTurnUrls.length > 0;

  return {
    stunConfigured: true,
    turnConfigured: hasCloudflareTurn || hasStaticTurn,
    turnProvider: hasCloudflareTurn ? 'cloudflare_turn' : hasStaticTurn ? 'custom_turn' : 'stun_only',
    cloudflareStreamConfigured: Boolean(cfAccountId && cfStreamToken),
    webhookSecretConfigured: Boolean(cfWebhookSecret),
    webrtcLiveAvailable: true
  };
}

export async function getRtcConfiguration(): Promise<{
  iceServers: IceServerEntry[];
  capabilities: RtcCapabilities;
}> {
  const capabilities = getStreamingCapabilities();
  const baseStun: IceServerEntry[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  const cfTurnTokenId = (process.env.CLOUDFLARE_TURN_TOKEN_ID || '').trim();
  const cfTurnApiToken = (process.env.CLOUDFLARE_TURN_API_TOKEN || '').trim();

  if (cfTurnTokenId && cfTurnApiToken) {
    if (cachedCloudflareTurn && cachedCloudflareTurn.expiresAtMs > Date.now() + 60_000) {
      return {
        iceServers: [...baseStun, ...cachedCloudflareTurn.iceServers],
        capabilities
      };
    }

    try {
      const resp = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(cfTurnTokenId)}/credentials/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfTurnApiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ ttl: 3600 })
        }
      );
      if (resp.ok) {
        const json = (await resp.json()) as { iceServers?: IceServerEntry | IceServerEntry[] };
        const dynamicServers = Array.isArray(json.iceServers)
          ? json.iceServers
          : json.iceServers
          ? [json.iceServers]
          : [];
        if (dynamicServers.length > 0) {
          cachedCloudflareTurn = {
            expiresAtMs: Date.now() + 30 * 60_000,
            iceServers: dynamicServers
          };
          return {
            iceServers: [...baseStun, ...dynamicServers],
            capabilities
          };
        }
      }
    } catch {
      // Fallback to static TURN or STUN
    }
  }

  const staticTurn = parseStaticTurnIceServers();
  return {
    iceServers: [...baseStun, ...staticTurn],
    capabilities
  };
}

export async function createCloudflareLiveInput(opts: {
  streamId: string;
  creatorId: string;
  title: string;
  recordingEnabled: boolean;
}): Promise<CloudflareLiveInputResult | { ok: false; configured: boolean; error: string }> {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const apiToken = (process.env.CLOUDFLARE_STREAM_API_TOKEN || '').trim();

  if (!accountId || !apiToken) {
    return {
      ok: false,
      configured: false,
      error: 'Cloudflare Stream credentials (CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_STREAM_API_TOKEN) are not set.'
    };
  }

  try {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/stream/live_inputs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meta: {
            name: opts.title.slice(0, 120),
            streamId: opts.streamId,
            creatorId: opts.creatorId
          },
          recording: {
            mode: opts.recordingEnabled ? 'automatic' : 'off',
            timeoutSeconds: 0,
            requireSignedURLs: false
          }
        })
      }
    );

    const payload = (await resp.json().catch(() => ({}))) as {
      success?: boolean;
      result?: {
        uid?: string;
        rtmps?: { url?: string; streamKey?: string };
        webRTC?: { url?: string };
        webRTCPlayback?: { url?: string };
      };
      errors?: Array<{ message?: string }>;
    };

    if (!resp.ok || !payload.success || !payload.result?.uid) {
      return {
        ok: false,
        configured: true,
        error: payload.errors?.[0]?.message || `Cloudflare Stream API error (HTTP ${resp.status})`
      };
    }

    const uid = payload.result.uid;
    return {
      ok: true,
      inputUid: uid,
      whipUrl: payload.result.webRTC?.url,
      rtmpsUrl: payload.result.rtmps?.url,
      rtmpsStreamKey: payload.result.rtmps?.streamKey,
      webrtcPlaybackUrl: payload.result.webRTCPlayback?.url,
      hlsPlaybackUrl: `https://customer-${accountId}.cloudflarestream.com/${uid}/manifest/video.m3u8`,
      dashPlaybackUrl: `https://customer-${accountId}.cloudflarestream.com/${uid}/manifest/video.mpd`
    };
  } catch (err: unknown) {
    return {
      ok: false,
      configured: true,
      error: err instanceof Error ? err.message : 'Failed to create Cloudflare Stream live input'
    };
  }
}

export function verifyCloudflareWebhookSignature(rawBody: Buffer | string, signatureHeader?: string | null): boolean {
  const secret = (process.env.CLOUDFLARE_STREAM_WEBHOOK_SECRET || '').trim();
  if (!secret || !signatureHeader) return false;

  // Format: time=1230811200,sig1=60493ec9388b...
  const parts = String(signatureHeader)
    .split(',')
    .map(p => p.trim());
  const timePart = parts.find(p => p.startsWith('time='));
  const sigPart = parts.find(p => p.startsWith('sig1='));
  if (!timePart || !sigPart) return false;

  const timestamp = timePart.slice('time='.length);
  const providedSig = sigPart.slice('sig1='.length);
  if (!timestamp || !providedSig) return false;

  // Reject stale webhook timestamps older than 5 minutes
  const tsSeconds = Number(timestamp);
  if (!Number.isFinite(tsSeconds) || Math.abs(Date.now() / 1000 - tsSeconds) > 300) {
    return false;
  }

  const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf-8') : String(rawBody);
  const sourceStr = `${timestamp}.${bodyStr}`;
  const expectedSig = crypto.createHmac('sha256', secret).update(sourceStr).digest('hex');

  const a = Buffer.from(providedSig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function finalizeRecordingWithFfmpeg(
  rawWebmPath: string,
  outputMp4Path: string
): Promise<{ finalPath: string; durationSeconds: number; sizeBytes: number }> {
  if (!fs.existsSync(rawWebmPath)) {
    throw new Error('Raw recording file not found');
  }

  let finalPath = rawWebmPath;
  try {
    await execFileAsync(
      '/usr/bin/ffmpeg',
      [
        '-y',
        '-i',
        rawWebmPath,
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '23',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
        outputMp4Path
      ],
      { timeout: 120_000 }
    );
    if (fs.existsSync(outputMp4Path) && fs.statSync(outputMp4Path).size > 0) {
      finalPath = outputMp4Path;
    }
  } catch {
    // Fallback to raw WebM if browser codec remuxing fails
    finalPath = rawWebmPath;
  }

  let durationSeconds = 0;
  try {
    const { stdout } = await execFileAsync(
      '/usr/bin/ffprobe',
      [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        finalPath
      ],
      { timeout: 15_000 }
    );
    const parsed = parseFloat(String(stdout || '').trim());
    if (Number.isFinite(parsed) && parsed > 0) {
      durationSeconds = Math.round(parsed);
    }
  } catch {
    durationSeconds = 0;
  }

  const sizeBytes = fs.existsSync(finalPath) ? fs.statSync(finalPath).size : 0;
  return { finalPath, durationSeconds, sizeBytes };
}
