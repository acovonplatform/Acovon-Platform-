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

import {
  OFFICIAL_CATEGORIES,
  OFFICIAL_COUNTRIES,
  resolveCategoryRecord,
  resolveCountryRecord
} from './src/data/globalTaxonomy';
import {
  INITIAL_SUPPORTED_LANGUAGES,
  SupportedLanguageCode,
  detectTextLanguage,
  translateUserGeneratedText
} from './src/data/i18nData';
import { CategoryRecord, CountryRecord, UserTranslationPreferences } from './src/types';

const ADMIN_SETUP_FILE = path.join(DATA_DIR, 'admin_setup.json');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin_users.json');
const ADMIN_AUDIT_FILE = path.join(DATA_DIR, 'admin_audit_logs.json');
const CREATOR_POSTS_FILE = path.join(DATA_DIR, 'creator_posts_overrides.json');
const POST_AUDIT_FILE = path.join(DATA_DIR, 'post_audit_logs.json');
const TAXONOMY_DB_FILE = path.join(DATA_DIR, 'taxonomy_db.json');
const USER_TRANSLATION_SETTINGS_FILE = path.join(DATA_DIR, 'user_translation_settings.json');
const TRANSLATION_CACHE_FILE = path.join(DATA_DIR, 'translation_cache.json');

const VALID_LANGUAGE_CODES = new Set<string>(INITIAL_SUPPORTED_LANGUAGES.map(l => l.code));

function normalizeTranslationPreferenceRecord(
  userId: string,
  raw?: Partial<UserTranslationPreferences> | null
): UserTranslationPreferences {
  const prefLang =
    raw?.preferred_translation_language && VALID_LANGUAGE_CODES.has(raw.preferred_translation_language)
      ? raw.preferred_translation_language
      : 'en';
  const appLang =
    raw?.app_language && VALID_LANGUAGE_CODES.has(raw.app_language)
      ? raw.app_language
      : 'en';
  const appMode =
    raw?.app_language_mode === 'automatic' ||
    raw?.app_language_mode === 'manual' ||
    raw?.app_language_mode === 'english'
      ? raw.app_language_mode
      : 'manual';

  // CRITICAL RULE: platform_translation_enabled MUST be false unless explicitly saved as true
  const explicitlyEnabled =
    raw?.explicitly_saved === true && raw?.platform_translation_enabled === true;

  return {
    userId,
    preferred_translation_language: prefLang,
    platform_translation_enabled: explicitlyEnabled ? true : false,
    app_language: appLang,
    app_language_mode: appMode,
    explicitly_saved: Boolean(raw?.explicitly_saved),
    updated_at: raw?.updated_at || new Date().toISOString()
  };
}

function readUserTranslationSettingsDB(): Record<string, UserTranslationPreferences> {
  try {
    if (fs.existsSync(USER_TRANSLATION_SETTINGS_FILE)) {
      const raw = fs.readFileSync(USER_TRANSLATION_SETTINGS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const normalized: Record<string, UserTranslationPreferences> = {};
        for (const [uid, rec] of Object.entries(parsed)) {
          if (uid && rec && typeof rec === 'object') {
            normalized[uid] = normalizeTranslationPreferenceRecord(
              uid,
              rec as Partial<UserTranslationPreferences>
            );
          }
        }
        return normalized;
      }
    }
  } catch (err) {
    console.error('Error reading user_translation_settings.json:', err);
  }
  return {};
}

