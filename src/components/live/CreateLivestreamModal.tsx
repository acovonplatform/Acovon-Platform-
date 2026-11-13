import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LivestreamAccessMode, CreatorProfile, RecordingMode, ReplayPermission } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import {
  X,
  Radio,
  Globe,
  Users,
  Crown,
  Ticket,
  Key,
  DollarSign,
  Gift,
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  ShieldCheck,
  Check,
  Film,
  Lock,
  Eye
} from 'lucide-react';

export const CreateLivestreamModal: React.FC = () => {
  const {
    isCreateLiveModalOpen,
    setIsCreateLiveModalOpen,
    createLivestream,
    currentUser,
    activeRole,
    creators
  } = useApp();

  const isCreator = currentUser.role === 'creator' || activeRole === 'creator';
  if (!isCreateLiveModalOpen || !isCreator) return null;

  const currentCreator: CreatorProfile = (currentUser.role === 'creator'
    ? (currentUser as CreatorProfile)
    : (creators.find(c => c.id === 'creator_elena') || creators[0])) as CreatorProfile;

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[1] || 'Fashion & Luxury');
  const [tagsInput, setTagsInput] = useState('LiveMasterclass, StudioBehindTheScenes');
  const [accessMode, setAccessMode] = useState<LivestreamAccessMode>('public');
  
  // Mode-specific configuration
  const [selectedTiers, setSelectedTiers] = useState<string[]>(
    currentCreator?.tiers?.map(t => t.id) || []
  );
  const [ppvTicketPrice, setPpvTicketPrice] = useState<number>(14.99);
  const [passcode, setPasscode] = useState<string>('ACOVON-VIP-88');
  const [maxViewers, setMaxViewers] = useState<number>(50);

  // Broadcast timing
  const [broadcastTiming, setBroadcastTiming] = useState<'now' | 'scheduled'>('now');
  const [scheduledDateTime, setScheduledDateTime] = useState('Tomorrow at 7:00 PM EST');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);

  // Monetization toggles
  const [enableTips, setEnableTips] = useState(true);
  const [enableGifts, setEnableGifts] = useState(true);
  const [enablePaidMessages, setEnablePaidMessages] = useState(true);
  const [enableHighlightedMessages, setEnableHighlightedMessages] = useState(true);
  const [subscribersOnlyChat, setSubscribersOnlyChat] = useState(false);
  const [minimumTip, setMinimumTip] = useState(2.00);

  // Cover image preset
  const [coverImage, setCoverImage] = useState<string>(
    '/src/assets/images/creator_cover_luxury_1793476684350.jpg'
  );

  // Recording & Replay Settings
  const [recordingMode, setRecordingMode] = useState<RecordingMode>('paid');
  const [recordingPrice, setRecordingPrice] = useState<string>('12.99');
  const [recordingCurrency] = useState<string>('USD');
  const [replayAvailability, setReplayAvailability] = useState<number | 'unlimited'>('unlimited');
  const [recordingDescription, setRecordingDescription] = useState<string>(
    'Official 1080p full-length server recording with live Q&A and studio commentary.'
  );
  const [replayPermission, setReplayPermission] = useState<ReplayPermission>('paid');
  const [includeReplayWithTicket, setIncludeReplayWithTicket] = useState<boolean>(false);
  const [participantConsentConfirmed, setParticipantConsentConfirmed] = useState<boolean>(true);

  const [error, setError] = useState<string>('');

  if (!isCreateLiveModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Please provide a title for your broadcast.');
      return;
    }

    if (accessMode === 'selected_plan' && selectedTiers.length === 0) {
      setError('Please select at least one eligible subscription tier.');
      return;
    }

    const parsedRecPrice = Number(recordingPrice);
    if (recordingMode === 'paid') {
      if (isNaN(parsedRecPrice) || parsedRecPrice < 1.99 || parsedRecPrice > 500) {
        setError('Please enter a valid Paid Recording price between $1.99 and $500.00.');
        return;
      }
    }

    if (recordingMode !== 'disabled' && !participantConsentConfirmed) {
      setError('Please confirm participant recording consent before launching a recorded livestream.');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    createLivestream({
      title: title.trim(),
      description: description.trim() || 'Join me live on Acovon for real-time demonstration, Q&A, and community interaction.',
      coverImage,
      category,
      tags: tags.length > 0 ? tags : ['AcovonLive'],
      accessMode,
      allowedTierIds: accessMode === 'selected_plan' ? selectedTiers : undefined,
      ppvTicketPrice: accessMode === 'pay_per_view' ? Number(ppvTicketPrice) : undefined,
      privatePasscode: accessMode === 'private_invite' ? passcode.trim() : undefined,
      expectedDurationMinutes: durationMinutes,
      scheduledFor: broadcastTiming === 'scheduled' ? scheduledDateTime : undefined,
      settings: {
        enableTips,
        enableGifts,
        enablePaidMessages,
        enableHighlightedMessages,
        subscribersOnlyChat,
        minimumTipAmount: minimumTip,
        maxViewers: accessMode === 'private_invite' ? maxViewers : undefined
      },
      recordingSettings: {
        mode: recordingMode,
        price: recordingMode === 'paid' ? Number(parsedRecPrice.toFixed(2)) : undefined,
        currency: recordingCurrency,
        availabilityDays: recordingMode !== 'disabled' ? replayAvailability : undefined,
        description: recordingMode !== 'disabled' ? recordingDescription.trim() : undefined,
        replayPermission:
          recordingMode === 'paid'
            ? 'paid'
            : recordingMode === 'free'
            ? replayPermission === 'paid'
              ? 'public'
              : replayPermission
            : 'public',
        allowedReplayTierIds:
          recordingMode === 'free' && replayPermission === 'selected_plan' ? selectedTiers : undefined,
        includeReplayWithLiveTicket:
          accessMode === 'pay_per_view' && recordingMode === 'paid' ? includeReplayWithTicket : false,
        participantConsentConfirmed
      }
    });

    setIsCreateLiveModalOpen(false);
  };

  const toggleTierSelection = (tierId: string) => {
    setSelectedTiers(prev =>
      prev.includes(tierId) ? prev.filter(id => id !== tierId) : [...prev, tierId]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2.5 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92dvh] flex flex-col bg-[#111114] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden my-auto acovon-modal-panel">
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800 flex items-center justify-between gap-2 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-600/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>Acovon Live Studio</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/30">
                  Broadcast Suite
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-zinc-400">
                Choose an access model, monetize viewers, and configure your live stream.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateLiveModalOpen(false)}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6 flex-1 min-h-0 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/40 text-xs text-red-300">
              {error}
            </div>
          )}

          {/* SECTION 1: 5 ACCESS MODES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                Step 1: Choose Livestream Access Mode
              </label>
              <span className="text-[11px] text-zinc-400">Required prior to broadcast</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* MODE 1: Public */}
              <div
                onClick={() => setAccessMode('public')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  accessMode === 'public'
                    ? 'bg-zinc-900 border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Mode 1: Public Livestream</h4>
                      <span className="text-[10px] text-zinc-400">Open to all Acovon viewers</span>
                    </div>
                  </div>
                  {accessMode === 'public' && <Check className="w-4 h-4 text-[#d4af37]" />}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Anyone can join and watch. Monetize through tips, virtual gifts, highlighted chat, and priority questions.
                </p>
              </div>

              {/* MODE 2: All Subscribers */}
              <div
                onClick={() => setAccessMode('all_subscribers')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  accessMode === 'all_subscribers'
                    ? 'bg-zinc-900 border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Mode 2: All Subscribers</h4>
                      <span className="text-[10px] text-zinc-400">Active membership holders</span>
                    </div>
                  </div>
                  {accessMode === 'all_subscribers' && <Check className="w-4 h-4 text-[#d4af37]" />}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Any active subscription tier unlocks entry. Non-subscribers see a locked teaser with instant subscribe button.
                </p>
              </div>

              {/* MODE 3: Selected Subscription Plan */}
              <div
                onClick={() => setAccessMode('selected_plan')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  accessMode === 'selected_plan'
                    ? 'bg-zinc-900 border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#d4af37]/15 text-[#d4af37]">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Mode 3: Selected Tier</h4>
                      <span className="text-[10px] text-zinc-400">VIP / Patron exclusive</span>
                    </div>
                  </div>
                  {accessMode === 'selected_plan' && <Check className="w-4 h-4 text-[#d4af37]" />}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Strictly gatekeep the broadcast to designated high-value membership tiers (e.g. VIP Atelier only).
                </p>
              </div>

              {/* MODE 4: Pay-Per-View */}
              <div
                onClick={() => setAccessMode('pay_per_view')}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  accessMode === 'pay_per_view'
                    ? 'bg-zinc-900 border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                      <Ticket className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Mode 4: Pay-Per-View</h4>
                      <span className="text-[10px] text-zinc-400">One-time entry ticket</span>
                    </div>
                  </div>
                  {accessMode === 'pay_per_view' && <Check className="w-4 h-4 text-[#d4af37]" />}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Charge a fixed ticket price ($5.99–$49.99+) per attendee. Locked until user purchases ticket with wallet.
                </p>
              </div>

              {/* MODE 5: Private Invitation */}
              <div
                onClick={() => setAccessMode('private_invite')}
                className={`p-4 rounded-xl border cursor-pointer md:col-span-2 transition-all ${
                  accessMode === 'private_invite'
                    ? 'bg-zinc-900 border-[#d4af37] ring-1 ring-[#d4af37]/40 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                    : 'bg-zinc-950/70 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Mode 5: Private Invitation Livestream</h4>
                      <span className="text-[10px] text-zinc-400">Closed room with passcode protection</span>
                    </div>
                  </div>
                  {accessMode === 'private_invite' && <Check className="w-4 h-4 text-[#d4af37]" />}
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Host confidential Mastermind sessions, direct client consultations, or private friend broadcasts. Protected via custom passcode and max attendee cap.
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC CONFIGURATION FOR SELECTED MODE */}
          {accessMode === 'selected_plan' && (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <label className="text-xs font-semibold text-white block">
                Select Eligible Membership Tiers:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentCreator?.tiers?.map(tier => (
                  <label
                    key={tier.id}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTiers.includes(tier.id)}
                      onChange={() => toggleTierSelection(tier.id)}
                      className="accent-[#d4af37] rounded"
                    />
                    <div className="flex-1">
                      <div className="text-xs font-semibold text-white">{tier.name}</div>
                      <div className="text-[11px] text-[#d4af37]">${tier.price.toFixed(2)}/mo</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {accessMode === 'pay_per_view' && (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-white">
                  Ticket Admission Price (USD)
                </label>
                <span className="text-xs font-bold text-[#d4af37]">${ppvTicketPrice.toFixed(2)}</span>
              </div>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                {[5.99, 9.99, 14.99, 29.99].map(price => (
                  <button
                    key={price}
                    type="button"
                    onClick={() => setPpvTicketPrice(price)}
                    className={`py-2 rounded-lg text-xs font-bold border transition-colors ${
                      ppvTicketPrice === price
                        ? 'bg-[#d4af37] text-black border-[#d4af37]'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    ${price.toFixed(2)}
                  </button>
                ))}
              </div>
              <input
                type="number"
                step="0.01"
                min="1.00"
                value={ppvTicketPrice}
                onChange={(e) => setPpvTicketPrice(parseFloat(e.target.value) || 0)}
                placeholder="Or enter custom ticket price..."
                className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          )}

          {accessMode === 'private_invite' && (
            <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    Invitation Passcode
                  </label>
                  <input
                    type="text"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                    placeholder="e.g. ACOVON-VIP-88"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white block mb-1">
                    Max Attendee Limit
                  </label>
                  <input
                    type="number"
                    value={maxViewers}
                    onChange={(e) => setMaxViewers(parseInt(e.target.value) || 20)}
                    min="2"
                    max="500"
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: STREAM DETAILS */}
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-wider text-[#d4af37] block">
              Step 2: Stream Presentation Details
            </label>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Stream Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Masterclass: Live Tailoring & Paris Fashion Week Debrief"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Stream Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what viewers will experience, what techniques you will cover, and perks..."
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {CATEGORIES.filter(c => c !== 'All Categories').map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-300 block mb-1">Estimated Duration</label>
                <select
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (1 Hour)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-zinc-300 block mb-1">Tags (comma separated)</label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Atelier, Runway, Masterclass, QnA"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          </div>

          {/* SECTION 3: MONETIZATION & INTERACTIVITY TOGGLES */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-[#d4af37] block">
              Step 3: Monetization &amp; Interaction Settings
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-zinc-200">Enable Live Tipping</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableTips}
                  onChange={(e) => setEnableTips(e.target.checked)}
                  className="accent-[#d4af37] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-[#d4af37]" />
                  <span className="text-xs font-medium text-zinc-200">Enable Virtual Gifts</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableGifts}
                  onChange={(e) => setEnableGifts(e.target.checked)}
                  className="accent-[#d4af37] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-medium text-zinc-200">Paid Priority Q&amp;A ($5)</span>
                </div>
                <input
                  type="checkbox"
                  checked={enablePaidMessages}
                  onChange={(e) => setEnablePaidMessages(e.target.checked)}
                  className="accent-[#d4af37] rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-medium text-zinc-200">Highlighted Messages ($2)</span>
                </div>
                <input
                  type="checkbox"
                  checked={enableHighlightedMessages}
                  onChange={(e) => setEnableHighlightedMessages(e.target.checked)}
                  className="accent-[#d4af37] rounded"
                />
              </label>
            </div>

            {/* Subscriber-Only Chat Option */}
            <label className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-white block">Subscribers-Only Live Chat</span>
                <span className="text-[11px] text-zinc-400">
                  Allow any authorized viewer to watch, but restrict commenting and questions exclusively to active subscribers.
                </span>
              </div>
              <input
                type="checkbox"
                checked={subscribersOnlyChat}
                onChange={(e) => setSubscribersOnlyChat(e.target.checked)}
                className="accent-[#d4af37] rounded ml-3"
              />
            </label>
          </div>

          {/* SECTION 4: RECORDING & REPLAY SETTINGS */}
          <div className="space-y-4 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#d4af37] flex items-center gap-1.5">
                <Film className="w-3.5 h-3.5" />
                Step 4: Recording &amp; Replay Settings
              </label>
              <span className="text-[11px] text-zinc-500">Official Server-Side Recording</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: Recording Disabled */}
              <button
                type="button"
                onClick={() => setRecordingMode('disabled')}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  recordingMode === 'disabled'
                    ? 'bg-zinc-900 border-zinc-400 text-white shadow-lg'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white">Option A: Disabled</span>
                    {recordingMode === 'disabled' && <Check className="w-4 h-4 text-zinc-300" />}
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Live broadcast only. Do not create a fan-accessible replay after the stream ends.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                  No Official Replay
                </span>
              </button>

              {/* Option B: Free Recording */}
              <button
                type="button"
                onClick={() => {
                  setRecordingMode('free');
                  if (replayPermission === 'paid') setReplayPermission('public');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  recordingMode === 'free'
                    ? 'bg-emerald-950/30 border-emerald-500/70 text-white shadow-lg shadow-emerald-950/30'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-emerald-300">Option B: Free Recording</span>
                    {recordingMode === 'free' && <Check className="w-4 h-4 text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Official server recording enabled. Eligible fans can watch the replay without extra payment.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-emerald-400">
                  Free Replay Access
                </span>
              </button>

              {/* Option C: Paid Recording */}
              <button
                type="button"
                onClick={() => {
                  setRecordingMode('paid');
                  setReplayPermission('paid');
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  recordingMode === 'paid'
                    ? 'bg-[#d4af37]/15 border-[#d4af37] text-white shadow-lg shadow-[#d4af37]/10'
                    : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#fce7b0]">Option C: Paid Recording</span>
                    {recordingMode === 'paid' && <Check className="w-4 h-4 text-[#d4af37]" />}
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    Set a custom price. Fans purchase access to unlock and watch the official replay.
                  </p>
                </div>
                <span className="mt-3 text-[10px] font-mono uppercase tracking-wider text-[#d4af37]">
                  Monetized Replay (80% Net)
                </span>
              </button>
            </div>

            {/* Free Recording Configuration */}
            {recordingMode === 'free' && (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-emerald-500/30 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Who Can Watch the Free Replay?
                    </label>
                    <select
                      value={replayPermission}
                      onChange={(e) => setReplayPermission(e.target.value as ReplayPermission)}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="public">Public (Everyone)</option>
                      <option value="followers">Followers Only</option>
                      <option value="subscribers">Active Subscribers Only</option>
                      <option value="selected_plan">Selected Subscription Tier Only</option>
                      <option value="private_invite">Private Invited Viewers Only</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Replay Availability Period
                    </label>
                    <select
                      value={String(replayAvailability)}
                      onChange={(e) =>
                        setReplayAvailability(
                          e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="7">7 Days After Broadcast</option>
                      <option value="30">30 Days After Broadcast</option>
                      <option value="90">90 Days After Broadcast</option>
                      <option value="unlimited">Unlimited (Permanent Archive)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Optional Replay Description
                  </label>
                  <input
                    type="text"
                    value={recordingDescription}
                    onChange={(e) => setRecordingDescription(e.target.value)}
                    placeholder="Describe what viewers will see in the recorded replay..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Paid Recording Configuration & Fan Preview */}
            {recordingMode === 'paid' && (
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-[#d4af37]/40 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-[#fce7b0] block mb-1.5">
                      Custom Recording Price (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-[#d4af37] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="number"
                        step="0.01"
                        min="1.99"
                        max="500"
                        value={recordingPrice}
                        onChange={(e) => setRecordingPrice(e.target.value)}
                        className="w-full pl-8 pr-12 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-[#d4af37]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400">
                        {recordingCurrency}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      You earn <strong className="text-emerald-400">${(Math.max(0, Number(recordingPrice) || 0) * 0.8).toFixed(2)}</strong> net per purchase (20% platform fee)
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Replay Availability Period
                    </label>
                    <select
                      value={String(replayAvailability)}
                      onChange={(e) =>
                        setReplayAvailability(
                          e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="7">7 Days Access</option>
                      <option value="30">30 Days Access</option>
                      <option value="90">90 Days Access</option>
                      <option value="unlimited">Unlimited On-Demand Access</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-zinc-300 block mb-1.5">
                      Replay Access Policy
                    </label>
                    <div className="px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                      <span>Paid Purchase Required</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-300 block mb-1">
                    Optional Recording Description (Shown on Unlock Card)
                  </label>
                  <input
                    type="text"
                    value={recordingDescription}
                    onChange={(e) => setRecordingDescription(e.target.value)}
                    placeholder="e.g. Full 4K server-side recording including live Q&A and bonus notes."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {accessMode === 'pay_per_view' && (
                  <label className="flex items-center justify-between p-3 rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Include Replay Free for Live PPV Ticket Buyers?
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        If unchecked, live PPV ticket holders must purchase the replay separately to re-watch after the broadcast ends.
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeReplayWithTicket}
                      onChange={(e) => setIncludeReplayWithTicket(e.target.checked)}
                      className="accent-[#d4af37] rounded ml-3"
                    />
                  </label>
                )}

                {/* Live Preview of How Fans Will See the Offer */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3 text-[#d4af37]" />
                      Fan Offer Preview (During &amp; After Stream)
                    </span>
                    <span className="text-[#fce7b0]">Official ACOVON Server Recording</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-[#121216] border border-[#d4af37]/30">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#d4af37]/20 text-[#fce7b0] text-[10px] font-bold uppercase">
                          Official Replay
                        </span>
                        <span className="text-xs font-bold text-white truncate">
                          {title.trim() || 'Untitled Live Broadcast'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-1">
                        {recordingDescription || 'Unlock on-demand access to the official broadcast recording.'}
                      </p>
                    </div>
                    <span className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-xs whitespace-nowrap shrink-0 text-center">
                      Unlock Recording (${(Number(recordingPrice) || 0).toFixed(2)})
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Participant Consent & Recording Indicator Notice */}
            {recordingMode !== 'disabled' && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={participantConsentConfirmed}
                  onChange={(e) => setParticipantConsentConfirmed(e.target.checked)}
                  className="accent-[#d4af37] rounded mt-0.5"
                />
                <span className="text-[11px] text-zinc-300 leading-relaxed">
                  I confirm that all participants appearing in this broadcast consent to official server-side recording and replay distribution, and that a visible <strong className="text-red-400">REC · Official Recording</strong> indicator will be shown to viewers.
                </span>
              </label>
            )}
          </div>

          {/* SECTION 5: BROADCAST LAUNCH TIMING */}
          <div className="space-y-3 pt-2">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setBroadcastTiming('now')}
                className={`py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  broadcastTiming === 'now'
                    ? 'bg-red-600/20 border-red-500 text-red-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <Radio className="w-4 h-4" />
                Go Live Immediately
              </button>

              <button
                type="button"
                onClick={() => setBroadcastTiming('scheduled')}
                className={`py-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  broadcastTiming === 'scheduled'
                    ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0]'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Schedule Broadcast
              </button>
            </div>

            {broadcastTiming === 'scheduled' && (
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <label className="text-xs font-medium text-zinc-300 block">
                  Broadcast Date &amp; Time
                </label>
                <input
                  type="text"
                  value={scheduledDateTime}
                  onChange={(e) => setScheduledDateTime(e.target.value)}
                  placeholder="e.g. Friday at 8:00 PM EST"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            )}
          </div>

          {/* Selected Configuration Summary Banner Before Confirming Go Live */}
          <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span className="text-zinc-300">
                Live Access: <strong className="text-white uppercase">{accessMode.replace(/_/g, ' ')}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-[#d4af37]" />
              <span className="text-zinc-300">
                Recording &amp; Replay:{' '}
                {recordingMode === 'disabled' && (
                  <strong className="text-zinc-400">Disabled (No Replay)</strong>
                )}
                {recordingMode === 'free' && (
                  <strong className="text-emerald-400">
                    Free Replay ({replayPermission.replace(/_/g, ' ')})
                  </strong>
                )}
                {recordingMode === 'paid' && (
                  <strong className="text-[#fce7b0]">
                    Paid Recording (${(Number(recordingPrice) || 0).toFixed(2)} USD)
                  </strong>
                )}
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsCreateLiveModalOpen(false)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-xs hover:brightness-110 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer"
            >
              <Radio className="w-4 h-4" />
              {broadcastTiming === 'now' ? 'Start Live Broadcast Now' : 'Schedule Livestream Event'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
