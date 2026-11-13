import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, VideoResolution } from '../../types';
import { TranslateContentButton } from '../common/TranslateContentButton';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Lock,
  Settings,
  Check,
  Minimize2,
  Crown,
  UserPlus
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
  onOpenSubscribeModal
}) => {
  const {
    posts,
    currentUser,
    isAuthenticated,
    isPostPurchased,
    isSubscribedTo,
    isFollowing,
    toggleFollowCreator,
    unlockPPVPost,
    getAuthorizedPlaybackUrl,
    trackEngagementEvent
  } = useApp();

  const currentPost = posts.find(p => p.id === initialPostId) || posts.find(p => p.media?.some(m => m.type === 'video')) || posts[0];
  const currentVideoAsset = currentPost?.media?.find(m => m.type === 'video');

  const isPlayableStreamUrl = (u?: string): u is string => {
    if (!u || typeof u !== 'string') return false;
    const trimmed = u.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (
      lower.includes('cdn.acovon.media') ||
      lower.endsWith('.m3u8') ||
      lower.startsWith('blob:') ||
      lower.startsWith('s3://')
    ) {
      return false;
    }
    return true;
  };

  const videoCandidateSources: string[] = [];
  if (isPlayableStreamUrl(currentVideoAsset?.url)) {
    videoCandidateSources.push(currentVideoAsset.url.trim());
  }
  if (
    isPlayableStreamUrl(currentVideoAsset?.previewUrl) &&
    !videoCandidateSources.includes(currentVideoAsset.previewUrl.trim())
  ) {
    videoCandidateSources.push(currentVideoAsset.previewUrl.trim());
  }

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [selectedResolution, setSelectedResolution] = useState<VideoResolution | 'auto'>('auto');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [unlockErrorText, setUnlockErrorText] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [previewExceeded, setPreviewExceeded] = useState(false);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [retryNonce, setRetryNonce] = useState(0);

  const baseVideoSrc = videoCandidateSources[sourceIndex] || '';
  const resolvedVideoSrc = baseVideoSrc
    ? retryNonce > 0
      ? `${baseVideoSrc}${baseVideoSrc.includes('?') ? '&' : '?'}_vretry=${retryNonce}`
      : baseVideoSrc
    : '';

  const availableResolutions: VideoResolution[] =
    currentVideoAsset?.availableResolutions || ['1080p', '720p', '480p', '360p'];

  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasAutoRetriedRef = useRef(false);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthor = isAuthenticated && currentUser.id === currentPost?.creatorId;
  const isPurchased = isPostPurchased(currentPost?.id);
  const isSubscribed = isSubscribedTo(currentPost?.creatorId);
  const isFollowingCreator = isFollowing(currentPost?.creatorId);

  const isLockedPPV = currentPost?.visibility === 'pay_per_view' && !isAuthor && !isPurchased;
  const isLockedSubscribers = currentPost?.visibility === 'subscribers' && !isAuthor && !isSubscribed;
  const isLockedFollowers = currentPost?.visibility === 'followers' && !isAuthor && !isFollowingCreator && !isSubscribed;
  const isMediaLocked = isLockedSubscribers || isLockedFollowers;
  const previewDuration = currentPost?.ppvPreviewDuration || 15;

  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
      setShowQualityMenu(false);
    }, 3000);
  }, []);

  useEffect(() => {
    resetControlsTimer();
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [resetControlsTimer]);

  // Lock background scroll while full screen
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  useEffect(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    hasAutoRetriedRef.current = false;
    setSourceIndex(0);
    setRetryNonce(0);
    setVideoLoadError(false);
    return () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [initialPostId, currentVideoAsset?.url, currentVideoAsset?.previewUrl]);

  // Start playback on open (only when media is accessible)
  useEffect(() => {
    if (isMediaLocked) {
      setIsPlaying(false);
      return;
    }
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
      if (initialTime > 0) {
        videoRef.current.currentTime = initialTime;
      }
      videoRef.current.playbackRate = playbackSpeed;
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1;
      }
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current
              .play()
              .then(() => {
                setIsPlaying(true);
                const unmuteOnGesture = () => {
                  if (videoRef.current) {
                    videoRef.current.muted = false;
                    videoRef.current.volume = 1;
                  }
                  setIsMuted(false);
                };
                window.addEventListener('pointerdown', unmuteOnGesture, { once: true });
                window.addEventListener('keydown', unmuteOnGesture, { once: true });
              })
              .catch(() => setIsPlaying(false));
          }
        });
    }
  }, [initialPostId, isMediaLocked]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1;
      }
    }
  }, [isMuted]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current || isMediaLocked) return;
    if (previewExceeded && isLockedPPV) return;

    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.muted = isMuted;
      if (!isMuted) {
        videoRef.current.volume = 1;
      }
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch(console.error);
          }
        });
    }
    resetControlsTimer();
  }, [previewExceeded, isLockedPPV, isMediaLocked, isMuted, resetControlsTimer]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsMuted(prev => !prev);
      } else if (e.key === 'ArrowRight' && videoRef.current) {
        e.preventDefault();
        const target = Math.min(duration, videoRef.current.currentTime + 5);
        videoRef.current.currentTime = isLockedPPV ? Math.min(target, previewDuration) : target;
      } else if (e.key === 'ArrowLeft' && videoRef.current) {
        e.preventDefault();
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration, isLockedPPV, onClose, previewDuration, togglePlayPause]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);

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
          : currentVideoAsset?.durationSeconds || 60;
      setDuration(validDur);
      if (initialTime > 0 && initialTime < validDur) {
        videoRef.current.currentTime = initialTime;
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const clampedTime = isLockedPPV ? Math.min(newTime, previewDuration) : newTime;
    setCurrentTime(clampedTime);
    if (videoRef.current) {
      videoRef.current.currentTime = clampedTime;
    }
    resetControlsTimer();
  };

  const toggleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    if (videoRef.current) {
      videoRef.current.playbackRate = nextSpeed;
    }
    resetControlsTimer();
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none overflow-hidden"
      onMouseMove={resetControlsTimer}
      onTouchStart={resetControlsTimer}
    >
      {/* Full-Screen Video Element Only */}
      <div className="relative w-screen h-[100dvh] flex items-center justify-center bg-black overflow-hidden">
        {currentVideoAsset && !isMediaLocked && (
          videoLoadError || !resolvedVideoSrc ? (
            <div className="flex flex-col items-center justify-center p-6 text-center gap-3 text-neutral-300">
              <p className="text-sm font-semibold">Video stream temporarily unavailable</p>
              {videoCandidateSources.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (retryTimerRef.current) {
                      clearTimeout(retryTimerRef.current);
                      retryTimerRef.current = null;
                    }
                    hasAutoRetriedRef.current = false;
                    setSourceIndex(0);
                    setVideoLoadError(false);
                    setRetryNonce(n => n + 1);
                    requestAnimationFrame(() => {
                      if (videoRef.current) {
                        videoRef.current.load();
                        videoRef.current.play().catch(() => {});
                      }
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white cursor-pointer"
                >
                  Retry Playback
                </button>
              )}
            </div>
          ) : (
            <video
              key={`${currentPost?.id || initialPostId}_${sourceIndex}_${retryNonce}`}
              ref={videoRef}
              src={resolvedVideoSrc}
              poster={
                currentVideoAsset.thumbnailUrl !== currentVideoAsset.url
                  ? currentVideoAsset.thumbnailUrl
                  : undefined
              }
              playsInline
              muted={isMuted}
              loop={!isLockedPPV}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onError={() => {
                setIsPlaying(false);
                if (sourceIndex + 1 < videoCandidateSources.length) {
                  setSourceIndex(prev => prev + 1);
                  return;
                }
                if (!hasAutoRetriedRef.current) {
                  hasAutoRetriedRef.current = true;
                  retryTimerRef.current = setTimeout(() => {
                    setSourceIndex(0);
                    setRetryNonce(n => n + 1);
                  }, 350);
                  return;
                }
                setVideoLoadError(true);
              }}
              onClick={togglePlayPause}
              className="w-full h-full object-contain cursor-pointer"
            />
          )
        )}

        {/* Subscriber-Only / Follower-Only Full-Screen Gate */}
        {isMediaLocked && currentPost && (
          <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-20 space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              {isLockedSubscribers ? <Crown className="w-8 h-8" /> : <UserPlus className="w-8 h-8" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold font-brand text-white">
                {isLockedSubscribers ? 'Subscriber-Only Video' : 'Follower-Only Video'}
              </h3>
              <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                {isLockedSubscribers
                  ? `Subscribe to ${currentPost.creatorName} to watch this full video.`
                  : `Follow ${currentPost.creatorName} to unlock this video.`}
              </p>
            </div>
            {isLockedSubscribers ? (
              <button
                type="button"
                onClick={() => onOpenSubscribeModal(currentPost.creatorId)}
                className="px-6 py-3 bg-gradient-to-r from-[#d4af37] via-[#f1d07c] to-[#d4af37] text-black font-extrabold text-sm rounded-2xl shadow-xl cursor-pointer flex items-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Join Membership</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => toggleFollowCreator(currentPost.creatorId)}
                className="px-6 py-3 bg-gradient-to-r from-[#d4af37] via-[#f1d07c] to-[#d4af37] text-black font-extrabold text-sm rounded-2xl shadow-xl cursor-pointer flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Follow to Watch</span>
              </button>
            )}
          </div>
        )}

        {/* Centered Play Button when Paused */}
        {!isPlaying && !previewExceeded && !isMediaLocked && !videoLoadError && Boolean(resolvedVideoSrc) && (
          <button
            type="button"
            onClick={togglePlayPause}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#d4af37]/90 hover:bg-[#d4af37] text-black rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-2xl cursor-pointer z-20"
            title="Play Video (Space)"
          >
            <Play className="w-7 h-7 fill-black ml-1" />
          </button>
        )}

        {/* PPV Vault Locked Overlay */}
        {previewExceeded && isLockedPPV && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center z-30 space-y-4 overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center text-[#d4af37]">
              <Lock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                Free {previewDuration}s Preview Finished
              </span>
              <h3 className="text-xl font-bold font-brand text-white">Unlock Full Pay-To-View Video</h3>
              <p className="text-xs text-neutral-300 max-w-xs mx-auto">
                Directly support {currentPost.creatorName}. One-time purchase unlocks permanent lifetime access.
              </p>
            </div>
            <button
              type="button"
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

        {/* Top Creator Identity Chip & Exit Full Screen Button */}
        {currentPost && (
          <div
            className={`absolute top-3 left-3 right-14 sm:top-4 sm:left-4 sm:right-16 z-30 flex items-center transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToCreator(currentPost.creatorId);
              }}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 hover:border-[#d4af37]/60 text-left transition-all cursor-pointer max-w-full"
            >
              <img
                src={currentPost.creatorAvatar}
                alt={currentPost.creatorName}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-[#d4af37]/60 shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white min-w-0">
                  <span className="truncate">{currentPost.creatorName}</span>
                  <VerifiedBadge creatorId={currentPost.creatorId} size="sm" />
                </div>
                <div className="text-[10px] sm:text-[11px] text-neutral-300 truncate">
                  @{currentPost.creatorUsername}
                </div>
              </div>
            </button>
          </div>
        )}

        <div
          className={`absolute top-4 right-4 z-30 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/70 backdrop-blur-md hover:bg-black text-white flex items-center justify-center border border-white/15 transition-all cursor-pointer shadow-lg"
            title="Exit Full Screen (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bottom Video Playback Controls & Compact Collapsible Description */}
        {!previewExceeded && !isMediaLocked && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/65 to-transparent px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-6 sm:pt-8 flex flex-col gap-2 sm:gap-2.5 z-30 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {currentPost?.content && (
              <div
                onClick={e => e.stopPropagation()}
                onTouchStart={resetControlsTimer}
                className="max-w-3xl"
              >
                <TranslateContentButton
                  text={currentPost.content}
                  contentType="video"
                  contentRef={`video_viewer_${currentPost.id}`}
                  renderPrimaryText
                  collapsible
                  compact
                  linkify
                  variant="overlay"
                  maxExpandedHeightClass="max-h-[24dvh] overflow-y-auto"
                  textClassName="text-xs sm:text-sm text-neutral-100 leading-relaxed drop-shadow"
                />
              </div>
            )}

            {/* Progress / Seek Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-neutral-300 tabular-nums">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 accent-[#d4af37] h-1.5 bg-white/25 rounded-lg cursor-pointer"
              />
              <span className="text-xs font-mono text-neutral-300 tabular-nums">
                {formatTime(duration)}
              </span>
            </div>

            {/* Playback Control Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={togglePlayPause}
                  className="p-2 text-white hover:text-[#d4af37] transition-colors cursor-pointer"
                  title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMuted(prev => !prev)}
                  className="p-2 text-white hover:text-[#d4af37] transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute (M)' : 'Mute (M)'}
                >
                  {isMuted ? (
                    <VolumeX className="w-5 h-5 text-red-400" />
                  ) : (
                    <Volume2 className="w-5 h-5 text-[#d4af37]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={toggleSpeed}
                  className="px-2.5 py-1 rounded-lg bg-black/60 text-xs font-mono font-bold text-[#fce7b0] border border-white/15 hover:border-white/30 cursor-pointer"
                  title="Playback Speed"
                >
                  {playbackSpeed}x
                </button>
              </div>

              <div className="flex items-center gap-2 relative">
                {/* Quality Selector */}
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    setShowQualityMenu(prev => !prev);
                  }}
                  className="px-2.5 py-1 bg-black/70 hover:bg-black text-xs font-mono font-bold text-[#fce7b0] rounded-lg border border-[#d4af37]/30 flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Video Quality"
                >
                  <Settings className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{selectedResolution === 'auto' ? 'Auto' : selectedResolution}</span>
                </button>

                {showQualityMenu && (
                  <div
                    onClick={e => e.stopPropagation()}
                    className="absolute bottom-11 right-0 sm:right-8 w-40 max-w-[calc(100vw-2rem)] bg-[#121216]/95 backdrop-blur-xl border border-[#2e2e38] rounded-2xl p-2 shadow-2xl space-y-1 z-50 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedResolution('auto');
                        setShowQualityMenu(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-xl flex items-center justify-between text-left cursor-pointer ${
                        selectedResolution === 'auto'
                          ? 'bg-[#d4af37]/20 text-[#fce7b0] font-bold'
                          : 'text-neutral-300 hover:bg-white/5'
                      }`}
                    >
                      <span>Auto</span>
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
                          selectedResolution === res
                            ? 'bg-[#d4af37]/20 text-[#fce7b0] font-bold'
                            : 'text-neutral-300 hover:bg-white/5'
                        }`}
                      >
                        <span>{res}</span>
                        {selectedResolution === res && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* Exit Full Screen Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 bg-black/70 hover:bg-black text-white hover:text-[#d4af37] rounded-lg border border-white/15 transition-colors cursor-pointer flex items-center gap-1.5 text-xs"
                  title="Exit Full Screen (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
