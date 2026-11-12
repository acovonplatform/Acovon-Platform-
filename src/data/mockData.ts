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
  VideoResolution,
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
import { DEMO_POSTS, DEMO_LIVESTREAMS, DEMO_STATS } from './demoContent';
import {
  OFFICIAL_CATEGORIES,
  OFFICIAL_COUNTRIES,
  resolveCategoryRecord,
  resolveCountryRecord
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

export const MOCK_USERS: Record<string, User> = {
  fan_jordan: {
    id: 'user_fan_1',
    name: 'Jordan Cross',
    username: 'jordancross',
    email: 'jordan@example.com',
    role: 'fan',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Art collector, patron of independent music, and luxury fashion enthusiast.',
    walletBalance: 245.50,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2025-04-12',
    country: 'United States',
    lastLoginAt: '2026-11-03 09:42'
  },
  fan_sofia: {
    id: 'fan_sofia',
    name: 'Sofia Ricci',
    username: 'sofiaricci',
    email: 'sofia.ricci@milano.it',
    role: 'fan',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    bio: 'Luxury textile designer and ballet enthusiast based in Milan.',
    walletBalance: 180.00,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2025-06-19',
    country: 'Italy',
    lastLoginAt: '2026-11-03 08:15'
  },
  fan_alex: {
    id: 'fan_alex',
    name: 'Alex Mercer',
    username: 'alexmercer',
    email: 'amercer@studio.co.uk',
    role: 'fan',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Film score enthusiast, synthesizer hobbyist, and cinematography student.',
    walletBalance: 92.00,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2025-08-04',
    country: 'United Kingdom',
    lastLoginAt: '2026-11-02 22:30'
  },
  fan_lucas: {
    id: 'fan_lucas',
    name: 'Lucas Weber',
    username: 'lucasweber_zh',
    email: 'lucas@zurichventures.ch',
    role: 'fan',
    accountStatus: 'restricted',
    statusReason: 'Temporary velocity limit after disputed card top-up',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    bio: 'Esports supporter and tech patron.',
    walletBalance: 40.00,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2025-09-21',
    country: 'Switzerland',
    lastLoginAt: '2026-10-29 14:10',
    securityFlags: ['Card velocity review pending']
  },
  fan_banned: {
    id: 'fan_banned_1',
    name: 'Victor Kane',
    username: 'vkane_ripper',
    email: 'vkane99@proton.me',
    role: 'fan',
    accountStatus: 'suspended',
    statusReason: 'Unauthorized screen-recording redistribution violation (TOS §4.2)',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    bio: 'Suspended account.',
    walletBalance: 0.00,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2025-10-02',
    country: 'Germany',
    lastLoginAt: '2026-10-30 21:15',
    securityFlags: ['DMCA Copyright Strike', 'Account Suspended']
  },
  creator_newbie: {
    id: 'creator_newbie',
    name: 'Chloe Dupont',
    username: 'chloedupont',
    email: 'chloe@atelier.paris',
    role: 'fan',
    accountStatus: 'active',
    creatorApplicationStatus: 'pending',
    creatorApprovalStatus: 'pending',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    bio: 'Parisian fashion stylist & visual creator (Creator application pending admin review).',
    walletBalance: 115.00,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2026-10-28',
    country: 'France',
    lastLoginAt: '2026-11-03 10:15'
  },
  creator_applicant_2: {
    id: 'creator_applicant_2',
    name: 'Dante Moretti',
    username: 'dantemoretti_film',
    email: 'dante@morettifilm.it',
    role: 'fan',
    accountStatus: 'active',
    creatorApplicationStatus: 'pending',
    creatorApprovalStatus: 'pending',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'Independent filmmaker & cinematographer (Creator application pending admin review).',
    walletBalance: 85.00,
    isVerified: false,
    is18PlusConfirmed: true,
    dateJoined: '2026-10-30',
    country: 'Italy',
    lastLoginAt: '2026-11-03 11:05'
  },
  admin_root: {
    id: 'user_admin_1',
    name: 'Julian Sterling',
    username: 'acovon_superadmin',
    email: 'julian.sterling@acovon.com',
    role: 'admin',
    adminPermissionLevel: 'super_admin',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    bio: 'ACOVON Super Administrator & Executive Director of Platform Operations.',
    walletBalance: 12450.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-01-01',
    country: 'Switzerland',
    lastLoginAt: '2026-11-03 10:00',
    adminPermissions: ['all_privileges', 'manage_platform_branding', 'role_assignment', 'commission_control', 'payout_release', 'emergency_killswitch']
  },
  admin_ops: {
    id: 'user_admin_2',
    name: 'Evelyn Cross',
    username: 'evelyn_ops_admin',
    email: 'evelyn.cross@acovon.com',
    role: 'admin',
    adminPermissionLevel: 'admin',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    bio: 'Senior Platform Administrator — User, Creator & Content Operations.',
    walletBalance: 1200.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-03-10',
    country: 'United States',
    lastLoginAt: '2026-11-03 09:20',
    adminPermissions: ['user_management', 'creator_management', 'content_management', 'live_management', 'promotions_management', 'manage_platform_branding']
  },
  moderator_clara: {
    id: 'user_mod_1',
    name: 'Clara Vance',
    username: 'clara_trust_safety',
    email: 'moderation@acovon.com',
    role: 'moderator',
    adminPermissionLevel: 'moderator',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
    bio: 'Trust & Safety Moderator, Creator Identity & Compliance Lead.',
    walletBalance: 500.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-06-15',
    country: 'United Kingdom',
    lastLoginAt: '2026-11-03 09:50',
    adminPermissions: ['content_moderation', 'report_resolution', 'creator_verification', 'live_moderation']
  },
  admin_finance: {
    id: 'user_admin_finance',
    name: 'Henrik Lindqvist',
    username: 'henrik_treasury',
    email: 'finance@acovon.com',
    role: 'admin',
    adminPermissionLevel: 'finance_admin',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    bio: 'Finance & Treasury Administrator — Payouts, Escrow, Ledger Audits & Refunds.',
    walletBalance: 850.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-04-20',
    country: 'Sweden',
    lastLoginAt: '2026-11-03 08:45',
    adminPermissions: ['financial_ledger', 'payout_approval', 'refund_issuance', 'dispute_resolution']
  },
  admin_support: {
    id: 'user_admin_support',
    name: 'Sophia Lin',
    username: 'sophia_concierge',
    email: 'support@acovon.com',
    role: 'admin',
    adminPermissionLevel: 'support_admin',
    accountStatus: 'active',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    bio: 'Creator & Patron Support Lead — Dispute Concierge & Account Recovery.',
    walletBalance: 350.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-08-01',
    country: 'Singapore',
    lastLoginAt: '2026-11-03 09:10',
    adminPermissions: ['support_tickets', 'account_recovery', 'dispute_mediation']
  }
};

export const MOCK_CREATORS: CreatorProfile[] = [
  {
    id: 'creator_elena',
    name: 'Elena Vance',
    username: 'elenavance',
    email: 'elena@elenavance.luxury',
    role: 'creator',
    avatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    coverImage: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    bio: 'High-Fashion Creative Director & Runway Insider. Documenting couture atelier archives, private editorial lookbooks, and fashion week masterclasses.',
    category: 'Fashion & Luxury',
    followersCount: 84520,
    subscribersCount: 1420,
    walletBalance: 4120.50,
    totalEarnings: 38450.00,
    pendingBalance: 750.00,
    withdrawnAmount: 33579.50,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-08-10',
    country: 'France',
    isLiveForCalls: true,
    callRatePerMinute: 6.50,
    instantCallsEnabled: true,
    minCallMinutes: 5,
    maxCallMinutes: 60,
    acceptingCustomRequests: true,
    customRequestBasePrice: 150.00,
    customRequestDeliveryDays: 3,
    customRequestTerms: 'Custom fashion styling reviews, personalized video messages for fashion students, and portfolio critique.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_elena_basic',
        name: 'Atelier Access',
        price: 9.99,
        perks: ['Exclusive weekly styling diaries', 'Access to subscriber-only posts', 'Direct DM message capability'],
        discount3Month: 15
      },
      {
        id: 'tier_elena_vip',
        name: 'Couture VIP Tier',
        price: 24.99,
        perks: ['Full uncensored high-res editorial sets', 'Priority queue for custom video styling critiques', 'Monthly private live stream Q&A', '10% discount on 1-on-1 video calls']
      },
      {
        id: 'tier_elena_patron',
        name: 'Private Circle Patron',
        price: 69.99,
        perks: ['Direct WhatsApp line and concierge messaging', 'Free monthly 10-minute 1-on-1 video call', 'All PPV video vault releases unlocked automatically', 'Credited in runway archive publication']
      }
    ],
    socialLinks: {
      instagram: 'https://instagram.com/elenavance',
      twitter: 'https://twitter.com/elenavance',
      website: 'https://elenavance.luxury'
    }
  },
  {
    id: 'creator_marcus',
    name: 'Marcus Thorne',
    username: 'marcusthorne',
    email: 'marcus@soundalchemy.studio',
    role: 'creator',
    avatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=80',
    bio: 'Multi-platinum audio engineer, modular synthesizer collector, and film composer. Unreleased stems, sample packs, and live production break-downs.',
    category: 'Music & Audio Production',
    followersCount: 42100,
    subscribersCount: 890,
    walletBalance: 2890.00,
    totalEarnings: 24600.00,
    pendingBalance: 400.00,
    withdrawnAmount: 21310.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-11-02',
    country: 'United States',
    isLiveForCalls: true,
    callRatePerMinute: 5.00,
    instantCallsEnabled: true,
    minCallMinutes: 10,
    maxCallMinutes: 45,
    acceptingCustomRequests: true,
    customRequestBasePrice: 120.00,
    customRequestDeliveryDays: 4,
    customRequestTerms: 'Personalized mix feedback, track arrangement review, customized synth sound design stems.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_marcus_stems',
        name: 'Sample Pack Pass',
        price: 12.00,
        perks: ['Monthly uncompressed royalty-free audio sample packs', 'Behind the fader production breakdowns', 'Access to community stems pool']
      },
      {
        id: 'tier_marcus_producer',
        name: 'Masterclass Producer VIP',
        price: 34.99,
        perks: ['DAW project files (Ableton & Logic)', 'Monthly group feedback listening room', 'All video masterclasses included', 'Discounted 1-on-1 mixing video calls']
      }
    ],
    socialLinks: {
      youtube: 'https://youtube.com',
      twitter: 'https://twitter.com',
      website: 'https://soundalchemy.studio'
    }
  },
  {
    id: 'creator_sarah',
    name: 'Sarah Chen',
    username: 'sarahchenfit',
    email: 'sarah@chenathletics.com',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
    bio: 'Olympic biomechanics coach & athletic conditioning specialist. Science-grounded mobility drills, progressive overload routines, and nutrition protocols.',
    category: 'Fitness & Bodybuilding',
    followersCount: 61800,
    subscribersCount: 1105,
    walletBalance: 3200.00,
    totalEarnings: 29800.00,
    pendingBalance: 550.00,
    withdrawnAmount: 26050.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2025-01-18',
    country: 'Canada',
    isLiveForCalls: false,
    callRatePerMinute: 4.50,
    instantCallsEnabled: false,
    minCallMinutes: 15,
    maxCallMinutes: 30,
    acceptingCustomRequests: true,
    customRequestBasePrice: 85.00,
    customRequestDeliveryDays: 2,
    customRequestTerms: 'Custom form check analysis from user lifting videos, customized nutrition macro blueprint.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_sarah_basic',
        name: 'Daily Mobility & Programming',
        price: 14.99,
        perks: ['Weekly periodized training blocks', 'Form check video guides', 'Subscriber nutritional library']
      },
      {
        id: 'tier_sarah_elite',
        name: 'Elite Athlete Coaching VIP',
        price: 49.99,
        perks: ['Bi-weekly 1-on-1 form critique custom video', 'Direct message priority coaching', 'Pre-release workout series access']
      }
    ],
    socialLinks: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 'creator_kai',
    name: 'Kai Zen',
    username: 'kaizencgi',
    email: 'kai@zen3d.art',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    bio: 'Houdini procedural artist and Unreal Engine worldbuilder. Procedural geometry node assets, cybernetic shader source files, and cinematic breakdown reels.',
    category: 'Digital Art & 3D Design',
    followersCount: 31200,
    subscribersCount: 640,
    walletBalance: 1950.00,
    totalEarnings: 16800.00,
    pendingBalance: 200.00,
    withdrawnAmount: 14650.00,
    isVerified: false,
    verificationStatus: 'not_verified',
    is18PlusConfirmed: true,
    dateJoined: '2025-02-05',
    country: 'Japan',
    isLiveForCalls: true,
    callRatePerMinute: 6.00,
    instantCallsEnabled: true,
    minCallMinutes: 10,
    maxCallMinutes: 40,
    acceptingCustomRequests: true,
    customRequestBasePrice: 195.00,
    customRequestDeliveryDays: 5,
    customRequestTerms: 'Bespoke procedural FX generator, 3D asset optimization consultation, customized shader.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_kai_assets',
        name: 'Shader & Node Vault',
        price: 19.99,
        perks: ['Commercial procedural Houdini node networks', '4K material PBR texture library', 'Subscribers Discord channel']
      },
      {
        id: 'tier_kai_vip',
        name: 'Technical Director VIP',
        price: 59.99,
        perks: ['Complete Unreal Engine 5.4 project files', 'Monthly 30-min architecture review', 'Direct Slack mentorship access']
      }
    ],
    socialLinks: {
      twitter: 'https://twitter.com',
      website: 'https://zen3d.art'
    }
  },
  {
    id: 'creator_maya',
    name: 'Maya Lin',
    username: 'mayalin_cine',
    email: 'maya@mayalincine.com',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80',
    bio: 'Cinema director & anamorphic lens archivist. Hollywood feature film color grades, custom DaVinci Resolve PowerGrades, lighting diagrams, and cinematography masterclasses.',
    category: 'Photography & Cinematography',
    followersCount: 52400,
    subscribersCount: 970,
    walletBalance: 3450.00,
    totalEarnings: 27900.00,
    pendingBalance: 600.00,
    withdrawnAmount: 23850.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-09-14',
    country: 'United Arab Emirates',
    creator_country_id: 'country_ae',
    countryIsoCode: 'AE',
    isLiveForCalls: true,
    callRatePerMinute: 5.50,
    instantCallsEnabled: true,
    minCallMinutes: 10,
    maxCallMinutes: 60,
    acceptingCustomRequests: true,
    customRequestBasePrice: 175.00,
    customRequestDeliveryDays: 3,
    customRequestTerms: 'Custom color grade look-development on client ProRes raw footage, cinematic lighting blueprint.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_maya_lut',
        name: 'Cine LUT Club',
        price: 11.99,
        perks: ['Monthly calibrated 3D LUT pack (.cube)', 'Lighting setup schematics with ratios', 'Behind the lens lighting diaries']
      },
      {
        id: 'tier_maya_director',
        name: 'Director VIP Circle',
        price: 39.99,
        perks: ['DaVinci Resolve full node trees', 'Access to raw RED/ARRI sample footage', '1-on-1 color grading video call review discount']
      }
    ],
    socialLinks: {
      instagram: 'https://instagram.com',
      website: 'https://mayalincine.com'
    }
  },
  {
    id: 'creator_leo',
    name: 'Leo Sterling',
    username: 'leosterling_fps',
    email: 'leo@sterlingesports.gg',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    bio: 'Former Major Champion and esports coach. Micro-aim mechanics, crosshair placement drills, tournament VOD breakdowns, and high-stakes match strategies.',
    category: 'Gaming & Esports',
    followersCount: 78900,
    subscribersCount: 1680,
    walletBalance: 5120.00,
    totalEarnings: 44200.00,
    pendingBalance: 820.00,
    withdrawnAmount: 38260.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-07-20',
    country: 'Sweden',
    isLiveForCalls: true,
    callRatePerMinute: 4.00,
    instantCallsEnabled: true,
    minCallMinutes: 15,
    maxCallMinutes: 60,
    acceptingCustomRequests: true,
    customRequestBasePrice: 90.00,
    customRequestDeliveryDays: 2,
    customRequestTerms: 'Detailed 10-minute game replay analysis with timestamped coaching notes and sensitivity recommendations.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_leo_tactics',
        name: 'Tactics & Aim Routines',
        price: 9.99,
        perks: ['Daily 20-min aim lab playlists', 'Weekly tournament VOD tactical analyses', 'Private Discord strategy room']
      },
      {
        id: 'tier_leo_pro',
        name: 'Pro Academy VIP',
        price: 29.99,
        perks: ['Monthly custom replay VOD review', 'Priority scrimmage team matchmaking', 'Exclusive 120hz gameplay raw recordings']
      }
    ],
    socialLinks: {
      twitter: 'https://twitter.com',
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 'creator_chloe',
    name: 'Chloe Bennett',
    username: 'chefchloe_b',
    email: 'chloe@bennettpatisserie.com',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
    bio: 'Michelin-starred pastry chef & modern French culinary innovator. Scientific baking formulas, laminated dough laminations, and private salon recipes.',
    category: 'Culinary Arts & Gourmet',
    followersCount: 46700,
    subscribersCount: 920,
    walletBalance: 2780.00,
    totalEarnings: 26100.00,
    pendingBalance: 410.00,
    withdrawnAmount: 22910.00,
    isVerified: false,
    verificationStatus: 'renewal_required',
    is18PlusConfirmed: true,
    dateJoined: '2024-10-05',
    country: 'France',
    isLiveForCalls: true,
    callRatePerMinute: 5.00,
    instantCallsEnabled: true,
    minCallMinutes: 10,
    maxCallMinutes: 45,
    acceptingCustomRequests: true,
    customRequestBasePrice: 130.00,
    customRequestDeliveryDays: 3,
    customRequestTerms: 'Custom holiday menu design, bespoke pastry recipe formulation for special dietary constraints.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_chloe_recipes',
        name: 'Atelier Recipe Vault',
        price: 15.00,
        perks: ['Printable culinary formula sheets (in grams)', 'Step-by-step 4K plating guides', 'Monthly seasonal pastry drops']
      },
      {
        id: 'tier_chloe_master',
        name: 'Grand Chef Guild',
        price: 45.00,
        perks: ['Live monthly interactive kitchen masterclass', 'Direct recipe trouble-shooting DM access', 'Free access to all PPV pastry workshops']
      }
    ],
    socialLinks: {
      instagram: 'https://instagram.com',
      website: 'https://bennettpatisserie.com'
    }
  },
  {
    id: 'creator_alex',
    name: 'Alex Rivera',
    username: 'alexrivera_dev',
    email: 'alex@systemsarchitect.io',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80',
    bio: 'Staff distributed systems engineer & compiler architect. Deep-dive Rust internals, zero-copy networking, low-latency concurrent systems, and system design whitepapers.',
    category: 'Tech & Software Development',
    followersCount: 58300,
    subscribersCount: 1340,
    walletBalance: 4600.00,
    totalEarnings: 41500.00,
    pendingBalance: 780.00,
    withdrawnAmount: 36120.00,
    isVerified: true,
    is18PlusConfirmed: true,
    dateJoined: '2024-06-30',
    country: 'United States',
    isLiveForCalls: true,
    callRatePerMinute: 8.00,
    instantCallsEnabled: true,
    minCallMinutes: 15,
    maxCallMinutes: 60,
    acceptingCustomRequests: true,
    customRequestBasePrice: 250.00,
    customRequestDeliveryDays: 4,
    customRequestTerms: 'Comprehensive system design architecture review, database performance audit, code review on concurrent Rust/Go subsystems.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_alex_papers',
        name: 'Systems Engineering Digest',
        price: 12.99,
        perks: ['Weekly deep-dive architectural whitepapers', 'Benchmark code repositories', 'System design interview breakdowns']
      },
      {
        id: 'tier_alex_principal',
        name: 'Principal Architect Tier',
        price: 49.99,
        perks: ['Monthly private 1-on-1 code consultation discount', 'Direct pull-request code reviews', 'Unreleased production system architectures']
      }
    ],
    socialLinks: {
      twitter: 'https://twitter.com',
      website: 'https://systemsarchitect.io'
    }
  },
  {
    id: 'creator_zara',
    name: 'Zara Morales',
    username: 'zaramorales_dance',
    email: 'zara@moralescontemporary.es',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1600&q=80',
    bio: 'Contemporary dance soloist & international theater choreographer. Expressive movement phrasing, floorwork kinetics, performance routines, and musicality breakdowns.',
    category: 'Dance & Choreography',
    followersCount: 39500,
    subscribersCount: 790,
    walletBalance: 2420.00,
    totalEarnings: 21300.00,
    pendingBalance: 320.00,
    withdrawnAmount: 18560.00,
    isVerified: false,
    verificationStatus: 'payment_pending',
    is18PlusConfirmed: true,
    dateJoined: '2025-01-05',
    country: 'Spain',
    isLiveForCalls: false,
    callRatePerMinute: 4.50,
    instantCallsEnabled: false,
    minCallMinutes: 15,
    maxCallMinutes: 45,
    acceptingCustomRequests: true,
    customRequestBasePrice: 110.00,
    customRequestDeliveryDays: 3,
    customRequestTerms: 'Personalized choreography sequence tailored to your musical track, audition routine feedback.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_zara_studio',
        name: 'Studio Masterclass Pass',
        price: 12.00,
        perks: ['Weekly contemporary technique classes', 'Floorwork conditioning routines', 'Choreography slow-motion breakdowns']
      },
      {
        id: 'tier_zara_vip',
        name: 'Soloist Circle VIP',
        price: 35.00,
        perks: ['Audition critique via personalized video', 'Early access to international tour pieces', 'Direct WhatsApp mentoring']
      }
    ],
    socialLinks: {
      instagram: 'https://instagram.com',
      youtube: 'https://youtube.com'
    }
  },
  {
    id: 'creator_david',
    name: 'David Kalu',
    username: 'davidkalu_wellness',
    email: 'david@sanctuarymind.com',
    role: 'creator',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80',
    bio: 'Mindfulness practitioner, sound bath healer, and certified breathwork instructor. 432Hz acoustic sound immersion, parasympathetic nervous system resets, and guided sleep sanctuaries.',
    category: 'Wellness & Meditation',
    followersCount: 33800,
    subscribersCount: 710,
    walletBalance: 1980.00,
    totalEarnings: 18200.00,
    pendingBalance: 240.00,
    withdrawnAmount: 15980.00,
    isVerified: false,
    verificationStatus: 'suspended',
    is18PlusConfirmed: true,
    dateJoined: '2025-02-12',
    country: 'South Africa',
    isLiveForCalls: true,
    callRatePerMinute: 4.00,
    instantCallsEnabled: true,
    minCallMinutes: 15,
    maxCallMinutes: 60,
    acceptingCustomRequests: true,
    customRequestBasePrice: 95.00,
    customRequestDeliveryDays: 2,
    customRequestTerms: 'Personalized guided meditation audio/video addressing anxiety, insomnia, or creative block.',
    isDemo: true,
    tiers: [
      {
        id: 'tier_david_sanctuary',
        name: 'Daily Sanctuary Pass',
        price: 9.99,
        perks: ['Daily 15-minute morning meditation audio', 'Binaural sound bath uncompressed FLAC files', 'Subscriber serenity journal']
      },
      {
        id: 'tier_david_deep',
        name: 'Deep Resonance VIP',
        price: 29.99,
        perks: ['Live bi-weekly sunset meditation streams', 'Personalized monthly breathwork blueprint', 'Direct mindfulness Q&A channel']
      }
    ],
    socialLinks: {
      instagram: 'https://instagram.com',
      website: 'https://sanctuarymind.com'
    }
  }
].map((creator): CreatorProfile => {
  const resolvedCountry = resolveCountryRecord(creator.country);
  return {
    ...(creator as CreatorProfile),
    role: 'creator',
    creator_country_id: (creator as CreatorProfile).creator_country_id || resolvedCountry?.id || 'country_us',
    countryIsoCode: (creator as CreatorProfile).countryIsoCode || resolvedCountry?.iso_code || 'US'
  };
});

