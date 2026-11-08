export type UserRole = 'fan' | 'creator' | 'admin' | 'moderator';

export type AdminPermissionLevel = 'super_admin' | 'admin' | 'moderator' | 'finance_admin' | 'support_admin';

export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'banned' | 'disabled';

export type CreatorApplicationStatus = 'not_applied' | 'pending' | 'approved' | 'rejected';

export type ContentModerationStatus = 'approved' | 'flagged' | 'restricted' | 'removed';

export type PostVisibility = 'public' | 'followers' | 'subscribers' | 'pay_per_view' | 'private';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash?: string;
  role: UserRole;
  adminPermissionLevel?: AdminPermissionLevel;
  accountStatus?: AccountStatus;
  statusReason?: string;
  creatorApplicationStatus?: CreatorApplicationStatus;
  creatorApprovalStatus?: CreatorApplicationStatus;
  creatorApprovedByAdminId?: string;
  creatorApprovedByAdminName?: string;
  creatorApprovedAt?: string;
  creatorRejectionReason?: string;
  avatar: string;
  bio?: string;
  walletBalance: number;
  isVerified?: boolean;
  dateJoined: string;
  updatedAt?: string;
  country?: string;
  is18PlusConfirmed?: boolean;
  lastLoginAt?: string;
  securityFlags?: string[];
  adminPermissions?: string[];
  preferredLanguageCode?: string;
  languagePreferenceMode?: 'automatic' | 'manual' | 'english';
}

export interface CreatorTier {
  id: string;
  name: string; // e.g. 'Standard Access', 'VIP Access', 'Patron Elite'
  price: number; // monthly USD
  annualPrice?: number; // optional annual USD
  description?: string;
  perks: string[];
  discount3Month?: number; // percent discount
  icon?: string;
  isActive?: boolean;
  introductoryOffer?: string; // e.g. '$4.99 for first month'
  promotionalDiscount?: number; // e.g. 20 for 20%
  subscriberCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatorProfile extends User {
  coverImage: string;
  category: string;
  categories?: string[];
  location?: string;
  website?: string;
  followersCount: number;
  subscribersCount: number;
  isLiveForCalls: boolean;
  callRatePerMinute: number; // in USD
  instantCallsEnabled: boolean;
  minCallMinutes: number;
  maxCallMinutes: number;
  acceptingCustomRequests: boolean;
  customRequestBasePrice: number;
  customRequestDeliveryDays: number;
  customRequestTerms: string;
  privateVideoRate?: number;
  paidMessagePrice?: number;
  livestreamTicketPrice?: number;
  tiers: CreatorTier[];
  socialLinks?: {
    instagram?: string;
    twitter?: string;
    youtube?: string;
    tiktok?: string;
    twitch?: string;
    website?: string;
  };
  totalEarnings: number;
  pendingBalance: number;
  withdrawnAmount: number;
  profileUpdatedAt?: string;
  isDemo?: boolean;
  isFeatured?: boolean;
  canLivestream?: boolean;
  verificationStatus?: PaidVerificationStatus;
  verificationPurchaseDate?: string;
  verificationExpiresAt?: string | null;
  verificationLastRenewalDate?: string;
  verificationPlanName?: string;
}

export type VideoProcessingStage =
  | 'Selecting File'
  | 'Uploading'
  | 'Upload Completed'
  | 'Processing'
  | 'Compressing'
  | 'Generating Playback Versions'
  | 'Generating Thumbnail'
  | 'Quality Verification'
  | 'Ready to Publish'
  | 'Failed';

export type VideoResolution = '4K' | '1440p' | '1080p' | '720p' | '480p' | '360p';

export type VideoCodec = 'H.264' | 'H.265/HEVC' | 'AV1';

export type VideoSourceContext =
  | 'post'
  | 'feed_post'
  | 'ppv_video'
  | 'creator_studio'
  | 'studio_upload'
  | 'ppv'
  | 'paid_message'
  | 'custom_request'
  | 'status'
  | 'livestream_replay'
  | 'scheduled_post'
  | 'gallery';

export interface MediaAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnailUrl?: string;
  previewUrl?: string; // used for PPV short preview
  durationSeconds?: number;
  videoMediaId?: string;
  availableResolutions?: VideoResolution[];
  availableCodecs?: VideoCodec[];
  streamingManifestRef?: string;
  streamingProtocol?: 'HLS' | 'MPEG-DASH';
  originalFileSize?: number;
  optimizedFileSize?: number;
  compressionRatio?: number;
  vmafScore?: number;
  width?: number;
  height?: number;
  aspectRatio?: string;
  orientation?: 'landscape' | 'portrait' | 'square';
  frameRate?: number;
  previewFrames?: string[];
}

