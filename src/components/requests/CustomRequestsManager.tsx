import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CustomVideoRequest } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  uploadUserFileToSupabase,
  deleteSupabaseFileByPath
} from '../../services/supabase';
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
  MessageSquare,
  Trash2
} from 'lucide-react';

interface CustomRequestsManagerProps {
  onNavigateToMessages: () => void;
}

export const CustomRequestsManager: React.FC<CustomRequestsManagerProps> = ({
  onNavigateToMessages
}) => {
  const { 
    creators,
    customRequests, 
    currentUser, 
    activeRole, 
    updateCustomRequestStatus 
  } = useApp();

  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'completed'>('all');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [deliveringReqId, setDeliveringReqId] = useState<string | null>(null);
  const [deliveryVideoUrl, setDeliveryVideoUrl] = useState('');
  const [deliveryVideoFileName, setDeliveryVideoFileName] = useState('');
  const [deliveryVideoFileSize, setDeliveryVideoFileSize] = useState('');
  const [deliveryStoragePath, setDeliveryStoragePath] = useState<string | undefined>(undefined);
  const [deliverySupabaseFileId, setDeliverySupabaseFileId] = useState<string | undefined>(undefined);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const videoFileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name)) {
      setUploadError('Please select a valid video file (MP4, MOV, or WEBM).');
      e.target.value = '';
      return;
    }

    setIsUploadingVideo(true);
    try {
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUser.id,
        file,
        featureName: 'custom-requests',
        itemId: deliveringReqId || `req_${Date.now()}`,
        visibility: 'private'
      });

      const localPreview = URL.createObjectURL(file);
      setDeliveryVideoUrl(uploadRes.signedUrl || localPreview);
      setDeliveryVideoFileName(file.name);
      setDeliveryVideoFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      setDeliveryStoragePath(uploadRes.storagePath);
      setDeliverySupabaseFileId(uploadRes.record?.file_id);
    } catch {
      setUploadError('Failed to upload video file. Please try again.');
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const handleRemoveVideoFile = async () => {
    if (deliveryStoragePath) {
      await deleteSupabaseFileByPath({
        storagePath: deliveryStoragePath,
        fileId: deliverySupabaseFileId,
        uid: currentUser.id
      });
    }
    setDeliveryVideoUrl('');
    setDeliveryVideoFileName('');
    setDeliveryVideoFileSize('');
    setDeliveryStoragePath(undefined);
    setDeliverySupabaseFileId(undefined);
    setUploadError(null);
  };

  const handleDeliverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringReqId) return;
    if (!deliveryVideoUrl.trim()) {
      setUploadError('Please upload a video file before delivering.');
      return;
    }
    updateCustomRequestStatus(deliveringReqId, 'delivered', deliveryVideoUrl, deliveryNotes);
    setDeliveringReqId(null);
    setDeliveryVideoUrl('');
    setDeliveryVideoFileName('');
    setDeliveryVideoFileSize('');
    setDeliveryStoragePath(undefined);
    setDeliverySupabaseFileId(undefined);
    setUploadError(null);
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
    <div className="max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-brand tracking-wide text-white">Custom Video Requests</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Personalized video commissions with escrow protection and delivery tracking.
          </p>
        </div>

        {/* Filter buttons (Interactive tabs allowed by design rules) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#141418] border border-[#27272a] rounded-xl self-start max-w-full overflow-x-auto no-scrollbar">
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
              className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 sm:p-6 transition-all hover:border-[#383842]"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-4 border-b border-[#1c1c22]">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-base">{req.title}</h3>
                    <span className="text-xs text-neutral-500 font-mono">#{req.id.slice(-4)}</span>
                  </div>

                  {/* Unboxed Metadata */}
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-400">
                    <span className="inline-flex items-center gap-1.5">
                      <span>Creator:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-neutral-200">
                        <span>{req.creatorName}</span>
                        <VerifiedBadge creatorId={req.creatorId} size="xs" />
                      </span>
                      <span className="text-[10px] text-neutral-400 font-normal">
                        @{creators.find(c => c.id === req.creatorId)?.username || req.creatorName.toLowerCase().replace(/\s+/g, '')}
                      </span>
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
                <div className="mt-2 mb-4 p-3.5 sm:p-4 bg-[#18181c] border border-emerald-900/40 rounded-xl space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                      <FileCheck className="w-4 h-4" />
                      <span>Completed Video Delivery from {req.creatorName}</span>
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

                <div className="flex flex-wrap items-center gap-2">
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
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
          <div className="max-w-3xl w-full max-h-[92dvh] overflow-y-auto bg-[#121215] border border-[#27272a] rounded-2xl relative acovon-modal-panel">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-3 right-3 z-10 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video bg-black max-h-[82dvh] w-full">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative acovon-modal-panel">
            <button
              onClick={() => {
                setDeliveringReqId(null);
                setUploadError(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-2">Deliver Custom Video</h3>
            <p className="text-xs text-neutral-400 mb-4">
              Upload your personalized video file for this fan.
            </p>

            <form onSubmit={handleDeliverSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  Video File
                </label>
                <input
                  ref={videoFileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/*"
                  onChange={handleVideoFileSelect}
                  className="hidden"
                />

                {!deliveryVideoUrl ? (
                  <button
                    type="button"
                    disabled={isUploadingVideo}
                    onClick={() => videoFileInputRef.current?.click()}
                    className="w-full py-6 px-4 bg-[#18181c] hover:bg-[#1f1f26] border border-dashed border-[#383842] hover:border-[#d4af37] rounded-xl flex flex-col items-center justify-center gap-2 text-neutral-300 text-xs transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Upload className="w-6 h-6 text-[#d4af37]" />
                    <span className="font-semibold text-white">
                      {isUploadingVideo ? 'Uploading Video File...' : 'Click to Upload Video File'}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      MP4, MOV, or WEBM (up to 500 MB)
                    </span>
                  </button>
                ) : (
                  <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3 space-y-2.5 text-xs">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={deliveryVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">
                          {deliveryVideoFileName || 'Uploaded Custom Video'}
                        </div>
                        {deliveryVideoFileSize && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {deliveryVideoFileSize}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => videoFileInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#23232b] hover:bg-[#2c2c36] text-neutral-200 text-[11px] font-medium cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveVideoFile}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 cursor-pointer"
                          title="Remove uploaded video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {uploadError && (
                  <p className="text-rose-400 text-[11px] mt-1.5">{uploadError}</p>
                )}
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
                  onClick={() => {
                    setDeliveringReqId(null);
                    setUploadError(null);
                  }}
                  className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingVideo || !deliveryVideoUrl}
                  className="px-5 py-2 bg-[#d4af37] hover:bg-[#e5c07b] disabled:opacity-50 text-black font-semibold text-xs rounded-xl cursor-pointer"
                >
                  {isUploadingVideo ? 'Uploading...' : 'Send to Fan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
