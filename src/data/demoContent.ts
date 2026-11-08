import { CreatorProfile, Post, Livestream, LiveChatMessage } from '../types';

export const DEMO_MEDIA_VIDEOS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyblazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4'
];

export const DEMO_POSTS: Post[] = [
  // 1. Elena Vance - PPV Video (Fashion & Luxury)
  {
    id: 'post_ppv_elena_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    content: 'EXCLUSIVE VAULT: Behind the velvet curtain of the Paris Autumn Couture collection. Watch the full 14-minute private fitting session and archive critique.',
    media: [
      {
        id: 'media_elena_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
        durationSeconds: 840
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 12.99,
    ppvPreviewDuration: 15,
    likesCount: 384,
    commentsCount: 42,
    isLiked: false,
    isPinned: true,
    createdAt: '2 hours ago',
    categories: ['Fashion & Luxury'],
    tags: ['CoutureArchive', 'PrivateFitting', 'ParisFashionWeek'],
    isDemo: true
  },

  // 2. Elena Vance - Highlight Video Clip (Public)
  {
    id: 'post_clip_elena_highlight',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    content: '🎬 Stream Highlight (0:30): "Flawless Silk Gazar Fold Technique"\nCaptured live from Paris Atelier Masterclass by @jordancross',
    media: [
      {
        id: 'media_clip_elena_1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
        durationSeconds: 30
      }
    ],
    visibility: 'public',
    isHighlight: true,
    highlightLabel: 'Highlight',
    clippedByUsername: 'jordancross',
    likesCount: 128,
    commentsCount: 14,
    isLiked: true,
    isPinned: false,
    createdAt: '25 minutes ago',
    categories: ['Fashion & Luxury'],
    tags: ['Highlight', 'Clip', 'AcovonLive', 'HauteCouture'],
    isDemo: true
  },

  // 3. Elena Vance - Editorial Photography Set (Subscribers)
  {
    id: 'post_elena_subs_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    content: 'Subscribers Exclusive: My confidential dossier of private luxury vintage jewelers in Milan and Zurich. Complete with insider contact emails and direct appointment codes.',
    media: [
      {
        id: 'media_elena_img_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_elena_img_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 228,
    commentsCount: 19,
    createdAt: '1 day ago',
    categories: ['Fashion & Luxury'],
    tags: ['MilanVintage', 'ExclusiveDossier', 'FineJewelry'],
    isDemo: true
  },

  // 4. Elena Vance - Public Photography
  {
    id: 'post_elena_photo_public',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    content: 'Morning architectural lines in the salon de couture. Testing contrasting weights of duchess satin with sculpted French wool.',
    media: [
      {
        id: 'media_elena_photo_3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'public',
    likesCount: 614,
    commentsCount: 52,
    createdAt: '3 days ago',
    categories: ['Fashion & Luxury'],
    tags: ['AtelierDiaries', 'HauteCouture', 'DesignProcess'],
    isDemo: true
  },

  // 5. Marcus Thorne - Public Playable Video (Music & Audio)
  {
    id: 'post_marcus_free_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    content: 'Analog tape saturation versus digital DSP clipping: how harmonic warmth completely changes your sub-bass footprint. Breakdown with real-time spectrum analysis.',
    media: [
      {
        id: 'media_marcus_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 310
      }
    ],
    visibility: 'public',
    likesCount: 512,
    commentsCount: 67,
    isLiked: true,
    createdAt: '5 hours ago',
    categories: ['Music & Audio Production'],
    tags: ['SoundDesign', 'AnalogMastering', 'AbletonLive'],
    isDemo: true
  },

  // 6. Marcus Thorne - PPV Masterclass Video
  {
    id: 'post_marcus_ppv_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    content: 'MASTERCLASS: Vintage Neve 1073 Preamp & SSL Bus Compressor master bus chain. Step-by-step routing for punchy, commercial-grade low end.',
    media: [
      {
        id: 'media_marcus_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 1840
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 14.99,
    ppvPreviewDuration: 15,
    likesCount: 420,
    commentsCount: 38,
    createdAt: '2 days ago',
    categories: ['Music & Audio Production'],
    tags: ['NevePreamp', 'AudioEngineering', 'StudioVault'],
    isDemo: true
  },

  // 7. Marcus Thorne - Subscribers Stems & Studio Photo
  {
    id: 'post_marcus_subs_photo',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    content: 'Subscribers: The Eurorack modular patch diagram for today’s bass sequence. Dual Make Noise Maths modulation with Mutable Instruments Rings resonator.',
    media: [
      {
        id: 'media_marcus_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 310,
    commentsCount: 22,
    createdAt: '4 days ago',
    categories: ['Music & Audio Production'],
    tags: ['Eurorack', 'ModularSynth', 'PatchNotes'],
    isDemo: true
  },

  // 8. Sarah Chen - PPV Workshop Video (Fitness & Bodybuilding)
  {
    id: 'post_sarah_ppv_1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    content: 'FULL WORKSHOP: The 45-minute Thoracic Spine Decompression & Kinetic Chain Masterclass. Eliminate chronic postural fatigue and unlock immediate rotational power.',
    media: [
      {
        id: 'media_sarah_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 2700
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 9.99,
    ppvPreviewDuration: 10,
    likesCount: 184,
    commentsCount: 28,
    createdAt: '2 days ago',
    categories: ['Fitness & Bodybuilding'],
    tags: ['Biomechanics', 'ThoracicMobility', 'Masterclass'],
    isDemo: true
  },

  // 9. Sarah Chen - Public Playable Conditioning Video
  {
    id: 'post_sarah_public_v1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    content: 'Daily Hip Capsule Floss routine before heavy squat sessions. 3 kinetic cues that immediately resolve anterior hip pinch.',
    media: [
      {
        id: 'media_sarah_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 420
      }
    ],
    visibility: 'public',
    likesCount: 780,
    commentsCount: 94,
    createdAt: '1 day ago',
    categories: ['Fitness & Bodybuilding'],
    tags: ['MobilityDrills', 'SquatMechanics', 'AthleticPerformance'],
    isDemo: true
  },

  // 10. Sarah Chen - High-Res Form Photography Set
  {
    id: 'post_sarah_photo_subs',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    content: 'Subscribers Guide: Visual breakdown of bar path velocity and hip hinge angle across conventional vs Romanian deadlift variations.',
    media: [
      {
        id: 'media_sarah_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_sarah_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 390,
    commentsCount: 31,
    createdAt: '3 days ago',
    categories: ['Fitness & Bodybuilding'],
    tags: ['FormCheck', 'Biomechanics', 'DeadliftCues'],
    isDemo: true
  },

  // 11. Kai Zen - Public Playable 3D VFX Video
  {
    id: 'post_kai_public_1',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    creatorUsername: 'kaizencgi',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    content: 'Generating organic crystal crystalline growth patterns in Houdini with VEX and Solaris. Full viewport render test running at 60fps in Unreal Engine 5.4.',
    media: [
      {
        id: 'media_kai_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 734
      }
    ],
    visibility: 'public',
    likesCount: 942,
    commentsCount: 88,
    createdAt: '3 days ago',
    categories: ['Digital Art & 3D Design'],
    tags: ['HoudiniFX', 'UnrealEngine5', 'ProceduralCGI'],
    isDemo: true
  },

  // 12. Kai Zen - PPV Shader Breakdown Video
  {
    id: 'post_kai_ppv_1',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    creatorUsername: 'kaizencgi',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    content: 'VAULT ACCESS: Quantum Caustics HLSL Shader breakdown in Unreal Engine. Real-time refractive liquid simulation with zero performance tax.',
    media: [
      {
        id: 'media_kai_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 1200
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 19.99,
    ppvPreviewDuration: 15,
    likesCount: 520,
    commentsCount: 46,
    createdAt: '4 days ago',
    categories: ['Digital Art & 3D Design'],
    tags: ['HLSLShader', 'UnrealEngine5', 'RealTimeVFX'],
    isDemo: true
  },

  // 13. Kai Zen - High-Res 3D Render Gallery (Followers)
  {
    id: 'post_kai_render_gallery',
    creatorId: 'creator_kai',
    creatorName: 'Kai Zen',
    creatorUsername: 'kaizencgi',
    creatorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    content: 'Followers Exclusive: 8K Octane render stills from the Neo-Tokyo procedural cityscape test. Check the volumetric neon dispersion.',
    media: [
      {
        id: 'media_kai_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_kai_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'followers',
    likesCount: 812,
    commentsCount: 71,
    createdAt: '5 days ago',
    categories: ['Digital Art & 3D Design'],
    tags: ['OctaneRender', 'CyberpunkArt', 'ProceduralDesign'],
    isDemo: true
  },

  // 14. Maya Lin - Public Playable Cinematography Video
  {
    id: 'post_maya_public_v1',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    content: 'Lighting with negative fill and diffused tungsten: shooting high-contrast cinematic portraiture on 65mm anamorphic glass.',
    media: [
      {
        id: 'media_maya_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 580
      }
    ],
    visibility: 'public',
    likesCount: 640,
    commentsCount: 53,
    createdAt: '6 hours ago',
    categories: ['Photography & Cinematography'],
    tags: ['AnamorphicCinematography', 'LightingDiagrams', 'FilmLook'],
    isDemo: true
  },

  // 15. Maya Lin - PPV Color Grading Masterclass Video
  {
    id: 'post_maya_ppv_1',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    content: 'COMPLETE WORKSHOP: Emulating Kodak 5219 500T 35mm film print characteristics in DaVinci Resolve Studio with custom subtractive color density.',
    media: [
      {
        id: 'media_maya_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 2100
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 15.00,
    ppvPreviewDuration: 15,
    likesCount: 395,
    commentsCount: 34,
    createdAt: '1 day ago',
    categories: ['Photography & Cinematography'],
    tags: ['ColorGrading', 'DaVinciResolve', 'KodakEmulation'],
    isDemo: true
  },

  // 16. Maya Lin - Professional Photography Gallery (Subscribers)
  {
    id: 'post_maya_photo_subs',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    content: 'Subscribers Only: Full cinematic frame grabs from our golden hour shoot along the Pacific coastline. Lens: Cooke Anamorphic /i Full Frame Plus.',
    media: [
      {
        id: 'media_maya_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_maya_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 480,
    commentsCount: 42,
    createdAt: '3 days ago',
    categories: ['Photography & Cinematography'],
    tags: ['AnamorphicFrames', 'CookeLenses', 'CinematographyGallery'],
    isDemo: true
  },

  // 17. Leo Sterling - Public Playable Esports Coaching Video
  {
    id: 'post_leo_public_v1',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    content: 'Crosshair isolation technique: how pro players clear off-angles with zero micro-correction lag. 15-minute live training demonstration.',
    media: [
      {
        id: 'media_leo_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 910
      }
    ],
    visibility: 'public',
    likesCount: 1120,
    commentsCount: 145,
    createdAt: '8 hours ago',
    categories: ['Gaming & Esports'],
    tags: ['AimMechanics', 'EsportsCoaching', 'FPSPro'],
    isDemo: true
  },

  // 18. Leo Sterling - PPV Scrim Analysis Video
  {
    id: 'post_leo_ppv_1',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    content: 'GRAND FINALS TACTICAL VOD: Breakdown of our round 24 clutch defense. High-tier macro rotations, utility baiting, and trade frag timing.',
    media: [
      {
        id: 'media_leo_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyblazes.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyblazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 1540
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 8.99,
    ppvPreviewDuration: 15,
    likesCount: 670,
    commentsCount: 82,
    createdAt: '2 days ago',
    categories: ['Gaming & Esports'],
    tags: ['VODReview', 'TacticalFPS', 'EsportsPlaybook'],
    isDemo: true
  },

  // 19. Leo Sterling - Battlestation & Hardware Photography
  {
    id: 'post_leo_photo_battlestation',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    content: 'Current competitive setup: 540Hz OLED monitor, custom glass pad, 38g carbon fiber mouse at 1600 DPI, 0.17 in-game sens.',
    media: [
      {
        id: 'media_leo_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_leo_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'followers',
    likesCount: 940,
    commentsCount: 112,
    createdAt: '4 days ago',
    categories: ['Gaming & Esports'],
    tags: ['Battlestation', 'HardwareSetup', 'EsportsGear'],
    isDemo: true
  },

  // 20. Chloe Bennett - Public Playable Patisserie Video
  {
    id: 'post_chloe_public_v1',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    content: 'The mathematics of laminated viennoiserie: achieving 27 concentric butter layers for immaculate honeycomb croissant crumb.',
    media: [
      {
        id: 'media_chloe_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 640
      }
    ],
    visibility: 'public',
    likesCount: 880,
    commentsCount: 76,
    createdAt: '10 hours ago',
    categories: ['Culinary Arts & Gourmet'],
    tags: ['CroissantLamination', 'FrenchPastry', 'CulinaryScience'],
    isDemo: true
  },

  // 21. Chloe Bennett - PPV Masterclass Video
  {
    id: 'post_chloe_ppv_1',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    content: 'INTENSIVE MASTERCLASS: Modern Mirror Glaze & Multi-Layer Entremets. Precision fruit purees, valrhona chocolate mousse, and temperature-controlled pouring.',
    media: [
      {
        id: 'media_chloe_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WhatCarCanYouGetForAGrand.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 2400
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 12.00,
    ppvPreviewDuration: 15,
    likesCount: 430,
    commentsCount: 39,
    createdAt: '3 days ago',
    categories: ['Culinary Arts & Gourmet'],
    tags: ['MirrorGlaze', 'Entremet', 'ValrhonaChocolate'],
    isDemo: true
  },

  // 22. Chloe Bennett - Gourmet Plating Photography Set
  {
    id: 'post_chloe_photo_subs',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    content: 'Subscribers Recipe Drop: Deconstructed Meyer lemon tart with candied thyme blossom and burnt meringue quill. Formula sheet attached.',
    media: [
      {
        id: 'media_chloe_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_chloe_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 560,
    commentsCount: 48,
    createdAt: '5 days ago',
    categories: ['Culinary Arts & Gourmet'],
    tags: ['GourmetPlating', 'PatisserieArt', 'CulinaryDesign'],
    isDemo: true
  },

  // 23. Alex Rivera - Public Playable Systems Architecture Video
  {
    id: 'post_alex_public_v1',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    content: 'Building a lock-free ring buffer in Rust: cache line padding, memory orderings (Acquire-Release), and benchmarking under high contention.',
    media: [
      {
        id: 'media_alex_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 1120
      }
    ],
    visibility: 'public',
    likesCount: 980,
    commentsCount: 130,
    createdAt: '12 hours ago',
    categories: ['Tech & Software Development'],
    tags: ['RustLang', 'Concurrency', 'LowLatencySystems'],
    isDemo: true
  },

  // 24. Alex Rivera - PPV Distributed Systems Deep-Dive Video
  {
    id: 'post_alex_ppv_1',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    content: 'WHITE-BOARD ARCHITECTURE: Surviving Network Partitions with Raft consensus and Byzantine Fault Tolerant state machines. Full 90-minute lecture.',
    media: [
      {
        id: 'media_alex_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 5400
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 19.99,
    ppvPreviewDuration: 30,
    likesCount: 710,
    commentsCount: 64,
    createdAt: '3 days ago',
    categories: ['Tech & Software Development'],
    tags: ['DistributedSystems', 'RaftConsensus', 'SoftwareArchitecture'],
    isDemo: true
  },

  // 25. Alex Rivera - Code Workstation & System Architecture Diagrams
  {
    id: 'post_alex_photo_subs',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    content: 'Subscribers Digest: End-to-end telemetry flow diagram for processing 2.5 million events per second with sub-millisecond p99 latency.',
    media: [
      {
        id: 'media_alex_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_alex_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 620,
    commentsCount: 45,
    createdAt: '6 days ago',
    categories: ['Tech & Software Development'],
    tags: ['SystemDiagrams', 'HighThroughput', 'TelemetryEngine'],
    isDemo: true
  },

  // 26. Zara Morales - Public Playable Contemporary Dance Video
  {
    id: 'post_zara_public_v1',
    creatorId: 'creator_zara',
    creatorName: 'Zara Morales',
    creatorUsername: 'zaramorales_dance',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    content: 'Improvisation on counter-balance and gravitational momentum. Filmed in an abandoned textile mill in Barcelona.',
    media: [
      {
        id: 'media_zara_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 380
      }
    ],
    visibility: 'public',
    likesCount: 750,
    commentsCount: 68,
    createdAt: '1 day ago',
    categories: ['Dance & Choreography'],
    tags: ['ContemporaryBallet', 'MovementImprov', 'StageArt'],
    isDemo: true
  },

  // 27. Zara Morales - PPV Rehearsal Intensive Video
  {
    id: 'post_zara_ppv_1',
    creatorId: 'creator_zara',
    creatorName: 'Zara Morales',
    creatorUsername: 'zaramorales_dance',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    content: 'VAULT REHEARSAL: Full run-through of the international solo piece "Resonance & Ruin" with audio director commentary and choreography notes.',
    media: [
      {
        id: 'media_zara_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 1650
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 11.99,
    ppvPreviewDuration: 15,
    likesCount: 410,
    commentsCount: 31,
    createdAt: '4 days ago',
    categories: ['Dance & Choreography'],
    tags: ['SoloRehearsal', 'StageChoreography', 'BehindTheCurtain'],
    isDemo: true
  },

  // 28. Zara Morales - Stage Photography Gallery
  {
    id: 'post_zara_photo_gallery',
    creatorId: 'creator_zara',
    creatorName: 'Zara Morales',
    creatorUsername: 'zaramorales_dance',
    creatorAvatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80',
    content: 'High-speed shutter captures of our performance at the Palau de la Música. The intersection of shadow and extension.',
    media: [
      {
        id: 'media_zara_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_zara_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'followers',
    likesCount: 690,
    commentsCount: 54,
    createdAt: '5 days ago',
    categories: ['Dance & Choreography'],
    tags: ['StagePhotography', 'BarcelonaArt', 'MovementPhotography'],
    isDemo: true
  },

  // 29. David Kalu - Public Playable Meditation Video
  {
    id: 'post_david_public_v1',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    creatorUsername: 'davidkalu_wellness',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    content: '10-minute vagus nerve soothing sequence: physiological sighs combined with 432Hz crystal singing bowls. Ideal for afternoon decompression.',
    media: [
      {
        id: 'media_david_v1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 600
      }
    ],
    visibility: 'public',
    likesCount: 820,
    commentsCount: 89,
    createdAt: '18 hours ago',
    categories: ['Wellness & Meditation'],
    tags: ['SoundBath', 'VagusNerve', 'MindfulnessJourney'],
    isDemo: true
  },

  // 30. David Kalu - PPV Deep Resonance Session Video
  {
    id: 'post_david_ppv_1',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    creatorUsername: 'davidkalu_wellness',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    content: 'DEEP SLEEP SANCTUARY: 60-minute Tibetan bowl binaural immersion recorded live beneath Table Mountain during sunset.',
    media: [
      {
        id: 'media_david_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 3600
      }
    ],
    visibility: 'pay_per_view',
    ppvPrice: 9.99,
    ppvPreviewDuration: 15,
    likesCount: 510,
    commentsCount: 42,
    createdAt: '2 days ago',
    categories: ['Wellness & Meditation'],
    tags: ['SleepSanctuary', 'BinauralBeats', 'DeepRestoration'],
    isDemo: true
  },

  // 31. David Kalu - Serenity Photography Set
  {
    id: 'post_david_photo_subs',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    creatorUsername: 'davidkalu_wellness',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    content: 'Subscribers Serenity Journal: Dawn contemplation overlooking the Atlantic mist. Breathe in clarity, exhale tension.',
    media: [
      {
        id: 'media_david_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_david_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'subscribers',
    likesCount: 430,
    commentsCount: 37,
    createdAt: '5 days ago',
    categories: ['Wellness & Meditation'],
    tags: ['SerenityGallery', 'MindfulLiving', 'CapeTownDawn'],
    isDemo: true
  },

  // 32. Elena Vance - Additional High-Res Atelier Photo Set (Public)
  {
    id: 'post_elena_dresses_showcase',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    content: 'Silhouettes in motion: Hand-sewn silk organza layers caught under direct runway spot lighting.',
    media: [
      {
        id: 'media_elena_dress_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_elena_dress_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'public',
    likesCount: 910,
    commentsCount: 84,
    createdAt: '4 days ago',
    categories: ['Fashion & Luxury'],
    tags: ['RunwayShowcase', 'AtelierCraft', 'CoutureArt'],
    isDemo: true
  },

  // 33. Marcus Thorne - Playable Video: Synth Jam
  {
    id: 'post_marcus_jam_video',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    content: 'Midnight ambient session with the Prophet-5 and Space Echo tape delay. Pure analog drift without MIDI quantization.',
    media: [
      {
        id: 'media_marcus_jam',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 450
      }
    ],
    visibility: 'followers',
    likesCount: 670,
    commentsCount: 58,
    createdAt: '6 days ago',
    categories: ['Music & Audio Production'],
    tags: ['Prophet5', 'AmbientJam', 'AnalogTape'],
    isDemo: true
  },

  // 34. Sarah Chen - Athletic Mobility Video (Public)
  {
    id: 'post_sarah_ankles_mobility',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    content: 'Tibialis and ankle dorsiflexion loading: how 5 minutes of isometric knee-over-toe work eliminates patellar tendon irritation.',
    media: [
      {
        id: 'media_sarah_ankles',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 320
      }
    ],
    visibility: 'public',
    likesCount: 840,
    commentsCount: 66,
    createdAt: '5 days ago',
    categories: ['Fitness & Bodybuilding'],
    tags: ['KneeHealth', 'TendonAdaptation', 'AthleticDrills'],
    isDemo: true
  },

  // 35. Maya Lin - Raw Lens Flare Photography (Public)
  {
    id: 'post_maya_flares_photo',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    content: 'Uncoated front element test on vintage Lomo round-front anamorphics. Check the natural cyan streaks and horizontal flare character.',
    media: [
      {
        id: 'media_maya_flare_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'public',
    likesCount: 580,
    commentsCount: 39,
    createdAt: '4 days ago',
    categories: ['Photography & Cinematography'],
    tags: ['LomoAnamorphic', 'VintageGlass', 'Cinematography'],
    isDemo: true
  },

  // 36. Leo Sterling - Competitive Playable Clip Video
  {
    id: 'post_leo_reaction_clip',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    content: 'Sub-140ms reflex tracking: holding the narrow B-site pixel peek under smoke pressure.',
    media: [
      {
        id: 'media_leo_clip_video',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyblazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 45
      }
    ],
    visibility: 'public',
    likesCount: 1350,
    commentsCount: 160,
    createdAt: '2 days ago',
    categories: ['Gaming & Esports'],
    tags: ['ReactionTime', 'ClutchClip', 'ProFPS'],
    isDemo: true
  },

  // 37. Sarah Chen - Followers-Only Free Conditioning Guide (Fitness & Bodybuilding)
  {
    id: 'post_sarah_followers_free_1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    content: 'Followers Free Release: Complete 12-minute scapular upward rotation & overhead press warm-up sequence. Free for everyone following my athletics channel.',
    media: [
      {
        id: 'media_sarah_free_f1',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 720
      }
    ],
    visibility: 'followers',
    likesCount: 915,
    commentsCount: 84,
    createdAt: '4 hours ago',
    categories: ['Fitness & Bodybuilding'],
    tags: ['OverheadMobility', 'StrengthTraining', 'AthleticConditioning'],
    isDemo: true
  },

  // 38. Sarah Chen - Public Free Biomechanics Photo Breakdown (Fitness & Bodybuilding)
  {
    id: 'post_sarah_public_photo_1',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    content: 'Visual Force Vector Comparison: Front squat vs high-bar back squat knee torque and lumbar shear ratios.',
    media: [
      {
        id: 'media_sarah_pub_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_sarah_pub_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'public',
    likesCount: 645,
    commentsCount: 51,
    createdAt: '9 hours ago',
    categories: ['Fitness & Bodybuilding'],
    tags: ['SquatBiomechanics', 'ForceVectors', 'SportsScience'],
    isDemo: true
  },

  // 39. Maya Lin - Followers-Only Free Travel & Location Scouting Gallery (Photography & Cinematography)
  {
    id: 'post_maya_followers_free_1',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    content: 'Followers Free Gallery: Location scouting across Kyoto cedar temples and misty alpine passes with the Leica M11 & 35mm Summilux.',
    media: [
      {
        id: 'media_maya_f_p1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_maya_f_p2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'followers',
    likesCount: 830,
    commentsCount: 69,
    createdAt: '3 hours ago',
    categories: ['Photography & Cinematography'],
    tags: ['LocationScouting', 'TravelPhotography', 'LeicaM11', 'CinematicStills'],
    isDemo: true
  },

  // 40. Chloe Bennett - Public Free Chocolate Tempering Video (Culinary Arts & Gourmet)
  {
    id: 'post_chloe_public_v2',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    content: 'Silk-method cocoa butter crystallization: hitting exact Form V beta crystals at 31.8°C for mirror-snap dark chocolate shells.',
    media: [
      {
        id: 'media_chloe_pub_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 490
      }
    ],
    visibility: 'public',
    likesCount: 790,
    commentsCount: 63,
    createdAt: '7 hours ago',
    categories: ['Culinary Arts & Gourmet'],
    tags: ['ChocolateTempering', 'PatisserieTechnique', 'PastryChef'],
    isDemo: true
  },

  // 41. Alex Rivera - Public Free Zero-Copy Kernel Networking Video (Tech & Software Development)
  {
    id: 'post_alex_public_v2',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    content: 'io_uring & eBPF packet steering in Linux 6.11: bypassing kernel socket buffers for 100Gbps wire-speed telemetry ingestion.',
    media: [
      {
        id: 'media_alex_pub_v2',
        type: 'video',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
        durationSeconds: 960
      }
    ],
    visibility: 'public',
    likesCount: 1140,
    commentsCount: 142,
    createdAt: '3 hours ago',
    categories: ['Tech & Software Development'],
    tags: ['LinuxKernel', 'eBPF', 'SystemsEngineering', 'RustLang'],
    isDemo: true
  },

  // 42. Elena Vance - Followers-Only Free Paris Showroom Lookbook (Fashion & Luxury)
  {
    id: 'post_elena_followers_free_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    content: 'Followers Complimentary Lookbook: 4 backstage polaroids from the Place Vendôme eveningwear presentation. Free for all followers.',
    media: [
      {
        id: 'media_elena_f_free_1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: 'media_elena_f_free_2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
      }
    ],
    visibility: 'followers',
    likesCount: 925,
    commentsCount: 79,
    createdAt: '1 hour ago',
    categories: ['Fashion & Luxury'],
    tags: ['PlaceVendome', 'CoutureLookbook', 'RunwayBackstage'],
    isDemo: true
  }
];

export const DEMO_LIVESTREAMS: Livestream[] = [
  // 1. Elena Vance - Public Live
  {
    id: 'live_elena_public',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    title: 'Paris Atelier Masterclass: Live Haute Couture Draping & Silhouette Study',
    description: 'Broadcasting live from my Parisian design studio. Demonstrating silk gazar bias draping, archive runway tailoring, and answering audience questions.',
    coverImage: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    category: 'Fashion & Luxury',
    tags: ['AtelierLive', 'HauteCouture', 'ParisFashion'],
    accessMode: 'public',
    status: 'live',
    viewerCount: 1482,
    totalRevenue: 640.00,
    startedAt: '35 minutes ago',
    expectedDurationMinutes: 90,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 1.00,
      maxViewers: 5000
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'paid',
      price: 14.99,
      currency: 'USD',
      availabilityDays: 'unlimited',
      description: 'Full 4K server-recorded archive of the Paris Atelier Couture Draping masterclass with downloadable pattern measurement notes.',
      replayPermission: 'paid',
      includeReplayWithLiveTicket: false,
      participantConsentConfirmed: true
    },
    recordingStatus: 'recording',
    isReplayPublished: true,
    replayViewsCount: 0,
    replayPurchasesCount: 19,
    replayGrossRevenue: 284.81,
    replayPlatformFee: 56.96,
    replayNetRevenue: 227.85,
    purchasedReplayUserIds: [],
    activePoll: {
      id: 'poll_elena_drape',
      streamId: 'live_elena_public',
      creatorId: 'creator_elena',
      question: 'Which haute couture silhouette should Elena drape next on stream?',
      options: [
        { id: 'opt_1', text: 'Silk Organza Evening Gown', votes: 142 },
        { id: 'opt_2', text: 'Structured Velvet Corset', votes: 98 },
        { id: 'opt_3', text: 'Bias-Cut Liquid Satin Skirt', votes: 126 }
      ],
      totalVotes: 366,
      isActive: true,
      createdAt: '5 minutes ago',
      durationSeconds: 300,
      votedUserIds: {}
    }
  },

  // 2. Marcus Thorne - Subscribers Live (Free Recording Enabled for Subscribers)
  {
    id: 'live_marcus_subs',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    title: 'Subscribers Only: Unreleased Tape Stems & Modular Synthesizer Jam',
    description: 'Exclusive session for all active subscribers. Tracking live analog Moog arpeggios, routing through vintage Fairchild compression, and reviewing subscriber track submissions.',
    coverImage: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1600&q=80',
    category: 'Music & Audio Production',
    tags: ['SubscriberExclusive', 'AnalogStudio', 'ModularSynth'],
    accessMode: 'all_subscribers',
    status: 'live',
    viewerCount: 420,
    totalRevenue: 380.00,
    startedAt: '18 minutes ago',
    expectedDurationMinutes: 60,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: true,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'free',
      availabilityDays: 30,
      description: 'Complimentary replay for active subscribers for 30 days after the broadcast ends.',
      replayPermission: 'subscribers',
      participantConsentConfirmed: true
    },
    recordingStatus: 'recording',
    isReplayPublished: true,
    replayViewsCount: 0,
    replayPurchasesCount: 0,
    replayGrossRevenue: 0,
    replayPlatformFee: 0,
    replayNetRevenue: 0,
    purchasedReplayUserIds: []
  },

  // 3. Sarah Chen - PPV Live (Paid Recording Separate from Live Ticket)
  {
    id: 'live_sarah_ppv',
    creatorId: 'creator_sarah',
    creatorName: 'Sarah Chen',
    creatorUsername: 'sarahchenfit',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    title: 'Pay-Per-View Event: Kinetic Spinal Decompression & Rotational Power Workshop',
    description: 'Comprehensive 75-minute live clinical biomechanics intensive. Live admission ticket grants entry to the live broadcast; official replay archive available as an optional add-on.',
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1600&q=80',
    category: 'Fitness & Bodybuilding',
    tags: ['PPVLive', 'BiomechanicsIntensive', 'SpineHealth'],
    accessMode: 'pay_per_view',
    ppvTicketPrice: 14.99,
    status: 'live',
    viewerCount: 268,
    totalRevenue: 4017.32,
    startedAt: '40 minutes ago',
    expectedDurationMinutes: 75,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: ['user_fan_1'],
    recordingSettings: {
      mode: 'paid',
      price: 9.99,
      currency: 'USD',
      availabilityDays: 90,
      description: 'Official 1080p clinical workshop replay with chapter markers and mobility drill cues.',
      replayPermission: 'paid',
      includeReplayWithLiveTicket: false,
      participantConsentConfirmed: true
    },
    recordingStatus: 'recording',
    isReplayPublished: true,
    replayViewsCount: 0,
    replayPurchasesCount: 44,
    replayGrossRevenue: 439.56,
    replayPlatformFee: 87.91,
    replayNetRevenue: 351.65,
    purchasedReplayUserIds: []
  },

  // 4. Maya Lin - Cinematography Masterclass Live (Scheduled with Paid Replay Configured)
  {
    id: 'live_maya_scheduled',
    creatorId: 'creator_maya',
    creatorName: 'Maya Lin',
    creatorUsername: 'mayalin_cine',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    title: 'Scheduled Masterclass: Lighting Atmospheric Interiors with HMI Fresnels',
    description: 'Upcoming deep-dive on shaping hard light through atmospheric haze. Learn inverse square ratio calculations and soft bounced key lighting.',
    coverImage: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1600&q=80',
    category: 'Photography & Cinematography',
    tags: ['LightingMasterclass', 'HMIFresnel', 'CinematicAtmosphere'],
    accessMode: 'public',
    status: 'scheduled',
    viewerCount: 0,
    totalRevenue: 0,
    scheduledFor: 'Tomorrow, 7:00 PM EST',
    expectedDurationMinutes: 90,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'paid',
      price: 12.99,
      currency: 'USD',
      availabilityDays: 'unlimited',
      description: 'Pre-order or unlock the official 4K masterclass replay with lighting overheads.',
      replayPermission: 'paid',
      participantConsentConfirmed: true
    },
    recordingStatus: 'not_recorded',
    isReplayPublished: true,
    purchasedReplayUserIds: []
  },

  // 5. Leo Sterling - Esports Aim Academy Live (Live Now — Recording Disabled)
  {
    id: 'live_leo_aim_live',
    creatorId: 'creator_leo',
    creatorName: 'Leo Sterling',
    creatorUsername: 'leosterling_fps',
    creatorAvatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    title: 'Live Scrims & Dynamic Micro-Aim Coaching with Pro Players',
    description: 'Tier-1 team scrims in high-tier lobbies. Live voice comms, rotation playbooks, and in-depth round debriefs after each map.',
    coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1600&q=80',
    category: 'Gaming & Esports',
    tags: ['ProScrims', 'AimAcademy', 'LiveCoaching'],
    accessMode: 'public',
    status: 'live',
    viewerCount: 890,
    totalRevenue: 520.00,
    startedAt: '15 minutes ago',
    expectedDurationMinutes: 120,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 1.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'disabled',
      replayPermission: 'public'
    },
    recordingStatus: 'not_recorded',
    isReplayPublished: false,
    purchasedReplayUserIds: []
  },

  // 6. Chloe Bennett - Sourdough & Croissant Workshop (Scheduled)
  {
    id: 'live_chloe_scheduled',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Bennett',
    creatorUsername: 'chefchloe_b',
    creatorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
    title: 'Scheduled Workshop: 72-Hour Wild Sourdough & Honeycomb Lamination',
    description: 'Join Chloe live from her Lyon bakery as we follow a live dough lamination process from levain inoculation to final bake.',
    coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1600&q=80',
    category: 'Culinary Arts & Gourmet',
    tags: ['SourdoughScience', 'FrenchBakery', 'LiveBake'],
    accessMode: 'all_subscribers',
    status: 'scheduled',
    viewerCount: 0,
    totalRevenue: 0,
    scheduledFor: 'Friday, 10:00 AM CET',
    expectedDurationMinutes: 120,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: true,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'free',
      availabilityDays: 30,
      description: 'Free replay included for all active subscribers.',
      replayPermission: 'subscribers',
      participantConsentConfirmed: true
    },
    recordingStatus: 'not_recorded',
    isReplayPublished: true,
    purchasedReplayUserIds: []
  },

  // 7. Alex Rivera - Rust Compiler Architecture (Live Now — Free Recording Enabled)
  {
    id: 'live_alex_rust_live',
    creatorId: 'creator_alex',
    creatorName: 'Alex Rivera',
    creatorUsername: 'alexrivera_dev',
    creatorAvatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    title: 'Live Coding: Writing a High-Performance JIT Bytecode Compiler in Rust',
    description: 'Building an x86-64 machine code emitter from scratch using Cranelift and custom register allocation. Live coding with interactive Q&A.',
    coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1600&q=80',
    category: 'Tech & Software Development',
    tags: ['RustLang', 'Compilers', 'SystemsEngineering'],
    accessMode: 'public',
    status: 'live',
    viewerCount: 645,
    totalRevenue: 410.00,
    startedAt: '50 minutes ago',
    expectedDurationMinutes: 120,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'free',
      availabilityDays: 'unlimited',
      description: 'Open-access replay for all followers and community members.',
      replayPermission: 'public',
      participantConsentConfirmed: true
    },
    recordingStatus: 'recording',
    isReplayPublished: true,
    purchasedReplayUserIds: []
  },

  // 8. David Kalu - 432Hz Sunset Sound Bath (Scheduled)
  {
    id: 'live_david_scheduled',
    creatorId: 'creator_david',
    creatorName: 'David Kalu',
    creatorUsername: 'davidkalu_wellness',
    creatorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    title: 'Sunset Sound Sanctuary: 432Hz Quartz Singing Bowls & Guided Somatic Breathwork',
    description: 'Upcoming sunset acoustic healing live from Table Mountain. Wear headphones for high-fidelity binaural spatialization.',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1600&q=80',
    category: 'Wellness & Meditation',
    tags: ['SoundSanctuary', 'BinauralHealing', 'SunsetMeditation'],
    accessMode: 'public',
    status: 'scheduled',
    viewerCount: 0,
    totalRevenue: 0,
    scheduledFor: 'Sunday, 6:30 PM SAST',
    expectedDurationMinutes: 60,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 1.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'paid',
      price: 7.99,
      currency: 'USD',
      availabilityDays: 'unlimited',
      description: 'Lossless 432Hz audio + 4K sunset replay for evening meditation.',
      replayPermission: 'paid',
      participantConsentConfirmed: true
    },
    recordingStatus: 'not_recorded',
    isReplayPublished: true,
    purchasedReplayUserIds: []
  },

  // 9. Elena Vance - Completed Livestream with Paid Official Recording ($18.00)
  {
    id: 'live_elena_replay_milan',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    title: 'Milan Runway Archive: Private Couture Fitting & Corsetry Construction',
    description: 'Official full-length server recording of our 85-minute Milan showroom fitting. Includes structural boning placement, silk organza layering, and live Q&A.',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=80',
    category: 'Fashion & Luxury',
    tags: ['OfficialReplay', 'MilanCouture', 'AtelierArchive'],
    accessMode: 'public',
    status: 'ended',
    viewerCount: 2140,
    totalRevenue: 1940.00,
    startedAt: '2 days ago',
    endedAt: '2026-11-01',
    expectedDurationMinutes: 85,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'paid',
      price: 18.00,
      currency: 'USD',
      availabilityDays: 'unlimited',
      description: 'Unlock permanent on-demand access to the 85-minute Milan Runway Fitting official broadcast recording.',
      replayPermission: 'paid',
      includeReplayWithLiveTicket: false,
      participantConsentConfirmed: true
    },
    recordingStatus: 'ready',
    isReplayPublished: true,
    replayViewsCount: 412,
    replayPurchasesCount: 68,
    replayGrossRevenue: 1224.00,
    replayPlatformFee: 244.80,
    replayNetRevenue: 979.20,
    purchasedReplayUserIds: [],
    recordingPublishedAt: '2026-11-01',
    recordingExpiresAt: 'Unlimited'
  },

  // 10. Elena Vance - Completed Livestream with Paid Recording Already Purchased by Jordan Cross
  {
    id: 'live_elena_replay_venice',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    title: 'Venice Biennale Gown Unveiling & Hand-Beaded Embroidery Breakdown',
    description: 'Recorded live in Venice. Close-up camera inspection of 400 hours of metallic tambour beading and cathedral train balance.',
    coverImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=80',
    category: 'Fashion & Luxury',
    tags: ['OfficialReplay', 'VeniceGala', 'CoutureEmbroidery'],
    accessMode: 'pay_per_view',
    ppvTicketPrice: 12.00,
    status: 'ended',
    viewerCount: 1690,
    totalRevenue: 1580.00,
    startedAt: '5 days ago',
    endedAt: '2026-10-29',
    expectedDurationMinutes: 70,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 2.00
    },
    purchasedViewerIds: ['user_fan_1'],
    recordingSettings: {
      mode: 'paid',
      price: 12.50,
      currency: 'USD',
      availabilityDays: 'unlimited',
      description: 'Official 1080p multi-angle replay of the Venice Biennale Gown Unveiling.',
      replayPermission: 'paid',
      includeReplayWithLiveTicket: true,
      participantConsentConfirmed: true
    },
    recordingStatus: 'ready',
    isReplayPublished: true,
    replayViewsCount: 685,
    replayPurchasesCount: 94,
    replayGrossRevenue: 1175.00,
    replayPlatformFee: 235.00,
    replayNetRevenue: 940.00,
    purchasedReplayUserIds: ['user_fan_1'],
    recordingPublishedAt: '2026-10-29',
    recordingExpiresAt: 'Unlimited'
  },

  // 11. Marcus Thorne - Completed Livestream with Free Official Recording
  {
    id: 'live_marcus_replay_free',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    title: 'Analog Tape Mastering & SSL Bus Compression Deep-Dive (Free Replay)',
    description: 'Full recorded broadcast from Studio B. Comparing 1/2-inch Ampex ATR-102 tape saturation curves on live drum stems.',
    coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1600&q=80',
    category: 'Music & Audio Production',
    tags: ['FreeReplay', 'TapeMastering', 'SSLConsole'],
    accessMode: 'public',
    status: 'ended',
    viewerCount: 1320,
    totalRevenue: 490.00,
    startedAt: '4 days ago',
    endedAt: '2026-10-30',
    expectedDurationMinutes: 65,
    videoStreamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    isDemo: true,
    settings: {
      enableTips: true,
      enableGifts: true,
      enablePaidMessages: true,
      enableHighlightedMessages: true,
      subscribersOnlyChat: false,
      minimumTipAmount: 1.00
    },
    purchasedViewerIds: [],
    recordingSettings: {
      mode: 'free',
      availabilityDays: 30,
      description: 'Free official studio recording available to all fans for 30 days.',
      replayPermission: 'public',
      participantConsentConfirmed: true
    },
    recordingStatus: 'ready',
    isReplayPublished: true,
    replayViewsCount: 940,
    replayPurchasesCount: 0,
    replayGrossRevenue: 0,
    replayPlatformFee: 0,
    replayNetRevenue: 0,
    purchasedReplayUserIds: [],
    recordingPublishedAt: '2026-10-30',
    recordingExpiresAt: '2026-11-29'
  }
];

export const DEMO_STATS = {
  totalCreators: 10,
  totalVideos: 18,
  totalPhotos: 35,
  totalStreams: 11
};