export interface Post {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  content: string;
  media: MediaAsset[];
  visibility: PostVisibility;
  ppvPrice?: number; // e.g. 9.99
  ppvPreviewDuration?: 10 | 15 | 30; // seconds of free preview before locking
  previewDurationSeconds?: number;
  likesCount: number;
  commentsCount: number;
  isLiked?: boolean;
  isPinned?: boolean;
  createdAt: string;
  tags?: string[];
  categories?: string[];
  fileName?: string;
  fileSize?: number;
  scheduledFor?: string;
  isDraft?: boolean;
  commentsDisabled?: boolean;
  downloadsDisabled?: boolean;
  isPromoted?: boolean;
  isFeatured?: boolean;
  isHighlight?: boolean; // Clipped from livestream and saved as Highlight in content gallery
  highlightLabel?: string;
  clippedByUsername?: string;
  isDemo?: boolean;
  moderationStatus?: ContentModerationStatus;
  moderationNotes?: string;
  copyrightFlag?: boolean;
}

export interface Subscription {
  id: string;
  fanId: string;
  creatorId: string;
  tierId: string;
  tierName: string;
  monthlyPrice: number;
  status: 'active' | 'cancelled' | 'expired';
  startDate: string;
  nextRenewalDate: string;
  autoRenew: boolean;
}

export interface ContentPurchase {
  id: string;
  userId: string;
  postId: string;
  creatorId: string;
  amount: number;
  purchasedAt: string;
}

export type CustomRequestStatus =
  | 'new_request'
  | 'awaiting_creator_review'
  | 'approved'
  | 'awaiting_payment'
  | 'pending'
  | 'accepted'
  | 'in_progress'
  | 'delivered'
  | 'revision_requested'
  | 'completed'
  | 'declined'
  | 'rejected'
  | 'cancelled'
  | 'disputed'
  | 'refunded';

export interface CustomVideoRequest {
  id: string;
  fanId: string;
  fanName: string;
  fanUsername: string;
  fanAvatar: string;
  creatorId: string;
  creatorName: string;
  title: string;
  instructions: string;
  recipientName: string;
  videoDurationMinutes: number;
  price: number;
  proposedBudget?: number;
  negotiatedPrice?: number;
  platformFee: number;
  creatorEarnings: number;
  referenceFileUrl?: string;
  status: CustomRequestStatus;
  deliveryDeadline: string;
  deliveredVideoUrl?: string;
  deliveredNotes?: string;
  declineReason?: string;
  disputeReason?: string;
  createdAt: string;
  deliveredAt?: string;
}

export interface VideoCallSession {
  id: string;
  creatorId: string;
  fanId: string;
  creatorName: string;
  fanName: string;
  ratePerMinute: number;
  status: 'requesting' | 'connecting' | 'connected' | 'completed' | 'cancelled' | 'rejected';
  durationSeconds: number;
  totalCost: number;
  platformFee: number;
  creatorEarnings: number;
  spendingLimit: number;
  startedAt?: string;
  endedAt?: string;
}

export interface ChatAttachmentItem {
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  mimeType?: string;
  fileSizeFormatted?: string;
  url: string;
  thumbnailUrl?: string;
  description?: string;
  isPaid: boolean;
  price?: number;
  isUnlocked: boolean;
}

export interface ChatVideoCallEvent {
  callId: string;
  status: 'requested' | 'accepted' | 'declined' | 'missed' | 'completed' | 'failed';
  ratePerMinute: number;
  durationSeconds?: number;
  totalCharged?: number;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId?: string;
  recipientId?: string;
  senderName?: string;
  senderAvatar?: string;
  senderRole?: string;
  timestamp?: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'voice' | 'document';
  mediaThumbnailUrl?: string;
  mediaFileName?: string;
  mediaDescription?: string;
  attachments?: ChatAttachmentItem[];
  pricingMode?: 'individual' | 'bundle';
  isPaid?: boolean;
  price?: number;
  isUnlocked?: boolean;
  isTip?: boolean;
  tipAmount?: number;
  customRequestId?: string;
  videoCallEvent?: ChatVideoCallEvent;
  paymentConfirmation?: {
    transactionId: string;
    amount: number;
    itemLabel: string;
    paidAt: string;
  };
  createdAt?: string;
  read: boolean;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  type:
    | 'deposit'
    | 'subscription'
    | 'ppv_purchase'
    | 'live_ticket'
    | 'live_replay'
    | 'custom_request'
    | 'video_call'
    | 'tip'
    | 'paid_message'
    | 'withdrawal'
    | 'payout_received'
    | 'platform_fee'
    | 'promotion_spend'
    | 'creator_verification'
    | 'creator_verification_refund'
    | 'refund'
    | 'chargeback'
    | 'adjustment';
  amount: number; // positive for credit, negative for debit
  description: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded' | 'disputed';
  createdAt: string;
  referenceId?: string;
  platformFee?: number;
  netCreatorEarnings?: number;
  authorizedByAdminId?: string;
  adjustmentReason?: string;
}

