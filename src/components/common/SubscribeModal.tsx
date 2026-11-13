import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Crown, 
  ShieldCheck, 
  Wallet, 
  Plus, 
  Check, 
  ExternalLink,
  Lock,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { CreatorTier } from '../../types';

interface SubscribeModalProps {
  creatorId: string;
  onClose: () => void;
  onSuccess?: (tierName: string) => void;
  onDepositFunds?: () => void;
}

export const SubscribeModal: React.FC<SubscribeModalProps> = ({
  creatorId,
  onClose,
  onSuccess,
  onDepositFunds
}) => {
  const { 
    creators, 
    currentUser, 
    subscribeToCreator, 
    isSubscribedTo, 
    getSubscriptionTier,
    depositFunds,
    cancelSubscription
  } = useApp();

  const creator = creators.find(c => c.id === creatorId) || creators[0];
  const isAlreadySubscribed = isSubscribedTo(creator.id);
  const activeSubscription = getSubscriptionTier(creator.id);

  // Available active tiers
  const allTiers: CreatorTier[] = creator.tiers && creator.tiers.length > 0 ? creator.tiers : [
    {
      id: `${creator.id}_standard`,
      name: 'Standard Access',
      price: 9.99,
      perks: ['Unlock all subscriber-only photos & videos', 'Direct creator messaging capability', 'Early access to public drops'],
      isActive: true
    },
    {
      id: `${creator.id}_vip`,
      name: 'VIP All-Access Vault',
      price: 24.99,
      perks: ['All Standard Access perks', 'Full 4K uncompressed video vault releases', 'Free access to tier-exclusive livestreams', '10% discount on PPV and 1-on-1 calls'],
      isActive: true
    }
  ];

  const tiers = allTiers.filter(t => t.isActive !== false);

  const [selectedTierId, setSelectedTierId] = useState<string>(
    activeSubscription?.tierId || tiers[0]?.id || ''
  );
  const [subscribing, setSubscribing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [depositedNotice, setDepositedNotice] = useState<string | null>(null);

  const selectedTier = tiers.find(t => t.id === selectedTierId) || tiers[0];
  const hasEnoughFunds = currentUser.walletBalance >= selectedTier.price;
  const fundsDifference = Number((selectedTier.price - currentUser.walletBalance).toFixed(2));

  const handleSubscribe = () => {
    setErrorMessage(null);
    if (!hasEnoughFunds) {
      setErrorMessage(`Insufficient wallet balance. Please add at least $${fundsDifference.toFixed(2)} to subscribe.`);
      return;
    }

    setSubscribing(true);
    const result = subscribeToCreator(creator.id, selectedTier.id);
    setSubscribing(false);

    if (result.success) {
      setSuccessMessage(`Welcome! You are now subscribed to ${creator.name} on the ${selectedTier.name} tier.`);
      if (onSuccess) onSuccess(selectedTier.name);
      setTimeout(() => {
        onClose();
      }, 1600);
    } else {
      setErrorMessage(result.error || 'Failed to complete subscription');
    }
  };

  const handleQuickDeposit = (amount: number) => {
    depositFunds(amount);
    setDepositedNotice(`Added $${amount.toFixed(2)} to wallet! New Balance: $${(currentUser.walletBalance + amount).toFixed(2)}`);
    setErrorMessage(null);
    setTimeout(() => setDepositedNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl max-w-lg w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto acovon-modal-panel">
        
        {/* Creator Hero Header */}
        <div className="relative h-28 sm:h-32 shrink-0 bg-gradient-to-r from-[#211a0e] via-[#16161b] to-[#121215] p-4 sm:p-5 flex items-end">
          <img 
            src={creator.coverImage} 
            alt={creator.name} 
            className="absolute inset-0 w-full h-full object-cover opacity-30" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-[#121215]/60 to-transparent" />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 hover:bg-black text-neutral-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="relative z-10 flex items-center gap-3">
            <img 
              src={creator.avatar} 
              alt={creator.name} 
              className="w-14 h-14 rounded-2xl object-cover border-2 border-[#d4af37] shadow-lg" 
            />
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-brand font-bold text-base text-white">{creator.name}</h3>
                {creator.isVerified && (
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                )}
              </div>
              <p className="text-xs text-neutral-400">@{creator.username} · {creator.category}</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Active Subscription Status Banner */}
          {isAlreadySubscribed && activeSubscription && (
            <div className="p-3.5 bg-emerald-950/40 border border-emerald-500/40 rounded-2xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Active Member</span>
                    <span className="text-[10px] text-emerald-300 font-normal">({activeSubscription.tierName})</span>
                  </div>
                  <div className="text-[11px] text-emerald-200/80">
                    Auto-renews on {activeSubscription.nextRenewalDate} · ${activeSubscription.monthlyPrice.toFixed(2)}/mo
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm(`Cancel auto-renew for ${creator.name}? Access continues until ${activeSubscription.nextRenewalDate}.`)) {
                    cancelSubscription(activeSubscription.id);
                  }
                }}
                className="text-[11px] text-neutral-400 hover:text-red-400 underline cursor-pointer shrink-0"
              >
                Cancel Auto-Renew
              </button>
            </div>
          )}

          {/* Success Message */}
          {successMessage ? (
            <div className="p-8 text-center space-y-3 bg-[#18181f] border border-[#d4af37]/40 rounded-2xl animate-in zoom-in-95">
              <div className="w-14 h-14 rounded-full bg-[#d4af37]/20 border border-[#d4af37] flex items-center justify-center mx-auto text-[#d4af37]">
                <Sparkles className="w-7 h-7 animate-spin" />
              </div>
              <h4 className="text-base font-bold text-white">Membership Activated!</h4>
              <p className="text-xs text-neutral-300 max-w-sm mx-auto">{successMessage}</p>
              <p className="text-[11px] text-neutral-400">All subscriber-only photos and videos are now unlocked.</p>
            </div>
          ) : (
            <>
              {/* Tiers Selection */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center justify-between">
                  <span>Select Subscription Tier</span>
                  <span className="text-[11px] text-[#d4af37] lowercase">cancel anytime</span>
                </label>

                <div className="grid grid-cols-1 gap-2.5">
                  {tiers.map((tier) => {
                    const isSelected = tier.id === selectedTierId;
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTierId(tier.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                          isSelected
                            ? 'bg-[#18181f] border-[#d4af37] shadow-lg shadow-[#d4af37]/10'
                            : 'bg-[#141418] border-[#27272a] hover:border-neutral-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected ? 'border-[#d4af37] bg-[#d4af37]' : 'border-neutral-600'
                            }`}>
                              {isSelected && <Check className="w-3 h-3 text-black stroke-[3]" />}
                            </div>
                            <div>
                              <div className="text-sm font-bold text-white flex items-center gap-2">
                                <span>{tier.name}</span>
                                {tier.discount3Month && (
                                  <span className="text-[10px] bg-[#d4af37]/20 text-[#fce7b0] px-1.5 py-0.2 rounded font-mono">
                                    {tier.discount3Month}% off 3mo
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-neutral-400 mt-0.5">
                                {tier.description || 'Full access to subscriber vault, livestreams & posts'}
                              </div>
                              {tier.introductoryOffer && (
                                <div className="mt-1 inline-block px-1.5 py-0.2 rounded bg-amber-950/40 border border-amber-500/30 text-[10px] text-amber-300 font-medium">
                                  ★ {tier.introductoryOffer}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className="text-base font-extrabold font-mono text-[#fce7b0]">
                              ${tier.price.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-neutral-500 uppercase tracking-wider">
                              / month
                            </div>
                            {tier.annualPrice && (
                              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                ${tier.annualPrice.toFixed(2)} / yr
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Perks List */}
                        {tier.perks && tier.perks.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-[#26262b] grid grid-cols-1 gap-1.5">
                            {tier.perks.map((perk, i) => (
                              <div key={i} className="flex items-center gap-2 text-[11px] text-neutral-300">
                                <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                                <span>{perk}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Wallet Balance & Quick Deposit Bar */}
              <div className="p-3.5 bg-[#16161b] rounded-2xl border border-[#27272a] space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-neutral-300">
                    <Wallet className="w-4 h-4 text-[#d4af37]" />
                    <span>Your Acovon Wallet:</span>
                  </div>
                  <span className={`font-mono font-bold ${hasEnoughFunds ? 'text-emerald-400' : 'text-amber-400'}`}>
                    ${currentUser.walletBalance.toFixed(2)}
                  </span>
                </div>

                {!hasEnoughFunds && (
                  <div className="pt-2 border-t border-[#26262b]">
                    <div className="text-[11px] text-neutral-400 mb-2 flex items-center justify-between">
                      <span>Need +${fundsDifference.toFixed(2)} more. 1-Click Quick Deposit:</span>
                    </div>
                    <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                      {[10, 25, 50, 100].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => handleQuickDeposit(amt)}
                          className="py-1.5 bg-[#202028] hover:bg-[#282834] text-[#fce7b0] border border-[#33333f] hover:border-[#d4af37]/40 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer"
                        >
                          +${amt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {depositedNotice && (
                  <div className="text-[11px] text-emerald-400 font-medium animate-in fade-in">
                    {depositedNotice}
                  </div>
                )}
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-[#d4af37] via-[#f1d07c] to-[#d4af37] hover:brightness-110 text-black font-extrabold text-sm rounded-2xl shadow-xl shadow-[#d4af37]/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Crown className="w-4 h-4 text-black fill-black" />
                  <span>
                    {subscribing ? 'Activating Membership...' : `Confirm & Subscribe ($${selectedTier.price.toFixed(2)}/mo)`}
                  </span>
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 text-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
                  <span>256-bit encrypted checkout · Cancel anytime with 1 tap in settings</span>
                </div>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
