import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, PostVisibility } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { matchesCategoryIdentifier, matchesCountryIdentifier } from '../../data/globalTaxonomy';
import {
  Search,
  PlusCircle,
  Edit3,
  Trash2,
  MoreHorizontal,
  Video,
  Image as ImageIcon,
  Globe,
  Users,
  Sparkles,
  Lock,
  Eye,
  Heart,
  MessageCircle,
  MapPin,
  Tag,
  Calendar,
  Coins,
  Film,
  X,
  Scissors,
  Clock
} from 'lucide-react';

interface MyPostsManagementSectionProps {
  onOpenCreatePost: () => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
}

export const MyPostsManagementSection: React.FC<MyPostsManagementSectionProps> = ({
  onOpenCreatePost,
  onOpenVideoPlayer,
  onOpenPhotoViewer
}) => {
  const {
    currentUser,
    posts,
    categories,
    activeCategories,
    countries,
    activeCountries,
    getCountryFlagAndName,
    platformConfig,
    setEditingPost,
    setDeletingPost,
    getPostPurchaseCount,
    isCurrentUserApprovedCreator,
    activeRole
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'photo'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All Categories');
  const [countryFilter, setCountryFilter] = useState<string>('All Countries');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | PostVisibility>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'scheduled' | 'draft'>('all');
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null);

  const menuContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuPostId) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setOpenMenuPostId(null);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [openMenuPostId]);

  const isCreatorAuthorized =
    currentUser.role === 'creator' || isCurrentUserApprovedCreator || activeRole === 'creator';

  const availableCategories = useMemo(() => {
    const seen = new Set<string>(['all categories']);
    const out: string[] = ['All Categories'];
    const addUnique = (val: string) => {
      const trimmed = typeof val === 'string' ? val.trim() : '';
      const norm = trimmed.toLowerCase();
      if (!norm || seen.has(norm)) return;
      seen.add(norm);
      out.push(trimmed);
    };
    (activeCategories || []).forEach(c => addUnique(c.name));
    (platformConfig?.contentCategories || []).forEach(c => addUnique(c));
    CATEGORIES.forEach(c => addUnique(c));
    return out;
  }, [activeCategories, platformConfig?.contentCategories]);

  // All non-deleted posts owned by the logged-in creator
  const creatorOwnedPosts = useMemo(() => {
    return posts.filter(
      p => p.creatorId === currentUser.id && !p.isDeletedByCreator && p.moderationStatus !== 'removed'
    );
  }, [posts, currentUser.id]);

  const filteredPosts = useMemo(() => {
    return creatorOwnedPosts.filter(p => {
      // Media type filter
      const hasVideo = p.media?.some(m => m.type === 'video');
      const hasPhoto = p.media?.some(m => m.type === 'image');
      if (mediaFilter === 'video' && !hasVideo) return false;
      if (mediaFilter === 'photo' && (hasVideo || !hasPhoto)) return false;

      // Category filter
      if (categoryFilter !== 'All Categories') {
        if (!matchesCategoryIdentifier(p.categories, p.category_ids, [categoryFilter], categories)) {
          return false;
        }
      }

      // Video Country filter
      if (countryFilter !== 'All Countries') {
        if (!matchesCountryIdentifier(p.country, p.video_country_id, [countryFilter], countries)) {
          return false;
        }
      }

      // Visibility filter
      if (visibilityFilter !== 'all' && p.visibility !== visibilityFilter) return false;

      // Publication status filter
      const pubStatus = p.isDraft
        ? 'draft'
        : p.scheduledFor
        ? 'scheduled'
        : p.publicationStatus || 'published';
      if (statusFilter !== 'all' && pubStatus !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCaption = (p.content || '').toLowerCase().includes(q);
        const matchTags = (p.tags || []).some(t => t.toLowerCase().includes(q));
        const matchCategory = (p.categories || []).some(c => c.toLowerCase().includes(q));
        const matchCountry = (p.country || '').toLowerCase().includes(q);
        if (!matchCaption && !matchTags && !matchCategory && !matchCountry) return false;
      }

      return true;
    });
  }, [creatorOwnedPosts, mediaFilter, categoryFilter, countryFilter, visibilityFilter, statusFilter, searchQuery, categories, countries]);

  if (!isCreatorAuthorized) {
    return null;
  }

  const totalVideos = creatorOwnedPosts.filter(p => p.media?.some(m => m.type === 'video')).length;
  const totalPhotos = creatorOwnedPosts.filter(
    p => !p.media?.some(m => m.type === 'video') && p.media?.some(m => m.type === 'image')
  ).length;
  const totalPPV = creatorOwnedPosts.filter(p => p.visibility === 'pay_per_view').length;
  const totalLikes = creatorOwnedPosts.reduce((acc, p) => acc + (p.likesCount || 0), 0);

  const getVisibilityMeta = (post: Post) => {
    switch (post.visibility) {
      case 'public':
        return { label: 'Public', icon: Globe, color: 'text-emerald-400' };
      case 'followers':
        return { label: 'Followers', icon: Users, color: 'text-sky-400' };
      case 'subscribers':
        return { label: 'Subscribers', icon: Sparkles, color: 'text-[#fce7b0]' };
      case 'pay_per_view':
        return {
          label: `Pay-To-View ($${(post.ppvPrice || 9.99).toFixed(2)})`,
          icon: Lock,
          color: 'text-amber-300'
        };
      case 'private':
        return { label: 'Private', icon: Eye, color: 'text-neutral-400' };
      default:
        return { label: 'Public', icon: Globe, color: 'text-emerald-400' };
    }
  };

  const getPublicationStatusLabel = (post: Post) => {
    if (post.isDraft) return 'Draft';
    if (post.scheduledFor) return `Scheduled (${post.scheduledFor})`;
    return 'Published';
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">My Posts Management</h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Search, filter, edit captions, hashtags, categories, countries, visibility, thumbnails, or safely delete your published posts.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenCreatePost}
          className="px-4 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-[#d4af37]/20 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Upload New Post</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a]">
          <div className="text-[11px] text-neutral-400">Total Published Posts</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5 tabular-nums">{creatorOwnedPosts.length}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a]">
          <div className="text-[11px] text-neutral-400">Videos / Photos</div>
          <div className="text-xl font-bold font-mono text-[#fce7b0] mt-0.5 tabular-nums">
            {totalVideos} / {totalPhotos}
          </div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a]">
          <div className="text-[11px] text-neutral-400">Pay-To-View Releases</div>
          <div className="text-xl font-bold font-mono text-amber-300 mt-0.5 tabular-nums">{totalPPV}</div>
        </div>
        <div className="p-3.5 rounded-xl bg-[#121215] border border-[#27272a]">
          <div className="text-[11px] text-neutral-400">Total Post Likes</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5 tabular-nums">
            {totalLikes.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Search & Multi-Filter Control Panel */}
      <div className="p-4 rounded-2xl bg-[#121216] border border-[#272730] space-y-3.5">
        {/* Search Input */}
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-[#d4af37] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search your posts by caption, #hashtag, category, or country..."
            className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 p-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Row: Media Type, Visibility, Category, Video Country, Publication Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* 1. Media Type Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Media Type
            </label>
            <div className="flex items-center gap-1 p-1 bg-[#18181f] border border-[#2b2b36] rounded-xl">
              {(
                [
                  { id: 'all', label: 'All' },
                  { id: 'video', label: 'Videos' },
                  { id: 'photo', label: 'Photos' }
                ] as const
              ).map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setMediaFilter(opt.id)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    mediaFilter === opt.id
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Visibility Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Visibility &amp; Access
            </label>
            <select
              value={visibilityFilter}
              onChange={e => setVisibilityFilter(e.target.value as 'all' | PostVisibility)}
              className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Visibility Levels</option>
              <option value="public">Public</option>
              <option value="followers">Followers</option>
              <option value="subscribers">Subscribers</option>
              <option value="pay_per_view">Pay-To-View (PPV)</option>
              <option value="private">Private</option>
            </select>
          </div>

          {/* 3. Category Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              {availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Video Country Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Video Country
            </label>
            <select
              value={countryFilter}
              onChange={e => setCountryFilter(e.target.value)}
              className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="All Countries">All Countries</option>
              {(activeCountries || []).map(c => (
                <option key={c.id} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Publication Status Filter */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-neutral-400 mb-1">
              Publication Status
            </label>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as 'all' | 'published' | 'scheduled' | 'draft')}
              className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      {filteredPosts.length === 0 ? (
        <div className="p-12 text-center bg-[#121215] border border-[#27272a] rounded-2xl space-y-3">
          <Film className="w-9 h-9 text-neutral-600 mx-auto" />
          <div className="text-sm font-bold text-white">No matching posts found</div>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Try clearing your search or adjusting the media type, category, visibility, or status filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-5">
          {filteredPosts.map(p => {
            const firstMedia = p.media?.[0];
            const isVideo = firstMedia?.type === 'video';
            const visMeta = getVisibilityMeta(p);
            const VisIcon = visMeta.icon;
            const purchaseCount = getPostPurchaseCount(p.id);
            const viewsCount = p.viewsCount || Math.max(120, Math.round((p.likesCount || 15) * 14.3));
            const pubStatusLabel = getPublicationStatusLabel(p);
            const isMenuOpen = openMenuPostId === p.id;

            return (
              <div
                key={p.id}
                className="bg-[#121215] border border-[#27272a] hover:border-[#3a3a46] rounded-2xl overflow-hidden flex flex-col justify-between transition-all shadow-lg"
              >
                <div>
                  {/* Media Preview Header */}
                  <div className="relative aspect-video bg-black">
                    {firstMedia &&
                      (isVideo ? (
                        <video
                          src={
                            firstMedia.url &&
                            !firstMedia.url.includes('cdn.acovon.media') &&
                            !firstMedia.url.endsWith('.m3u8')
                              ? firstMedia.url
                              : firstMedia.previewUrl &&
                                !firstMedia.previewUrl.includes('cdn.acovon.media') &&
                                !firstMedia.previewUrl.endsWith('.m3u8')
                              ? firstMedia.previewUrl
                              : ''
                          }
                          poster={
                            firstMedia.thumbnailUrl && firstMedia.thumbnailUrl !== firstMedia.url
                              ? firstMedia.thumbnailUrl
                              : undefined
                          }
                          controls
                          playsInline
                          preload="metadata"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={firstMedia.thumbnailUrl || firstMedia.url}
                          alt=""
                          onClick={() => onOpenPhotoViewer && onOpenPhotoViewer(p.id, 0)}
                          className="w-full h-full object-cover cursor-pointer"
                        />
                      ))}

                    {/* Top Left Media Type & Status Overlay */}
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-semibold text-white inline-flex items-center gap-1">
                        {isVideo ? (
                          <>
                            <Video className="w-3 h-3 text-[#d4af37]" />
                            <span>Video</span>
                          </>
                        ) : (
                          <>
                            <ImageIcon className="w-3 h-3 text-sky-400" />
                            <span>Photo</span>
                          </>
                        )}
                      </span>

                      {p.isHighlight && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-950/90 border border-rose-500/40 text-[10px] font-semibold text-rose-300 inline-flex items-center gap-1">
                          <Scissors className="w-2.5 h-2.5" />
                          <span>Highlight</span>
                        </span>
                      )}
                    </div>

                    {/* Top Right 3-Dot Post Management Menu */}
                    <div
                      className="absolute top-2.5 right-2.5 z-20"
                      ref={isMenuOpen ? menuContainerRef : undefined}
                    >
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setOpenMenuPostId(prev => (prev === p.id ? null : p.id));
                        }}
                        className="p-1.5 rounded-lg bg-black/80 hover:bg-black text-white border border-white/20 shadow-lg cursor-pointer transition-colors"
                        title="Manage Post"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 top-9 w-44 max-w-[calc(100vw-2rem)] bg-[#14141a] border border-[#2c2c38] rounded-xl shadow-2xl p-1.5 text-xs space-y-0.5 z-30">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              setEditingPost(p);
                            }}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-left text-neutral-100 hover:bg-[#20202b] hover:text-[#fce7b0] font-semibold cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                            <span>Edit Post</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuPostId(null);
                              setDeletingPost(p);
                            }}
                            className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-left text-rose-400 hover:bg-rose-950/40 font-semibold cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Post</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Details Body */}
                  <div className="p-4 space-y-2.5">
                    {/* Clean Unboxed Visibility, Publication Status & Date */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                      <span className={`inline-flex items-center gap-1 font-semibold ${visMeta.color}`}>
                        <VisIcon className="w-3 h-3" />
                        <span>{visMeta.label}</span>
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-neutral-300">{pubStatusLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-neutral-500" />
                        <span>{p.createdAt}</span>
                      </span>
                    </div>

                    {/* Caption */}
                    <p className="text-xs text-neutral-100 line-clamp-2 leading-relaxed">
                      {p.content}
                    </p>

                    {/* Category, Country & Hashtags Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-400">
                      {p.categories && p.categories.length > 0 && (
                        <span>{p.categories.join(', ')}</span>
                      )}
                      {p.country && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-neutral-200">
                            <span>{getCountryFlagAndName(p.country).flag}</span>
                            <span>{getCountryFlagAndName(p.country).name}</span>
                          </span>
                        </>
                      )}
                    </div>

                    {p.tags && p.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[#fce7b0]/90">
                        {Array.from(new Set(p.tags)).slice(0, 5).map(t => (
                          <span key={t}>#{t.replace(/^#/, '')}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Engagement Stats & Direct Edit/Delete Controls Footer */}
                <div className="px-4 py-3 bg-[#15151a] border-t border-[#23232b] space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-400 font-mono tabular-nums">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1" title="Views">
                        <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                        {viewsCount.toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Likes">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {p.likesCount}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Comments">
                        <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                        {p.commentsCount}
                      </span>
                    </div>

                    {purchaseCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                        <Coins className="w-3 h-3" />
                        {purchaseCount} sold
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingPost(p)}
                      className="flex-1 min-w-[110px] py-1.5 px-3 rounded-xl bg-[#1e1e26] hover:bg-[#282834] border border-[#2f2f3d] text-neutral-100 hover:text-[#fce7b0] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Edit Post</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingPost(p)}
                      className="py-1.5 px-3 rounded-xl bg-rose-950/35 hover:bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
