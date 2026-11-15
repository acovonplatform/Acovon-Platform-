import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import { Post, MediaAsset } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { TranslateContentButton } from '../common/TranslateContentButton';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Bookmark, 
  Share2, 
  Sparkles, 
  CheckCircle2, 
  UserCheck, 
  UserPlus,
  Coins,
  Lock,
  Unlock,
  Crown
} from 'lucide-react';

interface FullScreenPhotoModalProps {
  initialPostId: string;
  initialMediaIndex?: number;
  onClose: () => void;
  onNavigateToCreator: (creatorId: string) => void;
  onOpenSubscribeModal: (creatorId: string) => void;
  onOpenShareModal: (post: Post) => void;
  onOpenTipModal: (creatorId: string, creatorName: string) => void;
}

export const FullScreenPhotoModal: React.FC<FullScreenPhotoModalProps> = ({
  initialPostId,
  initialMediaIndex = 0,
  onClose,
  onNavigateToCreator,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenTipModal
}) => {
  const { 
    posts, 
    currentUser, 
    isAuthenticated,
    toggleLikePost, 
    isFollowing, 
    toggleFollowCreator, 
    isPostSaved, 
    toggleSavePost, 
    isSubscribedTo,
    isPostPurchased,
    unlockPPVPost,
    setEditingPost,
    setDeletingPost
  } = useApp();

  // Scope strictly to the opened post and its photos only
  const currentPost = posts.find(p => p.id === initialPostId);
  const postImages = currentPost?.media?.filter(m => m.type === 'image') || [];
  const safeInitialIndex =
    initialMediaIndex >= 0 && initialMediaIndex < postImages.length ? initialMediaIndex : 0;
  const [currentMediaIndex, setCurrentMediaIndex] = useState(safeInitialIndex);

  useEffect(() => {
    setCurrentMediaIndex(
      initialMediaIndex >= 0 && initialMediaIndex < postImages.length ? initialMediaIndex : 0
    );
  }, [initialPostId, initialMediaIndex, postImages.length]);

  const currentImage: MediaAsset | undefined = postImages[currentMediaIndex];

  // Zoom & Pan State
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showOverlay, setShowOverlay] = useState<boolean>(true);

  // Touch Pinch state
  const touchStartDistRef = useRef<number | null>(null);
  const initialScaleRef = useRef<number>(1);
  const lastTapRef = useRef<number>(0);

  const isAuthor = isAuthenticated && currentUser.id === currentPost?.creatorId;
  const isFollowingCreator = isFollowing(currentPost?.creatorId || '');
  const isSubscribed = isSubscribedTo(currentPost?.creatorId || '');
  const isSaved = isPostSaved(currentPost?.id || '');
  const isPurchased = isPostPurchased(currentPost?.id || '');

  const isLockedSubscribers = currentPost?.visibility === 'subscribers' && !isAuthor && !isSubscribed;
  const isLockedPPV = currentPost?.visibility === 'pay_per_view' && !isAuthor && !isPurchased;
  const isLockedFollowers = currentPost?.visibility === 'followers' && !isAuthor && !isFollowingCreator && !isSubscribed;
  const isLockedPhoto =
    isLockedSubscribers ||
    isLockedPPV ||
    isLockedFollowers ||
    (currentPost?.visibility === 'private' && !isAuthor);

  // Lock body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Reset zoom & pan when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [initialPostId, currentMediaIndex]);

  const handleNext = useCallback(() => {
    if (currentMediaIndex < postImages.length - 1) {
      setCurrentMediaIndex(prev => prev + 1);
    }
  }, [currentMediaIndex, postImages.length]);

  const handlePrev = useCallback(() => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(prev => prev - 1);
    }
  }, [currentMediaIndex]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Zoom handlers
  const handleZoomIn = () => {
    setScale(prev => Math.min(4, Number((prev + 0.5).toFixed(1))));
  };

  const handleZoomOut = () => {
    setScale(prev => {
      const next = Math.max(1, Number((prev - 0.5).toFixed(1)));
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Double-tap to Zoom in/out
  const handleDoubleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const now = Date.now();
    const timeDiff = now - lastTapRef.current;
    lastTapRef.current = now;

    if (timeDiff < 300) {
      if (scale > 1) {
        handleResetZoom();
      } else {
        setScale(2.5);
      }
    } else {
      setShowOverlay(prev => !prev);
    }
  };

  // Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const touchStartXRef = useRef<number | null>(null);

  // Touch Pinch, Pan & Swipe Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDistRef.current = dist;
      initialScaleRef.current = scale;
      touchStartXRef.current = null;
    } else if (e.touches.length === 1 && scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
      touchStartXRef.current = null;
    } else if (e.touches.length === 1 && scale === 1) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchStartDistRef.current;
      const newScale = Math.min(4, Math.max(1, initialScaleRef.current * ratio));
      setScale(Number(newScale.toFixed(2)));
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current !== null && scale === 1 && e.changedTouches.length === 1) {
      const deltaX = touchStartXRef.current - e.changedTouches[0].clientX;
      if (deltaX > 55) {
        handleNext();
      } else if (deltaX < -55) {
        handlePrev();
      }
    }
    touchStartXRef.current = null;
    touchStartDistRef.current = null;
    setIsDragging(false);
  };

  if (!currentPost) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center select-none overflow-hidden"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top Header Bar */}
      <div className={`absolute top-0 left-0 right-0 pt-[max(0.75rem,env(safe-area-inset-top))] px-3 sm:px-4 pb-3 flex items-center justify-between gap-2 z-30 transition-opacity duration-300 ${
        showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black text-white flex items-center justify-center border border-white/10 transition-colors cursor-pointer shadow-lg shrink-0"
          title="Close Photo Viewer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Zoom Controls Bar */}
        <div className="flex items-center gap-1 p-1 bg-black/70 backdrop-blur-md rounded-2xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 1}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <span className="px-1.5 sm:px-2 font-mono text-[11px] text-[#fce7b0] tabular-nums">
            {Math.round(scale * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 4}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-neutral-300 hover:text-white disabled:opacity-30 cursor-pointer"
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {scale > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-[10px] sm:text-[11px] font-semibold text-neutral-400 hover:text-white border-l border-white/10 flex items-center gap-1 cursor-pointer"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden xs:inline">100%</span>
            </button>
          )}
        </div>

        {/* Counter Badge (photos in this post only) */}
        <div className="px-2.5 sm:px-3 py-1 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-[11px] sm:text-xs font-mono font-medium text-neutral-300 whitespace-nowrap shrink-0">
          {postImages.length > 0 ? `${currentMediaIndex + 1} / ${postImages.length}` : '0 / 0'}
        </div>
      </div>

      {/* Main Image Area with Zoom & Drag Transform */}
      <div 
        className="w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden cursor-grab active:cursor-grabbing"
        onClick={isLockedPhoto ? undefined : handleDoubleTap}
        onMouseDown={isLockedPhoto ? undefined : handleMouseDown}
      >
        {isLockedPhoto && currentPost ? (
          <div className="bg-[#121216] border border-[#2a2a35] rounded-2xl p-5 sm:p-8 max-w-sm w-full text-center space-y-4 shadow-2xl max-h-[88dvh] overflow-y-auto acovon-modal-panel">
            <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mx-auto">
              {isLockedSubscribers ? <Crown className="w-7 h-7" /> : isLockedFollowers ? <UserPlus className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-brand text-white">
                {isLockedSubscribers
                  ? 'Subscriber-Only Photo'
                  : isLockedPPV
                  ? `Pay-Per-View Photo · $${currentPost.ppvPrice?.toFixed(2) || '9.99'}`
                  : isLockedFollowers
                  ? 'Follower-Only Photo'
                  : 'Private Photo'}
              </h3>
              <p className="text-xs text-neutral-300">
                {isLockedSubscribers
                  ? `Subscribe to ${currentPost.creatorName} to view this photo.`
                  : isLockedPPV
                  ? `Unlock this photo for $${currentPost.ppvPrice?.toFixed(2) || '9.99'}.`
                  : isLockedFollowers
                  ? `Follow ${currentPost.creatorName} to view this photo.`
                  : 'This photo is private.'}
              </p>
            </div>
            {isLockedSubscribers ? (
              <button
                type="button"
                onClick={() => onOpenSubscribeModal(currentPost.creatorId)}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-[#d4af37] to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Crown className="w-4 h-4" />
                <span>Join Membership</span>
              </button>
            ) : isLockedPPV ? (
              <button
                type="button"
                onClick={() => unlockPPVPost(currentPost.id)}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-[#d4af37] to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Unlock Photo · ${currentPost.ppvPrice?.toFixed(2) || '9.99'}</span>
              </button>
            ) : isLockedFollowers ? (
              <button
                type="button"
                onClick={() => toggleFollowCreator(currentPost.creatorId)}
                className="w-full py-2.5 px-5 bg-gradient-to-r from-[#d4af37] to-amber-500 text-black font-extrabold text-xs rounded-xl shadow-lg cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>Follow to View</span>
              </button>
            ) : null}
          </div>
        ) : currentImage ? (
          <img
            src={currentImage.url}
            alt={currentPost.content}
            draggable={false}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out'
            }}
            className="max-w-full max-h-[80dvh] sm:max-h-[85dvh] landscape-short:max-h-[68dvh] object-contain drop-shadow-2xl select-none"
          />
        ) : (
          <div className="text-neutral-500 text-sm">Image unavailable</div>
        )}
      </div>

      {/* Previous / Next Arrow Controls (scoped to photos in this post only) */}
      {postImages.length > 1 && currentMediaIndex > 0 && (
        <button
          type="button"
          onClick={handlePrev}
          className={`absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 backdrop-blur-md hover:bg-black text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer z-30 shadow-xl ${
            showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Previous Image (Arrow Left)"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {postImages.length > 1 && currentMediaIndex < postImages.length - 1 && (
        <button
          type="button"
          onClick={handleNext}
          className={`absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 backdrop-blur-md hover:bg-black text-white flex items-center justify-center border border-white/10 transition-all cursor-pointer z-30 shadow-xl ${
            showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          title="Next Image (Arrow Right)"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      )}

      {/* Bottom Info Bar Overlay */}
      <div className={`absolute bottom-0 left-0 right-0 pt-3 sm:pt-4 px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black via-black/85 to-transparent z-30 transition-opacity duration-300 ${
        showOverlay ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        {currentPost?.content && (
          <div
            onClick={e => e.stopPropagation()}
            className="max-w-4xl mx-auto mb-2.5"
          >
            <TranslateContentButton
              text={currentPost.content}
              contentType="post"
              contentRef={`photo_viewer_${currentPost.id}`}
              renderPrimaryText
              collapsible
              compact
              linkify
              variant="overlay"
              maxExpandedHeightClass="max-h-[24dvh] overflow-y-auto"
              textClassName="text-xs sm:text-sm text-neutral-200 leading-relaxed"
            />
          </div>
        )}
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          
          {/* Creator Profile Row */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToCreator(currentPost.creatorId);
              }}
              className="flex items-center gap-2 text-left group cursor-pointer min-w-0"
            >
              <img
                src={currentPost.creatorAvatar}
                alt={currentPost.creatorName}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-[#d4af37] shadow-lg group-hover:scale-105 transition-transform shrink-0"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-white group-hover:text-[#fce7b0] truncate">
                    {currentPost.creatorName}
                  </span>
                  <VerifiedBadge creatorId={currentPost.creatorId} size="sm" />
                </div>
                <span className="text-[11px] sm:text-xs text-neutral-400 truncate block">
                  @{currentPost.creatorUsername}
                </span>
              </div>
            </button>

            {/* Follow / Following */}
            {!isAuthor && (
              <button
                type="button"
                onClick={() => toggleFollowCreator(currentPost.creatorId)}
                className={`px-2.5 sm:px-3 py-1 rounded-xl text-[11px] sm:text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  isFollowingCreator
                    ? 'bg-neutral-800 text-neutral-300 border border-neutral-600'
                    : 'bg-[#d4af37] text-black font-bold'
                }`}
              >
                {isFollowingCreator ? <UserCheck className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                <span>{isFollowingCreator ? 'Following' : 'Follow'}</span>
              </button>
            )}

            {/* Subscribe */}
            {!isAuthor && !isSubscribed && (
              <button
                type="button"
                onClick={() => onOpenSubscribeModal(currentPost.creatorId)}
                className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-amber-500 to-[#d4af37] text-black text-[11px] sm:text-xs font-extrabold rounded-xl shadow-md cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Subscribe</span>
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => toggleLikePost(currentPost.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                currentPost.isLiked
                  ? 'bg-red-600/30 border-red-500/50 text-red-400'
                  : 'bg-black/60 border-white/10 text-neutral-200 hover:text-white hover:bg-black/80'
              }`}
            >
              <Heart className={`w-4 h-4 ${currentPost.isLiked ? 'fill-red-500' : ''}`} />
              <span>{currentPost.likesCount}</span>
            </button>

            <button
              type="button"
              onClick={() => toggleSavePost(currentPost.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                isSaved
                  ? 'bg-[#d4af37]/30 border-[#d4af37]/50 text-[#fce7b0]'
                  : 'bg-black/60 border-white/10 text-neutral-200 hover:text-white hover:bg-black/80'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#d4af37]' : ''}`} />
              <span>{isSaved ? 'Saved' : 'Save'}</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTipModal(currentPost.creatorId, currentPost.creatorName)}
              className="px-3 py-1.5 bg-black/60 border border-[#d4af37]/40 text-[#d4af37] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-black/80 shrink-0"
            >
              <Coins className="w-4 h-4" />
              <span>Tip</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenShareModal(currentPost)}
              className="px-3 py-1.5 bg-black/60 border border-white/10 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer hover:bg-black/80 shrink-0"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>

            {isAuthenticated && isAuthor && (currentUser.role === 'creator' || currentUser.role === 'admin' || currentUser.role === 'moderator') && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setEditingPost(currentPost);
                  }}
                  className="px-3 py-1.5 bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#fce7b0] hover:bg-[#d4af37]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span>Edit Post</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    setDeletingPost(currentPost);
                  }}
                  className="px-3 py-1.5 bg-red-950/50 border border-red-500/40 text-red-400 hover:bg-red-900/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                >
                  <span>Delete Post</span>
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
