import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PostVisibility, MediaAsset, PostRevision } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { SearchableCountrySelector } from '../discovery/DiscoveryFilterBar';
import { uploadUserFileToSupabase } from '../../services/supabase';
import {
  extractVideoCoverFrames,
  fetchStoredVideoCoverMetadata,
  persistSelectedVideoCover,
  isStockOrPlaceholderThumbnail,
  computeAspectRatioLabel,
  ExtractedVideoFrame
} from '../../utils/videoFrameExtractor';
import {
  X,
  Edit3,
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
  Heart,
  MessageCircle,
  Eye,
  RefreshCw,
  Check,
  RotateCcw,
  Wand2,
  History
} from 'lucide-react';

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
  const { platformConfig, activeCategories, getPostRevisions, restorePostRevision } = useApp();
  const firstMedia = post.media?.[0];
  const initialIsVideo = firstMedia?.type === 'video';

  const [content, setContent] = useState<string>(post.content || '');
  const [hashtags, setHashtags] = useState<string[]>(
    Array.isArray(post.tags) && post.tags.length > 0 ? post.tags : ['Acovon']
  );
  const [hashtagInput, setHashtagInput] = useState<string>('');
  const [editingTagIndex, setEditingTagIndex] = useState<number | null>(null);
  const [editingTagValue, setEditingTagValue] = useState<string>('');

  const availableCategories = (() => {
    const raw = [
      ...(activeCategories && activeCategories.length > 0 ? activeCategories.map(c => c.name) : []),
      ...(platformConfig?.contentCategories || []),
      ...CATEGORIES.filter(c => c !== 'All Categories')
    ];
    const seen = new Set<string>();
    const out: string[] = [];
    for (const item of raw) {
      const trimmed = typeof item === 'string' ? item.trim() : '';
      const norm = trimmed.toLowerCase();
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);
      out.push(trimmed);
    }
    return out;
  })();

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    Array.isArray(post.categories) && post.categories.length > 0
      ? Array.from(new Set(post.categories))
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
  const resolvePlayableVideoUrl = (asset?: MediaAsset): string => {
    if (!asset) return '';
    if (asset.url && !asset.url.includes('cdn.acovon.media') && !asset.url.endsWith('.m3u8')) {
      return asset.url;
    }
    if (
      asset.previewUrl &&
      !asset.previewUrl.includes('cdn.acovon.media') &&
      !asset.previewUrl.endsWith('.m3u8')
    ) {
      return asset.previewUrl;
    }
    return asset.url || asset.previewUrl || '';
  };

  const initialThumb =
    firstMedia?.thumbnailUrl && !isStockOrPlaceholderThumbnail(firstMedia.thumbnailUrl)
      ? firstMedia.thumbnailUrl
      : !initialIsVideo
      ? firstMedia?.url || ''
      : '';

  const [thumbnailUrl, setThumbnailUrl] = useState<string>(initialThumb);
  const [mediaList, setMediaList] = useState<MediaAsset[]>(
    Array.isArray(post.media) ? [...post.media] : []
  );
  const [extractedFrames, setExtractedFrames] = useState<ExtractedVideoFrame[]>(() => {
    const existingFrames = (firstMedia?.previewFrames || []).filter(
      url => url && !isStockOrPlaceholderThumbnail(url)
    );
    return existingFrames.map((url, idx) => ({
      id: `existing_f_${idx + 1}`,
      url,
      timestampSeconds: idx * 3,
      timestampFormatted: `0:${(idx * 3).toString().padStart(2, '0')}`,
      width: firstMedia?.width || 1280,
      height: firstMedia?.height || 720,
      aspectRatio: firstMedia?.aspectRatio || '16:9',
      lumaMean: 115,
      contrastScore: 95,
      isAutoRecommended: idx === 0
    }));
  });
  const [recommendedThumbnailUrl, setRecommendedThumbnailUrl] = useState<string>(initialThumb);
  const [autoSelectCover, setAutoSelectCover] = useState<boolean>(true);
  const [coverExtractionStatus, setCoverExtractionStatus] = useState<'idle' | 'extracting' | 'ready' | 'failed'>(
    initialIsVideo ? 'extracting' : 'ready'
  );
  const [coverExtractionError, setCoverExtractionError] = useState<string | null>(null);
  const [lastReplacementFile, setLastReplacementFile] = useState<File | undefined>(undefined);
  const [isMediaReplaced, setIsMediaReplaced] = useState<boolean>(false);
  const [confirmMediaReplacement, setConfirmMediaReplacement] = useState<boolean>(false);
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);

  const [saving, setSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [showVersionHistory, setShowVersionHistory] = useState<boolean>(false);
  const [revisions, setRevisions] = useState<PostRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState<boolean>(false);
  const [restoringRevisionId, setRestoringRevisionId] = useState<string | null>(null);

  const loadRevisions = async () => {
    setLoadingRevisions(true);
    const res = await getPostRevisions(post.id);
    setLoadingRevisions(false);
    if (res.success) {
      setRevisions(res.revisions);
    }
  };

  const handleRestoreVersion = async (rev: PostRevision) => {
    setErrorMessage(null);
    setRestoringRevisionId(rev.revisionId);
    const res = await restorePostRevision(post.id, rev.revisionId);
    setRestoringRevisionId(null);
    if (!res.success || !res.restoredPost) {
      setErrorMessage(res.error || 'Unable to restore selected version.');
      return;
    }
    const restored = res.restoredPost;
    setContent(restored.content || '');
    setHashtags(Array.isArray(restored.tags) ? restored.tags : []);
    setSelectedCategories(Array.isArray(restored.categories) ? restored.categories : []);
    if (restored.country) setCountry(restored.country);
    if (restored.visibility) setVisibility(restored.visibility);
    if (typeof restored.ppvPrice === 'number') setPpvPrice(restored.ppvPrice);
    if (Array.isArray(restored.media)) {
      setMediaList(restored.media);
      const firstRestored = restored.media[0];
      if (firstRestored?.thumbnailUrl) setThumbnailUrl(firstRestored.thumbnailUrl);
    }
    await loadRevisions();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 1800);
  };

  const runVideoFrameExtraction = async (params: {
    file?: File;
    sourceUrl?: string;
    videoMediaId?: string;
    forceResetThumbnail?: boolean;
  }) => {
    setCoverExtractionStatus('extracting');
    setCoverExtractionError(null);
    if (params.forceResetThumbnail) {
      setThumbnailUrl('');
      setRecommendedThumbnailUrl('');
      setExtractedFrames([]);
    }

    const res = await extractVideoCoverFrames({
      file: params.file,
      sourceUrl: params.sourceUrl,
      videoMediaId: params.videoMediaId,
      postId: post.id,
      creatorId: currentUserId
    });

    if (!res.success || res.frames.length === 0) {
      setCoverExtractionStatus('failed');
      setCoverExtractionError(
        res.error || 'Could not extract frames from this video. Please retry frame extraction.'
      );
      return;
    }

    const urls = res.frames.map(f => f.url);
    const bestUrl = res.recommendedThumbnailUrl || urls[0];

    setExtractedFrames(res.frames);
    setRecommendedThumbnailUrl(bestUrl);
    setCoverExtractionStatus('ready');
    setCoverExtractionError(null);

    const chosenUrl =
      !params.forceResetThumbnail &&
      !autoSelectCover &&
      thumbnailUrl &&
      !isStockOrPlaceholderThumbnail(thumbnailUrl)
        ? thumbnailUrl
        : bestUrl;

    setThumbnailUrl(chosenUrl);
    setMediaList(prev =>
      prev.map((m, idx) =>
        idx === 0
          ? {
              ...m,
              thumbnailUrl: chosenUrl,
              previewFrames: urls,
              width: res.width || m.width,
              height: res.height || m.height,
              aspectRatio: res.aspectRatio || computeAspectRatioLabel(res.width || 1280, res.height || 720),
              orientation: res.orientation || m.orientation,
              durationSeconds: res.durationSeconds || m.durationSeconds
            }
          : m
      )
    );
  };

  useEffect(() => {
    if (!initialIsVideo || !firstMedia) return;
    let cancelled = false;

    const loadOrExtractInitialFrames = async () => {
      const existingValid = (firstMedia.previewFrames || []).filter(
        u => u && !isStockOrPlaceholderThumbnail(u)
      );
      const storedMeta = await fetchStoredVideoCoverMetadata({
        postId: post.id,
        videoMediaId: firstMedia.videoMediaId
      });

      if (cancelled) return;

      if (storedMeta && storedMeta.frames.length > 0 && !isStockOrPlaceholderThumbnail(storedMeta.selectedThumbnailUrl)) {
        const storedUrls = storedMeta.frames.map(f => f.url);
        const activeThumb =
          firstMedia.thumbnailUrl && !isStockOrPlaceholderThumbnail(firstMedia.thumbnailUrl)
            ? firstMedia.thumbnailUrl
            : storedMeta.selectedThumbnailUrl || storedUrls[0];
        setExtractedFrames(storedMeta.frames);
        setRecommendedThumbnailUrl(storedMeta.recommendedThumbnailUrl || storedUrls[0]);
        setAutoSelectCover(storedMeta.autoSelected !== false);
        setThumbnailUrl(activeThumb);
        setCoverExtractionStatus('ready');
        setMediaList(prev =>
          prev.map((m, idx) =>
            idx === 0 ? { ...m, thumbnailUrl: activeThumb, previewFrames: storedUrls } : m
          )
        );
        return;
      }

      if (existingValid.length >= 2 && firstMedia.thumbnailUrl && !isStockOrPlaceholderThumbnail(firstMedia.thumbnailUrl)) {
        setCoverExtractionStatus('ready');
        return;
      }

      const sourceUrl = resolvePlayableVideoUrl(firstMedia);
      if (sourceUrl) {
        await runVideoFrameExtraction({
          sourceUrl,
          videoMediaId: firstMedia.videoMediaId,
          forceResetThumbnail: isStockOrPlaceholderThumbnail(firstMedia.thumbnailUrl)
        });
      }
    };

    loadOrExtractInitialFrames();
    return () => {
      cancelled = true;
    };
  }, [post.id]);

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

    try {
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUserId,
        file,
        featureName: 'post-thumbnails',
        itemId: post.id,
        visibility: 'public'
      });
      if (!uploadRes.success || !uploadRes.signedUrl || uploadRes.signedUrl.startsWith('blob:')) {
        setErrorMessage(uploadRes.error || 'Failed to upload thumbnail to permanent storage.');
        return;
      }
      const finalUrl = uploadRes.signedUrl;
      setAutoSelectCover(false);
      setCoverExtractionStatus('ready');
      setThumbnailUrl(finalUrl);
      setMediaList(prev =>
        prev.map((m, idx) => (idx === 0 ? { ...m, thumbnailUrl: finalUrl } : m))
      );
    } catch {
      setErrorMessage('Failed to upload thumbnail to permanent storage.');
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
    const replacementMediaId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `vmedia_${crypto.randomUUID()}`
        : `vmedia_rep_${Date.now()}`;

    try {
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUserId,
        file,
        featureName: 'posts',
        itemId: post.id,
        visibility: visibility === 'public' ? 'public' : 'private'
      });

      if (!uploadRes.success || !uploadRes.signedUrl || uploadRes.signedUrl.startsWith('blob:')) {
        setErrorMessage(
          uploadRes.error || 'Failed to save replacement media to permanent storage. Original media preserved.'
        );
        return;
      }
      const resolvedUrl = uploadRes.signedUrl;

      const newAsset: MediaAsset = {
        id:
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? `media_${crypto.randomUUID()}`
            : `media_${Date.now()}`,
        videoMediaId: isVideo ? replacementMediaId : undefined,
        type: isVideo ? 'video' : 'image',
        url: resolvedUrl,
        thumbnailUrl: isVideo ? '' : resolvedUrl,
        previewUrl: isVideo ? resolvedUrl : undefined,
        previewFrames: isVideo ? [] : undefined,
        durationSeconds: isVideo ? 30 : undefined,
        availableResolutions: isVideo ? ['1080p', '720p', '480p', '360p'] : undefined,
        availableCodecs: isVideo ? ['AV1', 'H.264'] : undefined,
        compressionRatio: isVideo ? 64 : undefined
      };

      setMediaList([newAsset]);
      setIsMediaReplaced(true);

      if (isVideo) {
        // Critical: Clear previous video thumbnail immediately and regenerate from replacement video
        setLastReplacementFile(file);
        setAutoSelectCover(true);
        await runVideoFrameExtraction({
          file,
          sourceUrl: resolvedUrl,
          videoMediaId: replacementMediaId,
          forceResetThumbnail: true
        });
      } else {
        setLastReplacementFile(undefined);
        setThumbnailUrl(resolvedUrl);
        setExtractedFrames([]);
        setCoverExtractionStatus('ready');
      }
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

    const activeMedia = mediaList[0];
    if (activeMedia?.type === 'video') {
      if (coverExtractionStatus === 'extracting') {
        setErrorMessage('Still extracting video cover frames from the video. Please wait a moment.');
        return;
      }
      if (
        coverExtractionStatus === 'failed' ||
        !thumbnailUrl ||
        isStockOrPlaceholderThumbnail(thumbnailUrl)
      ) {
        setErrorMessage(
          'A valid cover frame extracted from this video is required before saving. Click Retry Frame Extraction.'
        );
        return;
      }
    }

    const finalPreviewFrames =
      extractedFrames.length > 0 ? extractedFrames.map(f => f.url) : activeMedia?.previewFrames;
    const syncedMediaList = mediaList.map((m, idx) =>
      idx === 0
        ? {
            ...m,
            thumbnailUrl: thumbnailUrl || m.thumbnailUrl,
            previewFrames: finalPreviewFrames
          }
        : m
    );

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
      media: syncedMediaList,
      commentsDisabled,
      downloadsDisabled,
      confirmMediaReplacementForPurchasers: confirmMediaReplacement
    });
    setSaving(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to update post.');
      return;
    }

    if (activeMedia?.type === 'video' && thumbnailUrl) {
      persistSelectedVideoCover({
        postId: post.id,
        videoMediaId: activeMedia.videoMediaId,
        creatorId: currentUserId,
        selectedThumbnailUrl: thumbnailUrl,
        autoSelected: autoSelectCover && thumbnailUrl === recommendedThumbnailUrl,
        previewFrames: finalPreviewFrames
      });
    }

    setSaveSuccess(true);
    setTimeout(() => {
      onClose();
    }, 650);
  };

  const currentMedia = mediaList[0];
  const isCurrentVideo = currentMedia?.type === 'video';
  const estimatedViews = post.viewsCount || 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121216] border border-[#272730] rounded-2xl max-w-3xl w-full max-h-[92dvh] acovon-modal-panel flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#23232c] flex items-center justify-between gap-2 bg-[#15151b] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] shrink-0">
              <Edit3 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold text-white truncate">Edit Published Post</h2>
              <p className="text-[11px] text-neutral-400 truncate">
                Post ID #{post.id.slice(-6)} · Published {post.createdAt}
                {post.updatedAt ? ` · Last edited ${post.updatedAt}` : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-xl hover:bg-[#1e1e26] transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-5 sm:space-y-6 overflow-y-auto flex-1 min-h-0 text-xs">
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

            {/* Video Country / Content Country (Searchable ISO 3166-1 Country Selector) */}
            <div className="space-y-2">
              <SearchableCountrySelector
                value={country}
                onChange={setCountry}
                label="Video Country / Content Country"
                required
                placeholder="Search and select video country..."
              />
              <p className="text-[11px] text-neutral-400">
                Independent from your Creator Profile country. Used for regional discovery and video country filtering.
              </p>
            </div>
          </div>

          {/* 4. Post Visibility & Access Settings */}
          <div className="space-y-3">
            <label className="block font-semibold text-neutral-200 text-xs">
              Post Visibility &amp; Access Settings
            </label>
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
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

          {/* 5. Choose Video Cover & Attached Media Replacement */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[#23232c]">
            {/* Choose Video Cover / Thumbnail Image */}
            <div className="space-y-2.5 bg-[#16161d] border border-[#272733] rounded-xl p-3.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-semibold text-neutral-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{isCurrentVideo ? 'Choose Video Cover' : 'Post Cover Image'}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {isCurrentVideo && (
                    <button
                      type="button"
                      onClick={() =>
                        runVideoFrameExtraction({
                          file: lastReplacementFile,
                          sourceUrl: resolvePlayableVideoUrl(currentMedia),
                          videoMediaId: currentMedia?.videoMediaId,
                          forceResetThumbnail: true
                        })
                      }
                      disabled={coverExtractionStatus === 'extracting'}
                      className="px-2 py-1 rounded-lg bg-[#22222d] hover:bg-[#2c2c3a] border border-[#343444] text-neutral-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCcw className={`w-3 h-3 ${coverExtractionStatus === 'extracting' ? 'animate-spin' : ''}`} />
                      <span>Regenerate Frames</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => thumbInputRef.current?.click()}
                    className="px-2 py-1 rounded-lg bg-[#22222d] hover:bg-[#2c2c3a] border border-[#343444] text-[#fce7b0] text-[10px] font-semibold cursor-pointer"
                  >
                    Upload Image
                  </button>
                </div>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                  className="hidden"
                />
              </div>

              {isCurrentVideo && (
                <label className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[#121216] border border-[#282834] cursor-pointer text-[11px] text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Automatic Cover Selection</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={autoSelectCover}
                    onChange={e => {
                      const enabled = e.target.checked;
                      setAutoSelectCover(enabled);
                      if (enabled && recommendedThumbnailUrl) {
                        setThumbnailUrl(recommendedThumbnailUrl);
                        setMediaList(prev =>
                          prev.map((m, idx) =>
                            idx === 0 ? { ...m, thumbnailUrl: recommendedThumbnailUrl } : m
                          )
                        );
                      }
                    }}
                    className="accent-[#d4af37] w-3.5 h-3.5"
                  />
                </label>
              )}

              <div
                className="relative rounded-xl overflow-hidden bg-black border border-[#272730] max-h-52 mx-auto w-full flex items-center justify-center"
                style={{
                  aspectRatio:
                    currentMedia?.width && currentMedia?.height
                      ? `${currentMedia.width} / ${currentMedia.height}`
                      : '16 / 9'
                }}
              >
                {isCurrentVideo && coverExtractionStatus === 'extracting' ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <RotateCcw className="w-5 h-5 text-[#d4af37] animate-spin" />
                    <span className="text-[11px] text-[#fce7b0]">
                      Extracting cover frames directly from video...
                    </span>
                  </div>
                ) : isCurrentVideo && coverExtractionStatus === 'failed' ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                    <span className="text-[11px] text-rose-200">
                      {coverExtractionError || 'Failed to extract frames from this video.'}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        runVideoFrameExtraction({
                          file: lastReplacementFile,
                          sourceUrl: resolvePlayableVideoUrl(currentMedia),
                          videoMediaId: currentMedia?.videoMediaId,
                          forceResetThumbnail: true
                        })
                      }
                      className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold cursor-pointer"
                    >
                      Retry Frame Extraction
                    </button>
                  </div>
                ) : thumbnailUrl ? (
                  <img
                    src={thumbnailUrl}
                    alt="Post cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-500">
                    No cover frame selected
                  </div>
                )}
              </div>

              {isCurrentVideo && extractedFrames.length > 0 && coverExtractionStatus !== 'extracting' && (
                <div className="space-y-1.5">
                  <span className="text-[10px] text-neutral-400 block">
                    Extracted Video Frames (Select Cover):
                  </span>
                  <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5">
                    {extractedFrames.map(frame => {
                      const isSelected = thumbnailUrl === frame.url;
                      return (
                        <button
                          key={frame.id}
                          type="button"
                          onClick={() => {
                            setAutoSelectCover(false);
                            setThumbnailUrl(frame.url);
                            setMediaList(prev =>
                              prev.map((m, idx) =>
                                idx === 0 ? { ...m, thumbnailUrl: frame.url } : m
                              )
                            );
                          }}
                          className={`relative rounded-lg overflow-hidden border-2 cursor-pointer bg-black transition-all ${
                            isSelected
                              ? 'border-[#d4af37] ring-1 ring-[#d4af37]'
                              : 'border-[#272730] opacity-75 hover:opacity-100'
                          }`}
                          style={{
                            aspectRatio:
                              currentMedia?.width && currentMedia?.height
                                ? `${currentMedia.width} / ${currentMedia.height}`
                                : '16 / 9'
                          }}
                        >
                          <img
                            src={frame.url}
                            alt={`Frame at ${frame.timestampFormatted}`}
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 px-1 rounded bg-black/80 text-[9px] font-mono text-white">
                            {frame.timestampFormatted}
                          </span>
                          {frame.isAutoRecommended && (
                            <span className="absolute top-1 left-1 px-1 rounded bg-[#d4af37] text-[8px] font-bold text-black">
                              Best
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-[#d4af37] text-black flex items-center justify-center">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Attached Media Replacement */}
            <div className="space-y-2.5 bg-[#16161d] border border-[#272733] rounded-xl p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
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

              <div
                className="relative rounded-xl overflow-hidden bg-black border border-[#272730] max-h-52 mx-auto w-full"
                style={{
                  aspectRatio:
                    currentMedia?.width && currentMedia?.height
                      ? `${currentMedia.width} / ${currentMedia.height}`
                      : '16 / 9'
                }}
              >
                {currentMedia ? (
                  isCurrentVideo ? (
                    <video
                      key={currentMedia.url}
                      src={resolvePlayableVideoUrl(currentMedia)}
                      poster={thumbnailUrl || undefined}
                      controls
                      playsInline
                      preload="metadata"
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
          <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-2 border-t border-[#23232c]">
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

          {/* Post Revision History & One-Click Restore */}
          <div className="pt-2 border-t border-[#23232c] space-y-2.5">
            <button
              type="button"
              onClick={() => {
                const next = !showVersionHistory;
                setShowVersionHistory(next);
                if (next && revisions.length === 0) {
                  loadRevisions();
                }
              }}
              className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-xl bg-[#16161d] hover:bg-[#1b1b24] border border-[#272733] text-neutral-200 font-semibold cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>
                  Version History &amp; Snapshot Protection (v{post.version || 1})
                </span>
              </span>
              <span className="text-[11px] text-[#d4af37]">
                {showVersionHistory ? 'Hide History' : 'Inspect / Restore'}
              </span>
            </button>

            {showVersionHistory && (
              <div className="p-3.5 rounded-xl bg-[#14141a] border border-[#262632] space-y-2.5 max-h-56 overflow-y-auto">
                {loadingRevisions ? (
                  <div className="text-neutral-400 text-[11px] py-2">Loading saved snapshots...</div>
                ) : revisions.length === 0 ? (
                  <div className="text-neutral-500 text-[11px] py-2">
                    No prior snapshots recorded yet. Saving edits automatically preserves every previous version.
                  </div>
                ) : (
                  revisions.map(rev => (
                    <div
                      key={rev.revisionId}
                      className="p-2.5 rounded-lg bg-[#1a1a22] border border-[#2a2a36] flex flex-wrap sm:flex-nowrap items-start justify-between gap-3"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 text-[11px] font-bold text-white">
                          <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/15 text-[#fce7b0] border border-[#d4af37]/30">
                            v{rev.version}
                          </span>
                          <span className="capitalize">{rev.changeType.replace('_', ' ')}</span>
                          <span className="text-neutral-500 font-normal">
                            · {rev.createdAt.replace('T', ' ').slice(0, 16)}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-300 truncate">
                          {rev.snapshot.content}
                        </p>
                        {rev.reason && (
                          <p className="text-[10px] text-neutral-500">{rev.reason}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(rev)}
                        disabled={restoringRevisionId === rev.revisionId}
                        className="px-2.5 py-1 rounded-lg bg-[#23232f] hover:bg-[#d4af37] hover:text-black border border-[#353546] text-[10px] font-semibold text-neutral-200 shrink-0 cursor-pointer transition-colors"
                      >
                        {restoringRevisionId === rev.revisionId ? 'Restoring...' : 'Restore'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-[#23232c]">
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