// Explicit independent Video Country assignments for existing posts (independent from Creator Country)
const POST_VIDEO_COUNTRY_OVERRIDES: Record<string, string> = {
  post_ppv_elena_1: 'France',
  post_clip_elena_highlight: 'France',
  post_elena_subs_1: 'Italy',
  post_elena_photo_public: 'France',
  post_marcus_free_1: 'United States',
  post_marcus_ppv_1: 'United Kingdom',
  post_marcus_subs_photo: 'United States',
  post_sarah_ppv_1: 'Canada',
  post_sarah_public_v1: 'Canada',
  post_sarah_photo_subs: 'United States',
  post_kai_public_1: 'Japan',
  post_kai_ppv_1: 'Japan',
  post_kai_render_gallery: 'Japan',
  // Maya Lin has Creator Country = United Arab Emirates, while her videos have France, Japan, and UAE as Video Country
  post_maya_public_v1: 'France',
  post_maya_ppv_1: 'Japan',
  post_maya_photo_subs: 'United Arab Emirates',
  post_leo_public_v1: 'Sweden',
  post_leo_ppv_1: 'Germany',
  post_leo_photo_battlestation: 'Sweden',
  post_chloe_public_v1: 'France',
  post_chloe_ppv_1: 'Switzerland'
};

export const MOCK_POSTS: Post[] = DEMO_POSTS.map((rawPost, idx) => {
  const creator = MOCK_CREATORS.find(c => c.id === rawPost.creatorId);
  const videoCountryName =
    rawPost.country ||
    POST_VIDEO_COUNTRY_OVERRIDES[rawPost.id] ||
    creator?.country ||
    'United States';
  const resolvedVideoCountry = resolveCountryRecord(videoCountryName);

  // Accurate category migration to official category records
  const rawCategories =
    rawPost.id === 'post_maya_public_v1'
      ? Array.from(new Set([...(rawPost.categories || ['Photography & Cinematography']), 'Amateur']))
      : rawPost.categories && rawPost.categories.length > 0
      ? rawPost.categories
      : creator?.category
      ? [creator.category]
      : ['Fashion & Luxury'];

  const matchedCategoryRecords = rawCategories
    .map(catName => resolveCategoryRecord(catName))
    .filter((rec): rec is NonNullable<typeof rec> => Boolean(rec));

  const post: Post = {
    ...rawPost,
    country: resolvedVideoCountry?.name || videoCountryName,
    video_country_id: resolvedVideoCountry?.id || 'country_us',
    categories:
      matchedCategoryRecords.length > 0
        ? matchedCategoryRecords.map(r => r.name)
        : rawCategories,
    category_ids: matchedCategoryRecords.map(r => r.id)
  };

  const hasVideo = post.media.some(m => m.type === 'video');
  if (!hasVideo) return post;

  // Deterministic resolution ladder based on post index so we have 4K, 1080p, and 720p examples
  const is4K = idx % 3 === 0;
  const is720p = idx % 5 === 4;
  const resolutions: VideoResolution[] = is4K
    ? ['4K', '1440p', '1080p', '720p', '480p', '360p']
    : is720p
    ? ['720p', '480p', '360p']
    : ['1080p', '720p', '480p', '360p'];

  const width = is4K ? 3840 : is720p ? 1280 : 1920;
  const height = is4K ? 2160 : is720p ? 720 : 1080;
  const origBytes = is4K ? 1480 * 1024 * 1024 : is720p ? 92 * 1024 * 1024 : 284 * 1024 * 1024;
  const optBytes = Math.round(origBytes * 0.38);

  return {
    ...post,
    fileSize: optBytes,
    media: post.media.map(m =>
      m.type === 'video'
        ? {
            ...m,
            videoMediaId: `vmedia_${post.id}`,
            availableResolutions: resolutions,
            availableCodecs: ['H.264', 'H.265/HEVC', 'AV1'],
            streamingManifestRef: `https://cdn.acovon.media/hls/${post.id}/master.m3u8`,
            streamingProtocol: 'HLS',
            originalFileSize: origBytes,
            optimizedFileSize: optBytes,
            compressionRatio: 0.62,
            vmafScore: is4K ? 97.4 : 96.1,
            width,
            height,
            aspectRatio: '16:9',
            orientation: 'landscape',
            frameRate: is4K ? 60 : 30
          }
        : m
    )
  };
});

export const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_jordan_elena',
    fanId: 'user_fan_1',
    creatorId: 'creator_elena',
    tierId: 'tier_elena_vip',
    tierName: 'Couture VIP Tier',
    monthlyPrice: 24.99,
    status: 'active',
    startDate: '2026-05-01',
    nextRenewalDate: '2026-12-01',
    autoRenew: true
  },
  {
    id: 'sub_sofia_elena',
    fanId: 'fan_sofia',
    creatorId: 'creator_elena',
    tierId: 'tier_elena_patron',
    tierName: 'Private Circle Patron',
    monthlyPrice: 69.99,
    status: 'active',
    startDate: '2026-10-28',
    nextRenewalDate: '2026-11-28',
    autoRenew: true
  },
  {
    id: 'sub_alex_marcus',
    fanId: 'fan_alex',
    creatorId: 'creator_marcus',
    tierId: 'tier_marcus_producer',
    tierName: 'Masterclass Producer VIP',
    monthlyPrice: 34.99,
    status: 'active',
    startDate: '2026-10-30',
    nextRenewalDate: '2026-11-30',
    autoRenew: true
  },
  {
    id: 'sub_jordan_sarah',
    fanId: 'user_fan_1',
    creatorId: 'creator_sarah',
    tierId: 'tier_sarah_basic',
    tierName: 'Daily Mobility & Programming',
    monthlyPrice: 14.99,
    status: 'active',
    startDate: '2026-11-01',
    nextRenewalDate: '2026-12-01',
    autoRenew: true
  },
  {
    id: 'sub_lucas_leo',
    fanId: 'fan_lucas',
    creatorId: 'creator_leo',
    tierId: 'tier_leo_pro',
    tierName: 'Pro Academy VIP',
    monthlyPrice: 29.99,
    status: 'cancelled',
    startDate: '2026-08-15',
    nextRenewalDate: '2026-11-15',
    autoRenew: false
  },
  {
    id: 'sub_sofia_chloe',
    fanId: 'fan_sofia',
    creatorId: 'creator_chloe',
    tierId: 'tier_chloe_recipes',
    tierName: 'Atelier Recipe Vault',
    monthlyPrice: 15.00,
    status: 'active',
    startDate: '2026-11-02',
    nextRenewalDate: '2026-12-02',
    autoRenew: true
  }
];

export const MOCK_PURCHASES: ContentPurchase[] = [
  {
    id: 'pur_1',
    userId: 'user_fan_1',
    postId: 'post_sarah_ppv_1',
    creatorId: 'creator_sarah',
    amount: 9.99,
    purchasedAt: '2026-10-20'
  },
  {
    id: 'pur_2',
    userId: 'fan_sofia',
    postId: 'demo_post_elena_1',
    creatorId: 'creator_elena',
    amount: 19.99,
    purchasedAt: '2026-10-29'
  },
  {
    id: 'pur_3',
    userId: 'fan_alex',
    postId: 'demo_post_marcus_1',
    creatorId: 'creator_marcus',
    amount: 14.99,
    purchasedAt: '2026-11-01'
  }
];

export const MOCK_CUSTOM_REQUESTS: CustomVideoRequest[] = [
  {
    id: 'req_101',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    fanUsername: 'jordancross',
    fanAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    title: 'Gala Wardrobe & Vintage Jewelry Assessment',
    instructions: 'I am attending the Venice Biennale charity gala next month. Please review my attached moodboard and give me a 3-minute styling recommendation on silhouettes, jewelry balance, and shoes.',
    recipientName: 'Jordan',
    videoDurationMinutes: 3,
    price: 150.00,
    proposedBudget: 150.00,
    platformFee: 30.00,
    creatorEarnings: 120.00,
    referenceFileUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=800&q=80',
    status: 'delivered',
    deliveryDeadline: '2026-11-04',
    deliveredVideoUrl: '/videos/sample1.mp4',
    deliveredNotes: 'Here is your personalized styling consultation Jordan! Focus on dramatic simplicity: the matte black column gown with the emerald ear clips will be stunning.',
    createdAt: '2026-10-28',
    deliveredAt: '2026-10-30'
  },
  {
    id: 'req_102',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    fanUsername: 'jordancross',
    fanAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    title: 'Analog Drum Bus Saturation Feedback',
    instructions: 'Struggling with punch in my 808 and low-mid separation. Reviewing my uncompressed audio stem to show me how you compress and saturate live.',
    recipientName: 'Jordan',
    videoDurationMinutes: 2,
    price: 120.00,
    proposedBudget: 120.00,
    platformFee: 24.00,
    creatorEarnings: 96.00,
    status: 'in_progress',
    deliveryDeadline: '2026-11-03',
    createdAt: '2026-10-29'
  },
  {
    id: 'req_103',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    fanUsername: 'jordancross',
    fanAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    title: 'Private Paris Runway Capsule Critique',
    instructions: 'Could you record a 4-minute private walkthrough comparing the structured wool coats from your Autumn collection and suggest which cut fits a tall frame best?',
    recipientName: 'Jordan Cross',
    videoDurationMinutes: 4,
    price: 185.00,
    proposedBudget: 185.00,
    platformFee: 37.00,
    creatorEarnings: 148.00,
    status: 'pending',
    deliveryDeadline: '2026-11-06',
    createdAt: '2026-11-02'
  },
  {
    id: 'req_104',
    fanId: 'fan_lucas',
    fanName: 'Lucas Weber',
    fanUsername: 'lucasweber_zh',
    fanAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    title: 'Valorant Ascent Defensive Anchor VOD Review',
    instructions: 'Review my tournament match replay and point out rotation timing errors.',
    recipientName: 'Lucas',
    videoDurationMinutes: 5,
    price: 90.00,
    proposedBudget: 90.00,
    platformFee: 18.00,
    creatorEarnings: 72.00,
    status: 'disputed',
    disputeReason: 'Fan claims audio commentary track had microphone clipping after minute 3.',
    deliveryDeadline: '2026-11-01',
    createdAt: '2026-10-27'
  }
];

