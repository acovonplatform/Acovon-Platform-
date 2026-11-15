import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  CategoryRecord,
  MediaAsset,
  Post,
  PostEditAuditRecord,
  PostRevision,
  UpdatePostPayload
} from '../src/types';
import {
  resolveCategoryRecord,
  resolveCountryRecord
} from '../src/data/globalTaxonomy';


export interface StoredPostsDB {
  createdPosts: Record<string, Post>;
  updatedPosts: Record<string, Post>;
  deletedPostIds: string[];
  archivedPostsForPurchasers: Record<string, Post>;
}

export interface StoredPostRevisionsDB {
  revisionsByPostId: Record<string, PostRevision[]>;
}

export interface StoredMediaFileRecord {
  mediaId: string;
  fileName: string;
  originalFilename: string;
  ownerId: string;
  mimeType: string;
  sizeBytes: number;
  sha256: string;
  url: string;
  postId?: string;
  createdAt: string;
}

export interface PostAuditReport {
  checkedAt: string;
  totalCreatedPosts: number;
  totalBaselinePosts: number;
  totalOverrides: number;
  totalDeletedIds: number;
  totalRevisionPosts: number;
  totalRevisions: number;
  issues: Array<{
    postId: string;
    severity: 'warning' | 'critical';
    code: string;
    message: string;
  }>;
  recoveredCount: number;
  recoveredPostIds: string[];
}

