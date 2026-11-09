import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, FeedActivityFilterType, RecommendedPostResult } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { PostCard } from './PostCard';
import { AdBanner } from '../ads/AdBanner';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { PlusCircle, Sparkles, Sliders, RotateCcw, EyeOff, Check, Unlock, Flame, Search, X } from 'lucide-react';

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
  onOpenHelpCenter
}) => {
  const { 
    posts, 
    creators, 
    currentUser, 
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
    trackEngagementEvent
  } = useApp();

  const [feedFilter, setFeedFilter] = useState<FeedActivityFilterType>('all');
  const [feedSearchQuery, setFeedSearchQuery] = useState<string>('');
  const [showPersonalizationInspector, setShowPersonalizationInspector] = useState(false);

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
    const matchesQuery = (post: Post) => {
      if (!q) return true;
      return (
        post.content.toLowerCase().includes(q) ||
        post.creatorName.toLowerCase().includes(q) ||
        post.creatorUsername.toLowerCase().includes(q) ||
        (post.tags && post.tags.some(t => t.toLowerCase().includes(q.replace(/^#/, '')))) ||
        (post.categories && post.categories.some(c => c.toLowerCase().includes(q)))
      );
    };

    if (feedFilter === 'for_you' || feedFilter === 'free_posts') {
      return recommendedResults.map(r => r.post).filter(matchesQuery);
    }

    const hiddenCreators = new Set(activeFanInterestProfile?.hiddenCreatorIds || []);
    const hiddenPosts = new Set([
      ...(activeFanInterestProfile?.notInterestedPostIds || []),
      ...(activeFanInterestProfile?.reportedPostIds || [])
    ]);

    return posts.filter(post => {
      if (post.moderationStatus === 'removed') return false;
      if (suspendedCreatorIds.has(post.creatorId)) return false;
      if (hiddenPosts.has(post.id)) return false;
      if (hiddenCreators.has(post.creatorId) && post.creatorId !== currentUser.id) return false;
      if (!matchesQuery(post)) return false;

      if (feedFilter === 'all') return true;
      if (feedFilter === 'following') return following.includes(post.creatorId) || post.creatorId === currentUser.id;
      if (feedFilter === 'subscribed') return isSubscribedTo(post.creatorId) || post.creatorId === currentUser.id;
      if (feedFilter === 'ppv') return post.visibility === 'pay_per_view';
      return true;
    });
  }, [
    feedFilter,
    feedSearchQuery,
    recommendedResults,
    posts,
    suspendedCreatorIds,
    activeFanInterestProfile,
    following,
    isSubscribedTo,
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

  const isCreator = isCurrentUserApprovedCreator;
  const isSubscribedToAnyone = creators.some(c => isSubscribedTo(c.id));

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

  const availableCategories = CATEGORIES.filter(c => c !== 'All Categories');

  const handleToggleColdStartCategory = (cat: string) => {
    const current = activeFanInterestProfile.onboardingCategories || [];
    const next = current.includes(cat)
      ? current.filter(c => c !== cat)
      : [...current, cat];
    setFanOnboardingCategories(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 overflow-x-hidden">
      {/* Horizontal Status / Stories Bar */}
      <div className="flex items-center gap-3 sm:gap-3.5 overflow-x-auto pb-3.5 mb-5 no-scrollbar border-b border-[#26262b]">
        {/* Creator's Own Story Button if user is a creator */}
        {isCreator && (
          <button
            onClick={() => {
              if (userActiveStatuses.length > 0) {
                onOpenStatusViewer(currentUser.id);
              } else if (onOpenCreateStatus) {
                onOpenCreateStatus();
              }
            }}
            className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
            title={userActiveStatuses.length > 0 ? "View your active story" : "Post a new story"}
          >
            <div className="relative p-0.5 rounded-full">
              <div className={`p-0.5 rounded-full ${
                userActiveStatuses.length > 0 
                  ? 'bg-gradient-to-tr from-[#d4af37] via-[#fce7b0] to-[#997819]' 
                  : 'border border-dashed border-neutral-600'
              }`}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-full object-cover border-2 border-[#09090b]"
                />
              </div>
              <span className="absolute bottom-0 right-0 w-4 h-4 bg-amber-400 text-black text-[11px] font-black rounded-full flex items-center justify-center border-2 border-[#09090b] shadow">
                +
              </span>
            </div>
            <span className="text-[11px] text-amber-300/90 font-medium truncate max-w-[64px]">
              Your Story
            </span>
          </button>
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
              onClick={() => {
                onOpenStatusViewer(c.id);
              }}
              className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer focus:outline-none"
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
              <span className={`text-[11px] font-medium truncate max-w-[76px] inline-flex items-center gap-1 transition-colors ${
                isUnseen ? 'text-amber-200 font-semibold' : 'text-neutral-300 group-hover:text-white'
              }`}>
                <span className="truncate">{c.name.split(' ')[0]}</span>
                <VerifiedBadge creatorId={c.id} size="xs" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Feed Search Bar (replaces Recommended Creators) */}
      <div className="mb-6 p-3.5 rounded-2xl bg-[#121215] border border-[#26262b] space-y-3">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={feedSearchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setFeedSearchQuery(val);
              if (val.trim().length >= 3) {
                trackEngagementEvent({
                  eventType: 'search_performed',
                  contentType: 'search',
                  searchQuery: val.trim(),
                  sourceSurface: feedFilter === 'free_posts' ? 'free_posts' : 'for_you'
                });
              }
            }}
            placeholder="Search feed posts, creators, @usernames, #hashtags, or categories..."
            className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-10 pr-9 py-2.5 text-xs text-[#f4f4f5] placeholder-neutral-400 focus:outline-none transition-colors"
          />
          {feedSearchQuery && (
            <button
              type="button"
              onClick={() => setFeedSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-3 p-1 text-neutral-400 hover:text-white rounded-lg cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {matchingSearchCreators.length > 0 && (
          <div className="pt-1 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 px-1">
              Matching Creators ({matchingSearchCreators.length})
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                      sourceSurface: feedFilter === 'free_posts' ? 'free_posts' : 'for_you'
                    });
                    onNavigateToCreator(creator.id);
                  }}
                  className="p-2 rounded-xl bg-[#16161b] hover:bg-[#1c1c24] border border-[#27272a] hover:border-[#d4af37]/40 flex items-center gap-2.5 text-left transition-all cursor-pointer"
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
      </div>

      {/* Activity-Filter Bar — Exact 6 Filters in Required Order */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-5">
        <div className="flex items-center gap-1 p-1 bg-[#141418] border border-[#27272a] rounded-xl text-xs overflow-x-auto no-scrollbar">
          <button
            onClick={() => setFeedFilter('all')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              feedFilter === 'all' ? 'bg-[#27272a] text-white shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setFeedFilter('for_you')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              feedFilter === 'for_you'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b89225] text-black font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className={`w-3 h-3 ${feedFilter === 'for_you' ? 'text-black' : 'text-[#d4af37]'}`} />
            <span>For You</span>
          </button>
          <button
            onClick={() => setFeedFilter('following')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              feedFilter === 'following' ? 'bg-[#27272a] text-[#fce7b0] shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Following
          </button>
          <button
            onClick={() => setFeedFilter('subscribed')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              feedFilter === 'subscribed' ? 'bg-[#27272a] text-white shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Subscribed
          </button>
          <button
            onClick={() => setFeedFilter('free_posts')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1 ${
              feedFilter === 'free_posts'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Unlock className={`w-3 h-3 ${feedFilter === 'free_posts' ? 'text-emerald-300' : 'text-emerald-400'}`} />
            <span>Free Posts</span>
          </button>
          <button
            onClick={() => setFeedFilter('ppv')}
            className={`px-3 py-1.5 font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              feedFilter === 'ppv' ? 'bg-[#27272a] text-white shadow-sm font-semibold' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pay-To-View Vault
          </button>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPersonalizationInspector(prev => !prev)}
            className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              showPersonalizationInspector || feedFilter === 'for_you' || feedFilter === 'free_posts'
                ? 'bg-[#1a1812] border-[#d4af37]/40 text-[#fce7b0]'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
            title="Inspect or switch Fan Personalization Profile & Test Cases"
          >
            <Sliders className="w-3 h-3 text-[#d4af37]" />
            <span>Personalize</span>
          </button>
          <span className="text-xs text-neutral-500 font-mono">
            {filteredPosts.length} posts
          </span>
        </div>
      </div>

      {/* Contextual Smart Feed Header & Persona Switcher for For You / Free Posts / Inspector */}
      {(feedFilter === 'for_you' || feedFilter === 'free_posts' || showPersonalizationInspector) && (
        <div className="mb-6 p-4 rounded-2xl bg-[#121216] border border-[#2a2a34] space-y-3.5 text-xs animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#22222a]">
            <div className="flex items-center gap-2">
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

          {/* Fan Persona Switcher (Jordan Cross + Test Cases Fan A - Fan F) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
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
              <div className="flex items-center justify-between">
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
        <div className="p-10 rounded-2xl bg-[#121215] border border-[#26262b] text-center space-y-3">
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