export const MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  creator_elena: [
    {
      id: 'm1',
      senderId: 'creator_elena',
      receiverId: 'user_fan_1',
      content: 'Welcome to the VIP Circle Jordan! So delighted to have you support my atelier archives.',
      createdAt: 'Yesterday, 10:24 AM',
      read: true
    },
    {
      id: 'm2',
      senderId: 'user_fan_1',
      receiverId: 'creator_elena',
      content: 'Thank you Elena! Your Venice styling consultation was extraordinary. I purchased the exact emerald clips you recommended!',
      createdAt: 'Yesterday, 11:05 AM',
      read: true
    },
    {
      id: 'm3',
      senderId: 'user_fan_1',
      receiverId: 'creator_elena',
      content: 'Sent you a celebratory tip for the great recommendation!',
      isTip: true,
      tipAmount: 50.00,
      createdAt: 'Yesterday, 11:06 AM',
      read: true
    },
    {
      id: 'm_call_1',
      senderId: 'user_fan_1',
      receiverId: 'creator_elena',
      content: '1-on-1 Private Video Consultation completed',
      videoCallEvent: {
        callId: 'call_hist_101',
        status: 'completed',
        ratePerMinute: 4.50,
        durationSeconds: 360,
        totalCharged: 27.00,
        timestamp: 'Yesterday, 3:15 PM'
      },
      createdAt: 'Yesterday, 3:21 PM',
      read: true
    },
    {
      id: 'm4',
      senderId: 'creator_elena',
      receiverId: 'user_fan_1',
      content: 'Here is an unreleased sneak peek from today’s private showroom fitting in Paris:',
      isPaid: true,
      price: 15.00,
      isUnlocked: false,
      mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=800&q=80',
      mediaThumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=400&q=60',
      mediaFileName: 'Paris_Showroom_Fitting_Look01.jpg',
      mediaDescription: 'High-resolution backstage fitting photo + fabric drape notes.',
      mediaType: 'image',
      attachments: [
        {
          id: 'att_m4_1',
          fileName: 'Paris_Showroom_Fitting_Look01.jpg',
          fileType: 'image',
          fileSizeFormatted: '3.4 MB',
          url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=85',
          thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=40',
          description: 'Backstage showroom look #1 in silk organza',
          isPaid: true,
          price: 15.00,
          isUnlocked: false
        }
      ],
      createdAt: 'Today, 9:15 AM',
      read: true
    },
    {
      id: 'm5_video_paid',
      senderId: 'creator_elena',
      receiverId: 'user_fan_1',
      content: 'I also filmed a private 4K backstage runway walk & commentary exclusively for you:',
      isPaid: true,
      price: 25.00,
      isUnlocked: false,
      mediaUrl: '/videos/sample2.mp4',
      mediaThumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=70',
      mediaFileName: 'Private_Runway_Walkthrough_4K.mp4',
      mediaDescription: 'Full 4K backstage runway rehearsal video with live audio notes.',
      mediaType: 'video',
      attachments: [
        {
          id: 'att_m5_1',
          fileName: 'Private_Runway_Walkthrough_4K.mp4',
          fileType: 'video',
          fileSizeFormatted: '18.2 MB',
          url: '/videos/sample3.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=70',
          description: 'Full 4K backstage runway rehearsal video',
          isPaid: true,
          price: 25.00,
          isUnlocked: false
        }
      ],
      createdAt: 'Today, 9:40 AM',
      read: false
    },
    {
      id: 'm6_req_103',
      senderId: 'user_fan_1',
      receiverId: 'creator_elena',
      content: 'Submitted Custom Video Request: Private Paris Runway Capsule Critique ($185.00)',
      customRequestId: 'req_103',
      createdAt: 'Today, 10:05 AM',
      read: false
    }
  ],
  creator_marcus: [
    {
      id: 'mm1',
      senderId: 'creator_marcus',
      receiverId: 'user_fan_1',
      content: 'Hey Jordan, saw your request for drum bus saturation. I’m firing up the SSL console today to film your personalized walkthrough!',
      createdAt: 'Yesterday, 4:10 PM',
      read: true
    },
    {
      id: 'mm2_req_102',
      senderId: 'user_fan_1',
      receiverId: 'creator_marcus',
      content: 'Submitted Custom Video Request: Analog Drum Bus Saturation Feedback ($120.00)',
      customRequestId: 'req_102',
      createdAt: 'Yesterday, 4:12 PM',
      read: true
    }
  ]
};

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
  {
    id: 'tx_1001',
    userId: 'user_fan_1',
    type: 'deposit',
    amount: 300.00,
    description: 'Instant Card Wallet Funding (Ref: #849201)',
    status: 'completed',
    createdAt: '2026-10-15 14:22'
  },
  {
    id: 'tx_1002',
    userId: 'user_fan_1',
    type: 'subscription',
    amount: -24.99,
    description: 'Monthly VIP Subscription to Elena Vance (Couture VIP Tier)',
    status: 'completed',
    createdAt: '2026-10-18 10:00',
    platformFee: 5.00,
    netCreatorEarnings: 19.99
  },
  {
    id: 'tx_1003',
    userId: 'user_fan_1',
    type: 'custom_request',
    amount: -150.00,
    description: 'Custom Video Request Escrow: Elena Vance (Venice Gala)',
    status: 'completed',
    createdAt: '2026-10-28 16:45',
    platformFee: 30.00,
    netCreatorEarnings: 120.00
  },
  {
    id: 'tx_1004',
    userId: 'user_fan_1',
    type: 'tip',
    amount: -50.00,
    description: 'In-Chat Direct Tip to Elena Vance',
    status: 'completed',
    createdAt: '2026-10-30 11:06',
    platformFee: 7.50,
    netCreatorEarnings: 42.50
  },
  {
    id: 'tx_1005',
    userId: 'creator_elena',
    type: 'payout_received',
    amount: 120.00,
    description: 'Released Escrow from Completed Custom Video (Jordan Cross)',
    status: 'completed',
    createdAt: '2026-10-30 18:00'
  },
  {
    id: 'tx_1006',
    userId: 'fan_sofia',
    type: 'subscription',
    amount: -69.99,
    description: 'Monthly Subscription to Elena Vance (Private Circle Patron)',
    status: 'completed',
    createdAt: '2026-10-28 12:15',
    platformFee: 14.00,
    netCreatorEarnings: 55.99
  },
  {
    id: 'tx_1007',
    userId: 'fan_sofia',
    type: 'ppv_purchase',
    amount: -19.99,
    description: 'Unlocked PPV Vault Post: Haute Couture Atelier Fitting',
    status: 'completed',
    createdAt: '2026-10-29 19:04',
    platformFee: 4.00,
    netCreatorEarnings: 15.99
  },
  {
    id: 'tx_1008',
    userId: 'user_fan_1',
    type: 'video_call',
    amount: -27.00,
    description: '1-on-1 Private Video Call with Elena Vance (6 mins @ $4.50/min)',
    status: 'completed',
    createdAt: '2026-11-02 15:21',
    platformFee: 5.40,
    netCreatorEarnings: 21.60
  },
  {
    id: 'tx_1009',
    userId: 'user_fan_1',
    type: 'paid_message',
    amount: -15.00,
    description: 'Unlocked Private Showroom Media Attachment from Elena Vance',
    status: 'completed',
    createdAt: '2026-11-02 18:40',
    platformFee: 3.00,
    netCreatorEarnings: 12.00
  },
  {
    id: 'tx_1010',
    userId: 'user_fan_1',
    type: 'live_replay',
    amount: -12.50,
    description: 'Purchased Official Livestream Recording: Marcus Thorne Modular Synth Jam',
    status: 'completed',
    createdAt: '2026-11-01 20:10',
    platformFee: 2.50,
    netCreatorEarnings: 10.00
  },
  {
    id: 'tx_1011',
    userId: 'fan_alex',
    type: 'live_ticket',
    amount: -19.99,
    description: 'PPV Livestream Ticket: Maya Lin Anamorphic Lens Masterclass',
    status: 'completed',
    createdAt: '2026-11-02 21:00',
    platformFee: 4.00,
    netCreatorEarnings: 15.99
  },
  {
    id: 'tx_1012',
    userId: 'fan_lucas',
    type: 'custom_request',
    amount: -90.00,
    description: 'Disputed Custom Video Escrow: Leo Sterling VOD Review (#req_104)',
    status: 'disputed',
    createdAt: '2026-10-27 17:30',
    platformFee: 18.00,
    netCreatorEarnings: 72.00
  },
  {
    id: 'tx_1013',
    userId: 'fan_lucas',
    type: 'deposit',
    amount: 250.00,
    description: 'Card Top-Up Declined by Issuing Bank (3DS Timeout)',
    status: 'failed',
    createdAt: '2026-10-29 14:09'
  }
];

export const MOCK_PROMOTIONS: PromotionCampaign[] = [
  {
    id: 'promo_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    type: 'boost_profile',
    packageTitle: 'Growth Boost (Top Discovery Placement)',
    budget: 50.00,
    durationDays: 7,
    status: 'active',
    impressions: 14250,
    clicks: 1120,
    profileVisits: 980,
    startDate: '2026-10-28',
    endDate: '2026-11-04'
  },
  {
    id: 'promo_2',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    type: 'promote_post',
    targetPostId: 'post_marcus_free_1',
    packageTitle: 'Starter Post Promotion',
    budget: 25.00,
    durationDays: 3,
    status: 'active',
    impressions: 8430,
    clicks: 654,
    profileVisits: 412,
    startDate: '2026-11-01',
    endDate: '2026-11-04'
  },
  {
    id: 'promo_3',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    type: 'featured_creator',
    packageTitle: 'Homepage Spotlight Hero Banner',
    budget: 120.00,
    durationDays: 14,
    status: 'pending_approval',
    impressions: 0,
    clicks: 0,
    profileVisits: 0,
    startDate: '2026-11-04',
    endDate: '2026-11-18'
  }
];

export const MOCK_VERIFICATIONS: CreatorVerification[] = [
  {
    id: 'verif_1',
    userId: 'creator_elena',
    name: 'Elena Vance',
    username: 'elenavance',
    documentType: 'passport',
    documentNumber: 'FR-92841029',
    documentFileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    selfieUrl: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    status: 'approved',
    submittedAt: '2024-08-11',
    notes: 'Official French Republic biometric passport verified. 18+ identity and face-match confirmed.'
  },
  {
    id: 'verif_2',
    userId: 'creator_newbie',
    name: 'Chloe Dupond',
    username: 'chloedupont',
    documentType: 'drivers_license',
    documentNumber: 'DL-5529104',
    documentFileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    submittedAt: '2026-10-31',
    notes: 'Awaiting moderation team inspection of high-resolution hologram and age proof.',
    applicationData: {
      displayName: 'Chloe Dupond',
      category: 'Fashion & Luxury',
      bio: 'Parisian bespoke milliner and couture accessories designer.',
      socialLinks: 'https://instagram.com/chloedupont_atelier',
      monthlyTierPrice: 16.99,
      dateOfBirth: '1997-04-18',
      documentType: 'drivers_license',
      documentNumber: 'DL-5529104',
      termsAccepted: true,
      ageConfirmed: true
    }
  },
  {
    id: 'verif_3',
    userId: 'creator_applicant_2',
    name: 'Dante Moretti',
    username: 'dantemoretti_film',
    documentType: 'passport',
    documentNumber: 'IT-77319042',
    documentFileUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&q=80',
    selfieUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    status: 'pending',
    submittedAt: '2026-11-02',
    notes: 'New creator application for Cinematography & Color Grading vertical.',
    applicationData: {
      displayName: 'Dante Moretti',
      category: 'Photography & Cinematography',
      bio: 'Rome-based 35mm film director & vintage lens restoration specialist.',
      socialLinks: 'https://vimeo.com/dantemoretti',
      monthlyTierPrice: 19.99,
      dateOfBirth: '1993-11-09',
      documentType: 'passport',
      documentNumber: 'IT-77319042',
      termsAccepted: true,
      ageConfirmed: true
    }
  }
];

export const MOCK_REPORTS: ModerationReport[] = [
  {
    id: 'rep_1',
    reporterId: 'user_fan_1',
    reporterName: 'Jordan Cross',
    targetType: 'post',
    targetId: 'demo_post_elena_1',
    targetTitle: 'Suspicious third-party watermark claim on gallery upload',
    reason: 'copyright',
    details: 'Reporter flagged potential unlicensed background music stem in behind-the-scenes clip.',
    status: 'open',
    assignedModeratorId: 'user_mod_1',
    assignedModeratorName: 'Clara Vance',
    createdAt: '2026-11-02 21:14',
    actionHistory: [
      { timestamp: '2026-11-02 21:14', actor: 'System', action: 'Report submitted by @jordancross' },
      { timestamp: '2026-11-02 21:20', actor: 'Clara Vance', action: 'Assigned to Trust & Safety queue' }
    ]
  },
  {
    id: 'rep_2',
    reporterId: 'creator_elena',
    reporterName: 'Elena Vance',
    targetType: 'user',
    targetId: 'fan_banned_1',
    targetTitle: 'Account @vkane_ripper — Attempted screen capture redistribution',
    reason: 'tos_violation',
    details: 'User attempted to share external links to recorded PPV content in live stream chat.',
    status: 'investigating',
    assignedModeratorId: 'user_mod_1',
    assignedModeratorName: 'Clara Vance',
    createdAt: '2026-11-01 18:05',
    actionHistory: [
      { timestamp: '2026-11-01 18:05', actor: 'Elena Vance', action: 'Creator submitted high-priority copyright & leak report' }
    ]
  },
  {
    id: 'rep_3',
    reporterId: 'fan_sofia',
    reporterName: 'Sofia Ricci',
    targetType: 'message',
    targetId: 'm4',
    targetTitle: 'Reported Direct Message Spam / Phishing Check',
    reason: 'spam',
    details: 'Requested verification that the showroom attachment link is official.',
    status: 'open',
    createdAt: '2026-11-03 07:45',
    actionHistory: [
      { timestamp: '2026-11-03 07:45', actor: 'System', action: 'Flagged for authorized message safety review' }
    ]
  },
  {
    id: 'rep_4',
    reporterId: 'fan_alex',
    reporterName: 'Alex Mercer',
    targetType: 'livestream',
    targetId: 'live_elena_public',
    targetTitle: 'Live Broadcast Audio Sync & Chat Harassment Flag',
    reason: 'harassment',
    details: 'Viewer reported a troll account spamming comments in the public live chat.',
    status: 'open',
    createdAt: '2026-11-03 09:30'
  }
];

export const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_1',
    userId: 'user_fan_1',
    type: 'custom_request',
    title: 'Custom Video Delivered!',
    message: 'Elena Vance has delivered your personalized video request: Venice Gala Wardrobe.',
    read: false,
    createdAt: '1 hour ago',
    linkUrl: '/requests'
  },
  {
    id: 'notif_2',
    userId: 'user_fan_1',
    type: 'message',
    title: 'Exclusive Message from Elena Vance',
    message: 'Elena sent an exclusive showroom preview in direct messages.',
    read: false,
    createdAt: '3 hours ago',
    linkUrl: '/messages'
  },
  {
    id: 'notif_3',
    userId: 'creator_elena',
    type: 'tip',
    title: 'You received a $50 Tip!',
    message: 'Jordan Cross sent you a $50 tip in chat.',
    read: true,
    createdAt: 'Yesterday'
  }
];

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

export const MOCK_LIVESTREAMS: Livestream[] = DEMO_LIVESTREAMS;

