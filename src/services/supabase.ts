import { SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';
import {
  supabase as sharedSupabaseClient,
  SUPABASE_URL,
  SUPABASE_PUBLIC_KEY
} from '../supabaseClient.js';

// ============================================================================
// 1. CENTRALIZED SUPABASE CONFIGURATION & INITIALIZATION
// ============================================================================
export const SUPABASE_STORAGE_BUCKET = 'app-files';
const rawStorageBucket = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || SUPABASE_STORAGE_BUCKET).trim();

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
    SUPABASE_PUBLIC_KEY &&
    SUPABASE_URL.startsWith('http')
);

export const resolvedSupabaseConfig = {
  url: SUPABASE_URL.replace(/\/rest\/v1\/?$/, ''),
  anonKeyConfigured: isSupabaseConfigured,
  storageBucket: rawStorageBucket || SUPABASE_STORAGE_BUCKET
};

export const supabase: SupabaseClient | null = sharedSupabaseClient;

// ============================================================================
// 2. DATA INTERFACES (Aligned with supabase/schema.sql)
// ============================================================================
export interface SupabaseUserProfile {
  uid: string;
  full_legal_name: string;
  username: string;
  role: 'fan' | 'creator' | 'admin';
  account_status: 'active' | 'suspended' | 'disabled' | 'pending_deletion';
  email_verified: boolean;
  profile_picture_url: string;
  preferred_language: string;
  appearance_preference: 'light' | 'dark' | 'system';
  created_at: string;
  updated_at: string;
  last_login_at: string;
}

export type FileVisibilityMode =
  | 'private'
  | 'public'
  | 'followers'
  | 'subscribers'
  | 'ppv'
  | 'message_attachment';

export type FileUploadCategory = 'image' | 'video' | 'document';

