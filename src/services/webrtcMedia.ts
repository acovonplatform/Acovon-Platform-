// Production WebRTC Media, Device Enumeration, ICE/TURN Fetching & Audio Monitoring Helpers
import { safeJson } from '../utils/safeHttp';

export interface RtcServerConfig {
  iceServers: RTCIceServer[];
  capabilities: {
    stunConfigured: boolean;
    turnConfigured: boolean;
    turnProvider: 'cloudflare_turn' | 'custom_turn' | 'stun_only';
    cloudflareStreamConfigured: boolean;
    webhookSecretConfigured: boolean;
    webrtcLiveAvailable: boolean;
  };
}

export interface EnumeratedMediaDevices {
  cameras: MediaDeviceInfo[];
  microphones: MediaDeviceInfo[];
  speakers: MediaDeviceInfo[];
}

let cachedRtcConfig: { fetchedAt: number; data: RtcServerConfig } | null = null;

export async function fetchRtcIceConfig(): Promise<RtcServerConfig> {
  if (cachedRtcConfig && Date.now() - cachedRtcConfig.fetchedAt < 5 * 60_000) {
    return cachedRtcConfig.data;
  }
  try {
    const res = await fetch('/api/rtc/config', { cache: 'no-store' });
    if (res.ok) {
      const json = await safeJson(res);
      if (json?.success && Array.isArray(json.iceServers)) {
        const data: RtcServerConfig = {
          iceServers: json.iceServers,
          capabilities: json.capabilities || {
            stunConfigured: true,
            turnConfigured: false,
            turnProvider: 'stun_only',
            cloudflareStreamConfigured: false,
            webhookSecretConfigured: false,
            webrtcLiveAvailable: true
          }
        };
        cachedRtcConfig = { fetchedAt: Date.now(), data };
        return data;
      }
    }
  } catch {
    // Fallback to public STUN if API unreachable
  }
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ],
    capabilities: {
      stunConfigured: true,
      turnConfigured: false,
      turnProvider: 'stun_only',
      cloudflareStreamConfigured: false,
      webhookSecretConfigured: false,
      webrtcLiveAvailable: true
    }
  };
}

export function formatMediaPermissionError(err: unknown): {
  title: string;
  message: string;
  instructions: string[];
} {
  if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
    return {
      title: 'HTTPS Required for Camera & Microphone',
      message: 'Browsers require a secure HTTPS connection to access camera and microphone hardware.',
      instructions: [
        'Open ACOVON over an HTTPS URL.',
        'Reload the page and grant camera and microphone permissions.'
      ]
    };
  }

  const domErr = err as DOMException | Error | undefined;
  const name = (domErr as DOMException)?.name || '';

  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
    return {
      title: 'Camera or Microphone Permission Denied',
      message: 'ACOVON cannot access your camera or microphone because permission was blocked.',
      instructions: [
        'Click the camera/lock icon in your browser address bar.',
        'Allow both Camera and Microphone access for this site.',
        'Click Retry Device Access below.'
      ]
    };
  }

  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return {
      title: 'No Camera or Microphone Found',
      message: 'No working camera or microphone device was detected on this device.',
      instructions: [
        'Connect a webcam or microphone and verify it works in system settings.',
        'Click Retry Device Access after connecting your device.'
      ]
    };
  }

  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return {
      title: 'Device Already In Use',
      message: 'Your camera or microphone is currently locked by another app or browser tab.',
      instructions: [
        'Close other video apps (Zoom, Meet, OBS, or other tabs) using the camera.',
        'Click Retry Device Access.'
      ]
    };
  }

  return {
    title: 'Unable to Access Media Devices',
    message: domErr?.message || 'Camera or microphone initialization failed.',
    instructions: [
      'Ensure camera and microphone permissions are allowed.',
      'Try selecting a different camera or microphone in device settings.'
    ]
  };
}

export async function listMediaDevices(): Promise<EnumeratedMediaDevices> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
    return { cameras: [], microphones: [], speakers: [] };
  }
  const devices = await navigator.mediaDevices.enumerateDevices();
  return {
    cameras: devices.filter(d => d.kind === 'videoinput'),
    microphones: devices.filter(d => d.kind === 'audioinput'),
    speakers: devices.filter(d => d.kind === 'audiooutput')
  };
}

