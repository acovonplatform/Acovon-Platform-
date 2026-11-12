import { CategoryRecord, CountryRecord } from '../types';

export const OFFICIAL_CATEGORIES: CategoryRecord[] = [
  {
    id: 'cat_fashion_luxury',
    name: 'Fashion & Luxury',
    slug: 'fashion-luxury',
    description: 'Couture atelier lookbooks, runway archives, styling diaries, and high-fashion editorial releases.',
    image: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    is_active: true,
    display_order: 1,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_music_audio',
    name: 'Music & Audio Production',
    slug: 'music-audio-production',
    description: 'Studio sessions, uncompressed stem vaults, modular synthesizer patches, and film scoring masterclasses.',
    image: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    is_active: true,
    display_order: 2,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_fitness_bodybuilding',
    name: 'Fitness & Bodybuilding',
    slug: 'fitness-bodybuilding',
    description: 'Athletic conditioning, biomechanics drills, hypertrophy periodization, and performance nutrition.',
    image: '/src/assets/images/hero_acovon_creator_1793476683041.jpg',
    is_active: true,
    display_order: 3,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_photography_cine',
    name: 'Photography & Cinematography',
    slug: 'photography-cinematography',
    description: 'Anamorphic lens tests, DaVinci Resolve color grading suites, lighting diagrams, and visual storytelling.',
    image: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    is_active: true,
    display_order: 4,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_digital_art_3d',
    name: 'Digital Art & 3D Design',
    slug: 'digital-art-3d-design',
    description: 'Procedural Houdini setups, Unreal Engine environments, PBR shader libraries, and concept art.',
    image: '/src/assets/images/hero_acovon_creator_1793476683041.jpg',
    is_active: true,
    display_order: 5,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_gaming_esports',
    name: 'Gaming & Esports',
    slug: 'gaming-esports',
    description: 'Pro tournament VOD reviews, tactical mechanics breakdowns, competitive coaching, and live gameplay.',
    image: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    is_active: true,
    display_order: 6,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_culinary_gourmet',
    name: 'Culinary Arts & Gourmet',
    slug: 'culinary-arts-gourmet',
    description: 'Fine dining plating techniques, Michelin-inspired recipes, artisanal pastry, and sommelier pairings.',
    image: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    is_active: true,
    display_order: 7,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_tech_software',
    name: 'Tech & Software Development',
    slug: 'tech-software-development',
    description: 'Distributed systems architecture, full-stack engineering deep dives, AI engineering, and code reviews.',
    image: '/src/assets/images/hero_acovon_creator_1793476683041.jpg',
    is_active: true,
    display_order: 8,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_education_tutorials',
    name: 'Education & Tutorials',
    slug: 'education-tutorials',
    description: 'Structured video curricula, hands-on workshops, language mastery, and academic breakdowns.',
    image: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    is_active: true,
    display_order: 9,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_coaching_business',
    name: 'Coaching & Business',
    slug: 'coaching-business',
    description: 'Executive leadership, venture strategy, creator monetization blueprints, and personal advisory.',
    image: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    is_active: true,
    display_order: 10,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_dance_choreography',
    name: 'Dance & Choreography',
    slug: 'dance-choreography',
    description: 'Contemporary movement, stage choreography rehearsals, rhythm workshops, and performance reels.',
    image: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    is_active: true,
    display_order: 11,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_animation_motion',
    name: 'Animation & Motion Design',
    slug: 'animation-motion-design',
    description: 'Keyframe storytelling, 2D/3D motion graphics, title sequence design, and visual effects.',
    image: '/src/assets/images/hero_acovon_creator_1793476683041.jpg',
    is_active: true,
    display_order: 12,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_wellness_meditation',
    name: 'Wellness & Meditation',
    slug: 'wellness-meditation',
    description: 'Breathwork protocols, mindfulness sessions, somatic recovery, and holistic longevity practices.',
    image: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    is_active: true,
    display_order: 13,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_amateur',
    name: 'Amateur',
    slug: 'amateur',
    description: 'Authentic independent creator stories, unscripted daily captures, behind-the-scenes vlogs, and raw moments.',
    image: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    is_active: true,
    display_order: 14,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_lifestyle_vlog',
    name: 'Lifestyle & Vlog',
    slug: 'lifestyle-vlog',
    description: 'Day-in-the-life diaries, international living, personal collections, and creator chronicles.',
    image: '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
    is_active: true,
    display_order: 15,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_beauty_glamour',
    name: 'Beauty & Glamour',
    slug: 'beauty-glamour',
    description: 'Editorial makeup artistry, skincare rituals, fragrance curation, and red-carpet preparation.',
    image: '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
    is_active: true,
    display_order: 16,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_travel_destinations',
    name: 'Travel & Destinations',
    slug: 'travel-destinations',
    description: 'Global destination cinematography, hidden architectural gems, luxury hospitality, and cultural expeditions.',
    image: '/src/assets/images/hero_acovon_creator_1793476683041.jpg',
    is_active: true,
    display_order: 17,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_comedy_entertainment',
    name: 'Comedy & Entertainment',
    slug: 'comedy-entertainment',
    description: 'Original sketches, live crowd-work clips, commentary, and high-energy entertainment.',
    image: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    is_active: true,
    display_order: 18,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_asmr_relaxation',
    name: 'ASMR & Relaxation',
    slug: 'asmr-relaxation',
    description: 'Binaural microphone recordings, spatial soundscapes, and calming sensory experiences.',
    image: '/src/assets/images/creator_avatar_marcus_1793476684480.jpg',
    is_active: true,
    display_order: 19,
    created_at: '2025-01-01'
  },
  {
    id: 'cat_cosplay_performance',
    name: 'Cosplay & Performance',
    slug: 'cosplay-performance',
    description: 'Hand-crafted costume fabrication, prop engineering, character performances, and convention showcases.',
    image: '/src/assets/images/hero_acovon_creator_1793476683041.jpg',
    is_active: true,
    display_order: 20,
    created_at: '2025-01-01'
  }
];

