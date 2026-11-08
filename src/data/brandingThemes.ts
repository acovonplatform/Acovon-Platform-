import { PlatformBrandingTheme, BrandingDesignTokens } from '../types';

export interface FontPairingOption {
  id: string;
  label: string;
  headingFamily: string;
  bodyFamily: string;
}

export const SUPPORTED_FONT_PAIRINGS: FontPairingOption[] = [
  {
    id: 'manrope-inter',
    label: 'Manrope + Inter',
    headingFamily: "'Manrope', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'dmsans-inter',
    label: 'DM Sans + Inter',
    headingFamily: "'DM Sans', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'jakarta-inter',
    label: 'Plus Jakarta Sans + Inter',
    headingFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'outfit-inter',
    label: 'Outfit + Inter',
    headingFamily: "'Outfit', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'manrope-sourcesans',
    label: 'Manrope + Source Sans 3',
    headingFamily: "'Manrope', system-ui, sans-serif",
    bodyFamily: "'Source Sans 3', system-ui, sans-serif"
  },
  {
    id: 'sora-inter',
    label: 'Sora + Inter',
    headingFamily: "'Sora', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'inter-manrope',
    label: 'Inter + Manrope',
    headingFamily: "'Inter', system-ui, sans-serif",
    bodyFamily: "'Manrope', system-ui, sans-serif"
  },
  {
    id: 'cormorant-inter',
    label: 'Cormorant Garamond + Inter',
    headingFamily: "'Cormorant Garamond', Georgia, serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'spacegrotesk-inter',
    label: 'Space Grotesk + Inter',
    headingFamily: "'Space Grotesk', system-ui, sans-serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  },
  {
    id: 'lora-inter',
    label: 'Lora + Inter',
    headingFamily: "'Lora', Georgia, serif",
    bodyFamily: "'Inter', system-ui, sans-serif"
  }
];

/**
 * Calculates WCAG relative luminance to ensure primary buttons always use
 * high-contrast text (#0B0B0D on light accents, #FFFFFF on dark accents).
 */
export function getContrastTextForHex(hexColor: string): string {
  const clean = (hexColor || '').replace('#', '').trim();
  if (clean.length !== 6) return '#0B0B0D';
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  return lum > 0.36 ? '#0B0B0D' : '#FFFFFF';
}

export const PRESET_BRANDING_THEMES: PlatformBrandingTheme[] = [
  // ============================================================================
  // THEME 01 — ACOVON SIGNATURE (Recommended Default)
  // ============================================================================
  {
    id: 'acovon-signature',
    code: 'THEME 01',
    name: 'ACOVON Signature',
    tagline: 'Premium. Refined. Confident.',
    description: 'Near-black backgrounds, champagne gold accents, warm white text, and elegant modern typography.',
    isPreset: true,
    isDefault: true,
    mode: 'dark',
    swatches: ['#0B0B0D', '#151518', '#202024', '#F5F3EF', '#C6A66B'],
    fontPairId: 'manrope-inter',
    fontPairLabel: 'Manrope + Inter',
    tokens: {
      bgCanvas: '#0B0B0D',
      bgSurface: '#151518',
      bgElevated: '#242429',
      bgSubtle: '#1C1C20',
      bgNav: 'rgba(11, 11, 13, 0.95)',
      bgModal: '#151518',
      bgInput: '#1C1C20',
      bgAccentTint: 'rgba(198, 166, 107, 0.14)',
      textPrimary: '#F5F3EF',
      textSecondary: '#C4C4CC',
      textMuted: '#92929C',
      accentPrimary: '#C6A66B',
      accentSecondary: '#E7D1A7',
      accentContrastText: '#0B0B0D',
      secondaryBtnBg: '#242429',
      secondaryBtnText: '#F5F3EF',
      secondaryBtnBorder: '#34343A',
      destructiveColor: '#EF4444',
      successColor: '#10B981',
      warningColor: '#F59E0B',
      borderPrimary: '#34343A',
      borderSubtle: '#26262C',
      borderFocus: '#C6A66B',
      fontHeading: "'Manrope', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
      shadowStyle: '0 14px 34px -10px rgba(0, 0, 0, 0.55)'
    }
  },

  // ============================================================================
  // THEME 02 — OBSIDIAN LUXE
  // ============================================================================
  {
    id: 'obsidian-luxe',
    code: 'THEME 02',
    name: 'Obsidian Luxe',
    tagline: 'Modern luxury.',
    description: 'Deep graphite, platinum, muted silver, and refined editorial typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#101114', '#202329', '#353A42', '#F2F3F5', '#D8C7A2'],
    fontPairId: 'dmsans-inter',
    fontPairLabel: 'DM Sans + Inter',
    tokens: {
      bgCanvas: '#101114',
      bgSurface: '#202329',
      bgElevated: '#2B2F37',
      bgSubtle: '#181A1F',
      bgNav: 'rgba(16, 17, 20, 0.95)',
      bgModal: '#202329',
      bgInput: '#191C22',
      bgAccentTint: 'rgba(216, 199, 162, 0.14)',
      textPrimary: '#FFFFFF',
      textSecondary: '#D5D8E0',
      textMuted: '#A8ADB8',
      accentPrimary: '#D8C7A2',
      accentSecondary: '#EDE2C8',
      accentContrastText: '#101114',
      secondaryBtnBg: '#353A42',
      secondaryBtnText: '#F2F3F5',
      secondaryBtnBorder: '#454B55',
      destructiveColor: '#F87171',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      borderPrimary: '#353A42',
      borderSubtle: '#282C34',
      borderFocus: '#D8C7A2',
      fontHeading: "'DM Sans', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.625rem',
      cardRadius: '0.875rem',
      shadowStyle: '0 16px 36px -12px rgba(5, 6, 8, 0.65)'
    }
  },

  // ============================================================================
  // THEME 03 — ROYAL PURPLE
  // ============================================================================
  {
    id: 'royal-purple',
    code: 'THEME 03',
    name: 'Royal Purple',
    tagline: 'Express your world.',
    description: 'Deep violet, royal purple, soft lavender, and modern rounded typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#171020', '#281A3B', '#583A83', '#F8F4FF', '#C7A6FF'],
    fontPairId: 'jakarta-inter',
    fontPairLabel: 'Plus Jakarta Sans + Inter',
    tokens: {
      bgCanvas: '#171020',
      bgSurface: '#281A3B',
      bgElevated: '#372452',
      bgSubtle: '#201530',
      bgNav: 'rgba(23, 16, 32, 0.95)',
      bgModal: '#281A3B',
      bgInput: '#221633',
      bgAccentTint: 'rgba(199, 166, 255, 0.16)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E5DCF2',
      textMuted: '#B9AEC8',
      accentPrimary: '#C7A6FF',
      accentSecondary: '#E3D1FF',
      accentContrastText: '#171020',
      secondaryBtnBg: '#583A83',
      secondaryBtnText: '#F8F4FF',
      secondaryBtnBorder: '#6E4BA1',
      destructiveColor: '#FB7185',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      borderPrimary: '#462E68',
      borderSubtle: '#34224E',
      borderFocus: '#C7A6FF',
      fontHeading: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '1rem',
      cardRadius: '1.25rem',
      shadowStyle: '0 16px 38px -10px rgba(14, 8, 22, 0.7)'
    }
  },

  // ============================================================================
  // THEME 04 — OCEAN BLUE
  // ============================================================================
  {
    id: 'ocean-blue',
    code: 'THEME 04',
    name: 'Ocean Blue',
    tagline: 'Connect beyond limits.',
    description: 'Midnight navy, ocean blue, cyan accents, and clean geometric typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#071724', '#102A3C', '#194A65', '#F3FAFF', '#55BDEB'],
    fontPairId: 'outfit-inter',
    fontPairLabel: 'Outfit + Inter',
    tokens: {
      bgCanvas: '#071724',
      bgSurface: '#102A3C',
      bgElevated: '#163850',
      bgSubtle: '#0C2130',
      bgNav: 'rgba(7, 23, 36, 0.95)',
      bgModal: '#102A3C',
      bgInput: '#0E2434',
      bgAccentTint: 'rgba(85, 189, 235, 0.16)',
      textPrimary: '#F3FAFF',
      textSecondary: '#D5E9F7',
      textMuted: '#A9C1D1',
      accentPrimary: '#55BDEB',
      accentSecondary: '#9CE0FF',
      accentContrastText: '#071724',
      secondaryBtnBg: '#194A65',
      secondaryBtnText: '#F3FAFF',
      secondaryBtnBorder: '#246385',
      destructiveColor: '#F87171',
      successColor: '#2DD4BF',
      warningColor: '#FBBF24',
      borderPrimary: '#194A65',
      borderSubtle: '#14384E',
      borderFocus: '#55BDEB',
      fontHeading: "'Outfit', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
      shadowStyle: '0 16px 38px -10px rgba(3, 12, 20, 0.7)'
    }
  },

  // ============================================================================
  // THEME 05 — EMERALD ELITE
  // ============================================================================
  {
    id: 'emerald-elite',
    code: 'THEME 05',
    name: 'Emerald Elite',
    tagline: 'A new standard.',
    description: 'Forest green, emerald, muted mint, and elegant modern typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#0D1915', '#18352A', '#245B45', '#F3FFF8', '#62D6A0'],
    fontPairId: 'manrope-sourcesans',
    fontPairLabel: 'Manrope + Source Sans 3',
    tokens: {
      bgCanvas: '#0D1915',
      bgSurface: '#18352A',
      bgElevated: '#204638',
      bgSubtle: '#132720',
      bgNav: 'rgba(13, 25, 21, 0.95)',
      bgModal: '#18352A',
      bgInput: '#142B22',
      bgAccentTint: 'rgba(98, 214, 160, 0.16)',
      textPrimary: '#F3FFF8',
      textSecondary: '#D6F2E3',
      textMuted: '#A9C8B7',
      accentPrimary: '#62D6A0',
      accentSecondary: '#A3F2CB',
      accentContrastText: '#0D1915',
      secondaryBtnBg: '#245B45',
      secondaryBtnText: '#F3FFF8',
      secondaryBtnBorder: '#2F7358',
      destructiveColor: '#F87171',
      successColor: '#62D6A0',
      warningColor: '#FBBF24',
      borderPrimary: '#245B45',
      borderSubtle: '#1C4435',
      borderFocus: '#62D6A0',
      fontHeading: "'Manrope', system-ui, sans-serif",
      fontBody: "'Source Sans 3', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
      shadowStyle: '0 16px 38px -10px rgba(5, 14, 10, 0.7)'
    }
  },

  // ============================================================================
  // THEME 06 — CRIMSON EDITION
  // ============================================================================
  {
    id: 'crimson-edition',
    code: 'THEME 06',
    name: 'Crimson Edition',
    tagline: 'Bold by design.',
    description: 'Black cherry, burgundy, crimson, and strong editorial typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#1A1013', '#321820', '#702A3A', '#FFF5F5', '#F07883'],
    fontPairId: 'sora-inter',
    fontPairLabel: 'Sora + Inter',
    tokens: {
      bgCanvas: '#1A1013',
      bgSurface: '#321820',
      bgElevated: '#45202B',
      bgSubtle: '#251318',
      bgNav: 'rgba(26, 16, 19, 0.95)',
      bgModal: '#321820',
      bgInput: '#28141A',
      bgAccentTint: 'rgba(240, 120, 131, 0.16)',
      textPrimary: '#FFF5F5',
      textSecondary: '#F2D9DC',
      textMuted: '#C7A9AD',
      accentPrimary: '#F07883',
      accentSecondary: '#FFB3BA',
      accentContrastText: '#1A1013',
      secondaryBtnBg: '#702A3A',
      secondaryBtnText: '#FFF5F5',
      secondaryBtnBorder: '#8C364A',
      destructiveColor: '#FB7185',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      borderPrimary: '#5A2330',
      borderSubtle: '#421B24',
      borderFocus: '#F07883',
      fontHeading: "'Sora', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.625rem',
      cardRadius: '0.875rem',
      shadowStyle: '0 16px 38px -10px rgba(18, 6, 9, 0.72)'
    }
  },

  // ============================================================================
  // THEME 07 — CLEAN WHITE (Light Theme)
  // ============================================================================
  {
    id: 'clean-white',
    code: 'THEME 07',
    name: 'Clean White',
    tagline: 'Clarity. Simplicity. Quality.',
    description: 'Warm white, soft grey, charcoal typography, and restrained black accents.',
    isPreset: true,
    isDefault: false,
    mode: 'light',
    swatches: ['#FFFFFF', '#F5F5F2', '#E5E5E2', '#171717', '#737373'],
    fontPairId: 'inter-manrope',
    fontPairLabel: 'Inter + Manrope',
    tokens: {
      bgCanvas: '#FFFFFF',
      bgSurface: '#F7F7F8',
      bgElevated: '#F1F1F3',
      bgSubtle: '#F5F5F2',
      bgNav: 'rgba(255, 255, 255, 0.96)',
      bgModal: '#FFFFFF',
      bgInput: '#FFFFFF',
      bgAccentTint: 'rgba(23, 23, 25, 0.08)',
      textPrimary: '#171719',
      textSecondary: '#44444C',
      textMuted: '#71717A',
      accentPrimary: '#171719',
      accentSecondary: '#44444C',
      accentContrastText: '#FFFFFF',
      secondaryBtnBg: '#F1F1F3',
      secondaryBtnText: '#171719',
      secondaryBtnBorder: '#E2E2E6',
      destructiveColor: '#DC2626',
      successColor: '#059669',
      warningColor: '#D97706',
      borderPrimary: '#E2E2E6',
      borderSubtle: '#EBEBEF',
      borderFocus: '#171719',
      fontHeading: "'Inter', system-ui, sans-serif",
      fontBody: "'Manrope', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.625rem',
      cardRadius: '0.875rem',
      shadowStyle: '0 8px 24px -8px rgba(23, 23, 23, 0.08)'
    }
  },

  // ============================================================================
  // THEME 08 — ROSE GOLD
  // ============================================================================
  {
    id: 'rose-gold',
    code: 'THEME 08',
    name: 'Rose Gold',
    tagline: 'Elegance with character.',
    description: 'Warm charcoal, dusty rose, rose gold, and sophisticated typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#1B1416', '#302124', '#604047', '#FFF6F4', '#E6A9A1'],
    fontPairId: 'cormorant-inter',
    fontPairLabel: 'Cormorant Garamond + Inter',
    tokens: {
      bgCanvas: '#1B1416',
      bgSurface: '#302124',
      bgElevated: '#422D32',
      bgSubtle: '#251A1D',
      bgNav: 'rgba(27, 20, 22, 0.95)',
      bgModal: '#302124',
      bgInput: '#271B1E',
      bgAccentTint: 'rgba(230, 169, 161, 0.16)',
      textPrimary: '#FFF6F4',
      textSecondary: '#EFE0DD',
      textMuted: '#C9B0AE',
      accentPrimary: '#E6A9A1',
      accentSecondary: '#F7CFC9',
      accentContrastText: '#1B1416',
      secondaryBtnBg: '#604047',
      secondaryBtnText: '#FFF6F4',
      secondaryBtnBorder: '#78515A',
      destructiveColor: '#F87171',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      borderPrimary: '#52363C',
      borderSubtle: '#3D282D',
      borderFocus: '#E6A9A1',
      fontHeading: "'Cormorant Garamond', Georgia, serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
      shadowStyle: '0 16px 36px -10px rgba(15, 9, 11, 0.68)'
    }
  },

  // ============================================================================
  // THEME 09 — ELECTRIC MODERN
  // ============================================================================
  {
    id: 'electric-modern',
    code: 'THEME 09',
    name: 'Electric Modern',
    tagline: 'Built for discovery.',
    description: 'Dark graphite, electric indigo, vibrant blue accents, and bold contemporary typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#101014', '#20202C', '#34365A', '#FFFFFF', '#8E9BFF'],
    fontPairId: 'spacegrotesk-inter',
    fontPairLabel: 'Space Grotesk + Inter',
    tokens: {
      bgCanvas: '#101014',
      bgSurface: '#20202C',
      bgElevated: '#2A2B40',
      bgSubtle: '#171720',
      bgNav: 'rgba(16, 16, 20, 0.95)',
      bgModal: '#20202C',
      bgInput: '#191924',
      bgAccentTint: 'rgba(142, 155, 255, 0.16)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E4E5F5',
      textMuted: '#B5B5C8',
      accentPrimary: '#8E9BFF',
      accentSecondary: '#BFC7FF',
      accentContrastText: '#101014',
      secondaryBtnBg: '#34365A',
      secondaryBtnText: '#FFFFFF',
      secondaryBtnBorder: '#474A7A',
      destructiveColor: '#FB7185',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      borderPrimary: '#34365A',
      borderSubtle: '#282944',
      borderFocus: '#8E9BFF',
      fontHeading: "'Space Grotesk', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.625rem',
      cardRadius: '0.875rem',
      shadowStyle: '0 16px 38px -10px rgba(8, 8, 14, 0.72)'
    }
  },

  // ============================================================================
  // THEME 10 — SANDSTONE PREMIUM
  // ============================================================================
  {
    id: 'sandstone-premium',
    code: 'THEME 10',
    name: 'Sandstone Premium',
    tagline: 'Timeless by nature.',
    description: 'Warm espresso, sandstone, muted bronze, and refined editorial typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#1C1915', '#342C23', '#66523C', '#FAF2E5', '#D7B98C'],
    fontPairId: 'lora-inter',
    fontPairLabel: 'Lora + Inter',
    tokens: {
      bgCanvas: '#1C1915',
      bgSurface: '#342C23',
      bgElevated: '#473B2F',
      bgSubtle: '#26211B',
      bgNav: 'rgba(28, 25, 21, 0.95)',
      bgModal: '#342C23',
      bgInput: '#29231C',
      bgAccentTint: 'rgba(215, 185, 140, 0.16)',
      textPrimary: '#FAF2E5',
      textSecondary: '#E6DAC8',
      textMuted: '#C3B7A5',
      accentPrimary: '#D7B98C',
      accentSecondary: '#EFE0C4',
      accentContrastText: '#1C1915',
      secondaryBtnBg: '#66523C',
      secondaryBtnText: '#FAF2E5',
      secondaryBtnBorder: '#7D654A',
      destructiveColor: '#F87171',
      successColor: '#34D399',
      warningColor: '#FBBF24',
      borderPrimary: '#544432',
      borderSubtle: '#403426',
      borderFocus: '#D7B98C',
      fontHeading: "'Lora', Georgia, serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '0.75rem',
      cardRadius: '1rem',
      shadowStyle: '0 16px 38px -10px rgba(15, 12, 9, 0.7)'
    }
  },

  // ============================================================================
  // THEME 11 — TIKTOK-INSPIRED DESIGN
  // ============================================================================
  {
    id: 'tiktok-inspired',
    code: 'THEME 11',
    name: 'TikTok-Inspired Design',
    tagline: 'Immersive short-form energy.',
    description: 'Pure pitch-black canvas, electric cyan and vibrant crimson-pink dual accents, high-contrast controls, and bold contemporary sans-serif typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#000000', '#121212', '#1F1F23', '#25F4EE', '#FE2C55'],
    fontPairId: 'jakarta-inter',
    fontPairLabel: 'Plus Jakarta Sans + Inter',
    tokens: {
      bgCanvas: '#000000',
      bgSurface: '#121212',
      bgElevated: '#1F1F23',
      bgSubtle: '#161619',
      bgNav: 'rgba(0, 0, 0, 0.95)',
      bgModal: '#121212',
      bgInput: '#18181B',
      bgAccentTint: 'rgba(254, 44, 85, 0.16)',
      textPrimary: '#FFFFFF',
      textSecondary: '#E4E4E7',
      textMuted: '#92929C',
      accentPrimary: '#FE2C55',
      accentSecondary: '#25F4EE',
      accentContrastText: '#FFFFFF',
      secondaryBtnBg: '#1F1F23',
      secondaryBtnText: '#FFFFFF',
      secondaryBtnBorder: '#2F2F35',
      destructiveColor: '#FE2C55',
      successColor: '#25F4EE',
      warningColor: '#FACE15',
      borderPrimary: '#2E2E35',
      borderSubtle: '#1F1F24',
      borderFocus: '#25F4EE',
      fontHeading: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '800',
      bodySize: '15px',
      buttonRadius: '0.5rem',
      cardRadius: '0.875rem',
      shadowStyle: '0 14px 36px -8px rgba(0, 0, 0, 0.85)'
    }
  },

  // ============================================================================
  // THEME 12 — INSTAGRAM-INSPIRED DESIGN
  // ============================================================================
  {
    id: 'instagram-inspired',
    code: 'THEME 12',
    name: 'Instagram-Inspired Design',
    tagline: 'Visual stories & curated grids.',
    description: 'Refined deep obsidian and studio surfaces, crisp minimal dividers, selective warm sunset story rings, and modern social typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#000000', '#121212', '#262626', '#E1306C', '#F77737'],
    fontPairId: 'dmsans-inter',
    fontPairLabel: 'DM Sans + Inter',
    tokens: {
      bgCanvas: '#000000',
      bgSurface: '#121212',
      bgElevated: '#1C1C1E',
      bgSubtle: '#161618',
      bgNav: 'rgba(0, 0, 0, 0.95)',
      bgModal: '#18181A',
      bgInput: '#1C1C1E',
      bgAccentTint: 'rgba(225, 48, 108, 0.15)',
      textPrimary: '#F5F5F5',
      textSecondary: '#D4D4D8',
      textMuted: '#A1A1AA',
      accentPrimary: '#E1306C',
      accentSecondary: '#F77737',
      accentContrastText: '#FFFFFF',
      secondaryBtnBg: '#262626',
      secondaryBtnText: '#F5F5F5',
      secondaryBtnBorder: '#363636',
      destructiveColor: '#ED4956',
      successColor: '#58C322',
      warningColor: '#FCAF45',
      borderPrimary: '#2E2E32',
      borderSubtle: '#1F1F22',
      borderFocus: '#E1306C',
      fontHeading: "'DM Sans', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '14.5px',
      buttonRadius: '0.625rem',
      cardRadius: '0.75rem',
      shadowStyle: '0 12px 32px -10px rgba(0, 0, 0, 0.78)'
    }
  },

  // ============================================================================
  // THEME 13 — YOUTUBE-INSPIRED DESIGN
  // ============================================================================
  {
    id: 'youtube-inspired',
    code: 'THEME 13',
    name: 'YouTube-Inspired Design',
    tagline: 'Premier video discovery & cinema.',
    description: 'Cinema charcoal #0F0F0F backgrounds, elevated #272727 filter chips, signature broadcast red accents, and high-legibility video typography.',
    isPreset: true,
    isDefault: false,
    mode: 'dark',
    swatches: ['#0F0F0F', '#212121', '#272727', '#F1F1F1', '#FF0000'],
    fontPairId: 'outfit-inter',
    fontPairLabel: 'Outfit + Inter',
    tokens: {
      bgCanvas: '#0F0F0F',
      bgSurface: '#181818',
      bgElevated: '#272727',
      bgSubtle: '#212121',
      bgNav: 'rgba(15, 15, 15, 0.96)',
      bgModal: '#212121',
      bgInput: '#121212',
      bgAccentTint: 'rgba(255, 0, 0, 0.16)',
      textPrimary: '#F1F1F1',
      textSecondary: '#CCCCCC',
      textMuted: '#AAAAAA',
      accentPrimary: '#FF0000',
      accentSecondary: '#FF4E45',
      accentContrastText: '#FFFFFF',
      secondaryBtnBg: '#272727',
      secondaryBtnText: '#F1F1F1',
      secondaryBtnBorder: '#3F3F3F',
      destructiveColor: '#FF0000',
      successColor: '#2BA640',
      warningColor: '#F59E0B',
      borderPrimary: '#303030',
      borderSubtle: '#242424',
      borderFocus: '#3EA6FF',
      fontHeading: "'Outfit', system-ui, sans-serif",
      fontBody: "'Inter', system-ui, sans-serif",
      headingWeight: '700',
      bodySize: '15px',
      buttonRadius: '9999px',
      cardRadius: '0.875rem',
      shadowStyle: '0 14px 34px -10px rgba(0, 0, 0, 0.75)'
    }
  }
];

