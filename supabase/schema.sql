-- ============================================================================
-- ACOVON — Complete Supabase PostgreSQL Schema, RLS & Storage Policies
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Primary Users Table (Linked to auth.users.id)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name TEXT NOT NULL CHECK (char_length(full_legal_name) BETWEEN 2 AND 120),
  username TEXT NOT NULL UNIQUE CHECK (char_length(username) BETWEEN 3 AND 40),
  role TEXT NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'creator', 'admin')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'disabled', 'pending_deletion')),
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  profile_picture_url TEXT NOT NULL DEFAULT '',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  appearance_preference TEXT NOT NULL DEFAULT 'dark' CHECK (appearance_preference IN ('light', 'dark', 'system')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Isolated User PII Table
CREATE TABLE IF NOT EXISTS public.user_private_info (
  uid UUID PRIMARY KEY REFERENCES public.users(uid) ON DELETE CASCADE,
  email TEXT NOT NULL,
  is_18_plus_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  terms_accepted BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. User Files Metadata Table (Supabase Storage Reference)
CREATE TABLE IF NOT EXISTS public.user_files (
  file_id TEXT PRIMARY KEY,
  owner_uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN (
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/webm',
    'application/pdf'
  )),
  file_extension TEXT NOT NULL CHECK (file_extension IN ('jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov', 'webm', 'pdf')),
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 524288000),
  file_category TEXT NOT NULL CHECK (file_category IN ('image', 'video', 'document')),
  upload_status TEXT NOT NULL DEFAULT 'completed' CHECK (upload_status IN ('uploading', 'completed', 'failed', 'deleted')),
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'followers', 'subscribers', 'ppv', 'message_attachment')),
  download_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 4. User Account Settings Table
CREATE TABLE IF NOT EXISTS public.user_settings (
  owner_uid UUID PRIMARY KEY REFERENCES public.users(uid) ON DELETE CASCADE,
  appearance_preference TEXT NOT NULL DEFAULT 'dark' CHECK (appearance_preference IN ('light', 'dark', 'system')),
  preferred_language TEXT NOT NULL DEFAULT 'en',
  language_mode TEXT NOT NULL DEFAULT 'automatic' CHECK (language_mode IN ('automatic', 'manual', 'english')),
  notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  privacy_hide_online_status BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Account Deletion Requests Table
CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  request_id TEXT PRIMARY KEY,
  uid UUID NOT NULL REFERENCES public.users(uid) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled')),
  preserve_financial_records BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_private_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Users table policies (Owner can read/insert/update safe fields; role is locked to 'fan' on insert)
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = uid);

CREATE POLICY "Users can insert own fan profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = uid AND role = 'fan' AND account_status = 'active');

CREATE POLICY "Users can update own non-privileged profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = uid AND account_status = 'active')
  WITH CHECK (auth.uid() = uid AND role = (SELECT role FROM public.users WHERE uid = auth.uid()));

-- User Private Info policies (Strictly owner only)
CREATE POLICY "Users can read own private info"
  ON public.user_private_info FOR SELECT
  USING (auth.uid() = uid);

CREATE POLICY "Users can insert own private info"
  ON public.user_private_info FOR INSERT
  WITH CHECK (auth.uid() = uid);

-- User Files policies (Strictly owner only for private files)
CREATE POLICY "Users can read own or public files"
  ON public.user_files FOR SELECT
  USING (auth.uid() = owner_uid OR visibility = 'public');

CREATE POLICY "Users can insert own files"
  ON public.user_files FOR INSERT
  WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY "Users can update own files"
  ON public.user_files FOR UPDATE
  USING (auth.uid() = owner_uid)
  WITH CHECK (auth.uid() = owner_uid);

CREATE POLICY "Users can delete own files"
  ON public.user_files FOR DELETE
  USING (auth.uid() = owner_uid);

-- User Settings policies
CREATE POLICY "Users can manage own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = owner_uid)
  WITH CHECK (auth.uid() = owner_uid);

-- Account Deletion Requests policies
CREATE POLICY "Users can create and view own deletion requests"
  ON public.account_deletion_requests FOR ALL
  USING (auth.uid() = uid)
  WITH CHECK (auth.uid() = uid);

-- ============================================================================
-- SUPABASE STORAGE BUCKET ("app-files") & RLS POLICIES
-- Path format: ${auth.uid()}/${featureName}/${itemId}/${uuid}.${extension}
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-files', 'app-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Owner can upload to own folder {uid}/..."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'app-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner can read own files in {uid}/..."
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'app-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner can delete own files in {uid}/..."
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'app-files' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- 6. ONE-TIME ADMIN SETUP & AUDIT LOG TABLES
-- ============================================================================

-- Single-row setup status table (enforces atomic one-time setup)
CREATE TABLE IF NOT EXISTS public.admin_setup (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_setup_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  admin_uid UUID REFERENCES public.users(uid) ON DELETE SET NULL,
  admin_email TEXT,
  initialized_by TEXT NOT NULL DEFAULT 'platform_owner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Administrator security audit logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id TEXT PRIMARY KEY,
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_role TEXT NOT NULL DEFAULT 'super_admin',
  category TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  target_label TEXT NOT NULL,
  details TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.admin_setup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone can check setup completed status (needed to know if setup is closed)
CREATE POLICY "Public read of admin setup status"
  ON public.admin_setup FOR SELECT
  USING (true);

-- Only authenticated admins can read audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid() AND role = 'admin'));

-- Only authenticated admins or system can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.admin_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users WHERE uid = auth.uid() AND role = 'admin'));

