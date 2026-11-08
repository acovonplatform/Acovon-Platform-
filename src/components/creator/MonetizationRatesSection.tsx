import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile } from '../../types';
import { 
  Coins, 
  Video, 
  PhoneCall, 
  MessageSquare, 
  Radio, 
  Gift, 
  Crown, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle,
  HelpCircle,
  Clock,
  Sparkles
} from 'lucide-react';

interface MonetizationRatesSectionProps {
  onNavigateToPlans?: () => void;
}

export const MonetizationRatesSection: React.FC<MonetizationRatesSectionProps> = ({
  onNavigateToPlans
}) => {
  const { currentUser, updateCreatorPricing } = useApp();
  const creator = currentUser as CreatorProfile;

  // Local state for all monetization pricing settings
  const [callRatePerMinute, setCallRatePerMinute] = useState<number>(creator.callRatePerMinute || 6.50);
  const [isLiveForCalls, setIsLiveForCalls] = useState<boolean>(creator.isLiveForCalls !== false);
  const [instantCallsEnabled, setInstantCallsEnabled] = useState<boolean>(creator.instantCallsEnabled !== false);
  const [minCallMinutes, setMinCallMinutes] = useState<number>(creator.minCallMinutes || 5);
  const [maxCallMinutes, setMaxCallMinutes] = useState<number>(creator.maxCallMinutes || 60);

  const [privateVideoRate, setPrivateVideoRate] = useState<number>(creator.privateVideoRate || 49.99);
  
  const [acceptingCustomRequests, setAcceptingCustomRequests] = useState<boolean>(creator.acceptingCustomRequests !== false);
  const [customRequestBasePrice, setCustomRequestBasePrice] = useState<number>(creator.customRequestBasePrice || 150.00);
  const [customRequestDeliveryDays, setCustomRequestDeliveryDays] = useState<number>(creator.customRequestDeliveryDays || 3);
  const [customRequestTerms, setCustomRequestTerms] = useState<string>(
    creator.customRequestTerms || 'Personalized video messages, customized reviews, and dedicated creative requests.'
  );

  const [paidMessagePrice, setPaidMessagePrice] = useState<number>(creator.paidMessagePrice || 15.00);
  const [livestreamTicketPrice, setLivestreamTicketPrice] = useState<number>(creator.livestreamTicketPrice || 19.99);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReset = () => {
    setCallRatePerMinute(creator.callRatePerMinute || 6.50);
    setIsLiveForCalls(creator.isLiveForCalls !== false);
    setInstantCallsEnabled(creator.instantCallsEnabled !== false);
    setMinCallMinutes(creator.minCallMinutes || 5);
    setMaxCallMinutes(creator.maxCallMinutes || 60);
    setPrivateVideoRate(creator.privateVideoRate || 49.99);
    setAcceptingCustomRequests(creator.acceptingCustomRequests !== false);
    setCustomRequestBasePrice(creator.customRequestBasePrice || 150.00);
    setCustomRequestDeliveryDays(creator.customRequestDeliveryDays || 3);
    setCustomRequestTerms(creator.customRequestTerms || '');
    setPaidMessagePrice(creator.paidMessagePrice || 15.00);
    setLivestreamTicketPrice(creator.livestreamTicketPrice || 19.99);
    setErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (callRatePerMinute < 1) {
      setErrorMessage('Video call rate must be at least $1.00 per minute.');
      return;
    }
    if (minCallMinutes < 1 || minCallMinutes > maxCallMinutes) {
      setErrorMessage('Minimum call duration cannot exceed maximum call duration.');
      return;
    }
    if (customRequestBasePrice < 5) {
      setErrorMessage('Custom video request base price must be at least $5.00.');
      return;
    }

    const res = updateCreatorPricing(creator.id, {
      callRatePerMinute,
      isLiveForCalls,
      instantCallsEnabled,
      minCallMinutes,
      maxCallMinutes,
      privateVideoRate,
      acceptingCustomRequests,
      customRequestBasePrice,
      customRequestDeliveryDays,
      customRequestTerms,
      paidMessagePrice,
      livestreamTicketPrice
    });

    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to update monetization rates.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26262b]">
        <div>
          <h2 className="text-xl font-bold font-brand text-white flex items-center gap-2">
            <span>My Pricing &amp; Monetization</span>
            <Coins className="w-5 h-5 text-[#d4af37]" />
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Configure private video call rates, custom commission pricing, paid messages, and PPV tickets.
          </p>
        </div>

        {onNavigateToPlans && (
          <button
            type="button"
            onClick={onNavigateToPlans}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#fce7b0] bg-[#1a1810] border border-[#d4af37]/40 hover:bg-[#242116] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Manage Subscription Plans ({creator.tiers?.length || 0})</span>
          </button>
        )}
      </div>

      {/* Notifications */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>All monetization rates and commission terms saved successfully!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">

        {/* 1. Real-time Video Call Rates */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-[#d4af37]" />
              <span>Private 1-on-1 Video Call Rates</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
              PER-MINUTE ESCROW
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Fans pay per minute for private real-time WebRTC video calls. Funds are drawn incrementally and credited directly to your creator balance.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Rate Per Minute ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                <input
                  type="number"
                  step="0.50"
                  min="1"
                  max="50"
                  value={callRatePerMinute}
                  onChange={(e) => setCallRatePerMinute(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">e.g. $6.50/min ($390/hr)</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Min Call Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={minCallMinutes}
                onChange={(e) => setMinCallMinutes(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Max Call Duration (Minutes)
              </label>
              <input
                type="number"
                min="5"
                max="180"
                value={maxCallMinutes}
                onChange={(e) => setMaxCallMinutes(parseInt(e.target.value, 10) || 60)}
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-[#18181c] rounded-xl border border-[#26262b]">
              <div>
                <div className="text-xs font-semibold text-white">Live Calls Readiness</div>
                <div className="text-[11px] text-neutral-400">Show "Calls Ready" indicator on profile</div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveForCalls(!isLiveForCalls)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  isLiveForCalls ? 'bg-[#d4af37]' : 'bg-neutral-700'
                }`}
              >
                <span className={`block w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                  isLiveForCalls ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-[#18181c] rounded-xl border border-[#26262b]">
              <div>
                <div className="text-xs font-semibold text-white">Instant Call Initiation</div>
                <div className="text-[11px] text-neutral-400">Allow verified subscribers to ring directly</div>
              </div>
              <button
                type="button"
                onClick={() => setInstantCallsEnabled(!instantCallsEnabled)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  instantCallsEnabled ? 'bg-[#d4af37]' : 'bg-neutral-700'
                }`}
              >
                <span className={`block w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                  instantCallsEnabled ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* 2. Custom Video Requests & Commissions */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Video className="w-4 h-4 text-[#d4af37]" />
              <span>Custom Video Requests &amp; Commissions</span>
            </h3>
            <button
              type="button"
              onClick={() => setAcceptingCustomRequests(!acceptingCustomRequests)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                acceptingCustomRequests ? 'bg-[#d4af37]' : 'bg-neutral-700'
              }`}
            >
              <span className={`block w-4 h-4 rounded-full bg-black transition-transform absolute top-1 ${
                acceptingCustomRequests ? 'right-1' : 'left-1'
              }`} />
            </button>
          </div>

          <p className="text-xs text-neutral-400">
            Allow fans to submit personalized video commissions held in platform escrow until you deliver the completed recording.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Base Custom Video Price ($ USD) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                <input
                  type="number"
                  step="5"
                  min="10"
                  max="2500"
                  value={customRequestBasePrice}
                  onChange={(e) => setCustomRequestBasePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Standard Turnaround Time (Days)
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={customRequestDeliveryDays}
                onChange={(e) => setCustomRequestDeliveryDays(parseInt(e.target.value, 10) || 3)}
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              Creator Guidelines &amp; Commission Terms
            </label>
            <textarea
              value={customRequestTerms}
              onChange={(e) => setCustomRequestTerms(e.target.value)}
              rows={2}
              placeholder="Specify acceptable topics, personalized shoutouts, turnaround rules, and non-acceptable requests..."
              className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* 3. Private Video Rates, Paid Messages & PPV Livestream Tickets */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Coins className="w-4 h-4 text-[#d4af37]" />
            <span>Private Video, Message &amp; Ticket Pricing</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Private Video Rate ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={privateVideoRate}
                  onChange={(e) => setPrivateVideoRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Default rate for bespoke private media</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Paid Message Unlock Price ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                <input
                  type="number"
                  step="1"
                  min="1"
                  value={paidMessagePrice}
                  onChange={(e) => setPaidMessagePrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Price for locked direct chat messages</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                PPV Livestream Ticket Base ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-neutral-400 text-xs">$</span>
                <input
                  type="number"
                  step="1"
                  min="5"
                  value={livestreamTicketPrice}
                  onChange={(e) => setLivestreamTicketPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-7 pr-3 py-2.5 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <span className="text-[10px] text-neutral-500 mt-1 block">Standard ticket price for special live events</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-[#18181c] border border-[#27272a] hover:border-[#383842] transition-colors cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Pricing</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e5c07b] shadow-xl shadow-[#d4af37]/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Monetization Rates</span>
          </button>
        </div>

      </form>
    </div>
  );
};
