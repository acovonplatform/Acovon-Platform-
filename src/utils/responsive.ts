import { useState, useEffect } from 'react';

export type DeviceTier =
  | 'small_mobile'
  | 'standard_mobile'
  | 'large_mobile'
  | 'small_tablet'
  | 'tablet'
  | 'small_desktop'
  | 'desktop'
  | 'large_desktop';

export const BREAKPOINTS = {
  smallMobile: 320,
  standardMobile: 360,
  largeMobile: 390,
  smallTablet: 480,
  tablet: 768,
  smallDesktop: 1024,
  desktop: 1280,
  largeDesktop: 1600
} as const;

export const DEVICE_TIER_RANGES: Record<
  DeviceTier,
  { label: string; min: number; max: number | null }
> = {
  small_mobile: { label: 'Small mobile', min: 320, max: 359 },
  standard_mobile: { label: 'Standard mobile', min: 360, max: 389 },
  large_mobile: { label: 'Large mobile', min: 390, max: 479 },
  small_tablet: { label: 'Small tablet', min: 480, max: 767 },
  tablet: { label: 'Tablet', min: 768, max: 1023 },
  small_desktop: { label: 'Small desktop', min: 1024, max: 1279 },
  desktop: { label: 'Desktop', min: 1280, max: 1599 },
  large_desktop: { label: 'Large desktop', min: 1600, max: null }
};

export function getDeviceTier(width: number): DeviceTier {
  if (width >= BREAKPOINTS.largeDesktop) return 'large_desktop';
  if (width >= BREAKPOINTS.desktop) return 'desktop';
  if (width >= BREAKPOINTS.smallDesktop) return 'small_desktop';
  if (width >= BREAKPOINTS.tablet) return 'tablet';
  if (width >= BREAKPOINTS.smallTablet) return 'small_tablet';
  if (width >= BREAKPOINTS.largeMobile) return 'large_mobile';
  if (width >= BREAKPOINTS.standardMobile) return 'standard_mobile';
  return 'small_mobile';
}

export interface ViewportProfile {
  width: number;
  height: number;
  tier: DeviceTier;
  orientation: 'portrait' | 'landscape';
  isPortrait: boolean;
  isLandscape: boolean;
  isShortLandscape: boolean;
  isTouch: boolean;
  isMobile: boolean;
  isSmallTablet: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
}

function readViewportProfile(): ViewportProfile {
  if (typeof window === 'undefined') {
    return {
      width: 1280,
      height: 800,
      tier: 'desktop',
      orientation: 'landscape',
      isPortrait: false,
      isLandscape: true,
      isShortLandscape: false,
      isTouch: false,
      isMobile: false,
      isSmallTablet: false,
      isTablet: false,
      isDesktop: true,
      isLargeDesktop: false
    };
  }

  const width = window.innerWidth;
  const height = window.visualViewport?.height ? Math.round(window.visualViewport.height) : window.innerHeight;
  const tier = getDeviceTier(width);
  const isLandscape = width > height;
  const isTouch =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(hover: none), (pointer: coarse)').matches
      : 'ontouchstart' in window;

  return {
    width,
    height,
    tier,
    orientation: isLandscape ? 'landscape' : 'portrait',
    isPortrait: !isLandscape,
    isLandscape,
    isShortLandscape: isLandscape && height <= 500,
    isTouch,
    isMobile: width < BREAKPOINTS.tablet,
    isSmallTablet: width >= BREAKPOINTS.smallTablet && width < BREAKPOINTS.tablet,
    isTablet: width >= BREAKPOINTS.tablet && width < BREAKPOINTS.smallDesktop,
    isDesktop: width >= BREAKPOINTS.smallDesktop,
    isLargeDesktop: width >= BREAKPOINTS.largeDesktop
  };
}

export function useViewportProfile(): ViewportProfile {
  const [profile, setProfile] = useState<ViewportProfile>(() => readViewportProfile());

  useEffect(() => {
    const sync = () => setProfile(readViewportProfile());
    sync();
    window.addEventListener('resize', sync);
    window.addEventListener('orientationchange', sync);
    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', sync);
    }
    return () => {
      window.removeEventListener('resize', sync);
      window.removeEventListener('orientationchange', sync);
      if (vv) {
        vv.removeEventListener('resize', sync);
      }
    };
  }, []);

  return profile;
}