export interface CommissionSettings {
  subscriptionsRate: number; // e.g. 0.20 for 20% platform cut
  ppvRate: number;
  customRequestsRate: number;
  videoCallsRate: number;
  paidMessagesRate: number;
  tipsRate: number;
  creatorPromotionsRate: number;
  minWithdrawalAmount: number;
}

export interface PromotionCampaign {
  id: string;
  creatorId: string;
  creatorName: string;
  type: 'boost_profile' | 'promote_post' | 'featured_creator';
  targetPostId?: string;
  budget: number;
  packageTitle: string;
  durationDays: number;
  status: 'active' | 'pending_approval' | 'paused' | 'rejected' | 'completed';
  impressions: number;
  clicks: number;
  profileVisits: number;
  startDate: string;
  endDate: string;
  adminNotes?: string;
}

export interface CreatorApplicationData {
  displayName: string;
  category: string;
  bio: string;
  socialLinks?: string;
  monthlyTierPrice?: number;
  dateOfBirth?: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  documentFileUrl?: string;
  selfieUrl?: string;
  termsAccepted: boolean;
  ageConfirmed: boolean;
}

export interface CreatorVerification {
  id: string;
  userId: string;
  name: string;
  username: string;
  documentType: 'passport' | 'drivers_license' | 'national_id';
  documentNumber: string;
  documentFileUrl: string;
  selfieUrl: string;
  status: 'pending' | 'approved' | 'rejected' | 'info_requested';
  submittedAt: string;
  reviewedByAdminId?: string;
  reviewedByAdminName?: string;
  reviewedAt?: string;
  notes?: string;
  applicationData?: CreatorApplicationData;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'creator' | 'user' | 'livestream' | 'message' | 'status';
  targetId: string;
  targetTitle: string;
  reason: 'non_consensual' | 'copyright' | 'harassment' | 'underage_risk' | 'fraud' | 'spam' | 'tos_violation' | string;
  details: string;
  evidenceUrl?: string;
  status: 'open' | 'investigating' | 'escalated' | 'resolved' | 'dismissed';
  assignedModeratorId?: string;
  assignedModeratorName?: string;
  createdAt: string;
  actionTaken?: string;
  actionHistory?: { timestamp: string; actor: string; action: string }[];
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'subscription' | 'tip' | 'call' | 'custom_request' | 'message' | 'system' | 'payout' | 'livestream' | 'creator_post' | 'post_like' | 'message_received' | 'verification' | 'announcement';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  linkUrl?: string;
  announcementId?: string;
  targetAudience?: 'fans_only' | 'creators_only' | 'everyone';
}

export type LivestreamAccessMode = 'public' | 'all_subscribers' | 'selected_plan' | 'pay_per_view' | 'private_invite';

export type LivestreamStatus = 'scheduled' | 'live' | 'ended';

export interface VirtualGift {
  id: string;
  name: string;
  price: number;
  icon: string;
  animationColor: string;
  description: string;
}

export interface LiveChatMessage {
  id: string;
  streamId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  senderRole: 'viewer' | 'subscriber' | 'vip' | 'creator' | 'moderator';
  message: string;
  type: 'standard' | 'highlighted' | 'priority_question' | 'gift' | 'tip';
  amountPaid?: number;
  giftData?: VirtualGift;
  timestamp: string;
}

export type RecordingMode = 'disabled' | 'free' | 'paid';

export type ReplayPermission = 'public' | 'followers' | 'subscribers' | 'selected_plan' | 'paid' | 'private_invite';

export type RecordingStatus = 'not_recorded' | 'recording' | 'processing' | 'ready' | 'unpublished' | 'removed';

export interface RecordingSettings {
  mode: RecordingMode;
  price?: number;
  currency?: string;
  availabilityDays?: number | 'unlimited';
  description?: string;
  replayPermission: ReplayPermission;
  allowedReplayTierIds?: string[];
  includeReplayWithLiveTicket?: boolean;
  participantConsentConfirmed?: boolean;
}

export interface Livestream {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  tags: string[];
  accessMode: LivestreamAccessMode;
  allowedTierIds?: string[]; // For mode 3: Selected Subscription Plan
  ppvTicketPrice?: number; // For mode 4: Pay-Per-View Private Livestream
  privatePasscode?: string; // For mode 5: Private Invitation
  allowedUserIds?: string[]; // For mode 5: specific invites
  status: LivestreamStatus;
  viewerCount: number;
  totalRevenue: number;
  startedAt?: string;
  scheduledFor?: string;
  endedAt?: string;
  expectedDurationMinutes: number;
  videoStreamUrl: string;
  settings: {
    enableTips: boolean;
    enableGifts: boolean;
    enablePaidMessages: boolean;
    enableHighlightedMessages: boolean;
    subscribersOnlyChat: boolean;
    minimumTipAmount: number;
    maxViewers?: number;
  };
  purchasedViewerIds: string[]; // For PPV tickets
  activePoll?: LivePoll | null; // Real-time interactive stream poll
  isDemo?: boolean;