export const MOCK_LIVE_CHAT: Record<string, LiveChatMessage[]> = {
  live_elena_public: [
    {
      id: 'c1',
      streamId: 'live_elena_public',
      senderId: 'user_fan_1',
      senderName: 'Jordan Cross',
      senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      senderRole: 'vip',
      message: 'The bias drape on the black organza is breathtaking Elena!',
      type: 'standard',
      timestamp: '2m ago'
    },
    {
      id: 'c2',
      streamId: 'live_elena_public',
      senderId: 'fan_sofia',
      senderName: 'Sofia Ricci',
      senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      senderRole: 'subscriber',
      message: 'Sent a Celestial Star ⭐ to support the atelier stream!',
      type: 'gift',
      amountPaid: 5.00,
      giftData: { id: 'gift_star', name: 'Celestial Star', price: 5.00, icon: '⭐', animationColor: '#fbbf24', description: 'Sparkle in the creator live chat' },
      timestamp: '1m ago'
    },
    {
      id: 'c3',
      streamId: 'live_elena_public',
      senderId: 'fan_alex',
      senderName: 'Alex Mercer',
      senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      senderRole: 'viewer',
      message: 'PRIORITY QUESTION: What weight silk crepe do you recommend for sharp architectural pleating?',
      type: 'priority_question',
      amountPaid: 5.00,
      timestamp: '30s ago'
    }
  ]
};

export const MOCK_PAYOUT_REQUESTS: PayoutRequest[] = [
  {
    id: 'payout_101',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    amount: 750.00,
    method: 'SEPA Instant Wire (BNP Paribas Paris)',
    accountDestination: 'FR76 •••• •••• 4829',
    status: 'pending',
    requestedAt: '2026-11-02 19:30',
    notes: 'Weekly atelier subscription & custom video settlement.'
  },
  {
    id: 'payout_102',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    amount: 820.00,
    method: 'Stripe Express Direct Deposit',
    accountDestination: 'SE45 •••• •••• 9104',
    status: 'pending',
    requestedAt: '2026-11-03 08:15',
    notes: 'Pro Academy VIP monthly payout request.'
  },
  {
    id: 'payout_103',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    amount: 780.00,
    method: 'ACH Priority Bank Transfer (Chase)',
    accountDestination: 'US •••• 3319',
    status: 'approved',
    requestedAt: '2026-11-01 14:20',
    processedAt: '2026-11-02 09:00',
    processedByAdminId: 'user_admin_finance',
    processedByAdminName: 'Henrik Lindqvist',
    notes: 'Approved for next-day treasury batch.'
  },
  {
    id: 'payout_104',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    amount: 1450.00,
    method: 'Stripe Express Direct Deposit',
    accountDestination: 'US •••• 7741',
    status: 'completed',
    requestedAt: '2026-10-28 11:00',
    processedAt: '2026-10-29 10:15',
    processedByAdminId: 'user_admin_finance',
    processedByAdminName: 'Henrik Lindqvist',
    notes: 'Settled in full. Wire ref #ACV-994821.'
  }
];

export const MOCK_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_501',
    userId: 'fan_lucas',
    userName: 'Lucas Weber',
    userUsername: 'lucasweber_zh',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    userRole: 'fan',
    category: 'payment_dispute',
    subject: 'Custom Video Audio Clipping — Partial or Full Escrow Refund Request',
    description: 'In custom video order #req_104 ($90.00), the audio commentary cut out after the 3-minute mark. Requesting either a re-upload or escrow refund.',
    priority: 'high',
    status: 'open',
    assignedAdminId: 'user_admin_support',
    assignedAdminName: 'Sophia Lin',
    relatedRequestId: 'req_104',
    relatedTransactionId: 'tx_1012',
    disputedAmount: 90.00,
    createdAt: '2026-11-02 16:40',
    updatedAt: '2026-11-03 08:20',
    messages: [
      {
        id: 'tm_1',
        senderId: 'fan_lucas',
        senderName: 'Lucas Weber',
        senderRole: 'user',
        message: 'Hello Support, the video from Leo Sterling has audio distortion in the last 2 minutes. Can you hold the escrow release or issue a refund?',
        timestamp: '2026-11-02 16:40'
      },
      {
        id: 'tm_2',
        senderId: 'user_admin_support',
        senderName: 'Sophia Lin',
        senderRole: 'admin',
        message: 'Hi Lucas, we have placed escrow #req_104 on protective hold while our team reviews the delivered file with the creator.',
        timestamp: '2026-11-03 08:20'
      }
    ]
  },
  {
    id: 'tkt_502',
    userId: 'creator_elena',
    userName: 'Elena Vance',
    userUsername: 'elenavance',
    userAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    userRole: 'creator',
    category: 'payout_issue',
    subject: 'Expedited SEPA Settlement Inquiry for Paris Atelier Week',
    description: 'Checking if pending payout #payout_101 ($750.00) can be cleared in today’s European treasury window.',
    priority: 'medium',
    status: 'in_progress',
    assignedAdminId: 'user_admin_finance',
    assignedAdminName: 'Henrik Lindqvist',
    createdAt: '2026-11-02 20:05',
    updatedAt: '2026-11-03 09:00',
    messages: [
      {
        id: 'tm_3',
        senderId: 'creator_elena',
        senderName: 'Elena Vance',
        senderRole: 'creator',
        message: 'Bonjour Treasury team, requesting confirmation on SEPA wire #payout_101 before Friday’s showroom booking.',
        timestamp: '2026-11-02 20:05'
      }
    ]
  },
  {
    id: 'tkt_503',
    userId: 'user_fan_1',
    userName: 'Jordan Cross',
    userUsername: 'jordancross',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    userRole: 'fan',
    category: 'subscription_issue',
    subject: 'Annual Tier Upgrade Proration Question',
    description: 'I am currently on Elena Vance Couture VIP Tier ($24.99/mo) and want to upgrade to Private Circle Patron ($69.99/mo).',
    priority: 'low',
    status: 'open',
    createdAt: '2026-11-03 07:15',
    updatedAt: '2026-11-03 07:15',
    messages: [
      {
        id: 'tm_4',
        senderId: 'user_fan_1',
        senderName: 'Jordan Cross',
        senderRole: 'user',
        message: 'If I switch tiers mid-cycle, does my Patron badge activate immediately?',
        timestamp: '2026-11-03 07:15'
      }
    ]
  },
  {
    id: 'tkt_504',
    userId: 'creator_maya',
    userName: 'Maya Lin',
    userUsername: 'mayalin_cine',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    userRole: 'creator',
    category: 'livestream_issue',
    subject: '4K ProRes Replay Transcoding Bitrate Optimization',
    description: 'Requesting higher bitrate profile (25 Mbps) for my anamorphic cinematography masterclass replays.',
    priority: 'medium',
    status: 'resolved',
    assignedAdminId: 'user_admin_2',
    assignedAdminName: 'Evelyn Cross',
    createdAt: '2026-10-30 14:00',
    updatedAt: '2026-10-31 11:30',
    messages: [
      {
        id: 'tm_5',
        senderId: 'creator_maya',
        senderName: 'Maya Lin',
        senderRole: 'creator',
        message: 'Can we enable 10-bit color preservation on my archived live recordings?',
        timestamp: '2026-10-30 14:00'
      },
      {
        id: 'tm_6',
        senderId: 'user_admin_2',
        senderName: 'Evelyn Cross',
        senderRole: 'admin',
        message: 'Enabled Cinema High-Bitrate profile on your creator studio account!',
        timestamp: '2026-10-31 11:30'
      }
    ]
  }
];

export const MOCK_AUDIT_LOGS: AdminAuditLog[] = [
  {
    id: 'audit_1001',
    adminId: 'user_admin_1',
    adminName: 'Julian Sterling',
    adminRole: 'super_admin',
    category: 'auth_security',
    action: 'Authenticated into Admin Control Center (Hardware Key 2FA)',
    targetType: 'Session',
    targetId: 'sess_99481',
    targetLabel: 'Julian Sterling (@acovon_superadmin)',
    details: 'IP 185.42.19.10 (Zurich, CH) · Role: Super Admin verified.',
    timestamp: '2026-11-03 10:00',
    severity: 'info'
  },
  {
    id: 'audit_1002',
    adminId: 'user_mod_1',
    adminName: 'Clara Vance',
    adminRole: 'moderator',
    category: 'user_account',
    action: 'Suspended User Account for Copyright Redistribution',
    targetType: 'User',
    targetId: 'fan_banned_1',
    targetLabel: 'Victor Kane (@vkane_ripper)',
    details: 'Enforced TOS §4.2 suspension following creator leak report #rep_2.',
    timestamp: '2026-11-01 18:30',
    severity: 'critical'
  },
  {
    id: 'audit_1003',
    adminId: 'user_admin_finance',
    adminName: 'Henrik Lindqvist',
    adminRole: 'finance_admin',
    category: 'payout_approval',
    action: 'Approved Creator Payout Request ($780.00)',
    targetType: 'Payout',
    targetId: 'payout_103',
    targetLabel: 'Alex Rivera (@alexrivera_dev)',
    details: 'Verified ledger balance and cleared ACH batch transfer.',
    timestamp: '2026-11-02 09:00',
    severity: 'info'
  },
  {
    id: 'audit_1004',
    adminId: 'user_admin_2',
    adminName: 'Evelyn Cross',
    adminRole: 'admin',
    category: 'creator_approval',
    action: 'Verified Creator Tier Pricing & Profile Compliance',
    targetType: 'Creator',
    targetId: 'creator_elena',
    targetLabel: 'Elena Vance (@elenavance)',
    details: 'Audited 3 subscription tiers ($9.99, $24.99, $69.99) and video call rates.',
    timestamp: '2026-11-02 14:15',
    severity: 'info'
  }
];

export const INITIAL_PLATFORM_CONFIG: PlatformConfig = {
  platformName: 'ACOVON',
  announcementBanner: 'ACOVON LIVE Official Recording & Replay Vault is now available for all verified creators.',
  announcementActive: true,
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
  featuredCreatorIds: ['creator_elena', 'creator_marcus', 'creator_leo', 'creator_maya'],
  featuredPostIds: ['demo_post_elena_1', 'demo_post_marcus_1'],
  contentCategories: [
    'Fashion & Luxury',
    'Music & Audio Production',
    'Fitness & Bodybuilding',
    'Digital Art & 3D Design',
    'Photography & Cinematography',
    'Gaming & Esports',
    'Education & Tutorials',
    'Culinary Arts & Gourmet',
    'Tech & Software Development',
    'Coaching & Business',
    'Dance & Choreography',
    'Animation & Motion Design',
    'Wellness & Meditation'
  ],
  videoCategories: [
    'Masterclass & Tutorials',
    'Behind The Scenes',
    '4K Editorial & Lookbooks',
    'Live Session Replays',
    'Custom Patron Commissions',
    'Short-Form Highlights'
  ],
  livestreamCategories: [
    'Fashion & Atelier',
    'Studio Production & Synth',
    'Cinematography & Color',
    'Esports & Pro Coaching',
    'Culinary Live Salon',
    'VIP Patron Q&A'
  ],
  notificationTemplates: {
    welcomeFan: 'Welcome to ACOVON! Explore verified creators, unlock exclusive masterclasses, and join live interactive broadcasts.',
    creatorApproved: 'Congratulations! Your ACOVON Creator identity verification has been approved. Creator Studio is now unlocked.',
    payoutCompleted: 'Your creator payout settlement has been processed and dispatched to your designated bank account.',
    policyWarning: 'Important Notice from ACOVON Trust & Safety: Please review our Community & Copyright Guidelines regarding your recent upload.'
  }
};

