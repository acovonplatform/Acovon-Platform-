import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  CreatorProfile,
  CreatorTier,
  Post,
  Subscription,
  ContentPurchase,
  CustomVideoRequest,
  VideoCallSession,
  ChatMessage,
  WalletTransaction,
  CommissionSettings,
  PromotionCampaign,
  CreatorVerification,
  ModerationReport,
  AppNotification,
  UserRole,
  Livestream,
  LivestreamAccessMode,
  LivestreamStatus,
  VirtualGift,
  LiveChatMessage,
  LivePoll,
  CreatorApplicationData,
  CreatorStatus,
  StatusAudience,
  StatusView,
  StatusReaction,
  StatusReply,
  ChatAttachmentItem,
  RecordingMode,
  ReplayPermission,
  RecordingStatus,
  RecordingSettings,
  AdminPermissionLevel,
  AccountStatus,
  ContentModerationStatus,
  PayoutRequest,
  SupportTicket,
  AdminAuditLog,
  AuditLogCategory,
  PlatformConfig,
  VideoMediaRecord,
  VideoProcessingJob,
  VideoProcessingConfig,
  VideoResolution,
  VideoCodec,
  VideoSourceContext,
  VideoProcessingStage,
  PlaybackVariant,
  PostVisibility,
  PaidVerificationStatus,
  VerificationDurationType,
  VerificationRefundStatus,
  VerificationCurrency,
  VerificationSettings,
  CreatorVerificationRecord,
  VerificationTransaction,
  VerificationAuditLog,
  FeedActivityFilterType,
  EngagementEventType,
  EngagementSurface,
  FanEngagementEvent,
  FanInterestProfile,
  RecommendationSignalBreakdown,
  RecommendedPostResult,
  RecommendedCreatorResult,
  RecommendationFeedbackRecord,
  RecommendationEngineConfig,
  RecommendationSystemHealth,
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementPriority,
  AnnouncementStatus,
  AnnouncementDisplayFormat,
  AnnouncementNotificationMode,
  AnnouncementCtaConfig,
  AnnouncementVersionHistory,
  AnnouncementRecipientRecord,
  PlatformAnnouncement,
  BrandingDesignTokens,
  PlatformBrandingTheme,
  BrandingHistoryRecord
} from '../types';
import {
  PRESET_BRANDING_THEMES,
  DEFAULT_BRANDING_THEME,
  applyThemeToDocument
} from '../data/brandingThemes';
import {
  SupportedLanguageCode,
  LanguagePreferenceMode,
  LanguageMetadata,
  TranslationKeyRecord,
  INITIAL_SUPPORTED_LANGUAGES,
  INITIAL_TRANSLATION_RECORDS,
  EXTENDED_UI_PHRASE_DICTIONARY,
  detectSupportedBrowserLanguage
} from '../data/i18nData';
import { PLATFORM_WIDE_PHRASE_TRANSLATIONS } from '../data/i18nExtendedPhrases';
import {
  logoutFromSupabase,
  syncUserPreferencesToSupabase
} from '../services/supabase';
import { supabase } from '../supabaseClient.js';
import { INITIAL_STATUSES } from '../data/mockStatuses';
import {
  MOCK_USERS,
  MOCK_CREATORS,
  MOCK_POSTS,
  MOCK_SUBSCRIPTIONS,
  MOCK_PURCHASES,
  MOCK_CUSTOM_REQUESTS,
  MOCK_MESSAGES,
  MOCK_TRANSACTIONS,
  MOCK_PROMOTIONS,
  MOCK_VERIFICATIONS,
  MOCK_REPORTS,
  MOCK_NOTIFICATIONS,
  MOCK_GIFTS,
  MOCK_LIVESTREAMS,
  MOCK_LIVE_CHAT,
  INITIAL_COMMISSION_SETTINGS,
  MOCK_PAYOUT_REQUESTS,
  MOCK_SUPPORT_TICKETS,
  MOCK_AUDIT_LOGS,
  INITIAL_PLATFORM_CONFIG,
  INITIAL_VIDEO_PROCESSING_CONFIG,
  MOCK_VIDEO_MEDIA_RECORDS,
  MOCK_VIDEO_PROCESSING_JOBS,
  INITIAL_VERIFICATION_SETTINGS,
  MOCK_CREATOR_VERIFICATION_RECORDS,
  MOCK_VERIFICATION_TRANSACTIONS,
  MOCK_VERIFICATION_AUDIT_LOGS,
  INITIAL_RECOMMENDATION_CONFIG,
  INITIAL_FAN_INTEREST_PROFILES,
  INITIAL_ENGAGEMENT_EVENTS,
  INITIAL_RECOMMENDATION_FEEDBACK,
  INITIAL_PLATFORM_ANNOUNCEMENTS,
  INITIAL_ANNOUNCEMENT_RECIPIENTS
} from '../data/mockData';

interface AdSettings {
  adsEnabled: boolean;
  adSensePublisherId: string;
  adImpressionCount: number;
  adRevenueEstimated: number;
  frequencyFeedEveryNPosts: number;
}

interface AppContextType {
  currentUser: User | CreatorProfile;
  activeRole: UserRole;
  switchUserRole: (role: UserRole, specificCreatorId?: string) => void;
  users: Record<string, User>;
  creators: CreatorProfile[];
  posts: Post[];
  subscriptions: Subscription[];
  purchases: ContentPurchase[];
  customRequests: CustomVideoRequest[];
  messages: Record<string, ChatMessage[]>;
  transactions: WalletTransaction[];
  commissionSettings: CommissionSettings;
  promotions: PromotionCampaign[];
  verifications: CreatorVerification[];
  reports: ModerationReport[];
  notifications: AppNotification[];
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  adSettings: AdSettings;
  videoCallSession: VideoCallSession | null;

  // Acovon Live
  livestreams: Livestream[];
  liveChat: Record<string, LiveChatMessage[]>;
  activeLivestreamId: string | null;
  setActiveLivestreamId: (streamId: string | null) => void;
  isCreateLiveModalOpen: boolean;
  setIsCreateLiveModalOpen: (open: boolean) => void;
  createLivestream: (streamData: {
    title: string;
    description: string;
    coverImage: string;
    category: string;
    tags: string[];
    accessMode: LivestreamAccessMode;
    allowedTierIds?: string[];
    ppvTicketPrice?: number;
    privatePasscode?: string;
    allowedUserIds?: string[];
    expectedDurationMinutes: number;
    videoStreamUrl?: string;
    scheduledFor?: string;
    settings: Livestream['settings'];
    recordingSettings?: RecordingSettings;
  }) => Livestream;
  startBroadcast: (streamId: string) => void;
  endBroadcast: (streamId: string) => void;
  sendLiveChatMessage: (streamId: string, message: string, type?: LiveChatMessage['type'], amountPaid?: number, giftData?: VirtualGift) => { success: boolean; error?: string };
  sendLiveGift: (streamId: string, giftId: string) => { success: boolean; error?: string };
  sendLiveTip: (streamId: string, amount: number, note?: string) => { success: boolean; error?: string };
  purchaseLivestreamTicket: (streamId: string) => { success: boolean; error?: string };
  unlockInviteStream: (streamId: string, passcode: string) => { success: boolean; error?: string };
  canUserAccessLivestream: (stream: Livestream, userId?: string) => {
    canAccess: boolean;
    reason?: 'not_logged_in' | 'subscription_required' | 'tier_upgrade_required' | 'ppv_purchase_required' | 'invite_required';
    requiredTierNames?: string[];
    price?: number;
  };
  canUserAccessReplay: (stream: Livestream, userId?: string) => {
    canAccess: boolean;
    reason?: 'recording_disabled' | 'recording_unpublished' | 'replay_purchase_required' | 'follower_required' | 'subscription_required' | 'tier_upgrade_required' | 'invite_required';
    requiredTierNames?: string[];
    price?: number;
  };
  purchaseLivestreamRecording: (streamId: string) => { success: boolean; error?: string };
  updateLivestreamRecording: (
    streamId: string,
    updates: {
      isReplayPublished?: boolean;
      recordingStatus?: RecordingStatus;
      mode?: RecordingMode;
      price?: number;
      availabilityDays?: number | 'unlimited';
      description?: string;
      replayPermission?: ReplayPermission;
      allowedReplayTierIds?: string[];
      includeReplayWithLiveTicket?: boolean;
    }
  ) => { success: boolean; error?: string };
  incrementReplayView: (streamId: string) => void;
  createLivestreamClip: (streamId: string, clipTitle: string) => { success: boolean; clipPost?: Post; error?: string };
  launchLivePoll: (streamId: string, question: string, options: string[], durationSeconds?: number) => { success: boolean; error?: string };
  voteLivePoll: (streamId: string, pollId: string, optionId: string) => { success: boolean; error?: string };
  endLivePoll: (streamId: string) => void;
  
  // Actions
  toggleLikePost: (postId: string) => void;
  createPost: (newPost: Omit<Post, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => void;
  unlockPPVPost: (postId: string) => { success: boolean; error?: string };
  subscribeToCreator: (creatorId: string, tierId: string) => { success: boolean; error?: string };
  cancelSubscription: (subscriptionId: string) => void;
  depositFunds: (amount: number) => void;
  withdrawFunds: (amount: number, method: string) => { success: boolean; error?: string };
  tipCreator: (creatorId: string, amount: number, note?: string) => { success: boolean; error?: string };
  
  // Custom video requests
  createCustomVideoRequest: (data: {
    creatorId: string;
    title: string;
    instructions: string;
    recipientName: string;
    videoDurationMinutes: number;
    price: number;
    deliveryDeadline?: string;
    referenceFileUrl?: string;
  }) => { success: boolean; error?: string; request?: CustomVideoRequest };
  updateCustomRequestStatus: (
    requestId: string,
    status: CustomVideoRequest['status'],
    deliveryUrl?: string,
    deliveryNotes?: string,
    options?: { negotiatedPrice?: number; confirmedDeadline?: string; declineReason?: string }
  ) => void;

  // Video calling
  initiateVideoCall: (creatorId: string, spendingLimit: number) => { success: boolean; error?: string };
  acceptIncomingCall: () => void;
  rejectCall: () => void;
  endVideoCall: () => void;
  updateCallDuration: (seconds: number) => void;

  // Messaging
  sendMessage: (
    recipientId: string,
    content: string,
    isPaid?: boolean,
    price?: number,
    mediaUrl?: string,
    extra?: {
      mediaType?: 'image' | 'video' | 'voice' | 'document';
      mediaThumbnailUrl?: string;
      mediaFileName?: string;
      mediaDescription?: string;
      attachments?: ChatAttachmentItem[];
      pricingMode?: 'individual' | 'bundle';
    }
  ) => void;
  unlockPaidMessage: (otherUserId: string, messageId: string, attachmentId?: string) => { success: boolean; error?: string };
  markThreadAsRead: (otherUserId: string) => void;

  // Admin & Mod actions
  payoutRequests: PayoutRequest[];
  supportTickets: SupportTicket[];
  auditLogs: AdminAuditLog[];
  platformConfig: PlatformConfig;
  activeAdminPermissionLevel: AdminPermissionLevel;
  hasAdminPermission: (allowedLevels: AdminPermissionLevel[]) => boolean;
  switchAdminOperator: (userKeyOrId: string) => void;
  logAdminAction: (entry: {
    category: AuditLogCategory;
    action: string;
    targetType: string;
    targetId: string;
    targetLabel: string;
    details: string;
    severity?: 'info' | 'warning' | 'critical';
  }) => void;
  adminUpdateUserAccount: (
    userId: string,
    updates: {
      role?: UserRole;
      accountStatus?: AccountStatus;
      statusReason?: string;
      isVerified?: boolean;
      adminPermissionLevel?: AdminPermissionLevel;
      adminPermissions?: string[];
    }
  ) => { success: boolean; error?: string };
  adminUpdateCreatorControl: (
    creatorId: string,
    updates: Partial<CreatorProfile>
  ) => { success: boolean; error?: string };
  adminModeratePost: (
    postId: string,
    moderationStatus: ContentModerationStatus,
    notes?: string
  ) => { success: boolean; error?: string };
  adminEmergencyEndLivestream: (
    streamId: string,
    reason: string
  ) => { success: boolean; error?: string };
  adminProcessPayout: (
    payoutId: string,
    decision: 'approved' | 'processing' | 'completed' | 'rejected',
    notes?: string
  ) => { success: boolean; error?: string };
  adminCreateFinancialAdjustment: (data: {
    targetUserId: string;
    type: 'refund' | 'adjustment' | 'chargeback';
    amount: number;
    reason: string;
    referenceId?: string;
  }) => { success: boolean; error?: string };
  adminUpdateReport: (
    reportId: string,
    updates: {
      status?: ModerationReport['status'];
      assignedModeratorId?: string;
      assignedModeratorName?: string;
      actionTaken?: string;
    }
  ) => { success: boolean; error?: string };
  adminUpdateSupportTicket: (
    ticketId: string,
    updates: {
      status?: SupportTicket['status'];
      priority?: SupportTicket['priority'];
      assignedAdminId?: string;
      assignedAdminName?: string;
      replyMessage?: string;
    }
  ) => { success: boolean; error?: string };
  adminManagePromotion: (
    promoId: string,
    status: PromotionCampaign['status'],
    notes?: string
  ) => { success: boolean; error?: string };
  adminManageSubscription: (
    subscriptionId: string,
    action: 'cancel' | 'reactivate' | 'refund_last_cycle',
    reason?: string
  ) => { success: boolean; error?: string };
  updatePlatformConfig: (updates: Partial<PlatformConfig>) => { success: boolean; error?: string };
  updateCommissionSettings: (newSettings: Partial<CommissionSettings>) => void;
  updateAdSettings: (newSettings: Partial<AdSettings>) => void;
  reviewVerification: (verificationId: string, status: 'approved' | 'rejected' | 'info_requested', notes?: string) => void;
  resolveReport: (reportId: string, actionTaken: string) => void;
  createPromotionCampaign: (data: Omit<PromotionCampaign, 'id' | 'impressions' | 'clicks' | 'profileVisits' | 'status' | 'startDate' | 'endDate'>) => { success: boolean; error?: string };
  updateCreatorProfile: (creatorId: string, updates: Partial<CreatorProfile>) => { success: boolean; error?: string };
  addCreatorSubscriptionPlan: (creatorId: string, plan: Omit<CreatorTier, 'id' | 'createdAt' | 'updatedAt' | 'subscriberCount'>) => { success: boolean; error?: string; plan?: CreatorTier };
  updateCreatorSubscriptionPlan: (creatorId: string, planId: string, updates: Partial<CreatorTier>) => { success: boolean; error?: string };
  deleteCreatorSubscriptionPlan: (creatorId: string, planId: string) => { success: boolean; error?: string };
  toggleCreatorSubscriptionPlanActive: (creatorId: string, planId: string) => { success: boolean; error?: string; isActive?: boolean };
  updateCreatorPricing: (creatorId: string, pricing: {
    callRatePerMinute?: number;
    privateVideoRate?: number;
    customRequestBasePrice?: number;
    customRequestDeliveryDays?: number;
    customRequestTerms?: string;
    paidMessagePrice?: number;
    livestreamTicketPrice?: number;
    isLiveForCalls?: boolean;
    instantCallsEnabled?: boolean;
    minCallMinutes?: number;
    maxCallMinutes?: number;
    acceptingCustomRequests?: boolean;
  }) => { success: boolean; error?: string };
  
  // Utility
  isPostPurchased: (postId: string) => boolean;
  isSubscribedTo: (creatorId: string) => boolean;
  getSubscriptionTier: (creatorId: string) => Subscription | undefined;
  
  // Follow System
  following: string[];
  isFollowing: (creatorId: string) => boolean;
  toggleFollowCreator: (creatorId: string) => { success: boolean; isFollowing: boolean };

  // Bookmarks & Saved Media
  savedPostIds: string[];
  isPostSaved: (postId: string) => boolean;
  toggleSavePost: (postId: string) => boolean;

  // Single-Video Playback Authority
  activePlayingVideoId: string | null;
  setActivePlayingVideoId: (id: string | null) => void;

  // Media Forwarding & Sharing
  forwardPostInMessage: (postId: string, recipientId: string, customNote?: string) => { success: boolean; error?: string };

  // Creator Application & Verification Flow
  applyToBecomeCreator: (data: CreatorApplicationData) => { success: boolean; error?: string };
  userPendingVerification: CreatorVerification | undefined;

  // Stories & Status System
  statuses: CreatorStatus[];
  viewedStatusIds: string[];
  publishStatus: (statusData: Omit<CreatorStatus, 'id' | 'createdAt' | 'expiresAt' | 'viewsCount' | 'uniqueViews' | 'reactions' | 'replies'>) => { success: boolean; error?: string; status?: CreatorStatus };
  deleteStatus: (statusId: string) => { success: boolean; error?: string };
  markStatusViewed: (statusId: string) => void;
  reactToStatus: (statusId: string, emoji: string) => { success: boolean; error?: string };
  replyToStatus: (statusId: string, replyText: string) => { success: boolean; error?: string };
  reportStatus: (statusId: string, reason: string) => { success: boolean };
  removeReportedStatus: (statusId: string) => void;
  getActiveCreatorStatuses: (creatorId: string) => CreatorStatus[];
  hasUnseenStatus: (creatorId: string) => boolean;
  canUserViewStatus: (status: CreatorStatus, userId?: string) => { canView: boolean; reason?: 'follower_only' | 'subscriber_only' | 'tier_only' };

  // Demo Library Controls
  showDemoBadges: boolean;
  setShowDemoBadges: (show: boolean) => void;
  resetDemoContent: () => void;

  // Automatic Video Compression, Optimization & Adaptive Streaming Engine
  videoMediaRecords: VideoMediaRecord[];
  videoProcessingJobs: VideoProcessingJob[];
  videoProcessingConfig: VideoProcessingConfig;
  videoPlaybackPositions: Record<string, number>;
  saveVideoPlaybackPosition: (videoKey: string, seconds: number) => void;
  getVideoPlaybackPosition: (videoKey: string) => number;
  computeAdaptiveLadder: (sourceWidth: number, sourceHeight: number) => VideoResolution[];
  startVideoOptimizationJob: (params: {
    creatorId: string;
    creatorName: string;
    fileName: string;
    fileSize: number;
    format?: string;
    mimeType?: string;
    sourceUrl?: string;
    width: number;
    height: number;
    durationSeconds: number;
    frameRate?: number;
    sourceContext: VideoSourceContext;
    visibility?: PostVisibility;
    thumbnailUrl?: string;
    previewFrames?: string[];
    simulateFailure?: boolean;
  }) => {
    job: VideoProcessingJob;
    mediaRecord: VideoMediaRecord;
    isReusedDuplicate: boolean;
    jobId: string;
    videoMediaId: string;
    deduplicated: boolean;
  };
  retryVideoProcessingJob: (jobId: string) => { success: boolean; error?: string };
  cancelVideoProcessingJob: (jobId: string) => { success: boolean; error?: string };
  cleanupOriginalVideoSource: (mediaId: string) => { success: boolean; error?: string };
  updateVideoProcessingConfig: (updates: Partial<VideoProcessingConfig>) => { success: boolean; error?: string };
  getAuthorizedPlaybackUrl: (
    postOrMediaId: string,
    requestedResolution: VideoResolution | 'Auto' | 'auto',
    rawUrl?: string
  ) => {
    authorized: boolean;
    signedUrl: string;
    activeResolution: VideoResolution;
    activeCodec: VideoCodec;
    reason?: string;
  };

  // Automatic Paid Creator Verification System (Blue Badge, Payment & Admin Control)
  verificationSettings: VerificationSettings;
  creatorVerificationRecords: CreatorVerificationRecord[];
  verificationTransactions: VerificationTransaction[];
  verificationAuditLogs: VerificationAuditLog[];
  isCreatorVerifiedBadgeActive: (creatorIdOrUsername?: string) => boolean;
  getCreatorVerificationRecord: (creatorId: string) => CreatorVerificationRecord;
  purchaseCreatorVerification: (options: {
    creatorId?: string;
    paymentProvider: 'acovon_wallet' | 'stripe_checkout' | 'apple_pay';
    simulateOutcome?: 'completed' | 'pending' | 'failed';
    idempotencyKey?: string;
    isRenewal?: boolean;
  }) => {
    success: boolean;
    status?: PaidVerificationStatus;
    transaction?: VerificationTransaction;
    error?: string;
    isDuplicatePrevented?: boolean;
  };
  confirmPendingVerificationPayment: (transactionId: string) => { success: boolean; error?: string };
  adminUpdateVerificationSettings: (updates: Partial<VerificationSettings>) => { success: boolean; error?: string };
  adminSuspendCreatorVerification: (creatorId: string, reason: string) => { success: boolean; error?: string };
  adminRestoreCreatorVerification: (creatorId: string, reason?: string) => { success: boolean; error?: string };
  adminRevokeCreatorVerification: (creatorId: string, reason: string) => { success: boolean; error?: string };
  adminManageVerificationRefund: (
    transactionId: string,
    refundStatus: VerificationRefundStatus,
    reason: string,
    keepBadgeAuthorizedReason?: string
  ) => { success: boolean; error?: string };
  adminTriggerVerificationExpiry: (creatorId: string) => { success: boolean; error?: string };
  resetCreatorVerificationForTest: (creatorId: string, targetStatus?: PaidVerificationStatus) => void;

  // Personalized Content Recommendation, Discovery & Smart Feed Engine
  recommendationConfig: RecommendationEngineConfig;
  fanInterestProfiles: Record<string, FanInterestProfile>;
  activeRecommendationFanId: string;
  activeFanInterestProfile: FanInterestProfile;
  engagementEvents: FanEngagementEvent[];
  recommendationFeedbackRecords: RecommendationFeedbackRecord[];
  recommendationSystemHealth: RecommendationSystemHealth;
  switchRecommendationFanPersona: (fanId: string) => void;
  trackEngagementEvent: (params: {
    eventType: EngagementEventType | string;
    contentType?: 'video' | 'photo' | 'gallery' | 'livestream' | 'status' | 'creator' | 'search';
    contentId?: string;
    postId?: string;
    creatorId?: string;
    creatorName?: string;
    category?: string;
    hashtags?: string[];
    tags?: string[];
    searchQuery?: string;
    watchDurationSeconds?: number;
    videoDurationSeconds?: number;
    completionPercentage?: number;
    completionPercent?: number;
    timeBeforeSkipSeconds?: number;
    sourceSurface?: EngagementSurface | string;
    surface?: EngagementSurface | string;
  }) => void;
  getRecommendedPosts: (
    mode: 'for_you' | 'free_posts',
    options?: { limit?: number; categoryFilter?: string; fanIdOverride?: string }
  ) => RecommendedPostResult[];
  getUpNextVideoRecommendations: (currentPostId: string, limit?: number) => RecommendedPostResult[];
  getRecommendedCreators: (limit?: number, categoryFilter?: string) => RecommendedCreatorResult[];
  isPostFreeAccessibleForFan: (post: Post, fanId?: string) => boolean;
  submitPostRecommendationFeedback: (
    postId: string,
    feedbackType: 'not_interested' | 'show_less' | 'show_more' | 'hide_creator' | 'report_content',
    details?: string
  ) => { success: boolean; message: string };
  updateFanCategoryPreference: (category: string, action: 'boost' | 'reduce' | 'remove') => void;
  setFanOnboardingCategories: (categories: string[]) => void;
  unhideCreatorForFan: (creatorId: string) => void;
  resetFanRecommendations: (fanId?: string) => void;
  adminUpdateRecommendationConfig: (
    updates: Partial<RecommendationEngineConfig>,
    auditSummary: string
  ) => { success: boolean; error?: string };
  adminToggleRecommendationExperimentPause: (reason: string) => { success: boolean; error?: string };
  adminResetRecommendationWeightsToDefault: () => { success: boolean; error?: string };

  // Admin-Controlled Announcement & Platform Communication System
  announcements: PlatformAnnouncement[];
  announcementRecipients: AnnouncementRecipientRecord[];
  getVisibleAnnouncementsForCurrentUser: (options?: {
    displayFormat?: AnnouncementDisplayFormat;
    includeExpired?: boolean;
  }) => PlatformAnnouncement[];
  getAnnouncementByIdForCurrentUser: (announcementId: string) => {
    accessible: boolean;
    announcement?: PlatformAnnouncement;
    error?: string;
  };
  getUserAnnouncementStatus: (announcementId: string, userId?: string) => {
    isRead: boolean;
    isAcknowledged: boolean;
    isBannerDismissed: boolean;
    isPopupDismissed: boolean;
    recipientRecord?: AnnouncementRecipientRecord;
  };
  getUnreadAnnouncementCountForCurrentUser: () => number;
  markAnnouncementAsRead: (announcementId: string) => { success: boolean; error?: string };
  acknowledgeAnnouncement: (announcementId: string) => { success: boolean; error?: string };
  dismissAnnouncementBanner: (announcementId: string) => void;
  dismissAnnouncementPopup: (announcementId: string) => void;
  canAdminPerformAnnouncementAction: (
    actionType: 'view' | 'create_draft' | 'edit' | 'publish' | 'schedule' | 'pause_resume' | 'archive' | 'delete',
    category?: AnnouncementCategory,
    targetStatus?: AnnouncementStatus
  ) => { allowed: boolean; reason?: string };
  adminCreateAnnouncement: (input: {
    title: string;
    summary: string;
    bodyHtml: string;
    category: AnnouncementCategory;
    priority: AnnouncementPriority;
    audience: AnnouncementAudience;
    status: 'draft' | 'scheduled' | 'published';
    displayFormats: AnnouncementDisplayFormat[];
    requiresAcknowledgment: boolean;
    isMandatoryNotice: boolean;
    imageUrl?: string;
    imageFileName?: string;
    imageFileSizeKb?: number;
    cta: AnnouncementCtaConfig;
    notificationMode: AnnouncementNotificationMode;
    timezone: string;
    publishAt?: string;
    expiresAt?: string;
  }) => { success: boolean; announcement?: PlatformAnnouncement; error?: string };
  adminUpdateAnnouncement: (
    announcementId: string,
    updates: Partial<Omit<PlatformAnnouncement, 'id' | 'createdAt' | 'createdByAdminId' | 'createdByAdminName' | 'createdByAdminRole' | 'versionHistory' | 'versionCount'>>,
    changeSummary?: string
  ) => { success: boolean; announcement?: PlatformAnnouncement; error?: string };
  adminPublishAnnouncement: (announcementId: string) => { success: boolean; error?: string };
  adminPauseResumeAnnouncement: (
    announcementId: string,
    nextStatus: 'paused' | 'published',
    reason?: string
  ) => { success: boolean; error?: string };
  adminArchiveAnnouncement: (announcementId: string, reason?: string) => { success: boolean; error?: string };
  adminDeleteAnnouncement: (announcementId: string, reason?: string) => {
    success: boolean;
    softArchived?: boolean;
    message?: string;
    error?: string;
  };
  adminRetryFailedAnnouncementNotifications: (announcementId: string) => {
    success: boolean;
    retriedCount: number;
    error?: string;
  };
  adminSimulateScheduledAndExpirySweep: () => {
    publishedCount: number;
    expiredCount: number;
  };

  // Theme & Appearance Switcher (Supports Light Mode, Dark Mode, and System Default while preserving all 13 Global Branding Themes)
  appearanceMode: 'dark' | 'light' | 'system';
  resolvedColorMode: 'dark' | 'light';
  setAppearanceMode: (mode: 'dark' | 'light' | 'system') => void;
  theme: 'classic-gold' | 'light';
  setTheme: (theme: 'classic-gold' | 'light') => void;
  toggleTheme: () => void;

  // Admin-Only Global Branding Studio
  activeBrandingTheme: PlatformBrandingTheme;
  presetBrandingThemes: PlatformBrandingTheme[];
  customBrandingThemes: PlatformBrandingTheme[];
  draftBrandingTheme: PlatformBrandingTheme | null;
  brandingHistory: BrandingHistoryRecord[];
  hasBrandingPermission: () => boolean;
  publishBrandingTheme: (themeToPublish: PlatformBrandingTheme, notes?: string) => { success: boolean; error?: string };
  saveBrandingDraft: (draftTheme: PlatformBrandingTheme) => { success: boolean; error?: string };
  rollbackBrandingTheme: (historyRecordId?: string) => { success: boolean; error?: string };
  resetToSignatureBrandingTheme: () => { success: boolean; error?: string };
  saveCustomBrandingTheme: (customTheme: PlatformBrandingTheme) => { success: boolean; error?: string };
  deleteCustomBrandingTheme: (customThemeId: string) => { success: boolean; error?: string };
  toggleAdminBrandingPermission: (targetAdminId: string) => { success: boolean; granted?: boolean; error?: string };

  // Guest vs Authenticated State (Landing page shown only to guests; once logged in/signed up, Home is Feed)
  isAuthenticated: boolean;
  isCurrentUserApprovedCreator: boolean;
  loginUser: (role?: UserRole, specificId?: string) => void;
  logoutUser: () => void;
  registerAccount: (input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    is18PlusConfirmed: boolean;
  }) => { success: boolean; user?: User; error?: string };
  authenticateAccount: (
    emailOrUsername: string,
    password: string
  ) => {
    success: boolean;
    detectedRole?: UserRole;
    user?: User | CreatorProfile;
    error?: string;
  };

  // Multilingual Platform & Automatic Language Detection (19 Languages + RTL/LTR + Admin i18n Management)
  supportedLanguages: LanguageMetadata[];
  activeLanguageCode: SupportedLanguageCode;
  activeLanguageMeta: LanguageMetadata;
  languagePreferenceMode: LanguagePreferenceMode;
  manualSelectedLanguageCode: SupportedLanguageCode;
  detectedDeviceLanguage: {
    detectedRawLocale: string;
    matchedLanguageCode: SupportedLanguageCode;
    isSupportedDirectMatch: boolean;
  };
  simulatedBrowserLocale: string;
  setSimulatedBrowserLocale: (locale: string) => void;
  setUserLanguagePreference: (
    mode: LanguagePreferenceMode,
    manualCode?: SupportedLanguageCode
  ) => void;
  t: (keyOrPhrase: string, fallbackText?: string) => string;
  translatePhrase: (englishPhrase: string) => string;
  translationRecords: TranslationKeyRecord[];
  adminToggleLanguageEnabled: (code: SupportedLanguageCode) => { success: boolean; error?: string };
  adminUpdateTranslationEntry: (
    key: string,
    langCode: SupportedLanguageCode,
    newValue: string
  ) => { success: boolean; error?: string };
  adminAddTranslationKey: (input: {
    key: string;
    category: TranslationKeyRecord['category'];
    englishText: string;
    initialTranslations?: Partial<Record<SupportedLanguageCode, string>>;
  }) => { success: boolean; error?: string };
  adminPublishTranslations: (notes?: string) => { success: boolean; error?: string };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication State verified against real Supabase session
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const hasSession = Boolean(data.session);
      setIsAuthenticated(hasSession);
      try {
        localStorage.setItem('acovon_is_authenticated', hasSession ? 'true' : 'false');
      } catch {
        // ignore
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const hasSession = Boolean(session);
      setIsAuthenticated(hasSession);
      try {
        localStorage.setItem('acovon_is_authenticated', hasSession ? 'true' : 'false');
      } catch {
        // ignore
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);
  // User Appearance Preference ('dark' | 'light' | 'system') persisted across sessions
  const [appearanceMode, setAppearanceModeState] = useState<'dark' | 'light' | 'system'>(() => {
    try {
      const savedMode = localStorage.getItem('acovon_appearance_mode');
      if (savedMode === 'dark' || savedMode === 'light' || savedMode === 'system') {
        return savedMode;
      }
      const savedThemeStr = localStorage.getItem('acovon_active_branding_theme');
      if (savedThemeStr) {
        const parsedTheme = JSON.parse(savedThemeStr);
        if (parsedTheme?.mode === 'light') return 'light';
      }
    } catch {
      // fallback
    }
    return 'dark';
  });

  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemPrefersDark(e.matches);
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const resolvedColorMode: 'dark' | 'light' =
    appearanceMode === 'system' ? (systemPrefersDark ? 'dark' : 'light') : appearanceMode;

  const setAppearanceMode = (nextMode: 'dark' | 'light' | 'system') => {
    setAppearanceModeState(nextMode);
    try {
      localStorage.setItem('acovon_appearance_mode', nextMode);
    } catch {
      // ignore
    }
  };

  // Global Branding Theme State (Admin-controlled, persisted in localStorage, defaults to THEME 01 — ACOVON Signature)
  const [activeBrandingTheme, setActiveBrandingTheme] = useState<PlatformBrandingTheme>(() => {
    try {
      const saved = localStorage.getItem('acovon_active_branding_theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.tokens) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_BRANDING_THEME;
  });

  const [customBrandingThemes, setCustomBrandingThemes] = useState<PlatformBrandingTheme[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_custom_branding_themes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  const [draftBrandingTheme, setDraftBrandingTheme] = useState<PlatformBrandingTheme | null>(() => {
    try {
      const saved = localStorage.getItem('acovon_draft_branding_theme');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.tokens) return parsed;
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [brandingHistory, setBrandingHistory] = useState<BrandingHistoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_branding_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return [
      {
        id: 'bh_init_1',
        previousThemeId: 'obsidian-luxe',
        previousThemeName: 'Obsidian Luxe',
        newThemeId: 'acovon-signature',
        newThemeName: 'ACOVON Signature',
        actionType: 'publish',
        adminId: 'user_admin_1',
        adminName: 'Julian Sterling',
        adminRole: 'super_admin',
        notes: 'Established ACOVON Signature (Theme 01) as the global platform baseline.',
        timestamp: '2026-11-01 09:00',
        snapshotTheme: DEFAULT_BRANDING_THEME
      }
    ];
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_active_branding_theme', JSON.stringify(activeBrandingTheme));
    } catch {
      // ignore
    }
    applyThemeToDocument(activeBrandingTheme, resolvedColorMode);
  }, [activeBrandingTheme, resolvedColorMode]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_custom_branding_themes', JSON.stringify(customBrandingThemes));
    } catch {
      // ignore
    }
  }, [customBrandingThemes]);

  useEffect(() => {
    try {
      if (draftBrandingTheme) {
        localStorage.setItem('acovon_draft_branding_theme', JSON.stringify(draftBrandingTheme));
      } else {
        localStorage.removeItem('acovon_draft_branding_theme');
      }
    } catch {
      // ignore
    }
  }, [draftBrandingTheme]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_branding_history', JSON.stringify(brandingHistory));
    } catch {
      // ignore
    }
  }, [brandingHistory]);

  // Listen for cross-tab global theme or appearance mode updates so all open sessions update immediately
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'acovon_active_branding_theme' && e.newValue) {
        try {
          const updatedTheme = JSON.parse(e.newValue);
          if (updatedTheme && updatedTheme.id && updatedTheme.tokens) {
            setActiveBrandingTheme(updatedTheme);
          }
        } catch {
          // ignore
        }
      } else if (e.key === 'acovon_appearance_mode' && e.newValue) {
        if (e.newValue === 'dark' || e.newValue === 'light' || e.newValue === 'system') {
          setAppearanceModeState(e.newValue);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const theme: 'classic-gold' | 'light' = resolvedColorMode === 'light' ? 'light' : 'classic-gold';

  const setTheme = (nextTheme: 'classic-gold' | 'light') => {
    setAppearanceMode(nextTheme === 'light' ? 'light' : 'dark');
  };

  const toggleTheme = () => {
    setAppearanceMode(resolvedColorMode === 'light' ? 'dark' : 'light');
  };

  // Current user state (defaults to fan Jordan Cross for first-time inspection)
  const [currentUser, setCurrentUser] = useState<User | CreatorProfile>(() => {
    try {
      const saved = localStorage.getItem('acovon_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.id) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_USERS.fan_jordan;
  });

  const [activeRole, setActiveRole] = useState<UserRole>(currentUser.role);
  const [users, setUsers] = useState<Record<string, User>>(() => {
    try {
      const saved = localStorage.getItem('acovon_users_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return { ...MOCK_USERS, ...parsed };
        }
      }
    } catch {
      // fallback
    }
    return MOCK_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_users_v2', JSON.stringify(users));
    } catch {
      // ignore
    }
  }, [users]);

  // ============================================================================
  // MULTILINGUAL PLATFORM & AUTOMATIC LANGUAGE DETECTION STATE
  // ============================================================================
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageMetadata[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_supported_languages_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 19) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_SUPPORTED_LANGUAGES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_supported_languages_v1', JSON.stringify(supportedLanguages));
    } catch {
      // ignore
    }
  }, [supportedLanguages]);

  const [translationRecords, setTranslationRecords] = useState<TranslationKeyRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_translation_records_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_TRANSLATION_RECORDS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_translation_records_v1', JSON.stringify(translationRecords));
    } catch {
      // ignore
    }
  }, [translationRecords]);

  // Optional simulated device/browser locale (allows testing automatic phone language detection)
  const [simulatedBrowserLocale, setSimulatedBrowserLocaleState] = useState<string>(() => {
    try {
      return localStorage.getItem('acovon_simulated_browser_locale') || '';
    } catch {
      return '';
    }
  });

  const setSimulatedBrowserLocale = (locale: string) => {
    setSimulatedBrowserLocaleState(locale);
    try {
      if (locale) {
        localStorage.setItem('acovon_simulated_browser_locale', locale);
      } else {
        localStorage.removeItem('acovon_simulated_browser_locale');
      }
    } catch {
      // ignore
    }
  };

  // Account-linked & Guest Language Preference Map (persists per user ID across sessions, logouts, logins & devices)
  const [userLanguageMap, setUserLanguageMap] = useState<
    Record<string, { mode: LanguagePreferenceMode; code: SupportedLanguageCode }>
  >(() => {
    try {
      const saved = localStorage.getItem('acovon_user_language_map_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {
      // fallback
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_user_language_map_v1', JSON.stringify(userLanguageMap));
    } catch {
      // ignore
    }
  }, [userLanguageMap]);

  const detectedDeviceLanguage = detectSupportedBrowserLanguage(
    simulatedBrowserLocale || undefined,
    supportedLanguages
  );

  // Resolve current user's or guest's saved language preference
  const activeAccountLangSlot = isAuthenticated ? currentUser.id : '__guest__';
  const savedUserLangPref = userLanguageMap[activeAccountLangSlot] ||
    (currentUser.languagePreferenceMode && currentUser.preferredLanguageCode
      ? {
          mode: currentUser.languagePreferenceMode,
          code: currentUser.preferredLanguageCode as SupportedLanguageCode
        }
      : userLanguageMap['__guest__']) || {
      mode: 'automatic' as LanguagePreferenceMode,
      code: detectedDeviceLanguage.matchedLanguageCode
    };

  const languagePreferenceMode: LanguagePreferenceMode = savedUserLangPref.mode;
  const manualSelectedLanguageCode: SupportedLanguageCode = savedUserLangPref.code || 'en';

  // Compute effective active language code with English fallback if disabled/unsupported
  const rawResolvedLangCode: SupportedLanguageCode =
    languagePreferenceMode === 'english'
      ? 'en'
      : languagePreferenceMode === 'manual'
      ? manualSelectedLanguageCode
      : detectedDeviceLanguage.matchedLanguageCode;

  const matchedEnabledMeta = supportedLanguages.find(
    l => l.code === rawResolvedLangCode && l.enabled
  );
  const englishFallbackMeta =
    supportedLanguages.find(l => l.code === 'en') || INITIAL_SUPPORTED_LANGUAGES[0];

  const activeLanguageMeta: LanguageMetadata = matchedEnabledMeta || englishFallbackMeta;
  const activeLanguageCode: SupportedLanguageCode = activeLanguageMeta.code;

  // Apply dynamic LTR / RTL direction & lang attribute to document root
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.lang = activeLanguageMeta.code;
    root.dir = activeLanguageMeta.dir;
    root.setAttribute('data-lang', activeLanguageMeta.code);
    root.setAttribute('data-dir', activeLanguageMeta.dir);
  }, [activeLanguageMeta]);

  const setUserLanguagePreference = (
    mode: LanguagePreferenceMode,
    manualCode?: SupportedLanguageCode
  ) => {
    const nextCode: SupportedLanguageCode =
      mode === 'english'
        ? 'en'
        : manualCode || manualSelectedLanguageCode || detectedDeviceLanguage.matchedLanguageCode;

    // Persist for both the current account ID and the guest slot so login/logout seamlessly preserves preference
    setUserLanguageMap(prev => ({
      ...prev,
      [activeAccountLangSlot]: { mode, code: nextCode },
      __guest__: { mode, code: nextCode }
    }));

    // Also store directly on the authenticated user's account record in the database
    if (isAuthenticated && currentUser?.id) {
      const updatedUser = {
        ...currentUser,
        languagePreferenceMode: mode,
        preferredLanguageCode: nextCode
      };
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('acovon_current_user', JSON.stringify(updatedUser));
      } catch {
        // ignore
      }
      setUsers(prev => {
        if (!prev[currentUser.id]) return prev;
        return {
          ...prev,
          [currentUser.id]: {
            ...prev[currentUser.id],
            languagePreferenceMode: mode,
            preferredLanguageCode: nextCode
          }
        };
      });
    }
  };

  // Build fast lookup maps for t() and translatePhrase()
  const keyLookupMap = React.useMemo(() => {
    const byKey = new Map<string, TranslationKeyRecord>();
    const byEnglishPhrase = new Map<string, Record<SupportedLanguageCode, string>>();
    translationRecords.forEach(rec => {
      byKey.set(rec.key, rec);
      byEnglishPhrase.set(rec.englishText.trim(), rec.translations);
    });
    return { byKey, byEnglishPhrase };
  }, [translationRecords]);

  const translatePhrase = React.useCallback(
    (englishPhrase: string): string => {
      if (!englishPhrase || activeLanguageCode === 'en') return englishPhrase;
      const trimmed = englishPhrase.trim();
      if (!trimmed) return englishPhrase;

      // 1. Check Admin-managed translation records by exact English text
      const fromRecords = keyLookupMap.byEnglishPhrase.get(trimmed);
      if (fromRecords && fromRecords[activeLanguageCode]) {
        return englishPhrase.replace(trimmed, fromRecords[activeLanguageCode]);
      }

      // 2. Check Extended UI Phrase Dictionary
      const fromExtended = EXTENDED_UI_PHRASE_DICTIONARY[trimmed]?.[activeLanguageCode];
      if (fromExtended) {
        return englishPhrase.replace(trimmed, fromExtended);
      }

      // 3. Check Platform-Wide Phrase Translations
      const fromPlatform = PLATFORM_WIDE_PHRASE_TRANSLATIONS[trimmed]?.[activeLanguageCode];
      if (fromPlatform) {
        return englishPhrase.replace(trimmed, fromPlatform);
      }

      return englishPhrase;
    },
    [activeLanguageCode, keyLookupMap]
  );

  const t = React.useCallback(
    (keyOrPhrase: string, fallbackText?: string): string => {
      const record = keyLookupMap.byKey.get(keyOrPhrase);
      if (record) {
        const translated = record.translations[activeLanguageCode];
        if (translated && translated.trim().length > 0) {
          return translated;
        }
        // Fallback to English if missing in selected language
        return record.englishText || fallbackText || keyOrPhrase;
      }

      // Try phrase translation if passed a literal string
      const sourceText = fallbackText || keyOrPhrase;
      return translatePhrase(sourceText);
    },
    [activeLanguageCode, keyLookupMap, translatePhrase]
  );

  const [creators, setCreators] = useState<CreatorProfile[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_creators');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return MOCK_CREATORS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_creators', JSON.stringify(creators));
    } catch {
      // ignore
    }
  }, [creators]);
  const [showDemoBadges, setShowDemoBadges] = useState<boolean>(true);
  const [posts, setPosts] = useState<Post[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_posts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 25) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return MOCK_POSTS;
  });

  const resetDemoContent = () => {
    try {
      localStorage.removeItem('acovon_posts');
      localStorage.removeItem('acovon_statuses');
      localStorage.removeItem('acovon_viewed_status_ids');
    } catch {
      // ignore
    }
    setPosts(MOCK_POSTS);
    setCreators(MOCK_CREATORS);
    setLivestreams(MOCK_LIVESTREAMS);
    setStatuses(INITIAL_STATUSES);
    setViewedStatusIds([]);
  };

  useEffect(() => {
    try {
      localStorage.setItem('acovon_posts', JSON.stringify(posts));
    } catch {
      // ignore
    }
  }, [posts]);

  const [statuses, setStatuses] = useState<CreatorStatus[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_STATUSES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_statuses', JSON.stringify(statuses));
    } catch {
      // ignore
    }
  }, [statuses]);

  const [viewedStatusIds, setViewedStatusIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_viewed_status_ids');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_viewed_status_ids', JSON.stringify(viewedStatusIds));
    } catch {
      // ignore
    }
  }, [viewedStatusIds]);

  const [subscriptions, setSubscriptions] = useState<Subscription[]>(MOCK_SUBSCRIPTIONS);
  const [purchases, setPurchases] = useState<ContentPurchase[]>(MOCK_PURCHASES);
  const [customRequests, setCustomRequests] = useState<CustomVideoRequest[]>(MOCK_CUSTOM_REQUESTS);
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(MOCK_MESSAGES);
  const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
  const [commissionSettings, setCommissionSettings] = useState<CommissionSettings>(INITIAL_COMMISSION_SETTINGS);
  const [promotions, setPromotions] = useState<PromotionCampaign[]>(MOCK_PROMOTIONS);
  const [verifications, setVerifications] = useState<CreatorVerification[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_verifications_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return MOCK_VERIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_verifications_v2', JSON.stringify(verifications));
    } catch {
      // ignore
    }
  }, [verifications]);
  const [reports, setReports] = useState<ModerationReport[]>(MOCK_REPORTS);
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [payoutRequests, setPayoutRequests] = useState<PayoutRequest[]>(MOCK_PAYOUT_REQUESTS);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(MOCK_SUPPORT_TICKETS);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_AUDIT_LOGS;
  });
  const [platformConfig, setPlatformConfig] = useState<PlatformConfig>(() => {
    try {
      const saved = localStorage.getItem('acovon_platform_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_PLATFORM_CONFIG,
            ...parsed,
            featuredCreatorIds: Array.isArray(parsed.featuredCreatorIds) ? parsed.featuredCreatorIds : INITIAL_PLATFORM_CONFIG.featuredCreatorIds,
            featuredPostIds: Array.isArray(parsed.featuredPostIds) ? parsed.featuredPostIds : INITIAL_PLATFORM_CONFIG.featuredPostIds,
            contentCategories: Array.isArray(parsed.contentCategories) ? parsed.contentCategories : INITIAL_PLATFORM_CONFIG.contentCategories,
            videoCategories: Array.isArray(parsed.videoCategories) ? parsed.videoCategories : INITIAL_PLATFORM_CONFIG.videoCategories,
            livestreamCategories: Array.isArray(parsed.livestreamCategories) ? parsed.livestreamCategories : INITIAL_PLATFORM_CONFIG.livestreamCategories,
            notificationTemplates: {
              ...INITIAL_PLATFORM_CONFIG.notificationTemplates,
              ...(parsed.notificationTemplates || {})
            }
          };
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_PLATFORM_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_audit_logs', JSON.stringify(auditLogs));
    } catch {
      // ignore
    }
  }, [auditLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_platform_config', JSON.stringify(platformConfig));
    } catch {
      // ignore
    }
  }, [platformConfig]);

  const [adSettings, setAdSettings] = useState<AdSettings>({
    adsEnabled: true,
    adSensePublisherId: 'pub-8924018591039482',
    adImpressionCount: 28410,
    adRevenueEstimated: 142.50,
    frequencyFeedEveryNPosts: 4
  });

  // Automatic Video Compression & Optimization Engine State
  const [videoProcessingConfig, setVideoProcessingConfig] = useState<VideoProcessingConfig>(() => {
    try {
      const saved = localStorage.getItem('acovon_video_processing_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_VIDEO_PROCESSING_CONFIG,
            ...parsed,
            enabledResolutions: Array.isArray(parsed.enabledResolutions)
              ? parsed.enabledResolutions
              : Array.isArray(parsed.allowedResolutions)
              ? parsed.allowedResolutions
              : INITIAL_VIDEO_PROCESSING_CONFIG.enabledResolutions,
            enabledCodecs: Array.isArray(parsed.enabledCodecs)
              ? parsed.enabledCodecs
              : INITIAL_VIDEO_PROCESSING_CONFIG.enabledCodecs,
            acceptedFormats: Array.isArray(parsed.acceptedFormats)
              ? parsed.acceptedFormats
              : INITIAL_VIDEO_PROCESSING_CONFIG.acceptedFormats
          };
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_VIDEO_PROCESSING_CONFIG;
  });

  const [videoMediaRecords, setVideoMediaRecords] = useState<VideoMediaRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_video_media_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_VIDEO_MEDIA_RECORDS;
  });

  const [videoProcessingJobs, setVideoProcessingJobs] = useState<VideoProcessingJob[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_video_processing_jobs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_VIDEO_PROCESSING_JOBS;
  });

  const [videoPlaybackPositions, setVideoPlaybackPositions] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('acovon_video_playback_positions');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return {};
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_video_processing_config', JSON.stringify(videoProcessingConfig));
    } catch {
      // ignore
    }
  }, [videoProcessingConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_video_media_records', JSON.stringify(videoMediaRecords));
    } catch {
      // ignore
    }
  }, [videoMediaRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_video_processing_jobs', JSON.stringify(videoProcessingJobs));
    } catch {
      // ignore
    }
  }, [videoProcessingJobs]);

  // Automatic Paid Creator Verification System State
  const [verificationSettings, setVerificationSettings] = useState<VerificationSettings>(() => {
    try {
      const saved = localStorage.getItem('acovon_verification_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_VERIFICATION_SETTINGS,
            ...parsed,
            benefits: Array.isArray(parsed.benefits)
              ? parsed.benefits
              : INITIAL_VERIFICATION_SETTINGS.benefits
          };
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_VERIFICATION_SETTINGS;
  });

  const [creatorVerificationRecords, setCreatorVerificationRecords] = useState<CreatorVerificationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_creator_verification_records');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_CREATOR_VERIFICATION_RECORDS;
  });

  const [verificationTransactions, setVerificationTransactions] = useState<VerificationTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_verification_transactions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_VERIFICATION_TRANSACTIONS;
  });

  const [verificationAuditLogs, setVerificationAuditLogs] = useState<VerificationAuditLog[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_verification_audit_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return MOCK_VERIFICATION_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_verification_settings', JSON.stringify(verificationSettings));
    } catch {
      // ignore
    }
  }, [verificationSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_creator_verification_records', JSON.stringify(creatorVerificationRecords));
    } catch {
      // ignore
    }
  }, [creatorVerificationRecords]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_verification_transactions', JSON.stringify(verificationTransactions));
    } catch {
      // ignore
    }
  }, [verificationTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_verification_audit_logs', JSON.stringify(verificationAuditLogs));
    } catch {
      // ignore
    }
  }, [verificationAuditLogs]);

  // Personalized Recommendation Engine State
  const [recommendationConfig, setRecommendationConfig] = useState<RecommendationEngineConfig>(() => {
    try {
      const saved = localStorage.getItem('acovon_recommendation_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            ...INITIAL_RECOMMENDATION_CONFIG,
            ...parsed,
            rankingWeights: {
              ...INITIAL_RECOMMENDATION_CONFIG.rankingWeights,
              ...(parsed.rankingWeights || {})
            },
            signalPointWeights: {
              ...INITIAL_RECOMMENDATION_CONFIG.signalPointWeights,
              ...(parsed.signalPointWeights || {})
            },
            timeDecayConfig: {
              ...INITIAL_RECOMMENDATION_CONFIG.timeDecayConfig,
              ...(parsed.timeDecayConfig || {})
            },
            diversityRules: {
              ...INITIAL_RECOMMENDATION_CONFIG.diversityRules,
              ...(parsed.diversityRules || {})
            },
            eligibleContentTypes: {
              ...INITIAL_RECOMMENDATION_CONFIG.eligibleContentTypes,
              ...(parsed.eligibleContentTypes || {})
            }
          };
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_RECOMMENDATION_CONFIG;
  });

  const [fanInterestProfiles, setFanInterestProfiles] = useState<Record<string, FanInterestProfile>>(() => {
    try {
      const saved = localStorage.getItem('acovon_fan_interest_profiles');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && parsed.user_fan_1 && parsed.fan_a) {
          const normalizedMap: Record<string, FanInterestProfile> = { ...INITIAL_FAN_INTEREST_PROFILES };
          Object.entries(parsed).forEach(([key, val]) => {
            const rawProf = (val || {}) as Partial<FanInterestProfile>;
            const fallbackProf = INITIAL_FAN_INTEREST_PROFILES[key] || INITIAL_FAN_INTEREST_PROFILES.user_fan_1;
            const avgComp = typeof rawProf.avgCompletionRate === 'number' ? rawProf.avgCompletionRate : 80;
            normalizedMap[key] = {
              ...fallbackProf,
              ...rawProf,
              categoryScores: rawProf.categoryScores || fallbackProf.categoryScores || {},
              recentCategoryScores: rawProf.recentCategoryScores || fallbackProf.recentCategoryScores || {},
              longTermCategoryScores: rawProf.longTermCategoryScores || fallbackProf.longTermCategoryScores || {},
              hashtagScores: rawProf.hashtagScores || fallbackProf.hashtagScores || {},
              creatorAffinityScores: rawProf.creatorAffinityScores || fallbackProf.creatorAffinityScores || {},
              skippedCategories: rawProf.skippedCategories || fallbackProf.skippedCategories || {},
              reducedCategories: Array.isArray(rawProf.reducedCategories) ? rawProf.reducedCategories : [],
              boostedCategories: Array.isArray(rawProf.boostedCategories) ? rawProf.boostedCategories : [],
              hiddenCreatorIds: Array.isArray(rawProf.hiddenCreatorIds) ? rawProf.hiddenCreatorIds : [],
              notInterestedPostIds: Array.isArray(rawProf.notInterestedPostIds) ? rawProf.notInterestedPostIds : [],
              reportedPostIds: Array.isArray(rawProf.reportedPostIds) ? rawProf.reportedPostIds : [],
              showMorePostIds: Array.isArray(rawProf.showMorePostIds) ? rawProf.showMorePostIds : [],
              onboardingCategories: Array.isArray(rawProf.onboardingCategories) ? rawProf.onboardingCategories : [],
              avgCompletionRate: avgComp,
              avgWatchCompletionPercent: rawProf.avgWatchCompletionPercent ?? avgComp
            };
          });
          return normalizedMap;
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_FAN_INTEREST_PROFILES;
  });

  const [activeRecommendationFanId, setActiveRecommendationFanId] = useState<string>('user_fan_1');

  const [engagementEvents, setEngagementEvents] = useState<FanEngagementEvent[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_engagement_events');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ENGAGEMENT_EVENTS;
  });

  const [recommendationFeedbackRecords, setRecommendationFeedbackRecords] = useState<RecommendationFeedbackRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_recommendation_feedback');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_RECOMMENDATION_FEEDBACK;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_recommendation_config', JSON.stringify(recommendationConfig));
    } catch {
      // ignore
    }
  }, [recommendationConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_fan_interest_profiles', JSON.stringify(fanInterestProfiles));
    } catch {
      // ignore
    }
  }, [fanInterestProfiles]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_engagement_events', JSON.stringify(engagementEvents.slice(0, 250)));
    } catch {
      // ignore
    }
  }, [engagementEvents]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_recommendation_feedback', JSON.stringify(recommendationFeedbackRecords));
    } catch {
      // ignore
    }
  }, [recommendationFeedbackRecords]);

  // Video call state
  const [videoCallSession, setVideoCallSession] = useState<VideoCallSession | null>(null);

  // Acovon Live state
  const [livestreams, setLivestreams] = useState<Livestream[]>(MOCK_LIVESTREAMS);
  const [liveChat, setLiveChat] = useState<Record<string, LiveChatMessage[]>>(MOCK_LIVE_CHAT);
  const [activeLivestreamId, setActiveLivestreamId] = useState<string | null>(null);
  const [isCreateLiveModalOpen, setIsCreateLiveModalOpen] = useState<boolean>(false);
  const [unlockedInviteStreams, setUnlockedInviteStreams] = useState<string[]>([]);

  // Sync current user to localStorage
  useEffect(() => {
    localStorage.setItem('acovon_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  const activeAdminPermissionLevel: AdminPermissionLevel =
    currentUser.adminPermissionLevel ||
    (activeRole === 'moderator' ? 'moderator' : 'super_admin');

  const hasAdminPermission = (allowedLevels: AdminPermissionLevel[]): boolean => {
    if (activeRole !== 'admin' && activeRole !== 'moderator') return false;
    if (activeAdminPermissionLevel === 'super_admin') return true;
    return allowedLevels.includes(activeAdminPermissionLevel);
  };

  const logAdminAction = (entry: {
    category: AuditLogCategory;
    action: string;
    targetType: string;
    targetId: string;
    targetLabel: string;
    details: string;
    severity?: 'info' | 'warning' | 'critical';
  }) => {
    const newEntry: AdminAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      category: entry.category,
      action: entry.action,
      targetType: entry.targetType,
      targetId: entry.targetId,
      targetLabel: entry.targetLabel,
      details: entry.details,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      severity: entry.severity || 'info'
    };
    setAuditLogs(prev => [newEntry, ...prev]);
  };

  // ============================================================================
  // ADMIN-ONLY GLOBAL BRANDING STUDIO PERMISSIONS & ACTIONS
  // ============================================================================
  const hasBrandingPermission = (): boolean => {
    if (activeRole !== 'admin' && activeRole !== 'moderator') return false;
    if (activeAdminPermissionLevel === 'super_admin') return true;
    const latestUserRecord = users[currentUser.id] || Object.values(users).find(u => u.id === currentUser.id) || currentUser;
    const perms = latestUserRecord.adminPermissions || [];
    return perms.includes('manage_platform_branding') || perms.includes('all_privileges');
  };

  const publishBrandingTheme = (
    themeToPublish: PlatformBrandingTheme,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (!hasBrandingPermission()) {
      return {
        success: false,
        error: 'Access Denied: Only Super Admins or Admins with the explicit manage_platform_branding permission can publish global platform themes.'
      };
    }

    const prevTheme = activeBrandingTheme;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setActiveBrandingTheme(themeToPublish);
    setAppearanceMode(themeToPublish.mode);

    const historyEntry: BrandingHistoryRecord = {
      id: `bh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      previousThemeId: prevTheme.id,
      previousThemeName: prevTheme.name,
      newThemeId: themeToPublish.id,
      newThemeName: themeToPublish.name,
      actionType: 'publish',
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      notes: notes || `Published ${themeToPublish.name} (${themeToPublish.code}) globally across all platform interfaces.`,
      timestamp: nowStr,
      snapshotTheme: prevTheme
    };

    setBrandingHistory(prev => [historyEntry, ...prev]);

    logAdminAction({
      category: 'platform_branding',
      action: 'Published Global Branding Theme',
      targetType: 'branding_theme',
      targetId: themeToPublish.id,
      targetLabel: `${themeToPublish.code} — ${themeToPublish.name}`,
      details: `Admin ${currentUser.name} (${ currentUser.id }) changed global platform branding from "${prevTheme.name}" to "${themeToPublish.name}" (Fonts: ${themeToPublish.fontPairLabel}, Mode: ${themeToPublish.mode}). ${notes ? `Notes: ${notes}` : ''}`,
      severity: 'warning'
    });

    return { success: true };
  };

  const saveBrandingDraft = (
    draftTheme: PlatformBrandingTheme
  ): { success: boolean; error?: string } => {
    if (!hasBrandingPermission()) {
      return {
        success: false,
        error: 'Access Denied: Missing manage_platform_branding permission.'
      };
    }

    setDraftBrandingTheme(draftTheme);

    logAdminAction({
      category: 'platform_branding',
      action: 'Saved Branding Theme Draft',
      targetType: 'branding_theme',
      targetId: draftTheme.id,
      targetLabel: draftTheme.name,
      details: `Saved draft configuration for "${draftTheme.name}" without altering the live platform theme.`,
      severity: 'info'
    });

    return { success: true };
  };

  const rollbackBrandingTheme = (
    historyRecordId?: string
  ): { success: boolean; error?: string } => {
    if (!hasBrandingPermission()) {
      return {
        success: false,
        error: 'Access Denied: Only authorized administrators with manage_platform_branding can roll back platform themes.'
      };
    }

    const targetRecord = historyRecordId
      ? brandingHistory.find(h => h.id === historyRecordId)
      : brandingHistory[0];

    const restoredTheme: PlatformBrandingTheme = targetRecord?.snapshotTheme
      || PRESET_BRANDING_THEMES.find(t => t.id === targetRecord?.previousThemeId)
      || customBrandingThemes.find(t => t.id === targetRecord?.previousThemeId)
      || DEFAULT_BRANDING_THEME;

    const prevTheme = activeBrandingTheme;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setActiveBrandingTheme(restoredTheme);
    setAppearanceMode(restoredTheme.mode);

    const historyEntry: BrandingHistoryRecord = {
      id: `bh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      previousThemeId: prevTheme.id,
      previousThemeName: prevTheme.name,
      newThemeId: restoredTheme.id,
      newThemeName: restoredTheme.name,
      actionType: 'rollback',
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      notes: `Rolled back global branding from "${prevTheme.name}" to "${restoredTheme.name}".`,
      timestamp: nowStr,
      snapshotTheme: prevTheme
    };

    setBrandingHistory(prev => [historyEntry, ...prev]);

    logAdminAction({
      category: 'platform_branding',
      action: 'Rolled Back Global Branding Theme',
      targetType: 'branding_theme',
      targetId: restoredTheme.id,
      targetLabel: restoredTheme.name,
      details: `Admin ${currentUser.name} (${currentUser.id}) rolled back global platform branding from "${prevTheme.name}" to "${restoredTheme.name}".`,
      severity: 'warning'
    });

    return { success: true };
  };

  const resetToSignatureBrandingTheme = (): { success: boolean; error?: string } => {
    if (!hasBrandingPermission()) {
      return {
        success: false,
        error: 'Access Denied: Missing manage_platform_branding permission.'
      };
    }

    const prevTheme = activeBrandingTheme;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setActiveBrandingTheme(DEFAULT_BRANDING_THEME);
    setAppearanceMode(DEFAULT_BRANDING_THEME.mode);

    const historyEntry: BrandingHistoryRecord = {
      id: `bh_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      previousThemeId: prevTheme.id,
      previousThemeName: prevTheme.name,
      newThemeId: DEFAULT_BRANDING_THEME.id,
      newThemeName: DEFAULT_BRANDING_THEME.name,
      actionType: 'reset_default',
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      notes: 'Restored ACOVON Signature (THEME 01) as the default global platform branding.',
      timestamp: nowStr,
      snapshotTheme: prevTheme
    };

    setBrandingHistory(prev => [historyEntry, ...prev]);

    logAdminAction({
      category: 'platform_branding',
      action: 'Restored Default ACOVON Signature Theme',
      targetType: 'branding_theme',
      targetId: DEFAULT_BRANDING_THEME.id,
      targetLabel: DEFAULT_BRANDING_THEME.name,
      details: `Admin ${currentUser.name} (${currentUser.id}) restored ACOVON Signature (Theme 01) from "${prevTheme.name}".`,
      severity: 'info'
    });

    return { success: true };
  };

  const saveCustomBrandingTheme = (
    customTheme: PlatformBrandingTheme
  ): { success: boolean; error?: string } => {
    if (!hasBrandingPermission()) {
      return {
        success: false,
        error: 'Access Denied: Missing manage_platform_branding permission.'
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const enriched: PlatformBrandingTheme = {
      ...customTheme,
      isPreset: false,
      createdAt: nowStr,
      createdByAdminName: currentUser.name
    };

    setCustomBrandingThemes(prev => {
      const exists = prev.some(t => t.id === enriched.id);
      if (exists) {
        return prev.map(t => (t.id === enriched.id ? enriched : t));
      }
      return [enriched, ...prev];
    });

    logAdminAction({
      category: 'platform_branding',
      action: 'Saved Custom Branding Theme Preset',
      targetType: 'branding_theme',
      targetId: enriched.id,
      targetLabel: enriched.name,
      details: `Admin ${currentUser.name} created/updated custom branding theme "${enriched.name}" (Fonts: ${enriched.fontPairLabel}, Accent: ${enriched.tokens.accentPrimary}).`,
      severity: 'info'
    });

    return { success: true };
  };

  const deleteCustomBrandingTheme = (
    customThemeId: string
  ): { success: boolean; error?: string } => {
    if (!hasBrandingPermission()) {
      return {
        success: false,
        error: 'Access Denied: Missing manage_platform_branding permission.'
      };
    }

    const found = customBrandingThemes.find(t => t.id === customThemeId);
    if (!found) return { success: false, error: 'Custom theme not found.' };

    setCustomBrandingThemes(prev => prev.filter(t => t.id !== customThemeId));

    logAdminAction({
      category: 'platform_branding',
      action: 'Deleted Custom Branding Theme',
      targetType: 'branding_theme',
      targetId: customThemeId,
      targetLabel: found.name,
      details: `Admin ${currentUser.name} removed custom theme "${found.name}".`,
      severity: 'info'
    });

    return { success: true };
  };

  const toggleAdminBrandingPermission = (
    targetAdminId: string
  ): { success: boolean; granted?: boolean; error?: string } => {
    if (activeAdminPermissionLevel !== 'super_admin') {
      return {
        success: false,
        error: 'Only Super Admins can grant or revoke the manage_platform_branding permission.'
      };
    }

    const targetEntry = Object.entries(users).find(([, u]) => u.id === targetAdminId);
    if (!targetEntry) {
      return { success: false, error: 'Target administrator account not found.' };
    }

    const [dictKey, targetUser] = targetEntry;
    const existingPerms = targetUser.adminPermissions || [];
    const hasPerm = existingPerms.includes('manage_platform_branding');
    const updatedPerms = hasPerm
      ? existingPerms.filter(p => p !== 'manage_platform_branding')
      : [...existingPerms, 'manage_platform_branding'];

    const updatedUser: User = {
      ...targetUser,
      adminPermissions: updatedPerms
    };

    setUsers(prev => ({
      ...prev,
      [dictKey]: updatedUser
    }));

    if (currentUser.id === targetAdminId) {
      setCurrentUser(updatedUser);
    }

    logAdminAction({
      category: 'permission_change',
      action: hasPerm ? 'Revoked manage_platform_branding Permission' : 'Granted manage_platform_branding Permission',
      targetType: 'admin_user',
      targetId: targetUser.id,
      targetLabel: targetUser.name,
      details: `Super Admin ${currentUser.name} ${hasPerm ? 'revoked' : 'granted'} explicit manage_platform_branding access for ${targetUser.name} (@${targetUser.username}).`,
      severity: 'warning'
    });

    return { success: true, granted: !hasPerm };
  };

  // Switch between distinct Admin accounts to test RBAC permissions
  const switchAdminOperator = (userKeyOrId: string) => {
    const foundUser =
      users[userKeyOrId] ||
      Object.values(users).find(u => u.id === userKeyOrId) ||
      MOCK_USERS[userKeyOrId];
    if (!foundUser) return;
    const nextRole: UserRole = foundUser.role === 'moderator' ? 'moderator' : 'admin';
    setActiveRole(nextRole);
    setCurrentUser(foundUser);
    setIsAuthenticated(true);
    const loginAudit: AdminAuditLog = {
      id: `audit_login_${Date.now()}`,
      adminId: foundUser.id,
      adminName: foundUser.name,
      adminRole: foundUser.adminPermissionLevel || (nextRole === 'moderator' ? 'moderator' : 'admin'),
      category: 'auth_security',
      action: `Switched Active Admin Operator Session to ${foundUser.name}`,
      targetType: 'AdminSession',
      targetId: foundUser.id,
      targetLabel: `${foundUser.name} (${foundUser.adminPermissionLevel || nextRole})`,
      details: `Permission level active: ${(foundUser.adminPermissionLevel || nextRole).toUpperCase()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      severity: 'info'
    };
    setAuditLogs(prev => [loginAudit, ...prev]);
  };

  // Authoritative Backend Role & Creator Approval Detection
  const findUserEntryByKeyOrId = (userIdOrKey: string): { key: string; user: User } | undefined => {
    if (users[userIdOrKey]) {
      return { key: userIdOrKey, user: users[userIdOrKey] };
    }
    const foundKey = Object.keys(users).find(k => users[k]?.id === userIdOrKey);
    if (foundKey) {
      return { key: foundKey, user: users[foundKey] };
    }
    return undefined;
  };

  // Authoritative evaluation of whether the current authenticated user is an active, approved Creator
  const isCurrentUserApprovedCreator: boolean = (() => {
    if (!currentUser || !currentUser.id) return false;
    const userEntry = findUserEntryByKeyOrId(currentUser.id);
    const userRecord = userEntry?.user;
    const creatorRecord = creators.find(c => c.id === currentUser.id);

    // Check account suspension / ban status
    const effectiveStatus = creatorRecord?.accountStatus || userRecord?.accountStatus || currentUser.accountStatus || 'active';
    if (effectiveStatus === 'suspended' || effectiveStatus === 'banned' || effectiveStatus === 'disabled') {
      return false;
    }

    // Check if there is an unapproved (pending or rejected) creator application on record
    const approvalStatus = userRecord?.creatorApprovalStatus || userRecord?.creatorApplicationStatus;
    if (approvalStatus === 'pending' || approvalStatus === 'rejected' || approvalStatus === 'not_applied') {
      return false;
    }

    // Must be either an approved creator in users or a verified creator in creators
    if (userRecord && userRecord.role !== 'creator') {
      return false;
    }

    return Boolean(creatorRecord || (userRecord && userRecord.role === 'creator' && approvalStatus === 'approved'));
  })();

  // Reconcile currentUser and activeRole with authoritative backend records (prevents frontend role tampering and auto-upgrades logged-in fans upon admin approval)
  useEffect(() => {
    if (!currentUser?.id) return;
    const userEntry = findUserEntryByKeyOrId(currentUser.id);
    const userRecord = userEntry?.user;
    const creatorRecord = creators.find(c => c.id === currentUser.id);

    if (userRecord) {
      const approvalStatus = userRecord.creatorApprovalStatus || userRecord.creatorApplicationStatus;
      // If backend says user is a fan (or pending/rejected creator applicant), enforce 'fan' role even if localStorage was tampered with
      if (
        userRecord.role === 'fan' ||
        approvalStatus === 'pending' ||
        approvalStatus === 'rejected' ||
        approvalStatus === 'not_applied'
      ) {
        if (activeRole === 'creator' || currentUser.role === 'creator') {
          setActiveRole('fan');
          setCurrentUser({ ...userRecord, role: 'fan' });
        }
        return;
      }

      // If backend says user was approved as a creator, upgrade their session automatically
      if (userRecord.role === 'creator' && approvalStatus === 'approved' && creatorRecord) {
        if (activeRole !== 'creator' || currentUser.role !== 'creator') {
          setActiveRole('creator');
          setCurrentUser(creatorRecord);
        }
      }
    }
  }, [users, creators, verifications, currentUser?.id, currentUser?.role, activeRole]);

  // Role Switcher helper (enforces authoritative account role)
  const switchUserRole = (role: UserRole, specificCreatorId?: string) => {
    setIsAuthenticated(true);
    if (role === 'fan') {
      const fanTarget =
        (specificCreatorId && (findUserEntryByKeyOrId(specificCreatorId)?.user)) ||
        users.fan_jordan ||
        MOCK_USERS.fan_jordan;
      setActiveRole('fan');
      setCurrentUser({ ...fanTarget, role: 'fan' });
    } else if (role === 'creator') {
      const target = creators.find(c => c.id === (specificCreatorId || 'creator_elena')) || creators[0];
      setActiveRole('creator');
      setCurrentUser(target);
    } else if (role === 'admin') {
      const targetAdmin =
        (specificCreatorId && (findUserEntryByKeyOrId(specificCreatorId)?.user)) ||
        users.admin_root ||
        MOCK_USERS.admin_root;
      setActiveRole('admin');
      setCurrentUser(targetAdmin);
    } else if (role === 'moderator') {
      const targetMod = users.moderator_clara || MOCK_USERS.moderator_clara;
      setActiveRole('moderator');
      setCurrentUser(targetMod);
    }
  };

  const loginUser = (role?: UserRole, specificId?: string) => {
    if (role) {
      switchUserRole(role, specificId);
    } else {
      setIsAuthenticated(true);
    }
  };

  // Unified Standard Registration (Always creates one standard account with default Fan role)
  const registerAccount = (input: {
    fullName: string;
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    is18PlusConfirmed: boolean;
  }): { success: boolean; user?: User; error?: string } => {
    if (!platformConfig.allowNewRegistrations) {
      return { success: false, error: 'New account registrations are temporarily paused by platform administration.' };
    }

    const fullName = input.fullName.trim();
    const rawUsername = input.username.trim().replace(/^@+/, '').toLowerCase();
    const email = input.email.trim().toLowerCase();
    const password = input.password;
    const confirmPassword = input.confirmPassword;

    if (!fullName) {
      return { success: false, error: 'Please enter your Full Legal Name.' };
    }
    if (!rawUsername || rawUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (!/^[a-z0-9_.-]+$/.test(rawUsername)) {
      return { success: false, error: 'Username may only contain letters, numbers, underscores, dots, and hyphens.' };
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    if (password !== confirmPassword) {
      return { success: false, error: 'Passwords do not match. Please verify your password confirmation.' };
    }
    if (!input.is18PlusConfirmed) {
      return {
        success: false,
        error: 'You must certify that you are at least 18 years of age and agree to the ACOVON Terms of Service.'
      };
    }

    // Prevent duplicate accounts by email or username across both users and creators
    const emailExistsInUsers = Object.values(users).some(u => u.email.toLowerCase() === email);
    const emailExistsInCreators = creators.some(c => c.email.toLowerCase() === email);
    if (emailExistsInUsers || emailExistsInCreators) {
      return {
        success: false,
        error: 'An ACOVON account with this email address already exists. Please log in instead.'
      };
    }

    const usernameExistsInUsers = Object.values(users).some(u => u.username.toLowerCase() === rawUsername);
    const usernameExistsInCreators = creators.some(c => c.username.toLowerCase() === rawUsername);
    if (usernameExistsInUsers || usernameExistsInCreators) {
      return {
        success: false,
        error: 'This username is already taken. Please choose another username.'
      };
    }

    const nowDate = new Date().toISOString().split('T')[0];
    const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newUserId = `user_fan_${Date.now()}`;

    // All new registrations automatically receive the default Fan role
    const newUser: User = {
      id: newUserId,
      name: fullName,
      username: rawUsername,
      email,
      passwordHash: password,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      role: 'fan',
      accountStatus: 'active',
      creatorApplicationStatus: 'not_applied',
      creatorApprovalStatus: 'not_applied',
      walletBalance: 50.0,
      isVerified: false,
      is18PlusConfirmed: true,
      dateJoined: nowDate,
      lastLoginAt: nowTimestamp,
      updatedAt: nowTimestamp,
      country: 'United States'
    };

    setUsers(prev => ({
      ...prev,
      [newUserId]: newUser
    }));
    setCurrentUser(newUser);
    setActiveRole('fan');
    setIsAuthenticated(true);

    return { success: true, user: newUser };
  };

  // Unified Standard Login with Automatic Backend Role Detection
  const authenticateAccount = (
    emailOrUsernameInput: string,
    passwordInput: string
  ): {
    success: boolean;
    detectedRole?: UserRole;
    user?: User | CreatorProfile;
    error?: string;
  } => {
    const identifier = emailOrUsernameInput.trim().toLowerCase().replace(/^@+/, '');
    if (!identifier) {
      return { success: false, error: 'Please enter your Email Address.' };
    }
    if (!passwordInput) {
      return { success: false, error: 'Please enter your Password.' };
    }

    // Look up account in users and creators
    const matchedUserEntry = Object.entries(users).find(
      ([, u]) => u.email.toLowerCase() === identifier || u.username.toLowerCase() === identifier
    );
    const matchedUser = matchedUserEntry?.[1];
    const matchedCreator = creators.find(
      c =>
        c.email.toLowerCase() === identifier ||
        c.username.toLowerCase() === identifier ||
        (matchedUser && c.id === matchedUser.id)
    );

    if (!matchedUser && !matchedCreator) {
      return {
        success: false,
        error: 'No ACOVON account found with that email address. Please check your credentials or create an account.'
      };
    }

    // Verify password if passwordHash is set on the user record
    if (matchedUser?.passwordHash && matchedUser.passwordHash !== passwordInput) {
      return {
        success: false,
        error: 'Incorrect email or password. Please try again.'
      };
    }

    const effectiveAccountStatus =
      matchedCreator?.accountStatus || matchedUser?.accountStatus || 'active';

    if (effectiveAccountStatus === 'banned' || effectiveAccountStatus === 'disabled') {
      return {
        success: false,
        error: `This account has been ${effectiveAccountStatus} by ACOVON Trust & Safety.${
          matchedUser?.statusReason ? ` Reason: ${matchedUser.statusReason}` : ''
        }`
      };
    }

    const nowTimestamp = new Date().toISOString().replace('T', ' ').slice(0, 16);

    // Determine authoritative role from backend account & creator approval status
    let detectedRole: UserRole = 'fan';
    let sessionAccount: User | CreatorProfile;

    if (matchedUser?.role === 'admin') {
      detectedRole = 'admin';
      sessionAccount = { ...matchedUser, lastLoginAt: nowTimestamp };
    } else if (matchedUser?.role === 'moderator') {
      detectedRole = 'moderator';
      sessionAccount = { ...matchedUser, lastLoginAt: nowTimestamp };
    } else {
      // Check creator approval status
      const approvalStatus =
        matchedUser?.creatorApprovalStatus ||
        matchedUser?.creatorApplicationStatus ||
        (matchedCreator ? 'approved' : 'not_applied');

      const hasPendingOrRejectedVerif = verifications.some(
        v =>
          (v.userId === matchedUser?.id || v.username.toLowerCase() === identifier) &&
          (v.status === 'pending' || v.status === 'rejected')
      );

      const isApprovedCreator =
        approvalStatus === 'approved' &&
        !hasPendingOrRejectedVerif &&
        Boolean(matchedCreator || matchedUser?.role === 'creator');

      if (isApprovedCreator && matchedCreator) {
        detectedRole = 'creator';
        sessionAccount = {
          ...matchedCreator,
          role: 'creator',
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          lastLoginAt: nowTimestamp
        };
      } else {
        // Standard Fan, Pending Creator Applicant, or Rejected Creator Applicant remains a Fan
        detectedRole = 'fan';
        const baseFan: User = matchedUser || {
          id: matchedCreator!.id,
          name: matchedCreator!.name,
          username: matchedCreator!.username,
          email: matchedCreator!.email,
          avatar: matchedCreator!.avatar,
          role: 'fan',
          accountStatus: effectiveAccountStatus,
          walletBalance: matchedCreator!.walletBalance || 0,
          isVerified: false,
          is18PlusConfirmed: true,
          dateJoined: matchedCreator!.dateJoined || new Date().toISOString().split('T')[0]
        };
        sessionAccount = {
          ...baseFan,
          role: 'fan',
          lastLoginAt: nowTimestamp
        };
      }
    }

    // Update lastLoginAt in users state
    if (matchedUserEntry) {
      const [userKey, userObj] = matchedUserEntry;
      setUsers(prev => ({
        ...prev,
        [userKey]: {
          ...userObj,
          role: detectedRole,
          lastLoginAt: nowTimestamp,
          updatedAt: nowTimestamp
        }
      }));
    }

    setCurrentUser(sessionAccount);
    setActiveRole(detectedRole);
    setIsAuthenticated(true);

    return {
      success: true,
      detectedRole,
      user: sessionAccount
    };
  };

  const logoutUser = () => {
    logoutFromSupabase().catch(() => {});
    setIsAuthenticated(false);
    setActiveRole('fan');
    setCurrentUser(MOCK_USERS.fan1);
  };

  // Sync appearance and language preferences to Supabase when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      syncUserPreferencesToSupabase({
        uid: currentUser.id,
        appearancePreference: appearanceMode,
        preferredLanguage: activeLanguageCode,
        languageMode: languagePreferenceMode
      }).catch(() => {});
    }
  }, [isAuthenticated, currentUser?.id, appearanceMode, activeLanguageCode, languagePreferenceMode]);

  // Follow System state (persisted per user)
  const [following, setFollowing] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`acovon_following_${currentUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return ['creator_elena', 'creator_marcus', 'creator_sarah'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(`acovon_following_${currentUser.id}`, JSON.stringify(following));
    } catch {
      // ignore
    }
  }, [following, currentUser.id]);

  // Bookmarked / Saved Posts
  const [savedPostIds, setSavedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`acovon_saved_posts_${currentUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // fallback
    }
    return ['demo_post_1', 'demo_post_5'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(`acovon_saved_posts_${currentUser.id}`, JSON.stringify(savedPostIds));
    } catch {
      // ignore
    }
  }, [savedPostIds, currentUser.id]);

  // Single-video feed playback authority
  const [activePlayingVideoId, setActivePlayingVideoId] = useState<string | null>(null);

  // Follow helpers
  const isFollowing = (creatorId: string) => {
    return following.includes(creatorId);
  };

  const toggleFollowCreator = (creatorId: string) => {
    const alreadyFollowing = following.includes(creatorId);
    const creator = creators.find(c => c.id === creatorId);

    if (alreadyFollowing) {
      setFollowing(prev => prev.filter(id => id !== creatorId));
      setCreators(prev => prev.map(c => {
        if (c.id === creatorId) {
          return { ...c, followersCount: Math.max(0, c.followersCount - 1) };
        }
        return c;
      }));
      return { success: true, isFollowing: false };
    } else {
      setFollowing(prev => [...prev, creatorId]);
      setCreators(prev => prev.map(c => {
        if (c.id === creatorId) {
          return { ...c, followersCount: c.followersCount + 1 };
        }
        return c;
      }));

      // Send persistent notification to creator
      if (creator) {
        const notif: AppNotification = {
          id: `notif_follow_${Date.now()}`,
          userId: creatorId,
          type: 'system',
          title: 'New Follower',
          message: `${currentUser.name} (@${currentUser.username}) started following your Acovon profile.`,
          read: false,
          createdAt: 'Just now'
        };
        setNotifications(prev => [notif, ...prev]);
      }
      return { success: true, isFollowing: true };
    }
  };

  const isPostSaved = (postId: string) => savedPostIds.includes(postId);

  const toggleSavePost = (postId: string) => {
    const isSaved = savedPostIds.includes(postId);
    if (isSaved) {
      setSavedPostIds(prev => prev.filter(id => id !== postId));
      return false;
    } else {
      setSavedPostIds(prev => [...prev, postId]);
      return true;
    }
  };

  const forwardPostInMessage = (postId: string, recipientId: string, customNote?: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return { success: false, error: 'Post not found' };

    const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
    const mediaThumb = firstMedia?.thumbnailUrl || firstMedia?.url || '';

    const shareContent = customNote
      ? `${customNote}\n\n[Shared Post by ${post.creatorName} (@${post.creatorUsername}) - "${post.content.slice(0, 60)}..."]`
      : `[Shared Post by ${post.creatorName} (@${post.creatorUsername}) - "${post.content.slice(0, 60)}..."]`;

    sendMessage(recipientId, shareContent, false, undefined, mediaThumb || undefined);
    return { success: true };
  };

  const isPostPurchased = (postId: string) => {
    return purchases.some(p => p.postId === postId && p.userId === currentUser.id);
  };

  const isSubscribedTo = (creatorId: string) => {
    return subscriptions.some(s => s.creatorId === creatorId && s.fanId === currentUser.id && s.status === 'active');
  };

  const getSubscriptionTier = (creatorId: string) => {
    return subscriptions.find(s => s.creatorId === creatorId && s.fanId === currentUser.id && s.status === 'active');
  };

  // Post interactions
  const toggleLikePost = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const isLiked = !p.isLiked;
        return {
          ...p,
          isLiked,
          likesCount: isLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1)
        };
      }
      return p;
    }));
  };

  const createPost = (newPostData: Omit<Post, 'id' | 'likesCount' | 'commentsCount' | 'createdAt'>) => {
    // Role Authorization Guard: Only approved, active creator accounts can create or publish posts
    if (!isCurrentUserApprovedCreator) {
      console.warn('Authorization Denied: Only approved, active creator accounts can publish content.');
      return;
    }

    const newPost: Post = {
      ...newPostData,
      id: `post_${Date.now()}`,
      likesCount: 0,
      commentsCount: 0,
      createdAt: 'Just now',
      isLiked: false
    };
    setPosts(prev => [newPost, ...prev]);
  };

  // Pay-per-view unlock with genuine server/wallet simulation & commission splitting
  const unlockPPVPost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post || !post.ppvPrice) return { success: false, error: 'Post or price not found' };

    const price = post.ppvPrice;
    if (currentUser.walletBalance < price) {
      return { success: false, error: `Insufficient wallet balance ($${currentUser.walletBalance.toFixed(2)}). Please deposit funds to unlock.` };
    }

    const platformFee = Number((price * commissionSettings.ppvRate).toFixed(2));
    const creatorNet = Number((price - platformFee).toFixed(2));

    // Deduct fan balance
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - price).toFixed(2))
    }));

    // Credit creator
    setCreators(prev => prev.map(c => {
      if (c.id === post.creatorId) {
        return {
          ...c,
          walletBalance: Number((c.walletBalance + creatorNet).toFixed(2)),
          totalEarnings: Number((c.totalEarnings + creatorNet).toFixed(2))
        };
      }
      return c;
    }));

    // Add to purchases
    const purchaseRecord: ContentPurchase = {
      id: `pur_${Date.now()}`,
      userId: currentUser.id,
      postId: post.id,
      creatorId: post.creatorId,
      amount: price,
      purchasedAt: new Date().toISOString().split('T')[0]
    };
    setPurchases(prev => [...prev, purchaseRecord]);

    // Record transaction
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'ppv_purchase',
      amount: -price,
      description: `Unlocked PPV Video: ${post.content.slice(0, 32)}...`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      platformFee,
      netCreatorEarnings: creatorNet
    };
    setTransactions(prev => [tx, ...prev]);

    // Notify creator
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: post.creatorId,
      type: 'system',
      title: 'PPV Content Unlocked',
      message: `${currentUser.name} unlocked your exclusive PPV video ($${price.toFixed(2)}). Net earned: $${creatorNet.toFixed(2)}.`,
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true };
  };

  // Subscriptions
  const subscribeToCreator = (creatorId: string, tierId: string) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return { success: false, error: 'Creator not found' };
    const tier = creator.tiers.find(t => t.id === tierId);
    if (!tier) return { success: false, error: 'Tier not found' };

    const price = tier.price;
    if (currentUser.walletBalance < price) {
      return { success: false, error: `Insufficient wallet balance ($${currentUser.walletBalance.toFixed(2)}). Please deposit at least $${(price - currentUser.walletBalance).toFixed(2)}.` };
    }

    const platformFee = Number((price * commissionSettings.subscriptionsRate).toFixed(2));
    const creatorNet = Number((price - platformFee).toFixed(2));

    // Deduct fan wallet
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - price).toFixed(2))
    }));

    // Credit creator
    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          walletBalance: Number((c.walletBalance + creatorNet).toFixed(2)),
          totalEarnings: Number((c.totalEarnings + creatorNet).toFixed(2)),
          subscribersCount: c.subscribersCount + 1
        };
      }
      return c;
    }));

    // Create or update subscription
    const newSub: Subscription = {
      id: `sub_${Date.now()}`,
      fanId: currentUser.id,
      creatorId,
      tierId: tier.id,
      tierName: tier.name,
      monthlyPrice: price,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      nextRenewalDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      autoRenew: true
    };
    setSubscriptions(prev => [newSub, ...prev.filter(s => !(s.fanId === currentUser.id && s.creatorId === creatorId))]);

    // Record transaction
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'subscription',
      amount: -price,
      description: `Monthly Subscription: ${creator.name} (${tier.name})`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      platformFee,
      netCreatorEarnings: creatorNet
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true };
  };

  const cancelSubscription = (subId: string) => {
    setSubscriptions(prev => prev.map(s => {
      if (s.id === subId) {
        return { ...s, status: 'cancelled', autoRenew: false };
      }
      return s;
    }));
  };

  // Wallet
  const depositFunds = (amount: number) => {
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance + amount).toFixed(2))
    }));

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'deposit',
      amount,
      description: `Instant Wallet Funding (Visa / Mastercard Ref: #${Math.floor(100000 + Math.random() * 900000)})`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setTransactions(prev => [tx, ...prev]);
  };

  const withdrawFunds = (amount: number, method: string) => {
    if (amount < commissionSettings.minWithdrawalAmount) {
      return { success: false, error: `Minimum withdrawal amount is $${commissionSettings.minWithdrawalAmount.toFixed(2)}.` };
    }
    if (currentUser.walletBalance < amount) {
      return { success: false, error: 'Insufficient available funds to withdraw.' };
    }

    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - amount).toFixed(2))
    }));

    if (currentUser.role === 'creator') {
      setCreators(prev => prev.map(c => {
        if (c.id === currentUser.id) {
          return {
            ...c,
            walletBalance: Number((c.walletBalance - amount).toFixed(2)),
            pendingBalance: Number(((c.pendingBalance || 0) + amount).toFixed(2))
          };
        }
        return c;
      }));

      const newPayout: PayoutRequest = {
        id: `payout_${Date.now()}`,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorUsername: currentUser.username,
        creatorAvatar: currentUser.avatar,
        amount,
        method,
        accountDestination: 'Verified Creator Account •••• 4829',
        status: 'pending',
        requestedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        notes: 'Creator studio withdrawal request awaiting Finance Admin settlement.'
      };
      setPayoutRequests(prev => [newPayout, ...prev]);
    }

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'withdrawal',
      amount: -amount,
      description: `Payout Request via ${method} (Pending Treasury Approval)`,
      status: 'pending',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true };
  };

  const tipCreator = (creatorId: string, amount: number, note?: string) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return { success: false, error: 'Creator not found' };

    if (currentUser.walletBalance < amount) {
      return { success: false, error: `Insufficient balance for tip ($${currentUser.walletBalance.toFixed(2)}).` };
    }

    const platformFee = Number((amount * commissionSettings.tipsRate).toFixed(2));
    const creatorNet = Number((amount - platformFee).toFixed(2));

    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - amount).toFixed(2))
    }));

    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          walletBalance: Number((c.walletBalance + creatorNet).toFixed(2)),
          totalEarnings: Number((c.totalEarnings + creatorNet).toFixed(2))
        };
      }
      return c;
    }));

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'tip',
      amount: -amount,
      description: `Creator Tip to ${creator.name}${note ? `: "${note}"` : ''}`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      platformFee,
      netCreatorEarnings: creatorNet
    };
    setTransactions(prev => [tx, ...prev]);

    // Send direct chat message with tip
    const chatMsg: ChatMessage = {
      id: `tip_${Date.now()}`,
      senderId: currentUser.id,
      receiverId: creatorId,
      content: note ? `Sent a $${amount.toFixed(2)} Tip: "${note}"` : `Sent a celebratory $${amount.toFixed(2)} Tip!`,
      isTip: true,
      tipAmount: amount,
      createdAt: 'Just now',
      read: false
    };
    setMessages(prev => ({
      ...prev,
      [creatorId]: [...(prev[creatorId] || []), chatMsg]
    }));

    return { success: true };
  };

  // Custom Video Requests (Personalized Video Marketplace)
  const createCustomVideoRequest = (data: {
    creatorId: string;
    title: string;
    instructions: string;
    recipientName: string;
    videoDurationMinutes: number;
    price: number;
    deliveryDeadline?: string;
    referenceFileUrl?: string;
  }) => {
    const creator = creators.find(c => c.id === data.creatorId);
    if (!creator) return { success: false, error: 'Creator not found' };

    if (currentUser.walletBalance < data.price) {
      return { success: false, error: `Insufficient wallet balance ($${currentUser.walletBalance.toFixed(2)}). Deposit funds to book.` };
    }

    const platformFee = Number((data.price * commissionSettings.customRequestsRate).toFixed(2));
    const creatorEarnings = Number((data.price - platformFee).toFixed(2));

    // Deduct fan balance into pending platform escrow
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - data.price).toFixed(2))
    }));

    // Record creator pending balance (not available until delivered & accepted)
    setCreators(prev => prev.map(c => {
      if (c.id === data.creatorId) {
        return {
          ...c,
          pendingBalance: Number((c.pendingBalance + creatorEarnings).toFixed(2))
        };
      }
      return c;
    }));

    const deadline = data.deliveryDeadline || new Date(Date.now() + (creator.customRequestDeliveryDays || 3) * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const req: CustomVideoRequest = {
      id: `req_${Date.now()}`,
      fanId: currentUser.id,
      fanName: currentUser.name,
      fanUsername: currentUser.username,
      fanAvatar: currentUser.avatar,
      creatorId: data.creatorId,
      creatorName: creator.name,
      title: data.title,
      instructions: data.instructions,
      recipientName: data.recipientName,
      videoDurationMinutes: data.videoDurationMinutes,
      price: data.price,
      proposedBudget: data.price,
      platformFee,
      creatorEarnings,
      referenceFileUrl: data.referenceFileUrl,
      status: 'pending',
      deliveryDeadline: deadline,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setCustomRequests(prev => [req, ...prev]);

    // Automatically insert request card into the creator-fan conversation without duplicates
    const requestCardMessage: ChatMessage = {
      id: `msg_req_${req.id}`,
      senderId: currentUser.id,
      receiverId: data.creatorId,
      content: `Submitted Custom Video Request: ${data.title} ($${data.price.toFixed(2)})`,
      customRequestId: req.id,
      createdAt: 'Just now',
      read: false
    };

    setMessages(prev => {
      const existing = prev[data.creatorId] || [];
      if (existing.some(m => m.customRequestId === req.id)) return prev;
      return {
        ...prev,
        [data.creatorId]: [...existing, requestCardMessage]
      };
    });

    // Notify creator
    const notif: AppNotification = {
      id: `notif_req_${Date.now()}`,
      userId: data.creatorId,
      type: 'custom_request',
      title: 'New Custom Video Request',
      message: `${currentUser.name} requested "${data.title}" ($${data.price.toFixed(2)} in escrow). Review in your Inbox.`,
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'custom_request',
      amount: -data.price,
      description: `Custom Video Request Escrow (${creator.name}: ${data.title})`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      platformFee,
      netCreatorEarnings: creatorEarnings
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true, request: req };
  };

  const updateCustomRequestStatus = (
    requestId: string,
    status: CustomVideoRequest['status'],
    deliveryUrl?: string,
    deliveryNotes?: string,
    options?: { negotiatedPrice?: number; confirmedDeadline?: string; declineReason?: string }
  ) => {
    const targetReq = customRequests.find(r => r.id === requestId);
    if (!targetReq) return;

    // Permission checks: Fans cannot approve/decline creator requests; creators cannot approve another creator's requests
    const isApproveOrDecline = ['accepted', 'approved', 'in_progress', 'declined', 'rejected', 'delivered'].includes(status);
    if (isApproveOrDecline && currentUser.role === 'fan') {
      console.warn('Permission denied: Fans cannot approve or decline creator requests.');
      return;
    }
    if (isApproveOrDecline && currentUser.role === 'creator' && currentUser.id !== targetReq.creatorId) {
      console.warn('Permission denied: Creators cannot manage another creator’s requests.');
      return;
    }

    setCustomRequests(prev => prev.map(req => {
      if (req.id === requestId) {
        // If completed: release escrow to creator available balance!
        if (status === 'completed' && req.status !== 'completed') {
          setCreators(creatorsPrev => creatorsPrev.map(c => {
            if (c.id === req.creatorId) {
              return {
                ...c,
                pendingBalance: Math.max(0, Number((c.pendingBalance - req.creatorEarnings).toFixed(2))),
                walletBalance: Number((c.walletBalance + req.creatorEarnings).toFixed(2)),
                totalEarnings: Number((c.totalEarnings + req.creatorEarnings).toFixed(2))
              };
            }
            return c;
          }));

          const tx: WalletTransaction = {
            id: `tx_payout_${Date.now()}`,
            userId: req.creatorId,
            type: 'payout_received',
            amount: req.creatorEarnings,
            description: `Released Escrow: Completed Custom Video #${req.id.slice(-4)} (${req.title})`,
            status: 'completed',
            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
          };
          setTransactions(tPrev => [tx, ...tPrev]);
        }

        // If refunded / declined / rejected: return full price to fan wallet
        const isRefundState = status === 'refunded' || status === 'declined' || status === 'rejected';
        const wasAlreadyRefunded = req.status === 'refunded' || req.status === 'declined' || req.status === 'rejected';
        if (isRefundState && !wasAlreadyRefunded) {
          setCurrentUser(u => {
            if (u.id === req.fanId) {
              return { ...u, walletBalance: Number((u.walletBalance + req.price).toFixed(2)) };
            }
            return u;
          });
          setCreators(creatorsPrev => creatorsPrev.map(c => {
            if (c.id === req.creatorId) {
              return {
                ...c,
                pendingBalance: Math.max(0, Number((c.pendingBalance - req.creatorEarnings).toFixed(2)))
              };
            }
            return c;
          }));

          const refundTx: WalletTransaction = {
            id: `tx_refund_${Date.now()}`,
            userId: req.fanId,
            type: 'deposit',
            amount: req.price,
            description: `Escrow Refund: Custom Request "${req.title}" (${status})`,
            status: 'completed',
            createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
          };
          setTransactions(tPrev => [refundTx, ...tPrev]);
        }

        const updatedPrice = options?.negotiatedPrice ?? req.price;
        const updatedFee = Number((updatedPrice * commissionSettings.customRequestsRate).toFixed(2));
        const updatedNet = Number((updatedPrice - updatedFee).toFixed(2));

        return {
          ...req,
          status,
          price: updatedPrice,
          negotiatedPrice: options?.negotiatedPrice ?? req.negotiatedPrice,
          platformFee: updatedFee,
          creatorEarnings: updatedNet,
          deliveryDeadline: options?.confirmedDeadline || req.deliveryDeadline,
          declineReason: options?.declineReason || req.declineReason,
          deliveredVideoUrl: deliveryUrl || req.deliveredVideoUrl,
          deliveredNotes: deliveryNotes || req.deliveredNotes,
          deliveredAt: status === 'delivered' ? new Date().toISOString().split('T')[0] : req.deliveredAt
        };
      }
      return req;
    }));

    // Send status update notification to fan or creator
    const notifTitle =
      status === 'accepted' || status === 'approved'
        ? 'Custom Video Request Approved'
        : status === 'declined' || status === 'rejected'
        ? 'Custom Video Request Declined'
        : status === 'delivered'
        ? 'Custom Video Delivered!'
        : status === 'completed'
        ? 'Custom Request Completed & Escrow Released'
        : `Request Status Updated: ${status.replace('_', ' ')}`;

    const notifMsg =
      status === 'accepted' || status === 'approved'
        ? `${targetReq.creatorName} approved your request "${targetReq.title}". Confirmed deadline: ${options?.confirmedDeadline || targetReq.deliveryDeadline}.`
        : status === 'declined' || status === 'rejected'
        ? `${targetReq.creatorName} declined "${targetReq.title}". ${options?.declineReason ? `Reason: "${options.declineReason}". ` : ''}Full escrow ($${targetReq.price.toFixed(2)}) has been refunded to your wallet.`
        : status === 'delivered'
        ? `${targetReq.creatorName} delivered your custom video for "${targetReq.title}"! Open the conversation to watch and release escrow.`
        : `Custom Video Request "${targetReq.title}" is now marked as ${status.replace('_', ' ')}.`;

    const recipientUserId = currentUser.id === targetReq.creatorId ? targetReq.fanId : targetReq.creatorId;
    setNotifications(prev => [
      {
        id: `notif_req_upd_${Date.now()}`,
        userId: recipientUserId,
        type: 'custom_request',
        title: notifTitle,
        message: notifMsg,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);
  };

  // Paid Video Calling
  const initiateVideoCall = (creatorId: string, spendingLimit: number) => {
    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return { success: false, error: 'Creator not found' };
    if (!creator.isLiveForCalls) return { success: false, error: 'Creator is currently unavailable or busy for live video calls.' };

    if (currentUser.walletBalance < creator.callRatePerMinute) {
      return { success: false, error: `You need at least $${creator.callRatePerMinute.toFixed(2)} (1 minute) in your wallet to start a call.` };
    }

    const callId = `call_${Date.now()}`;
    const session: VideoCallSession = {
      id: callId,
      creatorId,
      fanId: currentUser.id,
      creatorName: creator.name,
      fanName: currentUser.name,
      ratePerMinute: creator.callRatePerMinute,
      status: 'requesting',
      durationSeconds: 0,
      totalCost: 0,
      platformFee: 0,
      creatorEarnings: 0,
      spendingLimit: Math.min(spendingLimit, currentUser.walletBalance)
    };

    setVideoCallSession(session);

    // Notify creator in notifications
    setNotifications(prev => [
      {
        id: `notif_call_${Date.now()}`,
        userId: creatorId,
        type: 'call',
        title: 'Incoming Video Call Request',
        message: `${currentUser.name} is requesting a live 1-on-1 video call at $${creator.callRatePerMinute.toFixed(2)}/min.`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const acceptIncomingCall = () => {
    if (videoCallSession) {
      setVideoCallSession(prev => prev ? ({ ...prev, status: 'connected', startedAt: new Date().toISOString() }) : null);
    }
  };

  const rejectCall = () => {
    if (videoCallSession) {
      const { creatorId, fanId, ratePerMinute, id } = videoCallSession;
      // Log declined / missed call in conversation without charging fan
      const callMsg: ChatMessage = {
        id: `msg_call_dec_${Date.now()}`,
        senderId: creatorId,
        receiverId: fanId,
        content: 'Video call request declined — No charge applied ($0.00)',
        videoCallEvent: {
          callId: id,
          status: 'declined',
          ratePerMinute,
          durationSeconds: 0,
          totalCharged: 0,
          timestamp: 'Just now'
        },
        createdAt: 'Just now',
        read: false
      };
      setMessages(prev => ({
        ...prev,
        [creatorId]: [...(prev[creatorId] || []), callMsg]
      }));
      setVideoCallSession(null);
    }
  };

  const updateCallDuration = (seconds: number) => {
    if (!videoCallSession || videoCallSession.status !== 'connected') return;
    const rate = videoCallSession.ratePerMinute;
    const minutes = seconds / 60;
    const cost = Number((minutes * rate).toFixed(2));
    const fee = Number((cost * commissionSettings.videoCallsRate).toFixed(2));
    const creatorNet = Number((cost - fee).toFixed(2));

    setVideoCallSession(prev => prev ? ({
      ...prev,
      durationSeconds: seconds,
      totalCost: cost,
      platformFee: fee,
      creatorEarnings: creatorNet
    }) : null);

    // Auto-disconnect if spending limit reached
    if (cost >= videoCallSession.spendingLimit || cost >= currentUser.walletBalance) {
      endVideoCall();
    }
  };

  const endVideoCall = () => {
    if (!videoCallSession) return;
    const { id, totalCost, platformFee, creatorEarnings, creatorId, fanId, durationSeconds, creatorName, ratePerMinute, status } = videoCallSession;

    // Only deduct and log if call actually connected and duration > 0 seconds
    if (status === 'connected' && durationSeconds > 0 && totalCost > 0) {
      setCurrentUser(prev => ({
        ...prev,
        walletBalance: Math.max(0, Number((prev.walletBalance - totalCost).toFixed(2)))
      }));

      setCreators(prev => prev.map(c => {
        if (c.id === creatorId) {
          return {
            ...c,
            walletBalance: Number((c.walletBalance + creatorEarnings).toFixed(2)),
            totalEarnings: Number((c.totalEarnings + creatorEarnings).toFixed(2))
          };
        }
        return c;
      }));

      const mins = Math.ceil(durationSeconds / 60);
      const tx: WalletTransaction = {
        id: `tx_call_${Date.now()}`,
        userId: currentUser.id,
        type: 'video_call',
        amount: -totalCost,
        description: `Private Video Call with ${creatorName} (${mins} min)`,
        status: 'completed',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        platformFee,
        netCreatorEarnings: creatorEarnings
      };
      setTransactions(prev => [tx, ...prev]);

      // Log completed call summary inside conversation
      const callCompletedMsg: ChatMessage = {
        id: `msg_call_end_${Date.now()}`,
        senderId: fanId,
        receiverId: creatorId,
        content: `1-on-1 Video Call ended · Duration ${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`,
        videoCallEvent: {
          callId: id,
          status: 'completed',
          ratePerMinute,
          durationSeconds,
          totalCharged: totalCost,
          timestamp: 'Just now'
        },
        createdAt: 'Just now',
        read: false
      };
      setMessages(prev => ({
        ...prev,
        [creatorId]: [...(prev[creatorId] || []), callCompletedMsg]
      }));
    } else {
      // Unanswered / cancelled before connection: $0.00 charged
      const missedMsg: ChatMessage = {
        id: `msg_call_miss_${Date.now()}`,
        senderId: fanId,
        receiverId: creatorId,
        content: 'Missed / Unanswered Video Call Request — No charge applied ($0.00)',
        videoCallEvent: {
          callId: id,
          status: 'missed',
          ratePerMinute,
          durationSeconds: 0,
          totalCharged: 0,
          timestamp: 'Just now'
        },
        createdAt: 'Just now',
        read: false
      };
      setMessages(prev => ({
        ...prev,
        [creatorId]: [...(prev[creatorId] || []), missedMsg]
      }));
    }

    setVideoCallSession(prev => prev ? ({ ...prev, status: 'completed', endedAt: new Date().toISOString() }) : null);
    setTimeout(() => {
      setVideoCallSession(null);
    }, 300);
  };

  // Messaging
  const sendMessage = (
    recipientId: string,
    content: string,
    isPaid = false,
    price?: number,
    mediaUrl?: string,
    extra?: {
      mediaType?: 'image' | 'video' | 'voice' | 'document';
      mediaThumbnailUrl?: string;
      mediaFileName?: string;
      mediaDescription?: string;
      attachments?: ChatAttachmentItem[];
      pricingMode?: 'individual' | 'bundle';
    }
  ) => {
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: currentUser.id,
      receiverId: recipientId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      content,
      isPaid,
      price: isPaid ? price : undefined,
      isUnlocked: !isPaid,
      mediaUrl,
      mediaType: extra?.mediaType || (mediaUrl ? 'image' : undefined),
      mediaThumbnailUrl: extra?.mediaThumbnailUrl,
      mediaFileName: extra?.mediaFileName,
      mediaDescription: extra?.mediaDescription,
      attachments: extra?.attachments,
      pricingMode: extra?.pricingMode,
      createdAt: 'Just now',
      read: false
    };

    setMessages(prev => {
      const chatKey = recipientId;
      return {
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), newMsg]
      };
    });
  };

  const unlockPaidMessage = (otherUserId: string, messageId: string, attachmentId?: string) => {
    const chatList = messages[otherUserId] || [];
    const msg = chatList.find(m => m.id === messageId);
    if (!msg) return { success: false, error: 'Message not found' };

    // Determine price to charge (individual attachment vs full message/bundle)
    let targetAttachment: ChatAttachmentItem | undefined;
    if (attachmentId && msg.attachments) {
      targetAttachment = msg.attachments.find(a => a.id === attachmentId);
      if (!targetAttachment) return { success: false, error: 'Attachment not found' };
      if (targetAttachment.isUnlocked) return { success: false, error: 'Attachment already unlocked' };
    } else if (msg.isUnlocked && (!msg.attachments || msg.attachments.every(a => a.isUnlocked))) {
      return { success: false, error: 'Media already unlocked' };
    }

    const price = targetAttachment ? (targetAttachment.price || msg.price || 0) : (msg.price || 0);
    if (price <= 0) return { success: false, error: 'Invalid price' };

    if (currentUser.walletBalance < price) {
      return { success: false, error: `Insufficient wallet balance ($${currentUser.walletBalance.toFixed(2)}). Please deposit funds to unlock.` };
    }

    const platformFee = Number((price * commissionSettings.paidMessagesRate).toFixed(2));
    const creatorNet = Number((price - platformFee).toFixed(2));
    const creatorId = msg.senderId !== currentUser.id ? msg.senderId : otherUserId;

    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - price).toFixed(2))
    }));

    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          walletBalance: Number((c.walletBalance + creatorNet).toFixed(2)),
          totalEarnings: Number((c.totalEarnings + creatorNet).toFixed(2))
        };
      }
      return c;
    }));

    // Record in purchases list so fan's purchase history tracks private media unlocks
    const purchaseRecord: ContentPurchase = {
      id: `pur_msg_${Date.now()}`,
      userId: currentUser.id,
      postId: attachmentId || messageId,
      creatorId,
      amount: price,
      purchasedAt: new Date().toISOString().split('T')[0]
    };
    setPurchases(prev => [purchaseRecord, ...prev]);

    const itemLabel = targetAttachment
      ? `Private ${targetAttachment.fileType.toUpperCase()}: ${targetAttachment.fileName}`
      : msg.mediaFileName
      ? `Private Media: ${msg.mediaFileName}`
      : `Unlocked Paid Message`;

    const txId = `tx_${Date.now()}`;
    const tx: WalletTransaction = {
      id: txId,
      userId: currentUser.id,
      type: 'paid_message',
      amount: -price,
      description: `${itemLabel} (from ${creators.find(c => c.id === creatorId)?.name || 'Creator'})`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      platformFee,
      netCreatorEarnings: creatorNet
    };
    setTransactions(prev => [tx, ...prev]);

    setMessages(prev => ({
      ...prev,
      [otherUserId]: (prev[otherUserId] || []).map(m => {
        if (m.id !== messageId) return m;
        if (attachmentId && m.attachments) {
          const updatedAttachments = m.attachments.map(a =>
            a.id === attachmentId ? { ...a, isUnlocked: true } : a
          );
          const allUnlocked = updatedAttachments.every(a => !a.isPaid || a.isUnlocked);
          return {
            ...m,
            attachments: updatedAttachments,
            isUnlocked: allUnlocked,
            paymentConfirmation: {
              transactionId: txId,
              amount: price,
              itemLabel,
              paidAt: 'Just now'
            }
          };
        }
        return {
          ...m,
          isUnlocked: true,
          attachments: m.attachments?.map(a => ({ ...a, isUnlocked: true })),
          paymentConfirmation: {
            transactionId: txId,
            amount: price,
            itemLabel,
            paidAt: 'Just now'
          }
        };
      })
    }));

    // Notify creator of purchase
    setNotifications(prev => [
      {
        id: `notif_msg_unlock_${Date.now()}`,
        userId: creatorId,
        type: 'message',
        title: 'Private Media Purchased!',
        message: `${currentUser.name} unlocked "${itemLabel}" for $${price.toFixed(2)} (Net earned: $${creatorNet.toFixed(2)}).`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const markThreadAsRead = (otherUserId: string) => {
    setMessages(prev => {
      const list = prev[otherUserId];
      if (!list || list.every(m => m.read)) return prev;
      return {
        ...prev,
        [otherUserId]: list.map(m => ({ ...m, read: true }))
      };
    });
  };

  // Admin & Mod actions with RBAC & Permanent Audit Logging
  const updateCommissionSettings = (newSettings: Partial<CommissionSettings>) => {
    if (!hasAdminPermission(['super_admin', 'finance_admin'])) return;
    setCommissionSettings(prev => {
      const updated = { ...prev, ...newSettings };
      logAdminAction({
        category: 'platform_settings',
        action: 'Updated Platform Commission Matrix & Fee Structure',
        targetType: 'CommissionSettings',
        targetId: 'global_commissions',
        targetLabel: 'Platform Commission Matrix',
        details: `Subscriptions: ${Math.round(updated.subscriptionsRate * 100)}%, PPV: ${Math.round(updated.ppvRate * 100)}%, Custom: ${Math.round(updated.customRequestsRate * 100)}%, Calls: ${Math.round(updated.videoCallsRate * 100)}%, Min Payout: $${updated.minWithdrawalAmount}`,
        severity: 'warning'
      });
      return updated;
    });
  };

  const updateAdSettings = (newSettings: Partial<AdSettings>) => {
    if (!hasAdminPermission(['super_admin', 'admin'])) return;
    setAdSettings(prev => {
      const updated = { ...prev, ...newSettings };
      logAdminAction({
        category: 'platform_settings',
        action: 'Updated Platform Advertising & Placement Rules',
        targetType: 'AdSettings',
        targetId: 'global_ads',
        targetLabel: 'Ad Monetization Engine',
        details: `Ads Enabled: ${updated.adsEnabled} · Frequency: Every ${updated.frequencyFeedEveryNPosts} posts · Publisher: ${updated.adSensePublisherId}`,
        severity: 'info'
      });
      return updated;
    });
  };

  const reviewVerification = (id: string, status: 'approved' | 'rejected' | 'info_requested', notes?: string) => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) return;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setVerifications(prev =>
      prev.map(v =>
        v.id === id
          ? {
              ...v,
              status,
              notes: notes || v.notes,
              reviewedByAdminId: currentUser.id,
              reviewedByAdminName: currentUser.name,
              reviewedAt: nowStr
            }
          : v
      )
    );
    
    const verif = verifications.find(v => v.id === id);
    if (!verif) return;

    logAdminAction({
      category: 'creator_approval',
      action:
        status === 'approved'
          ? `Approved Creator Application & 18+ Identity Verification`
          : status === 'info_requested'
          ? `Requested Additional Verification Documents from Applicant`
          : `Rejected Creator Application`,
      targetType: 'CreatorVerification',
      targetId: id,
      targetLabel: `${verif.name} (@${verif.username})`,
      details: notes || `Verification status set to ${status.toUpperCase()}`,
      severity: status === 'rejected' ? 'warning' : 'info'
    });

    if (status === 'approved') {
      const targetUserId = verif.userId;
      const targetEntry = findUserEntryByKeyOrId(targetUserId);
      const targetUser = targetEntry?.user || (currentUser.id === targetUserId ? currentUser : null);
      
      const appData = verif.applicationData;
      const displayName = appData?.displayName || verif.name || targetUser?.name || 'New Creator';
      const username = verif.username || targetUser?.username || `creator_${Date.now().toString(36)}`;
      const bio = appData?.bio || 'Official Acovon verified creator.';
      const category = appData?.category || 'Fashion & Luxury';
      const tierPrice = appData?.monthlyTierPrice || 14.99;

      const existingUserObj = targetEntry?.user || (currentUser.id === targetUserId ? currentUser : null);
      const userAvatar = existingUserObj?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      const userEmail = existingUserObj?.email || `${username}@acovon.creator`;
      const userDateJoined = existingUserObj?.dateJoined || new Date().toISOString().split('T')[0];
      const userCountry = existingUserObj?.country || 'United States';

      const targetKey = targetEntry?.key || targetUserId;

      // Update the existing user record in place (do NOT create a duplicate account)
      setUsers(prev => ({
        ...prev,
        [targetKey]: {
          ...(prev[targetKey] || existingUserObj || {
            id: targetUserId,
            name: displayName,
            username: username,
            email: userEmail,
            avatar: userAvatar,
            dateJoined: userDateJoined,
            country: userCountry,
            walletBalance: 0,
            isVerified: true,
            is18PlusConfirmed: true
          }),
          id: targetUserId,
          name: displayName,
          username: username,
          email: userEmail,
          role: 'creator' as UserRole,
          accountStatus: 'active',
          isVerified: true,
          creatorApplicationStatus: 'approved',
          creatorApprovalStatus: 'approved',
          creatorApprovedByAdminId: currentUser.id,
          creatorApprovedByAdminName: currentUser.name,
          creatorApprovedAt: nowStr,
          creatorRejectionReason: undefined,
          updatedAt: nowStr
        }
      }));

      const existingCreator = creators.find(c => c.id === targetUserId);
      const newCreatorProfile: CreatorProfile = existingCreator ? {
        ...existingCreator,
        name: displayName,
        username: username,
        email: userEmail,
        bio: bio,
        category: category,
        role: 'creator',
        isVerified: true,
        accountStatus: 'active',
        creatorApplicationStatus: 'approved',
        creatorApprovalStatus: 'approved',
        creatorApprovedByAdminId: currentUser.id,
        creatorApprovedByAdminName: currentUser.name,
        creatorApprovedAt: nowStr,
        updatedAt: nowStr
      } : {
        id: targetUserId,
        name: displayName,
        username: username,
        email: userEmail,
        avatar: userAvatar,
        coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
        bio: bio,
        category: category,
        role: 'creator',
        accountStatus: 'active',
        creatorApplicationStatus: 'approved',
        creatorApprovalStatus: 'approved',
        creatorApprovedByAdminId: currentUser.id,
        creatorApprovedByAdminName: currentUser.name,
        creatorApprovedAt: nowStr,
        updatedAt: nowStr,
        walletBalance: existingUserObj?.walletBalance || 0,
        pendingBalance: 0,
        totalEarnings: 0,
        withdrawnAmount: 0,
        subscribersCount: 0,
        followersCount: 0,
        isVerified: true,
        is18PlusConfirmed: true,
        dateJoined: userDateJoined,
        country: userCountry,
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
            id: `tier_bronze_${Date.now()}`,
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

      setCreators(prev => {
        const idx = prev.findIndex(c => c.id === targetUserId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = newCreatorProfile;
          return updated;
        }
        return [newCreatorProfile, ...prev];
      });

      if (currentUser.id === targetUserId) {
        setCurrentUser(newCreatorProfile);
        setActiveRole('creator');
      }

      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: targetUserId,
        type: 'system',
        title: 'Creator Privileges Approved!',
        message: `Welcome to Acovon Creator Studio, ${displayName}! Your 18+ identity verification has been audited and approved. Your existing account now has full Creator privileges.`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [notif, ...prev]);
    } else if (status === 'info_requested') {
      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: verif.userId,
        type: 'system',
        title: 'Additional Verification Info Requested',
        message: `Acovon Trust & Safety requested additional details for your creator application: ${notes || 'Please re-upload a clearer high-resolution government ID.'}`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [notif, ...prev]);
    } else {
      // Rejected: account role remains Fan
      const targetUserId = verif.userId;
      const targetEntry = findUserEntryByKeyOrId(targetUserId);
      const targetKey = targetEntry?.key || targetUserId;
      if (targetEntry?.user) {
        setUsers(prev => ({
          ...prev,
          [targetKey]: {
            ...targetEntry.user,
            role: 'fan',
            creatorApplicationStatus: 'rejected',
            creatorApprovalStatus: 'rejected',
            creatorRejectionReason: notes || 'Document verification could not be completed.',
            updatedAt: nowStr
          }
        }));
      }

      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: verif.userId,
        type: 'system',
        title: 'Creator Application Update',
        message: `Your creator application could not be approved: ${notes || 'Document verification could not be completed.'}`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  const applyToBecomeCreator = (data: CreatorApplicationData) => {
    if (!platformConfig.allowCreatorApplications) {
      return { success: false, error: 'Creator applications are currently paused by platform administration.' };
    }
    if (!data.displayName.trim()) {
      return { success: false, error: 'Creator display name is required.' };
    }
    if (!data.ageConfirmed || !data.termsAccepted) {
      return { success: false, error: 'You must certify 18+ legal age and agree to Creator Terms.' };
    }
    if (!data.documentNumber.trim()) {
      return { success: false, error: 'Government identification document number is required.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    const newVerif: CreatorVerification = {
      id: `verif_${Date.now()}`,
      userId: currentUser.id,
      name: data.displayName,
      username: currentUser.username,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      documentFileUrl: data.documentFileUrl || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80',
      selfieUrl: data.selfieUrl || currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      status: 'pending',
      submittedAt: nowStr,
      notes: `Creator application for category: ${data.category}. Associated with existing account ${currentUser.email} (@${currentUser.username}).`,
      applicationData: data
    };

    setVerifications(prev => [newVerif, ...prev.filter(v => v.userId !== currentUser.id)]);

    // Update the existing user record's creatorApplicationStatus to 'pending' while keeping role as 'fan'
    const userEntry = findUserEntryByKeyOrId(currentUser.id);
    const userKey = userEntry?.key || currentUser.id;
    setUsers(prev => ({
      ...prev,
      [userKey]: {
        ...(prev[userKey] || (currentUser as User)),
        role: 'fan',
        creatorApplicationStatus: 'pending',
        creatorApprovalStatus: 'pending',
        creatorRejectionReason: undefined,
        updatedAt: nowStr
      }
    }));

    setCurrentUser(prev => ({
      ...prev,
      role: 'fan',
      creatorApplicationStatus: 'pending',
      creatorApprovalStatus: 'pending',
      updatedAt: nowStr
    }));

    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      type: 'system',
      title: 'Creator Application Under Review',
      message: 'Your 18+ identity verification & creator application have been linked to your existing ACOVON account and submitted for Admin approval.',
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true };
  };

  const userPendingVerification = verifications.find(
    v => v.userId === currentUser.id && v.status === 'pending'
  );

  const resolveReport = (reportId: string, actionTaken: string) => {
    adminUpdateReport(reportId, { status: 'resolved', actionTaken });
  };

  // Comprehensive Admin Control Center Actions
  const adminUpdateUserAccount = (
    userId: string,
    updates: {
      role?: UserRole;
      accountStatus?: AccountStatus;
      statusReason?: string;
      isVerified?: boolean;
      adminPermissionLevel?: AdminPermissionLevel;
      adminPermissions?: string[];
    }
  ): { success: boolean; error?: string } => {
    if (updates.adminPermissionLevel !== undefined || updates.adminPermissions !== undefined || updates.role === 'admin') {
      if (!hasAdminPermission(['super_admin'])) {
        return { success: false, error: 'Unauthorized: Only Super Admin can assign or modify administrator permissions.' };
      }
    } else if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return { success: false, error: 'Unauthorized: Insufficient privileges to modify user accounts.' };
    }

    let targetName = userId;

    setUsers(prev => {
      const next = { ...prev };
      const key = Object.keys(next).find(k => next[k].id === userId || k === userId);
      if (key && next[key]) {
        targetName = `${next[key].name} (@${next[key].username})`;
        next[key] = { ...next[key], ...updates };
      }
      return next;
    });

    setCreators(prev =>
      prev.map(c => {
        if (c.id === userId) {
          targetName = `${c.name} (@${c.username})`;
          return { ...c, ...updates };
        }
        return c;
      })
    );

    logAdminAction({
      category: updates.adminPermissionLevel ? 'permission_change' : 'user_account',
      action: updates.accountStatus
        ? `Changed Account Status to ${updates.accountStatus.toUpperCase()}`
        : updates.adminPermissionLevel
        ? `Updated Admin Permission Level to ${updates.adminPermissionLevel.toUpperCase()}`
        : updates.role
        ? `Changed User Role to ${updates.role.toUpperCase()}`
        : `Updated User Account Verification & Security Profile`,
      targetType: 'User',
      targetId: userId,
      targetLabel: targetName,
      details: updates.statusReason || JSON.stringify(updates),
      severity: updates.accountStatus === 'banned' || updates.accountStatus === 'suspended' ? 'critical' : 'warning'
    });

    return { success: true };
  };

  const adminUpdateCreatorControl = (
    creatorId: string,
    updates: Partial<CreatorProfile>
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return { success: false, error: 'Unauthorized: Requires Admin or Moderator permissions.' };
    }

    const creator = creators.find(c => c.id === creatorId);
    if (!creator) return { success: false, error: 'Creator not found.' };

    setCreators(prev => prev.map(c => (c.id === creatorId ? { ...c, ...updates } : c)));

    logAdminAction({
      category: 'creator_approval',
      action: `Updated Creator Governance Controls for ${creator.name}`,
      targetType: 'Creator',
      targetId: creatorId,
      targetLabel: `${creator.name} (@${creator.username})`,
      details: `Updated fields: ${Object.keys(updates).join(', ')}`,
      severity: updates.accountStatus === 'suspended' ? 'critical' : 'info'
    });

    return { success: true };
  };

  const adminModeratePost = (
    postId: string,
    moderationStatus: ContentModerationStatus,
    notes?: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return { success: false, error: 'Unauthorized: Content moderation requires Moderator or Admin role.' };
    }

    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) return { success: false, error: 'Post not found.' };

    setPosts(prev =>
      prev.map(p =>
        p.id === postId
          ? {
              ...p,
              moderationStatus,
              moderationNotes: notes || p.moderationNotes
            }
          : p
      )
    );

    if (moderationStatus === 'removed' || moderationStatus === 'restricted') {
      setNotifications(prev => [
        {
          id: `notif_mod_${Date.now()}`,
          userId: targetPost.creatorId,
          type: 'system',
          title: `Content ${moderationStatus === 'removed' ? 'Removed' : 'Restricted'} by Moderation`,
          message: notes || platformConfig.notificationTemplates.policyWarning,
          read: false,
          createdAt: 'Just now'
        },
        ...prev
      ]);
    }

    logAdminAction({
      category: 'content_moderation',
      action: `Set Content Moderation Status to ${moderationStatus.toUpperCase()}`,
      targetType: 'Post',
      targetId: postId,
      targetLabel: `${targetPost.creatorName}: "${targetPost.content.slice(0, 42)}..."`,
      details: notes || `Moderation decision: ${moderationStatus}`,
      severity: moderationStatus === 'removed' ? 'warning' : 'info'
    });

    return { success: true };
  };

  const adminEmergencyEndLivestream = (
    streamId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return { success: false, error: 'Unauthorized: Emergency stream termination requires Moderator or Admin role.' };
    }

    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream not found.' };

    setLivestreams(prev =>
      prev.map(s =>
        s.id === streamId
          ? {
              ...s,
              status: 'ended',
              endedAt: 'Ended by Trust & Safety',
              recordingStatus: 'unpublished',
              isReplayPublished: false
            }
          : s
      )
    );

    const sysMsg: LiveChatMessage = {
      id: `c_admin_stop_${Date.now()}`,
      streamId,
      senderId: currentUser.id,
      senderName: 'ACOVON TRUST & SAFETY',
      senderAvatar: currentUser.avatar,
      senderRole: 'moderator',
      message: `⚠️ Broadcast terminated by Platform Moderation: ${reason}`,
      type: 'highlighted',
      timestamp: 'Just now'
    };

    setLiveChat(prev => ({
      ...prev,
      [streamId]: [...(prev[streamId] || []), sysMsg]
    }));

    setNotifications(prev => [
      {
        id: `notif_live_stop_${Date.now()}`,
        userId: stream.creatorId,
        type: 'livestream',
        title: 'Livestream Terminated by Trust & Safety',
        message: `Your broadcast "${stream.title}" was ended by administration. Reason: ${reason}`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    logAdminAction({
      category: 'livestream_moderation',
      action: `Emergency Terminated Active Livestream`,
      targetType: 'Livestream',
      targetId: streamId,
      targetLabel: `${stream.creatorName}: "${stream.title}"`,
      details: `Reason: ${reason}`,
      severity: 'critical'
    });

    return { success: true };
  };

  const adminProcessPayout = (
    payoutId: string,
    decision: 'approved' | 'processing' | 'completed' | 'rejected',
    notes?: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'finance_admin'])) {
      return { success: false, error: 'Unauthorized: Payout approvals require Finance Admin or Super Admin privileges.' };
    }

    const payout = payoutRequests.find(p => p.id === payoutId);
    if (!payout) return { success: false, error: 'Payout request not found.' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setPayoutRequests(prev =>
      prev.map(p =>
        p.id === payoutId
          ? {
              ...p,
              status: decision,
              processedAt: nowStr,
              processedByAdminId: currentUser.id,
              processedByAdminName: currentUser.name,
              rejectionReason: decision === 'rejected' ? notes : p.rejectionReason,
              notes: notes || p.notes
            }
          : p
      )
    );

    if (decision === 'completed') {
      setCreators(prev =>
        prev.map(c => {
          if (c.id === payout.creatorId) {
            return {
              ...c,
              pendingBalance: Math.max(0, Number(((c.pendingBalance || 0) - payout.amount).toFixed(2))),
              withdrawnAmount: Number((c.withdrawnAmount + payout.amount).toFixed(2))
            };
          }
          return c;
        })
      );

      const tx: WalletTransaction = {
        id: `tx_payout_${Date.now()}`,
        userId: payout.creatorId,
        type: 'payout_received',
        amount: payout.amount,
        description: `Creator Payout Settled via ${payout.method} (${payout.accountDestination})`,
        status: 'completed',
        createdAt: nowStr,
        referenceId: payout.id,
        authorizedByAdminId: currentUser.id
      };
      setTransactions(prev => [tx, ...prev]);

      setNotifications(prev => [
        {
          id: `notif_payout_${Date.now()}`,
          userId: payout.creatorId,
          type: 'payout',
          title: 'Payout Dispatched ($' + payout.amount.toFixed(2) + ')',
          message: platformConfig.notificationTemplates.payoutCompleted,
          read: false,
          createdAt: 'Just now'
        },
        ...prev
      ]);
    } else if (decision === 'rejected') {
      // Return funds from pendingBalance back to creator's available walletBalance
      setCreators(prev =>
        prev.map(c => {
          if (c.id === payout.creatorId) {
            return {
              ...c,
              pendingBalance: Math.max(0, Number(((c.pendingBalance || 0) - payout.amount).toFixed(2))),
              walletBalance: Number((c.walletBalance + payout.amount).toFixed(2))
            };
          }
          return c;
        })
      );
    }

    logAdminAction({
      category: 'payout_approval',
      action: `Payout Request #${payoutId} Marked as ${decision.toUpperCase()} ($${payout.amount.toFixed(2)})`,
      targetType: 'Payout',
      targetId: payoutId,
      targetLabel: `${payout.creatorName} ($${payout.amount.toFixed(2)})`,
      details: notes || `Method: ${payout.method} · Destination: ${payout.accountDestination}`,
      severity: decision === 'rejected' ? 'warning' : 'info'
    });

    return { success: true };
  };

  const adminCreateFinancialAdjustment = (data: {
    targetUserId: string;
    type: 'refund' | 'adjustment' | 'chargeback';
    amount: number;
    reason: string;
    referenceId?: string;
  }): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'finance_admin'])) {
      return { success: false, error: 'Unauthorized: Financial ledger adjustments require Finance Admin or Super Admin privileges.' };
    }
    if (!data.reason.trim()) {
      return { success: false, error: 'An auditable explanation is required for all financial adjustments.' };
    }
    if (data.amount === 0 || isNaN(data.amount)) {
      return { success: false, error: 'Adjustment amount must be non-zero.' };
    }

    let targetLabel = data.targetUserId;
    const signedAmount = data.type === 'chargeback' ? -Math.abs(data.amount) : Number(data.amount.toFixed(2));

    setUsers(prev => {
      const next = { ...prev };
      const key = Object.keys(next).find(k => next[k].id === data.targetUserId || k === data.targetUserId);
      if (key && next[key]) {
        targetLabel = `${next[key].name} (@${next[key].username})`;
        next[key] = {
          ...next[key],
          walletBalance: Math.max(0, Number((next[key].walletBalance + signedAmount).toFixed(2)))
        };
      }
      return next;
    });

    setCreators(prev =>
      prev.map(c => {
        if (c.id === data.targetUserId) {
          targetLabel = `${c.name} (@${c.username})`;
          return {
            ...c,
            walletBalance: Math.max(0, Number((c.walletBalance + signedAmount).toFixed(2)))
          };
        }
        return c;
      })
    );

    const newTx: WalletTransaction = {
      id: `tx_adj_${Date.now()}`,
      userId: data.targetUserId,
      type: data.type,
      amount: signedAmount,
      description: `Audited ${data.type.toUpperCase()}: ${data.reason}${data.referenceId ? ` (Ref: ${data.referenceId})` : ''}`,
      status: data.type === 'refund' ? 'refunded' : 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceId: data.referenceId,
      authorizedByAdminId: currentUser.id,
      adjustmentReason: data.reason
    };

    setTransactions(prev => [newTx, ...prev]);

    logAdminAction({
      category: data.type === 'refund' ? 'refund_decision' : 'financial_action',
      action: `Issued Audited ${data.type.toUpperCase()} (${signedAmount >= 0 ? '+' : ''}$${signedAmount.toFixed(2)})`,
      targetType: 'WalletLedger',
      targetId: newTx.id,
      targetLabel,
      details: `Reason: ${data.reason}${data.referenceId ? ` · Reference: ${data.referenceId}` : ''}`,
      severity: 'warning'
    });

    return { success: true };
  };

  const adminUpdateReport = (
    reportId: string,
    updates: {
      status?: ModerationReport['status'];
      assignedModeratorId?: string;
      assignedModeratorName?: string;
      actionTaken?: string;
    }
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return { success: false, error: 'Unauthorized: Requires Moderator or Admin privileges.' };
    }

    const rep = reports.find(r => r.id === reportId);
    if (!rep) return { success: false, error: 'Report not found.' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const historyNote = updates.actionTaken
      ? `Resolution: ${updates.actionTaken}`
      : updates.status
      ? `Status changed to ${updates.status.toUpperCase()}`
      : updates.assignedModeratorName
      ? `Assigned to ${updates.assignedModeratorName}`
      : 'Updated report';

    setReports(prev =>
      prev.map(r =>
        r.id === reportId
          ? {
              ...r,
              ...updates,
              actionHistory: [
                ...(r.actionHistory || []),
                {
                  timestamp: nowStr,
                  actor: currentUser.name,
                  action: historyNote
                }
              ]
            }
          : r
      )
    );

    logAdminAction({
      category: 'content_moderation',
      action: `Moderation Report #${reportId}: ${historyNote}`,
      targetType: rep.targetType,
      targetId: rep.targetId,
      targetLabel: rep.targetTitle,
      details: updates.actionTaken || `Report status: ${updates.status || rep.status}`,
      severity: updates.status === 'escalated' ? 'warning' : 'info'
    });

    return { success: true };
  };

  const adminUpdateSupportTicket = (
    ticketId: string,
    updates: {
      status?: SupportTicket['status'];
      priority?: SupportTicket['priority'];
      assignedAdminId?: string;
      assignedAdminName?: string;
      replyMessage?: string;
    }
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'support_admin', 'finance_admin'])) {
      return { success: false, error: 'Unauthorized: Requires Support Admin, Finance Admin, or Admin privileges.' };
    }

    const ticket = supportTickets.find(t => t.id === ticketId);
    if (!ticket) return { success: false, error: 'Support ticket not found.' };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

    setSupportTickets(prev =>
      prev.map(t => {
        if (t.id !== ticketId) return t;
        const nextMessages = updates.replyMessage?.trim()
          ? [
              ...t.messages,
              {
                id: `tm_${Date.now()}`,
                senderId: currentUser.id,
                senderName: `${currentUser.name} (ACOVON Support)`,
                senderRole: 'admin' as const,
                message: updates.replyMessage.trim(),
                timestamp: nowStr
              }
            ]
          : t.messages;

        return {
          ...t,
          status: updates.status ?? t.status,
          priority: updates.priority ?? t.priority,
          assignedAdminId: updates.assignedAdminId ?? t.assignedAdminId,
          assignedAdminName: updates.assignedAdminName ?? t.assignedAdminName,
          updatedAt: nowStr,
          messages: nextMessages
        };
      })
    );

    if (updates.replyMessage?.trim()) {
      setNotifications(prev => [
        {
          id: `notif_sup_${Date.now()}`,
          userId: ticket.userId,
          type: 'system',
          title: `Support Ticket #${ticket.id} Update`,
          message: `ACOVON Support replied to "${ticket.subject}": "${updates.replyMessage?.slice(0, 80)}..."`,
          read: false,
          createdAt: 'Just now'
        },
        ...prev
      ]);
    }

    logAdminAction({
      category: 'user_account',
      action: `Updated Support Ticket #${ticketId} (${updates.status || ticket.status})`,
      targetType: 'SupportTicket',
      targetId: ticketId,
      targetLabel: `${ticket.userName}: ${ticket.subject}`,
      details: updates.replyMessage
        ? `Replied: "${updates.replyMessage.slice(0, 80)}"`
        : `Priority: ${updates.priority || ticket.priority} · Assigned: ${updates.assignedAdminName || ticket.assignedAdminName || 'Unassigned'}`,
      severity: 'info'
    });

    return { success: true };
  };

  const adminManagePromotion = (
    promoId: string,
    status: PromotionCampaign['status'],
    notes?: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return { success: false, error: 'Unauthorized: Requires Admin privileges.' };
    }

    const promo = promotions.find(p => p.id === promoId);
    if (!promo) return { success: false, error: 'Promotion campaign not found.' };

    setPromotions(prev =>
      prev.map(p => (p.id === promoId ? { ...p, status, adminNotes: notes || p.adminNotes } : p))
    );

    if (status === 'rejected' && promo.status !== 'rejected') {
      // Refund promotion budget back to creator wallet
      setCreators(prev =>
        prev.map(c =>
          c.id === promo.creatorId
            ? { ...c, walletBalance: Number((c.walletBalance + promo.budget).toFixed(2)) }
            : c
        )
      );
      setTransactions(prev => [
        {
          id: `tx_promo_ref_${Date.now()}`,
          userId: promo.creatorId,
          type: 'refund',
          amount: promo.budget,
          description: `Refunded Rejected Promotion Campaign: ${promo.packageTitle}`,
          status: 'refunded',
          createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
          authorizedByAdminId: currentUser.id
        },
        ...prev
      ]);
    }

    logAdminAction({
      category: 'platform_settings',
      action: `Set Creator Promotion Campaign #${promoId} to ${status.toUpperCase()}`,
      targetType: 'PromotionCampaign',
      targetId: promoId,
      targetLabel: `${promo.creatorName}: ${promo.packageTitle} ($${promo.budget})`,
      details: notes || `Campaign status updated to ${status}`,
      severity: 'info'
    });

    return { success: true };
  };

  const adminManageSubscription = (
    subscriptionId: string,
    action: 'cancel' | 'reactivate' | 'refund_last_cycle',
    reason?: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'finance_admin', 'support_admin'])) {
      return { success: false, error: 'Unauthorized.' };
    }

    const sub = subscriptions.find(s => s.id === subscriptionId);
    if (!sub) return { success: false, error: 'Subscription not found.' };

    if (action === 'cancel') {
      setSubscriptions(prev =>
        prev.map(s => (s.id === subscriptionId ? { ...s, status: 'cancelled', autoRenew: false } : s))
      );
    } else if (action === 'reactivate') {
      setSubscriptions(prev =>
        prev.map(s => (s.id === subscriptionId ? { ...s, status: 'active', autoRenew: true } : s))
      );
    } else if (action === 'refund_last_cycle') {
      setSubscriptions(prev =>
        prev.map(s => (s.id === subscriptionId ? { ...s, status: 'cancelled', autoRenew: false } : s))
      );
      adminCreateFinancialAdjustment({
        targetUserId: sub.fanId,
        type: 'refund',
        amount: sub.monthlyPrice,
        reason: reason || `Admin subscription refund for ${sub.tierName}`,
        referenceId: sub.id
      });
    }

    logAdminAction({
      category: action === 'refund_last_cycle' ? 'refund_decision' : 'user_account',
      action: `Subscription #${subscriptionId} Action: ${action.toUpperCase()}`,
      targetType: 'Subscription',
      targetId: subscriptionId,
      targetLabel: `${sub.tierName} ($${sub.monthlyPrice}/mo)`,
      details: reason || `Admin executed ${action} on subscription #${subscriptionId}`,
      severity: 'info'
    });

    return { success: true };
  };

  const updatePlatformConfig = (updates: Partial<PlatformConfig>): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return { success: false, error: 'Unauthorized: Platform configuration requires Super Admin or Admin role.' };
    }

    setPlatformConfig(prev => {
      const next = { ...prev, ...updates };
      return next;
    });

    logAdminAction({
      category: 'platform_settings',
      action: `Updated Global Platform Configuration`,
      targetType: 'PlatformConfig',
      targetId: 'acovon_config',
      targetLabel: 'Global Platform Settings',
      details: `Modified fields: ${Object.keys(updates).join(', ')}`,
      severity: 'warning'
    });

    return { success: true };
  };

  const createPromotionCampaign = (data: Omit<PromotionCampaign, 'id' | 'impressions' | 'clicks' | 'profileVisits' | 'status' | 'startDate' | 'endDate'>) => {
    if (currentUser.walletBalance < data.budget) {
      return { success: false, error: 'Insufficient balance to launch promotion campaign.' };
    }

    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - data.budget).toFixed(2))
    }));

    const newCampaign: PromotionCampaign = {
      ...data,
      id: `promo_${Date.now()}`,
      impressions: 0,
      clicks: 0,
      profileVisits: 0,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + data.durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    setPromotions(prev => [newCampaign, ...prev]);

    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'promotion_spend',
      amount: -data.budget,
      description: `Creator Campaign: ${data.packageTitle}`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setTransactions(prev => [tx, ...prev]);

    return { success: true };
  };

  const updateCreatorProfile = (creatorId: string, updates: Partial<CreatorProfile>): { success: boolean; error?: string } => {
    const isOwner = currentUser.id === creatorId;
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized: You can only edit your own creator profile.' };
    }

    const updatedTimestamp = new Date().toISOString();
    const finalUpdates = {
      ...updates,
      profileUpdatedAt: updatedTimestamp
    };

    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return { ...c, ...finalUpdates };
      }
      return c;
    }));

    setUsers(prev => {
      if (!prev[creatorId]) return prev;
      return {
        ...prev,
        [creatorId]: {
          ...prev[creatorId],
          ...(updates.name ? { name: updates.name } : {}),
          ...(updates.username ? { username: updates.username } : {}),
          ...(updates.avatar ? { avatar: updates.avatar } : {})
        }
      };
    });

    if (currentUser.id === creatorId) {
      setCurrentUser(prev => {
        const updated = { ...prev, ...finalUpdates };
        try {
          localStorage.setItem('acovon_current_user', JSON.stringify(updated));
        } catch {}
        return updated;
      });
    }

    // Also update author info on posts if name, avatar, or username was updated
    if (updates.name || updates.avatar || updates.username) {
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.creatorId === creatorId) {
          return {
            ...p,
            creatorName: updates.name || p.creatorName,
            creatorAvatar: updates.avatar || p.creatorAvatar,
            creatorUsername: updates.username || p.creatorUsername
          };
        }
        return p;
      }));
    }

    return { success: true };
  };

  const addCreatorSubscriptionPlan = (
    creatorId: string, 
    planData: Omit<CreatorTier, 'id' | 'createdAt' | 'updatedAt' | 'subscriberCount'>
  ): { success: boolean; error?: string; plan?: CreatorTier } => {
    const isOwner = currentUser.id === creatorId;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized: You can only create plans for your own profile.' };
    }

    if (!planData.name || !planData.name.trim()) {
      return { success: false, error: 'Plan name is required.' };
    }
    if (planData.price <= 0) {
      return { success: false, error: 'Monthly price must be greater than $0.00.' };
    }

    const newTier: CreatorTier = {
      ...planData,
      id: `tier_${creatorId}_${Date.now()}`,
      isActive: planData.isActive !== false,
      subscriberCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        const existingTiers = c.tiers || [];
        return {
          ...c,
          tiers: [...existingTiers, newTier]
        };
      }
      return c;
    }));

    if (currentUser.id === creatorId) {
      setCurrentUser(prev => {
        const c = prev as CreatorProfile;
        const updated = {
          ...c,
          tiers: [...(c.tiers || []), newTier]
        };
        try { localStorage.setItem('acovon_current_user', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    return { success: true, plan: newTier };
  };

  const updateCreatorSubscriptionPlan = (
    creatorId: string, 
    planId: string, 
    updates: Partial<CreatorTier>
  ): { success: boolean; error?: string } => {
    const isOwner = currentUser.id === creatorId;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized: You can only edit your own plans.' };
    }

    const now = new Date().toISOString();

    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          tiers: (c.tiers || []).map(t => {
            if (t.id === planId) {
              return { ...t, ...updates, updatedAt: now };
            }
            return t;
          })
        };
      }
      return c;
    }));

    if (currentUser.id === creatorId) {
      setCurrentUser(prev => {
        const c = prev as CreatorProfile;
        const updated = {
          ...c,
          tiers: (c.tiers || []).map(t => t.id === planId ? { ...t, ...updates, updatedAt: now } : t)
        };
        try { localStorage.setItem('acovon_current_user', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    return { success: true };
  };

  const deleteCreatorSubscriptionPlan = (
    creatorId: string, 
    planId: string
  ): { success: boolean; error?: string } => {
    const isOwner = currentUser.id === creatorId;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized.' };
    }

    const activeSubscribersCount = subscriptions.filter(
      s => s.creatorId === creatorId && s.tierId === planId && s.status === 'active'
    ).length;

    if (activeSubscribersCount > 0) {
      // Deactivate instead of destructive deletion to preserve billing agreements
      setCreators(prev => prev.map(c => {
        if (c.id === creatorId) {
          return {
            ...c,
            tiers: (c.tiers || []).map(t => t.id === planId ? { ...t, isActive: false, updatedAt: new Date().toISOString() } : t)
          };
        }
        return c;
      }));
      return { 
        success: true, 
        error: `Plan has ${activeSubscribersCount} active subscribers. To preserve billing commitments, the plan has been deactivated from public discovery rather than deleted.` 
      };
    }

    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          tiers: (c.tiers || []).filter(t => t.id !== planId)
        };
      }
      return c;
    }));

    if (currentUser.id === creatorId) {
      setCurrentUser(prev => {
        const c = prev as CreatorProfile;
        const updated = {
          ...c,
          tiers: (c.tiers || []).filter(t => t.id !== planId)
        };
        try { localStorage.setItem('acovon_current_user', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    return { success: true };
  };

  const toggleCreatorSubscriptionPlanActive = (
    creatorId: string, 
    planId: string
  ): { success: boolean; error?: string; isActive?: boolean } => {
    const isOwner = currentUser.id === creatorId;
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized.' };
    }

    let nextState = true;
    setCreators(prev => prev.map(c => {
      if (c.id === creatorId) {
        return {
          ...c,
          tiers: (c.tiers || []).map(t => {
            if (t.id === planId) {
              nextState = t.isActive === false ? true : false;
              return { ...t, isActive: nextState, updatedAt: new Date().toISOString() };
            }
            return t;
          })
        };
      }
      return c;
    }));

    if (currentUser.id === creatorId) {
      setCurrentUser(prev => {
        const c = prev as CreatorProfile;
        const updated = {
          ...c,
          tiers: (c.tiers || []).map(t => t.id === planId ? { ...t, isActive: nextState, updatedAt: new Date().toISOString() } : t)
        };
        try { localStorage.setItem('acovon_current_user', JSON.stringify(updated)); } catch {}
        return updated;
      });
    }

    return { success: true, isActive: nextState };
  };

  const updateCreatorPricing = (
    creatorId: string, 
    pricing: {
      callRatePerMinute?: number;
      privateVideoRate?: number;
      customRequestBasePrice?: number;
      customRequestDeliveryDays?: number;
      customRequestTerms?: string;
      paidMessagePrice?: number;
      livestreamTicketPrice?: number;
      isLiveForCalls?: boolean;
      instantCallsEnabled?: boolean;
      minCallMinutes?: number;
      maxCallMinutes?: number;
      acceptingCustomRequests?: boolean;
    }
  ): { success: boolean; error?: string } => {
    const isOwner = currentUser.id === creatorId;
    const isAdmin = currentUser.role === 'admin';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized: You can only edit your own pricing.' };
    }

    return updateCreatorProfile(creatorId, pricing);
  };

  // ========================================================
  // Creator Stories & Status Methods
  // ========================================================
  const getActiveCreatorStatuses = (creatorId: string): CreatorStatus[] => {
    const nowTime = Date.now();
    return statuses
      .filter(s => {
        if (s.creatorId !== creatorId) return false;
        if (s.isArchived) return false;
        if (s.isReported && s.reportReason?.includes('removed')) return false;
        const expTime = new Date(s.expiresAt).getTime();
        return expTime > nowTime;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  };

  const hasUnseenStatus = (creatorId: string): boolean => {
    const active = getActiveCreatorStatuses(creatorId);
    if (active.length === 0) return false;
    return active.some(s => !viewedStatusIds.includes(s.id));
  };

  const canUserViewStatus = (status: CreatorStatus, userId?: string): { canView: boolean; reason?: 'follower_only' | 'subscriber_only' | 'tier_only' } => {
    const user = userId ? (users[userId] || creators.find(c => c.id === userId) || currentUser) : currentUser;
    if (user.id === status.creatorId || user.role === 'admin' || user.role === 'moderator') {
      return { canView: true };
    }

    if (status.audience === 'public') {
      return { canView: true };
    }

    if (status.audience === 'followers') {
      const isFollow = following.includes(status.creatorId);
      const isSub = subscriptions.some(s => s.fanId === user.id && s.creatorId === status.creatorId && s.status === 'active');
      if (isFollow || isSub) return { canView: true };
      return { canView: false, reason: 'follower_only' };
    }

    if (status.audience === 'subscribers') {
      const isSub = subscriptions.some(s => s.fanId === user.id && s.creatorId === status.creatorId && s.status === 'active');
      if (isSub) return { canView: true };
      return { canView: false, reason: 'subscriber_only' };
    }

    if (status.audience === 'selected_plan') {
      const activeSub = subscriptions.find(s => s.fanId === user.id && s.creatorId === status.creatorId && s.status === 'active');
      const allowedTiers = status.allowedTierIds || [];
      if (activeSub && (allowedTiers.length === 0 || allowedTiers.includes(activeSub.tierId))) {
        return { canView: true };
      }
      return { canView: false, reason: 'tier_only' };
    }

    return { canView: true };
  };

  const publishStatus = (
    statusData: Omit<CreatorStatus, 'id' | 'createdAt' | 'expiresAt' | 'viewsCount' | 'uniqueViews' | 'reactions' | 'replies'>
  ): { success: boolean; error?: string; status?: CreatorStatus } => {
    const isCreatorRole = currentUser.role === 'creator' || activeRole === 'creator';
    if (!isCreatorRole) {
      return { success: false, error: 'Only approved creator accounts can publish stories.' };
    }

    const createdTime = Date.now();
    const expiresTime = createdTime + 24 * 3600 * 1000; // 24-hour lifetime

    const newStatus: CreatorStatus = {
      ...statusData,
      id: `status_${currentUser.id}_${createdTime}`,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorUsername: currentUser.username,
      creatorAvatar: currentUser.avatar,
      createdAt: new Date(createdTime).toISOString(),
      expiresAt: new Date(expiresTime).toISOString(),
      viewsCount: 0,
      uniqueViews: [],
      reactions: [],
      replies: []
    };

    setStatuses(prev => [newStatus, ...prev]);

    // System notification
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      type: 'creator_post',
      title: 'New Story Published',
      message: `Your status is live for the next 24 hours to your ${statusData.audience.replace('_', ' ')} audience.`,
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true, status: newStatus };
  };

  const deleteStatus = (statusId: string): { success: boolean; error?: string } => {
    setStatuses(prev => prev.filter(s => s.id !== statusId));
    return { success: true };
  };

  const markStatusViewed = (statusId: string) => {
    setViewedStatusIds(prev => prev.includes(statusId) ? prev : [...prev, statusId]);

    setStatuses(prev => prev.map(s => {
      if (s.id === statusId) {
        const alreadyViewed = s.uniqueViews.some(v => v.userId === currentUser.id);
        if (alreadyViewed) return s;
        const newView: StatusView = {
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          viewedAt: 'Just now'
        };
        return {
          ...s,
          viewsCount: s.viewsCount + 1,
          uniqueViews: [newView, ...s.uniqueViews]
        };
      }
      return s;
    }));
  };

  const reactToStatus = (statusId: string, emoji: string): { success: boolean; error?: string } => {
    const targetStatus = statuses.find(s => s.id === statusId);
    if (!targetStatus) return { success: false, error: 'Status not found' };

    const reaction: StatusReaction = {
      id: `react_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      emoji,
      createdAt: 'Just now'
    };

    setStatuses(prev => prev.map(s => {
      if (s.id === statusId) {
        return {
          ...s,
          reactions: [reaction, ...s.reactions]
        };
      }
      return s;
    }));

    if (targetStatus.creatorId !== currentUser.id) {
      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: targetStatus.creatorId,
        type: 'post_like',
        title: 'New Story Reaction',
        message: `${currentUser.name} reacted with ${emoji} to your story!`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [notif, ...prev]);
    }

    return { success: true };
  };

  const replyToStatus = (statusId: string, replyText: string): { success: boolean; error?: string } => {
    if (!replyText.trim()) return { success: false, error: 'Reply text cannot be empty' };
    const targetStatus = statuses.find(s => s.id === statusId);
    if (!targetStatus) return { success: false, error: 'Status not found' };

    const replyItem: StatusReply = {
      id: `rep_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      text: replyText.trim(),
      createdAt: 'Just now'
    };

    setStatuses(prev => prev.map(s => {
      if (s.id === statusId) {
        return {
          ...s,
          replies: [replyItem, ...s.replies]
        };
      }
      return s;
    }));

    // Attach reference to the status in private conversation
    const statusRefText = targetStatus.caption 
      ? `[Replying to story: "${targetStatus.caption.slice(0, 45)}..."]\n${replyText.trim()}`
      : `[Replying to story]\n${replyText.trim()}`;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: currentUser.id,
      recipientId: targetStatus.creatorId,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role,
      content: statusRefText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isUnlocked: true,
      read: false
    };

    setMessages(prev => {
      const threadKey = [currentUser.id, targetStatus.creatorId].sort().join('_');
      const currentThread = prev[threadKey] || [];
      return {
        ...prev,
        [threadKey]: [...currentThread, newMsg]
      };
    });

    if (targetStatus.creatorId !== currentUser.id) {
      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        userId: targetStatus.creatorId,
        type: 'message_received',
        title: 'Story Reply Received',
        message: `${currentUser.name} replied to your story: "${replyText.slice(0, 60)}"`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [notif, ...prev]);
    }

    return { success: true };
  };

  const reportStatus = (statusId: string, reason: string): { success: boolean } => {
    setStatuses(prev => prev.map(s => s.id === statusId ? { ...s, isReported: true, reportReason: reason } : s));
    const newReport: ModerationReport = {
      id: `report_status_${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.name,
      targetType: 'status',
      targetId: statusId,
      targetTitle: 'Creator Status Update',
      reason: reason,
      details: `User reported story update: ${reason}`,
      status: 'open',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
    };
    setReports(prev => [newReport, ...prev]);
    return { success: true };
  };

  const removeReportedStatus = (statusId: string) => {
    setStatuses(prev => prev.filter(s => s.id !== statusId));
  };



  // Acovon Live Handlers
  const canUserAccessLivestream = (stream: Livestream, userId?: string) => {
    const user = userId ? (users[userId] || creators.find(c => c.id === userId) || currentUser) : currentUser;
    
    // Creator of the stream or platform staff always has access
    if (user.id === stream.creatorId || user.role === 'admin' || user.role === 'moderator') {
      return { canAccess: true };
    }

    // Mode 1: Public
    if (stream.accessMode === 'public') {
      return { canAccess: true };
    }

    // Mode 2: All Subscribers Only
    if (stream.accessMode === 'all_subscribers') {
      const isSub = subscriptions.some(s => s.fanId === user.id && s.creatorId === stream.creatorId && s.status === 'active');
      if (isSub) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'subscription_required' as const };
    }

    // Mode 3: Selected Subscription Plan
    if (stream.accessMode === 'selected_plan') {
      const activeSub = subscriptions.find(s => s.fanId === user.id && s.creatorId === stream.creatorId && s.status === 'active');
      const allowedTiers = stream.allowedTierIds || [];
      if (activeSub && (allowedTiers.length === 0 || allowedTiers.includes(activeSub.tierId))) {
        return { canAccess: true };
      }
      const streamCreator = creators.find(c => c.id === stream.creatorId);
      const tierNames = streamCreator?.tiers
        .filter(t => allowedTiers.includes(t.id))
        .map(t => t.name) || ['Eligible Tier'];
      return {
        canAccess: false,
        reason: 'tier_upgrade_required' as const,
        requiredTierNames: tierNames
      };
    }

    // Mode 4: Pay-Per-View Private Livestream
    if (stream.accessMode === 'pay_per_view') {
      if (stream.purchasedViewerIds && stream.purchasedViewerIds.includes(user.id)) {
        return { canAccess: true };
      }
      return {
        canAccess: false,
        reason: 'ppv_purchase_required' as const,
        price: stream.ppvTicketPrice || 9.99
      };
    }

    // Mode 5: Private Invitation Livestream
    if (stream.accessMode === 'private_invite') {
      if (stream.allowedUserIds?.includes(user.id) || unlockedInviteStreams.includes(stream.id)) {
        return { canAccess: true };
      }
      return {
        canAccess: false,
        reason: 'invite_required' as const
      };
    }

    return { canAccess: true };
  };

  const purchaseLivestreamTicket = (streamId: string) => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream not found' };
    const price = stream.ppvTicketPrice || 9.99;

    if (currentUser.walletBalance < price) {
      return { success: false, error: `Insufficient balance. Please deposit at least $${price.toFixed(2)} to purchase entry.` };
    }

    // Deduct from buyer
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - price).toFixed(2))
    }));

    // Platform commission (from commission settings)
    const commissionRate = commissionSettings.ppvRate || 0.20;
    const platformFee = Number((price * commissionRate).toFixed(2));
    const netCreator = Number((price - platformFee).toFixed(2));

    // Credit creator
    setCreators(prev => prev.map(c => {
      if (c.id === stream.creatorId) {
        return {
          ...c,
          walletBalance: Number((c.walletBalance + netCreator).toFixed(2)),
          totalEarnings: Number((c.totalEarnings + netCreator).toFixed(2))
        };
      }
      return c;
    }));

    // Record transaction
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}`,
      userId: currentUser.id,
      type: 'ppv_purchase',
      amount: -price,
      description: `Live Ticket: ${stream.title}`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      platformFee,
      netCreatorEarnings: netCreator
    };
    setTransactions(prev => [tx, ...prev]);

    // Update stream
    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId) {
        return {
          ...s,
          viewerCount: s.viewerCount + 1,
          totalRevenue: Number((s.totalRevenue + price).toFixed(2)),
          purchasedViewerIds: Array.from(new Set([...s.purchasedViewerIds, currentUser.id]))
        };
      }
      return s;
    }));

    // Notification
    const notif: AppNotification = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      type: 'livestream',
      title: 'Ticket Purchased',
      message: `You now have full access to "${stream.title}"!`,
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true };
  };

  const unlockInviteStream = (streamId: string, passcode: string) => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream not found' };
    if (!stream.privatePasscode) {
      setUnlockedInviteStreams(prev => [...prev, streamId]);
      return { success: true };
    }
    if (stream.privatePasscode.trim().toLowerCase() === passcode.trim().toLowerCase()) {
      setUnlockedInviteStreams(prev => Array.from(new Set([...prev, streamId])));
      return { success: true };
    }
    return { success: false, error: 'Invalid invitation passcode. Please check with the creator.' };
  };

  const sendLiveChatMessage = (
    streamId: string,
    message: string,
    type: LiveChatMessage['type'] = 'standard',
    amountPaid: number = 0,
    giftData?: VirtualGift
  ) => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream not found' };

    if (amountPaid > 0) {
      if (currentUser.walletBalance < amountPaid) {
        return { success: false, error: `Insufficient wallet balance ($${amountPaid.toFixed(2)} required)` };
      }

      setCurrentUser(prev => ({
        ...prev,
        walletBalance: Number((prev.walletBalance - amountPaid).toFixed(2))
      }));

      const platformFee = Number((amountPaid * 0.20).toFixed(2));
      const netCreator = Number((amountPaid - platformFee).toFixed(2));

      setCreators(prev => prev.map(c => {
        if (c.id === stream.creatorId) {
          return {
            ...c,
            walletBalance: Number((c.walletBalance + netCreator).toFixed(2)),
            totalEarnings: Number((c.totalEarnings + netCreator).toFixed(2))
          };
        }
        return c;
      }));

      const tx: WalletTransaction = {
        id: `tx_${Date.now()}`,
        userId: currentUser.id,
        type: 'tip',
        amount: -amountPaid,
        description: `Live ${type === 'gift' ? 'Gift' : type === 'priority_question' ? 'Priority Question' : 'Highlight'} to ${stream.creatorName}`,
        status: 'completed',
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        platformFee,
        netCreatorEarnings: netCreator
      };
      setTransactions(prev => [tx, ...prev]);

      setLivestreams(prev => prev.map(s => {
        if (s.id === streamId) {
          return {
            ...s,
            totalRevenue: Number((s.totalRevenue + amountPaid).toFixed(2))
          };
        }
        return s;
      }));
    }

    // Determine sender role
    let senderRole: LiveChatMessage['senderRole'] = 'viewer';
    if (currentUser.id === stream.creatorId) {
      senderRole = 'creator';
    } else if (currentUser.role === 'admin' || currentUser.role === 'moderator') {
      senderRole = 'moderator';
    } else {
      const activeSub = subscriptions.find(s => s.fanId === currentUser.id && s.creatorId === stream.creatorId && s.status === 'active');
      if (activeSub) {
        senderRole = activeSub.tierName.toLowerCase().includes('vip') || activeSub.tierName.toLowerCase().includes('patron') ? 'vip' : 'subscriber';
      }
    }

    const newMsg: LiveChatMessage = {
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      streamId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole,
      message,
      type,
      amountPaid: amountPaid > 0 ? amountPaid : undefined,
      giftData,
      timestamp: 'Just now'
    };

    setLiveChat(prev => ({
      ...prev,
      [streamId]: [...(prev[streamId] || []), newMsg]
    }));

    return { success: true };
  };

  const sendLiveGift = (streamId: string, giftId: string) => {
    const gift = MOCK_GIFTS.find(g => g.id === giftId);
    if (!gift) return { success: false, error: 'Gift not found' };

    return sendLiveChatMessage(
      streamId,
      `Sent a ${gift.name} ${gift.icon}`,
      'gift',
      gift.price,
      gift
    );
  };

  const sendLiveTip = (streamId: string, amount: number, note?: string) => {
    if (amount <= 0) return { success: false, error: 'Invalid tip amount' };
    const content = note ? `Tipped $${amount.toFixed(2)}: "${note}"` : `Tipped $${amount.toFixed(2)}`;
    return sendLiveChatMessage(
      streamId,
      content,
      'tip',
      amount
    );
  };

  const createLivestream = (streamData: {
    title: string;
    description: string;
    coverImage: string;
    category: string;
    tags: string[];
    accessMode: LivestreamAccessMode;
    allowedTierIds?: string[];
    ppvTicketPrice?: number;
    privatePasscode?: string;
    allowedUserIds?: string[];
    expectedDurationMinutes: number;
    videoStreamUrl?: string;
    scheduledFor?: string;
    settings: Livestream['settings'];
    recordingSettings?: RecordingSettings;
  }) => {
    // Role Authorization Guard: Only approved, active creators can create livestreams
    if (!isCurrentUserApprovedCreator) {
      throw new Error("Authorization Denied: Only approved, active creators can broadcast live sessions.");
    }

    const isScheduled = !!streamData.scheduledFor;
    const creatorUser = currentUser;
    const recSettings: RecordingSettings = streamData.recordingSettings || {
      mode: 'disabled',
      replayPermission: 'public'
    };

    const newStream: Livestream = {
      id: `live_${Date.now()}`,
      creatorId: creatorUser.id,
      creatorName: creatorUser.name,
      creatorUsername: creatorUser.username,
      creatorAvatar: creatorUser.avatar,
      title: streamData.title,
      description: streamData.description,
      coverImage: streamData.coverImage || '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
      category: streamData.category,
      tags: streamData.tags,
      accessMode: streamData.accessMode,
      allowedTierIds: streamData.allowedTierIds,
      ppvTicketPrice: streamData.ppvTicketPrice,
      privatePasscode: streamData.privatePasscode,
      allowedUserIds: streamData.allowedUserIds,
      status: isScheduled ? 'scheduled' : 'live',
      viewerCount: isScheduled ? 0 : 1,
      totalRevenue: 0,
      startedAt: isScheduled ? undefined : 'Just now',
      scheduledFor: streamData.scheduledFor,
      expectedDurationMinutes: streamData.expectedDurationMinutes,
      videoStreamUrl: streamData.videoStreamUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      settings: streamData.settings,
      purchasedViewerIds: [],
      recordingSettings: recSettings,
      recordingStatus: recSettings.mode === 'disabled' ? 'not_recorded' : isScheduled ? 'not_recorded' : 'recording',
      isReplayPublished: recSettings.mode !== 'disabled',
      replayViewsCount: 0,
      replayPurchasesCount: 0,
      replayGrossRevenue: 0,
      replayPlatformFee: 0,
      replayNetRevenue: 0,
      purchasedReplayUserIds: []
    };

    setLivestreams(prev => [newStream, ...prev]);
    if (!isScheduled) {
      setActiveLivestreamId(newStream.id);
    }
    return newStream;
  };

  const startBroadcast = (streamId: string) => {
    if (!isCurrentUserApprovedCreator) {
      console.warn("Authorization Denied: Only approved, active creators can broadcast live.");
      return;
    }
    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId) {
        const isRecEnabled = s.recordingSettings && s.recordingSettings.mode !== 'disabled';
        return {
          ...s,
          status: 'live',
          startedAt: 'Just now',
          recordingStatus: isRecEnabled ? 'recording' : 'not_recorded'
        };
      }
      return s;
    }));
  };

  const endBroadcast = (streamId: string) => {
    const targetStream = livestreams.find(s => s.id === streamId);
    const todayStr = new Date().toISOString().split('T')[0];

    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId) {
        const recMode = s.recordingSettings?.mode || 'disabled';
        if (recMode === 'disabled') {
          return {
            ...s,
            status: 'ended',
            endedAt: todayStr,
            recordingStatus: 'not_recorded',
            isReplayPublished: false
          };
        }

        const availDays = s.recordingSettings?.availabilityDays;
        const expiresStr =
          availDays && availDays !== 'unlimited'
            ? new Date(Date.now() + Number(availDays) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            : 'Unlimited';

        return {
          ...s,
          status: 'ended',
          endedAt: todayStr,
          recordingStatus: 'ready',
          isReplayPublished: true,
          recordingPublishedAt: todayStr,
          recordingExpiresAt: expiresStr
        };
      }
      return s;
    }));

    if (targetStream && targetStream.recordingSettings && targetStream.recordingSettings.mode !== 'disabled') {
      const modeLabel = targetStream.recordingSettings.mode === 'paid'
        ? `Paid Replay ($${(targetStream.recordingSettings.price || 9.99).toFixed(2)})`
        : 'Free Official Replay';

      setNotifications(prev => [
        {
          id: `notif_rec_ready_${Date.now()}`,
          userId: targetStream.creatorId,
          type: 'livestream',
          title: 'Official Livestream Recording Ready!',
          message: `Server recording for "${targetStream.title}" has finished processing and is now published as a ${modeLabel}.`,
          read: false,
          createdAt: 'Just now'
        },
        {
          id: `notif_rec_fan_${Date.now() + 1}`,
          userId: 'user_fan_1',
          type: 'livestream',
          title: `New Replay from ${targetStream.creatorName}`,
          message: `${targetStream.creatorName}'s broadcast "${targetStream.title}" has ended. The official recording is now available (${modeLabel}).`,
          read: false,
          createdAt: 'Just now'
        },
        ...prev
      ]);
    }
  };

  const canUserAccessReplay = (stream: Livestream, userId?: string) => {
    const user = userId ? (users[userId] || creators.find(c => c.id === userId) || currentUser) : currentUser;

    // Creator of stream or admin/moderator always has full replay access
    if (user.id === stream.creatorId || user.role === 'admin' || user.role === 'moderator') {
      return { canAccess: true };
    }

    // IMPORTANT: Existing buyers retain access even if creator later unpublishes or removes from future sale
    if (stream.purchasedReplayUserIds && stream.purchasedReplayUserIds.includes(user.id)) {
      return { canAccess: true };
    }

    // If creator explicitly included replay with live PPV ticket and fan bought the live ticket
    if (
      stream.recordingSettings?.includeReplayWithLiveTicket &&
      stream.purchasedViewerIds &&
      stream.purchasedViewerIds.includes(user.id)
    ) {
      return { canAccess: true };
    }

    // If recording was disabled or removed by admin/creator
    if (!stream.recordingSettings || stream.recordingSettings.mode === 'disabled' || stream.recordingStatus === 'removed') {
      return { canAccess: false, reason: 'recording_disabled' as const };
    }

    // If unpublished for new viewers
    if (stream.isReplayPublished === false || stream.recordingStatus === 'unpublished') {
      return { canAccess: false, reason: 'recording_unpublished' as const };
    }

    // Paid Recording Mode -> requires separate purchase
    if (stream.recordingSettings.mode === 'paid' || stream.recordingSettings.replayPermission === 'paid') {
      return {
        canAccess: false,
        reason: 'replay_purchase_required' as const,
        price: stream.recordingSettings.price || 9.99
      };
    }

    // Free Recording Mode -> verify audience permission
    const perm = stream.recordingSettings.replayPermission || 'public';
    if (perm === 'public') {
      return { canAccess: true };
    }

    if (perm === 'followers') {
      const isFol = following.includes(stream.creatorId);
      const isSub = subscriptions.some(s => s.fanId === user.id && s.creatorId === stream.creatorId && s.status === 'active');
      if (isFol || isSub) return { canAccess: true };
      return { canAccess: false, reason: 'follower_required' as const };
    }

    if (perm === 'subscribers') {
      const isSub = subscriptions.some(s => s.fanId === user.id && s.creatorId === stream.creatorId && s.status === 'active');
      if (isSub) return { canAccess: true };
      return { canAccess: false, reason: 'subscription_required' as const };
    }

    if (perm === 'selected_plan') {
      const activeSub = subscriptions.find(s => s.fanId === user.id && s.creatorId === stream.creatorId && s.status === 'active');
      const allowedTiers = stream.recordingSettings.allowedReplayTierIds || stream.allowedTierIds || [];
      if (activeSub && (allowedTiers.length === 0 || allowedTiers.includes(activeSub.tierId))) {
        return { canAccess: true };
      }
      const streamCreator = creators.find(c => c.id === stream.creatorId);
      const tierNames = streamCreator?.tiers
        .filter(t => allowedTiers.includes(t.id))
        .map(t => t.name) || ['VIP Tier'];
      return {
        canAccess: false,
        reason: 'tier_upgrade_required' as const,
        requiredTierNames: tierNames
      };
    }

    if (perm === 'private_invite') {
      if (stream.allowedUserIds?.includes(user.id) || unlockedInviteStreams.includes(stream.id)) {
        return { canAccess: true };
      }
      return { canAccess: false, reason: 'invite_required' as const };
    }

    return { canAccess: true };
  };

  const purchaseLivestreamRecording = (streamId: string): { success: boolean; error?: string } => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream recording not found.' };
    if (!stream.recordingSettings || stream.recordingSettings.mode === 'disabled') {
      return { success: false, error: 'Recording is not enabled for this broadcast.' };
    }

    // Prevent duplicate charges
    if (stream.purchasedReplayUserIds && stream.purchasedReplayUserIds.includes(currentUser.id)) {
      return { success: false, error: 'You have already unlocked this livestream recording.' };
    }

    const price = Number((stream.recordingSettings.price || 9.99).toFixed(2));
    if (currentUser.walletBalance < price) {
      return {
        success: false,
        error: `Insufficient wallet balance ($${currentUser.walletBalance.toFixed(2)}). Please deposit at least $${price.toFixed(2)} to unlock this recording.`
      };
    }

    // 1. Deduct from fan wallet
    setCurrentUser(prev => ({
      ...prev,
      walletBalance: Number((prev.walletBalance - price).toFixed(2))
    }));

    // 2. Calculate platform commission & creator net earnings
    const commissionRate = commissionSettings.ppvRate || 0.20;
    const platformFee = Number((price * commissionRate).toFixed(2));
    const netCreator = Number((price - platformFee).toFixed(2));

    // 3. Credit creator wallet & total earnings
    setCreators(prev => prev.map(c => {
      if (c.id === stream.creatorId) {
        return {
          ...c,
          walletBalance: Number((c.walletBalance + netCreator).toFixed(2)),
          totalEarnings: Number((c.totalEarnings + netCreator).toFixed(2))
        };
      }
      return c;
    }));

    // 4. Record wallet transaction
    const tx: WalletTransaction = {
      id: `tx_replay_${Date.now()}`,
      userId: currentUser.id,
      type: 'live_replay',
      amount: -price,
      description: `Official Live Recording: ${stream.title} (${stream.creatorName})`,
      status: 'completed',
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      referenceId: stream.id,
      platformFee,
      netCreatorEarnings: netCreator
    };
    setTransactions(prev => [tx, ...prev]);

    // 5. Record in fan's ContentPurchase library
    const purchaseRecord: ContentPurchase = {
      id: `pur_replay_${Date.now()}`,
      userId: currentUser.id,
      postId: stream.id,
      creatorId: stream.creatorId,
      amount: price,
      purchasedAt: new Date().toISOString().split('T')[0]
    };
    setPurchases(prev => [purchaseRecord, ...prev]);

    // 6. Update stream replay metrics & buyer list
    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId) {
        const existingBuyers = s.purchasedReplayUserIds || [];
        return {
          ...s,
          totalRevenue: Number((s.totalRevenue + price).toFixed(2)),
          replayPurchasesCount: (s.replayPurchasesCount || 0) + 1,
          replayGrossRevenue: Number(((s.replayGrossRevenue || 0) + price).toFixed(2)),
          replayPlatformFee: Number(((s.replayPlatformFee || 0) + platformFee).toFixed(2)),
          replayNetRevenue: Number(((s.replayNetRevenue || 0) + netCreator).toFixed(2)),
          purchasedReplayUserIds: Array.from(new Set([...existingBuyers, currentUser.id]))
        };
      }
      return s;
    }));

    // 7. Send notifications to fan and creator
    setNotifications(prev => [
      {
        id: `notif_replay_fan_${Date.now()}`,
        userId: currentUser.id,
        type: 'livestream',
        title: 'Official Recording Unlocked!',
        message: `You now have on-demand replay access to "${stream.title}" by ${stream.creatorName}. Added to your Purchased Replays library.`,
        read: false,
        createdAt: 'Just now'
      },
      {
        id: `notif_replay_creator_${Date.now() + 1}`,
        userId: stream.creatorId,
        type: 'livestream',
        title: 'Live Recording Purchased!',
        message: `${currentUser.name} purchased your official recording "${stream.title}" for $${price.toFixed(2)} (Net earned: $${netCreator.toFixed(2)}).`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const updateLivestreamRecording = (
    streamId: string,
    updates: {
      isReplayPublished?: boolean;
      recordingStatus?: RecordingStatus;
      mode?: RecordingMode;
      price?: number;
      availabilityDays?: number | 'unlimited';
      description?: string;
      replayPermission?: ReplayPermission;
      allowedReplayTierIds?: string[];
      includeReplayWithLiveTicket?: boolean;
    }
  ): { success: boolean; error?: string } => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Recording not found.' };

    const isOwner = currentUser.id === stream.creatorId;
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'moderator';
    if (!isOwner && !isAdmin) {
      return { success: false, error: 'Unauthorized: Only the stream creator or platform admin can modify recording settings.' };
    }

    if (updates.price !== undefined && (updates.price < 1.99 || updates.price > 500)) {
      return { success: false, error: 'Recording price must be between $1.99 and $500.00.' };
    }

    setLivestreams(prev => prev.map(s => {
      if (s.id !== streamId) return s;

      const currentRec: RecordingSettings = s.recordingSettings || {
        mode: 'free',
        replayPermission: 'public'
      };

      const nextMode = updates.mode ?? currentRec.mode;
      const nextPermission = updates.replayPermission ?? (nextMode === 'paid' ? 'paid' : currentRec.replayPermission);
      const nextAvail = updates.availabilityDays ?? currentRec.availabilityDays;
      const nextExpiresAt =
        nextAvail && nextAvail !== 'unlimited'
          ? new Date(Date.now() + Number(nextAvail) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          : nextAvail === 'unlimited'
          ? 'Unlimited'
          : s.recordingExpiresAt;

      const nextPublished = updates.isReplayPublished !== undefined ? updates.isReplayPublished : s.isReplayPublished;
      const nextStatus =
        updates.recordingStatus !== undefined
          ? updates.recordingStatus
          : nextPublished === false && s.recordingStatus === 'ready'
          ? 'unpublished'
          : nextPublished === true && s.recordingStatus === 'unpublished'
          ? 'ready'
          : s.recordingStatus;

      return {
        ...s,
        isReplayPublished: nextPublished,
        recordingStatus: nextStatus,
        recordingExpiresAt: nextExpiresAt,
        recordingSettings: {
          ...currentRec,
          mode: nextMode,
          price: updates.price !== undefined ? Number(updates.price.toFixed(2)) : currentRec.price,
          availabilityDays: nextAvail,
          description: updates.description !== undefined ? updates.description : currentRec.description,
          replayPermission: nextPermission,
          allowedReplayTierIds: updates.allowedReplayTierIds ?? currentRec.allowedReplayTierIds,
          includeReplayWithLiveTicket: updates.includeReplayWithLiveTicket ?? currentRec.includeReplayWithLiveTicket
        }
      };
    }));

    return { success: true };
  };

  const incrementReplayView = (streamId: string) => {
    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId) {
        return {
          ...s,
          replayViewsCount: (s.replayViewsCount || 0) + 1
        };
      }
      return s;
    }));
  };

  const createLivestreamClip = (streamId: string, clipTitle: string) => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream not found' };

    const defaultTitle = `${stream.creatorName} Live Highlight · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    const sanitizedTitle = clipTitle.trim() || defaultTitle;
    const clipId = `clip_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    const newClipPost: Post = {
      id: clipId,
      creatorId: stream.creatorId,
      creatorName: stream.creatorName,
      creatorUsername: stream.creatorUsername,
      creatorAvatar: stream.creatorAvatar,
      content: `🎬 Stream Highlight (0:30): "${sanitizedTitle}"\nCaptured during live session "${stream.title}" by @${currentUser.username}`,
      media: [
        {
          id: `media_${clipId}`,
          type: 'video',
          url: stream.videoStreamUrl,
          thumbnailUrl: stream.coverImage,
          durationSeconds: 30
        }
      ],
      visibility: 'public',
      isHighlight: true,
      highlightLabel: 'Highlight',
      clippedByUsername: currentUser.username,
      likesCount: 1,
      commentsCount: 0,
      isLiked: false,
      isPinned: false,
      createdAt: 'Just now',
      tags: ['Highlight', 'Clip', 'AcovonLive', stream.category]
    };

    // Save clip to creator's content gallery (posts)
    setPosts(prev => [newClipPost, ...prev]);

    // Send a live chat notification event
    const chatMsg: LiveChatMessage = {
      id: `c_clip_${Date.now()}`,
      streamId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.id === stream.creatorId ? 'creator' : 'viewer',
      message: `✂️ Clipped 30s Highlight: "${sanitizedTitle}" — saved to ${stream.creatorName}'s Content Gallery!`,
      type: 'highlighted',
      timestamp: 'Just now'
    };
    setLiveChat(prev => ({
      ...prev,
      [streamId]: [...(prev[streamId] || []), chatMsg]
    }));

    // Notify creator if clipped by viewer
    if (currentUser.id !== stream.creatorId) {
      const notif: AppNotification = {
        id: `notif_clip_${Date.now()}`,
        userId: stream.creatorId,
        type: 'livestream',
        title: 'New Highlight Clip Added!',
        message: `@${currentUser.username} clipped 30s of "${stream.title}" and saved it to your Content Gallery as a Highlight: "${sanitizedTitle}".`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [notif, ...prev]);
    }

    return { success: true, clipPost: newClipPost };
  };

  const launchLivePoll = (streamId: string, question: string, options: string[], durationSeconds: number = 180) => {
    const stream = livestreams.find(s => s.id === streamId);
    if (!stream) return { success: false, error: 'Livestream not found' };
    if (!question.trim()) return { success: false, error: 'Poll question cannot be empty' };

    const validOptions = options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) return { success: false, error: 'Please provide at least 2 options' };

    const pollId = `poll_${Date.now()}`;
    const newPoll: LivePoll = {
      id: pollId,
      streamId,
      creatorId: stream.creatorId,
      question: question.trim(),
      options: validOptions.map((opt, i) => ({
        id: `opt_${i + 1}_${Date.now()}`,
        text: opt,
        votes: 0
      })),
      totalVotes: 0,
      isActive: true,
      createdAt: 'Just now',
      durationSeconds,
      votedUserIds: {}
    };

    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId) {
        return { ...s, activePoll: newPoll };
      }
      return s;
    }));

    // Live chat broadcast message
    const chatMsg: LiveChatMessage = {
      id: `c_poll_${Date.now()}`,
      streamId,
      senderId: stream.creatorId,
      senderName: 'ACOVON LIVE',
      senderAvatar: stream.creatorAvatar,
      senderRole: 'creator',
      message: `📊 Live Poll Launched: "${question.trim()}" — Vote now on your screen!`,
      type: 'highlighted',
      timestamp: 'Just now'
    };
    setLiveChat(prev => ({
      ...prev,
      [streamId]: [...(prev[streamId] || []), chatMsg]
    }));

    return { success: true };
  };

  const voteLivePoll = (streamId: string, pollId: string, optionId: string) => {
    let success = false;
    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId && s.activePoll && s.activePoll.id === pollId) {
        const currentPoll = s.activePoll;
        if (!currentPoll.isActive) return s;

        const previousVote = currentPoll.votedUserIds?.[currentUser.id];
        if (previousVote === optionId) return s; // already voted this option

        const updatedOptions = currentPoll.options.map(opt => {
          if (opt.id === optionId) {
            return { ...opt, votes: opt.votes + 1 };
          }
          if (previousVote && opt.id === previousVote) {
            return { ...opt, votes: Math.max(0, opt.votes - 1) };
          }
          return opt;
        });

        const newTotal = previousVote ? currentPoll.totalVotes : currentPoll.totalVotes + 1;
        success = true;

        return {
          ...s,
          activePoll: {
            ...currentPoll,
            options: updatedOptions,
            totalVotes: newTotal,
            votedUserIds: {
              ...(currentPoll.votedUserIds || {}),
              [currentUser.id]: optionId
            }
          }
        };
      }
      return s;
    }));

    return { success };
  };

  const endLivePoll = (streamId: string) => {
    setLivestreams(prev => prev.map(s => {
      if (s.id === streamId && s.activePoll) {
        const winningOption = [...s.activePoll.options].sort((a, b) => b.votes - a.votes)[0];
        
        // Push chat notification with result
        const chatMsg: LiveChatMessage = {
          id: `c_poll_end_${Date.now()}`,
          streamId,
          senderId: s.creatorId,
          senderName: 'ACOVON LIVE',
          senderAvatar: s.creatorAvatar,
          senderRole: 'creator',
          message: `🏁 Live Poll Concluded! Top Choice: "${winningOption?.text || 'None'}" with ${winningOption?.votes || 0} votes (${s.activePoll.totalVotes} total).`,
          type: 'highlighted',
          timestamp: 'Just now'
        };
        setTimeout(() => {
          setLiveChat(p => ({
            ...p,
            [streamId]: [...(p[streamId] || []), chatMsg]
          }));
        }, 80);

        return {
          ...s,
          activePoll: {
            ...s.activePoll,
            isActive: false
          }
        };
      }
      return s;
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // ============================================================================
  // AUTOMATIC VIDEO COMPRESSION, OPTIMIZATION & ADAPTIVE STREAMING ENGINE
  // ============================================================================

  const saveVideoPlaybackPosition = (videoKey: string, seconds: number) => {
    if (!videoKey || isNaN(seconds) || seconds < 0) return;
    setVideoPlaybackPositions(prev => {
      const next = { ...prev, [videoKey]: seconds };
      try {
        localStorage.setItem('acovon_video_playback_positions', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const getVideoPlaybackPosition = (videoKey: string): number => {
    return videoPlaybackPositions[videoKey] || 0;
  };

  const computeAdaptiveLadder = (sourceWidth: number, sourceHeight: number): VideoResolution[] => {
    const shortEdge = Math.min(sourceWidth || 1920, sourceHeight || 1080);
    let ladder: VideoResolution[];
    if (shortEdge >= 2160) {
      ladder = ['4K', '1440p', '1080p', '720p', '480p', '360p'];
    } else if (shortEdge >= 1440) {
      ladder = ['1440p', '1080p', '720p', '480p', '360p'];
    } else if (shortEdge >= 1080) {
      ladder = ['1080p', '720p', '480p', '360p'];
    } else if (shortEdge >= 720) {
      ladder = ['720p', '480p', '360p'];
    } else if (shortEdge >= 480) {
      ladder = ['480p', '360p'];
    } else {
      ladder = ['360p'];
    }
    const filtered = ladder.filter(r => videoProcessingConfig.enabledResolutions.includes(r));
    return filtered.length > 0 ? filtered : ['360p'];
  };

  // Background worker queue that progresses active video optimization jobs across navigation
  useEffect(() => {
    const activeJobs = videoProcessingJobs.filter(
      j => j.jobStatus === 'queued' || j.jobStatus === 'processing'
    );
    if (activeJobs.length === 0) return;

    const stageSequence: { stage: VideoProcessingStage; minProgress: number }[] = [
      { stage: 'Uploading', minProgress: 12 },
      { stage: 'Upload Completed', minProgress: 26 },
      { stage: 'Processing', minProgress: 42 },
      { stage: 'Compressing', minProgress: 60 },
      { stage: 'Generating Playback Versions', minProgress: 76 },
      { stage: 'Generating Thumbnail', minProgress: 88 },
      { stage: 'Quality Verification', minProgress: 95 },
      { stage: 'Ready to Publish', minProgress: 100 }
    ];

    const timer = setInterval(() => {
      setVideoProcessingJobs(prevJobs => {
        let anyUpdated = false;
        const nextJobs = prevJobs.map(job => {
          if (job.jobStatus !== 'queued' && job.jobStatus !== 'processing') return job;
          anyUpdated = true;
          const nextProgress = Math.min(100, job.progressPercentage + 14);
          let nextStage: VideoProcessingStage = job.processingStage;
          for (const s of stageSequence) {
            if (nextProgress >= s.minProgress) {
              nextStage = s.stage;
            }
          }

          if (nextProgress >= 100) {
            const completedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
            const reductionRatio =
              videoProcessingConfig.targetQualityPreset === 'visually_lossless'
                ? 0.62
                : videoProcessingConfig.targetQualityPreset === 'balanced_high'
                ? 0.68
                : 0.74;
            const optSize = Math.max(
              1024 * 250,
              Math.round(job.originalFileSize * (1 - reductionRatio))
            );
            const savedBytes = Math.max(0, job.originalFileSize - optSize);

            // Finalize the associated VideoMediaRecord
            setVideoMediaRecords(prevRecords =>
              prevRecords.map(rec => {
                if (rec.id !== job.mediaId) return rec;
                const ladder = computeAdaptiveLadder(rec.originalWidth, rec.originalHeight);
                const optimizedRefs: Record<string, string> = {};
                const builtVariants: PlaybackVariant[] = ladder.map((res, idx) => {
                  const resHeightMap: Record<VideoResolution, number> = {
                    '4K': 2160,
                    '1440p': 1440,
                    '1080p': 1080,
                    '720p': 720,
                    '480p': 480,
                    '360p': 360
                  };
                  const h = resHeightMap[res];
                  const w =
                    rec.orientation === 'portrait'
                      ? Math.round((h * 9) / 16)
                      : rec.orientation === 'square'
                      ? h
                      : Math.round((h * 16) / 9);
                  const bitrateMap: Record<VideoResolution, number> = {
                    '4K': 14500,
                    '1440p': 8600,
                    '1080p': 4900,
                    '720p': 2600,
                    '480p': 1350,
                    '360p': 800
                  };
                  const codec: VideoCodec =
                    res === '4K' && videoProcessingConfig.enabledCodecs.includes('AV1')
                      ? 'AV1'
                      : (res === '1440p' || res === '1080p') &&
                        videoProcessingConfig.enabledCodecs.includes('H.265/HEVC')
                      ? 'H.265/HEVC'
                      : 'H.264';
                  const mUrl = `https://cdn.acovon.media/hls/${rec.id}/${res.toLowerCase()}.m3u8`;
                  optimizedRefs[res] = mUrl;
                  return {
                    id: `var_${rec.id}_${res}`,
                    mediaId: rec.id,
                    resolution: res,
                    width: w,
                    height: h,
                    codec,
                    bitrateKbps: bitrateMap[res],
                    fileSizeBytes: Math.round(optSize / (idx + 1.6)),
                    manifestUrl: mUrl,
                    segmentUrls: ['seg_001.ts', 'seg_002.ts', 'seg_003.ts'],
                    processingStatus: 'ready'
                  };
                });

                return {
                  ...rec,
                  processingStatus: 'ready',
                  availableResolutions: ladder,
                  availableCodecs: videoProcessingConfig.enabledCodecs,
                  optimizedStorageRefs: optimizedRefs,
                  optimizedFileSize: optSize,
                  compressionRatio: reductionRatio,
                  storageSavedBytes: savedBytes,
                  vmafScore: 96.8,
                  ssimScore: 0.99,
                  psnrDb: 45.2,
                  processingCompletionTime: completedAt,
                  processingDurationMs: 6500,
                  variants: builtVariants,
                  updatedAt: completedAt
                };
              })
            );

            // Enrich any Post or Draft referencing this mediaId
            setPosts(prevPosts =>
              prevPosts.map(p => {
                const usesMedia = p.media.some(m => m.videoMediaId === job.mediaId);
                if (!usesMedia) return p;
                return {
                  ...p,
                  fileSize: optSize,
                  media: p.media.map(m =>
                    m.videoMediaId === job.mediaId
                      ? {
                          ...m,
                          optimizedFileSize: optSize,
                          compressionRatio: reductionRatio,
                          vmafScore: 96.8
                        }
                      : m
                  )
                };
              })
            );

            return {
              ...job,
              jobStatus: 'completed' as const,
              processingStage: 'Ready to Publish' as const,
              stage: 'Ready to Publish' as const,
              progressPercentage: 100,
              progress: 100,
              compressionRatio: Math.round(reductionRatio * 100),
              optimizedFileSize: optSize,
              completedAt
            };
          }

          return {
            ...job,
            jobStatus: 'processing' as const,
            processingStage: nextStage,
            stage: nextStage,
            progressPercentage: nextProgress,
            progress: nextProgress
          };
        });

        return anyUpdated ? nextJobs : prevJobs;
      });
    }, 650);

    return () => clearInterval(timer);
  }, [videoProcessingJobs, videoProcessingConfig]);

  const startVideoOptimizationJob = (params: {
    creatorId: string;
    creatorName: string;
    fileName: string;
    fileSize: number;
    format?: string;
    mimeType?: string;
    sourceUrl?: string;
    width: number;
    height: number;
    durationSeconds: number;
    frameRate?: number;
    sourceContext: VideoSourceContext;
    visibility?: PostVisibility;
    thumbnailUrl?: string;
    previewFrames?: string[];
    simulateFailure?: boolean;
  }): {
    job: VideoProcessingJob;
    mediaRecord: VideoMediaRecord;
    isReusedDuplicate: boolean;
    jobId: string;
    videoMediaId: string;
    deduplicated: boolean;
  } => {
    const cleanFormat = (params.format || params.mimeType || 'MP4').replace('video/', '').toUpperCase();
    const contentHash = `hash_${params.creatorId}_${params.fileName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${params.fileSize}_${Math.round(params.durationSeconds || 60)}`;

    // 1. Check Duplicate Upload Prevention (Content Hash Deduplication)
    if (videoProcessingConfig.enableDeduplication && !params.simulateFailure) {
      const existingRecord = videoMediaRecords.find(
        r => r.contentHash === contentHash && r.processingStatus === 'ready'
      );
      if (existingRecord) {
        const existingJob: VideoProcessingJob =
          videoProcessingJobs.find(j => j.mediaId === existingRecord.id) || {
            id: `vjob_dedup_${Date.now()}`,
            mediaId: existingRecord.id,
            creatorId: params.creatorId,
            creatorName: params.creatorName,
            originalFilename: params.fileName,
            fileName: params.fileName,
            sourceContext: params.sourceContext,
            jobStatus: 'completed' as const,
            processingStage: 'Ready to Publish' as const,
            stage: 'Ready to Publish' as const,
            progressPercentage: 100,
            progress: 100,
            compressionRatio: Math.round((existingRecord.compressionRatio || 0.62) * 100),
            retryCount: 0,
            maxRetries: videoProcessingConfig.maxAutoRetries,
            processingConfig: {
              targetPreset: videoProcessingConfig.targetQualityPreset,
              codecs: videoProcessingConfig.enabledCodecs,
              maxResolution: existingRecord.availableResolutions[0] || '1080p',
              protocol: videoProcessingConfig.streamingProtocol
            },
            originalFileSize: existingRecord.originalFileSize,
            optimizedFileSize: existingRecord.optimizedFileSize,
            startedAt: existingRecord.processingStartTime,
            completedAt: existingRecord.processingCompletionTime
          };

        setVideoMediaRecords(prev =>
          prev.map(r =>
            r.id === existingRecord.id ? { ...r, reusedCount: (r.reusedCount || 1) + 1 } : r
          )
        );

        return {
          job: existingJob,
          mediaRecord: { ...existingRecord, reusedCount: (existingRecord.reusedCount || 1) + 1 },
          isReusedDuplicate: true,
          jobId: existingJob.id,
          videoMediaId: existingRecord.id,
          deduplicated: true
        };
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const mediaId = `vmedia_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const jobId = `vjob_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;

    const w = params.width || 1920;
    const h = params.height || 1080;
    const orientation: 'landscape' | 'portrait' | 'square' =
      w === h ? 'square' : w > h ? 'landscape' : 'portrait';
    const aspectRatio =
      orientation === 'square' ? '1:1' : orientation === 'portrait' ? '9:16' : '16:9';

    const ladder = computeAdaptiveLadder(w, h);
    const defaultThumb =
      params.thumbnailUrl ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80';

    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + videoProcessingConfig.originalFileRetentionDays);

    const newRecord: VideoMediaRecord = {
      id: mediaId,
      creatorId: params.creatorId,
      creatorName: params.creatorName,
      sourceContext: params.sourceContext,
      contentHash,
      originalFilename: params.fileName,
      originalStorageRef: `s3://acovon-vault-originals/${params.creatorId}/${mediaId}/source.${cleanFormat.toLowerCase()}`,
      originalFileSize: params.fileSize,
      originalFormat: cleanFormat,
      originalWidth: w,
      originalHeight: h,
      originalDuration: Math.max(1, Math.round(params.durationSeconds || 60)),
      originalFrameRate: params.frameRate || 60,
      aspectRatio,
      orientation,
      processingStatus: params.simulateFailure ? 'failed' : 'processing',
      optimizedStorageRefs: {},
      availableResolutions: ladder,
      availableCodecs: videoProcessingConfig.enabledCodecs,
      streamingProtocol: videoProcessingConfig.streamingProtocol,
      streamingManifestRef: `https://cdn.acovon.media/hls/${mediaId}/master.m3u8`,
      masterPlaylistUrl: `https://cdn.acovon.media/hls/${mediaId}/master.m3u8`,
      thumbnailRef: defaultThumb,
      previewFrames: params.previewFrames && params.previewFrames.length > 0 ? params.previewFrames : [defaultThumb],
      feedPreviewRef: defaultThumb,
      profilePreviewRef: defaultThumb,
      statusPreviewRef: orientation === 'portrait' ? defaultThumb : undefined,
      optimizedFileSize: 0,
      compressionRatio: 0,
      storageSavedBytes: 0,
      vmafScore: 0,
      ssimScore: 0,
      psnrDb: 0,
      processingStartTime: nowStr,
      processingError: params.simulateFailure
        ? 'Simulated Transcode Worker Interruption. Original source safely retained in vault.'
        : undefined,
      retentionStatus: videoProcessingConfig.retainOriginalAfterVerification
        ? 'retained_vault'
        : 'scheduled_cleanup',
      retentionExpiresAt: retentionDate.toISOString().split('T')[0],
      accessVisibility: params.visibility || 'public',
      variants: [],
      reusedCount: 1,
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const newJob: VideoProcessingJob = {
      id: jobId,
      mediaId,
      creatorId: params.creatorId,
      creatorName: params.creatorName,
      originalFilename: params.fileName,
      fileName: params.fileName,
      sourceContext: params.sourceContext,
      jobStatus: params.simulateFailure ? 'failed' : 'processing',
      processingStage: params.simulateFailure ? 'Failed' : 'Uploading',
      stage: params.simulateFailure ? 'Failed' : 'Uploading',
      progressPercentage: params.simulateFailure ? 45 : 15,
      progress: params.simulateFailure ? 45 : 15,
      compressionRatio: 62,
      retryCount: params.simulateFailure ? 1 : 0,
      maxRetries: videoProcessingConfig.maxAutoRetries,
      processingConfig: {
        targetPreset: videoProcessingConfig.targetQualityPreset,
        codecs: videoProcessingConfig.enabledCodecs,
        maxResolution: ladder[0] || '1080p',
        protocol: videoProcessingConfig.streamingProtocol
      },
      errorDetails: params.simulateFailure
        ? 'Simulated Transcode Worker Interruption. Original source safely retained in vault.'
        : undefined,
      errorMessage: params.simulateFailure
        ? 'Simulated Transcode Worker Interruption. Original source safely retained in vault.'
        : undefined,
      originalFileSize: params.fileSize,
      startedAt: nowStr
    };

    setVideoMediaRecords(prev => [newRecord, ...prev]);
    setVideoProcessingJobs(prev => [newJob, ...prev]);

    return {
      job: newJob,
      mediaRecord: newRecord,
      isReusedDuplicate: false,
      jobId,
      videoMediaId: mediaId,
      deduplicated: false
    };
  };

  const retryVideoProcessingJob = (jobId: string): { success: boolean; error?: string } => {
    const job = videoProcessingJobs.find(j => j.id === jobId);
    if (!job) return { success: false, error: 'Processing job not found.' };

    setVideoProcessingJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              jobStatus: 'processing',
              processingStage: 'Processing',
              progressPercentage: 30,
              retryCount: j.retryCount + 1,
              errorDetails: undefined
            }
          : j
      )
    );

    setVideoMediaRecords(prev =>
      prev.map(r =>
        r.id === job.mediaId
          ? {
              ...r,
              processingStatus: 'processing',
              processingError: undefined,
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
            }
          : r
      )
    );

    if (activeRole === 'admin') {
      logAdminAction({
        category: 'video_processing',
        action: 'Triggered Manual Transcode & Compression Retry',
        targetType: 'VideoProcessingJob',
        targetId: jobId,
        targetLabel: job.originalFilename,
        details: `Re-queued job ${jobId} for creator ${job.creatorName} (Attempt #${job.retryCount + 1})`,
        severity: 'info'
      });
    }

    return { success: true };
  };

  const cancelVideoProcessingJob = (jobId: string): { success: boolean; error?: string } => {
    const job = videoProcessingJobs.find(j => j.id === jobId);
    if (!job) return { success: false, error: 'Processing job not found.' };

    setVideoProcessingJobs(prev =>
      prev.map(j =>
        j.id === jobId
          ? {
              ...j,
              jobStatus: 'cancelled',
              processingStage: 'Failed',
              errorDetails: 'Cancelled by operator/creator.'
            }
          : j
      )
    );

    if (activeRole === 'admin') {
      logAdminAction({
        category: 'video_processing',
        action: 'Cancelled Video Processing Job',
        targetType: 'VideoProcessingJob',
        targetId: jobId,
        targetLabel: job.originalFilename,
        details: `Cancelled active processing job for ${job.creatorName}. Original source retained in vault.`,
        severity: 'warning'
      });
    }

    return { success: true };
  };

  const cleanupOriginalVideoSource = (mediaId: string): { success: boolean; error?: string } => {
    const rec = videoMediaRecords.find(r => r.id === mediaId);
    if (!rec) return { success: false, error: 'Video media record not found.' };

    // Safety guard: never delete an original file unless optimized playback verification succeeded
    if (rec.processingStatus !== 'ready' || rec.optimizedFileSize <= 0) {
      return {
        success: false,
        error:
          'Safety Guard Active: Original source file cannot be purged until optimized playback variants and quality verification have succeeded.'
      };
    }

    setVideoMediaRecords(prev =>
      prev.map(r =>
        r.id === mediaId
          ? {
              ...r,
              retentionStatus: 'cleaned_up',
              updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
            }
          : r
      )
    );

    if (activeRole === 'admin') {
      logAdminAction({
        category: 'video_processing',
        action: 'Purged Verified Original Source from Vault Storage',
        targetType: 'VideoMediaRecord',
        targetId: mediaId,
        targetLabel: rec.originalFilename,
        details: `Reclaimed ${(rec.originalFileSize / (1024 * 1024)).toFixed(1)} MB of raw vault storage after verifying HLS adaptive variants (VMAF ${rec.vmafScore}).`,
        severity: 'info'
      });
    }

    return { success: true };
  };

  const updateVideoProcessingConfig = (
    updates: Partial<VideoProcessingConfig>
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return {
        success: false,
        error: 'Access Denied: Only Super Admin or Admin can modify Video Compression & Streaming rules.'
      };
    }

    setVideoProcessingConfig(prev => {
      const next = { ...prev, ...updates };
      logAdminAction({
        category: 'video_processing',
        action: 'Updated Platform Video Compression & Adaptive Streaming Configuration',
        targetType: 'VideoProcessingConfig',
        targetId: 'global_video_pipeline',
        targetLabel: 'Video Optimization Engine',
        details: `Preset: ${next.targetQualityPreset} · Min VMAF: ${next.minVmafThreshold} · Protocol: ${next.streamingProtocol} · Codecs: ${next.enabledCodecs.join(', ')} · Retention: ${next.originalFileRetentionDays}d`,
        severity: 'warning'
      });
      return next;
    });

    return { success: true };
  };

  const getAuthorizedPlaybackUrl = (
    postOrMediaId: string,
    requestedResolution: VideoResolution | 'Auto' | 'auto',
    rawUrl: string = ''
  ): {
    authorized: boolean;
    signedUrl: string;
    activeResolution: VideoResolution;
    activeCodec: VideoCodec;
    reason?: string;
  } => {
    const post = posts.find(
      p => p.id === postOrMediaId || p.media.some(m => m.videoMediaId === postOrMediaId)
    );
    const mediaRecord = videoMediaRecords.find(
      r => r.id === postOrMediaId || (post && r.id === `vmedia_${post.id}`)
    );

    const ladder: VideoResolution[] =
      mediaRecord?.availableResolutions ||
      post?.media.find(m => m.type === 'video')?.availableResolutions || [
        '1080p',
        '720p',
        '480p',
        '360p'
      ];

    const chosenRes: VideoResolution =
      requestedResolution === 'Auto' || requestedResolution === 'auto'
        ? ladder.includes('1080p')
          ? '1080p'
          : ladder[0] || '720p'
        : ladder.includes(requestedResolution)
        ? requestedResolution
        : ladder[0] || '720p';

    const chosenCodec: VideoCodec =
      chosenRes === '4K'
        ? 'AV1'
        : chosenRes === '1440p' || chosenRes === '1080p'
        ? 'H.265/HEVC'
        : 'H.264';

    // Check authorization if linked to a gated post
    if (post) {
      const isCreatorOwner = currentUser.id === post.creatorId;
      const isAdminViewer = activeRole === 'admin';
      const isPublic = post.visibility === 'public';
      const isSub = isSubscribedTo(post.creatorId);
      const isPurchased = isPostPurchased(post.id);

      const canFullStream =
        isCreatorOwner ||
        isAdminViewer ||
        isPublic ||
        (post.visibility === 'subscribers' && isSub) ||
        (post.visibility === 'pay_per_view' && isPurchased);

      if (!canFullStream && !post.previewDurationSeconds) {
        return {
          authorized: false,
          signedUrl: '',
          activeResolution: chosenRes,
          activeCodec: chosenCodec,
          reason:
            post.visibility === 'pay_per_view'
              ? 'Pay-Per-View unlock required for full-length adaptive stream.'
              : 'Active creator subscription required for full-length adaptive stream.'
        };
      }
    }

    const separator = rawUrl.includes('?') ? '&' : '?';
    const tokenHash = btoa(`${currentUser.id}:${postOrMediaId}:${chosenRes}`).slice(0, 16);
    const signedUrl = `${rawUrl}${separator}acv_res=${chosenRes}&acv_codec=${encodeURIComponent(chosenCodec)}&acv_token=${tokenHash}`;

    return {
      authorized: true,
      signedUrl,
      activeResolution: chosenRes,
      activeCodec: chosenCodec
    };
  };

  // ============================================================================
  // AUTOMATIC PAID CREATOR VERIFICATION SYSTEM ENGINE
  // ============================================================================

  const syncCreatorBlueBadgeState = (
    creatorId: string,
    newStatus: PaidVerificationStatus,
    extra?: {
      purchaseDate?: string;
      expiresAt?: string | null;
      lastRenewalDate?: string;
      planName?: string;
    }
  ) => {
    const isNowVerified = newStatus === 'verified';
    setCreators(prev =>
      prev.map(c =>
        c.id === creatorId
          ? {
              ...c,
              isVerified: isNowVerified,
              verificationStatus: newStatus,
              ...(extra?.purchaseDate !== undefined ? { verificationPurchaseDate: extra.purchaseDate } : {}),
              ...(extra?.expiresAt !== undefined ? { verificationExpiresAt: extra.expiresAt } : {}),
              ...(extra?.lastRenewalDate !== undefined ? { verificationLastRenewalDate: extra.lastRenewalDate } : {}),
              ...(extra?.planName !== undefined ? { verificationPlanName: extra.planName } : {})
            }
          : c
      )
    );

    if (currentUser.id === creatorId && currentUser.role === 'creator') {
      setCurrentUser(prev => ({
        ...prev,
        isVerified: isNowVerified,
        ...(extra?.purchaseDate !== undefined ? { verificationPurchaseDate: extra.purchaseDate } : {}),
        ...(extra?.expiresAt !== undefined ? { verificationExpiresAt: extra.expiresAt } : {}),
        ...(extra?.lastRenewalDate !== undefined ? { verificationLastRenewalDate: extra.lastRenewalDate } : {}),
        ...(extra?.planName !== undefined ? { verificationPlanName: extra.planName } : {})
      }));
    }
  };

  const getCreatorVerificationRecord = (creatorId: string): CreatorVerificationRecord => {
    const existing = creatorVerificationRecords.find(r => r.creatorId === creatorId);
    if (existing) return existing;

    const creator = creators.find(c => c.id === creatorId);
    const fallbackStatus: PaidVerificationStatus =
      creator?.verificationStatus || (creator?.isVerified ? 'verified' : 'not_verified');

    return {
      id: `cvrec_${creatorId}`,
      creatorId,
      creatorName: creator?.name || 'Creator',
      creatorUsername: creator?.username || creatorId,
      creatorAvatar: creator?.avatar || '',
      status: fallbackStatus,
      planId: verificationSettings.id,
      planName: verificationSettings.planName,
      amountPaid: fallbackStatus === 'verified' ? verificationSettings.price : 0,
      currency: verificationSettings.currency,
      durationType: verificationSettings.durationType,
      expirationDate: null,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };
  };

  const isCreatorVerifiedBadgeActive = (creatorIdOrUsername?: string): boolean => {
    if (!creatorIdOrUsername) return false;

    // 1. Strict Role Guard: Fans or non-creators can NEVER display the creator verification badge
    const matchedFanUser = Object.values(users).find(
      u => u.id === creatorIdOrUsername || u.username === creatorIdOrUsername || u.name === creatorIdOrUsername
    );
    if (matchedFanUser && matchedFanUser.role === 'fan') {
      return false;
    }

    // 2. Match Creator Profile
    const creator = creators.find(
      c => c.id === creatorIdOrUsername || c.username === creatorIdOrUsername || c.name === creatorIdOrUsername
    );
    if (!creator || creator.role !== 'creator') {
      return false;
    }

    // 3. Check Central Verification Record
    const record = creatorVerificationRecords.find(r => r.creatorId === creator.id);
    if (record) {
      if (record.status !== 'verified') {
        return false;
      }
      if (record.expirationDate) {
        const expTime = new Date(record.expirationDate.replace(' ', 'T')).getTime();
        if (!isNaN(expTime) && expTime <= Date.now()) {
          return false;
        }
      }
      return true;
    }

    return Boolean(creator.isVerified && creator.verificationStatus !== 'suspended' && creator.verificationStatus !== 'revoked');
  };

  const logVerificationAudit = (entry: Omit<VerificationAuditLog, 'id' | 'timestamp'>) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newLog: VerificationAuditLog = {
      ...entry,
      id: `vaudit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowStr
    };
    setVerificationAuditLogs(prev => [newLog, ...prev]);
  };

  const purchaseCreatorVerification = (options: {
    creatorId?: string;
    paymentProvider: 'acovon_wallet' | 'stripe_checkout' | 'apple_pay';
    simulateOutcome?: 'completed' | 'pending' | 'failed';
    idempotencyKey?: string;
    isRenewal?: boolean;
  }): {
    success: boolean;
    status?: PaidVerificationStatus;
    transaction?: VerificationTransaction;
    error?: string;
    isDuplicatePrevented?: boolean;
  } => {
    const targetCreatorId = options.creatorId || currentUser.id;
    const creator = creators.find(c => c.id === targetCreatorId);
    if (!creator || creator.role !== 'creator') {
      return {
        success: false,
        error: 'Only registered and onboarded ACOVON Creator accounts can purchase Creator Verification.'
      };
    }

    if (!verificationSettings.isActive || !verificationSettings.isPublished) {
      return {
        success: false,
        error: 'Creator Verification purchases are currently paused by Platform Administration.'
      };
    }

    const existingRecord = getCreatorVerificationRecord(creator.id);

    // Prevent revoked creators from self-purchasing without Admin restoration
    if (existingRecord.status === 'revoked') {
      return {
        success: false,
        error: 'Your Creator Verification eligibility was revoked by Administration. Please contact Support.'
      };
    }

    // Prevent duplicate purchase if already lifetime verified (and not a time-limited renewal)
    if (existingRecord.status === 'verified' && !options.isRenewal && verificationSettings.durationType === 'lifetime') {
      return {
        success: false,
        isDuplicatePrevented: true,
        error: 'Your creator account already has an active Official Blue Verification Badge.'
      };
    }

    // Idempotency Key Duplicate Webhook / Double-Click Protection
    const idemKey =
      options.idempotencyKey ||
      `idem_verif_${creator.id}_${options.isRenewal ? 'renew' : 'init'}_${Math.floor(Date.now() / 5000)}`;
    const duplicateTx = verificationTransactions.find(
      t => t.idempotencyKey === idemKey && t.paymentStatus === 'completed'
    );
    if (duplicateTx) {
      return {
        success: true,
        status: existingRecord.status,
        transaction: duplicateTx,
        isDuplicatePrevented: true
      };
    }

    const chargeAmount =
      options.isRenewal && verificationSettings.renewalEnabled
        ? verificationSettings.renewalPrice
        : verificationSettings.price;
    const chargeCurrency = verificationSettings.currency;

    if (chargeAmount <= 0 || isNaN(chargeAmount)) {
      return {
        success: false,
        error: 'Invalid verification price configuration.'
      };
    }

    const outcome = options.simulateOutcome || 'completed';

    // Check wallet balance if paying with ACOVON Wallet and outcome is not simulated failure
    if (options.paymentProvider === 'acovon_wallet' && outcome !== 'failed') {
      const currentBalance = creator.id === currentUser.id ? currentUser.walletBalance : creator.walletBalance;
      if (currentBalance < chargeAmount) {
        return {
          success: false,
          error: `Insufficient ACOVON Wallet balance (${chargeCurrency} ${currentBalance.toFixed(2)} available, ${chargeCurrency} ${chargeAmount.toFixed(2)} required). Please top up or select Stripe Card / Apple Pay.`
        };
      }
    }

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const txId = `vtx_${Date.now()}`;
    const providerRef =
      options.paymentProvider === 'stripe_checkout'
        ? `pi_3Acovon_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
        : options.paymentProvider === 'apple_pay'
        ? `apay_Acovon_${Math.random().toString(36).slice(2, 10).toUpperCase()}`
        : `wal_Acovon_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    const newTx: VerificationTransaction = {
      id: txId,
      creatorId: creator.id,
      creatorName: creator.name,
      creatorUsername: creator.username,
      creatorAvatar: creator.avatar,
      verificationRecordId: existingRecord.id,
      transactionType: options.isRenewal ? 'renewal' : 'initial',
      planName: options.isRenewal
        ? `${verificationSettings.planName} (Renewal)`
        : verificationSettings.planName,
      paymentProvider: options.paymentProvider,
      providerTransactionId: providerRef,
      idempotencyKey: idemKey,
      amount: chargeAmount,
      currency: chargeCurrency,
      paymentStatus: outcome,
      paymentTimestamp: nowStr,
      refundStatus: 'not_requested',
      createdAt: nowStr
    };

    setVerificationTransactions(prev => [newTx, ...prev]);

    // CASE 1: FAILED PAYMENT -> Do NOT activate badge
    if (outcome === 'failed') {
      const failNotif: AppNotification = {
        id: `notif_verif_fail_${Date.now()}`,
        userId: creator.id,
        type: 'verification',
        title: 'Verification Payment Failed',
        message: `Your payment of ${chargeCurrency} ${chargeAmount.toFixed(2)} for ${verificationSettings.planName} could not be completed. Your verification badge was not activated. Please retry with another payment method.`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [failNotif, ...prev]);
      return {
        success: false,
        status: existingRecord.status,
        transaction: newTx,
        error: 'Payment authorization declined by provider. Your account has not been charged and remains unverified.'
      };
    }

    // CASE 2: PENDING PAYMENT -> Set status to payment_pending, do NOT activate badge yet
    if (outcome === 'pending') {
      const updatedRecord: CreatorVerificationRecord = {
        ...existingRecord,
        status: 'payment_pending',
        planId: verificationSettings.id,
        planName: verificationSettings.planName,
        originalPaymentId: txId,
        amountPaid: chargeAmount,
        currency: chargeCurrency,
        durationType: verificationSettings.durationType,
        purchaseDate: nowStr,
        statusReason: 'Payment submitted — awaiting final gateway settlement confirmation.',
        updatedAt: nowStr
      };

      setCreatorVerificationRecords(prev => {
        const exists = prev.some(r => r.creatorId === creator.id);
        return exists ? prev.map(r => (r.creatorId === creator.id ? updatedRecord : r)) : [updatedRecord, ...prev];
      });
      syncCreatorBlueBadgeState(creator.id, 'payment_pending', {
        purchaseDate: nowStr,
        planName: verificationSettings.planName
      });

      const pendingNotif: AppNotification = {
        id: `notif_verif_pend_${Date.now()}`,
        userId: creator.id,
        type: 'verification',
        title: 'Verification Payment Pending Confirmation',
        message: `We received your payment request of ${chargeCurrency} ${chargeAmount.toFixed(2)}. Your official blue verification badge will activate automatically as soon as payment settlement is confirmed.`,
        read: false,
        createdAt: 'Just now'
      };
      setNotifications(prev => [pendingNotif, ...prev]);

      return {
        success: true,
        status: 'payment_pending',
        transaction: newTx
      };
    }

    // CASE 3: COMPLETED PAYMENT -> Automatically activate Official Blue Verification Badge immediately!
    let expirationDate: string | null = null;
    if (verificationSettings.durationType !== 'lifetime') {
      const daysToAdd =
        verificationSettings.durationType === 'monthly'
          ? 30
          : verificationSettings.durationType === 'annual'
          ? 365
          : verificationSettings.durationDays || 30;

      // If renewing an active future expiration date, extend from that date; otherwise from now
      const baseTime =
        options.isRenewal &&
        existingRecord.expirationDate &&
        new Date(existingRecord.expirationDate.replace(' ', 'T')).getTime() > now.getTime()
          ? new Date(existingRecord.expirationDate.replace(' ', 'T')).getTime()
          : now.getTime();

      const expDateObj = new Date(baseTime + daysToAdd * 24 * 60 * 60 * 1000);
      expirationDate = expDateObj.toISOString().replace('T', ' ').slice(0, 19);
    }

    // Deduct from wallet if ACOVON Wallet was used
    if (options.paymentProvider === 'acovon_wallet') {
      setCreators(prev =>
        prev.map(c =>
          c.id === creator.id ? { ...c, walletBalance: Math.max(0, Number((c.walletBalance - chargeAmount).toFixed(2))) } : c
        )
      );
      if (currentUser.id === creator.id) {
        setCurrentUser(prev => ({
          ...prev,
          walletBalance: Math.max(0, Number((prev.walletBalance - chargeAmount).toFixed(2)))
        }));
      }
    }

    // Record in platform wallet transactions ledger as well
    const walletLedgerTx: WalletTransaction = {
      id: `tx_verif_${Date.now()}`,
      userId: creator.id,
      type: 'creator_verification',
      amount: -chargeAmount,
      description: `${options.isRenewal ? 'Creator Verification Renewal' : 'Official Blue Verification Badge'}: ${verificationSettings.planName} (${chargeCurrency})`,
      status: 'completed',
      createdAt: nowStr.slice(0, 10),
      referenceId: txId,
      platformFee: chargeAmount,
      netCreatorEarnings: 0
    };
    setTransactions(prev => [walletLedgerTx, ...prev]);

    const verifiedRecord: CreatorVerificationRecord = {
      ...existingRecord,
      status: 'verified',
      planId: verificationSettings.id,
      planName: verificationSettings.planName,
      originalPaymentId: txId,
      amountPaid: chargeAmount,
      currency: chargeCurrency,
      durationType: verificationSettings.durationType,
      purchaseDate: existingRecord.purchaseDate || nowStr,
      startDate: existingRecord.startDate || nowStr,
      expirationDate,
      lastRenewalDate: options.isRenewal ? nowStr : existingRecord.lastRenewalDate,
      suspendedDate: undefined,
      revokedDate: undefined,
      statusReason: undefined,
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === creator.id);
      return exists ? prev.map(r => (r.creatorId === creator.id ? verifiedRecord : r)) : [verifiedRecord, ...prev];
    });

    syncCreatorBlueBadgeState(creator.id, 'verified', {
      purchaseDate: verifiedRecord.purchaseDate,
      expiresAt: expirationDate,
      lastRenewalDate: verifiedRecord.lastRenewalDate,
      planName: verificationSettings.planName
    });

    logVerificationAudit({
      adminId: 'system_payment_webhook',
      adminName: 'ACOVON Payment Gateway',
      adminRole: 'system',
      creatorId: creator.id,
      creatorName: creator.name,
      action: options.isRenewal
        ? `Automatic Blue Badge Renewal Confirmed (${chargeCurrency} ${chargeAmount.toFixed(2)})`
        : `Automatic Blue Verification Badge Activated (${chargeCurrency} ${chargeAmount.toFixed(2)})`,
      previousStatus: existingRecord.status,
      newStatus: 'verified',
      reason: `Verified payment confirmation ${providerRef} via ${options.paymentProvider}.`
    });

    // Send non-duplicate confirmation notification
    const confirmNotif: AppNotification = {
      id: `notif_verif_success_${txId}`,
      userId: creator.id,
      type: 'verification',
      title: options.isRenewal
        ? 'Creator Verification Renewed — Blue Badge Active'
        : 'Official Blue Verification Badge Active!',
      message: `Congratulations! Your payment of ${chargeCurrency} ${chargeAmount.toFixed(2)} is confirmed. Your ACOVON account is now verified and your official blue verification badge is active across the entire platform.`,
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [confirmNotif, ...prev]);

    return {
      success: true,
      status: 'verified',
      transaction: newTx
    };
  };

  const confirmPendingVerificationPayment = (transactionId: string): { success: boolean; error?: string } => {
    const tx = verificationTransactions.find(t => t.id === transactionId);
    if (!tx) {
      return { success: false, error: 'Verification transaction not found.' };
    }
    if (tx.paymentStatus === 'completed') {
      return { success: true };
    }

    const now = new Date();
    const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);

    setVerificationTransactions(prev =>
      prev.map(t => (t.id === transactionId ? { ...t, paymentStatus: 'completed', paymentTimestamp: nowStr } : t))
    );

    const existingRecord = getCreatorVerificationRecord(tx.creatorId);
    let expirationDate: string | null = null;
    if (verificationSettings.durationType !== 'lifetime') {
      const daysToAdd =
        verificationSettings.durationType === 'monthly'
          ? 30
          : verificationSettings.durationType === 'annual'
          ? 365
          : verificationSettings.durationDays || 30;
      expirationDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
        .toISOString()
        .replace('T', ' ')
        .slice(0, 19);
    }

    const updatedRecord: CreatorVerificationRecord = {
      ...existingRecord,
      status: 'verified',
      originalPaymentId: tx.id,
      amountPaid: tx.amount,
      currency: tx.currency,
      startDate: nowStr,
      expirationDate,
      statusReason: undefined,
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === tx.creatorId);
      return exists ? prev.map(r => (r.creatorId === tx.creatorId ? updatedRecord : r)) : [updatedRecord, ...prev];
    });

    syncCreatorBlueBadgeState(tx.creatorId, 'verified', {
      purchaseDate: updatedRecord.purchaseDate || nowStr,
      expiresAt: expirationDate,
      planName: updatedRecord.planName
    });

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      creatorId: tx.creatorId,
      creatorName: tx.creatorName,
      action: 'Pending Verification Payment Settled & Badge Activated',
      previousStatus: 'payment_pending',
      newStatus: 'verified',
      reason: `Payment ${tx.providerTransactionId} confirmed (${tx.currency} ${tx.amount.toFixed(2)}).`
    });

    const notif: AppNotification = {
      id: `notif_verif_settled_${tx.id}`,
      userId: tx.creatorId,
      type: 'verification',
      title: 'Payment Confirmed — Blue Verification Badge Active',
      message: `Congratulations! Your ACOVON account is now verified. Your official blue verification badge is active.`,
      read: false,
      createdAt: 'Just now'
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true };
  };

  const adminUpdateVerificationSettings = (
    updates: Partial<VerificationSettings>
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'finance_admin'])) {
      return {
        success: false,
        error: 'Access Denied: Only authorized Administrators can modify Creator Verification pricing and configuration.'
      };
    }

    if (updates.price !== undefined && (isNaN(updates.price) || updates.price <= 0)) {
      return {
        success: false,
        error: 'Verification price must be a valid positive number.'
      };
    }

    if (updates.renewalPrice !== undefined && (isNaN(updates.renewalPrice) || updates.renewalPrice <= 0)) {
      return {
        success: false,
        error: 'Renewal price must be a valid positive number.'
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const prevPriceLabel = `${verificationSettings.price.toFixed(2)} ${verificationSettings.currency} (${verificationSettings.durationType})`;
    const nextSettings: VerificationSettings = {
      ...verificationSettings,
      ...updates,
      updatedAt: nowStr,
      updatedByAdmin: `${currentUser.name} (${activeAdminPermissionLevel})`
    };
    const nextPriceLabel = `${nextSettings.price.toFixed(2)} ${nextSettings.currency} (${nextSettings.durationType})`;

    setVerificationSettings(nextSettings);

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      action: 'Updated Creator Verification Plan & Pricing Configuration',
      previousStatus: prevPriceLabel,
      newStatus: nextPriceLabel,
      reason: `Active: ${nextSettings.isActive} · Published: ${nextSettings.isPublished} · Plan: ${nextSettings.planName} · Renewal: ${nextSettings.renewalEnabled ? `${nextSettings.renewalPrice.toFixed(2)} ${nextSettings.currency}` : 'Disabled'}`
    });

    logAdminAction({
      category: 'creator_verification',
      action: 'Updated Paid Creator Verification Configuration',
      targetType: 'VerificationSettings',
      targetId: nextSettings.id,
      targetLabel: nextSettings.planName,
      details: `Updated price/configuration from [${prevPriceLabel}] to [${nextPriceLabel}]. Existing completed purchases retain their original transaction amounts.`,
      severity: 'info'
    });

    return { success: true };
  };

  const adminSuspendCreatorVerification = (
    creatorId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return {
        success: false,
        error: 'Access Denied: Insufficient permissions to suspend creator verification.'
      };
    }
    if (!reason.trim()) {
      return {
        success: false,
        error: 'A suspension reason is required for audit compliance.'
      };
    }

    const existing = getCreatorVerificationRecord(creatorId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: CreatorVerificationRecord = {
      ...existing,
      status: 'suspended',
      suspendedDate: nowStr,
      statusReason: reason.trim(),
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === creatorId);
      return exists ? prev.map(r => (r.creatorId === creatorId ? updated : r)) : [updated, ...prev];
    });

    syncCreatorBlueBadgeState(creatorId, 'suspended');

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      creatorId,
      creatorName: existing.creatorName,
      action: 'Suspended Creator Blue Verification Badge',
      previousStatus: existing.status,
      newStatus: 'suspended',
      reason: reason.trim()
    });

    logAdminAction({
      category: 'creator_verification',
      action: 'Suspended Creator Verification Badge',
      targetType: 'CreatorProfile',
      targetId: creatorId,
      targetLabel: existing.creatorName,
      details: `Blue badge suspended and hidden platform-wide. Reason: ${reason.trim()}`,
      severity: 'warning'
    });

    setNotifications(prev => [
      {
        id: `notif_verif_susp_${Date.now()}`,
        userId: creatorId,
        type: 'verification',
        title: 'Creator Verification Temporarily Suspended',
        message: `Your official ACOVON blue verification badge has been temporarily suspended by Administration. Reason: ${reason.trim()}`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const adminRestoreCreatorVerification = (
    creatorId: string,
    reason: string = 'Verification restored following administrative review.'
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'moderator'])) {
      return {
        success: false,
        error: 'Access Denied: Insufficient permissions to restore creator verification.'
      };
    }

    const existing = getCreatorVerificationRecord(creatorId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: CreatorVerificationRecord = {
      ...existing,
      status: 'verified',
      startDate: existing.startDate || nowStr,
      purchaseDate: existing.purchaseDate || nowStr,
      suspendedDate: undefined,
      revokedDate: undefined,
      statusReason: reason.trim(),
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === creatorId);
      return exists ? prev.map(r => (r.creatorId === creatorId ? updated : r)) : [updated, ...prev];
    });

    syncCreatorBlueBadgeState(creatorId, 'verified');

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      creatorId,
      creatorName: existing.creatorName,
      action: 'Restored Creator Blue Verification Badge',
      previousStatus: existing.status,
      newStatus: 'verified',
      reason: reason.trim()
    });

    logAdminAction({
      category: 'creator_verification',
      action: 'Restored Creator Verification Badge',
      targetType: 'CreatorProfile',
      targetId: creatorId,
      targetLabel: existing.creatorName,
      details: `Blue badge restored and reactivated across all platform views. Note: ${reason.trim()}`,
      severity: 'info'
    });

    setNotifications(prev => [
      {
        id: `notif_verif_rest_${Date.now()}`,
        userId: creatorId,
        type: 'verification',
        title: 'Creator Verification Restored',
        message: `Your official ACOVON blue verification badge has been restored and is now active across the platform.`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const adminRevokeCreatorVerification = (
    creatorId: string,
    reason: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return {
        success: false,
        error: 'Access Denied: Only Super Admin or General Admin can permanently revoke creator verification.'
      };
    }
    if (!reason.trim()) {
      return {
        success: false,
        error: 'A mandatory revocation reason is required.'
      };
    }

    const existing = getCreatorVerificationRecord(creatorId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: CreatorVerificationRecord = {
      ...existing,
      status: 'revoked',
      revokedDate: nowStr,
      statusReason: reason.trim(),
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === creatorId);
      return exists ? prev.map(r => (r.creatorId === creatorId ? updated : r)) : [updated, ...prev];
    });

    syncCreatorBlueBadgeState(creatorId, 'revoked');

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      creatorId,
      creatorName: existing.creatorName,
      action: 'Permanently Revoked Creator Blue Verification Badge',
      previousStatus: existing.status,
      newStatus: 'revoked',
      reason: reason.trim()
    });

    logAdminAction({
      category: 'creator_verification',
      action: 'Revoked Creator Verification Badge',
      targetType: 'CreatorProfile',
      targetId: creatorId,
      targetLabel: existing.creatorName,
      details: `Permanently revoked blue verification badge. Reason: ${reason.trim()}`,
      severity: 'critical'
    });

    setNotifications(prev => [
      {
        id: `notif_verif_rev_${Date.now()}`,
        userId: creatorId,
        type: 'verification',
        title: 'Creator Verification Revoked',
        message: `Your ACOVON blue verification badge has been permanently revoked due to a policy or account violation: ${reason.trim()}`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const adminManageVerificationRefund = (
    transactionId: string,
    refundStatus: VerificationRefundStatus,
    reason: string,
    keepBadgeAuthorizedReason?: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin', 'finance_admin'])) {
      return {
        success: false,
        error: 'Access Denied: Only Finance Admin, Admin, or Super Admin can manage verification refunds.'
      };
    }
    if (!reason.trim()) {
      return {
        success: false,
        error: 'Please enter a refund reason for the financial audit ledger.'
      };
    }

    const tx = verificationTransactions.find(t => t.id === transactionId);
    if (!tx) {
      return { success: false, error: 'Verification transaction not found.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const refundTxId =
      tx.refundTransactionId || `re_Acovon_${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

    setVerificationTransactions(prev =>
      prev.map(t =>
        t.id === transactionId
          ? {
              ...t,
              refundStatus,
              refundTransactionId: refundTxId,
              refundAmount: t.amount,
              refundReason: reason.trim(),
              refundedAt: refundStatus === 'completed' ? nowStr : t.refundedAt,
              keepBadgeAuthorizedReason: keepBadgeAuthorizedReason?.trim() || undefined
            }
          : t
      )
    );

    const existingRecord = getCreatorVerificationRecord(tx.creatorId);

    // Handle verification badge status according to refund lifecycle rules
    if (refundStatus === 'pending' || refundStatus === 'processing') {
      // Optionally place badge under suspension while refund is being processed unless override is set
      if (!keepBadgeAuthorizedReason?.trim() && existingRecord.status === 'verified') {
        const suspendedRecord: CreatorVerificationRecord = {
          ...existingRecord,
          status: 'suspended',
          suspendedDate: nowStr,
          statusReason: `Verification refund ${refundStatus} (${refundTxId}): ${reason.trim()}`,
          updatedAt: nowStr
        };
        setCreatorVerificationRecords(prev =>
          prev.map(r => (r.creatorId === tx.creatorId ? suspendedRecord : r))
        );
        syncCreatorBlueBadgeState(tx.creatorId, 'suspended');
      }
    } else if (refundStatus === 'completed') {
      // Credit back wallet if paid via ACOVON Wallet
      if (tx.paymentProvider === 'acovon_wallet') {
        setCreators(prev =>
          prev.map(c =>
            c.id === tx.creatorId
              ? { ...c, walletBalance: Number((c.walletBalance + tx.amount).toFixed(2)) }
              : c
          )
        );
        if (currentUser.id === tx.creatorId) {
          setCurrentUser(prev => ({
            ...prev,
            walletBalance: Number((prev.walletBalance + tx.amount).toFixed(2))
          }));
        }
      }

      // Record refund in platform wallet ledger
      const refundWalletTx: WalletTransaction = {
        id: `tx_verif_ref_${Date.now()}`,
        userId: tx.creatorId,
        type: 'creator_verification_refund',
        amount: tx.amount,
        description: `Creator Verification Refund (${refundTxId}): ${reason.trim()}`,
        status: 'refunded',
        createdAt: nowStr.slice(0, 10),
        referenceId: tx.id,
        authorizedByAdminId: currentUser.id,
        adjustmentReason: reason.trim()
      };
      setTransactions(prev => [refundWalletTx, ...prev]);

      // Automatically revoke/remove the paid blue badge unless an authorized override reason is recorded
      if (!keepBadgeAuthorizedReason?.trim()) {
        const revokedByRefund: CreatorVerificationRecord = {
          ...existingRecord,
          status: 'not_verified',
          revokedDate: nowStr,
          statusReason: `Verification fee refunded (${refundTxId}): ${reason.trim()}`,
          updatedAt: nowStr
        };
        setCreatorVerificationRecords(prev =>
          prev.map(r => (r.creatorId === tx.creatorId ? revokedByRefund : r))
        );
        syncCreatorBlueBadgeState(tx.creatorId, 'not_verified');
      }
    }

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      creatorId: tx.creatorId,
      creatorName: tx.creatorName,
      action: `Verification Refund Status → ${refundStatus.toUpperCase()} (${tx.currency} ${tx.amount.toFixed(2)})`,
      previousStatus: tx.refundStatus,
      newStatus: refundStatus,
      reason: `${reason.trim()}${keepBadgeAuthorizedReason?.trim() ? ` [Authorized Badge Retention Override: ${keepBadgeAuthorizedReason.trim()}]` : ' [Badge Deactivated]'}`
    });

    logAdminAction({
      category: 'refund_decision',
      action: `Creator Verification Refund (${refundStatus.toUpperCase()})`,
      targetType: 'VerificationTransaction',
      targetId: tx.id,
      targetLabel: `${tx.creatorName} (${tx.currency} ${tx.amount.toFixed(2)})`,
      details: `Refund ID: ${refundTxId} · Status: ${refundStatus} · Reason: ${reason.trim()}`,
      severity: refundStatus === 'completed' ? 'warning' : 'info'
    });

    setNotifications(prev => [
      {
        id: `notif_verif_refund_${Date.now()}`,
        userId: tx.creatorId,
        type: 'verification',
        title: `Verification Refund ${refundStatus === 'completed' ? 'Completed' : refundStatus === 'failed' ? 'Failed' : 'In Progress'}`,
        message:
          refundStatus === 'completed'
            ? `Your verification refund of ${tx.currency} ${tx.amount.toFixed(2)} (${refundTxId}) has been processed.${keepBadgeAuthorizedReason?.trim() ? '' : ' Your paid blue verification badge has been deactivated.'}`
            : `Update on your verification refund (${refundTxId}): status is now ${refundStatus.replace('_', ' ')}.`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const adminTriggerVerificationExpiry = (creatorId: string): { success: boolean; error?: string } => {
    const existing = getCreatorVerificationRecord(creatorId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const nextStatus: PaidVerificationStatus = verificationSettings.renewalEnabled ? 'renewal_required' : 'expired';

    const updated: CreatorVerificationRecord = {
      ...existing,
      status: nextStatus,
      expirationDate: nowStr,
      statusReason: 'Verification period expired. Renewal required to reactivate official blue badge.',
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === creatorId);
      return exists ? prev.map(r => (r.creatorId === creatorId ? updated : r)) : [updated, ...prev];
    });

    syncCreatorBlueBadgeState(creatorId, nextStatus, { expiresAt: nowStr });

    logVerificationAudit({
      adminId: currentUser.id,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      creatorId,
      creatorName: existing.creatorName,
      action: `Verification Period Expired → ${nextStatus.toUpperCase()}`,
      previousStatus: existing.status,
      newStatus: nextStatus,
      reason: 'Time-limited verification reached expiration timestamp. Public blue badge deactivated until renewed.'
    });

    setNotifications(prev => [
      {
        id: `notif_verif_exp_${Date.now()}`,
        userId: creatorId,
        type: 'verification',
        title: 'Creator Verification Expired — Renewal Available',
        message: `Your time-limited ACOVON blue verification badge has expired. Visit Creator Studio → Get Verified to renew and reactivate your badge immediately.`,
        read: false,
        createdAt: 'Just now'
      },
      ...prev
    ]);

    return { success: true };
  };

  const resetCreatorVerificationForTest = (
    creatorId: string,
    targetStatus: PaidVerificationStatus = 'not_verified'
  ) => {
    const existing = getCreatorVerificationRecord(creatorId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: CreatorVerificationRecord = {
      ...existing,
      status: targetStatus,
      expirationDate:
        targetStatus === 'renewal_required' || targetStatus === 'expired' ? nowStr : existing.expirationDate,
      statusReason:
        targetStatus === 'not_verified'
          ? undefined
          : `Switched state to ${targetStatus} for interactive verification workflow testing.`,
      updatedAt: nowStr
    };

    setCreatorVerificationRecords(prev => {
      const exists = prev.some(r => r.creatorId === creatorId);
      return exists ? prev.map(r => (r.creatorId === creatorId ? updated : r)) : [updated, ...prev];
    });

    syncCreatorBlueBadgeState(creatorId, targetStatus);
  };

  // ============================================================================
  // PERSONALIZED CONTENT RECOMMENDATION, DISCOVERY & SMART FEED ENGINE
  // ============================================================================

  const normalizeFanInterestProfile = (raw?: FanInterestProfile): FanInterestProfile => {
    const base = raw || INITIAL_FAN_INTEREST_PROFILES.user_fan_1;
    const avgComp = typeof base.avgCompletionRate === 'number' ? base.avgCompletionRate : 80;
    return {
      ...base,
      categoryScores: base.categoryScores || {},
      recentCategoryScores: base.recentCategoryScores || {},
      longTermCategoryScores: base.longTermCategoryScores || {},
      hashtagScores: base.hashtagScores || {},
      creatorAffinityScores: base.creatorAffinityScores || {},
      skippedCategories: base.skippedCategories || {},
      reducedCategories: Array.isArray(base.reducedCategories) ? base.reducedCategories : [],
      boostedCategories: Array.isArray(base.boostedCategories) ? base.boostedCategories : [],
      hiddenCreatorIds: Array.isArray(base.hiddenCreatorIds) ? base.hiddenCreatorIds : [],
      notInterestedPostIds: Array.isArray(base.notInterestedPostIds) ? base.notInterestedPostIds : [],
      reportedPostIds: Array.isArray(base.reportedPostIds) ? base.reportedPostIds : [],
      showMorePostIds: Array.isArray(base.showMorePostIds) ? base.showMorePostIds : [],
      onboardingCategories: Array.isArray(base.onboardingCategories) ? base.onboardingCategories : [],
      avgCompletionRate: avgComp,
      avgWatchCompletionPercent: base.avgWatchCompletionPercent ?? avgComp
    };
  };

  const activeFanInterestProfile: FanInterestProfile = normalizeFanInterestProfile(
    fanInterestProfiles[activeRecommendationFanId] ||
      fanInterestProfiles[currentUser.id] ||
      fanInterestProfiles.user_fan_1 ||
      INITIAL_FAN_INTEREST_PROFILES.user_fan_1
  );

  const switchRecommendationFanPersona = (fanId: string) => {
    if (fanInterestProfiles[fanId]) {
      setActiveRecommendationFanId(fanId);
    } else {
      const targetUser = users[fanId] || MOCK_USERS.fan_jordan;
      const newProfile: FanInterestProfile = {
        ...INITIAL_FAN_INTEREST_PROFILES.fan_f,
        id: `fprof_${fanId}`,
        fanId,
        fanName: targetUser.name,
        fanUsername: targetUser.username,
        personaCode: 'custom',
        personaLabel: `${targetUser.name} (Personalized Fan Profile)`,
        personaDescription: `Dynamic recommendation profile for @${targetUser.username}.`
      };
      setFanInterestProfiles(prev => ({ ...prev, [fanId]: newProfile }));
      setActiveRecommendationFanId(fanId);
    }
  };

  // Helper: Determine if a post is accessible for FREE to the fan right now without paying or subscribing
  const isPostFreeAccessibleForFan = (post: Post, fanIdOverride?: string): boolean => {
    const targetFanId = fanIdOverride || activeRecommendationFanId;
    const profile = fanInterestProfiles[targetFanId] || activeFanInterestProfile;

    // Moderation & account status checks
    if (post.moderationStatus === 'removed' || post.isDraft) return false;
    const creator = creators.find(c => c.id === post.creatorId);
    if (creator && (creator.accountStatus === 'suspended' || creator.accountStatus === 'banned')) {
      return false;
    }

    // Strict Free Posts Rule:
    // 1. Public free posts, free videos, free photo galleries, free stream highlights
    if (post.visibility === 'public' && (!post.ppvPrice || post.ppvPrice === 0)) {
      return true;
    }

    // 2. Free follower-only posts WHEN the fan follows the creator
    if (post.visibility === 'followers' && (!post.ppvPrice || post.ppvPrice === 0)) {
      const isFollowedInMainState = following.includes(post.creatorId);
      const hasHighPersonaCreatorAffinity = (profile?.creatorAffinityScores?.[post.creatorId] || 0) >= 65;
      return isFollowedInMainState || hasHighPersonaCreatorAffinity || post.creatorId === currentUser.id;
    }

    // Strictly exclude pay_per_view, subscribers, and private posts from Free Posts
    return false;
  };

  // Asynchronous / Non-Blocking Behavioral Signal Recording & Real-Time Profile Learning
  const trackEngagementEvent = (params: {
    eventType: EngagementEventType | string;
    contentType?: 'video' | 'photo' | 'gallery' | 'livestream' | 'status' | 'creator' | 'search';
    contentId?: string;
    postId?: string;
    creatorId?: string;
    creatorName?: string;
    category?: string;
    hashtags?: string[];
    tags?: string[];
    searchQuery?: string;
    watchDurationSeconds?: number;
    videoDurationSeconds?: number;
    completionPercentage?: number;
    completionPercent?: number;
    timeBeforeSkipSeconds?: number;
    sourceSurface?: EngagementSurface | string;
    surface?: EngagementSurface | string;
  }) => {
    const sw = recommendationConfig.signalPointWeights;
    const effectiveCompletion = params.completionPercentage ?? params.completionPercent;
    const effectiveContentId = params.contentId || params.postId;
    const effectiveSurface = (params.sourceSurface || params.surface || 'for_you') as EngagementSurface;
    const effectiveContentType =
      params.contentType ||
      (params.eventType.includes('video')
        ? 'video'
        : params.eventType.includes('photo')
        ? 'photo'
        : params.eventType.includes('creator')
        ? 'creator'
        : params.eventType.includes('search')
        ? 'search'
        : 'video');
    let delta = 1;

    switch (params.eventType) {
      case 'video_impression':
      case 'photo_displayed':
      case 'post_impression':
        delta = 0.5;
        break;
      case 'video_started':
      case 'photo_opened':
      case 'gallery_opened':
      case 'creator_status_viewed':
      case 'creator_livestream_joined':
        delta = 2;
        break;
      case 'creator_profile_opened':
      case 'explore_category_opened':
      case 'category_searched':
      case 'category_selected':
      case 'hashtag_searched':
      case 'hashtag_clicked':
      case 'search_performed':
      case 'search_result_clicked':
        delta = sw.creatorProfileOpened; // +3
        break;
      case 'photo_viewed_duration':
      case 'gallery_browsed':
      case 'creator_livestream_watched':
        delta = 4;
        break;
      case 'video_watched':
        if ((effectiveCompletion || 0) >= 50 || (params.watchDurationSeconds || 0) >= 20) {
          delta = sw.videoWatchedLong; // +5
        } else {
          delta = 2.5;
        }
        break;
      case 'video_completed':
        delta = sw.videoCompleted; // +6
        break;
      case 'video_replayed':
        delta = sw.videoReplayed; // +8
        break;
      case 'video_liked':
      case 'photo_liked':
      case 'post_liked':
      case 'creator_livestream_liked':
        delta = sw.videoLiked; // +4
        break;
      case 'video_unliked':
        delta = -2;
        break;
      case 'video_saved':
      case 'photo_saved':
      case 'post_saved':
        delta = sw.videoSaved; // +7
        break;
      case 'video_shared':
      case 'photo_shared':
      case 'post_shared':
        delta = sw.videoShared; // +7
        break;
      case 'video_commented':
      case 'post_commented':
      case 'creator_status_replied':
        delta = sw.commentPosted; // +5
        break;
      case 'creator_followed':
        delta = sw.creatorFollowed; // +8
        break;
      case 'creator_unfollowed':
        delta = sw.creatorUnfollowed; // -6
        break;
      case 'creator_subscribed':
        delta = sw.creatorSubscribed; // +10
        break;
      case 'creator_content_purchased':
      case 'creator_custom_request':
        delta = sw.paidContentPurchased; // +10
        break;
      case 'video_skipped':
        delta = sw.videoSkippedImmediately; // -4
        break;
      case 'not_interested':
        delta = sw.explicitNotInterested; // -10
        break;
      case 'show_less':
        delta = -6;
        break;
      case 'show_more':
        delta = 8;
        break;
      case 'hide_creator':
      case 'creator_hidden':
        delta = -15;
        break;
      default:
        delta = 1;
    }

    // Resolve category & hashtags from post or creator if not explicitly passed
    let resolvedCategory = params.category;
    let resolvedHashtags = params.hashtags || params.tags || [];
    let resolvedCreatorId = params.creatorId;
    let resolvedCreatorName = params.creatorName;

    if (effectiveContentId) {
      const matchedPost = posts.find(p => p.id === effectiveContentId);
      if (matchedPost) {
        if (!resolvedCategory && matchedPost.categories?.[0]) {
          resolvedCategory = matchedPost.categories[0];
        }
        if (resolvedHashtags.length === 0 && matchedPost.tags) {
          resolvedHashtags = matchedPost.tags;
        }
        if (!resolvedCreatorId) resolvedCreatorId = matchedPost.creatorId;
        if (!resolvedCreatorName) resolvedCreatorName = matchedPost.creatorName;
      }
    }

    if (!resolvedCategory && resolvedCreatorId) {
      const matchedCreator = creators.find(c => c.id === resolvedCreatorId);
      if (matchedCreator) {
        resolvedCategory = matchedCreator.category;
        if (!resolvedCreatorName) resolvedCreatorName = matchedCreator.name;
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const newEvent: FanEngagementEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      fanId: activeRecommendationFanId,
      fanName: activeFanInterestProfile.fanName,
      contentId: effectiveContentId,
      postId: effectiveContentId,
      creatorId: resolvedCreatorId,
      creatorName: resolvedCreatorName,
      eventType: params.eventType,
      contentType: effectiveContentType,
      category: resolvedCategory,
      hashtags: resolvedHashtags,
      tags: resolvedHashtags,
      watchDurationSeconds: params.watchDurationSeconds,
      videoDurationSeconds: params.videoDurationSeconds,
      completionPercentage: effectiveCompletion,
      completionPercent: effectiveCompletion,
      timeBeforeSkipSeconds: params.timeBeforeSkipSeconds,
      scoreDelta: delta,
      sourceSurface: effectiveSurface,
      surface: effectiveSurface,
      sessionId: `sess_${activeRecommendationFanId}`,
      timestamp: nowStr,
      ageHours: 0
    };

    setEngagementEvents(prev => [newEvent, ...prev.slice(0, 299)]);

    // Update active fan interest profile with time-decay aware scoring
    setFanInterestProfiles(prev => {
      const currentProf = normalizeFanInterestProfile(prev[activeRecommendationFanId] || activeFanInterestProfile);
      const recentMultiplier = recommendationConfig.timeDecayConfig.enableFastInterestShift
        ? recommendationConfig.timeDecayConfig.recentSessionMultiplier
        : 1.0;

      const nextRecentCats = { ...currentProf.recentCategoryScores };
      const nextCategoryScores = { ...currentProf.categoryScores };
      const nextHashtagScores = { ...currentProf.hashtagScores };
      const nextCreatorScores = { ...currentProf.creatorAffinityScores };
      const nextSkippedCats = { ...currentProf.skippedCategories };
      const nextFormats = { ...currentProf.formatPreferences };

      if (resolvedCategory && resolvedCategory !== 'All Categories') {
        const weightedDelta = Math.round(delta * recentMultiplier * 10) / 10;
        nextRecentCats[resolvedCategory] = Math.max(
          -50,
          Math.min(100, (nextRecentCats[resolvedCategory] || 0) + weightedDelta)
        );
        const longTermBase = currentProf.longTermCategoryScores[resolvedCategory] || 0;
        nextCategoryScores[resolvedCategory] = Math.max(
          -50,
          Math.min(
            100,
            Math.round(
              nextRecentCats[resolvedCategory] +
                longTermBase * recommendationConfig.timeDecayConfig.last7DaysMultiplier
            )
          )
        );

        if (params.eventType === 'video_skipped' || params.eventType === 'not_interested') {
          nextSkippedCats[resolvedCategory] = (nextSkippedCats[resolvedCategory] || 0) + 1;
        }
      }

      resolvedHashtags.forEach(tag => {
        const cleanTag = tag.replace(/^#/, '');
        nextHashtagScores[cleanTag] = Math.max(
          -30,
          Math.min(100, (nextHashtagScores[cleanTag] || 0) + Math.round(delta * 0.8))
        );
      });

      if (resolvedCreatorId) {
        nextCreatorScores[resolvedCreatorId] = Math.max(
          -50,
          Math.min(100, (nextCreatorScores[resolvedCreatorId] || 0) + Math.round(delta * 1.1))
        );
      }

      if (params.contentType === 'video' && delta > 0) {
        nextFormats.video = Math.min(100, nextFormats.video + 2);
      } else if (params.contentType === 'photo' && delta > 0) {
        nextFormats.photo = Math.min(100, nextFormats.photo + 2);
      } else if (params.contentType === 'gallery' && delta > 0) {
        nextFormats.gallery = Math.min(100, nextFormats.gallery + 3);
      } else if (params.contentType === 'livestream' && delta > 0) {
        nextFormats.livestream = Math.min(100, nextFormats.livestream + 3);
      }

      const nextCompletionRate =
        params.completionPercentage !== undefined && params.completionPercentage > 0
          ? Math.round(currentProf.avgCompletionRate * 0.8 + params.completionPercentage * 0.2)
          : currentProf.avgCompletionRate || 75;

      const nextAvgWatch =
        params.watchDurationSeconds !== undefined && params.watchDurationSeconds > 3
          ? Math.round(currentProf.avgWatchTimeSeconds * 0.8 + params.watchDurationSeconds * 0.2)
          : currentProf.avgWatchTimeSeconds || 180;

      return {
        ...prev,
        [activeRecommendationFanId]: {
          ...currentProf,
          categoryScores: nextCategoryScores,
          recentCategoryScores: nextRecentCats,
          hashtagScores: nextHashtagScores,
          creatorAffinityScores: nextCreatorScores,
          skippedCategories: nextSkippedCats,
          formatPreferences: nextFormats,
          avgCompletionRate: nextCompletionRate,
          avgWatchTimeSeconds: nextAvgWatch,
          isColdStart: false,
          totalEventsProcessed: (currentProf.totalEventsProcessed || 0) + 1,
          lastUpdatedAt: nowStr
        }
      };
    });
  };

  // Freshness helper: convert createdAt string like "25 minutes ago", "2 hours ago", "3 days ago" to 0..100 score
  const computePostFreshnessScore = (createdAt: string): number => {
    const lower = createdAt.toLowerCase();
    if (lower.includes('just now') || lower.includes('minute')) return 98;
    if (lower.includes('hour')) {
      const hrs = parseInt(lower, 10) || 2;
      return Math.max(72, 96 - hrs * 2);
    }
    if (lower.includes('day')) {
      const days = parseInt(lower, 10) || 1;
      return Math.max(35, 78 - days * 9);
    }
    return 60;
  };

  // Collaborative Filtering helper: find other fan profiles with overlapping top categories and boost posts they loved
  const computeCollaborativeBoost = (post: Post, profile: FanInterestProfile): { boost: number; peerNote?: string } => {
    const myTopCats = Object.entries(profile.categoryScores)
      .filter(([, score]) => score >= 50)
      .map(([cat]) => cat);

    if (myTopCats.length === 0) return { boost: 5 };

    let matchedPeers = 0;
    let peerEndorsed = false;

    Object.values(fanInterestProfiles).forEach(other => {
      if (!other || other.fanId === profile.fanId) return;
      const otherCats = other.categoryScores || {};
      const sharesInterest = myTopCats.some(cat => (otherCats[cat] || 0) >= 60);
      if (sharesInterest) {
        matchedPeers++;
        if (
          (other.showMorePostIds || []).includes(post.id) ||
          ((other.creatorAffinityScores || {})[post.creatorId] || 0) >= 80
        ) {
          peerEndorsed = true;
        }
      }
    });

    if (peerEndorsed) {
      return {
        boost: 18,
        peerNote: `Popular with fans who share your interest in ${post.categories?.[0] || myTopCats[0]}`
      };
    }
    return { boost: matchedPeers > 0 ? 8 : 4 };
  };

  // Core Multi-Signal Ranking Engine for "For You" and "Free Posts"
  const getRecommendedPosts = (
    mode: 'for_you' | 'free_posts',
    options?: { limit?: number; categoryFilter?: string; fanIdOverride?: string }
  ): RecommendedPostResult[] => {
    const targetFanId = options?.fanIdOverride || activeRecommendationFanId;
    const profile = normalizeFanInterestProfile(fanInterestProfiles[targetFanId] || activeFanInterestProfile);
    const weights = recommendationConfig.rankingWeights;
    const totalWeightSum =
      Math.max(
        1,
        weights.interestRelevance +
          weights.creatorAffinity +
          weights.watchTimeCompletion +
          weights.engagementSignals +
          weights.contentFreshness +
          weights.qualityPopularity +
          weights.discoveryDiversity
      );

    const suspendedCreatorIds = new Set(
      creators
        .filter(c => c.accountStatus === 'suspended' || c.accountStatus === 'banned')
        .map(c => c.id)
    );

    // Step 1: Candidate Eligibility & Strict Access Filtering
    const candidates = posts.filter(post => {
      if (post.moderationStatus === 'removed' || post.isDraft) return false;
      if (suspendedCreatorIds.has(post.creatorId)) return false;

      // Never show posts from hidden creators or posts explicitly marked Not Interested
      if (profile.hiddenCreatorIds.includes(post.creatorId)) return false;
      if (profile.notInterestedPostIds.includes(post.id)) return false;

      // Check Admin eligible content type switches
      const elig = recommendationConfig.eligibleContentTypes;
      const isGallery = post.media.filter(m => m.type === 'image').length > 1;
      if (isGallery && !elig.photoGalleries) return false;
      if (post.visibility === 'public' && !elig.publicFreePosts) return false;
      if (post.visibility === 'followers' && !elig.followerOnlyPosts) return false;
      if (post.visibility === 'subscribers' && !elig.subscriberPosts) return false;
      if (post.visibility === 'pay_per_view' && !elig.ppvLockedPreviews) return false;

      // Optional category filter
      if (
        options?.categoryFilter &&
        options.categoryFilter !== 'All Categories' &&
        !post.categories?.includes(options.categoryFilter)
      ) {
        return false;
      }

      // Strict "Free Posts" access enforcement:
      if (mode === 'free_posts') {
        return isPostFreeAccessibleForFan(post, targetFanId);
      }

      return true;
    });

    // Step 2: Score each candidate post across the 7 weighted dimensions
    const scoredCandidates: RecommendedPostResult[] = candidates.map(post => {
      const primaryCategory = post.categories?.[0] || 'Fashion & Luxury';
      const isVideo = post.media.some(m => m.type === 'video');
      const isGallery = post.media.filter(m => m.type === 'image').length > 1;
      const isFreeAccessible = isPostFreeAccessibleForFan(post, targetFanId);

      // 1. Interest & Category Relevance (0 - 100)
      const recentCatScore = profile.recentCategoryScores[primaryCategory] || 0;
      const longTermCatScore = profile.longTermCategoryScores[primaryCategory] || 0;
      const timeDecayMult = recommendationConfig.timeDecayConfig.enableFastInterestShift
        ? recommendationConfig.timeDecayConfig.recentSessionMultiplier
        : 1.0;

      let rawCatScore =
        recentCatScore * timeDecayMult +
        longTermCatScore * recommendationConfig.timeDecayConfig.last7DaysMultiplier;

      if (rawCatScore === 0 && profile.categoryScores[primaryCategory]) {
        rawCatScore = profile.categoryScores[primaryCategory];
      }

      // Hashtag match bonus
      const matchedTagBonus = (post.tags || []).reduce((acc, t) => {
        const clean = t.replace(/^#/, '');
        return acc + (profile.hashtagScores[clean] || 0) * 0.35;
      }, 0);

      // Onboarding / Boosted / Reduced / Skipped adjustments
      const onboardingBonus = profile.onboardingCategories.includes(primaryCategory) ? 22 : 0;
      const boostedBonus = profile.boostedCategories.includes(primaryCategory) ? 18 : 0;
      const reducedPenalty = profile.reducedCategories.includes(primaryCategory) ? -42 : 0;
      const skippedCount = profile.skippedCategories[primaryCategory] || 0;
      const skippedPenalty = skippedCount * -8;

      const interestRelevance = Math.max(
        5,
        Math.min(
          100,
          (profile.isColdStart ? 62 : 35) +
            rawCatScore * 0.65 +
            matchedTagBonus +
            onboardingBonus +
            boostedBonus +
            reducedPenalty +
            skippedPenalty
        )
      );

      // 2. Creator Affinity (0 - 100) — Note: Paid blue verification badge NEVER inflates organic ranking!
      const rawCreatorScore = profile.creatorAffinityScores[post.creatorId] || 0;
      const isFollowed = following.includes(post.creatorId);
      const isSubbed = isSubscribedTo(post.creatorId);
      const creatorAffinity = Math.max(
        5,
        Math.min(
          100,
          (profile.isColdStart ? 50 : 25) +
            rawCreatorScore * 0.65 +
            (isFollowed ? 18 : 0) +
            (isSubbed ? 25 : 0)
        )
      );

      // 3. Watch Time & Completion Prediction (0 - 100)
      const formatPref = isVideo
        ? profile.formatPreferences.video
        : isGallery
        ? profile.formatPreferences.gallery
        : profile.formatPreferences.photo;
      const videoAsset = post.media.find(m => m.type === 'video');
      const dur = videoAsset?.durationSeconds || 300;
      const durationMatchBonus =
        profile.preferredVideoDuration === 'short' && dur <= 120
          ? 15
          : profile.preferredVideoDuration === 'medium' && dur > 120 && dur <= 900
          ? 15
          : profile.preferredVideoDuration === 'long' && dur > 600
          ? 15
          : 8;
      const watchTimePrediction = Math.max(
        20,
        Math.min(100, formatPref * 0.7 + (profile.avgCompletionRate || 75) * 0.25 + durationMatchBonus)
      );

      // 4. Engagement Signals (0 - 100)
      const isShowMore = profile.showMorePostIds.includes(post.id);
      const isSaved = savedPostIds.includes(post.id);
      const engagementRateScore = Math.min(45, (post.likesCount / 25) + (post.commentsCount / 3));
      const engagementLikelihood = Math.max(
        15,
        Math.min(
          100,
          35 +
            engagementRateScore +
            (isShowMore ? 30 : 0) +
            (isSaved ? 20 : 0) +
            (post.isLiked ? 12 : 0)
        )
      );

      // 5. Content Freshness (0 - 100)
      const contentFreshness = computePostFreshnessScore(post.createdAt);

      // 6. Quality & Popularity (0 - 100)
      const vmaf = videoAsset?.vmafScore || 96.0;
      const qualityAndPopularity = Math.max(
        40,
        Math.min(
          100,
          (vmaf - 85) * 4 +
            Math.min(35, post.likesCount / 35) +
            recommendationConfig.diversityRules.trendingInfluenceWeight
        )
      );

      // 7. Discovery, Exploration & Collaborative Filtering (0 - 100)
      const collab = computeCollaborativeBoost(post, profile);
      const isUnfollowedCreator = !isFollowed && !isSubbed && rawCreatorScore < 30;
      const explorationBoost = isUnfollowedCreator
        ? (recommendationConfig.diversityRules.explorationPercentage / 100) * 45 +
          recommendationConfig.diversityRules.newCreatorDiscoveryBoost
        : 12;
      const discoveryAndDiversity = Math.max(
        15,
        Math.min(100, 35 + collab.boost + explorationBoost)
      );

      // Weighted composite score (0 - 100)
      let totalScore =
        (interestRelevance * weights.interestRelevance +
          creatorAffinity * weights.creatorAffinity +
          watchTimePrediction * weights.watchTimeCompletion +
          engagementLikelihood * weights.engagementSignals +
          contentFreshness * weights.contentFreshness +
          qualityAndPopularity * weights.qualityPopularity +
          discoveryAndDiversity * weights.discoveryDiversity) /
        totalWeightSum;

      // In Free Posts mode, slightly reward high-value free videos & follower-unlocked galleries
      if (mode === 'free_posts' && post.visibility === 'followers') {
        totalScore = Math.min(99.8, totalScore + 3.5);
      }

      totalScore = Math.round(totalScore * 10) / 10;

      // Determine human-readable explanation & recommendation type
      let primaryReason = `Recommended for your ${primaryCategory} feed`;
      let recommendationType: RecommendedPostResult['recommendationType'] = 'interest_match';

      if (profile.isColdStart && profile.onboardingCategories.length === 0) {
        primaryReason = `Trending across ACOVON · High completion rate (${post.likesCount} likes)`;
        recommendationType = 'cold_start';
      } else if (recentCatScore >= 35 && recommendationConfig.timeDecayConfig.enableFastInterestShift) {
        primaryReason = `Matches your recent activity in ${primaryCategory}`;
        recommendationType = 'interest_match';
      } else if (creatorAffinity >= 82) {
        primaryReason = `Because you engage with ${post.creatorName}`;
        recommendationType = 'creator_affinity';
      } else if (interestRelevance >= 72) {
        primaryReason = `Top match for your interest in ${primaryCategory}`;
        recommendationType = 'interest_match';
      } else if (collab.peerNote) {
        primaryReason = collab.peerNote;
        recommendationType = 'collaborative_filtering';
      } else if (isUnfollowedCreator && qualityAndPopularity >= 75) {
        primaryReason = `Discover Creator · High-performing in ${primaryCategory}`;
        recommendationType = 'discovery_exploration';
      } else {
        primaryReason = `Trending in ${primaryCategory}`;
        recommendationType = 'trending_quality';
      }

      const accessBadgeLabel =
        post.visibility === 'public'
          ? 'Free Public Post'
          : post.visibility === 'followers'
          ? 'Free Follower Post'
          : post.visibility === 'subscribers'
          ? isSubbed
            ? 'Subscriber Unlocked'
            : 'Subscribers Only'
          : `PPV $${post.ppvPrice?.toFixed(2) || '9.99'}`;

      return {
        post,
        totalScore,
        signalBreakdown: {
          interestRelevance: Math.round(interestRelevance),
          creatorAffinity: Math.round(creatorAffinity),
          watchTimePrediction: Math.round(watchTimePrediction),
          engagementLikelihood: Math.round(engagementLikelihood),
          contentFreshness: Math.round(contentFreshness),
          qualityAndPopularity: Math.round(qualityAndPopularity),
          discoveryAndDiversity: Math.round(discoveryAndDiversity),
          collaborativeFilteringBoost: collab.boost,
          timeDecayMultiplier: timeDecayMult
        },
        primaryReason,
        recommendationType,
        isFreeAccessible,
        accessBadgeLabel
      };
    });

    // Sort descending by totalScore
    const sorted = [...scoredCandidates].sort((a, b) => b.totalScore - a.totalScore);

    // Step 3: Creator Repetition Limit & Category Diversity Post-Processing
    // Prevents a single creator from flooding consecutive slots while keeping highest-ranked interest matches on top
    const maxConsecutive = Math.max(1, recommendationConfig.diversityRules.maxConsecutiveSameCreator);
    const diversified: RecommendedPostResult[] = [];
    const deferred: RecommendedPostResult[] = [];

    for (const item of sorted) {
      const len = diversified.length;
      if (len >= maxConsecutive) {
        let sameCreatorStreak = true;
        for (let k = 1; k <= maxConsecutive; k++) {
          if (diversified[len - k].post.creatorId !== item.post.creatorId) {
            sameCreatorStreak = false;
            break;
          }
        }
        if (sameCreatorStreak) {
          deferred.push(item);
          continue;
        }
      }
      diversified.push(item);
    }

    // Interleave deferred items where they don't violate consecutive creator rules, or append at end
    for (const defItem of deferred) {
      let inserted = false;
      for (let i = 1; i < diversified.length; i++) {
        const prevCreator = diversified[i - 1].post.creatorId;
        const nextCreator = diversified[i].post.creatorId;
        if (prevCreator !== defItem.post.creatorId && nextCreator !== defItem.post.creatorId) {
          diversified.splice(i, 0, defItem);
          inserted = true;
          break;
        }
      }
      if (!inserted) {
        diversified.push(defItem);
      }
    }

    const finalResults = options?.limit ? diversified.slice(0, options.limit) : diversified;
    return finalResults;
  };

  // Next-Video Recommendations when a video finishes or inside Full-Screen Video Player
  const getUpNextVideoRecommendations = (
    currentPostId: string,
    limit = 4
  ): RecommendedPostResult[] => {
    const currentPost = posts.find(p => p.id === currentPostId);
    const allRanked = getRecommendedPosts('for_you');

    const videoCandidates = allRanked.filter(
      item =>
        item.post.id !== currentPostId &&
        item.post.media.some(m => m.type === 'video')
    );

    if (!currentPost) return videoCandidates.slice(0, limit);

    const currentCat = currentPost.categories?.[0];
    const rescored = videoCandidates.map(item => {
      let bonus = 0;
      if (currentCat && item.post.categories?.includes(currentCat)) {
        bonus += 14;
      }
      if (item.post.creatorId === currentPost.creatorId) {
        bonus += 8;
      }
      return {
        ...item,
        totalScore: Math.round((item.totalScore + bonus) * 10) / 10
      };
    });

    return rescored.sort((a, b) => b.totalScore - a.totalScore).slice(0, limit);
  };

  // Personalized Creator Recommendation Engine for Feed, Explore, and Discovery
  const getRecommendedCreators = (
    limit = 6,
    categoryFilter?: string
  ): RecommendedCreatorResult[] => {
    const profile = activeFanInterestProfile;

    const eligibleCreators = creators.filter(c => {
      if (c.accountStatus === 'suspended' || c.accountStatus === 'banned') return false;
      if (profile.hiddenCreatorIds.includes(c.id)) return false;
      if (c.id === currentUser.id) return false;
      if (
        categoryFilter &&
        categoryFilter !== 'All Categories' &&
        c.category !== categoryFilter
      ) {
        return false;
      }
      return true;
    });

    const scoredCreators: RecommendedCreatorResult[] = eligibleCreators.map(creator => {
      const catScore = profile.categoryScores[creator.category] || 0;
      const recentCatScore = profile.recentCategoryScores[creator.category] || 0;
      const creatorAff = profile.creatorAffinityScores[creator.id] || 0;
      const isFollowed = following.includes(creator.id);
      const isSubbed = isSubscribedTo(creator.id);

      // Engagement quality score (Note: paid verification badge does NOT boost ranking score)
      const popularityScore = Math.min(25, creator.followersCount / 3500);
      const discoveryBonus = !isFollowed && !isSubbed ? recommendationConfig.diversityRules.newCreatorDiscoveryBoost : 0;

      const rawScore =
        (profile.isColdStart ? 58 : 32) +
        catScore * 0.42 +
        recentCatScore * 0.35 +
        creatorAff * 0.3 +
        popularityScore +
        discoveryBonus -
        (profile.reducedCategories.includes(creator.category) ? 35 : 0);

      const matchScore = Math.max(12, Math.min(99, Math.round(rawScore)));

      let reason = `Top creator in ${creator.category}`;
      if (profile.isColdStart) {
        reason = `Trending creator in ${creator.category} · ${(creator.followersCount / 1000).toFixed(1)}k followers`;
      } else if (recentCatScore >= 30) {
        reason = `Matches your recent activity in ${creator.category}`;
      } else if (catScore >= 60) {
        reason = `${matchScore}% match for your ${creator.category} interest`;
      } else if (creatorAff >= 65) {
        reason = `Recommended based on your watch & engagement history`;
      } else {
        reason = `Popular with fans who follow similar categories`;
      }

      return {
        creator,
        matchScore,
        score: matchScore,
        reason,
        isRisingNewCreator: creator.followersCount < 45000,
        matchedCategories: [creator.category],
        collaborativeNote: `Followed by patrons interested in ${creator.category}`
      };
    });

    return scoredCreators.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
  };

  // Explicit Fan Personalization Feedback Handler (Not Interested, Show Less, Show More, Hide Creator, Report)
  const submitPostRecommendationFeedback = (
    postId: string,
    feedbackType: 'not_interested' | 'show_less' | 'show_more' | 'hide_creator' | 'report_content',
    details?: string
  ): { success: boolean; message: string } => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) {
      return { success: false, message: 'Post not found.' };
    }

    const primaryCat = targetPost.categories?.[0];
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const feedbackRecord: RecommendationFeedbackRecord = {
      id: `rfb_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      fanId: activeRecommendationFanId,
      fanName: activeFanInterestProfile.fanName,
      postId: targetPost.id,
      creatorId: targetPost.creatorId,
      creatorName: targetPost.creatorName,
      feedbackType,
      category: primaryCat,
      tags: targetPost.tags,
      reasonDetails: details || `Fan selected ${feedbackType} on post ${targetPost.id}`,
      timestamp: nowStr
    };

    setRecommendationFeedbackRecords(prev => [feedbackRecord, ...prev]);

    // Record engagement event
    trackEngagementEvent({
      eventType: feedbackType,
      contentType: targetPost.media.some(m => m.type === 'video') ? 'video' : 'photo',
      contentId: targetPost.id,
      creatorId: targetPost.creatorId,
      creatorName: targetPost.creatorName,
      category: primaryCat,
      hashtags: targetPost.tags,
      sourceSurface: 'for_you'
    });

    // Apply immediate profile mutations
    setFanInterestProfiles(prev => {
      const prof = normalizeFanInterestProfile(prev[activeRecommendationFanId] || activeFanInterestProfile);
      const nextNotInterested = new Set(prof.notInterestedPostIds || []);
      const nextReported = new Set(prof.reportedPostIds || []);
      const nextShowMore = new Set(prof.showMorePostIds || []);
      const nextHiddenCreators = new Set(prof.hiddenCreatorIds || []);
      const nextReducedCats = new Set(prof.reducedCategories || []);
      const nextBoostedCats = new Set(prof.boostedCategories || []);
      const nextCatScores = { ...prof.categoryScores };
      const nextRecentScores = { ...prof.recentCategoryScores };

      if (feedbackType === 'not_interested') {
        nextNotInterested.add(targetPost.id);
        if (primaryCat) {
          nextCatScores[primaryCat] = Math.max(-50, (nextCatScores[primaryCat] || 0) - 12);
          nextRecentScores[primaryCat] = Math.max(-50, (nextRecentScores[primaryCat] || 0) - 12);
        }
      } else if (feedbackType === 'show_less') {
        nextNotInterested.add(targetPost.id);
        if (primaryCat) {
          nextReducedCats.add(primaryCat);
          nextBoostedCats.delete(primaryCat);
          nextCatScores[primaryCat] = Math.max(-50, (nextCatScores[primaryCat] || 0) - 22);
          nextRecentScores[primaryCat] = Math.max(-50, (nextRecentScores[primaryCat] || 0) - 22);
        }
      } else if (feedbackType === 'show_more') {
        nextShowMore.add(targetPost.id);
        nextNotInterested.delete(targetPost.id);
        if (primaryCat) {
          nextBoostedCats.add(primaryCat);
          nextReducedCats.delete(primaryCat);
          nextCatScores[primaryCat] = Math.min(100, (nextCatScores[primaryCat] || 40) + 18);
          nextRecentScores[primaryCat] = Math.min(100, (nextRecentScores[primaryCat] || 20) + 18);
        }
      } else if (feedbackType === 'hide_creator') {
        nextHiddenCreators.add(targetPost.creatorId);
        nextNotInterested.add(targetPost.id);
      } else if (feedbackType === 'report_content') {
        nextNotInterested.add(targetPost.id);
        nextReported.add(targetPost.id);
      }

      return {
        ...prev,
        [activeRecommendationFanId]: {
          ...prof,
          notInterestedPostIds: Array.from(nextNotInterested),
          reportedPostIds: Array.from(nextReported),
          showMorePostIds: Array.from(nextShowMore),
          hiddenCreatorIds: Array.from(nextHiddenCreators),
          reducedCategories: Array.from(nextReducedCats),
          boostedCategories: Array.from(nextBoostedCats),
          categoryScores: nextCatScores,
          recentCategoryScores: nextRecentScores,
          lastUpdatedAt: nowStr
        }
      };
    });

    // If feedbackType is 'report_content', route directly into the existing Moderation Reports queue
    if (feedbackType === 'report_content') {
      const newReport: ModerationReport = {
        id: `rep_${Date.now()}`,
        reporterId: currentUser.id,
        reporterName: currentUser.name,
        targetType: 'post',
        targetId: targetPost.id,
        targetTitle: `Post by @${targetPost.creatorUsername}: "${targetPost.content.slice(0, 48)}..."`,
        reason: details || 'tos_violation',
        details: `Reported from Feed Personalization Menu (${details || 'Community Policy Review'})`,
        status: 'open',
        createdAt: nowStr.slice(0, 16),
        actionHistory: [
          {
            timestamp: nowStr.slice(0, 16),
            actor: currentUser.name,
            action: 'Submitted content report via Feed Recommendation Menu'
          }
        ]
      };
      setReports(prev => [newReport, ...prev]);
      return {
        success: true,
        message: 'Post hidden from your feed and routed to Trust & Safety Moderation.'
      };
    }

    if (feedbackType === 'hide_creator') {
      return {
        success: true,
        message: `Hidden all future recommendations from ${targetPost.creatorName}. Manage hidden creators anytime in Settings.`
      };
    }
    if (feedbackType === 'show_less') {
      return {
        success: true,
        message: `We'll show fewer posts in ${primaryCat || 'this topic'} and similar tags.`
      };
    }
    if (feedbackType === 'show_more') {
      return {
        success: true,
        message: `Got it! We'll prioritize more ${primaryCat || 'similar'} content and creators like ${targetPost.creatorName}.`
      };
    }
    return {
      success: true,
      message: 'Post removed from your recommendations. Your feed preferences have been updated.'
    };
  };

  // Fan Settings: Manage interest categories (boost, reduce, or remove)
  const updateFanCategoryPreference = (
    category: string,
    action: 'boost' | 'reduce' | 'remove'
  ) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setFanInterestProfiles(prev => {
      const prof = prev[activeRecommendationFanId] || activeFanInterestProfile;
      const nextCatScores = { ...prof.categoryScores };
      const nextRecentScores = { ...prof.recentCategoryScores };
      const nextLongScores = { ...prof.longTermCategoryScores };
      const nextReduced = new Set(prof.reducedCategories);
      const nextBoosted = new Set(prof.boostedCategories);
      const nextOnboarding = new Set(prof.onboardingCategories);

      if (action === 'boost') {
        nextBoosted.add(category);
        nextReduced.delete(category);
        nextCatScores[category] = Math.min(100, Math.max(75, (nextCatScores[category] || 50) + 25));
        nextRecentScores[category] = Math.min(100, (nextRecentScores[category] || 25) + 25);
      } else if (action === 'reduce') {
        nextReduced.add(category);
        nextBoosted.delete(category);
        nextCatScores[category] = Math.max(-35, (nextCatScores[category] || 20) - 35);
        nextRecentScores[category] = Math.max(-35, (nextRecentScores[category] || 10) - 25);
      } else if (action === 'remove') {
        delete nextCatScores[category];
        delete nextRecentScores[category];
        delete nextLongScores[category];
        nextBoosted.delete(category);
        nextReduced.delete(category);
        nextOnboarding.delete(category);
      }

      return {
        ...prev,
        [activeRecommendationFanId]: {
          ...prof,
          categoryScores: nextCatScores,
          recentCategoryScores: nextRecentScores,
          longTermCategoryScores: nextLongScores,
          reducedCategories: Array.from(nextReduced),
          boostedCategories: Array.from(nextBoosted),
          onboardingCategories: Array.from(nextOnboarding),
          lastUpdatedAt: nowStr
        }
      };
    });
  };

  const setFanOnboardingCategories = (categories: string[]) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setFanInterestProfiles(prev => {
      const prof = prev[activeRecommendationFanId] || activeFanInterestProfile;
      const nextCatScores = { ...prof.categoryScores };
      const nextRecentScores = { ...prof.recentCategoryScores };

      categories.forEach(cat => {
        if ((nextCatScores[cat] || 0) < 75) {
          nextCatScores[cat] = 82;
          nextRecentScores[cat] = 45;
        }
      });

      return {
        ...prev,
        [activeRecommendationFanId]: {
          ...prof,
          onboardingCategories: categories,
          boostedCategories: Array.from(new Set([...prof.boostedCategories, ...categories])),
          categoryScores: nextCatScores,
          recentCategoryScores: nextRecentScores,
          isColdStart: false,
          lastUpdatedAt: nowStr
        }
      };
    });
  };

  const unhideCreatorForFan = (creatorId: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setFanInterestProfiles(prev => {
      const prof = prev[activeRecommendationFanId] || activeFanInterestProfile;
      return {
        ...prev,
        [activeRecommendationFanId]: {
          ...prof,
          hiddenCreatorIds: prof.hiddenCreatorIds.filter(id => id !== creatorId),
          lastUpdatedAt: nowStr
        }
      };
    });
  };

  const resetFanRecommendations = (fanIdOverride?: string) => {
    const targetId = fanIdOverride || activeRecommendationFanId;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setFanInterestProfiles(prev => {
      const prof = normalizeFanInterestProfile(prev[targetId] || activeFanInterestProfile);
      return {
        ...prev,
        [targetId]: {
          ...prof,
          categoryScores: {},
          recentCategoryScores: {},
          longTermCategoryScores: {},
          hashtagScores: {},
          creatorAffinityScores: {},
          skippedCategories: {},
          reducedCategories: [],
          boostedCategories: [],
          hiddenCreatorIds: [],
          notInterestedPostIds: [],
          reportedPostIds: [],
          showMorePostIds: [],
          onboardingCategories: [],
          isColdStart: true,
          totalEventsProcessed: 0,
          lastUpdatedAt: nowStr
        }
      };
    });
  };

  // Admin Recommendation Engine Management Controls
  const adminUpdateRecommendationConfig = (
    updates: Partial<RecommendationEngineConfig>,
    auditSummary: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return {
        success: false,
        error: 'Access Denied: Only Super Admins and General Admins can modify recommendation ranking weights.'
      };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const auditItem = {
      id: `raudit_${Date.now()}`,
      adminName: currentUser.name,
      adminRole: activeAdminPermissionLevel,
      summary: auditSummary,
      timestamp: nowStr
    };

    setRecommendationConfig(prev => ({
      ...prev,
      ...updates,
      updatedAt: nowStr,
      updatedByAdmin: `${currentUser.name} (${activeAdminPermissionLevel})`,
      configAuditHistory: [auditItem, ...prev.configAuditHistory]
    }));

    logAdminAction({
      category: 'recommendation_engine',
      action: 'Updated Recommendation Engine Configuration',
      targetType: 'RecommendationEngineConfig',
      targetId: recommendationConfig.id,
      targetLabel: recommendationConfig.rankingVersion,
      details: auditSummary,
      severity: 'info'
    });

    return { success: true };
  };

  const adminToggleRecommendationExperimentPause = (
    reason: string
  ): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return {
        success: false,
        error: 'Access Denied: Only Super Admins and General Admins can pause or restore recommendation experiments.'
      };
    }

    const nextPaused = !recommendationConfig.isExperimentPaused;
    return adminUpdateRecommendationConfig(
      { isExperimentPaused: nextPaused },
      `${nextPaused ? 'Paused' : 'Restored'} recommendation experiment "${recommendationConfig.activeExperimentName}". Reason: ${reason || 'Admin control action'}`
    );
  };

  const adminResetRecommendationWeightsToDefault = (): { success: boolean; error?: string } => {
    if (!hasAdminPermission(['super_admin', 'admin'])) {
      return { success: false, error: 'Unauthorized' };
    }

    return adminUpdateRecommendationConfig(
      {
        rankingWeights: INITIAL_RECOMMENDATION_CONFIG.rankingWeights,
        signalPointWeights: INITIAL_RECOMMENDATION_CONFIG.signalPointWeights,
        timeDecayConfig: INITIAL_RECOMMENDATION_CONFIG.timeDecayConfig,
        diversityRules: INITIAL_RECOMMENDATION_CONFIG.diversityRules,
        eligibleContentTypes: INITIAL_RECOMMENDATION_CONFIG.eligibleContentTypes,
        isExperimentPaused: false
      },
      'Restored all recommendation ranking weights, signal scores, time-decay multipliers, and diversity thresholds to factory defaults.'
    );
  };

  const recommendationSystemHealth: RecommendationSystemHealth = {
    engineStatus: recommendationConfig.isExperimentPaused ? 'paused' : 'healthy',
    rankingModelVersion: recommendationConfig.rankingVersion,
    lastModelUpdateAt: recommendationConfig.updatedAt,
    eventsProcessedCount:
      Object.values(fanInterestProfiles).reduce((sum, p) => sum + (p.totalEventsProcessed || 0), 0) +
      engagementEvents.length,
    recommendationJobsProcessed: 1420 + engagementEvents.length * 3,
    rankingFailuresCount: 0,
    avgEventProcessingDelayMs: 14,
    postsMissingMetadataCount: posts.filter(p => !p.categories || p.categories.length === 0).length,
    cacheHitRatePercent: 98.4
  };

  // ============================================================================
  // ADMIN-CONTROLLED ANNOUNCEMENT & PLATFORM COMMUNICATION SYSTEM
  // ============================================================================
  const [announcements, setAnnouncements] = useState<PlatformAnnouncement[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_platform_announcements_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((ann: PlatformAnnouncement) => ({
            ...ann,
            displayFormats: Array.isArray(ann.displayFormats)
              ? ann.displayFormats
              : (['announcement_center'] as AnnouncementDisplayFormat[]),
            versionHistory: Array.isArray(ann.versionHistory) ? ann.versionHistory : [],
            cta: ann.cta || { enabled: false, label: '', destinationUrl: '', openMode: 'internal' }
          }));
        }
      }
    } catch {
      // fallback
    }
    return INITIAL_PLATFORM_ANNOUNCEMENTS;
  });

  const [announcementRecipients, setAnnouncementRecipients] = useState<AnnouncementRecipientRecord[]>(() => {
    try {
      const saved = localStorage.getItem('acovon_announcement_recipients_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_ANNOUNCEMENT_RECIPIENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('acovon_platform_announcements_v1', JSON.stringify(announcements));
    } catch {
      // ignore
    }
  }, [announcements]);

  useEffect(() => {
    try {
      localStorage.setItem('acovon_announcement_recipients_v1', JSON.stringify(announcementRecipients));
    } catch {
      // ignore
    }
  }, [announcementRecipients]);

  // Helper: Check if a given user role is eligible for an announcement audience
  const isRoleEligibleForAudience = (
    effectiveUserRole: 'fan' | 'creator' | 'admin',
    audience: AnnouncementAudience
  ): boolean => {
    if (audience === 'everyone') {
      return effectiveUserRole === 'fan' || effectiveUserRole === 'creator';
    }
    if (audience === 'fans_only') {
      return effectiveUserRole === 'fan';
    }
    if (audience === 'creators_only') {
      return effectiveUserRole === 'creator';
    }
    return false;
  };

  // Helper: Determine current user's effective Fan vs Creator role for strict audience isolation
  const getCurrentEffectiveAudienceRole = (): 'fan' | 'creator' => {
    if (currentUser.role === 'creator' || activeRole === 'creator') {
      return 'creator';
    }
    return 'fan';
  };

  // Helper: Validate internal or external CTA destination
  const validateAnnouncementCta = (cta: AnnouncementCtaConfig): { valid: boolean; error?: string } => {
    if (!cta.enabled) return { valid: true };
    if (!cta.label || !cta.label.trim()) {
      return { valid: false, error: 'CTA Button Label is required when Call-to-Action is enabled.' };
    }
    if (!cta.destinationUrl || !cta.destinationUrl.trim()) {
      return { valid: false, error: 'CTA Destination URL or Platform Route is required when Call-to-Action is enabled.' };
    }
    const url = cta.destinationUrl.trim();
    if ( url.toLowerCase().startsWith('javascript:') || url.toLowerCase().startsWith('data:') ) {
      return { valid: false, error: 'Unsafe CTA URL protocol rejected.' };
    }
    if (cta.openMode === 'external' && !/^https?:\/\//i.test(url)) {
      return { valid: false, error: 'External CTA destinations must start with https:// or http://.' };
    }
    return { valid: true };
  };

  // Helper: Deliver notifications & recipient records to eligible users (idempotent per announcementId + userId)
  const dispatchAnnouncementToAudience = (
    announcement: PlatformAnnouncement,
    existingRecipients: AnnouncementRecipientRecord[]
  ): {
    newRecipients: AnnouncementRecipientRecord[];
    newNotifications: AppNotification[];
  } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const eligibleAccounts: { id: string; name: string; username: string; role: 'fan' | 'creator'; status?: AccountStatus }[] = [];

    if (announcement.audience === 'fans_only' || announcement.audience === 'everyone') {
      Object.values(users).forEach(u => {
        if (u.role === 'fan' && (!u.accountStatus || u.accountStatus === 'active' || u.accountStatus === 'restricted')) {
          eligibleAccounts.push({
            id: u.id,
            name: u.name,
            username: u.username,
            role: 'fan',
            status: u.accountStatus
          });
        }
      });
    }

    if (announcement.audience === 'creators_only' || announcement.audience === 'everyone') {
      creators.forEach(c => {
        if (!c.accountStatus || c.accountStatus === 'active' || c.accountStatus === 'restricted') {
          eligibleAccounts.push({
            id: c.id,
            name: c.name,
            username: c.username,
            role: 'creator',
            status: c.accountStatus
          });
        }
      });
    }

    const existingKeys = new Set(
      existingRecipients
        .filter(r => r.announcementId === announcement.id)
        .map(r => r.userId)
    );

    const newRecipients: AnnouncementRecipientRecord[] = [];
    const newNotifications: AppNotification[] = [];

    eligibleAccounts.forEach(acc => {
      if (existingKeys.has(acc.id)) return; // Prevent duplicate delivery

      const notifStatus: AnnouncementRecipientRecord['notificationStatus'] =
        announcement.notificationMode === 'silent_display' ? 'skipped_silent' : 'delivered';

      const notifChannel: AnnouncementRecipientRecord['notificationChannel'] =
        announcement.notificationMode === 'in_app_and_email'
          ? 'in_app_and_email'
          : announcement.notificationMode === 'in_app_only'
          ? 'in_app'
          : 'none';

      newRecipients.push({
        id: `arec_${announcement.id}_${acc.id}_${Date.now()}`,
        announcementId: announcement.id,
        userId: acc.id,
        userName: acc.name,
        userUsername: acc.username,
        userRole: acc.role,
        audienceEligibility: announcement.audience,
        deliveredAt: nowStr,
        notificationStatus: notifStatus,
        notificationChannel: notifChannel
      });

      if (announcement.notificationMode !== 'silent_display') {
        newNotifications.push({
          id: `notif_ann_${announcement.id}_${acc.id}`,
          userId: acc.id,
          type: 'announcement',
          title: `[${announcement.category}] ${announcement.title}`,
          message: announcement.summary || announcement.title,
          read: false,
          createdAt: 'Just now',
          linkUrl: `announcement:${announcement.id}`,
          announcementId: announcement.id,
          targetAudience: announcement.audience
        });
      }
    });

    return { newRecipients, newNotifications };
  };

  // Automatic sweep for due scheduled announcements & expired announcements
  const adminSimulateScheduledAndExpirySweep = (): { publishedCount: number; expiredCount: number } => {
    const nowIso = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let publishedCount = 0;
    let expiredCount = 0;

    setAnnouncements(prev => {
      let changed = false;
      const updated = prev.map(ann => {
        if (ann.status === 'scheduled' && ann.publishAt && ann.publishAt <= nowIso) {
          changed = true;
          publishedCount += 1;
          return {
            ...ann,
            status: 'published' as AnnouncementStatus,
            publishedAt: nowIso,
            notificationSentAt: ann.notificationSentAt || nowIso,
            updatedAt: nowIso
          };
        }
        if (ann.status === 'published' && ann.expiresAt && ann.expiresAt <= nowIso) {
          changed = true;
          expiredCount += 1;
          return {
            ...ann,
            status: 'expired' as AnnouncementStatus,
            updatedAt: nowIso
          };
        }
        return ann;
      });
      return changed ? updated : prev;
    });

    return { publishedCount, expiredCount };
  };

  useEffect(() => {
    const interval = setInterval(() => {
      adminSimulateScheduledAndExpirySweep();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Strict RBAC Permission Validator for Admin Announcement Actions
  const canAdminPerformAnnouncementAction = (
    actionType: 'view' | 'create_draft' | 'edit' | 'publish' | 'schedule' | 'pause_resume' | 'archive' | 'delete',
    category?: AnnouncementCategory,
    targetStatus?: AnnouncementStatus
  ): { allowed: boolean; reason?: string } => {
    const level = activeAdminPermissionLevel;

    // Super Admin has full announcement management permissions
    if (level === 'super_admin') {
      return { allowed: true };
    }

    // General Admin can create, edit, schedule, publish, pause/resume, archive, and view
    if (level === 'admin') {
      if (actionType === 'delete') {
        return {
          allowed: false,
          reason: 'General Admins can archive announcements, but permanent deletion requires Super Admin authority.'
        };
      }
      return { allowed: true };
    }

    // Finance Admin can view all announcements and create/edit/publish Payment Update announcements
    if (level === 'finance_admin') {
      if (actionType === 'view') return { allowed: true };
      if (category === 'Payment Update' && ['create_draft', 'edit', 'publish', 'schedule', 'pause_resume', 'archive'].includes(actionType)) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Finance & Treasury Admins are only authorized to create, edit, or publish "Payment Update" announcements.'
      };
    }

    // Support Admin can view announcements and create/edit drafts, but cannot publish, schedule, pause, or delete
    if (level === 'support_admin') {
      if (actionType === 'view' || actionType === 'create_draft') {
        return { allowed: true };
      }
      if (actionType === 'edit' && (!targetStatus || targetStatus === 'draft')) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: 'Support Admins may create and edit Draft announcements, but publishing, scheduling, or archiving requires General Admin or Super Admin authorization.'
      };
    }

    // Moderator has read-only access unless elevated
    if (level === 'moderator') {
      if (actionType === 'view') return { allowed: true };
      return {
        allowed: false,
        reason: 'Trust & Safety Moderators have read-only access to Announcement Management.'
      };
    }

    return { allowed: false, reason: 'Unauthorized admin role.' };
  };

  // STRICT AUDIENCE-ISOLATED SELECTOR: Visible announcements for the current authenticated user's role
  const getVisibleAnnouncementsForCurrentUser = (options?: {
    displayFormat?: AnnouncementDisplayFormat;
    includeExpired?: boolean;
  }): PlatformAnnouncement[] => {
    const effectiveRole = getCurrentEffectiveAudienceRole(); // 'fan' | 'creator'
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    return announcements
      .filter(ann => {
        // Never return drafts, scheduled, paused, archived, or deleted to fans/creators
        if (ann.status !== 'published' && !(options?.includeExpired && ann.status === 'expired')) {
          return false;
        }
        // Check expiration timestamp in real time
        if (!options?.includeExpired && ann.expiresAt && ann.expiresAt <= nowStr) {
          return false;
        }
        // Check future publishAt timestamp in real time
        if (ann.publishAt && ann.publishAt > nowStr) {
          return false;
        }
        // STRICT AUDIENCE ISOLATION:
        // Fans Only -> only 'fan'
        // Creators Only -> only 'creator'
        // Everyone -> 'fan' or 'creator'
        if (!isRoleEligibleForAudience(effectiveRole, ann.audience)) {
          return false;
        }
        // Optional display format filter
        if (options?.displayFormat && !(ann.displayFormats || []).includes(options.displayFormat)) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const prioWeight: Record<AnnouncementPriority, number> = {
          urgent: 3,
          important: 2,
          normal: 1
        };
        if (prioWeight[b.priority] !== prioWeight[a.priority]) {
          return prioWeight[b.priority] - prioWeight[a.priority];
        }
        return (b.publishedAt || b.createdAt).localeCompare(a.publishedAt || a.createdAt);
      });
  };

  // STRICT AUDIENCE-ISOLATED ID LOOKUP (prevents direct URL / ID cross-role access)
  const getAnnouncementByIdForCurrentUser = (
    announcementId: string
  ): { accessible: boolean; announcement?: PlatformAnnouncement; error?: string } => {
    const ann = announcements.find(a => a.id === announcementId);
    if (!ann || ann.status === 'deleted') {
      return { accessible: false, error: 'Announcement not found.' };
    }
    const effectiveRole = getCurrentEffectiveAudienceRole();
    if (!isRoleEligibleForAudience(effectiveRole, ann.audience)) {
      return {
        accessible: false,
        error:
          ann.audience === 'creators_only'
            ? 'Access Denied: This announcement is restricted exclusively to ACOVON Creator accounts.'
            : 'Access Denied: This announcement is restricted exclusively to ACOVON Fan accounts.'
      };
    }
    if (ann.status !== 'published') {
      return {
        accessible: false,
        error: 'This announcement is not currently active.'
      };
    }
    return { accessible: true, announcement: ann };
  };

  // Per-user read, acknowledgment, and dismissal status
  const getUserAnnouncementStatus = (announcementId: string, userIdOverride?: string) => {
    const targetUserId = userIdOverride || currentUser.id;
    const rec = announcementRecipients.find(
      r => r.announcementId === announcementId && r.userId === targetUserId
    );
    return {
      isRead: Boolean(rec?.readAt),
      isAcknowledged: Boolean(rec?.acknowledgedAt),
      isBannerDismissed: Boolean(rec?.dismissedBannerAt),
      isPopupDismissed: Boolean(rec?.dismissedPopupAt),
      recipientRecord: rec
    };
  };

  const getUnreadAnnouncementCountForCurrentUser = (): number => {
    const visible = getVisibleAnnouncementsForCurrentUser();
    return visible.filter(ann => {
      const st = getUserAnnouncementStatus(ann.id, currentUser.id);
      return !st.isRead;
    }).length;
  };

  const upsertUserRecipientStatus = (
    announcementId: string,
    updater: (existing?: AnnouncementRecipientRecord) => Partial<AnnouncementRecipientRecord>
  ): { success: boolean; error?: string } => {
    const check = getAnnouncementByIdForCurrentUser(announcementId);
    if (!check.accessible || !check.announcement) {
      return { success: false, error: check.error || 'Unauthorized access to announcement.' };
    }
    const ann = check.announcement;
    const effectiveRole = getCurrentEffectiveAudienceRole();
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    setAnnouncementRecipients(prev => {
      const idx = prev.findIndex(r => r.announcementId === announcementId && r.userId === currentUser.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          ...updater(updated[idx])
        };
        return updated;
      } else {
        const newRec: AnnouncementRecipientRecord = {
          id: `arec_${announcementId}_${currentUser.id}_${Date.now()}`,
          announcementId,
          userId: currentUser.id,
          userName: currentUser.name,
          userUsername: currentUser.username,
          userRole: effectiveRole,
          audienceEligibility: ann.audience,
          deliveredAt: ann.publishedAt || nowStr,
          notificationStatus: ann.notificationMode === 'silent_display' ? 'skipped_silent' : 'delivered',
          notificationChannel:
            ann.notificationMode === 'in_app_and_email'
              ? 'in_app_and_email'
              : ann.notificationMode === 'in_app_only'
              ? 'in_app'
              : 'none',
          ...updater(undefined)
        };
        return [...prev, newRec];
      }
    });

    return { success: true };
  };

  const markAnnouncementAsRead = (announcementId: string): { success: boolean; error?: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const res = upsertUserRecipientStatus(announcementId, existing => ({
      readAt: existing?.readAt || nowStr
    }));
    if (res.success) {
      // Also mark matching in-app notification as read for current user
      setNotifications(prev =>
        prev.map(n =>
          n.announcementId === announcementId && n.userId === currentUser.id ? { ...n, read: true } : n
        )
      );
    }
    return res;
  };

  const acknowledgeAnnouncement = (announcementId: string): { success: boolean; error?: string } => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const res = upsertUserRecipientStatus(announcementId, existing => ({
      readAt: existing?.readAt || nowStr,
      acknowledgedAt: existing?.acknowledgedAt || nowStr,
      dismissedPopupAt: existing?.dismissedPopupAt || nowStr
    }));
    if (res.success) {
      setNotifications(prev =>
        prev.map(n =>
          n.announcementId === announcementId && n.userId === currentUser.id ? { ...n, read: true } : n
        )
      );
    }
    return res;
  };

  const dismissAnnouncementBanner = (announcementId: string) => {
    const ann = announcements.find(a => a.id === announcementId);
    // Persistent notices requiring acknowledgment cannot be dismissed without acknowledging
    if (ann?.requiresAcknowledgment && ann.displayFormats.includes('persistent_notice')) {
      const st = getUserAnnouncementStatus(announcementId);
      if (!st.isAcknowledged) return;
    }
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    upsertUserRecipientStatus(announcementId, existing => ({
      readAt: existing?.readAt || nowStr,
      dismissedBannerAt: nowStr
    }));
  };

  const dismissAnnouncementPopup = (announcementId: string) => {
    const ann = announcements.find(a => a.id === announcementId);
    if (ann?.requiresAcknowledgment) {
      const st = getUserAnnouncementStatus(announcementId);
      if (!st.isAcknowledged) return;
    }
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    upsertUserRecipientStatus(announcementId, existing => ({
      readAt: existing?.readAt || nowStr,
      dismissedPopupAt: nowStr
    }));
  };

  // ADMIN ACTION: Create Announcement
  const adminCreateAnnouncement = (input: {
    title: string;
    summary: string;
    bodyHtml: string;
    category: AnnouncementCategory;
    priority: AnnouncementPriority;
    audience: AnnouncementAudience;
    status: 'draft' | 'scheduled' | 'published';
    displayFormats: AnnouncementDisplayFormat[];
    requiresAcknowledgment: boolean;
    isMandatoryNotice: boolean;
    imageUrl?: string;
    imageFileName?: string;
    imageFileSizeKb?: number;
    cta: AnnouncementCtaConfig;
    notificationMode: AnnouncementNotificationMode;
    timezone: string;
    publishAt?: string;
    expiresAt?: string;
  }): { success: boolean; announcement?: PlatformAnnouncement; error?: string } => {
    const requiredAction =
      input.status === 'published'
        ? 'publish'
        : input.status === 'scheduled'
        ? 'schedule'
        : 'create_draft';

    const perm = canAdminPerformAnnouncementAction(requiredAction, input.category, input.status);
    if (!perm.allowed) {
      return { success: false, error: perm.reason || 'Permission denied.' };
    }

    if (!input.title.trim()) {
      return { success: false, error: 'Announcement title is required.' };
    }
    if (!input.bodyHtml.trim()) {
      return { success: false, error: 'Announcement content body is required.' };
    }
    if (!input.audience) {
      return { success: false, error: 'Target audience selection (Fans Only, Creators Only, or Everyone) is required.' };
    }
    if (input.displayFormats.length === 0) {
      return { success: false, error: 'Select at least one display format (e.g., Announcement Center).' };
    }

    const ctaCheck = validateAnnouncementCta(input.cta);
    if (!ctaCheck.valid) {
      return { success: false, error: ctaCheck.error };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    if (input.status === 'scheduled') {
      if (!input.publishAt) {
        return { success: false, error: 'Scheduled announcements require a publication date and time.' };
      }
      if (input.publishAt <= nowStr) {
        return { success: false, error: 'Scheduled publication date/time must be in the future.' };
      }
    }

    if (input.expiresAt && input.publishAt && input.expiresAt <= input.publishAt) {
      return { success: false, error: 'Expiration date/time must be after the publication date/time.' };
    }

    const newAnnouncement: PlatformAnnouncement = {
      id: `ann_${Date.now()}`,
      title: input.title.trim(),
      summary: input.summary.trim() || input.title.trim(),
      bodyHtml: input.bodyHtml,
      category: input.category,
      priority: input.priority,
      audience: input.audience,
      status: input.status,
      displayFormats: input.displayFormats,
      requiresAcknowledgment: input.requiresAcknowledgment,
      isMandatoryNotice: input.isMandatoryNotice,
      imageUrl: input.imageUrl,
      imageFileName: input.imageFileName,
      imageFileSizeKb: input.imageFileSizeKb,
      cta: input.cta,
      notificationMode: input.notificationMode,
      notificationSentAt: input.status === 'published' ? nowStr : undefined,
      timezone: input.timezone || 'UTC',
      publishAt: input.publishAt || (input.status === 'published' ? nowStr : undefined),
      publishedAt: input.status === 'published' ? nowStr : undefined,
      expiresAt: input.expiresAt || undefined,
      createdByAdminId: currentUser.id,
      createdByAdminName: currentUser.name,
      createdByAdminRole: activeAdminPermissionLevel,
      updatedByAdminId: currentUser.id,
      updatedByAdminName: currentUser.name,
      updatedByAdminRole: activeAdminPermissionLevel,
      createdAt: nowStr,
      updatedAt: nowStr,
      versionCount: 1,
      versionHistory: []
    };

    setAnnouncements(prev => [newAnnouncement, ...prev]);

    if (input.status === 'published') {
      const { newRecipients, newNotifications } = dispatchAnnouncementToAudience(
        newAnnouncement,
        announcementRecipients
      );
      if (newRecipients.length > 0) {
        setAnnouncementRecipients(prev => [...newRecipients, ...prev]);
      }
      if (newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    }

    logAdminAction({
      category: 'announcement_management',
      action:
        input.status === 'published'
          ? 'Created & Published Announcement'
          : input.status === 'scheduled'
          ? 'Scheduled Announcement'
          : 'Created Announcement Draft',
      targetType: 'PlatformAnnouncement',
      targetId: newAnnouncement.id,
      targetLabel: newAnnouncement.title,
      details: `Audience: ${newAnnouncement.audience} | Category: ${newAnnouncement.category} | Priority: ${newAnnouncement.priority} | Status: ${newAnnouncement.status}`,
      severity: newAnnouncement.priority === 'urgent' ? 'warning' : 'info'
    });

    return { success: true, announcement: newAnnouncement };
  };

  // ADMIN ACTION: Update Announcement (with Version History & Duplicate Notification Prevention)
  const adminUpdateAnnouncement = (
    announcementId: string,
    updates: Partial<Omit<PlatformAnnouncement, 'id' | 'createdAt' | 'createdByAdminId' | 'createdByAdminName' | 'createdByAdminRole' | 'versionHistory' | 'versionCount'>>,
    changeSummary?: string
  ): { success: boolean; announcement?: PlatformAnnouncement; error?: string } => {
    const existing = announcements.find(a => a.id === announcementId);
    if (!existing) {
      return { success: false, error: 'Announcement not found.' };
    }

    const nextCategory = updates.category || existing.category;
    const nextStatus = updates.status || existing.status;

    const actionNeeded =
      nextStatus === 'published' && existing.status !== 'published'
        ? 'publish'
        : nextStatus === 'scheduled' && existing.status !== 'scheduled'
        ? 'schedule'
        : 'edit';

    const perm = canAdminPerformAnnouncementAction(actionNeeded, nextCategory, existing.status);
    if (!perm.allowed) {
      return { success: false, error: perm.reason || 'Permission denied.' };
    }

    if (updates.cta) {
      const ctaCheck = validateAnnouncementCta(updates.cta);
      if (!ctaCheck.valid) {
        return { success: false, error: ctaCheck.error };
      }
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const wasAlreadyPublished = existing.status === 'published' || Boolean(existing.publishedAt);
    const isNowPublishingFirstTime = !wasAlreadyPublished && nextStatus === 'published';

    const newVersionEntry: AnnouncementVersionHistory | null = wasAlreadyPublished
      ? {
          id: `avh_${Date.now()}`,
          announcementId: existing.id,
          versionNumber: existing.versionCount,
          editedAt: nowStr,
          editedByAdminId: currentUser.id,
          editedByAdminName: currentUser.name,
          editedByAdminRole: activeAdminPermissionLevel,
          changeSummary:
            changeSummary ||
            `Updated announcement (${
              updates.audience && updates.audience !== existing.audience
                ? `audience changed ${existing.audience} → ${updates.audience}`
                : 'content/settings revised'
            }) without sending duplicate notifications.`,
          snapshotTitle: existing.title,
          snapshotAudience: existing.audience,
          snapshotPriority: existing.priority
        }
      : null;

    const updatedAnnouncement: PlatformAnnouncement = {
      ...existing,
      ...updates,
      publishedAt: isNowPublishingFirstTime ? nowStr : existing.publishedAt,
      notificationSentAt: isNowPublishingFirstTime ? nowStr : existing.notificationSentAt,
      updatedByAdminId: currentUser.id,
      updatedByAdminName: currentUser.name,
      updatedByAdminRole: activeAdminPermissionLevel,
      updatedAt: nowStr,
      versionCount: newVersionEntry ? existing.versionCount + 1 : existing.versionCount,
      versionHistory: newVersionEntry
        ? [newVersionEntry, ...existing.versionHistory]
        : existing.versionHistory
    };

    setAnnouncements(prev => prev.map(a => (a.id === announcementId ? updatedAnnouncement : a)));

    // If transitioning to published or audience expanded while published, dispatch only to new eligible recipients (no duplicates)
    if (updatedAnnouncement.status === 'published') {
      const { newRecipients, newNotifications } = dispatchAnnouncementToAudience(
        updatedAnnouncement,
        announcementRecipients
      );
      if (newRecipients.length > 0) {
        setAnnouncementRecipients(prev => [...newRecipients, ...prev]);
      }
      if (isNowPublishingFirstTime && newNotifications.length > 0) {
        setNotifications(prev => [...newNotifications, ...prev]);
      }
    }

    logAdminAction({
      category: 'announcement_management',
      action: 'Edited Announcement',
      targetType: 'PlatformAnnouncement',
      targetId: updatedAnnouncement.id,
      targetLabel: updatedAnnouncement.title,
      details: `${changeSummary || 'Updated announcement fields'} | Audience: ${updatedAnnouncement.audience} | Status: ${updatedAnnouncement.status}`,
      severity: 'info'
    });

    return { success: true, announcement: updatedAnnouncement };
  };

  // ADMIN ACTION: Publish Draft or Scheduled Announcement Immediately
  const adminPublishAnnouncement = (announcementId: string): { success: boolean; error?: string } => {
    const existing = announcements.find(a => a.id === announcementId);
    if (!existing) return { success: false, error: 'Announcement not found.' };

    const perm = canAdminPerformAnnouncementAction('publish', existing.category, existing.status);
    if (!perm.allowed) return { success: false, error: perm.reason };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated: PlatformAnnouncement = {
      ...existing,
      status: 'published',
      publishedAt: existing.publishedAt || nowStr,
      notificationSentAt: existing.notificationSentAt || nowStr,
      updatedByAdminId: currentUser.id,
      updatedByAdminName: currentUser.name,
      updatedByAdminRole: activeAdminPermissionLevel,
      updatedAt: nowStr
    };

    setAnnouncements(prev => prev.map(a => (a.id === announcementId ? updated : a)));

    const { newRecipients, newNotifications } = dispatchAnnouncementToAudience(
      updated,
      announcementRecipients
    );
    if (newRecipients.length > 0) {
      setAnnouncementRecipients(prev => [...newRecipients, ...prev]);
    }
    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
    }

    logAdminAction({
      category: 'announcement_management',
      action: 'Published Announcement Immediately',
      targetType: 'PlatformAnnouncement',
      targetId: updated.id,
      targetLabel: updated.title,
      details: `Published to audience "${updated.audience}" (${newRecipients.length} new eligible recipients notified).`,
      severity: updated.priority === 'urgent' ? 'warning' : 'info'
    });

    return { success: true };
  };

  // ADMIN ACTION: Pause / Resume Published Announcement
  const adminPauseResumeAnnouncement = (
    announcementId: string,
    nextStatus: 'paused' | 'published',
    reason?: string
  ): { success: boolean; error?: string } => {
    const existing = announcements.find(a => a.id === announcementId);
    if (!existing) return { success: false, error: 'Announcement not found.' };

    const perm = canAdminPerformAnnouncementAction('pause_resume', existing.category, existing.status);
    if (!perm.allowed) return { success: false, error: perm.reason };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setAnnouncements(prev =>
      prev.map(a =>
        a.id === announcementId
          ? {
              ...a,
              status: nextStatus,
              updatedByAdminId: currentUser.id,
              updatedByAdminName: currentUser.name,
              updatedByAdminRole: activeAdminPermissionLevel,
              updatedAt: nowStr
            }
          : a
      )
    );

    logAdminAction({
      category: 'announcement_management',
      action: nextStatus === 'paused' ? 'Paused Announcement' : 'Resumed Announcement',
      targetType: 'PlatformAnnouncement',
      targetId: existing.id,
      targetLabel: existing.title,
      details: `Changed status to ${nextStatus}.${reason ? ` Reason: ${reason}` : ''}`,
      severity: 'info'
    });

    return { success: true };
  };

  // ADMIN ACTION: Archive Announcement
  const adminArchiveAnnouncement = (
    announcementId: string,
    reason?: string
  ): { success: boolean; error?: string } => {
    const existing = announcements.find(a => a.id === announcementId);
    if (!existing) return { success: false, error: 'Announcement not found.' };

    const perm = canAdminPerformAnnouncementAction('archive', existing.category, existing.status);
    if (!perm.allowed) return { success: false, error: perm.reason };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    setAnnouncements(prev =>
      prev.map(a =>
        a.id === announcementId
          ? {
              ...a,
              status: 'archived',
              updatedByAdminId: currentUser.id,
              updatedByAdminName: currentUser.name,
              updatedByAdminRole: activeAdminPermissionLevel,
              updatedAt: nowStr
            }
          : a
      )
    );

    logAdminAction({
      category: 'announcement_management',
      action: 'Archived Announcement',
      targetType: 'PlatformAnnouncement',
      targetId: existing.id,
      targetLabel: existing.title,
      details: `Archived announcement (audience: ${existing.audience}).${reason ? ` Reason: ${reason}` : ''}`,
      severity: 'info'
    });

    return { success: true };
  };

  // ADMIN ACTION: Delete Announcement (enforces soft-delete / archive when compliance or acknowledgment history exists)
  const adminDeleteAnnouncement = (
    announcementId: string,
    reason?: string
  ): { success: boolean; softArchived?: boolean; message?: string; error?: string } => {
    const existing = announcements.find(a => a.id === announcementId);
    if (!existing) return { success: false, error: 'Announcement not found.' };

    const perm = canAdminPerformAnnouncementAction('delete', existing.category, existing.status);
    if (!perm.allowed) return { success: false, error: perm.reason };

    const hasAcknowledgments = announcementRecipients.some(
      r => r.announcementId === announcementId && Boolean(r.acknowledgedAt)
    );

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    // Preserve compliance/audit history for mandatory, urgent, or already-acknowledged notices via soft-delete/archive
    if (existing.isMandatoryNotice || existing.requiresAcknowledgment || hasAcknowledgments) {
      setAnnouncements(prev =>
        prev.map(a =>
          a.id === announcementId
            ? {
                ...a,
                status: 'archived',
                updatedByAdminId: currentUser.id,
                updatedByAdminName: currentUser.name,
                updatedByAdminRole: activeAdminPermissionLevel,
                updatedAt: nowStr
              }
            : a
        )
      );

      logAdminAction({
        category: 'announcement_management',
        action: 'Soft-Deleted (Compliance Archived) Announcement',
        targetType: 'PlatformAnnouncement',
        targetId: existing.id,
        targetLabel: existing.title,
        details: `Converted deletion to compliance archive to preserve user acknowledgment records.${reason ? ` Reason: ${reason}` : ''}`,
        severity: 'warning'
      });

      return {
        success: true,
        softArchived: true,
        message:
          'Announcement has user acknowledgment or mandatory compliance history and was safely moved to Archived state to preserve audit records.'
      };
    }

    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));

    logAdminAction({
      category: 'announcement_management',
      action: 'Deleted Announcement',
      targetType: 'PlatformAnnouncement',
      targetId: existing.id,
      targetLabel: existing.title,
      details: `Deleted announcement "${existing.title}" (Audience: ${existing.audience}).${reason ? ` Reason: ${reason}` : ''}`,
      severity: 'warning'
    });

    return {
      success: true,
      softArchived: false,
      message: 'Announcement permanently deleted.'
    };
  };

  // ADMIN ACTION: Retry Failed Notification Deliveries
  const adminRetryFailedAnnouncementNotifications = (
    announcementId: string
  ): { success: boolean; retriedCount: number; error?: string } => {
    const existing = announcements.find(a => a.id === announcementId);
    if (!existing) return { success: false, retriedCount: 0, error: 'Announcement not found.' };

    const perm = canAdminPerformAnnouncementAction('publish', existing.category, existing.status);
    if (!perm.allowed) return { success: false, retriedCount: 0, error: perm.reason };

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    let retriedCount = 0;

    setAnnouncementRecipients(prev =>
      prev.map(r => {
        if (r.announcementId === announcementId && r.notificationStatus === 'failed') {
          retriedCount += 1;
          return {
            ...r,
            notificationStatus: 'delivered',
            deliveredAt: nowStr,
            errorDetails: undefined
          };
        }
        return r;
      })
    );

    if (retriedCount > 0) {
      logAdminAction({
        category: 'announcement_management',
        action: 'Retried Failed Announcement Notifications',
        targetType: 'PlatformAnnouncement',
        targetId: existing.id,
        targetLabel: existing.title,
        details: `Successfully redelivered ${retriedCount} failed recipient notification(s).`,
        severity: 'info'
      });
    }

    return { success: true, retriedCount };
  };

  // ============================================================================
  // ADMIN MULTILINGUAL & i18n MANAGEMENT ACTIONS
  // ============================================================================
  const adminToggleLanguageEnabled = (
    code: SupportedLanguageCode
  ): { success: boolean; error?: string } => {
    if (activeRole !== 'admin' && activeRole !== 'moderator') {
      return { success: false, error: 'Access Denied: Only authorized Administrators may manage platform languages.' };
    }
    if (code === 'en') {
      return { success: false, error: 'English is the mandatory global fallback language and cannot be disabled.' };
    }

    const targetLang = supportedLanguages.find(l => l.code === code);
    if (!targetLang) return { success: false, error: 'Language not found.' };

    const nextEnabled = !targetLang.enabled;
    setSupportedLanguages(prev =>
      prev.map(l => (l.code === code ? { ...l, enabled: nextEnabled } : l))
    );

    logAdminAction({
      category: 'platform_config',
      action: `${nextEnabled ? 'Enabled' : 'Disabled'} Platform Language (${targetLang.englishName})`,
      targetType: 'LanguageMetadata',
      targetId: code,
      targetLabel: `${targetLang.englishName} (${targetLang.nativeName})`,
      details: `Admin ${currentUser.name} ${nextEnabled ? 'enabled' : 'disabled'} ${targetLang.englishName} (${code}) in platform localization settings.`,
      severity: 'info'
    });

    return { success: true };
  };

  const adminUpdateTranslationEntry = (
    key: string,
    langCode: SupportedLanguageCode,
    newValue: string
  ): { success: boolean; error?: string } => {
    if (activeRole !== 'admin' && activeRole !== 'moderator') {
      return { success: false, error: 'Access Denied: Only authorized Administrators may edit platform translations.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    setTranslationRecords(prev =>
      prev.map(rec => {
        if (rec.key !== key) return rec;
        return {
          ...rec,
          englishText: langCode === 'en' ? newValue : rec.englishText,
          translations: {
            ...rec.translations,
            [langCode]: newValue
          },
          updatedAt: nowStr,
          updatedByAdmin: currentUser.name
        };
      })
    );

    return { success: true };
  };

  const adminAddTranslationKey = (input: {
    key: string;
    category: TranslationKeyRecord['category'];
    englishText: string;
    initialTranslations?: Partial<Record<SupportedLanguageCode, string>>;
  }): { success: boolean; error?: string } => {
    if (activeRole !== 'admin' && activeRole !== 'moderator') {
      return { success: false, error: 'Access Denied: Only authorized Administrators may add translation keys.' };
    }
    const cleanKey = input.key.trim();
    const cleanEn = input.englishText.trim();
    if (!cleanKey || !cleanEn) {
      return { success: false, error: 'Translation key and English fallback text are required.' };
    }
    if (translationRecords.some(r => r.key === cleanKey)) {
      return { success: false, error: `Translation key "${cleanKey}" already exists.` };
    }

    const fullTranslations = {} as Record<SupportedLanguageCode, string>;
    supportedLanguages.forEach(l => {
      fullTranslations[l.code] =
        l.code === 'en'
          ? cleanEn
          : input.initialTranslations?.[l.code] || '';
    });

    const newRecord: TranslationKeyRecord = {
      key: cleanKey,
      category: input.category,
      englishText: cleanEn,
      translations: fullTranslations,
      updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updatedByAdmin: currentUser.name
    };

    setTranslationRecords(prev => [newRecord, ...prev]);

    logAdminAction({
      category: 'platform_config',
      action: 'Added New i18n Translation Key',
      targetType: 'TranslationKeyRecord',
      targetId: cleanKey,
      targetLabel: cleanKey,
      details: `Added translation key "${cleanKey}" (${input.category}) with English fallback "${cleanEn}".`,
      severity: 'info'
    });

    return { success: true };
  };

  const adminPublishTranslations = (
    notes?: string
  ): { success: boolean; error?: string } => {
    if (activeRole !== 'admin' && activeRole !== 'moderator') {
      return { success: false, error: 'Access Denied: Only authorized Administrators may publish translation updates.' };
    }

    logAdminAction({
      category: 'platform_config',
      action: 'Published Global i18n Translation Updates',
      targetType: 'i18n_dictionary',
      targetId: 'global_i18n',
      targetLabel: `ACOVON 19-Language Dictionary (${translationRecords.length} keys)`,
      details: `Admin ${currentUser.name} published approved multilingual dictionary updates across ${supportedLanguages.filter(l => l.enabled).length} enabled languages.${notes ? ` Notes: ${notes}` : ''}`,
      severity: 'info'
    });

    return { success: true };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        activeRole,
        switchUserRole,
        users,
        creators,
        posts,
        subscriptions,
        purchases,
        customRequests,
        messages,
        transactions,
        commissionSettings,
        promotions,
        verifications,
        reports,
        notifications,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        adSettings,
        videoCallSession,
        livestreams,
        liveChat,
        activeLivestreamId,
        setActiveLivestreamId,
        isCreateLiveModalOpen,
        setIsCreateLiveModalOpen,
        createLivestream,
        startBroadcast,
        endBroadcast,
        createLivestreamClip,
        launchLivePoll,
        voteLivePoll,
        endLivePoll,
        sendLiveChatMessage,
        sendLiveGift,
        sendLiveTip,
        purchaseLivestreamTicket,
        unlockInviteStream,
        canUserAccessLivestream,
        canUserAccessReplay,
        purchaseLivestreamRecording,
        updateLivestreamRecording,
        incrementReplayView,
        toggleLikePost,
        createPost,
        unlockPPVPost,
        subscribeToCreator,
        cancelSubscription,
        depositFunds,
        withdrawFunds,
        tipCreator,
        createCustomVideoRequest,
        updateCustomRequestStatus,
        initiateVideoCall,
        acceptIncomingCall,
        rejectCall,
        endVideoCall,
        updateCallDuration,
        sendMessage,
        unlockPaidMessage,
        markThreadAsRead,
        payoutRequests,
        supportTickets,
        auditLogs,
        platformConfig,
        activeAdminPermissionLevel,
        hasAdminPermission,
        switchAdminOperator,
        logAdminAction,
        adminUpdateUserAccount,
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
        resolveReport,
        createPromotionCampaign,
        updateCreatorProfile,
        addCreatorSubscriptionPlan,
        updateCreatorSubscriptionPlan,
        deleteCreatorSubscriptionPlan,
        toggleCreatorSubscriptionPlanActive,
        updateCreatorPricing,
        isPostPurchased,
        isSubscribedTo,
        getSubscriptionTier,
        following,
        isFollowing,
        toggleFollowCreator,
        savedPostIds,
        isPostSaved,
        toggleSavePost,
        activePlayingVideoId,
        setActivePlayingVideoId,
        forwardPostInMessage,
        applyToBecomeCreator,
        userPendingVerification,
        showDemoBadges,
        setShowDemoBadges,
        resetDemoContent,
        statuses,
        viewedStatusIds,
        publishStatus,
        deleteStatus,
        markStatusViewed,
        reactToStatus,
        replyToStatus,
        reportStatus,
        removeReportedStatus,
        getActiveCreatorStatuses,
        hasUnseenStatus,
        canUserViewStatus,
        videoMediaRecords,
        videoProcessingJobs,
        videoProcessingConfig,
        videoPlaybackPositions,
        saveVideoPlaybackPosition,
        getVideoPlaybackPosition,
        computeAdaptiveLadder,
        startVideoOptimizationJob,
        retryVideoProcessingJob,
        cancelVideoProcessingJob,
        cleanupOriginalVideoSource,
        updateVideoProcessingConfig,
        getAuthorizedPlaybackUrl,
        verificationSettings,
        creatorVerificationRecords,
        verificationTransactions,
        verificationAuditLogs,
        isCreatorVerifiedBadgeActive,
        getCreatorVerificationRecord,
        purchaseCreatorVerification,
        confirmPendingVerificationPayment,
        adminUpdateVerificationSettings,
        adminSuspendCreatorVerification,
        adminRestoreCreatorVerification,
        adminRevokeCreatorVerification,
        adminManageVerificationRefund,
        adminTriggerVerificationExpiry,
        resetCreatorVerificationForTest,
        recommendationConfig,
        fanInterestProfiles,
        activeRecommendationFanId,
        activeFanInterestProfile,
        engagementEvents,
        recommendationFeedbackRecords,
        recommendationSystemHealth,
        switchRecommendationFanPersona,
        trackEngagementEvent,
        getRecommendedPosts,
        getUpNextVideoRecommendations,
        getRecommendedCreators,
        isPostFreeAccessibleForFan,
        submitPostRecommendationFeedback,
        updateFanCategoryPreference,
        setFanOnboardingCategories,
        unhideCreatorForFan,
        resetFanRecommendations,
        adminUpdateRecommendationConfig,
        adminToggleRecommendationExperimentPause,
        adminResetRecommendationWeightsToDefault,
        announcements,
        announcementRecipients,
        getVisibleAnnouncementsForCurrentUser,
        getAnnouncementByIdForCurrentUser,
        getUserAnnouncementStatus,
        getUnreadAnnouncementCountForCurrentUser,
        markAnnouncementAsRead,
        acknowledgeAnnouncement,
        dismissAnnouncementBanner,
        dismissAnnouncementPopup,
        canAdminPerformAnnouncementAction,
        adminCreateAnnouncement,
        adminUpdateAnnouncement,
        adminPublishAnnouncement,
        adminPauseResumeAnnouncement,
        adminArchiveAnnouncement,
        adminDeleteAnnouncement,
        adminRetryFailedAnnouncementNotifications,
        adminSimulateScheduledAndExpirySweep,
        appearanceMode,
        resolvedColorMode,
        setAppearanceMode,
        theme,
        setTheme,
        toggleTheme,
        activeBrandingTheme,
        presetBrandingThemes: PRESET_BRANDING_THEMES,
        customBrandingThemes,
        draftBrandingTheme,
        brandingHistory,
        hasBrandingPermission,
        publishBrandingTheme,
        saveBrandingDraft,
        rollbackBrandingTheme,
        resetToSignatureBrandingTheme,
        saveCustomBrandingTheme,
        deleteCustomBrandingTheme,
        toggleAdminBrandingPermission,
        isAuthenticated,
        isCurrentUserApprovedCreator,
        loginUser,
        logoutUser,
        registerAccount,
        authenticateAccount,
        supportedLanguages,
        activeLanguageCode,
        activeLanguageMeta,
        languagePreferenceMode,
        manualSelectedLanguageCode,
        detectedDeviceLanguage,
        simulatedBrowserLocale,
        setSimulatedBrowserLocale,
        setUserLanguagePreference,
        t,
        translatePhrase,
        translationRecords,
        adminToggleLanguageEnabled,
        adminUpdateTranslationEntry,
        adminAddTranslationKey,
        adminPublishTranslations
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