  // Official Server-Side Recording & Replay Access
  recordingSettings?: RecordingSettings;
  recordingStatus?: RecordingStatus;
  isReplayPublished?: boolean;
  replayViewsCount?: number;
  replayPurchasesCount?: number;
  replayGrossRevenue?: number;
  replayPlatformFee?: number;
  replayNetRevenue?: number;
  purchasedReplayUserIds?: string[];
  recordingPublishedAt?: string;
  recordingExpiresAt?: string;
}

export interface LivePollOption {
  id: string;
  text: string;
  votes: number;
}

export interface LivePoll {
  id: string;
  streamId: string;
  creatorId: string;
  question: string;
  options: LivePollOption[];
  totalVotes: number;
  isActive: boolean;
  createdAt: string;
  durationSeconds?: number;
  votedUserIds?: { [userId: string]: string }; // userId -> optionId
}

export type StatusAudience = 'public' | 'followers' | 'subscribers' | 'selected_plan' | 'tier_specific';

export interface StatusView {
  userId: string;
  userName: string;
  userAvatar: string;
  viewedAt: string;
}

export interface StatusReaction {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  emoji: string;
  createdAt: string;
}

export interface StatusReply {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface CreatorStatus {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  mediaType?: 'image' | 'video' | 'text';
  type?: 'photo' | 'image' | 'video' | 'text';
  mediaUrl?: string;
  thumbnailUrl?: string;
  durationSeconds?: number;
  textContent?: string;
  textOverlay?: string;
  textBackground?: string;
  backgroundColor?: string;
  caption?: string;
  audience: StatusAudience;
  allowedTierId?: string;
  allowedTierIds?: string[];
  createdAt: string;
  expiresAt: string;
  viewsCount: number;
  uniqueViews: StatusView[];
  reactions: StatusReaction[];
  replies: StatusReply[];
  isArchived?: boolean;
  isReported?: boolean;
  reportReason?: string;
  isDemo?: boolean;
}

export interface PayoutRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  amount: number;
  method: string; // e.g. 'Stripe Express Direct Deposit', 'SEPA Instant Wire', 'SWIFT Bank Transfer'
  accountDestination: string; // masked e.g. '•••• 8492'
  status: 'pending' | 'approved' | 'processing' | 'completed' | 'rejected';
  requestedAt: string;
  processedAt?: string;
  processedByAdminId?: string;
  processedByAdminName?: string;
  rejectionReason?: string;
  notes?: string;
}

export type SupportTicketCategory =
  | 'user_support'
  | 'creator_support'
  | 'payment_dispute'
  | 'refund_request'
  | 'subscription_issue'
  | 'failed_upload'
  | 'livestream_issue'
  | 'account_access'
  | 'payout_issue';

export interface SupportTicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: 'user' | 'creator' | 'admin';
  message: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  userUsername: string;
  userAvatar: string;
  userRole: 'fan' | 'creator';
  category: SupportTicketCategory;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'escalated' | 'resolved' | 'closed';
  assignedAdminId?: string;
  assignedAdminName?: string;
  relatedTransactionId?: string;
  relatedRequestId?: string;
  disputedAmount?: number;
  createdAt: string;
  updatedAt: string;
  messages: SupportTicketMessage[];
}

export type AuditLogCategory =
  | 'auth_security'
  | 'user_account'
  | 'creator_approval'
  | 'content_moderation'
  | 'financial_action'
  | 'payout_approval'
  | 'refund_decision'
  | 'platform_settings'
  | 'permission_change'
  | 'sensitive_access'
  | 'livestream_moderation'
  | 'video_processing'
  | 'creator_verification'
  | 'recommendation_engine'
  | 'announcement_management'
  | 'platform_branding'
  | 'platform_config';

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: AdminPermissionLevel;
  category: AuditLogCategory;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string;
  details: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface PlatformConfig {
  platformName: string;
  announcementBanner: string;
  announcementActive: boolean;
  allowNewRegistrations: boolean;
  allowCreatorApplications: boolean;
  requireGovernmentIdForCreators: boolean;
  requireSelfieMatchForCreators: boolean;
  minCreatorAge: number;
  minSubscriptionPrice: number;
  maxSubscriptionPrice: number;
  minPpvPrice: number;
  maxPpvPrice: number;
  maxLivestreamDurationMinutes: number;
  maxLivestreamTicketPrice: number;
  autoApproveVerifiedCreatorPromotions: boolean;
  payoutHoldDays: number;
  featuredCreatorIds: string[];
  featuredPostIds: string[];
  contentCategories: string[];
  videoCategories: string[];
  livestreamCategories: string[];
  notificationTemplates: {
    welcomeFan: string;
    creatorApproved: string;
    payoutCompleted: string;
    policyWarning: string;
  };
}