export async function acquireLocalMedia(opts?: {
  videoDeviceId?: string;
  audioDeviceId?: string;
  facingMode?: 'user' | 'environment';
  withVideo?: boolean;
  withAudio?: boolean;
}): Promise<MediaStream> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new Error('Browser WebRTC getUserMedia API is not supported in this environment.');
  }

  const withVideo = opts?.withVideo !== false;
  const withAudio = opts?.withAudio !== false;

  const videoConstraint: MediaTrackConstraints | boolean = !withVideo
    ? false
    : opts?.videoDeviceId
    ? {
        deviceId: { exact: opts.videoDeviceId },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      }
    : {
        facingMode: opts?.facingMode || 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };

  const audioConstraint: MediaTrackConstraints | boolean = !withAudio
    ? false
    : opts?.audioDeviceId
    ? {
        deviceId: { exact: opts.audioDeviceId },
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    : {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      };

  try {
    return await navigator.mediaDevices.getUserMedia({
      video: videoConstraint,
      audio: audioConstraint
    });
  } catch (primaryErr) {
    // Retry with relaxed constraints if exact deviceId/HD resolution failed
    if (opts?.videoDeviceId || opts?.audioDeviceId) {
      return await navigator.mediaDevices.getUserMedia({
        video: withVideo,
        audio: withAudio
      });
    }
    throw primaryErr;
  }
}

export function stopMediaStream(stream: MediaStream | null | undefined): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach(track => {
      try {
        track.stop();
      } catch {
        // ignore
      }
    });
  } catch {
    // ignore
  }
}

export async function replaceTrackOnPeers(
  peers: RTCPeerConnection[],
  newTrack: MediaStreamTrack | null,
  kind: 'audio' | 'video'
): Promise<void> {
  await Promise.all(
    peers.map(async pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === kind);
      if (sender) {
        await sender.replaceTrack(newTrack);
      }
    })
  );
}

export function createAudioLevelMonitor(
  stream: MediaStream,
  onLevel: (levelPercent: number) => void
): () => void {
  if (typeof window === 'undefined' || stream.getAudioTracks().length === 0) {
    onLevel(0);
    return () => {};
  }
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return () => {};

  let stopped = false;
  let rafId = 0;
  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (stopped) return;
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length;
      const pct = Math.min(100, Math.round((avg / 128) * 100));
      onLevel(pct);
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
  } catch {
    onLevel(0);
  }

  return () => {
    stopped = true;
    if (rafId) cancelAnimationFrame(rafId);
    if (ctx) {
      ctx.close().catch(() => {});
    }
  };
}

export function startCallRingtone(kind: 'outgoing' | 'incoming'): () => void {
  if (typeof window === 'undefined') return () => {};
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return () => {};

  let stopped = false;
  let ctx: AudioContext | null = null;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  const playBurst = () => {
    if (stopped) return;
    try {
      if (!ctx) ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      if (kind === 'incoming') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.18);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      } else {
        osc.frequency.setValueAtTime(440, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(0.04, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.7);
      }
    } catch {
      // ignore audio autoplay restriction
    }
  };

  playBurst();
  intervalId = setInterval(playBurst, kind === 'incoming' ? 1900 : 2400);

  return () => {
    stopped = true;
    if (intervalId) clearInterval(intervalId);
    if (ctx) {
      ctx.close().catch(() => {});
    }
  };
}

export async function publishToWhipEndpoint(
  whipUrl: string,
  stream: MediaStream,
  iceServers: RTCIceServer[]
): Promise<RTCPeerConnection> {
  const pc = new RTCPeerConnection({ iceServers });
  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  await new Promise<void>(resolve => {
    if (pc.iceGatheringState === 'complete') {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, 2000);
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        clearTimeout(timer);
        resolve();
      }
    };
  });

  const resp = await fetch(whipUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/sdp' },
    body: pc.localDescription?.sdp || offer.sdp || ''
  });

  if (!resp.ok) {
    pc.close();
    throw new Error(`WHIP ingest failed (HTTP ${resp.status})`);
  }

  const answerSdp = await resp.text();
  await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
  return pc;
}
