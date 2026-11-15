import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, FeedActivityFilterType, RecommendedPostResult } from '../../types';
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
    new Set((activeCategories || []).map(c => c.name).filter(Boolean))
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