export const DEFAULT_BRANDING_THEME = PRESET_BRANDING_THEMES[0];

/**
 * Light-mode accessible accent overrides for each preset theme so that
 * switching between Light Mode and Dark Mode preserves the active branding
 * theme's visual identity while guaranteeing >= 4.5:1 text contrast on white surfaces.
 */
const LIGHT_MODE_THEME_ACCENTS: Record<
  string,
  { accentPrimary: string; accentSecondary: string; accentContrastText: string; bgAccentTint: string }
> = {
  'acovon-signature': {
    accentPrimary: '#A9864F',
    accentSecondary: '#7A5B2B',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(169, 134, 79, 0.12)'
  },
  'obsidian-luxe': {
    accentPrimary: '#8C7853',
    accentSecondary: '#5E4F34',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(140, 120, 83, 0.12)'
  },
  'royal-purple': {
    accentPrimary: '#6D28D9',
    accentSecondary: '#5B21B6',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(109, 40, 217, 0.10)'
  },
  'ocean-blue': {
    accentPrimary: '#0284C7',
    accentSecondary: '#0369A1',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(2, 132, 199, 0.10)'
  },
  'emerald-elite': {
    accentPrimary: '#059669',
    accentSecondary: '#047857',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(5, 150, 105, 0.10)'
  },
  'crimson-edition': {
    accentPrimary: '#BE123C',
    accentSecondary: '#9F1239',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(190, 18, 60, 0.10)'
  },
  'clean-white': {
    accentPrimary: '#171719',
    accentSecondary: '#44444C',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(23, 23, 25, 0.08)'
  },
  'rose-gold': {
    accentPrimary: '#B85D54',
    accentSecondary: '#8F3F37',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(184, 93, 84, 0.12)'
  },
  'electric-modern': {
    accentPrimary: '#4F46E5',
    accentSecondary: '#3730A3',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(79, 70, 229, 0.10)'
  },
  'sandstone-premium': {
    accentPrimary: '#9A6F38',
    accentSecondary: '#735022',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(154, 111, 56, 0.12)'
  },
  'tiktok-inspired': {
    accentPrimary: '#FE2C55',
    accentSecondary: '#007A78',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(254, 44, 85, 0.10)'
  },
  'instagram-inspired': {
    accentPrimary: '#E1306C',
    accentSecondary: '#C13584',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(225, 48, 108, 0.10)'
  },
  'youtube-inspired': {
    accentPrimary: '#CC0000',
    accentSecondary: '#990000',
    accentContrastText: '#FFFFFF',
    bgAccentTint: 'rgba(204, 0, 0, 0.10)'
  }
};

