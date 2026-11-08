import { createClient, SupabaseClient, User as SupabaseAuthUser } from '@supabase/supabase-js';

// ============================================================================
// 1. CENTRALIZED SUPABASE CONFIGURATION & INITIALIZATION
// ============================================================================
const rawSupabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawSupabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();
const rawStorageBucket = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'acovon-vault').trim();

export const isSupabaseConfigured = Boolean(
  rawSupabaseUrl &&
    rawSupabaseAnonKey &&
    rawSupabaseUrl.startsWith('http') &&
    !rawSupabaseUrl.includes('your-project-ref.supabase.co') &&
    rawSupabaseAnonKey !== 'your-supabase-anon-public-key'
);

export const resolvedSupabaseConfig = {
  url: isSupabaseConfigured ? rawSupabaseUrl : 'https://acovon-supabase.supabase.co',
  anonKeyConfigured: isSupabaseConfigured,
  storageBucket: rawStorageBucket || 'acovon-vault'
};

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(rawSupabaseUrl, rawSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

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
// 5. SUPABASE STORAGE & FILE LIBRARY OPERATIONS
// ============================================================================
export async function uploadUserFileToSupabase(params: {
  uid: string;
  file: File;
  visibility?: FileVisibilityMode;
  onProgress?: (percent: number) => void;
}): Promise<{
  success: boolean;
  record?: SupabaseUserFileRecord;
  error?: string;
}> {
  const { uid, file, visibility = 'private', onProgress } = params;

  const validation = validateFileForSupabaseUpload(file);
  if (!validation.valid || !validation.category || !validation.extension || !validation.sanitizedName) {
    return {
      success: false,
      error: validation.error || 'File failed security validation.'
    };
  }

  const fileId = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `users/${uid}/files/${fileId}/${validation.sanitizedName}`;
  const nowIso = new Date().toISOString();

  if (onProgress) onProgress(25);

  if (supabase) {
    try {
      const { error: uploadErr } = await supabase.storage
        .from(resolvedSupabaseConfig.storageBucket)
        .upload(storagePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (!uploadErr) {
        if (onProgress) onProgress(80);
        const { data: signedData } = await supabase.storage
          .from(resolvedSupabaseConfig.storageBucket)
          .createSignedUrl(storagePath, 3600);

        const downloadUrl = signedData?.signedUrl || URL.createObjectURL(file);

        const record: SupabaseUserFileRecord = {
          file_id: fileId,
          owner_uid: uid,
          original_filename: validation.sanitizedName,
          storage_path: storagePath,
          mime_type: file.type,
          file_extension: validation.extension,
          file_size_bytes: file.size,
          file_category: validation.category,
          upload_status: 'completed',
          visibility,
          download_url: downloadUrl,
          created_at: nowIso,
          updated_at: nowIso
        };

        const { error: dbErr } = await supabase.from('user_files').insert(record);
        if (dbErr) {
          // Orphan cleanup if metadata insert fails
          await supabase.storage
            .from(resolvedSupabaseConfig.storageBucket)
            .remove([storagePath]);
          return { success: false, error: dbErr.message };
        }

        if (onProgress) onProgress(100);
        return { success: true, record };
      }
    } catch {
      // Fall through to local preview URL if bucket is not yet created
    }
  }

  if (onProgress) onProgress(100);
  const localPreviewUrl = URL.createObjectURL(file);
  const record: SupabaseUserFileRecord = {
    file_id: fileId,
    owner_uid: uid,
    original_filename: validation.sanitizedName,
    storage_path: storagePath,
    mime_type: file.type,
    file_extension: validation.extension,
    file_size_bytes: file.size,
    file_category: validation.category,
    upload_status: 'completed',
    visibility,
    download_url: localPreviewUrl,
    created_at: nowIso,
    updated_at: nowIso
  };

  return { success: true, record };
}

export async function fetchUserSupabaseFiles(uid: string): Promise<SupabaseUserFileRecord[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('user_files')
      .select('*')
      .eq('owner_uid', uid)
      .neq('upload_status', 'deleted')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as SupabaseUserFileRecord[];
  } catch {
    return [];
  }
}

export async function deleteUserSupabaseFile(
  uid: string,
  record: SupabaseUserFileRecord
): Promise<{ success: boolean; error?: string }> {
  if (record.owner_uid !== uid) {
    return {
      success: false,
      error: 'Security Violation: You can only delete files that belong to your own UID.'
    };
  }

  if (supabase) {
    try {
      await supabase.storage
        .from(resolvedSupabaseConfig.storageBucket)
        .remove([record.storage_path]);
      await supabase
        .from('user_files')
        .delete()
        .eq('file_id', record.file_id)
        .eq('owner_uid', uid);
    } catch {
      // Ignore if offline
    }
  }

  return { success: true };
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
