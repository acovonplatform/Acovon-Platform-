-- ============================================================================
-- ACOVON — Complete Supabase PostgreSQL Schema, RLS & Storage Policies
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================================

-- 1. Primary Users Table (Linked to auth.users.id)
CREATE TABLE IF NOT EXISTS public.users (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_legal_name TEXT NOT NULL CHECK (char_length(full_legal_name) BETWEEN 2 AND 120),
  username TEXT NOT NULL UNIQUE CHECK (char_length(username) BETWEEN 3 AND 40),
  role TEXT NOT NULL DEFAULT 'fan' CHECK (role IN ('fan', 'creator', 'admin', 'moderator')),
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

-- ============================================================================
-- 7. CREATOR POSTS & IMMUTABLE POST REVISION HISTORY TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  creator_username TEXT NOT NULL,
  creator_avatar TEXT NOT NULL DEFAULT '',
  caption TEXT NOT NULL DEFAULT '',
  media JSONB NOT NULL DEFAULT '[]'::jsonb,
  visibility TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'subscribers', 'pay_per_view', 'private')),
  ppv_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ppv_preview_duration INT NOT NULL DEFAULT 15,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  country TEXT NOT NULL DEFAULT 'United States',
  video_country_id TEXT,
  comments_disabled BOOLEAN NOT NULL DEFAULT FALSE,
  downloads_disabled BOOLEAN NOT NULL DEFAULT TRUE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_draft BOOLEAN NOT NULL DEFAULT FALSE,
  scheduled_for TEXT,
  publication_status TEXT NOT NULL DEFAULT 'published',
  moderation_status TEXT NOT NULL DEFAULT 'approved' CHECK (moderation_status IN ('approved', 'flagged', 'restricted', 'removed')),
  is_deleted_by_creator BOOLEAN NOT NULL DEFAULT FALSE,
  version INT NOT NULL DEFAULT 1,
  original_content_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_revisions (
  revision_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  version INT NOT NULL,
  change_type TEXT NOT NULL CHECK (change_type IN ('created', 'edited', 'media_replaced', 'restored', 'deleted')),
  changed_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  editor_id TEXT NOT NULL,
  editor_name TEXT NOT NULL,
  editor_role TEXT NOT NULL DEFAULT 'creator',
  reason TEXT,
  restored_from_revision_id UUID,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_creator_id ON public.posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_revisions_post_id_version ON public.post_revisions(post_id, version DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public and authorized users can read non-removed posts"
  ON public.posts FOR SELECT
  USING (is_deleted_by_creator = FALSE AND moderation_status <> 'removed');

CREATE POLICY "Creators can insert their own posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "Creators can update only their own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (creator_id = auth.uid()::text)
  WITH CHECK (creator_id = auth.uid()::text);

CREATE POLICY "Creators and admins can read post revisions"
  ON public.post_revisions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.id = post_id AND p.creator_id = auth.uid()::text
    )
    OR EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'admin')
  );

-- ============================================================================
-- 8. CENTRALIZED CREATOR APPLICATIONS, NOTIFICATIONS, AUDIT LOGS & ATOMIC RPCS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.creator_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  username TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  document_type TEXT NOT NULL DEFAULT 'drivers_license' CHECK (document_type IN ('passport', 'drivers_license', 'national_id')),
  document_number TEXT NOT NULL DEFAULT '',
  document_file_url TEXT NOT NULL DEFAULT '',
  selfie_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'info_requested')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by_admin_id TEXT,
  reviewed_by_admin_name TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  application_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_applications_status_submitted
  ON public.creator_applications (status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_applications_user_id
  ON public.creator_applications (user_id);
CREATE INDEX IF NOT EXISTS idx_creator_applications_email
  ON public.creator_applications (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_applications_one_pending_per_user
  ON public.creator_applications (user_id)
  WHERE status IN ('pending', 'info_requested');

CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  target_role TEXT NOT NULL DEFAULT 'user' CHECK (target_role IN ('fan', 'creator', 'admin', 'user')),
  application_id TEXT,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  event_key TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_target_role
  ON public.notifications (target_role, created_at DESC);

CREATE TABLE IF NOT EXISTS public.creator_application_audit_logs (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL,
  applicant_user_id TEXT NOT NULL,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT NOT NULL DEFAULT '',
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('submitted', 'approved', 'rejected', 'info_requested', 'reconciled')),
  admin_id TEXT NOT NULL,
  admin_name TEXT NOT NULL,
  admin_role TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_app_audit_application_id
  ON public.creator_application_audit_logs (application_id, created_at DESC);

ALTER TABLE public.creator_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_application_audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view ONLY their own applications; Admins/Moderators can view ALL applications
CREATE POLICY "Users read own creator applications"
  ON public.creator_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

CREATE POLICY "Admins read all creator applications"
  ON public.creator_applications FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role IN ('admin', 'moderator')));

