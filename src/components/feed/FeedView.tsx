import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, FeedActivityFilterType, RecommendedPostResult } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { PostCard } from './PostCard';
import { AdBanner } from '../ads/AdBanner';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { DiscoveryFilterBar, DiscoveryFilterState } from '../discovery/DiscoveryFilterBar';
import {
  matchesCategoryIdentifier,
  matchesCountryIdentifier
} from '../../data/globalTaxonomy';
import { PlusCircle, Sparkles, Sliders, RotateCcw, EyeOff, Check, Unlock, Flame, Search, X, Grid } from 'lucide-react';

interface FeedViewProps {
  onNavigateToCreator: (creatorId: string) => void;
  onOpenCreatePost: () => void;
  onOpenTipModal: (creatorId: string, creatorName: string) => void;
  onGoAdFree: () => void;
  onOpenCreatorAd?: () => void;
  onNavigateToRequests?: () => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  onOpenShareModal?: (post: Post) => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
  onOpenStatusViewer: (creatorId: string) => void;
  onOpenCreateStatus?: () => void;
  onNavigate?: (tab: string, creatorId?: string) => void;
  onOpenWallet?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHelpCenter?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  onNavigateToCreator,
  onOpenCreatePost,
  onOpenTipModal,
  onGoAdFree,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenVideoPlayer,
  onOpenPhotoViewer,
  onOpenStatusViewer,
  onOpenCreateStatus,
  onNavigate,
  onOpenWallet,
  onOpenPrivacy,
  onOpenHelpCenter,
  searchQuery = '',
  onClearSearch
}) => {
  const { 
    posts, 
    creators, 
    currentUser, 
    isAuthenticated,
    isCurrentUserApprovedCreator,
    isSubscribedTo, 
    following,
    adSettings,
    getActiveCreatorStatuses,
    hasUnseenStatus,
    platformConfig,
    getRecommendedPosts,
    getRecommendedCreators,
    fanInterestProfiles,
    activeRecommendationFanId,
    activeFanInterestProfile,
    switchRecommendationFanPersona,
    setFanOnboardingCategories,
    unhideCreatorForFan,
    resetFanRecommendations,
    trackEngagementEvent,
    activeCategories,
    activeCountries
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<FeedActivityFilterType>('all');
  const feedSearchQuery = searchQuery;
  const [showPersonalizationInspector, setShowPersonalizationInspector] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && (feedFilter === 'following' || feedFilter === 'subscribed')) {
      setFeedFilter('all');
    }
  }, [isAuthenticated, feedFilter]);
  const [showCategoriesFilterPanel, setShowCategoriesFilterPanel] = useState(false);
  const [discoveryFilters, setDiscoveryFilters] = useState<DiscoveryFilterState>({
    categories: [],
    videoCountries: [],
    creatorCountries: []
  });

  const creatorLookup = useMemo(() => {
    const map = new Map<string, (typeof creators)[number]>();
    creators.forEach(c => map.set(c.id, c));
    return map;
  }, [creators]);

  const suspendedCreatorIds = useMemo(
    () =>
      new Set(
        creators
          .filter(c => c.accountStatus === 'suspended' || c.accountStatus === 'banned')
          .map(c => c.id)
      ),
    [creators]
  );

  // Compute personalized recommendations when For You or Free Posts is active
  const recommendedResults = useMemo<RecommendedPostResult[]>(() => {
    if (feedFilter === 'for_you') {
      return getRecommendedPosts('for_you');
    }
    if (feedFilter === 'free_posts') {
      return getRecommendedPosts('free_posts');
    }
    return [];
  }, [feedFilter, getRecommendedPosts]);

  const recommendationMap = useMemo(() => {
    const map = new Map<string, RecommendedPostResult>();
    recommendedResults.forEach(r => map.set(r.post.id, r));
    return map;
  }, [recommendedResults]);

  const filteredPosts = useMemo<Post[]>(() => {
    const q = feedSearchQuery.trim().toLowerCase();
    const matchesQueryAndTaxonomy = (post: Post) => {
      if (
        discoveryFilters.categories.length > 0 &&
        !matchesCategoryIdentifier(
          post.categories,
          post.category_ids,
          discoveryFilters.categories,
          activeCategories
        )
      ) {
        return false;
      }

      if (
        discoveryFilters.videoCountries.length > 0 &&
        !matchesCountryIdentifier(
          post.country,
          post.video_country_id,
          discoveryFilters.videoCountries,
          activeCountries
        )
      ) {
        return false;
      }

      if (discoveryFilters.creatorCountries.length > 0) {
        const postCreator = creatorLookup.get(post.creatorId);
        if (
          !matchesCountryIdentifier(
            postCreator?.country,
            postCreator?.creator_country_id,
            discoveryFilters.creatorCountries,
            activeCountries
          )
        ) {
          return false;
        }
      }

      if (!q) return true;
      return (
        post.content.toLowerCase().includes(q) ||
        post.creatorName.toLowerCase().includes(q) ||
        post.creatorUsername.toLowerCase().includes(q) ||
        (post.country && post.country.toLowerCase().includes(q)) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(q.replace(/^#/, '')))) ||
        (post.categories && post.categories.some(c => c.toLowerCase().includes(q)))
      );
    };

    if (feedFilter === 'for_you' || feedFilter === 'free_posts') {
      return recommendedResults
        .map(r => r.post)
        .filter(
          p =>
            !p.isDeletedByCreator &&
            p.moderationStatus !== 'removed' &&
            ((isAuthenticated && p.creatorId === currentUser.id) || p.visibility !== 'private')
        )
        .filter(matchesQueryAndTaxonomy);
    }

    const hiddenCreators = isAuthenticated
      ? new Set(activeFanInterestProfile?.hiddenCreatorIds || [])
      : new Set<string>();
    const hiddenPosts = isAuthenticated
      ? new Set([
          ...(activeFanInterestProfile?.notInterestedPostIds || []),
          ...(activeFanInterestProfile?.reportedPostIds || [])
        ])
      : new Set<string>();

    return posts.filter(post => {
      const isOwnPost = isAuthenticated && post.creatorId === currentUser.id;
      if (post.isDeletedByCreator || post.moderationStatus === 'removed') return false;
      if (post.isDraft && !isOwnPost) return false;
      if (post.visibility === 'private' && !isOwnPost) return false;
      if (suspendedCreatorIds.has(post.creatorId)) return false;
      if (hiddenPosts.has(post.id)) return false;
      if (hiddenCreators.has(post.creatorId) && !isOwnPost) return false;
      if (!matchesQueryAndTaxonomy(post)) return false;

      if (feedFilter === 'all') return true;
      if (feedFilter === 'following') return isAuthenticated && (following.includes(post.creatorId) || isOwnPost);
      if (feedFilter === 'subscribed') return isAuthenticated && (isSubscribedTo(post.creatorId) || isOwnPost);
      if (feedFilter === 'ppv') return post.visibility === 'pay_per_view';
      return true;
    });
  }, [
    feedFilter,
    feedSearchQuery,
    discoveryFilters,
    activeCategories,
    activeCountries,
    creatorLookup,
    recommendedResults,
    posts,
    suspendedCreatorIds,
    activeFanInterestProfile,
    following,
    isSubscribedTo,
    isAuthenticated,
    currentUser.id
  ]);

  const matchingSearchCreators = useMemo(() => {
    const q = feedSearchQuery.trim().toLowerCase();
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
  }, [feedSearchQuery, creators, activeFanInterestProfile]);

  // Top 4 inferred categories for the active fan profile
  const topInferredCategories = useMemo(() => {
    return Object.entries(activeFanInterestProfile.categoryScores)
      .filter(([, score]) => score > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [activeFanInterestProfile.categoryScores]);

  const isCreator = isAuthenticated && isCurrentUserApprovedCreator;
  const isSubscribedToAnyone = isAuthenticated && creators.some(c => isSubscribedTo(c.id));

  // Sort creators so those with active stories are shown first
  const sortedCreators = [...creators]
    .filter(c => c.accountStatus !== 'suspended' && c.accountStatus !== 'banned')
    .sort((a, b) => {
      const aHasStories = getActiveCreatorStatuses(a.id).length > 0;
      const bHasStories = getActiveCreatorStatuses(b.id).length > 0;
      const aUnseen = hasUnseenStatus(a.id);
      const bUnseen = hasUnseenStatus(b.id);
      if (aUnseen && !bUnseen) return -1;
      if (!aUnseen && bUnseen) return 1;
      if (aHasStories && !bHasStories) return -1;
      if (!aHasStories && bHasStories) return 1;
      return 0;
    });

  const userActiveStatuses = isCreator ? getActiveCreatorStatuses(currentUser.id) : [];

  const availableCategories = Array.from(
    new Set(CATEGORIES.filter(c => c !== 'All Categories'))
  );

  const handleToggleColdStartCategory = (cat: string) => {
    const current = activeFanInterestProfile.onboardingCategories || [];
    const next = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat];
    setFanOnboardingCategories(next);
  };

  return (
    <div className="w-full max-w-2xl xl:max-w-[740px] mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-clip">
      {/* Horizontal Status / Stories Bar */}
      <div className="flex items-center gap-3 sm:gap-3.5 overflow-x-auto pb-3.5 mb-5 no-scrollbar border-b border-[#26262b]">
        {/* Creator's Own Story & Quick Create Button */}
        {isCreator && (
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="relative p-0.5 rounded-full">
              <button
                type="button"
                onClick={() => {
                  if (userActiveStatuses.length > 0) {
                    onOpenStatusViewer(currentUser.id);
                  } else if (onOpenCreateStatus) {
                    onOpenCreateStatus();
                  }
                }}
                className="block rounded-full group cursor-pointer focus:outline-none"
                title={userActiveStatuses.length > 0 ? 'View your active story' : 'Post a new story'}
                aria-label={userActiveStatuses.length > 0 ? 'View your active story' : 'Post a new story'}
              >
                <div className={`p-0.5 rounded-full ${
                  userActiveStatuses.length > 0 
                    ? 'bg-gradient-to-tr from-[#d4af37] via-[#fce7b0] to-[#997819]' 
                    : 'border border-dashed border-neutral-600'
                }`}>
                  <img
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#09090b] group-hover:scale-105 transition-transform"
                  />
                </div>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onOpenCreateStatus) {
                    onOpenCreateStatus();
                  }
                }}
                title="Post a new story"
                aria-label="Post a new story"
                className="absolute bottom-0 right-0 w-5 h-5 bg-amber-400 hover:bg-amber-300 text-black text-[12px] font-black rounded-full flex items-center justify-center border-2 border-[#09090b] shadow cursor-pointer transition-transform hover:scale-110 z-10 focus:outline-none"
              >
                +
              </button>
            </div>
            <span className="text-[11px] text-amber-300/90 font-medium truncate max-w-[64px]">
              Your Story
            </span>
          </div>
        )}

        {/* Creators Stories Items */}
        {sortedCreators.map(c => {
          if (isCreator && c.id === currentUser.id) return null;

          const activeStories = getActiveCreatorStatuses(c.id);
          const hasStories = activeStories.length > 0;
          const isUnseen = hasStories && hasUnseenStatus(c.id);

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (hasStories) {
                  onOpenStatusViewer(c.id);
                } else {
                  onNavigateToCreator(c.id);
                }
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none touch-manipulation"
              title={hasStories ? `${c.name}'s story (${activeStories.length} updates)` : `${c.name}'s profile`}
            >
              <div 
                className={`relative p-0.5 rounded-full transition-transform group-hover:scale-105 ${
                  hasStories 
                    ? isUnseen 
                      ? 'bg-gradient-to-tr from-[#d4af37] via-[#fce7b0] to-[#997819] shadow-md shadow-amber-500/10 ring-1 ring-amber-400/30'
                      : 'bg-neutral-700/80'
                    : 'border border-neutral-800'
                }`}
              >
                <img
                  src={c.avatar}
                  alt={c.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#09090b]"
                />
                {c.isLiveForCalls && (
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#09090b] rounded-full" />
                )}
                {hasStories && isUnseen && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-[#09090b]" />
                )}
              </div>
              <span className={`text-[11px] font-medium max-w-[92px] inline-flex items-center gap-1 transition-colors ${
                isUnseen ? 'text-amber-200 font-semibold' : 'text-neutral-300 group-hover:text-white'
              }`}>
                <span className="truncate">{c.name}</span>
                <VerifiedBadge creatorId={c.id} size="xs" />
              </span>
            </button>
          );
        })}
      </div>

      {feedSearchQuery.trim().length > 0 && (
        <div className="mb-4 px-3.5 py-2 rounded-xl bg-[#141418] border border-[#27272a] flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Search className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>
              Filtering feed by <strong className="text-[#fce7b0]">&ldquo;{feedSearchQuery}&rdquo;</strong> ({filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'})
            </span>
          </div>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="px-2 py-0.5 rounded-lg bg-[#1f1f26] hover:bg-[#2a2a34] text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      )}

      {/* Contextual Smart Feed Header & Persona Switcher for For You / Free Posts / Inspector */}
      {(feedFilter === 'for_you' || feedFilter === 'free_posts' || showPersonalizationInspector) && (
        <div className="mb-6 p-4 rounded-2xl bg-[#121216] border border-[#2a2a34] space-y-3.5 text-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#22222a]">
            <div className="flex flex-wrap items-center gap-2">
              {feedFilter === 'free_posts' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]">
                  <Unlock className="w-3 h-3" />
                  <span>Free Posts Personalized Feed</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#fce7b0] font-bold text-[11px]">
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  <span>For You Smart Recommendation Engine</span>
                </span>
              )}
              <span className="text-[11px] text-neutral-400">
                {feedFilter === 'free_posts'
                  ? '100% free accessible posts ranked by your interest profile (no PPV or paid locks)'
                  : 'Ranked by Interest (25%), Creator Affinity (20%), Watch Time (20%) & Engagement'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => resetFanRecommendations()}
              className="inline-flex items-center gap-1 text-[11px] text-neutral-400 hover:text-[#fce7b0] transition-colors cursor-pointer self-start sm:self-auto"
              title="Reset interest scores and hidden items for this fan profile"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Profile</span>
            </button>
          </div>

          {/* Fan Persona Switcher (Authenticated Demo Mode Only) */}
          {isAuthenticated && (
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                <span className="text-neutral-400 font-medium">Active Fan Interest Persona (Switch to verify personalized ranking):</span>
                <span className="font-mono text-[#d4af37]">{activeFanInterestProfile.personaLabel}</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {Object.values(fanInterestProfiles).map(prof => {
                  const isSelected = prof.fanId === activeRecommendationFanId;
                  return (
                    <button
                      key={prof.fanId}
                      type="button"
                      onClick={() => switchRecommendationFanPersona(prof.fanId)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium whitespace-nowrap transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-[#d4af37] text-black font-bold border-[#d4af37] shadow-sm'
                          : 'bg-[#18181f] border-[#272730] text-neutral-300 hover:text-white hover:border-neutral-600'
                      }`}
                    >
                      {prof.fanName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Inferred Interest Scores Bar */}
          {topInferredCategories.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400 mr-1">
                Top Interests:
              </span>
              {topInferredCategories.map(([cat, score]) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#191922] border border-[#2d2d39] text-[11px] text-neutral-200"
                >
                  <Flame className="w-3 h-3 text-[#d4af37]" />
                  <span>{cat}</span>
                  <span className="font-mono text-[10px] text-[#fce7b0]">{Math.round(score)} pts</span>
                </span>
              ))}
              <span className="text-[10px] font-mono text-neutral-400 ml-auto">
                Avg Completion: {activeFanInterestProfile.avgCompletionRate ?? activeFanInterestProfile.avgWatchCompletionPercent ?? 0}%
              </span>
            </div>
          ) : (
            /* Cold Start Onboarding Interest Picker (e.g. Fan F or after Reset) */
            <div className="p-3 rounded-xl bg-[#17171f] border border-[#d4af37]/30 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <span className="font-semibold text-[#fce7b0] text-xs">
                  New Fan Cold-Start Mode — Select categories to personalize your feed immediately:
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {activeFanInterestProfile.onboardingCategories.length} selected
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableCategories.map(cat => {
                  const isPicked = activeFanInterestProfile.onboardingCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleColdStartCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer flex items-center gap-1 ${
                        isPicked
                          ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0]'
                          : 'bg-[#121216] border-[#272730] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {isPicked && <Check className="w-3 h-3 text-[#d4af37]" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hidden Creators Quick Restore Strip if any creator is hidden */}
          {activeFanInterestProfile.hiddenCreatorIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#22222a] text-[11px]">
              <span className="text-neutral-400 flex items-center gap-1">
                <EyeOff className="w-3 h-3 text-rose-400" />
                <span>Hidden Creators:</span>
              </span>
              {activeFanInterestProfile.hiddenCreatorIds.map(cid => {
                const cObj = creators.find(c => c.id === cid);
                return (
                  <button
                    key={cid}
                    type="button"
                    onClick={() => unhideCreatorForFan(cid)}
                    className="px-2 py-0.5 rounded bg-rose-950/50 border border-rose-500/30 text-rose-200 hover:bg-rose-900/60 cursor-pointer flex items-center gap-1"
                  >
                    <span>{cObj?.name || cid}</span>
                    <span className="text-[10px] underline ml-1">Unhide</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Posts Feed with AdSense / AdMob Placements for Free Users */}
      {filteredPosts.length === 0 ? (
        <div className="p-6 sm:p-10 rounded-2xl bg-[#121215] border border-[#26262b] text-center space-y-3">
          <p className="text-sm font-semibold text-white">No posts match this feed filter right now.</p>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            {feedFilter === 'free_posts'
              ? 'All free posts from your current filter have been viewed or hidden. Reset your personalization preferences or explore more creators.'
              : 'Try switching filters or resetting your hidden creator preferences.'}
          </p>
          {(activeFanInterestProfile.notInterestedPostIds.length > 0 ||
            activeFanInterestProfile.hiddenCreatorIds.length > 0) && (
            <button
              type="button"
              onClick={() => resetFanRecommendations()}
              className="px-4 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs cursor-pointer"
            >
              Reset Personalization Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPosts.map((post, index) => {
            const showAd = adSettings.adsEnabled && !isSubscribedToAnyone && (index + 1) % adSettings.frequencyFeedEveryNPosts === 0;
            const recMeta = recommendationMap.get(post.id);

            return (
              <React.Fragment key={post.id}>
                <PostCard
                  post={post}
                  recommendationResult={recMeta}
                  feedSurface={
                    feedFilter === 'for_you'
                      ? 'for_you'
                      : feedFilter === 'free_posts'
                      ? 'free_posts'
                      : feedFilter === 'following'
                      ? 'following'
                      : feedFilter === 'subscribed'
                      ? 'subscribed'
                      : feedFilter === 'ppv'
                      ? 'ppv'
                      : 'feed_all'
                  }
                  onNavigateToCreator={onNavigateToCreator}
                  onOpenTipModal={onOpenTipModal}
                  onOpenSubscribeModal={onOpenSubscribeModal}
                  onOpenShareModal={onOpenShareModal}
                  onOpenVideoPlayer={onOpenVideoPlayer}
                  onOpenPhotoViewer={onOpenPhotoViewer}
                />

                {/* Realistic AdSense / AdMob Unit for Free Users */}
                {showAd && (
                  <AdBanner
                    placement="feed"
                    onGoAdFree={onGoAdFree}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

    </div>
  );
};