function writeUserTranslationSettingsDB(db: Record<string, UserTranslationPreferences>): void {
  fs.writeFileSync(USER_TRANSLATION_SETTINGS_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

interface StoredTranslationCacheEntry {
  cacheKey: string;
  contentRef: string;
  sourceLang: string;
  targetLang: string;
  originalTextHash: string;
  translatedText: string;
  cachedAt: string;
}

function readTranslationCacheDB(): Record<string, StoredTranslationCacheEntry> {
  try {
    if (fs.existsSync(TRANSLATION_CACHE_FILE)) {
      const raw = fs.readFileSync(TRANSLATION_CACHE_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading translation_cache.json:', err);
  }
  return {};
}

function writeTranslationCacheDB(cache: Record<string, StoredTranslationCacheEntry>): void {
  fs.writeFileSync(TRANSLATION_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
}

interface StoredTaxonomyDB {
  categories: CategoryRecord[];
  countries: CountryRecord[];
  creatorCountries: Record<string, { creator_id: string; creator_country_id: string; country_name: string; iso_code: string }>;
  postCountries: Record<string, { post_id: string; creator_id: string; video_country_id: string; country_name: string; iso_code: string }>;
  postCategories: Record<string, string[]>; // post_id -> category_id[]
}

function readTaxonomyDB(): StoredTaxonomyDB {
  try {
    if (fs.existsSync(TAXONOMY_DB_FILE)) {
      const raw = fs.readFileSync(TAXONOMY_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        // Deduplicate categories by id / name
        const existingCats: CategoryRecord[] = Array.isArray(parsed.categories) ? parsed.categories : [];
        const catMap = new Map<string, CategoryRecord>();
        OFFICIAL_CATEGORIES.forEach(c => catMap.set(c.id, { ...c }));
        existingCats.forEach(c => {
          if (c && c.id && c.name) {
            catMap.set(c.id, c);
          }
        });

        // Deduplicate countries by id / iso_code
        const existingCountries: CountryRecord[] = Array.isArray(parsed.countries) ? parsed.countries : [];
        const countryMap = new Map<string, CountryRecord>();
        OFFICIAL_COUNTRIES.forEach(c => countryMap.set(c.id, { ...c }));
        existingCountries.forEach(c => {
          if (c && c.id && c.iso_code) {
            const base = countryMap.get(c.id);
            countryMap.set(c.id, base ? { ...base, ...c } : c);
          }
        });

        return {
          categories: Array.from(catMap.values()).sort((a, b) => a.display_order - b.display_order),
          countries: Array.from(countryMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
          creatorCountries: parsed.creatorCountries || {},
          postCountries: parsed.postCountries || {},
          postCategories: parsed.postCategories || {}
        };
      }
    }
  } catch (err) {
    console.error('Error reading taxonomy_db.json:', err);
  }

  return {
    categories: [...OFFICIAL_CATEGORIES].sort((a, b) => a.display_order - b.display_order),
    countries: [...OFFICIAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    creatorCountries: {},
    postCountries: {},
    postCategories: {}
  };
}

function writeTaxonomyDB(db: StoredTaxonomyDB): void {
  fs.writeFileSync(TAXONOMY_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

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

      const taxonomyDb = readTaxonomyDB();
      const resolvedCategoriesInput =
        Array.isArray(updates.categories) && updates.categories.length > 0
          ? updates.categories
          : storedPost.categories || [];
      const matchedCatRecords: CategoryRecord[] = resolvedCategoriesInput
        .map((c: string) => resolveCategoryRecord(c, taxonomyDb.categories))
        .filter((r: CategoryRecord | undefined): r is CategoryRecord => Boolean(r));

      const nextCountryInput = updates.country !== undefined ? String(updates.country).trim() : storedPost.country;
      const resolvedVideoCountry =
        resolveCountryRecord(updates.video_country_id, taxonomyDb.countries) ||
        resolveCountryRecord(nextCountryInput, taxonomyDb.countries);

      const updatedPost = {
        ...storedPost,
        content: updates.content !== undefined ? updates.content.trim() : storedPost.content,
        tags: Array.isArray(updates.tags)
          ? updates.tags.map((t: string) => String(t).replace(/^#/, '').trim()).filter(Boolean)
          : storedPost.tags,
        categories:
          matchedCatRecords.length > 0
            ? matchedCatRecords.map((r: CategoryRecord) => r.name)
            : resolvedCategoriesInput,
        category_ids:
          matchedCatRecords.length > 0
            ? matchedCatRecords.map((r: CategoryRecord) => r.id)
            : storedPost.category_ids,
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

      // Update relational post_categories and postCountries tables without altering creator_country_id
      if (matchedCatRecords.length > 0) {
        taxonomyDb.postCategories[postId] = matchedCatRecords.map((r: CategoryRecord) => r.id);
      }
      if (resolvedVideoCountry) {
        taxonomyDb.postCountries[postId] = {
          post_id: postId,
          creator_id: authoritativeOwnerId,
          video_country_id: resolvedVideoCountry.id,
          country_name: resolvedVideoCountry.name,
          iso_code: resolvedVideoCountry.iso_code
        };
      }
      writeTaxonomyDB(taxonomyDb);

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
  // API: Global Categories & Countries Discovery Database State
  // --------------------------------------------------------------------------
  app.get('/api/taxonomy/state', (_req, res) => {
    try {
      const db = readTaxonomyDB();
      return res.json({
        success: true,
        categories: db.categories,
        countries: db.countries,
        creatorCountries: db.creatorCountries,
        postCountries: db.postCountries,
        postCategories: db.postCategories
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load taxonomy database';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Register Post Categories & Video Country on Post Creation
  // --------------------------------------------------------------------------
  app.post('/api/posts/register-taxonomy', (req, res) => {
    try {
      const {
        actorId,
        actorRole,
        isApprovedCreator,
        postId,
        creatorId,
        categories = [],
        videoCountry
      } = req.body || {};

      if (!actorId || (!isApprovedCreator && actorRole !== 'creator' && actorRole !== 'admin')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only approved creators can publish and tag post categories and video country.'
        });
      }

      if (!postId || !creatorId || actorId !== creatorId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Creator ownership mismatch.'
        });
      }

      if (!Array.isArray(categories) || categories.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'At least one official category is required.'
        });
      }

      if (!videoCountry || typeof videoCountry !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Video Country selection is required.'
        });
      }

      const db = readTaxonomyDB();
      const matchedCategories = categories
        .map((c: string) => resolveCategoryRecord(c, db.categories))
        .filter((r): r is CategoryRecord => Boolean(r && r.is_active));

      if (matchedCategories.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Selected categories must belong to the active official ACOVON category list.'
        });
      }

      const resolvedCountry = resolveCountryRecord(videoCountry, db.countries);
      if (!resolvedCountry || !resolvedCountry.is_active) {
        return res.status(400).json({
          success: false,
          error: 'Selected Video Country must be an active ISO country.'
        });
      }

      db.postCategories[postId] = matchedCategories.map(c => c.id);
      db.postCountries[postId] = {
        post_id: postId,
        creator_id: creatorId,
        video_country_id: resolvedCountry.id,
        country_name: resolvedCountry.name,
        iso_code: resolvedCountry.iso_code
      };

      writeTaxonomyDB(db);

      return res.json({
        success: true,
        postId,
        category_ids: db.postCategories[postId],
        categories: matchedCategories.map(c => c.name),
        video_country_id: resolvedCountry.id,
        country: resolvedCountry.name
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register post taxonomy';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Update Creator Country (Strictly Independent from Video Country)
  // --------------------------------------------------------------------------
  app.put('/api/creators/:creatorId/country', (req, res) => {
    try {
      const { creatorId } = req.params;
      const { actorId, actorName, actorRole, isApprovedCreator, country } = req.body || {};

      if (!actorId) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Authentication required.'
        });
      }

      const isAdmin = actorRole === 'admin' || actorRole === 'moderator';
      const isOwner = actorId === creatorId && (actorRole === 'creator' || Boolean(isApprovedCreator));

      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You can only update your own Creator Country.'
        });
      }

      const db = readTaxonomyDB();
      const resolvedCountry = resolveCountryRecord(country, db.countries);
      if (!resolvedCountry || !resolvedCountry.is_active) {
        return res.status(400).json({
          success: false,
          error: 'Please select a valid active country from the official ISO country database.'
        });
      }

      db.creatorCountries[creatorId] = {
        creator_id: creatorId,
        creator_country_id: resolvedCountry.id,
        country_name: resolvedCountry.name,
        iso_code: resolvedCountry.iso_code
      };
      writeTaxonomyDB(db);

      appendAuditLog({
        id: `audit_creator_country_${Date.now()}`,
        adminId: actorId,
        adminName: actorName || 'Creator',
        adminRole: actorRole || 'creator',
        category: 'creator_management',
        action: 'Updated Creator Profile Country',
        targetType: 'CreatorProfile',
        targetId: creatorId,
        targetLabel: `${creatorId} -> ${resolvedCountry.flag} ${resolvedCountry.name} (${resolvedCountry.iso_code})`,
        details: `Creator Country updated to ${resolvedCountry.name} (${resolvedCountry.iso_code}). Existing video countries remain independent.`,
        severity: 'info',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });

      return res.json({
        success: true,
        creatorId,
        creator_country_id: resolvedCountry.id,
        country: resolvedCountry.name,
        iso_code: resolvedCountry.iso_code,
        flag: resolvedCountry.flag
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update Creator Country';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Admin Add Official Category (No Duplicates Allowed)
  // --------------------------------------------------------------------------
  app.post('/api/admin/categories', (req, res) => {
    try {
      const { actorId, actorName, actorRole, name, description, image, display_order } = req.body || {};

      if (!actorId || (actorRole !== 'admin' && actorRole !== 'super_admin')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only administrators can add official platform categories.'
        });
      }

      const cleanName = typeof name === 'string' ? name.trim() : '';
      if (!cleanName || cleanName.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Category name must be at least 2 characters.'
        });
      }

      const db = readTaxonomyDB();
      const duplicate = db.categories.find(
        c => c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: `A category named "${duplicate.name}" already exists in the official database.`
        });
      }

      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const nextOrder =
        typeof display_order === 'number' && Number.isFinite(display_order)
          ? display_order
          : db.categories.length + 1;

      const newCategory: CategoryRecord = {
        id: `cat_${slug}_${Date.now().toString(36)}`,
        name: cleanName,
        slug,
        description:
          typeof description === 'string' && description.trim()
            ? description.trim()
            : `Curated ${cleanName} videos, creators, and exclusive vault releases on ACOVON.`,
        image:
          typeof image === 'string' && image.trim()
            ? image.trim()
            : '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
        is_active: true,
        display_order: nextOrder,
        created_at: new Date().toISOString().slice(0, 10)
      };

      db.categories.push(newCategory);
      db.categories.sort((a, b) => a.display_order - b.display_order);
      writeTaxonomyDB(db);

      appendAuditLog({
        id: `audit_cat_add_${Date.now()}`,
        adminId: actorId,
        adminName: actorName || 'Admin',
        adminRole: actorRole || 'admin',
        category: 'platform_config',
        action: 'Created Official Platform Category',
        targetType: 'Category',
        targetId: newCategory.id,
        targetLabel: newCategory.name,
        details: `Added official category "${newCategory.name}" (Display Order #${newCategory.display_order}).`,
        severity: 'info',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });

      return res.json({
        success: true,
        category: newCategory,
        categories: db.categories
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Admin Update Category (Edit Name, Description, Image, Active Status, Order)
  // --------------------------------------------------------------------------
  app.put('/api/admin/categories/:categoryId', (req, res) => {
    try {
      const { categoryId } = req.params;
      const { actorId, actorName, actorRole, updates } = req.body || {};

      if (!actorId || (actorRole !== 'admin' && actorRole !== 'super_admin')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only administrators can modify official platform categories.'
        });
      }

      const db = readTaxonomyDB();
      const idx = db.categories.findIndex(c => c.id === categoryId);
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          error: 'Category not found.'
        });
      }

      const existing = db.categories[idx];
      if (updates?.name && typeof updates.name === 'string') {
        const cleanName = updates.name.trim();
        const duplicate = db.categories.find(
          c => c.id !== categoryId && c.name.toLowerCase() === cleanName.toLowerCase()
        );
        if (duplicate) {
          return res.status(409).json({
            success: false,
            error: `Another category named "${duplicate.name}" already exists.`
          });
        }
      }

      const updated: CategoryRecord = {
        ...existing,
        name:
          updates?.name && typeof updates.name === 'string' && updates.name.trim()
            ? updates.name.trim()
            : existing.name,
        description:
          updates?.description !== undefined && typeof updates.description === 'string'
            ? updates.description.trim()
            : existing.description,
        image:
          updates?.image !== undefined && typeof updates.image === 'string' && updates.image.trim()
            ? updates.image.trim()
            : existing.image,
        is_active:
          updates?.is_active !== undefined ? Boolean(updates.is_active) : existing.is_active,
        display_order:
          updates?.display_order !== undefined && Number.isFinite(Number(updates.display_order))
            ? Number(updates.display_order)
            : existing.display_order,
        updated_at: new Date().toISOString().slice(0, 10)
      };

      db.categories[idx] = updated;
      db.categories.sort((a, b) => a.display_order - b.display_order);
      writeTaxonomyDB(db);

      appendAuditLog({
        id: `audit_cat_edit_${Date.now()}`,
        adminId: actorId,
        adminName: actorName || 'Admin',
        adminRole: actorRole || 'admin',
        category: 'platform_config',
        action: 'Updated Official Platform Category',
        targetType: 'Category',
        targetId: updated.id,
        targetLabel: updated.name,
        details: `Updated category "${updated.name}" (Active: ${updated.is_active}, Order: ${updated.display_order}). Existing posts preserved.`,
        severity: 'info',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });

      return res.json({
        success: true,
        category: updated,
        categories: db.categories
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Admin Activate / Deactivate Supported Country
  // --------------------------------------------------------------------------
  app.put('/api/admin/countries/:countryId', (req, res) => {
    try {
      const { countryId } = req.params;
      const { actorId, actorName, actorRole, is_active } = req.body || {};

      if (!actorId || (actorRole !== 'admin' && actorRole !== 'super_admin')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only administrators can activate or deactivate countries.'
        });
      }

      const db = readTaxonomyDB();
      const idx = db.countries.findIndex(
        c => c.id === countryId || c.iso_code.toLowerCase() === countryId.toLowerCase()
      );
      if (idx === -1) {
        return res.status(404).json({
          success: false,
          error: 'Country record not found.'
        });
      }

      db.countries[idx] = {
        ...db.countries[idx],
        is_active: Boolean(is_active)
      };
      writeTaxonomyDB(db);

      appendAuditLog({
        id: `audit_country_toggle_${Date.now()}`,
        adminId: actorId,
        adminName: actorName || 'Admin',
        adminRole: actorRole || 'admin',
        category: 'platform_config',
        action: db.countries[idx].is_active ? 'Activated Supported Country' : 'Deactivated Supported Country',
        targetType: 'Country',
        targetId: db.countries[idx].id,
        targetLabel: `${db.countries[idx].flag} ${db.countries[idx].name} (${db.countries[idx].iso_code})`,
        details: `Set country "${db.countries[idx].name}" status to ${db.countries[idx].is_active ? 'Active' : 'Inactive'}. Existing creator and video records preserved.`,
        severity: 'info',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
      });

      return res.json({
        success: true,
        country: db.countries[idx],
        countries: db.countries
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update country status';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: User Language & Platform Translation Settings (Per-User Independent)
  // --------------------------------------------------------------------------
  app.get('/api/translation/settings', (_req, res) => {
    try {
      const db = readUserTranslationSettingsDB();
      return res.json({
        success: true,
        settingsByUser: db
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load translation settings';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.get('/api/translation/settings/:userId', (req, res) => {
    try {
      const userId = (req.params.userId || '').trim();
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId' });
      }
      const db = readUserTranslationSettingsDB();
      const record = normalizeTranslationPreferenceRecord(userId, db[userId] || null);
      return res.json({
        success: true,
        settings: record
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load user translation settings';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.put('/api/translation/settings/:userId', (req, res) => {
    try {
      const userId = (req.params.userId || '').trim();
      if (!userId) {
        return res.status(400).json({ success: false, error: 'Missing userId' });
      }

      const {
        preferred_translation_language,
        platform_translation_enabled,
        app_language,
        app_language_mode
      } = req.body || {};

      const db = readUserTranslationSettingsDB();
      const existing = normalizeTranslationPreferenceRecord(userId, db[userId] || null);

      const nextPrefLang =
        typeof preferred_translation_language === 'string' &&
        VALID_LANGUAGE_CODES.has(preferred_translation_language)
          ? preferred_translation_language
          : existing.preferred_translation_language;

      const nextAppLang =
        typeof app_language === 'string' && VALID_LANGUAGE_CODES.has(app_language)
          ? app_language
          : existing.app_language;

      const nextAppMode =
        app_language_mode === 'automatic' ||
        app_language_mode === 'manual' ||
        app_language_mode === 'english'
          ? app_language_mode
          : existing.app_language_mode || 'manual';

      // CRITICAL: Never interpret a missing value as enabled.
      // Changing app_language or preferred_translation_language alone preserves existing platform_translation_enabled
      // (which defaults to false).
      const nextPlatformTranslationEnabled =
        typeof platform_translation_enabled === 'boolean'
          ? platform_translation_enabled
          : existing.explicitly_saved
          ? existing.platform_translation_enabled === true
          : false;

      const updated: UserTranslationPreferences = {
        userId,
        preferred_translation_language: nextPrefLang,
        platform_translation_enabled: nextPlatformTranslationEnabled,
        app_language: nextAppLang,
        app_language_mode: nextAppMode,
        explicitly_saved: true,
        updated_at: new Date().toISOString()
      };

      db[userId] = updated;
      writeUserTranslationSettingsDB(db);

      return res.json({
        success: true,
        settings: updated
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save user translation settings';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Secure Backend Content Translation & Caching Service
  // Caches translations by (contentRef, sourceLang, targetLang)
  // Never overwrites original creator content
  // --------------------------------------------------------------------------
  app.post('/api/translation/translate', (req, res) => {
    try {
      const { contentRef, text, sourceLang, targetLang } = req.body || {};
      const cleanText = typeof text === 'string' ? text.trim() : '';
      if (!cleanText) {
        return res.status(400).json({ success: false, error: 'Text is required for translation' });
      }

      const detectedSource = detectTextLanguage(cleanText);
      const resolvedSourceLang: SupportedLanguageCode =
        typeof sourceLang === 'string' && VALID_LANGUAGE_CODES.has(sourceLang)
          ? (sourceLang as SupportedLanguageCode)
          : detectedSource.code;

      const resolvedTargetLang: SupportedLanguageCode =
        typeof targetLang === 'string' && VALID_LANGUAGE_CODES.has(targetLang)
          ? (targetLang as SupportedLanguageCode)
          : 'en';

      const textHash = crypto.createHash('sha1').update(cleanText).digest('hex').slice(0, 16);
      const resolvedRef =
        typeof contentRef === 'string' && contentRef.trim()
          ? `${contentRef.trim()}_${textHash}`
          : `ref_${textHash}`;

      const cacheKey = `${resolvedRef}::${resolvedSourceLang}::${resolvedTargetLang}`;
      const cacheDB = readTranslationCacheDB();

      if (cacheDB[cacheKey] && cacheDB[cacheKey].originalTextHash === textHash) {
        return res.json({
          success: true,
          cached: true,
          cacheKey,
          contentRef: resolvedRef,
          detectedSourceLang: resolvedSourceLang,
          detectedSourceName: detectedSource.englishName,
          targetLang: resolvedTargetLang,
          translatedText: cacheDB[cacheKey].translatedText
        });
      }

      const translatedText = translateUserGeneratedText(
        cleanText,
        resolvedTargetLang,
        resolvedSourceLang
      );

      cacheDB[cacheKey] = {
        cacheKey,
        contentRef: resolvedRef,
        sourceLang: resolvedSourceLang,
        targetLang: resolvedTargetLang,
        originalTextHash: textHash,
        translatedText,
        cachedAt: new Date().toISOString()
      };

      // Bound cache size
      const keys = Object.keys(cacheDB);
      if (keys.length > 2000) {
        delete cacheDB[keys[0]];
      }
      writeTranslationCacheDB(cacheDB);

      return res.json({
        success: true,
        cached: false,
        cacheKey,
        contentRef: resolvedRef,
        detectedSourceLang: resolvedSourceLang,
        detectedSourceName: detectedSource.englishName,
        targetLang: resolvedTargetLang,
        translatedText
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Backend translation failed';
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