export const INITIAL_VIDEO_PROCESSING_CONFIG: VideoProcessingConfig = {
  enableAutoOptimization: true,
  acceptedFormats: ['MP4', 'MOV', 'M4V', 'WEBM', 'MKV'],
  maxUploadSizeMb: 4096, // 4 GB configurable max upload size
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

export const MOCK_VIDEO_MEDIA_RECORDS: VideoMediaRecord[] = [
  {
    id: 'vmedia_post_ppv_elena_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    sourceContext: 'ppv',
    contentHash: 'hash_elena_couture_4k_840s',
    originalFilename: 'Paris_Autumn_Couture_Private_Fitting_Master_4K.mov',
    originalStorageRef: 's3://acovon-vault-originals/creator_elena/vmedia_post_ppv_elena_1/source.mov',
    originalFileSize: 1551892480, // ~1.48 GB
    originalFormat: 'MOV',
    originalWidth: 3840,
    originalHeight: 2160,
    originalDuration: 840,
    originalFrameRate: 60,
    aspectRatio: '16:9',
    orientation: 'landscape',
    processingStatus: 'ready',
    optimizedStorageRefs: {
      '4K': 's3://acovon-cdn-optimized/vmedia_post_ppv_elena_1/2160p_av1.m3u8',
      '1440p': 's3://acovon-cdn-optimized/vmedia_post_ppv_elena_1/1440p_hevc.m3u8',
      '1080p': 's3://acovon-cdn-optimized/vmedia_post_ppv_elena_1/1080p_h264.m3u8',
      '720p': 's3://acovon-cdn-optimized/vmedia_post_ppv_elena_1/720p_h264.m3u8',
      '480p': 's3://acovon-cdn-optimized/vmedia_post_ppv_elena_1/480p_h264.m3u8',
      '360p': 's3://acovon-cdn-optimized/vmedia_post_ppv_elena_1/360p_h264.m3u8'
    },
    availableResolutions: ['4K', '1440p', '1080p', '720p', '480p', '360p'],
    availableCodecs: ['H.264', 'H.265/HEVC', 'AV1'],
    streamingProtocol: 'HLS',
    streamingManifestRef: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/master.m3u8',
    thumbnailRef: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    previewFrames: [
      '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80'
    ],
    feedPreviewRef: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    profilePreviewRef: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    optimizedFileSize: 589719142, // ~562 MB (62% reduction)
    compressionRatio: 0.62,
    storageSavedBytes: 962173338,
    vmafScore: 97.4,
    ssimScore: 0.991,
    psnrDb: 45.8,
    processingStartTime: '2026-11-03 05:10:00',
    processingCompletionTime: '2026-11-03 05:11:48',
    processingDurationMs: 108000,
    retentionStatus: 'retained_vault',
    retentionExpiresAt: '2026-12-03',
    accessVisibility: 'pay_per_view',
    reusedCount: 1,
    variants: [
      {
        id: 'var_elena_4k',
        mediaId: 'vmedia_post_ppv_elena_1',
        resolution: '4K',
        width: 3840,
        height: 2160,
        codec: 'AV1',
        bitrateKbps: 14800,
        fileSizeBytes: 248000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/2160p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts', 'seg_003.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_elena_1440p',
        mediaId: 'vmedia_post_ppv_elena_1',
        resolution: '1440p',
        width: 2560,
        height: 1440,
        codec: 'H.265/HEVC',
        bitrateKbps: 8900,
        fileSizeBytes: 142000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/1440p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts', 'seg_003.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_elena_1080p',
        mediaId: 'vmedia_post_ppv_elena_1',
        resolution: '1080p',
        width: 1920,
        height: 1080,
        codec: 'H.264',
        bitrateKbps: 5200,
        fileSizeBytes: 98000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/1080p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts', 'seg_003.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_elena_720p',
        mediaId: 'vmedia_post_ppv_elena_1',
        resolution: '720p',
        width: 1280,
        height: 720,
        codec: 'H.264',
        bitrateKbps: 2800,
        fileSizeBytes: 54000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/720p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_elena_480p',
        mediaId: 'vmedia_post_ppv_elena_1',
        resolution: '480p',
        width: 854,
        height: 480,
        codec: 'H.264',
        bitrateKbps: 1400,
        fileSizeBytes: 28000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/480p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_elena_360p',
        mediaId: 'vmedia_post_ppv_elena_1',
        resolution: '360p',
        width: 640,
        height: 360,
        codec: 'H.264',
        bitrateKbps: 850,
        fileSizeBytes: 19719142,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_ppv_elena_1/360p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      }
    ],
    createdAt: '2026-11-03 05:10:00',
    updatedAt: '2026-11-03 05:11:48'
  },
  {
    id: 'vmedia_post_marcus_free_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    sourceContext: 'post',
    contentHash: 'hash_marcus_analog_1080p_310s',
    originalFilename: 'Analog_Tape_Saturation_vs_Digital_DSP_1080p.mp4',
    originalStorageRef: 's3://acovon-vault-originals/creator_marcus/vmedia_post_marcus_free_1/source.mp4',
    originalFileSize: 428867584, // ~409 MB
    originalFormat: 'MP4',
    originalWidth: 1920,
    originalHeight: 1080,
    originalDuration: 310,
    originalFrameRate: 30,
    aspectRatio: '16:9',
    orientation: 'landscape',
    processingStatus: 'ready',
    optimizedStorageRefs: {
      '1080p': 's3://acovon-cdn-optimized/vmedia_post_marcus_free_1/1080p_hevc.m3u8',
      '720p': 's3://acovon-cdn-optimized/vmedia_post_marcus_free_1/720p_h264.m3u8',
      '480p': 's3://acovon-cdn-optimized/vmedia_post_marcus_free_1/480p_h264.m3u8',
      '360p': 's3://acovon-cdn-optimized/vmedia_post_marcus_free_1/360p_h264.m3u8'
    },
    availableResolutions: ['1080p', '720p', '480p', '360p'],
    availableCodecs: ['H.264', 'H.265/HEVC'],
    streamingProtocol: 'HLS',
    streamingManifestRef: 'https://cdn.acovon.media/hls/vmedia_post_marcus_free_1/master.m3u8',
    thumbnailRef: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    previewFrames: [
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80'
    ],
    feedPreviewRef: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
    profilePreviewRef: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80',
    optimizedFileSize: 154392330, // ~147 MB (64% reduction)
    compressionRatio: 0.64,
    storageSavedBytes: 274475254,
    vmafScore: 96.2,
    ssimScore: 0.989,
    psnrDb: 44.1,
    processingStartTime: '2026-11-03 02:14:00',
    processingCompletionTime: '2026-11-03 02:14:52',
    processingDurationMs: 52000,
    retentionStatus: 'retained_vault',
    retentionExpiresAt: '2026-12-03',
    accessVisibility: 'public',
    reusedCount: 2,
    variants: [
      {
        id: 'var_marcus_1080p',
        mediaId: 'vmedia_post_marcus_free_1',
        resolution: '1080p',
        width: 1920,
        height: 1080,
        codec: 'H.265/HEVC',
        bitrateKbps: 4600,
        fileSizeBytes: 79000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_marcus_free_1/1080p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_marcus_720p',
        mediaId: 'vmedia_post_marcus_free_1',
        resolution: '720p',
        width: 1280,
        height: 720,
        codec: 'H.264',
        bitrateKbps: 2600,
        fileSizeBytes: 42000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_marcus_free_1/720p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_marcus_480p',
        mediaId: 'vmedia_post_marcus_free_1',
        resolution: '480p',
        width: 854,
        height: 480,
        codec: 'H.264',
        bitrateKbps: 1300,
        fileSizeBytes: 21000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_marcus_free_1/480p.m3u8',
        segmentUrls: ['seg_001.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_marcus_360p',
        mediaId: 'vmedia_post_marcus_free_1',
        resolution: '360p',
        width: 640,
        height: 360,
        codec: 'H.264',
        bitrateKbps: 800,
        fileSizeBytes: 12392330,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_marcus_free_1/360p.m3u8',
        segmentUrls: ['seg_001.ts'],
        processingStatus: 'ready'
      }
    ],
    createdAt: '2026-11-03 02:14:00',
    updatedAt: '2026-11-03 02:14:52'
  },
  {
    id: 'vmedia_post_sarah_ppv_1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    sourceContext: 'ppv',
    contentHash: 'hash_sarah_mobility_1080p_2700s',
    originalFilename: 'Thoracic_Spine_Kinetic_Chain_Workshop_1080p.mp4',
    originalStorageRef: 's3://acovon-vault-originals/creator_sarah/vmedia_post_sarah_ppv_1/source.mp4',
    originalFileSize: 1946157056, // ~1.85 GB
    originalFormat: 'MP4',
    originalWidth: 1920,
    originalHeight: 1080,
    originalDuration: 2700,
    originalFrameRate: 60,
    aspectRatio: '16:9',
    orientation: 'landscape',
    processingStatus: 'ready',
    optimizedStorageRefs: {
      '1080p': 's3://acovon-cdn-optimized/vmedia_post_sarah_ppv_1/1080p_av1.m3u8',
      '720p': 's3://acovon-cdn-optimized/vmedia_post_sarah_ppv_1/720p_h264.m3u8',
      '480p': 's3://acovon-cdn-optimized/vmedia_post_sarah_ppv_1/480p_h264.m3u8',
      '360p': 's3://acovon-cdn-optimized/vmedia_post_sarah_ppv_1/360p_h264.m3u8'
    },
    availableResolutions: ['1080p', '720p', '480p', '360p'],
    availableCodecs: ['H.264', 'H.265/HEVC', 'AV1'],
    streamingProtocol: 'HLS',
    streamingManifestRef: 'https://cdn.acovon.media/hls/vmedia_post_sarah_ppv_1/master.m3u8',
    thumbnailRef: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    previewFrames: [
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
    ],
    feedPreviewRef: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    profilePreviewRef: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80',
    optimizedFileSize: 681154969, // ~649 MB (65% reduction)
    compressionRatio: 0.65,
    storageSavedBytes: 1265002087,
    vmafScore: 95.8,
    ssimScore: 0.986,
    psnrDb: 43.9,
    processingStartTime: '2026-11-01 14:20:00',
    processingCompletionTime: '2026-11-01 14:22:15',
    processingDurationMs: 135000,
    retentionStatus: 'scheduled_cleanup',
    retentionExpiresAt: '2026-12-01',
    accessVisibility: 'pay_per_view',
    variants: [
      {
        id: 'var_sarah_1080p',
        mediaId: 'vmedia_post_sarah_ppv_1',
        resolution: '1080p',
        width: 1920,
        height: 1080,
        codec: 'AV1',
        bitrateKbps: 4800,
        fileSizeBytes: 380000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_sarah_ppv_1/1080p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      },
      {
        id: 'var_sarah_720p',
        mediaId: 'vmedia_post_sarah_ppv_1',
        resolution: '720p',
        width: 1280,
        height: 720,
        codec: 'H.264',
        bitrateKbps: 2600,
        fileSizeBytes: 185000000,
        manifestUrl: 'https://cdn.acovon.media/hls/vmedia_post_sarah_ppv_1/720p.m3u8',
        segmentUrls: ['seg_001.ts', 'seg_002.ts'],
        processingStatus: 'ready'
      }
    ],
    createdAt: '2026-11-01 14:20:00',
    updatedAt: '2026-11-01 14:22:15'
  },
  {
    id: 'vmedia_status_elena_vertical',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    sourceContext: 'status',
    contentHash: 'hash_elena_status_vertical_9_16',
    originalFilename: 'Backstage_Runway_Vertical_Reel_1080x1920.mov',
    originalStorageRef: 's3://acovon-vault-originals/creator_elena/vmedia_status_elena_vertical/source.mov',
    originalFileSize: 89128960, // ~85 MB
    originalFormat: 'MOV',
    originalWidth: 1080,
    originalHeight: 1920,
    originalDuration: 15,
    originalFrameRate: 60,
    aspectRatio: '9:16',
    orientation: 'portrait',
    processingStatus: 'ready',
    optimizedStorageRefs: {
      '1080p': 's3://acovon-cdn-optimized/vmedia_status_elena_vertical/1080p_hevc.m3u8',
      '720p': 's3://acovon-cdn-optimized/vmedia_status_elena_vertical/720p_h264.m3u8',
      '480p': 's3://acovon-cdn-optimized/vmedia_status_elena_vertical/480p_h264.m3u8'
    },
    availableResolutions: ['1080p', '720p', '480p', '360p'],
    availableCodecs: ['H.264', 'H.265/HEVC'],
    streamingProtocol: 'HLS',
    streamingManifestRef: 'https://cdn.acovon.media/hls/vmedia_status_elena_vertical/master.m3u8',
    thumbnailRef: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    previewFrames: [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80'
    ],
    feedPreviewRef: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80',
    profilePreviewRef: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80',
    statusPreviewRef: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=400&q=80',
    optimizedFileSize: 28521267, // ~27.2 MB (68% reduction)
    compressionRatio: 0.68,
    storageSavedBytes: 60607693,
    vmafScore: 96.9,
    ssimScore: 0.990,
    psnrDb: 45.0,
    processingStartTime: '2026-11-03 06:00:00',
    processingCompletionTime: '2026-11-03 06:00:18',
    processingDurationMs: 18000,
    retentionStatus: 'retained_vault',
    retentionExpiresAt: '2026-12-03',
    accessVisibility: 'public',
    variants: [],
    createdAt: '2026-11-03 06:00:00',
    updatedAt: '2026-11-03 06:00:18'
  },
  {
    id: 'vmedia_failed_kai_mkv',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    sourceContext: 'studio_upload',
    contentHash: 'hash_kai_houdini_corrupt_header',
    originalFilename: 'Unreal_5_4_Procedural_City_Render_Raw_8K.mkv',
    originalStorageRef: 's3://acovon-vault-originals/creator_kai/vmedia_failed_kai_mkv/source.mkv',
    originalFileSize: 2845129728, // ~2.65 GB
    originalFormat: 'MKV',
    originalWidth: 3840,
    originalHeight: 2160,
    originalDuration: 620,
    originalFrameRate: 60,
    aspectRatio: '16:9',
    orientation: 'landscape',
    processingStatus: 'failed',
    optimizedStorageRefs: {},
    availableResolutions: [],
    availableCodecs: [],
    streamingProtocol: 'HLS',
    streamingManifestRef: '',
    thumbnailRef: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    previewFrames: [],
    feedPreviewRef: '',
    profilePreviewRef: '',
    optimizedFileSize: 0,
    compressionRatio: 0,
    storageSavedBytes: 0,
    vmafScore: 0,
    ssimScore: 0,
    psnrDb: 0,
    processingStartTime: '2026-11-03 06:40:00',
    processingError: 'FFmpeg Transcode Worker Timeout on Segment #042 (Transient GPU Worker Node Preemption). Original source preserved in vault; ready for retry.',
    retentionStatus: 'retained_vault',
    retentionExpiresAt: '2026-12-03',
    accessVisibility: 'subscribers',
    variants: [],
    createdAt: '2026-11-03 06:40:00',
    updatedAt: '2026-11-03 06:42:10'
  }
];

export const MOCK_VIDEO_PROCESSING_JOBS: VideoProcessingJob[] = [
  {
    id: 'vjob_1001',
    mediaId: 'vmedia_post_ppv_elena_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    originalFilename: 'Paris_Autumn_Couture_Private_Fitting_Master_4K.mov',
    sourceContext: 'ppv',
    jobStatus: 'completed',
    processingStage: 'Ready to Publish',
    progressPercentage: 100,
    retryCount: 0,
    maxRetries: 3,
    processingConfig: {
      targetPreset: 'visually_lossless',
      codecs: ['H.264', 'H.265/HEVC', 'AV1'],
      maxResolution: '4K',
      protocol: 'HLS'
    },
    originalFileSize: 1551892480,
    optimizedFileSize: 589719142,
    startedAt: '2026-11-03 05:10:00',
    completedAt: '2026-11-03 05:11:48'
  },
  {
    id: 'vjob_1002',
    mediaId: 'vmedia_post_marcus_free_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    originalFilename: 'Analog_Tape_Saturation_vs_Digital_DSP_1080p.mp4',
    sourceContext: 'post',
    jobStatus: 'completed',
    processingStage: 'Ready to Publish',
    progressPercentage: 100,
    retryCount: 0,
    maxRetries: 3,
    processingConfig: {
      targetPreset: 'visually_lossless',
      codecs: ['H.264', 'H.265/HEVC'],
      maxResolution: '1080p',
      protocol: 'HLS'
    },
    originalFileSize: 428867584,
    optimizedFileSize: 154392330,
    startedAt: '2026-11-03 02:14:00',
    completedAt: '2026-11-03 02:14:52'
  },
  {
    id: 'vjob_1003',
    mediaId: 'vmedia_post_sarah_ppv_1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    originalFilename: 'Thoracic_Spine_Kinetic_Chain_Workshop_1080p.mp4',
    sourceContext: 'ppv',
    jobStatus: 'completed',
    processingStage: 'Ready to Publish',
    progressPercentage: 100,
    retryCount: 0,
    maxRetries: 3,
    processingConfig: {
      targetPreset: 'visually_lossless',
      codecs: ['H.264', 'H.265/HEVC', 'AV1'],
      maxResolution: '1080p',
      protocol: 'HLS'
    },
    originalFileSize: 1946157056,
    optimizedFileSize: 681154969,
    startedAt: '2026-11-01 14:20:00',
    completedAt: '2026-11-01 14:22:15'
  },
  {
    id: 'vjob_1004',
    mediaId: 'vmedia_status_elena_vertical',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    originalFilename: 'Backstage_Runway_Vertical_Reel_1080x1920.mov',
    sourceContext: 'status',
    jobStatus: 'completed',
    processingStage: 'Ready to Publish',
    progressPercentage: 100,
    retryCount: 0,
    maxRetries: 3,
    processingConfig: {
      targetPreset: 'visually_lossless',
      codecs: ['H.264', 'H.265/HEVC'],
      maxResolution: '1080p',
      protocol: 'HLS'
    },
    originalFileSize: 89128960,
    optimizedFileSize: 28521267,
    startedAt: '2026-11-03 06:00:00',
    completedAt: '2026-11-03 06:00:18'
  },
  {
    id: 'vjob_1005',
    mediaId: 'vmedia_failed_kai_mkv',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    originalFilename: 'Unreal_5_4_Procedural_City_Render_Raw_8K.mkv',
    sourceContext: 'studio_upload',
    jobStatus: 'failed',
    processingStage: 'Failed',
    progressPercentage: 68,
    retryCount: 2,
    maxRetries: 3,
    processingConfig: {
      targetPreset: 'visually_lossless',
      codecs: ['H.264', 'H.265/HEVC', 'AV1'],
      maxResolution: '4K',
      protocol: 'HLS'
    },
    errorDetails: 'FFmpeg Transcode Worker Timeout on Segment #042 (Transient GPU Worker Node Preemption). Original source preserved in vault; ready for retry.',
    originalFileSize: 2845129728,
    startedAt: '2026-11-03 06:40:00'
  }
];

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
  updatedByAdmin: 'Julian Sterling (Super Admin)'
};

export const MOCK_CREATOR_VERIFICATION_RECORDS: CreatorVerificationRecord[] = [
  {
    id: 'cvrec_elena',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    status: 'verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1001',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'lifetime',
    purchaseDate: '2026-06-15 11:20:00',
    startDate: '2026-06-15 11:20:05',
    expirationDate: null,
    updatedAt: '2026-06-15 11:20:05'
  },
  {
    id: 'cvrec_marcus',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    status: 'verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1002',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'lifetime',
    purchaseDate: '2026-07-04 15:40:00',
    startDate: '2026-07-04 15:40:03',
    expirationDate: null,
    updatedAt: '2026-07-04 15:40:03'
  },
  {
    id: 'cvrec_sarah',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    status: 'verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge (Annual)',
    originalPaymentId: 'vtx_1003',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'annual',
    purchaseDate: '2025-08-19 09:12:00',
    startDate: '2025-08-19 09:12:04',
    expirationDate: '2027-08-19 09:12:04',
    lastRenewalDate: '2026-08-19 09:10:00',
    updatedAt: '2026-08-19 09:10:00'
  },
  {
    id: 'cvrec_kai',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    creatorUsername: 'kaizencgi',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    status: 'not_verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    amountPaid: 0,
    currency: 'USD',
    durationType: 'lifetime',
    expirationDate: null,
    updatedAt: '2026-10-01 12:00:00'
  },
  {
    id: 'cvrec_maya',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    status: 'verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1005',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'lifetime',
    purchaseDate: '2026-09-10 18:05:00',
    startDate: '2026-09-10 18:05:02',
    expirationDate: null,
    updatedAt: '2026-09-10 18:05:02'
  },
  {
    id: 'cvrec_leo',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    status: 'verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1006',
    amountPaid: 45.00,
    currency: 'EUR',
    durationType: 'lifetime',
    purchaseDate: '2026-10-02 14:30:00',
    startDate: '2026-10-02 14:30:04',
    expirationDate: null,
    updatedAt: '2026-10-02 14:30:04'
  },
  {
    id: 'cvrec_chloe',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    status: 'renewal_required',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge (Annual)',
    originalPaymentId: 'vtx_1007',
    amountPaid: 39.99,
    currency: 'USD',
    durationType: 'annual',
    purchaseDate: '2025-10-25 10:00:00',
    startDate: '2025-10-25 10:00:00',
    expirationDate: '2026-10-25 10:00:00',
    statusReason: 'Annual verification term reached expiration on 2026-10-25. Renewal required to reactivate blue badge.',
    updatedAt: '2026-10-25 10:00:01'
  },
  {
    id: 'cvrec_alex',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    status: 'verified',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1008',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'lifetime',
    purchaseDate: '2026-10-18 20:15:00',
    startDate: '2026-10-18 20:15:02',
    expirationDate: null,
    updatedAt: '2026-10-18 20:15:02'
  },
  {
    id: 'cvrec_zara',
    creatorId: 'creator_zara',
    creatorName: 'Zara Morales',
    creatorUsername: 'zaramorales_dance',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    status: 'payment_pending',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1009',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'lifetime',
    purchaseDate: '2026-11-03 07:30:00',
    statusReason: 'Awaiting Stripe SEPA / 3D Secure settlement webhook confirmation.',
    updatedAt: '2026-11-03 07:30:00'
  },
  {
    id: 'cvrec_david',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    creatorUsername: 'davidkalu_wellness',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    status: 'suspended',
    planId: 'vplan_official_blue_tick',
    planName: 'ACOVON Official Blue Verification Badge',
    originalPaymentId: 'vtx_1010',
    amountPaid: 49.99,
    currency: 'USD',
    durationType: 'lifetime',
    purchaseDate: '2026-09-01 11:00:00',
    startDate: '2026-09-01 11:00:05',
    suspendedDate: '2026-10-29 16:40:00',
    statusReason: 'Temporarily suspended pending display name consistency check after handle change.',
    updatedAt: '2026-10-29 16:40:00'
  }
];

export const MOCK_VERIFICATION_TRANSACTIONS: VerificationTransaction[] = [
  {
    id: 'vtx_1001',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    verificationRecordId: 'cvrec_elena',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3P9xK2AcovonVerif001',
    idempotencyKey: 'idem_verif_creator_elena_20260615',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-06-15 11:20:05',
    refundStatus: 'not_requested',
    createdAt: '2026-06-15 11:20:00'
  },
  {
    id: 'vtx_1002',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    verificationRecordId: 'cvrec_marcus',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'acovon_wallet',
    providerTransactionId: 'wal_verif_marcus_002',
    idempotencyKey: 'idem_verif_creator_marcus_20260704',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-07-04 15:40:03',
    refundStatus: 'not_requested',
    createdAt: '2026-07-04 15:40:00'
  },
  {
    id: 'vtx_1003',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_sarah',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge (Annual)',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3M8aL9AcovonVerif003',
    idempotencyKey: 'idem_verif_creator_sarah_20250819',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2025-08-19 09:12:04',
    refundStatus: 'not_requested',
    createdAt: '2025-08-19 09:12:00'
  },
  {
    id: 'vtx_1004',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_sarah',
    transactionType: 'renewal',
    planName: 'ACOVON Official Blue Verification Badge (Annual Renewal)',
    paymentProvider: 'acovon_wallet',
    providerTransactionId: 'wal_verif_sarah_renew_004',
    idempotencyKey: 'idem_verif_renew_creator_sarah_20260819',
    amount: 29.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-08-19 09:10:00',
    refundStatus: 'not_requested',
    createdAt: '2026-08-19 09:10:00'
  },
  {
    id: 'vtx_1005',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_maya',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'apple_pay',
    providerTransactionId: 'apay_992104AcovonVerif005',
    idempotencyKey: 'idem_verif_creator_maya_20260910',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-09-10 18:05:02',
    refundStatus: 'not_requested',
    createdAt: '2026-09-10 18:05:00'
  },
  {
    id: 'vtx_1006',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_leo',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3R4mP1AcovonVerif006',
    idempotencyKey: 'idem_verif_creator_leo_20261002',
    amount: 45.00,
    currency: 'EUR',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-10-02 14:30:04',
    refundStatus: 'not_requested',
    createdAt: '2026-10-02 14:30:00'
  },
  {
    id: 'vtx_1007',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_chloe',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge (Annual)',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3N1vQ8AcovonVerif007',
    idempotencyKey: 'idem_verif_creator_chloe_20251025',
    amount: 39.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2025-10-25 10:00:00',
    refundStatus: 'not_requested',
    createdAt: '2025-10-25 10:00:00'
  },
  {
    id: 'vtx_1008',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_alex',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'acovon_wallet',
    providerTransactionId: 'wal_verif_alex_008',
    idempotencyKey: 'idem_verif_creator_alex_20261018',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-10-18 20:15:02',
    refundStatus: 'not_requested',
    createdAt: '2026-10-18 20:15:00'
  },
  {
    id: 'vtx_1009',
    creatorId: 'creator_zara',
    creatorName: 'Zara Morales',
    creatorUsername: 'zaramorales_dance',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_zara',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3T7wR9AcovonPending009',
    idempotencyKey: 'idem_verif_creator_zara_20261103',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'pending',
    paymentTimestamp: '2026-11-03 07:30:00',
    refundStatus: 'not_requested',
    createdAt: '2026-11-03 07:30:00'
  },
  {
    id: 'vtx_1010',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    creatorUsername: 'davidkalu_wellness',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_david',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3Q2kL4AcovonVerif010',
    idempotencyKey: 'idem_verif_creator_david_20260901',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'completed',
    paymentTimestamp: '2026-09-01 11:00:05',
    refundStatus: 'not_requested',
    createdAt: '2026-09-01 11:00:00'
  },
  {
    id: 'vtx_1011',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    creatorUsername: 'kaizencgi',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    verificationRecordId: 'cvrec_kai',
    transactionType: 'initial',
    planName: 'ACOVON Official Blue Verification Badge',
    paymentProvider: 'stripe_checkout',
    providerTransactionId: 'pi_3S9bF2AcovonFailed011',
    idempotencyKey: 'idem_verif_creator_kai_failed_20261012',
    amount: 49.99,
    currency: 'USD',
    paymentStatus: 'failed',
    paymentTimestamp: '2026-10-12 19:22:10',
    refundStatus: 'not_requested',
    createdAt: '2026-10-12 19:22:00'
  }
];

export const MOCK_VERIFICATION_AUDIT_LOGS: VerificationAuditLog[] = [
  {
    id: 'vaudit_1',
    adminId: 'user_admin_1',
    adminName: 'Julian Sterling',
    adminRole: 'super_admin',
    action: 'Configured Paid Creator Verification Plan & Pricing ($49.99 USD Lifetime)',
    previousStatus: '45.00 USD',
    newStatus: '49.99 USD',
    reason: 'Standardized Q4 creator verification pricing while preserving historical transaction amounts.',
    timestamp: '2026-10-05 09:00:00'
  },
  {
    id: 'vaudit_2',
    adminId: 'user_admin_2',
    adminName: 'Evelyn Cross',
    adminRole: 'admin',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    action: 'Suspended Creator Blue Verification Badge',
    previousStatus: 'verified',
    newStatus: 'suspended',
    reason: 'Temporarily suspended pending display name consistency check after handle change.',
    timestamp: '2026-10-29 16:40:00'
  },
  {
    id: 'vaudit_3',
    adminId: 'system_billing',
    adminName: 'ACOVON Billing Engine',
    adminRole: 'system',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    action: 'Automatic Expiration & Renewal Required Transition',
    previousStatus: 'verified',
    newStatus: 'renewal_required',
    reason: 'Annual verification period expired on 2026-10-25. Sent renewal notification to creator.',
    timestamp: '2026-10-25 10:00:01'
  }
];

// ============================================================================
// PERSONALIZED RECOMMENDATION, DISCOVERY & SMART FEED INITIAL DATA
// ============================================================================

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
  updatedByAdmin: 'Julian Sterling (Super Admin)',
  configAuditHistory: [
    {
      id: 'raudit_1',
      adminName: 'Julian Sterling',
      adminRole: 'super_admin',
      summary: 'Initialized ACOVON-SmartRank v4.2.0 with 25/20/20/15/10/5/5 multi-signal weighting and strict Free Posts access filtering.',
      timestamp: '2026-11-01 09:00:00'
    },
    {
      id: 'raudit_2',
      adminName: 'Evelyn Cross',
      adminRole: 'admin',
      summary: 'Enabled fast interest-shift time-decay (1.65x recent session weight) and capped consecutive same-creator feed placement to 1.',
      timestamp: '2026-11-03 08:15:00'
    }
  ]
};

