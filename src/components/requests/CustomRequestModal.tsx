import React, { useState } from 'react';
import { CreatorProfile } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Clapperboard, ShieldCheck, Clock, FileText, User } from 'lucide-react';

interface CustomRequestModalProps {
  creator: CreatorProfile;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustomRequestModal: React.FC<CustomRequestModalProps> = ({
  creator,
  onClose,
  onSuccess
}) => {
  const { createCustomVideoRequest, currentUser } = useApp();

  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [recipientName, setRecipientName] = useState(currentUser.name);
  const [durationMinutes, setDurationMinutes] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pricing based on duration
  const basePrice = creator.customRequestBasePrice || 120;
  const totalPrice = durationMinutes === 1 ? basePrice : basePrice + (durationMinutes - 1) * 35;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !instructions.trim()) {
      setError('Please provide a title and detailed instructions for the creator.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = createCustomVideoRequest({
      creatorId: creator.id,
      title,
      instructions,
      recipientName,
      videoDurationMinutes: durationMinutes,
      price: totalPrice
    });

    setIsSubmitting(false);

    if (result.success) {
      onSuccess();
      onClose();
    } else {
      setError(result.error || 'Failed to place request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 border-b border-[#27272a] pb-4">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center">
            <Clapperboard className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-base">Request Personalized Video</h3>
            <div className="text-xs text-neutral-400">From {creator.name} · Delivery in ~{creator.customRequestDeliveryDays} days</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Request Title or Occasion
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Fashion Styling Feedback or Birthday Dedication"
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                For Who? (Recipient Name)
              </label>
              <input
                type="text"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Video Duration
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
              >
                <option value={1}>1 Minute</option>
                <option value={2}>2 Minutes (Recommended)</option>
                <option value={3}>3 Minutes</option>
                <option value={5}>5 Minutes Extended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Detailed Instructions & Specific Guidance
            </label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Explain exactly what you would like the creator to say, review, or demonstrate..."
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Escrow Protection Box */}
          <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-[#d4af37] font-semibold text-[11px]">
              <ShieldCheck className="w-4 h-4" />
              <span>Acovon Escrow Payment Protection</span>
            </div>
            <p className="text-neutral-400 text-[11px] leading-relaxed">
              Your payment is safely held in platform escrow. The creator is paid only after delivering the completed video and your approval.
            </p>
          </div>

          {/* Pricing Summary */}
          <div className="flex items-center justify-between pt-2 border-t border-[#27272a]">
            <div>
              <div className="text-[11px] text-neutral-400">Total Escrow Deposit</div>
              <div className="text-lg font-bold font-mono text-[#fce7b0]">${totalPrice.toFixed(2)}</div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-neutral-400">Your Wallet Balance</div>
              <div className="text-xs font-mono text-neutral-300">${currentUser.walletBalance.toFixed(2)}</div>
            </div>
          </div>

          {error && (
            <div className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/40 p-2.5 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
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
              {isSubmitting ? 'Booking...' : `Deposit $${totalPrice.toFixed(2)} & Request`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
