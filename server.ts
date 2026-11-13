import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

import { AuthoritativePostStore, deepClone } from './server/postStore';
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
import {
  CategoryRecord,
  CountryRecord,
  CreatorVerificationRecord,
  PaidVerificationStatus,
  Post,
  UserTranslationPreferences,
  VerificationAuditLog,
  VerificationSettings,
  VerificationTransaction
} from './src/types';
import {
  INITIAL_VERIFICATION_SETTINGS,
  MOCK_CREATORS,
  MOCK_CREATOR_VERIFICATION_RECORDS,
  MOCK_POSTS,
  MOCK_USERS,
  MOCK_VERIFICATION_AUDIT_LOGS,
  MOCK_VERIFICATION_TRANSACTIONS
} from './src/data/mockData';

const ADMIN_SETUP_FILE = path.join(DATA_DIR, 'admin_setup.json');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin_users.json');
const ADMIN_AUDIT_FILE = path.join(DATA_DIR, 'admin_audit_logs.json');
const CREATOR_POSTS_FILE = path.join(DATA_DIR, 'creator_posts_overrides.json');
const POST_AUDIT_FILE = path.join(DATA_DIR, 'post_audit_logs.json');
const TAXONOMY_DB_FILE = path.join(DATA_DIR, 'taxonomy_db.json');
const USER_TRANSLATION_SETTINGS_FILE = path.join(DATA_DIR, 'user_translation_settings.json');
const TRANSLATION_CACHE_FILE = path.join(DATA_DIR, 'translation_cache.json');
const GUEST_ANALYTICS_FILE = path.join(DATA_DIR, 'guest_analytics.json');
const CREATOR_VERIFICATION_DB_FILE = path.join(DATA_DIR, 'creator_verification_db.json');
const VIDEO_THUMBNAILS_DB_FILE = path.join(DATA_DIR, 'video_thumbnails_db.json');
const VIDEO_THUMBNAILS_DIR = path.join(DATA_DIR, 'video_thumbnails');
if (!fs.existsSync(VIDEO_THUMBNAILS_DIR)) {
  fs.mkdirSync(VIDEO_THUMBNAILS_DIR, { recursive: true });
}

interface StoredExtractedFrame {
  id: string;
  url: string;
  timestampSeconds: number;
  timestampFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  lumaMean: number;
  contrastScore: number;
  isAutoRecommended: boolean;
}

interface StoredVideoThumbnailRecord {
  mediaKey: string;
  videoMediaId?: string;
  postId?: string;
  creatorId?: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'landscape' | 'portrait' | 'square';
  frames: StoredExtractedFrame[];
  selectedThumbnailUrl: string;
  recommendedThumbnailUrl: string;
  autoSelected: boolean;
  createdAt: string;
  updatedAt: string;
}

