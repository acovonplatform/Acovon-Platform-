import React from 'react';
import { useApp } from '../../context/AppContext';
import { ExternalLink, Sparkles, ShieldCheck } from 'lucide-react';

interface AdBannerProps {
  placement?: 'feed' | 'explore' | 'sidebar';
  onGoAdFree: () => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement = 'feed', onGoAdFree }) => {
  const { adSettings, isSubscribedTo, creators } = useApp();

  // If ads are disabled in admin settings or user is subscribed to any creator, DO NOT show ads!
  const hasActiveSubscription = creators.some(c => isSubscribedTo(c.id));
  if (!adSettings.adsEnabled || hasActiveSubscription) {
    return null;
  }

  return (
    <div className="my-6 p-4 bg-[#0e0e12] border border-[#23232a] rounded-2xl relative overflow-hidden transition-all shadow-md">
      {/* Google AdSense / AdMob compliance header */}
      <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-2 border-b border-[#1c1c22] pb-1.5">
        <div className="flex items-center gap-1.5 font-sans">
          <span className="text-neutral-300 font-semibold">Ad</span>
          <span className="text-neutral-500">·</span>
          <span>Google AdSense / AdMob Network ({adSettings.adSensePublisherId})</span>
        </div>
        <button
          onClick={onGoAdFree}
          className="text-[#d4af37] hover:text-[#fce7b0] hover:underline flex items-center gap-1 cursor-pointer font-medium"
        >
          <Sparkles className="w-3 h-3" />
          <span>Remove Ads with VIP Pass</span>
        </button>
      </div>

      {/* Ad creative unit */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1c1c24] to-[#121216] border border-[#2e2e38] flex items-center justify-center shrink-0">
            <span className="font-brand text-[#d4af37] font-bold text-lg">L</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-white">Leica SL3 Mirrorless Cinema Edition</h4>
              <span className="text-[10px] text-neutral-400 font-mono">Sponsored</span>
            </div>
            <p className="text-[11px] text-neutral-300 line-clamp-1 leading-snug mt-0.5">
              Triple-resolution 60MP BSI-CMOS sensor & 8K cinema footage for elite video creators.
            </p>
          </div>
        </div>

        <a
          href="https://leica-camera.com"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-[#1c1c22] hover:bg-[#282832] border border-[#30303a] text-neutral-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
        >
          <span>Learn More</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Footer hint */}
      <div className="text-[10px] text-neutral-400 text-right pt-2 border-t border-[#1a1a20] flex items-center justify-between">
        <span className="text-neutral-400">Compliant with Google Web Advertising Guidelines</span>
        <span>Ad-Free for all paid subscribers</span>
      </div>
    </div>
  );
};
