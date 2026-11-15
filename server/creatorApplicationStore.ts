import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  AccountStatus,
  AdminPermissionLevel,
  AppNotification,
  CreatorApplicationAuditRecord,
  CreatorApplicationData,
  CreatorProfile,
  CreatorVerification,
  User,
  UserRole
} from '../src/types';
import { isRemovedDemoAccount, PLATFORM_ADMIN_ACCOUNTS } from '../src/data/mockData';

export interface CreatorApplicationsDB {
  users: Record<string, User>;
  creators: CreatorProfile[];
  applications: CreatorVerification[];
  notifications: AppNotification[];
  auditLogs: CreatorApplicationAuditRecord[];
  deletedUserIds?: string[];
  updatedAt: string;
}

export interface AdminTokenPayload {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'moderator';
  adminPermissionLevel: string;
  type: 'admin_session';
  iat: number;
  exp: number;
}

export interface StoreHttpError {
  statusCode: number;
  error: string;
  existingApplication?: CreatorVerification;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function formatShortTimestamp(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').slice(0, 16);
}

function normalizeEmail(email?: string): string {
  return String(email || '').trim().toLowerCase();
}

function normalizeUsername(username?: string, fallback?: string): string {
  const raw = String(username || fallback || 'member')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '_')
    .slice(0, 40);
  return raw.length >= 2 ? raw : `user_${Date.now().toString(36).slice(-4)}`;
}

const DEFAULT_AVATAR = '';
const DEFAULT_ID_DOC = '';
const DEFAULT_COVER = '';

const DEFAULT_PERMISSIONS_BY_LEVEL: Record<AdminPermissionLevel, string[]> = {
  super_admin: [
    'all_privileges',
    'manage_platform_branding',
    'role_assignment',
    'commission_control',
    'payout_release',
    'emergency_killswitch',
    'user_management',
    'creator_management',
    'content_moderation'
  ],
  admin: [
    'user_management',
    'creator_management',
    'creator_verification',
    'content_management',
    'live_management',
    'promotions_management',
    'role_assignment'
  ],
  moderator: [
    'content_moderation',
    'report_resolution',
    'creator_verification',
    'live_moderation'
  ],
  finance_admin: [
    'financial_ledger',
    'payout_approval',
    'refund_issuance',
    'dispute_resolution'
  ],
  support_admin: [
    'support_tickets',
    'account_recovery',
    'dispute_mediation'
  ]
};

export function getDefaultAdminPermissions(level: AdminPermissionLevel): string[] {
  return [...(DEFAULT_PERMISSIONS_BY_LEVEL[level] || DEFAULT_PERMISSIONS_BY_LEVEL.admin)];
}

export function isAdminUserRecord(user?: Partial<User> | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.role === 'moderator' || Boolean(user.adminPermissionLevel);
}

export class AuthoritativeCreatorApplicationStore {
  private readonly dataDir: string;
  private readonly dbFilePath: string;
  private readonly secretFilePath: string;
  private readonly onAuditAppend?: (entry: {
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
  }) => void;

  constructor(opts: {
    dataDir: string;
    seedDefaults?: boolean;
    onAuditAppend?: AuthoritativeCreatorApplicationStore['onAuditAppend'];
  }) {
    this.dataDir = opts.dataDir;
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    this.dbFilePath = path.join(this.dataDir, 'creator_applications_db.json');
    this.secretFilePath = path.join(this.dataDir, '.admin_session_secret');
    this.onAuditAppend = opts.onAuditAppend;

    if (!fs.existsSync(this.dbFilePath)) {
      const initialDb = this.createInitialDB(opts.seedDefaults !== false);
      this.writeDB(initialDb);
    }
  }

  private getSessionSecret(): string {
    if (process.env.ADMIN_SESSION_SECRET && process.env.ADMIN_SESSION_SECRET.length >= 16) {
      return process.env.ADMIN_SESSION_SECRET;
    }
    try {
      if (fs.existsSync(this.secretFilePath)) {
        const val = fs.readFileSync(this.secretFilePath, 'utf-8').trim();
        if (val.length >= 32) return val;
      }
      const generated = crypto.randomBytes(32).toString('hex');
      fs.writeFileSync(this.secretFilePath, generated, { mode: 0o600 });
      return generated;
    } catch {
      return crypto.createHash('sha256').update(this.dataDir + ':acovon-admin-session').digest('hex');
    }
  }