export function deepClone<T>(value: T): T {
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export function writeJsonAtomic(filePath: string, data: unknown): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmpPath = `${filePath}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tmpPath, filePath);
}

export function computePostContentHash(post: Pick<Post, 'id' | 'creatorId' | 'content' | 'media' | 'visibility'>): string {
  const payload = JSON.stringify({
    id: post.id,
    creatorId: post.creatorId,
    content: (post.content || '').trim(),
    media: (post.media || []).map(m => ({
      id: m.id,
      type: m.type,
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || ''
    })),
    visibility: post.visibility
  });
  return crypto.createHash('sha256').update(payload).digest('hex').slice(0, 24);
}

export function isEphemeralBlobUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.trim().toLowerCase().startsWith('blob:');
}

export function isExpiringSignedUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const lower = url.toLowerCase();
  return lower.includes('/storage/v1/object/sign/') && lower.includes('token=');
}

export function validatePostMediaAssets(media: MediaAsset[]): { valid: boolean; error?: string } {
  for (const asset of media) {
    if (isEphemeralBlobUrl(asset.url) || isEphemeralBlobUrl(asset.previewUrl) || isEphemeralBlobUrl(asset.thumbnailUrl)) {
      return {
        valid: false,
        error: 'Temporary browser blob URLs cannot be stored in published posts. Media must be saved to permanent storage first.'
      };
    }
    if (isExpiringSignedUrl(asset.url) || isExpiringSignedUrl(asset.thumbnailUrl)) {
      return {
        valid: false,
        error: 'Expiring signed URLs cannot be stored in published posts. Use permanent media storage URLs.'
      };
    }
  }
  return { valid: true };
}

export class AuthoritativePostStore {
  public readonly dataDir: string;
  public readonly postsDbFile: string;
  public readonly legacyOverridesFile: string;
  public readonly revisionsDbFile: string;
  public readonly postAuditFile: string;
  public readonly mediaRegistryFile: string;
  public readonly mediaUploadsDir: string;

  constructor(dataDir: string) {
    this.dataDir = path.resolve(dataDir);
    this.postsDbFile = path.join(this.dataDir, 'posts_db.json');
    this.legacyOverridesFile = path.join(this.dataDir, 'creator_posts_overrides.json');
    this.revisionsDbFile = path.join(this.dataDir, 'post_revisions_db.json');
    this.postAuditFile = path.join(this.dataDir, 'post_audit_logs.json');
    this.mediaRegistryFile = path.join(this.dataDir, 'media_registry.json');
    this.mediaUploadsDir = path.join(this.dataDir, 'media_uploads');

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.mediaUploadsDir)) {
      fs.mkdirSync(this.mediaUploadsDir, { recursive: true });
    }
  }

  readPostsDB(): StoredPostsDB {
    let db: StoredPostsDB = {
      createdPosts: {},
      updatedPosts: {},
      deletedPostIds: [],
      archivedPostsForPurchasers: {}
    };

    try {
      if (fs.existsSync(this.postsDbFile)) {
        const raw = fs.readFileSync(this.postsDbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          db = {
            createdPosts: parsed.createdPosts && typeof parsed.createdPosts === 'object' ? parsed.createdPosts : {},
            updatedPosts: parsed.updatedPosts && typeof parsed.updatedPosts === 'object' ? parsed.updatedPosts : {},
            deletedPostIds: Array.isArray(parsed.deletedPostIds) ? parsed.deletedPostIds : [],
            archivedPostsForPurchasers:
              parsed.archivedPostsForPurchasers && typeof parsed.archivedPostsForPurchasers === 'object'
                ? parsed.archivedPostsForPurchasers
                : {}
          };
          return deepClone(db);
        }
      }
    } catch (err) {
      console.error('Error reading posts_db.json:', err);
    }

    // Migrate seamlessly from legacy creator_posts_overrides.json if present
    try {
      if (fs.existsSync(this.legacyOverridesFile)) {
        const raw = fs.readFileSync(this.legacyOverridesFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const legacyUpdated = parsed.updatedPosts && typeof parsed.updatedPosts === 'object' ? parsed.updatedPosts : {};
          for (const [pid, postObj] of Object.entries(legacyUpdated)) {
            if (postObj && typeof postObj === 'object') {
              db.createdPosts[pid] = postObj as Post;
            }
          }
          db.deletedPostIds = Array.isArray(parsed.deletedPostIds) ? parsed.deletedPostIds : [];
          db.archivedPostsForPurchasers =
            parsed.archivedPostsForPurchasers && typeof parsed.archivedPostsForPurchasers === 'object'
              ? parsed.archivedPostsForPurchasers
              : {};
        }
      }
    } catch (err) {
      console.error('Error migrating creator_posts_overrides.json:', err);
    }

    return deepClone(db);
  }

  writePostsDB(db: StoredPostsDB): void {
    const clean = deepClone(db);
    writeJsonAtomic(this.postsDbFile, clean);
    // Keep legacy overrides file synchronized for backwards compatibility
    writeJsonAtomic(this.legacyOverridesFile, {
      updatedPosts: { ...clean.createdPosts, ...clean.updatedPosts },
      deletedPostIds: clean.deletedPostIds,
      archivedPostsForPurchasers: clean.archivedPostsForPurchasers
    });
  }

  readRevisionsDB(): StoredPostRevisionsDB {
    try {
      if (fs.existsSync(this.revisionsDbFile)) {
        const raw = fs.readFileSync(this.revisionsDbFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && parsed.revisionsByPostId) {
          return deepClone({ revisionsByPostId: parsed.revisionsByPostId });
        }
      }
    } catch (err) {
      console.error('Error reading post_revisions_db.json:', err);
    }
    return { revisionsByPostId: {} };
  }

  writeRevisionsDB(db: StoredPostRevisionsDB): void {
    writeJsonAtomic(this.revisionsDbFile, deepClone(db));
  }

  readMediaRegistry(): Record<string, StoredMediaFileRecord> {
    try {
      if (fs.existsSync(this.mediaRegistryFile)) {
        const raw = fs.readFileSync(this.mediaRegistryFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading media_registry.json:', err);
    }
    return {};
  }

  registerUploadedMedia(record: StoredMediaFileRecord): void {
    const reg = this.readMediaRegistry();
    reg[record.fileName] = deepClone(record);
    writeJsonAtomic(this.mediaRegistryFile, reg);
  }

  getUploadedMediaRecord(fileName: string): StoredMediaFileRecord | undefined {
    const safeName = path.basename(fileName || '');
    const reg = this.readMediaRegistry();
    return reg[safeName];
  }

  readPostAuditLogs(): PostEditAuditRecord[] {
    try {
      if (fs.existsSync(this.postAuditFile)) {
        const raw = fs.readFileSync(this.postAuditFile, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (err) {
      console.error('Error reading post_audit_logs.json:', err);
    }
    return [];
  }

  appendPostAuditLog(entry: PostEditAuditRecord): void {
    try {
      let logs = this.readPostAuditLogs();
      logs.unshift(entry);
      if (logs.length > 2000) logs = logs.slice(0, 2000);
      writeJsonAtomic(this.postAuditFile, logs);
    } catch (err) {
      console.error('Error appending post_audit_logs.json:', err);
    }
  }

  getRevisionsForPost(postId: string): PostRevision[] {
    const revDb = this.readRevisionsDB();
    const list = revDb.revisionsByPostId[postId];
    return Array.isArray(list) ? deepClone(list) : [];
  }

  getRevisionCountsByPostId(): Record<string, number> {
    const revDb = this.readRevisionsDB();
    const counts: Record<string, number> = {};
    for (const [postId, list] of Object.entries(revDb.revisionsByPostId)) {
      if (Array.isArray(list)) {
        counts[postId] = list.length;
      }
    }
    return counts;
  }

  appendRevision(revision: PostRevision): void {
    const revDb = this.readRevisionsDB();
    const existing = Array.isArray(revDb.revisionsByPostId[revision.postId])
      ? revDb.revisionsByPostId[revision.postId]
      : [];
    existing.unshift(deepClone(revision));
    // Keep up to 100 immutable revisions per post
    revDb.revisionsByPostId[revision.postId] = existing.slice(0, 100);
    this.writeRevisionsDB(revDb);
  }

  getAuthoritativePostById(postId: string): Post | undefined {
    const db = this.readPostsDB();
    if (db.createdPosts[postId]) {
      return deepClone(db.createdPosts[postId]);
    }
    const override = db.updatedPosts[postId];
    if (override) {
      return deepClone(override);
    }
    return undefined;
  }

  getUnifiedPosts(options?: { includeDeleted?: boolean; includeBaseline?: boolean }): Post[] {
    const includeDeleted = options?.includeDeleted === true;
    const db = this.readPostsDB();
    const deletedSet = new Set(db.deletedPostIds || []);
    const result: Post[] = [];

    // User-created persisted posts (newest first by createdAtIso)
    const createdList = Object.values(db.createdPosts || {}).sort((a, b) => {
      const tA = a.createdAtIso ? Date.parse(a.createdAtIso) : 0;
      const tB = b.createdAtIso ? Date.parse(b.createdAtIso) : 0;
      return tB - tA;
    });

    for (const created of createdList) {
      const override = db.updatedPosts[created.id];
      const merged: Post = deepClone(override ? { ...created, ...override } : created);
      const isDel = deletedSet.has(merged.id) || Boolean(merged.isDeletedByCreator);
      if (isDel && !includeDeleted) continue;
      if (isDel) {
        merged.isDeletedByCreator = true;
        merged.moderationStatus = 'removed';
      }
      result.push(merged);
    }

    return result;
  }

  createPost(params: {
    actorId: string;
    actorName?: string;
    actorRole?: string;
    isApprovedCreator?: boolean;
    postData: Partial<Post>;
    categoriesList: CategoryRecord[];
    countriesList: any[];
  }): { success: boolean; statusCode: number; error?: string; post?: Post; revision?: PostRevision; auditEntry?: PostEditAuditRecord } {
    const { actorId, actorName, actorRole, isApprovedCreator, postData, categoriesList, countriesList } = params;

    if (!actorId || typeof actorId !== 'string') {
      return { success: false, statusCode: 401, error: 'Unauthorized: Authentication required to publish posts.' };
    }

    const isCreatorAuthorized = actorRole === 'creator' || Boolean(isApprovedCreator);
    const isAdminAuthorized = actorRole === 'admin' || actorRole === 'moderator';
    if (!isCreatorAuthorized && !isAdminAuthorized) {
      return { success: false, statusCode: 403, error: 'Forbidden: Only approved creators can create posts.' };
    }

    if (postData.creatorId && postData.creatorId !== actorId && !isAdminAuthorized) {
      return { success: false, statusCode: 403, error: 'Forbidden: Cannot create a post owned by another creator.' };
    }

    const mediaInput: MediaAsset[] = Array.isArray(postData.media) ? deepClone(postData.media) : [];
    const mediaCheck = validatePostMediaAssets(mediaInput);
    if (!mediaCheck.valid) {
      return { success: false, statusCode: 400, error: mediaCheck.error };
    }

    const contentText = typeof postData.content === 'string' ? postData.content.trim() : '';
    if (!contentText && mediaInput.length === 0) {
      return { success: false, statusCode: 400, error: 'Post description or media is required.' };
    }

    const db = this.readPostsDB();

    // Strict Permanent Unique UUID enforcement (never reuse or overwrite another post ID)
    let postId = typeof postData.id === 'string' ? postData.id.trim() : '';
    if (!postId) {
      postId = crypto.randomUUID();
    }
    if (db.createdPosts[postId] || db.updatedPosts[postId] || db.deletedPostIds.includes(postId)) {
      return {
        success: false,
        statusCode: 409,
        error: `Conflict: Post ID "${postId}" already exists. A unique permanent ID is required.`
      };
    }

    const nowIso = new Date().toISOString();
    const resolvedVideoCountry =
      resolveCountryRecord(postData.video_country_id, countriesList) ||
      resolveCountryRecord(postData.country, countriesList);

    const matchedCategoryRecords = (postData.categories || [])
      .map(cat => resolveCategoryRecord(cat, categoriesList))
      .filter((r): r is CategoryRecord => Boolean(r));

    const normalizedMedia: MediaAsset[] = mediaInput.map(m => ({
      ...m,
      id: m.id && !m.id.startsWith('media_temp_') ? m.id : `media_${crypto.randomUUID()}`
    }));

    const creatorId = postData.creatorId || actorId;
    const visibility = postData.visibility || 'public';

    const newPost: Post = {
      id: postId,
      creatorId,
      creatorName: postData.creatorName || actorName || 'Creator',
      creatorUsername: postData.creatorUsername || creatorId,
      creatorAvatar: postData.creatorAvatar || '',
      content: contentText || 'Exclusive creator drop on Acovon.',
      media: normalizedMedia,
      visibility,
      ppvPrice: visibility === 'pay_per_view' ? Number(postData.ppvPrice ?? 9.99) : undefined,
      ppvPreviewDuration: visibility === 'pay_per_view' ? postData.ppvPreviewDuration || 15 : undefined,
      previewDurationSeconds: postData.previewDurationSeconds,
      likesCount: typeof postData.likesCount === 'number' ? postData.likesCount : 0,
      commentsCount: typeof postData.commentsCount === 'number' ? postData.commentsCount : 0,
      viewsCount: postData.viewsCount,
      sharesCount: postData.sharesCount,
      isLiked: false,
      isPinned: Boolean(postData.isPinned),
      createdAt: postData.createdAt || 'Just now',
      createdAtIso: nowIso,
      updatedAt: nowIso.replace('T', ' ').slice(0, 16),
      version: 1,
      revisionCount: 1,
      lastEditedBy: actorId,
      tags: Array.isArray(postData.tags)
        ? postData.tags.map(t => String(t).replace(/^#/, '').trim()).filter(Boolean)
        : [],
      categories:
        matchedCategoryRecords.length > 0
          ? matchedCategoryRecords.map(r => r.name)
          : Array.isArray(postData.categories)
          ? [...postData.categories]
          : [],
      category_ids:
        matchedCategoryRecords.length > 0
          ? matchedCategoryRecords.map(r => r.id)
          : Array.isArray(postData.category_ids)
          ? [...postData.category_ids]
          : [],
      country: resolvedVideoCountry?.name || postData.country || 'United States',
      video_country_id: resolvedVideoCountry?.id || postData.video_country_id || 'country_us',
      fileName: postData.fileName,
      fileSize: postData.fileSize,
      scheduledFor: postData.scheduledFor,
      isDraft: Boolean(postData.isDraft),
      publicationStatus: postData.isDraft ? 'draft' : postData.scheduledFor ? 'scheduled' : 'published',
      commentsDisabled: Boolean(postData.commentsDisabled),
      downloadsDisabled: postData.downloadsDisabled !== undefined ? Boolean(postData.downloadsDisabled) : true,
      isHighlight: Boolean(postData.isHighlight),
      highlightLabel: postData.highlightLabel,
      clippedByUsername: postData.clippedByUsername,
      isDemo: false,
      moderationStatus: 'approved',
      editHistory: []
    };

    newPost.originalContentHash = computePostContentHash(newPost);

    const initialRevision: PostRevision = {
      revisionId: `rev_${crypto.randomUUID()}`,
      postId: newPost.id,
      version: 1,
      changeType: 'created',
      changedFields: ['initial_publication'],
      editorId: actorId,
      editorName: actorName || newPost.creatorName,
      editorRole: actorRole || 'creator',
      reason: 'Original published version',
      createdAt: nowIso,
      snapshot: deepClone(newPost)
    };

    const auditEntry: PostEditAuditRecord = {
      id: `post_audit_create_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      postId: newPost.id,
      creatorId: newPost.creatorId,
      creatorName: newPost.creatorName,
      action: 'created',
      changedFields: ['initial_publication'],
      hadExistingPurchases: false,
      purchaseCount: 0,
      summary: `Original post published cleanly with permanent ID ${newPost.id} (v1).`,
      timestamp: nowIso.replace('T', ' ').slice(0, 16)
    };

    newPost.editHistory = [auditEntry];

    db.createdPosts[newPost.id] = deepClone(newPost);
    this.writePostsDB(db);
    this.appendRevision(initialRevision);
    this.appendPostAuditLog(auditEntry);

    return {
      success: true,
      statusCode: 201,
      post: deepClone(newPost),
      revision: initialRevision,
      auditEntry
    };
  }

  updatePost(params: {
    postId: string;
    actorId: string;
    actorName?: string;
    actorRole?: string;
    isApprovedCreator?: boolean;
    postOwnerId?: string;
    existingPostFallback?: Post;
    updates: UpdatePostPayload;
    purchaseCount?: number;
    categoriesList: CategoryRecord[];
    countriesList: any[];
  }): {
    success: boolean;
    statusCode: number;
    error?: string;
    requiresPurchaseWarning?: boolean;
    updatedPost?: Post;
    auditEntry?: PostEditAuditRecord;
    revision?: PostRevision;
  } {
    const {
      postId,
      actorId,
      actorName,
      actorRole,
      isApprovedCreator,
      postOwnerId,
      existingPostFallback,
      updates,
      purchaseCount = 0,
      categoriesList,
      countriesList
    } = params;

    if (!postId) {
      return { success: false, statusCode: 400, error: 'Bad Request: Missing postId.' };
    }
    if (!actorId || typeof actorId !== 'string') {
      return {
        success: false,
        statusCode: 401,
        error: 'Unauthorized: You must be signed in as an approved creator to edit posts.'
      };
    }

    const isCreatorAuthorized = actorRole === 'creator' || Boolean(isApprovedCreator);
    const isAdminAuthorized = actorRole === 'admin' || actorRole === 'moderator';
    if (!isCreatorAuthorized && !isAdminAuthorized) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: Fans and guests are not permitted to edit creator posts.'
      };
    }

    const db = this.readPostsDB();
    const storedCreated = db.createdPosts[postId];
    const storedOverride = db.updatedPosts[postId];

    const storedPost: Post | undefined = storedCreated
      ? deepClone(storedOverride ? { ...storedCreated, ...storedOverride } : storedCreated)
      : storedOverride
      ? deepClone(storedOverride)
      : existingPostFallback
      ? deepClone(existingPostFallback)
      : undefined;

    if (!storedPost) {
      return { success: false, statusCode: 404, error: 'Post not found.' };
    }

    const authoritativeOwnerId = storedPost.creatorId || postOwnerId;
    if (!authoritativeOwnerId || (actorId !== authoritativeOwnerId && !isAdminAuthorized)) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: You can only edit posts that belong to your own creator account.'
      };
    }

    if (db.deletedPostIds.includes(postId) || storedPost.isDeletedByCreator) {
      return {
        success: false,
        statusCode: 409,
        error: 'Conflict: This post has already been deleted and cannot be edited.'
      };
    }

    if (!updates || typeof updates !== 'object') {
      return { success: false, statusCode: 400, error: 'Invalid update payload.' };
    }

    if (updates.content !== undefined && (typeof updates.content !== 'string' || updates.content.trim().length === 0)) {
      return { success: false, statusCode: 400, error: 'Post description/caption cannot be empty.' };
    }

    const allowedVisibilities = ['public', 'followers', 'subscribers', 'pay_per_view', 'private'];
    if (updates.visibility !== undefined && !allowedVisibilities.includes(updates.visibility)) {
      return { success: false, statusCode: 400, error: 'Invalid post visibility option.' };
    }

    if (updates.visibility === 'pay_per_view' || (updates.visibility === undefined && storedPost.visibility === 'pay_per_view')) {
      const nextPrice = updates.ppvPrice !== undefined ? Number(updates.ppvPrice) : Number(storedPost.ppvPrice || 9.99);
      if (!Number.isFinite(nextPrice) || nextPrice < 0.99 || nextPrice > 1000) {
        return {
          success: false,
          statusCode: 400,
          error: 'Pay-To-View price must be between $0.99 and $1,000.00.'
        };
      }
    }

    if (Array.isArray(updates.media)) {
      const mediaCheck = validatePostMediaAssets(updates.media);
      if (!mediaCheck.valid) {
        return { success: false, statusCode: 400, error: mediaCheck.error };
      }
    }

    const isMediaReplaced =
      Array.isArray(updates.media) &&
      updates.media.length > 0 &&
      JSON.stringify(updates.media.map(m => m.url)) !== JSON.stringify((storedPost.media || []).map(m => m.url));

    if (isMediaReplaced && Number(purchaseCount) > 0 && !updates.confirmMediaReplacementForPurchasers) {
      return {
        success: false,
        statusCode: 409,
        requiresPurchaseWarning: true,
        error: `This post has already been unlocked by ${purchaseCount} fan(s). Replacing attached media requires confirming that original purchased media will be preserved for existing buyers.`
      };
    }

    const nowIso = new Date().toISOString();
    const changedFields: string[] = [];

    if (updates.content !== undefined && updates.content.trim() !== storedPost.content) changedFields.push('content');
    if (updates.tags !== undefined) changedFields.push('tags');
    if (updates.categories !== undefined) changedFields.push('categories');
    if (updates.country !== undefined && updates.country !== storedPost.country) changedFields.push('country');
    if (updates.visibility !== undefined && updates.visibility !== storedPost.visibility) changedFields.push('visibility');
    if (updates.ppvPrice !== undefined && Number(updates.ppvPrice) !== Number(storedPost.ppvPrice)) changedFields.push('ppvPrice');
    if (updates.thumbnailUrl !== undefined) changedFields.push('thumbnailUrl');
    if (isMediaReplaced) changedFields.push('media');
    if (updates.commentsDisabled !== undefined) changedFields.push('commentsDisabled');
    if (updates.downloadsDisabled !== undefined) changedFields.push('downloadsDisabled');

    // Ensure the pre-edit snapshot is permanently recorded in post_revisions_db BEFORE updating!
    const existingRevisions = this.getRevisionsForPost(postId);
    const currentVersion = storedPost.version || Math.max(1, existingRevisions.length || 1);
    if (existingRevisions.length === 0) {
      this.appendRevision({
        revisionId: `rev_${crypto.randomUUID()}`,
        postId,
        version: currentVersion,
        changeType: 'created',
        changedFields: ['baseline_snapshot'],
        editorId: storedPost.creatorId,
        editorName: storedPost.creatorName,
        editorRole: 'creator',
        reason: 'Preserved original snapshot before first edit',
        createdAt: storedPost.createdAtIso || nowIso,
        snapshot: deepClone({ ...storedPost, version: currentVersion })
      });
    }

    let nextMedia =
      Array.isArray(updates.media) && updates.media.length > 0
        ? deepClone(updates.media)
        : Array.isArray(storedPost.media)
        ? deepClone(storedPost.media)
        : [];

    if (updates.thumbnailUrl && nextMedia.length > 0 && !isEphemeralBlobUrl(updates.thumbnailUrl)) {
      nextMedia = nextMedia.map((m, idx) => (idx === 0 ? { ...m, thumbnailUrl: updates.thumbnailUrl } : m));
    }

    const preservedMediaForPurchasers =
      isMediaReplaced && Number(purchaseCount) > 0
        ? storedPost.preservedMediaForPurchasers || deepClone(storedPost.media)
        : storedPost.preservedMediaForPurchasers;

    const resolvedCategoriesInput =
      Array.isArray(updates.categories) && updates.categories.length > 0
        ? updates.categories
        : storedPost.categories || [];
    const matchedCatRecords = resolvedCategoriesInput
      .map(c => resolveCategoryRecord(c, categoriesList))
      .filter((r): r is CategoryRecord => Boolean(r));

    const nextCountryInput = updates.country !== undefined ? String(updates.country).trim() : storedPost.country;
    const resolvedVideoCountry =
      resolveCountryRecord(updates.video_country_id, countriesList) ||
      resolveCountryRecord(nextCountryInput, countriesList);

    const nextVersion = currentVersion + 1;
    const revisionCount = Math.max(existingRevisions.length, 1) + 1;

    const auditEntry: PostEditAuditRecord = {
      id: `post_audit_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      postId,
      creatorId: authoritativeOwnerId,
      creatorName: actorName || storedPost.creatorName || 'Creator',
      action: isMediaReplaced ? 'media_replaced' : 'edited',
      changedFields: changedFields.length > 0 ? changedFields : ['metadata'],
      hadExistingPurchases: Number(purchaseCount) > 0,
      purchaseCount: Number(purchaseCount) || 0,
      summary: `Creator updated post to v${nextVersion} (${(changedFields.length > 0 ? changedFields : ['metadata']).join(', ')}).${
        Number(purchaseCount) > 0 ? ` Existing ${purchaseCount} purchaser entitlement(s) preserved.` : ''
      }`,
      timestamp: nowIso.replace('T', ' ').slice(0, 16)
    };

    const updatedPost: Post = {
      ...storedPost,
      // Strictly immutable identity & provenance fields
      id: postId,
      creatorId: authoritativeOwnerId,
      createdAt: storedPost.createdAt || 'Just now',
      createdAtIso: storedPost.createdAtIso || nowIso,
      originalContentHash: storedPost.originalContentHash || computePostContentHash(storedPost),
      // Mutable fields updated explicitly by owner/admin
      content: updates.content !== undefined ? updates.content.trim() : storedPost.content,
      tags: Array.isArray(updates.tags)
        ? updates.tags.map(t => String(t).replace(/^#/, '').trim()).filter(Boolean)
        : storedPost.tags,
      categories:
        matchedCatRecords.length > 0 ? matchedCatRecords.map(r => r.name) : resolvedCategoriesInput,
      category_ids:
        matchedCatRecords.length > 0 ? matchedCatRecords.map(r => r.id) : storedPost.category_ids,
      country: resolvedVideoCountry?.name || nextCountryInput || storedPost.country,
      video_country_id: resolvedVideoCountry?.id || updates.video_country_id || storedPost.video_country_id,
      visibility: updates.visibility !== undefined ? updates.visibility : storedPost.visibility,
      ppvPrice:
        (updates.visibility || storedPost.visibility) === 'pay_per_view'
          ? Number(updates.ppvPrice ?? storedPost.ppvPrice ?? 9.99)
          : storedPost.ppvPrice,
      ppvPreviewDuration: updates.ppvPreviewDuration ?? storedPost.ppvPreviewDuration,
      media: nextMedia,
      preservedMediaForPurchasers,
      commentsDisabled:
        updates.commentsDisabled !== undefined ? Boolean(updates.commentsDisabled) : storedPost.commentsDisabled,
      downloadsDisabled:
        updates.downloadsDisabled !== undefined ? Boolean(updates.downloadsDisabled) : storedPost.downloadsDisabled,
      isPinned: updates.isPinned !== undefined ? Boolean(updates.isPinned) : storedPost.isPinned,
      isDraft: updates.isDraft !== undefined ? Boolean(updates.isDraft) : storedPost.isDraft,
      scheduledFor: updates.scheduledFor !== undefined ? updates.scheduledFor : storedPost.scheduledFor,
      likesCount: storedPost.likesCount ?? 0,
      commentsCount: storedPost.commentsCount ?? 0,
      viewsCount: storedPost.viewsCount,
      sharesCount: storedPost.sharesCount,
      updatedAt: nowIso.replace('T', ' ').slice(0, 16),
      version: nextVersion,
      revisionCount,
      lastEditedBy: actorId,
      editHistory: [auditEntry, ...(Array.isArray(storedPost.editHistory) ? storedPost.editHistory : [])]
    };

    const newRevision: PostRevision = {
      revisionId: `rev_${crypto.randomUUID()}`,
      postId,
      version: nextVersion,
      changeType: isMediaReplaced ? 'media_replaced' : 'edited',
      changedFields: changedFields.length > 0 ? changedFields : ['metadata'],
      editorId: actorId,
      editorName: actorName || storedPost.creatorName,
      editorRole: actorRole || 'creator',
      reason: auditEntry.summary,
      createdAt: nowIso,
      snapshot: deepClone(updatedPost)
    };

    if (db.createdPosts[postId]) {
      db.createdPosts[postId] = deepClone(updatedPost);
    } else {
      db.updatedPosts[postId] = deepClone(updatedPost);
    }
    this.writePostsDB(db);
    this.appendRevision(newRevision);
    this.appendPostAuditLog(auditEntry);

    return {
      success: true,
      statusCode: 200,
      updatedPost: deepClone(updatedPost),
      auditEntry,
      revision: newRevision
    };
  }

  restoreRevision(params: {
    postId: string;
    revisionId: string;
    actorId: string;
    actorName?: string;
    actorRole?: string;
    isApprovedCreator?: boolean;
  }): {
    success: boolean;
    statusCode: number;
    error?: string;
    restoredPost?: Post;
    revision?: PostRevision;
    auditEntry?: PostEditAuditRecord;
  } {
    const { postId, revisionId, actorId, actorName, actorRole, isApprovedCreator } = params;
    if (!actorId) {
      return { success: false, statusCode: 401, error: 'Unauthorized: Authentication required to restore post versions.' };
    }
    const isCreatorAuthorized = actorRole === 'creator' || Boolean(isApprovedCreator);
    const isAdminAuthorized = actorRole === 'admin' || actorRole === 'moderator';
    if (!isCreatorAuthorized && !isAdminAuthorized) {
      return { success: false, statusCode: 403, error: 'Forbidden: Only post owners or administrators can restore post versions.' };
    }

    const currentPost = this.getAuthoritativePostById(postId);
    if (!currentPost) {
      return { success: false, statusCode: 404, error: 'Post not found.' };
    }
    if (currentPost.creatorId !== actorId && !isAdminAuthorized) {
      return { success: false, statusCode: 403, error: 'Forbidden: You can only restore versions of your own posts.' };
    }

    const revisions = this.getRevisionsForPost(postId);
    const targetRevision = revisions.find(r => r.revisionId === revisionId);
    if (!targetRevision || !targetRevision.snapshot) {
      return { success: false, statusCode: 404, error: 'Requested revision snapshot not found.' };
    }

    const nowIso = new Date().toISOString();
    const currentVersion = currentPost.version || Math.max(1, revisions.length);
    const nextVersion = currentVersion + 1;
    const snap = deepClone(targetRevision.snapshot);

    const auditEntry: PostEditAuditRecord = {
      id: `post_audit_restore_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      postId,
      creatorId: currentPost.creatorId,
      creatorName: actorName || currentPost.creatorName,
      action: 'restored',
      changedFields: ['content', 'media', 'tags', 'categories', 'country', 'visibility'],
      hadExistingPurchases: false,
      purchaseCount: 0,
      summary: `Restored post to saved v${targetRevision.version} snapshot (${targetRevision.createdAt.slice(0, 16)}) as v${nextVersion}.`,
      timestamp: nowIso.replace('T', ' ').slice(0, 16)
    };

    const restoredPost: Post = {
      ...currentPost,
      content: snap.content,
      media: deepClone(snap.media || []),
      tags: deepClone(snap.tags || []),
      categories: deepClone(snap.categories || []),
      category_ids: deepClone(snap.category_ids || []),
      country: snap.country,
      video_country_id: snap.video_country_id,
      visibility: snap.visibility,
      ppvPrice: snap.ppvPrice,
      ppvPreviewDuration: snap.ppvPreviewDuration,
      commentsDisabled: snap.commentsDisabled,
      downloadsDisabled: snap.downloadsDisabled,
      isPinned: snap.isPinned,
      isDraft: snap.isDraft,
      scheduledFor: snap.scheduledFor,
      // Strictly preserve immutable origin & engagement counters
      id: postId,
      creatorId: currentPost.creatorId,
      createdAt: currentPost.createdAt,
      createdAtIso: currentPost.createdAtIso,
      originalContentHash: currentPost.originalContentHash,
      likesCount: currentPost.likesCount ?? 0,
      commentsCount: currentPost.commentsCount ?? 0,
      viewsCount: currentPost.viewsCount,
      sharesCount: currentPost.sharesCount,
      updatedAt: nowIso.replace('T', ' ').slice(0, 16),
      version: nextVersion,
      revisionCount: revisions.length + 1,
      lastEditedBy: actorId,
      editHistory: [auditEntry, ...(Array.isArray(currentPost.editHistory) ? currentPost.editHistory : [])]
    };

    const newRevision: PostRevision = {
      revisionId: `rev_${crypto.randomUUID()}`,
      postId,
      version: nextVersion,
      changeType: 'restored',
      changedFields: ['restored_from_revision'],
      editorId: actorId,
      editorName: actorName || currentPost.creatorName,
      editorRole: actorRole || 'creator',
      reason: auditEntry.summary,
      restoredFromRevisionId: targetRevision.revisionId,
      createdAt: nowIso,
      snapshot: deepClone(restoredPost)
    };

    const db = this.readPostsDB();
    if (db.createdPosts[postId]) {
      db.createdPosts[postId] = deepClone(restoredPost);
    } else {
      db.updatedPosts[postId] = deepClone(restoredPost);
    }
    this.writePostsDB(db);
    this.appendRevision(newRevision);
    this.appendPostAuditLog(auditEntry);

    return {
      success: true,
      statusCode: 200,
      restoredPost: deepClone(restoredPost),
      revision: newRevision,
      auditEntry
    };
  }

  deletePost(params: {
    postId: string;
    actorId: string;
    actorName?: string;
    actorRole?: string;
    isApprovedCreator?: boolean;
    postOwnerId?: string;
    existingPostFallback?: Post;
    purchaseCount?: number;
    reason?: string;
  }): {
    success: boolean;
    statusCode: number;
    error?: string;
    hadPurchases?: boolean;
    deletedPost?: Post;
    auditEntry?: PostEditAuditRecord;
  } {
    const {
      postId,
      actorId,
      actorName,
      actorRole,
      isApprovedCreator,
      postOwnerId,
      existingPostFallback,
      purchaseCount = 0,
      reason = 'Creator deleted post'
    } = params;

    if (!postId) {
      return { success: false, statusCode: 400, error: 'Bad Request: Missing postId.' };
    }
    if (!actorId || typeof actorId !== 'string') {
      return {
        success: false,
        statusCode: 401,
        error: 'Unauthorized: You must be signed in as an approved creator to delete posts.'
      };
    }

    const isCreatorAuthorized = actorRole === 'creator' || Boolean(isApprovedCreator);
    const isAdminAuthorized = actorRole === 'admin' || actorRole === 'moderator';
    if (!isCreatorAuthorized && !isAdminAuthorized) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: Fans and guests are not permitted to delete creator posts.'
      };
    }

    const db = this.readPostsDB();
    const storedPost =
      db.createdPosts[postId] ||
      db.updatedPosts[postId] ||
      existingPostFallback;

    const authoritativeOwnerId = storedPost?.creatorId || postOwnerId;
    if (!authoritativeOwnerId || (actorId !== authoritativeOwnerId && !isAdminAuthorized)) {
      return {
        success: false,
        statusCode: 403,
        error: 'Forbidden: You can only delete posts that belong to your own creator account.'
      };
    }

    if (db.deletedPostIds.includes(postId) || storedPost?.isDeletedByCreator) {
      return {
        success: false,
        statusCode: 409,
        error: 'Conflict: This post has already been deleted.'
      };
    }

    const nowIso = new Date().toISOString();
    const hadPurchases = Number(purchaseCount) > 0;

    // Record pre-deletion snapshot so authorized admin/recovery can inspect if needed
    if (storedPost) {
      const existingRevs = this.getRevisionsForPost(postId);
      if (existingRevs.length === 0) {
        this.appendRevision({
          revisionId: `rev_${crypto.randomUUID()}`,
          postId,
          version: storedPost.version || 1,
          changeType: 'created',
          changedFields: ['pre_delete_snapshot'],
          editorId: storedPost.creatorId,
          editorName: storedPost.creatorName,
          editorRole: 'creator',
          reason: 'Original snapshot preserved prior to deletion',
          createdAt: storedPost.createdAtIso || nowIso,
          snapshot: deepClone(storedPost)
        });
      }
    }

    const auditEntry: PostEditAuditRecord = {
      id: `post_audit_del_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      postId,
      creatorId: authoritativeOwnerId,
      creatorName: actorName || storedPost?.creatorName || 'Creator',
      action: hadPurchases ? 'archived_with_purchases' : 'deleted',
      changedFields: ['isDeletedByCreator', 'publicationStatus', 'moderationStatus'],
      hadExistingPurchases: hadPurchases,
      purchaseCount: Number(purchaseCount) || 0,
      summary: hadPurchases
        ? `Creator deleted post from public profile, feed, and discovery. Archived safely for ${purchaseCount} existing purchaser(s); financial & transaction records preserved.`
        : `Creator permanently deleted post from profile, feed, and discovery.`,
      timestamp: nowIso.replace('T', ' ').slice(0, 16)
    };

    const deletedPostRecord: Post = {
      ...(storedPost ? deepClone(storedPost) : ({} as Post)),
      id: postId,
      creatorId: authoritativeOwnerId,
      isDeletedByCreator: true,
      deletedAt: nowIso.replace('T', ' ').slice(0, 16),
      deletedByCreatorId: actorId,
      deletionReason: reason,
      publicationStatus: hadPurchases ? 'archived_for_purchasers' : 'deleted',
      moderationStatus: 'removed'
    };

    if (!db.deletedPostIds.includes(postId)) {
      db.deletedPostIds.push(postId);
    }
    if (db.createdPosts[postId]) {
      db.createdPosts[postId] = deletedPostRecord;
    } else {
      db.updatedPosts[postId] = deletedPostRecord;
    }
    if (hadPurchases) {
      db.archivedPostsForPurchasers[postId] = deletedPostRecord;
    }

    this.writePostsDB(db);
    this.appendPostAuditLog(auditEntry);

    return {
      success: true,
      statusCode: 200,
      hadPurchases,
      deletedPost: deepClone(deletedPostRecord),
      auditEntry
    };
  }

  deletePostsByCreator(creatorId: string): string[] {
    if (!creatorId) return [];
    const db = this.readPostsDB();
    const deletedIds = new Set<string>(db.deletedPostIds);
    const removedHere: string[] = [];

    for (const [pid, post] of Object.entries(db.createdPosts)) {
      if (post && post.creatorId === creatorId) {
        delete db.createdPosts[pid];
        deletedIds.add(pid);
        removedHere.push(pid);
      }
    }
    for (const [pid, post] of Object.entries(db.updatedPosts)) {
      if (post && post.creatorId === creatorId) {
        delete db.updatedPosts[pid];
        deletedIds.add(pid);
        removedHere.push(pid);
      }
    }
    for (const [pid, post] of Object.entries(db.archivedPostsForPurchasers)) {
      if (post && post.creatorId === creatorId) {
        delete db.archivedPostsForPurchasers[pid];
      }
    }

    db.deletedPostIds = Array.from(deletedIds);
    if (removedHere.length > 0) {
      this.writePostsDB(db);
    }
    return removedHere;
  }

  auditPostIntegrity(): PostAuditReport {
    const db = this.readPostsDB();
    const revDb = this.readRevisionsDB();
    const issues: PostAuditReport['issues'] = [];
    const recoveredPostIds: string[] = [];
    let mutated = false;

    const totalRevisions = Object.values(revDb.revisionsByPostId).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    const checkPostRecord = (post: Post) => {
      if (!post.id || !post.creatorId) {
        issues.push({
          postId: post.id || 'unknown',
          severity: 'critical',
          code: 'MISSING_IDENTITY',
          message: 'Post record is missing an id or creatorId.'
        });
        return;
      }

      for (const m of post.media || []) {
        if (isEphemeralBlobUrl(m.url) || isEphemeralBlobUrl(m.thumbnailUrl) || isExpiringSignedUrl(m.url)) {
          issues.push({
            postId: post.id,
            severity: 'warning',
            code: 'EPHEMERAL_MEDIA_URL',
            message: `Media asset ${m.id} references an ephemeral/expiring URL (${(m.url || '').slice(0, 48)}).`
          });
        } else if (m.url && m.url.startsWith('/api/media/files/')) {
          const fname = path.basename(m.url.split('?')[0]);
          const fpath = path.join(this.mediaUploadsDir, fname);
          if (!fs.existsSync(fpath)) {
            issues.push({
              postId: post.id,
              severity: 'critical',
              code: 'MISSING_MEDIA_FILE',
              message: `Uploaded media file ${fname} is missing from disk.`
            });
          }
        }
      }

      // Ensure every created post has an immutable v1 revision snapshot
      if (db.createdPosts[post.id] && (!revDb.revisionsByPostId[post.id] || revDb.revisionsByPostId[post.id].length === 0)) {
        revDb.revisionsByPostId[post.id] = [
          {
            revisionId: `rev_${crypto.randomUUID()}`,
            postId: post.id,
            version: post.version || 1,
            changeType: 'created',
            changedFields: ['audit_backfill'],
            editorId: post.creatorId,
            editorName: post.creatorName,
            editorRole: 'creator',
            reason: 'Revision history initialized during integrity audit',
            createdAt: post.createdAtIso || new Date().toISOString(),
            snapshot: deepClone(post)
          }
        ];
        mutated = true;
      }
    };

    Object.values(db.createdPosts).forEach(checkPostRecord);
    Object.values(db.updatedPosts).forEach(checkPostRecord);

    if (mutated) {
      this.writeRevisionsDB(revDb);
    }

    return {
      checkedAt: new Date().toISOString(),
      totalCreatedPosts: Object.keys(db.createdPosts).length,
      totalBaselinePosts: 0,
      totalOverrides: Object.keys(db.updatedPosts).length,
      totalDeletedIds: db.deletedPostIds.length,
      totalRevisionPosts: Object.keys(revDb.revisionsByPostId).length,
      totalRevisions,
      issues,
      recoveredCount: recoveredPostIds.length,
      recoveredPostIds
    };
  }
}
