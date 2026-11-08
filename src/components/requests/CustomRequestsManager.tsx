import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomVideoRequest } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  Clapperboard, 
  CheckCircle, 
  Clock, 
  Play, 
  AlertCircle, 
  FileCheck, 
  RotateCcw, 
  Upload, 
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

interface CustomRequestsManagerProps {
  onNavigateToMessages: () => void;
}

export const CustomRequestsManager: React.FC<CustomRequestsManagerProps> = ({
  onNavigateToMessages
}) => {
  const { 
    customRequests, 
    currentUser, 
    activeRole, 
    updateCustomRequestStatus 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'completed'>('all');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [deliveringReqId, setDeliveringReqId] = useState<string | null>(null);
  const [deliveryVideoUrl, setDeliveryVideoUrl] = useState('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Filter requests relevant to current user:
  // If creator: requests where creatorId === currentUser.id
  // If fan: requests where fanId === currentUser.id
  // If admin/mod: show all requests
  const visibleRequests = customRequests.filter(req => {
    if (activeRole === 'creator') return req.creatorId === currentUser.id;
    if (activeRole === 'fan') return req.fanId === currentUser.id;
    return true; // admin / mod sees all
  }).filter(req => {
    if (filter === 'all') return true;
    if (filter === 'pending') return req.status === 'pending' || req.status === 'in_progress' || req.status === 'accepted';
    if (filter === 'delivered') return req.status === 'delivered';
    if (filter === 'completed') return req.status === 'completed';
    return true;
  });

  const handleDeliverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringReqId) return;
    updateCustomRequestStatus(deliveringReqId, 'delivered', deliveryVideoUrl, deliveryNotes);
    setDeliveringReqId(null);
    setDeliveryNotes('');
  };

  const getStatusBadge = (status: CustomVideoRequest['status']) => {
    switch (status) {
      case 'delivered':
        return <span className="text-emerald-400 font-medium">Delivered · Ready to Review</span>;
      case 'completed':
        return <span className="text-neutral-400 font-medium">Completed · Funds Released</span>;
      case 'in_progress':
        return <span className="text-[#d4af37] font-medium">In Production</span>;
      case 'accepted':
        return <span className="text-blue-400 font-medium">Accepted by Creator</span>;
      case 'pending':
        return <span className="text-amber-400 font-medium">Pending Creator Acceptance</span>;
      case 'refunded':
        return <span className="text-red-400 font-medium">Refunded</span>;
      default:
        return <span className="text-neutral-400 font-medium">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold font-brand tracking-wide text-white">Custom Video Requests</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Personalized video commissions with escrow protection and delivery tracking.
          </p>
        </div>

        {/* Filter buttons (Interactive tabs allowed by design rules) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141418] border border-[#27272a] rounded-xl self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'all' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            All ({visibleRequests.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'pending' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'delivered' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Delivered
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
              filter === 'completed' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {/* Requests List */}
      {visibleRequests.length === 0 ? (
        <div className="p-12 text-center bg-[#121215] border border-[#27272a] rounded-2xl">
          <Clapperboard className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
          <h3 className="font-semibold text-neutral-300 text-sm mb-1">No custom video requests found</h3>
          <p className="text-xs text-neutral-500 max-w-sm mx-auto">
            {activeRole === 'creator'
              ? 'Requests sent by your subscribers will appear here for review and delivery.'
              : 'Browse creators and request personalized shoutouts, reviews, or tutorials.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {visibleRequests.map((req) => (
            <div
              key={req.id}
              className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 transition-all hover:border-[#383842]"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#1c1c22]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{req.title}</h3>
                    <span className="text-xs text-neutral-500 font-mono">#{req.id.slice(-4)}</span>
                  </div>

                  {/* Unboxed Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      Creator: <strong className="text-neutral-200">{req.creatorName}</strong>
                      <VerifiedBadge creatorId={req.creatorId} size="xs" />
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>For: <strong className="text-neutral-200">{req.recipientName}</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Duration: <strong className="text-neutral-200">{req.videoDurationMinutes}m</strong></span>
                    <span aria-hidden="true">·</span>
                    <span>Status: {getStatusBadge(req.status)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start">
                  <div className="text-right">
                    <div className="text-xs text-neutral-400">Escrow Value</div>
                    <div className="text-lg font-mono font-bold text-[#fce7b0]">${req.price.toFixed(2)}</div>
                  </div>
                </div>
              </div>

              {/* Instructions text */}
              <div className="py-4 space-y-2">
                <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Instructions</div>
                <p className="text-xs sm:text-sm text-neutral-300 bg-[#18181c] p-3.5 rounded-xl leading-relaxed whitespace-pre-line border border-[#27272a]">
                  {req.instructions}
                </p>
              </div>

              {/* Delivered Video Preview Section if delivered or completed */}
              {req.deliveredVideoUrl && (
                <div className="mt-2 mb-4 p-4 bg-[#18181c] border border-emerald-900/40 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <FileCheck className="w-4 h-4" />
                      <span>Completed Video Delivery from {req.creatorName}</span>
                      <VerifiedBadge creatorId={req.creatorId} size="xs" />
                    </div>
                    <button
                      onClick={() => setSelectedVideo(req.deliveredVideoUrl!)}
                      className="px-3 py-1.5 bg-[#d4af37] text-black font-semibold text-xs rounded-lg flex items-center gap-1.5 hover:bg-[#e5c07b] cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Watch Delivered Video</span>
                    </button>
                  </div>
                  {req.deliveredNotes && (
                    <p className="text-xs text-neutral-300 italic">
                      "{req.deliveredNotes}"
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons depending on role & status */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#1c1c22]">
                <div className="text-[11px] text-neutral-500">
                  Target Delivery: {req.deliveryDeadline}
                </div>

                <div className="flex items-center gap-2">
                  {/* Creator actions */}
                  {activeRole === 'creator' && req.creatorId === currentUser.id && (
                    <>
                      {req.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateCustomRequestStatus(req.id, 'accepted')}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => updateCustomRequestStatus(req.id, 'refunded')}
                            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors cursor-pointer"
                          >
                            Decline & Refund
                          </button>
                        </>
                      )}

                      {(req.status === 'accepted' || req.status === 'in_progress') && (
                        <button
                          onClick={() => setDeliveringReqId(req.id)}
                          className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Deliver Finished Video</span>
                        </button>
                      )}
                    </>
                  )}

                  {/* Fan actions */}
                  {req.fanId === currentUser.id && req.status === 'delivered' && (
                    <>
                      <button
                        onClick={() => updateCustomRequestStatus(req.id, 'completed')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-colors cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Accept & Release Escrow Payment</span>
                      </button>
                      <button
                        onClick={() => updateCustomRequestStatus(req.id, 'revision_requested')}
                        className="px-3 py-2 bg-[#1f1f26] hover:bg-[#282832] text-neutral-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Request Revision</span>
                      </button>
                    </>
                  )}

                  <button
                    onClick={onNavigateToMessages}
                    className="px-3 py-1.5 bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-300 text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Modal Player */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-3xl w-full bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden relative">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video bg-black">
              <video
                src={selectedVideo}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Creator Delivery Modal */}
      {deliveringReqId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setDeliveringReqId(null)}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2">Deliver Completed Custom Video</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Upload or attach your personalized recording for this fan.
            </p>

            <form onSubmit={handleDeliverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Video Stream URL
                </label>
                <input
                  type="text"
                  value={deliveryVideoUrl}
                  onChange={(e) => setDeliveryVideoUrl(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Personalized Notes to Buyer
                </label>
                <textarea
                  rows={3}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Share any special message or details with the recipient..."
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDeliveringReqId(null)}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl"
                >
                  Send to Fan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