export interface PlaybackVariant {
  id: string;
  mediaId: string;
  resolution: VideoResolution;
  width: number;
  height: number;
  codec: VideoCodec;
  bitrateKbps: number;
  fileSizeBytes: number;
  manifestUrl: string;
  segmentUrls: string[];
  processingStatus: 'pending' | 'processing' | 'ready' | 'failed';
}

export interface VideoMediaRecord {
  id: string;
  creatorId: string;
  creatorName: string;
  sourceContext: VideoSourceContext;
  contentHash: string;
  originalFilename: string;
  originalStorageRef: string;
  originalFileSize: number; // bytes
  originalFormat: string;
  originalWidth: number;
  originalHeight: number;
  originalDuration: number; // seconds
  originalFrameRate: number;
  aspectRatio: string;
  orientation: 'landscape' | 'portrait' | 'square';
  processingStatus: 'queued' | 'processing' | 'ready' | 'failed';
  optimizedStorageRefs: Record<string, string>;
  availableResolutions: VideoResolution[];
  availableCodecs: VideoCodec[];
  streamingProtocol: 'HLS' | 'MPEG-DASH';
  streamingManifestRef: string;
  masterPlaylistUrl?: string;
  thumbnailRef: string;
  previewFrames: string[];
  feedPreviewRef: string;
  profilePreviewRef: string;
  statusPreviewRef?: string;
  optimizedFileSize: number; // bytes
  compressionRatio: number; // e.g. 0.62 = 62% size reduction
  storageSavedBytes: number;
  vmafScore: number; // e.g. 96.4
  ssimScore: number; // e.g. 0.988
  psnrDb: number; // e.g. 44.5
  processingStartTime: string;
  processingCompletionTime?: string;
  processingDurationMs?: number;
  processingError?: string;
  retentionStatus: 'retained_vault' | 'scheduled_cleanup' | 'cleaned_up';
  retentionExpiresAt?: string;
  accessVisibility: PostVisibility;
  variants: PlaybackVariant[];
  reusedCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface VideoProcessingJob {
  id: string;
  mediaId: string;
  creatorId: string;
  creatorName: string;
  originalFilename: string;
  fileName?: string;
  sourceContext: VideoSourceContext;
  jobStatus: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  processingStage: VideoProcessingStage;
  stage?: VideoProcessingStage | string;
  progressPercentage: number;
  progress?: number;
  compressionRatio?: number;
  retryCount: number;
  maxRetries: number;
  processingConfig: {
    targetPreset: string;
    codecs: VideoCodec[];
    maxResolution: VideoResolution;
    protocol: 'HLS' | 'MPEG-DASH';
  };
  errorDetails?: string;
  errorMessage?: string;
  originalFileSize: number;
  optimizedFileSize?: number;
  startedAt: string;
  completedAt?: string;
}

export interface VideoProcessingConfig {
  enableAutoOptimization: boolean;
  queuePaused?: boolean;
  acceptedFormats: string[];
  maxUploadSizeMb: number;
  maxUploadSizeMB?: number;
  maxFileSizeMB?: number;
  targetQualityPreset: 'visually_lossless' | 'balanced_high' | 'bandwidth_saver';
  minVmafThreshold: number;
  enabledResolutions: VideoResolution[];
  allowedResolutions?: VideoResolution[];
  enabledCodecs: VideoCodec[];
  streamingProtocol: 'HLS' | 'MPEG-DASH';
  originalFileRetentionDays: number;
  retainOriginalAfterVerification: boolean;
  thumbnailFormat: 'WebP' | 'AVIF';
  thumbnailFrameCount: number;
  maxAutoRetries: number;
  maxConcurrentJobs: number;
  enableCdnDelivery: boolean;
  enableDeduplication: boolean;
  totalBandwidthSavedGB?: number;
  cdnCacheHitRatePercent?: number;
  avgBufferFreeStartupMs?: number;
}

export type PaidVerificationStatus =
  | 'not_verified'
  | 'payment_pending'
  | 'verified'
  | 'expired'
  | 'renewal_required'
  | 'suspended'
  | 'revoked';

export type VerificationDurationType = 'lifetime' | 'monthly' | 'annual' | 'custom_days';

export type VerificationRefundStatus =
  | 'not_requested'
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed';

export type VerificationCurrency = 'USD' | 'EUR' | 'GBP';

export interface VerificationSettings {
  id: string;
  planName: string;
  description: string;
  benefits: string[];
  termsAndConditions: string;
  price: number;
  currency: VerificationCurrency;
  durationType: VerificationDurationType;
  durationDays: number | null;
  renewalEnabled: boolean;
  renewalPrice: number;
  reminderDaysBeforeExpiry: number;
  isActive: boolean;
  isPublished: boolean;
  updatedAt: string;
  updatedByAdmin: string;
}

export interface CreatorVerificationRecord {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  status: PaidVerificationStatus;
  planId: string;
  planName: string;
  originalPaymentId?: string;
  amountPaid: number;
  currency: VerificationCurrency;
  durationType: VerificationDurationType;
  purchaseDate?: string;
  startDate?: string;
  expirationDate?: string | null;
  lastRenewalDate?: string;
  suspendedDate?: string;
  revokedDate?: string;
  statusReason?: string;
  updatedAt: string;
}

export interface VerificationTransaction {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  verificationRecordId: string;
  transactionType: 'initial' | 'renewal';
  planName: string;
  paymentProvider: 'acovon_wallet' | 'stripe_checkout' | 'apple_pay';
  providerTransactionId: string;
  idempotencyKey: string;
  amount: number;
  currency: VerificationCurrency;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentTimestamp: string;
  refundStatus: VerificationRefundStatus;
  refundTransactionId?: string;
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
  keepBadgeAuthorizedReason?: string;
  createdAt: string;
}

export interface VerificationAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  adminRole: string;
  creatorId?: string;
  creatorName?: string;
  action: string;
  previousStatus?: PaidVerificationStatus | string;
  newStatus?: PaidVerificationStatus | string;
  reason: string;
  timestamp: string;
}

