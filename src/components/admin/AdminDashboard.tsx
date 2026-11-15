import React, { useState, useMemo, useRef, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useApp } from '../../context/AppContext';
import { AcovonLogoIcon } from '../common/AcovonLogoIcon';
import {
  AdminPermissionLevel,
  AccountStatus,
  ContentModerationStatus,
  UserRole,
  User,
  CreatorProfile,
  SupportTicket,
  WalletTransaction
} from '../../types';
import {
  ShieldCheck,
  Users,
  Crown,
  Film,
  Radio,
  Sparkles,
  DollarSign,
  Wallet,
  Megaphone,
  AlertTriangle,
  LifeBuoy,
  Sliders,
  UserCog,
  UserCheck,
  FileText,
  Settings,
  Search,
  Check,
  X,
  Lock,
  Unlock,
  Ban,
  RefreshCw,
  Download,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowUpRight,
  Plus,
  Trash2,
  Power,
  Send,
  ShieldAlert,
  Camera,
  MessageSquare,
  Activity,
  BarChart3,
  TrendingUp,
  Layers,
  Palette,
  Globe
} from 'lucide-react';

type AdminSectionId =
  | 'overview'
  | 'users'
  | 'creators'
  | 'content'
  | 'live'
  | 'subscriptions'
  | 'financials'
  | 'payouts'
  | 'promotions'
  | 'moderation'
  | 'support'
  | 'categories'
  | 'admin_users'
  | 'audit_logs'
  | 'platform_config'
  | 'video_pipeline'
  | 'creator_verification'
  | 'creator_applications'
  | 'recommendation_engine'
  | 'announcement_management'
  | 'branding_studio';

import { AdminCreatorVerificationSection } from './AdminCreatorVerificationSection';
import { AdminCreatorApplicationsSection } from './AdminCreatorApplicationsSection';
import { AdminRecommendationEngineSection } from './AdminRecommendationEngineSection';
import { AdminAnnouncementManagementSection } from './AdminAnnouncementManagementSection';
import { AdminBrandingStudioSection } from './AdminBrandingStudioSection';
import { AdminCategoriesCountriesSection } from './AdminCategoriesCountriesSection';

const ADMIN_ROLE_LABELS: Record<AdminPermissionLevel, { label: string; badgeClass: string; description: string }> = {
  super_admin: {
    label: 'Super Admin',
    badgeClass: 'bg-[#d4af37]/20 text-[#fce7b0] border-[#d4af37]/50',
    description: 'Full platform authority across users, creators, treasury, security, and role assignment.'
  },
  admin: {
    label: 'General Admin',
    badgeClass: 'bg-sky-950/70 text-sky-300 border-sky-500/40',
    description: 'Platform management across users, creators, content, livestreams, promotions, and categories.'
  },
  moderator: {
    label: 'Trust & Safety Moderator',
    badgeClass: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    description: 'Content moderation, creator identity verification, account reports, and live safety.'
  },
  finance_admin: {
    label: 'Finance & Treasury Admin',
    badgeClass: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    description: 'Financial ledger, creator payouts, audited refunds, commission rates, and dispute escrow.'
  },
  support_admin: {
    label: 'Support & Concierge Admin',
    badgeClass: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
    description: 'Customer & creator support tickets, dispute mediation, and account access assistance.'
  }
};

