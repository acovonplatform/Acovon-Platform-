import { CreatorStatus } from '../types';

const now = Date.now();
const oneHour = 3600 * 1000;

export const INITIAL_STATUSES: CreatorStatus[] = [
  // Elena Vance - 3 Status Updates (Sequence: Photo -> Video -> Text)
  {
    id: 'status_elena_1',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1080&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=300&q=80',
    caption: 'Backstage at the Grand Palais. Lighting rehearsal for tonight’s private couture preview ✨',
    audience: 'public',
    createdAt: new Date(now - 3 * oneHour).toISOString(),
    expiresAt: new Date(now + 21 * oneHour).toISOString(),
    viewsCount: 384,
    uniqueViews: [
      { userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', viewedAt: '2h ago' },
      { userId: 'user_fan_2', userName: 'Sophia Laurent', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', viewedAt: '1h ago' }
    ],
    reactions: [
      { id: 'react_1', userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', emoji: '🔥', createdAt: '2h ago' },
      { id: 'react_2', userId: 'user_fan_2', userName: 'Sophia Laurent', userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', emoji: '👑', createdAt: '1h ago' }
    ],
    replies: [
      { id: 'rep_1', userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', text: 'Incredible silhouette! Can’t wait for the live session.', createdAt: '2h ago' }
    ],
    isDemo: true
  },
  {
    id: 'status_elena_2',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    durationSeconds: 15,
    caption: 'Quick motion test with the silk archive drape. Subscriber vault release drops tomorrow noon! 🎬',
    audience: 'followers',
    createdAt: new Date(now - 2 * oneHour).toISOString(),
    expiresAt: new Date(now + 22 * oneHour).toISOString(),
    viewsCount: 295,
    uniqueViews: [
      { userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', viewedAt: '1h ago' }
    ],
    reactions: [
      { id: 'react_3', userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', emoji: '💎', createdAt: '1h ago' }
    ],
    replies: [],
    isDemo: true
  },
  {
    id: 'status_elena_3',
    creatorId: 'creator_elena',
    creatorName: 'Elena Vance',
    creatorUsername: 'elenavance',
    creatorAvatar: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    mediaType: 'text',
    textContent: 'Private VIP Q&A tonight at 8 PM CET. Answering custom styling critiques and atelier questions! 🥂✨',
    textBackground: 'linear-gradient(135deg, #1f1205 0%, #4a3311 50%, #997819 100%)',
    audience: 'subscribers',
    createdAt: new Date(now - 1 * oneHour).toISOString(),
    expiresAt: new Date(now + 23 * oneHour).toISOString(),
    viewsCount: 180,
    uniqueViews: [],
    reactions: [],
    replies: [],
    isDemo: true
  },

  // Marcus Thorne - 2 Status Updates (Sequence: Video -> Photo)
  {
    id: 'status_marcus_1',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684340.jpg',
    mediaType: 'video',
    mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: '/src/assets/images/creator_cover_music_1793476684355.jpg',
    durationSeconds: 12,
    caption: 'Tracking modular analog sub-bass at 4 AM. That warmth is unmatched 🎛️🎧',
    audience: 'public',
    createdAt: new Date(now - 4 * oneHour).toISOString(),
    expiresAt: new Date(now + 20 * oneHour).toISOString(),
    viewsCount: 420,
    uniqueViews: [
      { userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', viewedAt: '3h ago' }
    ],
    reactions: [
      { id: 'react_m1', userId: 'user_fan_1', userName: 'Jordan Cross', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', emoji: '🔥', createdAt: '3h ago' }
    ],
    replies: [],
    isDemo: true
  },
  {
    id: 'status_marcus_2',
    creatorId: 'creator_marcus',
    creatorName: 'Marcus Thorne',
    creatorUsername: 'marcusthorne',
    creatorAvatar: '/src/assets/images/creator_avatar_marcus_1793476684340.jpg',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1080&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=300&q=80',
    caption: 'Studio board is primed. Stem packs unlocked for all Patron Elite subscribers.',
    audience: 'subscribers',
    createdAt: new Date(now - 2 * oneHour).toISOString(),
    expiresAt: new Date(now + 22 * oneHour).toISOString(),
    viewsCount: 215,
    uniqueViews: [],
    reactions: [],
    replies: [],
    isDemo: true
  },

  // Chloe Rivera - 2 Status Updates
  {
    id: 'status_chloe_1',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Rivera',
    creatorUsername: 'chloerivera',
    creatorAvatar: '/src/assets/images/creator_avatar_chloe_1793476684345.jpg',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1080&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=300&q=80',
    caption: 'Morning conditioning drill complete! Post-workout recovery protocol dropping in 10 mins 💪',
    audience: 'public',
    createdAt: new Date(now - 5 * oneHour).toISOString(),
    expiresAt: new Date(now + 19 * oneHour).toISOString(),
    viewsCount: 512,
    uniqueViews: [],
    reactions: [],
    replies: [],
    isDemo: true
  },
  {
    id: 'status_chloe_2',
    creatorId: 'creator_chloe',
    creatorName: 'Chloe Rivera',
    creatorUsername: 'chloerivera',
    creatorAvatar: '/src/assets/images/creator_avatar_chloe_1793476684345.jpg',
    mediaType: 'text',
    textContent: 'Drop your fitness & mobility questions below! Selecting 5 to demonstrate on my next livestream workout 🧘‍♀️⚡',
    textBackground: 'linear-gradient(135deg, #062b19 0%, #0d5933 50%, #10b981 100%)',
    audience: 'followers',
    createdAt: new Date(now - 1 * oneHour).toISOString(),
    expiresAt: new Date(now + 23 * oneHour).toISOString(),
    viewsCount: 340,
    uniqueViews: [],
    reactions: [],
    replies: [],
    isDemo: true
  },

  // Aria Chen - 1 Status Update
  {
    id: 'status_aria_1',
    creatorId: 'creator_aria',
    creatorName: 'Aria Chen',
    creatorUsername: 'ariachen',
    creatorAvatar: '/src/assets/images/creator_avatar_aria_1793476684348.jpg',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1080&q=80',
    thumbnailUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=300&q=80',
    caption: 'Late night streaming setup dialed in. Cyberpunk tournament run starts in 30 mins! 🎮💜',
    audience: 'public',
    createdAt: new Date(now - 6 * oneHour).toISOString(),
    expiresAt: new Date(now + 18 * oneHour).toISOString(),
    viewsCount: 680,
    uniqueViews: [],
    reactions: [],
    replies: [],
    isDemo: true
  }
];