// ============================================================================
// PERSONALIZED CONTENT RECOMMENDATION, DISCOVERY & SMART FEED ENGINE TYPES
// ============================================================================

export type FeedActivityFilterType =
  | 'all'
  | 'for_you'
  | 'following'
  | 'subscribed'
  | 'free_posts'
  | 'ppv';

export type EngagementEventType =
  | 'video_impression'
  | 'video_started'
  | 'video_watched'
  | 'video_completed'
  | 'video_replayed'
  | 'video_skipped'
  | 'video_liked'
  | 'video_unliked'
  | 'video_saved'
  | 'video_shared'
  | 'video_commented'
  | 'photo_displayed'
  | 'photo_opened'
  | 'photo_viewed_duration'
  | 'gallery_opened'
  | 'gallery_browsed'
  | 'photo_liked'
  | 'photo_saved'
  | 'photo_shared'
  | 'creator_profile_opened'
  | 'creator_followed'
  | 'creator_unfollowed'
  | 'creator_subscribed'
  | 'creator_content_purchased'
  | 'creator_status_viewed'
  | 'creator_status_replied'
  | 'creator_livestream_joined'
  | 'creator_livestream_watched'
  | 'creator_livestream_liked'
  | 'creator_custom_request'
  | 'category_searched'
  | 'hashtag_searched'
  | 'explore_category_opened'
  | 'search_result_clicked'
  | 'not_interested'
  | 'show_less'
  | 'show_more'
  | 'hide_creator'
  | 'report_content';

export type EngagementSurface =
  | 'for_you'
  | 'free_posts'
  | 'all_activity'
  | 'feed_all'
  | 'following'
  | 'subscribed'
  | 'ppv_vault'
  | 'ppv'
  | 'explore'
  | 'fullscreen_video'
  | 'fullscreen_photo'
  | 'creator_profile'
  | 'live';

export interface FanEngagementEvent {
  id: string;
  fanId: string;
  fanName: string;
  contentId?: string;
  postId?: string;
  creatorId?: string;
  creatorName?: string;
  eventType: EngagementEventType | string;
  contentType: 'video' | 'photo' | 'gallery' | 'livestream' | 'status' | 'creator' | 'search';
  category?: string;
  hashtags?: string[];
  tags?: string[];
  watchDurationSeconds?: number;
  videoDurationSeconds?: number;
  completionPercentage?: number;
  completionPercent?: number;
  timeBeforeSkipSeconds?: number;
  scoreDelta: number;
  sourceSurface: EngagementSurface;
  surface?: EngagementSurface | string;
  sessionId: string;
  timestamp: string;
  ageHours: number;
}

export interface FanInterestProfile {
  id: string;
  fanId: string;
  fanName: string;
  fanUsername: string;
  personaCode?: 'fan_a' | 'fan_b' | 'fan_c' | 'fan_d' | 'fan_e' | 'fan_f' | 'custom';
  personaLabel?: string;
  personaDescription?: string;
  categoryScores: Record<string, number>;
  recentCategoryScores: Record<string, number>;
  longTermCategoryScores: Record<string, number>;
  hashtagScores: Record<string, number>;
  creatorAffinityScores: Record<string, number>;
  formatPreferences: {
    video: number;
    photo: number;
    gallery: number;
    livestream: number;
  };
  preferredVideoDuration: 'short' | 'medium' | 'long' | 'balanced';
  avgCompletionRate: number;
  avgWatchCompletionPercent?: number;
  avgWatchTimeSeconds: number;
  skippedCategories: Record<string, number>;
  reducedCategories: string[];
  boostedCategories: string[];
  hiddenCreatorIds: string[];
  notInterestedPostIds: string[];
  reportedPostIds: string[];
  showMorePostIds: string[];
  onboardingCategories: string[];
  isColdStart: boolean;
  totalEventsProcessed: number;
  lastUpdatedAt: string;
}