const ADMIN_ROLE_DEFAULT_PERMS: Record<AdminPermissionLevel, string[]> = {
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

const ALL_ADMIN_PERMISSION_SCOPES: string[] = [
  'user_management',
  'creator_management',
  'creator_verification',
  'content_management',
  'content_moderation',
  'live_management',
  'live_moderation',
  'report_resolution',
  'financial_ledger',
  'payout_approval',
  'payout_release',
  'refund_issuance',
  'dispute_resolution',
  'commission_control',
  'support_tickets',
  'account_recovery',
  'dispute_mediation',
  'promotions_management',
  'manage_platform_branding',
  'role_assignment',
  'emergency_killswitch',
  'all_privileges'
];

export interface AdminDashboardProps {
  onExit?: () => void;
  initialSection?: AdminSectionId;
}

class AdminSectionErrorBoundary extends Component<
  { sectionId: string; onReset?: () => void; children: ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { sectionId: string; onReset?: () => void; children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || 'Unexpected rendering error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[AdminDashboard] Section "${this.props.sectionId}" error:`, error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#121216] border border-rose-500/40 rounded-2xl p-6 space-y-3 text-xs">
          <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Unable to render module: {this.props.sectionId}</span>
          </div>
          <p className="text-neutral-400 font-mono text-[11px] break-words">
            {this.state.errorMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, errorMessage: '' });
              this.props.onReset?.();
            }}
            className="px-3.5 py-2 bg-[#1e1e26] hover:bg-[#282834] border border-[#32323e] rounded-xl text-white font-semibold cursor-pointer"
          >
            Retry Module
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit, initialSection = 'overview' }) => {
  const {
    currentUser,
    adminLogout,
    users,
    creators,
    posts,
    statuses,
    livestreams,
    subscriptions,
    purchases,
    customRequests,
    messages,
    transactions,
    commissionSettings,
    promotions,
    verifications,
    reports,
    payoutRequests,
    supportTickets,
    auditLogs,
    platformConfig,
    adSettings,
    activeAdminPermissionLevel,
    hasAdminPermission,
    switchAdminOperator,
    logAdminAction,
    adminUpdateUserAccount,
    adminForceConvertToCreator,
    adminDeleteUserAccount,
    adminAddOrPromoteAdmin,
    adminUpdateCreatorControl,
    adminModeratePost,
    adminEmergencyEndLivestream,
    adminProcessPayout,
    adminCreateFinancialAdjustment,
    adminUpdateReport,
    adminUpdateSupportTicket,
    adminManagePromotion,
    adminManageSubscription,
    updatePlatformConfig,
    updateCommissionSettings,
    updateAdSettings,
    reviewVerification,
    updateCustomRequestStatus,
    updateLivestreamRecording,
    toggleCreatorSubscriptionPlanActive,
    deleteStatus,
    videoMediaRecords,
    videoProcessingJobs,
    videoProcessingConfig,
    startVideoOptimizationJob,
    retryVideoProcessingJob,
    cancelVideoProcessingJob,
    cleanupOriginalVideoSource,
    updateVideoProcessingConfig,
    creatorVerificationRecords,
    announcements,
    activeBrandingTheme,
    hasBrandingPermission,
    toggleAdminBrandingPermission,
    activeCategories,
    adminAddCategory,
    adminDeleteCategory,
    refreshCreatorApplications
  } = useApp();

  useEffect(() => {
    refreshCreatorApplications({ reconcile: true }).catch(() => {});
  }, []);

  const [activeSection, setActiveSection] = useState<AdminSectionId>(initialSection);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const navigateToSection = (sectionId: AdminSectionId) => {
    setActiveSection(sectionId);
    if (sectionId === 'users') {
      setUserPage(1);
    }
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        if (workspaceRef.current) {
          const rect = workspaceRef.current.getBoundingClientRect();
          if (rect.top < 0 || rect.top > window.innerHeight * 0.65) {
            workspaceRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    }
  };

  const notifyFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackBanner({ type, text });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  // High-impact confirmation modal state
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    danger?: boolean;
    requireReason?: boolean;
    defaultReason?: string;
    onConfirm: (reason: string) => void;
  } | null>(null);
  const [confirmReasonInput, setConfirmReasonInput] = useState('');

  // Section 2: User Management State
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'new_signups' | 'creator_applicants' | UserRole>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | AccountStatus>('all');
  const [userPage, setUserPage] = useState(1);
  const [selectedUserDetailId, setSelectedUserDetailId] = useState<string | null>(null);

  // Section 3: Creator Management State
  const [creatorSearch, setCreatorSearch] = useState('');
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>(creators[0]?.id || '');
  const [verifNotesInput, setVerifNotesInput] = useState<Record<string, string>>({});
  const [verifStatusFilter, setVerifStatusFilter] = useState<'all' | 'pending' | 'info_requested' | 'approved' | 'rejected'>('all');

  // Section 4: Content Management State
  const [contentTab, setContentTab] = useState<'posts' | 'recordings' | 'statuses' | 'private_safety'>('posts');
  const [contentSearch, setContentSearch] = useState('');
  const [contentMediaFilter, setContentMediaFilter] = useState<'all' | 'video' | 'image' | 'ppv' | 'subscribers' | 'highlights'>('all');
  const [contentModFilter, setContentModFilter] = useState<'all' | ContentModerationStatus>('all');
  const [contentPage, setContentPage] = useState(1);
  const [authorizedPrivateAccessIds, setAuthorizedPrivateAccessIds] = useState<string[]>([]);

  // Section 5: Live Management State
  const [liveFilter, setLiveFilter] = useState<'all' | 'live' | 'scheduled' | 'ended'>('all');

  // Section 6: Subscriptions State
  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'cancelled'>('all');

  // Section 7: Financial Management State
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<string>('all');
  const [txStatusFilter, setTxStatusFilter] = useState<string>('all');
  const [txPage, setTxPage] = useState(1);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjTargetUserId, setAdjTargetUserId] = useState('');
  const [adjType, setAdjType] = useState<'refund' | 'adjustment' | 'chargeback'>('refund');
  const [adjAmount, setAdjAmount] = useState('25.00');
  const [adjReason, setAdjReason] = useState('');
  const [adjRefId, setAdjRefId] = useState('');

  // Section 8: Payouts State
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'pending' | 'approved' | 'completed' | 'rejected'>('all');

  // Section 10: Moderation Reports State
  const [reportFilter, setReportFilter] = useState<'all' | 'open' | 'investigating' | 'escalated' | 'resolved' | 'dismissed'>('all');

  // Section 11: Support Center State
  const [ticketFilter, setTicketFilter] = useState<'all' | SupportTicket['status']>('all');
  const [ticketCatFilter, setTicketCatFilter] = useState<string>('all');
  const [selectedTicketId, setSelectedTicketId] = useState<string>(supportTickets[0]?.id || '');
  const [ticketReplyInput, setTicketReplyInput] = useState('');

  // Section 12: Categories & Commission State
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [newVideoCategoryInput, setNewVideoCategoryInput] = useState('');
  const [newLiveCategoryInput, setNewLiveCategoryInput] = useState('');
  const [commSubscriptions, setCommSubscriptions] = useState(Math.round(commissionSettings.subscriptionsRate * 100));
  const [commPpv, setCommPpv] = useState(Math.round(commissionSettings.ppvRate * 100));
  const [commCustom, setCommCustom] = useState(Math.round(commissionSettings.customRequestsRate * 100));
  const [commCalls, setCommCalls] = useState(Math.round(commissionSettings.videoCallsRate * 100));
  const [commMessages, setCommMessages] = useState(Math.round(commissionSettings.paidMessagesRate * 100));
  const [commTips, setCommTips] = useState(Math.round(commissionSettings.tipsRate * 100));
  const [commPromos, setCommPromos] = useState(Math.round(commissionSettings.creatorPromotionsRate * 100));
  const [minWithdrawal, setMinWithdrawal] = useState(commissionSettings.minWithdrawalAmount);

  // Section 9: Advertising State
  const [adsEnabled, setAdsEnabled] = useState(adSettings.adsEnabled);
  const [pubId, setPubId] = useState(adSettings.adSensePublisherId);
  const [adFrequency, setAdFrequency] = useState(adSettings.frequencyFeedEveryNPosts);

  // Section 13: Add or Promote Administrator Form State
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [showNewAdminPassword, setShowNewAdminPassword] = useState(false);
  const [newAdminLevel, setNewAdminLevel] = useState<AdminPermissionLevel>('admin');
  const [newAdminPerms, setNewAdminPerms] = useState<string[]>(ADMIN_ROLE_DEFAULT_PERMS.admin);
  const [isAddingAdmin, setIsAddingAdmin] = useState(false);

  // Section 14: Audit Logs State
  const [auditSearch, setAuditSearch] = useState('');
  const [auditCategoryFilter, setAuditCategoryFilter] = useState<string>('all');
  const [auditSeverityFilter, setAuditSeverityFilter] = useState<string>('all');

  // Helper to identify newly registered accounts vs operational admin accounts
  const isNewSignUpAccount = (u: User | CreatorProfile) => {
    const seededIds = new Set([
      'user_admin_1',
      'user_admin_super',
      'user_admin_ops',
      'user_mod_1',
      'user_fin_1',
      'user_sup_1'
    ]);
    if (seededIds.has(u.id)) return false;
    return true;
  };

  // ============================================================================
  // Unified Real-Time Platform Metrics & Aggregations
  // ============================================================================
  const allUnifiedUsers = useMemo(() => {
    const fallbackAvatar = '';
    const sanitizeAccount = (raw: User | CreatorProfile): User | CreatorProfile => {
      const parsedBalance = Number(raw.walletBalance);
      const id = String(raw.id || '');
      return {
        ...raw,
        id,
        name: typeof raw.name === 'string' && raw.name.trim() ? raw.name : 'Member',
        username:
          typeof raw.username === 'string' && raw.username.trim()
            ? raw.username
            : `user_${id.slice(0, 6) || 'member'}`,
        email: typeof raw.email === 'string' ? raw.email : '',
        avatar: typeof raw.avatar === 'string' && raw.avatar.trim() ? raw.avatar : fallbackAvatar,
        role: (raw.role || 'fan') as UserRole,
        accountStatus: (raw.accountStatus || 'active') as AccountStatus,
        walletBalance: Number.isFinite(parsedBalance) ? parsedBalance : 0,
        dateJoined: typeof raw.dateJoined === 'string' && raw.dateJoined.trim() ? raw.dateJoined : '2026-01-01'
      };
    };

    const map = new Map<string, User | CreatorProfile>();
    Object.values(users || {}).forEach(u => {
      if (!u || typeof u !== 'object' || !u.id) return;
      map.set(u.id, sanitizeAccount(u));
    });
    (creators || []).forEach(c => {
      if (!c || typeof c !== 'object' || !c.id) return;
      const existing = map.get(c.id);
      map.set(c.id, sanitizeAccount(existing ? { ...c, ...existing, role: c.role || existing.role } : c));
    });
    const list = Array.from(map.values());
    return list.sort((a, b) => {
      const aIsNew = isNewSignUpAccount(a) ? 1 : 0;
      const bIsNew = isNewSignUpAccount(b) ? 1 : 0;
      if (aIsNew !== bIsNew) return bIsNew - aIsNew;

      const aHasPendingApp =
        a.creatorApplicationStatus === 'pending' ||
        (verifications || []).some(v => v && v.userId === a.id && v.status === 'pending')
          ? 1
          : 0;
      const bHasPendingApp =
        b.creatorApplicationStatus === 'pending' ||
        (verifications || []).some(v => v && v.userId === b.id && v.status === 'pending')
          ? 1
          : 0;
      if (aHasPendingApp !== bHasPendingApp) return bHasPendingApp - aHasPendingApp;

      return String(b.dateJoined || '').localeCompare(String(a.dateJoined || ''));
    });
  }, [users, creators, verifications]);

  const sortedVerifications = useMemo(() => {
    const priority: Record<string, number> = {
      pending: 0,
      info_requested: 1,
      approved: 2,
      rejected: 3
    };
    return [...(verifications || [])]
      .filter(v => Boolean(v && typeof v === 'object'))
      .sort((a, b) => {
        const pa = priority[a.status] ?? 4;
        const pb = priority[b.status] ?? 4;
        if (pa !== pb) return pa - pb;
        return String(b.submittedAt || '').localeCompare(String(a.submittedAt || ''));
      });
  }, [verifications]);

  const metrics = useMemo(() => {
    const totalUsers = allUnifiedUsers.length;
    const newSignUpsCount = allUnifiedUsers.filter(u => isNewSignUpAccount(u)).length;
    const activeFans = allUnifiedUsers.filter(
      u => u.role === 'fan' && (!u.accountStatus || u.accountStatus === 'active')
    ).length;
    const activeCreators = creators.filter(
      c => !c.accountStatus || c.accountStatus === 'active'
    ).length;
    const pendingCreatorApps = verifications.filter(v => v.status === 'pending' || v.status === 'info_requested').length;
    const totalCreatorApps = verifications.length;
    const suspendedOrBanned = allUnifiedUsers.filter(
      u => u.accountStatus === 'suspended' || u.accountStatus === 'banned' || u.accountStatus === 'restricted'
    ).length;

    const publishedPosts = posts.filter(p => !p.isDraft && p.moderationStatus !== 'removed');
    const totalPhotos = publishedPosts.reduce(
      (acc, p) => acc + p.media.filter(m => m.type === 'image').length,
      0
    );
    const totalVideos = publishedPosts.reduce(
      (acc, p) => acc + p.media.filter(m => m.type === 'video').length,
      0
    );

    const activeStreams = livestreams.filter(s => s.status === 'live');
    const scheduledStreams = livestreams.filter(s => s.status === 'scheduled');
    const recordedReplays = livestreams.filter(s => s.status === 'ended' && s.recordingSettings?.mode !== 'disabled');

    const activeSubs = subscriptions.filter(s => s.status === 'active');
    const newSubs = subscriptions.filter(s => s.status === 'active' && s.startDate >= '2026-10-25');
    const cancelledSubs = subscriptions.filter(s => s.status === 'cancelled' || s.status === 'expired');

    // Financial aggregations from real transactions & creator ledgers
    const creatorTotalEarned = creators.reduce((sum, c) => sum + (c.totalEarnings || 0), 0);
    const grossPlatformVolume = Number((creatorTotalEarned / 0.8).toFixed(2));
    const platformCommissionTotal = Number((grossPlatformVolume - creatorTotalEarned).toFixed(2));

    const sumTxByType = (types: WalletTransaction['type'][]) =>
      transactions
        .filter(t => types.includes(t.type) && t.status === 'completed')
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const subRevenue = activeSubs.reduce((acc, s) => acc + s.monthlyPrice, 0) + sumTxByType(['subscription']);
    const ppvRevenue = purchases.reduce((acc, p) => acc + p.amount, 0) + sumTxByType(['ppv_purchase']);
    const tipsAndGiftsRevenue =
      sumTxByType(['tip']) +
      livestreams.reduce((acc, s) => acc + (s.totalRevenue || 0) * 0.35, 0);
    const customVideoRevenue = customRequests
      .filter(r => r.status !== 'refunded' && r.status !== 'cancelled')
      .reduce((acc, r) => acc + r.price, 0);
    const paidMessageRevenue = sumTxByType(['paid_message']);
    const videoCallRevenue = sumTxByType(['video_call']);
    const liveTicketAndReplayRevenue =
      sumTxByType(['live_ticket', 'live_replay']) +
      livestreams.reduce((acc, s) => acc + (s.replayGrossRevenue || 0), 0);

    const pendingPayoutsList = payoutRequests.filter(p => p.status === 'pending' || p.status === 'approved');
    const pendingPayoutsAmount = pendingPayoutsList.reduce((acc, p) => acc + p.amount, 0);

    const disputedRequests = customRequests.filter(r => r.status === 'disputed');
    const openDisputeTickets = supportTickets.filter(
      t => (t.category === 'payment_dispute' || t.category === 'refund_request') && t.status !== 'resolved' && t.status !== 'closed'
    );
    const openModerationReports = reports.filter(r => r.status === 'open' || r.status === 'investigating' || r.status === 'escalated');

    return {
      totalUsers,
      newSignUpsCount,
      activeFans,
      activeCreators,
      pendingCreatorApps,
      totalCreatorApps,
      suspendedOrBanned,
      totalPublishedPosts: publishedPosts.length,
      totalPhotos,
      totalVideos,
      activeStreamsCount: activeStreams.length,
      scheduledStreamsCount: scheduledStreams.length,
      recordedReplaysCount: recordedReplays.length,
      activeSubsCount: activeSubs.length,
      newSubsCount: newSubs.length,
      cancelledSubsCount: cancelledSubs.length,
      grossPlatformVolume,
      creatorTotalEarned,
      platformCommissionTotal,
      subRevenue,
      ppvRevenue,
      tipsAndGiftsRevenue,
      customVideoRevenue,
      paidMessageRevenue,
      videoCallRevenue,
      liveTicketAndReplayRevenue,
      pendingPayoutsCount: pendingPayoutsList.length,
      pendingPayoutsAmount,
      pendingDisputesCount: disputedRequests.length + openDisputeTickets.length,
      openReportsCount: openModerationReports.length
    };
  }, [
    allUnifiedUsers,
    creators,
    verifications,
    posts,
    livestreams,
    subscriptions,
    transactions,
    purchases,
    customRequests,
    payoutRequests,
    supportTickets,
    reports
  ]);

  // CSV Export Helper
  const downloadCsv = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const escapeCell = (val: string | number) => `"${String(val ?? '').replace(/"/g, '""')}"`;
    const csvContent = [
      headers.map(escapeCell).join(','),
      ...rows.map(r => r.map(escapeCell).join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Sidebar items definition (15 sections)
  const sidebarItems: {
    id: AdminSectionId;
    num: string;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number | string;
    allowedRoles: AdminPermissionLevel[];
  }[] = [
    {
      id: 'overview',
      num: '01',
      label: 'Overview',
      icon: BarChart3,
      allowedRoles: ['super_admin', 'admin', 'moderator', 'finance_admin', 'support_admin']
    },
    {
      id: 'users',
      num: '02',
      label: 'User Management',
      icon: Users,
      badge: metrics.totalUsers,
      allowedRoles: ['super_admin', 'admin', 'moderator', 'support_admin', 'finance_admin']
    },
    {
      id: 'creators',
      num: '03',
      label: 'Creator Management',
      icon: Crown,
      badge: metrics.pendingCreatorApps > 0 ? `${metrics.pendingCreatorApps} pending` : metrics.activeCreators,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'content',
      num: '04',
      label: 'Content Management',
      icon: Film,
      badge: metrics.totalPublishedPosts,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'live',
      num: '05',
      label: 'Live Management',
      icon: Radio,
      badge: `${metrics.activeStreamsCount} live`,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'subscriptions',
      num: '06',
      label: 'Subscriptions',
      icon: Sparkles,
      badge: metrics.activeSubsCount,
      allowedRoles: ['super_admin', 'admin', 'finance_admin', 'support_admin']
    },
    {
      id: 'financials',
      num: '07',
      label: 'Financial Management',
      icon: DollarSign,
      allowedRoles: ['super_admin', 'finance_admin', 'admin']
    },
    {
      id: 'payouts',
      num: '08',
      label: 'Payouts',
      icon: Wallet,
      badge: metrics.pendingPayoutsCount > 0 ? metrics.pendingPayoutsCount : undefined,
      allowedRoles: ['super_admin', 'finance_admin']
    },
    {
      id: 'promotions',
      num: '09',
      label: 'Promotions & Advertising',
      icon: Megaphone,
      badge: promotions.filter(p => p.status === 'pending_approval').length || undefined,
      allowedRoles: ['super_admin', 'admin']
    },
    {
      id: 'moderation',
      num: '10',
      label: 'Reports & Moderation',
      icon: AlertTriangle,
      badge: metrics.openReportsCount > 0 ? metrics.openReportsCount : undefined,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'support',
      num: '11',
      label: 'Support Center',
      icon: LifeBuoy,
      badge: supportTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length || undefined,
      allowedRoles: ['super_admin', 'admin', 'support_admin', 'finance_admin']
    },
    {
      id: 'categories',
      num: '12',
      label: 'Categories & Settings',
      icon: Sliders,
      allowedRoles: ['super_admin', 'admin', 'finance_admin']
    },
    {
      id: 'admin_users',
      num: '13',
      label: 'Admin Users & Permissions',
      icon: UserCog,
      allowedRoles: ['super_admin', 'admin', 'moderator', 'finance_admin', 'support_admin']
    },
    {
      id: 'audit_logs',
      num: '14',
      label: 'Audit Logs',
      icon: FileText,
      badge: auditLogs.length,
      allowedRoles: ['super_admin', 'admin', 'moderator', 'finance_admin', 'support_admin']
    },
    {
      id: 'platform_config',
      num: '15',
      label: 'Platform Configuration',
      icon: Settings,
      allowedRoles: ['super_admin', 'admin']
    },
    {
      id: 'video_pipeline',
      num: '16',
      label: 'Video Engine & Storage',
      icon: Layers,
      badge: (videoProcessingJobs || []).filter(j => {
        const st = (j as any).stage || j.processingStage || j.jobStatus;
        return st === 'failed' || (st !== 'ready' && st !== 'completed' && st !== 'cancelled');
      }).length || undefined,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'creator_applications',
      num: '17',
      label: 'Creator Applications Queue',
      icon: UserCheck,
      badge: (verifications || []).filter(v => v.status === 'pending' || v.status === 'info_requested').length || undefined,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'creator_verification',
      num: '18',
      label: 'Creator Verification (Blue Badge)',
      icon: ShieldCheck,
      badge: (creatorVerificationRecords || []).filter(r => r.status === 'verified').length || undefined,
      allowedRoles: ['super_admin', 'admin', 'finance_admin', 'moderator']
    },
    {
      id: 'recommendation_engine',
      num: '18',
      label: 'Recommendation Engine',
      icon: Sparkles,
      allowedRoles: ['super_admin', 'admin', 'moderator']
    },
    {
      id: 'announcement_management',
      num: '19',
      label: 'Announcement Management',
      icon: Megaphone,
      badge: (announcements || []).filter(a => a.status === 'published').length || undefined,
      allowedRoles: ['super_admin', 'admin', 'moderator', 'finance_admin', 'support_admin']
    },
    {
      id: 'branding_studio',
      num: '20',
      label: 'Appearance & Branding → Global Studio',
      icon: Palette,
      badge: activeBrandingTheme.name,
      allowedRoles: ['super_admin', 'admin']
    }
  ];

  const currentRoleInfo = ADMIN_ROLE_LABELS[activeAdminPermissionLevel];

  const adminOperatorsList = [
    { key: 'admin_root', id: 'user_admin_1', name: 'Julian Sterling', level: 'super_admin' as AdminPermissionLevel },
    { key: 'admin_ops', id: 'user_admin_2', name: 'Evelyn Cross', level: 'admin' as AdminPermissionLevel },
    { key: 'moderator_clara', id: 'user_mod_1', name: 'Clara Vance', level: 'moderator' as AdminPermissionLevel },
    { key: 'admin_finance', id: 'user_admin_finance', name: 'Henrik Lindqvist', level: 'finance_admin' as AdminPermissionLevel },
    { key: 'admin_support', id: 'user_admin_support', name: 'Sophia Lin', level: 'support_admin' as AdminPermissionLevel }
  ].filter(op =>
    Object.values(users).some(
      u => u && (u.id === op.id) && (u.role === 'admin' || u.role === 'moderator' || Boolean(u.adminPermissionLevel))
    )
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5]">
      {/* Top Executive Command Bar */}
      <div className="border-b border-[#232329] bg-[#0d0d11]">
        <div className="max-w-[1440px] 3xl:max-w-[1680px] mx-auto px-4 lg:px-8 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2.5">
                <AcovonLogoIcon size="sm" />
                <h1 className="text-xl font-bold font-brand tracking-wide text-white">
                  ACOVON Admin Control Center
                </h1>
              </div>
              <span className={`text-[11px] font-mono uppercase px-2.5 py-0.5 rounded border ${currentRoleInfo.badgeClass}`}>
                {currentRoleInfo.label}
              </span>
              <span className="text-xs text-neutral-400">
                Operator: <strong className="text-neutral-200">{currentUser.name}</strong> (@{currentUser.username})
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              {currentRoleInfo.description}
            </p>
          </div>

          {/* Live Operator Role Switcher for Testing All 5 Admin Permission Levels */}
          <div className="flex flex-wrap items-center gap-2 bg-[#141419] border border-[#27272f] rounded-xl p-1.5">
            <span className="text-[11px] text-neutral-400 px-2 font-medium">Test Admin Account:</span>
            {adminOperatorsList.map(op => {
              const isSelected = currentUser.id === op.id || activeAdminPermissionLevel === op.level;
              return (
                <button
                  key={op.id}
                  onClick={() => {
                    switchAdminOperator(op.key);
                    notifyFeedback('success', `Switched active admin operator to ${op.name} (${ADMIN_ROLE_LABELS[op.level].label}).`);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#d4af37] text-black font-semibold'
                      : 'text-neutral-300 hover:text-white hover:bg-[#1f1f27]'
                  }`}
                  title={`Switch to ${op.name} (${ADMIN_ROLE_LABELS[op.level].label})`}
                >
                  {ADMIN_ROLE_LABELS[op.level].label.replace('Trust & Safety ', '').replace('Finance & Treasury ', 'Finance ').replace('Support & Concierge ', 'Support ')}
                </button>
              );
            })}
            <button
              onClick={async () => {
                await adminLogout();
                onExit?.();
              }}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-medium text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 transition-colors cursor-pointer ml-0 xs:ml-1"
              title="Sign Out of Admin Control Center"
            >
              <Power className="w-3 h-3 text-rose-400" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div className="max-w-[1440px] 3xl:max-w-[1680px] mx-auto px-4 lg:px-8 pt-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackBanner.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedbackBanner.text}</span>
            </div>
            <button onClick={() => setFeedbackBanner(null)} className="text-neutral-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main 1440px Enterprise Workspace: Left Sidebar + Right Content Area */}
      <div className="max-w-[1440px] 3xl:max-w-[1680px] mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-4 sm:gap-6 items-start overflow-x-clip">
        {/* Section Sidebar */}
        <aside className="w-full lg:w-64 shrink-0 bg-[#121216] border border-[#232329] rounded-2xl p-2.5 lg:sticky lg:top-20 z-10">
          <div className="px-3 py-2 border-b border-[#232329] mb-2 flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Control Modules ({sidebarItems.length})
            </span>
            <span className="text-[10px] font-mono text-[#d4af37]">RBAC Active</span>
          </div>

          {/* Mobile Quick-Jump Selector so mobile admins can switch among all modules with 1 tap */}
          <div className="lg:hidden mb-2 px-1">
            <select
              aria-label="Select Admin Module"
              value={activeSection}
              onChange={(e) => navigateToSection(e.target.value as AdminSectionId)}
              className="w-full bg-[#18181f] border border-[#d4af37]/40 rounded-xl px-3 py-2 text-xs font-semibold text-[#fce7b0] focus:outline-none focus:border-[#d4af37]"
            >
              {sidebarItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.num}. {item.label} {item.badge !== undefined ? `(${item.badge})` : ''}
                </option>
              ))}
            </select>
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 no-scrollbar">
            {sidebarItems.map(item => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id;
              const isPermitted =
                item.id === 'branding_studio'
                  ? hasBrandingPermission()
                  : hasAdminPermission(item.allowedRoles);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToSection(item.id)}
                  className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap lg:whitespace-normal text-left shrink-0 ${
                    isSelected
                      ? 'bg-[#1c1a12] text-[#fce7b0] border border-[#d4af37]/40'
                      : isPermitted
                      ? 'text-neutral-300 hover:text-white hover:bg-[#18181f]'
                      : 'text-neutral-500 hover:text-neutral-300 hover:bg-[#15151a]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-[10px] font-mono text-neutral-500">{item.num}</span>
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[#d4af37]' : 'text-neutral-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!isPermitted && <Lock className="w-3 h-3 text-neutral-600" />}
                    {item.badge !== undefined && (
                      <span className="text-[10px] font-mono text-neutral-400">
                        {item.badge}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active Module Workspace */}
        <div ref={workspaceRef} className="flex-1 min-w-0 w-full space-y-6 overflow-x-clip">
          <AdminSectionErrorBoundary key={activeSection} sectionId={activeSection} onReset={() => setActiveSection('overview')}>
          {/* ================================================================
              01. OVERVIEW — Real-Time Platform Statistics & Visual Analytics
          ================================================================ */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6">
                <div>
                  <h2 className="text-lg font-bold text-white">01. Executive Platform Overview</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Real-time metrics aggregated directly from registered accounts, creator ledgers, active broadcasts, and wallet transactions.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigateToSection('branding_studio')}
                    className="px-3.5 py-2 bg-[#1c1a12] hover:bg-[#242116] border border-[#d4af37]/40 rounded-xl text-xs text-[#fce7b0] font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Palette className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Global Branding Studio ({activeBrandingTheme.name})</span>
                  </button>
                  <button
                    onClick={() => {
                      downloadCsv(
                        'acovon_executive_summary.csv',
                        ['Metric', 'Value'],
                        [
                          ['Total Registered Users', metrics.totalUsers],
                          ['Active Fans', metrics.activeFans],
                          ['Active Creators', metrics.activeCreators],
                          ['Pending Creator Applications', metrics.pendingCreatorApps],
                          ['Suspended / Restricted Accounts', metrics.suspendedOrBanned],
                          ['Published Posts', metrics.totalPublishedPosts],
                          ['Uploaded Photos', metrics.totalPhotos],
                          ['Uploaded Videos', metrics.totalVideos],
                          ['Active Livestreams', metrics.activeStreamsCount],
                          ['Scheduled Livestreams', metrics.scheduledStreamsCount],
                          ['Active Subscriptions', metrics.activeSubsCount],
                          ['Gross Platform Volume ($)', metrics.grossPlatformVolume],
                          ['Creator Net Earnings ($)', metrics.creatorTotalEarned],
                          ['Platform Commission ($)', metrics.platformCommissionTotal],
                          ['Pending Payouts ($)', metrics.pendingPayoutsAmount],
                          ['Open Moderation Reports', metrics.openReportsCount]
                        ]
                      );
                      notifyFeedback('success', 'Executive platform metrics exported to CSV.');
                    }}
                    className="px-3.5 py-2 bg-[#1a1a20] hover:bg-[#23232b] border border-[#2e2e38] rounded-xl text-xs font-medium text-neutral-200 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Export Summary CSV</span>
                  </button>
                </div>
              </div>

              {/* Complete 23 Real-Time Platform Statistics Grid */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-5 gap-3.5">
                <div onClick={() => navigateToSection('users')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Total Registered Users</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">{metrics.totalUsers}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">
                    {metrics.activeFans} Fans · {metrics.activeCreators} Creators
                  </div>
                </div>

                <div onClick={() => navigateToSection('users')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Active Fans &amp; Patrons</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">{metrics.activeFans}</div>
                  <div className="text-[11px] text-emerald-400 mt-1">Verified 18+ accounts</div>
                </div>

                <div onClick={() => navigateToSection('creators')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Active Creators</div>
                  <div className="text-2xl font-bold font-mono text-[#fce7b0] tabular-nums mt-1">{metrics.activeCreators}</div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {metrics.pendingCreatorApps} pending applications
                  </div>
                </div>

                <div onClick={() => navigateToSection('users')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Suspended / Restricted</div>
                  <div className="text-2xl font-bold font-mono text-rose-400 tabular-nums mt-1">{metrics.suspendedOrBanned}</div>
                  <div className="text-[11px] text-neutral-500 mt-1">Enforced safety holds</div>
                </div>

                <div onClick={() => navigateToSection('content')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Published Posts &amp; Media</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">{metrics.totalPublishedPosts}</div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {metrics.totalVideos} Videos · {metrics.totalPhotos} Photos
                  </div>
                </div>

                <div onClick={() => navigateToSection('live')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Livestreams &amp; Replays</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
                    {metrics.activeStreamsCount} Live
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {metrics.scheduledStreamsCount} Scheduled · {metrics.recordedReplaysCount} Replays
                  </div>
                </div>

                <div onClick={() => navigateToSection('subscriptions')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Subscriptions Activity</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums mt-1">
                    {metrics.activeSubsCount} Active
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    +{metrics.newSubsCount} New · {metrics.cancelledSubsCount} Cancelled
                  </div>
                </div>

                <div onClick={() => navigateToSection('financials')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Total Platform Revenue (GMV)</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
                    ${metrics.grossPlatformVolume.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#d4af37] mt-1">
                    Commission: ${metrics.platformCommissionTotal.toLocaleString()}
                  </div>
                </div>

                <div onClick={() => navigateToSection('financials')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Creator Net Earnings</div>
                  <div className="text-2xl font-bold font-mono text-[#fce7b0] tabular-nums mt-1">
                    ${metrics.creatorTotalEarned.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">80% average creator share</div>
                </div>

                <div onClick={() => navigateToSection('financials')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">PPV, Tips &amp; Live Replays</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
                    ${(metrics.ppvRevenue + metrics.tipsAndGiftsRevenue + metrics.liveTicketAndReplayRevenue).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    PPV ${metrics.ppvRevenue.toFixed(0)} · Tips ${metrics.tipsAndGiftsRevenue.toFixed(0)} · Live ${metrics.liveTicketAndReplayRevenue.toFixed(0)}
                  </div>
                </div>

                <div onClick={() => navigateToSection('financials')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Custom Videos, Calls &amp; DMs</div>
                  <div className="text-2xl font-bold font-mono text-white tabular-nums mt-1">
                    ${(metrics.customVideoRevenue + metrics.videoCallRevenue + metrics.paidMessageRevenue).toFixed(2)}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    Orders ${metrics.customVideoRevenue.toFixed(0)} · Calls ${metrics.videoCallRevenue.toFixed(0)} · DMs ${metrics.paidMessageRevenue.toFixed(0)}
                  </div>
                </div>

                <div onClick={() => navigateToSection('payouts')} className="p-4 bg-[#121216] hover:bg-[#16161c] border border-[#232329] rounded-xl cursor-pointer transition-colors">
                  <div className="text-[11px] text-neutral-400">Pending Payouts &amp; Disputes</div>
                  <div className="text-2xl font-bold font-mono text-amber-400 tabular-nums mt-1">
                    ${metrics.pendingPayoutsAmount.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1">
                    {metrics.pendingPayoutsCount} Payouts · {metrics.pendingDisputesCount} Disputes · {metrics.openReportsCount} Flags
                  </div>
                </div>
              </div>

              {/* Live New Sign-Ups & All Creator Applications Overview Panels */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent User Sign-Ups */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#d4af37]" />
                        <span>Newest Account Sign-Ups</span>
                        {metrics.newSignUpsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px]">
                            {metrics.newSignUpsCount} New
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        All newly registered accounts synced in real time across the platform
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setUserRoleFilter('all');
                        setUserPage(1);
                        navigateToSection('users');
                      }}
                      className="px-3 py-1.5 bg-[#1a1a22] hover:bg-[#23232e] border border-[#2e2e38] rounded-xl text-[11px] font-semibold text-[#fce7b0] cursor-pointer shrink-0"
                    >
                      View All Users ({allUnifiedUsers.length})
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {allUnifiedUsers.slice(0, 8).map(u => {
                      const isNew = isNewSignUpAccount(u);
                      const uname = String(u.username || '').toLowerCase();
                      const userVerif = (verifications || []).find(
                        v => v && (v.userId === u.id || (uname && String(v.username || '').toLowerCase() === uname))
                      );
                      const appStatus = userVerif?.status || u.creatorApplicationStatus;
                      return (
                        <div
                          key={u.id}
                          className="p-3 bg-[#18181f] hover:bg-[#1d1d26] rounded-xl border border-[#272730] flex flex-wrap items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.name}
                                className="w-9 h-9 rounded-full object-cover border border-[#2e2e38] shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-[#24242d] border border-[#2e2e38] flex items-center justify-center text-xs font-bold text-[#fce7b0] shrink-0">
                                {(u.name || 'M').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white truncate">{u.name}</span>
                                {isNew && (
                                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] uppercase">
                                    New Sign-Up
                                  </span>
                                )}
                                {appStatus && appStatus !== 'not_applied' && (
                                  <span
                                    className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase border ${
                                      appStatus === 'approved'
                                        ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                        : appStatus === 'rejected'
                                        ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                        : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                    }`}
                                  >
                                    Creator App: {appStatus.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate">
                                @{u.username} · {u.email} · Joined {u.dateJoined}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="font-mono text-[10px] uppercase text-neutral-300 px-2 py-0.5 bg-[#121216] rounded border border-[#272730]">
                              {u.role}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserDetailId(u.id);
                                navigateToSection('users');
                              }}
                              className="px-2.5 py-1 bg-[#23232e] hover:bg-[#2c2c3a] text-white rounded-lg text-[11px] cursor-pointer"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* All Creator Applications Queue Summary */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#d4af37]" />
                        <span>All Creator Applications</span>
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
                          {metrics.pendingCreatorApps} Pending · {metrics.totalCreatorApps} Total
                        </span>
                      </h3>
                      <p className="text-[11px] text-neutral-400">
                        Creator onboarding applications and 18+ identity verification submissions
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setVerifStatusFilter('all');
                        navigateToSection('creator_applications');
                      }}
                      className="px-3 py-1.5 bg-[#1a1a22] hover:bg-[#23232e] border border-[#2e2e38] rounded-xl text-[11px] font-semibold text-[#fce7b0] cursor-pointer shrink-0"
                    >
                      Open Full Queue ({sortedVerifications.length})
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                    {sortedVerifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-neutral-500 bg-[#18181f] rounded-xl border border-[#272730]">
                        No creator applications submitted yet.
                      </div>
                    ) : (
                      sortedVerifications.map(v => (
                        <div
                          key={v.id}
                          className="p-3 bg-[#18181f] hover:bg-[#1d1d26] rounded-xl border border-[#272730] flex flex-wrap items-center justify-between gap-3 text-xs transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {v.selfieUrl ? (
                              <img
                                src={v.selfieUrl}
                                alt={v.name}
                                className="w-9 h-9 rounded-lg object-cover border border-[#2e2e38] shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-[#24242d] border border-[#2e2e38] flex items-center justify-center text-xs font-bold text-[#fce7b0] shrink-0">
                                {(v.name || 'C').slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-white truncate">
                                  {v.name} (@{v.username})
                                </span>
                                <span
                                  className={`px-1.5 py-0.5 rounded font-mono text-[9px] uppercase border ${
                                    v.status === 'approved'
                                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                      : v.status === 'rejected'
                                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                      : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                  }`}
                                >
                                  {v.status.replace('_', ' ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-400 truncate">
                                {v.applicationData?.category || 'Creator'} · {v.documentType.replace('_', ' ')} #{v.documentNumber} · {v.submittedAt}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {(v.status === 'pending' || v.status === 'info_requested') && (
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await reviewVerification(
                                    v.id,
                                    'approved',
                                    'Biometric 18+ ID and facial selfie match verified.'
                                  );
                                  if (res.success) {
                                    notifyFeedback('success', `Approved creator application for ${v.name}. Account upgraded to Creator.`);
                                  } else {
                                    notifyFeedback('error', res.error || 'Failed to approve application.');
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-[11px] cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                navigateToSection('creator_applications');
                              }}
                              className="px-2.5 py-1 bg-[#23232e] hover:bg-[#2c2c3a] text-white rounded-lg text-[11px] cursor-pointer"
                            >
                              Review
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* 6 Real-Data Platform Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 & 2: Revenue Breakdown by Vertical */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Revenue &amp; Commission by Monetization Stream</h3>
                      <p className="text-[11px] text-neutral-400">Live ledger breakdown across all 6 ACOVON monetization engines</p>
                    </div>
                    <TrendingUp className="w-4 h-4 text-[#d4af37] shrink-0" />
                  </div>
                  <div className="space-y-3 pt-1">
                    {[
                      { label: 'Custom Video Commissions', amount: metrics.customVideoRevenue, rate: commissionSettings.customRequestsRate, color: 'bg-[#d4af37]' },
                      { label: 'Livestream Tickets & Replays', amount: metrics.liveTicketAndReplayRevenue, rate: commissionSettings.ppvRate, color: 'bg-rose-500' },
                      { label: 'Recurring Tier Subscriptions', amount: metrics.subRevenue, rate: commissionSettings.subscriptionsRate, color: 'bg-emerald-500' },
                      { label: 'Direct Tips & Virtual Gifts', amount: metrics.tipsAndGiftsRevenue, rate: commissionSettings.tipsRate, color: 'bg-amber-400' },
                      { label: 'Pay-Per-View Vault Unlocks', amount: metrics.ppvRevenue, rate: commissionSettings.ppvRate, color: 'bg-sky-400' },
                      { label: '1-on-1 Video Calls & Paid DMs', amount: metrics.videoCallRevenue + metrics.paidMessageRevenue, rate: commissionSettings.videoCallsRate, color: 'bg-purple-400' }
                    ].map(row => {
                      const maxVal = Math.max(metrics.customVideoRevenue, metrics.liveTicketAndReplayRevenue, metrics.subRevenue, 100);
                      const pct = Math.min(100, Math.max(8, Math.round((row.amount / maxVal) * 100)));
                      return (
                        <div key={row.label} className="space-y-1 text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-neutral-300">{row.label}</span>
                            <span className="font-mono text-white tabular-nums">
                              ${row.amount.toFixed(2)}{' '}
                              <span className="text-neutral-500 text-[10px]">
                                ({Math.round(row.rate * 100)}% fee)
                              </span>
                            </span>
                          </div>
                          <div className="w-full h-2 bg-[#1c1c24] rounded-full overflow-hidden">
                            <div className={`h-full ${row.color} rounded-full`} style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 3: Top Creator Performance & Subscriber Distribution */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Creator Earnings &amp; Subscriber Velocity</h3>
                      <p className="text-[11px] text-neutral-400">Top performing partner creators ranked by cumulative net earnings</p>
                    </div>
                    <Crown className="w-4 h-4 text-[#d4af37] shrink-0" />
                  </div>
                  <div className="space-y-3 pt-1">
                    {[...creators]
                      .sort((a, b) => b.totalEarnings - a.totalEarnings)
                      .slice(0, 6)
                      .map(c => {
                        const maxEarned = Math.max(...creators.map(cr => cr.totalEarnings), 1);
                        const pct = Math.round((c.totalEarnings / maxEarned) * 100);
                        return (
                          <div key={c.id} className="space-y-1 text-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {c.avatar ? (
                                  <img src={c.avatar} alt={c.name} className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-[#24242d] flex items-center justify-center text-[9px] font-bold text-[#fce7b0]">
                                    {(c.name || 'C').slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-white font-medium">{c.name}</span>
                                <span className="text-[10px] text-neutral-500">· {c.subscribersCount} subs</span>
                              </div>
                              <span className="font-mono text-[#fce7b0] tabular-nums">${c.totalEarnings.toLocaleString()}</span>
                            </div>
                            <div className="w-full h-2 bg-[#1c1c24] rounded-full overflow-hidden">
                              <div className="h-full bg-gradient-to-r from-[#d4af37] to-[#fce7b0] rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Chart 4 & 5: Content Uploads & Media Catalog Composition */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Content Uploads &amp; Visibility Distribution</h3>
                      <p className="text-[11px] text-neutral-400">Breakdown of published videos, photos, stories, and access tiers</p>
                    </div>
                    <Layers className="w-4 h-4 text-[#d4af37] shrink-0" />
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 text-center pt-1 tabular-nums">
                    <div className="p-3 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-lg font-bold font-mono text-white">{metrics.totalVideos}</div>
                      <div className="text-[11px] text-neutral-400">Playable Videos</div>
                    </div>
                    <div className="p-3 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-lg font-bold font-mono text-white">{metrics.totalPhotos}</div>
                      <div className="text-[11px] text-neutral-400">Hi-Res Photos</div>
                    </div>
                    <div className="p-3 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-lg font-bold font-mono text-[#fce7b0]">{statuses.length}</div>
                      <div className="text-[11px] text-neutral-400">24h Stories</div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 text-xs">
                    {[
                      { label: 'Public Discovery Posts', count: posts.filter(p => p.visibility === 'public').length },
                      { label: 'Subscriber-Only Exclusive Posts', count: posts.filter(p => p.visibility === 'subscribers').length },
                      { label: 'Pay-Per-View (PPV) Locked Vault', count: posts.filter(p => p.visibility === 'pay_per_view').length },
                      { label: 'Followers-Only Posts', count: posts.filter(p => p.visibility === 'followers').length }
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between py-1 border-b border-[#1e1e24] last:border-0">
                        <span className="text-neutral-300">{item.label}</span>
                        <span className="font-mono text-white">{item.count} posts</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 6: Livestream Concurrency & User Growth */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white">Livestream Activity &amp; Audience Concurrency</h3>
                      <p className="text-[11px] text-neutral-400">Real-time viewer counts and replay monetization across broadcasts</p>
                    </div>
                    <Activity className="w-4 h-4 text-rose-400 shrink-0" />
                  </div>
                  <div className="space-y-2.5">
                    {livestreams.slice(0, 5).map(s => (
                      <div key={s.id} className="p-3 bg-[#18181f] rounded-xl border border-[#272730] flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="min-w-0 pr-3">
                          <div className="font-semibold text-white truncate">{s.title}</div>
                          <div className="text-[11px] text-neutral-400">
                            Host: {s.creatorName} · {s.status.toUpperCase()} · {s.accessMode.replace('_', ' ')}
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="text-white font-bold">
                            {s.status === 'live' ? `${s.viewerCount.toLocaleString()} watching` : `${s.replayViewsCount || 0} replay views`}
                          </div>
                          <div className="text-[10px] text-emerald-400">
                            ${((s.totalRevenue || 0) + (s.replayGrossRevenue || 0)).toFixed(2)} gross
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              02. USER MANAGEMENT
          ================================================================ */}
          {activeSection === 'users' && (() => {
            const safeVerifications = (verifications || []).filter(v => Boolean(v && typeof v === 'object'));
            const q = String(userSearch || '').trim().toLowerCase();
            const filteredUsers = allUnifiedUsers.filter(u => {
              const uName = String(u.name || '').toLowerCase();
              const uUsername = String(u.username || '').toLowerCase();
              const uEmail = String(u.email || '').toLowerCase();
              const uCountry = String(u.country || '').toLowerCase();
              const matchesSearch =
                !q ||
                uName.includes(q) ||
                uUsername.includes(q) ||
                uEmail.includes(q) ||
                uCountry.includes(q);
              const hasCreatorApp =
                (u.creatorApplicationStatus && u.creatorApplicationStatus !== 'not_applied') ||
                safeVerifications.some(
                  v =>
                    v.userId === u.id ||
                    (uEmail && String(v.email || '').toLowerCase() === uEmail) ||
                    (uUsername && String(v.username || '').toLowerCase() === uUsername)
                );
              const matchesRole =
                userRoleFilter === 'all'
                  ? true
                  : userRoleFilter === 'new_signups'
                  ? isNewSignUpAccount(u)
                  : userRoleFilter === 'creator_applicants'
                  ? Boolean(hasCreatorApp)
                  : u.role === userRoleFilter;
              const st = u.accountStatus || 'active';
              const matchesStatus = userStatusFilter === 'all' || st === userStatusFilter;
              return matchesSearch && matchesRole && matchesStatus;
            });

            const pageSize = 10;
            const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
            const safeUserPage = Math.min(Math.max(1, userPage), totalPages);
            const paginatedUsers = filteredUsers.slice((safeUserPage - 1) * pageSize, safeUserPage * pageSize);
            const inspectedUser = selectedUserDetailId
              ? allUnifiedUsers.find(u => u.id === selectedUserDetailId) || null
              : null;

            return (
              <div className="space-y-6">
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">02. User Management &amp; Account Security</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Inspect registered accounts, new sign-ups, creator applications, manage roles, verify identities, and enforce suspensions or bans.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => { setUserRoleFilter('all'); setUserPage(1); }}
                        className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                          userRoleFilter === 'all'
                            ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#fce7b0] font-semibold'
                            : 'bg-[#18181f] border-[#272730] text-neutral-300'
                        }`}
                      >
                        All Accounts ({allUnifiedUsers.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUserRoleFilter('new_signups'); setUserPage(1); }}
                        className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                          userRoleFilter === 'new_signups'
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold'
                            : 'bg-[#18181f] border-[#272730] text-neutral-300'
                        }`}
                      >
                        New Sign-Ups ({metrics.newSignUpsCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => { setUserRoleFilter('creator_applicants'); setUserPage(1); }}
                        className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                          userRoleFilter === 'creator_applicants'
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                            : 'bg-[#18181f] border-[#272730] text-neutral-300'
                        }`}
                      >
                        Creator Applicants ({safeVerifications.length})
                      </button>
                      {hasAdminPermission(['super_admin', 'admin']) && (
                        <button
                          type="button"
                          onClick={() => navigateToSection('admin_users')}
                          className="px-3 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#c59b27] text-black font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add / Promote Admin</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Search & Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={userSearch}
                        onChange={e => { setUserSearch(e.target.value); setUserPage(1); }}
                        placeholder="Search by name, @username, email, or country..."
                        className="w-full bg-[#18181f] border border-[#272730] rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                    <select
                      value={userRoleFilter}
                      onChange={e => { setUserRoleFilter(e.target.value as 'all' | 'new_signups' | 'creator_applicants' | UserRole); setUserPage(1); }}
                      className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="all">All Roles ({allUnifiedUsers.length})</option>
                      <option value="new_signups">New Sign-Ups ({metrics.newSignUpsCount})</option>
                      <option value="creator_applicants">Creator Applicants ({safeVerifications.length})</option>
                      <option value="fan">Fans</option>
                      <option value="creator">Creators</option>
                      <option value="admin">Admins</option>
                      <option value="moderator">Moderators</option>
                    </select>
                    <select
                      value={userStatusFilter}
                      onChange={e => { setUserStatusFilter(e.target.value as 'all' | AccountStatus); setUserPage(1); }}
                      className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="all">All Account Statuses</option>
                      <option value="active">Active</option>
                      <option value="restricted">Restricted</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>

                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap tabular-nums">
                      <thead>
                        <tr className="border-b border-[#232329] text-neutral-400">
                          <th className="pb-3 font-medium">User / Account</th>
                          <th className="pb-3 font-medium">Role &amp; Creator App</th>
                          <th className="pb-3 font-medium">Status</th>
                          <th className="pb-3 font-medium">Joined / Country</th>
                          <th className="pb-3 font-medium">Wallet Balance</th>
                          <th className="pb-3 font-medium text-right">Administrative Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1c1c22]">
                        {paginatedUsers.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-neutral-500">
                              No user accounts match the selected filters.
                            </td>
                          </tr>
                        ) : (
                          paginatedUsers.map(u => {
                            const accStatus = u.accountStatus || 'active';
                            const isNew = isNewSignUpAccount(u);
                            const uUsername = String(u.username || '').toLowerCase();
                            const uEmail = String(u.email || '').toLowerCase();
                            const matchedVerif = safeVerifications.find(
                              v =>
                                v.userId === u.id ||
                                (uEmail && String(v.email || '').toLowerCase() === uEmail) ||
                                (uUsername && String(v.username || '').toLowerCase() === uUsername)
                            );
                            const creatorAppStatus = matchedVerif?.status || u.creatorApplicationStatus;
                            const safeBalance = Number.isFinite(Number(u.walletBalance)) ? Number(u.walletBalance) : 0;
                            return (
                              <tr key={u.id} className="hover:bg-[#16161d] transition-colors">
                                <td className="py-3.5 pr-4 min-w-[220px] whitespace-normal">
                                  <div className="flex items-center gap-3">
                                    {u.avatar ? (
                                      <img
                                        src={u.avatar}
                                        alt={u.name || 'User'}
                                        className="w-9 h-9 rounded-full object-cover border border-[#2e2e38]"
                                      />
                                    ) : (
                                      <div className="w-9 h-9 rounded-full bg-[#24242d] border border-[#2e2e38] flex items-center justify-center text-xs font-bold text-[#fce7b0] shrink-0">
                                        {(u.name || 'M').slice(0, 2).toUpperCase()}
                                      </div>
                                    )}
                                    <div>
                                      <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                                        <span>{u.name || 'Member'}</span>
                                        {u.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />}
                                        {isNew && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] uppercase">
                                            New Sign-Up
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[11px] text-neutral-400">@{u.username || 'member'} · {u.email || 'No email'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div className="capitalize font-mono text-neutral-200">
                                    {u.adminPermissionLevel ? String(u.adminPermissionLevel).replace(/_/g, ' ') : (u.role || 'fan')}
                                  </div>
                                  {creatorAppStatus && creatorAppStatus !== 'not_applied' && (
                                    <div className="mt-1">
                                      <span
                                        className={`inline-block px-1.5 py-0.5 rounded font-mono text-[9px] uppercase border ${
                                          creatorAppStatus === 'approved'
                                            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                            : creatorAppStatus === 'rejected'
                                            ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                            : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                        }`}
                                      >
                                        Creator App: {String(creatorAppStatus).replace(/_/g, ' ')}
                                      </span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <span
                                    className={`font-mono text-[11px] uppercase ${
                                      accStatus === 'active'
                                        ? 'text-emerald-400'
                                        : accStatus === 'restricted'
                                        ? 'text-amber-400'
                                        : 'text-rose-400 font-semibold'
                                    }`}
                                  >
                                    {accStatus}
                                  </span>
                                  {u.statusReason && (
                                    <div className="text-[10px] text-neutral-500 max-w-[180px] truncate">{u.statusReason}</div>
                                  )}
                                </td>
                                <td className="py-3.5 pr-4 text-neutral-400">
                                  <div>{u.dateJoined || '—'}</div>
                                  <div className="text-[10px] text-neutral-500">{u.country || 'Global'}</div>
                                </td>
                                <td className="py-3.5 pr-4 font-mono text-[#fce7b0] tabular-nums">
                                  ${safeBalance.toFixed(2)}
                                </td>
                                <td className="py-3.5 text-right">
                                  <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                    {matchedVerif && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setVerifStatusFilter('all');
                                          navigateToSection('creator_applications');
                                        }}
                                        className="px-2.5 py-1 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#fce7b0] rounded-lg cursor-pointer text-[11px] font-semibold"
                                      >
                                        Review App
                                      </button>
                                    )}
                                    {u.role === 'fan' && (
                                      <button
                                        type="button"
                                        onClick={async () => {
                                          const res = await adminForceConvertToCreator(u.id);
                                          if (res.success) {
                                            notifyFeedback('success', `Converted ${u.name} (@${u.username}) to an active approved Creator automatically.`);
                                          } else {
                                            notifyFeedback('error', res.error || 'Could not convert user to Creator.');
                                          }
                                        }}
                                        className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/35 border border-emerald-500/40 text-emerald-300 rounded-lg cursor-pointer text-[11px] font-semibold"
                                        title="Force-convert user to Creator and bypass application approval"
                                      >
                                        Make Creator
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => setSelectedUserDetailId(u.id)}
                                      className="px-2.5 py-1 bg-[#1e1e26] hover:bg-[#282833] text-neutral-200 rounded-lg cursor-pointer text-[11px]"
                                    >
                                      Inspect
                                    </button>
                                    {accStatus === 'active' ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const res = adminUpdateUserAccount(u.id, {
                                              accountStatus: 'restricted',
                                              statusReason: 'Temporary administrative restriction applied'
                                            });
                                            if (res.success) notifyFeedback('success', `Restricted account @${u.username}.`);
                                            else notifyFeedback('error', res.error || 'Action denied.');
                                          }}
                                          className="px-2.5 py-1 bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 rounded-lg cursor-pointer text-[11px]"
                                        >
                                          Restrict
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setConfirmReasonInput('Violation of ACOVON Terms of Service');
                                            setConfirmDialog({
                                              title: `Suspend or Ban @${u.username}`,
                                              description: `This action immediately revokes platform access for ${u.name} and records an administrative security event.`,
                                              confirmLabel: 'Confirm Suspension',
                                              danger: true,
                                              requireReason: true,
                                              onConfirm: reason => {
                                                const res = adminUpdateUserAccount(u.id, {
                                                  accountStatus: 'suspended',
                                                  statusReason: reason
                                                });
                                                if (res.success) notifyFeedback('success', `Account @${u.username} suspended.`);
                                                else notifyFeedback('error', res.error || 'Unauthorized.');
                                              }
                                            });
                                          }}
                                          className="px-2.5 py-1 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer text-[11px]"
                                        >
                                          Suspend
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const res = adminUpdateUserAccount(u.id, {
                                            accountStatus: 'active',
                                            statusReason: 'Account restored by administrator'
                                          });
                                          if (res.success) notifyFeedback('success', `Restored account @${u.username} to Active.`);
                                          else notifyFeedback('error', res.error || 'Unauthorized.');
                                        }}
                                        className="px-2.5 py-1 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-emerald-300 rounded-lg cursor-pointer text-[11px]"
                                      >
                                        Restore Account
                                      </button>
                                    )}
                                    {hasAdminPermission(['super_admin', 'admin']) &&
                                      u.id !== currentUser.id &&
                                      (u.adminPermissionLevel !== 'super_admin' ||
                                        activeAdminPermissionLevel === 'super_admin') && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setConfirmDialog({
                                              title: `Permanently Delete @${u.username}`,
                                              description: `This permanently deletes ${u.name} (${u.email}) along with their creator profile, posts, stories, and creator applications. This action cannot be undone.`,
                                              confirmLabel: 'Delete Account Permanently',
                                              danger: true,
                                              onConfirm: async () => {
                                                const res = await adminDeleteUserAccount(u.id);
                                                if (res.success) {
                                                  if (selectedUserDetailId === u.id) {
                                                    setSelectedUserDetailId(null);
                                                  }
                                                  notifyFeedback('success', `Permanently deleted account @${u.username}.`);
                                                } else {
                                                  notifyFeedback('error', res.error || 'Could not delete account.');
                                                }
                                              }
                                            });
                                          }}
                                          className="px-2.5 py-1 bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-500/40 rounded-lg cursor-pointer text-[11px] flex items-center gap-1"
                                          title="Permanently delete user account"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                          <span>Delete</span>
                                        </button>
                                      )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-neutral-400">
                    <span>
                      Showing {filteredUsers.length === 0 ? 0 : (safeUserPage - 1) * pageSize + 1}–{Math.min(safeUserPage * pageSize, filteredUsers.length)} of {filteredUsers.length} accounts
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={safeUserPage <= 1}
                        onClick={() => setUserPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded-lg bg-[#18181f] disabled:opacity-40 text-white cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="font-mono">
                        Page {safeUserPage} / {totalPages}
                      </span>
                      <button
                        type="button"
                        disabled={safeUserPage >= totalPages}
                        onClick={() => setUserPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 rounded-lg bg-[#18181f] disabled:opacity-40 text-white cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>

                {/* Detailed User Profile & Ledger Drawer */}
                {inspectedUser && (
                  <div className="bg-[#121216] border border-[#d4af37]/40 rounded-2xl p-4 sm:p-6 space-y-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        {inspectedUser.avatar ? (
                          <img
                            src={inspectedUser.avatar}
                            alt={inspectedUser.name || 'User'}
                            className="w-14 h-14 rounded-2xl object-cover border border-[#d4af37] shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-2xl bg-[#24242d] border border-[#d4af37] flex items-center justify-center text-base font-bold text-[#fce7b0] shrink-0">
                            {(inspectedUser.name || 'M').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-white">{inspectedUser.name}</h3>
                            <span className="text-xs font-mono text-neutral-400">@{inspectedUser.username}</span>
                            <span className="text-[11px] font-mono uppercase text-[#fce7b0]">
                              · {inspectedUser.role}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-400 mt-0.5 break-words">
                            Email: {inspectedUser.email || '—'} · Joined: {inspectedUser.dateJoined || '—'} · Country: {inspectedUser.country || 'United States'} · Last Login: {inspectedUser.lastLoginAt || 'Today'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedUserDetailId(null)}
                        className="p-1.5 text-neutral-400 hover:text-white cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      {/* Role & Verification Controls */}
                      <div className="p-4 bg-[#18181f] rounded-xl border border-[#272730] space-y-3">
                        <div className="font-semibold text-white">Role &amp; Identity Controls</div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-neutral-400">Platform Role:</span>
                          <select
                            value={inspectedUser.role}
                            onChange={e => {
                              const nextRole = e.target.value as UserRole;
                              const nextLevel: AdminPermissionLevel | undefined =
                                nextRole === 'admin'
                                  ? inspectedUser.adminPermissionLevel && inspectedUser.adminPermissionLevel !== 'moderator'
                                    ? inspectedUser.adminPermissionLevel
                                    : 'admin'
                                  : nextRole === 'moderator'
                                  ? 'moderator'
                                  : undefined;
                              const res = adminUpdateUserAccount(inspectedUser.id, {
                                role: nextRole,
                                ...(nextLevel ? { adminPermissionLevel: nextLevel } : {})
                              });
                              if (res.success) notifyFeedback('success', `Updated role for ${inspectedUser.name} to ${nextRole}.`);
                              else notifyFeedback('error', res.error || 'Permission denied.');
                            }}
                            className="bg-[#121216] border border-[#2e2e38] rounded-lg px-2.5 py-1 text-white"
                          >
                            <option value="fan">Fan</option>
                            <option value="creator">Creator</option>
                            <option value="moderator">Moderator</option>
                            <option value="admin">Admin</option>
                          </select>
                        </div>
                        {(inspectedUser.role === 'admin' || inspectedUser.role === 'moderator' || inspectedUser.adminPermissionLevel) && (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-neutral-400">Admin Role Level:</span>
                            <select
                              value={
                                inspectedUser.adminPermissionLevel ||
                                (inspectedUser.role === 'moderator' ? 'moderator' : 'admin')
                              }
                              onChange={e => {
                                const nextLevel = e.target.value as AdminPermissionLevel;
                                const res = adminUpdateUserAccount(inspectedUser.id, {
                                  adminPermissionLevel: nextLevel,
                                  role: nextLevel === 'moderator' ? 'moderator' : 'admin',
                                  adminPermissions: ADMIN_ROLE_DEFAULT_PERMS[nextLevel]
                                });
                                if (res.success) {
                                  notifyFeedback(
                                    'success',
                                    `Updated ${inspectedUser.name} admin role to ${ADMIN_ROLE_LABELS[nextLevel].label}.`
                                  );
                                } else {
                                  notifyFeedback('error', res.error || 'Permission denied.');
                                }
                              }}
                              className="bg-[#121216] border border-[#2e2e38] rounded-lg px-2.5 py-1 text-white"
                            >
                              {activeAdminPermissionLevel === 'super_admin' && (
                                <option value="super_admin">Super Admin</option>
                              )}
                              <option value="admin">General Admin</option>
                              <option value="moderator">Moderator</option>
                              <option value="finance_admin">Finance Admin</option>
                              <option value="support_admin">Support Admin</option>
                            </select>
                          </div>
                        )}
                        {inspectedUser.role === 'fan' && (
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-neutral-400">Instant Creator Upgrade:</span>
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await adminForceConvertToCreator(inspectedUser.id);
                                if (res.success) {
                                  notifyFeedback(
                                    'success',
                                    `Force-converted ${inspectedUser.name} to an approved Creator (approval bypassed).`
                                  );
                                } else {
                                  notifyFeedback('error', res.error || 'Could not convert user to Creator.');
                                }
                              }}
                              className="px-3 py-1 rounded-lg bg-emerald-600/25 hover:bg-emerald-600/40 border border-emerald-500/40 text-emerald-300 font-semibold cursor-pointer"
                            >
                              Make Creator (Bypass Approval)
                            </button>
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-neutral-400">Verified Badge:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const res = adminUpdateUserAccount(inspectedUser.id, { isVerified: !inspectedUser.isVerified });
                              if (res.success) notifyFeedback('success', `Updated verification status for ${inspectedUser.name}.`);
                              else notifyFeedback('error', res.error || 'Permission denied.');
                            }}
                            className="px-3 py-1 rounded-lg bg-[#23232c] hover:bg-[#2c2c38] text-white cursor-pointer"
                          >
                            {inspectedUser.isVerified ? 'Verified (Revoke)' : 'Unverified (Verify)'}
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-neutral-400">Permanent Ban:</span>
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmReasonInput('Severe Terms of Service violation');
                              setConfirmDialog({
                                title: `Permanently Ban ${inspectedUser.name}`,
                                description: 'Permanent bans block login, freeze pending balances, and terminate active subscriptions.',
                                confirmLabel: 'Ban Account',
                                danger: true,
                                requireReason: true,
                                onConfirm: reason => {
                                  const res = adminUpdateUserAccount(inspectedUser.id, {
                                    accountStatus: 'banned',
                                    statusReason: reason
                                  });
                                  if (res.success) notifyFeedback('success', `Permanently banned ${inspectedUser.name}.`);
                                  else notifyFeedback('error', res.error || 'Unauthorized.');
                                }
                              });
                            }}
                            className="px-3 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-200 cursor-pointer"
                          >
                            Ban Account
                          </button>
                        </div>
                        {hasAdminPermission(['super_admin', 'admin']) &&
                          inspectedUser.id !== currentUser.id &&
                          (inspectedUser.adminPermissionLevel !== 'super_admin' ||
                            activeAdminPermissionLevel === 'super_admin') && (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#272730]">
                              <span className="text-neutral-400">Permanent Deletion:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDialog({
                                    title: `Permanently Delete ${inspectedUser.name}`,
                                    description: `Deletes ${inspectedUser.email}, creator profile, posts, stories, and creator applications permanently.`,
                                    confirmLabel: 'Delete Account Permanently',
                                    danger: true,
                                    onConfirm: async () => {
                                      const res = await adminDeleteUserAccount(inspectedUser.id);
                                      if (res.success) {
                                        setSelectedUserDetailId(null);
                                        notifyFeedback('success', `Deleted account ${inspectedUser.name} permanently.`);
                                      } else {
                                        notifyFeedback('error', res.error || 'Could not delete account.');
                                      }
                                    }
                                  });
                                }}
                                className="px-3 py-1 rounded-lg bg-rose-900/70 hover:bg-rose-800 border border-rose-500/40 text-rose-100 font-semibold cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Delete Account</span>
                              </button>
                            </div>
                          )}
                      </div>

                      {/* User Subscriptions */}
                      <div className="p-4 bg-[#18181f] rounded-xl border border-[#272730] space-y-2">
                        <div className="font-semibold text-white">Subscription History</div>
                        {(subscriptions || []).filter(s => s.fanId === inspectedUser.id || s.creatorId === inspectedUser.id).length === 0 ? (
                          <p className="text-neutral-500 text-[11px]">No subscriptions recorded for this user.</p>
                        ) : (
                          (subscriptions || [])
                            .filter(s => s.fanId === inspectedUser.id || s.creatorId === inspectedUser.id)
                            .slice(0, 4)
                            .map(s => (
                              <div key={s.id} className="flex items-center justify-between py-1 border-b border-[#23232b] last:border-0 text-[11px]">
                                <span className="text-neutral-300 truncate">{s.tierName}</span>
                                <span className="font-mono text-[#fce7b0]">${s.monthlyPrice}/mo ({s.status})</span>
                              </div>
                            ))
                        )}
                      </div>

                      {/* User Transactions */}
                      <div className="p-4 bg-[#18181f] rounded-xl border border-[#272730] space-y-2">
                        <div className="font-semibold text-white">Recent Wallet Ledger</div>
                        {(transactions || []).filter(t => t.userId === inspectedUser.id).length === 0 ? (
                          <p className="text-neutral-500 text-[11px]">No wallet transactions recorded.</p>
                        ) : (
                          (transactions || [])
                            .filter(t => t.userId === inspectedUser.id)
                            .slice(0, 4)
                            .map(t => {
                              const txAmount = Number(t.amount) || 0;
                              return (
                                <div key={t.id} className="flex items-center justify-between py-1 border-b border-[#23232b] last:border-0 text-[11px]">
                                  <span className="text-neutral-300 truncate max-w-[160px]">{t.description}</span>
                                  <span className={`font-mono ${txAmount >= 0 ? 'text-emerald-400' : 'text-white'}`}>
                                    {txAmount >= 0 ? '+' : ''}${txAmount.toFixed(2)}
                                  </span>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ================================================================
              03. CREATOR MANAGEMENT
          ================================================================ */}
          {activeSection === 'creators' && (() => {
            const selectedCreator = creators.find(c => c.id === selectedCreatorId) || creators[0];
            const creatorPosts = posts.filter(p => p.creatorId === selectedCreator?.id);
            const creatorReqs = customRequests.filter(r => r.creatorId === selectedCreator?.id);
            const creatorSubs = subscriptions.filter(s => s.creatorId === selectedCreator?.id && s.status === 'active');
            const filteredVerifications = sortedVerifications.filter(
              v => verifStatusFilter === 'all' || v.status === verifStatusFilter
            );

            return (
              <div className="space-y-6">
                {/* Creator Applications & Identity Verification Queue */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">03. Creator Applications &amp; 18+ Verification Queue</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Review government ID documents, facial selfie matches, and all creator onboarding applications.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {[
                        { id: 'all', label: `All (${sortedVerifications.length})` },
                        { id: 'pending', label: `Pending (${verifications.filter(v => v.status === 'pending').length})` },
                        { id: 'info_requested', label: `Info Requested (${verifications.filter(v => v.status === 'info_requested').length})` },
                        { id: 'approved', label: `Approved (${verifications.filter(v => v.status === 'approved').length})` },
                        { id: 'rejected', label: `Rejected (${verifications.filter(v => v.status === 'rejected').length})` }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setVerifStatusFilter(tab.id as typeof verifStatusFilter)}
                          className={`px-3 py-1.5 rounded-xl border cursor-pointer ${
                            verifStatusFilter === tab.id
                              ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#fce7b0] font-semibold'
                              : 'bg-[#18181f] border-[#272730] text-neutral-300'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredVerifications.map(v => {
                      const vUsername = String(v.username || '').toLowerCase();
                      const applicantAccount = allUnifiedUsers.find(
                        u => u.id === v.userId || (vUsername && String(u.username || '').toLowerCase() === vUsername)
                      );
                      return (
                      <div key={v.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-bold text-white text-sm">{v.name} (@{v.username})</span>
                            <span
                              className={`font-mono text-[11px] uppercase ${
                                v.status === 'approved'
                                  ? 'text-emerald-400'
                                  : v.status === 'rejected'
                                  ? 'text-rose-400'
                                  : 'text-amber-400'
                              }`}
                            >
                              · {v.status.replace('_', ' ')}
                            </span>
                            {v.applicationData && (
                              <span className="text-[11px] text-[#fce7b0]">
                                · Category: {v.applicationData.category} · Initial Tier: ${v.applicationData.monthlyTierPrice || 14.99}/mo
                              </span>
                            )}
                          </div>
                          <div className="text-neutral-400">
                            Account Email: <strong className="text-neutral-200">{v.email || applicantAccount?.email || `${v.username}@acovon.com`}</strong> · Document: <strong className="text-neutral-200 capitalize">{v.documentType.replace('_', ' ')}</strong> · ID Number: <strong className="font-mono text-neutral-200">{v.documentNumber}</strong> · Submitted: {v.submittedAt}
                          </div>
                          {v.applicationData?.bio && (
                            <div className="text-neutral-300 italic">"{v.applicationData.bio}"</div>
                          )}
                          {v.notes && <div className="text-[11px] text-neutral-400">Audit Notes: {v.notes}</div>}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <img src={v.selfieUrl} alt="Selfie" className="w-12 h-12 rounded-lg object-cover border border-[#2e2e38]" title="Live Facial Selfie" />
                          <img src={v.documentFileUrl} alt="ID Doc" className="w-16 h-12 rounded-lg object-cover border border-[#2e2e38]" title="Government Photo ID" />

                          {(v.status === 'pending' || v.status === 'info_requested') && (
                          <div className="flex flex-col gap-2 w-full sm:w-auto sm:min-w-[230px]">
                            <input
                              type="text"
                              value={verifNotesInput[v.id] || ''}
                              onChange={e => setVerifNotesInput(prev => ({ ...prev, [v.id]: e.target.value }))}
                              placeholder="Reviewer audit note or info request..."
                              className="bg-[#121216] border border-[#2e2e38] rounded-lg px-2.5 py-1 text-[11px] text-white"
                            />
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={async () => {
                                  const res = await reviewVerification(v.id, 'approved', verifNotesInput[v.id] || 'Biometric 18+ ID and facial selfie match verified.');
                                  notifyFeedback(res.success ? 'success' : 'error', res.success ? `Approved creator application for ${v.name}.` : (res.error || 'Approval failed.'));
                                }}
                                className="flex-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={async () => {
                                  const res = await reviewVerification(v.id, 'info_requested', verifNotesInput[v.id] || 'Please upload an unobstructed photo of your passport bio page.');
                                  notifyFeedback(res.success ? 'success' : 'error', res.success ? `Requested additional verification info from ${v.name}.` : (res.error || 'Action failed.'));
                                }}
                                className="flex-1 px-2.5 py-1.5 bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/40 text-amber-200 font-semibold rounded-lg cursor-pointer text-[11px]"
                              >
                                Request Info
                              </button>
                              <button
                                onClick={async () => {
                                  const res = await reviewVerification(v.id, 'rejected', verifNotesInput[v.id] || 'Document expired or unverifiable.');
                                  notifyFeedback(res.success ? 'success' : 'error', res.success ? `Rejected application for ${v.name}.` : (res.error || 'Rejection failed.'));
                                }}
                                className="px-2.5 py-1.5 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 font-semibold rounded-lg cursor-pointer text-[11px]"
                              >
                                Reject
                              </button>
                            </div>
                          </div>
                          )}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </div>

                {/* Partner Creators Directory & Deep-Dive Control */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-base font-bold text-white">Partner Creator Portfolio &amp; Governance</h3>
                      <p className="text-xs text-neutral-400">
                        Select any creator to inspect performance, subscription tiers, custom video orders, and privileges.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="text"
                        value={creatorSearch}
                        onChange={e => setCreatorSearch(e.target.value)}
                        placeholder="Filter creators..."
                        className="w-full sm:w-auto max-w-full min-w-0 bg-[#18181f] border border-[#272730] rounded-xl px-3 py-1.5 text-xs text-white"
                      />
                      <select
                        value={selectedCreatorId}
                        onChange={e => setSelectedCreatorId(e.target.value)}
                        className="w-full sm:w-auto max-w-full min-w-0 bg-[#18181f] border border-[#272730] rounded-xl px-3 py-1.5 text-xs text-white"
                      >
                        {creators
                          .filter(c => !creatorSearch || c.name.toLowerCase().includes(creatorSearch.toLowerCase()) || c.category.toLowerCase().includes(creatorSearch.toLowerCase()))
                          .map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name} (@{c.username}) — {c.category}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>

                  {selectedCreator && (
                    <div className="space-y-5">
                      <div className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          {selectedCreator.avatar ? (
                            <img src={selectedCreator.avatar} alt={selectedCreator.name} className="w-16 h-16 rounded-2xl object-cover border-2 border-[#d4af37]" />
                          ) : (
                            <div className="w-16 h-16 rounded-2xl bg-[#24242d] border-2 border-[#d4af37] flex items-center justify-center text-lg font-bold text-[#fce7b0] shrink-0">
                              {(selectedCreator.name || 'C').slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-base font-bold text-white">{selectedCreator.name}</span>
                              {selectedCreator.isVerified && <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />}
                              <span className="text-xs text-neutral-400">@{selectedCreator.username}</span>
                              <span className="text-[11px] font-mono uppercase text-emerald-400">
                                · {selectedCreator.accountStatus || 'active'}
                              </span>
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5">
                              {selectedCreator.category} · {selectedCreator.country} · {selectedCreator.followersCount.toLocaleString()} followers · {selectedCreator.subscribersCount.toLocaleString()} subscribers
                            </div>
                            <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 mt-2 text-xs font-mono tabular-nums">
                              <span className="text-[#fce7b0]">Total Earned: ${selectedCreator.totalEarnings.toLocaleString()}</span>
                              <span className="text-white">Wallet: ${(Number(selectedCreator.walletBalance) || 0).toFixed(2)}</span>
                              <span className="text-amber-400">Pending: ${(selectedCreator.pendingBalance || 0).toFixed(2)}</span>
                              <span className="text-emerald-400">Withdrawn: ${selectedCreator.withdrawnAmount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        {/* Creator Privilege Controls */}
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <button
                            onClick={() => {
                              const nextVerif = !selectedCreator.isVerified;
                              const res = adminUpdateCreatorControl(selectedCreator.id, { isVerified: nextVerif });
                              if (res.success) notifyFeedback('success', `${nextVerif ? 'Verified' : 'Removed verification badge from'} ${selectedCreator.name}.`);
                              else notifyFeedback('error', res.error || 'Unauthorized');
                            }}
                            className="px-3 py-1.5 bg-[#23232c] hover:bg-[#2d2d39] text-white rounded-lg cursor-pointer"
                          >
                            {selectedCreator.isVerified ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
                          </button>

                          <button
                            onClick={() => {
                              const currentFeatured = platformConfig?.featuredCreatorIds || [];
                              const isFeat = currentFeatured.includes(selectedCreator.id);
                              const nextIds = isFeat
                                ? currentFeatured.filter(id => id !== selectedCreator.id)
                                : [...currentFeatured, selectedCreator.id];
                              const res = updatePlatformConfig({ featuredCreatorIds: nextIds });
                              if (res.success) notifyFeedback('success', `${isFeat ? 'Removed from' : 'Added to'} Homepage Featured Creators.`);
                              else notifyFeedback('error', res.error || 'Unauthorized');
                            }}
                            className="px-3 py-1.5 bg-[#d4af37]/20 hover:bg-[#d4af37]/30 border border-[#d4af37]/40 text-[#fce7b0] rounded-lg cursor-pointer"
                          >
                            {(platformConfig?.featuredCreatorIds || []).includes(selectedCreator.id) ? '★ Featured on Homepage' : '☆ Feature Creator'}
                          </button>

                          <button
                            onClick={() => {
                              const isSusp = selectedCreator.accountStatus === 'suspended';
                              const res = adminUpdateCreatorControl(selectedCreator.id, {
                                accountStatus: isSusp ? 'active' : 'suspended'
                              });
                              if (res.success) notifyFeedback('success', `${isSusp ? 'Restored' : 'Suspended'} creator privileges for ${selectedCreator.name}.`);
                              else notifyFeedback('error', res.error || 'Unauthorized');
                            }}
                            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer ${
                              selectedCreator.accountStatus === 'suspended'
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                            }`}
                          >
                            {selectedCreator.accountStatus === 'suspended' ? 'Restore Creator Privileges' : 'Suspend Creator'}
                          </button>
                        </div>
                      </div>

                      {/* Creator Metrics & Subscription Plans */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-3">
                          <div className="text-xs font-bold text-white">
                            Published Subscription Tiers ({selectedCreator.tiers.length})
                          </div>
                          {selectedCreator.tiers.map(t => {
                            const isAct = t.isActive !== false;
                            return (
                              <div key={t.id} className="p-3 bg-[#121216] rounded-lg border border-[#25252e] flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-white">
                                    {t.name} · <span className="font-mono text-[#fce7b0]">${t.price.toFixed(2)}/mo</span>
                                  </div>
                                  <div className="text-[11px] text-neutral-400">
                                    {t.perks.slice(0, 2).join(' · ')}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    const res = toggleCreatorSubscriptionPlanActive(selectedCreator.id, t.id);
                                    if (res.success) {
                                      logAdminAction({
                                        category: 'creator_approval',
                                        action: `${isAct ? 'Suspended' : 'Activated'} Creator Tier "${t.name}"`,
                                        targetType: 'CreatorTier',
                                        targetId: t.id,
                                        targetLabel: `${selectedCreator.name} — ${t.name}`,
                                        details: `Tier price: $${t.price.toFixed(2)}/mo`
                                      });
                                      notifyFeedback('success', `${isAct ? 'Suspended' : 'Restored'} plan "${t.name}".`);
                                    }
                                  }}
                                  className={`px-2.5 py-1 rounded text-[11px] cursor-pointer ${
                                    isAct ? 'bg-rose-950/50 text-rose-300' : 'bg-emerald-950/50 text-emerald-300'
                                  }`}
                                >
                                  {isAct ? 'Suspend Tier' : 'Restore Tier'}
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        <div className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-3 text-xs">
                          <div className="font-bold text-white">
                            Creator Activity &amp; Custom Video Orders ({creatorReqs.length})
                          </div>
                          <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 text-center tabular-nums">
                            <div className="p-2.5 bg-[#121216] rounded-lg">
                              <div className="font-mono font-bold text-white text-sm">{creatorPosts.length}</div>
                              <div className="text-[10px] text-neutral-400">Published Posts</div>
                            </div>
                            <div className="p-2.5 bg-[#121216] rounded-lg">
                              <div className="font-mono font-bold text-white text-sm">{creatorSubs.length}</div>
                              <div className="text-[10px] text-neutral-400">Active Tier Records</div>
                            </div>
                            <div className="p-2.5 bg-[#121216] rounded-lg">
                              <div className="font-mono font-bold text-[#fce7b0] text-sm">${selectedCreator.callRatePerMinute}/m</div>
                              <div className="text-[10px] text-neutral-400">Video Call Rate</div>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            {creatorReqs.map(req => (
                              <div key={req.id} className="p-2.5 bg-[#121216] rounded-lg flex items-center justify-between text-[11px]">
                                <div>
                                  <div className="text-white font-medium">{req.title}</div>
                                  <div className="text-neutral-500">Patron: {req.fanName} ·Status: {req.status}</div>
                                </div>
                                <span className="font-mono text-[#fce7b0]">${req.price.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              04. CONTENT MANAGEMENT
          ================================================================ */}
          {activeSection === 'content' && (() => {
            const filteredPosts = posts.filter(p => {
              const q = contentSearch.toLowerCase();
              const matchesSearch =
                !q ||
                p.content.toLowerCase().includes(q) ||
                p.creatorName.toLowerCase().includes(q) ||
                p.creatorUsername.toLowerCase().includes(q);
              const matchesMedia =
                contentMediaFilter === 'all' ||
                (contentMediaFilter === 'video' && p.media.some(m => m.type === 'video')) ||
                (contentMediaFilter === 'image' && p.media.some(m => m.type === 'image')) ||
                (contentMediaFilter === 'ppv' && p.visibility === 'pay_per_view') ||
                (contentMediaFilter === 'subscribers' && p.visibility === 'subscribers') ||
                (contentMediaFilter === 'highlights' && p.isHighlight);
              const modSt = p.moderationStatus || 'approved';
              const matchesMod = contentModFilter === 'all' || modSt === contentModFilter;
              return matchesSearch && matchesMedia && matchesMod;
            });

            const pageSize = 8;
            const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
            const pagedPosts = filteredPosts.slice((contentPage - 1) * pageSize, contentPage * pageSize);

            return (
              <div className="space-y-6">
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">04. Platform-Wide Content Oversight</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Review, approve, restrict, remove, or restore photos, videos, PPV vault media, stories, and livestream recordings.
                      </p>
                    </div>

                    {/* Content Sub-Tabs */}
                    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#18181f] rounded-xl text-xs">
                      {[
                        { id: 'posts', label: `Posts & Media (${posts.length})` },
                        { id: 'recordings', label: `Live Recordings (${livestreams.length})` },
                        { id: 'statuses', label: `24h Stories (${statuses.length})` },
                        { id: 'private_safety', label: 'Authorized Safety Access' }
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setContentTab(t.id as typeof contentTab)}
                          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            contentTab === t.id ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SUB-TAB 1: Posts, Videos, Photos, PPV & Galleries */}
                  {contentTab === 'posts' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                        <div className="sm:col-span-2 relative">
                          <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={contentSearch}
                            onChange={e => { setContentSearch(e.target.value); setContentPage(1); }}
                            placeholder="Search caption, creator name, or @username..."
                            className="w-full bg-[#18181f] border border-[#272730] rounded-xl pl-10 pr-4 py-2 text-white"
                          />
                        </div>
                        <select
                          value={contentMediaFilter}
                          onChange={e => { setContentMediaFilter(e.target.value as typeof contentMediaFilter); setContentPage(1); }}
                          className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                        >
                          <option value="all">All Media Types</option>
                          <option value="video">Videos Only</option>
                          <option value="image">Photos &amp; Galleries</option>
                          <option value="ppv">Paid PPV Content</option>
                          <option value="subscribers">Subscriber-Only</option>
                          <option value="highlights">Short-Form Clips / Highlights</option>
                        </select>
                        <select
                          value={contentModFilter}
                          onChange={e => { setContentModFilter(e.target.value as typeof contentModFilter); setContentPage(1); }}
                          className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                        >
                          <option value="all">All Moderation Statuses</option>
                          <option value="approved">Approved</option>
                          <option value="flagged">Flagged</option>
                          <option value="restricted">Restricted</option>
                          <option value="removed">Removed</option>
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        {pagedPosts.map(p => {
                          const modSt = p.moderationStatus || 'approved';
                          const firstMedia = p.media[0];
                          return (
                            <div
                              key={p.id}
                              className={`p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs ${
                                modSt === 'removed'
                                  ? 'bg-rose-950/20 border-rose-500/30 opacity-75'
                                  : 'bg-[#18181f] border-[#272730]'
                              }`}
                            >
                              <div className="flex items-center gap-3.5 min-w-0">
                                {firstMedia && (
                                  <img
                                    src={firstMedia.thumbnailUrl || firstMedia.url}
                                    alt="Thumb"
                                    className="w-16 h-12 rounded-lg object-cover border border-[#2e2e38] shrink-0"
                                  />
                                )}
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-white">{p.creatorName}</span>
                                    <span className="text-neutral-500">@{p.creatorUsername}</span>
                                    <span className="text-[11px] font-mono text-[#fce7b0] uppercase">
                                      · {p.visibility.replace('_', ' ')} {p.ppvPrice ? `($${p.ppvPrice})` : ''}
                                    </span>
                                    <span
                                      className={`text-[11px] font-mono uppercase ${
                                        modSt === 'approved'
                                          ? 'text-emerald-400'
                                          : modSt === 'removed'
                                          ? 'text-rose-400 font-bold'
                                          : 'text-amber-400'
                                      }`}
                                    >
                                      · {modSt}
                                    </span>
                                  </div>
                                  <p className="text-neutral-300 truncate max-w-xl mt-0.5">{p.content}</p>
                                  <div className="text-[10px] text-neutral-500 mt-0.5">
                                    ID: {p.id} · Media: {p.media.map(m => m.type).join(', ')} · Likes: {p.likesCount} · Created: {p.createdAt}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                {modSt !== 'approved' && (
                                  <button
                                    onClick={() => {
                                      const res = adminModeratePost(p.id, 'approved', 'Reviewed and approved by moderation.');
                                      if (res.success) notifyFeedback('success', `Post #${p.id} approved and restored.`);
                                      else notifyFeedback('error', res.error || 'Unauthorized');
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                                  >
                                    Approve / Restore
                                  </button>
                                )}
                                {modSt !== 'restricted' && (
                                  <button
                                    onClick={() => {
                                      const res = adminModeratePost(p.id, 'restricted', 'Age-gate / sensitivity restriction applied.');
                                      if (res.success) notifyFeedback('success', `Post #${p.id} restricted.`);
                                      else notifyFeedback('error', res.error || 'Unauthorized');
                                    }}
                                    className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 rounded-lg cursor-pointer text-[11px]"
                                  >
                                    Restrict
                                  </button>
                                )}
                                {modSt !== 'removed' && (
                                  <button
                                    onClick={() => {
                                      const res = adminModeratePost(p.id, 'removed', 'Removed from public feed for policy compliance.');
                                      if (res.success) notifyFeedback('success', `Post #${p.id} removed from platform feed.`);
                                      else notifyFeedback('error', res.error || 'Unauthorized');
                                    }}
                                    className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-500/30 text-rose-300 font-semibold rounded-lg cursor-pointer text-[11px]"
                                  >
                                    Remove
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-neutral-400">
                        <span>
                          Showing {(contentPage - 1) * pageSize + 1}–{Math.min(contentPage * pageSize, filteredPosts.length)} of {filteredPosts.length} posts
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            disabled={contentPage <= 1}
                            onClick={() => setContentPage(p => Math.max(1, p - 1))}
                            className="px-3 py-1 rounded-lg bg-[#18181f] disabled:opacity-40 text-white cursor-pointer"
                          >
                            Previous
                          </button>
                          <span className="font-mono">
                            Page {contentPage} / {totalPages}
                          </span>
                          <button
                            disabled={contentPage >= totalPages}
                            onClick={() => setContentPage(p => Math.min(totalPages, p + 1))}
                            className="px-3 py-1 rounded-lg bg-[#18181f] disabled:opacity-40 text-white cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUB-TAB 2: Official Livestream Recordings */}
                  {contentTab === 'recordings' && (
                    <div className="space-y-3">
                      {livestreams.map(s => {
                        const recMode = s.recordingSettings?.mode || 'disabled';
                        const isRemoved = s.recordingStatus === 'removed';
                        const isPublished = s.isReplayPublished !== false && s.recordingStatus !== 'unpublished';
                        return (
                          <div key={s.id} className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div>
                              <div className="font-bold text-white">
                                {s.title} · <span className="text-neutral-400 font-normal">by {s.creatorName}</span>
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                                Mode: {recMode.toUpperCase()} {recMode === 'paid' ? `($${(s.recordingSettings?.price || 0).toFixed(2)})` : ''} · Status: {s.recordingStatus || 'not_recorded'} · Views: {s.replayViewsCount || 0} · Replay Gross: ${(s.replayGrossRevenue || 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              {recMode !== 'disabled' && !isRemoved && (
                                <button
                                  onClick={() => {
                                    updateLivestreamRecording(s.id, { isReplayPublished: !isPublished });
                                    logAdminAction({
                                      category: 'content_moderation',
                                      action: `${isPublished ? 'Unpublished' : 'Restored'} Official Livestream Recording`,
                                      targetType: 'LivestreamRecording',
                                      targetId: s.id,
                                      targetLabel: s.title,
                                      details: `Creator: ${s.creatorName}`
                                    });
                                    notifyFeedback('success', `Recording "${s.title}" ${isPublished ? 'unpublished' : 'restored'}.`);
                                  }}
                                  className="px-3 py-1.5 bg-[#23232c] hover:bg-[#2d2d39] text-white rounded-lg cursor-pointer text-[11px]"
                                >
                                  {isPublished ? 'Unpublish Replay' : 'Restore Replay'}
                                </button>
                              )}
                              {!isRemoved && (
                                <button
                                  onClick={() => {
                                    updateLivestreamRecording(s.id, { recordingStatus: 'removed', isReplayPublished: false });
                                    logAdminAction({
                                      category: 'content_moderation',
                                      action: 'Removed Prohibited Livestream Recording',
                                      targetType: 'LivestreamRecording',
                                      targetId: s.id,
                                      targetLabel: s.title,
                                      details: `Removed from public catalog (existing buyer rights preserved in audit ledger).`,
                                      severity: 'warning'
                                    });
                                    notifyFeedback('success', `Removed livestream recording "${s.title}".`);
                                  }}
                                  className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer text-[11px]"
                                >
                                  Remove Recording
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* SUB-TAB 3: 24h Creator Stories */}
                  {contentTab === 'statuses' && (
                    <div className="space-y-2.5">
                      {statuses.map(st => (
                        <div key={st.id} className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl flex flex-wrap items-center justify-between gap-4 text-xs">
                          <div>
                            <div className="font-bold text-white">
                              {st.creatorName} (@{st.creatorUsername}) · <span className="font-mono text-[#fce7b0] uppercase">{st.audience}</span>
                            </div>
                            <div className="text-neutral-300 mt-0.5">
                              {st.caption || st.textContent || st.textOverlay || 'Visual Story Update'}
                            </div>
                            <div className="text-[10px] text-neutral-500 mt-0.5">
                              Views: {st.viewsCount} · Reactions: {st.reactions.length} · Replies: {st.replies.length}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              deleteStatus(st.id);
                              logAdminAction({
                                category: 'content_moderation',
                                action: 'Removed Creator 24h Story Status',
                                targetType: 'CreatorStatus',
                                targetId: st.id,
                                targetLabel: `${st.creatorName} Story`,
                                details: st.caption || 'Removed by moderation'
                              });
                              notifyFeedback('success', `Removed story #${st.id}.`);
                            }}
                            className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer text-[11px]"
                          >
                            Remove Story
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SUB-TAB 4: Privacy-Protected Reported Private Content Inspection */}
                  {contentTab === 'private_safety' && (
                    <div className="space-y-4">
                      <div className="p-4 bg-[#18181f] border border-[#d4af37]/30 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-[#fce7b0] flex items-center gap-2">
                          <Lock className="w-4 h-4 text-[#d4af37]" />
                          <span>Strict Privacy &amp; Sensitive Access Logging Protocol</span>
                        </div>
                        <p className="text-neutral-400">
                          Private user communications and custom video deliverables are encrypted and hidden from ordinary administration. Unveiling reported private messages requires an explicit safety/legal authorization and writes a permanent `sensitive_access` audit record.
                        </p>
                      </div>

                      {reports
                        .filter(r => r.targetType === 'message')
                        .map(rep => {
                          const isUnlockedForAudit = authorizedPrivateAccessIds.includes(rep.id);
                          return (
                            <div key={rep.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-3 text-xs">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                  <span className="font-bold text-white">Reported Private Message #{rep.targetId}</span>
                                  <span className="text-neutral-400 ml-2">Reported by {rep.reporterName} · Reason: {rep.reason}</span>
                                </div>
                                {!isUnlockedForAudit ? (
                                  <button
                                    onClick={() => {
                                      setConfirmReasonInput('Authorized Trust & Safety inspection for report #' + rep.id);
                                      setConfirmDialog({
                                        title: 'Authorize Sensitive Message Inspection',
                                        description: 'Accessing this reported private message will be permanently logged in the immutable Security Audit Log under your operator ID.',
                                        confirmLabel: 'Log & Inspect Message',
                                        requireReason: true,
                                        onConfirm: reason => {
                                          setAuthorizedPrivateAccessIds(prev => [...prev, rep.id]);
                                          logAdminAction({
                                            category: 'sensitive_access',
                                            action: `Authorized Safety Inspection of Reported Private Message #${rep.targetId}`,
                                            targetType: 'PrivateMessage',
                                            targetId: rep.targetId,
                                            targetLabel: rep.targetTitle,
                                            details: `Justification: ${reason}`,
                                            severity: 'critical'
                                          });
                                          notifyFeedback('success', 'Sensitive access logged in Audit Trail.');
                                        }
                                      });
                                    }}
                                    className="px-3 py-1.5 bg-[#d4af37] text-black font-semibold rounded-lg cursor-pointer text-[11px]"
                                  >
                                    Authorize Safety Inspection
                                  </button>
                                ) : (
                                  <span className="text-[11px] font-mono text-emerald-400">Audit Access Logged</span>
                                )}
                              </div>
                              {isUnlockedForAudit && (
                                <div className="p-3 bg-[#121216] border border-[#2e2e38] rounded-lg text-neutral-300 font-mono text-[11px]">
                                  [AUTHORIZED AUDIT INSPECTION #{rep.targetId}]: {rep.targetTitle} — Reason: {rep.reason}.
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              05. LIVE MANAGEMENT
          ================================================================ */}
          {activeSection === 'live' && (
            <div className="space-y-6">
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">05. Live Broadcast &amp; Stream Safety Control</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Monitor active broadcasts, audience counts, ticket revenue, scheduled streams, and execute emergency safety terminations.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#18181f] rounded-xl text-xs">
                    {(['all', 'live', 'scheduled', 'ended'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setLiveFilter(st)}
                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer ${
                          liveFilter === st ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st} ({st === 'all' ? livestreams.length : livestreams.filter(s => s.status === st).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {livestreams
                    .filter(s => liveFilter === 'all' || s.status === liveFilter)
                    .map(s => {
                      const hostCreator = creators.find(c => c.id === s.creatorId);
                      const canHostLive = hostCreator?.canLivestream !== false;
                      return (
                        <div key={s.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img src={s.coverImage} alt={s.title} className="w-20 h-14 rounded-lg object-cover border border-[#2e2e38] shrink-0" />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-sm">{s.title}</span>
                                <span
                                  className={`font-mono text-[11px] uppercase ${
                                    s.status === 'live'
                                      ? 'text-rose-400 font-bold'
                                      : s.status === 'scheduled'
                                      ? 'text-amber-400'
                                      : 'text-neutral-400'
                                  }`}
                                >
                                  · {s.status}
                                </span>
                                <span className="text-[11px] text-[#fce7b0] font-mono">
                                  · {s.accessMode.replace('_', ' ')} {s.ppvTicketPrice ? `($${s.ppvTicketPrice})` : ''}
                                </span>
                              </div>
                              <div className="text-neutral-400 mt-0.5">
                                Host: <strong className="text-neutral-200">{s.creatorName}</strong> (@{s.creatorUsername}) · Category: {s.category}
                              </div>
                              <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                                Viewers: {s.viewerCount.toLocaleString()} · Live Revenue: ${(s.totalRevenue || 0).toFixed(2)} · Tickets Sold: {s.purchasedViewerIds.length} · Replay Revenue: ${(s.replayGrossRevenue || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                if (!hostCreator) return;
                                const res = adminUpdateCreatorControl(hostCreator.id, { canLivestream: !canHostLive });
                                if (res.success) {
                                  notifyFeedback(
                                    'success',
                                    `${canHostLive ? 'Restricted' : 'Restored'} livestream broadcasting permissions for ${hostCreator.name}.`
                                  );
                                } else {
                                  notifyFeedback('error', res.error || 'Unauthorized');
                                }
                              }}
                              className="px-3 py-1.5 bg-[#23232c] hover:bg-[#2c2c38] text-neutral-200 rounded-lg cursor-pointer text-[11px]"
                            >
                              {canHostLive ? 'Restrict Host Live Access' : 'Restore Host Live Access'}
                            </button>

                            {s.status === 'live' && (
                              <button
                                onClick={() => {
                                  setConfirmReasonInput('Emergency safety or policy enforcement termination');
                                  setConfirmDialog({
                                    title: `Emergency End Livestream: "${s.title}"`,
                                    description: `This will immediately terminate ${s.creatorName}'s active broadcast for all ${s.viewerCount.toLocaleString()} viewers and post a moderation notice.`,
                                    confirmLabel: 'Emergency End Stream',
                                    danger: true,
                                    requireReason: true,
                                    onConfirm: reason => {
                                      const res = adminEmergencyEndLivestream(s.id, reason);
                                      if (res.success) notifyFeedback('success', `Emergency terminated stream "${s.title}".`);
                                      else notifyFeedback('error', res.error || 'Unauthorized');
                                    }
                                  });
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                              >
                                Emergency End Stream
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              06. SUBSCRIPTIONS MANAGEMENT
          ================================================================ */}
          {activeSection === 'subscriptions' && (
            <div className="space-y-6">
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">06. Platform Subscriptions &amp; Billing Agreements</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Monitor active recurring fan memberships, new enrollments, cancellations, and issue audited billing cycle refunds.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#18181f] rounded-xl text-xs">
                    {(['all', 'active', 'cancelled'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setSubFilter(st)}
                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer ${
                          subFilter === st ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st} ({st === 'all' ? subscriptions.length : subscriptions.filter(s => s.status === st).length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs whitespace-nowrap tabular-nums">
                    <thead>
                      <tr className="border-b border-[#232329] text-neutral-400">
                        <th className="pb-3 font-medium">Subscription ID</th>
                        <th className="pb-3 font-medium">Fan / Subscriber</th>
                        <th className="pb-3 font-medium">Creator &amp; Plan</th>
                        <th className="pb-3 font-medium">Monthly Price</th>
                        <th className="pb-3 font-medium">Status / Renewal</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1c1c22]">
                      {subscriptions
                        .filter(s => subFilter === 'all' || s.status === subFilter)
                        .map(sub => {
                          const fan = allUnifiedUsers.find(u => u.id === sub.fanId);
                          const creator = creators.find(c => c.id === sub.creatorId);
                          return (
                            <tr key={sub.id} className="hover:bg-[#16161d]">
                              <td className="py-3.5 font-mono text-neutral-400">{sub.id}</td>
                              <td className="py-3.5 text-white font-medium">{fan?.name || sub.fanId}</td>
                              <td className="py-3.5 text-neutral-200">
                                {creator?.name || sub.creatorId} — <span className="text-[#fce7b0]">{sub.tierName}</span>
                              </td>
                              <td className="py-3.5 font-mono text-white">${sub.monthlyPrice.toFixed(2)}/mo</td>
                              <td className="py-3.5">
                                <span className={`font-mono uppercase ${sub.status === 'active' ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                  {sub.status}
                                </span>
                                <div className="text-[10px] text-neutral-500">Next: {sub.nextRenewalDate}</div>
                              </td>
                              <td className="py-3.5 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {sub.status === 'active' ? (
                                    <button
                                      onClick={() => {
                                        const res = adminManageSubscription(sub.id, 'cancel', 'Cancelled by administrator');
                                        if (res.success) notifyFeedback('success', `Cancelled subscription ${sub.id}.`);
                                        else notifyFeedback('error', res.error || 'Unauthorized');
                                      }}
                                      className="px-2.5 py-1 bg-[#23232c] hover:bg-[#2d2d39] text-neutral-200 rounded-lg cursor-pointer text-[11px]"
                                    >
                                      Cancel
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        const res = adminManageSubscription(sub.id, 'reactivate', 'Reactivated by administrator');
                                        if (res.success) notifyFeedback('success', `Reactivated subscription ${sub.id}.`);
                                        else notifyFeedback('error', res.error || 'Unauthorized');
                                      }}
                                      className="px-2.5 py-1 bg-emerald-950/60 text-emerald-300 rounded-lg cursor-pointer text-[11px]"
                                    >
                                      Reactivate
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      const res = adminManageSubscription(sub.id, 'refund_last_cycle', 'Admin refunded last billing cycle');
                                      if (res.success) notifyFeedback('success', `Refunded $${sub.monthlyPrice.toFixed(2)} for subscription ${sub.id}.`);
                                      else notifyFeedback('error', res.error || 'Unauthorized');
                                    }}
                                    className="px-2.5 py-1 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer text-[11px]"
                                  >
                                    Refund Cycle
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              07. FINANCIAL MANAGEMENT
          ================================================================ */}
          {activeSection === 'financials' && (() => {
            const filteredTx = transactions.filter(t => {
              const q = txSearch.toLowerCase();
              const matchesQ =
                !q ||
                t.description.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q) ||
                t.userId.toLowerCase().includes(q);
              const matchesType = txTypeFilter === 'all' || t.type === txTypeFilter;
              const matchesStatus = txStatusFilter === 'all' || t.status === txStatusFilter;
              return matchesQ && matchesType && matchesStatus;
            });

            const pageSize = 10;
            const totalPages = Math.max(1, Math.ceil(filteredTx.length / pageSize));
            const pagedTx = filteredTx.slice((txPage - 1) * pageSize, txPage * pageSize);

            return (
              <div className="space-y-6">
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">07. Financial Administration &amp; Immutable Ledger</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Direct balance fabrication is prohibited. All financial corrections use auditable adjustment or refund records.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowAdjustmentModal(true)}
                        className="px-3.5 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold rounded-xl text-xs cursor-pointer"
                      >
                        + Issue Audited Refund / Adjustment
                      </button>
                      <button
                        onClick={() => {
                          downloadCsv(
                            'acovon_financial_ledger.csv',
                            ['Transaction ID', 'User ID', 'Type', 'Amount ($)', 'Platform Fee ($)', 'Creator Net ($)', 'Status', 'Timestamp', 'Description'],
                            filteredTx.map(t => [
                              t.id,
                              t.userId,
                              t.type,
                              t.amount,
                              t.platformFee || 0,
                              t.netCreatorEarnings || 0,
                              t.status,
                              t.createdAt,
                              t.description
                            ])
                          );
                          notifyFeedback('success', 'Downloaded financial ledger CSV report.');
                        }}
                        className="px-3.5 py-2 bg-[#18181f] hover:bg-[#23232c] border border-[#2e2e38] text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Export Ledger CSV</span>
                      </button>
                    </div>
                  </div>

                  {/* Financial Summary Cards */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 text-xs tabular-nums">
                    <div className="p-3.5 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-neutral-400">Gross Platform Revenue</div>
                      <div className="text-lg font-bold font-mono text-white mt-0.5">${metrics.grossPlatformVolume.toLocaleString()}</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-neutral-400">Platform Commission</div>
                      <div className="text-lg font-bold font-mono text-[#fce7b0] mt-0.5">${metrics.platformCommissionTotal.toLocaleString()}</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-neutral-400">Creator Net Earnings</div>
                      <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">${metrics.creatorTotalEarned.toLocaleString()}</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] rounded-xl border border-[#272730]">
                      <div className="text-neutral-400">Disputed / Failed Tx</div>
                      <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                        {transactions.filter(t => t.status === 'disputed' || t.status === 'failed' || t.status === 'refunded').length} records
                      </div>
                    </div>
                  </div>

                  {/* Filters */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={txSearch}
                        onChange={e => { setTxSearch(e.target.value); setTxPage(1); }}
                        placeholder="Search by Transaction ID, User ID, or description..."
                        className="w-full bg-[#18181f] border border-[#272730] rounded-xl pl-10 pr-4 py-2 text-white"
                      />
                    </div>
                    <select
                      value={txTypeFilter}
                      onChange={e => { setTxTypeFilter(e.target.value); setTxPage(1); }}
                      className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="all">All Transaction Types</option>
                      <option value="subscription">Subscriptions</option>
                      <option value="ppv_purchase">PPV Purchases</option>
                      <option value="custom_request">Custom Video Escrow</option>
                      <option value="video_call">Paid Video Calls</option>
                      <option value="paid_message">Paid Messages</option>
                      <option value="tip">Tips &amp; Gifts</option>
                      <option value="live_ticket">Livestream Tickets</option>
                      <option value="live_replay">Livestream Replays</option>
                      <option value="payout_received">Creator Payouts</option>
                      <option value="refund">Refunds</option>
                      <option value="adjustment">Audited Adjustments</option>
                      <option value="chargeback">Chargebacks</option>
                    </select>
                    <select
                      value={txStatusFilter}
                      onChange={e => { setTxStatusFilter(e.target.value); setTxPage(1); }}
                      className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="all">All Statuses</option>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                      <option value="disputed">Disputed</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Ledger Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs whitespace-nowrap tabular-nums">
                      <thead>
                        <tr className="border-b border-[#232329] text-neutral-400">
                          <th className="pb-3 font-medium">Tx ID / Date</th>
                          <th className="pb-3 font-medium">Account</th>
                          <th className="pb-3 font-medium">Type</th>
                          <th className="pb-3 font-medium">Description</th>
                          <th className="pb-3 font-medium">Amount</th>
                          <th className="pb-3 font-medium">Platform Fee</th>
                          <th className="pb-3 font-medium text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1c1c22]">
                        {pagedTx.map(tx => (
                          <tr key={tx.id} className="hover:bg-[#16161d]">
                            <td className="py-3 pr-3 font-mono">
                              <div className="text-white">{tx.id}</div>
                              <div className="text-[10px] text-neutral-500">{tx.createdAt}</div>
                            </td>
                            <td className="py-3 pr-3 font-mono text-neutral-300">{tx.userId}</td>
                            <td className="py-3 pr-3 font-mono uppercase text-[11px] text-[#fce7b0]">
                              {tx.type.replace('_', ' ')}
                            </td>
                            <td className="py-3 pr-3 text-neutral-200 max-w-xs truncate">{tx.description}</td>
                            <td className={`py-3 pr-3 font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-white'}`}>
                              {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                            </td>
                            <td className="py-3 pr-3 font-mono text-neutral-400">
                              {tx.platformFee !== undefined ? `$${tx.platformFee.toFixed(2)}` : '—'}
                            </td>
                            <td className="py-3 text-right font-mono uppercase text-[11px]">
                              <span
                                className={
                                  tx.status === 'completed'
                                    ? 'text-emerald-400'
                                    : tx.status === 'pending'
                                    ? 'text-amber-400'
                                    : 'text-rose-400'
                                }
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-xs text-neutral-400">
                    <span>
                      Showing {(txPage - 1) * pageSize + 1}–{Math.min(txPage * pageSize, filteredTx.length)} of {filteredTx.length} transactions
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={txPage <= 1}
                        onClick={() => setTxPage(p => Math.max(1, p - 1))}
                        className="px-3 py-1 rounded-lg bg-[#18181f] disabled:opacity-40 text-white cursor-pointer"
                      >
                        Previous
                      </button>
                      <span className="font-mono">
                        Page {txPage} / {totalPages}
                      </span>
                      <button
                        disabled={txPage >= totalPages}
                        onClick={() => setTxPage(p => Math.min(totalPages, p + 1))}
                        className="px-3 py-1 rounded-lg bg-[#18181f] disabled:opacity-40 text-white cursor-pointer"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              08. PAYOUTS MANAGEMENT
          ================================================================ */}
          {activeSection === 'payouts' && (
            <div className="space-y-6">
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">08. Creator Payouts &amp; Settlement Workflow</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Review, approve, settle, or reject creator withdrawal requests. Requires Finance Admin or Super Admin authorization.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#18181f] rounded-xl text-xs">
                    {(['all', 'pending', 'approved', 'completed', 'rejected'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setPayoutFilter(st)}
                        className={`px-3 py-1.5 rounded-lg capitalize cursor-pointer ${
                          payoutFilter === st ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {payoutRequests
                    .filter(p => payoutFilter === 'all' || p.status === payoutFilter)
                    .map(p => (
                      <div key={p.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3.5">
                          <img src={p.creatorAvatar} alt={p.creatorName} className="w-11 h-11 rounded-full object-cover border border-[#d4af37]/50" />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{p.creatorName}</span>
                              <span className="text-neutral-400">@{p.creatorUsername}</span>
                              <span className="font-mono text-sm font-bold text-[#fce7b0]">· ${p.amount.toFixed(2)}</span>
                              <span
                                className={`font-mono uppercase text-[11px] ${
                                  p.status === 'completed'
                                    ? 'text-emerald-400'
                                    : p.status === 'rejected'
                                    ? 'text-rose-400'
                                    : 'text-amber-400'
                                }`}
                              >
                                · {p.status}
                              </span>
                            </div>
                            <div className="text-neutral-400 mt-0.5">
                              Method: {p.method} · Account: <span className="font-mono text-neutral-200">{p.accountDestination}</span> · Requested: {p.requestedAt}
                            </div>
                            {p.notes && <div className="text-[11px] text-neutral-500 mt-0.5">Notes: {p.notes}</div>}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {p.status === 'pending' && (
                            <button
                              onClick={() => {
                                const res = adminProcessPayout(p.id, 'approved', 'Verified creator ledger balance; approved for wire settlement.');
                                if (res.success) notifyFeedback('success', `Approved payout #${p.id} ($${p.amount.toFixed(2)}).`);
                                else notifyFeedback('error', res.error || 'Unauthorized');
                              }}
                              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                            >
                              Approve Batch
                            </button>
                          )}
                          {(p.status === 'pending' || p.status === 'approved') && (
                            <>
                              <button
                                onClick={() => {
                                  const res = adminProcessPayout(p.id, 'completed', 'Dispatched wire settlement to verified bank account.');
                                  if (res.success) notifyFeedback('success', `Completed & settled payout #${p.id} ($${p.amount.toFixed(2)}).`);
                                  else notifyFeedback('error', res.error || 'Unauthorized');
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                              >
                                Mark Settled &amp; Dispatched
                              </button>
                              <button
                                onClick={() => {
                                  const res = adminProcessPayout(p.id, 'rejected', 'Bank routing verification mismatch; funds returned to creator wallet.');
                                  if (res.success) notifyFeedback('success', `Rejected payout #${p.id}; funds returned to creator wallet.`);
                                  else notifyFeedback('error', res.error || 'Unauthorized');
                                }}
                                className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer text-[11px]"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              09. PROMOTIONS & ADVERTISING
          ================================================================ */}
          {activeSection === 'promotions' && (
            <div className="space-y-6">
              {/* Creator Promotional Campaigns */}
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">09. Creator Promotional Campaigns &amp; Ad Governance</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Approve or reject creator promotional campaigns, monitor campaign budgets and impressions, and configure approved ad integrations.
                  </p>
                </div>

                <div className="space-y-3">
                  {promotions.map(promo => (
                    <div key={promo.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-white text-sm">{promo.packageTitle}</span>
                          <span className="text-neutral-400">by {promo.creatorName}</span>
                          <span className="font-mono text-[#fce7b0]">· Budget: ${promo.budget.toFixed(2)}</span>
                          <span className="font-mono uppercase text-[11px] text-emerald-400">· {promo.status.replace('_', ' ')}</span>
                        </div>
                        <div className="text-neutral-400 mt-0.5 font-mono text-[11px]">
                          Type: {promo.type} · Duration: {promo.durationDays}d ({promo.startDate} to {promo.endDate}) · Impressions: {promo.impressions.toLocaleString()} · Clicks: {promo.clicks.toLocaleString()} · Visits: {promo.profileVisits.toLocaleString()}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {promo.status !== 'active' && (
                          <button
                            onClick={() => {
                              const res = adminManagePromotion(promo.id, 'active', 'Approved by Admin for discovery placement.');
                              if (res.success) notifyFeedback('success', `Approved campaign "${promo.packageTitle}".`);
                              else notifyFeedback('error', res.error || 'Unauthorized');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                          >
                            Approve Campaign
                          </button>
                        )}
                        {promo.status === 'active' && (
                          <button
                            onClick={() => {
                              const res = adminManagePromotion(promo.id, 'paused', 'Paused by Admin.');
                              if (res.success) notifyFeedback('success', `Paused campaign "${promo.packageTitle}".`);
                              else notifyFeedback('error', res.error || 'Unauthorized');
                            }}
                            className="px-3 py-1.5 bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded-lg cursor-pointer text-[11px]"
                          >
                            Pause
                          </button>
                        )}
                        {promo.status !== 'rejected' && (
                          <button
                            onClick={() => {
                              const res = adminManagePromotion(promo.id, 'rejected', 'Rejected & refunded to creator wallet.');
                              if (res.success) notifyFeedback('success', `Rejected campaign and refunded $${promo.budget.toFixed(2)} to ${promo.creatorName}.`);
                              else notifyFeedback('error', res.error || 'Unauthorized');
                            }}
                            className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 text-rose-300 rounded-lg cursor-pointer text-[11px]"
                          >
                            Reject &amp; Refund
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Approved Web Advertising Integration */}
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4 text-xs">
                <h3 className="text-sm font-bold text-white">Approved Advertising Integration (Google AdSense)</h3>
                <p className="text-neutral-400">
                  Unapproved third-party ad networks are strictly blocked. Active subscribers automatically receive an ad-free experience.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3.5 bg-[#18181f] rounded-xl border border-[#272730] flex items-center justify-between">
                    <span>Enable Free-Tier Feed Ads</span>
                    <input
                      type="checkbox"
                      checked={adsEnabled}
                      onChange={e => setAdsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Verified Publisher ID</label>
                    <input
                      type="text"
                      value={pubId}
                      onChange={e => setPubId(e.target.value)}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Feed Placement Frequency</label>
                    <select
                      value={adFrequency}
                      onChange={e => setAdFrequency(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value={3}>Every 3 posts</option>
                      <option value={4}>Every 4 posts</option>
                      <option value={6}>Every 6 posts</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    updateAdSettings({ adsEnabled, adSensePublisherId: pubId, frequencyFeedEveryNPosts: adFrequency });
                    notifyFeedback('success', 'Saved advertising placement settings.');
                  }}
                  className="px-5 py-2 bg-[#d4af37] text-black font-semibold rounded-xl cursor-pointer"
                >
                  Save Advertising Configuration
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              10. REPORTS & MODERATION CENTER
          ================================================================ */}
          {activeSection === 'moderation' && (
            <div className="space-y-6">
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-white">10. Centralized Reports &amp; Moderation Queue</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Investigate, assign, escalate, and resolve reports across users, creators, posts, livestreams, messages, copyright, and fraud.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#18181f] rounded-xl text-xs">
                    {(['all', 'open', 'investigating', 'escalated', 'resolved', 'dismissed'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => setReportFilter(st)}
                        className={`px-2.5 py-1.5 rounded-lg capitalize cursor-pointer ${
                          reportFilter === st ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {reports
                    .filter(r => reportFilter === 'all' || r.status === reportFilter)
                    .map(r => (
                      <div key={r.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-3 text-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-neutral-400">#{r.id}</span>
                              <span className="font-bold text-white text-sm">{r.targetTitle}</span>
                              <span className="font-mono uppercase text-[11px] text-amber-400">
                                · Category: {r.reason}
                              </span>
                              <span className="font-mono uppercase text-[11px] text-[#fce7b0]">
                                · Target: {r.targetType} ({r.targetId})
                              </span>
                              <span
                                className={`font-mono uppercase text-[11px] ${
                                  r.status === 'resolved'
                                    ? 'text-emerald-400'
                                    : r.status === 'escalated'
                                    ? 'text-rose-400 font-bold'
                                    : 'text-amber-300'
                                }`}
                              >
                                · Status: {r.status}
                              </span>
                            </div>
                            <div className="text-neutral-400">
                              Reported by: <strong className="text-neutral-200">{r.reporterName}</strong> ({r.reporterId}) · Date: {r.createdAt} · Assigned Moderator:{' '}
                              <strong className="text-white">{r.assignedModeratorName || 'Unassigned'}</strong>
                            </div>
                            <div className="text-neutral-200">Description &amp; Evidence: "{r.details}"</div>
                            {r.actionTaken && (
                              <div className="text-emerald-400 font-medium">Resolution: {r.actionTaken}</div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              onClick={() => {
                                const res = adminUpdateReport(r.id, {
                                  status: 'investigating',
                                  assignedModeratorId: currentUser.id,
                                  assignedModeratorName: currentUser.name
                                });
                                if (res.success) notifyFeedback('success', `Assigned report #${r.id} to ${currentUser.name}.`);
                                else notifyFeedback('error', res.error || 'Unauthorized');
                              }}
                              className="px-2.5 py-1.5 bg-[#23232c] hover:bg-[#2c2c38] text-white rounded-lg cursor-pointer text-[11px]"
                            >
                              Assign to Me
                            </button>
                            <button
                              onClick={() => {
                                const res = adminUpdateReport(r.id, {
                                  status: 'escalated',
                                  actionTaken: 'Escalated to Super Admin for legal/compliance review.'
                                });
                                if (res.success) notifyFeedback('success', `Escalated report #${r.id} to Super Admin.`);
                                else notifyFeedback('error', res.error || 'Unauthorized');
                              }}
                              className="px-2.5 py-1.5 bg-amber-950/60 border border-amber-500/30 text-amber-300 rounded-lg cursor-pointer text-[11px]"
                            >
                              Escalate
                            </button>
                            <button
                              onClick={() => {
                                if (r.targetType === 'post') {
                                  adminModeratePost(r.targetId, 'removed', `Removed via report #${r.id}`);
                                } else if (r.targetType === 'user' || r.targetType === 'creator') {
                                  adminUpdateUserAccount(r.targetId, { accountStatus: 'suspended', statusReason: `Suspended via report #${r.id}` });
                                }
                                const res = adminUpdateReport(r.id, {
                                  status: 'resolved',
                                  actionTaken: `Enforced policy action on ${r.targetType} #${r.targetId} and notified reporter.`
                                });
                                if (res.success) notifyFeedback('success', `Resolved report #${r.id} and enforced policy action.`);
                                else notifyFeedback('error', res.error || 'Unauthorized');
                              }}
                              className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                            >
                              Enforce &amp; Resolve
                            </button>
                            <button
                              onClick={() => {
                                const res = adminUpdateReport(r.id, {
                                  status: 'dismissed',
                                  actionTaken: 'Dismissed after compliance review; no violation found.'
                                });
                                if (res.success) notifyFeedback('success', `Dismissed report #${r.id}.`);
                                else notifyFeedback('error', res.error || 'Unauthorized');
                              }}
                              className="px-2.5 py-1.5 bg-[#23232c] text-neutral-300 rounded-lg cursor-pointer text-[11px]"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>

                        {r.actionHistory && r.actionHistory.length > 0 && (
                          <div className="pt-2 border-t border-[#23232b] space-y-1 text-[11px] text-neutral-400">
                            <div className="font-semibold text-neutral-300">Action History:</div>
                            {r.actionHistory.map((h, i) => (
                              <div key={i} className="font-mono">
                                [{h.timestamp}] <strong className="text-neutral-200">{h.actor}</strong>: {h.action}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              11. SUPPORT & DISPUTE MANAGEMENT CENTER
          ================================================================ */}
          {activeSection === 'support' && (() => {
            const filteredTickets = supportTickets.filter(t => {
              const matchesStatus = ticketFilter === 'all' || t.status === ticketFilter;
              const matchesCat = ticketCatFilter === 'all' || t.category === ticketCatFilter;
              return matchesStatus && matchesCat;
            });
            const activeTicket = supportTickets.find(t => t.id === selectedTicketId) || filteredTickets[0];

            return (
              <div className="space-y-6">
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">11. Support Center &amp; Escrow Dispute Resolution</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Manage user &amp; creator support tickets, payment disputes, refund requests, subscription issues, and custom video escrow holds.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={ticketCatFilter}
                        onChange={e => setTicketCatFilter(e.target.value)}
                        className="w-full sm:w-auto max-w-full min-w-0 bg-[#18181f] border border-[#272730] rounded-xl px-3 py-1.5 text-white"
                      >
                        <option value="all">All Ticket Categories</option>
                        <option value="payment_dispute">Payment Disputes</option>
                        <option value="refund_request">Refund Requests</option>
                        <option value="subscription_issue">Subscription Issues</option>
                        <option value="payout_issue">Creator Payout Issues</option>
                        <option value="livestream_issue">Livestream Issues</option>
                        <option value="failed_upload">Failed Uploads</option>
                        <option value="account_access">Account Access</option>
                      </select>
                      <select
                        value={ticketFilter}
                        onChange={e => setTicketFilter(e.target.value as typeof ticketFilter)}
                        className="w-full sm:w-auto max-w-full min-w-0 bg-[#18181f] border border-[#272730] rounded-xl px-3 py-1.5 text-white"
                      >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="escalated">Escalated</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* Ticket Queue List */}
                    <div className="lg:col-span-5 space-y-2.5">
                      {filteredTickets.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTicketId(t.id)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all text-xs ${
                            activeTicket?.id === t.id
                              ? 'bg-[#1c1a12] border-[#d4af37]/50'
                              : 'bg-[#18181f] border-[#272730] hover:border-[#383845]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] text-neutral-400">#{t.id} · {t.category.replace('_', ' ').toUpperCase()}</span>
                            <span
                              className={`font-mono uppercase text-[10px] ${
                                t.priority === 'urgent' || t.priority === 'high'
                                  ? 'text-rose-400 font-bold'
                                  : 'text-amber-300'
                              }`}
                            >
                              {t.priority} priority
                            </span>
                          </div>
                          <div className="font-bold text-white mt-1">{t.subject}</div>
                          <div className="text-[11px] text-neutral-400 mt-1">
                            {t.userName} ({t.userRole}) · Status: <strong className="text-neutral-200 uppercase">{t.status.replace('_', ' ')}</strong>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Active Ticket Inspector & Response Console */}
                    <div className="lg:col-span-7">
                      {activeTicket && (
                        <div className="p-5 bg-[#18181f] border border-[#272730] rounded-2xl space-y-4 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#25252e] pb-3">
                            <div>
                              <div className="font-bold text-white text-sm">{activeTicket.subject}</div>
                              <div className="text-neutral-400 text-[11px] mt-0.5">
                                Submitted by {activeTicket.userName} (@{activeTicket.userUsername}) · Assigned to:{' '}
                                <strong className="text-white">{activeTicket.assignedAdminName || 'Unassigned'}</strong>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={activeTicket.priority}
                                onChange={e => {
                                  const res = adminUpdateSupportTicket(activeTicket.id, {
                                    priority: e.target.value as SupportTicket['priority']
                                  });
                                  if (res.success) notifyFeedback('success', 'Updated ticket priority.');
                                }}
                                className="bg-[#121216] border border-[#2e2e38] rounded-lg px-2 py-1 text-white"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                              </select>
                              <select
                                value={activeTicket.status}
                                onChange={e => {
                                  const res = adminUpdateSupportTicket(activeTicket.id, {
                                    status: e.target.value as SupportTicket['status']
                                  });
                                  if (res.success) notifyFeedback('success', 'Updated ticket status.');
                                }}
                                className="bg-[#121216] border border-[#2e2e38] rounded-lg px-2 py-1 text-white"
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="escalated">Escalated</option>
                                <option value="resolved">Resolved</option>
                                <option value="closed">Closed</option>
                              </select>
                            </div>
                          </div>

                          {activeTicket.disputedAmount && (
                            <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-xl flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="font-semibold text-rose-200">
                                  Disputed Escrow Amount: ${activeTicket.disputedAmount.toFixed(2)}
                                </div>
                                <div className="text-[11px] text-neutral-400">
                                  Linked Order: {activeTicket.relatedRequestId || 'N/A'} · Tx: {activeTicket.relatedTransactionId || 'N/A'}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  if (activeTicket.relatedRequestId) {
                                    updateCustomRequestStatus(activeTicket.relatedRequestId, 'refunded');
                                  }
                                  const res = adminCreateFinancialAdjustment({
                                    targetUserId: activeTicket.userId,
                                    type: 'refund',
                                    amount: activeTicket.disputedAmount || 0,
                                    reason: `Dispute resolution refund for Support Ticket #${activeTicket.id}`,
                                    referenceId: activeTicket.relatedTransactionId
                                  });
                                  if (res.success) {
                                    adminUpdateSupportTicket(activeTicket.id, {
                                      status: 'resolved',
                                      replyMessage: `Issued full escrow refund of $${(activeTicket.disputedAmount || 0).toFixed(2)} to your ACOVON wallet.`
                                    });
                                    notifyFeedback('success', 'Issued dispute refund and resolved ticket.');
                                  } else {
                                    notifyFeedback('error', res.error || 'Requires Finance Admin or Super Admin role.');
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg cursor-pointer text-[11px]"
                              >
                                Issue Dispute Refund
                              </button>
                            </div>
                          )}

                          {/* Conversation Thread */}
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {activeTicket.messages.map(m => (
                              <div
                                key={m.id}
                                className={`p-3 rounded-xl border ${
                                  m.senderRole === 'admin'
                                    ? 'bg-[#1c1a12] border-[#d4af37]/30 ml-6'
                                    : 'bg-[#121216] border-[#25252e] mr-6'
                                }`}
                              >
                                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                                  <strong className="text-white">{m.senderName}</strong>
                                  <span>{m.timestamp}</span>
                                </div>
                                <p className="text-neutral-200">{m.message}</p>
                              </div>
                            ))}
                          </div>

                          {/* Reply Box */}
                          <div className="flex flex-col xs:flex-row gap-2 pt-2">
                            <input
                              type="text"
                              value={ticketReplyInput}
                              onChange={e => setTicketReplyInput(e.target.value)}
                              placeholder="Write official support response to user..."
                              className="flex-1 min-w-0 bg-[#121216] border border-[#2e2e38] rounded-xl px-3.5 py-2 text-white"
                            />
                            <button
                              onClick={() => {
                                if (!ticketReplyInput.trim()) return;
                                const res = adminUpdateSupportTicket(activeTicket.id, {
                                  status: 'in_progress',
                                  assignedAdminId: currentUser.id,
                                  assignedAdminName: currentUser.name,
                                  replyMessage: ticketReplyInput
                                });
                                if (res.success) {
                                  setTicketReplyInput('');
                                  notifyFeedback('success', 'Support response sent and user notified.');
                                } else {
                                  notifyFeedback('error', res.error || 'Unauthorized');
                                }
                              }}
                              className="px-4 py-2 bg-[#d4af37] text-black font-semibold rounded-xl flex items-center gap-1.5 cursor-pointer"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>Send Reply</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              12. CATEGORIES & COMMISSION SETTINGS
          ================================================================ */}
          {activeSection === 'categories' && (
            <div className="space-y-6">
              {/* Dynamic Commission Matrix */}
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-white">12. Platform Commission Matrix &amp; Content Categories</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure take-rates across all monetization channels and manage platform-wide creator, video, and livestream categories.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-neutral-400 mb-1">Subscriptions Commission (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={commSubscriptions}
                      onChange={e => setCommSubscriptions(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">PPV &amp; Live Replays Fee (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={commPpv}
                      onChange={e => setCommPpv(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Custom Video Escrow Fee (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={commCustom}
                      onChange={e => setCommCustom(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">1-on-1 Video Calls Fee (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={commCalls}
                      onChange={e => setCommCalls(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Paid Direct Messages Fee (%)</label>
                    <input
                      type="number"
                      min={5}
                      max={50}
                      value={commMessages}
                      onChange={e => setCommMessages(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Tips &amp; Gifts Fee (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={35}
                      value={commTips}
                      onChange={e => setCommTips(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Creator Promotions Fee (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={commPromos}
                      onChange={e => setCommPromos(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Min Payout Threshold ($ USD)</label>
                    <input
                      type="number"
                      min={10}
                      max={500}
                      value={minWithdrawal}
                      onChange={e => setMinWithdrawal(Number(e.target.value))}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!hasAdminPermission(['super_admin', 'finance_admin'])) {
                      notifyFeedback('error', 'Unauthorized: Updating commission rates requires Super Admin or Finance Admin role.');
                      return;
                    }
                    updateCommissionSettings({
                      subscriptionsRate: commSubscriptions / 100,
                      ppvRate: commPpv / 100,
                      customRequestsRate: commCustom / 100,
                      videoCallsRate: commCalls / 100,
                      paidMessagesRate: commMessages / 100,
                      tipsRate: commTips / 100,
                      creatorPromotionsRate: commPromos / 100,
                      minWithdrawalAmount: minWithdrawal
                    });
                    notifyFeedback('success', 'Platform commission rates updated and logged.');
                  }}
                  className="px-5 py-2 bg-[#d4af37] text-black font-semibold rounded-xl text-xs cursor-pointer"
                >
                  Apply Commission Matrix
                </button>
              </div>

              {/* Official ACOVON Category & ISO 3166-1 Country Database Management */}
              <AdminCategoriesCountriesSection />

              {/* Content, Video & Livestream Categories Management */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
                {/* Official Platform Categories (Live Taxonomy Synced Across Entire Platform) */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-5 space-y-3">
                  <div className="font-bold text-white">Official Platform Categories ({activeCategories.length})</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategoryInput}
                      onChange={e => setNewCategoryInput(e.target.value)}
                      placeholder="Add official category..."
                      className="flex-1 bg-[#18181f] border border-[#272730] rounded-lg px-3 py-1.5 text-white"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const clean = newCategoryInput.trim();
                        if (!clean) return;
                        const res = await adminAddCategory({ name: clean });
                        if (res.success) {
                          setNewCategoryInput('');
                          notifyFeedback('success', `Added official category "${clean}" across the entire platform.`);
                        } else {
                          notifyFeedback('error', res.error || 'Could not add category.');
                        }
                      }}
                      className="px-3 py-1.5 bg-[#d4af37] text-black font-semibold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {activeCategories.map(cat => (
                      <div key={cat.id} className="p-2 bg-[#18181f] rounded-lg flex items-center justify-between">
                        <span className="text-neutral-200">{cat.name}</span>
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await adminDeleteCategory(cat.id);
                            if (res.success) {
                              notifyFeedback('success', `Deleted category "${cat.name}" across the entire platform.`);
                            } else {
                              notifyFeedback('error', res.error || 'Could not delete category.');
                            }
                          }}
                          className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                          title={`Delete ${cat.name} platform-wide`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Video Categories */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-5 space-y-3">
                  <div className="font-bold text-white">Video Vault Categories ({platformConfig.videoCategories.length})</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newVideoCategoryInput}
                      onChange={e => setNewVideoCategoryInput(e.target.value)}
                      placeholder="Add video category..."
                      className="flex-1 bg-[#18181f] border border-[#272730] rounded-lg px-3 py-1.5 text-white"
                    />
                    <button
                      onClick={() => {
                        const clean = newVideoCategoryInput.trim();
                        if (!clean) return;
                        if (platformConfig.videoCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
                          notifyFeedback('error', `Video category "${clean}" already exists.`);
                          return;
                        }
                        const res = updatePlatformConfig({
                          videoCategories: [...platformConfig.videoCategories, clean]
                        });
                        if (res.success) {
                          setNewVideoCategoryInput('');
                          notifyFeedback('success', 'Added video category.');
                        } else notifyFeedback('error', res.error || 'Unauthorized');
                      }}
                      className="px-3 py-1.5 bg-[#d4af37] text-black font-semibold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {Array.from(new Set(platformConfig.videoCategories)).map(cat => (
                      <div key={cat} className="p-2 bg-[#18181f] rounded-lg flex items-center justify-between">
                        <span className="text-neutral-200">{cat}</span>
                        <button
                          onClick={() => {
                            updatePlatformConfig({
                              videoCategories: platformConfig.videoCategories.filter(c => c !== cat)
                            });
                          }}
                          className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Livestream Categories */}
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-5 space-y-3">
                  <div className="font-bold text-white">Livestream Categories ({platformConfig.livestreamCategories.length})</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newLiveCategoryInput}
                      onChange={e => setNewLiveCategoryInput(e.target.value)}
                      placeholder="Add live category..."
                      className="flex-1 bg-[#18181f] border border-[#272730] rounded-lg px-3 py-1.5 text-white"
                    />
                    <button
                      onClick={() => {
                        const clean = newLiveCategoryInput.trim();
                        if (!clean) return;
                        if (platformConfig.livestreamCategories.some(c => c.toLowerCase() === clean.toLowerCase())) {
                          notifyFeedback('error', `Livestream category "${clean}" already exists.`);
                          return;
                        }
                        const res = updatePlatformConfig({
                          livestreamCategories: [...platformConfig.livestreamCategories, clean]
                        });
                        if (res.success) {
                          setNewLiveCategoryInput('');
                          notifyFeedback('success', 'Added livestream category.');
                        } else notifyFeedback('error', res.error || 'Unauthorized');
                      }}
                      className="px-3 py-1.5 bg-[#d4af37] text-black font-semibold rounded-lg cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {Array.from(new Set(platformConfig.livestreamCategories)).map(cat => (
                      <div key={cat} className="p-2 bg-[#18181f] rounded-lg flex items-center justify-between">
                        <span className="text-neutral-200">{cat}</span>
                        <button
                          onClick={() => {
                            updatePlatformConfig({
                              livestreamCategories: platformConfig.livestreamCategories.filter(c => c !== cat)
                            });
                          }}
                          className="text-neutral-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              13. ADMIN USERS & PERMISSIONS (RBAC)
          ================================================================ */}
          {activeSection === 'admin_users' && (() => {
            const cleanCandidateEmail = newAdminEmail.trim().toLowerCase();
            const matchedExistingUser = cleanCandidateEmail
              ? Object.values(users).find(u => u.email?.toLowerCase() === cleanCandidateEmail)
              : undefined;
            const canManageAdmins = hasAdminPermission(['super_admin', 'admin']);

            const handleCreateOrPromoteAdmin = async (e: React.FormEvent) => {
              e.preventDefault();
              if (!cleanCandidateEmail || !cleanCandidateEmail.includes('@')) {
                notifyFeedback('error', 'Please enter a valid email address.');
                return;
              }
              if (!matchedExistingUser && newAdminPassword.trim().length < 6) {
                notifyFeedback('error', 'Please provide an initial password (at least 6 characters) for the new admin account.');
                return;
              }
              setIsAddingAdmin(true);
              const res = await adminAddOrPromoteAdmin({
                email: cleanCandidateEmail,
                name: newAdminName.trim() || undefined,
                username: newAdminUsername.trim() || undefined,
                password: newAdminPassword.trim() || undefined,
                adminPermissionLevel: newAdminLevel,
                adminPermissions: newAdminPerms
              });
              setIsAddingAdmin(false);
              if (res.success && res.user) {
                notifyFeedback(
                  'success',
                  res.promotedExisting
                    ? `Promoted ${res.user.email} to ${ADMIN_ROLE_LABELS[newAdminLevel].label} with automatic Creator access.`
                    : `Added ${res.user.email} as ${ADMIN_ROLE_LABELS[newAdminLevel].label} with automatic Creator & Control Panel access.`
                );
                setNewAdminEmail('');
                setNewAdminName('');
                setNewAdminUsername('');
                setNewAdminPassword('');
                setNewAdminLevel('admin');
                setNewAdminPerms(ADMIN_ROLE_DEFAULT_PERMS.admin);
              } else {
                notifyFeedback('error', res.error || 'Could not save administrator account.');
              }
            };

            return (
              <div className="space-y-6">
                {canManageAdmins && (
                  <div className="bg-[#121216] border border-[#d4af37]/30 rounded-2xl p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Plus className="w-4 h-4 text-[#d4af37]" />
                          <span>Add or Promote Administrator</span>
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Add a new team member or promote an existing ACOVON user by email, assign their administrative role &amp; scopes, and automatically activate Creator video posting privileges.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleCreateOrPromoteAdmin} className="space-y-4 text-xs">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-neutral-300 font-medium mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={newAdminEmail}
                            onChange={e => setNewAdminEmail(e.target.value)}
                            placeholder="operator@acovon.com"
                            className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-300 font-medium mb-1">Full Name</label>
                          <input
                            type="text"
                            value={newAdminName}
                            onChange={e => setNewAdminName(e.target.value)}
                            placeholder={matchedExistingUser?.name || 'Full name'}
                            className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-300 font-medium mb-1">Username</label>
                          <input
                            type="text"
                            value={newAdminUsername}
                            onChange={e => setNewAdminUsername(e.target.value)}
                            placeholder={matchedExistingUser?.username || 'admin_username'}
                            className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        <div>
                          <label className="block text-neutral-300 font-medium mb-1">
                            {matchedExistingUser ? 'Reset/Set Password (Optional)' : 'Initial Password *'}
                          </label>
                          <div className="relative">
                            <input
                              type={showNewAdminPassword ? 'text' : 'password'}
                              required={!matchedExistingUser}
                              value={newAdminPassword}
                              onChange={e => setNewAdminPassword(e.target.value)}
                              placeholder={matchedExistingUser ? 'Leave blank to keep existing' : 'Min. 6 characters'}
                              className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 pr-9 text-white focus:outline-none focus:border-[#d4af37]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewAdminPassword(p => !p)}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                              aria-label="Toggle password visibility"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {matchedExistingUser && (
                        <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>
                            Existing user found: <strong>{matchedExistingUser.name}</strong> (@{matchedExistingUser.username}, current role: {matchedExistingUser.role}). Submitting will promote them to the selected Admin role and activate automatic Creator privileges.
                          </span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                        <div>
                          <label className="block text-neutral-300 font-medium mb-1">Administrative Role</label>
                          <select
                            value={newAdminLevel}
                            onChange={e => {
                              const lvl = e.target.value as AdminPermissionLevel;
                              setNewAdminLevel(lvl);
                              setNewAdminPerms(ADMIN_ROLE_DEFAULT_PERMS[lvl] || []);
                            }}
                            className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                          >
                            {activeAdminPermissionLevel === 'super_admin' && (
                              <option value="super_admin">Super Admin (Full Control)</option>
                            )}
                            <option value="admin">General Admin</option>
                            <option value="moderator">Trust &amp; Safety Moderator</option>
                            <option value="finance_admin">Finance &amp; Treasury Admin</option>
                            <option value="support_admin">Support &amp; Concierge Admin</option>
                          </select>
                          <p className="text-[11px] text-neutral-400 mt-1.5">
                            {ADMIN_ROLE_LABELS[newAdminLevel].description}
                          </p>
                        </div>

                        <div className="lg:col-span-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-neutral-300 font-medium">Custom Permission Scopes</label>
                            <button
                              type="button"
                              onClick={() => setNewAdminPerms(ADMIN_ROLE_DEFAULT_PERMS[newAdminLevel] || [])}
                              className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
                            >
                              Reset to Role Defaults
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-3 bg-[#18181f] border border-[#272730] rounded-xl max-h-44 overflow-y-auto">
                            {ALL_ADMIN_PERMISSION_SCOPES.filter(
                              scope => activeAdminPermissionLevel === 'super_admin' || scope !== 'all_privileges'
                            ).map(scope => {
                              const checked = newAdminPerms.includes(scope);
                              return (
                                <label
                                  key={scope}
                                  className={`flex items-center gap-2 px-2 py-1 rounded-lg cursor-pointer text-[11px] border ${
                                    checked
                                      ? 'bg-[#d4af37]/15 border-[#d4af37]/40 text-[#fce7b0]'
                                      : 'bg-[#121216] border-[#24242d] text-neutral-400 hover:text-neutral-200'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {
                                      setNewAdminPerms(prev =>
                                        prev.includes(scope)
                                          ? prev.filter(s => s !== scope)
                                          : [...prev, scope]
                                      );
                                    }}
                                    className="accent-[#d4af37]"
                                  />
                                  <span className="truncate font-mono">{scope}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-1">
                        <button
                          type="submit"
                          disabled={isAddingAdmin}
                          className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#c59b27] text-black font-bold flex items-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>
                            {isAddingAdmin
                              ? 'Saving Administrator...'
                              : matchedExistingUser
                              ? 'Promote User to Admin'
                              : 'Add Administrator'}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-white">13. Administrator Roles &amp; Permission Governance</h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Manage administrative roles, custom permission scopes, and operator privileges. Every active administrator automatically holds approved Creator video posting access.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {Object.values(users)
                      .filter(u => u.role === 'admin' || u.role === 'moderator' || u.adminPermissionLevel)
                      .map(adm => {
                        const level = adm.adminPermissionLevel || (adm.role === 'moderator' ? 'moderator' : 'admin');
                        const isSelf = adm.id === currentUser.id;
                        return (
                          <div key={adm.id} className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs">
                            <div className="flex items-center gap-3.5 min-w-0">
                              {adm.avatar ? (
                                <img src={adm.avatar} alt={adm.name} className="w-12 h-12 rounded-full object-cover border border-[#d4af37]/50 shrink-0" />
                              ) : (
                                <div className="w-12 h-12 rounded-full bg-[#24242d] border border-[#d4af37]/50 flex items-center justify-center text-sm font-bold text-[#fce7b0] shrink-0">
                                  {(adm.name || 'A').slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="font-bold text-white text-sm">{adm.name}</span>
                                  <span className="text-neutral-400">@{adm.username}</span>
                                  <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${ADMIN_ROLE_LABELS[level].badgeClass}`}>
                                    {ADMIN_ROLE_LABELS[level].label}
                                  </span>
                                  <span className="font-mono text-[10px] uppercase px-2 py-0.5 rounded border bg-emerald-950/50 border-emerald-500/30 text-emerald-300">
                                    Auto-Creator Active
                                  </span>
                                </div>
                                <div className="text-neutral-400 mt-0.5">{adm.bio}</div>
                                <div className="text-[11px] font-mono text-neutral-500 mt-0.5 break-all">
                                  Email: {adm.email} · Last Active: {adm.lastLoginAt || 'Today'} · Scopes: {(adm.adminPermissions || []).join(', ')}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              {adm.adminPermissionLevel !== 'super_admin' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = toggleAdminBrandingPermission(adm.id);
                                    if (res.success) {
                                      notifyFeedback(
                                        'success',
                                        `${res.granted ? 'Granted' : 'Revoked'} manage_platform_branding permission for ${adm.name}.`
                                      );
                                    } else {
                                      notifyFeedback('error', res.error || 'Only Super Admin can change branding permissions.');
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border cursor-pointer ${
                                    (adm.adminPermissions || []).includes('manage_platform_branding')
                                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                      : 'bg-[#121216] border-[#2e2e38] text-neutral-400 hover:text-white'
                                  }`}
                                >
                                  {(adm.adminPermissions || []).includes('manage_platform_branding')
                                    ? '✓ manage_platform_branding'
                                    : '+ Grant manage_platform_branding'}
                                </button>
                              )}

                              <select
                                value={level}
                                disabled={level === 'super_admin' && activeAdminPermissionLevel !== 'super_admin'}
                                onChange={e => {
                                  const nextLevel = e.target.value as AdminPermissionLevel;
                                  const res = adminUpdateUserAccount(adm.id, {
                                    adminPermissionLevel: nextLevel,
                                    role: nextLevel === 'moderator' ? 'moderator' : 'admin',
                                    adminPermissions: ADMIN_ROLE_DEFAULT_PERMS[nextLevel]
                                  });
                                  if (res.success) notifyFeedback('success', `Updated ${adm.name} permission level to ${ADMIN_ROLE_LABELS[nextLevel].label}.`);
                                  else notifyFeedback('error', res.error || 'Permission denied.');
                                }}
                                className="w-full xs:w-auto max-w-full min-w-0 bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-1.5 text-white disabled:opacity-50"
                              >
                                {(activeAdminPermissionLevel === 'super_admin' || level === 'super_admin') && (
                                  <option value="super_admin">Super Admin</option>
                                )}
                                <option value="admin">General Admin</option>
                                <option value="moderator">Moderator</option>
                                <option value="finance_admin">Finance Admin</option>
                                <option value="support_admin">Support Admin</option>
                              </select>

                              <button
                                onClick={() => {
                                  switchAdminOperator(adm.id);
                                  notifyFeedback('success', `Switched active session to ${adm.name} (${ADMIN_ROLE_LABELS[level].label}).`);
                                }}
                                className="px-3 py-1.5 bg-[#23232c] hover:bg-[#2e2e3a] text-[#fce7b0] rounded-xl cursor-pointer text-[11px] font-medium"
                              >
                                Switch to Account
                              </button>

                              {!isSelf && level !== 'super_admin' && canManageAdmins && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const res = adminUpdateUserAccount(adm.id, { role: 'creator' });
                                    if (res.success) {
                                      notifyFeedback('success', `Removed admin role from ${adm.name}; retained Creator access.`);
                                    } else {
                                      notifyFeedback('error', res.error || 'Permission denied.');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/30 text-amber-300 rounded-xl cursor-pointer text-[11px] font-medium"
                                >
                                  Demote Admin
                                </button>
                              )}

                              {!isSelf &&
                                canManageAdmins &&
                                (level !== 'super_admin' || activeAdminPermissionLevel === 'super_admin') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmDialog({
                                        title: `Delete Administrator ${adm.name}`,
                                        description: `Permanently deletes administrator account ${adm.email} and revokes all Control Panel, Creator, and authentication access. This cannot be undone.`,
                                        confirmLabel: 'Delete Admin Permanently',
                                        danger: true,
                                        onConfirm: async () => {
                                          const res = await adminDeleteUserAccount(adm.id);
                                          if (res.success) {
                                            notifyFeedback('success', `Deleted administrator account ${adm.email}.`);
                                          } else {
                                            notifyFeedback('error', res.error || 'Could not delete administrator account.');
                                          }
                                        }
                                      });
                                    }}
                                    className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 rounded-xl cursor-pointer text-[11px] font-medium flex items-center gap-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Admin</span>
                                  </button>
                                )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              14. PERMANENT ADMINISTRATIVE AUDIT LOGS
          ================================================================ */}
          {activeSection === 'audit_logs' && (() => {
            const filteredLogs = auditLogs.filter(l => {
              const q = auditSearch.toLowerCase();
              const matchesQ =
                !q ||
                l.action.toLowerCase().includes(q) ||
                l.adminName.toLowerCase().includes(q) ||
                l.targetLabel.toLowerCase().includes(q) ||
                l.details.toLowerCase().includes(q);
              const matchesCat = auditCategoryFilter === 'all' || l.category === auditCategoryFilter;
              const matchesSev = auditSeverityFilter === 'all' || l.severity === auditSeverityFilter;
              return matchesQ && matchesCat && matchesSev;
            });

            return (
              <div className="space-y-6">
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white">14. Permanent Administrative Audit Log</h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Append-only immutable security ledger recording all administrative actions, permission changes, payouts, and sensitive access.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        downloadCsv(
                          'acovon_security_audit_logs.csv',
                          ['Log ID', 'Timestamp', 'Admin ID', 'Admin Name', 'Role', 'Category', 'Severity', 'Action', 'Target', 'Details'],
                          filteredLogs.map(l => [
                            l.id,
                            l.timestamp,
                            l.adminId,
                            l.adminName,
                            l.adminRole,
                            l.category,
                            l.severity,
                            l.action,
                            l.targetLabel,
                            l.details
                          ])
                        );
                        notifyFeedback('success', 'Exported immutable audit log CSV.');
                      }}
                      className="px-3.5 py-2 bg-[#18181f] border border-[#2e2e38] text-white rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Export Audit CSV</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="sm:col-span-2 relative">
                      <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={auditSearch}
                        onChange={e => setAuditSearch(e.target.value)}
                        placeholder="Search by administrator, action, target, or details..."
                        className="w-full bg-[#18181f] border border-[#272730] rounded-xl pl-10 pr-4 py-2 text-white"
                      />
                    </div>
                    <select
                      value={auditCategoryFilter}
                      onChange={e => setAuditCategoryFilter(e.target.value)}
                      className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="all">All Event Categories</option>
                      <option value="auth_security">Auth &amp; Session Security</option>
                      <option value="user_account">User Account Actions</option>
                      <option value="creator_approval">Creator Approvals</option>
                      <option value="content_moderation">Content Moderation</option>
                      <option value="livestream_moderation">Livestream Moderation</option>
                      <option value="financial_action">Financial Actions</option>
                      <option value="payout_approval">Payout Approvals</option>
                      <option value="refund_decision">Refund Decisions</option>
                      <option value="platform_settings">Platform Settings</option>
                      <option value="platform_branding">Global Platform Branding</option>
                      <option value="permission_change">Permission Changes</option>
                      <option value="sensitive_access">Sensitive Data Access</option>
                    </select>
                    <select
                      value={auditSeverityFilter}
                      onChange={e => setAuditSeverityFilter(e.target.value)}
                      className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                    >
                      <option value="all">All Severities</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    {filteredLogs.map(log => (
                      <div key={log.id} className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`font-mono text-[10px] uppercase ${
                                log.severity === 'critical'
                                  ? 'text-rose-400 font-bold'
                                  : log.severity === 'warning'
                                  ? 'text-amber-400'
                                  : 'text-emerald-400'
                              }`}
                            >
                              [{log.severity}]
                            </span>
                            <span className="font-mono text-[11px] text-[#fce7b0] uppercase">
                              {log.category.replace('_', ' ')}
                            </span>
                            <span className="font-bold text-white">· {log.action}</span>
                          </div>
                          <div className="text-neutral-300">
                            Target: <strong className="text-white">{log.targetLabel}</strong> ({log.targetType} #{log.targetId}) — {log.details}
                          </div>
                        </div>
                        <div className="sm:text-right font-mono text-[11px] text-neutral-400 shrink-0">
                          <div className="text-neutral-200">{log.adminName} ({log.adminRole})</div>
                          <div>{log.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              15. PLATFORM CONFIGURATION
          ================================================================ */}
          {activeSection === 'platform_config' && (
            <div className="space-y-6">
              <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-6 text-xs">
                <div>
                  <h2 className="text-lg font-bold text-white">15. Global Platform Configuration &amp; Governance</h2>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Configure platform announcements, registration rules, creator application requirements, pricing limits, and notification templates.
                  </p>
                </div>

                {/* Global Announcement Banner */}
                <div className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-white text-sm">Global Platform Announcement Banner</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <span className="text-neutral-400">Active on Feed</span>
                      <input
                        type="checkbox"
                        checked={platformConfig.announcementActive}
                        onChange={e => {
                          const res = updatePlatformConfig({ announcementActive: e.target.checked });
                          if (res.success) notifyFeedback('success', 'Updated announcement visibility.');
                          else notifyFeedback('error', res.error || 'Unauthorized');
                        }}
                        className="w-4 h-4 accent-[#d4af37]"
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    value={platformConfig.announcementBanner}
                    onChange={e => updatePlatformConfig({ announcementBanner: e.target.value })}
                    className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3.5 py-2 text-white"
                  />
                </div>

                {/* Registration & Creator Onboarding Requirements */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Allow New User Registrations</div>
                      <div className="text-[11px] text-neutral-400">Enable public fan sign-ups</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformConfig.allowNewRegistrations}
                      onChange={e => updatePlatformConfig({ allowNewRegistrations: e.target.checked })}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                  </label>

                  <label className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Accept New Creator Applications</div>
                      <div className="text-[11px] text-neutral-400">Allow fans to apply for Creator Studio</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformConfig.allowCreatorApplications}
                      onChange={e => updatePlatformConfig({ allowCreatorApplications: e.target.checked })}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                  </label>

                  <label className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Require 18+ Government Photo ID</div>
                      <div className="text-[11px] text-neutral-400">Mandatory passport / license for creators</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformConfig.requireGovernmentIdForCreators}
                      onChange={e => updatePlatformConfig({ requireGovernmentIdForCreators: e.target.checked })}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                  </label>

                  <label className="p-4 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between cursor-pointer">
                    <div>
                      <div className="font-semibold text-white">Require Biometric Selfie Match</div>
                      <div className="text-[11px] text-neutral-400">Facial verification prior to payout release</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={platformConfig.requireSelfieMatchForCreators}
                      onChange={e => updatePlatformConfig({ requireSelfieMatchForCreators: e.target.checked })}
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                  </label>
                </div>

                {/* Pricing & Livestream Guardrails */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4 tabular-nums">
                  <div>
                    <label className="block text-neutral-400 mb-1">Min Subscription ($)</label>
                    <input
                      type="number"
                      value={platformConfig.minSubscriptionPrice}
                      onChange={e => updatePlatformConfig({ minSubscriptionPrice: Number(e.target.value) })}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Max Subscription ($)</label>
                    <input
                      type="number"
                      value={platformConfig.maxSubscriptionPrice}
                      onChange={e => updatePlatformConfig({ maxSubscriptionPrice: Number(e.target.value) })}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Max PPV Price ($)</label>
                    <input
                      type="number"
                      value={platformConfig.maxPpvPrice}
                      onChange={e => updatePlatformConfig({ maxPpvPrice: Number(e.target.value) })}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-neutral-400 mb-1">Max Live Duration (min)</label>
                    <input
                      type="number"
                      value={platformConfig.maxLivestreamDurationMinutes}
                      onChange={e => updatePlatformConfig({ maxLivestreamDurationMinutes: Number(e.target.value) })}
                      className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                {/* Notification Templates */}
                <div className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-3">
                  <div className="font-bold text-white text-sm">Automated System Notification Templates</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-400 mb-1">Creator Approval Template</label>
                      <input
                        type="text"
                        value={platformConfig.notificationTemplates.creatorApproved}
                        onChange={e =>
                          updatePlatformConfig({
                            notificationTemplates: {
                              ...platformConfig.notificationTemplates,
                              creatorApproved: e.target.value
                            }
                          })
                        }
                        className="w-full bg-[#121216] border border-[#2e2e38] rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-neutral-400 mb-1">Payout Settlement Template</label>
                      <input
                        type="text"
                        value={platformConfig.notificationTemplates.payoutCompleted}
                        onChange={e =>
                          updatePlatformConfig({
                            notificationTemplates: {
                              ...platformConfig.notificationTemplates,
                              payoutCompleted: e.target.value
                            }
                          })
                        }
                        className="w-full bg-[#121216] border border-[#2e2e38] rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              16. VIDEO COMPRESSION, TRANSCODING PIPELINE & STORAGE MANAGEMENT
          ================================================================ */}
          {activeSection === 'video_pipeline' && (() => {
            const totalOriginalBytes = videoMediaRecords.reduce((acc, r) => acc + r.originalFileSize, 0);
            const totalOptimizedBytes = videoMediaRecords.reduce((acc, r) => acc + r.optimizedFileSize, 0);
            const totalSavedBytes = Math.max(0, totalOriginalBytes - totalOptimizedBytes);
            const avgSavingsPct = totalOriginalBytes > 0 ? Math.round((totalSavedBytes / totalOriginalBytes) * 100) : 64;
            const avgVmaf = videoMediaRecords.length > 0
              ? (videoMediaRecords.reduce((acc, r) => acc + r.vmafScore, 0) / videoMediaRecords.length).toFixed(1)
              : '97.1';
            const activeJobsCount = videoProcessingJobs.filter(j => j.stage !== 'ready' && j.stage !== 'failed' && j.stage !== 'cancelled').length;
            const failedJobsCount = videoProcessingJobs.filter(j => j.stage === 'failed').length;

            return (
              <div className="space-y-6 text-xs">
                <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Layers className="w-5 h-5 text-[#d4af37]" />
                        <span>16. Automatic Video Compression, Adaptive Streaming &amp; Storage Engine</span>
                      </h2>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Monitor background transcoding workers, VMAF perceptual quality guardrails, HLS/DASH adaptive bitrate ladders, deduplication, and cloud storage savings.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => {
                          const nextPaused = !videoProcessingConfig.queuePaused;
                          const res = updateVideoProcessingConfig({ queuePaused: nextPaused });
                          if (res.success) {
                            notifyFeedback('success', nextPaused ? 'Background transcoding queue paused.' : 'Background transcoding queue resumed.');
                          } else {
                            notifyFeedback('error', res.error || 'Unauthorized');
                          }
                        }}
                        className={`px-3.5 py-2 rounded-xl font-bold cursor-pointer flex items-center gap-1.5 ${
                          videoProcessingConfig.queuePaused
                            ? 'bg-emerald-500 text-black'
                            : 'bg-amber-950/70 border border-amber-500/40 text-amber-200 hover:bg-amber-900/60'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{videoProcessingConfig.queuePaused ? 'Resume Queue Workers' : 'Pause Background Queue'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Storage & Streaming Telemetry KPI Grid */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 tabular-nums">
                    <div className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl">
                      <div className="text-[10px] uppercase text-neutral-400">Original Raw Uploads</div>
                      <div className="text-base font-bold font-mono text-white mt-1">
                        {(totalOriginalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{videoMediaRecords.length} master assets</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl">
                      <div className="text-[10px] uppercase text-neutral-400">Optimized Storage</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                        {(totalOptimizedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </div>
                      <div className="text-[10px] text-emerald-300/80 mt-0.5">-{avgSavingsPct}% footprint</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl">
                      <div className="text-[10px] uppercase text-neutral-400">Total Storage Saved</div>
                      <div className="text-base font-bold font-mono text-[#fce7b0] mt-1">
                        {(totalSavedBytes / (1024 * 1024 * 1024)).toFixed(2)} GB
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">+{videoProcessingConfig.totalBandwidthSavedGB} GB CDN saved</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl">
                      <div className="text-[10px] uppercase text-neutral-400">Avg Perceptual VMAF</div>
                      <div className="text-base font-bold font-mono text-sky-400 mt-1">{avgVmaf} / 100</div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">Floor: {videoProcessingConfig.minVmafThreshold} VMAF</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl">
                      <div className="text-[10px] uppercase text-neutral-400">CDN Edge Hit Rate</div>
                      <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                        {videoProcessingConfig.cdnCacheHitRatePercent}%
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">{videoProcessingConfig.avgBufferFreeStartupMs}ms startup</div>
                    </div>
                    <div className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl">
                      <div className="text-[10px] uppercase text-neutral-400">Queue Status</div>
                      <div className="text-base font-bold font-mono text-white mt-1">
                        {activeJobsCount} Active · {failedJobsCount} Failed
                      </div>
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        {videoProcessingConfig.queuePaused ? 'Paused by Admin' : 'Workers Online'}
                      </div>
                    </div>
                  </div>

                  {/* Pipeline Configuration Controls */}
                  <div className="p-4 bg-[#18181f] border border-[#272730] rounded-xl space-y-4">
                    <div className="font-bold text-white text-sm">Global Compression &amp; Adaptive Streaming Policy</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-neutral-400 mb-1">Max Upload Size (MB)</label>
                        <input
                          type="number"
                          value={videoProcessingConfig.maxUploadSizeMB}
                          onChange={e => updateVideoProcessingConfig({ maxUploadSizeMB: Number(e.target.value) })}
                          className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Perceptual Quality Preset</label>
                        <select
                          value={videoProcessingConfig.targetQualityPreset}
                          onChange={e => updateVideoProcessingConfig({ targetQualityPreset: e.target.value as any })}
                          className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                        >
                          <option value="ultra_perceptual">Ultra Perceptual (VMAF 96+)</option>
                          <option value="balanced_hd">Balanced HD (VMAF 93+)</option>
                          <option value="bandwidth_saver">Bandwidth Saver (Mobile First)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Streaming Protocol</label>
                        <select
                          value={videoProcessingConfig.streamingProtocol}
                          onChange={e => updateVideoProcessingConfig({ streamingProtocol: e.target.value as any })}
                          className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                        >
                          <option value="HLS">HLS (.m3u8 Segmented ABR)</option>
                          <option value="DASH">MPEG-DASH (.mpd ABR)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-neutral-400 mb-1">Original Source Retention (Days)</label>
                        <input
                          type="number"
                          value={videoProcessingConfig.originalFileRetentionDays}
                          onChange={e => updateVideoProcessingConfig({ originalFileRetentionDays: Number(e.target.value) })}
                          className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#262630]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-neutral-400">Allowed ABR Ladder Tiers:</span>
                        {(['4K', '1440p', '1080p', '720p', '480p', '360p'] as const).map(res => {
                          const currentResolutions: string[] =
                            videoProcessingConfig?.enabledResolutions ||
                            (videoProcessingConfig as any)?.allowedResolutions ||
                            ['1080p', '720p', '480p', '360p'];
                          const enabled = currentResolutions.includes(res);
                          return (
                            <button
                              key={res}
                              onClick={() => {
                                const next = enabled
                                  ? currentResolutions.filter(r => r !== res)
                                  : [...currentResolutions, res];
                                if (next.length > 0) {
                                  updateVideoProcessingConfig({ enabledResolutions: next as any, allowedResolutions: next } as any);
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] border cursor-pointer ${
                                enabled
                                  ? 'bg-[#d4af37]/15 border-[#d4af37]/50 text-[#fce7b0]'
                                  : 'bg-[#121216] border-[#2e2e38] text-neutral-500'
                              }`}
                            >
                              {res}
                            </button>
                          );
                        })}
                      </div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(videoProcessingConfig?.retainOriginalAfterVerification ?? (videoProcessingConfig as any)?.autoCleanupOriginalFiles)}
                          onChange={e => updateVideoProcessingConfig({ retainOriginalAfterVerification: e.target.checked, autoCleanupOriginalFiles: e.target.checked } as any)}
                          className="w-4 h-4 accent-[#d4af37]"
                        />
                        <span className="text-neutral-300">Auto-purge raw camera master after VMAF verification</span>
                      </label>
                    </div>
                  </div>

                  {/* Background Video Transcoding Jobs Queue */}
                  <div className="space-y-3">
                    <div className="font-bold text-white text-sm">Background Transcoding &amp; Optimization Queue ({(videoProcessingJobs || []).length})</div>
                    <div className="space-y-2">
                      {(videoProcessingJobs || []).map(job => {
                        const jobStage = (job as any).stage || job.processingStage || job.jobStatus || 'ready';
                        const jobProgress = (job as any).progress ?? job.progressPercentage ?? 100;
                        const jobFileName = (job as any).fileName || job.originalFilename || 'video_master.mp4';
                        const jobOptimizedSize = (job as any).estimatedOptimizedSize ?? job.optimizedFileSize ?? Math.round((job.originalFileSize || 0) * 0.38);
                        const jobSavingsPct = (job as any).compressionSavingsPercent ?? 62;
                        const jobLadder: string[] = (job as any).targetResolutions || job.processingConfig?.codecs || ['1080p', '720p', '480p'];
                        const jobErr = (job as any).errorMessage || job.errorDetails;
                        return (
                          <div key={job.id} className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white">{jobFileName}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300">
                                  {job.creatorName}
                                </span>
                                <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                                  jobStage === 'ready' || jobStage === 'completed'
                                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                    : jobStage === 'failed'
                                    ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                    : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                                }`}>
                                  {String(jobStage).replace('_', ' ')} ({jobProgress}%)
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono">
                                Original: {(((job as any).originalSize || job.originalFileSize || 0) / (1024 * 1024)).toFixed(1)} MB · Optimized: {(jobOptimizedSize / (1024 * 1024)).toFixed(1)} MB (-{jobSavingsPct}%) · Ladder: {(jobLadder || []).join('/')}
                              </div>
                              {jobErr && (
                                <div className="text-[11px] text-rose-400">{jobErr}</div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {jobStage === 'failed' && (
                                <button
                                  onClick={() => {
                                    retryVideoProcessingJob(job.id);
                                    notifyFeedback('success', `Retrying failed video job ${jobFileName}.`);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 text-black font-bold rounded-lg cursor-pointer flex items-center gap-1"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Retry Job</span>
                                </button>
                              )}
                              {jobStage !== 'ready' && jobStage !== 'completed' && jobStage !== 'failed' && jobStage !== 'cancelled' && (
                                <button
                                  onClick={() => cancelVideoProcessingJob(job.id)}
                                  className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-lg cursor-pointer"
                                >
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Processed Video Assets & Original Master Cleanup */}
                  <div className="space-y-3">
                    <div className="font-bold text-white text-sm">Optimized Video Asset Vault ({(videoMediaRecords || []).length})</div>
                    <div className="space-y-2">
                      {(videoMediaRecords || []).slice(0, 12).map(rec => {
                        const recFileName = (rec as any).originalFileName || rec.originalFilename || 'master_video.mp4';
                        const recCodecs = rec.availableCodecs || ['H.264', 'HEVC'];
                        const recResolutions = rec.availableResolutions || ['1080p', '720p', '480p'];
                        const recCleaned = Boolean((rec as any).originalSourceCleanedUp || rec.retentionStatus === 'cleaned_up');
                        return (
                          <div key={rec.id} className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white">{recFileName}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                                  -{rec.compressionRatio <= 1 ? Math.round(rec.compressionRatio * 100) : rec.compressionRatio}% Saved · VMAF {rec.vmafScore}
                                </span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300">
                                  {rec.streamingProtocol} · {recCodecs.join(' / ')}
                                </span>
                              </div>
                              <div className="text-[11px] text-neutral-400 font-mono">
                                Raw: {((rec.originalFileSize || 0) / (1024 * 1024)).toFixed(1)} MB → Optimized: {((rec.optimizedFileSize || 0) / (1024 * 1024)).toFixed(1)} MB · ABR: {recResolutions.join(', ')} · Audio: {(rec as any).audioNormalizedLoudnessLufs ?? -14} LUFS
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  startVideoOptimizationJob({
                                    creatorId: rec.creatorId,
                                    creatorName: rec.creatorName,
                                    fileName: recFileName,
                                    fileSize: rec.originalFileSize,
                                    format: rec.originalFormat,
                                    width: (rec as any).width || rec.originalWidth || 1920,
                                    height: (rec as any).height || rec.originalHeight || 1080,
                                    durationSeconds: (rec as any).durationSeconds || rec.originalDuration || 60,
                                    frameRate: (rec as any).frameRate || rec.originalFrameRate || 30,
                                    sourceContext: rec.sourceContext,
                                    visibility: (rec as any).visibility || rec.accessVisibility || 'public'
                                  });
                                  notifyFeedback('success', `Queued ${recFileName} for ABR reprocessing.`);
                                }}
                                className="px-2.5 py-1.5 bg-[#23232c] hover:bg-[#2c2c38] text-neutral-200 rounded-lg cursor-pointer flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Reprocess</span>
                              </button>
                              {!recCleaned ? (
                                <button
                                  onClick={() => {
                                    const res = cleanupOriginalVideoSource(rec.id);
                                    if (res.success) notifyFeedback('success', `Purged raw source file for ${recFileName}.`);
                                  }}
                                  className="px-2.5 py-1.5 bg-amber-950/50 border border-amber-500/30 text-amber-200 rounded-lg cursor-pointer"
                                >
                                  Purge Raw Master
                                </button>
                              ) : (
                                <span className="text-[10px] font-mono text-neutral-500 px-2 py-1">
                                  Raw Master Purged
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ==================================================================
              SECTION 17: CREATOR APPLICATIONS QUEUE
          ================================================================== */}
          {activeSection === 'creator_applications' && (
            <AdminCreatorApplicationsSection />
          )}

          {/* ==================================================================
              SECTION 18: CREATOR VERIFICATION MANAGEMENT (PAID BLUE BADGE)
          ================================================================== */}
          {activeSection === 'creator_verification' && (
            <AdminCreatorVerificationSection />
          )}

          {/* ==================================================================
              SECTION 18: RECOMMENDATION ENGINE & SMART FEED MANAGEMENT
          ================================================================== */}
          {activeSection === 'recommendation_engine' && (
            <AdminRecommendationEngineSection />
          )}

          {/* ==================================================================
              SECTION 19: ANNOUNCEMENT MANAGEMENT & PLATFORM COMMUNICATION
          ================================================================== */}
          {activeSection === 'announcement_management' && (
            <AdminAnnouncementManagementSection />
          )}

          {/* ==================================================================
              SECTION 20: APPEARANCE & BRANDING → GLOBAL BRANDING STUDIO
          ================================================================== */}
          {activeSection === 'branding_studio' && (
            <AdminBrandingStudioSection />
          )}
          </AdminSectionErrorBoundary>
        </div>
      </div>

      {/* ======================================================================
          MODAL: Audited Financial Adjustment / Refund
      ====================================================================== */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#2e2e38] rounded-2xl max-w-md w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Issue Audited Financial Adjustment</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-neutral-400">
              Creates a permanent, non-editable ledger entry and updates the target wallet balance accurately.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-neutral-300 mb-1">Target Account</label>
                <select
                  value={adjTargetUserId}
                  onChange={e => setAdjTargetUserId(e.target.value)}
                  className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                >
                  {allUnifiedUsers.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.name} (@{u.username}) — Balance: ${(Number(u.walletBalance) || 0).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-300 mb-1">Adjustment Type</label>
                  <select
                    value={adjType}
                    onChange={e => setAdjType(e.target.value as typeof adjType)}
                    className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="refund">Credit Refund (+)</option>
                    <option value="adjustment">Ledger Adjustment (+/-)</option>
                    <option value="chargeback">Chargeback Debit (-)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-300 mb-1">Amount ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjAmount}
                    onChange={e => setAdjAmount(e.target.value)}
                    className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Reference Transaction / Order ID (Optional)</label>
                <input
                  type="text"
                  value={adjRefId}
                  onChange={e => setAdjRefId(e.target.value)}
                  placeholder="e.g. tx_1012 or req_104"
                  className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1">Mandatory Audit Justification</label>
                <input
                  type="text"
                  value={adjReason}
                  onChange={e => setAdjReason(e.target.value)}
                  placeholder="State exact reason for financial audit log..."
                  className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAdjustmentModal(false)}
                className="px-4 py-2 bg-[#1e1e26] text-neutral-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const res = adminCreateFinancialAdjustment({
                    targetUserId: adjTargetUserId,
                    type: adjType,
                    amount: Number(adjAmount),
                    reason: adjReason,
                    referenceId: adjRefId || undefined
                  });
                  if (res.success) {
                    setShowAdjustmentModal(false);
                    setAdjReason('');
                    notifyFeedback('success', 'Audited financial adjustment recorded.');
                  } else {
                    notifyFeedback('error', res.error || 'Unauthorized');
                  }
                }}
                className="px-4 py-2 bg-[#d4af37] text-black font-semibold rounded-xl cursor-pointer"
              >
                Authorize &amp; Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          MODAL: High-Impact Action Confirmation
      ====================================================================== */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#2e2e38] rounded-2xl max-w-md w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{confirmDialog.title}</h3>
              <button onClick={() => setConfirmDialog(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-neutral-300 leading-relaxed">{confirmDialog.description}</p>
            {confirmDialog.requireReason && (
              <div>
                <label className="block text-neutral-400 mb-1">Audit Log Justification</label>
                <input
                  type="text"
                  value={confirmReasonInput}
                  onChange={e => setConfirmReasonInput(e.target.value)}
                  className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                />
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-[#1e1e26] text-neutral-300 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm(confirmReasonInput);
                  setConfirmDialog(null);
                }}
                className={`px-4 py-2 font-semibold rounded-xl cursor-pointer ${
                  confirmDialog.danger ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-[#d4af37] text-black'
                }`}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