  public createAdminToken(admin: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    adminPermissionLevel?: string;
  }): string {
    const payload: AdminTokenPayload = {
      id: admin.id,
      name: admin.name,
      username: admin.username,
      email: normalizeEmail(admin.email),
      role: admin.role === 'moderator' ? 'moderator' : 'admin',
      adminPermissionLevel: admin.adminPermissionLevel || (admin.role === 'moderator' ? 'moderator' : 'super_admin'),
      type: 'admin_session',
      iat: Date.now(),
      exp: Date.now() + 24 * 60 * 60 * 1000
    };
    const encodedPayload = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.getSessionSecret())
      .update(encodedPayload)
      .digest('base64url');
    return `${encodedPayload}.${signature}`;
  }

  public verifyAdminToken(token?: string | null): AdminTokenPayload | null {
    if (!token || typeof token !== 'string') return null;
    const parts = token.trim().split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, providedSig] = parts;
    if (!encodedPayload || !providedSig) return null;

    const expectedSig = crypto
      .createHmac('sha256', this.getSessionSecret())
      .update(encodedPayload)
      .digest('base64url');

    const a = Buffer.from(providedSig, 'utf-8');
    const b = Buffer.from(expectedSig, 'utf-8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return null;
    }

    try {
      const parsed = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8')) as AdminTokenPayload;
      if (
        !parsed ||
        parsed.type !== 'admin_session' ||
        (parsed.role !== 'admin' && parsed.role !== 'moderator') ||
        typeof parsed.exp !== 'number' ||
        parsed.exp < Date.now()
      ) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private createInitialDB(seedDefaults: boolean): CreatorApplicationsDB {
    if (!seedDefaults) {
      return {
        users: {},
        creators: [],
        applications: [],
        notifications: [],
        auditLogs: [],
        deletedUserIds: [],
        updatedAt: new Date().toISOString()
      };
    }

    const seededUsers: Record<string, User> = deepClone(PLATFORM_ADMIN_ACCOUNTS);

    return {
      users: seededUsers,
      creators: [],
      applications: [],
      notifications: [],
      auditLogs: [],
      deletedUserIds: [],
      updatedAt: new Date().toISOString()
    };
  }

  public readDB(): CreatorApplicationsDB {
    try {
      if (fs.existsSync(this.dbFilePath)) {
        const raw = fs.readFileSync(this.dbFilePath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<CreatorApplicationsDB>;
        if (parsed && typeof parsed === 'object') {
          const deletedUserIds = Array.isArray(parsed.deletedUserIds)
            ? Array.from(new Set(parsed.deletedUserIds.filter((id): id is string => typeof id === 'string' && id.trim().length > 0)))
            : [];
          const deletedSet = new Set(deletedUserIds.map(id => id.toLowerCase()));
          const rawUsers = parsed.users && typeof parsed.users === 'object' ? parsed.users : {};
          const cleanUsers: Record<string, User> = {};
          let purgedRemovedDemo = false;

          for (const [k, u] of Object.entries(rawUsers)) {
            if (!u || !u.id) continue;
            const uEmail = normalizeEmail(u.email);
            if (
              deletedSet.has(u.id.toLowerCase()) ||
              deletedSet.has(k.toLowerCase()) ||
              (uEmail && deletedSet.has(uEmail))
            ) {
              continue;
            }
            if (isRemovedDemoAccount(u) || isRemovedDemoAccount({ id: k })) {
              purgedRemovedDemo = true;
              deletedSet.add(u.id.toLowerCase());
              deletedSet.add(k.toLowerCase());
              if (uEmail) deletedSet.add(uEmail);
              continue;
            }
            cleanUsers[k] = u;
          }

          const cleanCreators = Array.isArray(parsed.creators)
            ? parsed.creators.filter(c => {
                if (!c || !c.id) return false;
                const cEmail = normalizeEmail(c.email);
                if (deletedSet.has(c.id.toLowerCase()) || (cEmail && deletedSet.has(cEmail))) return false;
                if (isRemovedDemoAccount(c)) {
                  purgedRemovedDemo = true;
                  deletedSet.add(c.id.toLowerCase());
                  if (cEmail) deletedSet.add(cEmail);
                  return false;
                }
                return true;
              })
            : [];

          const cleanApplications = Array.isArray(parsed.applications)
            ? parsed.applications.filter(a => {
                if (!a) return false;
                const aEmail = normalizeEmail(a.email);
                if (
                  deletedSet.has(String(a.userId || '').toLowerCase()) ||
                  (aEmail && deletedSet.has(aEmail))
                ) {
                  return false;
                }
                if (isRemovedDemoAccount(a)) {
                  purgedRemovedDemo = true;
                  if (a.userId) deletedSet.add(String(a.userId).toLowerCase());
                  if (aEmail) deletedSet.add(aEmail);
                  return false;
                }
                return true;
              })
            : [];

          const cleanNotifications = Array.isArray(parsed.notifications)
            ? parsed.notifications.filter(
                n => n && !deletedSet.has(String(n.userId || '').toLowerCase())
              )
            : [];

          const cleanedDb: CreatorApplicationsDB = {
            users: cleanUsers,
            creators: cleanCreators,
            applications: cleanApplications,
            notifications: cleanNotifications,
            auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
            deletedUserIds: Array.from(deletedSet),
            updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString()
          };
          if (purgedRemovedDemo) {
            this.writeDB(cleanedDb);
          }
          return cleanedDb;
        }
      }
    } catch (err) {
      console.error('Error reading creator_applications_db.json:', err);
    }
    const fresh = this.createInitialDB(true);
    this.writeDB(fresh);
    return fresh;
  }

  public getDeletedUserIds(): string[] {
    const db = this.readDB();
    return [...(db.deletedUserIds || [])];
  }

  private writeDB(db: CreatorApplicationsDB): void {
    db.updatedAt = new Date().toISOString();
    const tmpPath = `${this.dbFilePath}.${crypto.randomBytes(4).toString('hex')}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.dbFilePath);
  }

  private findUserEntry(
    db: CreatorApplicationsDB,
    identifier: { userId?: string; email?: string; username?: string }
  ): { key: string; user: User } | null {
    const id = String(identifier.userId || '').trim();
    const email = normalizeEmail(identifier.email);
    const username = identifier.username ? normalizeUsername(identifier.username) : '';

    if (id && db.users[id]) {
      return { key: id, user: db.users[id] };
    }
    for (const [key, u] of Object.entries(db.users)) {
      if (!u) continue;
      if (id && u.id === id) return { key, user: u };
    }
    if (email) {
      for (const [key, u] of Object.entries(db.users)) {
        if (!u) continue;
        if (normalizeEmail(u.email) === email) return { key, user: u };
      }
    }
    if (username) {
      for (const [key, u] of Object.entries(db.users)) {
        if (!u) continue;
        if (normalizeUsername(u.username) === username) return { key, user: u };
      }
    }
    return null;
  }

  private findCreatorProfile(
    db: CreatorApplicationsDB,
    identifier: { userId?: string; email?: string; username?: string }
  ): CreatorProfile | undefined {
    const id = String(identifier.userId || '').trim();
    const email = normalizeEmail(identifier.email);
    const allCreators = [...db.creators];
    return allCreators.find(
      c =>
        (id && c.id === id) ||
        (email && normalizeEmail(c.email) === email)
    );
  }

  private addNotification(db: CreatorApplicationsDB, notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string; createdAt?: string; read?: boolean }): AppNotification {
    if (notif.eventKey) {
      const existing = db.notifications.find(n => n.eventKey === notif.eventKey);
      if (existing) return existing;
    }
    const created: AppNotification = {
      id: notif.id || `notif_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      userId: notif.userId,
      type: notif.type || 'verification',
      title: notif.title,
      message: notif.message,
      read: Boolean(notif.read),
      createdAt: notif.createdAt || formatShortTimestamp(),
      linkUrl: notif.linkUrl,
      targetRole: notif.targetRole,
      applicationId: notif.applicationId,
      eventKey: notif.eventKey
    };
    db.notifications.unshift(created);
    if (db.notifications.length > 500) {
      db.notifications = db.notifications.slice(0, 500);
    }
    return created;
  }

  private addAuditRecord(
    db: CreatorApplicationsDB,
    record: Omit<CreatorApplicationAuditRecord, 'id' | 'timestamp'> & { timestamp?: string }
  ): CreatorApplicationAuditRecord {
    const entry: CreatorApplicationAuditRecord = {
      id: `caudit_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      timestamp: record.timestamp || formatShortTimestamp(),
      ...record
    };
    db.auditLogs.unshift(entry);
    if (db.auditLogs.length > 500) {
      db.auditLogs = db.auditLogs.slice(0, 500);
    }
    if (this.onAuditAppend) {
      this.onAuditAppend({
        id: `audit_creator_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
        adminId: record.adminId,
        adminName: record.adminName,
        adminRole: record.adminRole,
        category: 'creator_approval',
        action:
          record.action === 'approved'
            ? 'Approved Creator Application & Upgraded Account to Creator'
            : record.action === 'rejected'
            ? 'Rejected Creator Application'
            : record.action === 'info_requested'
            ? 'Requested Additional Verification Info for Creator Application'
            : record.action === 'reconciled'
            ? 'Reconciled Historical Creator Application'
            : 'New Creator Application Submitted',
        targetType: 'CreatorApplication',
        targetId: record.applicationId,
        targetLabel: `${record.applicantName} (${record.applicantEmail})`,
        details: `${record.previousStatus} -> ${record.newStatus}: ${record.notes}`,
        severity: record.action === 'rejected' ? 'warning' : 'info',
        timestamp: entry.timestamp
      });
    }
    return entry;
  }

  private enrichApplication(db: CreatorApplicationsDB, app: CreatorVerification): CreatorVerification {
    const userEntry = this.findUserEntry(db, {
      userId: app.userId,
      email: app.email,
      username: app.username
    });
    const matchedUser = userEntry?.user;
    const creator = this.findCreatorProfile(db, { userId: app.userId, email: app.email });
    const resolvedEmail =
      (app.email && app.email.includes('@') ? app.email : '') ||
      matchedUser?.email ||
      creator?.email ||
      `${app.username || 'applicant'}@acovon.com`;
    const resolvedAvatar =
      app.avatar ||
      matchedUser?.avatar ||
      creator?.avatar ||
      app.selfieUrl ||
      DEFAULT_AVATAR;

    return {
      ...app,
      email: resolvedEmail,
      avatar: resolvedAvatar,
      name: app.name || matchedUser?.name || app.applicationData?.displayName || 'Creator Applicant',
      username: app.username || matchedUser?.username || normalizeUsername(resolvedEmail.split('@')[0]),
      documentFileUrl: app.documentFileUrl || DEFAULT_ID_DOC,
      selfieUrl: app.selfieUrl || resolvedAvatar
    };
  }

  private ensureCreatorProfile(
    db: CreatorApplicationsDB,
    user: User,
    app?: CreatorVerification,
    adminActor?: { id: string; name: string }
  ): CreatorProfile {
    const nowStr = formatShortTimestamp();
    const cleanEmail = normalizeEmail(user.email || app?.email);
    const appData = app?.applicationData;
    const displayName = appData?.displayName || app?.name || user.name || 'Creator';
    const username = user.username || app?.username || normalizeUsername(cleanEmail.split('@')[0]);
    const email = user.email || app?.email || `${username}@acovon.com`;
    const avatar = user.avatar || app?.avatar || app?.selfieUrl || DEFAULT_AVATAR;
    const tierPrice = Number(appData?.monthlyTierPrice) > 0 ? Number(appData?.monthlyTierPrice) : 14.99;
    const category = appData?.category || 'Fashion & Luxury';
    const bio = appData?.bio || 'Official ACOVON verified creator.';

    const existingCreatorIdx = db.creators.findIndex(
      c => c.id === user.id || (cleanEmail && normalizeEmail(c.email) === cleanEmail)
    );
    const existingCreator = existingCreatorIdx >= 0 ? db.creators[existingCreatorIdx] : undefined;

    const creatorProfile: CreatorProfile = existingCreator
      ? {
          ...existingCreator,
          id: user.id,
          name: existingCreator.name || displayName,
          username: existingCreator.username || username,
          email,
          avatar: existingCreator.avatar || avatar,
          bio: appData?.bio || existingCreator.bio || bio,
          category: appData?.category || existingCreator.category || category,
          role: 'creator',
          isVerified: true,
          accountStatus: user.accountStatus || existingCreator.accountStatus || 'active',
          walletBalance: typeof user.walletBalance === 'number' ? user.walletBalance : existingCreator.walletBalance,
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          creatorApprovedByAdminId: adminActor?.id || user.creatorApprovedByAdminId || existingCreator.creatorApprovedByAdminId,
          creatorApprovedByAdminName: adminActor?.name || user.creatorApprovedByAdminName || existingCreator.creatorApprovedByAdminName,
          creatorApprovedAt: user.creatorApprovedAt || existingCreator.creatorApprovedAt || nowStr,
          creatorRejectionReason: undefined,
          updatedAt: nowStr
        }
      : {
          id: user.id,
          name: displayName,
          username,
          email,
          avatar,
          coverImage: DEFAULT_COVER,
          bio,
          category,
          role: 'creator',
          accountStatus: user.accountStatus || 'active',
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          creatorApprovedByAdminId: adminActor?.id || user.creatorApprovedByAdminId,
          creatorApprovedByAdminName: adminActor?.name || user.creatorApprovedByAdminName,
          creatorApprovedAt: user.creatorApprovedAt || nowStr,
          updatedAt: nowStr,
          walletBalance: typeof user.walletBalance === 'number' ? user.walletBalance : 0,
          pendingBalance: 0,
          totalEarnings: 0,
          withdrawnAmount: 0,
          subscribersCount: 0,
          followersCount: 0,
          isVerified: true,
          is18PlusConfirmed: true,
          dateJoined: user.dateJoined || new Date().toISOString().split('T')[0],
          country: user.country || 'United States',
          isLiveForCalls: true,
          callRatePerMinute: 3.5,
          instantCallsEnabled: true,
          minCallMinutes: 5,
          maxCallMinutes: 60,
          acceptingCustomRequests: true,
          customRequestBasePrice: 50.0,
          customRequestDeliveryDays: 3,
          customRequestTerms: 'Custom video commissions and personalized creator video recordings.',
          tiers: [
            {
              id: `tier_std_${Date.now()}`,
              name: 'Standard Access',
              price: Number(tierPrice.toFixed(2)),
              perks: ['Full feed access', 'Community posts', 'Exclusive photo previews']
            },
            {
              id: `tier_vip_${Date.now()}`,
              name: 'VIP Gold Access',
              price: Number((tierPrice * 2.5).toFixed(2)),
              perks: ['Full feed access', 'VIP Livestreams included', 'Direct 1-on-1 messaging', 'Priority custom requests']
            }
          ]
        };

    if (existingCreatorIdx >= 0) {
      db.creators[existingCreatorIdx] = creatorProfile;
    } else {
      db.creators.unshift(creatorProfile);
    }
    return creatorProfile;
  }

  // Sync user account without ever allowing client role escalation
  public syncUserAccount(input: {
    id?: string;
    name?: string;
    username?: string;
    email: string;
    avatar?: string;
    dateJoined?: string;
    country?: string;
    is18PlusConfirmed?: boolean;
    remoteRole?: UserRole;
    remoteAdminLevel?: AdminPermissionLevel;
    remoteAdminPermissions?: string[];
  }): {
    user: User;
    creatorProfile?: CreatorProfile;
    latestApplication?: CreatorVerification;
    notifications: AppNotification[];
  } {
    const db = this.readDB();
    const cleanEmail = normalizeEmail(input.email);
    const nowStr = formatShortTimestamp();
    const existing = this.findUserEntry(db, {
      userId: input.id,
      email: cleanEmail
    });

    const isRemoteAdmin = input.remoteRole === 'admin' || input.remoteRole === 'moderator' || Boolean(input.remoteAdminLevel);

    if (existing) {
      const existingIsAdmin = isAdminUserRecord(existing.user);
      const promoteFromRemoteAdmin = isRemoteAdmin;
      const promoteFromRemoteCreator =
        input.remoteRole === 'creator' &&
        !existingIsAdmin &&
        !promoteFromRemoteAdmin;

      const resolvedAdminLevel: AdminPermissionLevel | undefined = promoteFromRemoteAdmin
        ? (input.remoteAdminLevel || existing.user.adminPermissionLevel || (input.remoteRole === 'moderator' ? 'moderator' : 'admin'))
        : existing.user.adminPermissionLevel;

      const resolvedRole: UserRole = promoteFromRemoteAdmin
        ? (resolvedAdminLevel === 'moderator' ? 'moderator' : input.remoteRole === 'moderator' ? 'moderator' : 'admin')
        : existingIsAdmin
        ? existing.user.role
        : promoteFromRemoteCreator
        ? 'creator'
        : existing.user.role;

      const resolvedAdminPermissions =
        promoteFromRemoteAdmin && Array.isArray(input.remoteAdminPermissions) && input.remoteAdminPermissions.length > 0
          ? [...input.remoteAdminPermissions]
          : existing.user.adminPermissions || (resolvedAdminLevel ? getDefaultAdminPermissions(resolvedAdminLevel) : undefined);

      const grantCreatorFields =
        resolvedRole === 'admin' || resolvedRole === 'moderator' || promoteFromRemoteCreator;

      const updatedUser: User = {
        ...existing.user,
        name: existing.user.name || (input.name || '').trim() || cleanEmail.split('@')[0] || 'Member',
        avatar: existing.user.avatar || input.avatar || DEFAULT_AVATAR,
        email: cleanEmail || existing.user.email,
        role: resolvedRole,
        ...(resolvedAdminLevel ? { adminPermissionLevel: resolvedAdminLevel } : {}),
        ...(resolvedAdminPermissions ? { adminPermissions: resolvedAdminPermissions } : {}),
        ...(grantCreatorFields
          ? {
              creatorApplicationStatus: 'approved' as const,
              creatorApprovalStatus: 'approved' as const,
              isVerified: true,
              creatorRejectionReason: undefined
            }
          : {}),
        lastLoginAt: nowStr,
        updatedAt: nowStr
      };
      db.users[existing.key] = updatedUser;
      this.writeDB(db);
      return this.buildSessionStateFromDB(db, updatedUser);
    }

    const userId = (input.id && input.id.trim()) || `user_fan_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const baseUsername = normalizeUsername(input.username, cleanEmail.split('@')[0]);
    const usernameConflict = Object.values(db.users).some(
      u => normalizeUsername(u.username) === baseUsername
    );
    const finalUsername = usernameConflict
      ? `${baseUsername}_${crypto.randomBytes(2).toString('hex')}`
      : baseUsername;

    const initialAdminLevel: AdminPermissionLevel | undefined = isRemoteAdmin
      ? (input.remoteAdminLevel || (input.remoteRole === 'moderator' ? 'moderator' : 'admin'))
      : undefined;

    const initialRole: UserRole = isRemoteAdmin
      ? (initialAdminLevel === 'moderator' || input.remoteRole === 'moderator' ? 'moderator' : 'admin')
      : input.remoteRole === 'creator'
      ? 'creator'
      : 'fan';

    const autoCreator = initialRole === 'creator' || initialRole === 'admin' || initialRole === 'moderator';

    const newUser: User = {
      id: userId,
      name: (input.name || '').trim() || cleanEmail.split('@')[0] || 'Member',
      username: finalUsername,
      email: cleanEmail,
      avatar: input.avatar || DEFAULT_AVATAR,
      role: initialRole,
      ...(initialAdminLevel ? { adminPermissionLevel: initialAdminLevel } : {}),
      ...(initialAdminLevel
        ? {
            adminPermissions:
              Array.isArray(input.remoteAdminPermissions) && input.remoteAdminPermissions.length > 0
                ? [...input.remoteAdminPermissions]
                : getDefaultAdminPermissions(initialAdminLevel)
          }
        : {}),
      accountStatus: 'active',
      creatorApplicationStatus: autoCreator ? 'approved' : 'not_applied',
      creatorApprovalStatus: autoCreator ? 'approved' : 'not_applied',
      walletBalance: 0,
      isVerified: autoCreator,
      is18PlusConfirmed: input.is18PlusConfirmed !== false,
      dateJoined: input.dateJoined || new Date().toISOString().split('T')[0],
      lastLoginAt: nowStr,
      updatedAt: nowStr,
      country: input.country || 'United States'
    };

    db.users[userId] = newUser;
    this.writeDB(db);
    return this.buildSessionStateFromDB(db, newUser);
  }

  private buildSessionStateFromDB(db: CreatorApplicationsDB, user: User): {
    user: User;
    creatorProfile?: CreatorProfile;
    latestApplication?: CreatorVerification;
    notifications: AppNotification[];
  } {
    const cleanEmail = normalizeEmail(user.email);
    const userApps = db.applications
      .filter(
        a =>
          a.userId === user.id ||
          (cleanEmail && normalizeEmail(a.email) === cleanEmail)
      )
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

    const latestAppRaw = userApps[0];
    const hasAnyApprovedApp = userApps.some(a => a.status === 'approved');
    const latestIsBlocked =
      latestAppRaw?.status === 'pending' ||
      latestAppRaw?.status === 'info_requested' ||
      latestAppRaw?.status === 'rejected';

    let existingCreator = this.findCreatorProfile(db, {
      userId: user.id,
      email: cleanEmail,
      username: user.username
    });

    const isAccountActive =
      user.accountStatus !== 'suspended' &&
      user.accountStatus !== 'banned' &&
      user.accountStatus !== 'disabled';

    const userIsAdmin = isAdminUserRecord(user);

    const shouldBeApprovedCreator =
      !userIsAdmin &&
      isAccountActive &&
      (latestAppRaw?.status === 'approved' ||
        (hasAnyApprovedApp && !latestIsBlocked) ||
        (user.role === 'creator' && user.creatorApprovalStatus !== 'pending' && user.creatorApprovalStatus !== 'rejected') ||
        (Boolean(existingCreator) && !latestIsBlocked));

    let effectiveUser = deepClone(user);
    let dbDirty = false;

    if (userIsAdmin && isAccountActive) {
      // Admins & Moderators are automatically approved Creators without needing creator approval
      const ensuredLevel: AdminPermissionLevel =
        effectiveUser.adminPermissionLevel ||
        (effectiveUser.role === 'moderator' ? 'moderator' : 'admin');
      const ensuredRole: UserRole =
        effectiveUser.role === 'moderator' || ensuredLevel === 'moderator' ? 'moderator' : 'admin';
      if (
        effectiveUser.role !== ensuredRole ||
        effectiveUser.adminPermissionLevel !== ensuredLevel ||
        effectiveUser.creatorApprovalStatus !== 'approved' ||
        effectiveUser.creatorApplicationStatus !== 'approved' ||
        !effectiveUser.isVerified
      ) {
        effectiveUser = {
          ...effectiveUser,
          role: ensuredRole,
          adminPermissionLevel: ensuredLevel,
          adminPermissions:
            effectiveUser.adminPermissions && effectiveUser.adminPermissions.length > 0
              ? effectiveUser.adminPermissions
              : getDefaultAdminPermissions(ensuredLevel),
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          isVerified: true,
          creatorRejectionReason: undefined,
          creatorApprovedAt: effectiveUser.creatorApprovedAt || formatShortTimestamp()
        };
        const entry = this.findUserEntry(db, { userId: effectiveUser.id, email: cleanEmail });
        db.users[entry?.key || effectiveUser.id] = deepClone(effectiveUser);
        dbDirty = true;
      }
      if (!existingCreator || existingCreator.id !== effectiveUser.id) {
        existingCreator = this.ensureCreatorProfile(db, effectiveUser);
        dbDirty = true;
      }
    } else if (shouldBeApprovedCreator) {
      const approvedApp = userApps.find(a => a.status === 'approved') || latestAppRaw;
      if (
        effectiveUser.role !== 'creator' ||
        effectiveUser.creatorApprovalStatus !== 'approved' ||
        effectiveUser.creatorApplicationStatus !== 'approved' ||
        !effectiveUser.isVerified
      ) {
        effectiveUser = {
          ...effectiveUser,
          role: 'creator',
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          isVerified: true,
          creatorRejectionReason: undefined,
          creatorApprovedAt: effectiveUser.creatorApprovedAt || approvedApp?.reviewedAt || formatShortTimestamp(),
          creatorApprovedByAdminId: effectiveUser.creatorApprovedByAdminId || approvedApp?.reviewedByAdminId,
          creatorApprovedByAdminName: effectiveUser.creatorApprovedByAdminName || approvedApp?.reviewedByAdminName
        };
        const entry = this.findUserEntry(db, { userId: effectiveUser.id, email: cleanEmail });
        db.users[entry?.key || effectiveUser.id] = deepClone(effectiveUser);
        dbDirty = true;
      }
      if (!existingCreator || existingCreator.id !== effectiveUser.id) {
        existingCreator = this.ensureCreatorProfile(db, effectiveUser, approvedApp);
        dbDirty = true;
      }
    } else if (
      !userIsAdmin &&
      latestAppRaw &&
      (latestAppRaw.status === 'pending' || latestAppRaw.status === 'info_requested') &&
      effectiveUser.creatorApprovalStatus !== 'pending'
    ) {
      effectiveUser = {
        ...effectiveUser,
        role: 'fan',
        creatorApplicationStatus: 'pending',
        creatorApprovalStatus: 'pending'
      };
      const entry = this.findUserEntry(db, { userId: effectiveUser.id, email: cleanEmail });
      db.users[entry?.key || effectiveUser.id] = deepClone(effectiveUser);
      dbDirty = true;
    }

    if (dbDirty) {
      this.writeDB(db);
    }

    const creatorProfile = (userIsAdmin && isAccountActive) || shouldBeApprovedCreator ? existingCreator : undefined;
    const latestApplication = latestAppRaw ? this.enrichApplication(db, latestAppRaw) : undefined;
    const notifications = db.notifications.filter(
      n => n.userId === effectiveUser.id && n.targetRole !== 'admin'
    );

    return {
      user: deepClone(effectiveUser),
      creatorProfile: creatorProfile ? deepClone(creatorProfile) : undefined,
      latestApplication,
      notifications: deepClone(notifications)
    };
  }

  public getUserSessionState(query: { userId?: string; email?: string }): {
    found: boolean;
    user?: User;
    creatorProfile?: CreatorProfile;
    latestApplication?: CreatorVerification;
    notifications: AppNotification[];
  } {
    const db = this.readDB();
    const cleanEmail = normalizeEmail(query.email);
    const existing = this.findUserEntry(db, {
      userId: query.userId,
      email: cleanEmail
    });

    if (existing) {
      return {
        found: true,
        ...this.buildSessionStateFromDB(db, existing.user)
      };
    }

    // Fallback: if an application or creator exists by userId/email even before db.users was synced
    const matchedCreator = this.findCreatorProfile(db, { userId: query.userId, email: cleanEmail });
    const matchedApp = db.applications.find(
      a => (query.userId && a.userId === query.userId) || (cleanEmail && normalizeEmail(a.email) === cleanEmail)
    );
    if (matchedCreator || matchedApp) {
      const uid = matchedCreator?.id || matchedApp?.userId || query.userId || `user_fan_${Date.now()}`;
      const resolvedEmail = cleanEmail || normalizeEmail(matchedCreator?.email || matchedApp?.email);
      const synthesized: User = {
        id: uid,
        name: matchedCreator?.name || matchedApp?.name || resolvedEmail.split('@')[0] || 'Member',
        username: matchedCreator?.username || matchedApp?.username || normalizeUsername(resolvedEmail.split('@')[0]),
        email: resolvedEmail || `${uid}@acovon.com`,
        avatar: matchedCreator?.avatar || matchedApp?.avatar || DEFAULT_AVATAR,
        role: matchedCreator || matchedApp?.status === 'approved' ? 'creator' : 'fan',
        accountStatus: matchedCreator?.accountStatus || 'active',
        creatorApplicationStatus: matchedCreator || matchedApp?.status === 'approved' ? 'approved' : matchedApp?.status === 'rejected' ? 'rejected' : 'pending',
        creatorApprovalStatus: matchedCreator || matchedApp?.status === 'approved' ? 'approved' : matchedApp?.status === 'rejected' ? 'rejected' : 'pending',
        walletBalance: matchedCreator?.walletBalance || 0,
        isVerified: Boolean(matchedCreator || matchedApp?.status === 'approved'),
        is18PlusConfirmed: true,
        dateJoined: matchedCreator?.dateJoined || matchedApp?.submittedAt?.split(' ')[0] || new Date().toISOString().split('T')[0],
        country: matchedCreator?.country || 'United States'
      };
      db.users[uid] = synthesized;
      this.writeDB(db);
      return {
        found: true,
        ...this.buildSessionStateFromDB(db, synthesized)
      };
    }

    return { found: false, notifications: [] };
  }

  public submitCreatorApplication(input: {
    userId: string;
    email?: string;
    name?: string;
    username?: string;
    avatar?: string;
    applicationData: CreatorApplicationData;
  }):
    | { ok: true; application: CreatorVerification; user: User; adminNotification: AppNotification; userNotification: AppNotification }
    | ({ ok: false } & StoreHttpError) {
    const db = this.readDB();
    const data = input.applicationData;

    if (!data || !data.displayName || !data.displayName.trim()) {
      return { ok: false, statusCode: 400, error: 'Creator display name is required.' };
    }
    if (!data.ageConfirmed || !data.termsAccepted) {
      return { ok: false, statusCode: 400, error: 'You must certify 18+ legal age and agree to Creator Terms.' };
    }
    if (!data.documentNumber || !data.documentNumber.trim()) {
      return { ok: false, statusCode: 400, error: 'Government identification document number is required.' };
    }

    const cleanEmail = normalizeEmail(input.email);
    let userEntry = this.findUserEntry(db, {
      userId: input.userId,
      email: cleanEmail,
      username: input.username
    });

    const nowStr = formatShortTimestamp();
    const resolvedUserId = userEntry?.user.id || input.userId || `user_fan_${Date.now()}`;
    const resolvedEmail = cleanEmail || userEntry?.user.email || '';

    if (!resolvedEmail || !resolvedEmail.includes('@')) {
      return { ok: false, statusCode: 400, error: 'Valid applicant email address is required.' };
    }

    if (userEntry?.user.role === 'creator' && userEntry.user.creatorApprovalStatus === 'approved') {
      return { ok: false, statusCode: 409, error: 'Your account is already an approved Creator.' };
    }

    // Prevent duplicate pending application for same userId or email
    const existingPending = db.applications.find(
      a =>
        (a.userId === resolvedUserId || (resolvedEmail && normalizeEmail(a.email) === resolvedEmail)) &&
        (a.status === 'pending' || a.status === 'info_requested')
    );
    if (existingPending) {
      return {
        ok: false,
        statusCode: 409,
        error: 'You already have a pending creator application awaiting administrator review.',
        existingApplication: this.enrichApplication(db, existingPending)
      };
    }

    const baseUser: User = userEntry?.user || {
      id: resolvedUserId,
      name: (input.name || data.displayName).trim(),
      username: normalizeUsername(input.username, resolvedEmail.split('@')[0]),
      email: resolvedEmail,
      avatar: input.avatar || data.selfieUrl || DEFAULT_AVATAR,
      role: 'fan',
      accountStatus: 'active',
      creatorApplicationStatus: 'pending',
      creatorApprovalStatus: 'pending',
      walletBalance: 0,
      isVerified: false,
      is18PlusConfirmed: true,
      dateJoined: new Date().toISOString().split('T')[0],
      lastLoginAt: nowStr,
      updatedAt: nowStr,
      country: 'United States'
    };

    const updatedUser: User = {
      ...baseUser,
      id: resolvedUserId,
      email: resolvedEmail,
      role: baseUser.role === 'admin' || baseUser.role === 'moderator' ? baseUser.role : 'fan',
      creatorApplicationStatus: 'pending',
      creatorApprovalStatus: 'pending',
      creatorRejectionReason: undefined,
      updatedAt: nowStr
    };

    const userKey = userEntry?.key || resolvedUserId;
    db.users[userKey] = updatedUser;

    const appId = `verif_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const application: CreatorVerification = {
      id: appId,
      userId: resolvedUserId,
      name: data.displayName.trim(),
      username: updatedUser.username,
      email: resolvedEmail,
      avatar: updatedUser.avatar,
      documentType: data.documentType || 'drivers_license',
      documentNumber: data.documentNumber.trim(),
      documentFileUrl: data.documentFileUrl || DEFAULT_ID_DOC,
      selfieUrl: data.selfieUrl || updatedUser.avatar || DEFAULT_AVATAR,
      status: 'pending',
      submittedAt: nowStr,
      updatedAt: nowStr,
      source: 'web_application',
      notes: `Creator application for category: ${data.category || 'General'}. Linked account: ${resolvedEmail} (@${updatedUser.username}).`,
      applicationData: {
        ...data,
        displayName: data.displayName.trim(),
        documentNumber: data.documentNumber.trim(),
        ageConfirmed: true,
        termsAccepted: true
      }
    };

    db.applications.unshift(application);

    this.addAuditRecord(db, {
      applicationId: appId,
      applicantUserId: resolvedUserId,
      applicantEmail: resolvedEmail,
      applicantName: application.name,
      previousStatus: 'not_applied',
      newStatus: 'pending',
      action: 'submitted',
      adminId: resolvedUserId,
      adminName: application.name,
      adminRole: 'applicant',
      notes: `Submitted 18+ creator verification in category "${data.category || 'General'}" (${application.documentType} #${application.documentNumber}).`
    });

    const adminNotification = this.addNotification(db, {
      userId: 'admin_broadcast',
      targetRole: 'admin',
      applicationId: appId,
      type: 'verification',
      title: 'New Creator Application Received',
      message: `${application.name} (@${application.username} · ${resolvedEmail}) submitted a Creator application awaiting review.`,
      eventKey: `creator_app_submitted_${appId}`
    });

    const userNotification = this.addNotification(db, {
      userId: resolvedUserId,
      targetRole: 'fan',
      applicationId: appId,
      type: 'verification',
      title: 'Creator Application Under Review',
      message: 'Your 18+ identity verification & creator application have been linked to your existing ACOVON account and submitted for Admin approval.',
      eventKey: `creator_app_receipt_${appId}`
    });

    this.writeDB(db);
    return {
      ok: true,
      application: this.enrichApplication(db, application),
      user: deepClone(updatedUser),
      adminNotification,
      userNotification
    };
  }

  // Safely recovers an applicant's own localStorage pending application without creating duplicates
  public recoverOwnPendingApplication(input: {
    user?: Partial<User>;
    application: CreatorVerification;
  }): { recovered: boolean; application: CreatorVerification } {
    const db = this.readDB();
    const rawApp = input.application;
    const cleanEmail = normalizeEmail(rawApp.email || input.user?.email);
    const deletedSet = new Set((db.deletedUserIds || []).map(id => id.toLowerCase()));

    if (
      isRemovedDemoAccount(rawApp) ||
      isRemovedDemoAccount(input.user) ||
      (rawApp.userId && deletedSet.has(String(rawApp.userId).toLowerCase())) ||
      (cleanEmail && deletedSet.has(cleanEmail))
    ) {
      return { recovered: false, application: rawApp };
    }

    const existingByIdOrUser = db.applications.find(
      a =>
        a.id === rawApp.id ||
        ((a.userId === rawApp.userId || (cleanEmail && normalizeEmail(a.email) === cleanEmail)) &&
          (a.status === 'pending' || a.status === 'info_requested' || a.status === 'approved'))
    );

    if (existingByIdOrUser) {
      return { recovered: false, application: this.enrichApplication(db, existingByIdOrUser) };
    }

    if (input.user && cleanEmail) {
      const existingUser = this.findUserEntry(db, { userId: input.user.id || rawApp.userId, email: cleanEmail });
      if (!existingUser) {
        const uid = input.user.id || rawApp.userId;
        db.users[uid] = {
          id: uid,
          name: input.user.name || rawApp.name || cleanEmail.split('@')[0],
          username: normalizeUsername(input.user.username || rawApp.username, cleanEmail.split('@')[0]),
          email: cleanEmail,
          avatar: input.user.avatar || rawApp.avatar || DEFAULT_AVATAR,
          role: 'fan',
          accountStatus: 'active',
          creatorApplicationStatus: 'pending',
          creatorApprovalStatus: 'pending',
          walletBalance: typeof input.user.walletBalance === 'number' ? input.user.walletBalance : 0,
          isVerified: false,
          is18PlusConfirmed: true,
          dateJoined: input.user.dateJoined || new Date().toISOString().split('T')[0],
          country: input.user.country || 'United States'
        };
      }
    }

    const recoveredApp: CreatorVerification = {
      ...rawApp,
      email: cleanEmail || rawApp.email,
      status: 'pending',
      source: rawApp.source || 'recovered_local'
    };
    db.applications.unshift(recoveredApp);
    this.addNotification(db, {
      userId: 'admin_broadcast',
      targetRole: 'admin',
      applicationId: recoveredApp.id,
      type: 'verification',
      title: 'New Creator Application Received',
      message: `${recoveredApp.name} (@${recoveredApp.username}${cleanEmail ? ` · ${cleanEmail}` : ''}) submitted a Creator application awaiting review.`,
      eventKey: `creator_app_submitted_${recoveredApp.id}`
    });
    this.writeDB(db);
    return { recovered: true, application: this.enrichApplication(db, recoveredApp) };
  }

  // Reconcile existing applications/users from localStorage or Supabase preserving original dates & statuses
  public reconcileApplications(
    adminActor: { id: string; name: string; role: string },
    payload: {
      applications?: CreatorVerification[];
      users?: Record<string, User>;
    }
  ): { recoveredCount: number; totalApplications: number; applications: CreatorVerification[] } {
    const db = this.readDB();
    let recoveredCount = 0;

    const deletedSet = new Set((db.deletedUserIds || []).map(id => id.toLowerCase()));

    if (payload.users && typeof payload.users === 'object') {
      for (const [key, candidate] of Object.entries(payload.users)) {
        if (!candidate || typeof candidate !== 'object' || !candidate.id) continue;
        const cleanEmail = normalizeEmail(candidate.email);
        if (
          isRemovedDemoAccount(candidate) ||
          isRemovedDemoAccount({ id: key }) ||
          deletedSet.has(key.toLowerCase()) ||
          deletedSet.has(String(candidate.id).toLowerCase()) ||
          (cleanEmail && deletedSet.has(cleanEmail))
        ) {
          continue;
        }
        const existing = this.findUserEntry(db, { userId: candidate.id, email: cleanEmail });
        if (!existing) {
          db.users[key] = deepClone(candidate);
        }
      }
    }

    if (Array.isArray(payload.applications)) {
      for (const raw of payload.applications) {
        if (!raw || !raw.id || !raw.userId) continue;
        const cleanEmail = normalizeEmail(raw.email);
        if (
          isRemovedDemoAccount(raw) ||
          deletedSet.has(String(raw.userId).toLowerCase()) ||
          (cleanEmail && deletedSet.has(cleanEmail))
        ) {
          continue;
        }
        const existsById = db.applications.some(a => a.id === raw.id);
        if (existsById) continue;

        // Avoid duplicating pending applications for the same user/email
        if (raw.status === 'pending' || raw.status === 'info_requested') {
          const dupPending = db.applications.some(
            a =>
              (a.userId === raw.userId || (cleanEmail && normalizeEmail(a.email) === cleanEmail)) &&
              (a.status === 'pending' || a.status === 'info_requested')
          );
          if (dupPending) continue;
        }

        const matchedUser = this.findUserEntry(db, {
          userId: raw.userId,
          email: cleanEmail,
          username: raw.username
        });

        const cleanApp: CreatorVerification = {
          ...deepClone(raw),
          email: cleanEmail || matchedUser?.user.email || `${raw.username}@acovon.com`,
          avatar: raw.avatar || matchedUser?.user.avatar || raw.selfieUrl || DEFAULT_AVATAR,
          source: raw.source || 'reconciled_recovery'
        };

        db.applications.push(cleanApp);
        recoveredCount += 1;

        this.addAuditRecord(db, {
          applicationId: cleanApp.id,
          applicantUserId: cleanApp.userId,
          applicantEmail: cleanApp.email || '',
          applicantName: cleanApp.name,
          previousStatus: 'untracked',
          newStatus: cleanApp.status,
          action: 'reconciled',
          adminId: adminActor.id,
          adminName: adminActor.name,
          adminRole: adminActor.role,
          notes: `Recovered existing application preserving original date (${cleanApp.submittedAt}) and status (${cleanApp.status}).`
        });

        if (cleanApp.status === 'pending' || cleanApp.status === 'info_requested') {
          this.addNotification(db, {
            userId: 'admin_broadcast',
            targetRole: 'admin',
            applicationId: cleanApp.id,
            type: 'verification',
            title: 'Recovered Pending Creator Application',
            message: `${cleanApp.name} (@${cleanApp.username} · ${cleanApp.email}) submitted on ${cleanApp.submittedAt} is awaiting Admin review.`,
            eventKey: `creator_app_submitted_${cleanApp.id}`
          });
        }
      }
    }

    if (recoveredCount > 0 || (payload.users && Object.keys(payload.users).length > 0)) {
      this.writeDB(db);
    }

    const listed = this.listAllApplications({});
    return {
      recoveredCount,
      totalApplications: listed.counts.all,
      applications: listed.applications
    };
  }

  public mergeExternalSupabaseApplications(rows: Array<Record<string, any>>): number {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    const db = this.readDB();
    let merged = 0;

    const deletedSet = new Set((db.deletedUserIds || []).map(id => id.toLowerCase()));

    for (const row of rows) {
      const id = String(row.id || '').trim();
      const userId = String(row.user_id || row.userId || '').trim();
      if (!id || !userId) continue;

      const email = normalizeEmail(row.email);
      if (
        isRemovedDemoAccount(row) ||
        deletedSet.has(userId.toLowerCase()) ||
        (email && deletedSet.has(email))
      ) {
        continue;
      }
      const status = (row.status || 'pending') as CreatorVerification['status'];
      const submittedAt = row.submitted_at
        ? String(row.submitted_at).replace('T', ' ').slice(0, 16)
        : formatShortTimestamp();
      const reviewedAt = row.reviewed_at ? String(row.reviewed_at).replace('T', ' ').slice(0, 16) : undefined;

      const existingIdx = db.applications.findIndex(a => a.id === id);
      if (existingIdx >= 0) {
        const existingApp = db.applications[existingIdx];
        const statusChanged = existingApp.status !== status;
        const matchedEntry = this.findUserEntry(db, { userId, email: email || existingApp.email });
        const needsCreatorSync =
          status === 'approved' &&
          (!matchedEntry ||
            matchedEntry.user.role !== 'creator' ||
            matchedEntry.user.creatorApprovalStatus !== 'approved' ||
            !this.findCreatorProfile(db, { userId: matchedEntry.user.id, email: email || matchedEntry.user.email }));

        if (!statusChanged && !needsCreatorSync) continue;

        const updatedApp: CreatorVerification = {
          ...existingApp,
          status,
          reviewedByAdminId: row.reviewed_by_admin_id || existingApp.reviewedByAdminId,
          reviewedByAdminName: row.reviewed_by_admin_name || existingApp.reviewedByAdminName,
          reviewedAt: reviewedAt || existingApp.reviewedAt,
          notes: row.notes || existingApp.notes,
          updatedAt: formatShortTimestamp()
        };
        db.applications[existingIdx] = updatedApp;

        const targetUserId = matchedEntry?.user.id || userId;
        const targetKey = matchedEntry?.key || targetUserId;
        const resolvedEmail = email || matchedEntry?.user.email || existingApp.email || '';
        const nowStr = formatShortTimestamp();

        if (status === 'approved') {
          const upgradedUser: User = {
            ...(matchedEntry?.user || {
              id: targetUserId,
              name: updatedApp.name,
              username: updatedApp.username,
              email: resolvedEmail || `${updatedApp.username}@acovon.com`,
              avatar: updatedApp.avatar || DEFAULT_AVATAR,
              accountStatus: 'active',
              walletBalance: 0,
              is18PlusConfirmed: true,
              dateJoined: submittedAt.split(' ')[0] || new Date().toISOString().split('T')[0],
              country: 'United States'
            }),
            role: 'creator',
            creatorApplicationStatus: 'approved',
            creatorApprovalStatus: 'approved',
            isVerified: true,
            creatorApprovedByAdminId: updatedApp.reviewedByAdminId,
            creatorApprovedByAdminName: updatedApp.reviewedByAdminName,
            creatorApprovedAt: updatedApp.reviewedAt || nowStr,
            creatorRejectionReason: undefined,
            updatedAt: nowStr
          };
          db.users[targetKey] = upgradedUser;
          this.ensureCreatorProfile(db, upgradedUser, updatedApp, {
            id: updatedApp.reviewedByAdminId || 'system',
            name: updatedApp.reviewedByAdminName || 'Admin'
          });
        } else if (status === 'rejected' && matchedEntry) {
          db.users[targetKey] = {
            ...matchedEntry.user,
            role:
              matchedEntry.user.role === 'admin' || matchedEntry.user.role === 'moderator'
                ? matchedEntry.user.role
                : 'fan',
            creatorApplicationStatus: 'rejected',
            creatorApprovalStatus: 'rejected',
            creatorRejectionReason: updatedApp.notes,
            updatedAt: nowStr
          };
        }
        merged += 1;
        continue;
      }

      if (status === 'pending' || status === 'info_requested') {
        const hasPending = db.applications.some(
          a =>
            (a.userId === userId || (email && normalizeEmail(a.email) === email)) &&
            (a.status === 'pending' || a.status === 'info_requested')
        );
        if (hasPending) continue;
      }

      const app: CreatorVerification = {
        id,
        userId,
        name: String(row.name || 'Creator Applicant'),
        username: normalizeUsername(row.username, email.split('@')[0]),
        email: email || `${row.username || 'applicant'}@acovon.com`,
        avatar: String(row.avatar || row.selfie_url || DEFAULT_AVATAR),
        documentType: (row.document_type || 'drivers_license') as CreatorVerification['documentType'],
        documentNumber: String(row.document_number || 'SUPA-DOC'),
        documentFileUrl: String(row.document_file_url || DEFAULT_ID_DOC),
        selfieUrl: String(row.selfie_url || row.avatar || DEFAULT_AVATAR),
        status,
        submittedAt,
        reviewedByAdminId: row.reviewed_by_admin_id || undefined,
        reviewedByAdminName: row.reviewed_by_admin_name || undefined,
        reviewedAt,
        notes: row.notes || undefined,
        source: 'supabase_sync',
        applicationData: row.application_data && typeof row.application_data === 'object' ? row.application_data : undefined
      };

      const matchedEntry = this.findUserEntry(db, { userId, email });
      const resolvedUid = matchedEntry?.user.id || userId;
      const targetKey = matchedEntry?.key || resolvedUid;
      if (status === 'approved') {
        const upgradedUser: User = {
          ...(matchedEntry?.user || {
            id: resolvedUid,
            name: app.name,
            username: app.username,
            email: email || app.email || `${app.username}@acovon.com`,
            avatar: app.avatar || DEFAULT_AVATAR,
            accountStatus: 'active',
            walletBalance: 0,
            is18PlusConfirmed: true,
            dateJoined: submittedAt.split(' ')[0] || new Date().toISOString().split('T')[0],
            country: 'United States'
          }),
          role: 'creator',
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          isVerified: true,
          creatorApprovedByAdminId: app.reviewedByAdminId,
          creatorApprovedByAdminName: app.reviewedByAdminName,
          creatorApprovedAt: app.reviewedAt || formatShortTimestamp(),
          creatorRejectionReason: undefined
        };
        db.users[targetKey] = upgradedUser;
        this.ensureCreatorProfile(db, upgradedUser, app, {
          id: app.reviewedByAdminId || 'system',
          name: app.reviewedByAdminName || 'Admin'
        });
      } else if (email && !matchedEntry) {
        db.users[resolvedUid] = {
          id: resolvedUid,
          name: app.name,
          username: app.username,
          email,
          avatar: app.avatar || DEFAULT_AVATAR,
          role: 'fan',
          accountStatus: 'active',
          creatorApplicationStatus: status === 'rejected' ? 'rejected' : 'pending',
          creatorApprovalStatus: status === 'rejected' ? 'rejected' : 'pending',
          walletBalance: 0,
          isVerified: false,
          is18PlusConfirmed: true,
          dateJoined: submittedAt.split(' ')[0] || new Date().toISOString().split('T')[0],
          country: 'United States'
        };
      }

      db.applications.push(app);
      merged += 1;

      if (status === 'pending' || status === 'info_requested') {
        this.addNotification(db, {
          userId: 'admin_broadcast',
          targetRole: 'admin',
          applicationId: app.id,
          type: 'verification',
          title: 'New Creator Application Received',
          message: `${app.name} (@${app.username} · ${app.email}) submitted a Creator application awaiting review.`,
          eventKey: `creator_app_submitted_${app.id}`
        });
      }
    }

    if (merged > 0) {
      this.writeDB(db);
    }
    return merged;
  }

  public listAllApplications(filters: {
    tab?: 'all' | 'pending' | 'approved' | 'rejected';
    status?: string;
    search?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  }): {
    applications: CreatorVerification[];
    total: number;
    counts: { all: number; pending: number; approved: number; rejected: number };
    users: Record<string, User>;
    creators: CreatorProfile[];
    auditLogs: CreatorApplicationAuditRecord[];
    adminNotifications: AppNotification[];
  } {
    const db = this.readDB();
    const enrichedAll = db.applications
      .map(a => this.enrichApplication(db, a))
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

    const counts = {
      all: enrichedAll.length,
      pending: enrichedAll.filter(a => a.status === 'pending' || a.status === 'info_requested').length,
      approved: enrichedAll.filter(a => a.status === 'approved').length,
      rejected: enrichedAll.filter(a => a.status === 'rejected').length
    };

    const filtered = enrichedAll.filter(a => {
      if (filters.tab === 'pending' && a.status !== 'pending' && a.status !== 'info_requested') return false;
      if (filters.tab === 'approved' && a.status !== 'approved') return false;
      if (filters.tab === 'rejected' && a.status !== 'rejected') return false;
      if (filters.status && filters.status !== 'all' && a.status !== filters.status) return false;
      if (filters.date && filters.date.trim()) {
        if (!String(a.submittedAt || '').includes(filters.date.trim())) return false;
      }
      if (filters.search && filters.search.trim()) {
        const q = filters.search.trim().toLowerCase();
        const hay = [
          a.name,
          a.username,
          a.email,
          a.id,
          a.userId,
          a.documentNumber,
          a.status,
          a.submittedAt,
          a.applicationData?.category
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const pageSize = filters.pageSize && filters.pageSize > 0 ? filters.pageSize : filtered.length || 50;
    const paginated =
      filters.page || filters.pageSize
        ? filtered.slice((page - 1) * pageSize, page * pageSize)
        : filtered;

    const adminNotifications = db.notifications.filter(n => n.targetRole === 'admin');

    return {
      applications: paginated,
      total: filtered.length,
      counts,
      users: deepClone(db.users),
      creators: deepClone(db.creators),
      auditLogs: deepClone(db.auditLogs),
      adminNotifications: deepClone(adminNotifications)
    };
  }

  public listApplicantOwnApplications(query: { userId?: string; email?: string }): {
    applications: CreatorVerification[];
    notifications: AppNotification[];
  } {
    const db = this.readDB();
    const uid = String(query.userId || '').trim();
    const cleanEmail = normalizeEmail(query.email);
    if (!uid && !cleanEmail) {
      return { applications: [], notifications: [] };
    }

    const apps = db.applications
      .filter(a => {
        if (uid && a.userId === uid) return true;
        if (cleanEmail && normalizeEmail(a.email) === cleanEmail) return true;
        return false;
      })
      .map(a => this.enrichApplication(db, a))
      .sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));

    const notifs = db.notifications.filter(n => n.userId === uid && n.targetRole !== 'admin');
    return {
      applications: deepClone(apps),
      notifications: deepClone(notifs)
    };
  }

  public approveApplication(
    applicationId: string,
    adminActor: { id: string; name: string; email?: string; role: string },
    notes?: string
  ):
    | {
        ok: true;
        application: CreatorVerification;
        user: User;
        creatorProfile: CreatorProfile;
        auditRecord: CreatorApplicationAuditRecord;
        notification: AppNotification;
      }
    | ({ ok: false } & StoreHttpError) {
    if (adminActor.role !== 'admin' && adminActor.role !== 'moderator') {
      return { ok: false, statusCode: 403, error: 'Forbidden: Only authorized administrators can approve creator applications.' };
    }

    const db = this.readDB();
    const appIndex = db.applications.findIndex(a => a.id === applicationId);
    if (appIndex < 0) {
      return { ok: false, statusCode: 404, error: `Creator application "${applicationId}" not found.` };
    }

    const targetApp = db.applications[appIndex];
    const adminEmail = normalizeEmail(adminActor.email);
    const appEmail = normalizeEmail(targetApp.email);

    // Block self-approval
    if (
      targetApp.userId === adminActor.id ||
      (adminEmail && appEmail && adminEmail === appEmail)
    ) {
      return { ok: false, statusCode: 403, error: 'Security Policy: Administrators cannot approve their own creator application.' };
    }

    // Enforce strict status transition: only pending / info_requested can be approved
    if (targetApp.status !== 'pending' && targetApp.status !== 'info_requested') {
      return {
        ok: false,
        statusCode: 409,
        error: `Application "${applicationId}" is already finalized as "${targetApp.status}" and cannot be approved again.`
      };
    }

    const nowStr = formatShortTimestamp();
    const cleanNotes = (notes || '').trim() || 'Biometric 18+ ID and Creator application approved by administrator.';
    const previousStatus = targetApp.status;

    const updatedApp: CreatorVerification = {
      ...targetApp,
      status: 'approved',
      reviewedByAdminId: adminActor.id,
      reviewedByAdminName: adminActor.name,
      reviewedAt: nowStr,
      notes: cleanNotes,
      updatedAt: nowStr
    };
    db.applications[appIndex] = updatedApp;

    // Upgrade the EXACT existing user record in place (NEVER create a duplicate account)
    const userEntry = this.findUserEntry(db, {
      userId: targetApp.userId,
      email: targetApp.email,
      username: targetApp.username
    });
    const resolvedUserId = userEntry?.user.id || targetApp.userId;
    const userKey = userEntry?.key || resolvedUserId;
    const existingUser = userEntry?.user;

    const appData = targetApp.applicationData;
    const displayName = appData?.displayName || targetApp.name || existingUser?.name || 'Creator';
    const username = existingUser?.username || targetApp.username || normalizeUsername(appEmail.split('@')[0]);
    const email = existingUser?.email || targetApp.email || `${username}@acovon.com`;
    const avatar = existingUser?.avatar || targetApp.avatar || targetApp.selfieUrl || DEFAULT_AVATAR;
    const tierPrice = Number(appData?.monthlyTierPrice) > 0 ? Number(appData?.monthlyTierPrice) : 14.99;
    const category = appData?.category || 'Fashion & Luxury';
    const bio = appData?.bio || 'Official ACOVON verified creator.';

    const upgradedUser: User = {
      ...(existingUser || {
        id: resolvedUserId,
        dateJoined: targetApp.submittedAt?.split(' ')[0] || new Date().toISOString().split('T')[0],
        country: 'United States',
        walletBalance: 0,
        is18PlusConfirmed: true
      }),
      id: resolvedUserId,
      name: existingUser?.name || displayName,
      username,
      email,
      avatar,
      role: 'creator' as UserRole,
      accountStatus: (existingUser?.accountStatus === 'suspended' ? 'suspended' : 'active') as AccountStatus,
      isVerified: true,
      is18PlusConfirmed: true,
      creatorApplicationStatus: 'approved',
      creatorApprovalStatus: 'approved',
      creatorApprovedByAdminId: adminActor.id,
      creatorApprovedByAdminName: adminActor.name,
      creatorApprovedAt: nowStr,
      creatorRejectionReason: undefined,
      updatedAt: nowStr
    };

    db.users[userKey] = upgradedUser;

    // Upsert CreatorProfile linked strictly to the SAME existing account ID
    const existingCreatorIdx = db.creators.findIndex(c => c.id === resolvedUserId);
    const existingBaselineCreator =
      existingCreatorIdx >= 0 ? db.creators[existingCreatorIdx] : undefined;

    const creatorProfile: CreatorProfile = existingBaselineCreator
      ? {
          ...existingBaselineCreator,
          id: resolvedUserId,
          name: displayName,
          username,
          email,
          avatar,
          bio: appData?.bio || existingBaselineCreator.bio || bio,
          category: appData?.category || existingBaselineCreator.category || category,
          role: 'creator',
          isVerified: true,
          accountStatus: upgradedUser.accountStatus,
          walletBalance: upgradedUser.walletBalance,
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          creatorApprovedByAdminId: adminActor.id,
          creatorApprovedByAdminName: adminActor.name,
          creatorApprovedAt: nowStr,
          creatorRejectionReason: undefined,
          updatedAt: nowStr
        }
      : {
          id: resolvedUserId,
          name: displayName,
          username,
          email,
          avatar,
          coverImage: DEFAULT_COVER,
          bio,
          category,
          role: 'creator',
          accountStatus: upgradedUser.accountStatus,
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          creatorApprovedByAdminId: adminActor.id,
          creatorApprovedByAdminName: adminActor.name,
          creatorApprovedAt: nowStr,
          updatedAt: nowStr,
          walletBalance: upgradedUser.walletBalance,
          pendingBalance: 0,
          totalEarnings: 0,
          withdrawnAmount: 0,
          subscribersCount: 0,
          followersCount: 0,
          isVerified: true,
          is18PlusConfirmed: true,
          dateJoined: upgradedUser.dateJoined,
          country: upgradedUser.country || 'United States',
          isLiveForCalls: true,
          callRatePerMinute: 3.5,
          instantCallsEnabled: true,
          minCallMinutes: 5,
          maxCallMinutes: 60,
          acceptingCustomRequests: true,
          customRequestBasePrice: 50.0,
          customRequestDeliveryDays: 3,
          customRequestTerms: 'Custom video commissions and personalized creator video recordings.',
          tiers: [
            {
              id: `tier_std_${Date.now()}`,
              name: 'Standard Access',
              price: Number(tierPrice.toFixed(2)),
              perks: ['Full feed access', 'Community posts', 'Exclusive photo previews']
            },
            {
              id: `tier_vip_${Date.now()}`,
              name: 'VIP Gold Access',
              price: Number((tierPrice * 2.5).toFixed(2)),
              perks: ['Full feed access', 'VIP Livestreams included', 'Direct 1-on-1 messaging', 'Priority custom requests']
            }
          ]
        };

    if (existingCreatorIdx >= 0) {
      db.creators[existingCreatorIdx] = creatorProfile;
    } else {
      db.creators.unshift(creatorProfile);
    }

    const auditRecord = this.addAuditRecord(db, {
      applicationId: updatedApp.id,
      applicantUserId: resolvedUserId,
      applicantEmail: email,
      applicantName: displayName,
      previousStatus,
      newStatus: 'approved',
      action: 'approved',
      adminId: adminActor.id,
      adminName: adminActor.name,
      adminRole: adminActor.role,
      notes: cleanNotes
    });

    const notification = this.addNotification(db, {
      userId: resolvedUserId,
      targetRole: 'creator',
      applicationId: updatedApp.id,
      type: 'verification',
      title: 'Creator Account Activated',
      message: 'Congratulations! Your Creator application has been approved. Your ACOVON Creator account is now active.',
      eventKey: `creator_app_approved_${updatedApp.id}`
    });

    this.writeDB(db);

    return {
      ok: true,
      application: this.enrichApplication(db, updatedApp),
      user: deepClone(upgradedUser),
      creatorProfile: deepClone(creatorProfile),
      auditRecord,
      notification
    };
  }

  public rejectApplication(
    applicationId: string,
    adminActor: { id: string; name: string; email?: string; role: string },
    notes?: string
  ):
    | {
        ok: true;
        application: CreatorVerification;
        user?: User;
        auditRecord: CreatorApplicationAuditRecord;
        notification: AppNotification;
      }
    | ({ ok: false } & StoreHttpError) {
    if (adminActor.role !== 'admin' && adminActor.role !== 'moderator') {
      return { ok: false, statusCode: 403, error: 'Forbidden: Only authorized administrators can reject creator applications.' };
    }

    const db = this.readDB();
    const appIndex = db.applications.findIndex(a => a.id === applicationId);
    if (appIndex < 0) {
      return { ok: false, statusCode: 404, error: `Creator application "${applicationId}" not found.` };
    }

    const targetApp = db.applications[appIndex];
    if (targetApp.status !== 'pending' && targetApp.status !== 'info_requested') {
      return {
        ok: false,
        statusCode: 409,
        error: `Application "${applicationId}" is already finalized as "${targetApp.status}" and cannot be changed.`
      };
    }

    const nowStr = formatShortTimestamp();
    const cleanNotes = (notes || '').trim() || 'Verification requirements could not be confirmed.';
    const previousStatus = targetApp.status;

    const updatedApp: CreatorVerification = {
      ...targetApp,
      status: 'rejected',
      reviewedByAdminId: adminActor.id,
      reviewedByAdminName: adminActor.name,
      reviewedAt: nowStr,
      notes: cleanNotes,
      updatedAt: nowStr
    };
    db.applications[appIndex] = updatedApp;

    const userEntry = this.findUserEntry(db, {
      userId: targetApp.userId,
      email: targetApp.email,
      username: targetApp.username
    });

    let updatedUser: User | undefined;
    if (userEntry) {
      updatedUser = {
        ...userEntry.user,
        role:
          userEntry.user.role === 'admin' || userEntry.user.role === 'moderator'
            ? userEntry.user.role
            : 'fan',
        creatorApplicationStatus: 'rejected',
        creatorApprovalStatus: 'rejected',
        creatorRejectionReason: cleanNotes,
        updatedAt: nowStr
      };
      db.users[userEntry.key] = updatedUser;
    }

    const resolvedEmail = updatedUser?.email || targetApp.email || `${targetApp.username}@acovon.com`;
    const auditRecord = this.addAuditRecord(db, {
      applicationId: updatedApp.id,
      applicantUserId: updatedUser?.id || targetApp.userId,
      applicantEmail: resolvedEmail,
      applicantName: targetApp.name,
      previousStatus,
      newStatus: 'rejected',
      action: 'rejected',
      adminId: adminActor.id,
      adminName: adminActor.name,
      adminRole: adminActor.role,
      notes: cleanNotes
    });

    const notification = this.addNotification(db, {
      userId: updatedUser?.id || targetApp.userId,
      targetRole: 'fan',
      applicationId: updatedApp.id,
      type: 'verification',
      title: 'Creator Application Update',
      message: `Your Creator application was not approved: ${cleanNotes}`,
      eventKey: `creator_app_rejected_${updatedApp.id}`
    });

    this.writeDB(db);

    return {
      ok: true,
      application: this.enrichApplication(db, updatedApp),
      user: updatedUser ? deepClone(updatedUser) : undefined,
      auditRecord,
      notification
    };
  }

  public requestMoreInfo(
    applicationId: string,
    adminActor: { id: string; name: string; email?: string; role: string },
    notes?: string
  ):
    | {
        ok: true;
        application: CreatorVerification;
        auditRecord: CreatorApplicationAuditRecord;
        notification: AppNotification;
      }
    | ({ ok: false } & StoreHttpError) {
    if (adminActor.role !== 'admin' && adminActor.role !== 'moderator') {
      return { ok: false, statusCode: 403, error: 'Forbidden: Only authorized administrators can request additional info.' };
    }

    const db = this.readDB();
    const appIndex = db.applications.findIndex(a => a.id === applicationId);
    if (appIndex < 0) {
      return { ok: false, statusCode: 404, error: `Creator application "${applicationId}" not found.` };
    }

    const targetApp = db.applications[appIndex];
    if (targetApp.status !== 'pending' && targetApp.status !== 'info_requested') {
      return {
        ok: false,
        statusCode: 409,
        error: `Application "${applicationId}" is already finalized as "${targetApp.status}".`
      };
    }

    const nowStr = formatShortTimestamp();
    const cleanNotes =
      (notes || '').trim() || 'Please upload a clearer photo of your government ID and selfie.';
    const previousStatus = targetApp.status;

    const updatedApp: CreatorVerification = {
      ...targetApp,
      status: 'info_requested',
      reviewedByAdminId: adminActor.id,
      reviewedByAdminName: adminActor.name,
      reviewedAt: nowStr,
      notes: cleanNotes,
      updatedAt: nowStr
    };
    db.applications[appIndex] = updatedApp;

    const auditRecord = this.addAuditRecord(db, {
      applicationId: updatedApp.id,
      applicantUserId: targetApp.userId,
      applicantEmail: targetApp.email || `${targetApp.username}@acovon.com`,
      applicantName: targetApp.name,
      previousStatus,
      newStatus: 'info_requested',
      action: 'info_requested',
      adminId: adminActor.id,
      adminName: adminActor.name,
      adminRole: adminActor.role,
      notes: cleanNotes
    });

    const notification = this.addNotification(db, {
      userId: targetApp.userId,
      targetRole: 'fan',
      applicationId: updatedApp.id,
      type: 'verification',
      title: 'Additional Verification Info Requested',
      message: `Acovon Trust & Safety requested additional details for your Creator application: ${cleanNotes}`,
      eventKey: `creator_app_info_${updatedApp.id}_${Date.now()}`
    });

    this.writeDB(db);

    return {
      ok: true,
      application: this.enrichApplication(db, updatedApp),
      auditRecord,
      notification
    };
  }

  public getUserOrCreator(userId: string): { user?: User; creator?: CreatorProfile } {
    const db = this.readDB();
    const userEntry = this.findUserEntry(db, { userId });
    const creator = this.findCreatorProfile(db, { userId });
    return {
      user: userEntry ? deepClone(userEntry.user) : undefined,
      creator: creator ? deepClone(creator) : undefined
    };
  }

  public listDirectoryCreators(): CreatorProfile[] {
    const db = this.readDB();
    return deepClone(db.creators);
  }

  public listAllUsersSafe(): Array<Omit<User, 'passwordHash'>> {
    const db = this.readDB();
    return Object.values(db.users).map(u => {
      const clone = deepClone(u);
      delete clone.passwordHash;
      return clone;
    });
  }

  public getWalletBalance(userId: string): number {
    const db = this.readDB();
    const userEntry = this.findUserEntry(db, { userId });
    const creator = this.findCreatorProfile(db, { userId });
    if (creator && typeof creator.walletBalance === 'number') {
      return Number(creator.walletBalance.toFixed(2));
    }
    if (userEntry && typeof userEntry.user.walletBalance === 'number') {
      return Number(userEntry.user.walletBalance.toFixed(2));
    }
    return 0;
  }

  public adjustUserWallet(userId: string, delta: number, opts?: { addCreatorEarnings?: number }): { ok: boolean; balance: number; error?: string } {
    const db = this.readDB();
    const userEntry = this.findUserEntry(db, { userId });
    const creatorIdx = db.creators.findIndex(c => c.id === userId);
    if (!userEntry && creatorIdx < 0) {
      return { ok: false, balance: 0, error: 'User account not found.' };
    }
    const currentBal =
      (creatorIdx >= 0 ? db.creators[creatorIdx].walletBalance : undefined) ??
      userEntry?.user.walletBalance ??
      0;
    const nextBal = Number((currentBal + delta).toFixed(2));
    if (delta < 0 && nextBal < -0.001) {
      return { ok: false, balance: currentBal, error: `Insufficient wallet balance ($${currentBal.toFixed(2)}).` };
    }
    const clampedBal = Math.max(0, nextBal);
    const nowStr = formatShortTimestamp();
    if (userEntry) {
      db.users[userEntry.key] = {
        ...userEntry.user,
        walletBalance: clampedBal,
        updatedAt: nowStr
      };
    }
    if (creatorIdx >= 0) {
      const prevCreator = db.creators[creatorIdx];
      const earningsInc = opts?.addCreatorEarnings ? Number(opts.addCreatorEarnings) : 0;
      db.creators[creatorIdx] = {
        ...prevCreator,
        walletBalance: clampedBal,
        totalEarnings: Number(((prevCreator.totalEarnings || 0) + earningsInc).toFixed(2)),
        updatedAt: nowStr
      };
    }
    this.writeDB(db);
    return { ok: true, balance: clampedBal };
  }

  public updateCreatorPricingOnServer(
    creatorId: string,
    updates: Partial<CreatorProfile>
  ): { ok: true; creator: CreatorProfile } | { ok: false; statusCode: number; error: string } {
    const db = this.readDB();
    const creatorIdx = db.creators.findIndex(c => c.id === creatorId);
    if (creatorIdx < 0) {
      return { ok: false, statusCode: 404, error: 'Creator profile not found.' };
    }
    const nowStr = formatShortTimestamp();
    const updated: CreatorProfile = {
      ...db.creators[creatorIdx],
      ...updates,
      id: creatorId,
      profileUpdatedAt: new Date().toISOString(),
      updatedAt: nowStr
    };
    db.creators[creatorIdx] = updated;
    const userEntry = this.findUserEntry(db, { userId: creatorId });
    if (userEntry) {
      db.users[userEntry.key] = {
        ...userEntry.user,
        ...(updates.name ? { name: updates.name } : {}),
        ...(updates.avatar ? { avatar: updates.avatar } : {}),
        ...(updates.country ? { country: updates.country } : {}),
        updatedAt: nowStr
      };
    }
    this.writeDB(db);
    return { ok: true, creator: deepClone(updated) };
  }

  public adminUpdateUserAccountOnServer(
    userId: string,
    adminActor: { id: string; name: string; role: string },
    updates: {
      role?: UserRole;
      accountStatus?: AccountStatus;
      statusReason?: string;
      isVerified?: boolean;
      adminPermissionLevel?: User['adminPermissionLevel'];
      adminPermissions?: string[];
      bypassApproval?: boolean;
    }
  ):
    | {
        ok: true;
        user: User;
        creatorProfile?: CreatorProfile;
        updatedApplications?: CreatorVerification[];
        notification?: AppNotification;
        auditRecord?: CreatorApplicationAuditRecord;
      }
    | ({ ok: false } & StoreHttpError) {
    if (adminActor.role !== 'admin' && adminActor.role !== 'moderator') {
      return { ok: false, statusCode: 403, error: 'Forbidden: Administrator role required.' };
    }

    const db = this.readDB();
    const entry = this.findUserEntry(db, { userId });
    if (!entry) {
      return { ok: false, statusCode: 404, error: `User "${userId}" not found.` };
    }

    const nowStr = formatShortTimestamp();
    const prevUser = entry.user;
    const isBypassForceCreator = Boolean(updates.bypassApproval);
    const nextRole: UserRole =
      updates.role ||
      (updates.adminPermissionLevel === 'moderator'
        ? 'moderator'
        : updates.adminPermissionLevel
        ? 'admin'
        : isBypassForceCreator
        ? 'creator'
        : prevUser.role);

    const nextIsAdmin = nextRole === 'admin' || nextRole === 'moderator';
    const nextAdminLevel: AdminPermissionLevel | undefined = nextIsAdmin
      ? (updates.adminPermissionLevel ||
          prevUser.adminPermissionLevel ||
          (nextRole === 'moderator' ? 'moderator' : 'admin'))
      : undefined;
    const nextAdminPermissions: string[] | undefined = nextIsAdmin
      ? (Array.isArray(updates.adminPermissions) && updates.adminPermissions.length > 0
          ? [...updates.adminPermissions]
          : updates.adminPermissionLevel && updates.adminPermissionLevel !== prevUser.adminPermissionLevel
          ? getDefaultAdminPermissions(updates.adminPermissionLevel)
          : prevUser.adminPermissions && prevUser.adminPermissions.length > 0
          ? prevUser.adminPermissions
          : getDefaultAdminPermissions(nextAdminLevel!))
      : undefined;

    const grantCreatorStatus = nextRole === 'creator' || nextIsAdmin || isBypassForceCreator;
    const { bypassApproval: _omitBypass, ...cleanFieldUpdates } = updates;

    const updatedUser: User = {
      ...prevUser,
      ...cleanFieldUpdates,
      role: nextRole,
      adminPermissionLevel: nextAdminLevel,
      adminPermissions: nextAdminPermissions,
      ...(grantCreatorStatus
        ? {
            accountStatus: updates.accountStatus || prevUser.accountStatus || 'active',
            creatorApplicationStatus: 'approved',
            creatorApprovalStatus: 'approved',
            isVerified: true,
            creatorApprovedByAdminId: prevUser.creatorApprovedByAdminId || adminActor.id,
            creatorApprovedByAdminName: prevUser.creatorApprovedByAdminName || adminActor.name,
            creatorApprovedAt: prevUser.creatorApprovedAt || nowStr,
            creatorRejectionReason: undefined
          }
        : updates.role === 'fan'
        ? {
            creatorApplicationStatus: 'not_applied',
            creatorApprovalStatus: 'not_applied'
          }
        : {}),
      updatedAt: nowStr
    };

    db.users[entry.key] = updatedUser;

    let creatorProfile: CreatorProfile | undefined;
    const updatedApplications: CreatorVerification[] = [];
    let notification: AppNotification | undefined;
    let auditRecord: CreatorApplicationAuditRecord | undefined;
    const cleanEmail = normalizeEmail(updatedUser.email);

    if (grantCreatorStatus) {
      let latestMatchedApp: CreatorVerification | undefined;
      for (let i = 0; i < db.applications.length; i++) {
        const appItem = db.applications[i];
        const isMatch =
          appItem.userId === updatedUser.id ||
          (cleanEmail && normalizeEmail(appItem.email) === cleanEmail);
        if (!isMatch) continue;
        if (!latestMatchedApp) latestMatchedApp = appItem;
        if (appItem.status !== 'approved') {
          const prevStatus = appItem.status;
          const approvedApp: CreatorVerification = {
            ...appItem,
            status: 'approved',
            reviewedByAdminId: adminActor.id,
            reviewedByAdminName: adminActor.name,
            reviewedAt: nowStr,
            notes: isBypassForceCreator
              ? 'Force-converted to Creator by Administrator (Approval Bypassed)'
              : appItem.notes || 'Upgraded to Creator by Administrator',
            updatedAt: nowStr
          };
          db.applications[i] = approvedApp;
          updatedApplications.push(this.enrichApplication(db, approvedApp));
          latestMatchedApp = approvedApp;

          auditRecord = this.addAuditRecord(db, {
            applicationId: approvedApp.id,
            applicantUserId: updatedUser.id,
            applicantName: updatedUser.name,
            applicantEmail: updatedUser.email,
            adminId: adminActor.id,
            adminName: adminActor.name,
            adminRole: adminActor.role,
            action: 'approved',
            previousStatus: prevStatus,
            newStatus: 'approved',
            notes: approvedApp.notes || 'Force-converted to Creator by Administrator'
          });
        } else {
          updatedApplications.push(this.enrichApplication(db, appItem));
        }
      }

      creatorProfile = this.ensureCreatorProfile(db, updatedUser, latestMatchedApp, adminActor);
      const cIdx = db.creators.findIndex(c => c.id === creatorProfile!.id);
      if (cIdx >= 0) {
        db.creators[cIdx] = {
          ...db.creators[cIdx],
          role: 'creator',
          accountStatus: updatedUser.accountStatus || 'active',
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          isVerified: true,
          updatedAt: nowStr
        };
        creatorProfile = db.creators[cIdx];
      }

      if (prevUser.role === 'fan' || isBypassForceCreator) {
        notification = this.addNotification(db, {
          userId: updatedUser.id,
          type: 'verification',
          title: 'Creator Account Activated',
          message:
            'An administrator has activated your ACOVON Creator account. You can now upload videos, publish posts, and start livestreams.',
          linkUrl: '/creator-studio',
          targetRole: 'creator',
          eventKey: `creator_force_activated_${updatedUser.id}_${Date.now()}`
        });
      }
    } else {
      const creatorIdx = db.creators.findIndex(
        c => c.id === updatedUser.id || (cleanEmail && normalizeEmail(c.email) === cleanEmail)
      );
      if (creatorIdx >= 0) {
        db.creators[creatorIdx] = {
          ...db.creators[creatorIdx],
          accountStatus: updatedUser.accountStatus,
          isVerified: updatedUser.isVerified,
          updatedAt: nowStr
        };
      }
    }

    this.writeDB(db);
    return {
      ok: true,
      user: deepClone(updatedUser),
      creatorProfile: creatorProfile ? deepClone(creatorProfile) : undefined,
      updatedApplications,
      notification,
      auditRecord
    };
  }

  public deleteUserAccountOnServer(
    targetUserId: string,
    adminActor: { id: string; name: string; email?: string; role: string; adminPermissionLevel?: string }
  ):
    | { ok: true; deletedUser: User; wasAdmin: boolean; deletedApplicationIds: string[] }
    | ({ ok: false } & StoreHttpError) {
    if (adminActor.role !== 'admin') {
      return {
        ok: false,
        statusCode: 403,
        error: 'Forbidden: Only administrators can permanently delete user or admin accounts.'
      };
    }

    const actorLevel = adminActor.adminPermissionLevel || 'admin';
    if (actorLevel !== 'super_admin' && actorLevel !== 'admin') {
      return {
        ok: false,
        statusCode: 403,
        error: 'Forbidden: Requires Super Admin or General Admin permission to delete accounts.'
      };
    }

    const db = this.readDB();
    const entry = this.findUserEntry(db, { userId: targetUserId });
    const creatorOnly = !entry ? this.findCreatorProfile(db, { userId: targetUserId }) : undefined;

    if (!entry && !creatorOnly) {
      return {
        ok: false,
        statusCode: 404,
        error: `Account "${targetUserId}" not found or already deleted.`
      };
    }

    const targetUser: User = entry
      ? deepClone(entry.user)
      : ({
          ...deepClone(creatorOnly!),
          role: 'creator'
        } as User);

    const targetEmail = normalizeEmail(targetUser.email);
    const actorEmail = normalizeEmail(adminActor.email);
    if (
      targetUser.id === adminActor.id ||
      targetUserId === adminActor.id ||
      (targetEmail && actorEmail && targetEmail === actorEmail)
    ) {
      return {
        ok: false,
        statusCode: 400,
        error: 'You cannot delete your own active administrator account while signed in.'
      };
    }

    const wasAdmin =
      targetUser.role === 'admin' ||
      targetUser.role === 'moderator' ||
      Boolean(targetUser.adminPermissionLevel);

    if (targetUser.adminPermissionLevel === 'super_admin') {
      if (actorLevel !== 'super_admin') {
        return {
          ok: false,
          statusCode: 403,
          error: 'Forbidden: Only a Super Admin can delete a Super Admin account.'
        };
      }
      const remainingSuperAdmins = Object.values(db.users).filter(
        u =>
          u &&
          u.id !== targetUser.id &&
          u.role === 'admin' &&
          u.adminPermissionLevel === 'super_admin' &&
          u.accountStatus !== 'banned'
      );
      if (remainingSuperAdmins.length === 0) {
        return {
          ok: false,
          statusCode: 400,
          error: 'Cannot delete the last remaining Super Admin account on the platform.'
        };
      }
    }

    const deletedIdSet = new Set<string>(db.deletedUserIds || []);
    deletedIdSet.add(targetUser.id);
    if (entry?.key) deletedIdSet.add(entry.key);
    if (targetUserId) deletedIdSet.add(targetUserId);

    for (const [k, u] of Object.entries(db.users)) {
      if (!u) continue;
      if (
        k === entry?.key ||
        u.id === targetUser.id ||
        u.id === targetUserId ||
        (targetEmail && normalizeEmail(u.email) === targetEmail)
      ) {
        deletedIdSet.add(u.id);
        deletedIdSet.add(k);
        delete db.users[k];
      }
    }

    db.creators = db.creators.filter(
      c =>
        c.id !== targetUser.id &&
        c.id !== targetUserId &&
        (!targetEmail || normalizeEmail(c.email) !== targetEmail)
    );

    const deletedApplicationIds: string[] = [];
    db.applications = db.applications.filter(a => {
      const match =
        a.userId === targetUser.id ||
        a.userId === targetUserId ||
        (targetEmail && normalizeEmail(a.email) === targetEmail);
      if (match) {
        deletedApplicationIds.push(a.id);
        return false;
      }
      return true;
    });

    db.notifications = db.notifications.filter(
      n => n.userId !== targetUser.id && n.userId !== targetUserId
    );
    db.deletedUserIds = Array.from(deletedIdSet);

    this.writeDB(db);
    return {
      ok: true,
      deletedUser: targetUser,
      wasAdmin,
      deletedApplicationIds
    };
  }

  public addOrPromoteAdminOnServer(
    adminActor: { id: string; name: string; role: string; adminPermissionLevel?: string },
    input: {
      email: string;
      name?: string;
      username?: string;
      adminPermissionLevel: AdminPermissionLevel;
      adminPermissions?: string[];
      bio?: string;
      country?: string;
    }
  ):
    | { ok: true; user: User; creatorProfile: CreatorProfile; promotedExisting: boolean }
    | ({ ok: false } & StoreHttpError) {
    if (adminActor.role !== 'admin') {
      return {
        ok: false,
        statusCode: 403,
        error: 'Forbidden: Only administrators can add or promote other administrators.'
      };
    }

    const actorLevel = adminActor.adminPermissionLevel || 'admin';
    if (actorLevel !== 'super_admin' && actorLevel !== 'admin') {
      return {
        ok: false,
        statusCode: 403,
        error: 'Forbidden: Requires Super Admin or General Admin permission to assign admin roles.'
      };
    }

    const cleanEmail = normalizeEmail(input.email);
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, statusCode: 400, error: 'A valid email address is required.' };
    }

    const allowedLevels: AdminPermissionLevel[] = [
      'super_admin',
      'admin',
      'moderator',
      'finance_admin',
      'support_admin'
    ];
    const requestedLevel: AdminPermissionLevel = allowedLevels.includes(input.adminPermissionLevel)
      ? input.adminPermissionLevel
      : 'admin';

    if (requestedLevel === 'super_admin' && actorLevel !== 'super_admin') {
      return {
        ok: false,
        statusCode: 403,
        error: 'Forbidden: Only an existing Super Admin can assign the Super Admin role.'
      };
    }

    const db = this.readDB();
    const existingEntry = this.findUserEntry(db, { email: cleanEmail, username: input.username });
    const nowStr = formatShortTimestamp();
    const nextRole: UserRole = requestedLevel === 'moderator' ? 'moderator' : 'admin';
    const nextPermissions =
      Array.isArray(input.adminPermissions) && input.adminPermissions.length > 0
        ? Array.from(new Set(input.adminPermissions.map(p => String(p).trim()).filter(Boolean)))
        : getDefaultAdminPermissions(requestedLevel);

    if (existingEntry) {
      if (existingEntry.user.adminPermissionLevel === 'super_admin' && actorLevel !== 'super_admin') {
        return {
          ok: false,
          statusCode: 403,
          error: 'Forbidden: Only a Super Admin can modify an existing Super Admin account.'
        };
      }
      const updatedUser: User = {
        ...existingEntry.user,
        name: (input.name || '').trim() || existingEntry.user.name,
        email: cleanEmail,
        role: nextRole,
        adminPermissionLevel: requestedLevel,
        adminPermissions: nextPermissions,
        bio: (input.bio || '').trim() || existingEntry.user.bio,
        accountStatus: 'active',
        isVerified: true,
        is18PlusConfirmed: true,
        creatorApplicationStatus: 'approved',
        creatorApprovalStatus: 'approved',
        creatorApprovedByAdminId: existingEntry.user.creatorApprovedByAdminId || adminActor.id,
        creatorApprovedByAdminName: existingEntry.user.creatorApprovedByAdminName || adminActor.name,
        creatorApprovedAt: existingEntry.user.creatorApprovedAt || nowStr,
        creatorRejectionReason: undefined,
        updatedAt: nowStr
      };
      db.users[existingEntry.key] = updatedUser;
      const creatorProfile = this.ensureCreatorProfile(db, updatedUser, undefined, adminActor);
      this.writeDB(db);
      return {
        ok: true,
        user: deepClone(updatedUser),
        creatorProfile: deepClone(creatorProfile),
        promotedExisting: true
      };
    }

    const newAdminId = `admin_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const resolvedName = (input.name || '').trim() || cleanEmail.split('@')[0] || 'Platform Admin';
    const baseUsername = normalizeUsername(input.username || resolvedName, cleanEmail.split('@')[0]);
    const usernameConflict = Object.values(db.users).some(
      u => normalizeUsername(u.username) === baseUsername
    );
    const resolvedUsername = usernameConflict
      ? `${baseUsername}_${crypto.randomBytes(2).toString('hex')}`
      : baseUsername;

    const newUser: User = {
      id: newAdminId,
      name: resolvedName,
      username: resolvedUsername,
      email: cleanEmail,
      avatar: DEFAULT_AVATAR,
      bio: (input.bio || '').trim() || `ACOVON ${requestedLevel.replace(/_/g, ' ')} operator & verified creator.`,
      role: nextRole,
      adminPermissionLevel: requestedLevel,
      adminPermissions: nextPermissions,
      accountStatus: 'active',
      creatorApplicationStatus: 'approved',
      creatorApprovalStatus: 'approved',
      creatorApprovedByAdminId: adminActor.id,
      creatorApprovedByAdminName: adminActor.name,
      creatorApprovedAt: nowStr,
      walletBalance: 0,
      isVerified: true,
      is18PlusConfirmed: true,
      dateJoined: new Date().toISOString().split('T')[0],
      updatedAt: nowStr,
      country: (input.country || '').trim() || 'United States'
    };

    db.users[newAdminId] = newUser;
    const creatorProfile = this.ensureCreatorProfile(db, newUser, undefined, adminActor);
    this.writeDB(db);
    return {
      ok: true,
      user: deepClone(newUser),
      creatorProfile: deepClone(creatorProfile),
      promotedExisting: false
    };
  }
}

