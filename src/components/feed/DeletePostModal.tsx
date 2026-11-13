import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  Video,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Lock
} from 'lucide-react';

export const DeletePostModal: React.FC = () => {
  const {
    deletingPost,
    setDeletingPost,
    currentUser,
    isAuthenticated,
    isCurrentUserApprovedCreator,
    activeRole,
    deleteCreatorPost,
    getPostPurchaseCount
  } = useApp();

  const [reason, setReason] = useState('Removed by creator');
  const [deleting, setDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!deletingPost) return null;

  const isCreatorAuthorized =
    currentUser.role === 'creator' || isCurrentUserApprovedCreator || activeRole === 'creator';
  const isOwner = isAuthenticated && currentUser.id === deletingPost.creatorId && isCreatorAuthorized;

  if (!isOwner) {
    return null;
  }

  const purchaseCount = getPostPurchaseCount(deletingPost.id);
  const hasExistingPurchases = purchaseCount > 0;
  const firstMedia = deletingPost.media?.[0];
  const isVideo = firstMedia?.type === 'video';
  const thumbnail = firstMedia?.thumbnailUrl || firstMedia?.url;

  const handleConfirmDelete = async () => {
    setErrorMessage(null);
    setDeleting(true);
    const res = await deleteCreatorPost(deletingPost.id, reason.trim() || 'Removed by creator');
    setDeleting(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Failed to delete post.');
      return;
    }

    setDeletingPost(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121216] border border-[#2b2b36] rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col acovon-modal-panel overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-[#23232c] flex items-center justify-between gap-2 bg-[#161316] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-white truncate">Delete Published Post?</h3>
              <p className="text-[11px] text-neutral-400 truncate">
                Confirm permanent removal from your public profile and feed
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDeletingPost(null)}
            disabled={deleting}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-[#22222c] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 text-xs flex-1 min-h-0 overflow-y-auto">
          {/* Post Identification Preview Card */}
          <div className="p-3.5 rounded-xl bg-[#18181f] border border-[#2a2a36] flex flex-col xs:flex-row items-start gap-3">
            {thumbnail && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black shrink-0 border border-[#2c2c38]">
                <img src={thumbnail} alt="" className="w-full h-full object-cover" />
                <span className="absolute top-1 left-1 p-1 rounded bg-black/75 text-white">
                  {isVideo ? <Video className="w-3 h-3 text-[#d4af37]" /> : <ImageIcon className="w-3 h-3" />}
                </span>
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-neutral-400 font-mono">
                <span>Post #{deletingPost.id.slice(-6)}</span>
                <span>·</span>
                <span className="capitalize text-[#fce7b0]">{deletingPost.visibility.replace(/_/g, ' ')}</span>
                <span>·</span>
                <span>{deletingPost.createdAt}</span>
              </div>

              <p className="text-xs font-medium text-white line-clamp-2 leading-snug">
                {deletingPost.content}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-neutral-400 pt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-400" />
                  {deletingPost.likesCount} likes
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3 text-sky-400" />
                  {deletingPost.commentsCount} comments
                </span>
                {deletingPost.ppvPrice && deletingPost.visibility === 'pay_per_view' && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1 text-[#fce7b0] font-mono">
                      <Lock className="w-3 h-3 text-[#d4af37]" />
                      ${deletingPost.ppvPrice.toFixed(2)} PPV
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Deletion Impact & Purchaser Protection Policy */}
          {hasExistingPurchases ? (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 space-y-1.5">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Safe Archival Policy ({purchaseCount} Existing Fan Purchase{purchaseCount === 1 ? '' : 's'})</span>
              </div>
              <p className="text-[11px] text-amber-100/90 leading-relaxed">
                Deleting this post immediately removes it from your public profile, main feed, Explore, and search results, and blocks any new purchases. Because {purchaseCount} fan{purchaseCount === 1 ? ' has' : 's have'} already purchased this content, their existing unlocked access and all financial transaction records will be safely retained.
              </p>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 space-y-1">
              <div className="flex items-center gap-2 text-rose-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Permanent Removal</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                This post will be immediately removed from your public profile, subscriber feed, Explore discovery, and search results.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium text-neutral-400">
              Audit Log Note (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for deleting post..."
              className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-[#23232c]">
            <button
              type="button"
              onClick={() => setDeletingPost(null)}
              disabled={deleting}
              className="px-4 py-2.5 rounded-xl bg-[#1c1c24] hover:bg-[#262632] border border-[#2e2e3a] text-neutral-200 font-semibold text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-900/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>{deleting ? 'Deleting Post...' : 'Delete Post'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
