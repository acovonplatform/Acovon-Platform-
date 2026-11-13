import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { PlatformAnnouncement } from '../../types';
import { sanitizeAnnouncementHtml } from '../admin/AdminAnnouncementManagementSection';
import { TranslateContentButton } from './TranslateContentButton';
import {
  Megaphone,
  Sparkles,
  AlertTriangle,
  CheckCheck,
  ExternalLink,
  X,
  Eye,
  Users,
  Crown,
  Globe,
  ShieldAlert,
  Lock,
  Clock
} from 'lucide-react';

interface AnnouncementActionProps {
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenWallet?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHelpCenter?: () => void;
}

export const executeAnnouncementCta = (
  ann: PlatformAnnouncement,
  handlers: AnnouncementActionProps
) => {
  if (!ann.cta.enabled || !ann.cta.destinationUrl) return;
  const dest = ann.cta.destinationUrl.trim();

  if (ann.cta.openMode === 'external' || /^https?:\/\//i.test(dest)) {
    window.open(dest, '_blank', 'noopener,noreferrer');
    return;
  }

  if (dest === 'wallet' && handlers.onOpenWallet) {
    handlers.onOpenWallet();
    return;
  }
  if (dest === 'privacy' && handlers.onOpenPrivacy) {
    handlers.onOpenPrivacy();
    return;
  }
  if (dest === 'support' && handlers.onOpenHelpCenter) {
    handlers.onOpenHelpCenter();
    return;
  }

  handlers.onNavigate(dest);
};

// ============================================================================
// 1. DASHBOARD ANNOUNCEMENT BANNERS & PERSISTENT NOTICES (FAN FEED / CREATOR STUDIO)
// ============================================================================
export const RoleTargetedAnnouncementBanners: React.FC<
  AnnouncementActionProps & {
    onOpenAnnouncementModal?: (announcementId: string) => void;
  }
