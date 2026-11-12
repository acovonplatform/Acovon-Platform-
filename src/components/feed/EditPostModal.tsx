import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PostVisibility, MediaAsset } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { uploadUserFileToSupabase } from '../../services/supabase';
import {
  X,
  Edit3,
  UploadCloud,
  Image as ImageIcon,
  Video as VideoIcon,
  Lock,
  Globe,
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Tag,
  MapPin,
  Heart,
  MessageCircle,
  Eye,
  Trash2,
  RefreshCw,
  Check
} from 'lucide-react';

const SUPPORTED_CONTENT_COUNTRIES = [
  'United States',
  'United Kingdom',
  'France',
  'Italy',
  'Japan',
  'Germany',
  'Canada',
  'Spain',
  'Brazil',
  'Australia',
  'United Arab Emirates',
  'Nigeria',
  'South Africa',
  'South Korea',
  'Switzerland',
  'Netherlands',
  'Sweden',
  'Mexico',
  'Singapore',
  'Global / International'
];

const THUMBNAIL_PRESETS = [
  'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
  'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80'
];

export const EditPostModal: React.FC = () => {
  const {
    editingPost,
    setEditingPost,
    currentUser,
    isAuthenticated,
    isCurrentUserApprovedCreator,
    activeRole,
    creators,
    updateCreatorPost,
    getPostPurchaseCount
  } = useApp();

  const mediaInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  if (!editingPost) return null;

  const isCreatorAuthorized =
    currentUser.role === 'creator' || isCurrentUserApprovedCreator || activeRole === 'creator';
  const isOwner = isAuthenticated && currentUser.id === editingPost.creatorId && isCreatorAuthorized;

  if (!isOwner) {
    return null;
  }

  const creatorProfile = creators.find(c => c.id === editingPost.creatorId);
  const purchaseCount = getPostPurchaseCount(editingPost.id);
  const hasExistingPurchases = purchaseCount > 0;

  return (
    <EditPostModalInner
      key={editingPost.id}
      post={editingPost}
      defaultCountry={editingPost.country || creatorProfile?.country || 'United States'}
      purchaseCount={purchaseCount}
      hasExistingPurchases={hasExistingPurchases}
      currentUserId={currentUser.id}
      mediaInputRef={mediaInputRef}
      thumbInputRef={thumbInputRef}
      onClose={() => setEditingPost(null)}
      onSave={updateCreatorPost}
    />
  );
};

interface EditPostModalInnerProps {
  post: NonNullable<ReturnType<typeof useApp>['editingPost']>;
  defaultCountry: string;
  purchaseCount: number;
  hasExistingPurchases: boolean;
  currentUserId: string;
  mediaInputRef: React.RefObject<HTMLInputElement | null>;
  thumbInputRef: React.RefObject<HTMLInputElement | null>;
  onClose: () => void;
  onSave: ReturnType<typeof useApp>['updateCreatorPost'];
}

