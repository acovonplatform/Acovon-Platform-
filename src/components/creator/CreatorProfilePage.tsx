import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, Post } from '../../types';
import { PostCard } from '../feed/PostCard';
import { SearchableCountrySelector } from '../discovery/DiscoveryFilterBar';
import { CustomRequestModal } from '../requests/CustomRequestModal';
import { SubscribeModal } from '../common/SubscribeModal';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { TranslateContentButton } from '../common/TranslateContentButton';
import { CollapsibleDescriptionText } from '../common/CollapsibleDescriptionText';
import { 
  CheckCircle2, 
  Video, 
  Clapperboard, 
  MessageSquare, 
  Coins, 
  ShieldCheck, 
  Globe, 
  Instagram, 
  Twitter, 
  Youtube, 
  Lock, 
  Check, 
  Sparkles,
  UserPlus,
  UserCheck,
  Settings,
  Film,
  LayoutGrid,
  List,
  Play,
  Heart,
  Crown,
  MoreHorizontal,
  Edit3,
  Trash2
} from 'lucide-react';

interface CreatorProfilePageProps {
  creatorId: string;
  onNavigateToMessages: (recipientId?: string) => void;
  onOpenTipModal: (creatorId: string, creatorName: string) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  onOpenShareModal?: (post: Post) => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
}

