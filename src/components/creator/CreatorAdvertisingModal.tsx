import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile } from '../../types';
import { X, Rocket, Sparkles, TrendingUp, Check, DollarSign, Target, ShieldCheck } from 'lucide-react';

interface CreatorAdvertisingModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreatorAdvertisingModal: React.FC<CreatorAdvertisingModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { currentUser, createPromotionCampaign, posts } = useApp();

  const [promoType, setPromoType] = useState<'boost_profile' | 'promote_post' | 'featured_creator'>('boost_profile');
  const [selectedBudget, setSelectedBudget] = useState(25);
  const [customBudget, setCustomBudget] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const creator = currentUser as CreatorProfile;
  const myPosts = posts.filter(p => p.creatorId === creator.id);

  const budget = customBudget ? Number(customBudget) : selectedBudget;

  const packages = [
    { amt: 10, days: 3, label: 'Starter Exposure', impressions: '~3,500 impressions', desc: 'Boost into top discovery search results' },
    { amt: 25, days: 7, label: 'Growth Spotlight', impressions: '~12,000 impressions', desc: 'Top category banner & feed recommendation injection', popular: true },
    { amt: 50, days: 14, label: 'Premium Domination', impressions: '~30,000 impressions', desc: 'Featured Marquee position across web & mobile app' }
  ];

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(budget) || budget <= 0) {
      setError('Please select a valid advertising budget.');
      return;
    }

    if (currentUser.walletBalance < budget) {
      setError(`Insufficient wallet balance ($${currentUser.walletBalance.toFixed(2)}). Please deposit funds to launch this campaign.`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const packageTitle = promoType === 'boost_profile'
      ? 'Top Discovery Profile Boost'
      : promoType === 'promote_post'
      ? 'Spotlight Video Feed Promotion'
      : 'Frontpage Featured Creator Marquee';

    const res = createPromotionCampaign({
      creatorId: creator.id,
      creatorName: creator.name,
      type: promoType,
      targetPostId: selectedPostId || undefined,
      budget,
      packageTitle,
      durationDays: budget <= 10 ? 3 : budget <= 25 ? 7 : 14
    });

    setIsSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to launch promotion.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto animate-in zoom-in-95">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center">
            <Rocket className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Creator Self-Service Advertising</h3>
            <p className="text-xs text-neutral-400">Promote your profile and content across the global Acovon network.</p>
          </div>
        </div>

        <form onSubmit={handleLaunch} className="space-y-6 pt-4">
          
          {/* Promotion Objective */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              1. Choose What You Want to Promote
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'boost_profile' as const, label: 'Boost Profile', sub: 'Discovery & Explore Top Spot' },
                { id: 'promote_post' as const, label: 'Promote Video', sub: 'Injected into Main Feeds' },
                { id: 'featured_creator' as const, label: 'Featured Creator', sub: 'Homepage Marquee Banner' }
              ].map(opt => {
                const isSelected = promoType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPromoType(opt.id)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#fce7b0]'
                        : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-white">{opt.label}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* If promote post selected, pick which video/post */}
          {promoType === 'promote_post' && myPosts.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Select Video or Post to Spotlight
              </label>
              <select
                value={selectedPostId}
                onChange={(e) => setSelectedPostId(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value="">Select post...</option>
                {myPosts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.content.slice(0, 48)}... ({p.likesCount} likes)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Budget packages */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              2. Select Campaign Budget Package
            </label>
            <div className="space-y-2">
              {packages.map(pkg => {
                const isSelected = selectedBudget === pkg.amt && !customBudget;
                return (
                  <div
                    key={pkg.amt}
                    onClick={() => { setSelectedBudget(pkg.amt); setCustomBudget(''); }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#1e1e26] border-[#d4af37] shadow-lg shadow-[#d4af37]/10'
                        : 'bg-[#18181c] border-[#27272a] hover:border-[#383844]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{pkg.label}</span>
                        {pkg.popular && (
                          <span className="text-[9px] bg-[#d4af37] text-black font-bold px-1.5 py-0.5 rounded">RECOMMENDED</span>
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">{pkg.desc} · {pkg.days} Days</div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-[#fce7b0]">${pkg.amt}.00</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{pkg.impressions}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Budget */}
          <div>
            <label className="block text-xs font-medium text-neutral-400 mb-1">
              Or Specify Custom Campaign Budget ($ USD)
            </label>
            <input
              type="number"
              min="5"
              placeholder="e.g. 75.00"
              value={customBudget}
              onChange={(e) => setCustomBudget(e.target.value)}
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
            />
          </div>

          {/* Compliance note */}
          <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-neutral-300 font-semibold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Transparent Advertising Standards</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              All promoted placements are clearly badged with a sleek "Sponsored" label. Impressions are monitored in real time with conversion reporting.
            </p>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-xl text-xs">
              {error}
            </div>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
            <div>
              <div className="text-[11px] text-neutral-400">Your Wallet Balance</div>
              <div className="text-sm font-mono font-bold text-white">${currentUser.walletBalance.toFixed(2)}</div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Launching...' : `Launch Campaign · $${budget}.00`}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
