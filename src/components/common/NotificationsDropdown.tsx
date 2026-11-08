import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  CheckCheck,
  Radio,
  MessageSquare,
  Video,
  Coins,
  Sparkles,
  Megaphone,
  ExternalLink,
  X
} from 'lucide-react';
import { AnnouncementCenterModal } from './AnnouncementExperience';

interface NotificationsDropdownProps {
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenWallet?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHelpCenter?: () => void;
}

export const NotificationsDropdown: React.FC<NotificationsDropdownProps> = ({
  onNavigate,
  onOpenWallet,
  onOpenPrivacy,
  onOpenHelpCenter
}) => {
  const {
    currentUser,
    activeRole,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    getVisibleAnnouncementsForCurrentUser,
    getUserAnnouncementStatus,
    getUnreadAnnouncementCountForCurrentUser,
    markAnnouncementAsRead
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'announcements' | 'activity'>('announcements');
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [selectedAnnouncementId, setSelectedAnnouncementId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isCreator = currentUser.role === 'creator' || activeRole === 'creator';
  const effectiveRole: 'fan' | 'creator' = isCreator ? 'creator' : 'fan';

  // Filter activity notifications so announcement notifications respect strict audience isolation
  const roleFilteredNotifications = notifications.filter(n => {
    if (n.targetAudience) {
      if (n.targetAudience === 'fans_only' && effectiveRole !== 'fan') return false;
      if (n.targetAudience === 'creators_only' && effectiveRole !== 'creator') return false;
    }
    return !n.userId || n.userId === currentUser.id || n.userId === 'user_fan_1';
  });

  const visibleAnnouncements = getVisibleAnnouncementsForCurrentUser();
  const unreadAnnouncementCount = getUnreadAnnouncementCountForCurrentUser();
  const unreadNotifCount = roleFilteredNotifications.filter(n => !n.read).length;
  const totalUnreadBadge = unreadAnnouncementCount + unreadNotifCount;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string, linkUrl?: string, announcementId?: string) => {
    markNotificationAsRead(id);
    setIsOpen(false);
    if (announcementId || linkUrl?.startsWith('announcement:')) {
      const targetId = announcementId || linkUrl?.replace('announcement:', '') || null;
      setSelectedAnnouncementId(targetId);
      setIsCenterModalOpen(true);
      return;
    }
    if (linkUrl?.includes('requests')) onNavigate('requests');
    else if (linkUrl?.includes('messages')) onNavigate('messages');
    else if (linkUrl?.includes('live')) onNavigate('live');
    else if (linkUrl?.includes('wallet')) onNavigate('creator-studio');
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Megaphone className="w-4 h-4 text-[#d4af37]" />;
      case 'livestream':
        return <Radio className="w-4 h-4 text-red-400" />;
      case 'tip':
        return <Coins className="w-4 h-4 text-[#d4af37]" />;
      case 'custom_request':
        return <Video className="w-4 h-4 text-purple-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-blue-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-[#d4af37]" />;
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-neutral-400 hover:text-white bg-[#141418] hover:bg-[#1a1a20] border border-[#27272a] rounded-xl transition-colors cursor-pointer relative focus:outline-none"
          title="Notifications & Official Announcements"
        >
          <Bell className="w-4 h-4" />
          {totalUnreadBadge > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 h-4 bg-[#d4af37] text-black text-[10px] font-bold rounded-full flex items-center justify-center leading-none ring-2 ring-[#09090b]">
              {totalUnreadBadge > 9 ? '9+' : totalUnreadBadge}
            </span>
          )}
        </button>

        {/* Notifications & Announcements Dropdown Window */}
        {isOpen && (
          <div className="fixed left-3 right-3 top-[60px] w-auto max-w-[calc(100vw-1.5rem)] sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[410px] sm:max-w-none bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
            {/* Header & Tab Switcher */}
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2 border-b border-[#27272a] px-1">
              <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                <button
                  onClick={() => setActiveTab('announcements')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTab === 'announcements'
                      ? 'bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Megaphone className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span>Announcements</span>
                  {unreadAnnouncementCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#d4af37] text-black text-[10px] font-mono">
                      {unreadAnnouncementCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('activity')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${
                    activeTab === 'activity'
                      ? 'bg-[#20202a] text-white border border-[#323240]'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <span>Activity</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-neutral-700 text-white text-[10px] font-mono">
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {activeTab === 'activity' && unreadNotifCount > 0 && (
                  <button
                    onClick={() => markAllNotificationsAsRead()}
                    className="text-[11px] text-[#fce7b0] hover:underline flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark read</span>
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="sm:hidden p-1 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                  aria-label="Close notifications"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {activeTab === 'announcements' ? (
              <div className="space-y-2">
                <div className="px-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400">
                  <span className="truncate">
                    Audience:{' '}
                    <strong className="text-[#fce7b0]">
                      {isCreator ? 'Creators & Everyone' : 'Fans & Everyone'}
                    </strong>
                  </span>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      setSelectedAnnouncementId(null);
                      setIsCenterModalOpen(true);
                    }}
                    className="text-[#d4af37] hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>Open Full Center</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[calc(100dvh-13.5rem)] sm:max-h-80 overflow-y-auto pr-1">
                  {visibleAnnouncements.length === 0 ? (
                    <div className="py-8 text-center text-xs text-neutral-500">
                      No active announcements for your account type.
                    </div>
                  ) : (
                    visibleAnnouncements.map(ann => {
                      const st = getUserAnnouncementStatus(ann.id);
                      return (
                        <div
                          key={ann.id}
                          onClick={() => {
                            markAnnouncementAsRead(ann.id);
                            setIsOpen(false);
                            setSelectedAnnouncementId(ann.id);
                            setIsCenterModalOpen(true);
                          }}
                          className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                            !st.isRead
                              ? 'bg-[#18181f] border border-[#d4af37]/35 hover:bg-[#202028]'
                              : 'bg-[#141418] hover:bg-[#1a1a20] border border-[#22222a]'
                          }`}
                        >
                          <div className="p-2 rounded-lg bg-[#202028] shrink-0 mt-0.5">
                            <Megaphone className="w-4 h-4 text-[#d4af37]" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#23232f] text-[#fce7b0]">
                                {ann.category}
                              </span>
                              <div className="flex items-center gap-1.5">
                                {ann.audience === 'fans_only' && (
                                  <span className="text-[9px] font-mono text-sky-300">Fans Only</span>
                                )}
                                {ann.audience === 'creators_only' && (
                                  <span className="text-[9px] font-mono text-[#fce7b0]">Creators Only</span>
                                )}
                                {!st.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0" />
                                )}
                              </div>
                            </div>
                            <div
                              className={`text-xs font-semibold truncate mt-1 ${
                                !st.isRead ? 'text-white' : 'text-neutral-200'
                              }`}
                            >
                              {ann.title}
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                              {ann.summary}
                            </p>
                            <div className="flex items-center justify-between mt-1.5 text-[10px] text-neutral-500 font-mono">
                              <span>{ann.publishedAt || ann.createdAt}</span>
                              {st.isAcknowledged ? (
                                <span className="text-emerald-400">Acknowledged</span>
                              ) : ann.requiresAcknowledgment ? (
                                <span className="text-amber-300">Ack Required</span>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[calc(100dvh-13.5rem)] sm:max-h-80 overflow-y-auto pr-1">
                {roleFilteredNotifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500">
                    No notifications yet.
                  </div>
                ) : (
                  roleFilteredNotifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n.id, n.linkUrl, n.announcementId)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-start gap-3 ${
                        !n.read
                          ? 'bg-[#18181f] border border-[#d4af37]/30 hover:bg-[#202028]'
                          : 'bg-[#141418] hover:bg-[#1a1a20] border border-transparent'
                      }`}
                    >
                      <div className="p-2 rounded-lg bg-[#202028] shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-semibold truncate ${
                              !n.read ? 'text-[#fce7b0]' : 'text-neutral-200'
                            }`}
                          >
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-[#d4af37] shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                          {n.message}
                        </p>
                        <span className="text-[10px] text-neutral-500 mt-1 block">
                          {n.createdAt}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full Announcement Center Modal */}
      <AnnouncementCenterModal
        isOpen={isCenterModalOpen}
        initialAnnouncementId={selectedAnnouncementId}
        onClose={() => setIsCenterModalOpen(false)}
        onNavigate={onNavigate}
        onOpenWallet={onOpenWallet}
        onOpenPrivacy={onOpenPrivacy}
        onOpenHelpCenter={onOpenHelpCenter}
      />
    </>
  );
};