> = ({ onNavigate, onOpenWallet, onOpenPrivacy, onOpenHelpCenter, onOpenAnnouncementModal }) => {
  const {
    currentUser,
    activeRole,
    getVisibleAnnouncementsForCurrentUser,
    getUserAnnouncementStatus,
    markAnnouncementAsRead,
    acknowledgeAnnouncement,
    dismissAnnouncementBanner
  } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isCreator = currentUser.role === 'creator' || activeRole === 'creator';

  // Fetch strictly role-isolated banner and persistent notice announcements
  const bannerAnnouncements = useMemo(() => {
    const allVisible = getVisibleAnnouncementsForCurrentUser();
    return allVisible.filter(ann => {
      const hasBannerOrPersistent =
        ann.displayFormats.includes('dashboard_banner') ||
        ann.displayFormats.includes('persistent_notice');
      if (!hasBannerOrPersistent) return false;

      const status = getUserAnnouncementStatus(ann.id);
      const isPersistentUnacknowledged =
        ann.displayFormats.includes('persistent_notice') &&
        ann.requiresAcknowledgment &&
        !status.isAcknowledged;

      if (isPersistentUnacknowledged) {
        return true; // Always stays visible until acknowledged
      }

      return !status.isBannerDismissed;
    });
  }, [getVisibleAnnouncementsForCurrentUser, getUserAnnouncementStatus]);

  if (bannerAnnouncements.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      {bannerAnnouncements.map(ann => {
        const status = getUserAnnouncementStatus(ann.id);
        const isPersistent =
          ann.displayFormats.includes('persistent_notice') &&
          ann.requiresAcknowledgment &&
          !status.isAcknowledged;
        const isExpanded = expandedId === ann.id;

        const borderClass =
          ann.priority === 'urgent'
            ? 'border-rose-500/50 bg-gradient-to-r from-[#221216] via-[#191318] to-[#131318]'
            : ann.priority === 'important'
            ? 'border-[#d4af37]/50 bg-gradient-to-r from-[#211c11] via-[#181612] to-[#131318]'
            : 'border-[#2c2c38] bg-[#14141a]';

        return (
          <div
            key={ann.id}
            className={`rounded-2xl border p-4 transition-all shadow-lg ${borderClass}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                    ann.priority === 'urgent'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-[#d4af37]/15 text-[#d4af37] border border-[#d4af37]/30'
                  }`}
                >
                  {ann.priority === 'urgent' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : (
                    <Megaphone className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-black/40 text-[#fce7b0] border border-[#d4af37]/30">
                      {ann.audience === 'fans_only'
                        ? 'Exclusive Fan Notice'
                        : ann.audience === 'creators_only'
                        ? 'Creator Studio Notice'
                        : 'Platform Announcement'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono text-neutral-300 bg-black/30">
                      {ann.category}
                    </span>
                    {isPersistent && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-950/80 text-amber-300 border border-amber-500/40">
                        Acknowledgment Required
                      </span>
                    )}
                    {!status.isRead && (
                      <span className="w-2 h-2 rounded-full bg-[#d4af37]" title="Unread" />
                    )}
                  </div>

                  <TranslateContentButton
                    text={ann.title}
                    contentType="announcement"
                    contentRef={`ann_title_${ann.id}`}
                    renderPrimaryText
                    textClassName="text-xs sm:text-sm font-bold text-white leading-snug"
                    compact
                  />
                  <TranslateContentButton
                    text={ann.summary}
                    contentType="announcement"
                    contentRef={`ann_summary_${ann.id}`}
                    renderPrimaryText
                    textClassName="text-xs text-neutral-300 mt-0.5 leading-relaxed"
                    compact
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    markAnnouncementAsRead(ann.id);
                    if (onOpenAnnouncementModal) {
                      onOpenAnnouncementModal(ann.id);
                    } else {
                      setExpandedId(isExpanded ? null : ann.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#1f1f29] hover:bg-[#2a2a36] border border-[#343442] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{isExpanded ? 'Hide Details' : 'Read Full Notice'}</span>
                </button>

                {ann.cta.enabled && ann.cta.label && (
                  <button
                    onClick={() => {
                      markAnnouncementAsRead(ann.id);
                      executeAnnouncementCta(ann, {
                        onNavigate,
                        onOpenWallet,
                        onOpenPrivacy,
                        onOpenHelpCenter
                      });
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>{ann.cta.label}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {ann.requiresAcknowledgment && !status.isAcknowledged ? (
                  <button
                    onClick={() => acknowledgeAnnouncement(ann.id)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                ) : (
                  <button
                    onClick={() => dismissAnnouncementBanner(ann.id)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
                    title="Dismiss banner"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {isExpanded && (
              <div className="mt-4 pt-3.5 border-t border-white/10 space-y-3 text-xs">
                {ann.imageUrl && (
                  <img
                    src={ann.imageUrl}
                    alt={ann.title}
                    className="w-full max-h-52 object-cover rounded-xl border border-white/10"
                  />
                )}
                <div
                  className="text-neutral-200 space-y-2 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: sanitizeAnnouncementHtml(ann.bodyHtml)
                  }}
                />
                <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                  <span>
                    Published: {ann.publishedAt || ann.createdAt} • Audience:{' '}
                    {isCreator ? 'Verified Creator Account' : 'Verified Fan Account'}
                  </span>
                  {status.isAcknowledged && (
                    <span className="text-emerald-400 font-mono flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Acknowledged at {status.recipientRecord?.acknowledgedAt}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// 2. IMPORTANT ANNOUNCEMENT POPUP MODAL (SHOWN ONCE UNTIL ACKNOWLEDGED)
// ============================================================================
export const ImportantAnnouncementPopupModal: React.FC<AnnouncementActionProps> = ({
  onNavigate,
  onOpenWallet,
  onOpenPrivacy,
  onOpenHelpCenter
}) => {
  const {
    getVisibleAnnouncementsForCurrentUser,
    getUserAnnouncementStatus,
    markAnnouncementAsRead,
    acknowledgeAnnouncement,
    dismissAnnouncementPopup
  } = useApp();

  const activePopupAnnouncement = useMemo(() => {
    const popups = getVisibleAnnouncementsForCurrentUser({
      displayFormat: 'important_popup'
    });
    return popups.find(ann => {
      const st = getUserAnnouncementStatus(ann.id);
      if (ann.requiresAcknowledgment) {
        return !st.isAcknowledged;
      }
      return !st.isPopupDismissed;
    });
  }, [getVisibleAnnouncementsForCurrentUser, getUserAnnouncementStatus]);

  if (!activePopupAnnouncement) return null;

  const status = getUserAnnouncementStatus(activePopupAnnouncement.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in">
      <div className="bg-[#121217] border border-[#d4af37]/50 rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl acovon-modal-panel">
        {activePopupAnnouncement.imageUrl && (
          <div className="h-36 sm:h-44 w-full bg-black relative shrink-0">
            <img
              src={activePopupAnnouncement.imageUrl}
              alt={activePopupAnnouncement.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121217] via-transparent to-transparent" />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40">
                {activePopupAnnouncement.audience === 'fans_only'
                  ? 'Fans Only Notice'
                  : activePopupAnnouncement.audience === 'creators_only'
                  ? 'Creators Only Notice'
                  : 'Official Platform Notice'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-950/80 text-rose-300 border border-rose-500/40">
                {activePopupAnnouncement.category}
              </span>
            </div>

            {!activePopupAnnouncement.requiresAcknowledgment && (
              <button
                onClick={() => dismissAnnouncementPopup(activePopupAnnouncement.id)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <TranslateContentButton
            text={activePopupAnnouncement.title}
            contentType="announcement"
            contentRef={`ann_popup_title_${activePopupAnnouncement.id}`}
            renderPrimaryText
            textClassName="text-base font-bold font-brand text-white leading-snug"
            compact
          />

          <div
            className="text-neutral-300 space-y-2 leading-relaxed max-h-60 overflow-y-auto pr-1"
            dangerouslySetInnerHTML={{
              __html: sanitizeAnnouncementHtml(activePopupAnnouncement.bodyHtml)
            }}
          />

          <TranslateContentButton
            text={activePopupAnnouncement.summary}
            contentType="announcement"
            contentRef={`ann_popup_summary_${activePopupAnnouncement.id}`}
            compact
          />

          <div className="pt-4 border-t border-[#252530] flex flex-wrap items-center justify-between gap-2.5">
            {activePopupAnnouncement.cta.enabled && activePopupAnnouncement.cta.label ? (
              <button
                onClick={() => {
                  markAnnouncementAsRead(activePopupAnnouncement.id);
                  if (activePopupAnnouncement.requiresAcknowledgment) {
                    acknowledgeAnnouncement(activePopupAnnouncement.id);
                  } else {
                    dismissAnnouncementPopup(activePopupAnnouncement.id);
                  }
                  executeAnnouncementCta(activePopupAnnouncement, {
                    onNavigate,
                    onOpenWallet,
                    onOpenPrivacy,
                    onOpenHelpCenter
                  });
                }}
                className="px-4 py-2 rounded-xl bg-[#1f1f29] hover:bg-[#2a2a36] border border-[#d4af37]/40 text-[#fce7b0] font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <span>{activePopupAnnouncement.cta.label}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-neutral-500 font-mono">
                Published {activePopupAnnouncement.publishedAt}
              </span>
            )}

            {activePopupAnnouncement.requiresAcknowledgment ? (
              <button
                onClick={() => acknowledgeAnnouncement(activePopupAnnouncement.id)}
                className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#d4af37]/20"
              >
                <CheckCheck className="w-4 h-4" />
                <span>
                  {status.isAcknowledged ? 'Acknowledged' : 'I Understand & Acknowledge'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => dismissAnnouncementPopup(activePopupAnnouncement.id)}
                className="px-4 py-2 rounded-xl bg-[#d4af37] text-black font-bold cursor-pointer"
              >
                Got It
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. FULL ANNOUNCEMENT CENTER & AUDIENCE ISOLATION VERIFIER MODAL
// ============================================================================
export const AnnouncementCenterModal: React.FC<
  AnnouncementActionProps & {
    isOpen: boolean;
    initialAnnouncementId?: string | null;
    onClose: () => void;
  }
> = ({
  isOpen,
  initialAnnouncementId,
  onClose,
  onNavigate,
  onOpenWallet,
  onOpenPrivacy,
  onOpenHelpCenter
}) => {
  const {
    currentUser,
    activeRole,
    getVisibleAnnouncementsForCurrentUser,
    getAnnouncementByIdForCurrentUser,
    getUserAnnouncementStatus,
    markAnnouncementAsRead,
    acknowledgeAnnouncement
  } = useApp();

  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'acknowledged'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialAnnouncementId || null);
  const [directIdTestInput, setDirectIdTestInput] = useState('');
  const [directIdAccessResult, setDirectIdAccessResult] = useState<{
    accessible: boolean;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const isCreator = currentUser.role === 'creator' || activeRole === 'creator';
  const visibleAnnouncements = getVisibleAnnouncementsForCurrentUser();

  const filteredList = visibleAnnouncements.filter(ann => {
    const st = getUserAnnouncementStatus(ann.id);
    if (filterTab === 'unread') return !st.isRead;
    if (filterTab === 'acknowledged') return st.isRead || st.isAcknowledged;
    return true;
  });

  const activeAnnouncement =
    visibleAnnouncements.find(a => a.id === selectedId) || filteredList[0] || null;

  const handleTestDirectIdLookup = (testId: string) => {
    setDirectIdTestInput(testId);
    const res = getAnnouncementByIdForCurrentUser(testId.trim());
    if (res.accessible && res.announcement) {
      setSelectedId(res.announcement.id);
      markAnnouncementAsRead(res.announcement.id);
      setDirectIdAccessResult({
        accessible: true,
        message: `Access Granted: "${res.announcement.title}" is authorized for your ${
          isCreator ? 'Creator' : 'Fan'
        } account.`
      });
    } else {
      setDirectIdAccessResult({
        accessible: false,
        message: res.error || 'Access Denied: Unauthorized audience role.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121216] border border-[#2c2c38] rounded-2xl max-w-5xl w-full max-h-[92dvh] sm:max-h-[88dvh] flex flex-col overflow-hidden shadow-2xl text-xs acovon-modal-panel">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#25252f] bg-[#15151c] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Megaphone className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-base font-bold font-brand text-white truncate">
                  ACOVON Official Announcement Center
                </h3>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase shrink-0 ${
                    isCreator
                      ? 'bg-[#241e12] text-[#fce7b0] border border-[#d4af37]/40'
                      : 'bg-sky-950/70 text-sky-300 border border-sky-500/40'
                  }`}
                >
                  {isCreator ? 'Creator Account View' : 'Fan Account View'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 truncate">
                Showing official updates targeted to{' '}
                <strong className="text-white">
                  {isCreator ? 'Creators Only & Everyone' : 'Fans Only & Everyone'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Direct URL / ID Isolation Security Verifier Bar */}
        <div className="hidden sm:flex px-6 py-2.5 bg-[#17171f] border-b border-[#24242f] flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-2 text-neutral-300">
            <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Test Direct URL / Announcement ID Isolation:</span>
            <button
              onClick={() => handleTestDirectIdLookup('ann_fans_1')}
              className="px-2 py-0.5 rounded bg-[#22222d] hover:bg-[#2c2c3a] text-sky-300 font-mono cursor-pointer"
            >
              Try Fans-Only ID (ann_fans_1)
            </button>
            <button
              onClick={() => handleTestDirectIdLookup('ann_creators_1')}
              className="px-2 py-0.5 rounded bg-[#22222d] hover:bg-[#2c2c3a] text-[#fce7b0] font-mono cursor-pointer"
            >
              Try Creators-Only ID (ann_creators_1)
            </button>
            <button
              onClick={() => handleTestDirectIdLookup('ann_everyone_1')}
              className="px-2 py-0.5 rounded bg-[#22222d] hover:bg-[#2c2c3a] text-emerald-300 font-mono cursor-pointer"
            >
              Try Everyone ID (ann_everyone_1)
            </button>
          </div>

          {directIdAccessResult && (
            <div
              className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 ${
                directIdAccessResult.accessible
                  ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>{directIdAccessResult.message}</span>
            </div>
          )}
        </div>

        {/* Main 2-Pane Split */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden grid grid-cols-1 md:grid-cols-12">
          {/* Left Pane: Announcement List */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-[#24242f] flex flex-col max-h-56 md:max-h-none overflow-hidden bg-[#131318]">
            <div className="p-2.5 sm:p-3 border-b border-[#22222c] flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all' as const, label: `All (${visibleAnnouncements.length})` },
                {
                  id: 'unread' as const,
                  label: `Unread (${
                    visibleAnnouncements.filter(a => !getUserAnnouncementStatus(a.id).isRead).length
                  })`
                },
                {
                  id: 'acknowledged' as const,
                  label: 'Read / Acknowledged'
                }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setFilterTab(t.id)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                    filterTab === t.id
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-[#1b1b23] text-neutral-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#1e1e26]">
              {filteredList.length === 0 ? (
                <div className="p-8 text-center text-neutral-500">
                  No announcements in this filter view.
                </div>
              ) : (
                filteredList.map(ann => {
                  const st = getUserAnnouncementStatus(ann.id);
                  const isSelected = activeAnnouncement?.id === ann.id;
                  return (
                    <div
                      key={ann.id}
                      onClick={() => {
                        setSelectedId(ann.id);
                        markAnnouncementAsRead(ann.id);
                      }}
                      className={`p-4 cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[#1c1c26] border-l-2 border-l-[#d4af37]'
                          : 'hover:bg-[#171720]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#23232f] text-[#fce7b0]">
                          {ann.category}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {ann.priority === 'urgent' && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 text-[9px] font-mono uppercase">
                              Urgent
                            </span>
                          )}
                          {!st.isRead && (
                            <span className="w-2 h-2 rounded-full bg-[#d4af37]" title="Unread" />
                          )}
                        </div>
                      </div>
                      <h4
                        className={`text-xs font-bold line-clamp-1 ${
                          !st.isRead ? 'text-white' : 'text-neutral-200'
                        }`}
                      >
                        {ann.title}
                      </h4>
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">
                        {ann.summary}
                      </p>
                      <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500 font-mono">
                        <span>{ann.publishedAt || ann.createdAt}</span>
                        {st.isAcknowledged ? (
                          <span className="text-emerald-400">Acknowledged</span>
                        ) : ann.requiresAcknowledgment ? (
                          <span className="text-amber-300">Ack Required</span>
                        ) : st.isRead ? (
                          <span>Read</span>
                        ) : (
                          <span className="text-[#fce7b0]">New</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Pane: Selected Announcement Full Reader */}
          <div className="md:col-span-7 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!activeAnnouncement ? (
              <div className="py-16 text-center text-neutral-500">
                Select an announcement from the left to read its full content.
              </div>
            ) : (
              (() => {
                const st = getUserAnnouncementStatus(activeAnnouncement.id);
                return (
                  <div className="space-y-4">
                    {activeAnnouncement.imageUrl && (
                      <img
                        src={activeAnnouncement.imageUrl}
                        alt={activeAnnouncement.title}
                        className="w-full max-h-60 object-cover rounded-2xl border border-[#2c2c38]"
                      />
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-[#1d1d26] text-[#fce7b0] border border-[#d4af37]/30 text-[11px] font-semibold flex items-center gap-1.5">
                          {activeAnnouncement.audience === 'fans_only' ? (
                            <>
                              <Users className="w-3.5 h-3.5 text-sky-400" />
                              <span>Fans Only</span>
                            </>
                          ) : activeAnnouncement.audience === 'creators_only' ? (
                            <>
                              <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
                              <span>Creators Only</span>
                            </>
                          ) : (
                            <>
                              <Globe className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Everyone</span>
                            </>
                          )}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#1d1d26] text-neutral-300 font-mono text-[11px]">
                          {activeAnnouncement.category}
                        </span>
                      </div>

                      <span className="text-[11px] font-mono text-neutral-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {activeAnnouncement.publishedAt || activeAnnouncement.createdAt}
                      </span>
                    </div>

                    <TranslateContentButton
                      text={activeAnnouncement.title}
                      contentType="announcement"
                      contentRef={`ann_center_title_${activeAnnouncement.id}`}
                      renderPrimaryText
                      textClassName="text-lg font-bold font-brand text-white leading-snug"
                      compact
                    />

                    <div
                      className="p-4 rounded-2xl bg-[#16161e] border border-[#262632] text-neutral-200 space-y-2.5 leading-relaxed text-xs"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeAnnouncementHtml(activeAnnouncement.bodyHtml)
                      }}
                    />

                    <TranslateContentButton
                      text={activeAnnouncement.summary}
                      contentType="announcement"
                      contentRef={`ann_center_summary_${activeAnnouncement.id}`}
                      compact
                    />

                    <div className="pt-4 border-t border-[#252530] flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        {activeAnnouncement.cta.enabled && activeAnnouncement.cta.label && (
                          <button
                            onClick={() => {
                              markAnnouncementAsRead(activeAnnouncement.id);
                              onClose();
                              executeAnnouncementCta(activeAnnouncement, {
                                onNavigate,
                                onOpenWallet,
                                onOpenPrivacy,
                                onOpenHelpCenter
                              });
                            }}
                            className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{activeAnnouncement.cta.label}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {activeAnnouncement.requiresAcknowledgment && (
                          <button
                            onClick={() => acknowledgeAnnouncement(activeAnnouncement.id)}
                            disabled={st.isAcknowledged}
                            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer ${
                              st.isAcknowledged
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 cursor-default'
                                : 'bg-emerald-500 hover:bg-emerald-400 text-black'
                            }`}
                          >
                            <CheckCheck className="w-4 h-4" />
                            <span>
                              {st.isAcknowledged
                                ? `Acknowledged (${st.recipientRecord?.acknowledgedAt})`
                                : 'Acknowledge Important Notice'}
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
