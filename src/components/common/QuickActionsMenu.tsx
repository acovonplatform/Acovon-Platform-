import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Plus, 
  Radio, 
  FileText, 
  Sparkles, 
  Video, 
  ChevronRight,
  TrendingUp,
  Flame
} from 'lucide-react';

interface QuickActionsMenuProps {
  onOpenCreatePost: () => void;
  onOpenCreatorAd?: () => void;
}

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  onOpenCreatePost,
  onOpenCreatorAd
}) => {
  const { 
    isCurrentUserApprovedCreator,
    setIsCreateLiveModalOpen 
  } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isCurrentUserApprovedCreator) return null;

  const handleGoLive = () => {
    setIsOpen(false);
    setIsCreateLiveModalOpen(true);
  };

  const handleCreatePost = () => {
    setIsOpen(false);
    onOpenCreatePost();
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Create / Quick Action Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 min-h-[38px] min-w-[38px] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-black bg-gradient-to-r from-[#d4af37] via-[#f1d07c] to-[#d4af37] hover:brightness-110 rounded-xl transition-all shadow-md shadow-[#d4af37]/20 cursor-pointer focus:outline-none"
        title="Create & Quick Actions"
      >
        <Plus className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
        <span className="hidden sm:inline">Create</span>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-[calc(var(--acovon-header-height,58px)+4px)] w-auto max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 sm:max-w-none bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
          
          <div className="px-2 py-1.5 border-b border-[#27272a] mb-2 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Quick Actions
            </span>
            <span className="text-[10px] text-[#d4af37] font-medium">Acovon Studio</span>
          </div>

          <div className="space-y-1.5">
            {/* Action 1: Go Live (Prominent for Creators) */}
            <button
              onClick={handleGoLive}
              className="w-full p-3 rounded-xl bg-gradient-to-r from-red-950/40 via-[#1e1518] to-[#18181c] border border-red-500/30 hover:border-red-500/60 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500 group-hover:scale-105 transition-transform">
                    <Radio className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>Go Live</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-red-600 text-white uppercase tracking-wider">
                        Live
                      </span>
                    </div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Start public, subscriber, or PPV stream
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            {/* Action 2: Create Post */}
            <button
              onClick={handleCreatePost}
              className="w-full p-3 rounded-xl bg-[#18181c] hover:bg-[#202026] border border-[#27272a] hover:border-[#d4af37]/40 text-left transition-all group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] group-hover:scale-105 transition-transform">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">Create Post</div>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                      Publish photos, video preview, or pay-per-view
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
              </div>
            </button>

            {/* Optional Promotion campaign launcher if creator */}
            {onOpenCreatorAd && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenCreatorAd();
                }}
                className="w-full p-2.5 rounded-xl bg-[#15151a] hover:bg-[#1c1c22] border border-[#27272a] text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#22222a] flex items-center justify-center text-[#d4af37]">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-neutral-200">Promote Profile or Content</div>
                      <div className="text-[10px] text-neutral-400">Launch a boost campaign for more visibility</div>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white" />
                </div>
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
