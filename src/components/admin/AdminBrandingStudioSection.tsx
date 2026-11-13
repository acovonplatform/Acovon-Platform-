import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PlatformBrandingTheme, BrandingDesignTokens } from '../../types';
import {
  SUPPORTED_FONT_PAIRINGS,
  DEFAULT_BRANDING_THEME,
  resolveThemeTokensForMode
} from '../../data/brandingThemes';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { AcovonLogoIcon } from '../common/AcovonLogoIcon';
import {
  Palette,
  Sparkles,
  Check,
  Eye,
  RotateCcw,
  Save,
  History,
  Lock,
  ShieldCheck,
  Sliders,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  X,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Bell,
  Wallet,
  Crown,
  Video,
  Send,
  Search,
  BarChart3,
  Sun,
  Moon
} from 'lucide-react';

type PreviewSectionId =
  | 'feed'
  | 'creator_profile'
  | 'fan_profile'
  | 'creator_studio'
  | 'messaging'
  | 'buttons_forms'
  | 'navigation'
  | 'notifications'
  | 'wallet'
  | 'admin_dashboard';

type PreviewViewportSize = 'desktop' | 'tablet' | 'mobile';

export const AdminBrandingStudioSection: React.FC = () => {
  const {
    currentUser,
    users,
    creators,
    posts,
    activeAdminPermissionLevel,
    activeBrandingTheme,
    presetBrandingThemes,
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
    appearanceMode,
    resolvedColorMode,
    setAppearanceMode
  } = useApp();

  const canManageBranding = hasBrandingPermission();

  // Currently selected theme in the studio for inspection & isolated live preview
  const [selectedTheme, setSelectedTheme] = useState<PlatformBrandingTheme>(
    draftBrandingTheme || activeBrandingTheme
  );

  // Active preview tab (10 required sections)
  const [previewSection, setPreviewSection] = useState<PreviewSectionId>('feed');
  const [previewViewport, setPreviewViewport] = useState<PreviewViewportSize>('desktop');
  const [previewRtl, setPreviewRtl] = useState<boolean>(false);
  const [previewColorMode, setPreviewColorMode] = useState<'dark' | 'light'>(
    (draftBrandingTheme || activeBrandingTheme).mode
  );

  // Studio workspace sub-tab
  const [studioTab, setStudioTab] = useState<'gallery' | 'customizer' | 'history' | 'permissions'>('gallery');

  // Customizer state (allows controlled customization without overwriting the 10 presets)
  const [customThemeName, setCustomThemeName] = useState<string>('');
  const [customThemeTagline, setCustomThemeTagline] = useState<string>('');
  const [customTokens, setCustomTokens] = useState<BrandingDesignTokens>(selectedTheme.tokens);
  const [customFontPairId, setCustomFontPairId] = useState<string>(selectedTheme.fontPairId);
  const [customMode, setCustomMode] = useState<'dark' | 'light'>(selectedTheme.mode);

  // Confirmation modal for Apply Theme
  const [showApplyConfirmModal, setShowApplyConfirmModal] = useState<boolean>(false);
  const [publishNotes, setPublishNotes] = useState<string>('');

  // Feedback banner
  const [studioBanner, setStudioBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setStudioBanner({ type, message });
    setTimeout(() => setStudioBanner(null), 4500);
  };

  // Select a theme to preview without affecting the live platform
  const handleSelectThemeForPreview = (themeItem: PlatformBrandingTheme) => {
    setSelectedTheme(themeItem);
    setCustomTokens({ ...themeItem.tokens });
    setCustomFontPairId(themeItem.fontPairId);
    setCustomMode(themeItem.mode);
    setPreviewColorMode(themeItem.mode);
    setCustomThemeName(`${themeItem.name} Custom`);
    setCustomThemeTagline(themeItem.tagline);
  };

  // Construct effective preview theme (incorporating any live customizer tweaks when in customizer mode)
  const effectivePreviewTheme: PlatformBrandingTheme = useMemo(() => {
    if (studioTab === 'customizer') {
      const fontPair =
        SUPPORTED_FONT_PAIRINGS.find(f => f.id === customFontPairId) || SUPPORTED_FONT_PAIRINGS[0];
      return {
        ...selectedTheme,
        name: customThemeName.trim() || `${selectedTheme.name} (Customized)`,
        tagline: customThemeTagline.trim() || selectedTheme.tagline,
        mode: customMode,
        fontPairId: fontPair.id,
        fontPairLabel: fontPair.label,
        swatches: [
          customTokens.bgCanvas,
          customTokens.bgSurface,
          customTokens.bgElevated,
          customTokens.textPrimary,
          customTokens.accentPrimary
        ],
        tokens: {
          ...customTokens,
          fontHeading: fontPair.headingFamily,
          fontBody: fontPair.bodyFamily
        }
      };
    }
    return selectedTheme;
  }, [
    studioTab,
    selectedTheme,
    customThemeName,
    customThemeTagline,
    customMode,
    customFontPairId,
    customTokens
  ]);

  const sampleCreator = creators[0] || {
    id: 'creator_elena',
    name: 'Elena Vance',
    username: 'elenavance',
    category: 'High Fashion & Editorial',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    coverImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    bio: 'Creative director, runway archivist, and couture photographer sharing behind-the-scenes fittings and private critiques.',
    followersCount: 148200,
    subscribersCount: 3420
  };

  const samplePost = posts[0];

  // ============================================================================
  // UNAUTHORIZED ACCESS GUARD (RBAC Enforcement)
  // ============================================================================
  if (!canManageBranding) {
    return (
      <div className="bg-[#121216] border border-[#232329] rounded-2xl p-5 sm:p-8 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6 text-rose-400" />
        </div>
        <div className="space-y-1 max-w-lg mx-auto">
          <div className="text-xs font-mono uppercase tracking-wider text-rose-400">
            Restricted Permission · manage_platform_branding Required
          </div>
          <h2 className="text-lg font-bold text-white">
            Appearance &amp; Branding → Global Branding Studio
          </h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Only Super Administrators and Administrators granted the explicit{' '}
            <code className="text-neutral-200 font-mono">manage_platform_branding</code> permission may access,
            preview, customize, publish, or roll back ACOVON global branding themes.
          </p>
        </div>
      </div>
    );
  }

  const handleConfirmPublish = () => {
    const res = publishBrandingTheme(effectivePreviewTheme, publishNotes.trim() || undefined);
    setShowApplyConfirmModal(false);
    setPublishNotes('');
    if (res.success) {
      setSelectedTheme(effectivePreviewTheme);
      showToast(
        'success',
        `Published "${effectivePreviewTheme.name}" globally across the entire ACOVON platform.`
      );
    } else {
      showToast('error', res.error || 'Failed to publish theme.');
    }
  };

  const handleSaveAsDraft = () => {
    const res = saveBrandingDraft(effectivePreviewTheme);
    if (res.success) {
      showToast(
        'success',
        `Saved "${effectivePreviewTheme.name}" as draft. Live platform branding remains unchanged.`
      );
    } else {
      showToast('error', res.error || 'Unable to save draft.');
    }
  };

  const handleRestorePreviousTheme = (historyId?: string) => {
    const res = rollbackBrandingTheme(historyId);
    if (res.success) {
      showToast('success', 'Restored previous platform branding theme and recorded rollback in Audit Logs.');
    } else {
      showToast('error', res.error || 'Rollback failed.');
    }
  };

  const handleResetToSignature = () => {
    const res = resetToSignatureBrandingTheme();
    if (res.success) {
      setSelectedTheme(DEFAULT_BRANDING_THEME);
      showToast('success', 'Restored ACOVON Signature (THEME 01) as the active global theme.');
    } else {
      showToast('error', res.error || 'Reset failed.');
    }
  };

  const handleSaveNewCustomTheme = () => {
    const nameClean = (customThemeName || `${selectedTheme.name} Custom`).trim();
    const fontPair =
      SUPPORTED_FONT_PAIRINGS.find(f => f.id === customFontPairId) || SUPPORTED_FONT_PAIRINGS[0];
    const newCustom: PlatformBrandingTheme = {
      id: `custom_${Date.now()}`,
      code: `CUSTOM 0${customBrandingThemes.length + 1}`,
      name: nameClean,
      tagline: (customThemeTagline || selectedTheme.tagline).trim(),
      description: `Custom branding theme derived from ${selectedTheme.name} (${fontPair.label}).`,
      isPreset: false,
      basedOnPresetId: selectedTheme.id,
      mode: customMode,
      swatches: [
        customTokens.bgCanvas,
        customTokens.bgSurface,
        customTokens.bgElevated,
        customTokens.textPrimary,
        customTokens.accentPrimary
      ],
      fontPairId: fontPair.id,
      fontPairLabel: fontPair.label,
      tokens: {
        ...customTokens,
        fontHeading: fontPair.headingFamily,
        fontBody: fontPair.bodyFamily
      }
    };

    const res = saveCustomBrandingTheme(newCustom);
    if (res.success) {
      setSelectedTheme(newCustom);
      setStudioTab('gallery');
      showToast(
        'success',
        `Saved custom theme "${newCustom.name}" without overwriting the 13 preset themes.`
      );
    } else {
      showToast('error', res.error || 'Could not save custom theme.');
    }
  };

  const previewSectionsList: { id: PreviewSectionId; label: string }[] = [
    { id: 'feed', label: 'Feed' },
    { id: 'creator_profile', label: 'Creator Profile' },
    { id: 'fan_profile', label: 'Fan Profile' },
    { id: 'creator_studio', label: 'Creator Studio' },
    { id: 'messaging', label: 'Messaging' },
    { id: 'buttons_forms', label: 'Buttons & Forms' },
    { id: 'navigation', label: 'Navigation' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'wallet', label: 'Wallet' },
    { id: 'admin_dashboard', label: 'Admin Dashboard' }
  ];

  const pt = useMemo(
    () => resolveThemeTokensForMode(effectivePreviewTheme, previewColorMode),
    [effectivePreviewTheme, previewColorMode]
  );

  return (
    <div className="space-y-6">
      {/* Studio Toast Notification */}
      {studioBanner && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            studioBanner.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {studioBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{studioBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setStudioBanner(null)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ====================================================================
          TOP HEADER & CURRENT ACTIVE THEME STATUS BAR
      ==================================================================== */}
      <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
              <span>Appearance &amp; Branding</span>
              <span aria-hidden="true">→</span>
              <span className="text-[#fce7b0] font-semibold">Global Branding Studio</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono text-[11px] text-emerald-400">
                manage_platform_branding Verified
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2.5">
              <Palette className="w-5 h-5 text-[#d4af37]" />
              <span>20. Global Branding Studio &amp; 13 Preset Design Themes</span>
            </h2>
            <p className="text-xs text-neutral-400 max-w-3xl">
              Preview, customize, and publish complete visual design systems across the entire ACOVON platform.
              Publishing a theme immediately updates colors, typography, surfaces, borders, and buttons for every Fan, Creator, and Admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Global Appearance Mode Selector (Dark / Light / System Default) */}
            <div className="flex flex-wrap items-center gap-1 bg-[#18181f] border border-[#2e2e38] rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setAppearanceMode('dark')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                  appearanceMode === 'dark' ? 'bg-[#d4af37] text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Active Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setAppearanceMode('light')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                  appearanceMode === 'light' ? 'bg-[#d4af37] text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title="Active Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setAppearanceMode('system')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors ${
                  appearanceMode === 'system' ? 'bg-[#d4af37] text-black font-bold' : 'text-neutral-400 hover:text-white'
                }`}
                title={`System Default (Currently ${resolvedColorMode})`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleRestorePreviousTheme()}
              disabled={brandingHistory.length === 0}
              className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#22222c] border border-[#2e2e38] text-xs font-medium text-neutral-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              title="Roll back to the previously published theme"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Restore Previous Theme</span>
            </button>

            {activeBrandingTheme.id !== DEFAULT_BRANDING_THEME.id && (
              <button
                type="button"
                onClick={handleResetToSignature}
                className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#22222c] border border-[#2e2e38] text-xs font-medium text-neutral-200 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Return to ACOVON Signature</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAsDraft}
              className="px-3.5 py-2 rounded-xl bg-[#18181f] hover:bg-[#22222c] border border-[#2e2e38] text-xs font-medium text-neutral-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              onClick={() => setShowApplyConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm hover:opacity-95 transition-opacity"
            >
              <Check className="w-4 h-4" />
              <span>Apply Theme ({effectivePreviewTheme.name})</span>
            </button>
          </div>
        </div>

        {/* Current Active Theme Summary Bar vs Currently Previewed Theme */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-[#232329]">
          {/* Live Active Theme Card */}
          <div className="p-4 rounded-xl bg-[#18181f] border border-[#272730] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold text-emerald-400">Current Active Live Theme</span>
                <span aria-hidden="true" className="text-neutral-500">·</span>
                <span className="font-mono text-neutral-400">{activeBrandingTheme.code}</span>
                <span aria-hidden="true" className="text-neutral-500">·</span>
                <span className="capitalize text-neutral-400">{activeBrandingTheme.mode} mode</span>
              </div>
              <div className="text-sm font-bold text-white">
                {activeBrandingTheme.name} — <span className="text-[#fce7b0] font-normal">{activeBrandingTheme.tagline}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Fonts: <strong className="text-neutral-200">{activeBrandingTheme.fontPairLabel}</strong>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {activeBrandingTheme.swatches.map((hex, idx) => (
                <div
                  key={`${hex}_${idx}`}
                  title={hex}
                  style={{ backgroundColor: hex }}
                  className="w-7 h-7 rounded-lg border border-white/20 shadow-xs"
                />
              ))}
            </div>
          </div>

          {/* Selected Preview Theme Card */}
          <div className="p-4 rounded-xl bg-[#18181f] border border-[#d4af37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="font-semibold text-[#fce7b0]">Selected in Studio Preview</span>
                <span aria-hidden="true" className="text-neutral-500">·</span>
                <span className="font-mono text-neutral-400">{effectivePreviewTheme.code}</span>
                {effectivePreviewTheme.id === activeBrandingTheme.id ? (
                  <span className="text-emerald-400 font-medium">(Currently Live)</span>
                ) : (
                  <span className="text-amber-300 font-medium">(Preview Only — Not Yet Published)</span>
                )}
              </div>
              <div className="text-sm font-bold text-white">
                {effectivePreviewTheme.name} — <span className="text-[#fce7b0] font-normal">{effectivePreviewTheme.tagline}</span>
              </div>
              <div className="text-[11px] text-neutral-400">
                Fonts: <strong className="text-neutral-200">{effectivePreviewTheme.fontPairLabel}</strong>
                {draftBrandingTheme && (
                  <span className="ml-2 text-neutral-400">
                    · Saved Draft: <strong className="text-neutral-200">{draftBrandingTheme.name}</strong>
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {effectivePreviewTheme.swatches.map((hex, idx) => (
                <div
                  key={`prev_${hex}_${idx}`}
                  title={hex}
                  style={{ backgroundColor: hex }}
                  className="w-7 h-7 rounded-lg border border-white/20 shadow-xs"
                />
              ))}
            </div>
          </div>
        </div>

        {/* Studio Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setStudioTab('gallery')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
              studioTab === 'gallery'
                ? 'bg-[#d4af37] text-black'
                : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#272730]'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme Gallery ({presetBrandingThemes.length} Presets + Custom)</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('customizer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
              studioTab === 'customizer'
                ? 'bg-[#d4af37] text-black'
                : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#272730]'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Theme Details &amp; Custom Branding</span>
          </button>

          <button
            type="button"
            onClick={() => setStudioTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
              studioTab === 'history'
                ? 'bg-[#d4af37] text-black'
                : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#272730]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Theme Publishing History ({brandingHistory.length})</span>
          </button>

          {activeAdminPermissionLevel === 'super_admin' && (
            <button
              type="button"
              onClick={() => setStudioTab('permissions')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap transition-colors ${
                studioTab === 'permissions'
                  ? 'bg-[#d4af37] text-black'
                  : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#272730]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Branding Access Permissions</span>
            </button>
          )}
        </div>
      </div>

      {/* ====================================================================
          TAB 1: 13 PRESET BRANDING THEMES GALLERY + CUSTOM THEMES
      ==================================================================== */}
      {studioTab === 'gallery' && (
        <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">
                Official ACOVON Preset Design Themes ({presetBrandingThemes.length} Curated Identities)
              </h3>
              <p className="text-xs text-neutral-400">
                Includes the 10 signature ACOVON luxury palettes plus 3 platform-inspired design systems (TikTok-Inspired, Instagram-Inspired, and YouTube-Inspired).
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {presetBrandingThemes.length} Presets · {customBrandingThemes.length} Custom Themes
            </span>
          </div>

          {/* 13 Preset Themes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {presetBrandingThemes.map(preset => {
              const isSelected = selectedTheme.id === preset.id;
              const isLive = activeBrandingTheme.id === preset.id;
              const isPlatformInspired =
                preset.id === 'tiktok-inspired' ||
                preset.id === 'instagram-inspired' ||
                preset.id === 'youtube-inspired';

              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectThemeForPreview(preset)}
                  style={{
                    backgroundColor: preset.tokens.bgCanvas,
                    color: preset.tokens.textPrimary,
                    borderColor: isSelected ? preset.tokens.accentPrimary : preset.tokens.borderPrimary
                  }}
                  className={`rounded-2xl p-4 border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 relative ${
                    isSelected ? 'ring-2 ring-[#d4af37]/50 shadow-xl' : 'hover:opacity-95'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Top Row: Code + Mode + Status */}
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span
                        style={{ color: preset.tokens.textMuted }}
                        className="font-mono font-semibold uppercase tracking-wider"
                      >
                        {preset.code} · {preset.mode.toUpperCase()}
                      </span>
                      {isLive ? (
                        <span className="font-semibold text-emerald-400">● Active Live</span>
                      ) : preset.isDefault ? (
                        <span style={{ color: preset.tokens.accentPrimary }} className="font-semibold">
                          Recommended default
                        </span>
                      ) : isPlatformInspired ? (
                        <span style={{ color: preset.tokens.accentSecondary }} className="font-semibold">
                          Platform-Inspired
                        </span>
                      ) : null}
                    </div>

                    {/* Brand Wordmark, Theme Name & Tagline */}
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          style={{
                            color: preset.tokens.textPrimary,
                            fontFamily: preset.tokens.fontHeading
                          }}
                          className="text-base font-bold tracking-tight"
                        >
                          {preset.name}
                        </span>
                        <span
                          style={{
                            color: preset.tokens.textMuted,
                            fontFamily: preset.tokens.fontHeading
                          }}
                          className="text-[10px] font-bold tracking-widest uppercase"
                        >
                          ACOVON
                        </span>
                      </div>
                      <div
                        style={{
                          color: preset.tokens.accentPrimary,
                          fontFamily: preset.tokens.fontHeading
                        }}
                        className="text-xs font-semibold leading-snug mt-0.5"
                      >
                        {preset.tagline}
                      </div>
                    </div>

                    <p
                      style={{
                        color: preset.tokens.textMuted,
                        fontFamily: preset.tokens.fontBody
                      }}
                      className="text-[11px] leading-relaxed"
                    >
                      {preset.description}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-1">
                    {/* Mini Interface Surface & Button Preview */}
                    <div
                      style={{
                        backgroundColor: preset.tokens.bgSurface,
                        borderColor: preset.tokens.borderPrimary,
                        borderRadius: preset.tokens.buttonRadius
                      }}
                      className="p-2 border flex items-center justify-between text-[10px]"
                    >
                      <span style={{ fontFamily: preset.tokens.fontHeading, color: preset.tokens.textPrimary }} className="font-semibold">
                        Surface &amp; CTA
                      </span>
                      <span
                        style={{
                          backgroundColor: preset.tokens.accentPrimary,
                          color: preset.tokens.accentContrastText,
                          borderRadius: preset.tokens.buttonRadius
                        }}
                        className="px-2 py-0.5 font-bold text-[9px]"
                      >
                        Action
                      </span>
                    </div>

                    {/* 5 Swatch Bar */}
                    <div className="flex items-center gap-1">
                      {preset.swatches.map((hex, i) => (
                        <div
                          key={`${preset.id}_sw_${i}`}
                          style={{
                            backgroundColor: hex,
                            borderColor: preset.mode === 'light' ? '#D0D0D0' : 'rgba(255,255,255,0.12)'
                          }}
                          className="flex-1 h-[22px] rounded-md border"
                          title={hex}
                        />
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span
                        style={{ color: preset.tokens.textMuted }}
                        className="text-[10px] truncate"
                      >
                        Fonts: {preset.fontPairLabel}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectThemeForPreview(preset);
                          }}
                          style={{
                            backgroundColor: preset.tokens.secondaryBtnBg,
                            color: preset.tokens.secondaryBtnText,
                            borderColor: preset.tokens.secondaryBtnBorder
                          }}
                          className="px-2.5 py-1 rounded-md text-[10px] font-semibold border cursor-pointer"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectThemeForPreview(preset);
                            setShowApplyConfirmModal(true);
                          }}
                          style={{
                            backgroundColor: preset.tokens.accentPrimary,
                            color: preset.tokens.accentContrastText
                          }}
                          className="px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer"
                        >
                          {isLive ? 'Active' : 'Apply Theme'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Saved Custom Themes Section */}
          {customBrandingThemes.length > 0 && (
            <div className="pt-4 border-t border-[#232329] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <h4 className="text-sm font-bold text-white">
                  Saved Custom Branding Themes ({customBrandingThemes.length})
                </h4>
                <span className="text-[11px] text-neutral-400">
                  Custom themes are stored separately and never overwrite the 13 official presets
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customBrandingThemes.map(custom => {
                  const isSelected = selectedTheme.id === custom.id;
                  const isLive = activeBrandingTheme.id === custom.id;
                  return (
                    <div
                      key={custom.id}
                      onClick={() => handleSelectThemeForPreview(custom)}
                      style={{
                        backgroundColor: custom.tokens.bgCanvas,
                        color: custom.tokens.textPrimary,
                        borderColor: isSelected ? custom.tokens.accentPrimary : custom.tokens.borderPrimary
                      }}
                      className="rounded-2xl p-4 border-2 cursor-pointer space-y-3"
                    >
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: custom.tokens.textMuted }} className="font-mono uppercase">
                          {custom.code} · Custom Theme
                        </span>
                        <div className="flex items-center gap-2">
                          {isLive && <span className="text-emerald-400 font-bold">● Live</span>}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const res = deleteCustomBrandingTheme(custom.id);
                              if (res.success) showToast('success', `Deleted custom theme "${custom.name}".`);
                            }}
                            className="text-rose-400 hover:text-rose-300 cursor-pointer"
                            title="Delete custom theme"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div>
                        <div
                          style={{ fontFamily: custom.tokens.fontHeading, color: custom.tokens.textPrimary }}
                          className="text-base font-bold"
                        >
                          {custom.name}
                        </div>
                        <div
                          style={{ color: custom.tokens.accentPrimary }}
                          className="text-xs font-medium"
                        >
                          {custom.tagline}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {custom.swatches.map((hex, i) => (
                          <div
                            key={`${custom.id}_sw_${i}`}
                            style={{ backgroundColor: hex }}
                            className="flex-1 h-5 rounded border border-white/15"
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[10px]">
                        <span style={{ color: custom.tokens.textMuted }}>
                          Fonts: {custom.fontPairLabel}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectThemeForPreview(custom);
                            setShowApplyConfirmModal(true);
                          }}
                          style={{
                            backgroundColor: custom.tokens.accentPrimary,
                            color: custom.tokens.accentContrastText
                          }}
                          className="px-2.5 py-1 rounded font-bold cursor-pointer"
                        >
                          Apply Theme
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          TAB 2: THEME DETAILS & CONTROLLED CUSTOMIZATION STUDIO
      ==================================================================== */}
      {studioTab === 'customizer' && (
        <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white">
                Theme Design Tokens &amp; Controlled Custom Branding
              </h3>
              <p className="text-xs text-neutral-400">
                Inspect centralized tokens for <strong>{selectedTheme.name}</strong> or customize accent colors, backgrounds, font pairings, corner radius, and light/dark mode to save as a new Custom Theme.
              </p>
            </div>
            <button
              type="button"
              onClick={handleSaveNewCustomTheme}
              className="px-4 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Save as New Custom Theme</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* Column 1: Identity & Typography */}
            <div className="p-4 rounded-xl bg-[#18181f] border border-[#272730] space-y-4">
              <div className="font-bold text-white text-sm">1. Identity &amp; Typography Pairing</div>

              <div>
                <label className="block text-neutral-400 mb-1">Custom Theme Title</label>
                <input
                  type="text"
                  value={customThemeName}
                  onChange={e => setCustomThemeName(e.target.value)}
                  placeholder={`${selectedTheme.name} Custom`}
                  className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Brand Tagline</label>
                <input
                  type="text"
                  value={customThemeTagline}
                  onChange={e => setCustomThemeTagline(e.target.value)}
                  placeholder={selectedTheme.tagline}
                  className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-400 mb-1">Supported Font Combination</label>
                <select
                  value={customFontPairId}
                  onChange={e => setCustomFontPairId(e.target.value)}
                  className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                >
                  {SUPPORTED_FONT_PAIRINGS.map(fp => (
                    <option key={fp.id} value={fp.id}>
                      {fp.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                <div>
                  <label className="block text-neutral-400 mb-1">Presentation Mode</label>
                  <select
                    value={customMode}
                    onChange={e => setCustomMode(e.target.value as 'dark' | 'light')}
                    className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="dark">Dark Presentation</option>
                    <option value="light">Light Presentation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-neutral-400 mb-1">Button Corner Radius</label>
                  <select
                    value={customTokens.buttonRadius}
                    onChange={e => setCustomTokens(prev => ({ ...prev, buttonRadius: e.target.value }))}
                    className="w-full bg-[#121216] border border-[#2e2e38] rounded-xl px-3 py-2 text-white"
                  >
                    <option value="0.375rem">Sharp (6px)</option>
                    <option value="0.625rem">Refined (10px)</option>
                    <option value="0.75rem">Standard (12px)</option>
                    <option value="1rem">Rounded (16px)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Column 2: Background & Surface Colors */}
            <div className="p-4 rounded-xl bg-[#18181f] border border-[#272730] space-y-3">
              <div className="font-bold text-white text-sm">2. Surface &amp; Background Tokens</div>

              {[
                { key: 'bgCanvas', label: 'Primary Canvas Background' },
                { key: 'bgSurface', label: 'Secondary / Card Surface' },
                { key: 'bgElevated', label: 'Elevated / Input Surface' },
                { key: 'borderPrimary', label: 'Primary Hairline Border' }
              ].map(item => (
                <div key={item.key} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-neutral-300">{item.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="color"
                      value={(customTokens as any)[item.key]}
                      onChange={e =>
                        setCustomTokens(prev => ({ ...prev, [item.key]: e.target.value }))
                      }
                      className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={(customTokens as any)[item.key]}
                      onChange={e =>
                        setCustomTokens(prev => ({ ...prev, [item.key]: e.target.value }))
                      }
                      className="w-20 xs:w-24 bg-[#121216] border border-[#2e2e38] rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Column 3: Accent, Text & Button Tokens */}
            <div className="p-4 rounded-xl bg-[#18181f] border border-[#272730] space-y-3">
              <div className="font-bold text-white text-sm">3. Accent, Text &amp; Button Tokens</div>

              {[
                { key: 'accentPrimary', label: 'Primary Brand Accent' },
                { key: 'accentSecondary', label: 'Secondary Highlight Accent' },
                { key: 'textPrimary', label: 'Primary Heading / Body Text' },
                { key: 'textMuted', label: 'Muted Metadata Text' },
                { key: 'secondaryBtnBg', label: 'Secondary Button Surface' }
              ].map(item => (
                <div key={item.key} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-neutral-300">{item.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="color"
                      value={(customTokens as any)[item.key]}
                      onChange={e =>
                        setCustomTokens(prev => ({ ...prev, [item.key]: e.target.value }))
                      }
                      className="w-7 h-7 rounded cursor-pointer border border-white/20 bg-transparent"
                    />
                    <input
                      type="text"
                      value={(customTokens as any)[item.key]}
                      onChange={e =>
                        setCustomTokens(prev => ({ ...prev, [item.key]: e.target.value }))
                      }
                      className="w-20 xs:w-24 bg-[#121216] border border-[#2e2e38] rounded-lg px-2 py-1 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 3: THEME PUBLISHING HISTORY & ROLLBACK
      ==================================================================== */}
      {studioTab === 'history' && (
        <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-white">
                Global Branding Publishing History &amp; Rollback Ledger
              </h3>
              <p className="text-xs text-neutral-400">
                Complete audit trail of every global theme publication and rollback. Restore any previous configuration with one click.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetToSignature}
              className="px-3.5 py-2 rounded-xl bg-[#18181f] border border-[#2e2e38] text-xs font-semibold text-[#fce7b0] cursor-pointer"
            >
              Restore Default (ACOVON Signature)
            </button>
          </div>

          <div className="space-y-2.5">
            {brandingHistory.map(record => (
              <div
                key={record.id}
                className="p-4 rounded-xl bg-[#18181f] border border-[#272730] flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">
                      {record.previousThemeName} → {record.newThemeName}
                    </span>
                    <span className="text-neutral-500" aria-hidden="true">·</span>
                    <span className="font-mono text-[11px] uppercase text-[#fce7b0]">
                      {record.actionType.replace('_', ' ')}
                    </span>
                    <span className="text-neutral-500" aria-hidden="true">·</span>
                    <span className="font-mono text-neutral-400 tabular-nums">{record.timestamp}</span>
                  </div>
                  <div className="text-neutral-400">
                    Authorized by <strong className="text-neutral-200">{record.adminName}</strong> (ID: <code className="font-mono">{record.adminId}</code> · Role: {record.adminRole})
                  </div>
                  {record.notes && <div className="text-neutral-300">{record.notes}</div>}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleSelectThemeForPreview(record.snapshotTheme)}
                    className="px-3 py-1.5 rounded-lg bg-[#121216] border border-[#2e2e38] text-neutral-200 hover:text-white cursor-pointer"
                  >
                    Preview Snapshot
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRestorePreviousTheme(record.id)}
                    className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-black font-semibold cursor-pointer"
                  >
                    Restore {record.previousThemeName}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 4: BRANDING ACCESS PERMISSIONS (Super Admin Governance)
      ==================================================================== */}
      {studioTab === 'permissions' && activeAdminPermissionLevel === 'super_admin' && (
        <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Global Branding Permission Governance (manage_platform_branding)
            </h3>
            <p className="text-xs text-neutral-400">
              Super Administrators can explicitly grant or revoke <code className="font-mono text-neutral-200">manage_platform_branding</code> access for individual Admin accounts. Fans and Creators are permanently excluded.
            </p>
          </div>

          <div className="space-y-2.5">
            {Object.values(users)
              .filter(u => u.role === 'admin' || u.role === 'moderator' || u.adminPermissionLevel)
              .map(adm => {
                const isSuper = adm.adminPermissionLevel === 'super_admin';
                const hasExplicitBranding =
                  isSuper || (adm.adminPermissions || []).includes('manage_platform_branding');

                return (
                  <div
                    key={adm.id}
                    className="p-4 rounded-xl bg-[#18181f] border border-[#272730] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={adm.avatar}
                        alt={adm.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover border border-[#2e2e38]"
                      />
                      <div>
                        <div className="font-bold text-white">
                          {adm.name} <span className="text-neutral-400 font-normal">@{adm.username}</span>
                        </div>
                        <div className="text-neutral-400 text-[11px]">
                          Role: <span className="font-mono">{adm.adminPermissionLevel || adm.role}</span> · Branding Access:{' '}
                          <strong className={hasExplicitBranding ? 'text-emerald-400' : 'text-neutral-500'}>
                            {hasExplicitBranding ? 'Authorized (manage_platform_branding)' : 'No Access'}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isSuper ? (
                        <span className="text-[11px] font-mono text-[#fce7b0]">
                          Super Admin (Permanent Authority)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const res = toggleAdminBrandingPermission(adm.id);
                            if (res.success) {
                              showToast(
                                'success',
                                `${res.granted ? 'Granted' : 'Revoked'} manage_platform_branding for ${adm.name}.`
                              );
                            } else {
                              showToast('error', res.error || 'Permission update failed.');
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-xl font-semibold cursor-pointer ${
                            hasExplicitBranding
                              ? 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
                              : 'bg-[#d4af37] text-black'
                          }`}
                        >
                          {hasExplicitBranding ? 'Revoke Branding Permission' : 'Grant manage_platform_branding'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* ====================================================================
          INTERACTIVE LIVE THEME PREVIEW SANDBOX (ALL 10 PLATFORM SURFACES)
          Scoped exclusively to this container — never alters live platform until published!
      ==================================================================== */}
      <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#d4af37]" />
              <h3 className="text-base font-bold text-white">
                Interactive Live Theme Preview — {effectivePreviewTheme.name} ({effectivePreviewTheme.code})
              </h3>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Isolated sandbox previewing how <strong>{effectivePreviewTheme.name}</strong> styles all 10 major platform areas. Previewing here does not affect the live platform until you click <strong>Apply Theme</strong>.
            </p>
          </div>

          {/* Preview Mode (Dark / Light), Viewport Size & RTL Simulation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 bg-[#18181f] border border-[#272730] rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewColorMode('dark')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                  previewColorMode === 'dark' ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Preview Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewColorMode('light')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                  previewColorMode === 'light' ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Preview Light</span>
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-[#18181f] border border-[#272730] rounded-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => setPreviewViewport('desktop')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                  previewViewport === 'desktop' ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('tablet')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                  previewViewport === 'tablet' ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Tablet</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewViewport('mobile')}
                className={`px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer ${
                  previewViewport === 'mobile' ? 'bg-[#d4af37] text-black font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (375px)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setPreviewRtl(prev => !prev)}
              className={`px-3 py-1.5 rounded-xl border text-xs flex items-center gap-1.5 cursor-pointer ${
                previewRtl
                  ? 'bg-[#d4af37] text-black font-semibold border-[#d4af37]'
                  : 'bg-[#18181f] text-neutral-300 border-[#272730]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{previewRtl ? 'RTL (Arabic Layout)' : 'LTR (Standard Layout)'}</span>
            </button>
          </div>
        </div>

        {/* 10 Preview Surface Switcher Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 border-b border-[#232329]">
          {previewSectionsList.map(sec => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setPreviewSection(sec.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap cursor-pointer transition-colors ${
                previewSection === sec.id
                  ? 'bg-[#d4af37] text-black font-bold'
                  : 'bg-[#18181f] text-neutral-300 hover:text-white'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Scoped Preview Frame */}
        <div className="flex justify-center bg-[#09090b] p-3 sm:p-6 rounded-2xl border border-[#232329] overflow-x-auto">
          <div
            dir={previewRtl ? 'rtl' : 'ltr'}
            style={{
              backgroundColor: pt.bgCanvas,
              color: pt.textPrimary,
              fontFamily: pt.fontBody,
              borderColor: pt.borderPrimary,
              borderRadius: pt.cardRadius,
              boxShadow: pt.shadowStyle,
              width:
                previewViewport === 'mobile'
                  ? '375px'
                  : previewViewport === 'tablet'
                  ? '768px'
                  : '100%'
            }}
            className="border transition-all duration-200 overflow-hidden max-w-full"
          >
            {/* Preview Top Navigation Header */}
            <div
              style={{
                backgroundColor: pt.bgSurface,
                borderColor: pt.borderPrimary
              }}
              className="px-4 py-3 border-b flex flex-wrap items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5">
                <AcovonLogoIcon size="xs" />
                <span
                  style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }}
                  className="text-base font-bold tracking-wider"
                >
                  ACOVON
                </span>
                <span style={{ color: pt.textMuted }} className="text-[11px] hidden sm:inline">
                  {effectivePreviewTheme.name} · {effectivePreviewTheme.fontPairLabel}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  style={{
                    backgroundColor: pt.bgAccentTint,
                    color: pt.accentPrimary,
                    borderRadius: pt.buttonRadius
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold"
                >
                  {previewSectionsList.find(s => s.id === previewSection)?.label}
                </span>
                <button
                  type="button"
                  style={{
                    backgroundColor: pt.accentPrimary,
                    color: pt.accentContrastText,
                    borderRadius: pt.buttonRadius
                  }}
                  className="px-3 py-1 text-[11px] font-bold"
                >
                  Subscribe
                </button>
              </div>
            </div>

            {/* Scoped Preview Content Body */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* 1. FEED PREVIEW */}
              {previewSection === 'feed' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {['All Activity', 'For You', 'Following', 'Subscribed', 'Free Posts', 'Pay-To-View Vault'].map(
                      (tab, idx) => (
                        <span
                          key={tab}
                          style={{
                            backgroundColor: idx === 0 ? pt.accentPrimary : pt.bgSurface,
                            color: idx === 0 ? pt.accentContrastText : pt.textSecondary,
                            borderColor: pt.borderPrimary,
                            borderRadius: pt.buttonRadius
                          }}
                          className="px-3 py-1 text-xs font-semibold border whitespace-nowrap"
                        >
                          {tab}
                        </span>
                      )
                    )}
                  </div>

                  {/* Platform-Inspired Visual Highlights for Themes 11, 12, 13 */}
                  {effectivePreviewTheme.id === 'tiktok-inspired' && (
                    <div
                      style={{
                        backgroundColor: '#000000',
                        borderColor: pt.borderPrimary,
                        borderRadius: pt.cardRadius
                      }}
                      className="relative border overflow-hidden p-4 flex items-end justify-between min-h-[210px]"
                    >
                      <img
                        src={sampleCreator.coverImage}
                        alt={sampleCreator.name}
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover opacity-55"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                      <div className="relative z-10 space-y-1.5 max-w-full sm:max-w-md min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-extrabold text-white">{sampleCreator.name}</span>
                          <VerifiedBadge forceShow size="xs" />
                          <span className="text-xs text-white/75">@{sampleCreator.username}</span>
                          <span
                            style={{ backgroundColor: '#FE2C55', color: '#FFFFFF' }}
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                          >
                            Subscribe
                          </span>
                        </div>
                        <p className="text-xs text-white/90">
                          Full-screen vertical short-form video presentation with floating right-rail engagement controls &amp; dual cyan/red accents.
                        </p>
                      </div>
                      <div className="relative z-10 flex flex-col items-center gap-3 text-white text-[10px] font-bold">
                        <div className="flex flex-col items-center">
                          <Heart className="w-5 h-5 text-[#FE2C55]" />
                          <span>42.8K</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <MessageCircle className="w-5 h-5 text-[#25F4EE]" />
                          <span>1,240</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <Bookmark className="w-5 h-5 text-white" />
                          <span>8.9K</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {effectivePreviewTheme.id === 'instagram-inspired' && (
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                      {creators.slice(0, 5).map(cr => (
                        <div key={cr.id} className="flex flex-col items-center gap-1 shrink-0">
                          <div
                            style={{
                              background:
                                'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                            }}
                            className="p-0.5 rounded-full"
                          >
                            <img
                              src={cr.avatar}
                              alt={cr.name}
                              referrerPolicy="no-referrer"
                              className="w-12 h-12 rounded-full object-cover border-2 border-black"
                            />
                          </div>
                          <span style={{ color: pt.textSecondary }} className="text-[10px] truncate max-w-[64px]">
                            {cr.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {effectivePreviewTheme.id === 'youtube-inspired' && (
                    <div
                      style={{
                        backgroundColor: pt.bgSurface,
                        borderColor: pt.borderPrimary,
                        borderRadius: pt.cardRadius
                      }}
                      className="border overflow-hidden"
                    >
                      <div className="relative h-40 w-full bg-black">
                        <img
                          src={sampleCreator.coverImage}
                          alt={sampleCreator.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/90 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                          14:28 · 4K HDR
                        </div>
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20">
                          <div style={{ backgroundColor: '#FF0000' }} className="h-full w-2/3" />
                        </div>
                      </div>
                      <div className="p-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <img
                            src={sampleCreator.avatar}
                            alt={sampleCreator.name}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-full object-cover mt-0.5"
                          />
                          <div>
                            <div style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }} className="text-xs font-bold">
                              Paris Couture Week Masterclass &amp; Backstage Documentary
                            </div>
                            <div style={{ color: pt.textMuted }} className="text-[11px] flex items-center gap-1">
                              <span>{sampleCreator.name}</span>
                              <VerifiedBadge forceShow size="xs" />
                              <span>· 84K views · 3 hours ago</span>
                            </div>
                          </div>
                        </div>
                        <span
                          style={{ backgroundColor: '#FF0000', color: '#FFFFFF' }}
                          className="px-3 py-1 rounded-full text-[11px] font-bold shrink-0"
                        >
                          Subscribe
                        </span>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      backgroundColor: pt.bgSurface,
                      borderColor: pt.borderPrimary,
                      borderRadius: pt.cardRadius
                    }}
                    className="p-4 border space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={sampleCreator.avatar}
                          alt={sampleCreator.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span
                              style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }}
                              className="font-bold text-sm"
                            >
                              {sampleCreator.name}
                            </span>
                            <VerifiedBadge forceShow size="xs" />
                          </div>
                          <div style={{ color: pt.textMuted }} className="text-xs">
                            @{sampleCreator.username} · 2h ago
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          backgroundColor: pt.accentPrimary,
                          color: pt.accentContrastText,
                          borderRadius: pt.buttonRadius
                        }}
                        className="px-3 py-1.5 text-xs font-bold"
                      >
                        Subscribe · $14.99
                      </button>
                    </div>

                    <p style={{ color: pt.textSecondary }} className="text-xs sm:text-sm leading-relaxed">
                      {samplePost?.content ||
                        'Exclusive Paris Atelier behind-the-scenes couture lookbook and private evening fitting.'}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: pt.borderSubtle }}>
                      <div className="flex items-center gap-4 text-xs" style={{ color: pt.textSecondary }}>
                        <span className="inline-flex items-center gap-1">
                          <Heart className="w-4 h-4" style={{ color: pt.accentPrimary }} /> 1.4k
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" /> 184
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Share2 className="w-4 h-4" /> Share
                        </span>
                      </div>
                      <Bookmark className="w-4 h-4" style={{ color: pt.accentPrimary }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CREATOR PROFILE PREVIEW */}
              {previewSection === 'creator_profile' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="border overflow-hidden"
                >
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${pt.bgElevated}, ${pt.accentPrimary}33)`
                    }}
                    className="h-24 w-full"
                  />
                  <div className="p-4 -mt-8 space-y-3">
                    <div className="flex items-end justify-between gap-3 flex-wrap">
                      <img
                        src={sampleCreator.avatar}
                        alt={sampleCreator.name}
                        referrerPolicy="no-referrer"
                        style={{ borderColor: pt.bgSurface }}
                        className="w-16 h-16 rounded-2xl object-cover border-4"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          style={{
                            backgroundColor: pt.secondaryBtnBg,
                            color: pt.secondaryBtnText,
                            borderColor: pt.secondaryBtnBorder,
                            borderRadius: pt.buttonRadius
                          }}
                          className="px-3 py-1.5 text-xs font-semibold border"
                        >
                          Follow
                        </button>
                        <button
                          type="button"
                          style={{
                            backgroundColor: pt.accentPrimary,
                            color: pt.accentContrastText,
                            borderRadius: pt.buttonRadius
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold"
                        >
                          Subscribe $14.99/mo
                        </button>
                      </div>
                    </div>
                    <div>
                      <h4
                        style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }}
                        className="text-base font-bold flex items-center gap-1.5"
                      >
                        <span>{sampleCreator.name}</span>
                        <VerifiedBadge forceShow size="xs" />
                      </h4>
                      <p style={{ color: pt.textMuted }} className="text-xs">
                        @{sampleCreator.username} · {sampleCreator.category} · 148.2k followers
                      </p>
                    </div>
                    <p style={{ color: pt.textSecondary }} className="text-xs leading-relaxed">
                      {sampleCreator.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* 3. FAN PROFILE PREVIEW */}
              {previewSection === 'fan_profile' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border space-y-4"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-3">
                      <div
                        style={{ backgroundColor: pt.bgElevated, color: pt.accentPrimary }}
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                      >
                        JC
                      </div>
                      <div>
                        <div style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }} className="font-bold text-sm">
                          Jordan Cross
                        </div>
                        <div style={{ color: pt.textMuted }} className="text-xs">
                          @jordancross · Fan Member · 4 Active Subscriptions
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        backgroundColor: pt.secondaryBtnBg,
                        color: pt.secondaryBtnText,
                        borderColor: pt.secondaryBtnBorder,
                        borderRadius: pt.buttonRadius
                      }}
                      className="px-3 py-1.5 text-xs font-semibold border"
                    >
                      Edit Fan Profile
                    </button>
                  </div>
                </div>
              )}

              {/* 4. CREATOR STUDIO PREVIEW */}
              {previewSection === 'creator_studio' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: 'Monthly Revenue', value: '$38,420.00', sub: '+18.4% this month' },
                    { label: 'Active Subscribers', value: '3,420', sub: '94% retention rate' },
                    { label: 'PPV & Custom Video', value: '$9,150.00', sub: '42 orders completed' }
                  ].map(stat => (
                    <div
                      key={stat.label}
                      style={{
                        backgroundColor: pt.bgSurface,
                        borderColor: pt.borderPrimary,
                        borderRadius: pt.cardRadius
                      }}
                      className="p-4 border space-y-1"
                    >
                      <div style={{ color: pt.textMuted }} className="text-xs">
                        {stat.label}
                      </div>
                      <div
                        style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }}
                        className="text-lg font-bold font-mono tabular-nums"
                      >
                        {stat.value}
                      </div>
                      <div style={{ color: pt.accentPrimary }} className="text-[11px] font-medium">
                        {stat.sub}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 5. MESSAGING PREVIEW */}
              {previewSection === 'messaging' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b" style={{ borderColor: pt.borderSubtle }}>
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }} className="font-bold text-xs">
                        {sampleCreator.name}
                      </span>
                      <VerifiedBadge forceShow size="xs" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        style={{ backgroundColor: pt.bgElevated, color: pt.accentPrimary }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      >
                        Video Call
                      </span>
                      <span
                        style={{ backgroundColor: pt.bgElevated, color: pt.accentPrimary }}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      >
                        Custom Video
                      </span>
                      <span
                        style={{ backgroundColor: pt.accentPrimary, color: pt.accentContrastText }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold"
                      >
                        Send Tip
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div
                      style={{ backgroundColor: pt.bgElevated, color: pt.textPrimary, borderRadius: pt.buttonRadius }}
                      className="p-2.5 max-w-xs"
                    >
                      Welcome to my VIP patron circle! Let me know what you thought of the new Paris lookbook.
                    </div>
                    <div
                      style={{
                        backgroundColor: pt.accentPrimary,
                        color: pt.accentContrastText,
                        borderRadius: pt.buttonRadius
                      }}
                      className="p-2.5 max-w-xs ml-auto font-medium"
                    >
                      The lighting and cinematography were extraordinary!
                    </div>
                  </div>
                </div>
              )}

              {/* 6. BUTTONS & FORMS PREVIEW */}
              {previewSection === 'buttons_forms' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      style={{
                        backgroundColor: pt.accentPrimary,
                        color: pt.accentContrastText,
                        borderRadius: pt.buttonRadius
                      }}
                      className="px-4 py-2 text-xs font-bold"
                    >
                      Primary Action Button
                    </button>
                    <button
                      type="button"
                      style={{
                        backgroundColor: pt.secondaryBtnBg,
                        color: pt.secondaryBtnText,
                        borderColor: pt.secondaryBtnBorder,
                        borderRadius: pt.buttonRadius
                      }}
                      className="px-4 py-2 text-xs font-semibold border"
                    >
                      Secondary Action
                    </button>
                    <button
                      type="button"
                      style={{
                        backgroundColor: pt.destructiveColor,
                        color: '#FFFFFF',
                        borderRadius: pt.buttonRadius
                      }}
                      className="px-4 py-2 text-xs font-semibold"
                    >
                      Destructive Action
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      readOnly
                      value="Standard Input Surface & Border"
                      style={{
                        backgroundColor: pt.bgInput,
                        color: pt.textPrimary,
                        borderColor: pt.borderPrimary,
                        borderRadius: pt.buttonRadius
                      }}
                      className="px-3 py-2 text-xs border"
                    />
                    <input
                      type="text"
                      readOnly
                      value="Focused Input State (Accent Ring)"
                      style={{
                        backgroundColor: pt.bgInput,
                        color: pt.textPrimary,
                        borderColor: pt.borderFocus,
                        borderRadius: pt.buttonRadius
                      }}
                      className="px-3 py-2 text-xs border-2"
                    />
                  </div>
                </div>
              )}

              {/* 7. NAVIGATION PREVIEW */}
              {previewSection === 'navigation' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border flex items-center justify-around text-xs"
                >
                  {['Feed', 'Explore', 'Live', 'Messages', 'Profile'].map((nav, i) => (
                    <div
                      key={nav}
                      style={{
                        color: i === 0 ? pt.accentPrimary : pt.textMuted,
                        fontWeight: i === 0 ? 700 : 500
                      }}
                      className="flex flex-col items-center gap-1"
                    >
                      <span>{nav}</span>
                      {i === 0 && (
                        <span
                          style={{ backgroundColor: pt.accentPrimary }}
                          className="w-5 h-0.5 rounded-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* 8. NOTIFICATIONS PREVIEW */}
              {previewSection === 'notifications' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border space-y-2.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }} className="font-bold">
                      Notifications
                    </span>
                    <span style={{ color: pt.accentPrimary }} className="font-semibold">
                      Mark all read
                    </span>
                  </div>
                  <div
                    style={{ backgroundColor: pt.bgElevated, borderColor: pt.borderSubtle, borderRadius: pt.buttonRadius }}
                    className="p-3 border flex items-center gap-3"
                  >
                    <Bell className="w-4 h-4 shrink-0" style={{ color: pt.accentPrimary }} />
                    <div>
                      <div style={{ color: pt.textPrimary }} className="font-semibold">
                        Elena Vance published a new subscriber post
                      </div>
                      <div style={{ color: pt.textMuted }} className="text-[11px]">
                        2 minutes ago · Exclusive Gallery
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. WALLET PREVIEW */}
              {previewSection === 'wallet' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div style={{ color: pt.textMuted }} className="text-xs">
                      ACOVON Available Wallet Balance
                    </div>
                    <div
                      style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }}
                      className="text-2xl font-bold font-mono tabular-nums"
                    >
                      $245.50 USD
                    </div>
                  </div>
                  <button
                    type="button"
                    style={{
                      backgroundColor: pt.accentPrimary,
                      color: pt.accentContrastText,
                      borderRadius: pt.buttonRadius
                    }}
                    className="px-4 py-2 text-xs font-bold"
                  >
                    + Top Up Wallet
                  </button>
                </div>
              )}

              {/* 10. ADMIN DASHBOARD PREVIEW */}
              {previewSection === 'admin_dashboard' && (
                <div
                  style={{
                    backgroundColor: pt.bgSurface,
                    borderColor: pt.borderPrimary,
                    borderRadius: pt.cardRadius
                  }}
                  className="p-4 border space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" style={{ color: pt.accentPrimary }} />
                      <span style={{ fontFamily: pt.fontHeading, color: pt.textPrimary }} className="font-bold text-sm">
                        ACOVON Executive Telemetry
                      </span>
                    </div>
                    <span style={{ color: pt.accentPrimary }} className="text-xs font-mono">
                      Theme: {effectivePreviewTheme.name}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs tabular-nums">
                    {[
                      { k: 'Gross Volume', v: '$142,850' },
                      { k: 'Active Creators', v: '128' },
                      { k: 'Active Subscriptions', v: '4,890' },
                      { k: 'System Status', v: 'Nominal' }
                    ].map(m => (
                      <div
                        key={m.k}
                        style={{ backgroundColor: pt.bgElevated, borderColor: pt.borderSubtle, borderRadius: pt.buttonRadius }}
                        className="p-2.5 border"
                      >
                        <div style={{ color: pt.textMuted }} className="text-[10px]">
                          {m.k}
                        </div>
                        <div style={{ color: pt.textPrimary }} className="font-bold font-mono tabular-nums mt-0.5">
                          {m.v}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          ONE-CLICK GLOBAL THEME APPLICATION CONFIRMATION MODAL
      ==================================================================== */}
      {showApplyConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#2e2e38] rounded-2xl max-w-md w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel space-y-4 text-xs shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#d4af37]" />
                <h3 className="text-base font-bold text-white">Apply Global Platform Theme</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyConfirmModal(false)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-200 leading-relaxed text-xs sm:text-sm">
              Are you sure you want to apply <strong>{effectivePreviewTheme.name}</strong> to the entire ACOVON platform? This will update the visual appearance for all Fans, Creators, and Admins.
            </p>

            <div className="p-3 rounded-xl bg-[#18181f] border border-[#272730] space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-neutral-400">Selected Theme:</span>
                <span className="font-bold text-white">
                  {effectivePreviewTheme.code} — {effectivePreviewTheme.name}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-neutral-400">Typography:</span>
                <span className="text-[#fce7b0] font-medium">{effectivePreviewTheme.fontPairLabel}</span>
              </div>
              <div className="flex items-center gap-1 pt-1">
                {effectivePreviewTheme.swatches.map((hex, idx) => (
                  <div
                    key={`confirm_${hex}_${idx}`}
                    style={{ backgroundColor: hex }}
                    className="flex-1 h-5 rounded border border-white/15"
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-neutral-400 mb-1">
                Audit Log Release Notes (Optional)
              </label>
              <input
                type="text"
                value={publishNotes}
                onChange={e => setPublishNotes(e.target.value)}
                placeholder={`Applied ${effectivePreviewTheme.name} across all platform interfaces...`}
                className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowApplyConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[#1e1e26] text-neutral-300 cursor-pointer font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                className="px-4 py-2 rounded-xl bg-[#d4af37] text-black font-bold cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirm &amp; Publish Globally</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
