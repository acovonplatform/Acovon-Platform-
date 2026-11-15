import {
  User,
  CreatorProfile,
  Post,
  Subscription,
  ContentPurchase,
  CustomVideoRequest,
  ChatMessage,
  WalletTransaction,
  CommissionSettings,
  PromotionCampaign,
  CreatorVerification,
  ModerationReport,
  AppNotification,
  Livestream,
  VirtualGift,
  LiveChatMessage,
  PayoutRequest,
  SupportTicket,
  AdminAuditLog,
  PlatformConfig,
  VideoMediaRecord,
  VideoProcessingJob,
  VideoProcessingConfig,
  VerificationSettings,
  CreatorVerificationRecord,
  VerificationTransaction,
  VerificationAuditLog,
  FanEngagementEvent,
  FanInterestProfile,
  RecommendationFeedbackRecord,
  RecommendationEngineConfig,
  PlatformAnnouncement,
  AnnouncementRecipientRecord
} from '../types';
import { DEMO_STATS } from './demoContent';
import {
  OFFICIAL_CATEGORIES,
  OFFICIAL_COUNTRIES
} from './globalTaxonomy';

export { DEMO_STATS, OFFICIAL_CATEGORIES, OFFICIAL_COUNTRIES };

export const INITIAL_COMMISSION_SETTINGS: CommissionSettings = {
  subscriptionsRate: 0.20,
  ppvRate: 0.20,
  customRequestsRate: 0.20,
  videoCallsRate: 0.20,
  paidMessagesRate: 0.20,
  tipsRate: 0.15,
  creatorPromotionsRate: 0.25,
  minWithdrawalAmount: 50.00
};

export const PLATFORM_OWNER_EMAIL = 'acovonplatform@gmail.com';

// Operational platform administrator accounts (provisioned dynamically via owner login or Admin Team Management)
export const PLATFORM_ADMIN_ACCOUNTS: Record<string, User> = {};

export const MOCK_USERS: Record<string, User> = {};

export const MOCK_CREATORS: CreatorProfile[] = [];

export const MOCK_POSTS: Post[] = [];

export const MOCK_SUBSCRIPTIONS: Subscription[] = [];

export const MOCK_PURCHASES: ContentPurchase[] = [];

export const MOCK_CUSTOM_REQUESTS: CustomVideoRequest[] = [];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {};

export const MOCK_TRANSACTIONS: WalletTransaction[] = [];

export const MOCK_PROMOTIONS: PromotionCampaign[] = [];

export const MOCK_VERIFICATIONS: CreatorVerification[] = [];

export const MOCK_REPORTS: ModerationReport[] = [];

export const MOCK_NOTIFICATIONS: AppNotification[] = [];

export const CATEGORIES = [
  'All Categories',
  ...OFFICIAL_CATEGORIES.filter(c => c.is_active)
    .sort((a, b) => a.display_order - b.display_order)
    .map(c => c.name)
];

export const MOCK_GIFTS: VirtualGift[] = [
  { id: 'gift_heart', name: 'Golden Heart', price: 1.00, icon: '💛', animationColor: '#facc15', description: 'Show quick appreciation to the creator' },
  { id: 'gift_rose', name: 'Velvet Rose', price: 2.00, icon: '🌹', animationColor: '#f43f5e', description: 'A classic symbol of elegance and support' },
  { id: 'gift_star', name: 'Celestial Star', price: 5.00, icon: '⭐', animationColor: '#fbbf24', description: 'Sparkle in the creator live chat' },
  { id: 'gift_diamond', name: 'Brilliant Diamond', price: 10.00, icon: '💎', animationColor: '#38bdf8', description: 'Highlight your support with shimmering brilliance' },
  { id: 'gift_crown', name: 'Patron Crown', price: 25.00, icon: '👑', animationColor: '#d4af37', description: 'Crown the stream with regal prestige' },
  { id: 'gift_champagne', name: 'Grand Cru Vintage', price: 50.00, icon: '🍾', animationColor: '#fce7b0', description: 'Celebrate live milestones with luxury champagne' },
  { id: 'gift_royale', name: 'Acovon Royale Vault', price: 100.00, icon: '🏆', animationColor: '#eab308', description: 'The pinnacle of creator patronage on Acovon' }
];

export const MOCK_LIVESTREAMS: Livestream[] = [];

export const MOCK_LIVE_CHAT: Record<string, LiveChatMessage[]> = {};

export const MOCK_PAYOUT_REQUESTS: PayoutRequest[] = [];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [];

export const MOCK_AUDIT_LOGS: AdminAuditLog[] = [];