const EditPostModalInner: React.FC<EditPostModalInnerProps> = ({
  post,
  defaultCountry,
  purchaseCount,
  hasExistingPurchases,
  currentUserId,
  mediaInputRef,
  thumbInputRef,
  onClose,
  onSave
}) => {
  const { platformConfig } = useApp();
  const firstMedia = post.media?.[0];
  const initialIsVideo = firstMedia?.type === 'video';

  const [content, setContent] = useState<string>(post.content || '');
  const [hashtags, setHashtags] = useState<string[]>(
    Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : ['Acovon']
  );
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState<string>('');

  const availableCategories = Array.from(
    new Set([
      ...(platformConfig?.contentCategories || []),
      ...CATEGORIES.filter(c => c !== 'All Categories')
    ])
  );

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.isArray(post.categories) && post.categories.length > 0
      ? post.categories
      : [availableCategories[0] || 'Fashion & Luxury']
  );
  const [country, setCountry] = useState<string>(defaultCountry);
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility || 'public');
  const [ppvPrice, setPpvPrice] = useState<number>(post.ppvPrice || 9.99);
  const [ppvPreviewDuration, setPpvPreviewDuration] = useState<10 | 15 | 30>(
    post.ppvPreviewDuration || 15
  );
  const [commentsDisabled, setCommentsDisabled] = useState<boolean>(Boolean(post.commentsDisabled));
  const [downloadsDisabled, setDownloadsDisabled] = useState<boolean>(
    post.downloadsDisabled !== undefined ? Boolean(post.downloadsDisabled) : true
  );

  // Thumbnail & Media state
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(
    firstMedia?.thumbnailUrl || firstMedia?.url || ''
  );
  const [customThumbUrlInput, setCustomThumbUrlInput] = useState<string>('');
  const [mediaList, setMediaList] = useState<MediaAsset[]>(
    Array.isArray(post.media) ? [...post.media] : []
  );
  const [isMediaReplaced, setIsMediaReplaced] = useState<boolean>(false);
  const [confirmMediaReplacement, setConfirmMediaReplacement] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const handleAddHashtag = (e?: React.KeyboardEvent<HTMLInputElement>) => {
    if (e && e.key !== 'Enter' && e.key !== ',') return;
    if (e) e.preventDefault();
    const cleaned = hashtagInput.replace(/^#/, '').replace(/,/g, '').trim();
    if (!cleaned) return;
    if (!hashtags.includes(cleaned)) {
      setHashtags(prev => [...prev, cleaned]);
    }
    setHashtagInput('');
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(prev => prev.filter(t => t !== tagToRemove));
  };

  const handleCommitTagEdit = (idx: number) => {
    const cleaned = editingTagValue.replace(/^#/, '').trim();
    if (cleaned) {
      setHashtags(prev => prev.map((t, i) => (i === idx ? cleaned : t)));
    }
    setEditingTagIndex(null);
    setEditingTagValue('');
  };

  const handleToggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length > 1) {
        setSelectedCategories(prev => prev.filter(c => c !== cat));
      }
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);

    const localObjectUrl = URL.createObjectURL(file);
    setThumbnailUrl(localObjectUrl);
    setMediaList(prev =>
      prev.map((m, idx) => (idx === 0 ? { ...m, thumbnailUrl: localObjectUrl } : m))
    );

    try {
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUserId,
        file,
        featureName: 'post-thumbnails',
        itemId: post.id,
        visibility: 'public'
      });
      if (uploadRes.signedUrl) {
        const finalUrl = uploadRes.signedUrl;
        setThumbnailUrl(finalUrl);
        setMediaList(prev =>
          prev.map((m, idx) => (idx === 0 ? { ...m, thumbnailUrl: finalUrl } : m))
        );
      }
    } catch {
      // keep local object URL preview
    } finally {
      e.target.value = '';
    }
  };

  const handleReplaceMediaFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    setIsUploadingFile(true);

    const isVideo =
      file.type.startsWith('video/') || /\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name);
    const localUrl = URL.createObjectURL(file);

    try {
      let resolvedUrl = localUrl;
      try {
        const uploadRes = await uploadUserFileToSupabase({
          uid: currentUserId,
          file,
          featureName: 'posts',
          itemId: post.id,
          visibility: visibility === 'public' ? 'public' : 'private'
        });
        resolvedUrl = uploadRes.signedUrl || localUrl;
      } catch {
        // fallback to local URL
      }

      const newAsset: MediaAsset = {
        id: `media_${Date.now()}`,
        type: isVideo ? 'video' : 'image',
        url: resolvedUrl,
        thumbnailUrl: isVideo ? thumbnailUrl || THUMBNAIL_PRESETS[0] : resolvedUrl,
        previewUrl: isVideo ? resolvedUrl : undefined,
        durationSeconds: isVideo ? firstMedia?.durationSeconds || 45 : undefined,
        availableResolutions: isVideo ? ['1080p', '720p', '480p', '360p'] : undefined,
        availableCodecs: isVideo ? ['AV1', 'H.264'] : undefined,
        compressionRatio: isVideo ? 64 : undefined
      };

      setMediaList([newAsset]);
      if (!isVideo) {
        setThumbnailUrl(resolvedUrl);
      }
      setIsMediaReplaced(true);
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!content.trim()) {
      setErrorMessage('Post description / caption cannot be empty.');
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one category for this post.');
      return;
    }

    if (visibility === 'pay_per_view' && (!Number.isFinite(ppvPrice) || ppvPrice < 0.99)) {
      setErrorMessage('Pay-To-View price must be at least $0.99.');
      return;
    }

    if (isMediaReplaced && hasExistingPurchases && !confirmMediaReplacement) {
      setErrorMessage(
        `This post has already been purchased by ${purchaseCount} fan(s). Please confirm the purchaser protection acknowledgement before replacing the media.`
      );
      return;
    }

    setSaving(true);
    const res = await onSave(post.id, {
      content: content.trim(),
      tags: hashtags,
      categories: selectedCategories,
      country,
      visibility,
      ppvPrice: visibility === 'pay_per_view' ? Number(ppvPrice) : post.ppvPrice,
      ppvPreviewDuration: visibility === 'pay_per_view' ? ppvPreviewDuration : post.ppvPreviewDuration,
      thumbnailUrl: thumbnailUrl || undefined,
      media: mediaList,
      commentsDisabled,
      downloadsDisabled,
      confirmMediaReplacementForPurchasers: confirmMediaReplacement
    });
    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update post.');
      return;
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 650);
  };

  const currentMedia = mediaList[0];
  const isCurrentVideo = currentMedia?.type === 'video';
  const estimatedViews = post.viewsCount || Math.max(120, Math.round((post.likesCount || 15) * 14.3));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#121216] border border-[#272730] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#23232c] flex items-center justify-between bg-[#15151b]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Edit3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Edit Published Post</h2>
              <p className="text-[11px] text-neutral-400">
                Post ID #{post.id.slice(-6)} · Published {post.createdAt}
                {post.updatedAt ? ` · Last edited ${post.updatedAt}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#1e1e26] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* Preserved Engagement & Purchase Rights Banner */}
          <div className="p-3.5 rounded-xl bg-[#17171f] border border-[#2a2a36] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-neutral-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Engagement &amp; Purchase History Preserved:</strong> Editing this post keeps all existing likes, comments, views, and buyer entitlements intact.
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-neutral-300">
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                {estimatedViews.toLocaleString()} views
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                {post.likesCount} likes
              </span>
              <span>·</span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-sky-400" />
                {post.commentsCount} comments
              </span>
            </div>
          </div>

          {/* Existing Fan Purchases Notice */}
          {hasExistingPurchases && (
            <div className="p-4 rounded-xl bg-amber-950/35 border border-amber-500/40 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Purchased by {purchaseCount} Fan{purchaseCount === 1 ? '' : 's'} — Buyer Access Protected
                </span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                This post has already been unlocked by {purchaseCount} fan{purchaseCount === 1 ? '' : 's'}. Changing visibility or PPV price only affects future viewers; existing buyers automatically retain permanent access to their unlocked purchase.
              </p>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Post updated! All changes are now live across your profile, feed, and Creator Studio.</span>
            </div>
          )}

          {/* 1. Description / Caption */}
          <div className="space-y-2">
            <label className="block font-semibold text-neutral-200 text-xs">
              Post Description / Caption
            </label>
            <textarea
              rows={3}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Write your post caption or description..."
              className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* 2. Hashtags (Add, Remove, or Inline Edit) */}
          <div className="space-y-2">
            <label className="block font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Hashtags (Click a tag to edit, or add/remove tags)</span>
            </label>

            <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-xl bg-[#18181f] border border-[#2b2b36]">
              {hashtags.map((tag, idx) =>
                editingTagIndex === idx ? (
                  <div key={idx} className="inline-flex items-center gap-1 bg-[#24242f] border border-[#d4af37] rounded-lg px-2 py-1">
                    <span className="text-[#d4af37]">#</span>
                    <input
                      type="text"
                      value={editingTagValue}
                      onChange={e => setEditingTagValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCommitTagEdit(idx);
                        }
                      }}
                      onBlur={() => handleCommitTagEdit(idx)}
                      autoFocus
                      className="bg-transparent text-white text-xs w-24 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span
                    key={`${tag}_${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#22222c] border border-[#323240] text-[#fce7b0] text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTagIndex(idx);
                        setEditingTagValue(tag);
                      }}
                      className="hover:underline cursor-pointer"
                      title="Click to edit hashtag"
                    >
                      #{tag}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="text-neutral-400 hover:text-rose-400 cursor-pointer"
                      title="Remove hashtag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              )}

              <div className="flex items-center gap-1.5 flex-1 min-w-[160px]">
                <input
                  type="text"
                  value={hashtagInput}
                  onChange={e => setHashtagInput(e.target.value)}
                  onKeyDown={handleAddHashtag}
                  placeholder="Add hashtag and press Enter..."
                  className="bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none flex-1 px-1.5 py-1"
                />
                {hashtagInput.trim() && (
                  <button
                    type="button"
                    onClick={() => handleAddHashtag()}
                    className="px-2.5 py-1 rounded-lg bg-[#d4af37] text-black font-bold text-[11px] cursor-pointer"
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 3. Category & Content Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Post Categories */}
            <div className="space-y-2">
              <label className="block font-semibold text-neutral-200 text-xs">
                Post Category ({selectedCategories.length} selected)
              </label>
              <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl bg-[#18181f] border border-[#2b2b36] flex flex-wrap gap-1.5">
                {availableCategories.map(cat => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleToggleCategory(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
                        isSelected
                          ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]'
                          : 'bg-[#121217] border-[#272732] text-neutral-300 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Video Country / Content Country */}
            <div className="space-y-2">
              <label className="block font-semibold text-neutral-200 text-xs flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Video Country / Content Country</span>
              </label>
              <select
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full bg-[#18181f] border border-[#2b2b36] focus:border-[#d4af37] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none"
              >
                {SUPPORTED_CONTENT_COUNTRIES.map(c => (
                  <option key={c} value={c} className="bg-[#141418] text-white">
                    {c}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400">
                Used for regional discovery, country classification, and audience localization.
              </p>
            </div>
          </div>

          {/* 4. Post Visibility & Access Settings */}
          <div className="space-y-3">
            <label className="block font-semibold text-neutral-200 text-xs">
              Post Visibility &amp; Access Settings
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(
                [
                  { id: 'public', label: 'Public', desc: 'Everyone', icon: Globe },
                  { id: 'followers', label: 'Followers', desc: 'Free Followers', icon: Users },
                  { id: 'subscribers', label: 'Subscribers', desc: 'Paid Members', icon: Sparkles },
                  { id: 'pay_per_view', label: 'Pay-To-View', desc: 'One-Time Unlock', icon: Lock },
                  { id: 'private', label: 'Private', desc: 'Only You', icon: Eye }
                ] as const
              ).map(opt => {
                const Icon = opt.icon;
                const isSelected = visibility === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setVisibility(opt.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1e1b12] border-[#d4af37] text-white shadow-md'
                        : 'bg-[#18181f] border-[#2b2b36] text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[#d4af37]' : 'text-neutral-400'}`} />
                      {isSelected && <Check className="w-3 h-3 text-[#d4af37]" />}
                    </div>
                    <div className="font-bold text-xs text-white">{opt.label}</div>
                    <div className="text-[10px] text-neutral-400">{opt.desc}</div>
                  </button>
                );
              })}
            </div>

            {visibility === 'pay_per_view' && (
              <div className="p-3.5 rounded-xl bg-[#18181f] border border-[#d4af37]/40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-[#fce7b0] mb-1">
                    Pay-To-View Unlock Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.50"
                    min="0.99"
                    max="1000"
                    value={ppvPrice}
                    onChange={e => setPpvPrice(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121216] border border-[#2b2b36] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[#fce7b0] mb-1">
                    Free Preview Teaser Duration
                  </label>
                  <div className="flex items-center gap-2">
                    {([10, 15, 30] as const).map(sec => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setPpvPreviewDuration(sec)}
                        className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold border cursor-pointer ${
                          ppvPreviewDuration === sec
                            ? 'bg-[#d4af37] text-black border-[#d4af37]'
                            : 'bg-[#121216] text-neutral-300 border-[#2b2b36]'
                        }`}
                      >
                        {sec}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Thumbnail / Cover Image & Attached Media Replacement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#23232c]">
            {/* Thumbnail / Cover Image */}
            <div className="space-y-2.5 bg-[#16161d] border border-[#272733] rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Post Thumbnail / Cover Image</span>
                </span>
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="px-2.5 py-1 rounded-lg bg-[#22222d] hover:bg-[#2c2c3a] border border-[#343444] text-[#fce7b0] text-[11px] font-semibold cursor-pointer"
                >
                  Upload Custom Cover
                </button>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#272730]">
                {thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Post thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    No thumbnail selected
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] text-neutral-400 block">Quick Cover Presets or Paste Image URL:</span>
                <div className="flex items-center gap-1.5">
                  {THUMBNAIL_PRESETS.map((preset, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setThumbnailUrl(preset);
                        setMediaList(prev =>
                          prev.map((m, idx) => (idx === 0 ? { ...m, thumbnailUrl: preset } : m))
                        );
                      }}
                      className={`w-10 h-7 rounded overflow-hidden border cursor-pointer ${
                        thumbnailUrl === preset ? 'border-[#d4af37] ring-1 ring-[#d4af37]' : 'border-neutral-700'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <input
                    type="url"
                    value={customThumbUrlInput}
                    onChange={e => setCustomThumbUrlInput(e.target.value)}
                    onBlur={() => {
                      if (customThumbUrlInput.trim()) {
                        setThumbnailUrl(customThumbUrlInput.trim());
                        setMediaList(prev =>
                          prev.map((m, idx) =>
                            idx === 0 ? { ...m, thumbnailUrl: customThumbUrlInput.trim() } : m
                          )
                        );
                      }
                    }}
                    placeholder="Or paste cover URL..."
                    className="flex-1 bg-[#121216] border border-[#2b2b36] rounded-lg px-2 py-1 text-[11px] text-white placeholder-neutral-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Attached Media Replacement */}
            <div className="space-y-2.5 bg-[#16161d] border border-[#272733] rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  {isCurrentVideo ? (
                    <VideoIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  )}
                  <span>Attached Media ({isCurrentVideo ? 'Video' : 'Photo'})</span>
                </span>
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={isUploadingFile}
                  className="px-2.5 py-1 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-[#fce7b0] text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isUploadingFile ? 'animate-spin' : ''}`} />
                  <span>{isUploadingFile ? 'Uploading...' : 'Replace Media'}</span>
                </button>
                <input
                  ref={mediaInputRef}
                  type="file"
                  accept="video/*,image/*"
                  onChange={handleReplaceMediaFile}
                  className="hidden"
                />
              </div>

              <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#272730]">
                {currentMedia ? (
                  isCurrentVideo ? (
                    <video
                      key={currentMedia.url}
                      src={
                        currentMedia.url &&
                        !currentMedia.url.includes('cdn.acovon.media') &&
                        !currentMedia.url.endsWith('.m3u8')
                          ? currentMedia.url
                          : '/videos/sample1.mp4'
                      }
                      poster={thumbnailUrl || currentMedia.thumbnailUrl}
                      controls
                      playsInline
                      preload="metadata"
                      onError={e => {
                        const el = e.currentTarget;
                        if (!el.src.includes('/videos/sample1.mp4')) {
                          el.src = '/videos/sample1.mp4';
                          el.load();
                        }
                      }}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <img
                      src={currentMedia.url}
                      alt="Attached post media"
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    No media attached
                  </div>
                )}
              </div>

              {/* Quick sample video/photo switcher for testing media replacement */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-neutral-400">Replace with studio asset:</span>
                <div className="flex items-center gap-1">
                  {['/videos/sample1.mp4', '/videos/sample2.mp4', '/videos/sample3.mp4'].map(
                    (sampleUrl, idx) => (
                      <button
                        key={sampleUrl}
                        type="button"
                        onClick={() => {
                          setMediaList([
                            {
                              id: `media_rep_${Date.now()}`,
                              type: 'video',
                              url: sampleUrl,
                              thumbnailUrl: thumbnailUrl || THUMBNAIL_PRESETS[idx % THUMBNAIL_PRESETS.length],
                              previewUrl: sampleUrl,
                              durationSeconds: 45,
                              availableResolutions: ['1080p', '720p', '480p'],
                              availableCodecs: ['AV1']
                            }
                          ]);
                          setIsMediaReplaced(true);
                        }}
                        className="px-2 py-0.5 rounded bg-[#22222c] hover:bg-[#2c2c38] text-[10px] text-neutral-300 border border-[#323242] cursor-pointer"
                      >
                        Clip {idx + 1}
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mandatory Warning & Confirmation if replacing media on a post with existing purchases */}
          {isMediaReplaced && hasExistingPurchases && (
            <div className="p-4 rounded-xl bg-amber-950/50 border border-amber-500/50 space-y-2.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Media Replacement Warning — Existing Fan Purchases Detected</span>
              </div>
              <p className="text-[11px] text-amber-100/90 leading-relaxed">
                Because {purchaseCount} fan{purchaseCount === 1 ? ' has' : 's have'} already purchased this post, ACOVON will preserve the original purchased media in their unlocked library while updating the post with your new media.
              </p>
              <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={confirmMediaReplacement}
                  onChange={e => setConfirmMediaReplacement(e.target.checked)}
                  className="mt-0.5 accent-[#d4af37]"
                />
                <span className="text-[11px] font-semibold text-white">
                  I confirm this media replacement and understand that existing buyers retain access to their purchased content.
                </span>
              </label>
            </div>
          )}

          {/* Additional Post Permissions */}
          <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-[#23232c]">
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={commentsDisabled}
                onChange={e => setCommentsDisabled(e.target.checked)}
                className="accent-[#d4af37]"
              />
              <span>Disable Comments on this Post</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
              <input
                type="checkbox"
                checked={downloadsDisabled}
                onChange={e => setDownloadsDisabled(e.target.checked)}
                className="accent-[#d4af37]"
              />
              <span>DRM Download Protection Enabled</span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#23232c]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-[#1c1c24] hover:bg-[#252530] border border-[#2e2e3a] text-neutral-300 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs shadow-lg shadow-[#d4af37]/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Post Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
