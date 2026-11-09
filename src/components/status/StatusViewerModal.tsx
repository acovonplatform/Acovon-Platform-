import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Heart, Send, Lock, 
  Volume2, VolumeX, Eye, Trash2, Flag, Check, UserPlus, 
  Sparkles, AlertCircle, Share2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreatorStatus } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface StatusViewerModalProps {
  initialCreatorId: string;
  onClose: () => void;
  onNavigateToCreatorProfile?: (creatorId: string) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
}

const QUICK_EMOJIS = ['🔥', '❤️', '👏', '👑', '😍', '🥂', '💎'];

export const StatusViewerModal: React.FC<StatusViewerModalProps> = ({
  initialCreatorId,
  onClose,
  onNavigateToCreatorProfile,
  onOpenSubscribeModal
}) => {
  const {
    currentUser,
    creators,
    getActiveCreatorStatuses,
    markStatusViewed,
    reactToStatus,
    replyToStatus,
    deleteStatus,
    reportStatus,
    canUserViewStatus,
    isFollowing,
    toggleFollowCreator
  } = useApp();

  // Find all creators that have active stories
  const creatorsWithStories = useMemo(() => {
    return creators.filter(c => getActiveCreatorStatuses(c.id).length > 0);
  }, [creators, getActiveCreatorStatuses]);

  // Current creator index in list of creators with stories
  const currentCreatorIndex = useMemo(() => {
    const idx = creatorsWithStories.findIndex(c => c.id === initialCreatorId);
    return idx >= 0 ? idx : 0;
  }, [creatorsWithStories, initialCreatorId]);

  const [activeCreatorIdx, setActiveCreatorIdx] = useState<number>(currentCreatorIndex);
  const currentCreator = creatorsWithStories[activeCreatorIdx] || creators.find(c => c.id === initialCreatorId);

  // Active creator's statuses
  const creatorStatuses = useMemo(() => {
    if (!currentCreator) return [];
    return getActiveCreatorStatuses(currentCreator.id);
  }, [currentCreator, getActiveCreatorStatuses]);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const currentStatus: CreatorStatus | undefined = creatorStatuses[currentIndex];

  // Playback & progress timer state
  const [progress, setProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [replyText, setReplyText] = useState<string>('');
  const [replySentSuccess, setReplySentSuccess] = useState<boolean>(false);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('Inappropriate or Violating');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [showViewersModal, setShowViewersModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const pressTimerRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number>(0);

  // Check if current user can view this story
  const accessCheck = useMemo(() => {
    if (!currentStatus) return { canView: true };
    return canUserViewStatus(currentStatus);
  }, [currentStatus, canUserViewStatus]);

  const isOwner = currentUser.id === currentCreator?.id;
  const userHasLiked = currentStatus?.reactions?.some(r => r.userId === currentUser.id && r.emoji === '❤️');

  // Mark status as viewed as soon as it opens
  useEffect(() => {
    if (currentStatus && accessCheck.canView) {
      markStatusViewed(currentStatus.id);
    }
  }, [currentStatus?.id, accessCheck.canView, markStatusViewed]);

  // Transition to next story or next creator
  const goToNextStory = useCallback(() => {
    if (currentIndex < creatorStatuses.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Advance to next creator
      if (activeCreatorIdx < creatorsWithStories.length - 1) {
        setActiveCreatorIdx(prev => prev + 1);
        setCurrentIndex(0);
        setProgress(0);
      } else {
        // Finished all stories from all creators
        onClose();
      }
    }
  }, [currentIndex, creatorStatuses.length, activeCreatorIdx, creatorsWithStories.length, onClose]);

  // Transition to previous story or previous creator
  const goToPrevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to previous creator's last story
      if (activeCreatorIdx > 0) {
        const prevCreator = creatorsWithStories[activeCreatorIdx - 1];
        const prevStatuses = getActiveCreatorStatuses(prevCreator.id);
        setActiveCreatorIdx(prev => prev - 1);
        setCurrentIndex(Math.max(0, prevStatuses.length - 1));
        setProgress(0);
      } else {
        // Reset progress on first story
        setProgress(0);
      }
    }
  }, [currentIndex, activeCreatorIdx, creatorsWithStories, getActiveCreatorStatuses]);

  // Timer loop for advancing stories
  useEffect(() => {
    // If locked or paused or in modal, stop advancing
    if (!accessCheck.canView || isPaused || showReportModal || showViewersModal || isDeleting) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Default duration: 5000ms for images and text, 10000ms for video if metadata not loaded
    const defaultDuration = currentStatus?.type === 'video' ? 10000 : 5000;
    const intervalMs = 50;
    const step = (intervalMs / defaultDuration) * 100;

    timerRef.current = window.setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goToNextStory();
          return 0;
        }
        return prev + step;
      });
    }, intervalMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentStatus, accessCheck.canView, isPaused, showReportModal, showViewersModal, isDeleting, goToNextStory]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showReportModal || showViewersModal) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' || e.key === ' ') goToNextStory();
      if (e.key === 'ArrowLeft') goToPrevStory();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNextStory, goToPrevStory, showReportModal, showViewersModal]);

  // Handle tap / click on story surface
  const handleSurfacePointerDown = (e: React.PointerEvent) => {
    touchStartTimeRef.current = Date.now();
    pressTimerRef.current = window.setTimeout(() => {
      setIsPaused(true);
      if (videoRef.current) videoRef.current.pause();
    }, 180);
  };

  const handleSurfacePointerUp = (e: React.PointerEvent) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    const holdDuration = Date.now() - touchStartTimeRef.current;

    if (holdDuration < 200) {
      // Tap navigation
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;

      if (clickX < width * 0.35) {
        goToPrevStory();
      } else {
        goToNextStory();
      }
    }

    setIsPaused(false);
    if (videoRef.current && !videoRef.current.ended) {
      videoRef.current.play().catch(() => {});
    }
  };

  // Reactions
  const handleSendReaction = (emoji: string) => {
    if (!currentStatus) return;
    reactToStatus(currentStatus.id, emoji);
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 1500);
  };

  // Reply
  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStatus || !replyText.trim()) return;
    replyToStatus(currentStatus.id, replyText.trim());
    setReplyText('');
    setReplySentSuccess(true);
    setTimeout(() => setReplySentSuccess(false), 2400);
  };

  // Delete status
  const handleDeleteCurrentStatus = () => {
    if (!currentStatus) return;
    setIsDeleting(true);
    deleteStatus(currentStatus.id);
    setIsDeleting(false);
    if (creatorStatuses.length <= 1) {
      onClose();
    } else {
      goToNextStory();
    }
  };

  // Report status
  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStatus) return;
    reportStatus(currentStatus.id, reportReason);
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReportModal(false);
      setReportSubmitted(false);
      goToNextStory();
    }, 1200);
  };

  if (!currentCreator || !currentStatus) {
    return null;
  }

  // Calculate time ago
  const formatTimeAgo = (iso: string) => {
    const diffMs = Date.now() - new Date(iso).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ago`;
  };

  // Calculate time remaining until 24h expiration
  const formatTimeRemaining = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return 'Expiring now';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  const isUserFollowingCreator = isFollowing(currentCreator.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md select-none">
      {/* Desktop Navigation Chevrons */}
      <button
        onClick={goToPrevStory}
        aria-label="Previous story"
        className="hidden md:flex absolute left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur transition-transform active:scale-95 z-20"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={goToNextStory}
        aria-label="Next story"
        className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center backdrop-blur transition-transform active:scale-95 z-20"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Floating Animated Reaction */}
      {floatingReaction && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50 animate-bounce">
          <span className="text-8xl drop-shadow-2xl animate-ping">{floatingReaction}</span>
        </div>
      )}

      {/* Story Stage Container (Mobile-first 9:16 aspect ratio or responsive viewport) */}
      <div 
        className="relative w-full h-full max-w-md max-h-[92vh] md:rounded-3xl overflow-hidden bg-neutral-950 flex flex-col shadow-2xl border border-white/10"
        onPointerDown={handleSurfacePointerDown}
        onPointerUp={handleSurfacePointerUp}
      >
        {/* Progress Bars Segments */}
        <div className="absolute top-0 inset-x-0 z-30 pt-3 px-3 flex gap-1 pointer-events-none">
          {creatorStatuses.map((s, idx) => {
            let fillPct = 0;
            if (idx < currentIndex) fillPct = 100;
            else if (idx === currentIndex) fillPct = progress;
            return (
              <div key={s.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${fillPct}%` }}
                />
              </div>
            );
          })}
        </div>

        {/* Story Header */}
        <div className="relative z-30 pt-6 px-4 pb-3 flex items-center justify-between text-white bg-gradient-to-b from-black/70 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                onNavigateToCreatorProfile?.(currentCreator.id);
              }}
              className="flex items-center gap-2 group text-left"
            >
              <div className="relative">
                <img 
                  src={currentCreator.avatar} 
                  alt={currentCreator.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400 ring-2 ring-black"
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-sm drop-shadow">
                  <span>{currentCreator.name}</span>
                  <span className="text-white/60 text-xs font-normal">· {formatTimeAgo(currentStatus.createdAt)}</span>
                </div>
                <div className="text-[11px] text-amber-300/90 font-medium flex items-center gap-1">
                  <span>@{currentCreator.username}</span>
                  <VerifiedBadge creatorId={currentCreator.id} size="xs" />
                </div>
              </div>
            </button>

            {/* Quick Follow Button if not current user & not following */}
            {!isOwner && !isUserFollowingCreator && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFollowCreator(currentCreator.id);
                }}
                className="ml-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-white/20 hover:bg-white/30 backdrop-blur text-white flex items-center gap-1 transition-all"
              >
                <UserPlus className="w-3 h-3 text-amber-300" />
                <span>Follow</span>
              </button>
            )}
          </div>

          {/* Top Right Controls */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {currentStatus.type === 'video' && (
              <button
                onClick={() => {
                  setIsMuted(!isMuted);
                  if (videoRef.current) videoRef.current.muted = !isMuted;
                }}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            )}

            {/* If Creator Viewing Own Story: Viewers Button & Delete Button */}
            {isOwner && (
              <>
                <button
                  onClick={() => setShowViewersModal(true)}
                  className="px-2 py-1 rounded-full bg-black/40 hover:bg-black/60 text-white text-xs flex items-center gap-1 font-medium"
                  title="View story insights"
                >
                  <Eye className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentStatus.uniqueViews?.length || currentStatus.viewsCount || 0}</span>
                </button>
                <button
                  onClick={handleDeleteCurrentStatus}
                  className="p-1.5 rounded-full bg-black/40 hover:bg-red-500/80 text-white"
                  title="Delete this status"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Report Button for Fans */}
            {!isOwner && (
              <button
                onClick={() => setShowReportModal(true)}
                className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white"
                title="Report content"
              >
                <Flag className="w-4 h-4" />
              </button>
            )}

            {/* Close Story Viewer */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media / Content Area */}
        <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
          {/* Access Check Lock Overlay */}
          {!accessCheck.canView ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-black/85 backdrop-blur-xl">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 text-amber-400">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {currentStatus.audience === 'subscribers' 
                  ? 'Subscribers Only Story' 
                  : currentStatus.audience === 'followers' 
                    ? 'Followers Only Story' 
                    : 'Exclusive Tier Content'}
              </h3>
              <p className="text-sm text-neutral-400 max-w-xs mb-6">
                {currentStatus.audience === 'subscribers' 
                  ? `Subscribe to @${currentCreator.username} to unlock exclusive backstage stories, updates, and direct interaction.`
                  : `Follow @${currentCreator.username} to see this creator's follower-exclusive status.`}
              </p>

              <div className="flex flex-col gap-2 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
                {currentStatus.audience === 'followers' ? (
                  <button
                    onClick={() => toggleFollowCreator(currentCreator.id)}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-semibold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Follow @{currentCreator.username}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenSubscribeModal?.(currentCreator.id);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-black font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Unlock with Subscription</span>
                  </button>
                )}
                <button
                  onClick={goToNextStory}
                  className="w-full py-2 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-xl transition"
                >
                  Skip to Next Story
                </button>
              </div>
            </div>
          ) : null}

          {/* Status Content Rendering */}
          {currentStatus.type === 'text' ? (
            <div 
              className="w-full h-full flex flex-col items-center justify-center p-8 text-center"
              style={{
                background: currentStatus.backgroundColor || 'linear-gradient(135deg, #1f1205 0%, #997819 100%)'
              }}
            >
              <div className="max-w-xs text-white font-serif text-2xl md:text-3xl leading-relaxed tracking-wide drop-shadow-lg break-words">
                "{currentStatus.textOverlay || currentStatus.caption}"
              </div>
              <div className="mt-6 text-xs text-amber-200/80 font-mono uppercase tracking-widest">
                ACOVON MOMENTS
              </div>
            </div>
          ) : currentStatus.type === 'video' ? (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <video
                ref={videoRef}
                src={currentStatus.mediaUrl || '/videos/sample1.mp4'}
                poster={currentStatus.thumbnailUrl}
                playsInline
                autoPlay
                muted={isMuted}
                loop={false}
                onEnded={goToNextStory}
                onError={(e) => {
                  const el = e.currentTarget;
                  if (!el.src.includes('/videos/sample1.mp4')) {
                    el.src = '/videos/sample1.mp4';
                    el.load();
                  }
                }}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-full h-full relative flex items-center justify-center bg-black">
              <img
                src={currentStatus.mediaUrl}
                alt={currentStatus.caption || 'Creator Story'}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Optional Caption Overlay */}
          {currentStatus.caption && currentStatus.type !== 'text' && (
            <div className="absolute bottom-20 inset-x-0 z-20 px-4 py-3 bg-gradient-to-t from-black/85 via-black/50 to-transparent pointer-events-none text-white text-sm text-center leading-relaxed">
              <p className="drop-shadow-md font-medium max-w-sm mx-auto">{currentStatus.caption}</p>
            </div>
          )}

          {/* Audience Badge & Time remaining pill (Bottom corner) */}
          <div className="absolute top-16 right-4 z-20 flex flex-col items-end gap-1 pointer-events-none">
            {currentStatus.audience !== 'public' && (
              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 backdrop-blur">
                {currentStatus.audience === 'subscribers' ? '★ Subscribers' : '• Followers'}
              </span>
            )}
            <span className="text-[10px] text-white/60 drop-shadow">
              {formatTimeRemaining(currentStatus.expiresAt)}
            </span>
          </div>
        </div>

        {/* Bottom Interaction Rail (Fans) */}
        {!isOwner && accessCheck.canView && (
          <div 
            className="relative z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Quick Emoji Reaction Row */}
            <div className="flex items-center justify-around px-2 py-1">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="text-2xl hover:scale-125 active:scale-95 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* DM Reply Form + Heart Like Button */}
            <form onSubmit={handleSendReply} className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => handleSendReaction('❤️')}
                className={`p-2.5 rounded-full border transition-all ${
                  userHasLiked 
                    ? 'bg-rose-500/20 border-rose-500 text-rose-500' 
                    : 'bg-white/10 border-white/10 hover:bg-white/20 text-white'
                }`}
                title="Like story"
              >
                <Heart className={`w-5 h-5 ${userHasLiked ? 'fill-current' : ''}`} />
              </button>

              <div className="relative flex-1">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Send a message to @${currentCreator.username}...`}
                  className="w-full py-2.5 pl-4 pr-10 rounded-full bg-white/10 border border-white/20 text-white text-xs placeholder-white/50 focus:outline-none focus:border-amber-400 focus:bg-white/15 transition"
                />
                {replyText.trim() && (
                  <button
                    type="submit"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </form>

            {replySentSuccess && (
              <div className="text-center text-xs text-emerald-400 font-medium py-1 animate-fade-in flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Message sent directly to @{currentCreator.username}!</span>
              </div>
            )}
          </div>
        )}

        {/* Creator's Own Insight Bottom Strip */}
        {isOwner && (
          <div 
            className="relative z-30 p-3 bg-gradient-to-t from-black via-black/90 to-transparent flex items-center justify-between text-xs text-neutral-300"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowViewersModal(true)}
              className="flex items-center gap-2 hover:text-amber-300 transition"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>{currentStatus.uniqueViews?.length || currentStatus.viewsCount || 0} unique viewers</span>
            </button>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
                <span>{currentStatus.reactions?.length || 0}</span>
              </span>
              <span className="text-[11px] text-neutral-500">
                {currentStatus.audience.toUpperCase()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Creator's Unique Viewers Modal */}
      {showViewersModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowViewersModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">Story Viewers ({currentStatus.uniqueViews?.length || 0})</h4>
              </div>
              <button 
                onClick={() => setShowViewersModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {(!currentStatus.uniqueViews || currentStatus.uniqueViews.length === 0) ? (
                <p className="text-xs text-neutral-500 text-center py-6">No viewers yet. New views will update in real time.</p>
              ) : (
                currentStatus.uniqueViews.map((viewer) => (
                  <div key={viewer.userId} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-neutral-800/40">
                    <div className="flex items-center gap-2.5">
                      <img 
                        src={viewer.userAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                        alt={viewer.userName}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                      />
                      <div>
                        <div className="text-xs font-semibold">{viewer.userName}</div>
                        <div className="text-[10px] text-neutral-400">{formatTimeAgo(viewer.viewedAt)}</div>
                      </div>
                    </div>
                    {currentStatus.reactions?.find(r => r.userId === viewer.userId) && (
                      <span className="text-sm">
                        {currentStatus.reactions.find(r => r.userId === viewer.userId)?.emoji}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Report Story Modal */}
      {showReportModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setShowReportModal(false)}
        >
          <div 
            className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-800 p-5 shadow-2xl text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <h4 className="font-bold text-sm">Report Status</h4>
              </div>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSubmitted ? (
              <div className="py-6 text-center text-emerald-400 space-y-2">
                <Check className="w-8 h-8 mx-auto" />
                <p className="text-sm font-semibold">Report Received</p>
                <p className="text-xs text-neutral-400">Our moderation team will review this status promptly.</p>
              </div>
            ) : (
              <form onSubmit={handleReportSubmit} className="space-y-3">
                <p className="text-xs text-neutral-400">
                  Select the reason for reporting this status update by @{currentCreator.username}:
                </p>
                <div className="space-y-1.5 text-xs">
                  {['Inappropriate or Violating', 'Spam or Misleading', 'Harassment or Hate', 'Copyright Infringement'].map((reason) => (
                    <label key={reason} className="flex items-center gap-2 p-2 rounded-lg bg-neutral-800/60 hover:bg-neutral-800 cursor-pointer">
                      <input 
                        type="radio" 
                        name="reportReason"
                        checked={reportReason === reason}
                        onChange={() => setReportReason(reason)}
                        className="text-amber-500 focus:ring-amber-400"
                      />
                      <span>{reason}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 text-white"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