export interface RecommendationSignalBreakdown {
  interestRelevance: number;
  creatorAffinity: number;
  watchTimePrediction: number;
  engagementLikelihood: number;
  contentFreshness: number;
  qualityAndPopularity: number;
  discoveryAndDiversity: number;
  collaborativeFilteringBoost: number;
  timeDecayMultiplier: number;
}

export interface RecommendedPostResult {
  post: Post;
  totalScore: number;
  signalBreakdown: RecommendationSignalBreakdown;
  primaryReason: string;
  recommendationType:
    | 'interest_match'
    | 'creator_affinity'
    | 'collaborative_filtering'
    | 'trending_quality'
    | 'discovery_exploration'
    | 'cold_start';
  isFreeAccessible: boolean;
  accessBadgeLabel: string;
}

export interface RecommendedCreatorResult {
  creator: CreatorProfile;
  matchScore: number;
  score: number;
  reason: string;
  isRisingNewCreator?: boolean;
  matchedCategories: string[];
  collaborativeNote?: string;
}

export interface RecommendationFeedbackRecord {
  id: string;
  fanId: string;
  fanName: string;
  postId: string;
  creatorId: string;
  creatorName: string;
  feedbackType: 'not_interested' | 'show_less' | 'show_more' | 'hide_creator' | 'report_content';
  action?: 'not_interested' | 'show_less' | 'show_more' | 'hide_creator' | 'report_content';
  category?: string;
  tags?: string[];
  reasonDetails?: string;
  timestamp: string;
}

export interface RecommendationEngineConfig {
  id: string;
  rankingVersion: string;
  isActive: boolean;
  isExperimentPaused: boolean;
  activeExperimentName: string;
  rankingWeights: {
    interestRelevance: number; // default 25
    creatorAffinity: number; // default 20
    watchTimeCompletion: number; // default 20
    engagementSignals: number; // default 15
    contentFreshness: number; // default 10
    qualityPopularity: number; // default 5
    discoveryDiversity: number; // default 5
  };
  signalPointWeights: {
    videoWatchedLong: number; // +5
    videoCompleted: number; // +6
    videoReplayed: number; // +8
    videoLiked: number; // +4
    videoSaved: number; // +7
    videoShared: number; // +7
    commentPosted: number; // +5
    creatorProfileOpened: number; // +3
    creatorFollowed: number; // +8
    creatorSubscribed: number; // +10
    paidContentPurchased: number; // +10
    videoSkippedImmediately: number; // -4
    explicitNotInterested: number; // -10
    creatorUnfollowed: number; // -6
  };
  timeDecayConfig: {
    recentSessionMultiplier: number; // e.g. 1.6x for last 24h
    last7DaysMultiplier: number; // e.g. 1.0x
    olderHistoryDecayRate: number; // e.g. 0.45x
    enableFastInterestShift: boolean;
  };
  diversityRules: {
    maxConsecutiveSameCreator: number; // e.g. 1
    minCreatorsPer10Posts: number; // e.g. 4
    maxSameCategoryPer10Posts: number; // e.g. 4
    explorationPercentage: number; // e.g. 15%
    newCreatorDiscoveryBoost: number; // e.g. 12
    trendingInfluenceWeight: number; // e.g. 10
    suppressRepeatedSeenHours: number; // e.g. 12
  };
  recommendationRefreshFrequency: 'realtime_instant' | 'every_5_events' | 'session_refresh';
  eligibleContentTypes: {
    publicFreePosts: boolean;
    followerOnlyPosts: boolean;
    subscriberPosts: boolean;
    ppvLockedPreviews: boolean;
    livestreamReplays: boolean;
    photoGalleries: boolean;
  };
  updatedAt: string;
  updatedByAdmin: string;
  configAuditHistory: {
    id: string;
    adminName: string;
    adminRole: string;
    summary: string;
    timestamp: string;
  }[];
}

export interface RecommendationSystemHealth {
  engineStatus: 'healthy' | 'degraded' | 'paused';
  rankingModelVersion: string;
  lastModelUpdateAt: string;
  eventsProcessedCount: number;
  recommendationJobsProcessed: number;
  rankingFailuresCount: number;
  avgEventProcessingDelayMs: number;
  postsMissingMetadataCount: number;
  cacheHitRatePercent: number;
}

// ============================================================================
// ADMIN-CONTROLLED ANNOUNCEMENT & PLATFORM COMMUNICATION SYSTEM TYPES
// ============================================================================

export type AnnouncementAudience = 'fans_only' | 'creators_only' | 'everyone';

