import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, VideoResolution } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  Coins, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  ChevronUp, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Ticket, 
  Users, 
  Send,
  FastForward,
  UserCheck,
  UserPlus,
  Settings,
  Zap,
  Check
} from 'lucide-react';

interface FullScreenVideoModalProps {
  initialPostId: string;
  initialTime?: number;
  onClose: () => void;
  onNavigateToCreator: (creatorId: string) => void;
  onOpenSubscribeModal: (creatorId: string) => void;
  onOpenShareModal: (post: Post) => void;
  onOpenTipModal: (creatorId: string, creatorName: string) => void;
}

export const FullScreenVideoModal: React.FC<FullScreenVideoModalProps> = ({
  initialPostId,
  initialTime = 0,
  onClose,
  onNavigateToCreator,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenTipModal
}) => {
  const { 
    posts, 
    currentUser, 
    toggleLikePost, 
    isFollowing, 
    toggleFollowCreator, 
    isPostSaved, 
    toggleSavePost, 
    isPostPurchased, 
    isSubscribedTo, 
    unlockPPVPost,
    getAuthorizedPlaybackUrl,
    trackEngagementEvent,
    getUpNextVideoRecommendations
  } = useApp();

  // Filter video posts
  const videoPosts = posts.filter(p => p.media && p.media.some(m => m.type === 'video'));
  const initialIndex = videoPosts.findIndex(p => p.id === initialPostId);
  const [currentIndex, setCurrentIndex] = useState(initialIndex >= 0 ? initialIndex : 0);

  const currentPost = videoPosts[currentIndex] || posts[0];
  const currentVideoAsset = currentPost?.media?.find(m => m.type === 'video');
  const upNextRecommendations = currentPost ? getUpNextVideoRecommendations(currentPost.id, 3) : [];

  // Video State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution | 'auto'>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showUpNextDrawer, setShowUpNextDrawer] = useState(false);
  const [unlockErrorText, setUnlockErrorText] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showCommentsDrawer, setShowCommentsDrawer] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [localComments, setLocalComments] = useState<string[]>([
    'Flawless production quality! 🔥',
    'Best video on the platform today.'
  ]);
  const [previewExceeded, setPreviewExceeded] = useState(false);

  const availableResolutions: VideoResolution[] =
    currentVideoAsset?.availableResolutions || ['1080p', '720p', '480p', '360p'];
  const activeCodec = currentVideoAsset?.availableCodecs?.[0] || 'AV1';
  const compressionRatio = currentVideoAsset?.compressionRatio ?? 62;

  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartYRef = useRef<number>(0);

  const isAuthor = currentUser.id === currentPost?.creatorId;
  const isPurchased = isPostPurchased(currentPost?.id);
  const isSubscribed = isSubscribedTo(currentPost?.creatorId);
  const isFollowingCreator = isFollowing(currentPost?.creatorId);
  const isSaved = isPostSaved(currentPost?.id);

  const isLockedPPV = currentPost?.visibility === 'pay_per_view' && !isAuthor && !isPurchased;
  const isLockedSubscribers = currentPost?.visibility === 'subscribers' && !isAuthor && !isSubscribed;
  const previewDuration = currentPost?.ppvPreviewDuration || 15;

  // Auto-hide controls after inactivity
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3200);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  // Lock background body scroll while full screen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Update video playback when changing index & log video_started
  useEffect(() => {
    setCurrentTime(0);
    setPreviewExceeded(false);
    setIsPlaying(true);
    if (currentPost) {
      trackEngagementEvent({
        eventType: 'video_started',
        postId: currentPost.id,
        creatorId: currentPost.creatorId,
        category: currentPost.categories?.[0],
        tags: currentPost.tags,
        surface: 'video_player'
      });
    }
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.play().catch(e => console.log('Autoplay prevented', e));
    }
  }, [currentIndex, playbackSpeed]);

  const handleNextVideo = useCallback(() => {
    if (videoRef.current && videoRef.current.currentTime < 3 && currentPost) {
      trackEngagementEvent({
        eventType: 'video_skipped',
        postId: currentPost.id,
        creatorId: currentPost.creatorId,
        category: currentPost.categories?.[0],
        watchDurationSeconds: Math.round(videoRef.current.currentTime),
        surface: 'video_player'
      });
    }
    if (currentIndex < videoPosts.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  }, [currentIndex, videoPosts.length, currentPost, trackEngagementEvent]);

  const handlePrevVideo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrevVideo();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNextVideo();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNextVideo, handlePrevVideo, onClose]);

  // Touch Swipe Handlers for Up/Down Navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndY = e.changedTouches[0].clientY;
    const deltaY = touchStartYRef.current - touchEndY;
    // Swipe threshold
    if (deltaY > 60) {
      handleNextVideo();
    } else if (deltaY < -60) {
      handlePrevVideo();
    }
  };

  const togglePlayPause = () => {
    if (!videoRef.current) return;
    if (previewExceeded && isLockedPPV) return;

    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
    }
    resetControlsTimer();
  };

  // Double-tap to Like
  const handleTapVideo = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeDiff < 300) {
      // Double tap!
      if (!currentPost.isLiked) {
        toggleLikePost(currentPost.id);
      }
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    } else {
      togglePlayPause();
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

    // Halt PPV preview if locked
    if (isLockedPPV && time >= previewDuration) {
      videoRef.current.pause();
      setIsPlaying(false);
      setPreviewExceeded(true);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  const toggleSpeed = () => {
    const speeds = [0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    resetControlsTimer();
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setLocalComments(prev => [...prev, `${currentUser.name}: ${newComment}`]);
    setNewComment('');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={resetControlsTimer}
    >
      {/* Background Ambient Blur */}
      {currentVideoAsset && (
        <div 
          className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-110 pointer-events-none"
          style={{ backgroundImage: `url(${currentVideoAsset.thumbnailUrl || currentVideoAsset.url})` }}
        />
      )}

      {/* Main Video Container: Mobile-first 9:16 or natural fit */}
      <div className="relative w-full h-[100dvh] max-w-lg mx-auto flex items-center justify-center bg-black overflow-hidden shadow-2xl">
        
        {/* HTML5 Video Element */}
        {currentVideoAsset && (
          <video
            ref={videoRef}
            src={currentVideoAsset.url}
            poster={currentVideoAsset.thumbnailUrl}
            playsInline
            muted={isMuted}
            loop={!isLockedPPV}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onClick={handleTapVideo}
            className="w-full h-full object-contain cursor-pointer"
          />
        )}

        {/* Double-Tap Popping Heart Animation */}
        {showHeartBurst && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <Heart className="w-24 h-24 text-red-500 fill-red-500 animate-in zoom-in-50 fade-out duration-700 drop-shadow-2xl" />
          </div>
        )}

        {/* PPV Vault Locked Overlay */}
        {previewExceeded && isLockedPPV && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-25 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Free {previewDuration}s Preview Finished
              </span>
              <h3 className="text-xl font-bold font-brand text-white">Unlock Full Pay-To-View Video</h3>
              <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                Directly support {currentPost.creatorName}. One-time purchase unlocks permanent lifetime access in your vault.
              </p>
            </div>
            <button
              onClick={() => {
                setUnlockErrorText(null);
                const res = unlockPPVPost(currentPost.id);
                if (res.success) {
                  setPreviewExceeded(false);
                  if (videoRef.current) {
                    videoRef.current.currentTime = 0;
                    videoRef.current.play();
                    setIsPlaying(true);
                  }
                } else {
                  setUnlockErrorText(res.error || 'Insufficient balance to unlock');
                }
              }}
              className="px-6 py-3 bg-gradient-to-r from-[#d4af37] via-[#f1d07c] to-[#d4af37] text-black font-extrabold text-sm rounded-2xl shadow-xl shadow-[#d4af37]/25 hover:brightness-110 cursor-pointer"
            >
              Unlock Now · ${currentPost.ppvPrice?.toFixed(2) || '9.99'}
            </button>
            {unlockErrorText && (
              <p className="text-xs text-red-400 font-medium">{unlockErrorText}</p>
            )}
          </div>
        )}

        {/* Top Header Bar */}
        <div className={`absolute top-0 left-0 right-0 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 sm:px-4 pb-3 flex items-center justify-between gap-2 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Back / Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer shadow-lg shrink-0"
            title="Close Full Screen"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Video Count & Adaptive Codec Indicator */}
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="px-2.5 sm:px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[11px] sm:text-xs font-mono font-medium text-neutral-300 whitespace-nowrap">
              {currentIndex + 1} / {videoPosts.length}
            </div>
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-full border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>HLS • {activeCodec} • -{compressionRatio}%</span>
            </div>
          </div>

          {/* Quick Quality, Speed & Volume */}
          <div className="flex items-center gap-1.5 sm:gap-2 relative shrink-0">
            <button
              type="button"
              onClick={() => setShowQualityMenu(prev => !prev)}
              className="px-2 sm:px-2.5 py-1 bg-black/60 backdrop-blur-md hover:bg-black/90 border border-[#d4af37]/30 rounded-full text-[11px] sm:text-xs font-mono font-bold text-[#fce7b0] transition-colors cursor-pointer flex items-center gap-1"
              title="Adaptive Stream Resolution"
            >
              <Settings className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{selectedResolution === 'auto' ? 'Auto' : selectedResolution}</span>
            </button>

            {showQualityMenu && (
              <div className="absolute top-11 right-0 w-44 bg-[#121216]/95 backdrop-blur-xl border border-[#2e2e38] rounded-2xl p-2 shadow-2xl space-y-1 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedResolution('auto');
                    setShowQualityMenu(false);
                  }}
                  className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left cursor-pointer ${
                    selectedResolution === 'auto' ? 'bg-[#d4af37]/20 text-[#fce7b0] font-bold' : 'text-neutral-300 hover:bg-white/5'
                  }`}
                >
                  <span>Auto (ABR)</span>
                  {selectedResolution === 'auto' && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                </button>
                {availableResolutions.map(res => (
                  <button
                    key={res}
                    type="button"
                    onClick={() => {
                      const t = videoRef.current?.currentTime || 0;
                      setSelectedResolution(res);
                      setShowQualityMenu(false);
                      if (currentVideoAsset?.videoMediaId) {
                        getAuthorizedPlaybackUrl(currentVideoAsset.videoMediaId, res);
                      }
                      requestAnimationFrame(() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = t;
                          if (isPlaying) videoRef.current.play().catch(() => {});
                        }
                      });
                    }}
                    className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left font-mono cursor-pointer ${
                      selectedResolution === res ? 'bg-[#d4af37]/20 text-[#fce7b0] font-bold' : 'text-neutral-300 hover:bg-white/5'
                    }`}
                  >
                    <span>{res}</span>
                    {selectedResolution === res && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={toggleSpeed}
              className="px-2 sm:px-2.5 py-1 bg-black/60 backdrop-blur-md hover:bg-black/90 border border-white/10 rounded-full text-[11px] sm:text-xs font-mono font-bold text-[#fce7b0] transition-colors cursor-pointer"
              title="Change Speed"
            >
              {playbackSpeed}x
            </button>
            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/90 text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer shadow-lg"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4af37]" />}
            </button>
          </div>
        </div>

        {/* Floating Vertical Video Switchers (Accessible on Mobile & Desktop when controls visible) */}
        <div className={`flex flex-col gap-2 absolute left-3 sm:left-auto sm:right-4 top-1/2 -translate-y-1/2 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <button
            type="button"
            onClick={handlePrevVideo}
            disabled={currentIndex === 0}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Previous Video (Swipe Down / Arrow Up)"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNextVideo}
            disabled={currentIndex === videoPosts.length - 1}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
            title="Next Video (Swipe Up / Arrow Down)"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Left Creator Info Bar */}
        <div className={`absolute bottom-14 left-0 right-16 p-3.5 sm:p-4 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Creator Profile Row */}
          <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
            <button
              onClick={() => {
                onClose();
                onNavigateToCreator(currentPost.creatorId);
              }}
              className="flex items-center gap-2 group text-left cursor-pointer"
            >
              <img
                src={currentPost.creatorAvatar}
                alt={currentPost.creatorName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#d4af37] shadow-lg group-hover:scale-105 transition-transform"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white group-hover:text-[#fce7b0] truncate">
                    {currentPost.creatorName}
                  </span>
                  <VerifiedBadge creatorId={currentPost.creatorId} size="sm" />
                </div>
                <span className="text-[11px] text-neutral-400">@{currentPost.creatorUsername}</span>
              </div>
            </button>

            {/* Follow / Following Button */}
            {!isAuthor && (
              <button
                onClick={() => toggleFollowCreator(currentPost.creatorId)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isFollowingCreator
                    ? 'bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 border border-neutral-600'
                    : 'bg-[#d4af37] hover:bg-[#e5c07b] text-black shadow-md'
                }`}
              >
                {isFollowingCreator ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{isFollowingCreator ? 'Following' : 'Follow'}</span>
              </button>
            )}

            {/* Subscribe Button */}
            {!isAuthor && !isSubscribed && (
              <button
                onClick={() => onOpenSubscribeModal(currentPost.creatorId)}
                className="px-3 py-1 bg-gradient-to-r from-amber-500 to-[#d4af37] hover:brightness-110 text-black text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Subscribe</span>
              </button>
            )}
          </div>

          {/* Caption & Categories */}
          <div className="space-y-1.5 text-xs text-neutral-200 drop-shadow-md">
            <p className="line-clamp-2 leading-relaxed">
              {currentPost.content}
            </p>
            {currentPost.categories && currentPost.categories.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentPost.categories.map(cat => (
                  <span key={cat} className="px-2 py-0.5 rounded-md bg-black/50 border border-white/10 text-[10px] text-[#fce7b0]">
                    #{cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right-Side Action Rail */}
        <div className={`absolute bottom-16 right-3 flex flex-col items-center gap-4 z-20 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          {/* Like Button */}
          <button
            onClick={() => toggleLikePost(currentPost.id)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Like Video"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              currentPost.isLiked 
                ? 'bg-red-600/30 text-red-500 border border-red-500/50 scale-110' 
                : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
            }`}>
              <Heart className={`w-6 h-6 ${currentPost.isLiked ? 'fill-red-500' : ''}`} />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {currentPost.likesCount}
            </span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setShowCommentsDrawer(!showCommentsDrawer)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="View Comments"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-transform">
              <MessageCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-bold text-white drop-shadow">
              {currentPost.commentsCount + localComments.length - 2}
            </span>
          </button>

          {/* Bookmark / Save Button */}
          <button
            onClick={() => toggleSavePost(currentPost.id)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title={isSaved ? 'Remove from Saved' : 'Save Video'}
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              isSaved 
                ? 'bg-[#d4af37]/30 text-[#d4af37] border border-[#d4af37]/50 scale-110' 
                : 'bg-black/60 text-white hover:bg-black/80 border border-white/10'
            }`}>
              <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-[#d4af37]' : ''}`} />
            </div>
            <span className="text-[10px] text-neutral-300 drop-shadow">
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>

          {/* Direct Tip Button */}
          <button
            onClick={() => onOpenTipModal(currentPost.creatorId, currentPost.creatorName)}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Send Tip"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-[#d4af37] flex items-center justify-center border border-[#d4af37]/30 transition-transform">
              <Coins className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-neutral-300 drop-shadow">
              Tip
            </span>
          </button>

          {/* Share Button */}
          <button
            onClick={() => {
              trackEngagementEvent({
                eventType: 'post_shared',
                postId: currentPost.id,
                creatorId: currentPost.creatorId,
                category: currentPost.categories?.[0],
                surface: 'video_player'
              });
              onOpenShareModal(currentPost);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Share Video"
          >
            <div className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center border border-white/10 transition-transform">
              <Share2 className="w-6 h-6" />
            </div>
            <span className="text-[10px] text-neutral-300 drop-shadow">
              Share
            </span>
          </button>

          {/* Up Next Recommendations Button */}
          <button
            onClick={() => {
              setShowCommentsDrawer(false);
              setShowUpNextDrawer(prev => !prev);
            }}
            className="flex flex-col items-center gap-1 group cursor-pointer"
            title="Recommended Up Next For You"
          >
            <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${
              showUpNextDrawer
                ? 'bg-[#d4af37] text-black border border-[#d4af37]'
                : 'bg-black/60 text-[#d4af37] hover:bg-black/80 border border-[#d4af37]/30'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-[#fce7b0] font-semibold drop-shadow">
              Up Next
            </span>
          </button>
        </div>

        {/* Bottom Playback Progress Bar */}
        <div className={`absolute bottom-0 left-0 right-0 p-3 z-30 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 accent-[#d4af37] h-1 bg-neutral-700 rounded-lg cursor-pointer"
            />
            <span className="text-[10px] font-mono text-neutral-400 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* In-Video Slide-Up Up Next Recommendations Drawer */}
        {showUpNextDrawer && (
          <div className="absolute inset-x-0 bottom-0 max-h-[65%] bg-[#121215]/95 backdrop-blur-xl border-t border-[#27272a] rounded-t-3xl p-4 flex flex-col z-40 animate-in slide-in-from-bottom duration-300 shadow-2xl space-y-3">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#26262b]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>Recommended Up Next For You ({upNextRecommendations.length})</span>
              </span>
              <button
                onClick={() => setShowUpNextDrawer(false)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1">
              {upNextRecommendations.map(rec => {
                const vidMedia = rec.post.media.find(m => m.type === 'video');
                const targetIdx = videoPosts.findIndex(vp => vp.id === rec.post.id);
                return (
                  <div
                    key={rec.post.id}
                    onClick={() => {
                      if (targetIdx >= 0) {
                        setCurrentIndex(targetIdx);
                        setShowUpNextDrawer(false);
                      }
                    }}
                    className="p-2.5 rounded-2xl bg-[#18181f] hover:bg-[#20202a] border border-[#2a2a35] hover:border-[#d4af37]/50 flex items-center gap-3 cursor-pointer transition-all"
                  >
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-black shrink-0">
                      <img
                        src={vidMedia?.thumbnailUrl || rec.post.creatorAvatar}
                        alt={rec.post.content}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">{rec.post.creatorName}</span>
                        <span className="text-[10px] font-mono text-[#fce7b0] shrink-0">
                          {Math.round(rec.totalScore)}% Match
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 line-clamp-1">{rec.post.content}</p>
                      <div className="text-[10px] text-[#d4af37] truncate mt-0.5">{rec.primaryReason}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* In-Video Slide-Up Comments Drawer */}
        {showCommentsDrawer && (
          <div className="absolute inset-x-0 bottom-0 max-h-[60%] bg-[#121215]/95 backdrop-blur-xl border-t border-[#27272a] rounded-t-3xl p-4 flex flex-col z-40 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#26262b]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-[#d4af37]" />
                Comments ({localComments.length})
              </span>
              <button 
                onClick={() => setShowCommentsDrawer(false)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1">
              {localComments.map((comment, i) => (
                <div key={i} className="p-2.5 bg-[#18181c] rounded-xl text-xs text-neutral-200 border border-[#27272a]">
                  {comment}
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="pt-2 border-t border-[#26262b] flex gap-2">
              <input
                type="text"
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#d4af37] text-black font-bold text-xs rounded-xl cursor-pointer"
              >
                Post
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};
