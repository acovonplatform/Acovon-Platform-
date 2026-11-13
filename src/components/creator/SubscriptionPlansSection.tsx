import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, CreatorTier } from '../../types';
import { 
  Plus, 
  Crown, 
  Check, 
  Trash2, 
  Edit3, 
  Power, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  DollarSign, 
  Radio, 
  Film, 
  ShieldCheck, 
  X,
  Tag,
  Star,
  Flame,
  Diamond
} from 'lucide-react';

interface SubscriptionPlansSectionProps {
  onOpenPreview?: () => void;
}

// Preset benefits creators can select
const PRESET_BENEFITS = [
  'Access to subscriber-only photos',
  'Access to subscriber-only videos',
  'Exclusive creator posts & diary updates',
  'Subscriber-only livestreams access',
  'Access to selected special livestream events',
  'Exclusive 4K uncompressed media galleries',
  'Subscriber-only behind-the-scenes content',
  'Priority direct messaging capability',
  '15% discount on 1-on-1 private video calls',
  'Priority queue for custom video requests',
  'Free monthly PPV vault unlock token',
  'Supporter badge on live broadcast chat'
];

export const SubscriptionPlansSection: React.FC<SubscriptionPlansSectionProps> = ({
  onOpenPreview
}) => {
  const { 
    currentUser, 
    addCreatorSubscriptionPlan, 
    updateCreatorSubscriptionPlan, 
    deleteCreatorSubscriptionPlan,
    toggleCreatorSubscriptionPlanActive,
    subscriptions
  } = useApp();

  const creator = currentUser as CreatorProfile;
  const tiers = creator.tiers || [];

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTierId, setEditingTierId] = useState<string | null>(null);

  // Form Fields
  const [planName, setPlanName] = useState('');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(9.99);
  const [annualPrice, setAnnualPrice] = useState<string>('');
  const [description, setDescription] = useState('');
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    'Access to subscriber-only photos',
    'Access to subscriber-only videos',
    'Exclusive creator posts & diary updates'
  ]);
  const [customPerkInput, setCustomPerkInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [introductoryOffer, setIntroductoryOffer] = useState('');
  const [promotionalDiscount, setPromotionalDiscount] = useState<string>('');

  // Toast notices & inline delete confirmation
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDeleteTierId, setConfirmDeleteTierId] = useState<string | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedbackNotice({ type, message });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  // Open modal for creating new plan
  const handleOpenCreateModal = () => {
    setEditingTierId(null);
    setPlanName('');
    setMonthlyPrice(14.99);
    setAnnualPrice('');
    setDescription('');
    setSelectedPerks([
      'Access to subscriber-only photos',
      'Access to subscriber-only videos',
      'Exclusive creator posts & diary updates',
      'Subscriber-only livestreams access'
    ]);
    setCustomPerkInput('');
    setIsActive(true);
    setIntroductoryOffer('');
    setPromotionalDiscount('');
    setIsEditorOpen(true);
  };

  // Open modal for editing existing plan
  const handleOpenEditModal = (tier: CreatorTier) => {
    setEditingTierId(tier.id);
    setPlanName(tier.name);
    setMonthlyPrice(tier.price);
    setAnnualPrice(tier.annualPrice ? tier.annualPrice.toString() : '');
    setDescription(tier.description || '');
    setSelectedPerks(tier.perks || []);
    setCustomPerkInput('');
    setIsActive(tier.isActive !== false);
    setIntroductoryOffer(tier.introductoryOffer || '');
    setPromotionalDiscount(tier.promotionalDiscount ? tier.promotionalDiscount.toString() : '');
    setIsEditorOpen(true);
  };

  // Toggle perk in selected list
  const handleTogglePerk = (perk: string) => {
    if (selectedPerks.includes(perk)) {
      if (selectedPerks.length === 1) return; // Keep at least one perk
      setSelectedPerks(prev => prev.filter(p => p !== perk));
    } else {
      setSelectedPerks(prev => [...prev, perk]);
    }
  };

  // Add custom perk
  const handleAddCustomPerk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPerkInput.trim()) return;
    if (!selectedPerks.includes(customPerkInput.trim())) {
      setSelectedPerks(prev => [...prev, customPerkInput.trim()]);
    }
    setCustomPerkInput('');
  };

  // Save Plan (Create or Update)
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();

    if (!planName.trim()) {
      showFeedback('error', 'Please enter a valid plan name.');
      return;
    }
    if (monthlyPrice <= 0) {
      showFeedback('error', 'Monthly price must be at least $1.00.');
      return;
    }
    if (selectedPerks.length === 0) {
      showFeedback('error', 'Please select or add at least one subscriber perk.');
      return;
    }

    const annualPriceNum = annualPrice ? parseFloat(annualPrice) : undefined;
    const promoDiscountNum = promotionalDiscount ? parseInt(promotionalDiscount, 10) : undefined;

    if (editingTierId) {
      // Update
      const res = updateCreatorSubscriptionPlan(creator.id, editingTierId, {
        name: planName.trim(),
        price: monthlyPrice,
        annualPrice: annualPriceNum,
        description: description.trim(),
        perks: selectedPerks,
        isActive,
        introductoryOffer: introductoryOffer.trim() || undefined,
        promotionalDiscount: promoDiscountNum
      });

      if (res.success) {
        showFeedback('success', `Plan "${planName}" updated successfully!`);
        setIsEditorOpen(false);
      } else {
        showFeedback('error', res.error || 'Failed to update plan.');
      }
    } else {
      // Create new
      const res = addCreatorSubscriptionPlan(creator.id, {
        name: planName.trim(),
        price: monthlyPrice,
        annualPrice: annualPriceNum,
        description: description.trim(),
        perks: selectedPerks,
        isActive,
        introductoryOffer: introductoryOffer.trim() || undefined,
        promotionalDiscount: promoDiscountNum
      });

      if (res.success) {
        showFeedback('success', `New subscription plan "${planName}" created and active!`);
        setIsEditorOpen(false);
      } else {
        showFeedback('error', res.error || 'Failed to create plan.');
      }
    }
  };

  // Toggle active/inactive
  const handleToggleActive = (planId: string, currentActive: boolean) => {
    const res = toggleCreatorSubscriptionPlanActive(creator.id, planId);
    if (res.success) {
      showFeedback('success', `Plan is now ${res.isActive ? 'Active and discoverable' : 'Inactive (hidden from new fans)'}.`);
    } else {
      showFeedback('error', res.error || 'Failed to toggle plan status.');
    }
  };

  // Delete plan (two-step inline confirmation instead of window.confirm)
  const handleDeletePlan = (planId: string, planName: string) => {
    if (tiers.length <= 1) {
      showFeedback('error', 'You must maintain at least one subscription plan for your fanbase.');
      return;
    }
    if (confirmDeleteTierId !== planId) {
      setConfirmDeleteTierId(planId);
      return;
    }
    const res = deleteCreatorSubscriptionPlan(creator.id, planId);
    setConfirmDeleteTierId(null);
    if (res.success) {
      showFeedback('success', res.error ? res.error : `Plan "${planName}" has been removed.`);
    } else {
      showFeedback('error', res.error || 'Failed to delete plan.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26262b]">
        <div>
          <h2 className="text-xl font-bold font-brand text-white flex items-center gap-2">
            <span>Subscription Plans Management</span>
            <Crown className="w-5 h-5 text-[#d4af37]" />
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Create and configure multiple subscription tiers, custom pricing, subscriber perks, and promotional offers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#fce7b0] bg-[#1a1810] border border-[#d4af37]/40 hover:bg-[#242116] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Preview Fan View</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Create New Plan</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedbackNotice && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200 ${
          feedbackNotice.type === 'success'
            ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300'
            : 'bg-red-950/50 border border-red-500/40 text-red-300'
        }`}>
          {feedbackNotice.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedbackNotice.message}</span>
        </div>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-5">
        {tiers.map((tier) => {
          const isPlanActive = tier.isActive !== false;
          // Count active subscribers for this tier
          const activeSubscribers = subscriptions.filter(
            s => s.creatorId === creator.id && s.tierId === tier.id && s.status === 'active'
          ).length;

          return (
            <div
              key={tier.id}
              className={`bg-[#121215] border rounded-2xl p-5 flex flex-col justify-between transition-all relative overflow-hidden ${
                isPlanActive
                  ? 'border-[#27272a] hover:border-[#3d3d48] shadow-xl'
                  : 'border-neutral-800/60 opacity-65 bg-[#0e0e11]'
              }`}
            >
              {/* Top Row: Plan Name & Status Badge */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-[#d4af37] font-bold block">
                      {tier.name}
                    </span>
                    {tier.description && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2 mt-0.5">
                        {tier.description}
                      </p>
                    )}
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    isPlanActive
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-neutral-800 text-neutral-400 border border-neutral-700'
                  }`}>
                    {isPlanActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Price Display */}
                <div className="flex flex-wrap items-baseline gap-1.5 my-3">
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">
                    ${tier.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-neutral-400">/ month</span>

                  {tier.annualPrice && (
                    <span className="text-[11px] text-[#fce7b0] font-mono ml-auto tabular-nums">
                      ${tier.annualPrice.toFixed(2)} / yr
                    </span>
                  )}
                </div>

                {/* Promotional Badges */}
                {tier.introductoryOffer && (
                  <div className="mb-3 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center gap-1.5 font-medium">
                    <Tag className="w-3 h-3 text-[#d4af37]" />
                    <span>Offer: {tier.introductoryOffer}</span>
                  </div>
                )}

                {/* Perks Checklist */}
                <div className="border-t border-[#1f1f23] pt-3 space-y-2 mb-4 text-xs text-neutral-300">
                  {tier.perks.slice(0, 5).map((perk, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-tight text-neutral-300">{perk}</span>
                    </div>
                  ))}
                  {tier.perks.length > 5 && (
                    <span className="text-[10px] text-neutral-500 block pl-5 font-mono">
                      + {tier.perks.length - 5} more benefits
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions & Subscriber Stats */}
              <div className="pt-3 border-t border-[#1f1f23] space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-400 text-[11px]">Subscribers:</span>
                  <span className="font-mono text-white font-semibold tabular-nums">
                    {activeSubscribers} active
                  </span>
                </div>

                {confirmDeleteTierId === tier.id ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-red-950/40 border border-red-500/40">
                    <span className="text-[11px] text-red-200 font-medium">Retire "{tier.name}"?</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteTierId(null)}
                        className="px-2.5 py-1 rounded-lg bg-[#1c1c22] text-neutral-300 text-[11px] font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlan(tier.id, tier.name)}
                        className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(tier)}
                      className="flex-1 py-1.5 px-2 bg-[#1c1c22] hover:bg-[#25252e] border border-[#27272a] text-neutral-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleActive(tier.id, isPlanActive)}
                      className={`p-2 rounded-xl border text-xs transition-colors cursor-pointer ${
                        isPlanActive
                          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/60'
                          : 'bg-neutral-800/40 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
                      }`}
                      title={isPlanActive ? 'Deactivate (hide from new fans)' : 'Activate plan'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePlan(tier.id, tier.name)}
                      className="p-2 bg-[#1c1c22] hover:bg-red-950/40 border border-[#27272a] hover:border-red-500/40 text-neutral-400 hover:text-red-400 rounded-xl text-xs transition-colors cursor-pointer"
                      title="Delete plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: Plan Creator & Editor */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-3xl w-full my-auto max-h-[92dvh] acovon-modal-panel overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-[#26262b] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Crown className="w-5 h-5 text-[#d4af37] shrink-0" />
                <h3 className="text-sm font-bold text-white tracking-wide truncate">
                  {editingTierId ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Two-column Form & Live Preview */}
            <form onSubmit={handleSavePlan} className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 min-h-0 overflow-y-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left Form: 7 cols */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Plan Name */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      value={planName}
                      onChange={(e) => setPlanName(e.target.value)}
                      placeholder="e.g. VIP All-Access Vault or Patron Circle"
                      className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
                      required
                    />
                  </div>

                  {/* Pricing Fields */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Monthly Price ($ USD) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="999"
                          value={monthlyPrice}
                          onChange={(e) => setMonthlyPrice(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Annual Price ($ USD, Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          min="5"
                          placeholder="e.g. 119.99"
                          value={annualPrice}
                          onChange={(e) => setAnnualPrice(e.target.value)}
                          className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2 text-xs text-white font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Plan Description */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Plan Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={2}
                      placeholder="Brief summary explaining who this tier is for and what makes it special..."
                      className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed"
                    />
                  </div>

                  {/* Promotional Offers */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Introductory Offer (Optional)
                      </label>
                      <input
                        type="text"
                        value={introductoryOffer}
                        onChange={(e) => setIntroductoryOffer(e.target.value)}
                        placeholder="e.g. $4.99 for month 1"
                        className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                        Promotional Discount %
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="90"
                        value={promotionalDiscount}
                        onChange={(e) => setPromotionalDiscount(e.target.value)}
                        placeholder="e.g. 20 (for 20% off)"
                        className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Plan Visibility Toggle */}
                  <div className="flex items-center justify-between gap-3 p-3 bg-[#18181c] rounded-xl border border-[#26262b]">
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white">Plan Active Status</div>
                      <div className="text-[11px] text-neutral-400">
                        Active plans appear on your profile and in the subscription selector.
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsActive(!isActive)}
                      className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        isActive ? 'bg-[#d4af37]' : 'bg-neutral-700'
                      }`}
                    >
                      <span className={`block w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                        isActive ? 'right-1' : 'left-1'
                      }`} />
                    </button>
                  </div>

                  {/* Benefits Checklist */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-neutral-300">
                      Subscriber Benefits ({selectedPerks.length} selected) *
                    </label>
                    <div className="max-h-48 overflow-y-auto pr-1 space-y-1.5 border border-[#26262b] rounded-xl p-3 bg-[#16161a]">
                      {PRESET_BENEFITS.map((perk) => {
                        const checked = selectedPerks.includes(perk);
                        return (
                          <div
                            key={perk}
                            onClick={() => handleTogglePerk(perk)}
                            className={`p-2 rounded-lg text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                              checked ? 'bg-[#22222a] text-white' : 'hover:bg-[#1a1a20] text-neutral-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {}}
                              className="accent-[#d4af37] pointer-events-none"
                            />
                            <span>{perk}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Add Custom Perk */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Add Custom Perk
                    </label>
                    <div className="flex flex-col xs:flex-row gap-2">
                      <input
                        type="text"
                        value={customPerkInput}
                        onChange={(e) => setCustomPerkInput(e.target.value)}
                        placeholder="e.g. Free admission to Berlin workshop..."
                        className="flex-1 min-w-0 bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomPerk}
                        className="px-3 py-2 bg-[#22222a] hover:bg-[#2b2b36] border border-[#33333f] text-neutral-200 text-xs font-semibold rounded-xl cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Live Card Preview (5 cols) */}
                <div className="lg:col-span-5 space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Fan View Preview</span>
                  </div>

                  <div className="bg-[#16161a] border-2 border-[#d4af37]/60 rounded-2xl p-5 space-y-4 shadow-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-xs uppercase tracking-wider font-bold text-[#d4af37]">
                          {planName || 'Plan Name Preview'}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-1">
                          {description || 'Subscribers to this tier unlock premium releases and direct access.'}
                        </p>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                        {isActive ? 'Live' : 'Draft'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold font-mono text-white tabular-nums">
                        ${monthlyPrice.toFixed(2)}
                      </span>
                      <span className="text-xs text-neutral-400">/ month</span>
                    </div>

                    {introductoryOffer && (
                      <div className="px-2.5 py-1 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fce7b0] text-[11px] font-semibold">
                        ★ {introductoryOffer}
                      </div>
                    )}

                    <div className="border-t border-[#26262b] pt-3 space-y-2 text-xs text-neutral-300">
                      {selectedPerks.map((p, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                          <span className="text-[11px] leading-tight">{p}</span>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled
                      className="w-full py-2.5 bg-[#d4af37] text-black font-bold text-xs rounded-xl shadow-md cursor-not-allowed opacity-90"
                    >
                      Join {planName || 'Tier'} · ${monthlyPrice.toFixed(2)}/mo
                    </button>
                  </div>
                </div>

              </div>

              {/* Modal Footer Buttons */}
              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-[#26262b]">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{editingTierId ? 'Save & Update Plan' : 'Publish Subscription Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
