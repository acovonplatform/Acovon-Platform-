import React, { useState } from 'react';
import { Livestream } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Scissors, 
  X, 
  Sparkles, 
  CheckCircle2, 
  Film, 
  Share2, 
  ExternalLink,
  Play
} from 'lucide-react';

interface CreateClipModalProps {
  stream: Livestream;
  onClose: () => void;
  onNavigateToGallery?: (creatorId: string) => void;
}

export const CreateClipModal: React.FC<CreateClipModalProps> = ({
  stream,
  onClose,
  onNavigateToGallery
}) => {
  const { currentUser, createLivestreamClip } = useApp();
  const defaultTitle = `${stream.creatorName} Live Highlight · ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  const [clipTitle, setClipTitle] = useState(defaultTitle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedClipId, setSavedClipId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSaveClip = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      const res = createLivestreamClip(stream.id, clipTitle);
      setIsSubmitting(false);
      if (res.success && res.clipPost) {
        setSavedClipId(res.clipPost.id);
      } else {
        setError(res.error || 'Failed to capture clip');
      }
    }, 400);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Create 30s Clip</h3>
              <p className="text-xs text-zinc-400">Save highlight to creator&apos;s Content Gallery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-300">
            {error}
          </div>
        )}

        {!savedClipId ? (
          <form onSubmit={handleSaveClip} className="space-y-4">
            
            {/* 30s Preview Frame / Visual Card */}
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
              <div
                className="h-36 w-full bg-cover bg-center opacity-70"
                style={{ backgroundImage: `url(${stream.coverImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-between p-3">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37] text-black">
                    <Film className="w-3 h-3" />
                    Last 30 Seconds
                  </span>
                  <span className="text-[11px] font-mono text-zinc-300 bg-black/60 px-2 py-0.5 rounded">
                    00:30
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-black/70 flex items-center justify-center border border-[#d4af37]/40">
                    <Play className="w-3.5 h-3.5 text-[#d4af37] ml-0.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white truncate max-w-[240px]">
                      {stream.title}
                    </div>
                    <div className="text-[10px] text-zinc-400">
                      Broadcaster: @{stream.creatorUsername}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Clip Title Input */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Highlight Title
              </label>
              <input
                type="text"
                value={clipTitle}
                onChange={e => setClipTitle(e.target.value)}
                placeholder="Give your 30-second highlight a title..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 focus:border-[#d4af37] text-white text-xs outline-none transition-colors"
                maxLength={90}
                required
              />
            </div>

            {/* Destination Info Note */}
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/90 text-xs text-zinc-300 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-[#fce7b0]">
                <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Gallery & Highlight Tagging</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                This 30-second clip will be saved directly into <strong className="text-zinc-200">{stream.creatorName}&apos;s Content Gallery</strong> under the <span className="text-[#fce7b0] font-semibold">Highlight</span> label, permanently viewable by fans with clipper attribution to <strong className="text-zinc-200">@{currentUser.username}</strong>.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] hover:brightness-110 text-black font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Clipping 30s...' : 'Save Highlight to Gallery'}</span>
              </button>
            </div>

          </form>
        ) : (
          /* Celebratory Confirmation Screen */
          <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#d4af37]">
                Saved as Highlight
              </span>
              <h4 className="text-lg font-bold text-white mt-1">
                Clip Successfully Captured!
              </h4>
              <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                &ldquo;{clipTitle}&rdquo; is now permanently saved in {stream.creatorName}&apos;s content gallery.
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs text-zinc-200 font-medium flex items-center gap-1.5 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>{copiedLink ? 'Link Copied!' : 'Share Clip'}</span>
              </button>

              {onNavigateToGallery && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToGallery(stream.creatorId);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in Gallery</span>
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-xs text-zinc-400 hover:text-white pt-2 block mx-auto transition-colors"
            >
              Return to Livestream
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
