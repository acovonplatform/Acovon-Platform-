import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, VideoResolution } from '../../types';
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Lock,
  Settings,
  Check,
  Minimize2
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
  onClose
}) => {
  const {
    posts,
    currentUser,
    isPostPurchased,
    isSubscribedTo,
    unlockPPVPost,
    getAuthorizedPlaybackUrl,
    trackEngagementEvent
  } = useApp();

  const currentPost = posts.find(p => p.id === initialPostId) || posts.find(p => p.media?.some(m => m.type === 'video')) || posts[0];
  const currentVideoAsset = currentPost?.media?.find(m => m.type === 'video');

  const resolvedVideoSrc =
    currentVideoAsset?.url &&
    !currentVideoAsset.url.includes('cdn.acovon.media') &&
    !currentVideoAsset.url.endsWith('.m3u8')
      ? currentVideoAsset.url
      : currentVideoAsset?.previewUrl &&
        !currentVideoAsset.previewUrl.includes('cdn.acovon.media') &&
        !currentVideoAsset.previewUrl.endsWith('.m3u8')
      ? currentVideoAsset.previewUrl
      : '/videos/sample1.mp4';

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

  const availableResolutions: VideoResolution[] =
    currentVideoAsset?.availableResolutions || ['1080p', '720p', '480p', '360p'];

  const videoRef = useRef<HTMLVideoElement>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthor = currentUser.id === currentPost?.creatorId;
  const isPurchased = isPostPurchased(currentPost?.id);
  const isSubscribed = isSubscribedTo(currentPost?.creatorId);

  const isLockedPPV = currentPost?.visibility === 'pay_per_view' && !isAuthor && !isPurchased;
  const isLockedSubscribers = currentPost?.visibility === 'subscribers' && !isAuthor && !isSubscribed;
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

  // Start playback on open
  useEffect(() => {
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
              .then(() => setIsPlaying(true))
              .catch(() => setIsPlaying(false));
          }
        });
    }
  }, [initialPostId]);

  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (previewExceeded && isLockedPPV) return;

    if (!videoRef.current.paused) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
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
  }, [previewExceeded, isLockedPPV, resetControlsTimer]);

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
        {currentVideoAsset && (
          <video
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
            onError={(e) => {
              const el = e.currentTarget;
              if (!el.src.includes('/videos/sample1.mp4')) {
                el.src = '/videos/sample1.mp4';
                el.load();
              }
            }}
            onClick={togglePlayPause}
            className="w-full h-full object-contain cursor-pointer"
          />
        )}

        {/* Centered Play Button when Paused */}
        {!isPlaying && !previewExceeded && !isLockedSubscribers && (
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
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 space-y-4">
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

        {/* Top Exit Full Screen Button */}
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

        {/* Bottom Video Playback Controls Only */}
        {!previewExceeded && !isLockedSubscribers && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 sm:px-6 pb-4 pt-8 flex flex-col gap-2.5 z-30 transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
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
            <div className="flex items-center justify-between">
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
                    className="absolute bottom-11 right-8 w-40 bg-[#121216]/95 backdrop-blur-xl border border-[#2e2e38] rounded-2xl p-2 shadow-2xl space-y-1 z-50 text-xs"
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