export interface SupabaseUserFileRecord {
  file_id: string;
  owner_uid: string;
  original_filename: string;
  storage_path: string;
  mime_type: string;
  file_extension: string;
  file_size_bytes: number;
  file_category: FileUploadCategory;
  upload_status: 'uploading' | 'completed' | 'failed' | 'deleted';
  visibility: FileVisibilityMode;
  download_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// ============================================================================
// 3. FILE VALIDATION & SECURITY CONSTRAINTS
// ============================================================================
export const ALLOWED_FILE_SPECS: Record<
  string,
  { extensions: string[]; category: FileUploadCategory; maxSizeBytes: number }
> = {
  'image/jpeg': {
    extensions: ['jpg', 'jpeg'],
    category: 'image',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'image/png': {
    extensions: ['png'],
    category: 'image',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'image/webp': {
    extensions: ['webp'],
    category: 'image',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  },
  'video/mp4': {
    extensions: ['mp4'],
    category: 'video',
    maxSizeBytes: 500 * 1024 * 1024 // 500 MB
  },
  'video/quicktime': {
    extensions: ['mov'],
    category: 'video',
    maxSizeBytes: 500 * 1024 * 1024 // 500 MB
  },
  'video/webm': {
    extensions: ['webm'],
    category: 'video',
    maxSizeBytes: 500 * 1024 * 1024 // 500 MB
  },
  'application/pdf': {
    extensions: ['pdf'],
    category: 'document',
    maxSizeBytes: 25 * 1024 * 1024 // 25 MB
  }
};

export function validateFileForSupabaseUpload(file: File): {
  valid: boolean;
  error?: string;
  category?: FileUploadCategory;
  extension?: string;
  sanitizedName?: string;
} {
  if (!file || file.size <= 0) {
    return { valid: false, error: 'Selected file is empty or unreadable.' };
  }

  const rawExt = (file.name.split('.').pop() || '').toLowerCase().trim();
  const mimeSpec = ALLOWED_FILE_SPECS[file.type];

  if (!mimeSpec) {
    return {
      valid: false,
      error: `Unsupported MIME type "${file.type || 'unknown'}". Allowed formats: JPG, JPEG, PNG, WEBP, MP4, MOV, WEBM, and PDF.`
    };
  }

  if (!mimeSpec.extensions.includes(rawExt)) {
    return {
      valid: false,
      error: `File extension ".${rawExt}" does not match its content type (${file.type}).`
    };
  }

  if (file.size > mimeSpec.maxSizeBytes) {
    const limitMb = Math.round(mimeSpec.maxSizeBytes / (1024 * 1024));
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds the ${limitMb} MB limit for ${mimeSpec.category}s.`
    };
  }

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);

  return {
    valid: true,
    category: mimeSpec.category,
    extension: rawExt,
    sanitizedName
  };
}

// ============================================================================
// 4. SUPABASE AUTHENTICATION & POSTGRESQL PROFILE PROVISIONING
// ============================================================================
export async function getActiveSupabaseUser(): Promise<SupabaseAuthUser | null> {
  if (!supabase) return null;
  try {
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  } catch {
    return null;
  }
}

export async function checkSupabaseUsernameAvailable(username: string): Promise<boolean> {
  const clean = username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (clean.length < 3 || clean.length > 40) return false;
  if (!supabase) return true;

  try {
    const { data } = await supabase
      .from('users')
      .select('uid')
      .eq('username', clean)
      .maybeSingle();
    return !data;
  } catch {
    return true;
  }
}

export async function provisionSupabaseUserRecords(params: {
  supabaseUser: SupabaseAuthUser;
  fullLegalName: string;
  username: string;
  preferredLanguage?: string;
  appearancePreference?: 'light' | 'dark' | 'system';
}): Promise<SupabaseUserProfile> {
  const {
    supabaseUser,
    fullLegalName,
    username,
    preferredLanguage = 'en',
    appearancePreference = 'dark'
  } = params;

  const uid = supabaseUser.id;
  const cleanName = fullLegalName.trim().slice(0, 120) || 'ACOVON Member';
  const cleanUsername =
    username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, '')
      .slice(0, 40) || `user_${uid.slice(0, 8).toLowerCase()}`;
  const nowIso = new Date().toISOString();

  const fallbackProfile: SupabaseUserProfile = {
    uid,
    full_legal_name: cleanName,
    username: cleanUsername,
    role: 'fan',
    account_status: 'active',
    email_verified: Boolean(supabaseUser.email_confirmed_at),
    profile_picture_url:
      (supabaseUser.user_metadata?.avatar_url as string) || '',
    preferred_language: preferredLanguage.slice(0, 16),
    appearance_preference: appearancePreference,
    created_at: nowIso,
    updated_at: nowIso,
    last_login_at: nowIso
  };

  if (!supabase) return fallbackProfile;

  try {
    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('users')
        .update({ last_login_at: nowIso, updated_at: nowIso })
        .eq('uid', uid);
      return existing as SupabaseUserProfile;
    }

    await supabase.from('users').insert(fallbackProfile);
    await supabase.from('user_private_info').insert({
      uid,
      email: supabaseUser.email || `${cleanUsername}@acovon.user`,
      is_18_plus_confirmed: true,
      terms_accepted: true,
      created_at: nowIso,
      updated_at: nowIso
    });
    await supabase.from('user_settings').insert({
      owner_uid: uid,
      appearance_preference: appearancePreference,
      preferred_language: preferredLanguage.slice(0, 16),
      language_mode: 'automatic',
      notifications_enabled: true,
      email_notifications: true,
      privacy_hide_online_status: false,
      created_at: nowIso,
      updated_at: nowIso
    });
  } catch (err) {
    console.warn('Supabase table provisioning notice:', err);
  }

  return fallbackProfile;
}

export async function registerWithSupabaseEmail(params: {
  fullName: string;
  username: string;
  email: string;
  password: string;
  preferredLanguage?: string;
  appearancePreference?: 'light' | 'dark' | 'system';
}): Promise<{
  success: boolean;
  profile?: SupabaseUserProfile;
  error?: string;
}> {
  const cleanUsername = params.username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (cleanUsername.length < 3 || cleanUsername.length > 40) {
    return {
      success: false,
      error: 'Username must be between 3 and 40 alphanumeric characters.'
    };
  }

  if (!supabase) {
    // Local fallback when VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not yet set in .env
    const nowIso = new Date().toISOString();
    return {
      success: true,
      profile: {
        uid: `user_fan_${Date.now()}`,
        full_legal_name: params.fullName.trim(),
        username: cleanUsername,
        role: 'fan',
        account_status: 'active',
        email_verified: false,
        profile_picture_url: '',
        preferred_language: params.preferredLanguage || 'en',
        appearance_preference: params.appearancePreference || 'dark',
        created_at: nowIso,
        updated_at: nowIso,
        last_login_at: nowIso
      }
    };
  }

  const available = await checkSupabaseUsernameAvailable(cleanUsername);
  if (!available) {
    return {
      success: false,
      error: 'This username is already taken in Supabase. Please choose another.'
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: params.email.trim(),
    password: params.password,
    options: {
      data: {
        full_legal_name: params.fullName.trim(),
        username: cleanUsername
      }
    }
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || 'Could not register account in Supabase.'
    };
  }

  const profile = await provisionSupabaseUserRecords({
    supabaseUser: data.user,
    fullLegalName: params.fullName,
    username: cleanUsername,
    preferredLanguage: params.preferredLanguage,
    appearancePreference: params.appearancePreference
  });

  return { success: true, profile };
}

export async function loginWithSupabaseEmail(
  email: string,
  password: string
): Promise<{
  success: boolean;
  profile?: SupabaseUserProfile;
  error?: string;
}> {
  if (!supabase) {
    return { success: false, error: 'Supabase client using local account matcher.' };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || 'Invalid Supabase email or password credentials.'
    };
  }

  const profile = await provisionSupabaseUserRecords({
    supabaseUser: data.user,
    fullLegalName:
      (data.user.user_metadata?.full_legal_name as string) ||
      email.split('@')[0],
    username:
      (data.user.user_metadata?.username as string) ||
      email.split('@')[0].replace(/[^a-z0-9_-]/gi, '').toLowerCase()
  });

  if (profile.account_status === 'suspended' || profile.account_status === 'disabled') {
    await supabase.auth.signOut();
    return {
      success: false,
      error: `Account is currently ${profile.account_status}. Access to restricted features is blocked.`
    };
  }

  return { success: true, profile };
}

export async function logoutFromSupabase(): Promise<void> {
  if (!supabase) return;
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn('Error signing out of Supabase:', err);
  }
}

export async function sendSupabasePasswordReset(email: string): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!supabase) {
    return { success: true };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

export async function syncUserPreferencesToSupabase(params: {
  uid: string;
  appearancePreference: 'light' | 'dark' | 'system';
  preferredLanguage: string;
  languageMode: 'automatic' | 'manual' | 'english';
}): Promise<void> {
  if (!supabase) return;
  const nowIso = new Date().toISOString();
  try {
    await supabase
      .from('users')
      .update({
        appearance_preference: params.appearancePreference,
        preferred_language: params.preferredLanguage.slice(0, 16),
        updated_at: nowIso
      })
      .eq('uid', params.uid);

    await supabase
      .from('user_settings')
      .update({
        appearance_preference: params.appearancePreference,
        preferred_language: params.preferredLanguage.slice(0, 16),
        language_mode: params.languageMode,
        updated_at: nowIso
      })
      .eq('owner_uid', params.uid);
  } catch {
    // Ignore if offline or unconfigured
  }
}

// ============================================================================
// 5. SUPABASE STORAGE ("app-files") & FILE LIBRARY OPERATIONS
// ============================================================================
export type StorageFeatureName =
  | 'library'
  | 'avatars'
  | 'covers'
  | 'statuses'
  | 'posts'
  | 'post-thumbnails'
  | 'messages'
  | 'announcements';

function generateStorageUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function resolveStorageOwnerUid(fallbackUid: string): Promise<string> {
  if (supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.user?.id) {
        return sessionData.session.user.id;
      }
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user?.id) {
        return userData.user.id;
      }
    } catch {
      // fall through
    }
  }
  return fallbackUid;
}

export function buildAppFilesStoragePath(params: {
  uid: string;
  featureName: StorageFeatureName | string;
  itemId: string;
  extension: string;
}): { storagePath: string; uuid: string } {
  const uuid = generateStorageUuid();
  const cleanFeature = params.featureName.replace(/[^a-zA-Z0-9_-]/g, '') || 'files';
  const cleanItemId = params.itemId.replace(/[^a-zA-Z0-9_-]/g, '') || uuid;
  const cleanExt = params.extension.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'bin';
  // Required structure: ${auth.uid()}/${featureName}/${itemId}/${uuid}.${extension}
  const storagePath = `${params.uid}/${cleanFeature}/${cleanItemId}/${uuid}.${cleanExt}`;
  return { storagePath, uuid };
}

export async function createSignedAppFileUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  if (!supabase || !storagePath) return null;
  try {
    const { data, error } = await supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .createSignedUrl(storagePath, expiresInSeconds);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export function dataUrlToFile(dataUrl: string, defaultFileName = 'upload.jpg'): File {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0]?.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const ext = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
  const baseName = defaultFileName.replace(/\.[^/.]+$/, '');
  const finalName = `${baseName}.${ext}`;

  const byteString = atob(parts[1] || '');
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new File([ab], finalName, { type: mime });
}

export async function uploadUserFileToSupabase(params: {
  uid: string;
  file: File;
  featureName?: StorageFeatureName | string;
  itemId?: string;
  visibility?: FileVisibilityMode;
  onProgress?: (percent: number) => void;
}): Promise<{
  success: boolean;
  record?: SupabaseUserFileRecord;
  storagePath?: string;
  signedUrl?: string;
  error?: string;
}> {
  const {
    uid,
    file,
    featureName = 'library',
    itemId,
    visibility = 'private',
    onProgress
  } = params;

  const ownerUid = await resolveStorageOwnerUid(uid);
  const rawExt = (file.name.split('.').pop() || '').toLowerCase().trim();
  const validation = validateFileForSupabaseUpload(file);

  const resolvedCategory: FileUploadCategory =
    validation.category ||
    (file.type.startsWith('video/')
      ? 'video'
      : file.type.startsWith('image/')
      ? 'image'
      : 'document');
  const resolvedExtension =
    validation.extension ||
    (['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'pdf'].includes(rawExt)
      ? rawExt
      : resolvedCategory === 'video'
      ? 'mp4'
      : resolvedCategory === 'image'
      ? 'jpg'
      : 'pdf');
  const resolvedMime =
    ALLOWED_FILE_SPECS[file.type]
      ? file.type
      : resolvedCategory === 'video'
      ? 'video/mp4'
      : resolvedCategory === 'image'
      ? 'image/jpeg'
      : 'application/pdf';
  const sanitizedName =
    validation.sanitizedName ||
    file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200) ||
    `file.${resolvedExtension}`;

  const resolvedItemId = itemId || `item_${Date.now()}`;
  const { storagePath, uuid } = buildAppFilesStoragePath({
    uid: ownerUid,
    featureName,
    itemId: resolvedItemId,
    extension: resolvedExtension
  });
  const fileId = `file_${uuid}`;
  const nowIso = new Date().toISOString();

  if (onProgress) onProgress(25);

  // 1. Always store uploaded media permanently on ACOVON media storage (/api/media/upload)
  // so URLs (/api/media/files/...) never expire after 1 hour or break across page reloads.
  try {
    const serverRes = await fetch('/api/media/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'x-file-name': sanitizedName,
        'x-mime-type': file.type || resolvedMime,
        'x-owner-id': ownerUid,
        'x-post-id': resolvedItemId
      },
      body: file
    });

    if (serverRes.ok) {
      const serverData = await serverRes.json();
      if (serverData?.success && serverData?.url) {
        if (onProgress) onProgress(85);
        const permanentUrl: string = serverData.url;
        const record: SupabaseUserFileRecord = {
          file_id: serverData.mediaId || fileId,
          owner_uid: ownerUid,
          original_filename: sanitizedName,
          storage_path: permanentUrl,
          mime_type: serverData.mimeType || resolvedMime,
          file_extension: resolvedExtension,
          file_size_bytes: serverData.sizeBytes || file.size,
          file_category: resolvedCategory,
          upload_status: 'completed',
          visibility,
          download_url: permanentUrl,
          created_at: nowIso,
          updated_at: nowIso
        };

        // Non-blocking optional Supabase metadata sync
        if (supabase) {
          try {
            await supabase.from('user_files').insert(record);
            if (featureName === 'avatars') {
              await supabase
                .from('users')
                .update({ profile_picture_url: permanentUrl, updated_at: nowIso })
                .eq('uid', ownerUid);
            }
          } catch {
            // ignore optional remote metadata sync error
          }
        }

        if (onProgress) onProgress(100);
        return {
          success: true,
          record,
          storagePath: permanentUrl,
          signedUrl: permanentUrl
        };
      }
    }
  } catch (err) {
    console.warn('Permanent server media upload notice:', err);
  }

  // 2. If Supabase public storage fallback is attempted when server upload is unreachable,
  // avoid returning ephemeral blob: URLs for persisted posts.
  if (supabase) {
    try {
      const { error: uploadErr } = await supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || resolvedMime,
          upsert: false
        });

      if (!uploadErr) {
        const { data: publicUrlData } = supabase.storage
          .from(SUPABASE_STORAGE_BUCKET)
          .getPublicUrl(storagePath);
        const permanentPublicUrl = publicUrlData?.publicUrl;

        if (permanentPublicUrl && !permanentPublicUrl.startsWith('blob:')) {
          const record: SupabaseUserFileRecord = {
            file_id: fileId,
            owner_uid: ownerUid,
            original_filename: sanitizedName,
            storage_path: storagePath,
            mime_type: resolvedMime,
            file_extension: resolvedExtension,
            file_size_bytes: file.size,
            file_category: resolvedCategory,
            upload_status: 'completed',
            visibility,
            download_url: permanentPublicUrl,
            created_at: nowIso,
            updated_at: nowIso
          };
          await supabase.from('user_files').insert(record);
          if (onProgress) onProgress(100);
          return {
            success: true,
            record,
            storagePath,
            signedUrl: permanentPublicUrl
          };
        }
      }
    } catch (err) {
      console.warn('Supabase Storage upload error:', err);
    }
  }

  if (onProgress) onProgress(100);
  return {
    success: false,
    error: 'Unable to persist uploaded file to permanent media storage. Please retry.'
  };
}

export async function fetchUserSupabaseFiles(uid: string): Promise<SupabaseUserFileRecord[]> {
  if (!supabase) return [];
  try {
    const ownerUid = await resolveStorageOwnerUid(uid);
    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('owner_uid', ownerUid)
      .neq('upload_status', 'deleted')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    // Resolve fresh signed URLs from private "app-files" bucket for display
    const records = await Promise.all(
      (data as SupabaseUserFileRecord[]).map(async (item) => {
        if (item.storage_path) {
          const signedUrl = await createSignedAppFileUrl(item.storage_path, 3600);
          if (signedUrl) {
            return { ...item, download_url: signedUrl };
          }
        }
        return item;
      })
    );

    return records;
  } catch {
    return [];
  }
}

export async function deleteSupabaseFileByPath(params: {
  storagePath?: string;
  fileId?: string;
  uid?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { storagePath, fileId, uid } = params;
  if (!supabase) return { success: true };

  try {
    const ownerUid = uid ? await resolveStorageOwnerUid(uid) : undefined;

    if (storagePath) {
      await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([storagePath]);
    }

    if (fileId) {
      let query = supabase.from('user_files').delete().eq('file_id', fileId);
      if (ownerUid) {
        query = query.eq('owner_uid', ownerUid);
      }
      await query;
    } else if (storagePath) {
      let query = supabase.from('user_files').delete().eq('storage_path', storagePath);
      if (ownerUid) {
        query = query.eq('owner_uid', ownerUid);
      }
      await query;
    }
  } catch (err) {
    console.warn('Error deleting file from Supabase Storage/DB:', err);
  }

  return { success: true };
}

export async function deleteUserSupabaseFile(
  uid: string,
  record: SupabaseUserFileRecord
): Promise<{ success: boolean; error?: string }> {
  const ownerUid = await resolveStorageOwnerUid(uid);
  if (record.owner_uid !== uid && record.owner_uid !== ownerUid) {
    return {
      success: false,
      error: 'Security Violation: You can only delete files that belong to your own UID.'
    };
  }

  return deleteSupabaseFileByPath({
    storagePath: record.storage_path,
    fileId: record.file_id,
    uid: ownerUid
  });
}

export async function updateUserSupabaseFileVisibility(
  uid: string,
  fileId: string,
  visibility: FileVisibilityMode
): Promise<{ success: boolean; error?: string }> {
  if (supabase) {
    try {
      await supabase
        .from('user_files')
        .update({ visibility, updated_at: new Date().toISOString() })
        .eq('file_id', fileId)
        .eq('owner_uid', uid);
    } catch {
      // Ignore if offline
    }
  }
  return { success: true };
}

export async function submitSupabaseAccountDeletionRequest(
  uid: string,
  reason: string
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const requestId = `del_${Date.now()}_${uid.slice(0, 6)}`;
  const cleanReason = reason.trim().slice(0, 500) || 'User requested account deletion';
  const nowIso = new Date().toISOString();

  if (supabase) {
    try {
      await supabase.from('account_deletion_requests').insert({
        request_id: requestId,
        uid,
        reason: cleanReason,
        status: 'pending',
        preserve_financial_records: true,
        created_at: nowIso,
        updated_at: nowIso
      });
    } catch {
      // Ignore if offline
    }
  }

  return { success: true, requestId };
}

// ============================================================================
// 5. CENTRALIZED CREATOR APPLICATIONS & SUPABASE REALTIME SYNC
// ============================================================================
export interface SupabaseCreatorApplicationRow {
  id: string;
  user_id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  document_type: 'passport' | 'drivers_license' | 'national_id';
  document_number: string;
  document_file_url: string;
  selfie_url: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  submitted_at: string;
  reviewed_by_admin_id?: string | null;
  reviewed_by_admin_name?: string | null;
  reviewed_at?: string | null;
  notes?: string | null;
  application_data?: Record<string, any> | null;
}

export interface SupabaseApplicationsQueryResult {
  rows: SupabaseCreatorApplicationRow[];
  available: boolean;
  error?: string;
  code?: string;
}

export async function fetchAllSupabaseCreatorApplicationsWithStatus(): Promise<SupabaseApplicationsQueryResult> {
  if (!supabase) return { rows: [], available: false, error: 'Supabase client unavailable' };
  try {
    const { data, error } = await supabase
      .from('creator_applications')
      .select('*')
      .order('submitted_at', { ascending: false });
    if (error) {
      return {
        rows: [],
        available: false,
        error: error.message,
        code: (error as any).code ? String((error as any).code) : undefined
      };
    }
    return {
      rows: Array.isArray(data) ? (data as SupabaseCreatorApplicationRow[]) : [],
      available: true
    };
  } catch (err: unknown) {
    return {
      rows: [],
      available: false,
      error: err instanceof Error ? err.message : 'Supabase query error'
    };
  }
}

export async function fetchAllSupabaseCreatorApplications(): Promise<SupabaseCreatorApplicationRow[]> {
  const res = await fetchAllSupabaseCreatorApplicationsWithStatus();
  return res.rows;
}

export function mapSupabaseRowToVerification(row: SupabaseCreatorApplicationRow) {
  const submittedAt = row.submitted_at
    ? String(row.submitted_at).replace('T', ' ').slice(0, 16)
    : new Date().toISOString().replace('T', ' ').slice(0, 16);
  return {
    id: String(row.id),
    userId: String(row.user_id),
    name: String(row.name || 'Creator Applicant'),
    username: String(row.username || 'applicant'),
    email: String(row.email || ''),
    avatar: String(row.avatar || row.selfie_url || ''),
    documentType: (row.document_type || 'drivers_license') as 'passport' | 'drivers_license' | 'national_id',
    documentNumber: String(row.document_number || ''),
    documentFileUrl: String(row.document_file_url || ''),
    selfieUrl: String(row.selfie_url || row.avatar || ''),
    status: (row.status || 'pending') as 'pending' | 'approved' | 'rejected' | 'info_requested',
    submittedAt,
    reviewedByAdminId: row.reviewed_by_admin_id || undefined,
    reviewedByAdminName: row.reviewed_by_admin_name || undefined,
    reviewedAt: row.reviewed_at ? String(row.reviewed_at).replace('T', ' ').slice(0, 16) : undefined,
    notes: row.notes || undefined,
    source: 'supabase_sync',
    applicationData: (row.application_data || undefined) as any
  };
}

export async function submitCreatorApplicationToSupabase(params: {
  id: string;
  userId: string;
  name: string;
  username: string;
  email: string;
  avatar?: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  documentFileUrl: string;
  selfieUrl: string;
  notes?: string;
  applicationData?: Record<string, any>;
  adminNotification?: {
    id: string;
    title: string;
    message: string;
    eventKey?: string;
  };
}): Promise<{ synced: boolean; error?: string; code?: string }> {
  if (!supabase) return { synced: false, error: 'Supabase client unavailable' };
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const sessionUserId = sessionData?.session?.user?.id;
    const effectiveUserId = sessionUserId || params.userId;
    if (!sessionData?.session) {
      return { synced: false, error: 'No active browser Supabase Auth session' };
    }

    const nowIso = new Date().toISOString();
    const { error } = await supabase.from('creator_applications').upsert(
      {
        id: params.id,
        user_id: effectiveUserId,
        name: params.name,
        username: params.username,
        email: params.email,
        avatar: params.avatar || '',
        document_type: params.documentType,
        document_number: params.documentNumber,
        document_file_url: params.documentFileUrl,
        selfie_url: params.selfieUrl,
        status: 'pending',
        submitted_at: nowIso,
        notes: params.notes || '',
        application_data: params.applicationData || {},
        updated_at: nowIso
      },
      { onConflict: 'id' }
    );
    if (error) {
      return {
        synced: false,
        error: error.message,
        code: (error as any).code ? String((error as any).code) : undefined
      };
    }

    if (params.adminNotification) {
      await supabase
        .from('notifications')
        .upsert(
          {
            id: params.adminNotification.id,
            user_id: effectiveUserId,
            target_role: 'admin',
            application_id: params.id,
            type: 'verification',
            title: params.adminNotification.title,
            message: params.adminNotification.message,
            read: false,
            event_key: params.adminNotification.eventKey || `creator_app_submitted_${params.id}`
          },
          { onConflict: 'event_key' }
        )
        .then(() => {});
    }

    return { synced: true };
  } catch (err: unknown) {
    return {
      synced: false,
      error: err instanceof Error ? err.message : 'Supabase write error'
    };
  }
}

export async function approveCreatorApplicationViaSupabaseRpc(
  applicationId: string,
  notes?: string
): Promise<{ supported: boolean; success: boolean; error?: string }> {
  if (!supabase) return { supported: false, success: false };
  try {
    const { error } = await supabase.rpc('approve_creator_application', {
      p_application_id: applicationId,
      p_notes: notes || 'Creator application approved by administrator.'
    });
    if (error) {
      const code = String((error as any).code || '');
      if (code === 'PGRST202' || code === 'PGRST205' || code === '42883') {
        return { supported: false, success: false };
      }
      return { supported: true, success: false, error: error.message };
    }
    return { supported: true, success: true };
  } catch {
    return { supported: false, success: false };
  }
}

export async function rejectCreatorApplicationViaSupabaseRpc(
  applicationId: string,
  notes?: string
): Promise<{ supported: boolean; success: boolean; error?: string }> {
  if (!supabase) return { supported: false, success: false };
  try {
    const { error } = await supabase.rpc('reject_creator_application', {
      p_application_id: applicationId,
      p_notes: notes || 'Creator application was not approved.'
    });
    if (error) {
      const code = String((error as any).code || '');
      if (code === 'PGRST202' || code === 'PGRST205' || code === '42883') {
        return { supported: false, success: false };
      }
      return { supported: true, success: false, error: error.message };
    }
    return { supported: true, success: true };
  } catch {
    return { supported: false, success: false };
  }
}

export function subscribeToCreatorApplicationsRealtime(
  onChange: () => void
): () => void {
  if (!supabase) return () => {};
  try {
    const channel = supabase
      .channel('acovon-creator-applications-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_applications' },
        () => {
          onChange();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        () => {
          onChange();
        }
      )
      .subscribe();

    return () => {
      try {
        supabase?.removeChannel(channel);
      } catch {
        // ignore
      }
    };
  } catch {
    return () => {};
  }
}