export const INITIAL_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'ACOVON',
  announcementBanner: 'ACOVON LIVE Official Recording & Replay Vault is now available for verified creators.',
  announcementActive: false,
  allowNewRegistrations: true,
  allowCreatorApplications: true,
  requireGovernmentIdForCreators: true,
  requireSelfieMatchForCreators: true,
  minCreatorAge: 18,
  minSubscriptionPrice: 4.99,
  maxSubscriptionPrice: 499.99,
  minPpvPrice: 1.99,
  maxPpvPrice: 500.00,
  maxLivestreamDurationMinutes: 240,
  maxLivestreamTicketPrice: 250.00,
  autoApproveVerifiedCreatorPromotions: false,
  payoutHoldDays: 3,
  featuredCreatorIds: [],
  featuredPostIds: [],
  contentCategories: OFFICIAL_CATEGORIES.filter(c => c.is_active).map(c => c.name),
  videoCategories: [
    'Masterclass & Tutorials',
    'Behind The Scenes',
    '4K Editorial & Lookbooks',
    'Live Session Replays',
    'Custom Patron Commissions',
    'Short-Form Highlights'
  ],
  livestreamCategories: [
    'General Live',
    'Q&A & Community',
    'Studio & Behind The Scenes',
    'Live Performances',
    'Tutorials & Workshops',
    'VIP Patron Sessions'
  ],
  notificationTemplates: {
    welcomeFan: 'Welcome to ACOVON! Explore verified creators, unlock exclusive content, and join live broadcasts.',
    creatorApproved: 'Congratulations! Your ACOVON Creator identity verification has been approved. Creator Studio is now unlocked.',
    payoutCompleted: 'Your creator payout settlement has been processed and dispatched to your designated payout account.',
    policyWarning: 'Important Notice from ACOVON Trust & Safety: Please review our Community & Safety Guidelines regarding your recent activity.'
  }
};

export const INITIAL_VIDEO_PROCESSING_CONFIG: VideoProcessingConfig = {
  enableAutoOptimization: true,
  acceptedFormats: ['MP4', 'MOV', 'M4V', 'WEBM', 'MKV'],
  maxUploadSizeMb: 4096,
  targetQualityPreset: 'visually_lossless',
  minVmafThreshold: 93,
  enabledResolutions: ['4K', '1440p', '1080p', '720p', '480p', '360p'],
  enabledCodecs: ['H.264', 'H.265/HEVC', 'AV1'],
  streamingProtocol: 'HLS',
  originalFileRetentionDays: 30,
  retainOriginalAfterVerification: true,
  thumbnailFormat: 'WebP',
  thumbnailFrameCount: 4,
  maxAutoRetries: 3,
  maxConcurrentJobs: 8,
  enableCdnDelivery: true,
  enableDeduplication: true
};

export const MOCK_VIDEO_MEDIA_RECORDS: VideoMediaRecord[] = [];

export const MOCK_VIDEO_PROCESSING_JOBS: VideoProcessingJob[] = [];

export const INITIAL_VERIFICATION_SETTINGS: VerificationSettings = {
  id: 'vplan_official_blue_tick',
  planName: 'ACOVON Official Blue Verification Badge',
  description:
    'Stand out on ACOVON with your official blue verification badge. Get recognized as a verified creator and make your profile easier for fans to identify.',
  benefits: [
    'Official ACOVON blue verification badge displayed beside your name and username',
    'Verified creator recognition across public profiles, home feed, video player, comments, and livestreams',
    'Stronger profile credibility and authenticity for subscribing patrons',
    'Higher fan trust and protection against impersonation accounts',
    'Prominent verified status indicator in Creator Discovery and Search results'
  ],
  termsAndConditions:
    'Verification confirms paid ACOVON creator badge activation on an eligible onboarded creator account. Badges remain subject to ACOVON Terms of Service and anti-impersonation policies. Completed refunds or severe policy violations may result in badge suspension or revocation.',
  price: 49.99,
  currency: 'USD',
  durationType: 'lifetime',
  durationDays: null,
  renewalEnabled: true,
  renewalPrice: 29.99,
  reminderDaysBeforeExpiry: 7,
  isActive: true,
  isPublished: true,
  updatedAt: '2026-11-03 08:00:00',
  updatedByAdmin: 'Platform Owner (Super Admin)'
};

export const MOCK_CREATOR_VERIFICATION_RECORDS: CreatorVerificationRecord[] = [];

export const MOCK_VERIFICATION_TRANSACTIONS: VerificationTransaction[] = [];

export const MOCK_VERIFICATION_AUDIT_LOGS: VerificationAuditLog[] = [];