export const INITIAL_FAN_INTEREST_PROFILES: Record<string, FanInterestProfile> = {
  user_fan_1: {
    id: 'fprof_jordan',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    fanUsername: 'jordancross',
    personaCode: 'custom',
    personaLabel: 'Jordan Cross (Active Patron Profile)',
    personaDescription: 'Subscribed to Elena Vance, follows Marcus Thorne & Sarah Chen. Strong engagement in Fashion & Luxury, Music & Audio Production, and Fitness & Bodybuilding.',
    categoryScores: {
      'Fashion & Luxury': 92,
      'Music & Audio Production': 78,
      'Fitness & Bodybuilding': 68,
      'Photography & Cinematography': 54,
      'Digital Art & 3D Design': 42,
      'Tech & Software Development': 35,
      'Culinary Arts & Gourmet': 30,
      'Dance & Choreography': 26,
      'Wellness & Meditation': 24,
      'Gaming & Esports': 18
    },
    recentCategoryScores: {
      'Fashion & Luxury': 38,
      'Music & Audio Production': 32,
      'Fitness & Bodybuilding': 28,
      'Photography & Cinematography': 18
    },
    longTermCategoryScores: {
      'Fashion & Luxury': 54,
      'Music & Audio Production': 46,
      'Fitness & Bodybuilding': 40,
      'Photography & Cinematography': 36
    },
    hashtagScores: {
      HauteCouture: 34,
      SoundDesign: 28,
      Biomechanics: 24,
      AtelierLive: 22,
      AnalogMastering: 19,
      AnamorphicCinematography: 16
    },
    creatorAffinityScores: {
      creator_elena: 95,
      creator_marcus: 82,
      creator_sarah: 74,
      creator_maya: 58,
      creator_kai: 44
    },
    formatPreferences: {
      video: 65,
      photo: 52,
      gallery: 48,
      livestream: 40
    },
    preferredVideoDuration: 'medium',
    avgCompletionRate: 84,
    avgWatchTimeSeconds: 265,
    skippedCategories: {},
    reducedCategories: [],
    boostedCategories: ['Fashion & Luxury', 'Music & Audio Production'],
    hiddenCreatorIds: [],
    notInterestedPostIds: [],
    reportedPostIds: [],
    showMorePostIds: ['post_clip_elena_highlight', 'post_marcus_free_1'],
    onboardingCategories: ['Fashion & Luxury', 'Music & Audio Production', 'Fitness & Bodybuilding'],
    isColdStart: false,
    totalEventsProcessed: 42,
    lastUpdatedAt: '2026-11-03 08:20:00'
  },

  // Test Persona 1: Fan A — Fitness & Conditioning Enthusiast
  fan_a: {
    id: 'fprof_fan_a',
    fanId: 'fan_a',
    fanName: 'Fan A (Marcus Vance — Fitness Patron)',
    fanUsername: 'fana_fitness',
    personaCode: 'fan_a',
    personaLabel: 'Fan A — Fitness & Conditioning Specialist',
    personaDescription: 'Watches and completes Fitness & Bodybuilding videos, likes biomechanics photos, and follows fitness creators.',
    categoryScores: {
      'Fitness & Bodybuilding': 98,
      'Wellness & Meditation': 64,
      'Culinary Arts & Gourmet': 42,
      'Dance & Choreography': 36,
      'Tech & Software Development': 18,
      'Fashion & Luxury': 15
    },
    recentCategoryScores: {
      'Fitness & Bodybuilding': 52,
      'Wellness & Meditation': 26
    },
    longTermCategoryScores: {
      'Fitness & Bodybuilding': 46,
      'Wellness & Meditation': 38
    },
    hashtagScores: {
      Biomechanics: 42,
      MobilityDrills: 38,
      SquatMechanics: 35,
      AthleticPerformance: 31,
      OverheadMobility: 29,
      SoundBath: 18
    },
    creatorAffinityScores: {
      creator_sarah: 96,
      creator_david: 68,
      creator_zara: 35
    },
    formatPreferences: {
      video: 85,
      photo: 55,
      gallery: 50,
      livestream: 30
    },
    preferredVideoDuration: 'medium',
    avgCompletionRate: 91,
    avgWatchTimeSeconds: 340,
    skippedCategories: { 'Gaming & Esports': 3 },
    reducedCategories: [],
    boostedCategories: ['Fitness & Bodybuilding'],
    hiddenCreatorIds: [],
    notInterestedPostIds: [],
    reportedPostIds: [],
    showMorePostIds: ['post_sarah_public_v1', 'post_sarah_followers_free_1'],
    onboardingCategories: ['Fitness & Bodybuilding', 'Wellness & Meditation'],
    isColdStart: false,
    totalEventsProcessed: 36,
    lastUpdatedAt: '2026-11-03 08:10:00'
  },

  // Test Persona 2: Fan B — Travel, Cinematography & Photography Enthusiast
  fan_b: {
    id: 'fprof_fan_b',
    fanId: 'fan_b',
    fanName: 'Fan B (Clara Moreau — Travel & Photography)',
    fanUsername: 'fanb_visuals',
    personaCode: 'fan_b',
    personaLabel: 'Fan B — Travel & Cinematography Enthusiast',
    personaDescription: 'Heavily engages with Photography & Cinematography, location scouting galleries, and Digital Art & 3D Design.',
    categoryScores: {
      'Photography & Cinematography': 97,
      'Digital Art & 3D Design': 76,
      'Fashion & Luxury': 58,
      'Music & Audio Production': 34,
      'Fitness & Bodybuilding': 14
    },
    recentCategoryScores: {
      'Photography & Cinematography': 54,
      'Digital Art & 3D Design': 32
    },
    longTermCategoryScores: {
      'Photography & Cinematography': 43,
      'Digital Art & 3D Design': 44,
      'Fashion & Luxury': 38
    },
    hashtagScores: {
      AnamorphicCinematography: 44,
      TravelPhotography: 40,
      LocationScouting: 38,
      LeicaM11: 35,
      OctaneRender: 28,
      LomoAnamorphic: 26
    },
    creatorAffinityScores: {
      creator_maya: 96,
      creator_kai: 80,
      creator_elena: 62
    },
    formatPreferences: {
      video: 60,
      photo: 90,
      gallery: 92,
      livestream: 25
    },
    preferredVideoDuration: 'long',
    avgCompletionRate: 88,
    avgWatchTimeSeconds: 410,
    skippedCategories: {},
    reducedCategories: [],
    boostedCategories: ['Photography & Cinematography', 'Digital Art & 3D Design'],
    hiddenCreatorIds: [],
    notInterestedPostIds: [],
    reportedPostIds: [],
    showMorePostIds: ['post_maya_public_v1', 'post_maya_followers_free_1'],
    onboardingCategories: ['Photography & Cinematography', 'Digital Art & 3D Design'],
    isColdStart: false,
    totalEventsProcessed: 31,
    lastUpdatedAt: '2026-11-03 08:12:00'
  },

  // Test Persona 3: Fan C — Specific Creator Superfan (Marcus Thorne & Related Audio/Tech)
  fan_c: {
    id: 'fprof_fan_c',
    fanId: 'fan_c',
    fanName: 'Fan C (Liam O’Connor — Creator Affinity Fan)',
    fanUsername: 'fanc_audiophile',
    personaCode: 'fan_c',
    personaLabel: 'Fan C — Creator Superfan (Marcus Thorne)',
    personaDescription: 'Frequently opens, watches, replays, saves, and tips Marcus Thorne and similar audio/creative technology creators.',
    categoryScores: {
      'Music & Audio Production': 99,
      'Tech & Software Development': 62,
      'Digital Art & 3D Design': 54,
      'Photography & Cinematography': 38
    },
    recentCategoryScores: {
      'Music & Audio Production': 60,
      'Tech & Software Development': 28
    },
    longTermCategoryScores: {
      'Music & Audio Production': 39,
      'Tech & Software Development': 34
    },
    hashtagScores: {
      SoundDesign: 48,
      AnalogMastering: 45,
      Prophet5: 38,
      ModularSynth: 36,
      AbletonLive: 32
    },
    creatorAffinityScores: {
      creator_marcus: 99,
      creator_alex: 68,
      creator_kai: 60
    },
    formatPreferences: {
      video: 88,
      photo: 40,
      gallery: 35,
      livestream: 75
    },
    preferredVideoDuration: 'long',
    avgCompletionRate: 94,
    avgWatchTimeSeconds: 390,
    skippedCategories: {},
    reducedCategories: [],
    boostedCategories: ['Music & Audio Production'],
    hiddenCreatorIds: [],
    notInterestedPostIds: [],
    reportedPostIds: [],
    showMorePostIds: ['post_marcus_free_1', 'post_marcus_jam_video'],
    onboardingCategories: ['Music & Audio Production'],
    isColdStart: false,
    totalEventsProcessed: 45,
    lastUpdatedAt: '2026-11-03 08:14:00'
  },

  // Test Persona 4: Fan D — Shifting Interest (Formerly Cooking -> Now Tech & Software)
  fan_d: {
    id: 'fprof_fan_d',
    fanId: 'fan_d',
    fanName: 'Fan D (Noah Takahashi — Interest Shift)',
    fanUsername: 'fand_techshift',
    personaCode: 'fan_d',
    personaLabel: 'Fan D — Shifting Interest (Culinary → Tech)',
    personaDescription: 'Previously watched Culinary Arts & Gourmet last month, but recently shifted strongly to Tech & Software Development and Digital Art.',
    categoryScores: {
      'Tech & Software Development': 94,
      'Digital Art & 3D Design': 72,
      'Culinary Arts & Gourmet': 48,
      'Gaming & Esports': 40
    },
    recentCategoryScores: {
      'Tech & Software Development': 68,
      'Digital Art & 3D Design': 42,
      'Culinary Arts & Gourmet': 6
    },
    longTermCategoryScores: {
      'Culinary Arts & Gourmet': 62,
      'Tech & Software Development': 26,
      'Digital Art & 3D Design': 30
    },
    hashtagScores: {
      RustLang: 46,
      LinuxKernel: 42,
      eBPF: 39,
      DistributedSystems: 36,
      HoudiniFX: 28,
      FrenchPastry: 18
    },
    creatorAffinityScores: {
      creator_alex: 95,
      creator_kai: 74,
      creator_chloe: 42
    },
    formatPreferences: {
      video: 82,
      photo: 48,
      gallery: 45,
      livestream: 50
    },
    preferredVideoDuration: 'long',
    avgCompletionRate: 89,
    avgWatchTimeSeconds: 520,
    skippedCategories: {},
    reducedCategories: [],
    boostedCategories: ['Tech & Software Development'],
    hiddenCreatorIds: [],
    notInterestedPostIds: [],
    reportedPostIds: [],
    showMorePostIds: ['post_alex_public_v1', 'post_alex_public_v2'],
    onboardingCategories: ['Culinary Arts & Gourmet', 'Tech & Software Development'],
    isColdStart: false,
    totalEventsProcessed: 39,
    lastUpdatedAt: '2026-11-03 08:16:00'
  },

  // Test Persona 5: Fan E — Category Skipper & Negative Signal Filtering
  fan_e: {
    id: 'fprof_fan_e',
    fanId: 'fan_e',
    fanName: 'Fan E (Amara Patel — Negative Signal Filter)',
    fanUsername: 'fane_curated',
    personaCode: 'fan_e',
    personaLabel: 'Fan E — Category Skipper (Wellness & Culinary)',
    personaDescription: 'Repeatedly skipped Gaming & Esports and Dance & Choreography (<2s), reducing their rank while prioritizing Wellness & Culinary.',
    categoryScores: {
      'Wellness & Meditation': 93,
      'Culinary Arts & Gourmet': 86,
      'Fashion & Luxury': 60,
      'Gaming & Esports': -28,
      'Dance & Choreography': -18
    },
    recentCategoryScores: {
      'Wellness & Meditation': 52,
      'Culinary Arts & Gourmet': 46,
      'Gaming & Esports': -24,
      'Dance & Choreography': -16
    },
    longTermCategoryScores: {
      'Wellness & Meditation': 41,
      'Culinary Arts & Gourmet': 40
    },
    hashtagScores: {
      SoundBath: 40,
      VagusNerve: 38,
      CroissantLamination: 35,
      ChocolateTempering: 33
    },
    creatorAffinityScores: {
      creator_david: 92,
      creator_chloe: 88,
      creator_elena: 58,
      creator_leo: -25
    },
    formatPreferences: {
      video: 70,
      photo: 68,
      gallery: 65,
      livestream: 45
    },
    preferredVideoDuration: 'medium',
    avgCompletionRate: 82,
    avgWatchTimeSeconds: 290,
    skippedCategories: {
      'Gaming & Esports': 7,
      'Dance & Choreography': 5
    },
    reducedCategories: ['Gaming & Esports', 'Dance & Choreography'],
    boostedCategories: ['Wellness & Meditation', 'Culinary Arts & Gourmet'],
    hiddenCreatorIds: [],
    notInterestedPostIds: ['post_leo_public_v1', 'post_leo_reaction_clip'],
    reportedPostIds: [],
    showMorePostIds: ['post_david_public_v1', 'post_chloe_public_v1'],
    onboardingCategories: ['Wellness & Meditation', 'Culinary Arts & Gourmet'],
    isColdStart: false,
    totalEventsProcessed: 29,
    lastUpdatedAt: '2026-11-03 08:18:00'
  },

  // Test Persona 6: Fan F — Brand New Cold-Start Fan
  fan_f: {
    id: 'fprof_fan_f',
    fanId: 'fan_f',
    fanName: 'Fan F (New Account — Cold Start)',
    fanUsername: 'fanf_newbie',
    personaCode: 'fan_f',
    personaLabel: 'Fan F — New Cold-Start Fan (0 Prior Events)',
    personaDescription: 'New fan account with no prior engagement history. Receives high-performing trending discovery content and immediately adapts on first interaction.',
    categoryScores: {},
    recentCategoryScores: {},
    longTermCategoryScores: {},
    hashtagScores: {},
    creatorAffinityScores: {},
    formatPreferences: {
      video: 50,
      photo: 50,
      gallery: 50,
      livestream: 50
    },
    preferredVideoDuration: 'balanced',
    avgCompletionRate: 0,
    avgWatchTimeSeconds: 0,
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
    lastUpdatedAt: '2026-11-03 08:20:00'
  }
};