-- Users can ONLY submit their own application in 'pending' status (cannot self-approve)
CREATE POLICY "Users insert own pending creator application"
  ON public.creator_applications FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid()::text AND status = 'pending');

-- Only authenticated Admins/Moderators can update creator applications
CREATE POLICY "Admins update creator applications"
  ON public.creator_applications FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role IN ('admin', 'moderator')));

-- Notifications RLS
CREATE POLICY "Users read own notifications and admins read admin notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text
    OR (
      target_role = 'admin'
      AND EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role IN ('admin', 'moderator'))
    )
  );

CREATE POLICY "Users mark own notifications read"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid()::text)
  WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Admins insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role IN ('admin', 'moderator')) OR (user_id = auth.uid()::text AND target_role = 'admin'));

-- Audit Logs RLS (Admins read only; immutable from client)
CREATE POLICY "Admins read creator application audit logs"
  ON public.creator_application_audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role IN ('admin', 'moderator')));

-- Enable Supabase Realtime for creator_applications and notifications
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_applications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN OTHERS THEN NULL;
END $$;

-- Atomic Creator Application Approval RPC (upgrades existing Fan user to Creator in one transaction)
CREATE OR REPLACE FUNCTION public.approve_creator_application(
  p_application_id TEXT,
  p_notes TEXT DEFAULT 'Creator application approved by administrator.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_uid UUID := auth.uid();
  v_admin_row public.users%ROWTYPE;
  v_app public.creator_applications%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_admin_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  SELECT * INTO v_admin_row FROM public.users WHERE uid = v_admin_uid;
  IF NOT FOUND OR v_admin_row.role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Forbidden: Only authorized administrators can approve creator applications.';
  END IF;

  SELECT * INTO v_app FROM public.creator_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not Found: Creator application % does not exist.', p_application_id;
  END IF;

  IF v_app.user_id = v_admin_uid::text THEN
    RAISE EXCEPTION 'Forbidden: Administrators cannot approve their own creator application.';
  END IF;

  IF v_app.status NOT IN ('pending', 'info_requested') THEN
    RAISE EXCEPTION 'Conflict: Application % is already finalized with status %.', p_application_id, v_app.status;
  END IF;

  UPDATE public.creator_applications
  SET
    status = 'approved',
    reviewed_by_admin_id = v_admin_uid::text,
    reviewed_by_admin_name = v_admin_row.full_legal_name,
    reviewed_at = v_now,
    notes = COALESCE(NULLIF(trim(p_notes), ''), 'Creator application approved by administrator.'),
    updated_at = v_now
  WHERE id = p_application_id;

  UPDATE public.users
  SET
    role = 'creator',
    updated_at = v_now
  WHERE uid::text = v_app.user_id;

  INSERT INTO public.creator_application_audit_logs (
    id, application_id, applicant_user_id, applicant_email, applicant_name,
    previous_status, new_status, action, admin_id, admin_name, admin_role, notes, created_at
  ) VALUES (
    'caudit_' || replace(gen_random_uuid()::text, '-', ''),
    v_app.id, v_app.user_id, v_app.email, v_app.name,
    v_app.status, 'approved', 'approved',
    v_admin_uid::text, v_admin_row.full_legal_name, v_admin_row.role,
    COALESCE(NULLIF(trim(p_notes), ''), 'Creator application approved by administrator.'), v_now
  );

  INSERT INTO public.notifications (
    id, user_id, target_role, application_id, type, title, message, read, event_key, created_at
  ) VALUES (
    'notif_' || replace(gen_random_uuid()::text, '-', ''),
    v_app.user_id, 'creator', v_app.id, 'verification',
    'Creator Account Activated',
    'Congratulations! Your Creator application has been approved. Your ACOVON Creator account is now active.',
    FALSE,
    'creator_app_approved_' || v_app.id,
    v_now
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', TRUE,
    'application_id', v_app.id,
    'user_id', v_app.user_id,
    'new_status', 'approved',
    'new_role', 'creator'
  );
END;
$$;

-- Atomic Creator Application Rejection RPC (preserves existing account as Fan)
CREATE OR REPLACE FUNCTION public.reject_creator_application(
  p_application_id TEXT,
  p_notes TEXT DEFAULT 'Creator application was not approved.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_uid UUID := auth.uid();
  v_admin_row public.users%ROWTYPE;
  v_app public.creator_applications%ROWTYPE;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF v_admin_uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required.';
  END IF;

  SELECT * INTO v_admin_row FROM public.users WHERE uid = v_admin_uid;
  IF NOT FOUND OR v_admin_row.role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Forbidden: Only authorized administrators can reject creator applications.';
  END IF;

  SELECT * INTO v_app FROM public.creator_applications WHERE id = p_application_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not Found: Creator application % does not exist.', p_application_id;
  END IF;

  IF v_app.status NOT IN ('pending', 'info_requested') THEN
    RAISE EXCEPTION 'Conflict: Application % is already finalized with status %.', p_application_id, v_app.status;
  END IF;

  UPDATE public.creator_applications
  SET
    status = 'rejected',
    reviewed_by_admin_id = v_admin_uid::text,
    reviewed_by_admin_name = v_admin_row.full_legal_name,
    reviewed_at = v_now,
    notes = COALESCE(NULLIF(trim(p_notes), ''), 'Creator application was not approved.'),
    updated_at = v_now
  WHERE id = p_application_id;

  UPDATE public.users
  SET
    role = CASE WHEN role IN ('admin', 'moderator') THEN role ELSE 'fan' END,
    updated_at = v_now
  WHERE uid::text = v_app.user_id;

  INSERT INTO public.creator_application_audit_logs (
    id, application_id, applicant_user_id, applicant_email, applicant_name,
    previous_status, new_status, action, admin_id, admin_name, admin_role, notes, created_at
  ) VALUES (
    'caudit_' || replace(gen_random_uuid()::text, '-', ''),
    v_app.id, v_app.user_id, v_app.email, v_app.name,
    v_app.status, 'rejected', 'rejected',
    v_admin_uid::text, v_admin_row.full_legal_name, v_admin_row.role,
    COALESCE(NULLIF(trim(p_notes), ''), 'Creator application was not approved.'), v_now
  );

  INSERT INTO public.notifications (
    id, user_id, target_role, application_id, type, title, message, read, event_key, created_at
  ) VALUES (
    'notif_' || replace(gen_random_uuid()::text, '-', ''),
    v_app.user_id, 'fan', v_app.id, 'verification',
    'Creator Application Update',
    'Your Creator application was not approved: ' || COALESCE(NULLIF(trim(p_notes), ''), 'Verification requirements were not met.'),
    FALSE,
    'creator_app_rejected_' || v_app.id,
    v_now
  )
  ON CONFLICT (event_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', TRUE,
    'application_id', v_app.id,
    'user_id', v_app.user_id,
    'new_status', 'rejected',
    'new_role', 'fan'
  );
END;
$$;

-- ============================================================================
-- REAL-TIME LIVESTREAMING & 1-ON-1 WEBRTC VIDEO CALLING TABLES
-- ============================================================================

-- 11. Livestreams Table (Broadcast sessions, provider metadata, access gating, recording config)
CREATE TABLE IF NOT EXISTS public.livestreams (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL DEFAULT '',
  creator_username TEXT NOT NULL DEFAULT '',
  creator_avatar TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Entertainment',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  access_mode TEXT NOT NULL DEFAULT 'public' CHECK (access_mode IN ('public', 'all_subscribers', 'selected_plan', 'pay_per_view', 'private_invite')),
  allowed_tier_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  ppv_ticket_price NUMERIC(10, 2) DEFAULT NULL,
  allowed_user_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended')),
  provider TEXT NOT NULL DEFAULT 'webrtc_live' CHECK (provider IN ('webrtc_live', 'cloudflare_stream', 'obs_rtmps')),
  stream_session_id TEXT DEFAULT NULL,
  cloudflare_input_uid TEXT DEFAULT NULL,
  hls_playback_url TEXT DEFAULT NULL,
  dash_playback_url TEXT DEFAULT NULL,
  viewer_count INTEGER NOT NULL DEFAULT 0,
  total_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expected_duration_minutes INTEGER NOT NULL DEFAULT 60,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  recording_settings JSONB NOT NULL DEFAULT '{"mode":"disabled","replayPermission":"public"}'::jsonb,
  recording_status TEXT NOT NULL DEFAULT 'not_recorded' CHECK (recording_status IN ('not_recorded', 'recording', 'processing', 'ready', 'unpublished', 'removed')),
  recording_url TEXT DEFAULT NULL,
  is_replay_published BOOLEAN NOT NULL DEFAULT FALSE,
  active_poll JSONB DEFAULT NULL,
  started_at TIMESTAMPTZ DEFAULT NULL,
  scheduled_for TIMESTAMPTZ DEFAULT NULL,
  ended_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Host-only ingest credentials isolated from public SELECT
CREATE TABLE IF NOT EXISTS public.livestream_ingest_secrets (
  stream_id TEXT PRIMARY KEY REFERENCES public.livestreams(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL,
  whip_ingest_url TEXT DEFAULT NULL,
  rtmps_ingest_url TEXT DEFAULT NULL,
  rtmps_stream_key TEXT DEFAULT NULL,
  passcode_hash TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Real Deduplicated Livestream Viewer Sessions
CREATE TABLE IF NOT EXISTS public.livestream_viewer_sessions (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  viewer_id TEXT NOT NULL,
  connection_id TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_livestream_viewers_active ON public.livestream_viewer_sessions (stream_id, is_active);

-- 13. Livestream Live Chat, Gifts, Tips & Priority Messages
CREATE TABLE IF NOT EXISTS public.livestream_chat_messages (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL,
  sender_name TEXT NOT NULL,
  sender_avatar TEXT NOT NULL DEFAULT '',
  sender_role TEXT NOT NULL DEFAULT 'viewer' CHECK (sender_role IN ('viewer', 'subscriber', 'vip', 'creator', 'moderator')),
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'standard' CHECK (message_type IN ('standard', 'highlighted', 'priority_question', 'gift', 'tip')),
  amount_paid NUMERIC(10, 2) DEFAULT NULL,
  gift_data JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_livestream_chat_stream ON public.livestream_chat_messages (stream_id, created_at);

-- 14. Official Livestream Recordings Table
CREATE TABLE IF NOT EXISTS public.livestream_recordings (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL UNIQUE REFERENCES public.livestreams(id) ON DELETE CASCADE,
  creator_id TEXT NOT NULL,
  provider_video_uid TEXT DEFAULT NULL,
  file_url TEXT DEFAULT NULL,
  hls_url TEXT DEFAULT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'not_recorded' CHECK (status IN ('not_recorded', 'recording', 'processing', 'ready', 'unpublished', 'removed')),
  mode TEXT NOT NULL DEFAULT 'disabled' CHECK (mode IN ('disabled', 'free', 'paid')),
  price NUMERIC(10, 2) DEFAULT NULL,
  replay_permission TEXT NOT NULL DEFAULT 'public',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  views_count INTEGER NOT NULL DEFAULT 0,
  purchases_count INTEGER NOT NULL DEFAULT 0,
  gross_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Livestream Ticket & Replay Purchases
CREATE TABLE IF NOT EXISTS public.livestream_purchases (
  id TEXT PRIMARY KEY,
  stream_id TEXT NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  purchase_type TEXT NOT NULL CHECK (purchase_type IN ('ticket', 'replay')),
  amount NUMERIC(10, 2) NOT NULL,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_creator_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (stream_id, user_id, purchase_type)
);

-- 16. Private 1-on-1 Video Call Sessions
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  fan_id TEXT NOT NULL,
  creator_name TEXT NOT NULL DEFAULT '',
  creator_username TEXT NOT NULL DEFAULT '',
  creator_avatar TEXT NOT NULL DEFAULT '',
  fan_name TEXT NOT NULL DEFAULT '',
  fan_username TEXT NOT NULL DEFAULT '',
  fan_avatar TEXT NOT NULL DEFAULT '',
  rate_per_minute NUMERIC(10, 2) NOT NULL,
  spending_limit NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'calling' CHECK (status IN ('calling', 'ringing', 'accepted', 'connecting', 'connected', 'ended', 'declined', 'missed', 'failed')),
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  creator_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  billing_settled BOOLEAN NOT NULL DEFAULT FALSE,
  connection_error TEXT DEFAULT NULL,
  end_reason TEXT DEFAULT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ DEFAULT NULL,
  connected_at TIMESTAMPTZ DEFAULT NULL,
  ended_at TIMESTAMPTZ DEFAULT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_video_calls_participants ON public.video_call_sessions (creator_id, fan_id, status);

-- 17. Video Call Participants & Live Connection State
CREATE TABLE IF NOT EXISTS public.video_call_participants (
  call_id TEXT NOT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  participant_role TEXT NOT NULL CHECK (participant_role IN ('fan', 'creator')),
  connection_state TEXT NOT NULL DEFAULT 'new',
  camera_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  mic_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (call_id, user_id)
);

-- 18. Authoritative Video Call Billing Records (Idempotent Settlement Ledger)
CREATE TABLE IF NOT EXISTS public.video_call_billing_records (
  id TEXT PRIMARY KEY,
  call_id TEXT NOT NULL UNIQUE REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  fan_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  billed_seconds INTEGER NOT NULL DEFAULT 0,
  rate_per_minute NUMERIC(10, 2) NOT NULL,
  gross_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  platform_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  net_creator_earnings NUMERIC(10, 2) NOT NULL DEFAULT 0,
  idempotency_key TEXT NOT NULL UNIQUE,
  settled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. WebRTC / Streaming Provider Metadata
CREATE TABLE IF NOT EXISTS public.rtc_provider_metadata (
  id TEXT PRIMARY KEY,
  stream_id TEXT DEFAULT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
  call_id TEXT DEFAULT NULL REFERENCES public.video_call_sessions(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_uid TEXT DEFAULT NULL,
  protocol TEXT DEFAULT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all livestream & video call tables
ALTER TABLE public.livestreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_ingest_secrets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_viewer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.livestream_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_call_billing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rtc_provider_metadata ENABLE ROW LEVEL SECURITY;

-- Livestream RLS Policies
DROP POLICY IF EXISTS "Livestreams are readable" ON public.livestreams;
CREATE POLICY "Livestreams are readable"
  ON public.livestreams FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Approved creators can insert own livestreams" ON public.livestreams;
CREATE POLICY "Approved creators can insert own livestreams"
  ON public.livestreams FOR INSERT
  WITH CHECK (
    auth.uid()::text = creator_id
    AND EXISTS (
      SELECT 1 FROM public.users u WHERE u.uid = auth.uid() AND u.role = 'creator'
    )
  );

DROP POLICY IF EXISTS "Creators and admins update own livestreams" ON public.livestreams;
CREATE POLICY "Creators and admins update own livestreams"
  ON public.livestreams FOR UPDATE
  USING (auth.uid()::text = creator_id OR public.is_admin_or_moderator())
  WITH CHECK (auth.uid()::text = creator_id OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Host-only livestream ingest secrets" ON public.livestream_ingest_secrets;
CREATE POLICY "Host-only livestream ingest secrets"
  ON public.livestream_ingest_secrets FOR ALL
  USING (auth.uid()::text = creator_id OR public.is_admin_or_moderator())
  WITH CHECK (auth.uid()::text = creator_id OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Live chat readable and writable by participants" ON public.livestream_chat_messages;
CREATE POLICY "Live chat readable and writable by participants"
  ON public.livestream_chat_messages FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Authenticated users send own live chat" ON public.livestream_chat_messages;
CREATE POLICY "Authenticated users send own live chat"
  ON public.livestream_chat_messages FOR INSERT
  WITH CHECK (auth.uid()::text = sender_id);

-- Video Call RLS Policies (strict participant isolation)
DROP POLICY IF EXISTS "Video call participants view own calls" ON public.video_call_sessions;
CREATE POLICY "Video call participants view own calls"
  ON public.video_call_sessions FOR SELECT
  USING (auth.uid()::text = fan_id OR auth.uid()::text = creator_id OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Fans initiate video calls as themselves" ON public.video_call_sessions;
CREATE POLICY "Fans initiate video calls as themselves"
  ON public.video_call_sessions FOR INSERT
  WITH CHECK (auth.uid()::text = fan_id);

DROP POLICY IF EXISTS "Participants update own video calls" ON public.video_call_sessions;
CREATE POLICY "Participants update own video calls"
  ON public.video_call_sessions FOR UPDATE
  USING (auth.uid()::text = fan_id OR auth.uid()::text = creator_id OR public.is_admin_or_moderator());

DROP POLICY IF EXISTS "Participants view own billing records" ON public.video_call_billing_records;
CREATE POLICY "Participants view own billing records"
  ON public.video_call_billing_records FOR SELECT
  USING (auth.uid()::text = fan_id OR auth.uid()::text = creator_id OR public.is_admin_or_moderator());

-- Enable Realtime subscriptions for live broadcasts, chat, and incoming calls
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.livestreams;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_chat_messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_sessions;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;