export const INITIAL_RECOMMENDATION_CONFIG: RecommendationEngineConfig = {
  id: 'rec_config_v4_2',
  rankingVersion: 'ACOVON-SmartRank v4.2.0-neural',
  isActive: true,
  isExperimentPaused: false,
  activeExperimentName: 'Real-Time Time-Decay + Multi-Category Diversity v4.2',
  rankingWeights: {
    interestRelevance: 25,
    creatorAffinity: 20,
    watchTimeCompletion: 20,
    engagementSignals: 15,
    contentFreshness: 10,
    qualityPopularity: 5,
    discoveryDiversity: 5
  },
  signalPointWeights: {
    videoWatchedLong: 5,
    videoCompleted: 6,
    videoReplayed: 8,
    videoLiked: 4,
    videoSaved: 7,
    videoShared: 7,
    commentPosted: 5,
    creatorProfileOpened: 3,
    creatorFollowed: 8,
    creatorSubscribed: 10,
    paidContentPurchased: 10,
    videoSkippedImmediately: -4,
    explicitNotInterested: -10,
    creatorUnfollowed: -6
  },
  timeDecayConfig: {
    recentSessionMultiplier: 1.65,
    last7DaysMultiplier: 1.0,
    olderHistoryDecayRate: 0.45,
    enableFastInterestShift: true
  },
  diversityRules: {
    maxConsecutiveSameCreator: 1,
    minCreatorsPer10Posts: 4,
    maxSameCategoryPer10Posts: 4,
    explorationPercentage: 15,
    newCreatorDiscoveryBoost: 14,
    trendingInfluenceWeight: 10,
    suppressRepeatedSeenHours: 12
  },
  recommendationRefreshFrequency: 'realtime_instant',
  eligibleContentTypes: {
    publicFreePosts: true,
    followerOnlyPosts: true,
    subscriberPosts: true,
    ppvLockedPreviews: true,
    livestreamReplays: true,
    photoGalleries: true
  },
  updatedAt: '2026-11-03 08:15:00',
  updatedByAdmin: 'System Configuration',
  configAuditHistory: []
};

export const INITIAL_FAN_INTEREST_PROFILES: Record<string, FanInterestProfile> = {};

export const INITIAL_ENGAGEMENT_EVENTS: FanEngagementEvent[] = [];

export const INITIAL_RECOMMENDATION_FEEDBACK: RecommendationFeedbackRecord[] = [];

export const INITIAL_PLATFORM_ANNOUNCEMENTS: PlatformAnnouncement[] = [];

export const INITIAL_ANNOUNCEMENT_RECIPIENTS: AnnouncementRecipientRecord[] = [];

const REMOVED_DEMO_IDS = new Set([
  'creator_chloe',
  'user_chloe',
  'creator_chloe_dupond',
  'creator_chloe_dupont',
  'chloe_dupond',
  'chloe_dupont',
  'creator_dante',
  'user_dante',
  'creator_dante_moretti',
  'dante_moretti'
]);

const REMOVED_DEMO_NAMES = new Set([
  'chloe dupond',
  'chloe dupont',
  'chloé dupond',
  'chloé dupont',
  'dante moretti'
]);

const REMOVED_DEMO_USERNAMES = new Set([
  'chloe_dupond',
  'chloedupond',
  'chloe.dupond',
  'chloe_dupont',
  'chloedupont',
  'chloe.dupont',
  'creator_chloe',
  'dante_moretti',
  'dantemoretti',
  'dante.moretti',
  'creator_dante'
]);

const REMOVED_DEMO_EMAIL_PREFIXES = [
  'chloe.dupond',
  'chloe_dupond',
  'chloedupond',
  'chloe.dupont',
  'chloe_dupont',
  'chloedupont',
  'dante.moretti',
  'dante_moretti',
  'dantemoretti'
];

export function isRemovedDemoAccount(record?: Record<string, any> | null): boolean {
  if (!record || typeof record !== 'object') return false;

  const candidateIds = [record.id, record.userId, record.creatorId, record.uid];
  for (const rawId of candidateIds) {
    const idLower = String(rawId || '').trim().toLowerCase();
    if (idLower && REMOVED_DEMO_IDS.has(idLower)) return true;
  }

  const candidateNames = [
    record.name,
    record.creatorName,
    record.full_legal_name,
    record.displayName,
    record.applicationData?.displayName
  ];
  for (const rawName of candidateNames) {
    const nameNorm = String(rawName || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ');
    if (nameNorm && REMOVED_DEMO_NAMES.has(nameNorm)) return true;
  }

  const candidateUsernames = [record.username, record.creatorUsername];
  for (const rawUser of candidateUsernames) {
    const userNorm = String(rawUser || '')
      .trim()
      .toLowerCase()
      .replace(/^@+/, '');
    if (userNorm && REMOVED_DEMO_USERNAMES.has(userNorm)) return true;
  }

  const emailLower = String(record.email || '').trim().toLowerCase();
  if (emailLower) {
    const localPart = emailLower.split('@')[0] || '';
    if (REMOVED_DEMO_EMAIL_PREFIXES.some(prefix => localPart === prefix || localPart.startsWith(`${prefix}_`))) {
      return true;
    }
    if (emailLower === 'chloe@acovon.com' || emailLower === 'dante@acovon.com') {
      return true;
    }
  }

  return false;
}