/**
 * Resolves the complete set of semantic design tokens for a given branding theme
 * and target appearance mode ('dark' | 'light').
 */
export function resolveThemeTokensForMode(
  theme: PlatformBrandingTheme,
  targetMode: 'dark' | 'light'
): BrandingDesignTokens {
  const base = theme.tokens;

  if (targetMode === 'dark') {
    // If the theme itself was defined as light (e.g. Clean White), adapt its surfaces to Dark Mode
    if (theme.mode === 'light') {
      return {
        ...base,
        bgCanvas: '#0B0B0D',
        bgSurface: '#151518',
        bgElevated: '#242429',
        bgSubtle: '#1C1C20',
        bgNav: 'rgba(11, 11, 13, 0.95)',
        bgModal: '#151518',
        bgInput: '#1C1C20',
        bgAccentTint: 'rgba(245, 243, 239, 0.12)',
        textPrimary: '#F5F3EF',
        textSecondary: '#C4C4CC',
        textMuted: '#92929C',
        accentPrimary: '#F5F3EF',
        accentSecondary: '#C4C4CC',
        accentContrastText: '#0B0B0D',
        secondaryBtnBg: '#242429',
        secondaryBtnText: '#F5F3EF',
        secondaryBtnBorder: '#34343A',
        borderPrimary: '#34343A',
        borderSubtle: '#26262C',
        borderFocus: '#F5F3EF',
        shadowStyle: '0 14px 34px -10px rgba(0, 0, 0, 0.55)'
      };
    }

    return {
      ...base,
      accentContrastText: getContrastTextForHex(base.accentPrimary)
    };
  }

  // Target mode === 'light'
  const lightAccent = LIGHT_MODE_THEME_ACCENTS[theme.id] || {
    accentPrimary: base.accentPrimary === '#FFFFFF' ? '#171719' : base.accentPrimary,
    accentSecondary: '#44444C',
    accentContrastText: getContrastTextForHex(
      base.accentPrimary === '#FFFFFF' ? '#171719' : base.accentPrimary
    ),
    bgAccentTint: 'rgba(169, 134, 79, 0.12)'
  };

  return {
    ...base,
    bgCanvas: '#FFFFFF',
    bgSurface: '#FFFFFF',
    bgElevated: '#F1F1F3',
    bgSubtle: '#F7F7F8',
    bgNav: 'rgba(255, 255, 255, 0.96)',
    bgModal: '#FFFFFF',
    bgInput: '#FFFFFF',
    bgAccentTint: lightAccent.bgAccentTint,
    textPrimary: '#171719',
    textSecondary: '#44444C',
    textMuted: '#71717A',
    accentPrimary: lightAccent.accentPrimary,
    accentSecondary: lightAccent.accentSecondary,
    accentContrastText: lightAccent.accentContrastText,
    secondaryBtnBg: '#F1F1F3',
    secondaryBtnText: '#171719',
    secondaryBtnBorder: '#E2E2E6',
    destructiveColor: '#DC2626',
    successColor: '#059669',
    warningColor: '#D97706',
    borderPrimary: '#E2E2E6',
    borderSubtle: '#EBEBEF',
    borderFocus: lightAccent.accentPrimary,
    shadowStyle: '0 10px 28px -10px rgba(23, 23, 25, 0.08)'
  };
}

