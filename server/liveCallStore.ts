import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  ChatMessage,
  CommissionSettings,
  LiveChatMessage,
  LivePoll,
  Livestream,
  LivestreamAccessMode,
  RecordingMode,
  RecordingSettings,
  RecordingStatus,
  ReplayPermission,
  Subscription,
  VideoCallSession,
  VirtualGift,
  WalletTransaction
} from '../src/types';
import { MOCK_GIFTS } from '../src/data/mockData';
import { AuthoritativeCreatorApplicationStore } from './creatorApplicationStore';
import { createCloudflareLiveInput, finalizeRecordingWithFfmpeg } from './streamingProvider';

export interface VideoCallBillingRecord {
  id: string;
  callId: string;
  fanId: string;
  creatorId: string;
  billedSeconds: number;
  ratePerMinute: number;
  grossAmount: number;
  platformFee: number;
  netCreatorEarnings: number;
  idempotencyKey: string;
  settledAt: string;
}

export interface StoredLivestream extends Livestream {
  recordingFilePath?: string;
  recordingMimeType?: string;
}

export interface LiveCallsDB {
  livestreams: Record<string, StoredLivestream>;
  liveChat: Record<string, LiveChatMessage[]>;
  unlockedInviteStreams: Record<string, string[]>; // userId -> streamIds
  videoCalls: Record<string, VideoCallSession>;
  callBillingRecords: Record<string, VideoCallBillingRecord>; // keyed by callId
  chatThreads: Record<string, ChatMessage[]>; // pairKey(id1, id2) -> ChatMessage[]
  transactions: WalletTransaction[];
  subscriptions: Subscription[];
  followingByUser: Record<string, string[]>;
  commissionSettings: CommissionSettings;
  updatedAt: string;
}