export const INITIAL_ENGAGEMENT_EVENTS: FanEngagementEvent[] = [
  {
    id: 'evt_1001',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    contentId: 'post_clip_elena_highlight',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    eventType: 'video_completed',
    contentType: 'video',
    category: 'Fashion & Luxury',
    hashtags: ['Highlight', 'HauteCouture'],
    watchDurationSeconds: 30,
    videoDurationSeconds: 30,
    completionPercentage: 100,
    scoreDelta: 6,
    sourceSurface: 'for_you',
    sessionId: 'sess_init_1',
    timestamp: '2026-11-03 08:05:12',
    ageHours: 1
  },
  {
    id: 'evt_1002',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    contentId: 'post_marcus_free_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    eventType: 'video_replayed',
    contentType: 'video',
    category: 'Music & Audio Production',
    hashtags: ['SoundDesign', 'AnalogMastering'],
    watchDurationSeconds: 310,
    videoDurationSeconds: 310,
    completionPercentage: 100,
    scoreDelta: 8,
    sourceSurface: 'free_posts',
    sessionId: 'sess_init_1',
    timestamp: '2026-11-03 07:50:40',
    ageHours: 1.5
  },
  {
    id: 'evt_1003',
    fanId: 'fan_a',
    fanName: 'Fan A (Marcus Vance — Fitness Patron)',
    contentId: 'post_sarah_public_v1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    eventType: 'video_completed',
    contentType: 'video',
    category: 'Fitness & Bodybuilding',
    hashtags: ['MobilityDrills', 'SquatMechanics'],
    watchDurationSeconds: 420,
    videoDurationSeconds: 420,
    completionPercentage: 100,
    scoreDelta: 6,
    sourceSurface: 'for_you',
    sessionId: 'sess_init_2',
    timestamp: '2026-11-03 07:42:10',
    ageHours: 2
  },
  {
    id: 'evt_1004',
    fanId: 'fan_a',
    fanName: 'Fan A (Marcus Vance — Fitness Patron)',
    contentId: 'post_sarah_followers_free_1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    eventType: 'video_saved',
    contentType: 'video',
    category: 'Fitness & Bodybuilding',
    hashtags: ['OverheadMobility', 'StrengthTraining'],
    watchDurationSeconds: 680,
    videoDurationSeconds: 720,
    completionPercentage: 94,
    scoreDelta: 7,
    sourceSurface: 'free_posts',
    sessionId: 'sess_init_2',
    timestamp: '2026-11-03 07:35:00',
    ageHours: 2.2
  },
  {
    id: 'evt_1005',
    fanId: 'fan_b',
    fanName: 'Fan B (Clara Moreau — Travel & Photography)',
    contentId: 'post_maya_followers_free_1',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    eventType: 'gallery_browsed',
    contentType: 'gallery',
    category: 'Photography & Cinematography',
    hashtags: ['LocationScouting', 'TravelPhotography'],
    scoreDelta: 6,
    sourceSurface: 'free_posts',
    sessionId: 'sess_init_3',
    timestamp: '2026-11-03 07:20:18',
    ageHours: 2.5
  },
  {
    id: 'evt_1006',
    fanId: 'fan_c',
    fanName: 'Fan C (Liam O’Connor — Creator Affinity Fan)',
    contentId: 'post_marcus_free_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    eventType: 'creator_subscribed',
    contentType: 'creator',
    category: 'Music & Audio Production',
    hashtags: ['SoundDesign'],
    scoreDelta: 10,
    sourceSurface: 'for_you',
    sessionId: 'sess_init_4',
    timestamp: '2026-11-03 06:55:00',
    ageHours: 3
  },
  {
    id: 'evt_1007',
    fanId: 'fan_d',
    fanName: 'Fan D (Noah Takahashi — Interest Shift)',
    contentId: 'post_alex_public_v2',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    eventType: 'video_completed',
    contentType: 'video',
    category: 'Tech & Software Development',
    hashtags: ['LinuxKernel', 'eBPF', 'RustLang'],
    watchDurationSeconds: 960,
    videoDurationSeconds: 960,
    completionPercentage: 100,
    scoreDelta: 6,
    sourceSurface: 'for_you',
    sessionId: 'sess_init_5',
    timestamp: '2026-11-03 06:30:00',
    ageHours: 3.5
  },
  {
    id: 'evt_1008',
    fanId: 'fan_e',
    fanName: 'Fan E (Amara Patel — Negative Signal Filter)',
    contentId: 'post_leo_public_v1',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    eventType: 'video_skipped',
    contentType: 'video',
    category: 'Gaming & Esports',
    hashtags: ['AimMechanics', 'FPSPro'],
    watchDurationSeconds: 1.4,
    videoDurationSeconds: 910,
    completionPercentage: 0.15,
    timeBeforeSkipSeconds: 1.4,
    scoreDelta: -4,
    sourceSurface: 'for_you',
    sessionId: 'sess_init_6',
    timestamp: '2026-11-03 06:10:00',
    ageHours: 4
  }
];

export const INITIAL_RECOMMENDATION_FEEDBACK: RecommendationFeedbackRecord[] = [
  {
    id: 'rfb_101',
    fanId: 'fan_e',
    fanName: 'Fan E (Amara Patel — Negative Signal Filter)',
    postId: 'post_leo_reaction_clip',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    feedbackType: 'not_interested',
    category: 'Gaming & Esports',
    tags: ['ReactionTime', 'ProFPS'],
    reasonDetails: 'Fan selected Not Interested on Gaming & Esports clip',
    timestamp: '2026-11-03 06:12:00'
  },
  {
    id: 'rfb_102',
    fanId: 'user_fan_1',
    fanName: 'Jordan Cross',
    postId: 'post_clip_elena_highlight',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    feedbackType: 'show_more',
    category: 'Fashion & Luxury',
    tags: ['HauteCouture', 'AtelierLive'],
    reasonDetails: 'Fan requested more Haute Couture & Atelier behind-the-scenes videos',
    timestamp: '2026-11-03 08:06:00'
  }
];