/**
 * Converts resolved design tokens into a complete map of CSS custom properties.
 */
export function getThemeCssVariables(
  tokens: BrandingDesignTokens,
  mode: 'dark' | 'light' = 'dark'
): Record<string, string> {
  const isLight = mode === 'light';
  return {
    '--bg-page': tokens.bgCanvas,
    '--bg-canvas': isLight ? '#F7F7F8' : tokens.bgCanvas,
    '--bg-surface': tokens.bgSurface,
    '--bg-card': isLight ? '#FFFFFF' : '#1C1C20',
    '--bg-elevated': tokens.bgElevated,
    '--bg-subtle': tokens.bgSubtle,
    '--bg-nav': tokens.bgNav,
    '--bg-sidebar': isLight ? '#F7F7F8' : tokens.bgSurface,
    '--bg-modal': tokens.bgModal,
    '--bg-input': tokens.bgInput,
    '--bg-accent-tint': tokens.bgAccentTint,
    '--text-primary': tokens.textPrimary,
    '--text-heading': isLight ? '#111113' : '#FFFFFF',
    '--text-secondary': tokens.textSecondary,
    '--text-muted': tokens.textMuted,
    '--text-placeholder': isLight ? '#71717A' : '#82828C',
    '--accent-primary': tokens.accentPrimary,
    '--accent-secondary': tokens.accentSecondary,
    '--accent-contrast': tokens.accentContrastText,
    '--gold-accent': tokens.accentSecondary,
    '--gold-bright': tokens.accentPrimary,
    '--btn-secondary-bg': tokens.secondaryBtnBg,
    '--btn-secondary-text': tokens.secondaryBtnText,
    '--btn-secondary-border': tokens.secondaryBtnBorder,
    '--color-destructive': tokens.destructiveColor,
    '--color-success': tokens.successColor,
    '--color-warning': tokens.warningColor,
    '--border-primary': tokens.borderPrimary,
    '--border-Subtle': tokens.borderSubtle,
    '--border-subtle': tokens.borderSubtle,
    '--border-input': isLight ? '#D4D4DA' : tokens.borderPrimary,
    '--border-focus': tokens.borderFocus,
    '--font-heading': tokens.fontHeading,
    '--font-body': tokens.fontBody,
    '--heading-weight': tokens.headingWeight,
    '--body-size': tokens.bodySize,
    '--radius-btn': tokens.buttonRadius,
    '--radius-card': tokens.cardRadius,
    '--shadow-card': tokens.shadowStyle
  };
}

/**
 * Applies the active global branding theme and resolved appearance mode ('dark' | 'light')
 * directly to `document.documentElement` synchronously with zero page reload or flicker.
 */
export function applyThemeToDocument(
  theme: PlatformBrandingTheme,
  resolvedModeOverride?: 'dark' | 'light'
): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const effectiveMode: 'dark' | 'light' = resolvedModeOverride || theme.mode;
  const resolvedTokens = resolveThemeTokensForMode(theme, effectiveMode);
  const vars = getThemeCssVariables(resolvedTokens, effectiveMode);

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  root.setAttribute('data-branding-theme', theme.id);
  root.setAttribute('data-theme-mode', effectiveMode);

  if (effectiveMode === 'light') {
    root.classList.remove('dark');
    root.classList.add('light-theme');
    root.setAttribute('data-theme', 'light');
  } else {
    root.classList.add('dark');
    root.classList.remove('light-theme');
    root.setAttribute('data-theme', 'classic-gold');
  }
}