// Complete Official ISO 3166-1 Alpha-2 Country Database with Flags
const RAW_ISO_COUNTRIES: Array<{
  iso: string;
  name: string;
  flag: string;
  region: string;
  aliases?: string[];
}> = [
  { iso: 'AF', name: 'Afghanistan', flag: '🇦🇫', region: 'Asia' },
  { iso: 'AL', name: 'Albania', flag: '🇦🇱', region: 'Europe' },
  { iso: 'DZ', name: 'Algeria', flag: '🇩🇿', region: 'Africa' },
  { iso: 'AD', name: 'Andorra', flag: '🇦🇩', region: 'Europe' },
  { iso: 'AO', name: 'Angola', flag: '🇦🇴', region: 'Africa' },
  { iso: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬', region: 'Americas' },
  { iso: 'AR', name: 'Argentina', flag: '🇦🇷', region: 'Americas' },
  { iso: 'AM', name: 'Armenia', flag: '🇦🇲', region: 'Asia' },
  { iso: 'AU', name: 'Australia', flag: '🇦🇺', region: 'Oceania' },
  { iso: 'AT', name: 'Austria', flag: '🇦🇹', region: 'Europe' },
  { iso: 'AZ', name: 'Azerbaijan', flag: '🇦🇿', region: 'Asia' },
  { iso: 'BS', name: 'Bahamas', flag: '🇧🇸', region: 'Americas' },
  { iso: 'BH', name: 'Bahrain', flag: '🇧🇭', region: 'Middle East' },
  { iso: 'BD', name: 'Bangladesh', flag: '🇧🇩', region: 'Asia' },
  { iso: 'BB', name: 'Barbados', flag: '🇧🇧', region: 'Americas' },
  { iso: 'BY', name: 'Belarus', flag: '🇧🇾', region: 'Europe' },
  { iso: 'BE', name: 'Belgium', flag: '🇧🇪', region: 'Europe' },
  { iso: 'BZ', name: 'Belize', flag: '🇧🇿', region: 'Americas' },
  { iso: 'BJ', name: 'Benin', flag: '🇧🇯', region: 'Africa' },
  { iso: 'BT', name: 'Bhutan', flag: '🇧🇹', region: 'Asia' },
  { iso: 'BO', name: 'Bolivia', flag: '🇧🇴', region: 'Americas' },
  { iso: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦', region: 'Europe' },
  { iso: 'BW', name: 'Botswana', flag: '🇧🇼', region: 'Africa' },
  { iso: 'BR', name: 'Brazil', flag: '🇧🇷', region: 'Americas' },
  { iso: 'BN', name: 'Brunei', flag: '🇧🇳', region: 'Asia' },
  { iso: 'BG', name: 'Bulgaria', flag: '🇧🇬', region: 'Europe' },
  { iso: 'BF', name: 'Burkina Faso', flag: '🇧🇫', region: 'Africa' },
  { iso: 'BI', name: 'Burundi', flag: '🇧🇮', region: 'Africa' },
  { iso: 'CV', name: 'Cabo Verde', flag: '🇨🇻', region: 'Africa' },
  { iso: 'KH', name: 'Cambodia', flag: '🇰🇭', region: 'Asia' },
  { iso: 'CM', name: 'Cameroon', flag: '🇨🇲', region: 'Africa' },
  { iso: 'CA', name: 'Canada', flag: '🇨🇦', region: 'Americas' },
  { iso: 'CF', name: 'Central African Republic', flag: '🇨🇫', region: 'Africa' },
  { iso: 'TD', name: 'Chad', flag: '🇹🇩', region: 'Africa' },
  { iso: 'CL', name: 'Chile', flag: '🇨🇱', region: 'Americas' },
  { iso: 'CN', name: 'China', flag: '🇨🇳', region: 'Asia' },
  { iso: 'CO', name: 'Colombia', flag: '🇨🇴', region: 'Americas' },
  { iso: 'KM', name: 'Comoros', flag: '🇰🇲', region: 'Africa' },
  { iso: 'CG', name: 'Congo', flag: '🇨🇬', region: 'Africa' },
  { iso: 'CD', name: 'DR Congo', flag: '🇨🇩', region: 'Africa', aliases: ['Democratic Republic of the Congo', 'DRC'] },
  { iso: 'CR', name: 'Costa Rica', flag: '🇨🇷', region: 'Americas' },
  { iso: 'CI', name: "Côte d'Ivoire", flag: '🇨🇮', region: 'Africa', aliases: ['Ivory Coast'] },
  { iso: 'HR', name: 'Croatia', flag: '🇭🇷', region: 'Europe' },
  { iso: 'CU', name: 'Cuba', flag: '🇨🇺', region: 'Americas' },
  { iso: 'CY', name: 'Cyprus', flag: '🇨🇾', region: 'Europe' },
  { iso: 'CZ', name: 'Czechia', flag: '🇨🇿', region: 'Europe', aliases: ['Czech Republic'] },
  { iso: 'DK', name: 'Denmark', flag: '🇩🇰', region: 'Europe' },
  { iso: 'DJ', name: 'Djibouti', flag: '🇩🇯', region: 'Africa' },
  { iso: 'DM', name: 'Dominica', flag: '🇩🇲', region: 'Americas' },
  { iso: 'DO', name: 'Dominican Republic', flag: '🇩🇴', region: 'Americas' },
  { iso: 'EC', name: 'Ecuador', flag: '🇪🇨', region: 'Americas' },
  { iso: 'EG', name: 'Egypt', flag: '🇪🇬', region: 'Middle East & Africa' },
  { iso: 'SV', name: 'El Salvador', flag: '🇸🇻', region: 'Americas' },
  { iso: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶', region: 'Africa' },
  { iso: 'ER', name: 'Eritrea', flag: '🇪🇷', region: 'Africa' },
  { iso: 'EE', name: 'Estonia', flag: '🇪🇪', region: 'Europe' },
  { iso: 'SZ', name: 'Eswatini', flag: '🇸🇿', region: 'Africa' },
  { iso: 'ET', name: 'Ethiopia', flag: '🇪🇹', region: 'Africa' },
  { iso: 'FJ', name: 'Fiji', flag: '🇫🇯', region: 'Oceania' },
  { iso: 'FI', name: 'Finland', flag: '🇫🇮', region: 'Europe' },
  { iso: 'FR', name: 'France', flag: '🇫🇷', region: 'Europe' },
  { iso: 'GA', name: 'Gabon', flag: '🇬🇦', region: 'Africa' },
  { iso: 'GM', name: 'Gambia', flag: '🇬🇲', region: 'Africa' },
  { iso: 'GE', name: 'Georgia', flag: '🇬🇪', region: 'Europe' },
  { iso: 'DE', name: 'Germany', flag: '🇩🇪', region: 'Europe' },
  { iso: 'GH', name: 'Ghana', flag: '🇬🇭', region: 'Africa' },
  { iso: 'GR', name: 'Greece', flag: '🇬🇷', region: 'Europe' },
  { iso: 'GD', name: 'Grenada', flag: '🇬🇩', region: 'Americas' },
  { iso: 'GT', name: 'Guatemala', flag: '🇬🇹', region: 'Americas' },
  { iso: 'GN', name: 'Guinea', flag: '🇬🇳', region: 'Africa' },
  { iso: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼', region: 'Africa' },
  { iso: 'GY', name: 'Guyana', flag: '🇬🇾', region: 'Americas' },
  { iso: 'HT', name: 'Haiti', flag: '🇭🇹', region: 'Americas' },
  { iso: 'HN', name: 'Honduras', flag: '🇭🇳', region: 'Americas' },
  { iso: 'HK', name: 'Hong Kong', flag: '🇭🇰', region: 'Asia' },
  { iso: 'HU', name: 'Hungary', flag: '🇭🇺', region: 'Europe' },
  { iso: 'IS', name: 'Iceland', flag: '🇮🇸', region: 'Europe' },
  { iso: 'IN', name: 'India', flag: '🇮🇳', region: 'Asia' },
  { iso: 'ID', name: 'Indonesia', flag: '🇮🇩', region: 'Asia' },
  { iso: 'IR', name: 'Iran', flag: '🇮🇷', region: 'Middle East' },
  { iso: 'IQ', name: 'Iraq', flag: '🇮🇶', region: 'Middle East' },
  { iso: 'IE', name: 'Ireland', flag: '🇮🇪', region: 'Europe' },
  { iso: 'IL', name: 'Israel', flag: '🇮🇱', region: 'Middle East' },
  { iso: 'IT', name: 'Italy', flag: '🇮🇹', region: 'Europe' },
  { iso: 'JM', name: 'Jamaica', flag: '🇯🇲', region: 'Americas' },
  { iso: 'JP', name: 'Japan', flag: '🇯🇵', region: 'Asia' },
  { iso: 'JO', name: 'Jordan', flag: '🇯🇴', region: 'Middle East' },
  { iso: 'KZ', name: 'Kazakhstan', flag: '🇰🇿', region: 'Asia' },
  { iso: 'KE', name: 'Kenya', flag: '🇰🇪', region: 'Africa' },
  { iso: 'KW', name: 'Kuwait', flag: '🇰🇼', region: 'Middle East' },
  { iso: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬', region: 'Asia' },
  { iso: 'LA', name: 'Laos', flag: '🇱🇦', region: 'Asia' },
  { iso: 'LV', name: 'Latvia', flag: '🇱🇻', region: 'Europe' },
  { iso: 'LB', name: 'Lebanon', flag: '🇱🇧', region: 'Middle East' },
  { iso: 'LS', name: 'Lesotho', flag: '🇱🇸', region: 'Africa' },
  { iso: 'LR', name: 'Liberia', flag: '🇱🇷', region: 'Africa' },
  { iso: 'LY', name: 'Libya', flag: '🇱🇾', region: 'Africa' },
  { iso: 'LI', name: 'Liechtenstein', flag: '🇱🇮', region: 'Europe' },
  { iso: 'LT', name: 'Lithuania', flag: '🇱🇹', region: 'Europe' },
  { iso: 'LU', name: 'Luxembourg', flag: '🇱🇺', region: 'Europe' },
  { iso: 'MO', name: 'Macau', flag: '🇲🇴', region: 'Asia' },
  { iso: 'MG', name: 'Madagascar', flag: '🇲🇬', region: 'Africa' },
  { iso: 'MW', name: 'Malawi', flag: '🇲🇼', region: 'Africa' },
  { iso: 'MY', name: 'Malaysia', flag: '🇲🇾', region: 'Asia' },
  { iso: 'MV', name: 'Maldives', flag: '🇲🇻', region: 'Asia' },
  { iso: 'ML', name: 'Mali', flag: '🇲🇱', region: 'Africa' },
  { iso: 'MT', name: 'Malta', flag: '🇲🇹', region: 'Europe' },
  { iso: 'MR', name: 'Mauritania', flag: '🇲🇷', region: 'Africa' },
  { iso: 'MU', name: 'Mauritius', flag: '🇲🇺', region: 'Africa' },
  { iso: 'MX', name: 'Mexico', flag: '🇲🇽', region: 'Americas' },
  { iso: 'MD', name: 'Moldova', flag: '🇲🇩', region: 'Europe' },
  { iso: 'MC', name: 'Monaco', flag: '🇲🇨', region: 'Europe' },
  { iso: 'MN', name: 'Mongolia', flag: '🇲🇳', region: 'Asia' },
  { iso: 'ME', name: 'Montenegro', flag: '🇲🇪', region: 'Europe' },
  { iso: 'MA', name: 'Morocco', flag: '🇲🇦', region: 'Africa' },
  { iso: 'MZ', name: 'Mozambique', flag: '🇲🇿', region: 'Africa' },
  { iso: 'MM', name: 'Myanmar', flag: '🇲🇲', region: 'Asia' },
  { iso: 'NA', name: 'Namibia', flag: '🇳🇦', region: 'Africa' },
  { iso: 'NP', name: 'Nepal', flag: '🇳🇵', region: 'Asia' },
  { iso: 'NL', name: 'Netherlands', flag: '🇳🇱', region: 'Europe', aliases: ['Holland'] },
  { iso: 'NZ', name: 'New Zealand', flag: '🇳🇿', region: 'Oceania' },
  { iso: 'NI', name: 'Nicaragua', flag: '🇳🇮', region: 'Americas' },
  { iso: 'NE', name: 'Niger', flag: '🇳🇪', region: 'Africa' },
  { iso: 'NG', name: 'Nigeria', flag: '🇳🇬', region: 'Africa' },
  { iso: 'MK', name: 'North Macedonia', flag: '🇲🇰', region: 'Europe' },
  { iso: 'NO', name: 'Norway', flag: '🇳🇴', region: 'Europe' },
  { iso: 'OM', name: 'Oman', flag: '🇴🇲', region: 'Middle East' },
  { iso: 'PK', name: 'Pakistan', flag: '🇵🇰', region: 'Asia' },
  { iso: 'PS', name: 'Palestine', flag: '🇵🇸', region: 'Middle East' },
  { iso: 'PA', name: 'Panama', flag: '🇵🇦', region: 'Americas' },
  { iso: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', region: 'Oceania' },
  { iso: 'PY', name: 'Paraguay', flag: '🇵🇾', region: 'Americas' },
  { iso: 'PE', name: 'Peru', flag: '🇵🇪', region: 'Americas' },
  { iso: 'PH', name: 'Philippines', flag: '🇵🇭', region: 'Asia' },
  { iso: 'PL', name: 'Poland', flag: '🇵🇱', region: 'Europe' },
  { iso: 'PT', name: 'Portugal', flag: '🇵🇹', region: 'Europe' },
  { iso: 'PR', name: 'Puerto Rico', flag: '🇵🇷', region: 'Americas' },
  { iso: 'QA', name: 'Qatar', flag: '🇶🇦', region: 'Middle East' },
  { iso: 'RO', name: 'Romania', flag: '🇷🇴', region: 'Europe' },
  { iso: 'RU', name: 'Russia', flag: '🇷🇺', region: 'Europe & Asia' },
  { iso: 'RW', name: 'Rwanda', flag: '🇷🇼', region: 'Africa' },
  { iso: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East', aliases: ['KSA'] },
  { iso: 'SN', name: 'Senegal', flag: '🇸🇳', region: 'Africa' },
  { iso: 'RS', name: 'Serbia', flag: '🇷🇸', region: 'Europe' },
  { iso: 'SC', name: 'Seychelles', flag: '🇸🇨', region: 'Africa' },
  { iso: 'SL', name: 'Sierra Leone', flag: '🇸🇱', region: 'Africa' },
  { iso: 'SG', name: 'Singapore', flag: '🇸🇬', region: 'Asia' },
  { iso: 'SK', name: 'Slovakia', flag: '🇸🇰', region: 'Europe' },
  { iso: 'SI', name: 'Slovenia', flag: '🇸🇮', region: 'Europe' },
  { iso: 'SO', name: 'Somalia', flag: '🇸🇴', region: 'Africa' },
  { iso: 'ZA', name: 'South Africa', flag: '🇿🇦', region: 'Africa', aliases: ['RSA'] },
  { iso: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'Asia', aliases: ['Korea', 'Republic of Korea', 'ROK'] },
  { iso: 'ES', name: 'Spain', flag: '🇪🇸', region: 'Europe' },
  { iso: 'LK', name: 'Sri Lanka', flag: '🇱🇰', region: 'Asia' },
  { iso: 'SD', name: 'Sudan', flag: '🇸🇩', region: 'Africa' },
  { iso: 'SE', name: 'Sweden', flag: '🇸🇪', region: 'Europe' },
  { iso: 'CH', name: 'Switzerland', flag: '🇨🇭', region: 'Europe' },
  { iso: 'SY', name: 'Syria', flag: '🇸🇾', region: 'Middle East' },
  { iso: 'TW', name: 'Taiwan', flag: '🇹🇼', region: 'Asia' },
  { iso: 'TJ', name: 'Tajikistan', flag: '🇹🇯', region: 'Asia' },
  { iso: 'TZ', name: 'Tanzania', flag: '🇹🇿', region: 'Africa' },
  { iso: 'TH', name: 'Thailand', flag: '🇹🇭', region: 'Asia' },
  { iso: 'TG', name: ' Togo', flag: '🇹🇬', region: 'Africa' },
  { iso: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹', region: 'Americas' },
  { iso: 'TN', name: 'Tunisia', flag: '🇹🇳', region: 'Africa' },
  { iso: 'TR', name: 'Turkey', flag: '🇹🇷', region: 'Europe & Middle East', aliases: ['Türkiye'] },
  { iso: 'TM', name: 'Turkmenistan', flag: '🇹🇲', region: 'Asia' },
  { iso: 'UG', name: 'Uganda', flag: '🇺🇬', region: 'Africa' },
  { iso: 'UA', name: 'Ukraine', flag: '🇺🇦', region: 'Europe' },
  { iso: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East', aliases: ['UAE', 'Dubai', 'Abu Dhabi', 'Emirates'] },
  { iso: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', aliases: ['UK', 'Great Britain', 'England', 'Scotland', 'Wales'] },
  { iso: 'US', name: 'United States', flag: '🇺🇸', region: 'Americas', aliases: ['USA', 'United States of America', 'America'] },
  { iso: 'UY', name: 'Uruguay', flag: '🇺🇾', region: 'Americas' },
  { iso: 'UZ', name: 'Uzbekistan', flag: '🇺🇿', region: 'Asia' },
  { iso: 'VE', name: 'Venezuela', flag: '🇻🇪', region: 'Americas' },
  { iso: 'VN', name: 'Vietnam', flag: '🇻🇳', region: 'Asia' },
  { iso: 'YE', name: 'Yemen', flag: '🇾🇪', region: 'Middle East' },
  { iso: 'ZM', name: 'Zambia', flag: '🇿🇲', region: 'Africa' },
  { iso: 'ZW', name: 'Zimbabwe', flag: '🇿🇼', region: 'Africa' }
];

export const OFFICIAL_COUNTRIES: CountryRecord[] = RAW_ISO_COUNTRIES.map(item => ({
  id: `country_${item.iso.toLowerCase()}`,
  name: item.name.trim(),
  iso_code: item.iso.toUpperCase(),
  flag: item.flag,
  region: item.region,
  aliases: item.aliases || [],
  is_active: true
}));

export function resolveCountryRecord(
  input: string | undefined | null,
  countriesList: CountryRecord[] = OFFICIAL_COUNTRIES
): CountryRecord | undefined {
  if (!input) return undefined;
  const clean = input.trim().toLowerCase();
  if (!clean) return undefined;

  return countriesList.find(
    c =>
      c.id.toLowerCase() === clean ||
      c.iso_code.toLowerCase() === clean ||
      c.name.toLowerCase() === clean ||
      (c.aliases && c.aliases.some(a => a.toLowerCase() === clean))
  );
}

export function resolveCategoryRecord(
  input: string | undefined | null,
  categoriesList: CategoryRecord[] = OFFICIAL_CATEGORIES
): CategoryRecord | undefined {
  if (!input) return undefined;
  const clean = input.trim().toLowerCase();
  if (!clean) return undefined;

  return categoriesList.find(
    c =>
      c.id.toLowerCase() === clean ||
      c.slug.toLowerCase() === clean ||
      c.name.toLowerCase() === clean
  );
}

export function matchesCountryIdentifier(
  entityCountryValue: string | undefined | null,
  entityCountryId: string | undefined | null,
  selectedFilterValues: string[],
  countriesList: CountryRecord[] = OFFICIAL_COUNTRIES
): boolean {
  if (!selectedFilterValues || selectedFilterValues.length === 0) return true;
  const resolvedEntity =
    resolveCountryRecord(entityCountryId, countriesList) ||
    resolveCountryRecord(entityCountryValue, countriesList);

  return selectedFilterValues.some(filterVal => {
    const resolvedFilter = resolveCountryRecord(filterVal, countriesList);
    if (resolvedEntity && resolvedFilter) {
      return resolvedEntity.id === resolvedFilter.id;
    }
    const cleanVal = (entityCountryValue || '').trim().toLowerCase();
    const cleanFilter = filterVal.trim().toLowerCase();
    return cleanVal === cleanFilter;
  });
}

export function matchesCategoryIdentifier(
  entityCategories: string[] | undefined | null,
  entityCategoryIds: string[] | undefined | null,
  selectedFilterValues: string[],
  categoriesList: CategoryRecord[] = OFFICIAL_CATEGORIES
): boolean {
  if (!selectedFilterValues || selectedFilterValues.length === 0) return true;

  const entityResolvedIds = new Set<string>();
  const entityNamesLower = new Set<string>();

  (entityCategoryIds || []).forEach(id => {
    const rec = resolveCategoryRecord(id, categoriesList);
    if (rec) {
      entityResolvedIds.add(rec.id);
      entityNamesLower.add(rec.name.toLowerCase());
    }
  });

  (entityCategories || []).forEach(cat => {
    const rec = resolveCategoryRecord(cat, categoriesList);
    if (rec) {
      entityResolvedIds.add(rec.id);
      entityNamesLower.add(rec.name.toLowerCase());
    } else if (cat) {
      entityNamesLower.add(cat.trim().toLowerCase());
    }
  });

  return selectedFilterValues.some(filterVal => {
    if (filterVal === 'All Categories') return true;
    const resolvedFilter = resolveCategoryRecord(filterVal, categoriesList);
    if (resolvedFilter && entityResolvedIds.has(resolvedFilter.id)) {
      return true;
    }
    return entityNamesLower.has(filterVal.trim().toLowerCase());
  });
}