export type AnnouncementCategory =
  | 'General Update'
  | 'New Feature'
  | 'Important Notice'
  | 'Maintenance'
  | 'Payment Update'
  | 'Creator Update'
  | 'Fan Update'
  | 'Security Notice'
  | 'Policy Update'
  | 'Promotion'
  | 'Emergency Notice';

export type AnnouncementPriority = 'normal' | 'important' | 'urgent';

export type AnnouncementStatus =
  | 'draft'
  | 'scheduled'
  | 'published'
  | 'paused'
  | 'expired'
  | 'archived'
  | 'deleted';

export type AnnouncementDisplayFormat =
  | 'announcement_center'
  | 'dashboard_banner'
  | 'important_popup'
  | 'persistent_notice';

export type AnnouncementNotificationMode =
  | 'in_app_only'
  | 'silent_display'
  | 'in_app_and_email';

export interface AnnouncementCtaConfig {
  enabled: boolean;
  label: string;
  destinationUrl: string;
  openMode: 'internal' | 'external';
}

export interface AnnouncementVersionHistory {
  id: string;
  announcementId: string;
  versionNumber: number;
  editedAt: string;
  editedByAdminId: string;
  editedByAdminName: string;
  editedByAdminRole: AdminPermissionLevel;
  changeSummary: string;
  snapshotTitle: string;
  snapshotAudience: AnnouncementAudience;
  snapshotPriority: AnnouncementPriority;
}

export interface AnnouncementRecipientRecord {
  id: string;
  announcementId: string;
  userId: string;
  userName: string;
  userUsername: string;
  userRole: 'fan' | 'creator';
  audienceEligibility: AnnouncementAudience;
  deliveredAt: string;
  readAt?: string;
  acknowledgedAt?: string;
  dismissedBannerAt?: string;
  dismissedPopupAt?: string;
  notificationStatus: 'delivered' | 'skipped_silent' | 'skipped_preference' | 'failed';
  notificationChannel: 'in_app' | 'in_app_and_email' | 'none';
  errorDetails?: string;
}

export interface PlatformAnnouncement {
  id: string;
  title: string;
  summary: string;
  bodyHtml: string;
  category: AnnouncementCategory;
  priority: AnnouncementPriority;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  displayFormats: AnnouncementDisplayFormat[];
  requiresAcknowledgment: boolean;
  isMandatoryNotice: boolean;
  imageUrl?: string;
  imageFileName?: string;
  imageFileSizeKb?: number;
  cta: AnnouncementCtaConfig;
  notificationMode: AnnouncementNotificationMode;
  notificationSentAt?: string;
  timezone: string;
  publishAt?: string;
  publishedAt?: string;
  expiresAt?: string;
  createdByAdminId: string;
  createdByAdminName: string;
  createdByAdminRole: AdminPermissionLevel;
  updatedByAdminId: string;
  updatedByAdminName: string;
  updatedByAdminRole: AdminPermissionLevel;
  createdAt: string;
  updatedAt: string;
  versionCount: number;
  versionHistory: AnnouncementVersionHistory[];
}

// ============================================================================
// ADMIN-ONLY GLOBAL BRANDING STUDIO & DESIGN THEME SYSTEM TYPES
// ============================================================================

export interface BrandingDesignTokens {
  bgCanvas: string;
  bgSurface: string;
  bgElevated: string;
  bgSubtle: string;
  bgNav: string;
  bgModal: string;
  bgInput: string;
  bgAccentTint: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accentPrimary: string;
  accentSecondary: string;
  accentContrastText: string;
  secondaryBtnBg: string;
  secondaryBtnText: string;
  secondaryBtnBorder: string;
  destructiveColor: string;
  successColor: string;
  warningColor: string;
  borderPrimary: string;
  borderSubtle: string;
  borderFocus: string;
  fontHeading: string;
  fontBody: string;
  headingWeight: string;
  bodySize: string;
  buttonRadius: string;
  cardRadius: string;
  shadowStyle: string;
}

export interface PlatformBrandingTheme {
  id: string;
  code: string;
  name: string;
  tagline: string;
  description: string;
  isPreset: boolean;
  isDefault?: boolean;
  basedOnPresetId?: string;
  mode: 'dark' | 'light';
  swatches: string[];
  fontPairId: string;
  fontPairLabel: string;
  tokens: BrandingDesignTokens;
  createdAt?: string;
  createdByAdminName?: string;
}

export interface BrandingHistoryRecord {
  id: string;
  previousThemeId: string;
  previousThemeName: string;
  newThemeId: string;
  newThemeName: string;
  actionType: 'publish' | 'rollback' | 'draft_saved' | 'custom_created' | 'reset_default';
  adminId: string;
  adminName: string;
  adminRole: AdminPermissionLevel;
  notes?: string;
  timestamp: string;
  snapshotTheme: PlatformBrandingTheme;
}