export const CreatorProfilePage: React.FC<CreatorProfilePageProps> = ({
  creatorId,
  onNavigateToMessages,
  onOpenTipModal,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenVideoPlayer,
  onOpenPhotoViewer
}) => {
  const { 
    creators, 
    posts, 
    currentUser, 
    isAuthenticated,
    requireAuth,
    isCurrentUserApprovedCreator,
    activeRole,
    setEditingPost,
    setDeletingPost,
    initiateVideoCall, 
    subscribeToCreator, 
    isSubscribedTo, 
    isPostPurchased,
    getSubscriptionTier,
    updateCreatorProfile,
    isFollowing,
    toggleFollowCreator,
    showDemoBadges,
    getCountryFlagAndName
  } = useApp();

  const [activeTab, setActiveTab] = useState<'posts' | 'highlights' | 'vault' | 'tiers' | 'settings'>('posts');
  const [contentViewMode, setContentViewMode] = useState<'grid' | 'feed'>('grid');
  const [openGridMenuPostId, setOpenGridMenuPostId] = useState<string | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showCallLimitModal, setShowCallLimitModal] = useState(false);
  const [showCustomReqModal, setShowCustomReqModal] = useState(false);
  const [callSpendingLimit, setCallSpendingLimit] = useState(50);
  const [callError, setCallError] = useState<string | null>(null);

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return String(count);
  };

  const formatDuration = (secs?: number) => {
    if (!secs || !Number.isFinite(secs)) return '0:45';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const creator = creators.find(c => c.id === creatorId) || creators[0];
  if (!creator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-8 space-y-2">
          <Film className="w-10 h-10 text-[#d4af37]/70 mx-auto" />
          <h2 className="text-base font-bold text-white">Creator Profile Unavailable</h2>
          <p className="text-xs text-neutral-400">
            No approved creator profile matches this view yet.
          </p>
        </div>
      </div>
    );
  }
  const isOwner = isAuthenticated && currentUser.id === creator.id;
  const isCreatorOwner =
    isAuthenticated &&
    currentUser.id === creator.id &&
    (currentUser.role === 'creator' || isCurrentUserApprovedCreator || activeRole === 'creator');
  const isSubscribed = isSubscribedTo(creator.id);
  const activeSub = getSubscriptionTier(creator.id);

  const creatorPosts = posts.filter(
    p =>
      p.creatorId === creator.id &&
      !p.isDeletedByCreator &&
      p.moderationStatus !== 'removed' &&
      (isCreatorOwner || (!p.isDraft && p.visibility !== 'private'))
  );
  const highlightPosts = creatorPosts.filter(p => p.isHighlight || p.tags?.includes('Highlight'));
  const ppvPosts = creatorPosts.filter(p => p.visibility === 'pay_per_view');

  const handleStartCall = () => {
    setCallError(null);
    const result = initiateVideoCall(creator.id, callSpendingLimit);
    if (result.success) {
      setShowCallLimitModal(false);
    } else {
      setCallError(result.error || 'Failed to initiate video call');
    }
  };

  const handleTierSelect = (tierId: string) => {
    if (!requireAuth('subscribe to creators')) return;
    const res = subscribeToCreator(creator.id, tierId);
    if (res.success) {
      setShowSubscribeModal(false);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-16 overflow-x-clip">
      
      {/* Cover Banner */}
      <div className="relative w-full h-44 sm:h-64 md:h-80 bg-gradient-to-br from-[#1b1810] via-[#131318] to-[#0c0c10] overflow-hidden">
        {creator.coverImage && (
          <img
            src={creator.coverImage}
            alt={creator.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent" />
      </div>

      {/* Profile Header Content */}
      <div className="px-3.5 sm:px-8 -mt-14 sm:-mt-20 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 pb-5 sm:pb-6 border-b border-[#26262b]">
          
          {/* Avatar and Identity */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-5 min-w-0">
            <div className="relative shrink-0 self-start">
              {creator.avatar ? (
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  referrerPolicy="no-referrer"
                  className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl object-cover border-4 border-[#09090b] shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl bg-[#1f1f26] border-4 border-[#09090b] shadow-2xl flex items-center justify-center text-3xl sm:text-4xl font-bold text-[#fce7b0]">
                  {(creator.name || 'C').charAt(0).toUpperCase()}
                </div>
              )}
              {creator.isLiveForCalls && (
                <div className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                  <span>CALLS READY</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-brand text-white tracking-wide break-words">
                  {creator.name}
                </h1>
                <VerifiedBadge creatorId={creator.id} size="lg" />
                {showDemoBadges && creator.isDemo && (
                  <span className="text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                    DEMO
                  </span>
                )}
              </div>

              {/* Zero-Pill Clean Metadata with Creator Country Flag */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-400">
                <span>@{creator.username}</span>
                <span aria-hidden="true">·</span>
                <span>{creator.category}</span>
                {creator.country && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-neutral-200 inline-flex items-center gap-1" title="Creator Profile Country">
                      <span>{getCountryFlagAndName(creator.country).flag}</span>
                      <span>{getCountryFlagAndName(creator.country).name}</span>
                    </span>
                  </>
                )}
                <span aria-hidden="true">·</span>
                <span className="font-mono text-neutral-200 tabular-nums">
                  {(creator.followersCount / 1000).toFixed(1)}k followers
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-[#fce7b0] tabular-nums">
                  {creator.subscribersCount} subscribers
                </span>
              </div>

              <TranslateContentButton
                text={creator.bio || ''}
                contentType="bio"
                contentRef={`bio_${creator.id}`}
                renderPrimaryText
                textClassName="text-xs sm:text-sm text-neutral-300 max-w-xl leading-relaxed pt-1 break-words"
                className="pt-1"
              />
            </div>
          </div>

          {/* Monetization Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 self-start md:self-end w-full md:w-auto">
            
            {/* Private Video Call Button */}
            {creator.isLiveForCalls && (
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('start a live video call')) return;
                  setShowCallLimitModal(true);
                }}
                className="px-3.5 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>Call (${creator.callRatePerMinute}/min)</span>
              </button>
            )}

            {/* Custom Video Request Button */}
            {creator.acceptingCustomRequests && (
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('request a custom video')) return;
                  setShowCustomReqModal(true);
                }}
                className="px-3.5 sm:px-4 py-2 bg-[#18181c] hover:bg-[#24242c] border border-[#d4af37]/40 text-[#fce7b0] font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Clapperboard className="w-4 h-4 text-[#d4af37] shrink-0" />
                <span>Custom Video (${creator.customRequestBasePrice})</span>
              </button>
            )}

            {/* Subscribe / Membership Button */}
            {!isSubscribed ? (
              <button
                type="button"
                onClick={() => {
                  if (!requireAuth('subscribe to this creator')) return;
                  setShowSubscribeModal(true);
                }}
                className="px-4 sm:px-5 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Subscribe from ${creator.tiers?.[0]?.price ?? 0}/mo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('tiers')}
                className="px-3.5 sm:px-4 py-2 bg-[#1c1c22] border border-emerald-500/40 text-emerald-400 font-semibold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 shrink-0" />
                <span>Subscribed ({activeSub?.tierName})</span>
              </button>
            )}

            {/* Direct Message */}
            <button
              type="button"
              onClick={() => onNavigateToMessages(creator.id)}
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-300 rounded-xl transition-colors cursor-pointer"
              title="Send Direct Message"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Tip Button */}
            <button
              type="button"
              onClick={() => onOpenTipModal(creator.id, creator.name)}
              className="p-2 min-h-[36px] min-w-[36px] flex items-center justify-center bg-[#18181c] hover:bg-[#22222a] border border-[#d4af37]/40 text-[#d4af37] rounded-xl transition-colors cursor-pointer"
              title="Send Tip"
            >
              <Coins className="w-4 h-4" />
            </button>

            {/* Follow / Following Button */}
            {!isOwner && (
              <button
                type="button"
                onClick={() => toggleFollowCreator(creator.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isFollowing(creator.id)
                    ? 'bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-300'
                    : 'bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold shadow-md'
                }`}
                title={isFollowing(creator.id) ? 'Following creator' : 'Follow creator'}
              >
                {isFollowing(creator.id) ? (
                  <>
                    <UserCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 shrink-0" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

        {/* Profile Navigation Tabs (Horizontally scrollable on mobile) */}
        <div className="flex items-center gap-4 sm:gap-6 mt-5 sm:mt-6 border-b border-[#26262b] text-xs sm:text-sm overflow-x-auto no-scrollbar whitespace-nowrap">
          <button
            type="button"
            onClick={() => setActiveTab('posts')}
            className={`pb-3 font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === 'posts' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All Content ({creatorPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('highlights')}
            className={`pb-3 font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'highlights' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Highlights &amp; Clips ({highlightPosts.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('vault')}
            className={`pb-3 font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === 'vault' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            PPV Vault Releases ({ppvPosts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tiers')}
            className={`pb-3 font-medium transition-colors cursor-pointer shrink-0 ${
              activeTab === 'tiers' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Subscription Tiers &amp; Perks
          </button>
          {isOwner && (
            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`pb-3 font-medium transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'settings' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Rates &amp; Privacy</span>
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="pt-6 sm:pt-8">
          
          {/* Posts Tab — TikTok & Instagram Creator Video Showcase */}
          {activeTab === 'posts' && (
            <div className="space-y-6">
              {/* Top View Mode Switcher (TikTok/Instagram Reels Grid vs Clean Feed View) */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#202028]">
                <div className="text-xs text-neutral-400">
                  Showing <strong className="text-white font-semibold">{creatorPosts.length}</strong> videos &amp; uploads
                </div>
                
                <div className="flex items-center bg-[#121217] border border-[#272732] rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setContentViewMode('grid')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      contentViewMode === 'grid'
                        ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#1a1a22]'
                    }`}
                    title="TikTok & Instagram Video Grid"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Video Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentViewMode('feed')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      contentViewMode === 'feed'
                        ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20 font-bold'
                        : 'text-neutral-400 hover:text-white hover:bg-[#1a1a22]'
                    }`}
                    title="Feed View (No repetitive profiles)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Feed</span>
                  </button>
                </div>
              </div>

              {creatorPosts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs bg-[#121215] border border-[#26262b] rounded-2xl p-8 max-w-md mx-auto">
                  <Film className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-white font-medium mb-1">No Videos or Media Yet</p>
                  <p className="text-zinc-400">This creator has not published any media content to their showcase yet.</p>
                </div>
              ) : contentViewMode === 'grid' ? (
                /* TikTok / Instagram Responsive Reels Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 3xl:grid-cols-5 gap-2 sm:gap-3.5">
                  {creatorPosts.map(post => {
                    const videoAsset = post.media?.find(m => m.type === 'video');
                    const photoAsset = post.media?.[0];
                    const isVideo = Boolean(videoAsset);
                    const isGridLocked =
                      !isOwner &&
                      ((post.visibility === 'subscribers' && !isSubscribed) ||
                        (post.visibility === 'pay_per_view' && !isPostPurchased(post.id)) ||
                        (post.visibility === 'followers' && !isFollowing(creator.id) && !isSubscribed));
                    const safeThumb = isGridLocked
                      ? (videoAsset?.thumbnailUrl && videoAsset.thumbnailUrl !== videoAsset.url
                          ? videoAsset.thumbnailUrl
                          : photoAsset?.thumbnailUrl && photoAsset.thumbnailUrl !== photoAsset.url
                          ? photoAsset.thumbnailUrl
                          : undefined)
                      : videoAsset
                      ? (videoAsset.thumbnailUrl && videoAsset.thumbnailUrl !== videoAsset.url
                          ? videoAsset.thumbnailUrl
                          : undefined)
                      : photoAsset?.thumbnailUrl || photoAsset?.url || creator.coverImage || post.creatorAvatar;
                    const durationSec = videoAsset?.durationSeconds || (post.ppvPreviewDuration ? post.ppvPreviewDuration : 45);
                    const viewCount = post.viewsCount ?? 0;

                    return (
                      <div
                        key={post.id}
                        onClick={() => {
                          if (isVideo && onOpenVideoPlayer) {
                            onOpenVideoPlayer(post.id, 0);
                          } else if (onOpenPhotoViewer) {
                            onOpenPhotoViewer(post.id, 0);
                          }
                        }}
                        className="group relative aspect-[9/16] sm:aspect-[4/5] bg-[#141418] border border-[#26262e] rounded-xl sm:rounded-2xl overflow-hidden cursor-pointer shadow-lg transition-all duration-300 hover:border-[#d4af37]/60 hover:shadow-2xl hover:shadow-[#d4af37]/15"
                      >
                        {/* Poster Thumbnail */}
                        {safeThumb ? (
                          <img
                            src={safeThumb}
                            alt={post.content.slice(0, 40)}
                            referrerPolicy="no-referrer"
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                              isGridLocked ? 'blur-lg opacity-35' : ''
                            }`}
                          />
                        ) : (
                          <div className="w-full h-full bg-[#101016] flex items-center justify-center">
                            <Lock className="w-8 h-8 text-[#d4af37]/60" />
                          </div>
                        )}

                        {/* TikTok / Instagram Dark Vignette Gradient */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/15 to-black/35 group-hover:from-black/95 transition-colors" />

                        {/* Top Status Badges */}
                        <div className="absolute top-2 sm:top-2.5 left-2 sm:left-2.5 right-2 sm:right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                          <div className="flex items-center gap-1 flex-wrap">
                            {post.visibility === 'pay_per_view' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/85 border border-amber-500/50 text-[10px] font-bold text-amber-300 shadow">
                                <Lock className="w-2.5 h-2.5 text-amber-400" />
                                <span>PPV ${post.ppvPrice?.toFixed(2)}</span>
                              </span>
                            )}
                            {post.visibility === 'subscribers' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d4af37]/25 border border-[#d4af37]/50 text-[10px] font-bold text-[#fce7b0] shadow">
                                <Crown className="w-2.5 h-2.5 text-[#d4af37]" />
                                <span>VIP</span>
                              </span>
                            )}
                            {post.isHighlight && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/85 border border-rose-500/50 text-[10px] font-bold text-rose-300 shadow">
                                <Film className="w-2.5 h-2.5 text-rose-400" />
                                <span>Clip</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 pointer-events-auto">
                            <span className="p-1 rounded-md bg-black/60 text-white/90 backdrop-blur-xs border border-white/10 shrink-0 pointer-events-none">
                              {isVideo ? (
                                <Video className="w-3 h-3 text-[#d4af37]" />
                              ) : (
                                <Film className="w-3 h-3 text-neutral-300" />
                              )}
                            </span>

                            {isCreatorOwner && (
                              <div className="relative">
                                <button
                                  type="button"
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenGridMenuPostId(prev => (prev === post.id ? null : post.id));
                                  }}
                                  className="p-1 rounded-md bg-black/80 hover:bg-black text-white border border-white/20 cursor-pointer shadow-md"
                                  title="Manage Post"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {openGridMenuPostId === post.id && (
                                  <div
                                    onClick={e => e.stopPropagation()}
                                    className="absolute right-0 top-7 w-40 bg-[#14141a] border border-[#2c2c38] rounded-xl shadow-2xl p-1 text-xs space-y-0.5 z-30"
                                  >
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenGridMenuPostId(null);
                                        setEditingPost(post);
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left text-neutral-100 hover:bg-[#20202b] hover:text-[#fce7b0] font-semibold cursor-pointer"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                                      <span>Edit Post</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setOpenGridMenuPostId(null);
                                        setDeletingPost(post);
                                      }}
                                      className="w-full px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-left text-rose-400 hover:bg-rose-950/40 font-semibold cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Post</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Centered Play Button on Hover */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#d4af37] text-black flex items-center justify-center shadow-xl shadow-[#d4af37]/30 transform scale-90 group-hover:scale-100 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                          </div>
                        </div>

                        {/* Bottom Overlay: Caption & TikTok/Instagram Metrics */}
                        <div className="absolute bottom-2 sm:bottom-2.5 left-2 sm:left-2.5 right-2 sm:right-2.5 text-white pointer-events-none">
                          {post.content && (
                            <div
                              onClick={e => e.stopPropagation()}
                              className="pointer-events-auto mb-1.5"
                            >
                              <CollapsibleDescriptionText
                                text={post.content}
                                variant="overlay"
                                compact
                                linkify
                                maxExpandedHeightClass="max-h-32 overflow-y-auto"
                                textClassName="text-[11px] sm:text-xs font-medium text-neutral-200 leading-snug drop-shadow"
                                resetKey={post.id}
                              />
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px] font-mono text-neutral-300">
                            <div className="flex items-center gap-2 sm:gap-2.5">
                              <span className="flex items-center gap-1 drop-shadow">
                                <Play className="w-3 h-3 text-[#d4af37] fill-current" />
                                <span>{formatViews(viewCount)}</span>
                              </span>
                              <span className="flex items-center gap-1 drop-shadow">
                                <Heart className="w-3 h-3 text-rose-400 fill-current" />
                                <span>{post.likesCount || 0}</span>
                              </span>
                            </div>
                            {isVideo && (
                              <span className="px-1.5 py-0.5 rounded bg-black/75 border border-white/10 text-[10px] text-neutral-300">
                                {formatDuration(durationSec)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Clean Streamlined Feed Mode (No repeated creator profile headers on videos) */
                <div className="max-w-2xl mx-auto space-y-6">
                  {creatorPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      hideCreatorHeader={true}
                      onNavigateToCreator={() => {}}
                      onOpenTipModal={onOpenTipModal}
                      onOpenSubscribeModal={onOpenSubscribeModal || (() => setShowSubscribeModal(true))}
                      onOpenShareModal={onOpenShareModal}
                      onOpenVideoPlayer={onOpenVideoPlayer}
                      onOpenPhotoViewer={onOpenPhotoViewer}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Highlights & Clips Tab */}
          {activeTab === 'highlights' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 mb-6 text-xs text-neutral-300 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Livestream Highlights & 30s Clips</h4>
                  <p className="text-[11px] text-neutral-400">
                    Memorable moments captured live by audience members and the creator from ACOVON LIVE broadcasts.
                  </p>
                </div>
              </div>

              {highlightPosts.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs bg-[#121215] border border-[#26262b] rounded-2xl p-8">
                  <Film className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                  <p className="text-white font-medium mb-1">No Highlights Saved Yet</p>
                  <p className="text-zinc-400">Watch an ACOVON LIVE stream and click &ldquo;Create Clip&rdquo; to save 30s highlights into this gallery!</p>
                </div>
              ) : (
                highlightPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    hideCreatorHeader={true}
                    onNavigateToCreator={() => {}}
                    onOpenTipModal={onOpenTipModal}
                    onOpenSubscribeModal={onOpenSubscribeModal || (() => setShowSubscribeModal(true))}
                    onOpenShareModal={onOpenShareModal}
                    onOpenVideoPlayer={onOpenVideoPlayer}
                    onOpenPhotoViewer={onOpenPhotoViewer}
                  />
                ))
              )}
            </div>
          )}

          {/* PPV Vault Tab */}
          {activeTab === 'vault' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="bg-[#121215] border border-[#27272a] rounded-xl p-4 mb-6 text-xs text-neutral-300 flex items-center gap-3">
                <Lock className="w-5 h-5 text-[#d4af37] shrink-0" />
                <p>
                  Acovon Pay-Per-View Vault: Premium long-form recordings with 10s–30s free preview. Unlocked content is permanently saved to your library.
                </p>
              </div>
              {ppvPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  hideCreatorHeader={true}
                  onNavigateToCreator={() => {}}
                  onOpenTipModal={onOpenTipModal}
                  onOpenSubscribeModal={onOpenSubscribeModal || (() => setShowSubscribeModal(true))}
                  onOpenShareModal={onOpenShareModal}
                  onOpenVideoPlayer={onOpenVideoPlayer}
                  onOpenPhotoViewer={onOpenPhotoViewer}
                />
              ))}
            </div>
          )}

          {/* Tiers Tab */}
          {activeTab === 'tiers' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {(creator.tiers || []).filter(t => t.isActive !== false).map((tier, idx) => {
                const isSelected = activeSub?.tierId === tier.id;
                return (
                  <div
                    key={tier.id}
                    className={`bg-[#121215] border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[#d4af37] shadow-xl shadow-[#d4af37]/10'
                        : 'border-[#27272a] hover:border-[#383842]'
                    }`}
                  >
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[#d4af37] font-bold mb-1">
                        {tier.name}
                      </div>
                      {tier.description && (
                        <p className="text-[11px] text-neutral-400 mb-3 leading-snug">
                          {tier.description}
                        </p>
                      )}
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-3xl font-bold font-mono text-white">${tier.price.toFixed(2)}</span>
                        <span className="text-xs text-neutral-400">/ month</span>
                        {tier.annualPrice && (
                          <span className="text-[11px] text-emerald-400 font-mono ml-auto">
                            ${tier.annualPrice.toFixed(2)}/yr
                          </span>
                        )}
                      </div>

                      {tier.introductoryOffer && (
                        <div className="mb-3 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-semibold inline-block">
                          ★ {tier.introductoryOffer}
                        </div>
                      )}

                      <div className="border-t border-[#1f1f23] pt-4 space-y-2.5 mb-6 text-xs text-neutral-300">
                        {tier.perks.map((p, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <Check className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
                            <span>{p}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleTierSelect(tier.id)}
                      disabled={isSelected}
                      className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 cursor-default'
                          : 'bg-[#d4af37] hover:bg-[#e5c07b] text-black shadow-lg shadow-[#d4af37]/20'
                      }`}
                    >
                      {isSelected ? 'Current Active Tier' : `Join for $${tier.price}/mo`}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Settings Tab (Owner Only) */}
          {activeTab === 'settings' && isOwner && (
            <div className="max-w-2xl mx-auto bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-6">
              <h3 className="font-bold text-white text-base">Creator Rates & Discovery Controls</h3>

              <div className="space-y-4 text-xs">
                <div className="p-3.5 bg-[#18181c] rounded-xl border border-[#27272a] space-y-2">
                  <SearchableCountrySelector
                    value={creator.country || 'United States'}
                    onChange={(nextCountry) => updateCreatorProfile(creator.id, { country: nextCountry })}
                    label="Creator Country (Official Profile Country)"
                    placeholder="Select your profile country..."
                  />
                  <p className="text-[11px] text-neutral-400">
                    Displayed on your public Creator Profile. Remains strictly separate from individual Video Countries.
                  </p>
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Video Call Rate ($ / minute)</label>
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={creator.callRatePerMinute}
                    onChange={(e) => updateCreatorProfile(creator.id, { callRatePerMinute: Number(e.target.value) })}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#18181c] rounded-xl border border-[#27272a]">
                  <div>
                    <div className="font-semibold text-neutral-200">Available for Live Paid Video Calls</div>
                    <div className="text-[11px] text-neutral-400">Fans can immediately initiate real-time video sessions</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={creator.isLiveForCalls}
                    onChange={(e) => updateCreatorProfile(creator.id, { isLiveForCalls: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-neutral-300 mb-1 font-medium">Custom Video Request Base Price ($)</label>
                  <input
                    type="number"
                    defaultValue={creator.customRequestBasePrice}
                    onChange={(e) => updateCreatorProfile(creator.id, { customRequestBasePrice: Number(e.target.value) })}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-[#18181c] rounded-xl border border-[#27272a]">
                  <div>
                    <div className="font-semibold text-neutral-200">Accepting Custom Video Requests</div>
                    <div className="text-[11px] text-neutral-400">Show request button on your public showcase</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={creator.acceptingCustomRequests}
                    onChange={(e) => updateCreatorProfile(creator.id, { acceptingCustomRequests: e.target.checked })}
                    className="w-4 h-4 accent-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Video Call Spending Limit Setup Modal */}
      {showCallLimitModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-sm w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4 acovon-modal-panel">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <Video className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Start Private Video Call</h4>
                <div className="text-xs text-neutral-400">${creator.callRatePerMinute.toFixed(2)} per minute</div>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              Acovon protects your budget. Set a maximum spending cap. Billing begins <strong>only when connected</strong> and automatically stops when your cap is reached.
            </p>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Your Maximum Spending Cap ($)
              </label>
              <input
                type="number"
                value={callSpendingLimit}
                onChange={(e) => setCallSpendingLimit(Number(e.target.value))}
                min={creator.callRatePerMinute}
                max={currentUser.walletBalance}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#d4af37]"
              />
              <div className="text-[11px] text-neutral-500 mt-1">
                Available Wallet Balance: ${currentUser.walletBalance.toFixed(2)} (~{Math.floor(currentUser.walletBalance / creator.callRatePerMinute)} mins)
              </div>
            </div>

            {callError && (
              <div className="text-xs text-rose-400 bg-rose-950/40 p-2 rounded-lg">
                {callError}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCallLimitModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleStartCall}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/30 cursor-pointer"
              >
                Connect Call
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Tier Modal */}
      {showSubscribeModal && (
        <SubscribeModal
          creatorId={creator.id}
          onClose={() => setShowSubscribeModal(false)}
        />
      )}

      {/* Custom Request Modal */}
      {showCustomReqModal && (
        <CustomRequestModal
          creator={creator}
          onClose={() => setShowCustomReqModal(false)}
          onSuccess={() => alert('Custom video request submitted into escrow!')}
        />
      )}

    </div>
  );
};
