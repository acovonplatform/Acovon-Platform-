import React, { useState, useRef, useEffect } from 'react';
import { Post, VideoResolution, RecommendedPostResult, EngagementSurface } from '../../types';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { TranslateContentButton } from '../common/TranslateContentButton';
import { 
  Heart, 
  MessageCircle, 
  Coins, 
  Lock, 
  Unlock, 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  MoreHorizontal, 
  Share2, 
  Bookmark,
  ShieldAlert,
  Sparkles,
  Maximize2,
  Crown,
  Film,
  UserCheck,
  UserPlus,
  X,
  Settings,
  PictureInPicture2,
  Cpu,
  Zap,
  Check,
  ThumbsUp,
  ThumbsDown,
  EyeOff,
  UserX,
  RotateCcw
} from 'lucide-react';

interface PostCardProps {
  post: Post;
  recommendationResult?: RecommendedPostResult;
  feedSurface?: EngagementSurface;
  hideCreatorHeader?: boolean;
  onNavigateToCreator: (creatorId: string) => void;
  onOpenTipModal: (creatorId: string, creatorName: string) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  onOpenShareModal?: (post: Post) => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  recommendationResult,
  feedSurface = 'feed_all',
  hideCreatorHeader = false,
  onNavigateToCreator,
  onOpenTipModal,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenVideoPlayer,
  onOpenPhotoViewer
}) => {
  const { 
    currentUser, 
    toggleLikePost, 
    unlockPPVPost, 
    isPostPurchased, 
    isSubscribedTo,
    isFollowing,
    toggleFollowCreator,
    isPostSaved,
    toggleSavePost,
    activePlayingVideoId,
    setActivePlayingVideoId,
    showDemoBadges,
    videoMediaRecords,
    saveVideoPlaybackPosition,
    getVideoPlaybackPosition,
    getAuthorizedPlaybackUrl,
    trackEngagementEvent,
    submitPostRecommendationFeedback,
    getUpNextVideoRecommendations
  } = useApp();

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedPercent, setBufferedPercent] = useState(35);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution | 'auto'>('auto');
  const [activeStreamResolution, setActiveStreamResolution] = useState<VideoResolution>('1080p');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const [hoverSeekPercent, setHoverSeekPercent] = useState<number>(0);
  const [previewExceeded, setPreviewExceeded] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [localComments, setLocalComments] = useState<string[]>([
    'Incredible aesthetic and direction!',
    'The quality on Acovon is unrivaled.'
  ]);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // 3-Dot Personalization & Report Menu State
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('copyright');
  const [reportSubmittedToast, setReportSubmittedToast] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLElement>(null);
  const seekBarRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const hasLoggedImpressionRef = useRef(false);
  const hasLoggedWatch50Ref = useRef(false);

  const isAuthor = currentUser.id === post.creatorId;
  const isPurchased = isPostPurchased(post.id);
  const isSubscribed = isSubscribedTo(post.creatorId);
  const isFollowingCreator = isFollowing(post.creatorId);
  const isSaved = isPostSaved(post.id);

  const isLockedPPV = post.visibility === 'pay_per_view' && !isAuthor && !isPurchased;
  const isLockedSubscribers = post.visibility === 'subscribers' && !isAuthor && !isSubscribed;

  const previewDuration = post.ppvPreviewDuration || 15;
  const videoAsset = post.media?.find(m => m.type === 'video');
  const imageAssets = post.media?.filter(m => m.type === 'image') || [];
  const primaryCategory = post.categories?.[0];

  // Up Next video recommendations when video finishes
  const upNextRecommendations = videoEnded ? getUpNextVideoRecommendations(post.id, 2) : [];

  // Linked VideoMediaRecord for adaptive streaming metadata
  const linkedMediaRecord = videoAsset?.videoMediaId
    ? videoMediaRecords.find(r => r.id === videoAsset.videoMediaId)
    : undefined;

  const resolvedVideoSrc =
    videoAsset?.url && !videoAsset.url.includes('cdn.acovon.media') && !videoAsset.url.endsWith('.m3u8')
      ? videoAsset.url
      : videoAsset?.previewUrl && !videoAsset.previewUrl.includes('cdn.acovon.media') && !videoAsset.previewUrl.endsWith('.m3u8')
      ? videoAsset.previewUrl
      : linkedMediaRecord?.originalStorageRef &&
        (linkedMediaRecord.originalStorageRef.startsWith('http') ||
          linkedMediaRecord.originalStorageRef.startsWith('blob:')) &&
        !linkedMediaRecord.originalStorageRef.includes('cdn.acovon.media')
      ? linkedMediaRecord.originalStorageRef
      : '/videos/sample1.mp4';

  const availableResolutions: VideoResolution[] =
    videoAsset?.availableResolutions ||
    linkedMediaRecord?.availableResolutions ||
    ['1080p', '720p', '480p', '360p'];

  const activeCodecLabel =
    videoAsset?.availableCodecs?.[0] ||
    linkedMediaRecord?.availableCodecs?.[0] ||
    'AV1';

  const compressionRatio =
    videoAsset?.compressionRatio ??
    linkedMediaRecord?.compressionRatio ??
    62;

  const vmafScore =
    videoAsset?.vmafScore ??
    linkedMediaRecord?.vmafScore ??
    96.8;

  const previewFrames =
    videoAsset?.previewFrames ||
    linkedMediaRecord?.previewFrames ||
    (videoAsset?.thumbnailUrl ? [videoAsset.thumbnailUrl] : []);

  useEffect(() => {
    if (selectedResolution === 'auto') {
      const preferred = availableResolutions.includes('1080p')
        ? '1080p'
        : availableResolutions[0] || '720p';
      setActiveStreamResolution(preferred);
    } else {
      setActiveStreamResolution(selectedResolution);
    }
  }, [selectedResolution, availableResolutions]);

  // Close 3-dot menu on outside click
  useEffect(() => {
    if (!showOptionsMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(e.target as Node)) {
        setShowOptionsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showOptionsMenu]);

  // Single-video feed playback authority
  useEffect(() => {
    if (activePlayingVideoId && activePlayingVideoId !== post.id && isPlaying) {
      if (videoRef.current) {
        videoRef.current.pause();
      }
      setIsPlaying(false);
    }
  }, [activePlayingVideoId, post.id, isPlaying]);

  // Log viewport impression & pause when scrolled out of view
  useEffect(() => {
    if (!cardRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasLoggedImpressionRef.current) {
            hasLoggedImpressionRef.current = true;
            trackEngagementEvent({
              eventType: 'post_impression',
              postId: post.id,
              creatorId: post.creatorId,
              category: primaryCategory,
              tags: post.tags,
              surface: feedSurface
            });
          }
          if (!entry.isIntersecting && isPlaying) {
            if (videoRef.current) {
              const watchedSecs = videoRef.current.currentTime;
              if (watchedSecs > 0 && watchedSecs < 3) {
                trackEngagementEvent({
                  eventType: 'video_skipped',
                  postId: post.id,
                  creatorId: post.creatorId,
                  category: primaryCategory,
                  watchDurationSeconds: Math.round(watchedSecs),
                  surface: feedSurface
                });
              }
              videoRef.current.pause();
            }
            setIsPlaying(false);
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isPlaying, post.id, post.creatorId, primaryCategory, post.tags, feedSurface, trackEngagementEvent]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    const totalDur = videoRef.current.duration || duration || 30;
    setCurrentTime(time);

    if (videoAsset) {
      saveVideoPlaybackPosition(videoAsset.id, time);
    }

    // Track 50%+ meaningful watch milestone once per play
    const pctViewed = (time / totalDur) * 100;
    if (pctViewed >= 50 && !hasLoggedWatch50Ref.current) {
      hasLoggedWatch50Ref.current = true;
      trackEngagementEvent({
        eventType: 'video_watched',
        postId: post.id,
        creatorId: post.creatorId,
        category: primaryCategory,
        tags: post.tags,
        watchDurationSeconds: Math.round(time),
        completionPercent: Math.round(pctViewed),
        surface: feedSurface
      });
    }

    // Update buffered range
    if (videoRef.current.buffered.length > 0 && videoRef.current.duration > 0) {
      const bufferedEnd = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      const pct = Math.min(100, Math.max(15, (bufferedEnd / videoRef.current.duration) * 100));
      setBufferedPercent(pct);
    } else if (duration > 0) {
      setBufferedPercent(Math.min(100, ((time + 18) / duration) * 100));
    }

    // If PPV and not purchased, halt at preview limit
    if (isLockedPPV && time >= previewDuration) {
      videoRef.current.pause();
      setIsPlaying(false);
      setPreviewExceeded(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      const rawDur = videoRef.current.duration;
      const validDur =
        Number.isFinite(rawDur) && rawDur > 0
          ? rawDur
          : videoAsset?.durationSeconds || 60;
      setDuration(validDur);
      if (videoAsset) {
        const savedPos = getVideoPlaybackPosition(videoAsset.id);
        if (savedPos > 1 && savedPos < validDur - 2 && (!isLockedPPV || savedPos < previewDuration)) {
          videoRef.current.currentTime = savedPos;
          setCurrentTime(savedPos);
        }
      }
    }
  };

  const handleTogglePlay = () => {
    if (!videoRef.current) return;
    if (previewExceeded && isLockedPPV) return;

    if (!videoRef.current.paused || isPlaying) {
      const watchedSecs = videoRef.current.currentTime;
      if (watchedSecs > 0 && watchedSecs < 3) {
        trackEngagementEvent({
          eventType: 'video_skipped',
          postId: post.id,
          creatorId: post.creatorId,
          category: primaryCategory,
          watchDurationSeconds: Math.round(watchedSecs),
          surface: feedSurface
        });
      }
      videoRef.current.pause();
      setIsPlaying(false);
      setActivePlayingVideoId(null);
    } else {
      const isReplay = videoEnded;
      setVideoEnded(false);
      setActivePlayingVideoId(post.id);
      if (isReplay && videoRef.current) {
        videoRef.current.currentTime = 0;
      }
      videoRef.current.play().then(() => {
        setIsPlaying(true);
        trackEngagementEvent({
          eventType: isReplay ? 'video_replayed' : 'video_started',
          postId: post.id,
          creatorId: post.creatorId,
          category: primaryCategory,
          tags: post.tags,
          surface: feedSurface
        });
      }).catch(() => {
        if (videoRef.current) {
          videoRef.current.muted = true;
          setIsMuted(true);
          videoRef.current.play().then(() => {
            setIsPlaying(true);
          }).catch(err => {
            console.error("Playback error", err);
          });
        }
      });
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    setVideoEnded(true);
    trackEngagementEvent({
      eventType: 'video_completed',
      postId: post.id,
      creatorId: post.creatorId,
      category: primaryCategory,
      tags: post.tags,
      watchDurationSeconds: Math.round(duration || 30),
      completionPercent: 100,
      surface: feedSurface
    });
  };

  const handleSelectResolution = (res: VideoResolution | 'auto') => {
    const savedTime = videoRef.current?.currentTime || currentTime;
    const wasPlaying = isPlaying;
    setSelectedResolution(res);
    setShowQualityMenu(false);

    if (videoAsset?.videoMediaId) {
      getAuthorizedPlaybackUrl(videoAsset.videoMediaId, res);
    }

    requestAnimationFrame(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = savedTime;
        videoRef.current.playbackRate = playbackSpeed;
        if (wasPlaying) {
          videoRef.current.play().catch(() => {});
        }
      }
    });
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const clampedTime = isLockedPPV ? Math.min(newTime, previewDuration) : newTime;
    setCurrentTime(clampedTime);
    if (videoRef.current) {
      videoRef.current.currentTime = clampedTime;
    }
  };

  const handleSeekBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!seekBarRef.current || !duration) return;
    const rect = seekBarRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverSeekPercent(relX * 100);
    setHoverSeekTime(relX * duration);
  };

  const toggleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
  };

  const handleTogglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or blocked
    }
  };

  const handlePlayerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      handleTogglePlay();
    } else if (e.key === 'm' || e.key === 'M') {
      e.preventDefault();
      setIsMuted(prev => !prev);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const target = Math.min(duration, videoRef.current.currentTime + 5);
      videoRef.current.currentTime = isLockedPPV ? Math.min(target, previewDuration) : target;
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    } else if ((e.key === 'f' || e.key === 'F') && onOpenVideoPlayer) {
      e.preventDefault();
      const time = videoRef.current.currentTime;
      videoRef.current.pause();
      setIsPlaying(false);
      onOpenVideoPlayer(post.id, time);
    }
  };

  const handleUnlockPPV = () => {
    setUnlocking(true);
    setUnlockError(null);
    const result = unlockPPVPost(post.id);
    setUnlocking(false);

    if (result.success) {
      setPreviewExceeded(false);
      trackEngagementEvent({
        eventType: 'creator_purchased',
        postId: post.id,
        creatorId: post.creatorId,
        category: primaryCategory,
        surface: feedSurface
      });
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
        setIsPlaying(true);
        setActivePlayingVideoId(post.id);
      }
    } else {
      setUnlockError(result.error || 'Failed to unlock');
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setLocalComments(prev => [...prev, `${currentUser.name}: ${commentText}`]);
    trackEngagementEvent({
      eventType: 'post_commented',
      postId: post.id,
      creatorId: post.creatorId,
      category: primaryCategory,
      tags: post.tags,
      surface: feedSurface
    });
    setCommentText('');
  };

  const handlePersonalizationAction = (
    action: 'not_interested' | 'show_less' | 'show_more' | 'hide_creator'
  ) => {
    setShowOptionsMenu(false);
    submitPostRecommendationFeedback(post.id, action);
    if (action === 'show_more') {
      setFeedbackToast(`Boosted recommendations for ${primaryCategory || post.creatorName}`);
      setTimeout(() => setFeedbackToast(null), 2800);
    } else if (action === 'show_less') {
      setFeedbackToast(`Reduced similar posts in ${primaryCategory || 'this category'}`);
      setTimeout(() => setFeedbackToast(null), 2800);
    }
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <article 
      ref={cardRef}
      className="bg-[#121215] border border-[#26262b] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl mb-5 sm:mb-6 transition-all hover:border-[#383842]"
    >
      {/* Recommendation Reason Banner (Shown in For You / Free Posts or when feedback toast active) */}
      {(recommendationResult || feedbackToast) && (
        <div className="px-3 sm:px-4 py-2 bg-[#16161d] border-b border-[#22222c] flex items-center justify-between gap-2 text-[11px]">
          {feedbackToast ? (
            <div className="flex items-center gap-1.5 text-emerald-300 font-medium truncate">
              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{feedbackToast}</span>
            </div>
          ) : recommendationResult ? (
            <>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <span className="text-neutral-300 font-medium truncate">
                  {recommendationResult.primaryReason}
                </span>
                {recommendationResult.isFreeAccessible && feedSurface === 'free_posts' && (
                  <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 shrink-0">
                    <Unlock className="w-2.5 h-2.5" />
                    <span>Free Access</span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fce7b0]">
                  {Math.round(recommendationResult.totalScore)}% Match
                </span>
              </div>
            </>
          ) : null}
        </div>
      )}
      
      {/* Header: Author Info, Follow & Subscribe Actions (Hidden on Creator Profile to match TikTok & Instagram) */}
      {!hideCreatorHeader ? (
        <div className="p-3 sm:p-5 flex items-center justify-between border-b border-[#1c1c22] gap-2 sm:gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
            <button 
              type="button"
              onClick={() => {
                trackEngagementEvent({
                  eventType: 'creator_profile_opened',
                  postId: post.id,
                  creatorId: post.creatorId,
                  category: primaryCategory,
                  surface: feedSurface
                });
                onNavigateToCreator(post.creatorId);
              }}
              className="cursor-pointer group flex items-center gap-2.5 sm:gap-3 text-left focus:outline-none min-w-0 flex-1"
            >
              <div className="relative shrink-0">
                <img
                  src={post.creatorAvatar}
                  alt={post.creatorName}
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full object-cover border border-[#d4af37]/40 group-hover:border-[#d4af37] transition-colors"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 font-semibold text-neutral-100 group-hover:text-[#fce7b0] transition-colors text-xs sm:text-sm min-w-0">
                  <span className="truncate">{post.creatorName}</span>
                </div>
                
                <div className="flex items-center gap-1 text-[11px] sm:text-xs text-neutral-400 truncate">
                  <span className="truncate">@{post.creatorUsername}</span>
                  <VerifiedBadge creatorId={post.creatorId} size="xs" />
                  <span aria-hidden="true" className="shrink-0">·</span>
                  <span className="shrink-0">{post.createdAt}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Action Buttons: Follow & Subscribe + 3-Dot Personalization Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Follow / Following Button */}
            {!isAuthor && (
              <button
                type="button"
                onClick={() => {
                  const willFollow = !isFollowingCreator;
                  toggleFollowCreator(post.creatorId);
                  trackEngagementEvent({
                    eventType: willFollow ? 'creator_followed' : 'creator_unfollowed',
                    postId: post.id,
                    creatorId: post.creatorId,
                    category: primaryCategory,
                    surface: feedSurface
                  });
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isFollowingCreator
                    ? 'bg-[#1c1c22] text-neutral-300 border border-[#2a2a35] hover:border-neutral-500'
                    : 'bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold shadow-sm'
                }`}
                title={isFollowingCreator ? 'Following this creator' : 'Follow creator'}
              >
                {isFollowingCreator ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    <span className="hidden xs:inline">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5 shrink-0" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}

            {/* Subscribe Button */}
            {!isAuthor && (
              isSubscribed ? (
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-medium text-[#fce7b0] bg-[#d4af37]/15 border border-[#d4af37]/30">
                  <Crown className="w-3 h-3 text-[#d4af37]" />
                  <span>Subscribed</span>
                </span>
              ) : (
                onOpenSubscribeModal && (
                  <button
                    type="button"
                    onClick={() => onOpenSubscribeModal(post.creatorId)}
                    className="px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-amber-500 to-[#d4af37] hover:brightness-110 text-black text-[11px] sm:text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1"
                    title="Subscribe for exclusive creator vault access"
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>Subscribe</span>
                  </button>
                )
              )
            )}

            {showDemoBadges && post.isDemo && (
              <span className="hidden sm:inline-block text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                DEMO
              </span>
            )}

            {/* 3-Dot Personalization & Report Dropdown Menu */}
            <div className="relative" ref={optionsMenuRef}>
              <button
                type="button"
                onClick={() => setShowOptionsMenu(prev => !prev)}
                className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer rounded-lg hover:bg-[#1c1c24]"
                title="Feed Personalization & Post Options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showOptionsMenu && (
                <div className="absolute right-0 top-9 z-40 w-60 max-w-[calc(100vw-2rem)] bg-[#14141a] border border-[#2c2c36] rounded-2xl shadow-2xl p-1.5 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-neutral-400 border-b border-[#23232c]">
                    Feed Personalization
                  </div>

                  <button
                    type="button"
                    onClick={() => handlePersonalizationAction('show_more')}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-neutral-200 hover:bg-[#1f1f29] hover:text-[#fce7b0] transition-colors cursor-pointer"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Show More Like This</div>
                      <div className="text-[10px] text-neutral-400">Boost {primaryCategory || 'this topic'}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonalizationAction('not_interested')}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-neutral-200 hover:bg-[#1f1f29] transition-colors cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Not Interested</div>
                      <div className="text-[10px] text-neutral-400">Remove post &amp; lower topic score</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePersonalizationAction('show_less')}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-neutral-200 hover:bg-[#1f1f29] transition-colors cursor-pointer"
                  >
                    <ThumbsDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <div>
                      <div className="font-semibold">Show Less Like This</div>
                      <div className="text-[10px] text-neutral-400">Reduce {primaryCategory || 'similar posts'}</div>
                    </div>
                  </button>

                  {!isAuthor && (
                    <button
                      type="button"
                      onClick={() => handlePersonalizationAction('hide_creator')}
                      className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-neutral-200 hover:bg-[#1f1f29] transition-colors cursor-pointer"
                    >
                      <UserX className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Hide This Creator</div>
                        <div className="text-[10px] text-neutral-400">Stop recommending @{post.creatorUsername}</div>
                      </div>
                    </button>
                  )}

                  <div className="border-t border-[#23232c] my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                    <div>
                      <div className="font-semibold">Report Content</div>
                      <div className="text-[10px] text-rose-300/80">Flag for Trust &amp; Safety moderation</div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Sleek Minimal Post Meta Header (matches TikTok & Instagram creator video feed - no duplicate profile avatar/username/follow button) */
        <div className="px-3.5 sm:px-5 py-2.5 flex items-center justify-between border-b border-[#1c1c22]/70 text-xs bg-[#0d0d11]/60">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-neutral-400 font-mono">{post.createdAt}</span>
            {post.visibility === 'pay_per_view' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-500/50 text-[10px] font-bold text-amber-300">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>PPV ${post.ppvPrice?.toFixed(2)}</span>
              </span>
            )}
            {post.visibility === 'subscribers' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#d4af37]/25 border border-[#d4af37]/50 text-[10px] font-bold text-[#fce7b0]">
                <Crown className="w-2.5 h-2.5 text-[#d4af37]" />
                <span>Subscribers Only</span>
              </span>
            )}
            {post.isHighlight && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-950/80 border border-rose-500/50 text-[10px] font-bold text-rose-300">
                <Film className="w-2.5 h-2.5 text-rose-400" />
                <span>Highlight Clip</span>
              </span>
            )}
          </div>

          {/* Minimal 3-Dot Options Menu */}
          <div className="relative" ref={optionsMenuRef}>
            <button
              type="button"
              onClick={() => setShowOptionsMenu(prev => !prev)}
              className="p-1.5 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer rounded-lg hover:bg-[#1c1c24]"
              title="Post Options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {showOptionsMenu && (
              <div className="absolute right-0 top-9 z-40 w-56 max-w-[calc(100vw-2rem)] bg-[#14141a] border border-[#2c2c36] rounded-2xl shadow-2xl p-1.5 text-xs space-y-0.5 animate-in fade-in zoom-in-95">
                <button
                  type="button"
                  onClick={() => {
                    setShowOptionsMenu(false);
                    setShowReportModal(true);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center gap-2.5 text-left text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <div>
                    <div className="font-semibold">Report Content</div>
                    <div className="text-[10px] text-rose-300/80">Flag for Trust &amp; Safety moderation</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Post Text Caption */}
      <div className="px-3.5 sm:px-5 pt-3.5 sm:pt-4 pb-3">
        <p data-ugc="true" className="text-neutral-200 text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
          {post.content}
        </p>
        <TranslateContentButton text={post.content} contentType="post" className="mt-2" />
        
        {post.categories && post.categories.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {post.categories.map(cat => (
              <span key={cat} className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-[#1a1a22] text-[#fce7b0] border border-[#2e2e38]">
                {cat}
              </span>
            ))}
          </div>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#d4af37]">
            {post.tags.map(t => (
              <span
                key={t}
                onClick={() => {
                  trackEngagementEvent({
                    eventType: 'hashtag_clicked',
                    postId: post.id,
                    creatorId: post.creatorId,
                    category: primaryCategory,
                    tags: [t],
                    surface: feedSurface
                  });
                }}
                className="cursor-pointer hover:underline"
              >
                #{t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Media Showcase Area */}
      {videoAsset && (
        <div
          tabIndex={0}
          onKeyDown={handlePlayerKeyDown}
          className="relative w-full bg-black aspect-video overflow-hidden group focus:outline-none focus:ring-1 focus:ring-[#d4af37]/50"
        >
          <video
            ref={videoRef}
            src={resolvedVideoSrc}
            poster={videoAsset.thumbnailUrl !== videoAsset.url ? videoAsset.thumbnailUrl : undefined}
            preload="metadata"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={handleVideoEnded}
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.src.includes('/videos/sample1.mp4')) {
                el.src = '/videos/sample1.mp4';
                el.load();
              }
            }}
            muted={isMuted}
            playsInline
            onClick={handleTogglePlay}
            className={`w-full h-full object-cover cursor-pointer transition-filter duration-300 ${
              previewExceeded && isLockedPPV ? 'blur-md brightness-50' : ''
            }`}
          />

          {/* Top Preview Banner while in Free Preview mode */}
          {isLockedPPV && !previewExceeded && (
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between bg-black/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-[#d4af37]/40 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                <span className="font-medium text-[#fce7b0]">Free PPV Preview Active</span>
              </div>
              <div className="font-mono text-white text-[11px] tabular-nums">
                {Math.floor(currentTime)}s / {previewDuration}s limit
              </div>
            </div>
          )}

          {/* Top-Right Adaptive Streaming & Compression Telemetry Badge (when not locked PPV preview) */}
          {(!isLockedPPV || previewExceeded) && !isLockedSubscribers && (
            <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                <Zap className="w-2.5 h-2.5 text-emerald-400" />
                <span>HLS • {activeCodecLabel} • -{compressionRatio}% size</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-md border border-[#d4af37]/30 text-[10px] font-mono text-[#fce7b0]">
                <Cpu className="w-2.5 h-2.5 text-[#d4af37]" />
                <span>VMAF {vmafScore.toFixed(1)}</span>
              </span>
            </div>
          )}

          {/* Centered Big Play Button when paused */}
          {!isPlaying && !previewExceeded && !isLockedSubscribers && !videoEnded && (
            <button
              onClick={handleTogglePlay}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-[#d4af37]/90 hover:bg-[#d4af37] text-black rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer z-10"
              title="Play Video (Space)"
            >
              <Play className="w-6 h-6 fill-black ml-1" />
            </button>
          )}

          {/* Up Next Personalized Video Recommendations Overlay when Video Ends */}
          {videoEnded && !isLockedPPV && !isLockedSubscribers && upNextRecommendations.length > 0 && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-20 p-4 sm:p-6 flex flex-col justify-between animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#fce7b0]">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Recommended Up Next For You</span>
                </div>
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Replay Video</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-auto">
                {upNextRecommendations.map(rec => {
                  const recVid = rec.post.media.find(m => m.type === 'video');
                  return (
                    <div
                      key={rec.post.id}
                      onClick={() => {
                        if (onOpenVideoPlayer) {
                          onOpenVideoPlayer(rec.post.id, 0);
                        }
                      }}
                      className="p-2.5 rounded-2xl bg-[#16161d] hover:bg-[#1e1e28] border border-[#2e2e3a] hover:border-[#d4af37]/50 flex items-center gap-3 cursor-pointer transition-all group/next"
                    >
                      <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-black shrink-0">
                        <img
                          src={recVid?.thumbnailUrl || rec.post.creatorAvatar}
                          alt={rec.post.content}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Play className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white truncate group-hover/next:text-[#fce7b0]">
                          {rec.post.creatorName}
                        </div>
                        <p className="text-[10px] text-neutral-300 line-clamp-1">{rec.post.content}</p>
                        <div className="text-[9px] font-mono text-[#d4af37] mt-0.5 truncate">
                          {rec.primaryReason}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-neutral-400 text-center">
                Selected by Acovon Video Discovery Engine based on your watch completion &amp; category affinity
              </div>
            </div>
          )}

          {/* Quality Selector Popover Menu */}
          {showQualityMenu && !previewExceeded && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-14 right-3 z-30 w-56 bg-[#121216]/95 backdrop-blur-xl border border-[#2e2e38] rounded-2xl p-2.5 shadow-2xl space-y-1.5 text-xs animate-in fade-in zoom-in-95"
            >
              <div className="flex items-center justify-between px-2 py-1 border-b border-[#26262f]">
                <span className="font-bold text-white text-[11px] flex items-center gap-1.5">
                  <Settings className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Adaptive Stream Quality</span>
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {activeCodecLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleSelectResolution('auto')}
                className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                  selectedResolution === 'auto'
                    ? 'bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40 font-semibold'
                    : 'text-neutral-300 hover:bg-white/5'
                }`}
              >
                <div>
                  <div className="text-[11px]">Auto ({activeStreamResolution})</div>
                  <div className="text-[9px] text-neutral-400">Zero-buffering ABR switch</div>
                </div>
                {selectedResolution === 'auto' && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
              </button>

              <div className="max-h-40 overflow-y-auto space-y-0.5 pr-0.5">
                {availableResolutions.map((res) => {
                  const isSel = selectedResolution === res;
                  const variantInfo = linkedMediaRecord?.variants.find(v => v.resolution === res);
                  return (
                    <button
                      key={res}
                      type="button"
                      onClick={() => handleSelectResolution(res)}
                      className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left transition-colors cursor-pointer ${
                        isSel
                          ? 'bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40 font-semibold'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[11px]">{res}</span>
                        {(res === '4K' || res === '1440p' || res === '1080p') && (
                          <span className="text-[9px] px-1 py-0.2 bg-[#d4af37]/15 text-[#d4af37] rounded font-mono">
                            HD
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {variantInfo && (
                          <span className="text-[9px] font-mono text-neutral-400">
                            {(variantInfo.bitrateKbps / 1000).toFixed(1)} Mbps
                          </span>
                        )}
                        {isSel && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* In-Feed Video Controls Bar (Bottom Overlay) */}
          {!previewExceeded && !isLockedSubscribers && (
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-3 flex flex-col gap-2 opacity-95 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
              
              {/* Scrubbable Progress Bar with Buffered Indicator & Hover Thumbnail Preview */}
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] font-mono text-neutral-300 tabular-nums">
                  {formatTime(currentTime)}
                </span>

                <div
                  ref={seekBarRef}
                  onMouseMove={handleSeekBarMouseMove}
                  onMouseLeave={() => setHoverSeekTime(null)}
                  className="relative flex-1 h-4 flex items-center cursor-pointer"
                >
                  {/* Hover Frame Preview Tooltip */}
                  {hoverSeekTime !== null && previewFrames.length > 0 && (
                    <div
                      style={{ left: `${Math.min(88, Math.max(12, hoverSeekPercent))}%` }}
                      className="absolute bottom-6 -translate-x-1/2 bg-[#121216] border border-[#d4af37]/40 rounded-lg overflow-hidden shadow-xl pointer-events-none z-30 w-24"
                    >
                      <div className="aspect-video w-full bg-black relative">
                        <img
                          src={previewFrames[Math.floor((hoverSeekPercent / 100) * previewFrames.length)] || previewFrames[0]}
                          alt="Frame preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center py-0.5 text-[9px] font-mono font-bold text-[#fce7b0] bg-black/90">
                        {formatTime(hoverSeekTime)}
                      </div>
                    </div>
                  )}

                  {/* Track Background */}
                  <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                    {/* Buffered Range */}
                    <div
                      className="absolute inset-y-0 left-0 bg-white/35 transition-all duration-300"
                      style={{ width: `${bufferedPercent}%` }}
                    />
                    {/* Played Range */}
                    <div
                      className="absolute inset-y-0 left-0 bg-[#d4af37]"
                      style={{ width: `${duration ? Math.min(100, (currentTime / duration) * 100) : 0}%` }}
                    />
                  </div>

                  {/* Native Range Input overlay for accessible dragging */}
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>

                <span className="text-[10px] font-mono text-neutral-300 tabular-nums">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Bottom Buttons Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTogglePlay}
                    className="p-1.5 text-white hover:text-[#d4af37] transition-colors cursor-pointer"
                    title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 text-white hover:text-[#d4af37] transition-colors cursor-pointer"
                    title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-[#d4af37]" />}
                  </button>

                  <button
                    onClick={toggleSpeed}
                    className="px-2 py-0.5 rounded bg-black/60 text-[10px] font-mono font-bold text-[#fce7b0] border border-white/10 hover:border-white/30 cursor-pointer"
                    title="Playback Speed"
                  >
                    {playbackSpeed}x
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {/* Quality Selector Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu(prev => !prev);
                    }}
                    className="px-2 py-0.5 bg-black/70 hover:bg-black text-[10px] font-mono font-bold text-[#fce7b0] rounded border border-[#d4af37]/30 flex items-center gap-1 cursor-pointer transition-colors"
                    title="Select Adaptive Streaming Resolution"
                  >
                    <Settings className="w-3 h-3 text-[#d4af37]" />
                    <span>{selectedResolution === 'auto' ? `Auto (${activeStreamResolution})` : selectedResolution}</span>
                  </button>

                  {/* Picture in Picture */}
                  <button
                    type="button"
                    onClick={handleTogglePiP}
                    className="p-1.5 bg-black/60 hover:bg-black text-neutral-300 hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer"
                    title="Picture-in-Picture"
                  >
                    <PictureInPicture2 className="w-3.5 h-3.5" />
                  </button>

                  {onOpenVideoPlayer && (
                    <button
                      onClick={() => {
                        const time = videoRef.current?.currentTime || 0;
                        if (videoRef.current) {
                          videoRef.current.pause();
                          setIsPlaying(false);
                        }
                        onOpenVideoPlayer(post.id, time);
                      }}
                      className="p-1.5 bg-black/60 hover:bg-black text-[#d4af37] hover:text-white rounded-lg border border-white/10 transition-colors cursor-pointer flex items-center gap-1 text-xs"
                      title="Open Full Screen Player (F)"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px] font-medium">Full Screen</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* Locked PPV Overlay when preview finishes */}
          {previewExceeded && isLockedPPV && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-0.5">
                  Free {previewDuration}-Second Preview Complete
                </h3>
                <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                  Unlock the complete video vault release (${post.ppvPrice?.toFixed(2)}). Permanent lifetime access saved to your account.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                <button
                  onClick={handleUnlockPPV}
                  disabled={unlocking}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#d4af37] via-[#f1d07c] to-[#d4af37] text-black font-extrabold text-xs rounded-xl transition-all shadow-lg shadow-[#d4af37]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{unlocking ? 'Authorizing Purchase...' : `Unlock for $${post.ppvPrice?.toFixed(2) || '9.99'}`}</span>
                </button>
              </div>

              {unlockError && (
                <div className="text-xs text-red-400 font-medium">
                  {unlockError}
                </div>
              )}
            </div>
          )}

          {/* Locked Subscriber-Only Overlay */}
          {isLockedSubscribers && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-0.5">
                  Subscriber-Only Video
                </h3>
                <p className="text-xs text-neutral-300 max-w-sm mx-auto">
                  Subscribe to {post.creatorName} to unlock this video and their entire private content library.
                </p>
              </div>
              {onOpenSubscribeModal && (
                <button
                  onClick={() => onOpenSubscribeModal(post.creatorId)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-[#d4af37] text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Join Membership</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Photo Showcase Area */}
      {!videoAsset && imageAssets.length > 0 && (
        <div 
          onClick={() => {
            trackEngagementEvent({
              eventType: imageAssets.length > 1 ? 'gallery_swiped' : 'photo_opened',
              postId: post.id,
              creatorId: post.creatorId,
              category: primaryCategory,
              tags: post.tags,
              surface: feedSurface
            });
            if (onOpenPhotoViewer) {
              onOpenPhotoViewer(post.id, 0);
            }
          }}
          className="relative w-full bg-black aspect-video overflow-hidden group cursor-pointer"
          title="Click to view full screen photo with zoom"
        >
          <img
            src={imageAssets[0].url}
            alt={post.content}
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
            <Maximize2 className="w-6 h-6 text-[#d4af37]" />
            <span className="text-xs font-semibold">View Full Screen (Zoom)</span>
          </div>

          {imageAssets.length > 1 && (
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10 text-[10px] font-mono text-white">
              +{imageAssets.length - 1} photos
            </div>
          )}
        </div>
      )}

      {/* Action Bar: Like, Comments, Save, Tip, Share */}
      <div className="p-4 sm:p-5 border-t border-[#1c1c22] flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Like Button */}
          <button
            onClick={() => {
              const willLike = !post.isLiked;
              toggleLikePost(post.id);
              trackEngagementEvent({
                eventType: willLike ? 'post_liked' : 'post_unliked',
                postId: post.id,
                creatorId: post.creatorId,
                category: primaryCategory,
                tags: post.tags,
                surface: feedSurface
              });
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              post.isLiked ? 'text-red-500' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-red-500' : ''}`} />
            <span>{post.likesCount}</span>
          </button>

          {/* Comment Drawer Toggle */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount + localComments.length - 2}</span>
          </button>

          {/* Save / Bookmark Button */}
          <button
            onClick={() => {
              const willSave = !isSaved;
              toggleSavePost(post.id);
              if (willSave) {
                trackEngagementEvent({
                  eventType: 'post_saved',
                  postId: post.id,
                  creatorId: post.creatorId,
                  category: primaryCategory,
                  tags: post.tags,
                  surface: feedSurface
                });
              }
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              isSaved ? 'text-[#d4af37]' : 'text-neutral-400 hover:text-white'
            }`}
            title={isSaved ? 'Saved in library' : 'Save post'}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#d4af37]' : ''}`} />
            <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Direct Tip */}
          <button
            onClick={() => onOpenTipModal(post.creatorId, post.creatorName)}
            className="px-3 py-1.5 bg-[#18181f] hover:bg-[#22222a] border border-[#d4af37]/30 text-[#fce7b0] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Tip</span>
          </button>

          {/* Share Button */}
          {onOpenShareModal && (
            <button
              onClick={() => {
                trackEngagementEvent({
                  eventType: 'post_shared',
                  postId: post.id,
                  creatorId: post.creatorId,
                  category: primaryCategory,
                  tags: post.tags,
                  surface: feedSurface
                });
                onOpenShareModal(post);
              }}
              className="p-1.5 bg-[#18181f] hover:bg-[#22222a] border border-[#27272a] hover:border-[#d4af37]/40 text-neutral-300 hover:text-white rounded-xl transition-colors cursor-pointer flex items-center gap-1 px-3"
              title="Share or Forward Post"
            >
              <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
              <span className="text-xs font-semibold">Share</span>
            </button>
          )}
        </div>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="p-4 sm:p-5 bg-[#16161b] border-t border-[#1c1c22] space-y-3 animate-in fade-in">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {/* Official Creator Pinned Reply */}
            <div className="p-2.5 bg-[#121215] rounded-xl text-xs text-neutral-200 border border-[#27272a] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-white">
                <span>{post.creatorName}</span>
                <span className="text-[10px] text-neutral-400 font-normal inline-flex items-center gap-1">
                  <span>@{post.creatorUsername}</span>
                  <VerifiedBadge creatorId={post.creatorId} size="xs" />
                  <span>· Creator</span>
                </span>
              </div>
              <p data-ugc="true" className="text-neutral-300">Thank you everyone for tuning into this release! Drop your questions below.</p>
              <TranslateContentButton
                text="Thank you everyone for tuning into this release! Drop your questions below."
                contentType="comment"
                compact
              />
            </div>
            {localComments.map((comment, i) => (
              <div key={i} className="p-2.5 bg-[#121215] rounded-xl text-xs text-neutral-200 border border-[#222228] space-y-1">
                <div data-ugc="true">{comment}</div>
                <TranslateContentButton text={comment} contentType="comment" compact />
              </div>
            ))}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 bg-[#121215] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl cursor-pointer hover:bg-[#e5c07b] transition-colors"
            >
              Post
            </button>
          </form>
        </div>
      )}

      {/* Report Modal — Routes directly into the existing Moderation Queue */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-400" />
                Report Content
              </span>
              <button onClick={() => setShowReportModal(false)} className="text-neutral-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              Flag this post for review by the Trust &amp; Safety compliance team and remove it from your personalized recommendations.
            </p>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Copyright Infringement">Copyright Infringement</option>
              <option value="Community Policy Violation">Community Policy Violation</option>
              <option value="Spam or Misleading Content">Spam or Misleading Content</option>
              <option value="Inappropriate or Harmful Media">Inappropriate or Harmful Media</option>
            </select>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1.5 text-xs text-neutral-400 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setReportSubmittedToast(true);
                  setTimeout(() => {
                    submitPostRecommendationFeedback(post.id, 'report_content', reportReason);
                    setReportSubmittedToast(false);
                    setShowReportModal(false);
                  }, 700);
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl cursor-pointer"
              >
                {reportSubmittedToast ? 'Sent to Moderation Queue ✓' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

    </article>
  );
};