export const INITIAL_PLATFORM_ANNOUNCEMENTS: PlatformAnnouncement[] = [
  {
    id: 'ann_everyone_1',
    title: 'Mandatory Security & Wallet Protection Update: Enhanced Transaction Verification',
    summary: 'Important security and wallet protection enhancements are now active across all ACOVON fan and creator accounts.',
    bodyHtml: `<p>To protect our community of patrons and creators, <strong>ACOVON Security Operations</strong> has deployed upgraded cryptographic session verification and real-time wallet protection across the platform.</p><h4>Key Security Enhancements</h4><ul><li><strong>Instant Ledger Protection:</strong> Every wallet top-up, pay-per-view unlock, custom video escrow, and creator payout is protected by idempotent transaction verification.</li><li><strong>Role-Isolated Access Controls:</strong> Strict account-level isolation ensures private communications, creator earnings, and patron libraries remain protected at all times.</li><li><strong>Updated Policy Terms:</strong> Please review and acknowledge this notice to confirm your account security settings remain up to date.</li></ul><p>If you notice any unrecognized account activity, contact <a href="/support">ACOVON Concierge Support</a> immediately.</p>`,
    category: 'Security Notice',
    priority: 'urgent',
    audience: 'everyone',
    status: 'published',
    displayFormats: ['announcement_center', 'dashboard_banner', 'important_popup', 'persistent_notice'],
    requiresAcknowledgment: true,
    isMandatoryNotice: true,
    imageUrl: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80',
    imageFileName: 'acovon_security_shield_banner.webp',
    imageFileSizeKb: 284,
    cta: {
      enabled: true,
      label: 'Review Security & Privacy Settings',
      destinationUrl: 'privacy',
      openMode: 'internal'
    },
    notificationMode: 'in_app_and_email',
    notificationSentAt: '2026-11-02 14:00:00',
    timezone: 'UTC',
    publishAt: '2026-11-02 14:00:00',
    publishedAt: '2026-11-02 14:00:00',
    expiresAt: '2026-12-31 23:59:00',
    createdByAdminId: 'user_admin_1',
    createdByAdminName: 'Julian Sterling',
    createdByAdminRole: 'super_admin',
    updatedByAdminId: 'user_admin_1',
    updatedByAdminName: 'Julian Sterling',
    updatedByAdminRole: 'super_admin',
    createdAt: '2026-11-02 13:45:00',
    updatedAt: '2026-11-02 14:00:00',
    versionCount: 1,
    versionHistory: []
  },
  {
    id: 'ann_fans_1',
    title: 'New Smart Discovery Feed & Instant Replay Access for Fans',
    summary: 'Exclusively for ACOVON Fans: Experience personalized For You discovery, Free Posts filter, and on-demand livestream replays.',
    bodyHtml: `<p>Welcome to the upgraded <strong>ACOVON Fan Experience</strong>. We have rolled out major enhancements designed exclusively for patrons and collectors:</p><ul><li><strong>Personalized "For You" &amp; "Free Posts" Feeds:</strong> Discover creators tailored to your exact creative interests—from Haute Couture and Analog Audio to Culinary Arts and Cinematography.</li><li><strong>Official Livestream Replays:</strong> Missed a live broadcast? You can now unlock or watch official HD creator livestream recordings on demand.</li><li><strong>Seamless Picture-in-Picture &amp; Adaptive Video:</strong> Enjoy instant playback startup and zero buffering across mobile and desktop.</li></ul>`,
    category: 'Fan Update',
    priority: 'important',
    audience: 'fans_only',
    status: 'published',
    displayFormats: ['announcement_center', 'dashboard_banner'],
    requiresAcknowledgment: false,
    isMandatoryNotice: false,
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1000&q=80',
    imageFileName: 'fan_smart_discovery_experience.webp',
    imageFileSizeKb: 312,
    cta: {
      enabled: true,
      label: 'Explore Creators Now',
      destinationUrl: 'explore',
      openMode: 'internal'
    },
    notificationMode: 'in_app_only',
    notificationSentAt: '2026-11-03 08:00:00',
    timezone: 'UTC',
    publishAt: '2026-11-03 08:00:00',
    publishedAt: '2026-11-03 08:00:00',
    expiresAt: '2026-12-15 23:59:00',
    createdByAdminId: 'user_admin_2',
    createdByAdminName: 'Evelyn Cross',
    createdByAdminRole: 'admin',
    updatedByAdminId: 'user_admin_2',
    updatedByAdminName: 'Evelyn Cross',
    updatedByAdminRole: 'admin',
    createdAt: '2026-11-03 07:30:00',
    updatedAt: '2026-11-03 08:00:00',
    versionCount: 1,
    versionHistory: []
  },
  {
    id: 'ann_creators_1',
    title: 'Creator Studio 4.5: Automatic Blue Verification Badge, Paid Live Replays & ABR Video Engine',
    summary: 'Exclusively for Creators: Activate your official ACOVON Blue Verification Badge, monetize livestream replays, and enjoy automatic video optimization.',
    bodyHtml: `<p>Attention <strong>ACOVON Creators</strong>: Your Creator Studio has been upgraded with three flagship monetization and media capabilities:</p><ol><li><strong>Instant Paid Blue Verification Badge:</strong> Activate your official ACOVON Blue Tick directly from <em>Creator Studio → Get Verified</em> with zero document re-uploads or manual review delays.</li><li><strong>Monetized Livestream Recordings &amp; Replays:</strong> Choose between Disabled, Free Replay, or Paid Replay ($4.99–$199.99) before going live and earn continuous replay royalties.</li><li><strong>Automatic Video Compression &amp; ABR Streaming:</strong> Upload raw 4K/1080p masters and let ACOVON automatically transcode multi-resolution HLS ladders with up to 65% storage savings.</li></ol><p>Please acknowledge this creator operational update to dismiss the persistent studio banner.</p>`,
    category: 'Creator Update',
    priority: 'important',
    audience: 'creators_only',
    status: 'published',
    displayFormats: ['announcement_center', 'dashboard_banner', 'persistent_notice'],
    requiresAcknowledgment: true,
    isMandatoryNotice: false,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1000&q=80',
    imageFileName: 'creator_studio_upgrade_4_5.webp',
    imageFileSizeKb: 340,
    cta: {
      enabled: true,
      label: 'Open Creator Studio',
      destinationUrl: 'creator-studio',
      openMode: 'internal'
    },
    notificationMode: 'in_app_and_email',
    notificationSentAt: '2026-11-03 07:00:00',
    timezone: 'UTC',
    publishAt: '2026-11-03 07:00:00',
    publishedAt: '2026-11-03 07:00:00',
    expiresAt: '2026-12-20 23:59:00',
    createdByAdminId: 'user_admin_1',
    createdByAdminName: 'Julian Sterling',
    createdByAdminRole: 'super_admin',
    updatedByAdminId: 'user_admin_2',
    updatedByAdminName: 'Evelyn Cross',
    updatedByAdminRole: 'admin',
    createdAt: '2026-11-02 18:00:00',
    updatedAt: '2026-11-03 07:15:00',
    versionCount: 2,
    versionHistory: [
      {
        id: 'avh_101',
        announcementId: 'ann_creators_1',
        versionNumber: 1,
        editedAt: '2026-11-03 07:15:00',
        editedByAdminId: 'user_admin_2',
        editedByAdminName: 'Evelyn Cross',
        editedByAdminRole: 'admin',
        changeSummary: 'Added ABR Video Compression details and updated CTA destination to Creator Studio.',
        snapshotTitle: 'Creator Studio 4.5: Automatic Blue Verification Badge & Paid Live Replays',
        snapshotAudience: 'creators_only',
        snapshotPriority: 'important'
      }
    ]
  },
  {
    id: 'ann_creators_payout_2',
    title: 'November Creator Treasury Settlement & Instant SEPA / Wire Windows',
    summary: 'Creator Finance Notice: Review November settlement cutoffs and accelerated 24-hour payout clearance for verified creators.',
    bodyHtml: `<p><strong>ACOVON Treasury &amp; Finance Notice for Creators:</strong></p><p>All creator payout requests submitted before 18:00 UTC on business days are now processed through our accelerated settlement rail. Verified creators with an active Blue Badge receive priority queue placement.</p><ul><li>Minimum withdrawal threshold remains <strong>$50.00 USD</strong>.</li><li>Standard platform commission structures remain unchanged (80% net creator share on subscriptions, PPV, and replays; 85% on tips).</li></ul>`,
    category: 'Payment Update',
    priority: 'normal',
    audience: 'creators_only',
    status: 'published',
    displayFormats: ['announcement_center'],
    requiresAcknowledgment: false,
    isMandatoryNotice: false,
    cta: {
      enabled: true,
      label: 'View Creator Earnings & Wallet',
      destinationUrl: 'wallet',
      openMode: 'internal'
    },
    notificationMode: 'in_app_only',
    notificationSentAt: '2026-11-01 12:00:00',
    timezone: 'UTC',
    publishAt: '2026-11-01 12:00:00',
    publishedAt: '2026-11-01 12:00:00',
    expiresAt: '2026-11-30 23:59:00',
    createdByAdminId: 'user_admin_finance',
    createdByAdminName: 'Henrik Lindqvist',
    createdByAdminRole: 'finance_admin',
    updatedByAdminId: 'user_admin_finance',
    updatedByAdminName: 'Henrik Lindqvist',
    updatedByAdminRole: 'finance_admin',
    createdAt: '2026-11-01 11:30:00',
    updatedAt: '2026-11-01 12:00:00',
    versionCount: 1,
    versionHistory: []
  },
  {
    id: 'ann_fans_promo_2',
    title: 'Autumn Collectors Week: Exclusive Live Sessions & Custom Video Commissions',
    summary: 'Fans Only: Book custom 1-on-1 personalized video requests and join exclusive November studio livestreams.',
    bodyHtml: `<p>Celebrate <strong>Autumn Collectors Week</strong> on ACOVON! Top creators across Fashion, Music Production, Fitness, and Culinary Arts have opened limited slots for personalized custom video commissions and VIP live broadcasts.</p><p>Visit any creator profile or the Live Hub to reserve your spot.</p>`,
    category: 'Promotion',
    priority: 'normal',
    audience: 'fans_only',
    status: 'published',
    displayFormats: ['announcement_center'],
    requiresAcknowledgment: false,
    isMandatoryNotice: false,
    cta: {
      enabled: true,
      label: 'Browse Live Broadcasts',
      destinationUrl: 'live',
      openMode: 'internal'
    },
    notificationMode: 'in_app_only',
    notificationSentAt: '2026-11-01 09:00:00',
    timezone: 'UTC',
    publishAt: '2026-11-01 09:00:00',
    publishedAt: '2026-11-01 09:00:00',
    expiresAt: '2026-11-25 23:59:00',
    createdByAdminId: 'user_admin_2',
    createdByAdminName: 'Evelyn Cross',
    createdByAdminRole: 'admin',
    updatedByAdminId: 'user_admin_2',
    updatedByAdminName: 'Evelyn Cross',
    updatedByAdminRole: 'admin',
    createdAt: '2026-11-01 08:45:00',
    updatedAt: '2026-11-01 09:00:00',
    versionCount: 1,
    versionHistory: []
  },
  {
    id: 'ann_scheduled_1',
    title: 'Scheduled Global Edge CDN Upgrade — Zero-Downtime Media Optimization',
    summary: 'Scheduled maintenance notice: Edge media nodes will be upgraded on November 15 at 03:00 UTC with zero expected downtime.',
    bodyHtml: `<p>Our infrastructure engineering team will perform a scheduled upgrade to our global HLS/DASH edge streaming nodes on <strong>November 15, 2026 from 03:00 to 04:30 UTC</strong>.</p><p>All live broadcasts, video uploads, and fan playback will automatically route through redundant edge clusters without interruption.</p>`,
    category: 'Maintenance',
    priority: 'important',
    audience: 'everyone',
    status: 'scheduled',
    displayFormats: ['announcement_center', 'dashboard_banner'],
    requiresAcknowledgment: false,
    isMandatoryNotice: false,
    cta: {
      enabled: false,
      label: '',
      destinationUrl: '',
      openMode: 'internal'
    },
    notificationMode: 'in_app_only',
    timezone: 'UTC',
    publishAt: '2026-11-14 08:00:00',
    expiresAt: '2026-11-16 00:00:00',
    createdByAdminId: 'user_admin_1',
    createdByAdminName: 'Julian Sterling',
    createdByAdminRole: 'super_admin',
    updatedByAdminId: 'user_admin_1',
    updatedByAdminName: 'Julian Sterling',
    updatedByAdminRole: 'super_admin',
    createdAt: '2026-11-03 06:00:00',
    updatedAt: '2026-11-03 06:00:00',
    versionCount: 1,
    versionHistory: []
  },
  {
    id: 'ann_draft_1',
    title: 'Winter Creator Summit & Annual VIP Tier Rebate Program (Draft)',
    summary: 'Draft announcement for creators regarding the upcoming Winter Creator Summit and annual subscription retention incentives.',
    bodyHtml: `<p>We are finalizing details for the <strong>ACOVON Winter Creator Summit</strong>. Approved creators will be invited to an exclusive virtual keynote covering multi-tier retention strategies and high-ticket custom video workflows.</p>`,
    category: 'New Feature',
    priority: 'normal',
    audience: 'creators_only',
    status: 'draft',
    displayFormats: ['announcement_center', 'dashboard_banner'],
    requiresAcknowledgment: false,
    isMandatoryNotice: false,
    cta: {
      enabled: true,
      label: 'Open Creator Studio',
      destinationUrl: 'creator-studio',
      openMode: 'internal'
    },
    notificationMode: 'in_app_only',
    timezone: 'UTC',
    createdByAdminId: 'user_admin_2',
    createdByAdminName: 'Evelyn Cross',
    createdByAdminRole: 'admin',
    updatedByAdminId: 'user_admin_2',
    updatedByAdminName: 'Evelyn Cross',
    updatedByAdminRole: 'admin',
    createdAt: '2026-11-03 08:30:00',
    updatedAt: '2026-11-03 08:30:00',
    versionCount: 1,
    versionHistory: []
  },
  {
    id: 'ann_expired_1',
    title: 'October Low-Latency WebRTC Video Call Audio Patch Completed',
    summary: 'Completed maintenance: 1-on-1 video call audio bitrate has been upgraded to 128kbps stereo.',
    bodyHtml: `<p>The October WebRTC audio enhancement patch has been completed across all regions. Creators and fans now enjoy studio-grade stereo audio during 1-on-1 video calls.</p>`,
    category: 'General Update',
    priority: 'normal',
    audience: 'everyone',
    status: 'expired',
    displayFormats: ['announcement_center'],
    requiresAcknowledgment: false,
    isMandatoryNotice: false,
    cta: {
      enabled: false,
      label: '',
      destinationUrl: '',
      openMode: 'internal'
    },
    notificationMode: 'silent_display',
    notificationSentAt: '2026-10-15 10:00:00',
    timezone: 'UTC',
    publishAt: '2026-10-15 10:00:00',
    publishedAt: '2026-10-15 10:00:00',
    expiresAt: '2026-10-31 23:59:00',
    createdByAdminId: 'user_admin_1',
    createdByAdminName: 'Julian Sterling',
    createdByAdminRole: 'super_admin',
    updatedByAdminId: 'user_admin_1',
    updatedByAdminName: 'Julian Sterling',
    updatedByAdminRole: 'super_admin',
    createdAt: '2026-10-15 09:30:00',
    updatedAt: '2026-10-31 23:59:00',
    versionCount: 1,
    versionHistory: []
  }
];

export const INITIAL_ANNOUNCEMENT_RECIPIENTS: AnnouncementRecipientRecord[] = [
  // ann_everyone_1 (Everyone: Active Fans + Active Creators)
  {
    id: 'arec_ev1_fan1',
    announcementId: 'ann_everyone_1',
    userId: 'user_fan_1',
    userName: 'Jordan Cross',
    userUsername: 'jordancross',
    userRole: 'fan',
    audienceEligibility: 'everyone',
    deliveredAt: '2026-11-02 14:00:05',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_ev1_fansofia',
    announcementId: 'ann_everyone_1',
    userId: 'fan_sofia',
    userName: 'Sofia Ricci',
    userUsername: 'sofiaricci',
    userRole: 'fan',
    audienceEligibility: 'everyone',
    deliveredAt: '2026-11-02 14:00:05',
    readAt: '2026-11-02 16:10:00',
    acknowledgedAt: '2026-11-02 16:11:12',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_ev1_fanalex',
    announcementId: 'ann_everyone_1',
    userId: 'fan_alex',
    userName: 'Alex Mercer',
    userUsername: 'alexmercer',
    userRole: 'fan',
    audienceEligibility: 'everyone',
    deliveredAt: '2026-11-02 14:00:05',
    readAt: '2026-11-02 19:05:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_ev1_elena',
    announcementId: 'ann_everyone_1',
    userId: 'creator_elena',
    userName: 'Elena Vance',
    userUsername: 'elenavance',
    userRole: 'creator',
    audienceEligibility: 'everyone',
    deliveredAt: '2026-11-02 14:00:06',
    readAt: '2026-11-02 15:20:00',
    acknowledgedAt: '2026-11-02 15:21:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_ev1_marcus',
    announcementId: 'ann_everyone_1',
    userId: 'creator_marcus',
    userName: 'Marcus Thorne',
    userUsername: 'marcusthorne',
    userRole: 'creator',
    audienceEligibility: 'everyone',
    deliveredAt: '2026-11-02 14:00:06',
    readAt: '2026-11-02 17:40:00',
    acknowledgedAt: '2026-11-02 17:41:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_ev1_sarah',
    announcementId: 'ann_everyone_1',
    userId: 'creator_sarah',
    userName: 'Sarah Chen',
    userUsername: 'sarahchen_fit',
    userRole: 'creator',
    audienceEligibility: 'everyone',
    deliveredAt: '2026-11-02 14:00:06',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  // ann_fans_1 (Fans Only)
  {
    id: 'arec_fn1_fan1',
    announcementId: 'ann_fans_1',
    userId: 'user_fan_1',
    userName: 'Jordan Cross',
    userUsername: 'jordancross',
    userRole: 'fan',
    audienceEligibility: 'fans_only',
    deliveredAt: '2026-11-03 08:00:02',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app'
  },
  {
    id: 'arec_fn1_fansofia',
    announcementId: 'ann_fans_1',
    userId: 'fan_sofia',
    userName: 'Sofia Ricci',
    userUsername: 'sofiaricci',
    userRole: 'fan',
    audienceEligibility: 'fans_only',
    deliveredAt: '2026-11-03 08:00:02',
    readAt: '2026-11-03 08:25:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app'
  },
  {
    id: 'arec_fn1_fanalex',
    announcementId: 'ann_fans_1',
    userId: 'fan_alex',
    userName: 'Alex Mercer',
    userUsername: 'alexmercer',
    userRole: 'fan',
    audienceEligibility: 'fans_only',
    deliveredAt: '2026-11-03 08:00:02',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app'
  },
  // ann_creators_1 (Creators Only)
  {
    id: 'arec_cr1_elena',
    announcementId: 'ann_creators_1',
    userId: 'creator_elena',
    userName: 'Elena Vance',
    userUsername: 'elenavance',
    userRole: 'creator',
    audienceEligibility: 'creators_only',
    deliveredAt: '2026-11-03 07:00:03',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_cr1_marcus',
    announcementId: 'ann_creators_1',
    userId: 'creator_marcus',
    userName: 'Marcus Thorne',
    userUsername: 'marcusthorne',
    userRole: 'creator',
    audienceEligibility: 'creators_only',
    deliveredAt: '2026-11-03 07:00:03',
    readAt: '2026-11-03 07:45:00',
    acknowledgedAt: '2026-11-03 07:46:10',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_cr1_sarah',
    announcementId: 'ann_creators_1',
    userId: 'creator_sarah',
    userName: 'Sarah Chen',
    userUsername: 'sarahchen_fit',
    userRole: 'creator',
    audienceEligibility: 'creators_only',
    deliveredAt: '2026-11-03 07:00:03',
    readAt: '2026-11-03 08:10:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app_and_email'
  },
  {
    id: 'arec_cr1_alex',
    announcementId: 'ann_creators_1',
    userId: 'creator_alex',
    userName: 'Alex Rivera',
    userUsername: 'alexrivera_dev',
    userRole: 'creator',
    audienceEligibility: 'creators_only',
    deliveredAt: '2026-11-03 07:00:04',
    notificationStatus: 'failed',
    notificationChannel: 'in_app_and_email',
    errorDetails: 'SMTP relay timeout for secondary creator notification webhook; eligible for retry.'
  },
  // ann_creators_payout_2 (Creators Only)
  {
    id: 'arec_cr2_elena',
    announcementId: 'ann_creators_payout_2',
    userId: 'creator_elena',
    userName: 'Elena Vance',
    userUsername: 'elenavance',
    userRole: 'creator',
    audienceEligibility: 'creators_only',
    deliveredAt: '2026-11-01 12:00:02',
    readAt: '2026-11-01 14:20:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app'
  },
  {
    id: 'arec_cr2_marcus',
    announcementId: 'ann_creators_payout_2',
    userId: 'creator_marcus',
    userName: 'Marcus Thorne',
    userUsername: 'marcusthorne',
    userRole: 'creator',
    audienceEligibility: 'creators_only',
    deliveredAt: '2026-11-01 12:00:02',
    readAt: '2026-11-01 15:05:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app'
  },
  // ann_fans_promo_2 (Fans Only)
  {
    id: 'arec_fn2_fan1',
    announcementId: 'ann_fans_promo_2',
    userId: 'user_fan_1',
    userName: 'Jordan Cross',
    userUsername: 'jordancross',
    userRole: 'fan',
    audienceEligibility: 'fans_only',
    deliveredAt: '2026-11-01 09:00:02',
    readAt: '2026-11-01 11:15:00',
    notificationStatus: 'delivered',
    notificationChannel: 'in_app'
  }
];



