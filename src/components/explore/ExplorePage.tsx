import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, Post } from '../../types';
import { CATEGORIES, DEMO_STATS } from '../../data/mockData';
import { matchesCategoryIdentifier, matchesCountryIdentifier } from '../../data/globalTaxonomy';
import { DiscoveryFilterBar } from '../discovery/DiscoveryFilterBar';
import { AdBanner } from '../ads/AdBanner';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { TranslateContentButton } from '../common/TranslateContentButton';
import { 
  Search, 
  Video, 
  Clapperboard, 
  CheckCircle2, 
  Filter, 
  Sparkles, 
  ArrowRight,
  Flame,
  Check,
  Rocket,
  Film,
  Camera,
  Play,
  Pause,
  Lock,
  Eye,
  Layers,
  X
} from 'lucide-react';

interface ExplorePageProps {
  onSelectCreator: (creatorId: string) => void;
  onOpenCreatorAd?: () => void;
  onGoAdFree?: () => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  onSelectCreator,
  onOpenCreatorAd,
  onGoAdFree,
  onOpenVideoPlayer,
  onOpenPhotoViewer,
  onOpenSubscribeModal,
  searchQuery: externalSearchQuery,
  onSearchChange
}) => {
  const {
    creators,
    posts,
    categories,
    countries,
    getCountryFlagAndName,
    promotions,
    activeRole,
    isAuthenticated,
    currentUser,
    isFollowing,
    isSubscribedTo,
    isPostPurchased,
    showDemoBadges,
    isCreatorVerifiedBadgeActive,
    getRecommendedCreators,
    getRecommendedPosts,
    activeFanInterestProfile,
    trackEngagementEvent
  } = useApp();

  const [activeTab, setActiveTab] = useState<'creators' | 'media_library'>('creators');
  const [internalSearchQuery, setInternalSearchQuery] = useState(externalSearchQuery ?? '');
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = (val: string) => {
    setInternalSearchQuery(val);
    onSearchChange?.(val);
  };
  const [appliedFilters, setAppliedFilters] = useState<{
    categories: string[];
    videoCountries: string[];
    creatorCountries: string[];
  }>({
    categories: [],
    videoCountries: [],
    creatorCountries: []
  });
  const [filterLiveCalls, setFilterLiveCalls] = useState(false);
  const [filterCustomReqs, setFilterCustomReqs] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  
  // Media library filter
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'videos' | 'photos' | 'ppv'>('all');
  const [activePreviewPost, setActivePreviewPost] = useState<Post | null>(null);

  // Check if creator is currently promoted
  const boostedCreatorIds = new Set(
    promotions.filter(p => p.type === 'boost_profile' && p.status === 'active').map(p => p.creatorId)
  );

  const filteredCreators = creators.filter(c => {
    if (c.accountStatus === 'suspended' || c.accountStatus === 'banned') return false;
    if ((activeFanInterestProfile?.hiddenCreatorIds || []).includes(c.id)) return false;

    // Search query
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = 
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.username.toLowerCase().includes(q.replace(/^@/, '')) ||
      (c.bio?.toLowerCase() || '').includes(q) ||
      (c.country?.toLowerCase() || '').includes(q) ||
      c.category.toLowerCase().includes(q) ||
      (c.categories && c.categories.some(cat => cat.toLowerCase().includes(q)));

    if (!matchSearch) return false;

    // Category filter (multi-select)
    if (appliedFilters.categories.length > 0) {
      const creatorCats = c.categories && c.categories.length > 0 ? c.categories : [c.category];
      if (!matchesCategoryIdentifier(creatorCats, undefined, appliedFilters.categories, categories)) {
        return false;
      }
    }

    // Creator Country filter
    if (appliedFilters.creatorCountries.length > 0) {
      if (!matchesCountryIdentifier(c.country, c.creator_country_id, appliedFilters.creatorCountries, countries)) {
        return false;
      }
    }

    // Video Country filter on Creators tab: matches creators who have published at least one public/visible post in that video country
    if (appliedFilters.videoCountries.length > 0) {
      const hasVideoInCountry = posts.some(
        p =>
          p.creatorId === c.id &&
          !p.isDeletedByCreator &&
          p.moderationStatus !== 'removed' &&
          !p.isDraft &&
          p.visibility !== 'private' &&
          matchesCountryIdentifier(p.country, p.video_country_id, appliedFilters.videoCountries, countries)
      );
      if (!hasVideoInCountry) return false;
    }

    // Filters
    if (filterLiveCalls && !c.isLiveForCalls) return false;
    if (filterCustomReqs && !c.acceptingCustomRequests) return false;
    if (filterVerifiedOnly && !isCreatorVerifiedBadgeActive(c.id)) return false;

    return true;
  });

  const filteredPosts = posts.filter(p => {
    if (p.isDeletedByCreator || p.moderationStatus === 'removed' || p.isDraft || p.visibility === 'private') return false;
    if ((activeFanInterestProfile?.notInterestedPostIds || []).includes(p.id)) return false;
    if ((activeFanInterestProfile?.hiddenCreatorIds || []).includes(p.creatorId)) return false;

    const matchSearch = 
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (p.categories && p.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchSearch) return false;

    if (appliedFilters.categories.length > 0) {
      if (!matchesCategoryIdentifier(p.categories, p.category_ids, appliedFilters.categories, categories)) {
        return false;
      }
    }

    if (appliedFilters.videoCountries.length > 0) {
      if (!matchesCountryIdentifier(p.country, p.video_country_id, appliedFilters.videoCountries, countries)) {
        return false;
      }
    }

    if (appliedFilters.creatorCountries.length > 0) {
      const postCreator = creators.find(c => c.id === p.creatorId);
      if (
        !postCreator ||
        !matchesCountryIdentifier(
          postCreator.country,
          postCreator.creator_country_id,
          appliedFilters.creatorCountries,
          countries
        )
      ) {
        return false;
      }
    }

    if (mediaTypeFilter === 'videos') {
      return p.media.some(m => m.type === 'video');
    }
    if (mediaTypeFilter === 'photos') {
      return p.media.some(m => m.type === 'image');
    }
    if (mediaTypeFilter === 'ppv') {
      return p.visibility === 'pay_per_view';
    }

    return true;
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackEngagementEvent({
        eventType: 'search_performed',
        searchQuery: searchQuery.trim(),
        category: appliedFilters.categories[0],
        surface: 'explore'
      });
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
      
      {/* Media Type Filter for Media Library Tab */}
      {activeTab === 'media_library' && (
        <div className="flex flex-wrap items-center gap-2 mb-8 text-xs">
          <button
            onClick={() => setMediaTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              mediaTypeFilter === 'all'
                ? 'bg-[#d4af37] text-black font-semibold border-[#d4af37]'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            All Media ({posts.length})
          </button>

          <button
            onClick={() => setMediaTypeFilter('videos')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              mediaTypeFilter === 'videos'
                ? 'bg-amber-950/60 border-[#d4af37] text-[#fce7b0] font-semibold'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Playable Videos ({posts.filter(p => p.media.some(m => m.type === 'video')).length})</span>
          </button>

          <button
            onClick={() => setMediaTypeFilter('photos')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              mediaTypeFilter === 'photos'
                ? 'bg-amber-950/60 border-[#d4af37] text-[#fce7b0] font-semibold'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Photography ({posts.filter(p => p.media.some(m => m.type === 'image')).length})</span>
          </button>

          <button
            onClick={() => setMediaTypeFilter('ppv')}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              mediaTypeFilter === 'ppv'
                ? 'bg-amber-950/60 border-[#d4af37] text-[#fce7b0] font-semibold'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Pay-Per-View Vault ({posts.filter(p => p.visibility === 'pay_per_view').length})</span>
          </button>
        </div>
      )}

      {/* VIEW 1: CREATORS GRID */}
      {activeTab === 'creators' && (
        <>
          {filteredCreators.length === 0 ? (
            <div className="p-12 text-center bg-[#121215] border border-[#27272a] rounded-2xl">
              <p className="text-neutral-400 text-xs">No creators matching your criteria were found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredCreators.map(creator => {
                const isBoosted = boostedCreatorIds.has(creator.id);

                return (
                  <div
                    key={creator.id}
                    onClick={() => onSelectCreator(creator.id)}
                    className="bg-[#121215] border border-[#26262b] hover:border-[#3d3d46] rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 group shadow-xl flex flex-col justify-between"
                  >
                    <div>
                      {/* Cover */}
                      <div className="relative h-32 bg-neutral-900 overflow-hidden">
                        <img
                          src={creator.coverImage}
                          alt={creator.name}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-transparent" />

                        {isBoosted && (
                          <div className="absolute top-3 left-3 bg-[#d4af37] text-black font-bold text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            <span>SPONSORED SPOTLIGHT</span>
                          </div>
                        )}

                        {creator.isLiveForCalls && (
                          <div className="absolute top-3 right-3 bg-emerald-500 text-black font-bold text-[10px] px-2 py-0.5 rounded shadow flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                            <span>CALLS READY (${creator.callRatePerMinute}/m)</span>
                          </div>
                        )}
                      </div>

                      {/* Body Info */}
                      <div className="p-5 pt-0 relative">
                        <div className="flex items-end justify-between -mt-10 mb-3">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 rounded-xl object-cover border-2 border-[#121215] shadow-lg"
                          />
                          <span className="text-xs font-mono font-bold text-[#fce7b0]">
                            From ${creator.tiers[0]?.price}/mo
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="font-bold text-white text-base group-hover:text-[#fce7b0] transition-colors">
                              {creator.name}
                            </h3>
                            <VerifiedBadge creatorId={creator.id} size="sm" />
                            {showDemoBadges && creator.isDemo && (
                              <span className="text-[9px] font-mono font-bold tracking-wider px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                                DEMO
                              </span>
                            )}
                          </div>

                          {/* Unboxed Metadata with Creator Country Flag */}
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400">
                            <span>@{creator.username}</span>
                            <span aria-hidden="true">·</span>
                            <span>{creator.category}</span>
                            {creator.country && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-neutral-300">
                                  {getCountryFlagAndName(creator.country).flag} {getCountryFlagAndName(creator.country).name}
                                </span>
                              </>
                            )}
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-neutral-300">
                              {(creator.followersCount / 1000).toFixed(1)}k followers
                            </span>
                          </div>

                          <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed pt-2">
                            {creator.bio}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Strip */}
                    <div className="p-4 bg-[#16161b] border-t border-[#1f1f23] flex items-center justify-between text-xs">
                      <div className="text-neutral-400 text-[11px]">
                        {creator.acceptingCustomRequests ? 'Custom Videos Available' : 'Direct Subscriptions'}
                      </div>
                      <div className="text-[#d4af37] font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>View Profile</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* VIEW 2: DEMONSTRATION MEDIA LIBRARY GRID */}
      {activeTab === 'media_library' && (
        <div>
          {filteredPosts.length === 0 ? (
            <div className="p-12 text-center bg-[#121215] border border-[#27272a] rounded-2xl">
              <p className="text-neutral-400 text-xs">No media assets matching your filter criteria were found.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-5 sm:gap-6">
              {filteredPosts.map(post => {
                const primaryMedia = post.media[0];
                const isVideo = primaryMedia?.type === 'video';
                const hasMultipleMedia = post.media.length > 1;
                const isOwnPost = isAuthenticated && currentUser.id === post.creatorId;
                const isLockedCard =
                  !isOwnPost &&
                  ((post.visibility === 'subscribers' && !isSubscribedTo(post.creatorId)) ||
                    (post.visibility === 'pay_per_view' && !isPostPurchased(post.id)) ||
                    (post.visibility === 'followers' &&
                      !isFollowing(post.creatorId) &&
                      !isSubscribedTo(post.creatorId)));
                const safeThumbSrc = isLockedCard
                  ? primaryMedia?.thumbnailUrl && primaryMedia.thumbnailUrl !== primaryMedia.url
                    ? primaryMedia.thumbnailUrl
                    : undefined
                  : primaryMedia?.thumbnailUrl || primaryMedia?.url;

                return (
                  <div
                    key={post.id}
                    className="bg-[#121215] border border-[#26262b] hover:border-[#3d3d46] rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between group transition-all"
                  >
                    <div>
                      {/* Media Thumbnail with Play/Lock Overlay */}
                      <div 
                        className="relative aspect-video bg-black cursor-pointer overflow-hidden"
                        onClick={() => {
                          if (isVideo && onOpenVideoPlayer) {
                            onOpenVideoPlayer(post.id, 0);
                          } else if (!isVideo && onOpenPhotoViewer) {
                            onOpenPhotoViewer(post.id, 0);
                          } else {
                            setActivePreviewPost(post);
                          }
                        }}
                      >
                        {safeThumbSrc ? (
                          <img
                            src={safeThumbSrc}
                            alt={post.content}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                              isLockedCard ? 'blur-lg opacity-35' : ''
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#101016] flex items-center justify-center">
                            <Lock className="w-8 h-8 text-[#d4af37]/60" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

                        {/* Badges on Thumbnail */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                          {isVideo ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                              <Play className="w-3 h-3 text-[#d4af37] fill-[#d4af37]" />
                              <span>Playable Video</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-semibold text-white border border-white/10">
                              <Camera className="w-3 h-3 text-[#d4af37]" />
                              <span>Photo Gallery</span>
                            </span>
                          )}

                          {hasMultipleMedia && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-neutral-300 border border-white/10">
                              <Layers className="w-3 h-3" />
                              <span>{post.media.length}</span>
                            </span>
                          )}
                        </div>

                        {/* Top-Right Visibility Badge */}
                        <div className="absolute top-2.5 right-2.5">
                          {post.visibility === 'pay_per_view' && (
                            <span className="px-2 py-0.5 rounded bg-[#d4af37] text-black text-[10px] font-bold shadow-md">
                              PPV ${post.ppvPrice}
                            </span>
                          )}
                          {post.visibility === 'subscribers' && (
                            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[#fce7b0] text-[10px] font-bold shadow-md">
                              Subscribers Only
                            </span>
                          )}
                          {post.visibility === 'public' && (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                              Public Free
                            </span>
                          )}
                        </div>

                        {/* Play Center Hover Icon */}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-12 h-12 rounded-full bg-[#d4af37]/90 text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-black" />
                            </div>
                          </div>
                        )}

                        {/* Duration at Bottom-Right */}
                        {isVideo && primaryMedia?.durationSeconds && (
                          <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-white">
                            {Math.floor(primaryMedia.durationSeconds / 60)}:
                            {(primaryMedia.durationSeconds % 60).toString().padStart(2, '0')}
                          </div>
                        )}
                      </div>

                      {/* Post Caption & Creator Header */}
                      <div className="p-4 space-y-2.5">
                        <div 
                          onClick={() => onSelectCreator(post.creatorId)}
                          className="flex items-center gap-2 cursor-pointer group/creator"
                        >
                          <img
                            src={post.creatorAvatar}
                            alt={post.creatorName}
                            referrerPolicy="no-referrer"
                            className="w-7 h-7 rounded-full object-cover border border-[#27272a]"
                          />
                          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                            <span className="text-xs font-semibold text-white group-hover/creator:text-[#fce7b0] transition-colors inline-flex items-center gap-1">
                              <span>{post.creatorName}</span>
                              <VerifiedBadge creatorId={post.creatorId} size="xs" />
                            </span>
                            <span className="text-[10px] text-neutral-400">
                              @{post.creatorUsername}
                            </span>
                          </div>
                        </div>

                        <TranslateContentButton
                          text={post.content}
                          contentType="post"
                          contentRef={`explore_card_${post.id}`}
                          renderPrimaryText
                          collapsible
                          compact
                          linkify
                          textClassName="text-xs text-neutral-300 leading-relaxed"
                        />

                        {/* Categories, Video Country & Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.categories?.map(cat => (
                            <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1c1c22] text-[#fce7b0] border border-[#2e2e38]">
                              {cat}
                            </span>
                          ))}
                          {post.country && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#16161d] text-neutral-300 border border-[#272732]">
                              {getCountryFlagAndName(post.country).flag} {getCountryFlagAndName(post.country).name}
                            </span>
                          )}
                          {post.tags?.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[10px] text-neutral-400">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="p-3 bg-[#15151a] border-t border-[#1f1f23] flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                        <span>{post.likesCount} likes</span>
                        <span>{post.commentsCount} comments</span>
                      </div>

                      <button
                        onClick={() => {
                          if (isVideo && onOpenVideoPlayer) {
                            onOpenVideoPlayer(post.id, 0);
                          } else if (!isVideo && onOpenPhotoViewer) {
                            onOpenPhotoViewer(post.id, 0);
                          } else {
                            setActivePreviewPost(post);
                          }
                        }}
                        className="text-[#d4af37] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        <span>{isVideo ? 'Watch Video' : 'View Photos'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL: Full Media Preview for Playable Videos and Photos */}
      {activePreviewPost && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-3xl w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 acovon-modal-panel">
            {/* Modal Header */}
            <div className="p-3 sm:p-4 border-b border-[#26262b] flex items-center justify-between gap-2 shrink-0">
              <div 
                onClick={() => {
                  onSelectCreator(activePreviewPost.creatorId);
                  setActivePreviewPost(null);
                }}
                className="flex items-center gap-3 cursor-pointer group min-w-0"
              >
                <img
                  src={activePreviewPost.creatorAvatar}
                  alt={activePreviewPost.creatorName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-[#d4af37]/40 shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white group-hover:text-[#fce7b0] flex items-center gap-1.5">
                    <span className="truncate">{activePreviewPost.creatorName}</span>
                    <VerifiedBadge creatorId={activePreviewPost.creatorId} size="sm" />
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center gap-1 truncate">
                    <span>@{activePreviewPost.creatorUsername}</span>
                    <span>· {activePreviewPost.visibility}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActivePreviewPost(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
            {/* Media Player / Image Viewer */}
            <div className="relative bg-black aspect-video max-h-[55dvh] mx-auto w-full flex items-center justify-center">
              {!(
                isAuthenticated && currentUser.id === activePreviewPost.creatorId
              ) &&
              ((activePreviewPost.visibility === 'subscribers' &&
                !isSubscribedTo(activePreviewPost.creatorId)) ||
                (activePreviewPost.visibility === 'pay_per_view' &&
                  !isPostPurchased(activePreviewPost.id)) ||
                (activePreviewPost.visibility === 'followers' &&
                  !isFollowing(activePreviewPost.creatorId) &&
                  !isSubscribedTo(activePreviewPost.creatorId))) ? (
                <div className="p-6 text-center space-y-3">
                  <Lock className="w-8 h-8 text-[#d4af37] mx-auto" />
                  <p className="text-xs text-neutral-300">
                    This content requires creator access to view.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (activePreviewPost.visibility === 'subscribers' && onOpenSubscribeModal) {
                        onOpenSubscribeModal(activePreviewPost.creatorId);
                      } else {
                        onSelectCreator(activePreviewPost.creatorId);
                        setActivePreviewPost(null);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs cursor-pointer"
                  >
                    View Creator Profile
                  </button>
                </div>
              ) : activePreviewPost.media[0]?.type === 'video' ? (
                <video
                  src={activePreviewPost.media[0].url || activePreviewPost.media[0].previewUrl || ''}
                  poster={
                    activePreviewPost.media[0].thumbnailUrl !== activePreviewPost.media[0].url
                      ? activePreviewPost.media[0].thumbnailUrl
                      : undefined
                  }
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full overflow-y-auto p-2 flex items-center justify-center gap-2">
                  <img
                    src={activePreviewPost.media[0]?.url}
                    alt={activePreviewPost.content}
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </div>
              )}
            </div>

            {/* Caption & Metadata */}
            <div className="p-5 space-y-3">
              <TranslateContentButton
                text={activePreviewPost.content}
                contentType="post"
                contentRef={`explore_preview_${activePreviewPost.id}`}
                renderPrimaryText
                collapsible
                compact
                linkify
                maxExpandedHeightClass="max-h-[28vh] overflow-y-auto"
                textClassName="text-sm text-neutral-200 leading-relaxed"
              />

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1f1f23] justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {activePreviewPost.categories?.map(cat => (
                    <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#1a1a22] text-[#fce7b0] border border-[#2e2e38]">
                      {cat}
                    </span>
                  ))}
                  {activePreviewPost.tags?.map(t => (
                    <span key={t} className="text-xs text-[#d4af37]">
                      #{t}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => {
                    onSelectCreator(activePreviewPost.creatorId);
                    setActivePreviewPost(null);
                  }}
                  className="px-4 py-1.5 rounded-xl bg-[#d4af37] text-black font-semibold text-xs hover:bg-[#e6c14d] transition-colors cursor-pointer"
                >
                  Visit Creator Profile
                </button>
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Google AdSense / AdMob partner ad for free users */}
      {onGoAdFree && (
        <div className="mt-8">
          <AdBanner placement="explore" onGoAdFree={onGoAdFree} />
        </div>
      )}

    </div>
  );
};