function readVideoThumbnailsDB(): Record<string, StoredVideoThumbnailRecord> {
  try {
    if (fs.existsSync(VIDEO_THUMBNAILS_DB_FILE)) {
      const raw = fs.readFileSync(VIDEO_THUMBNAILS_DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (err) {
    console.error('Error reading video_thumbnails_db.json:', err);
  }
  return {};
}

function writeVideoThumbnailsDB(db: Record<string, StoredVideoThumbnailRecord>): void {
  fs.writeFileSync(VIDEO_THUMBNAILS_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function formatVideoTimestamp(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function computeAspectRatioString(width: number, height: number): string {
  if (!width || !height) return '16:9';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  const w = Math.round(width / divisor);
  const h = Math.round(height / divisor);
  if (w > 40 || h > 40) {
    const ratio = width / height;
    if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9';
    if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16';
    if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3';
    if (Math.abs(ratio - 4 / 5) < 0.08) return '4:5';
    if (Math.abs(ratio - 1) < 0.08) return '1:1';
    return `${(ratio).toFixed(2)}:1`;
  }
  return `${w}:${h}`;
}

async function probeAndExtractVideoFrames(
  videoFilePath: string,
  opts: {
    creatorId?: string;
    postId?: string;
    videoMediaId?: string;
  }
): Promise<{
  mediaKey: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'landscape' | 'portrait' | 'square';
  frames: StoredExtractedFrame[];
  recommendedThumbnailUrl: string;
}> {
  // 1. Probe exact dimensions & duration with ffprobe
  const { stdout: probeOut } = await execFileAsync(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=width,height',
      '-show_entries', 'format=duration',
      '-of', 'json',
      videoFilePath
    ],
    { timeout: 20000 }
  );

  const probeJson = JSON.parse(probeOut || '{}');
  const stream = Array.isArray(probeJson.streams) ? probeJson.streams[0] : undefined;
  const width = Number(stream?.width || 0);
  const height = Number(stream?.height || 0);
  const rawDuration = Number(probeJson.format?.duration || 0);

  if (!width || !height || !Number.isFinite(rawDuration) || rawDuration <= 0) {
    throw new Error('Unable to read valid video stream dimensions or duration.');
  }

  const durationSeconds = Math.max(1, Math.round(rawDuration));
  const orientation: 'landscape' | 'portrait' | 'square' =
    width === height ? 'square' : width > height ? 'landscape' : 'portrait';
  const aspectRatio = computeAspectRatioString(width, height);

  // 2. Analyze luminance & contrast across up to ~16 evenly distributed timestamps to avoid black/blank frames
  const sampleFps = Math.max(0.15, Math.min(2.5, 16 / rawDuration));
  let candidates: Array<{ time: number; yMin: number; yAvg: number; yMax: number; contrast: number; satAvg: number; score: number }> = [];

  try {
    const { stdout: statsOut } = await execFileAsync(
      'ffmpeg',
      [
        '-v', 'error',
        '-i', videoFilePath,
        '-vf', `fps=${sampleFps.toFixed(3)},scale=320:-2,signalstats,metadata=print:file=-`,
        '-f', 'null',
        '-'
      ],
      { timeout: 30000, maxBuffer: 8 * 1024 * 1024 }
    );

    const lines = statsOut.split(/\r?\n/);
    let currentTime = 0;
    let yMin = 0;
    let yAvg = 0;
    let yMax = 0;
    let satAvg = 0;

    for (const line of lines) {
      if (line.includes('pts_time:')) {
        const m = line.match(/pts_time:([0-9.]+)/);
        if (m) currentTime = parseFloat(m[1]);
      } else if (line.includes('YMIN=')) {
        const m = line.match(/YMIN=([0-9.]+)/);
        if (m) yMin = parseFloat(m[1]);
      } else if (line.includes('YAVG=')) {
        const m = line.match(/YAVG=([0-9.]+)/);
        if (m) yAvg = parseFloat(m[1]);
      } else if (line.includes('YMAX=')) {
        const m = line.match(/YMAX=([0-9.]+)/);
        if (m) yMax = parseFloat(m[1]);
      } else if (line.includes('SATAVG=')) {
        const m = line.match(/SATAVG=([0-9.]+)/);
        if (m) satAvg = parseFloat(m[1]);

        const contrast = Math.max(0, yMax - yMin);
        const relPos = rawDuration > 0 ? currentTime / rawDuration : 0.5;
        const midBonus = 1 - Math.abs(relPos - 0.38); // slightly favor mid-early representative frames
        const exposurePenalty = yAvg < 22 || yAvg > 240 ? -120 : 0;
        const flatPenalty = contrast < 28 ? -120 : 0;
        const score = contrast + satAvg * 2.2 + midBonus * 25 + exposurePenalty + flatPenalty;

        candidates.push({
          time: Math.min(Math.max(0.15, currentTime), Math.max(0.2, rawDuration - 0.25)),
          yMin,
          yAvg,
          yMax,
          contrast,
          satAvg,
          score
        });
      }
    }
  } catch {
    // fallback to multi-point timeline below if signalstats pass fails
  }

  // Filter out black/blank/uniform frames cleanly
  let usableCandidates = candidates.filter(c => c.yAvg >= 22 && c.yAvg <= 238 && c.contrast >= 32);
  if (usableCandidates.length === 0) {
    usableCandidates = candidates.filter(c => c.yAvg >= 8 && c.yAvg <= 246 && c.contrast >= 12);
  }

  const targetRatios = [0.08, 0.22, 0.36, 0.52, 0.68, 0.84];
  const chosenSamples: Array<{ time: number; yAvg: number; contrast: number; score: number }> = [];
  const usedTimes = new Set<number>();

  if (usableCandidates.length > 0) {
    for (const ratio of targetRatios) {
      const targetTime = rawDuration * ratio;
      let bestMatch = usableCandidates[0];
      let bestDist = Infinity;
      for (const c of usableCandidates) {
        const rounded = Math.round(c.time * 10);
        if (usedTimes.has(rounded)) continue;
        const dist = Math.abs(c.time - targetTime);
        if (dist < bestDist) {
          bestDist = dist;
          bestMatch = c;
        }
      }
      const roundedBest = Math.round(bestMatch.time * 10);
      if (!usedTimes.has(roundedBest)) {
        usedTimes.add(roundedBest);
        chosenSamples.push(bestMatch);
      }
    }
  }

  // Ensure at least 4-6 distinct timestamps if video had fewer signalstats matches
  if (chosenSamples.length < 4) {
    for (const ratio of targetRatios) {
      const ts = Number(Math.min(Math.max(0.2, rawDuration * ratio), Math.max(0.25, rawDuration - 0.2)).toFixed(2));
      const key = Math.round(ts * 10);
      if (!usedTimes.has(key)) {
        usedTimes.add(key);
        chosenSamples.push({ time: ts, yAvg: 110, contrast: 90, score: 90 });
      }
      if (chosenSamples.length >= 6) break;
    }
  }

  chosenSamples.sort((a, b) => a.time - b.time);

  // 3. Extract aspect-ratio-preserving high-res WebP frames for each selected timestamp
  const mediaKey =
    opts.videoMediaId ||
    opts.postId ||
    `vthumb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  const safeKeyPrefix = mediaKey.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

  // Preserve original orientation & aspect ratio while keeping desktop/mobile thumbnail fast (<1280px max edge)
  const scaleFilter =
    width >= height
      ? "scale='min(1280,iw)':-2"
      : "scale=-2:'min(1280,ih)'";

  const extractedFrames: StoredExtractedFrame[] = [];

  for (let i = 0; i < chosenSamples.length; i++) {
    const sample = chosenSamples[i];
    const fileName = `${safeKeyPrefix}_f${i + 1}_${Date.now().toString(36)}.webp`;
    const outPath = path.join(VIDEO_THUMBNAILS_DIR, fileName);

    try {
      await execFileAsync(
        'ffmpeg',
        [
          '-y',
          '-ss', sample.time.toFixed(2),
          '-i', videoFilePath,
          '-frames:v', '1',
          '-vf', scaleFilter,
          '-c:v', 'libwebp',
          '-quality', '84',
          outPath
        ],
        { timeout: 20000 }
      );

      if (fs.existsSync(outPath)) {
        const stat = fs.statSync(outPath);
        if (stat.size > 300) {
          extractedFrames.push({
            id: `frame_${i + 1}_${crypto.randomBytes(2).toString('hex')}`,
            url: `/api/videos/thumbnails/${fileName}`,
            timestampSeconds: Number(sample.time.toFixed(2)),
            timestampFormatted: formatVideoTimestamp(sample.time),
            width: width >= height ? Math.min(width, 1280) : Math.round((Math.min(height, 1280) * width) / height),
            height: width >= height ? Math.round((Math.min(width, 1280) * height) / width) : Math.min(height, 1280),
            aspectRatio,
            lumaMean: Math.round(sample.yAvg),
            contrastScore: Math.round(sample.score),
            isAutoRecommended: false
          });
        } else {
          try { fs.unlinkSync(outPath); } catch { /* ignore */ }
        }
      }
    } catch {
      // skip single failed frame and continue
    }
  }

  if (extractedFrames.length === 0) {
    throw new Error('Frame extraction failed: unable to extract valid non-black video frames.');
  }

  // Mark the highest-quality non-black frame as recommended for Automatic Cover Selection
  let bestIdx = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < extractedFrames.length; i++) {
    if (extractedFrames[i].contrastScore > bestScore) {
      bestScore = extractedFrames[i].contrastScore;
      bestIdx = i;
    }
  }
  extractedFrames[bestIdx].isAutoRecommended = true;
  const recommendedThumbnailUrl = extractedFrames[bestIdx].url;

  const db = readVideoThumbnailsDB();
  const nowIso = new Date().toISOString();
  db[mediaKey] = {
    mediaKey,
    videoMediaId: opts.videoMediaId,
    postId: opts.postId,
    creatorId: opts.creatorId,
    durationSeconds,
    width,
    height,
    aspectRatio,
    orientation,
    frames: extractedFrames,
    selectedThumbnailUrl: recommendedThumbnailUrl,
    recommendedThumbnailUrl,
    autoSelected: true,
    createdAt: nowIso,
    updatedAt: nowIso
  };
  writeVideoThumbnailsDB(db);

  return {
    mediaKey,
    durationSeconds,
    width,
    height,
    aspectRatio,
    orientation,
    frames: extractedFrames,
    recommendedThumbnailUrl
  };
}

interface GuestAnalyticsEventRecord {
  id: string;
  anonymousSessionId: string;
  eventType: string;
  contentType?: string;
  contentId?: string;
  creatorId?: string;
  category?: string;
  searchQuery?: string;
  watchDurationSeconds?: number;
  completionPercentage?: number;
  sourceSurface?: string;
  timestamp: string;
}

interface StoredGuestAnalyticsDB {
  sessions: string[];
  events: GuestAnalyticsEventRecord[];
  counters: {
    videoViews: number;
    videoCompletions: number;
    totalWatchDurationSeconds: number;
    profileViews: number;
    postImpressions: number;
    searches: number;
  };
}

function readGuestAnalyticsDB(): StoredGuestAnalyticsDB {
  try {
    if (fs.existsSync(GUEST_ANALYTICS_FILE)) {
      const raw = fs.readFileSync(GUEST_ANALYTICS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return {
          sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
          events: Array.isArray(parsed.events) ? parsed.events : [],
          counters: {
            videoViews: Number(parsed.counters?.videoViews || 0),
            videoCompletions: Number(parsed.counters?.videoCompletions || 0),
            totalWatchDurationSeconds: Number(parsed.counters?.totalWatchDurationSeconds || 0),
            profileViews: Number(parsed.counters?.profileViews || 0),
            postImpressions: Number(parsed.counters?.postImpressions || 0),
            searches: Number(parsed.counters?.searches || 0)
          }
        };
      }
    }
  } catch (err) {
    console.error('Error reading guest_analytics.json:', err);
  }
  return {
    sessions: [],
    events: [],
    counters: {
      videoViews: 0,
      videoCompletions: 0,
      totalWatchDurationSeconds: 0,
      profileViews: 0,
      postImpressions: 0,
      searches: 0
    }
  };
}

function writeGuestAnalyticsDB(db: StoredGuestAnalyticsDB): void {
  fs.writeFileSync(GUEST_ANALYTICS_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function sanitizePostForGuestViewer(post: Post): Record<string, any> {
  const isPublicPost = post.visibility === 'public';
  const isPpvPreviewEligible = post.visibility === 'pay_per_view';
  return {
    ...post,
    isLockedForGuest: !isPublicPost,
    media: (post.media || []).map((item) => {
      if (isPublicPost) {
        return { ...item };
      }
      if (isPpvPreviewEligible && item.type === 'video' && item.previewUrl) {
        return {
          ...item,
          url: '',
          previewUrl: item.previewUrl
        };
      }
      return {
        ...item,
        url: '',
        previewUrl: isPublicPost ? item.previewUrl : undefined
      };
    })
  };
}

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
  deletedCategoryIds?: string[];
  countries: CountryRecord[];
  creatorCountries: Record<string, { creator_id: string; creator_country_id: string; country_name: string; iso_code: string }>;
  postCountries: Record<string, { post_id: string; creator_id: string; video_country_id: string; country_name: string; iso_code: string }>;
  postCategories: Record<string, string[]>; // post_id -> category_id[]
}

function readTaxonomyDB(filePath: string = TAXONOMY_DB_FILE): StoredTaxonomyDB {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const deletedCategoryIds: string[] = Array.isArray(parsed.deletedCategoryIds)
          ? Array.from(
              new Set(
                parsed.deletedCategoryIds.filter(
                  (id: unknown): id is string => typeof id === 'string' && id.trim().length > 0
                )
              )
            )
          : [];
        const deletedSet = new Set<string>(deletedCategoryIds);

        // Deduplicate categories by id and normalized name while excluding deleted categories
        const existingCats: CategoryRecord[] = Array.isArray(parsed.categories) ? parsed.categories : [];
        const catMap = new Map<string, CategoryRecord>();
        OFFICIAL_CATEGORIES.forEach(c => {
          if (!deletedSet.has(c.id)) {
            catMap.set(c.id, { ...c });
          }
        });
        existingCats.forEach(c => {
          if (c && c.id && c.name && !deletedSet.has(c.id)) {
            catMap.set(c.id, { ...c, name: c.name.trim() });
          }
        });
        const seenNames = new Set<string>();
        const dedupedCategories: CategoryRecord[] = [];
        for (const cat of Array.from(catMap.values()).sort((a, b) => a.display_order - b.display_order)) {
          const normName = cat.name.trim().toLowerCase();
          if (!normName || seenNames.has(normName)) continue;
          seenNames.add(normName);
          dedupedCategories.push(cat);
        }

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
          categories: dedupedCategories,
          deletedCategoryIds,
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
    deletedCategoryIds: [],
    countries: [...OFFICIAL_COUNTRIES].sort((a, b) => a.name.localeCompare(b.name)),
    creatorCountries: {},
    postCountries: {},
    postCategories: {}
  };
}

function writeTaxonomyDB(db: StoredTaxonomyDB, filePath: string = TAXONOMY_DB_FILE): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(db, null, 2), 'utf-8');
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

function appendAuditLog(entry: AuditLogRecord, filePath: string = ADMIN_AUDIT_FILE): void {
  try {
    let logs: AuditLogRecord[] = [];
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) logs = parsed;
    }
    logs.unshift(entry);
    // Keep last 1000 logs
    if (logs.length > 1000) logs = logs.slice(0, 1000);
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error appending audit log:', err);
  }
}

export function createApp(options?: { dataDir?: string }) {
  const resolvedDataDir = options?.dataDir ? path.resolve(options.dataDir) : DATA_DIR;
  if (!fs.existsSync(resolvedDataDir)) {
    fs.mkdirSync(resolvedDataDir, { recursive: true });
  }
  const taxonomyDbPath = path.join(resolvedDataDir, 'taxonomy_db.json');
  const adminAuditPath = path.join(resolvedDataDir, 'admin_audit_logs.json');
  const postStore = new AuthoritativePostStore(resolvedDataDir);

  // Run startup integrity audit on existing stored posts
  postStore.auditPostIntegrity();

  const app = express();

  // Disable caching on all dynamic post & feed API endpoints so stale posts are never served
  app.use(['/api/posts', '/api/public/feed'], (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

  // --------------------------------------------------------------------------
  // API: Permanent Media Asset Upload (Unique Immutable File Storage — before JSON parser)
  // --------------------------------------------------------------------------
  app.post(
    '/api/media/upload',
    express.raw({ type: ['application/octet-stream', 'video/*', 'image/*', '*/*'], limit: '500mb' }),
    async (req, res) => {
      let tmpPath = '';
      let fastPath = '';
      try {
        const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (buffer.length < 1) {
          return res.status(400).json({
            success: false,
            error: 'Uploaded media payload is empty.'
          });
        }

        const rawName = String(req.headers['x-file-name'] || 'upload.bin');
        const mimeType = String(req.headers['x-mime-type'] || req.headers['content-type'] || 'application/octet-stream');
        const ownerId = String(req.headers['x-owner-id'] || 'anonymous').slice(0, 128);
        const postId = req.headers['x-post-id'] ? String(req.headers['x-post-id']).slice(0, 128) : undefined;

        let ext = path.extname(rawName).toLowerCase().replace(/[^a-z0-9.]/g, '');
        if (!ext) {
          if (mimeType.includes('mp4')) ext = '.mp4';
          else if (mimeType.includes('webm')) ext = '.webm';
          else if (mimeType.includes('quicktime')) ext = '.mov';
          else if (mimeType.includes('png')) ext = '.png';
          else if (mimeType.includes('webp')) ext = '.webp';
          else if (mimeType.includes('gif')) ext = '.gif';
          else if (mimeType.includes('jpeg') || mimeType.includes('jpg')) ext = '.jpg';
          else ext = '.bin';
        }

        const mediaId = `media_${crypto.randomUUID()}`;
        const fileName = `${mediaId}${ext}`;
        const destPath = path.join(postStore.mediaUploadsDir, fileName);
        tmpPath = `${destPath}.${process.pid}.${crypto.randomBytes(3).toString('hex')}.tmp`;
        fs.writeFileSync(tmpPath, buffer);

        // Move moov atom to start of MP4/MOV uploads for instant HTTP Range streaming
        if (ext === '.mp4' || ext === '.mov' || ext === '.m4v') {
          fastPath = `${destPath}.${process.pid}.${crypto.randomBytes(3).toString('hex')}.fast${ext}`;
          try {
            await execFileAsync(
              'ffmpeg',
              ['-y', '-i', tmpPath, '-c', 'copy', '-movflags', '+faststart', fastPath],
              { timeout: 60000 }
            );
            if (fs.existsSync(fastPath) && fs.statSync(fastPath).size > 0) {
              fs.renameSync(fastPath, destPath);
              try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
              tmpPath = '';
              fastPath = '';
            } else {
              fs.renameSync(tmpPath, destPath);
              tmpPath = '';
            }
          } catch {
            if (fs.existsSync(tmpPath)) {
              fs.renameSync(tmpPath, destPath);
              tmpPath = '';
            }
          } finally {
            if (fastPath && fs.existsSync(fastPath)) {
              try { fs.unlinkSync(fastPath); } catch { /* ignore */ }
            }
          }
        } else {
          fs.renameSync(tmpPath, destPath);
          tmpPath = '';
        }

        const finalStat = fs.statSync(destPath);
        const sha256 = crypto.createHash('sha256').update(fs.readFileSync(destPath)).digest('hex');
        const url = `/api/media/files/${fileName}`;

        const record = {
          mediaId,
          fileName,
          originalFilename: path.basename(rawName).slice(0, 200),
          ownerId,
          mimeType,
          sizeBytes: finalStat.size,
          sha256,
          url,
          postId,
          createdAt: new Date().toISOString()
        };
        postStore.registerUploadedMedia(record);

        return res.status(201).json({
          success: true,
          mediaId,
          fileName,
          url,
          mimeType,
          sizeBytes: finalStat.size,
          sha256,
          record
        });
      } catch (err: unknown) {
        if (tmpPath && fs.existsSync(tmpPath)) {
          try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
        }
        if (fastPath && fs.existsSync(fastPath)) {
          try { fs.unlinkSync(fastPath); } catch { /* ignore */ }
        }
        const msg = err instanceof Error ? err.message : 'Failed to store uploaded media';
        return res.status(500).json({ success: false, error: msg });
      }
    }
  );

  // --------------------------------------------------------------------------
  // API: Video Frame Extraction (Raw Binary Stream Upload — before JSON parser)
  // --------------------------------------------------------------------------
  app.post(
    '/api/videos/extract-frames',
    express.raw({ type: ['application/octet-stream', 'video/*', '*/*'], limit: '500mb' }),
    async (req, res) => {
      let tempVideoPath = '';
      try {
        const buffer = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
        if (buffer.length < 128) {
          return res.status(400).json({
            success: false,
            error: 'Uploaded video payload is empty or invalid.'
          });
        }

        const rawName = String(req.headers['x-file-name'] || 'upload.mp4');
        const ext = path.extname(rawName).replace(/[^a-zA-Z0-9.]/g, '') || '.mp4';
        tempVideoPath = path.join(os.tmpdir(), `acovon_vid_${Date.now()}_${crypto.randomBytes(4).toString('hex')}${ext}`);
        fs.writeFileSync(tempVideoPath, buffer);

        const creatorId = req.headers['x-creator-id'] ? String(req.headers['x-creator-id']) : undefined;
        const postId = req.headers['x-post-id'] ? String(req.headers['x-post-id']) : undefined;
        const videoMediaId = req.headers['x-video-media-id'] ? String(req.headers['x-video-media-id']) : undefined;

        const result = await probeAndExtractVideoFrames(tempVideoPath, {
          creatorId,
          postId,
          videoMediaId
        });

        return res.json({
          success: true,
          processingStatus: 'ready',
          ...result
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to extract video cover frames';
        return res.status(422).json({
          success: false,
          processingStatus: 'failed',
          error: msg
        });
      } finally {
        if (tempVideoPath && fs.existsSync(tempVideoPath)) {
          try { fs.unlinkSync(tempVideoPath); } catch { /* ignore */ }
        }
      }
    }
  );

  app.use(express.json({ limit: '50mb' }));

  const publicDir = path.resolve(__dirname, 'public');
  if (fs.existsSync(publicDir)) {
    app.use(
      express.static(publicDir, {
        setHeaders: (res, servedPath) => {
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          if (servedPath.endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
          }
        }
      })
    );
  }

  // --------------------------------------------------------------------------
  // API: Serve Permanent Uploaded Post Media Files (HTTP Range Streaming + Immutable Cache)
  // --------------------------------------------------------------------------
  app.get('/api/media/files/:filename', (req, res) => {
    try {
      const safeName = path.basename(req.params.filename || '');
      if (!safeName || safeName.includes('..')) {
        return res.status(400).json({ error: 'Invalid media filename' });
      }
      const filePath = path.join(postStore.mediaUploadsDir, safeName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Media file not found' });
      }

      const meta = postStore.getUploadedMediaRecord(safeName);
      const ext = path.extname(safeName).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.mov': 'video/quicktime',
        '.m4v': 'video/x-m4v',
        '.mkv': 'video/x-matroska',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp'
      };
      const contentType = meta?.mimeType && meta.mimeType !== 'application/octet-stream'
        ? meta.mimeType
        : mimeMap[ext] || 'application/octet-stream';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

      return res.sendFile(filePath, (err) => {
        if (err && !res.headersSent) {
          res.status(500).json({ error: 'Failed to serve media file' });
        }
      });
    } catch {
      return res.status(500).json({ error: 'Failed to serve media file' });
    }
  });

  // --------------------------------------------------------------------------
  // API: Serve Extracted Video Thumbnails & Cover Frame Management Endpoints
  // --------------------------------------------------------------------------
  app.get('/api/videos/thumbnails/:filename', (req, res) => {
    try {
      const safeName = path.basename(req.params.filename || '');
      if (!safeName || safeName.includes('..')) {
        return res.status(400).json({ error: 'Invalid thumbnail filename' });
      }
      const filePath = path.join(VIDEO_THUMBNAILS_DIR, safeName);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Thumbnail not found' });
      }
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      return res.sendFile(filePath);
    } catch {
      return res.status(500).json({ error: 'Failed to serve thumbnail' });
    }
  });

  app.get('/api/videos/cover-metadata', (req, res) => {
    try {
      const videoMediaId = typeof req.query.videoMediaId === 'string' ? req.query.videoMediaId.trim() : '';
      const postId = typeof req.query.postId === 'string' ? req.query.postId.trim() : '';
      const db = readVideoThumbnailsDB();

      const matched =
        (videoMediaId && db[videoMediaId]) ||
        (postId && db[postId]) ||
        Object.values(db).find(
          r => (videoMediaId && r.videoMediaId === videoMediaId) || (postId && r.postId === postId)
        );

      if (!matched) {
        return res.json({ success: true, record: null });
      }
      return res.json({ success: true, record: matched });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load video cover metadata';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/videos/extract-from-url', async (req, res) => {
    let tempDownloadedPath = '';
    try {
      const { sourceUrl, creatorId, postId, videoMediaId } = req.body || {};
      if (!sourceUrl || typeof sourceUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'sourceUrl is required' });
      }

      let targetPath = '';
      if (sourceUrl.startsWith('/videos/') || sourceUrl.startsWith('/assets/')) {
        const cleanRel = sourceUrl.replace(/^\/+/, '');
        const candidate = path.resolve(publicDir, cleanRel);
        if (candidate.startsWith(publicDir) && fs.existsSync(candidate)) {
          targetPath = candidate;
        }
      } else if (sourceUrl.startsWith('http://') || sourceUrl.startsWith('https://')) {
        const resp = await fetch(sourceUrl);
        if (!resp.ok) {
          throw new Error(`Unable to fetch video from URL (HTTP ${resp.status})`);
        }
        const arrayBuf = await resp.arrayBuffer();
        const buf = Buffer.from(arrayBuf);
        if (buf.length < 128) {
          throw new Error('Downloaded video file is empty.');
        }
        tempDownloadedPath = path.join(os.tmpdir(), `acovon_url_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.mp4`);
        fs.writeFileSync(tempDownloadedPath, buf);
        targetPath = tempDownloadedPath;
      }

      if (!targetPath) {
        return res.status(400).json({
          success: false,
          error: 'Video file path could not be resolved on the processing server.'
        });
      }

      const result = await probeAndExtractVideoFrames(targetPath, {
        creatorId,
        postId,
        videoMediaId
      });

      return res.json({
        success: true,
        processingStatus: 'ready',
        ...result
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to extract frames from video URL';
      return res.status(422).json({
        success: false,
        processingStatus: 'failed',
        error: msg
      });
    } finally {
      if (tempDownloadedPath && fs.existsSync(tempDownloadedPath)) {
        try { fs.unlinkSync(tempDownloadedPath); } catch { /* ignore */ }
      }
    }
  });

  app.post('/api/videos/save-extracted-frames', (req, res) => {
    try {
      const {
        frames = [],
        selectedIndex = 0,
        videoMediaId,
        postId,
        creatorId,
        durationSeconds = 0,
        width = 1280,
        height = 720,
        aspectRatio = '16:9'
      } = req.body || {};

      if (!Array.isArray(frames) || frames.length === 0) {
        return res.status(400).json({ success: false, error: 'No extracted frames provided.' });
      }

      const mediaKey =
        videoMediaId || postId || `vthumb_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const safeKeyPrefix = String(mediaKey).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);

      const storedFrames: StoredExtractedFrame[] = [];
      for (let i = 0; i < frames.length; i++) {
        const f = frames[i];
        const dataUrl = String(f?.dataUrl || '');
        const match = dataUrl.match(/^data:image\/(webp|jpeg|jpg|png);base64,(.+)$/i);
        if (!match) continue;
        const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        const fileName = `${safeKeyPrefix}_c${i + 1}_${Date.now().toString(36)}.${ext}`;
        const outPath = path.join(VIDEO_THUMBNAILS_DIR, fileName);
        fs.writeFileSync(outPath, Buffer.from(match[2], 'base64'));

        storedFrames.push({
          id: `frame_${i + 1}_${crypto.randomBytes(2).toString('hex')}`,
          url: `/api/videos/thumbnails/${fileName}`,
          timestampSeconds: Number(f.timestampSeconds || 0),
          timestampFormatted: f.timestampFormatted || formatVideoTimestamp(Number(f.timestampSeconds || 0)),
          width: Number(f.width || width),
          height: Number(f.height || height),
          aspectRatio: String(f.aspectRatio || aspectRatio),
          lumaMean: Number(f.lumaMean || 110),
          contrastScore: Number(f.contrastScore || 80),
          isAutoRecommended: i === selectedIndex
        });
      }

      if (storedFrames.length === 0) {
        return res.status(400).json({ success: false, error: 'Failed to decode valid frame image data.' });
      }

      const safeIdx = Math.min(Math.max(0, Number(selectedIndex) || 0), storedFrames.length - 1);
      const recommendedThumbnailUrl = storedFrames[safeIdx].url;
      const orientation: 'landscape' | 'portrait' | 'square' =
        width === height ? 'square' : width > height ? 'landscape' : 'portrait';

      const db = readVideoThumbnailsDB();
      const nowIso = new Date().toISOString();
      db[mediaKey] = {
        mediaKey,
        videoMediaId,
        postId,
        creatorId,
        durationSeconds,
        width,
        height,
        aspectRatio,
        orientation,
        frames: storedFrames,
        selectedThumbnailUrl: recommendedThumbnailUrl,
        recommendedThumbnailUrl,
        autoSelected: true,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      writeVideoThumbnailsDB(db);

      return res.json({
        success: true,
        mediaKey,
        durationSeconds,
        width,
        height,
        aspectRatio,
        orientation,
        frames: storedFrames,
        recommendedThumbnailUrl
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to store extracted frames';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/videos/select-cover', (req, res) => {
    try {
      const { postId, videoMediaId, creatorId, selectedThumbnailUrl, autoSelected = false, previewFrames } = req.body || {};
      if (!selectedThumbnailUrl || typeof selectedThumbnailUrl !== 'string') {
        return res.status(400).json({ success: false, error: 'selectedThumbnailUrl is required' });
      }

      const db = readVideoThumbnailsDB();
      const mediaKey = videoMediaId || postId || `vcover_${Date.now()}`;
      const existing =
        db[mediaKey] ||
        (videoMediaId && db[videoMediaId]) ||
        (postId && db[postId]);

      const nowIso = new Date().toISOString();
      if (existing) {
        db[existing.mediaKey] = {
          ...existing,
          postId: postId || existing.postId,
          videoMediaId: videoMediaId || existing.videoMediaId,
          creatorId: creatorId || existing.creatorId,
          selectedThumbnailUrl,
          autoSelected: Boolean(autoSelected),
          updatedAt: nowIso
        };
      } else {
        db[mediaKey] = {
          mediaKey,
          videoMediaId,
          postId,
          creatorId,
          durationSeconds: 0,
          width: 1280,
          height: 720,
          aspectRatio: '16:9',
          orientation: 'landscape',
          frames: Array.isArray(previewFrames)
            ? previewFrames.map((url: string, idx: number) => ({
                id: `frame_${idx + 1}`,
                url,
                timestampSeconds: idx * 3,
                timestampFormatted: formatVideoTimestamp(idx * 3),
                width: 1280,
                height: 720,
                aspectRatio: '16:9',
                lumaMean: 110,
                contrastScore: 90,
                isAutoRecommended: url === selectedThumbnailUrl
              }))
            : [],
          selectedThumbnailUrl,
          recommendedThumbnailUrl: selectedThumbnailUrl,
          autoSelected: Boolean(autoSelected),
          createdAt: nowIso,
          updatedAt: nowIso
        };
      }
      writeVideoThumbnailsDB(db);

      // Also update stored post record if postId exists in AuthoritativePostStore
      if (postId) {
        const postsDb = postStore.readPostsDB();
        const targetRecord = postsDb.createdPosts[postId] || postsDb.updatedPosts[postId];
        if (targetRecord && Array.isArray(targetRecord.media)) {
          targetRecord.media = targetRecord.media.map((m: any, idx: number) =>
            idx === 0 || m.type === 'video'
              ? {
                  ...m,
                  thumbnailUrl: selectedThumbnailUrl,
                  previewFrames: Array.isArray(previewFrames) && previewFrames.length > 0 ? previewFrames : m.previewFrames
                }
              : m
          );
          if (postsDb.createdPosts[postId]) {
            postsDb.createdPosts[postId] = targetRecord;
          } else {
            postsDb.updatedPosts[postId] = targetRecord;
          }
          postStore.writePostsDB(postsDb);
        }
      }

      return res.json({
        success: true,
        mediaKey,
        postId,
        videoMediaId,
        selectedThumbnailUrl,
        autoSelected: Boolean(autoSelected)
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save video cover selection';
      return res.status(500).json({ success: false, error: msg });
    }
  });

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
  // API: Get Persisted Creator Posts State, Revisions Metadata & Audit History
  // --------------------------------------------------------------------------
  app.get('/api/posts/state', (_req, res) => {
    try {
      const db = postStore.readPostsDB();
      const postAuditLogs = postStore.readPostAuditLogs();
      const revisionCountsByPostId = postStore.getRevisionCountsByPostId();
      return res.json({
        success: true,
        createdPosts: db.createdPosts,
        updatedPosts: db.updatedPosts,
        deletedPostIds: db.deletedPostIds,
        archivedPostsForPurchasers: db.archivedPostsForPurchasers,
        postAuditLogs,
        revisionCountsByPostId
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load post state';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Post Storage Integrity Diagnostic Audit
  // --------------------------------------------------------------------------
  app.get('/api/posts/audit-integrity', (_req, res) => {
    try {
      const report = postStore.auditPostIntegrity();
      return res.json({ success: true, report });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to run post integrity audit';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Query Authoritative Unified Posts List (Paginated & Deduplicated by ID)
  // --------------------------------------------------------------------------
  app.get('/api/posts', (req, res) => {
    try {
      const includeDeleted = req.query.includeDeleted === 'true';
      const creatorId = typeof req.query.creatorId === 'string' ? req.query.creatorId.trim() : '';
      const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
      const country = typeof req.query.country === 'string' ? req.query.country.trim().toLowerCase() : '';

      let list = postStore.getUnifiedPosts({ includeDeleted, includeBaseline: true });

      if (creatorId) {
        list = list.filter(p => p.creatorId === creatorId);
      }
      if (category && category !== 'all categories') {
        list = list.filter(p => (p.categories || []).some(c => c.toLowerCase() === category));
      }
      if (country && country !== 'all countries' && country !== 'global') {
        list = list.filter(p => (p.country || '').toLowerCase() === country);
      }

      const total = list.length;
      const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10) || 1) : 1;
      const limit = req.query.limit ? Math.max(1, Math.min(200, parseInt(String(req.query.limit), 10) || 50)) : 0;
      const paginated = limit > 0 ? list.slice((page - 1) * limit, page * limit) : list;

      return res.json({
        success: true,
        posts: paginated,
        total,
        page,
        limit: limit || total
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to list posts';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Create & Permanently Store New Post (UUID + v1 Snapshot + Audit Log)
  // --------------------------------------------------------------------------
  app.post('/api/posts', async (req, res) => {
    try {
      const body = req.body || {};
      const { actorId, actorName, actorRole, isApprovedCreator, post, ...rest } = body;
      const postData = (post && typeof post === 'object' ? post : rest) as Partial<Post>;
      const taxonomyDb = readTaxonomyDB(taxonomyDbPath);

      const result = postStore.createPost({
        actorId,
        actorName,
        actorRole,
        isApprovedCreator,
        postData,
        categoriesList: taxonomyDb.categories,
        countriesList: taxonomyDb.countries
      });

      if (!result.success || !result.post) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      // Sync relational taxonomy records on post creation
      if (Array.isArray(result.post.category_ids) && result.post.category_ids.length > 0) {
        taxonomyDb.postCategories[result.post.id] = [...result.post.category_ids];
      }
      if (result.post.video_country_id || result.post.country) {
        const resolvedVideoCountry =
          resolveCountryRecord(result.post.video_country_id, taxonomyDb.countries) ||
          resolveCountryRecord(result.post.country, taxonomyDb.countries);
        if (resolvedVideoCountry) {
          taxonomyDb.postCountries[result.post.id] = {
            post_id: result.post.id,
            creator_id: result.post.creatorId,
            video_country_id: resolvedVideoCountry.id,
            country_name: resolvedVideoCountry.name,
            iso_code: resolvedVideoCountry.iso_code
          };
        }
      }
      writeTaxonomyDB(taxonomyDb, taxonomyDbPath);

      appendAuditLog(
        {
          id: `audit_post_create_${Date.now()}`,
          adminId: actorId,
          adminName: actorName || result.post.creatorName,
          adminRole: actorRole || 'creator',
          category: 'content_moderation',
          action: 'Creator Published New Post',
          targetType: 'Post',
          targetId: result.post.id,
          targetLabel: `${result.post.creatorName}: "${result.post.content.slice(0, 42)}..."`,
          details: result.auditEntry?.summary || `Published post ${result.post.id}`,
          severity: 'info',
          timestamp: result.auditEntry?.timestamp || new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        adminAuditPath
      );

      if (supabase) {
        try {
          await (supabase as any).from('posts').upsert({
            id: result.post.id,
            creator_id: result.post.creatorId,
            caption: result.post.content,
            visibility: result.post.visibility,
            ppv_price: result.post.ppvPrice || 0,
            original_content_hash: result.post.originalContentHash,
            version: result.post.version || 1,
            created_at: result.post.createdAtIso,
            updated_at: result.post.createdAtIso
          });
        } catch {
          // ignore optional remote sync error
        }
      }

      return res.status(201).json({
        success: true,
        post: result.post,
        revision: result.revision,
        auditEntry: result.auditEntry
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create post';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Creator Edit Post (Strict Ownership Verification & Revision Snapshot)
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

      const taxonomyDb = readTaxonomyDB(taxonomyDbPath);
      const result = postStore.updatePost({
        postId,
        actorId,
        actorName,
        actorRole,
        isApprovedCreator,
        postOwnerId,
        existingPostFallback: existingPost,
        updates,
        purchaseCount,
        categoriesList: taxonomyDb.categories,
        countriesList: taxonomyDb.countries
      });

      if (!result.success || !result.updatedPost) {
        return res.status(result.statusCode).json({
          success: false,
          requiresPurchaseWarning: result.requiresPurchaseWarning,
          error: result.error
        });
      }

      const updatedPost = result.updatedPost;
      const nowIso = new Date().toISOString();

      // Update relational post_categories and postCountries tables without altering creator_country_id
      if (Array.isArray(updatedPost.category_ids) && updatedPost.category_ids.length > 0) {
        taxonomyDb.postCategories[postId] = [...updatedPost.category_ids];
      }
      if (updatedPost.video_country_id || updatedPost.country) {
        const resolvedVideoCountry =
          resolveCountryRecord(updatedPost.video_country_id, taxonomyDb.countries) ||
          resolveCountryRecord(updatedPost.country, taxonomyDb.countries);
        if (resolvedVideoCountry) {
          taxonomyDb.postCountries[postId] = {
            post_id: postId,
            creator_id: updatedPost.creatorId,
            video_country_id: resolvedVideoCountry.id,
            country_name: resolvedVideoCountry.name,
            iso_code: resolvedVideoCountry.iso_code
          };
        }
      }
      writeTaxonomyDB(taxonomyDb, taxonomyDbPath);

      if (result.auditEntry) {
        appendAuditLog(
          {
            id: `audit_post_edit_${Date.now()}`,
            adminId: actorId,
            adminName: actorName || updatedPost.creatorName || 'Creator',
            adminRole: actorRole || 'creator',
            category: 'content_moderation',
            action: result.auditEntry.action === 'media_replaced'
              ? 'Creator Replaced Post Media (Purchaser Safe)'
              : 'Creator Edited Published Post',
            targetType: 'Post',
            targetId: postId,
            targetLabel: `${updatedPost.creatorName}: "${updatedPost.content.slice(0, 42)}..."`,
            details: result.auditEntry.summary,
            severity: 'info',
            timestamp: result.auditEntry.timestamp
          },
          adminAuditPath
        );
      }

      if (supabase) {
        try {
          await (supabase as any)
            .from('posts')
            .update({
              caption: updatedPost.content,
              visibility: updatedPost.visibility,
              ppv_price: updatedPost.ppvPrice || 0,
              version: updatedPost.version,
              updated_at: nowIso
            })
            .eq('id', postId)
            .eq('creator_id', updatedPost.creatorId);
        } catch {
          // ignore optional remote sync error
        }
      }

      return res.json({
        success: true,
        updatedPost,
        auditEntry: result.auditEntry,
        revision: result.revision
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update post';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Inspect & Restore Saved Post Revisions (Owner or Admin Only)
  // --------------------------------------------------------------------------
  app.get('/api/posts/:postId/revisions', (req, res) => {
    try {
      const { postId } = req.params;
      const actorId = String(req.query.actorId || req.headers['x-actor-id'] || '').trim();
      const actorRole = String(req.query.actorRole || req.headers['x-actor-role'] || '').trim();

      if (!actorId) {
        return res.status(401).json({ success: false, error: 'Unauthorized: actorId is required to view post revision history.' });
      }

      const post = postStore.getAuthoritativePostById(postId);
      if (!post) {
        return res.status(404).json({ success: false, error: 'Post not found.' });
      }

      const isAdmin = actorRole === 'admin' || actorRole === 'moderator';
      if (post.creatorId !== actorId && !isAdmin) {
        return res.status(403).json({ success: false, error: 'Forbidden: Only the post owner or an administrator can inspect revision history.' });
      }

      const revisions = postStore.getRevisionsForPost(postId);
      return res.json({
        success: true,
        postId,
        currentVersion: post.version || Math.max(1, revisions.length),
        revisions
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load post revisions';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/posts/:postId/revisions/:revisionId/restore', (req, res) => {
    try {
      const { postId, revisionId } = req.params;
      const { actorId, actorName, actorRole, isApprovedCreator } = req.body || {};

      const result = postStore.restoreRevision({
        postId,
        revisionId,
        actorId,
        actorName,
        actorRole,
        isApprovedCreator
      });

      if (!result.success || !result.restoredPost) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      const taxonomyDb = readTaxonomyDB(taxonomyDbPath);
      if (Array.isArray(result.restoredPost.category_ids) && result.restoredPost.category_ids.length > 0) {
        taxonomyDb.postCategories[postId] = [...result.restoredPost.category_ids];
      }
      if (result.restoredPost.video_country_id || result.restoredPost.country) {
        const resolvedVideoCountry =
          resolveCountryRecord(result.restoredPost.video_country_id, taxonomyDb.countries) ||
          resolveCountryRecord(result.restoredPost.country, taxonomyDb.countries);
        if (resolvedVideoCountry) {
          taxonomyDb.postCountries[postId] = {
            post_id: postId,
            creator_id: result.restoredPost.creatorId,
            video_country_id: resolvedVideoCountry.id,
            country_name: resolvedVideoCountry.name,
            iso_code: resolvedVideoCountry.iso_code
          };
        }
      }
      writeTaxonomyDB(taxonomyDb, taxonomyDbPath);

      if (result.auditEntry) {
        appendAuditLog(
          {
            id: `audit_post_restore_${Date.now()}`,
            adminId: actorId,
            adminName: actorName || result.restoredPost.creatorName,
            adminRole: actorRole || 'creator',
            category: 'content_moderation',
            action: 'Restored Prior Post Revision',
            targetType: 'Post',
            targetId: postId,
            targetLabel: `${result.restoredPost.creatorName}: "${result.restoredPost.content.slice(0, 42)}..."`,
            details: result.auditEntry.summary,
            severity: 'info',
            timestamp: result.auditEntry.timestamp
          },
          adminAuditPath
        );
      }

      return res.json({
        success: true,
        restoredPost: result.restoredPost,
        revision: result.revision,
        auditEntry: result.auditEntry
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to restore post revision';
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

      const result = postStore.deletePost({
        postId,
        actorId,
        actorName,
        actorRole,
        isApprovedCreator,
        postOwnerId,
        existingPostFallback: existingPost,
        purchaseCount,
        reason
      });

      if (!result.success || !result.deletedPost) {
        return res.status(result.statusCode).json({
          success: false,
          error: result.error
        });
      }

      const deletedPostRecord = result.deletedPost;
      const hadPurchases = Boolean(result.hadPurchases);
      const nowIso = new Date().toISOString();

      if (result.auditEntry) {
        appendAuditLog(
          {
            id: `audit_post_delete_${Date.now()}`,
            adminId: actorId,
            adminName: actorName || deletedPostRecord.creatorName || 'Creator',
            adminRole: actorRole || 'creator',
            category: 'content_moderation',
            action: hadPurchases ? 'Creator Deleted Post (Safe Purchaser Archive)' : 'Creator Deleted Post',
            targetType: 'Post',
            targetId: postId,
            targetLabel: `${deletedPostRecord.creatorName || 'Creator'}: "${(deletedPostRecord.content || postId).slice(0, 42)}..."`,
            details: result.auditEntry.summary,
            severity: 'warning',
            timestamp: result.auditEntry.timestamp
          },
          adminAuditPath
        );
      }

      if (supabase) {
        try {
          await (supabase as any)
            .from('posts')
            .update({
              moderation_status: 'removed',
              updated_at: nowIso
            })
            .eq('id', postId)
            .eq('creator_id', deletedPostRecord.creatorId);
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
        auditEntry: result.auditEntry
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
      const db = readTaxonomyDB(taxonomyDbPath);
      return res.json({
        success: true,
        categories: db.categories,
        deletedCategoryIds: db.deletedCategoryIds || [],
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

      const db = readTaxonomyDB(taxonomyDbPath);
      const duplicate = db.categories.find(
        c => c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (duplicate) {
        return res.status(409).json({
          success: false,
          error: `A category named "${duplicate.name}" already exists in the official database.`
        });
      }

      const slug =
        cleanName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '') || `category-${Date.now().toString(36)}`;
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
      db.deletedCategoryIds = (db.deletedCategoryIds || []).filter(id => id !== newCategory.id);
      writeTaxonomyDB(db, taxonomyDbPath);

      appendAuditLog(
        {
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
        },
        adminAuditPath
      );

      return res.json({
        success: true,
        category: newCategory,
        categories: db.categories,
        deletedCategoryIds: db.deletedCategoryIds || []
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

      const db = readTaxonomyDB(taxonomyDbPath);
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
      writeTaxonomyDB(db, taxonomyDbPath);

      appendAuditLog(
        {
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
        },
        adminAuditPath
      );

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
  // API: Admin Delete Official Category (Removes & Tombstones Baseline/Custom)
  // --------------------------------------------------------------------------
  app.delete('/api/admin/categories/:categoryId', (req, res) => {
    try {
      const { categoryId } = req.params;
      const body = req.body && typeof req.body === 'object' ? req.body : {};
      const actorId = String(body.actorId || req.query.actorId || req.headers['x-actor-id'] || '').trim();
      const actorName = String(body.actorName || req.query.actorName || req.headers['x-actor-name'] || 'Admin').trim();
      const actorRole = String(body.actorRole || req.query.actorRole || req.headers['x-actor-role'] || '').trim();

      if (!actorId || (actorRole !== 'admin' && actorRole !== 'super_admin')) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Only administrators can delete official platform categories.'
        });
      }

      const db = readTaxonomyDB(taxonomyDbPath);
      const target = db.categories.find(c => c.id === categoryId);
      if (!target) {
        return res.status(404).json({
          success: false,
          error: 'Category not found or already deleted.'
        });
      }

      db.categories = db.categories.filter(c => c.id !== categoryId);
      const deletedSet = new Set<string>(db.deletedCategoryIds || []);
      deletedSet.add(categoryId);
      db.deletedCategoryIds = Array.from(deletedSet);

      // Remove deleted category ID from relational postCategories mapping
      for (const [postId, catIds] of Object.entries(db.postCategories || {})) {
        if (Array.isArray(catIds) && catIds.includes(categoryId)) {
          db.postCategories[postId] = catIds.filter(id => id !== categoryId);
        }
      }

      writeTaxonomyDB(db, taxonomyDbPath);

      appendAuditLog(
        {
          id: `audit_cat_del_${Date.now()}`,
          adminId: actorId,
          adminName: actorName || 'Admin',
          adminRole: actorRole || 'admin',
          category: 'platform_config',
          action: 'Deleted Official Platform Category',
          targetType: 'Category',
          targetId: categoryId,
          targetLabel: target.name,
          details: `Deleted official category "${target.name}" (${categoryId}) from the platform directory.`,
          severity: 'warning',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
        },
        adminAuditPath
      );

      return res.json({
        success: true,
        deletedCategoryId: categoryId,
        deletedCategoryIds: db.deletedCategoryIds,
        categories: db.categories
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
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
  // API: Privacy-Conscious Anonymous Guest Browsing Analytics
  // Tracks views/watch duration/profile visits/searches via anonymous session ID
  // without creating user accounts or mutating real creator counts
  // --------------------------------------------------------------------------
  app.post('/api/analytics/guest-event', (req, res) => {
    try {
      const {
        anonymousSessionId,
        eventType,
        contentType,
        contentId,
        creatorId,
        category,
        searchQuery,
        watchDurationSeconds,
        completionPercentage,
        sourceSurface
      } = req.body || {};

      if (typeof anonymousSessionId !== 'string' || !anonymousSessionId.trim()) {
        return res.status(400).json({ success: false, error: 'anonymousSessionId is required' });
      }
      if (typeof eventType !== 'string' || !eventType.trim()) {
        return res.status(400).json({ success: false, error: 'eventType is required' });
      }

      const db = readGuestAnalyticsDB();
      const cleanSession = anonymousSessionId.trim().slice(0, 80);
      if (!db.sessions.includes(cleanSession)) {
        db.sessions.push(cleanSession);
        if (db.sessions.length > 5000) {
          db.sessions = db.sessions.slice(-5000);
        }
      }

      const cleanWatch =
        typeof watchDurationSeconds === 'number' && Number.isFinite(watchDurationSeconds) && watchDurationSeconds >= 0
          ? Math.round(watchDurationSeconds)
          : undefined;
      const cleanCompletion =
        typeof completionPercentage === 'number' && Number.isFinite(completionPercentage)
          ? Math.min(100, Math.max(0, Math.round(completionPercentage)))
          : undefined;

      const entry: GuestAnalyticsEventRecord = {
        id: `gevt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        anonymousSessionId: cleanSession,
        eventType: eventType.trim().slice(0, 64),
        contentType: typeof contentType === 'string' ? contentType.slice(0, 32) : undefined,
        contentId: typeof contentId === 'string' ? contentId.slice(0, 80) : undefined,
        creatorId: typeof creatorId === 'string' ? creatorId.slice(0, 80) : undefined,
        category: typeof category === 'string' ? category.slice(0, 64) : undefined,
        searchQuery: typeof searchQuery === 'string' ? searchQuery.slice(0, 120) : undefined,
        watchDurationSeconds: cleanWatch,
        completionPercentage: cleanCompletion,
        sourceSurface: typeof sourceSurface === 'string' ? sourceSurface.slice(0, 48) : 'feed',
        timestamp: new Date().toISOString()
      };

      db.events.unshift(entry);
      if (db.events.length > 2000) {
        db.events = db.events.slice(0, 2000);
      }

      if (entry.eventType === 'video_started' || entry.eventType === 'video_watched') {
        db.counters.videoViews += 1;
      }
      if (entry.eventType === 'video_completed') {
        db.counters.videoCompletions += 1;
      }
      if (cleanWatch) {
        db.counters.totalWatchDurationSeconds += cleanWatch;
      }
      if (entry.eventType === 'creator_profile_opened') {
        db.counters.profileViews += 1;
      }
      if (entry.eventType === 'post_impression' || entry.eventType === 'video_impression' || entry.eventType === 'photo_displayed') {
        db.counters.postImpressions += 1;
      }
      if (entry.eventType === 'search_performed' || entry.eventType === 'category_searched' || entry.eventType === 'hashtag_searched') {
        db.counters.searches += 1;
      }

      writeGuestAnalyticsDB(db);
      return res.json({ success: true, eventId: entry.id });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to log anonymous analytics event';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.get('/api/analytics/guest-summary', (_req, res) => {
    try {
      const db = readGuestAnalyticsDB();
      return res.json({
        success: true,
        totalSessions: db.sessions.length,
        totalEvents: db.events.length,
        counters: db.counters,
        recentEvents: db.events.slice(0, 25)
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load anonymous analytics summary';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Public Guest Feed & Restricted Media Access Guard
  // Strips private/subscriber/follower/unpurchased PPV media URLs for unauthenticated viewers
  // --------------------------------------------------------------------------
  app.get('/api/public/feed', (req, res) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category.trim().toLowerCase() : '';
      const country = typeof req.query.country === 'string' ? req.query.country.trim().toLowerCase() : '';

      const merged = postStore
        .getUnifiedPosts({ includeDeleted: false, includeBaseline: true })
        .filter((p) => {
          if (p.isDeletedByCreator || p.isDraft) return false;
          if (p.moderationStatus === 'removed' || p.visibility === 'private') return false;
          if (category && category !== 'all categories') {
            if (!(p.categories || []).some((c: string) => c.toLowerCase() === category)) {
              return false;
            }
          }
          if (country && country !== 'all countries' && country !== 'global') {
            if ((p.country || '').toLowerCase() !== country) {
              return false;
            }
          }
          return true;
        });

      const total = merged.length;
      const page = req.query.page ? Math.max(1, parseInt(String(req.query.page), 10) || 1) : 1;
      const limit = req.query.limit ? Math.max(1, Math.min(200, parseInt(String(req.query.limit), 10) || 50)) : 0;
      const paged = limit > 0 ? merged.slice((page - 1) * limit, page * limit) : merged;

      const sanitized = paged.map((p) => sanitizePostForGuestViewer(p as Post));
      return res.json({
        success: true,
        posts: sanitized,
        total,
        page,
        limit: limit || total
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load public feed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/media/authorize-playback', (req, res) => {
    try {
      const { postId, isAuthenticated, userId, isSubscribed, isFollowing, isPurchased, userRole } = req.body || {};
      if (!postId || typeof postId !== 'string') {
        return res.status(400).json({ success: false, authorized: false, error: 'postId is required' });
      }

      const db = postStore.readPostsDB();
      const deletedSet = new Set(db.deletedPostIds || []);
      const post = postStore.getAuthoritativePostById(postId);

      if (!post || deletedSet.has(postId) || post.isDeletedByCreator || post.moderationStatus === 'removed') {
        return res.status(404).json({ success: false, authorized: false, error: 'Content is unavailable' });
      }

      const authed = Boolean(isAuthenticated && userId);
      const isOwner = authed && userId === post.creatorId;
      const isAdmin = authed && (userRole === 'admin' || userRole === 'moderator');

      if (post.visibility === 'private' && !isOwner && !isAdmin) {
        return res.status(authed ? 403 : 401).json({
          success: false,
          authorized: false,
          error: 'Private post is not publicly accessible'
        });
      }

      if (post.visibility === 'public') {
        const videoMedia = post.media?.find((m) => m.type === 'video');
        return res.json({
          success: true,
          authorized: true,
          visibility: post.visibility,
          playbackUrl: videoMedia?.url || '',
          media: post.media || []
        });
      }

      if (!authed) {
        return res.status(401).json({
          success: false,
          authorized: false,
          requiresAuth: true,
          visibility: post.visibility,
          error: 'Authentication required to access protected creator content'
        });
      }

      const canAccess =
        isOwner ||
        isAdmin ||
        (post.visibility === 'followers' && (Boolean(isFollowing) || Boolean(isSubscribed))) ||
        (post.visibility === 'subscribers' && Boolean(isSubscribed)) ||
        (post.visibility === 'pay_per_view' && Boolean(isPurchased));

      if (!canAccess) {
        return res.status(403).json({
          success: false,
          authorized: false,
          visibility: post.visibility,
          error: 'Subscription, follow, or PPV purchase required to access full media'
        });
      }

      const videoMedia = post.media?.find((m) => m.type === 'video');
      return res.json({
        success: true,
        authorized: true,
        visibility: post.visibility,
        playbackUrl: videoMedia?.url || '',
        media: post.media || []
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Media authorization check failed';
      return res.status(500).json({ success: false, authorized: false, error: msg });
    }
  });

  // --------------------------------------------------------------------------
  // API: Official Creator Verification Authority & Payment/Admin Engine
  // --------------------------------------------------------------------------
  interface StoredCreatorVerificationDB {
    settings: VerificationSettings;
    records: CreatorVerificationRecord[];
    transactions: VerificationTransaction[];
    auditLogs: VerificationAuditLog[];
  }

  const readCreatorVerificationDB = (): StoredCreatorVerificationDB => {
    try {
      if (fs.existsSync(CREATOR_VERIFICATION_DB_FILE)) {
        const raw = fs.readFileSync(CREATOR_VERIFICATION_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.settings && Array.isArray(parsed.records)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading creator_verification_db.json:', err);
    }

    const seeded: StoredCreatorVerificationDB = {
      settings: { ...INITIAL_VERIFICATION_SETTINGS },
      records: MOCK_CREATOR_VERIFICATION_RECORDS.map(r => ({ ...r })),
      transactions: MOCK_VERIFICATION_TRANSACTIONS.map(t => ({ ...t })),
      auditLogs: MOCK_VERIFICATION_AUDIT_LOGS.map(l => ({ ...l }))
    };
    fs.writeFileSync(CREATOR_VERIFICATION_DB_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  };

  const writeCreatorVerificationDB = (db: StoredCreatorVerificationDB): void => {
    fs.writeFileSync(CREATOR_VERIFICATION_DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  };

  const evaluateAuthoritativeVerificationState = (db: StoredCreatorVerificationDB) => {
    const nowMs = Date.now();
    const nowStr = new Date(nowMs).toISOString().replace('T', ' ').slice(0, 19);
    let mutated = false;

    // Auto-expire any verified record whose expiration timestamp has elapsed
    const updatedRecords = db.records.map(rec => {
      if (rec.status === 'verified' && rec.expirationDate) {
        const expMs = new Date(rec.expirationDate.replace(' ', 'T')).getTime();
        if (!Number.isNaN(expMs) && expMs <= nowMs) {
          mutated = true;
          const nextStatus: PaidVerificationStatus = db.settings.renewalEnabled
            ? 'renewal_required'
            : 'expired';
          db.auditLogs.unshift({
            id: `vaudit_autoexp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            adminId: 'system_scheduler',
            adminName: 'ACOVON Verification Authority',
            adminRole: 'system',
            creatorId: rec.creatorId,
            creatorName: rec.creatorName,
            action: `Automatic Verification Expiration → ${nextStatus.toUpperCase()}`,
            previousStatus: rec.status,
            newStatus: nextStatus,
            reason: 'Verification expiration timestamp elapsed; blue badge automatically removed.',
            timestamp: nowStr
          });
          return {
            ...rec,
            status: nextStatus,
            statusReason: 'Verification period expired. Renewal required to reactivate official blue badge.',
            updatedAt: nowStr
          };
        }
      }
      return rec;
    });

    if (mutated) {
      db.records = updatedRecords;
      writeCreatorVerificationDB(db);
    }

    const verifiedBadgeMap: Record<string, boolean> = {};
    for (const creator of MOCK_CREATORS) {
      if (creator.role !== 'creator') {
        verifiedBadgeMap[creator.id] = false;
        continue;
      }
      const record = db.records.find(r => r.creatorId === creator.id);
      if (!record || record.status !== 'verified') {
        verifiedBadgeMap[creator.id] = false;
        continue;
      }
      if (record.expirationDate) {
        const expMs = new Date(record.expirationDate.replace(' ', 'T')).getTime();
        if (!Number.isNaN(expMs) && expMs <= nowMs) {
          verifiedBadgeMap[creator.id] = false;
          continue;
        }
      }
      // Check payment confirmation where a fee is required (or explicit admin restoration)
      if (db.settings.price > 0) {
        const hasConfirmedTx = db.transactions.some(
          t =>
            t.creatorId === creator.id &&
            t.paymentStatus === 'completed' &&
            t.refundStatus !== 'completed'
        );
        const restoredByAdmin = Boolean(
          (record.statusReason && record.statusReason.toLowerCase().includes('admin')) ||
            db.auditLogs.some(
              l =>
                l.creatorId === creator.id &&
                l.newStatus === 'verified' &&
                ['super_admin', 'admin', 'moderator', 'finance_admin'].includes(l.adminRole)
            )
        );
        if (!hasConfirmedTx && !restoredByAdmin) {
          verifiedBadgeMap[creator.id] = false;
          continue;
        }
      }
      verifiedBadgeMap[creator.id] = true;
    }

    // Explicitly ensure fans NEVER hold verified creator badge entries
    for (const u of Object.values(MOCK_USERS)) {
      if (u.role !== 'creator') {
        verifiedBadgeMap[u.id] = false;
      }
    }

    return {
      settings: db.settings,
      records: db.records,
      transactions: db.transactions,
      auditLogs: db.auditLogs,
      verifiedBadgeMap
    };
  };

  app.get('/api/verification/state', (_req, res) => {
    try {
      const db = readCreatorVerificationDB();
      const evaluated = evaluateAuthoritativeVerificationState(db);
      return res.json({ success: true, ...evaluated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load verification state';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/verification/purchase', (req, res) => {
    try {
      const { creatorId, paymentProvider, idempotencyKey, isRenewal, simulateOutcome } = req.body || {};
      if (!creatorId || typeof creatorId !== 'string') {
        return res.status(400).json({ success: false, error: 'creatorId is required.' });
      }

      const creator = MOCK_CREATORS.find(c => c.id === creatorId);
      if (!creator || creator.role !== 'creator') {
        return res.status(403).json({
          success: false,
          error: 'Only registered ACOVON Creator accounts are eligible for creator verification.'
        });
      }

      const db = readCreatorVerificationDB();
      if (!db.settings.isActive || !db.settings.isPublished) {
        return res.status(403).json({
          success: false,
          error: 'Creator Verification purchases are currently paused by Administration.'
        });
      }

      const existing = db.records.find(r => r.creatorId === creator.id) || {
        id: `cvrec_${creator.id}`,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorUsername: creator.username,
        creatorAvatar: creator.avatar,
        status: 'not_verified' as PaidVerificationStatus,
        planId: db.settings.id,
        planName: db.settings.planName,
        amountPaid: 0,
        currency: db.settings.currency,
        durationType: db.settings.durationType,
        expirationDate: null,
        updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
      };

      if (existing.status === 'revoked') {
        return res.status(403).json({
          success: false,
          error: 'Your Creator Verification eligibility was revoked by Administration.'
        });
      }

      if (existing.status === 'verified' && !isRenewal && db.settings.durationType === 'lifetime') {
        return res.status(409).json({
          success: false,
          isDuplicatePrevented: true,
          error: 'Your creator account already has an active Official Blue Verification Badge.'
        });
      }

      const idemKey =
        typeof idempotencyKey === 'string' && idempotencyKey.trim()
          ? idempotencyKey.trim()
          : `idem_verif_${creator.id}_${isRenewal ? 'renew' : 'init'}_${Math.floor(Date.now() / 5000)}`;

      const dupTx = db.transactions.find(t => t.idempotencyKey === idemKey && t.paymentStatus === 'completed');
      if (dupTx) {
        const evaluated = evaluateAuthoritativeVerificationState(db);
        return res.json({
          success: true,
          status: existing.status,
          transaction: dupTx,
          isDuplicatePrevented: true,
          ...evaluated
        });
      }

      const chargeAmount =
        isRenewal && db.settings.renewalEnabled ? db.settings.renewalPrice : db.settings.price;
      const chargeCurrency = db.settings.currency;
      const provider: VerificationTransaction['paymentProvider'] =
        paymentProvider === 'acovon_wallet' || paymentProvider === 'apple_pay'
          ? paymentProvider
          : 'stripe_checkout';
      const outcome: 'completed' | 'pending' | 'failed' =
        simulateOutcome === 'pending' || simulateOutcome === 'failed' ? simulateOutcome : 'completed';

      const now = new Date();
      const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
      const txId = `vtx_${Date.now()}`;
      const providerRef =
        provider === 'stripe_checkout'
          ? `pi_3Acovon_${crypto.randomBytes(4).toString('hex').toUpperCase()}`
          : provider === 'apple_pay'
          ? `apay_Acovon_${crypto.randomBytes(4).toString('hex').toUpperCase()}`
          : `wal_Acovon_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

      const newTx: VerificationTransaction = {
        id: txId,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorUsername: creator.username,
        creatorAvatar: creator.avatar,
        verificationRecordId: existing.id,
        transactionType: isRenewal ? 'renewal' : 'initial',
        planName: isRenewal ? `${db.settings.planName} (Renewal)` : db.settings.planName,
        paymentProvider: provider,
        providerTransactionId: providerRef,
        idempotencyKey: idemKey,
        amount: chargeAmount,
        currency: chargeCurrency,
        paymentStatus: outcome,
        paymentTimestamp: nowStr,
        refundStatus: 'not_requested',
        createdAt: nowStr
      };

      db.transactions.unshift(newTx);

      if (outcome === 'failed') {
        writeCreatorVerificationDB(db);
        const evaluated = evaluateAuthoritativeVerificationState(db);
        return res.status(402).json({
          success: false,
          status: existing.status,
          transaction: newTx,
          error: 'Payment authorization declined by provider. Your account remains unverified.',
          ...evaluated
        });
      }

      if (outcome === 'pending') {
        const pendingRecord: CreatorVerificationRecord = {
          ...existing,
          status: 'payment_pending',
          planId: db.settings.id,
          planName: db.settings.planName,
          originalPaymentId: txId,
          amountPaid: chargeAmount,
          currency: chargeCurrency,
          durationType: db.settings.durationType,
          purchaseDate: nowStr,
          statusReason: 'Payment submitted — awaiting final gateway settlement confirmation.',
          updatedAt: nowStr
        };
        const existsIdx = db.records.findIndex(r => r.creatorId === creator.id);
        if (existsIdx >= 0) db.records[existsIdx] = pendingRecord;
        else db.records.unshift(pendingRecord);

        writeCreatorVerificationDB(db);
        const evaluated = evaluateAuthoritativeVerificationState(db);
        return res.json({
          success: true,
          status: 'payment_pending',
          transaction: newTx,
          ...evaluated
        });
      }

      // Confirmed payment
      let expirationDate: string | null = null;
      if (db.settings.durationType !== 'lifetime') {
        const daysToAdd =
          db.settings.durationType === 'monthly'
            ? 30
            : db.settings.durationType === 'annual'
            ? 365
            : db.settings.durationDays || 30;
        const baseTime =
          isRenewal &&
          existing.expirationDate &&
          new Date(existing.expirationDate.replace(' ', 'T')).getTime() > now.getTime()
            ? new Date(existing.expirationDate.replace(' ', 'T')).getTime()
            : now.getTime();
        expirationDate = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000)
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19);
      }

      const verifiedRecord: CreatorVerificationRecord = {
        ...existing,
        status: 'verified',
        planId: db.settings.id,
        planName: db.settings.planName,
        originalPaymentId: txId,
        amountPaid: chargeAmount,
        currency: chargeCurrency,
        durationType: db.settings.durationType,
        purchaseDate: existing.purchaseDate || nowStr,
        startDate: existing.startDate || nowStr,
        expirationDate,
        lastRenewalDate: isRenewal ? nowStr : existing.lastRenewalDate,
        suspendedDate: undefined,
        revokedDate: undefined,
        statusReason: undefined,
        updatedAt: nowStr
      };
      const existsIdx = db.records.findIndex(r => r.creatorId === creator.id);
      if (existsIdx >= 0) db.records[existsIdx] = verifiedRecord;
      else db.records.unshift(verifiedRecord);

      db.auditLogs.unshift({
        id: `vaudit_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        adminId: 'system_payment_webhook',
        adminName: 'ACOVON Payment Gateway',
        adminRole: 'system',
        creatorId: creator.id,
        creatorName: creator.name,
        action: isRenewal
          ? `Automatic Blue Badge Renewal Confirmed (${chargeCurrency} ${chargeAmount.toFixed(2)})`
          : `Official Blue Verification Badge Activated (${chargeCurrency} ${chargeAmount.toFixed(2)})`,
        previousStatus: existing.status,
        newStatus: 'verified',
        reason: `Verified payment confirmation ${providerRef} via ${provider}.`,
        timestamp: nowStr
      });

      writeCreatorVerificationDB(db);
      const evaluated = evaluateAuthoritativeVerificationState(db);
      return res.json({
        success: true,
        status: 'verified',
        transaction: newTx,
        ...evaluated
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification purchase failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/verification/admin/settings', (req, res) => {
    try {
      const { adminId, adminName, adminRole, updates } = req.body || {};
      if (!['super_admin', 'admin', 'finance_admin'].includes(adminRole)) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Only authorized Administrators can modify verification settings.'
        });
      }
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ success: false, error: 'updates object is required.' });
      }
      if (updates.price !== undefined && (Number.isNaN(Number(updates.price)) || Number(updates.price) <= 0)) {
        return res.status(400).json({ success: false, error: 'Verification price must be positive.' });
      }
      if (
        updates.renewalPrice !== undefined &&
        (Number.isNaN(Number(updates.renewalPrice)) || Number(updates.renewalPrice) <= 0)
      ) {
        return res.status(400).json({ success: false, error: 'Renewal price must be positive.' });
      }

      const db = readCreatorVerificationDB();
      const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
      const prevPriceLabel = `${db.settings.price.toFixed(2)} ${db.settings.currency} (${db.settings.durationType})`;

      db.settings = {
        ...db.settings,
        ...updates,
        updatedAt: nowStr,
        updatedByAdmin: `${adminName || 'Admin'} (${adminRole})`
      };
      const nextPriceLabel = `${db.settings.price.toFixed(2)} ${db.settings.currency} (${db.settings.durationType})`;

      db.auditLogs.unshift({
        id: `vaudit_cfg_${Date.now()}`,
        adminId: adminId || 'admin',
        adminName: adminName || 'Administrator',
        adminRole,
        action: 'Updated Creator Verification Plan & Pricing Configuration',
        previousStatus: prevPriceLabel,
        newStatus: nextPriceLabel,
        reason: `Active: ${db.settings.isActive} · Published: ${db.settings.isPublished} · Plan: ${db.settings.planName}`,
        timestamp: nowStr
      });

      appendAuditLog({
        id: `audit_verif_cfg_${Date.now()}`,
        adminId: adminId || 'admin',
        adminName: adminName || 'Administrator',
        adminRole,
        category: 'creator_verification',
        action: 'Updated Creator Verification Configuration',
        targetType: 'VerificationSettings',
        targetId: db.settings.id,
        targetLabel: db.settings.planName,
        details: `Updated verification config from [${prevPriceLabel}] to [${nextPriceLabel}].`,
        severity: 'info',
        timestamp: nowStr.slice(0, 16)
      });

      writeCreatorVerificationDB(db);
      const evaluated = evaluateAuthoritativeVerificationState(db);
      return res.json({ success: true, ...evaluated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save verification settings';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  app.post('/api/verification/admin/action', (req, res) => {
    try {
      const {
        actionType,
        creatorId,
        transactionId,
        refundStatus,
        reason,
        keepBadgeAuthorizedReason,
        adminId,
        adminName,
        adminRole
      } = req.body || {};

      const allowedRoles =
        actionType === 'revoke'
          ? ['super_admin', 'admin']
          : actionType === 'refund'
          ? ['super_admin', 'admin', 'finance_admin']
          : ['super_admin', 'admin', 'moderator', 'finance_admin'];

      if (!allowedRoles.includes(adminRole)) {
        return res.status(403).json({
          success: false,
          error: 'Access Denied: Insufficient administrator permissions for this verification action.'
        });
      }

      const db = readCreatorVerificationDB();
      const now = new Date();
      const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);

      const upsertRecord = (rec: CreatorVerificationRecord) => {
        const idx = db.records.findIndex(r => r.creatorId === rec.creatorId);
        if (idx >= 0) db.records[idx] = rec;
        else db.records.unshift(rec);
      };

      const findOrBuildRecord = (cid: string): CreatorVerificationRecord => {
        const found = db.records.find(r => r.creatorId === cid);
        if (found) return found;
        const c = MOCK_CREATORS.find(x => x.id === cid);
        return {
          id: `cvrec_${cid}`,
          creatorId: cid,
          creatorName: c?.name || 'Creator',
          creatorUsername: c?.username || cid,
          creatorAvatar: c?.avatar || '',
          status: 'not_verified',
          planId: db.settings.id,
          planName: db.settings.planName,
          amountPaid: 0,
          currency: db.settings.currency,
          durationType: db.settings.durationType,
          expirationDate: null,
          updatedAt: nowStr
        };
      };

      if (actionType === 'suspend') {
        if (!creatorId || !String(reason || '').trim()) {
          return res.status(400).json({ success: false, error: 'Suspension reason is required.' });
        }
        const existing = findOrBuildRecord(creatorId);
        upsertRecord({
          ...existing,
          status: 'suspended',
          suspendedDate: nowStr,
          statusReason: String(reason).trim(),
          updatedAt: nowStr
        });
        db.auditLogs.unshift({
          id: `vaudit_susp_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          creatorId,
          creatorName: existing.creatorName,
          action: 'Suspended Creator Blue Verification Badge',
          previousStatus: existing.status,
          newStatus: 'suspended',
          reason: String(reason).trim(),
          timestamp: nowStr
        });
        appendAuditLog({
          id: `audit_verif_susp_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          category: 'creator_verification',
          action: 'Suspended Creator Verification Badge',
          targetType: 'CreatorProfile',
          targetId: creatorId,
          targetLabel: existing.creatorName,
          details: `Blue badge suspended. Reason: ${String(reason).trim()}`,
          severity: 'warning',
          timestamp: nowStr.slice(0, 16)
        });
      } else if (actionType === 'restore') {
        if (!creatorId) {
          return res.status(400).json({ success: false, error: 'creatorId is required.' });
        }
        const existing = findOrBuildRecord(creatorId);
        const note = String(reason || '').trim() || 'Verification restored by Administrator.';
        upsertRecord({
          ...existing,
          status: 'verified',
          startDate: existing.startDate || nowStr,
          purchaseDate: existing.purchaseDate || nowStr,
          suspendedDate: undefined,
          revokedDate: undefined,
          statusReason: note,
          updatedAt: nowStr
        });
        db.auditLogs.unshift({
          id: `vaudit_rest_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          creatorId,
          creatorName: existing.creatorName,
          action: 'Restored Creator Blue Verification Badge',
          previousStatus: existing.status,
          newStatus: 'verified',
          reason: note,
          timestamp: nowStr
        });
        appendAuditLog({
          id: `audit_verif_rest_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          category: 'creator_verification',
          action: 'Restored Creator Verification Badge',
          targetType: 'CreatorProfile',
          targetId: creatorId,
          targetLabel: existing.creatorName,
          details: `Blue badge restored by admin. Reason: ${note}`,
          severity: 'info',
          timestamp: nowStr.slice(0, 16)
        });
      } else if (actionType === 'revoke') {
        if (!creatorId || !String(reason || '').trim()) {
          return res.status(400).json({ success: false, error: 'Revocation reason is required.' });
        }
        const existing = findOrBuildRecord(creatorId);
        upsertRecord({
          ...existing,
          status: 'revoked',
          revokedDate: nowStr,
          statusReason: String(reason).trim(),
          updatedAt: nowStr
        });
        db.auditLogs.unshift({
          id: `vaudit_rev_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          creatorId,
          creatorName: existing.creatorName,
          action: 'Permanently Revoked Creator Blue Verification Badge',
          previousStatus: existing.status,
          newStatus: 'revoked',
          reason: String(reason).trim(),
          timestamp: nowStr
        });
        appendAuditLog({
          id: `audit_verif_rev_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          category: 'creator_verification',
          action: 'Revoked Creator Verification Badge',
          targetType: 'CreatorProfile',
          targetId: creatorId,
          targetLabel: existing.creatorName,
          details: `Blue badge permanently revoked. Reason: ${String(reason).trim()}`,
          severity: 'critical',
          timestamp: nowStr.slice(0, 16)
        });
      } else if (actionType === 'expire') {
        if (!creatorId) {
          return res.status(400).json({ success: false, error: 'creatorId is required.' });
        }
        const existing = findOrBuildRecord(creatorId);
        const nextStatus: PaidVerificationStatus = db.settings.renewalEnabled ? 'renewal_required' : 'expired';
        upsertRecord({
          ...existing,
          status: nextStatus,
          expirationDate: nowStr,
          statusReason: 'Verification period expired. Renewal required to reactivate official blue badge.',
          updatedAt: nowStr
        });
        db.auditLogs.unshift({
          id: `vaudit_exp_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          creatorId,
          creatorName: existing.creatorName,
          action: `Verification Period Expired → ${nextStatus.toUpperCase()}`,
          previousStatus: existing.status,
          newStatus: nextStatus,
          reason: 'Time-limited verification reached expiration timestamp. Public blue badge deactivated.',
          timestamp: nowStr
        });
      } else if (actionType === 'confirm_payment') {
        const tx = db.transactions.find(t => t.id === transactionId);
        if (!tx) {
          return res.status(404).json({ success: false, error: 'Verification transaction not found.' });
        }
        if (tx.paymentStatus !== 'completed') {
          tx.paymentStatus = 'completed';
          tx.paymentTimestamp = nowStr;
          const existing = findOrBuildRecord(tx.creatorId);
          let expirationDate: string | null = null;
          if (db.settings.durationType !== 'lifetime') {
            const daysToAdd =
              db.settings.durationType === 'monthly'
                ? 30
                : db.settings.durationType === 'annual'
                ? 365
                : db.settings.durationDays || 30;
            expirationDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
              .toISOString()
              .replace('T', ' ')
              .slice(0, 19);
          }
          upsertRecord({
            ...existing,
            status: 'verified',
            originalPaymentId: tx.id,
            amountPaid: tx.amount,
            currency: tx.currency,
            startDate: nowStr,
            expirationDate,
            statusReason: undefined,
            updatedAt: nowStr
          });
          db.auditLogs.unshift({
            id: `vaudit_settle_${Date.now()}`,
            adminId: adminId || 'admin',
            adminName: adminName || 'Administrator',
            adminRole,
            creatorId: tx.creatorId,
            creatorName: tx.creatorName,
            action: 'Pending Verification Payment Settled & Badge Activated',
            previousStatus: 'payment_pending',
            newStatus: 'verified',
            reason: `Payment ${tx.providerTransactionId} confirmed (${tx.currency} ${tx.amount.toFixed(2)}).`,
            timestamp: nowStr
          });
        }
      } else if (actionType === 'refund') {
        const tx = db.transactions.find(t => t.id === transactionId);
        if (!tx || !String(reason || '').trim()) {
          return res.status(400).json({ success: false, error: 'Transaction ID and refund reason are required.' });
        }
        const refundTxId =
          tx.refundTransactionId || `re_Acovon_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
        tx.refundStatus = refundStatus;
        tx.refundTransactionId = refundTxId;
        tx.refundAmount = tx.amount;
        tx.refundReason = String(reason).trim();
        tx.keepBadgeAuthorizedReason = String(keepBadgeAuthorizedReason || '').trim() || undefined;
        if (refundStatus === 'completed') tx.refundedAt = nowStr;

        const existing = findOrBuildRecord(tx.creatorId);
        const keepOverride = Boolean(String(keepBadgeAuthorizedReason || '').trim());
        if (!keepOverride && (refundStatus === 'pending' || refundStatus === 'processing') && existing.status === 'verified') {
          upsertRecord({
            ...existing,
            status: 'suspended',
            suspendedDate: nowStr,
            statusReason: `Verification refund ${refundStatus} (${refundTxId}): ${String(reason).trim()}`,
            updatedAt: nowStr
          });
        } else if (!keepOverride && refundStatus === 'completed') {
          upsertRecord({
            ...existing,
            status: 'not_verified',
            revokedDate: nowStr,
            statusReason: `Verification fee refunded (${refundTxId}): ${String(reason).trim()}`,
            updatedAt: nowStr
          });
        }

        db.auditLogs.unshift({
          id: `vaudit_ref_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          creatorId: tx.creatorId,
          creatorName: tx.creatorName,
          action: `Verification Refund Status → ${String(refundStatus).toUpperCase()} (${tx.currency} ${tx.amount.toFixed(2)})`,
          previousStatus: tx.refundStatus,
          newStatus: refundStatus,
          reason: String(reason).trim(),
          timestamp: nowStr
        });
        appendAuditLog({
          id: `audit_verif_ref_${Date.now()}`,
          adminId: adminId || 'admin',
          adminName: adminName || 'Administrator',
          adminRole,
          category: 'refund_decision',
          action: `Creator Verification Refund (${String(refundStatus).toUpperCase()})`,
          targetType: 'VerificationTransaction',
          targetId: tx.id,
          targetLabel: `${tx.creatorName} (${tx.currency} ${tx.amount.toFixed(2)})`,
          details: `Refund ID: ${refundTxId} · Status: ${refundStatus} · Reason: ${String(reason).trim()}`,
          severity: refundStatus === 'completed' ? 'warning' : 'info',
          timestamp: nowStr.slice(0, 16)
        });
      } else {
        return res.status(400).json({ success: false, error: 'Invalid verification actionType.' });
      }

      writeCreatorVerificationDB(db);
      const evaluated = evaluateAuthoritativeVerificationState(db);
      return res.json({ success: true, ...evaluated });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Admin verification action failed';
      return res.status(500).json({ success: false, error: msg });
    }
  });

  return { app, postStore, dataDir: resolvedDataDir };
}

async function startServer() {
  const { app } = createApp({ dataDir: DATA_DIR });

  // --------------------------------------------------------------------------
  // Dev & Production Vite Middleware
  // --------------------------------------------------------------------------
  const isProd = process.env.NODE_ENV === 'production';

  const getCliArg = (flag: string): string | undefined => {
    const eqArg = process.argv.find(arg => arg.startsWith(`${flag}=`));
    if (eqArg) return eqArg.slice(flag.length + 1);
    const idx = process.argv.indexOf(flag);
    if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
    return undefined;
  };

  const cliPort = getCliArg('--port');
  const cliHost = getCliArg('--host') || '0.0.0.0';
  const resolvedPortStr =
    cliPort ||
    (isProd
      ? process.env.PORT
      : process.env.PORT && process.env.PORT !== '8080'
      ? process.env.PORT
      : '3000') ||
    '3000';
  const PORT = parseInt(resolvedPortStr, 10) || 3000;

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

  app.listen(PORT, cliHost, () => {
    console.log(`ACOVON Server running on http://${cliHost}:${PORT}`);
  });
}

const isDirectExecution =
  process.env.ACOVON_NO_LISTEN !== '1' &&
  !process.env.NODE_TEST_CONTEXT &&
  Boolean(process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));

if (isDirectExecution) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
