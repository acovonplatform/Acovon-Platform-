import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Home, 
  Compass, 
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
import { AcovonLogoIcon } from './AcovonLogoIcon';

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
    setActiveLivestreamId,
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const searchArea: 'feed' | 'explore' | 'live' =
    currentTab === 'live'
      ? 'live'
      : currentTab === 'explore' || currentTab === 'categories' || currentTab === 'countries'
      ? 'explore'
      : 'feed';

  const searchPlaceholder =
    searchArea === 'live'
      ? 'Search live streams, hosts, topics, replays...'
      : searchArea === 'explore'
      ? 'Search explore creators, countries, disciplines...'
      : 'Search feed posts, creators, #tags...';

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (typeof window === 'undefined' || !headerRef.current) return;
      const rect = headerRef.current.getBoundingClientRect();
      if (rect.height > 0) {
        document.documentElement.style.setProperty('--acovon-header-height', `${Math.round(rect.height)}px`);
      }
    };
    updateHeaderHeight();
    const ro = typeof ResizeObserver !== 'undefined' && headerRef.current
      ? new ResizeObserver(() => updateHeaderHeight())
      : null;
    if (ro && headerRef.current) ro.observe(headerRef.current);
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('orientationchange', updateHeaderHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('orientationchange', updateHeaderHeight);
    };
  }, []);

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
        sourceSurface: searchArea === 'explore' ? 'explore' : searchArea === 'live' ? 'live' : 'for_you'
      });
    }
  };

  const handleSearchEnter = (closeMobile = false) => {
    if (!localSearch.trim()) return;
    setIsSearchFocused(false);
    if (closeMobile) setMobileSearchOpen(false);
    const isSearchableArea = ['feed', 'landing', 'explore', 'live', 'categories', 'countries'].includes(currentTab);
    if (!isSearchableArea) {
      onNavigate('feed');
    }
  };

  const matchingSearchCreators = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q) return [];
    const cleanQ = q.replace(/^[@#]/, '');
    const hiddenCreators = new Set(activeFanInterestProfile?.hiddenCreatorIds || []);
    return creators
      .filter(c => {
        if (c.accountStatus === 'suspended' || c.accountStatus === 'banned') return false;
        if (hiddenCreators.has(c.id)) return false;
        return (
          c.name.toLowerCase().includes(q) ||
          c.username.toLowerCase().includes(cleanQ) ||
          c.category.toLowerCase().includes(q) ||
          (c.country?.toLowerCase() || '').includes(q) ||
          (c.bio?.toLowerCase() || '').includes(q) ||
          (c.categories && c.categories.some(cat => cat.toLowerCase().includes(q)))
        );
      })
      .slice(0, searchArea === 'explore' ? 5 : 4);
  }, [localSearch, creators, activeFanInterestProfile, searchArea]);

  const matchingSearchPosts = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q || searchArea === 'live') return [];
    const cleanQ = q.replace(/^#/, '');
    return posts
      .filter(p => {
        if (p.isDeletedByCreator || p.moderationStatus === 'removed' || p.isDraft) return false;
        if (p.visibility === 'private' && (!isAuthenticated || p.creatorId !== currentUser.id)) return false;
        return (
          p.content.toLowerCase().includes(q) ||
          p.creatorName.toLowerCase().includes(q) ||
          p.creatorUsername.toLowerCase().includes(q.replace(/^@/, '')) ||
          (p.country && p.country.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(tag => tag.toLowerCase().includes(cleanQ))) ||
          (p.categories && p.categories.some(cat => cat.toLowerCase().includes(q)))
        );
      })
      .slice(0, 4);
  }, [localSearch, posts, currentUser.id, isAuthenticated, searchArea]);

  const matchingSearchStreams = useMemo(() => {
    const q = localSearch.trim().toLowerCase();
    if (!q || searchArea !== 'live') return [];
    const cleanQ = q.replace(/^[@#]/, '');
    const statusOrder: Record<string, number> = { live: 0, scheduled: 1, ended: 2 };
    return livestreams
      .filter(s => {
        if (s.recordingStatus === 'removed') return false;
        const statusLabel = s.status === 'live' ? 'live' : s.status === 'scheduled' ? 'upcoming scheduled' : 'replay ended';
        return (
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.creatorName.toLowerCase().includes(q) ||
          s.creatorUsername.toLowerCase().includes(cleanQ) ||
          s.category.toLowerCase().includes(q) ||
          statusLabel.includes(q)
        );
      })
      .sort((a, b) => (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3))
      .slice(0, 5);
  }, [localSearch, livestreams, searchArea]);

  const renderSearchDropdownResults = (closeMobileOnSelect = false) => {
    const closeMenus = () => {
      setIsSearchFocused(false);
      if (closeMobileOnSelect) setMobileSearchOpen(false);
    };

    const areaBadgeText =
      searchArea === 'live'
        ? 'Searching Live & Replays'
        : searchArea === 'explore'
        ? 'Searching Explore Discovery'
        : 'Searching Feed Activity';

    return (
      <>
        <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[#22222a]">
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37]">
            {areaBadgeText}
          </span>
          <span className="text-[10px] text-neutral-500">
            {searchArea === 'live'
              ? `${matchingSearchStreams.length} streams`
              : searchArea === 'explore'
              ? `${matchingSearchCreators.length} creators · ${matchingSearchPosts.length} media`
              : `${matchingSearchCreators.length} creators · ${matchingSearchPosts.length} posts`}
          </span>
        </div>

        {searchArea === 'live' && matchingSearchStreams.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
              Live &amp; Scheduled Broadcasts ({matchingSearchStreams.length})
            </div>
            <div className="space-y-1">
              {matchingSearchStreams.map(stream => (
                <button
                  key={stream.id}
                  type="button"
                  onClick={() => {
                    closeMenus();
                    setActiveLivestreamId(stream.id);
                  }}
                  className="w-full p-2 rounded-xl bg-[#18181c] hover:bg-[#1f1f26] border border-[#27272a] hover:border-[#d4af37]/40 flex items-center gap-2.5 text-left transition-all cursor-pointer"
                >
                  {stream.coverImage && (
                    <img
                      src={stream.coverImage}
                      alt={stream.title}
                      className="w-12 h-8 rounded-lg object-cover shrink-0 bg-black border border-[#2b2b36]"
                    />
                  )}
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0 ${
                          stream.status === 'live'
                            ? 'bg-red-600 text-white'
                            : stream.status === 'scheduled'
                            ? 'bg-amber-500/20 text-[#fce7b0]'
                            : 'bg-neutral-800 text-neutral-300'
                        }`}
                      >
                        {stream.status === 'live' ? 'Live' : stream.status === 'scheduled' ? 'Upcoming' : 'Replay'}
                      </span>
                      <span className="text-xs font-semibold text-[#f4f4f5] truncate">
                        {stream.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                      <span>{stream.creatorName}</span>
                      <span>· {stream.category}</span>
                      {stream.status === 'live' && (
                        <span>· {stream.viewerCount.toLocaleString()} watching</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {matchingSearchCreators.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
              {searchArea === 'live' ? 'Broadcast Hosts' : searchArea === 'explore' ? 'Explore Creators' : 'Creators'} ({matchingSearchCreators.length})
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
                      sourceSurface: searchArea === 'explore' ? 'explore' : searchArea === 'live' ? 'live' : 'for_you'
                    });
                    closeMenus();
                    onNavigate('creator-profile', creator.id);
                  }}
                  className="w-full p-2 rounded-xl bg-[#18181c] hover:bg-[#1f1f26] border border-[#27272a] hover:border-[#d4af37]/40 flex items-center gap-2.5 text-left transition-all cursor-pointer"
                >
                  {creator.avatar ? (
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-[#d4af37]/30"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#1f1f26] border border-[#d4af37]/30 flex items-center justify-center text-xs font-bold text-[#fce7b0] shrink-0">
                      {(creator.name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-[#f4f4f5] flex items-center gap-1 min-w-0">
                      <span className="truncate">{creator.name}</span>
                      <VerifiedBadge creatorId={creator.id} size="xs" />
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate flex items-center gap-1">
                      <span>{creator.category}</span>
                      {creator.country && <span>· {creator.country}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {searchArea !== 'live' && matchingSearchPosts.length > 0 && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
              {searchArea === 'explore' ? 'Explore Media & Posts' : 'Matching Feed Posts'} ({matchingSearchPosts.length})
            </div>
            <div className="space-y-1">
              {matchingSearchPosts.map(post => {
                const firstMedia = post.media?.[0];
                const thumb =
                  firstMedia?.type === 'video'
                    ? firstMedia.thumbnailUrl
                    : firstMedia?.thumbnailUrl || firstMedia?.url;
                return (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => {
                      closeMenus();
                      if (searchArea === 'explore') {
                        onNavigate('creator-profile', post.creatorId);
                      } else {
                        onNavigate('feed');
                      }
                    }}
                    className="w-full p-2 rounded-xl bg-[#18181c] hover:bg-[#1f1f26] border border-[#27272a] hover:border-[#d4af37]/40 flex items-center gap-2.5 text-left transition-all cursor-pointer"
                  >
                    {thumb && (
                      <img
                        src={thumb}
                        alt=""
                        className="w-12 h-8 rounded-lg object-cover shrink-0 bg-black border border-[#2b2b36]"
                      />
                    )}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="text-[11px] font-semibold text-[#fce7b0] flex items-center gap-1 min-w-0">
                        <span className="truncate">{post.creatorName}</span>
                        <VerifiedBadge creatorId={post.creatorId} size="xs" />
                        {post.country && (
                          <span className="text-neutral-400 font-normal shrink-0">· {post.country}</span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-300 line-clamp-1">
                        {post.content}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {((searchArea === 'live' && matchingSearchStreams.length === 0 && matchingSearchCreators.length === 0) ||
          (searchArea !== 'live' && matchingSearchCreators.length === 0 && matchingSearchPosts.length === 0)) && (
          <div className="py-4 text-center text-xs text-neutral-400">
            {searchArea === 'live'
              ? `No live streams or hosts matching "${localSearch}"`
              : searchArea === 'explore'
              ? `No explore creators or media matching "${localSearch}"`
              : `No feed posts or creators matching "${localSearch}"`}
          </div>
        )}
      </>
    );
  };

  const isCreator = isAuthenticated && isCurrentUserApprovedCreator;
  const liveCount = livestreams.filter(s => s.status === 'live').length;

  // Calculate unread incoming messages
  const unreadMessageCount = isAuthenticated
    ? Object.values(messages).flat().filter(m => m.receiverId === currentUser.id && !m.read).length
    : 0;

  // Main navigation destinations (My Subscriptions & Categories removed from header navigation)
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
    }
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 w-full bg-[#faf8f5]/95 dark:bg-[#09090b]/95 backdrop-blur-md border-b border-stone-200 dark:border-[#26262b] px-2.5 sm:px-4 lg:px-6 xl:px-8 pt-[max(0.5rem,env(safe-area-inset-top))] sm:pt-[max(0.7rem,env(safe-area-inset-top))] pb-2 sm:pb-2.5 transition-colors"
    >
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-1.5 sm:gap-3 lg:gap-4 min-w-0">
        
        {/* Zone 1: Brand Wordmark (Always navigates directly to Feed) */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
          <button 
            type="button"
            onClick={() => onNavigate('feed')}
            className="flex items-center gap-1.5 sm:gap-2.5 text-left group cursor-pointer focus:outline-none"
          >
            <AcovonLogoIcon size="header" className="group-hover:scale-105 transition-transform" />
            <span className="font-brand text-sm min-[360px]:text-base sm:text-xl font-bold tracking-widest text-stone-900 dark:text-[#f4f4f5] group-hover:text-[#9a7418] dark:group-hover:text-[#fce7b0] transition-colors whitespace-nowrap">
              ACOVON
            </span>
          </button>
        </div>

        {/* Zone 2: Main Navigation & Search Bar */}
        <div className="flex items-center gap-1.5 md:gap-2 xl:gap-3 flex-1 justify-end min-[390px]:justify-center max-w-4xl min-w-0">
          {isAuthenticated ? (
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    title={item.label}
                    aria-label={item.label}
                    className={`flex items-center gap-1.5 px-2.5 lg:px-2.5 xl:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative whitespace-nowrap ${
                      isActive
                        ? 'bg-amber-50 dark:bg-[#18181f] text-[#7c5b10] dark:text-[#fce7b0] border border-[#d4af37]/40 dark:border-[#d4af37]/30 shadow-sm'
                        : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#141418]'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#b38f28] dark:text-[#d4af37]' : 'text-stone-500 dark:text-neutral-400'} ${item.id === 'live' && liveCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
                    <span className="hidden lg:inline">{item.label}</span>
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
            <nav className="hidden md:flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('feed')}
                title={t('nav.feed', 'Feed')}
                aria-label={t('nav.feed', 'Feed')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'feed'
                    ? 'bg-amber-50 dark:bg-[#18181f] text-[#7c5b10] dark:text-[#fce7b0] border border-[#d4af37]/40 dark:border-[#d4af37]/30 shadow-sm'
                    : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#141418]'
                }`}
              >
                <Home className={`w-4 h-4 shrink-0 ${currentTab === 'feed' ? 'text-[#b38f28] dark:text-[#d4af37]' : 'text-stone-500 dark:text-neutral-400'}`} />
                <span className="hidden lg:inline">{t('nav.feed', 'Feed')}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('explore')}
                title={t('nav.explore', 'Explore')}
                aria-label={t('nav.explore', 'Explore')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  currentTab === 'explore'
                    ? 'bg-amber-50 dark:bg-[#18181f] text-[#7c5b10] dark:text-[#fce7b0] border border-[#d4af37]/40 dark:border-[#d4af37]/30 shadow-sm'
                    : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#141418]'
                }`}
              >
                <Compass className={`w-4 h-4 shrink-0 ${currentTab === 'explore' ? 'text-[#b38f28] dark:text-[#d4af37]' : 'text-stone-500 dark:text-neutral-400'}`} />
                <span className="hidden lg:inline">{t('nav.explore', 'Explore')}</span>
              </button>
              <button
                type="button"
                onClick={() => onNavigate('live')}
                title={t('nav.live', 'Live')}
                aria-label={t('nav.live', 'Live')}
                className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer relative whitespace-nowrap ${
                  currentTab === 'live'
                    ? 'bg-amber-50 dark:bg-[#18181f] text-[#7c5b10] dark:text-[#fce7b0] border border-[#d4af37]/40 dark:border-[#d4af37]/30 shadow-sm'
                    : 'text-stone-600 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white hover:bg-stone-200/60 dark:hover:bg-[#141418]'
                }`}
              >
                <Radio className={`w-4 h-4 shrink-0 ${liveCount > 0 ? 'text-red-500 animate-pulse' : currentTab === 'live' ? 'text-[#b38f28] dark:text-[#d4af37]' : 'text-stone-500 dark:text-neutral-400'}`} />
                <span className="hidden lg:inline">{t('nav.live', 'Live')}</span>
                {liveCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none bg-red-600 text-white animate-pulse">
                    {liveCount}
                  </span>
                )}
              </button>
            </nav>
          )}

          {/* Compact Search Trigger on <390px small/standard mobile */}
          <button
            type="button"
            onClick={() => {
              setMobileSearchOpen(prev => !prev);
              setIsSearchFocused(true);
            }}
            aria-label="Toggle search"
            className={`min-[390px]:hidden p-1.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${
              mobileSearchOpen || localSearch
                ? 'bg-[#d4af37]/15 border-[#d4af37]/50 text-[#d4af37]'
                : 'bg-white dark:bg-[#141418] border-stone-300 dark:border-[#27272a] text-stone-700 dark:text-neutral-300'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Navigation Search Bar (>=390px inline) */}
          <div ref={searchContainerRef} className="relative flex-1 max-w-xs sm:max-w-sm min-w-0 hidden min-[390px]:block">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-2.5 sm:left-3 pointer-events-none" />
              <input
                type="text"
                value={localSearch}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => handleUpdateSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchEnter(false);
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full bg-white dark:bg-[#141418] border border-stone-300 dark:border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 sm:pl-8 pr-6 sm:pr-7 py-1.5 text-xs text-stone-900 dark:text-[#f4f4f5] placeholder-stone-400 dark:placeholder-neutral-400 focus:outline-none transition-colors"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => handleUpdateSearch('')}
                  aria-label="Clear search"
                  className="absolute right-1.5 sm:right-2 p-0.5 text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white rounded-md cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {isSearchFocused && localSearch.trim().length > 0 && (
              <div className="fixed left-3 right-3 top-[calc(var(--acovon-header-height,58px)+4px)] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:w-80 sm:mt-2 bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-2.5 z-50 space-y-2.5 max-h-[70dvh] overflow-y-auto animate-in fade-in zoom-in-95">
                {renderSearchDropdownResults(false)}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Quick Actions, Auth / Wallet, Notifications, Profile Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
                className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1.5 text-xs font-medium text-stone-700 dark:text-neutral-300 bg-white dark:bg-[#141418] hover:bg-stone-100 dark:hover:bg-[#1c1c22] border border-stone-300 dark:border-[#27272a] rounded-xl transition-colors cursor-pointer shrink-0"
              >
                <Globe className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span data-no-translate="true" className="text-[11px] hidden sm:inline">
                  {activeLanguageMeta.nativeName}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="px-2 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-semibold text-stone-800 dark:text-neutral-200 bg-white dark:bg-[#141418] hover:bg-stone-100 dark:hover:bg-[#1c1c22] border border-stone-300 dark:border-[#27272a] rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                {t('auth.log_in', 'Log In')}
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-2 sm:px-3.5 py-1.5 text-[11px] sm:text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e5c07b] rounded-xl shadow-sm shadow-[#d4af37]/20 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                {t('auth.sign_up', 'Sign Up')}
              </button>
            </>
          )}

        </div>

        {/* Expandable Full-Width Search Row on <390px Screens */}
        {mobileSearchOpen && (
          <div className="min-[390px]:hidden basis-full pt-1.5 relative">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 pointer-events-none" />
              <input
                type="text"
                autoFocus
                value={localSearch}
                onFocus={() => setIsSearchFocused(true)}
                onChange={(e) => handleUpdateSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchEnter(true);
                  }
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="w-full bg-white dark:bg-[#141418] border border-[#d4af37]/60 rounded-xl pl-8 pr-16 py-2 text-xs text-stone-900 dark:text-[#f4f4f5] placeholder-stone-400 dark:placeholder-neutral-400 focus:outline-none"
              />
              <div className="absolute right-2 flex items-center gap-1">
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => handleUpdateSearch('')}
                    aria-label="Clear search"
                    className="p-1 text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setMobileSearchOpen(false)}
                  className="px-1.5 py-0.5 text-[10px] font-semibold text-neutral-400 hover:text-white cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
            {localSearch.trim().length > 0 && (
              <div className="fixed left-3 right-3 top-[calc(var(--acovon-header-height,96px)+4px)] bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-2.5 z-50 space-y-2.5 max-h-[65dvh] overflow-y-auto">
                {renderSearchDropdownResults(true)}
              </div>
            )}
          </div>
        )}

      </div>
    </header>
  );
};


