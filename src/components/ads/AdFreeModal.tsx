import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Sparkles, Check, ShieldCheck, Heart } from 'lucide-react';

interface AdFreeModalProps {
  onClose: () => void;
  onExploreCreators: () => void;
}

export const AdFreeModal: React.FC<AdFreeModalProps> = ({ onClose, onExploreCreators }) => {
  const { currentUser, subscribeToCreator, creators } = useApp();
  const [successMsg, setSuccessMsg] = useState(false);

  const handleActivateAdFree = () => {
    // Subscribe to first creator's basic tier to gain platform-wide ad-free status
    const target = creators[0];
    const res = subscribeToCreator(target.id, target.tiers[0].id);
    if (res.success) {
      setSuccessMsg(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative animate-in zoom-in-95 acovon-modal-panel">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#d4af37]/20 to-[#8a6e18]/30 border border-[#d4af37]/40 flex items-center justify-center mb-4">
          <Sparkles className="w-6 h-6 text-[#d4af37]" />
        </div>

        <h3 className="text-xl font-bold text-white mb-1">
          Enjoy an Uninterrupted Ad-Free Experience
        </h3>
        <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
          While free users support the platform via Google AdSense & AdMob partner ads, any paid creator subscription immediately unlocks a 100% ad-free experience across all devices.
        </p>

        <div className="space-y-3 mb-6 text-xs">
          <div className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl flex items-start gap-3">
            <Check className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Zero Advertisements in Feed & Explore</div>
              <div className="text-neutral-400 text-[11px]">All AdSense banners & sponsored cards permanently hidden.</div>
            </div>
          </div>

          <div className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl flex items-start gap-3">
            <Check className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">Full Creator Support (80%+ Payout)</div>
              <div className="text-neutral-400 text-[11px]">Your subscription funds creators directly with instant member perks.</div>
            </div>
          </div>

          <div className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl flex items-start gap-3">
            <Check className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-white">High-Speed Video Streaming</div>
              <div className="text-neutral-400 text-[11px]">Priority buffer bandwidth for PPV vaults and private video calls.</div>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 mb-4 text-center">
            Ad-Free VIP Pass Activated! All ads have been removed.
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleActivateAdFree}
            className="w-full py-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer"
          >
            Activate Ad-Free VIP Pass (${creators[0]?.tiers[0]?.price || 9.99}/mo)
          </button>

          <button
            onClick={() => {
              onClose();
              onExploreCreators();
            }}
            className="w-full py-2.5 bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-300 text-xs rounded-xl transition-colors cursor-pointer"
          >
            Browse Creator Memberships
          </button>
        </div>

      </div>
    </div>
  );
};
