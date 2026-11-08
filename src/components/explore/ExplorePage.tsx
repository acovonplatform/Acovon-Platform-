import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, Post } from '../../types';
import { CATEGORIES, DEMO_STATS } from '../../data/mockData';
import { AdBanner } from '../ads/AdBanner';
import { VerifiedBadge } from '../common/VerifiedBadge';
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
}

export const ExplorePage: React.FC<ExplorePageProps> = ({ 
  onSelectCreator,
  onOpenCreatorAd,
  onGoAdFree,
  onOpenVideoPlayer,
  onOpenPhotoViewer,
  onOpenSubscribeModal
}) => {
  const {
    creators,
    posts,
    promotions,
    activeRole,
    showDemoBadges,
    isCreatorVerifiedBadgeActive,
    getRecommendedCreators,
    getRecommendedPosts,
    activeFanInterestProfile,
    trackEngagementEvent
  } = useApp();

  const [activeTab, setActiveTab] = useState<'creators' | 'media_library'>('creators');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [filterLiveCalls, setFilterLiveCalls] = useState(false);
  const [filterCustomReqs, setFilterCustomReqs] = useState(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  
  // Media library filter
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'videos' | 'photos' | 'ppv'>('all');
  const [activePreviewPost, setActivePreviewPost] = useState<Post | null>(null);

  const recommendedCreatorsForYou = getRecommendedCreators(4);
  const recommendedMediaForYou = getRecommendedPosts('for_you', { limit: 3 });

  // Personalized trending hashtags
  const personalizedHashtags = [
    'hypertrophy',
    'cinematography',
    'michelin',
    'typescript',
    'couture',
    'masterclass',
    '35mm',
    'systemdesign'
  ];

  // Check if creator is currently promoted
  const boostedCreatorIds = new Set(
    promotions.filter(p => p.type === 'boost_profile' && p.status === 'active').map(p => p.creatorId)
  );

  const filteredCreators = creators.filter(c => {
    if (c.accountStatus === 'suspended' || c.accountStatus === 'banned') return false;
    if ((activeFanInterestProfile?.hiddenCreatorIds || []).includes(c.id)) return false;

    // Search query
    const matchSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.bio?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchSearch) return false;

    // Category
    if (selectedCategory !== 'All Categories' && c.category !== selectedCategory) return false;

    // Filters
    if (filterLiveCalls && !c.isLiveForCalls) return false;
    if (filterCustomReqs && !c.acceptingCustomRequests) return false;
    if (filterVerifiedOnly && !isCreatorVerifiedBadgeActive(c.id)) return false;

    return true;
  });

  const filteredPosts = posts.filter(p => {
    if (p.moderationStatus === 'removed') return false;
    if ((activeFanInterestProfile?.notInterestedPostIds || []).includes(p.id)) return false;
    if ((activeFanInterestProfile?.hiddenCreatorIds || []).includes(p.creatorId)) return false;

    const matchSearch = 
      p.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.creatorUsername.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (p.categories && p.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase())));

    if (!matchSearch) return false;

    if (selectedCategory !== 'All Categories') {
      const matchCat = p.categories?.includes(selectedCategory);
      if (!matchCat) return false;
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
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        surface: 'explore'
      });
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      
      {/* Title & Search */}
      <div className="max-w-3xl mb-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-3xl font-bold font-brand tracking-wide text-white">
              Explore Acovon
            </h1>
            {showDemoBadges && (
              <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[#fce7b0]">
                DEMO LIBRARY: {DEMO_STATS.totalCreators} CREATORS · {DEMO_STATS.totalVideos} PLAYABLE VIDEOS · {DEMO_STATS.totalPhotos}+ PHOTOS
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400">
            Browse verified demonstration creators, playable masterclasses, high-definition photography galleries, and personalized recommendations.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 border-b border-[#26262b] pb-2">
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'creators'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                : 'bg-[#141418] border border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <span>Creators Directory</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">
              {creators.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('media_library')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'media_library'
                ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                : 'bg-[#141418] border border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Demonstration Media Library</span>
            <span className="px-1.5 py-0.2 rounded-md bg-black/20 text-[10px]">
              {posts.length} posts
            </span>
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onBlur={() => {
              if (searchQuery.trim().length >= 3) {
                trackEngagementEvent({
                  eventType: 'search_performed',
                  searchQuery: searchQuery.trim(),
                  surface: 'explore'
                });
              }
            }}
            placeholder={
              activeTab === 'creators'
                ? "Search creators by name, discipline, or keywords..."
                : "Search demonstration videos, photography sets, topics, or hashtags..."
            }
            className="w-full bg-[#121215] border border-[#27272a] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
          />
        </form>

        {/* Personalized Hashtags Strip */}
        <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
          <span className="text-neutral-400 font-mono text-[10px] uppercase tracking-wider mr-1">
            Trending Tags For You:
          </span>
          {personalizedHashtags.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => {
                setSearchQuery(tag);
                trackEngagementEvent({
                  eventType: 'hashtag_clicked',
                  tags: [tag],
                  surface: 'explore'
                });
              }}
              className={`px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                searchQuery.toLowerCase() === tag
                  ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0] font-semibold'
                  : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-[#fce7b0]'
              }`}
            >
              #{tag}
            </button>
          ))}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[10px] text-neutral-400 hover:text-white underline ml-1 cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Personalized Discovery Spotlight Section */}
      {!searchQuery && selectedCategory === 'All Categories' && (
        <div className="mb-8 p-5 rounded-3xl bg-[#121216] border border-[#272730] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#22222b] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <h2 className="text-sm font-bold text-white">
                Personalized Discovery For {activeFanInterestProfile.fanName.split(' (')[0]}
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fce7b0]">
                {activeFanInterestProfile.personaLabel}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400">
              Curated creators, high-completion videos &amp; rising talent matched to your interest graph
            </span>
          </div>

          {activeTab === 'creators' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recommendedCreatorsForYou.map(({ creator, score, reason, isRisingNewCreator }) => (
                <div
                  key={creator.id}
                  onClick={() => {
                    trackEngagementEvent({
                      eventType: 'creator_profile_opened',
                      creatorId: creator.id,
                      category: creator.category,
                      surface: 'explore'
                    });
                    onSelectCreator(creator.id);
                  }}
                  className="p-3.5 rounded-2xl bg-[#17171e] hover:bg-[#1e1e28] border border-[#2a2a35] hover:border-[#d4af37]/50 cursor-pointer transition-all flex flex-col justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      className="w-11 h-11 rounded-xl object-cover border border-[#d4af37]/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-white truncate">
                        <span className="truncate">{creator.name}</span>
                        <VerifiedBadge creatorId={creator.id} size="xs" />
                      </div>
                      <div className="text-[10px] text-neutral-400 truncate">{creator.category}</div>
                    </div>
                  </div>
                  <div className="space-y-1 pt-1 border-t border-[#24242f]">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-mono font-bold text-[#fce7b0]">{score}% Match</span>
                      {isRisingNewCreator && (
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono text-[9px]">
                          Rising Talent
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">{reason}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {recommendedMediaForYou.map(({ post, totalScore, primaryReason }) => {
                const media = post.media[0];
                const isVid = media?.type === 'video';
                return (
                  <div
                    key={post.id}
                    onClick={() => {
                      if (isVid && onOpenVideoPlayer) {
                        onOpenVideoPlayer(post.id, 0);
                      } else if (!isVid && onOpenPhotoViewer) {
                        onOpenPhotoViewer(post.id, 0);
                      } else {
                        setActivePreviewPost(post);
                      }
                    }}
                    className="p-3 rounded-2xl bg-[#17171e] hover:bg-[#1e1e28] border border-[#2a2a35] hover:border-[#d4af37]/50 cursor-pointer transition-all flex items-center gap-3"
                  >
                    <div className="relative w-20 h-16 rounded-xl overflow-hidden bg-black shrink-0">
                      <img
                        src={media?.thumbnailUrl || media?.url}
                        alt={post.content}
                        className="w-full h-full object-cover"
                      />
                      {isVid && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-white truncate">{post.creatorName}</span>
                        <span className="text-[10px] font-mono text-[#fce7b0] shrink-0">{Math.round(totalScore)}%</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 line-clamp-1">{post.content}</p>
                      <div className="text-[10px] text-[#d4af37] truncate">{primaryReason}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Category Filter Horizontal Scroll */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 text-xs no-scrollbar">
        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (cat !== 'All Categories') {
                  trackEngagementEvent({
                    eventType: 'category_selected',
                    category: cat,
                    surface: 'explore'
                  });
                }
              }}
              className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap transition-colors cursor-pointer ${
                isSelected
                  ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                  : 'bg-[#141418] border border-[#27272a] text-neutral-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Fast Filter Toggles for Creators Tab */}
      {activeTab === 'creators' && (
        <div className="flex flex-wrap items-center gap-3 mb-8 text-xs">
          <button
            onClick={() => setFilterLiveCalls(!filterLiveCalls)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterLiveCalls
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Available for Video Calls Now</span>
          </button>

          <button
            onClick={() => setFilterCustomReqs(!filterCustomReqs)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterCustomReqs
                ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#fce7b0]'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <Clapperboard className="w-3.5 h-3.5" />
            <span>Accepting Custom Videos</span>
          </button>

          <button
            onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
            className={`px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
              filterVerifiedOnly
                ? 'bg-[#1D9BF0]/15 border-[#1D9BF0] text-[#7cc5f8]'
                : 'bg-[#141418] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
          >
            <VerifiedBadge forceShow size="xs" />
            <span>Verified Creators Only</span>
          </button>

          {activeRole === 'creator' && onOpenCreatorAd && (
            <button
              onClick={onOpenCreatorAd}
              className="px-3.5 py-1.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/50 text-[#fce7b0] flex items-center gap-1.5 transition-colors cursor-pointer ml-auto font-medium"
            >
              <Rocket className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Promote My Profile in Discovery</span>
            </button>
          )}
        </div>
      )}

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                          <div className="flex items-center gap-1.5">
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

                          {/* Unboxed Metadata */}
                          <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                            <span>@{creator.username}</span>
                            <span aria-hidden="true">·</span>
                            <span>{creator.category}</span>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => {
                const primaryMedia = post.media[0];
                const isVideo = primaryMedia?.type === 'video';
                const hasMultipleMedia = post.media.length > 1;

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
                        <img
                          src={primaryMedia?.thumbnailUrl || primaryMedia?.url}
                          alt={post.content}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
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
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-white group-hover/creator:text-[#fce7b0] transition-colors">
                              {post.creatorName}
                            </span>
                            <VerifiedBadge creatorId={post.creatorId} size="xs" />
                            <span className="text-[10px] text-neutral-400">@{post.creatorUsername}</span>
                          </div>
                        </div>

                        <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                          {post.content}
                        </p>

                        {/* Categories & Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {post.categories?.map(cat => (
                            <span key={cat} className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#1c1c22] text-[#fce7b0] border border-[#2e2e38]">
                              {cat}
                            </span>
                          ))}
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#26262b] flex items-center justify-between">
              <div 
                onClick={() => {
                  onSelectCreator(activePreviewPost.creatorId);
                  setActivePreviewPost(null);
                }}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <img
                  src={activePreviewPost.creatorAvatar}
                  alt={activePreviewPost.creatorName}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-full object-cover border border-[#d4af37]/40"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-[#fce7b0]">
                    <span>{activePreviewPost.creatorName}</span>
                    <VerifiedBadge creatorId={activePreviewPost.creatorId} size="xs" />
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    @{activePreviewPost.creatorUsername} · {activePreviewPost.visibility}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActivePreviewPost(null)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Player / Image Viewer */}
            <div className="relative bg-black aspect-video flex items-center justify-center">
              {activePreviewPost.media[0]?.type === 'video' ? (
                <video
                  src={activePreviewPost.media[0].url}
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
              <p className="text-sm text-neutral-200 leading-relaxed">
                {activePreviewPost.content}
              </p>

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
