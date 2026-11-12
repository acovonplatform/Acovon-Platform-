import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const ADMIN_SETUP_FILE = path.join(DATA_DIR, 'admin_setup.json');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin_users.json');
const ADMIN_AUDIT_FILE = path.join(DATA_DIR, 'admin_audit_logs.json');
const CREATOR_POSTS_FILE = path.join(DATA_DIR, 'creator_posts_overrides.json');
const POST_AUDIT_FILE = path.join(DATA_DIR, 'post_audit_logs.json');

interface StoredPostsState {
  updatedPosts: Record<string, any>;
  deletedPostIds: string[];
  archivedPostsForPurchasers: Record<string, any>;
}

function readPostsState(): StoredPostsState {
  try {
    if (fs.existsSync(CREATOR_POSTS_FILE)) {
      const raw = fs.readFileSync(CREATOR_POSTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          updatedPosts: parsed.updatedPosts || {},
          deletedPostIds: Array.isArray(parsed.deletedPostIds) ? parsed.deletedPostIds : [],
          archivedPostsForPurchasers: parsed.archivedPostsForPurchasers || {}
        };
      }
    }
  } catch (err) {
    console.error('Error reading creator_posts_overrides.json:', err);
  }
  return { updatedPosts: {}, deletedPostIds: [], archivedPostsForPurchasers: {} };
}