const DEFAULT_COMMISSIONS: CommissionSettings = {
  subscriptionsRate: 0.20,
  ppvRate: 0.20,
  customRequestsRate: 0.20,
  videoCallsRate: 0.20,
  paidMessagesRate: 0.20,
  tipsRate: 0.20,
  creatorPromotionsRate: 0.20,
  minWithdrawalAmount: 25
};

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function writeJsonAtomic(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export function makeThreadKey(userA: string, userB: string): string {
  return [String(userA).trim(), String(userB).trim()].sort().join('::');
}

function nowTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

export class AuthoritativeLiveCallStore {
  private readonly dataDir: string;
  private readonly dbFilePath: string;
  private readonly recordingsDir: string;
  private readonly creatorAppStore: AuthoritativeCreatorApplicationStore;

  // Real deduplicated active viewer presence per stream: streamId -> Map<viewerKey, Set<connectionId>>
  private readonly activeStreamViewers = new Map<string, Map<string, Set<string>>>();

  // Ringing timeout watchdogs: callId -> NodeJS.Timeout
  private readonly callRingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  // Event hook for broadcasting WebSocket updates from server.ts
  public onEvent?: (event: {
    type: string;
    room?: string;
    rooms?: string[];
    userIds?: string[];
    payload: any;
  }) => void;

  constructor(opts: {
    dataDir: string;
    creatorAppStore: AuthoritativeCreatorApplicationStore;
  }) {
    this.dataDir = opts.dataDir;
    this.creatorAppStore = opts.creatorAppStore;
    this.dbFilePath = path.join(this.dataDir, 'live_calls_db.json');
    this.recordingsDir = path.join(this.dataDir, 'live_recordings');
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.recordingsDir)) {
      fs.mkdirSync(this.recordingsDir, { recursive: true });
    }
    if (!fs.existsSync(this.dbFilePath)) {
      this.writeDB(this.createInitialDB());
    } else {
      // Reset transient viewerCount to 0 on cold server boot until real WebSocket viewers reconnect
      const db = this.readDB();
      let dirty = false;
      for (const stream of Object.values(db.livestreams)) {
        if (stream.status === 'live' && stream.viewerCount !== 0) {
          stream.viewerCount = 0;
          dirty = true;
        }
      }
      if (dirty) this.writeDB(db);
    }
  }

  private createInitialDB(): LiveCallsDB {
    return {
      livestreams: {},
      liveChat: {},
      unlockedInviteStreams: {},
      videoCalls: {},
      callBillingRecords: {},
      chatThreads: {},
      transactions: [],
      subscriptions: [],
      followingByUser: {},
      commissionSettings: { ...DEFAULT_COMMISSIONS },
      updatedAt: new Date().toISOString()
    };
  }

  public readDB(): LiveCallsDB {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const parsed = JSON.parse(fs.readFileSync(this.dbFilePath, 'utf-8')) as Partial<LiveCallsDB>;
        if (parsed && typeof parsed === 'object') {
          return {
            livestreams: parsed.livestreams && typeof parsed.livestreams === 'object' ? parsed.livestreams : {},
            liveChat: parsed.liveChat && typeof parsed.liveChat === 'object' ? parsed.liveChat : {},
            unlockedInviteStreams:
              parsed.unlockedInviteStreams && typeof parsed.unlockedInviteStreams === 'object'
                ? parsed.unlockedInviteStreams
                : {},
            videoCalls: parsed.videoCalls && typeof parsed.videoCalls === 'object' ? parsed.videoCalls : {},
            callBillingRecords:
              parsed.callBillingRecords && typeof parsed.callBillingRecords === 'object'
                ? parsed.callBillingRecords
                : {},
            chatThreads: parsed.chatThreads && typeof parsed.chatThreads === 'object' ? parsed.chatThreads : {},
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
            subscriptions: Array.isArray(parsed.subscriptions) ? parsed.subscriptions : [],
            followingByUser:
              parsed.followingByUser && typeof parsed.followingByUser === 'object' ? parsed.followingByUser : {},
            commissionSettings: parsed.commissionSettings
              ? { ...DEFAULT_COMMISSIONS, ...parsed.commissionSettings }
              : { ...DEFAULT_COMMISSIONS },
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
          };
        }
      }
    } catch (err) {
      console.error('Failed to read live_calls_db.json:', err);
    }
    const fresh = this.createInitialDB();
    this.writeDB(fresh);
    return fresh;
  }

  private writeDB(db: LiveCallsDB): void {
    db.updatedAt = new Date().toISOString();
    writeJsonAtomic(this.dbFilePath, db);
  }

  // Strip host-only secrets (ingest URLs, stream key, private passcode, internal disk paths) unless requester is host/admin
  public sanitizeStream(stream: StoredLivestream, requesterId?: string, isAdmin?: boolean): Livestream {
    const isHost = Boolean(requesterId && requesterId === stream.creatorId);
    const clone = deepClone(stream);
    delete (clone as any).recordingFilePath;
    delete (clone as any).recordingMimeType;
    if (!isHost && !isAdmin) {
      delete clone.whipIngestUrl;
      delete clone.rtmpsIngestUrl;
      delete clone.rtmpsStreamKey;
      delete clone.privatePasscode;
    }
    if (clone.status !== 'live') {
      clone.viewerCount = 0;
    }
    return clone;
  }

  // Sync subscription / follow state from client or backend
  public syncSubscription(sub: Subscription): void {
    const db = this.readDB();
    const idx = db.subscriptions.findIndex(s => s.id === sub.id || (s.fanId === sub.fanId && s.creatorId === sub.creatorId));
    if (idx >= 0) {
      db.subscriptions[idx] = sub;
    } else {
      db.subscriptions.unshift(sub);
    }
    this.writeDB(db);
  }

  public syncFollowing(userId: string, followingIds: string[]): void {
    const db = this.readDB();
    db.followingByUser[userId] = Array.from(new Set(followingIds.filter(Boolean)));
    this.writeDB(db);
  }

  // ============================================================================
  // ACCESS CONTROL GATES (Authoritative Server Enforcement)
  // ============================================================================
  public evaluateLivestreamAccess(
    stream: StoredLivestream,
    userId?: string
  ): {
    canAccess: boolean;
    reason?: 'subscription_required' | 'tier_upgrade_required' | 'ppv_purchase_required' | 'invite_required';
    price?: number;
  } {
    if (stream.accessMode === 'public') {
      return { canAccess: true };
    }
    if (!userId) {
      if (stream.accessMode === 'all_subscribers') return { canAccess: false, reason: 'subscription_required' };
      if (stream.accessMode === 'selected_plan') return { canAccess: false, reason: 'tier_upgrade_required' };
      if (stream.accessMode === 'pay_per_view') {
        return { canAccess: false, reason: 'ppv_purchase_required', price: stream.ppvTicketPrice || 9.99 };
      }
      return { canAccess: false, reason: 'invite_required' };
    }

    const { user } = this.creatorAppStore.getUserOrCreator(userId);
    if (userId === stream.creatorId || user?.role === 'admin' || user?.role === 'moderator') {
      return { canAccess: true };
    }

    const db = this.readDB();
    const activeSub = db.subscriptions.find(
      s => s.fanId === userId && s.creatorId === stream.creatorId && s.status === 'active'
    );

    if (stream.accessMode === 'all_subscribers') {
      return activeSub ? { canAccess: true } : { canAccess: false, reason: 'subscription_required' };
    }

    if (stream.accessMode === 'selected_plan') {
      const allowed = stream.allowedTierIds || [];
      if (activeSub && (allowed.length === 0 || allowed.includes(activeSub.tierId))) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'tier_upgrade_required' };
    }

    if (stream.accessMode === 'pay_per_view') {
      if (stream.purchasedViewerIds?.includes(userId)) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'ppv_purchase_required', price: stream.ppvTicketPrice || 9.99 };
    }

    if (stream.accessMode === 'private_invite') {
      const unlocked = db.unlockedInviteStreams[userId] || [];
      if (stream.allowedUserIds?.includes(userId) || unlocked.includes(stream.id)) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'invite_required' };
    }

    return { canAccess: true };
  }

  public evaluateReplayAccess(
    stream: StoredLivestream,
    userId?: string
  ): {
    canAccess: boolean;
    reason?:
      | 'recording_disabled'
      | 'recording_unpublished'
      | 'replay_purchase_required'
      | 'follower_required'
      | 'subscription_required'
      | 'tier_upgrade_required'
      | 'invite_required';
    price?: number;
  } {
    const { user } = userId ? this.creatorAppStore.getUserOrCreator(userId) : {};
    if (userId && (userId === stream.creatorId || user?.role === 'admin' || user?.role === 'moderator')) {
      return { canAccess: true };
    }

    if (userId && stream.purchasedReplayUserIds?.includes(userId)) {
      return { canAccess: true };
    }

    if (
      userId &&
      stream.recordingSettings?.includeReplayWithLiveTicket &&
      stream.purchasedViewerIds?.includes(userId)
    ) {
      return { canAccess: true };
    }

    if (!stream.recordingSettings || stream.recordingSettings.mode === 'disabled' || stream.recordingStatus === 'removed') {
      return { canAccess: false, reason: 'recording_disabled' };
    }

    if (stream.isReplayPublished === false || stream.recordingStatus === 'unpublished') {
      return { canAccess: false, reason: 'recording_unpublished' };
    }

    if (stream.recordingSettings.mode === 'paid' || stream.recordingSettings.replayPermission === 'paid') {
      return {
        canAccess: false,
        reason: 'replay_purchase_required',
        price: stream.recordingSettings.price || 9.99
      };
    }

    const perm = stream.recordingSettings.replayPermission || 'public';
    if (perm === 'public') return { canAccess: true };
    if (!userId) {
      if (perm === 'followers') return { canAccess: false, reason: 'follower_required' };
      if (perm === 'subscribers') return { canAccess: false, reason: 'subscription_required' };
      if (perm === 'selected_plan') return { canAccess: false, reason: 'tier_upgrade_required' };
      return { canAccess: false, reason: 'invite_required' };
    }

    const db = this.readDB();
    const activeSub = db.subscriptions.find(
      s => s.fanId === userId && s.creatorId === stream.creatorId && s.status === 'active'
    );
    const follows = (db.followingByUser[userId] || []).includes(stream.creatorId);

    if (perm === 'followers') {
      return follows || activeSub ? { canAccess: true } : { canAccess: false, reason: 'follower_required' };
    }
    if (perm === 'subscribers') {
      return activeSub ? { canAccess: true } : { canAccess: false, reason: 'subscription_required' };
    }
    if (perm === 'selected_plan') {
      const allowed = stream.recordingSettings.allowedReplayTierIds || stream.allowedTierIds || [];
      if (activeSub && (allowed.length === 0 || allowed.includes(activeSub.tierId))) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'tier_upgrade_required' };
    }
    if (perm === 'private_invite') {
      const unlocked = db.unlockedInviteStreams[userId] || [];
      if (stream.allowedUserIds?.includes(userId) || unlocked.includes(stream.id)) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'invite_required' };
    }

    return { canAccess: true };
  }

  // ============================================================================
  // LIVESTREAM LIFECYCLE & VIEWER PRESENCE
  // ============================================================================
  public listLivestreams(requesterId?: string, isAdmin?: boolean): {
    livestreams: Livestream[];
    liveChat: Record<string, LiveChatMessage[]>;
  } {
    const db = this.readDB();
    const list = Object.values(db.livestreams)
      .sort((a, b) => {
        const order: Record<string, number> = { live: 0, scheduled: 1, ended: 2 };
        const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
        if (diff !== 0) return diff;
        return String(b.startedAtIso || b.id).localeCompare(String(a.startedAtIso || a.id));
      })
      .map(s => this.sanitizeStream(s, requesterId, isAdmin));

    return {
      livestreams: list,
      liveChat: deepClone(db.liveChat)
    };
  }

  public getLivestream(streamId: string, requesterId?: string, isAdmin?: boolean): Livestream | null {
    const db = this.readDB();
    const s = db.livestreams[streamId];
    return s ? this.sanitizeStream(s, requesterId, isAdmin) : null;
  }

  public async createLivestream(input: {
    creatorId: string;
    title: string;
    description: string;
    coverImage?: string;
    category: string;
    tags?: string[];
    accessMode: LivestreamAccessMode;
    allowedTierIds?: string[];
    ppvTicketPrice?: number;
    privatePasscode?: string;
    allowedUserIds?: string[];
    expectedDurationMinutes?: number;
    scheduledFor?: string;
    preferObsIngest?: boolean;
    settings: Livestream['settings'];
    recordingSettings?: RecordingSettings;
  }): Promise<{ ok: true; stream: Livestream } | { ok: false; statusCode: number; error: string }> {
    const { user, creator } = this.creatorAppStore.getUserOrCreator(input.creatorId);
    const isAdminAccount =
      user?.role === 'admin' || user?.role === 'moderator' || Boolean(user?.adminPermissionLevel);
    const isApprovedCreator =
      Boolean(creator) ||
      isAdminAccount ||
      (user?.role === 'creator' && user.creatorApprovalStatus === 'approved');

    if (!isApprovedCreator) {
      return {
        ok: false,
        statusCode: 403,
        error: 'Only approved creators can create or broadcast live streams.'
      };
    }

    const title = String(input.title || '').trim();
    if (!title) {
      return { ok: false, statusCode: 400, error: 'Livestream title is required.' };
    }

    const streamId = `live_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const streamSessionId = `sess_${crypto.randomBytes(6).toString('hex')}`;
    const isScheduled = Boolean(input.scheduledFor && input.scheduledFor.trim());
    const recSettings: RecordingSettings = input.recordingSettings || {
      mode: 'disabled',
      replayPermission: 'public'
    };
    const recordingEnabled = recSettings.mode !== 'disabled';

    // Try Cloudflare Stream if configured
    let provider: StoredLivestream['provider'] = 'webrtc_live';
    let cloudflareInputUid: string | undefined;
    let whipIngestUrl: string | undefined;
    let rtmpsIngestUrl: string | undefined;
    let rtmpsStreamKey: string | undefined;
    let hlsPlaybackUrl: string | undefined;
    let dashPlaybackUrl: string | undefined;
    let webrtcPlaybackUrl: string | undefined;

    const cfRes = await createCloudflareLiveInput({
      streamId,
      creatorId: input.creatorId,
      title,
      recordingEnabled
    });
    if (cfRes.ok) {
      provider = input.preferObsIngest ? 'obs_rtmps' : 'cloudflare_stream';
      cloudflareInputUid = cfRes.inputUid;
      whipIngestUrl = cfRes.whipUrl;
      rtmpsIngestUrl = cfRes.rtmpsUrl;
      rtmpsStreamKey = cfRes.rtmpsStreamKey;
      hlsPlaybackUrl = cfRes.hlsPlaybackUrl;
      dashPlaybackUrl = cfRes.dashPlaybackUrl;
      webrtcPlaybackUrl = cfRes.webrtcPlaybackUrl;
    }

    const creatorName = creator?.name || user?.name || 'Creator';
    const creatorUsername = creator?.username || user?.username || 'creator';
    const creatorAvatar = creator?.avatar || user?.avatar || '';
    const nowIso = new Date().toISOString();

    const stored: StoredLivestream = {
      id: streamId,
      creatorId: input.creatorId,
      creatorName,
      creatorUsername,
      creatorAvatar,
      title,
      description: String(input.description || '').trim(),
      coverImage: input.coverImage || '',
      category: input.category || 'Entertainment',
      tags: Array.isArray(input.tags) ? input.tags.filter(Boolean) : [],
      accessMode: input.accessMode || 'public',
      allowedTierIds: input.allowedTierIds,
      ppvTicketPrice: input.ppvTicketPrice,
      privatePasscode: input.privatePasscode,
      allowedUserIds: input.allowedUserIds,
      status: isScheduled ? 'scheduled' : 'live',
      provider,
      streamSessionId,
      cloudflareInputUid,
      whipIngestUrl,
      rtmpsIngestUrl,
      rtmpsStreamKey,
      hlsPlaybackUrl,
      dashPlaybackUrl,
      webrtcPlaybackUrl,
      playbackTokenRequired: input.accessMode !== 'public',
      viewerCount: 0,
      totalRevenue: 0,
      startedAt: isScheduled ? undefined : 'Just now',
      startedAtIso: isScheduled ? undefined : nowIso,
      scheduledFor: input.scheduledFor || undefined,
      expectedDurationMinutes: input.expectedDurationMinutes || 60,
      videoStreamUrl: hlsPlaybackUrl || '',
      settings: input.settings || {
        enableTips: true,
        enableGifts: true,
        enablePaidMessages: true,
        enableHighlightedMessages: true,
        subscribersOnlyChat: false,
        minimumTipAmount: 5
      },
      purchasedViewerIds: [],
      recordingSettings: recSettings,
      recordingStatus: recordingEnabled ? (isScheduled ? 'not_recorded' : 'recording') : 'not_recorded',
      isReplayPublished: recordingEnabled && !isScheduled,
      replayViewsCount: 0,
      replayPurchasesCount: 0,
      replayGrossRevenue: 0,
      replayPlatformFee: 0,
      replayNetRevenue: 0,
      purchasedReplayUserIds: []
    };

    const db = this.readDB();
    db.livestreams[streamId] = stored;
    if (!db.liveChat[streamId]) {
      db.liveChat[streamId] = [];
    }
    this.writeDB(db);

    const sanitizedPublic = this.sanitizeStream(stored, undefined, false);
    this.onEvent?.({
      type: 'live:created',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: sanitizedPublic }
    });

    return {
      ok: true,
      stream: this.sanitizeStream(stored, input.creatorId, false)
    };
  }

  public startLivestream(streamId: string, actorId: string): { ok: true; stream: Livestream } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };
    if (stream.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Only the host creator can start this broadcast.' };
    }
    const recEnabled = stream.recordingSettings && stream.recordingSettings.mode !== 'disabled';
    stream.status = 'live';
    stream.startedAt = 'Just now';
    stream.startedAtIso = new Date().toISOString();
    stream.recordingStatus = recEnabled ? 'recording' : 'not_recorded';
    this.writeDB(db);

    const pubStream = this.sanitizeStream(stream, undefined, false);
    this.onEvent?.({
      type: 'live:updated',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: pubStream }
    });
    return { ok: true, stream: this.sanitizeStream(stream, actorId, false) };
  }

  public appendRecordingChunk(streamId: string, actorId: string, chunkBuffer: Buffer): { ok: true; sizeBytes: number } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };
    if (stream.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Unauthorized recording upload.' };
    }
    if (!stream.recordingSettings || stream.recordingSettings.mode === 'disabled') {
      return { ok: false, statusCode: 400, error: 'Recording is disabled for this stream.' };
    }
    const rawFile = path.join(this.recordingsDir, `raw_${streamId}.webm`);
    fs.appendFileSync(rawFile, chunkBuffer);
    const stat = fs.statSync(rawFile);
    stream.recordingFilePath = rawFile;
    stream.recordingMimeType = 'video/webm';
    stream.recordingFileSizeBytes = stat.size;
    this.writeDB(db);
    return { ok: true, sizeBytes: stat.size };
  }

  public async endLivestream(streamId: string, actorId: string, isAdmin?: boolean): Promise<{ ok: true; stream: Livestream } | { ok: false; statusCode: number; error: string }> {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };
    if (stream.creatorId !== actorId && !isAdmin) {
      return { ok: false, statusCode: 403, error: 'Only the stream host or admin can end this livestream.' };
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    stream.status = 'ended';
    stream.endedAt = todayStr;
    stream.endedAtIso = nowIso;
    stream.viewerCount = 0;

    // Clear active live viewers on end
    this.activeStreamViewers.delete(streamId);

    const recMode = stream.recordingSettings?.mode || 'disabled';
    if (recMode === 'disabled') {
      stream.recordingStatus = 'not_recorded';
      stream.isReplayPublished = false;
      this.writeDB(db);
    } else {
      const rawFile = path.join(this.recordingsDir, `raw_${streamId}.webm`);
      const outMp4 = path.join(this.recordingsDir, `recording_${streamId}.mp4`);
      const availDays = stream.recordingSettings?.availabilityDays;
      const expiresStr =
        availDays && availDays !== 'unlimited'
          ? new Date(Date.now() + Number(availDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : 'Unlimited';

      stream.recordingPublishedAt = todayStr;
      stream.recordingExpiresAt = expiresStr;

      if (fs.existsSync(rawFile) && fs.statSync(rawFile).size > 0) {
        stream.recordingStatus = 'processing';
        this.writeDB(db);

        try {
          const finalized = await finalizeRecordingWithFfmpeg(rawFile, outMp4);
          const dbAfter = this.readDB();
          const targetAfter = dbAfter.livestreams[streamId];
          if (targetAfter) {
            const isMp4 = finalized.finalPath.endsWith('.mp4');
            targetAfter.recordingFilePath = finalized.finalPath;
            targetAfter.recordingMimeType = isMp4 ? 'video/mp4' : 'video/webm';
            targetAfter.recordingDurationSeconds = finalized.durationSeconds;
            targetAfter.recordingFileSizeBytes = finalized.sizeBytes;
            targetAfter.recordingUrl = `/api/live/sessions/${encodeURIComponent(streamId)}/recording-media`;
            targetAfter.videoStreamUrl = targetAfter.recordingUrl;
            targetAfter.recordingStatus = 'ready';
            targetAfter.isReplayPublished = true;
            this.writeDB(dbAfter);
            const sanitized = this.sanitizeStream(targetAfter, undefined, false);
            this.onEvent?.({
              type: 'live:ended',
              rooms: ['global:live', `live:${streamId}`],
              payload: { stream: sanitized }
            });
            return { ok: true, stream: this.sanitizeStream(targetAfter, actorId, isAdmin) };
          }
        } catch {
          // Fall through
        }
      }

      if (stream.hlsPlaybackUrl) {
        stream.recordingUrl = `/api/live/sessions/${encodeURIComponent(streamId)}/recording-media`;
        stream.recordingStatus = 'ready';
        stream.isReplayPublished = true;
      } else {
        stream.recordingStatus = fs.existsSync(rawFile) ? 'ready' : 'not_recorded';
        stream.isReplayPublished = fs.existsSync(rawFile);
        if (fs.existsSync(rawFile)) {
          stream.recordingUrl = `/api/live/sessions/${encodeURIComponent(streamId)}/recording-media`;
          stream.videoStreamUrl = stream.recordingUrl;
        }
      }
      this.writeDB(db);
    }

    const updatedDb = this.readDB();
    const finalStream = updatedDb.livestreams[streamId];
    const sanitized = this.sanitizeStream(finalStream, undefined, false);
    this.onEvent?.({
      type: 'live:ended',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: sanitized }
    });

    return { ok: true, stream: this.sanitizeStream(finalStream, actorId, isAdmin) };
  }

  // Deduplicated viewer join & leave backed by WebSocket connectionId
  public registerStreamViewer(streamId: string, viewerKey: string, connectionId: string): number {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream || stream.status !== 'live') return 0;

    let streamMap = this.activeStreamViewers.get(streamId);
    if (!streamMap) {
      streamMap = new Map<string, Set<string>>();
      this.activeStreamViewers.set(streamId, streamMap);
    }
    let conns = streamMap.get(viewerKey);
    if (!conns) {
      conns = new Set<string>();
      streamMap.set(viewerKey, conns);
    }
    conns.add(connectionId);

    const count = streamMap.size;
    if (stream.viewerCount !== count) {
      stream.viewerCount = count;
      this.writeDB(db);
    }
    this.onEvent?.({
      type: 'live:viewer_count',
      rooms: ['global:live', `live:${streamId}`],
      payload: { streamId, viewerCount: count }
    });
    return count;
  }

  public unregisterStreamViewer(streamId: string, viewerKey: string, connectionId: string): number {
    const streamMap = this.activeStreamViewers.get(streamId);
    if (!streamMap) return 0;
    const conns = streamMap.get(viewerKey);
    if (conns) {
      conns.delete(connectionId);
      if (conns.size === 0) {
        streamMap.delete(viewerKey);
      }
    }
    const count = streamMap.size;
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (stream && stream.viewerCount !== count) {
      stream.viewerCount = stream.status === 'live' ? count : 0;
      this.writeDB(db);
    }
    this.onEvent?.({
      type: 'live:viewer_count',
      rooms: ['global:live', `live:${streamId}`],
      payload: { streamId, viewerCount: stream?.status === 'live' ? count : 0 }
    });
    return count;
  }

  public removeConnectionFromAllStreams(connectionId: string): void {
    for (const [streamId, viewerMap] of this.activeStreamViewers.entries()) {
      let changed = false;
      for (const [viewerKey, connSet] of viewerMap.entries()) {
        if (connSet.has(connectionId)) {
          connSet.delete(connectionId);
          changed = true;
          if (connSet.size === 0) {
            viewerMap.delete(viewerKey);
          }
        }
      }
      if (changed) {
        const count = viewerMap.size;
        const db = this.readDB();
        const stream = db.livestreams[streamId];
        if (stream) {
          stream.viewerCount = stream.status === 'live' ? count : 0;
          this.writeDB(db);
          this.onEvent?.({
            type: 'live:viewer_count',
            rooms: ['global:live', `live:${streamId}`],
            payload: { streamId, viewerCount: stream.viewerCount }
          });
        }
      }
    }
  }

  public getActiveViewerIds(streamId: string): string[] {
    const map = this.activeStreamViewers.get(streamId);
    if (!map) return [];
    return Array.from(map.keys());
  }

  public purchaseTicket(streamId: string, userId: string): { ok: true; stream: Livestream; newBalance: number; transaction: WalletTransaction } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };
    if (stream.purchasedViewerIds.includes(userId)) {
      return {
        ok: true,
        stream: this.sanitizeStream(stream, userId, false),
        newBalance: this.creatorAppStore.getWalletBalance(userId),
        transaction: db.transactions.find(t => t.userId === userId && t.referenceId === streamId) || ({
          id: `tx_ticket_existing_${Date.now()}`,
          userId,
          type: 'live_ticket',
          amount: 0,
          description: `Live Ticket: ${stream.title}`,
          status: 'completed',
          createdAt: nowTimestamp()
        })
      };
    }

    const price = Number((stream.ppvTicketPrice || 9.99).toFixed(2));
    const commissionRate = db.commissionSettings.ppvRate || 0.20;
    const platformFee = Number((price * commissionRate).toFixed(2));
    const netCreator = Number((price - platformFee).toFixed(2));

    const debit = this.creatorAppStore.adjustUserWallet(userId, -price);
    if (!debit.ok) {
      return {
        ok: false,
        statusCode: 402,
        error: debit.error || `Insufficient wallet balance. Deposit at least $${price.toFixed(2)}.`
      };
    }

    this.creatorAppStore.adjustUserWallet(stream.creatorId, netCreator, { addCreatorEarnings: netCreator });

    stream.totalRevenue = Number((stream.totalRevenue + price).toFixed(2));
    stream.purchasedViewerIds = Array.from(new Set([...stream.purchasedViewerIds, userId]));

    const tx: WalletTransaction = {
      id: `tx_ticket_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      type: 'live_ticket',
      amount: -price,
      description: `Live Ticket: ${stream.title}`,
      status: 'completed',
      createdAt: nowTimestamp(),
      referenceId: streamId,
      platformFee,
      netCreatorEarnings: netCreator
    };
    db.transactions.unshift(tx);
    this.writeDB(db);

    const sanitized = this.sanitizeStream(stream, userId, false);
    this.onEvent?.({
      type: 'live:updated',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: this.sanitizeStream(stream, undefined, false) }
    });

    return { ok: true, stream: sanitized, newBalance: debit.balance, transaction: tx };
  }

  public unlockInviteStream(streamId: string, userId: string, passcode: string): { ok: true; stream: Livestream } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };
    if (
      stream.privatePasscode &&
      stream.privatePasscode.trim().toLowerCase() !== String(passcode || '').trim().toLowerCase()
    ) {
      return { ok: false, statusCode: 403, error: 'Invalid invitation passcode.' };
    }
    const existing = db.unlockedInviteStreams[userId] || [];
    db.unlockedInviteStreams[userId] = Array.from(new Set([...existing, streamId]));
    this.writeDB(db);
    return { ok: true, stream: this.sanitizeStream(stream, userId, false) };
  }

  public purchaseReplay(streamId: string, userId: string): { ok: true; stream: Livestream; newBalance: number; transaction: WalletTransaction } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream recording not found.' };
    if (!stream.recordingSettings || stream.recordingSettings.mode === 'disabled') {
      return { ok: false, statusCode: 400, error: 'Recording is not enabled for this broadcast.' };
    }
    if (stream.purchasedReplayUserIds?.includes(userId)) {
      return { ok: false, statusCode: 409, error: 'You have already unlocked this livestream recording.' };
    }

    const price = Number((stream.recordingSettings.price || 9.99).toFixed(2));
    const debit = this.creatorAppStore.adjustUserWallet(userId, -price);
    if (!debit.ok) {
      return { ok: false, statusCode: 402, error: debit.error || 'Insufficient wallet balance.' };
    }

    const commissionRate = db.commissionSettings.ppvRate || 0.20;
    const platformFee = Number((price * commissionRate).toFixed(2));
    const netCreator = Number((price - platformFee).toFixed(2));

    this.creatorAppStore.adjustUserWallet(stream.creatorId, netCreator, { addCreatorEarnings: netCreator });

    stream.totalRevenue = Number((stream.totalRevenue + price).toFixed(2));
    stream.replayPurchasesCount = (stream.replayPurchasesCount || 0) + 1;
    stream.replayGrossRevenue = Number(((stream.replayGrossRevenue || 0) + price).toFixed(2));
    stream.replayPlatformFee = Number(((stream.replayPlatformFee || 0) + platformFee).toFixed(2));
    stream.replayNetRevenue = Number(((stream.replayNetRevenue || 0) + netCreator).toFixed(2));
    stream.purchasedReplayUserIds = Array.from(new Set([...(stream.purchasedReplayUserIds || []), userId]));

    const tx: WalletTransaction = {
      id: `tx_replay_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      userId,
      type: 'live_replay',
      amount: -price,
      description: `Official Live Recording: ${stream.title} (${stream.creatorName})`,
      status: 'completed',
      createdAt: nowTimestamp(),
      referenceId: streamId,
      platformFee,
      netCreatorEarnings: netCreator
    };
    db.transactions.unshift(tx);
    this.writeDB(db);

    this.onEvent?.({
      type: 'live:updated',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: this.sanitizeStream(stream, undefined, false) }
    });

    return { ok: true, stream: this.sanitizeStream(stream, userId, false), newBalance: debit.balance, transaction: tx };
  }

  public updateRecordingSettings(
    streamId: string,
    actorId: string,
    isAdmin: boolean,
    updates: {
      isReplayPublished?: boolean;
      recordingStatus?: RecordingStatus;
      mode?: RecordingMode;
      price?: number;
      availabilityDays?: number | 'unlimited';
      description?: string;
      replayPermission?: ReplayPermission;
      allowedReplayTierIds?: string[];
      includeReplayWithLiveTicket?: boolean;
    }
  ): { ok: true; stream: Livestream } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Recording not found.' };
    if (stream.creatorId !== actorId && !isAdmin) {
      return { ok: false, statusCode: 403, error: 'Unauthorized.' };
    }

    const currentRec: RecordingSettings = stream.recordingSettings || {
      mode: 'free',
      replayPermission: 'public'
    };
    const nextMode = updates.mode ?? currentRec.mode;
    const nextPermission = updates.replayPermission ?? (nextMode === 'paid' ? 'paid' : currentRec.replayPermission);
    const nextAvail = updates.availabilityDays ?? currentRec.availabilityDays;
    const nextExpiresAt =
      nextAvail && nextAvail !== 'unlimited'
        ? new Date(Date.now() + Number(nextAvail) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : nextAvail === 'unlimited'
        ? 'Unlimited'
        : stream.recordingExpiresAt;

    const nextPublished = updates.isReplayPublished !== undefined ? updates.isReplayPublished : stream.isReplayPublished;
    const nextStatus =
      updates.recordingStatus !== undefined
        ? updates.recordingStatus
        : nextPublished === false && stream.recordingStatus === 'ready'
        ? 'unpublished'
        : nextPublished === true && stream.recordingStatus === 'unpublished'
        ? 'ready'
        : stream.recordingStatus;

    stream.isReplayPublished = nextPublished;
    stream.recordingStatus = nextStatus;
    stream.recordingExpiresAt = nextExpiresAt;
    stream.recordingSettings = {
      ...currentRec,
      mode: nextMode,
      price: updates.price !== undefined ? Number(updates.price.toFixed(2)) : currentRec.price,
      availabilityDays: nextAvail,
      description: updates.description !== undefined ? updates.description : currentRec.description,
      replayPermission: nextPermission,
      allowedReplayTierIds: updates.allowedReplayTierIds ?? currentRec.allowedReplayTierIds,
      includeReplayWithLiveTicket: updates.includeReplayWithLiveTicket ?? currentRec.includeReplayWithLiveTicket
    };

    this.writeDB(db);
    this.onEvent?.({
      type: 'live:updated',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: this.sanitizeStream(stream, undefined, false) }
    });
    return { ok: true, stream: this.sanitizeStream(stream, actorId, isAdmin) };
  }

  public sendLiveChat(input: {
    streamId: string;
    senderId: string;
    message: string;
    type?: LiveChatMessage['type'];
    amountPaid?: number;
    giftId?: string;
  }): { ok: true; chatMessage: LiveChatMessage; stream: Livestream; newBalance: number; transaction?: WalletTransaction } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[input.streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };

    const { user, creator } = this.creatorAppStore.getUserOrCreator(input.senderId);
    if (!user && !creator) {
      return { ok: false, statusCode: 401, error: 'Authenticated account required.' };
    }

    let giftData: VirtualGift | undefined;
    let amount = Number(input.amountPaid || 0);
    let msgText = String(input.message || '').trim();
    const msgType: LiveChatMessage['type'] = input.giftId ? 'gift' : input.type || 'standard';

    if (input.giftId) {
      giftData = MOCK_GIFTS.find(g => g.id === input.giftId);
      if (!giftData) return { ok: false, statusCode: 404, error: 'Gift not found.' };
      amount = giftData.price;
      if (!msgText) msgText = `Sent a ${giftData.name} ${giftData.icon}`;
    }

    if (!msgText) {
      return { ok: false, statusCode: 400, error: 'Message text is required.' };
    }

    let newBalance = this.creatorAppStore.getWalletBalance(input.senderId);
    let transaction: WalletTransaction | undefined;

    if (amount > 0) {
      const debit = this.creatorAppStore.adjustUserWallet(input.senderId, -amount);
      if (!debit.ok) {
        return { ok: false, statusCode: 402, error: debit.error || `Insufficient wallet balance ($${amount.toFixed(2)} required).` };
      }
      newBalance = debit.balance;
      const platformFee = Number((amount * (db.commissionSettings.tipsRate || 0.20)).toFixed(2));
      const netCreator = Number((amount - platformFee).toFixed(2));
      this.creatorAppStore.adjustUserWallet(stream.creatorId, netCreator, { addCreatorEarnings: netCreator });
      stream.totalRevenue = Number((stream.totalRevenue + amount).toFixed(2));

      transaction = {
        id: `tx_live_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        userId: input.senderId,
        type: 'tip',
        amount: -amount,
        description: `Live ${msgType === 'gift' ? 'Gift' : msgType === 'priority_question' ? 'Priority Question' : 'Tip'} to ${stream.creatorName}`,
        status: 'completed',
        createdAt: nowTimestamp(),
        referenceId: stream.id,
        platformFee,
        netCreatorEarnings: netCreator
      };
      db.transactions.unshift(transaction);
    }

    let senderRole: LiveChatMessage['senderRole'] = 'viewer';
    if (input.senderId === stream.creatorId) {
      senderRole = 'creator';
    } else if (user?.role === 'admin' || user?.role === 'moderator') {
      senderRole = 'moderator';
    } else {
      const activeSub = db.subscriptions.find(
        s => s.fanId === input.senderId && s.creatorId === stream.creatorId && s.status === 'active'
      );
      if (activeSub) {
        senderRole =
          activeSub.tierName.toLowerCase().includes('vip') || activeSub.tierName.toLowerCase().includes('patron')
            ? 'vip'
            : 'subscriber';
      }
    }

    const chatMessage: LiveChatMessage = {
      id: `lchat_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      streamId: input.streamId,
      senderId: input.senderId,
      senderName: creator?.name || user?.name || 'Member',
      senderAvatar: creator?.avatar || user?.avatar || '',
      senderRole,
      message: msgText,
      type: msgType,
      amountPaid: amount > 0 ? amount : undefined,
      giftData,
      timestamp: 'Just now'
    };

    if (!db.liveChat[input.streamId]) {
      db.liveChat[input.streamId] = [];
    }
    db.liveChat[input.streamId].push(chatMessage);
    if (db.liveChat[input.streamId].length > 500) {
      db.liveChat[input.streamId] = db.liveChat[input.streamId].slice(-500);
    }
    this.writeDB(db);

    const pubStream = this.sanitizeStream(stream, undefined, false);
    this.onEvent?.({
      type: 'live:chat',
      rooms: [`live:${input.streamId}`, 'global:live'],
      payload: { streamId: input.streamId, message: chatMessage, stream: pubStream }
    });

    return { ok: true, chatMessage, stream: pubStream, newBalance, transaction };
  }

  public managePoll(
    streamId: string,
    actorId: string,
    action: 'launch' | 'vote' | 'end',
    data: { question?: string; options?: string[]; durationSeconds?: number; pollId?: string; optionId?: string }
  ): { ok: true; stream: Livestream } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const stream = db.livestreams[streamId];
    if (!stream) return { ok: false, statusCode: 404, error: 'Livestream not found.' };

    if (action === 'launch') {
      if (stream.creatorId !== actorId) return { ok: false, statusCode: 403, error: 'Only host creator can launch polls.' };
      const q = String(data.question || '').trim();
      const opts = (data.options || []).map(o => o.trim()).filter(Boolean);
      if (!q || opts.length < 2) return { ok: false, statusCode: 400, error: 'Poll requires a question and at least 2 options.' };

      const poll: LivePoll = {
        id: `poll_${Date.now()}`,
        streamId,
        creatorId: stream.creatorId,
        question: q,
        options: opts.map((text, idx) => ({ id: `opt_${idx + 1}_${Date.now()}`, text, votes: 0 })),
        totalVotes: 0,
        isActive: true,
        createdAt: 'Just now',
        durationSeconds: data.durationSeconds || 180,
        votedUserIds: {}
      };
      stream.activePoll = poll;
      this.writeDB(db);
    } else if (action === 'vote') {
      const poll = stream.activePoll;
      if (!poll || !poll.isActive || (data.pollId && poll.id !== data.pollId)) {
        return { ok: false, statusCode: 404, error: 'Active poll not found.' };
      }
      const optionId = String(data.optionId || '');
      const prevVote = poll.votedUserIds?.[actorId];
      if (prevVote !== optionId) {
        poll.options = poll.options.map(opt => {
          if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
          if (prevVote && opt.id === prevVote) return { ...opt, votes: Math.max(0, opt.votes - 1) };
          return opt;
        });
        poll.totalVotes = prevVote ? poll.totalVotes : poll.totalVotes + 1;
        poll.votedUserIds = { ...(poll.votedUserIds || {}), [actorId]: optionId };
        this.writeDB(db);
      }
    } else if (action === 'end') {
      if (stream.creatorId !== actorId) return { ok: false, statusCode: 403, error: 'Only host creator can end polls.' };
      if (stream.activePoll) {
        stream.activePoll.isActive = false;
        this.writeDB(db);
      }
    }

    const pubStream = this.sanitizeStream(stream, undefined, false);
    this.onEvent?.({
      type: 'live:updated',
      rooms: ['global:live', `live:${streamId}`],
      payload: { stream: pubStream }
    });
    return { ok: true, stream: pubStream };
  }

  public handleCloudflareWebhook(payload: Record<string, any>): void {
    const inputUid = payload?.uid || payload?.liveInput || payload?.input?.uid;
    const statusState = payload?.status?.state || payload?.state;
    const readyToStream = payload?.readyToStream;
    const videoUid = payload?.videoUid || (payload?.status?.state === 'ready' ? payload?.uid : undefined);
    if (!inputUid) return;

    const db = this.readDB();
    const matched = Object.values(db.livestreams).find(s => s.cloudflareInputUid === inputUid);
    if (!matched) return;

    const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
    if (statusState === 'ready' && readyToStream && videoUid && accountId) {
      matched.recordingStatus = 'ready';
      matched.isReplayPublished = matched.recordingSettings?.mode !== 'disabled';
      matched.hlsPlaybackUrl = `https://customer-${accountId}.cloudflarestream.com/${videoUid}/manifest/video.m3u8`;
      matched.recordingUrl = `/api/live/sessions/${encodeURIComponent(matched.id)}/recording-media`;
      matched.videoStreamUrl = matched.recordingUrl;
      this.writeDB(db);
      this.onEvent?.({
        type: 'live:updated',
        rooms: ['global:live', `live:${matched.id}`],
        payload: { stream: this.sanitizeStream(matched, undefined, false) }
      });
    }
  }

  // ============================================================================
  // PRIVATE 1-ON-1 WEBRTC VIDEO CALLING & SERVER-AUTHORITATIVE BILLING
  // ============================================================================
  private clearCallTimer(callId: string): void {
    const timer = this.callRingTimers.get(callId);
    if (timer) {
      clearTimeout(timer);
      this.callRingTimers.delete(callId);
    }
  }

  private appendThreadMessage(db: LiveCallsDB, userA: string, userB: string, msg: ChatMessage): ChatMessage {
    const key = makeThreadKey(userA, userB);
    if (!db.chatThreads[key]) {
      db.chatThreads[key] = [];
    }
    const duplicate = db.chatThreads[key].some(
      m => m.id === msg.id || (msg.videoCallEvent && m.videoCallEvent?.callId === msg.videoCallEvent.callId && m.videoCallEvent.status === msg.videoCallEvent.status)
    );
    if (!duplicate) {
      db.chatThreads[key].push(msg);
      if (db.chatThreads[key].length > 1000) {
        db.chatThreads[key] = db.chatThreads[key].slice(-1000);
      }
    }
    return msg;
  }

  public getActiveCallForUser(userId: string): VideoCallSession | null {
    const db = this.readDB();
    const activeStatuses = new Set(['calling', 'ringing', 'accepted', 'connecting', 'connected']);
    const matches = Object.values(db.videoCalls)
      .filter(c => (c.fanId === userId || c.creatorId === userId) && activeStatuses.has(c.status))
      .sort((a, b) => String(b.requestedAt || '').localeCompare(String(a.requestedAt || '')));
    return matches[0] ? deepClone(matches[0]) : null;
  }

  public getCallById(callId: string): VideoCallSession | null {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    return call ? deepClone(call) : null;
  }

  public createCallRequest(input: {
    fanId: string;
    creatorId: string;
    spendingLimit: number;
  }): { ok: true; call: VideoCallSession } | { ok: false; statusCode: number; error: string } {
    if (input.fanId === input.creatorId) {
      return { ok: false, statusCode: 400, error: 'You cannot place a video call to yourself.' };
    }

    const fanLookup = this.creatorAppStore.getUserOrCreator(input.fanId);
    const fanUser = fanLookup.user || fanLookup.creator;
    if (!fanUser) {
      return { ok: false, statusCode: 401, error: 'Authenticated fan account not found.' };
    }

    const creatorLookup = this.creatorAppStore.getUserOrCreator(input.creatorId);
    const creator = creatorLookup.creator;
    if (!creator) {
      return { ok: false, statusCode: 404, error: 'Creator profile not found.' };
    }
    if (!creator.isLiveForCalls) {
      return { ok: false, statusCode: 409, error: `${creator.name} is currently unavailable for live video calls.` };
    }

    const fanBalance = this.creatorAppStore.getWalletBalance(input.fanId);
    const rate = Number((creator.callRatePerMinute || 3.5).toFixed(2));
    if (fanBalance < rate) {
      return {
        ok: false,
        statusCode: 402,
        error: `You need at least $${rate.toFixed(2)} (1 minute) in your wallet to start a video call.`
      };
    }

    const db = this.readDB();
    const activeStatuses = new Set(['calling', 'ringing', 'accepted', 'connecting', 'connected']);
    const existingBusy = Object.values(db.videoCalls).find(
      c =>
        activeStatuses.has(c.status) &&
        (c.creatorId === input.creatorId || c.fanId === input.fanId || c.creatorId === input.fanId || c.fanId === input.creatorId)
    );
    if (existingBusy) {
      return {
        ok: false,
        statusCode: 409,
        error:
          existingBusy.fanId === input.fanId
            ? 'You already have an active or ringing video call.'
            : `${creator.name} is currently on another live call.`
      };
    }

    const callId = `call_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const nowIso = new Date().toISOString();
    const effectiveLimit = Math.max(rate, Math.min(Number(input.spendingLimit || 50), fanBalance));

    const session: VideoCallSession = {
      id: callId,
      creatorId: input.creatorId,
      fanId: input.fanId,
      creatorName: creator.name,
      creatorUsername: creator.username,
      creatorAvatar: creator.avatar,
      fanName: fanUser.name,
      fanUsername: fanUser.username,
      fanAvatar: fanUser.avatar,
      ratePerMinute: rate,
      status: 'ringing',
      durationSeconds: 0,
      totalCost: 0,
      platformFee: 0,
      creatorEarnings: 0,
      spendingLimit: Number(effectiveLimit.toFixed(2)),
      requestedAt: nowIso,
      billingSettled: false
    };

    db.videoCalls[callId] = session;
    this.writeDB(db);

    // Notify both participants over WebSocket
    this.onEvent?.({
      type: 'call:incoming',
      userIds: [input.creatorId],
      payload: { call: deepClone(session) }
    });
    this.onEvent?.({
      type: 'call:state',
      userIds: [input.fanId, input.creatorId],
      rooms: [`call:${callId}`],
      payload: { call: deepClone(session) }
    });

    // Auto-expire ringing call after 45s -> missed ($0.00)
    const timer = setTimeout(() => {
      this.markCallMissed(callId);
    }, 45_000);
    if (typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
    this.callRingTimers.set(callId, timer);

    return { ok: true, call: deepClone(session) };
  }

  public acceptCall(callId: string, actorId: string): { ok: true; call: VideoCallSession } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Only the receiving creator can accept an incoming call.' };
    }
    if (!['calling', 'ringing', 'requesting'].includes(call.status)) {
      return { ok: false, statusCode: 409, error: `Call cannot be accepted in state "${call.status}".` };
    }

    this.clearCallTimer(callId);
    call.status = 'accepted';
    call.acceptedAt = new Date().toISOString();
    this.writeDB(db);

    const clone = deepClone(call);
    this.onEvent?.({
      type: 'call:accepted',
      userIds: [call.fanId, call.creatorId],
      rooms: [`call:${callId}`],
      payload: { call: clone }
    });
    return { ok: true, call: clone };
  }

  public markCallConnecting(callId: string, actorId: string): { ok: true; call: VideoCallSession } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.fanId !== actorId && call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Forbidden.' };
    }
    if (call.status === 'accepted') {
      call.status = 'connecting';
      this.writeDB(db);
      const clone = deepClone(call);
      this.onEvent?.({
        type: 'call:state',
        userIds: [call.fanId, call.creatorId],
        rooms: [`call:${callId}`],
        payload: { call: clone }
      });
    }
    return { ok: true, call: deepClone(call) };
  }

  public markCallConnected(callId: string, actorId: string): { ok: true; call: VideoCallSession } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.fanId !== actorId && call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Forbidden.' };
    }
    if (['ended', 'declined', 'missed', 'failed'].includes(call.status)) {
      return { ok: false, statusCode: 409, error: `Call has already terminated (${call.status}).` };
    }

    if (!call.connectedAt) {
      const nowIso = new Date().toISOString();
      call.connectedAt = nowIso;
      call.startedAt = nowIso;
    }
    call.status = 'connected';
    this.writeDB(db);

    const clone = deepClone(call);
    this.onEvent?.({
      type: 'call:state',
      userIds: [call.fanId, call.creatorId],
      rooms: [`call:${callId}`],
      payload: { call: clone }
    });
    return { ok: true, call: clone };
  }

  public heartbeatCall(callId: string, actorId: string): { ok: true; call: VideoCallSession; settledNow?: boolean } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.fanId !== actorId && call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Forbidden.' };
    }

    if (call.status !== 'connected' || !call.connectedAt) {
      return { ok: true, call: deepClone(call) };
    }

    const connectedMs = Date.parse(call.connectedAt);
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - connectedMs) / 1000));
    const fanBalance = this.creatorAppStore.getWalletBalance(call.fanId);
    const maxCap = Math.min(call.spendingLimit, fanBalance);
    const rawCost = Number(((elapsedSeconds / 60) * call.ratePerMinute).toFixed(2));
    const cappedCost = Math.min(rawCost, maxCap);
    const commissionRate = db.commissionSettings.videoCallsRate || 0.20;
    const platformFee = Number((cappedCost * commissionRate).toFixed(2));
    const creatorEarnings = Number((cappedCost - platformFee).toFixed(2));

    call.durationSeconds = elapsedSeconds;
    call.totalCost = cappedCost;
    call.platformFee = platformFee;
    call.creatorEarnings = creatorEarnings;
    this.writeDB(db);

    if (rawCost >= maxCap && maxCap > 0) {
      const ended = this.endCall(callId, actorId, 'spending_limit_or_balance_reached');
      if (ended.ok) {
        return { ok: true, call: ended.call, settledNow: true };
      }
    }

    return { ok: true, call: deepClone(call) };
  }

  public declineCall(callId: string, actorId: string): { ok: true; call: VideoCallSession; chatMessage: ChatMessage } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.fanId !== actorId && call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Forbidden.' };
    }
    this.clearCallTimer(callId);

    // If caller cancelled before answer, treat as ended($0.00); if creator declined, treat as declined($0.00)
    if (call.connectedAt) {
      const res = this.endCall(callId, actorId, 'ended_by_participant');
      if (!res.ok) return res;
      return {
        ok: true,
        call: res.call,
        chatMessage: res.chatMessage!
      };
    }

    const isCreatorAction = actorId === call.creatorId;
    call.status = isCreatorAction ? 'declined' : 'ended';
    call.endedAt = new Date().toISOString();
    call.durationSeconds = 0;
    call.totalCost = 0;
    call.platformFee = 0;
    call.creatorEarnings = 0;
    call.billingSettled = true;
    call.endReason = isCreatorAction ? 'declined_by_creator' : 'cancelled_before_answer';

    const chatMsg = this.appendThreadMessage(db, call.fanId, call.creatorId, {
      id: `msg_call_${callId}_${call.status}`,
      senderId: isCreatorAction ? call.creatorId : call.fanId,
      receiverId: isCreatorAction ? call.fanId : call.creatorId,
      content: isCreatorAction
        ? 'Video call request declined — No charge applied ($0.00)'
        : 'Video call cancelled before connection — No charge applied ($0.00)',
      videoCallEvent: {
        callId,
        status: isCreatorAction ? 'declined' : 'missed',
        ratePerMinute: call.ratePerMinute,
        durationSeconds: 0,
        totalCharged: 0,
        timestamp: nowTimestamp()
      },
      createdAt: 'Just now',
      read: false
    });

    this.writeDB(db);
    const clone = deepClone(call);
    this.onEvent?.({
      type: 'call:ended',
      userIds: [call.fanId, call.creatorId],
      rooms: [`call:${callId}`],
      payload: { call: clone, chatMessage: chatMsg }
    });

    return { ok: true, call: clone, chatMessage: chatMsg };
  }

  public markCallMissed(callId: string): void {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call || !['calling', 'ringing', 'requesting'].includes(call.status)) return;
    this.clearCallTimer(callId);

    call.status = 'missed';
    call.endedAt = new Date().toISOString();
    call.durationSeconds = 0;
    call.totalCost = 0;
    call.platformFee = 0;
    call.creatorEarnings = 0;
    call.billingSettled = true;
    call.endReason = 'ring_timeout_unanswered';

    const chatMsg = this.appendThreadMessage(db, call.fanId, call.creatorId, {
      id: `msg_call_${callId}_missed`,
      senderId: call.fanId,
      receiverId: call.creatorId,
      content: 'Missed / Unanswered Video Call Request — No charge applied ($0.00)',
      videoCallEvent: {
        callId,
        status: 'missed',
        ratePerMinute: call.ratePerMinute,
        durationSeconds: 0,
        totalCharged: 0,
        timestamp: nowTimestamp()
      },
      createdAt: 'Just now',
      read: false
    });

    this.writeDB(db);
    this.onEvent?.({
      type: 'call:ended',
      userIds: [call.fanId, call.creatorId],
      rooms: [`call:${callId}`],
      payload: { call: deepClone(call), chatMessage: chatMsg }
    });
  }

  public markCallFailed(
    callId: string,
    actorId: string,
    reason?: string
  ): { ok: true; call: VideoCallSession; chatMessage?: ChatMessage; fanBalance: number } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.fanId !== actorId && call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Forbidden.' };
    }
    this.clearCallTimer(callId);

    if (call.connectedAt) {
      // Settle only actual connected duration
      return this.endCall(callId, actorId, reason || 'webrtc_connection_lost');
    }

    call.status = 'failed';
    call.connectionError = reason || 'WebRTC connection failed before media connected.';
    call.endReason = call.connectionError;
    call.endedAt = new Date().toISOString();
    call.durationSeconds = 0;
    call.totalCost = 0;
    call.billingSettled = true;

    const chatMsg = this.appendThreadMessage(db, call.fanId, call.creatorId, {
      id: `msg_call_${callId}_failed`,
      senderId: call.fanId,
      receiverId: call.creatorId,
      content: 'Video call failed before connecting — No charge applied ($0.00)',
      videoCallEvent: {
        callId,
        status: 'failed',
        ratePerMinute: call.ratePerMinute,
        durationSeconds: 0,
        totalCharged: 0,
        timestamp: nowTimestamp()
      },
      createdAt: 'Just now',
      read: false
    });

    this.writeDB(db);
    const clone = deepClone(call);
    this.onEvent?.({
      type: 'call:ended',
      userIds: [call.fanId, call.creatorId],
      rooms: [`call:${callId}`],
      payload: { call: clone, chatMessage: chatMsg }
    });

    return {
      ok: true,
      call: clone,
      chatMessage: chatMsg,
      fanBalance: this.creatorAppStore.getWalletBalance(call.fanId)
    };
  }

  public endCall(
    callId: string,
    actorId: string,
    reason?: string
  ):
    | {
        ok: true;
        call: VideoCallSession;
        billingRecord?: VideoCallBillingRecord;
        transaction?: WalletTransaction;
        chatMessage?: ChatMessage;
        fanBalance: number;
      }
    | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const call = db.videoCalls[callId];
    if (!call) return { ok: false, statusCode: 404, error: 'Video call session not found.' };
    if (call.fanId !== actorId && call.creatorId !== actorId) {
      return { ok: false, statusCode: 403, error: 'Forbidden.' };
    }
    this.clearCallTimer(callId);

    // Idempotent guard: never settle or charge twice
    if (call.billingSettled || db.callBillingRecords[callId]) {
      return {
        ok: true,
        call: deepClone(call),
        billingRecord: db.callBillingRecords[callId] ? deepClone(db.callBillingRecords[callId]) : undefined,
        fanBalance: this.creatorAppStore.getWalletBalance(call.fanId)
      };
    }

    const endedAtIso = new Date().toISOString();
    let billedSeconds = 0;
    let totalCost = 0;
    let platformFee = 0;
    let creatorEarnings = 0;
    let transaction: WalletTransaction | undefined;
    let billingRecord: VideoCallBillingRecord | undefined;
    let chatMsg: ChatMessage;

    if (call.connectedAt) {
      const startMs = Date.parse(call.connectedAt);
      const endMs = Date.parse(endedAtIso);
      billedSeconds = Math.max(1, Math.floor((endMs - startMs) / 1000));
      const fanBal = this.creatorAppStore.getWalletBalance(call.fanId);
      const maxChargeable = Math.min(call.spendingLimit, fanBal);
      const rawCost = Number(((billedSeconds / 60) * call.ratePerMinute).toFixed(2));
      totalCost = Math.min(rawCost, maxChargeable);
      if (totalCost > 0) {
        const debit = this.creatorAppStore.adjustUserWallet(call.fanId, -totalCost);
        if (!debit.ok) {
          totalCost = Math.min(fanBal, maxChargeable);
          if (totalCost > 0) {
            this.creatorAppStore.adjustUserWallet(call.fanId, -totalCost);
          }
        }
        const commRate = db.commissionSettings.videoCallsRate || 0.20;
        platformFee = Number((totalCost * commRate).toFixed(2));
        creatorEarnings = Number((totalCost - platformFee).toFixed(2));
        this.creatorAppStore.adjustUserWallet(call.creatorId, creatorEarnings, {
          addCreatorEarnings: creatorEarnings
        });

        transaction = {
          id: `tx_call_${callId}`,
          userId: call.fanId,
          type: 'video_call',
          amount: -totalCost,
          description: `Private Video Call with ${call.creatorName} (${Math.ceil(billedSeconds / 60)} min)`,
          status: 'completed',
          createdAt: nowTimestamp(),
          referenceId: callId,
          platformFee,
          netCreatorEarnings: creatorEarnings
        };
        db.transactions.unshift(transaction);
      }

      billingRecord = {
        id: `cbill_${callId}`,
        callId,
        fanId: call.fanId,
        creatorId: call.creatorId,
        billedSeconds,
        ratePerMinute: call.ratePerMinute,
        grossAmount: totalCost,
        platformFee,
        netCreatorEarnings: creatorEarnings,
        idempotencyKey: `settle_${callId}`,
        settledAt: endedAtIso
      };
      db.callBillingRecords[callId] = billingRecord;

      chatMsg = this.appendThreadMessage(db, call.fanId, call.creatorId, {
        id: `msg_call_${callId}_completed`,
        senderId: call.fanId,
        receiverId: call.creatorId,
        content: `1-on-1 Video Call ended · Duration ${Math.floor(billedSeconds / 60)}m ${billedSeconds % 60}s`,
        videoCallEvent: {
          callId,
          status: 'completed',
          ratePerMinute: call.ratePerMinute,
          durationSeconds: billedSeconds,
          totalCharged: totalCost,
          timestamp: nowTimestamp()
        },
        createdAt: 'Just now',
        read: false
      });
    } else {
      // Unanswered / cancelled before connection -> strictly $0.00
      chatMsg = this.appendThreadMessage(db, call.fanId, call.creatorId, {
        id: `msg_call_${callId}_missed`,
        senderId: call.fanId,
        receiverId: call.creatorId,
        content: 'Missed / Cancelled Video Call Request — No charge applied ($0.00)',
        videoCallEvent: {
          callId,
          status: 'missed',
          ratePerMinute: call.ratePerMinute,
          durationSeconds: 0,
          totalCharged: 0,
          timestamp: nowTimestamp()
        },
        createdAt: 'Just now',
        read: false
      });
    }

    call.status = 'ended';
    call.endedAt = endedAtIso;
    call.durationSeconds = billedSeconds;
    call.totalCost = totalCost;
    call.platformFee = platformFee;
    call.creatorEarnings = creatorEarnings;
    call.billingSettled = true;
    call.endReason = reason || 'ended_by_participant';

    this.writeDB(db);
    const fanBalance = this.creatorAppStore.getWalletBalance(call.fanId);
    const clone = deepClone(call);

    this.onEvent?.({
      type: 'call:ended',
      userIds: [call.fanId, call.creatorId],
      rooms: [`call:${callId}`],
      payload: {
        call: clone,
        billingRecord,
        transaction,
        chatMessage: chatMsg,
        fanBalance
      }
    });

    return { ok: true, call: clone, billingRecord, transaction, chatMessage: chatMsg, fanBalance };
  }

  // ============================================================================
  // REAL CROSS-ACCOUNT DIRECT MESSAGING SYNC (So two separate users see real messages)
  // ============================================================================
  public sendDirectMessage(msg: ChatMessage): ChatMessage {
    const db = this.readDB();
    const peerId = msg.receiverId || msg.recipientId || '';
    const saved = this.appendThreadMessage(db, msg.senderId, peerId, msg);
    this.writeDB(db);

    this.onEvent?.({
      type: 'dm:message',
      userIds: [msg.senderId, peerId],
      payload: { message: saved }
    });
    return saved;
  }

  public getMessagesForUser(userId: string): Record<string, ChatMessage[]> {
    const db = this.readDB();
    const out: Record<string, ChatMessage[]> = {};
    for (const [key, list] of Object.entries(db.chatThreads)) {
      const [idA, idB] = key.split('::');
      if (idA === userId || idB === userId) {
        const peerId = idA === userId ? idB : idA;
        if (peerId) {
          out[peerId] = deepClone(list);
        }
      }
    }
    return out;
  }

  public getTransactionsForUser(userId: string): WalletTransaction[] {
    const db = this.readDB();
    return deepClone(db.transactions.filter(t => t.userId === userId));
  }

  public recordTransaction(tx: WalletTransaction): void {
    const db = this.readDB();
    if (!db.transactions.some(t => t.id === tx.id)) {
      db.transactions.unshift(tx);
      this.writeDB(db);
    }
  }
}
