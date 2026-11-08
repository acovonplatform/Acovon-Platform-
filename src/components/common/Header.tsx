import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Compass, 
  Radio, 
  MessageSquare, 
  LayoutDashboard,
  Wallet,
  Sparkles,
  Globe,
  FolderLock
} from 'lucide-react';
import { QuickActionsMenu } from './QuickActionsMenu';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileMenu } from './ProfileMenu';

interface HeaderProps {
  currentTab: string;
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenWallet: () => void;
  onOpenCreatePost: () => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onOpenAdFree?: () => void;
  onOpenCreatorAd?: () => void;
  onOpenEditProfile: () => void;
  onOpenPaymentMethods: () => void;
  onOpenSubscriptions: () => void;
  onOpenPurchaseHistory: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenHelpCenter: () => void;
  onOpenBecomeCreator?: () => void;
  onOpenFanProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenWallet,
  onOpenCreatePost,
  onOpenAuth,
  onOpenAdFree,
  onOpenCreatorAd,
  onOpenEditProfile,
  onOpenPaymentMethods,
  onOpenSubscriptions,
  onOpenPurchaseHistory,
  onOpenSettings,
  onOpenPrivacy,
  onOpenHelpCenter,
  onOpenBecomeCreator,
  onOpenFanProfile
}) => {
  const {
    currentUser,
    isCurrentUserApprovedCreator,
    livestreams,
    messages,
    isAuthenticated,
    activeLanguageMeta,
    t
  } = useApp();

  const isCreator = isCurrentUserApprovedCreator;
  const liveCount = livestreams.filter(s => s.status === 'live').length;

  // Calculate unread incoming messages
  const unreadMessageCount = Object.values(messages).flat().filter(m => m.receiverId === currentUser.id && !m.read).length;

  // The 5 primary navigation destinations: Creator gets Creator Studio, Fan gets My Subscriptions
  const navItems = isCreator ? [
    { id: 'feed', label: t('nav.feed', 'Feed'), icon: Home },
    { id: 'explore', label: t('nav.explore', 'Explore'), icon: Compass },
    { 
      id: 'live', 
      label: t('nav.live', 'Live'), 
      icon: Radio,
      badge: liveCount > 0 ? liveCount : undefined,
      badgeColor: 'bg-red-600 text-white animate-pulse'
    },
    { 
      id: 'messages', 
      label: t('nav.messages', 'Messages'), 
      icon: MessageSquare,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      badgeColor: 'bg-[#d4af37] text-black font-bold'
    },
    { 
      id: 'creator-studio', 
      label: t('nav.creator_studio', 'Creator Studio'), 
      icon: LayoutDashboard 
    }
  ] : [
    { id: 'feed', label: t('nav.feed', 'Feed'), icon: Home },
    { id: 'explore', label: t('nav.explore', 'Explore'), icon: Compass },
    { 
      id: 'live', 
      label: t('nav.live', 'Live'), 
      icon: Radio,
      badge: liveCount > 0 ? liveCount : undefined,
      badgeColor: 'bg-red-600 text-white animate-pulse'
    },
    { 
      id: 'messages', 
      label: t('nav.messages', 'Messages'), 
      icon: MessageSquare,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      badgeColor: 'bg-[#d4af37] text-black font-bold'
    },
    { 
      id: 'subscriptions', 
      label: t('nav.my_subscriptions', 'My Subscriptions'), 
      icon: Sparkles 
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#faf8f5]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-stone-200 dark:border-[#26262b] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-6">
        
        {/* Zone 1: Brand Wordmark (Home is Feed once logged in; Landing only for guests) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
          <button 
            type="button"
            onClick={() => onNavigate(isAuthenticated ? 'feed' : 'landing')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-[#d4af37] via-[#b38f28] to-[#6d5410] flex items-center justify-center shadow-lg shadow-[#d4af37]/20 group-hover:scale-105 transition-transform shrink-0">
              <span className="font-brand text-black font-bold text-base sm:text-lg leading-none">A</span>
            </div>
            <span className="font-brand text-base sm:text-xl font-bold tracking-widest text-stone-900 dark:text-[#f4f4f5] group-hover:text-[#9a7418] dark:group-hover:text-[#fce7b0] transition-colors whitespace-nowrap">
              ACOVON
            </span>
          </button>
        </div>

        {/* Zone 2: Main Navigation - Shown when authenticated */}
        {isAuthenticated ? (
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative ${
                    isActive
                      ? 'bg-amber-50 dark:bg-[#18181f] text-[#7c5b10] dark:text-[#fce7b0] border border-[#d4af37]/40 dark:border-[#d4af37]/30 shadow-sm'
                      : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#141418]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#b38f28] dark:text-[#d4af37]' : 'text-stone-500 dark:text-neutral-400'} ${item.id === 'live' && liveCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none ${item.badgeColor || 'bg-stone-200 dark:bg-neutral-800 text-stone-700 dark:text-neutral-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        ) : (
          <div className="hidden md:flex items-center gap-2 text-xs text-stone-500 dark:text-neutral-400">
            <span>Exclusive Creator Subscriptions, Vault Media &amp; Live Broadcasts</span>
          </div>
        )}

        {/* Zone 3: Quick Actions, Auth / Wallet, Notifications, Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Quick Actions (Create / Go Live) strictly for Creators */}
              {isCreator ? (
                <QuickActionsMenu 
                  onOpenCreatePost={onOpenCreatePost} 
                  onOpenCreatorAd={onOpenCreatorAd}
                />
              ) : (
                onOpenBecomeCreator && (
                  <button
                    onClick={onOpenBecomeCreator}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#7c5b10] dark:text-[#fce7b0] bg-amber-50 dark:bg-[#1a1810] hover:bg-amber-100/80 dark:hover:bg-[#242116] border border-[#d4af37]/50 dark:border-[#d4af37]/40 hover:border-[#d4af37] rounded-xl transition-all shadow-sm cursor-pointer focus:outline-none"
                    title="Apply to Become an Acovon Creator"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#b38f28] dark:text-[#d4af37]" />
                    <span>Become a Creator</span>
                  </button>
                )
              )}

              {/* Clickable Wallet Balance Pill (Hidden on mobile navigation, available in Profile Menu & desktop) */}
              <button
                onClick={onOpenWallet}
                title="Open Acovon Wallet"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#141418] hover:bg-stone-100 dark:hover:bg-[#1c1c22] border border-stone-300 dark:border-[#27272a] hover:border-stone-400 dark:hover:border-[#383842] rounded-xl transition-colors cursor-pointer focus:outline-none shadow-2xs"
              >
                <Wallet className="w-4 h-4 text-[#b38f28] dark:text-[#d4af37]" />
                <span className="text-xs font-mono font-medium tabular-nums text-stone-800 dark:text-neutral-200">
                  ${currentUser.walletBalance.toFixed(2)}
                </span>
              </button>

              {/* Clean Notifications & Announcements Bell with Dropdown */}
              <NotificationsDropdown
                onNavigate={onNavigate}
                onOpenWallet={onOpenWallet}
                onOpenPrivacy={onOpenPrivacy}
                onOpenHelpCenter={onOpenHelpCenter}
              />

              {/* Clean Profile Menu Dropdown */}
              <ProfileMenu 
                onNavigate={onNavigate}
                onOpenWallet={onOpenWallet}
                onOpenEditProfile={onOpenEditProfile}
                onOpenPaymentMethods={onOpenPaymentMethods}
                onOpenSubscriptions={onOpenSubscriptions}
                onOpenPurchaseHistory={onOpenPurchaseHistory}
                onOpenSettings={onOpenSettings}
                onOpenPrivacy={onOpenPrivacy}
                onOpenHelpCenter={onOpenHelpCenter}
                onOpenAuth={() => onOpenAuth('login')}
                onOpenBecomeCreator={onOpenBecomeCreator}
                onOpenFanProfile={onOpenFanProfile}
              />
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenSettings}
                title="Language / اللغة"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-300 bg-[#141418] hover:bg-[#1c1c22] border border-[#27272a] rounded-xl transition-colors cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
                <span data-no-translate="true" className="text-[11px]">
                  {activeLanguageMeta.nativeName}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-3.5 py-1.5 text-xs font-semibold text-stone-800 dark:text-neutral-200 bg-white dark:bg-[#141418] hover:bg-stone-100 dark:hover:bg-[#1c1c22] border border-stone-300 dark:border-[#27272a] rounded-xl transition-colors cursor-pointer"
              >
                {t('auth.log_in', 'Log In')}
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-3.5 py-1.5 text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e5c07b] rounded-xl shadow-sm shadow-[#d4af37]/20 transition-all cursor-pointer"
              >
                {t('auth.sign_up', 'Sign Up')}
              </button>
            </>
          )}

        </div>

      </div>
    </header>
  );
};