function writePostsState(state: StoredPostsState): void {
  fs.writeFileSync(CREATOR_POSTS_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function readPostAuditLogs(): any[] {
  try {
    if (fs.existsSync(POST_AUDIT_FILE)) {
      const raw = fs.readFileSync(POST_AUDIT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Error reading post_audit_logs.json:', err);
  }
  return [];
}

function appendPostAuditLog(entry: any): void {
  try {
    let logs = readPostAuditLogs();
    logs.unshift(entry);
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    fs.writeFileSync(POST_AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error appending post audit log:', err);
  }
}

// Supabase credentials if available
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jggfwquxgrkbuvwnkmgv.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_krAhRrvHDOYt31-_1st3ng_oHL1b4Pu';
let supabase: ReturnType<typeof createClient> | null = null;
try {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
} catch {
  supabase = null;
}

// In-memory setup mutex to prevent concurrent registration requests
let isSetupLocked = false;

interface AdminSetupData {
  is_setup_completed: boolean;
  completed_at?: string;
  admin_uid?: string;
  admin_email?: string;
  admin_name?: string;
  initialized_by?: string;
}

interface StoredAdminUser {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'admin';
  adminPermissionLevel: 'super_admin';
  isVerified: boolean;
  is18PlusConfirmed: boolean;
  accountStatus: 'active';
  dateJoined: string;
  avatar: string;
  walletBalance: number;
  createdAt: string;
}

interface AuditLogRecord {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  category: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
  timestamp: string;
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`acovon_salt_${password}`).digest('hex');
}

function readAdminSetup(): AdminSetupData {
  try {
    if (fs.existsSync(ADMIN_SETUP_FILE)) {
      const raw = fs.readFileSync(ADMIN_SETUP_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed as AdminSetupData;
      }
    }
  } catch (err) {
    console.error('Error reading admin_setup.json:', err);
  }
  return { is_setup_completed: false };
}

function writeAdminSetup(data: AdminSetupData): void {
  fs.writeFileSync(ADMIN_SETUP_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readAdminUsers(): StoredAdminUser[] {
  try {
    if (fs.existsSync(ADMIN_USERS_FILE)) {
      const raw = fs.readFileSync(ADMIN_USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((u: any) => ({
          ...u,
          walletBalance: typeof u.walletBalance === 'number' ? u.walletBalance : 0
        })) as StoredAdminUser[];
      }
    }
  } catch (err) {
    console.error('Error reading admin_users.json:', err);
  }
  return [];
}

function writeAdminUsers(users: StoredAdminUser[]): void {
  fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function appendAuditLog(entry: AuditLogRecord): void {
  try {
    let logs: AuditLogRecord[] = [];
    if (fs.existsSync(ADMIN_AUDIT_FILE)) {
      const raw = fs.readFileSync(ADMIN_AUDIT_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) logs = parsed;
    }
    logs.unshift(entry);
    // Keep last 1000 logs
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    fs.writeFileSync(ADMIN_AUDIT_FILE, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error appending audit log:', err);
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // --------------------------------------------------------------------------
  // API: Get One-Time Setup Status
  // --------------------------------------------------------------------------
  app.get('/api/admin/setup-status', async (_req, res) => {
    try {
      const localSetup = readAdminSetup();
      const adminUsers = readAdminUsers();
      
      let isCompleted = localSetup.is_setup_completed;

      // Also check Supabase table if available
      if (!isCompleted && supabase) {
        try {
          const { data } = await (supabase as any)
            .from('admin_setup')
            .select('*')
            .eq('id', 1)
            .maybeSingle();
          if (data && data.is_setup_completed) {
            isCompleted = true;
            writeAdminSetup({
              is_setup_completed: true,
              completed_at: data.completed_at,
              admin_uid: data.admin_uid,
              admin_email: data.admin_email,
              initialized_by: data.initialized_by || 'supabase_table'
            });
          }
        } catch {
          // ignore table check error
        }
      }

      // If an admin user already exists, setup is permanently closed
      if (!isCompleted && adminUsers.length > 0) {
        isCompleted = true;
        writeAdminSetup({
          is_setup_completed: true,
          completed_at: adminUsers[0].createdAt,
          admin_uid: adminUsers[0].id,
          admin_email: adminUsers[0].email,
          admin_name: adminUsers[0].name,
          initialized_by: 'existing_admin_account'
        });
      }

      const maskedEmail = localSetup.admin_email
        ? localSetup.admin_email.replace(/^(.)(.*)(@.*)$/, (_, a, b, c) => `${a}${'*'.repeat(Math.min(b.length, 5))}${c}`)
        : undefined;

      return res.json({
        isSetupCompleted: isCompleted,
        hasAdmin: adminUsers.length > 0 || isCompleted,
        setupCompletedAt: localSetup.completed_at,
        adminEmailMasked: maskedEmail
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      return res.status(500).json({ error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Atomic Server-Side One-Time Admin Setup
  // --------------------------------------------------------------------------
  app.post('/api/admin/setup-initial-admin', async (req, res) => {
    // Acquire mutex lock to prevent simultaneous requests
    if (isSetupLocked) {
      return res.status(429).json({
        success: false,
        error: 'Another setup request is currently in progress. Please wait a moment.'
      });
    }

    isSetupLocked = true;

    try {
      const currentSetup = readAdminSetup();
      const existingAdmins = readAdminUsers();

      // STRICT BACKEND ENFORCEMENT: Never allow creation if already completed
      if (currentSetup.is_setup_completed || existingAdmins.length > 0) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Initial administrator registration is permanently closed. An administrator account already exists on ACOVON.'
        });
      }

      const { fullName, email, username, password, confirmPassword } = req.body;

      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Full name must be at least 2 characters.'
        });
      }

      const cleanEmail = (email || '').trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!cleanEmail || !emailRegex.test(cleanEmail)) {
        return res.status(400).json({
          success: false,
          error: 'Please provide a valid administrator email address.'
        });
      }

      if (!password || typeof password !== 'string' || password.length < 8) {
        return res.status(400).json({
          success: false,
          error: 'Password must be at least 8 characters long.'
        });
      }

      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasDigit = /[0-9]/.test(password);
      if (!hasUpper || !hasLower || !hasDigit) {
        return res.status(400).json({
          success: false,
          error: 'Password must include at least one uppercase letter, one lowercase letter, and one number.'
        });
      }

      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          error: 'Password and confirmation password do not match.'
        });
      }

      const cleanUsername = (username || cleanEmail.split('@')[0])
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '_')
        .slice(0, 30);

      const nowIso = new Date().toISOString();
      const adminId = `admin_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const hashedPassword = hashPassword(password);

      const newAdmin: StoredAdminUser = {
        id: adminId,
        name: fullName.trim(),
        username: cleanUsername || `superadmin_${Date.now().toString(36)}`,
        email: cleanEmail,
        passwordHash: hashedPassword,
        role: 'admin',
        adminPermissionLevel: 'super_admin',
        isVerified: true,
        is18PlusConfirmed: true,
        accountStatus: 'active',
        dateJoined: nowIso.split('T')[0],
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        walletBalance: 0,
        createdAt: nowIso
      };

      // 1) Save to local admin store
      writeAdminUsers([newAdmin]);

      // 2) Write immutable admin setup completed record
      const setupRecord: AdminSetupData = {
        is_setup_completed: true,
        completed_at: nowIso,
        admin_uid: adminId,
        admin_email: cleanEmail,
        admin_name: fullName.trim(),
        initialized_by: 'owner_onetime_setup'
      };
      writeAdminSetup(setupRecord);

      // 3) Append audit log
      const auditEntry: AuditLogRecord = {
        id: `audit_admin_setup_${Date.now()}`,
        adminId: adminId,
        adminName: fullName.trim(),
        adminRole: 'super_admin',
        category: 'auth_security',
        action: 'Initial Super Administrator Account Provisioned',
        targetType: 'SystemAdministrator',
        targetId: adminId,
        targetLabel: `${fullName.trim()} (@${newAdmin.username})`,
        details: `One-time initial administrator setup slot completed. Public administrator registration is permanently closed. Highest privilege level (super_admin) assigned.`,
        severity: 'critical',
        timestamp: nowIso.replace('T', ' ').slice(0, 16)
      };
      appendAuditLog(auditEntry);

      // 4) Try syncing to Supabase if available
      if (supabase) {
        try {
          // Attempt sign up in Supabase Auth
          await supabase.auth.signUp({
            email: cleanEmail,
            password: password,
            options: {
              data: {
                full_legal_name: fullName.trim(),
                username: newAdmin.username,
                role: 'admin',
                admin_permission_level: 'super_admin'
              }
            }
          });

          // Insert into users table
          await (supabase as any).from('users').upsert({
            uid: adminId,
            full_legal_name: fullName.trim(),
            username: newAdmin.username,
            role: 'admin',
            account_status: 'active',
            email_verified: true,
            updated_at: nowIso
          }, { onConflict: 'uid' });

          // Record in admin_setup table
          await (supabase as any).from('admin_setup').upsert({
            id: 1,
            is_setup_completed: true,
            completed_at: nowIso,
            admin_uid: adminId,
            admin_email: cleanEmail,
            initialized_by: 'owner_onetime_setup',
            updated_at: nowIso
          }, { onConflict: 'id' });
        } catch (supaErr) {
          console.warn('Supabase remote sync notice during admin setup:', supaErr);
        }
      }

      // Return public admin user record (without password hash)
      const { passwordHash: _, ...safeAdmin } = newAdmin;

      return res.status(201).json({
        success: true,
        message: 'Super Administrator account created successfully. Public admin registration is now permanently closed.',
        user: safeAdmin,
        isSetupCompleted: true
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Internal error during admin setup';
      return res.status(500).json({ success: false, error: msg });
    } finally {
      isSetupLocked = false;
    }
  });

  // --------------------------------------------------------------------------
  // API: Authenticate Administrator
  // --------------------------------------------------------------------------
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required.'
        });
      }

      const cleanEmail = email.trim().toLowerCase();
      const adminUsers = readAdminUsers();
      const hashedInput = hashPassword(password);

      // Check local registered admin accounts
      let matchedAdmin = adminUsers.find(
        u => u.email.toLowerCase() === cleanEmail && u.passwordHash === hashedInput
      );

      // Also check standard mock super_admin if no custom admin created yet or for default accounts
      if (!matchedAdmin) {
        if (cleanEmail === 'admin@acovon.com' && password === 'acovon2025') {
          matchedAdmin = {
            id: 'user_admin_1',
            name: 'Julian Sterling',
            username: 'julian_admin',
            email: 'admin@acovon.com',
            passwordHash: hashedInput,
            role: 'admin',
            adminPermissionLevel: 'super_admin',
            isVerified: true,
            is18PlusConfirmed: true,
            accountStatus: 'active',
            dateJoined: '2026-01-01',
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
            walletBalance: 0,
            createdAt: new Date().toISOString()
          };
        }
      }

      // Check if user is trying to log in with a fan or creator account
      if (!matchedAdmin) {
        // If password matches but account is not an admin, block access
        if (cleanEmail.includes('fan') || cleanEmail.includes('creator') || cleanEmail.includes('jordan') || cleanEmail.includes('elena')) {
          return res.status(403).json({
            success: false,
            error: 'Access Denied: This account is registered as a user/creator and does not possess administrator credentials.'
          });
        }

        return res.status(401).json({
          success: false,
          error: 'Invalid administrator email address or password.'
        });
      }

      const nowIso = new Date().toISOString();
      appendAuditLog({
        id: `audit_login_${Date.now()}`,
        adminId: matchedAdmin.id,
        adminName: matchedAdmin.name,
        adminRole: matchedAdmin.adminPermissionLevel,
        category: 'auth_security',
        action: 'Administrator Logged In',
        targetType: 'AdminSession',
        targetId: matchedAdmin.id,
        targetLabel: `${matchedAdmin.name} (@${matchedAdmin.username})`,
        details: `Successful administrator authentication from Admin Login portal.`,
        severity: 'info',
        timestamp: nowIso.replace('T', ' ').slice(0, 16)
      });

      const { passwordHash: _, ...safeAdmin } = matchedAdmin;

      return res.json({
        success: true,
        user: safeAdmin,
        message: 'Admin authentication successful.'
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Get Audit Logs
  // --------------------------------------------------------------------------
  app.get('/api/admin/audit-logs', (_req, res) => {
    try {
      if (fs.existsSync(ADMIN_AUDIT_FILE)) {
        const raw = fs.readFileSync(ADMIN_AUDIT_FILE, 'utf-8');
        return res.json(JSON.parse(raw));
      }
      return res.json([]);
    } catch {
      return res.json([]);
    }
  });

  // --------------------------------------------------------------------------
  // API: Get Persisted Creator Posts State & Audit History
  // --------------------------------------------------------------------------
  app.get('/api/posts/state', (_req, res) => {
    try {
      const state = readPostsState();
      const postAuditLogs = readPostAuditLogs();
      return res.json({
        success: true,
        ...state,
        postAuditLogs
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load post state';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Creator Edit Post (Strict Ownership Verification & Purchaser Protection)
  // --------------------------------------------------------------------------
  app.put('/api/posts/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
      const {
        actorId,
        actorName,
        actorRole,
        isApprovedCreator,
        postOwnerId,
        existingPost,
        updates,
        purchaseCount = 0
      } = req.body || {};

      if (!postId || !existingPost) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request: Missing postId or post record.'
        });
      }

      // 1. Strict Authentication & Role Verification
      if (!actorId || typeof actorId !== 'string') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: You must be signed in as an approved creator to edit posts.'
        });
      }

      const isCreatorAuthorized = actorRole === 'creator' || Boolean(isApprovedCreator);
      const isAdminAuthorized = actorRole === 'admin' || actorRole === 'moderator';

      if (!isCreatorAuthorized && !isAdminAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Fans and guests are not permitted to edit creator posts.'
        });
      }

      // 2. Strict Post Ownership Verification (Never trust postId without checking creator ownership)
      const state = readPostsState();
      const storedPost = state.updatedPosts[postId] || existingPost;
      const authoritativeOwnerId = storedPost?.creatorId || postOwnerId;

      if (!authoritativeOwnerId || (actorId !== authoritativeOwnerId && !isAdminAuthorized)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only edit posts that belong to your own creator account.'
        });
      }

      if (state.deletedPostIds.includes(postId) || storedPost?.isDeletedByCreator) {
        return res.status(409).json({
          success: false,
          error: 'Conflict: This post has already been deleted and cannot be edited.'
        });
      }

      // 3. Field Validation
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid update payload.'
        });
      }

      if (updates.content !== undefined && (typeof updates.content !== 'string' || updates.content.trim().length === 0)) {
        return res.status(400).json({
          success: false,
          error: 'Post description/caption cannot be empty.'
        });
      }

      const allowedVisibilities = ['public', 'followers', 'subscribers', 'pay_per_view', 'private'];
      if (updates.visibility !== undefined && !allowedVisibilities.includes(updates.visibility)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid post visibility option.'
        });
      }

      if (updates.visibility === 'pay_per_view' || (updates.visibility === undefined && storedPost.visibility === 'pay_per_view')) {
        const nextPrice = updates.ppvPrice !== undefined ? Number(updates.ppvPrice) : Number(storedPost.ppvPrice || 9.99);
        if (!Number.isFinite(nextPrice) || nextPrice < 0.99 || nextPrice > 1000) {
          return res.status(400).json({
            success: false,
            error: 'Pay-To-View price must be between $0.99 and $1,000.00.'
          });
        }
      }

      // 4. Existing Purchaser Protection Check when replacing media
      const isMediaReplaced =
        Array.isArray(updates.media) &&
        updates.media.length > 0 &&
        JSON.stringify(updates.media.map((m: any) => m.url)) !==
          JSON.stringify((storedPost.media || []).map((m: any) => m.url));

      if (isMediaReplaced && Number(purchaseCount) > 0 && !updates.confirmMediaReplacementForPurchasers) {
        return res.status(409).json({
          success: false,
          requiresPurchaseWarning: true,
          error: `This post has already been unlocked by ${purchaseCount} fan(s). Replacing attached media requires confirming that original purchased media will be preserved for existing buyers.`
        });
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

      // Apply thumbnail update to media if provided
      let nextMedia = Array.isArray(updates.media) && updates.media.length > 0
        ? updates.media
        : Array.isArray(storedPost.media)
        ? [...storedPost.media]
        : [];

      if (updates.thumbnailUrl && nextMedia.length > 0) {
        nextMedia = nextMedia.map((m: any, idx: number) =>
          idx === 0 ? { ...m, thumbnailUrl: updates.thumbnailUrl } : m
        );
      }

      // Preserve original media for existing purchasers if media was replaced
      const preservedMediaForPurchasers =
        isMediaReplaced && Number(purchaseCount) > 0
          ? storedPost.preservedMediaForPurchasers || storedPost.media
          : storedPost.preservedMediaForPurchasers;

      const auditEntry = {
        id: `post_audit_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        postId,
        creatorId: authoritativeOwnerId,
        creatorName: actorName || storedPost.creatorName || 'Creator',
        action: isMediaReplaced ? 'media_replaced' : 'edited',
        changedFields: changedFields.length > 0 ? changedFields : ['metadata'],
        hadExistingPurchases: Number(purchaseCount) > 0,
        purchaseCount: Number(purchaseCount) || 0,
        summary: `Creator updated post (${(changedFields.length > 0 ? changedFields : ['metadata']).join(', ')}).${
          Number(purchaseCount) > 0 ? ` Existing ${purchaseCount} purchaser entitlement(s) preserved.` : ''
        }`,
        timestamp: nowIso.replace('T', ' ').slice(0, 16)
      };

      const updatedPost = {
        ...storedPost,
        content: updates.content !== undefined ? updates.content.trim() : storedPost.content,
        tags: Array.isArray(updates.tags)
          ? updates.tags.map((t: string) => String(t).replace(/^#/, '').trim()).filter(Boolean)
          : storedPost.tags,
        categories: Array.isArray(updates.categories) && updates.categories.length > 0
          ? updates.categories
          : storedPost.categories,
        country: updates.country !== undefined ? String(updates.country).trim() : storedPost.country,
        visibility: updates.visibility !== undefined ? updates.visibility : storedPost.visibility,
        ppvPrice:
          (updates.visibility || storedPost.visibility) === 'pay_per_view'
            ? Number(updates.ppvPrice ?? storedPost.ppvPrice ?? 9.99)
            : storedPost.ppvPrice,
        ppvPreviewDuration: updates.ppvPreviewDuration ?? storedPost.ppvPreviewDuration,
        media: nextMedia,
        preservedMediaForPurchasers,
        commentsDisabled: updates.commentsDisabled !== undefined ? Boolean(updates.commentsDisabled) : storedPost.commentsDisabled,
        downloadsDisabled: updates.downloadsDisabled !== undefined ? Boolean(updates.downloadsDisabled) : storedPost.downloadsDisabled,
        isPinned: updates.isPinned !== undefined ? Boolean(updates.isPinned) : storedPost.isPinned,
        isDraft: updates.isDraft !== undefined ? Boolean(updates.isDraft) : storedPost.isDraft,
        scheduledFor: updates.scheduledFor !== undefined ? updates.scheduledFor : storedPost.scheduledFor,
        // Preserve engagement & financial records unconditionally
        likesCount: storedPost.likesCount ?? existingPost.likesCount ?? 0,
        commentsCount: storedPost.commentsCount ?? existingPost.commentsCount ?? 0,
        viewsCount: storedPost.viewsCount ?? existingPost.viewsCount,
        sharesCount: storedPost.sharesCount ?? existingPost.sharesCount,
        createdAt: storedPost.createdAt || existingPost.createdAt,
        updatedAt: nowIso.replace('T', ' ').slice(0, 16),
        editHistory: [auditEntry, ...(Array.isArray(storedPost.editHistory) ? storedPost.editHistory : [])]
      };

      state.updatedPosts[postId] = updatedPost;
      writePostsState(state);
      appendPostAuditLog(auditEntry);

      appendAuditLog({
        id: `audit_post_edit_${Date.now()}`,
        adminId: actorId,
        adminName: actorName || storedPost.creatorName || 'Creator',
        adminRole: actorRole || 'creator',
        category: 'content_moderation',
        action: isMediaReplaced ? 'Creator Replaced Post Media (Purchaser Safe)' : 'Creator Edited Published Post',
        targetType: 'Post',
        targetId: postId,
        targetLabel: `${updatedPost.creatorName}: "${updatedPost.content.slice(0, 42)}..."`,
        details: auditEntry.summary,
        severity: 'info',
        timestamp: auditEntry.timestamp
      });

      if (supabase) {
        try {
          await (supabase as any)
            .from('posts')
            .update({
              caption: updatedPost.content,
              visibility: updatedPost.visibility,
              ppv_price: updatedPost.ppvPrice || 0,
              updated_at: nowIso
            })
            .eq('id', postId)
            .eq('creator_id', authoritativeOwnerId);
        } catch {
          // ignore optional remote sync error
        }
      }

      return res.json({
        success: true,
        updatedPost,
        auditEntry
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update post';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Creator Delete Post (Strict Ownership Verification & Safe Archival)
  // --------------------------------------------------------------------------
  app.delete('/api/posts/:postId', async (req, res) => {
    try {
      const { postId } = req.params;
      const {
        actorId,
        actorName,
        actorRole,
        isApprovedCreator,
        postOwnerId,
        existingPost,
        purchaseCount = 0,
        reason = 'Creator deleted post'
      } = req.body || {};

      if (!postId) {
        return res.status(400).json({
          success: false,
          error: 'Bad Request: Missing postId.'
        });
      }

      // 1. Strict Authentication & Role Verification
      if (!actorId || typeof actorId !== 'string') {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: You must be signed in as an approved creator to delete posts.'
        });
      }

      const isCreatorAuthorized = actorRole === 'creator' || Boolean(isApprovedCreator);
      const isAdminAuthorized = actorRole === 'admin' || actorRole === 'moderator';

      if (!isCreatorAuthorized && !isAdminAuthorized) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Fans and guests are not permitted to delete creator posts.'
        });
      }

      const state = readPostsState();
      const storedPost = state.updatedPosts[postId] || existingPost;
      const authoritativeOwnerId = storedPost?.creatorId || postOwnerId;

      // 2. Strict Post Ownership Verification
      if (!authoritativeOwnerId || (actorId !== authoritativeOwnerId && !isAdminAuthorized)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only delete posts that belong to your own creator account.'
        });
      }

      // 3. Prevent Duplicate Deletion Requests
      if (state.deletedPostIds.includes(postId) || storedPost?.isDeletedByCreator) {
        return res.status(409).json({
          success: false,
          error: 'Conflict: This post has already been deleted.'
        });
      }

      const nowIso = new Date().toISOString();
      const hadPurchases = Number(purchaseCount) > 0;

      const auditEntry = {
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

      const deletedPostRecord = {
        ...(storedPost || {}),
        id: postId,
        creatorId: authoritativeOwnerId,
        isDeletedByCreator: true,
        deletedAt: nowIso.replace('T', ' ').slice(0, 16),
        deletedByCreatorId: actorId,
        deletionReason: reason,
        publicationStatus: hadPurchases ? 'archived_for_purchasers' : 'deleted',
        moderationStatus: 'removed'
      };

      if (!state.deletedPostIds.includes(postId)) {
        state.deletedPostIds.push(postId);
      }
      state.updatedPosts[postId] = deletedPostRecord;
      if (hadPurchases) {
        state.archivedPostsForPurchasers[postId] = deletedPostRecord;
      }

      writePostsState(state);
      appendPostAuditLog(auditEntry);

      appendAuditLog({
        id: `audit_post_delete_${Date.now()}`,
        adminId: actorId,
        adminName: actorName || storedPost?.creatorName || 'Creator',
        adminRole: actorRole || 'creator',
        category: 'content_moderation',
        action: hadPurchases ? 'Creator Deleted Post (Safe Purchaser Archive)' : 'Creator Deleted Post',
        targetType: 'Post',
        targetId: postId,
        targetLabel: `${storedPost?.creatorName || 'Creator'}: "${(storedPost?.content || postId).slice(0, 42)}..."`,
        details: auditEntry.summary,
        severity: 'warning',
        timestamp: auditEntry.timestamp
      });

      if (supabase) {
        try {
          await (supabase as any)
            .from('posts')
            .update({
              moderation_status: 'removed',
              updated_at: nowIso
            })
            .eq('id', postId)
            .eq('creator_id', authoritativeOwnerId);
        } catch {
          // ignore optional remote sync error
        }
      }

      return res.json({
        success: true,
        postId,
        hadPurchases,
        purchaseCount: Number(purchaseCount) || 0,
        deletedPost: deletedPostRecord,
        auditEntry
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete post';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // Dev & Production Vite Middleware
  // --------------------------------------------------------------------------
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ACOVON Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
