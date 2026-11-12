import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Compass, 
  Grid,
  Radio, 
  MessageSquare, 
  LayoutDashboard,
  Wallet,
  Globe,
  Search,
  X
} from 'lucide-react';
import { QuickActionsMenu } from './QuickActionsMenu';
import { NotificationsDropdown } from './NotificationsDropdown';
import { ProfileMenu } from './ProfileMenu';
import { VerifiedBadge } from './VerifiedBadge';

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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onNavigate,
  onOpenWallet,
  onOpenCreatePost,
  onOpenAuth,
  onOpenCreatorAd,
  onOpenEditProfile,
  onOpenPaymentMethods,
  onOpenSubscriptions,
  onOpenPurchaseHistory,
  onOpenSettings,
  onOpenPrivacy,
  onOpenHelpCenter,
  onOpenBecomeCreator,
  onOpenFanProfile,
  searchQuery = '',
  onSearchChange
}) => {
  const {
    currentUser,
    isCurrentUserApprovedCreator,
    livestreams,
    messages,
    isAuthenticated,
    activeLanguageMeta,
    creators,
    posts,
    activeFanInterestProfile,
    trackEngagementEvent,
    t
  } = useApp();

  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUpdateSearch = (val: string) => {
    setLocalSearch(val);
    onSearchChange?.(val);
    if (val.trim().length >= 3) {
      trackEngagementEvent({
        eventType: 'search_performed',
        contentType: 'search',
        searchQuery: val.trim(),
        sourceSurface: 'for_you'
      });
    }
  };

  const matchingSearchCreators = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return [];
    const hiddenCreators = new Set(activeFanInterestProfile?.hiddenCreatorIds || []);
    return creators
      .filter(c => {
        if (c.accountStatus === 'suspended' || c.accountStatus === 'banned') return false;
        if (hiddenCreators.has(c.id)) return false;
        return (
          c.name.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(q.replace(/^@/, '')) ||
          c.category.toLowerCase().includes(q)
        );
      })
      .slice(0, 4);
  }, [localSearch, creators, activeFanInterestProfile]);

  const matchingSearchPosts = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return [];
    return posts
      .filter(p => {
        if (p.isDeletedByCreator || p.moderationStatus === 'removed') return false;
        if (p.visibility === 'private' && p.creatorId !== currentUser.id) return false;
        return (
          p.content.toLowerCase().includes(q) ||
          p.creatorName.toLowerCase().includes(q) ||
          p.creatorUsername.toLowerCase().includes(q) ||
          (p.country && p.country.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(q.replace(/^#/, '')))) ||
          (p.categories && p.categories.some(cat => cat.toLowerCase().includes(q)))
        );
      })
      .slice(0, 4);
  }, [localSearch, posts, currentUser.id]);

  const isCreator = isCurrentUserApprovedCreator;
  const liveCount = livestreams.filter(s => s.status === 'live').length;

  // Calculate unread incoming messages
  const unreadMessageCount = Object.values(messages).flat().filter(m => m.receiverId === currentUser.id && !m.read).length;

  // Main navigation destinations (My Subscriptions removed from navigation)
  const navItems = isCreator ? [
    { id: 'feed', label: t('nav.feed', 'Feed'), icon: Home },
    { id: 'explore', label: t('nav.explore', 'Explore'), icon: Compass },
    { id: 'categories', label: t('nav.categories', 'Categories'), icon: Grid },
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
    { id: 'categories', label: t('nav.categories', 'Categories'), icon: Grid },
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
    }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#faf8f5]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-stone-200 dark:border-[#26262b] px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
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
            <span className="font-brand text-base sm:text-xl font-bold tracking-widest text-stone-900 dark:text-[#f4f4f5] group-hover:text-[#9a7418] dark:group-hover:text-[#fce7b0] transition-colors whitespace-nowrap hidden xs:inline">
              ACOVON
            </span>
          </button>
        </div>

        {/* Zone 2: Main Navigation & Search Bar */}
        <div className="flex items-center gap-2 lg:gap-3 flex-1 justify-center max-w-3xl min-w-0">
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-50 dark:bg-[#18181f] text-[#7c5b10] dark:text-[#fce7b0] border border-[#d4af37]/40 dark:border-[#d4af37]/30 shadow-sm'
                        : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#141418]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#b38f28] dark:text-[#d4af37]' : 'text-stone-500 dark:text-neutral-400'} ${item.id === 'live' && liveCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
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
            <nav className="hidden md:flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'explore'
                    ? 'bg-[#18181f] text-[#fce7b0] border border-[#d4af37]/30'
                    : 'text-stone-600 dark:text-neutral-400 hover:text-white hover:bg-[#141418]'
                }`}
              >
                <Compass className="w-4 h-4 text-[#d4af37]" />
                <span>{t('nav.explore', 'Explore')}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('categories')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  currentTab === 'categories'
                    ? 'bg-[#18181f] text-[#fce7b0] border border-[#d4af37]/30'
                    : 'text-stone-600 dark:text-neutral-400 hover:text-white hover:bg-[#141418]'
                }`}
              >
                <Grid className="w-4 h-4 text-[#d4af37]" />
                <span>{t('nav.categories', 'Categories')}</span>
              </button>
            </nav>
          )}

          {/* Navigation Search Bar */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs sm:max-w-sm min-w-[130px]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => handleUpdateSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && localSearch.trim()) {
                    setIsSearchFocused(false);
                    if (currentTab !== 'feed') {
                      onNavigate(isAuthenticated ? 'feed' : 'explore');
                    }
                  }
                }}
                placeholder="Search creators, posts, #tags..."
                className="w-full bg-white dark:bg-[#141418] border border-stone-300 dark:border-[#27272a] focus:border-[#d4af37] rounded-xl pl-8 pr-7 py-1.5 text-xs text-stone-900 dark:text-[#f4f4f5] placeholder-stone-400 dark:placeholder-neutral-400 focus:outline-none transition-colors"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => handleUpdateSearch('')}
                  aria-label="Clear search"
                  className="absolute right-2 p-0.5 text-neutral-400 hover:text-white rounded-md cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchFocused && localSearch.trim().length > 0 && (
              <div className="absolute left-0 right-0 sm:w-80 top-full mt-2 bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-2.5 z-50 space-y-2.5 max-h-[70vh] overflow-y-auto animate-in fade-in zoom-in-95">
                {matchingSearchCreators.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
                      Creators ({matchingSearchCreators.length})
                    </div>
                    <div className="space-y-1">
                      {matchingSearchCreators.map(creator => (
                        <button
                          key={creator.id}
                          type="button"
                          onClick={() => {
                            trackEngagementEvent({
                              eventType: 'creator_profile_opened',
                              contentType: 'creator',
                              creatorId: creator.id,
                              category: creator.category,
                              sourceSurface: 'for_you'
                            });
                            setIsSearchFocused(false);
                            onNavigate('creator-profile', creator.id);
                          }}
                          className="w-full p-2 rounded-xl bg-[#18181c] hover:bg-[#1f1f26] border border-[#27272a] hover:border-[#d4af37]/40 flex items-center gap-2.5 text-left transition-all cursor-pointer"
                        >
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#d4af37]/30"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-[#f4f4f5] truncate">
                              {creator.name}
                            </div>
                            <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                              <span>@{creator.username}</span>
                              <VerifiedBadge creatorId={creator.id} size="xs" />
                              <span>· {creator.category}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchingSearchPosts.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
                      Matching Posts ({matchingSearchPosts.length})
                    </div>
                    <div className="space-y-1">
                      {matchingSearchPosts.map(post => (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => {
                            setIsSearchFocused(false);
                            onNavigate(isAuthenticated ? 'feed' : 'explore');
                          }}
                          className="w-full p-2 rounded-xl bg-[#18181c] hover:bg-[#1f1f26] border border-[#27272a] hover:border-[#d4af37]/40 text-left transition-all cursor-pointer space-y-0.5"
                        >
                          <div className="text-[11px] font-semibold text-[#fce7b0] truncate">
                            {post.creatorName} (@{post.creatorUsername})
                          </div>
                          <div className="text-xs text-neutral-300 line-clamp-1">
                            {post.content}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {matchingSearchCreators.length === 0 && matchingSearchPosts.length === 0 && (
                  <div className="py-4 text-center text-xs text-neutral-400">
                    No creators or posts matching &ldquo;{localSearch}&rdquo;
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Quick Actions, Auth / Wallet, Notifications, Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Quick Actions (Create / Go Live) strictly for Creators */}
              {isCreator && (
                <QuickActionsMenu 
                  onOpenCreatePost={onOpenCreatePost} 
                  onOpenCreatorAd={onOpenCreatorAd}
                />
              )}

              {/* Clickable Wallet Balance Pill (Hidden on mobile navigation, available in Profile Menu & desktop) */}
              <button
                onClick={onOpenWallet}
                title="Open Acovon Wallet"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-[#141418] hover:bg-stone-100 dark:hover:bg-[#1c1c22] border border-stone-300 dark:border-[#27272a] hover:border-stone-400 dark:hover:border-[#383842] rounded-xl transition-colors cursor-pointer focus:outline-none shadow-2xs"
              >
                <Wallet className="w-4 h-4 text-[#b38f28] dark:text-[#d4af37]" />
                <span className="text-xs font-mono font-medium tabular-nums text-stone-800 dark:text-neutral-200">
                  ${Number(currentUser?.walletBalance || 0).toFixed(2)}
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


