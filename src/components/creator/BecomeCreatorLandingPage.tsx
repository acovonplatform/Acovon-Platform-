import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import heroCreatorImg from '../../assets/images/hero_acovon_creator_1793476683041.jpg';
import studioShowcaseImg from '../../assets/images/creator_cover_luxury_1793476684350.jpg';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Film,
  Globe,
  LayoutDashboard,
  Lock,
  PhoneCall,
  Radio,
  ShieldCheck,
  Sparkles,
  Users,
  Video
} from 'lucide-react';

interface BecomeCreatorLandingPageProps {
  onApplyClick: () => void;
  onOpenCreatorStudio: () => void;
  onBackToFeed: () => void;
  onNavigate?: (tab: string) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'emerging',
    label: 'Emerging Creator',
    subscribers: 120,
    tierPrice: 12,
    ppvSales: 45,
    ppvPrice: 18,
    callMinutes: 180,
    callRate: 4,
    customAndTips: 350
  },
  {
    id: 'established',
    label: 'Full-Time Studio',
    subscribers: 650,
    tierPrice: 15,
    ppvSales: 210,
    ppvPrice: 22,
    callMinutes: 420,
    callRate: 5,
    customAndTips: 1450
  },
  {
    id: 'headliner',
    label: 'Top Earner',
    subscribers: 2200,
    tierPrice: 19,
    ppvSales: 680,
    ppvPrice: 25,
    callMinutes: 720,
    callRate: 8,
    customAndTips: 4800
  }
];

export const BecomeCreatorLandingPage: React.FC<BecomeCreatorLandingPageProps> = ({
  onApplyClick,
  onOpenCreatorStudio,
  onBackToFeed,
  onNavigate
}) => {
  const {
    currentUser,
    isAuthenticated,
    isCurrentUserApprovedCreator,
    userPendingVerification,
    commissionSettings,
    creators
  } = useApp();

  const isApprovedCreator = isAuthenticated && isCurrentUserApprovedCreator;

  const [subscribers, setSubscribers] = useState<number>(450);
  const [tierPrice, setTierPrice] = useState<number>(15);
  const [ppvSales, setPpvSales] = useState<number>(140);
  const [ppvPrice, setPpvPrice] = useState<number>(20);
  const [callMinutes, setCallMinutes] = useState<number>(280);
  const [callRate, setCallRate] = useState<number>(5);
  const [customAndTips, setCustomAndTips] = useState<number>(950);

  const subFeeRate = commissionSettings?.subscriptionsRate ?? 0.2;
  const ppvFeeRate = commissionSettings?.ppvRate ?? 0.2;
  const callFeeRate = commissionSettings?.videoCallsRate ?? 0.2;
  const tipFeeRate = commissionSettings?.tipsRate ?? 0.15;
  const minWithdrawal = commissionSettings?.minWithdrawalAmount ?? 50;

  const creatorSubSharePct = Math.round((1 - subFeeRate) * 100);
  const creatorTipSharePct = Math.round((1 - tipFeeRate) * 100);

  const earnings = useMemo(() => {
    const grossSubs = subscribers * tierPrice;
    const grossPpv = ppvSales * ppvPrice;
    const grossCalls = callMinutes * callRate;
    const grossTipsAndRequests = customAndTips;

    const netSubs = grossSubs * (1 - subFeeRate);
    const netPpv = grossPpv * (1 - ppvFeeRate);
    const netCalls = grossCalls * (1 - callFeeRate);
    const netTipsAndRequests = grossTipsAndRequests * (1 - tipFeeRate);

    const totalGross = grossSubs + grossPpv + grossCalls + grossTipsAndRequests;
    const totalNet = netSubs + netPpv + netCalls + netTipsAndRequests;
    const platformFee = totalGross - totalNet;

    return {
      grossSubs,
      grossPpv,
      grossCalls,
      grossTipsAndRequests,
      netSubs,
      netPpv,
      netCalls,
      netTipsAndRequests,
      totalGross,
      totalNet,
      platformFee,
      annualNet: totalNet * 12
    };
  }, [
    subscribers,
    tierPrice,
    ppvSales,
    ppvPrice,
    callMinutes,
    callRate,
    customAndTips,
    subFeeRate,
    ppvFeeRate,
    callFeeRate,
    tipFeeRate
  ]);

  const applyPreset = (preset: (typeof PRESET_SCENARIOS)[number]) => {
    setSubscribers(preset.subscribers);
    setTierPrice(preset.tierPrice);
    setPpvSales(preset.ppvSales);
    setPpvPrice(preset.ppvPrice);
    setCallMinutes(preset.callMinutes);
    setCallRate(preset.callRate);
    setCustomAndTips(preset.customAndTips);
  };

  const scrollToCalculator = () => {
    const el = document.getElementById('earnings-calculator');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderPrimaryCtaLabel = () => {
    if (isApprovedCreator) return 'Open Creator Studio';
    if (userPendingVerification) return 'View Pending Application';
    return 'Apply to Become a Creator';
  };

  const handlePrimaryAction = () => {
    if (isApprovedCreator) {
      onOpenCreatorStudio();
      return;
    }
    onApplyClick();
  };

  const activeCreatorCount = Math.max(creators.length, 1);

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] pb-20">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-10 sm:space-y-16">
        {/* Top Breadcrumb Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#27272a]">
          <button
            type="button"
            onClick={onBackToFeed}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-[#d4af37]" />
            <span>Back to Live Feed</span>
          </button>

          <div className="flex items-center gap-4 text-xs text-neutral-400">
            <span>Single-Account Creator Upgrade</span>
            <span aria-hidden="true">·</span>
            <span>18+ Verified Platform</span>
          </div>
        </div>

        {/* Pending Verification Status Notice if applicable */}
        {isAuthenticated && userPendingVerification && !isApprovedCreator && (
          <div className="p-4 sm:p-5 bg-[#121215] border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  Creator Application Under Review ({userPendingVerification.name})
                </div>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Submitted on {userPendingVerification.submittedAt} for account {currentUser.email}. Once approved by an administrator, Creator Studio, Go Live, and publishing tools activate automatically on your existing login.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onApplyClick}
              className="px-4 py-2.5 bg-[#18181c] hover:bg-[#24242c] border border-amber-500/40 text-amber-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              Inspect Application
            </button>
          </div>
        )}

        {/* Section 1: Proposition Hero Split (items-stretch for balanced 2-column geometry) */}
        <section className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
            <div className="lg:col-span-7 bg-[#121215] border border-[#27272a] rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#d4af37]">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>ACOVON Creator Program</span>
                </div>

                <h1
                  className="font-brand font-bold tracking-tight text-white leading-[1.08] text-balance max-w-2xl"
                  style={{ fontSize: 'clamp(1.75rem, 3.8vw, 3.5rem)' }}
                >
                  Turn Your Audience Into Direct Recurring Revenue
                </h1>

                <p className="text-sm sm:text-base text-neutral-300 leading-relaxed max-w-2xl">
                  Keep {creatorSubSharePct}% of every subscription, pay-per-view release, paid 1-on-1 video call, and custom video commission—and {creatorTipSharePct}% of every direct fan tip. Built with 18+ compliance, escrow protection, and global multi-language reach in one studio.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    className="w-full xs:w-auto justify-center px-5 sm:px-6 py-3.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-sm rounded-xl inline-flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer shrink-0"
                  >
                    {isApprovedCreator ? (
                      <LayoutDashboard className="w-4 h-4 shrink-0" />
                    ) : (
                      <Sparkles className="w-4 h-4 shrink-0" />
                    )}
                    <span>{renderPrimaryCtaLabel()}</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>

                  <button
                    type="button"
                    onClick={scrollToCalculator}
                    className="w-full xs:w-auto justify-center px-5 py-3.5 bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-200 font-semibold text-sm rounded-xl inline-flex items-center gap-2 transition-colors cursor-pointer shrink-0"
                  >
                    <DollarSign className="w-4 h-4 text-[#d4af37] shrink-0" />
                    <span>Calculate Monthly Earnings</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-neutral-400">
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Zero upfront setup fee</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Upgrades your existing account</span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>${minWithdrawal.toFixed(0)} minimum payout threshold</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: High-craft 16:9 Studio Visual Container */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#27272a] bg-[#121215] min-h-[280px] lg:min-h-full">
              <img
                src={heroCreatorImg}
                alt="ACOVON Creator Studio broadcast workspace"
                className="w-full h-full object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-[#fce7b0]">
                  All-in-One Creator Studio
                </div>
                <p className="text-sm font-semibold text-white leading-snug">
                  Publish 4K videos, host ticketed livestreams, accept paid calls, and manage subscriber tiers from one dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Full-width 4-Column Creator Economics Strip */}
          <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-5 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#fce7b0]">
                {creatorSubSharePct}%
              </div>
              <div className="text-xs font-semibold text-white">Creator Revenue Share</div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Keep {creatorSubSharePct}% on subscriptions, PPV unlocks, video calls, and custom orders.
              </p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-5 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#fce7b0]">
                {creatorTipSharePct}%
              </div>
              <div className="text-xs font-semibold text-white">Direct Tip Payout</div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Receive {creatorTipSharePct}% net proceeds on every live and feed fan tip.
              </p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-5 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#fce7b0]">
                19
              </div>
              <div className="text-xs font-semibold text-white">Global Languages</div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Reach international patrons with optional native-script translation and country discovery.
              </p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-5 space-y-1.5">
              <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#fce7b0]">
                18+
              </div>
              <div className="text-xs font-semibold text-white">Verified &amp; Escrow Safe</div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Accredited ID verification, encrypted WebRTC streams, and dispute-protected commissions.
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Mechanism / Six Monetization Streams (Asymmetric Bento Grid) */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="text-xs font-mono uppercase tracking-wider text-[#d4af37]">
                Monetization Architecture
              </div>
              <h2 className="font-brand text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Six Built-In Revenue Streams Under One Verified Profile
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md">
              Combine predictable monthly membership income with high-margin individual drops, live shows, and private sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {/* 01: Marquee Subscriptions Card (col-span-2) */}
            <div className="md:col-span-2 bg-[#121215] border border-[#27272a] rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-semibold text-[#d4af37]">
                    01. Recurring Fan Subscriptions
                  </span>
                  <Users className="w-5 h-5 text-[#d4af37] shrink-0" />
                </div>
                <h3 className="font-brand text-xl font-bold text-white">
                  Predictable Monthly Membership Tiers ($4.99 – $250/mo)
                </h3>
                <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-w-2xl">
                  Launch one or multiple supporter tiers with automatic billing, tier-exclusive feed posts, subscriber-only livestream rooms, and direct messaging privileges.
                </p>
              </div>
              <div className="pt-4 border-t border-[#27272a] grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-4 text-xs">
                <div>
                  <div className="font-mono font-bold text-white tabular-nums">{creatorSubSharePct}% Net</div>
                  <div className="text-neutral-400">Creator take-home</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-white tabular-nums">Multi-Tier</div>
                  <div className="text-neutral-400">Custom VIP perks</div>
                </div>
                <div>
                  <div className="font-mono font-bold text-white tabular-nums">Instant Gate</div>
                  <div className="text-neutral-400">Auto access control</div>
                </div>
              </div>
            </div>

            {/* 02: Pay-Per-View Vault */}
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-semibold text-[#d4af37]">
                    02. Pay-Per-View Drops
                  </span>
                  <Film className="w-5 h-5 text-[#d4af37] shrink-0" />
                </div>
                <h3 className="font-brand text-lg font-bold text-white">
                  Monetize Standalone Videos &amp; Photo Sets
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Publish public preview teasers that drive paid one-click unlocks directly inside the main Feed, Explore, and your Profile.
                </p>
              </div>
              <div className="pt-3 border-t border-[#27272a] text-xs text-neutral-400 flex items-center justify-between">
                <span>Protected purchase records</span>
                <span className="font-mono text-[#fce7b0] tabular-nums">{creatorSubSharePct}% share</span>
              </div>
            </div>

            {/* 03: Paid 1-on-1 Video Calls */}
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-semibold text-[#d4af37]">
                    03. Paid 1-on-1 Video Calls
                  </span>
                  <PhoneCall className="w-5 h-5 text-[#d4af37] shrink-0" />
                </div>
                <h3 className="font-brand text-lg font-bold text-white">
                  Per-Minute Encrypted WebRTC Sessions
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Set your own per-minute rate and availability window. Wallet funds are verified upfront before any live call connects.
                </p>
              </div>
              <div className="pt-3 border-t border-[#27272a] text-xs text-neutral-400 flex items-center justify-between">
                <span>256-bit WebRTC media</span>
                <span className="font-mono text-[#fce7b0] tabular-nums">Auto-metered</span>
              </div>
            </div>

            {/* 04: Custom Video Requests */}
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-semibold text-[#d4af37]">
                    04. Custom Commissions
                  </span>
                  <Video className="w-5 h-5 text-[#d4af37] shrink-0" />
                </div>
                <h3 className="font-brand text-lg font-bold text-white">
                  Escrow-Backed Custom Video Requests
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Review fan briefs, accept or decline on your schedule, and receive guaranteed escrow release upon delivery.
                </p>
              </div>
              <div className="pt-3 border-t border-[#27272a] text-xs text-neutral-400 flex items-center justify-between">
                <span>Full creator approval control</span>
                <span className="font-mono text-[#fce7b0] tabular-nums">Escrow locked</span>
              </div>
            </div>

            {/* 05: Live Broadcasts & Replays */}
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-mono font-semibold text-[#d4af37]">
                    05. Live Shows &amp; Replays
                  </span>
                  <Radio className="w-5 h-5 text-[#d4af37] shrink-0" />
                </div>
                <h3 className="font-brand text-lg font-bold text-white">
                  Ticketed Streams, Gifts &amp; Paid VOD
                </h3>
                <p className="text-xs text-neutral-300 leading-relaxed">
                  Run free discovery streams, PPV ticketed events, or subscriber-only broadcasts with live polls, gifts, and monetized replays.
                </p>
              </div>
              <div className="pt-3 border-t border-[#27272a] text-xs text-neutral-400 flex items-center justify-between">
                <span>Live tips &amp; virtual gifts</span>
                <span className="font-mono text-[#fce7b0] tabular-nums">{creatorTipSharePct}% tips</span>
              </div>
            </div>

            {/* 06: Global Discovery & Studio Visual Showcase (col-span-3 split) */}
            <div className="md:col-span-3 bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold text-[#d4af37]">
                    <Globe className="w-4 h-4 shrink-0" />
                    <span>06. Global Discovery &amp; Multi-Language Reach</span>
                  </div>
                  <h3 className="font-brand text-xl sm:text-2xl font-bold text-white">
                    Get Discovered Across Categories, Countries &amp; Languages
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    ACOVON indexes your public previews across official platform categories and ISO country discovery pages, while giving international visitors instant translation across 19 supported languages—turning global browsers into paying subscribers.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-300 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate?.('categories')}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#fce7b0] hover:underline cursor-pointer"
                  >
                    <span>Browse Official Categories</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span aria-hidden="true" className="text-neutral-600">·</span>
                  <button
                    type="button"
                    onClick={() => onNavigate?.('explore')}
                    className="inline-flex items-center gap-1.5 font-semibold text-neutral-300 hover:text-white cursor-pointer"
                  >
                    <span>See {activeCreatorCount}+ Active Creators on Explore</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="lg:col-span-5 min-h-[220px] lg:min-h-full relative">
                <img
                  src={studioShowcaseImg}
                  alt="Independent creator production environment"
                  className="w-full h-full object-cover object-center"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Interactive Creator Earnings Calculator (Proof & Economics) */}
        <section id="earnings-calculator" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-mono uppercase tracking-wider text-[#d4af37]">
                Transparent Payout Model
              </div>
              <h2 className="font-brand text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Estimate Your Monthly &amp; Annual Creator Earnings
              </h2>
            </div>

            {/* Scenario Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="px-3.5 py-2 bg-[#121215] hover:bg-[#1c1c22] border border-[#27272a] hover:border-[#d4af37]/50 rounded-xl text-xs font-semibold text-neutral-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left Sliders Panel */}
            <div className="lg:col-span-7 bg-[#121215] border border-[#27272a] rounded-2xl p-6 sm:p-7 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Subscribers */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-subs" className="font-semibold text-neutral-200">
                      Monthly Subscribers
                    </label>
                    <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                      {subscribers.toLocaleString()} fans
                    </span>
                  </div>
                  <input
                    id="calc-subs"
                    type="range"
                    min={10}
                    max={3000}
                    step={10}
                    value={subscribers}
                    onChange={(e) => setSubscribers(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* Tier Price */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-tier-price" className="font-semibold text-neutral-200">
                      Subscription Tier Price
                    </label>
                    <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                      ${tierPrice}/mo
                    </span>
                  </div>
                  <input
                    id="calc-tier-price"
                    type="range"
                    min={5}
                    max={75}
                    step={1}
                    value={tierPrice}
                    onChange={(e) => setTierPrice(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* PPV Sales */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-ppv-count" className="font-semibold text-neutral-200">
                      Monthly PPV Unlocks
                    </label>
                    <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                      {ppvSales.toLocaleString()} unlocks
                    </span>
                  </div>
                  <input
                    id="calc-ppv-count"
                    type="range"
                    min={0}
                    max={1000}
                    step={10}
                    value={ppvSales}
                    onChange={(e) => setPpvSales(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* PPV Price */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-ppv-price" className="font-semibold text-neutral-200">
                      Avg PPV Release Price
                    </label>
                    <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                      ${ppvPrice}
                    </span>
                  </div>
                  <input
                    id="calc-ppv-price"
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={ppvPrice}
                    onChange={(e) => setPpvPrice(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* Video Call Minutes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-call-mins" className="font-semibold text-neutral-200">
                      Paid 1-on-1 Call Minutes / mo
                    </label>
                    <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                      {callMinutes.toLocaleString()} min
                    </span>
                  </div>
                  <input
                    id="calc-call-mins"
                    type="range"
                    min={0}
                    max={1000}
                    step={20}
                    value={callMinutes}
                    onChange={(e) => setCallMinutes(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>

                {/* Call Rate */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label htmlFor="calc-call-rate" className="font-semibold text-neutral-200">
                      Video Call Rate ($/min)
                    </label>
                    <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                      ${callRate}/min
                    </span>
                  </div>
                  <input
                    id="calc-call-rate"
                    type="range"
                    min={2}
                    max={25}
                    step={1}
                    value={callRate}
                    onChange={(e) => setCallRate(Number(e.target.value))}
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-[#27272a] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="calc-tips" className="font-semibold text-neutral-200">
                    Monthly Live Tips, Gifts &amp; Custom Requests
                  </label>
                  <span className="font-mono font-bold text-[#fce7b0] tabular-nums">
                    ${customAndTips.toLocaleString()}/mo
                  </span>
                </div>
                <input
                  id="calc-tips"
                  type="range"
                  min={0}
                  max={10000}
                  step={50}
                  value={customAndTips}
                  onChange={(e) => setCustomAndTips(Number(e.target.value))}
                  className="w-full accent-[#d4af37] cursor-pointer"
                />
              </div>
            </div>

            {/* Right Payout Summary Panel */}
            <div className="lg:col-span-5 bg-[#121215] border border-[#d4af37]/40 rounded-2xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="text-xs font-mono uppercase tracking-wider text-neutral-400">
                  Estimated Net Creator Payout
                </div>

                <div>
                  <div className="text-3xl sm:text-4xl font-bold font-mono tabular-nums text-[#fce7b0]">
                    ${earnings.totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    <span className="text-sm font-normal text-neutral-400"> / month</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums text-emerald-400 mt-1">
                    ${earnings.annualNet.toLocaleString(undefined, { maximumFractionDigits: 0 })} projected annually
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-[#27272a] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">
                      Subscriptions ({creatorSubSharePct}% net)
                    </span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      ${earnings.netSubs.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">
                      Pay-Per-View Drops ({creatorSubSharePct}% net)
                    </span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      ${earnings.netPpv.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">
                      Paid 1-on-1 Video Calls ({creatorSubSharePct}% net)
                    </span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      ${earnings.netCalls.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-300">
                      Tips &amp; Gifts ({creatorTipSharePct}% net)
                    </span>
                    <span className="font-mono font-semibold text-white tabular-nums">
                      ${earnings.netTipsAndRequests.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>

                  <div className="pt-2.5 border-t border-[#27272a] flex items-center justify-between text-neutral-400">
                    <span>Gross fan spend</span>
                    <span className="font-mono tabular-nums">
                      ${earnings.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-400">
                    <span>Platform hosting &amp; payment processing</span>
                    <span className="font-mono tabular-nums">
                      -${earnings.platformFee.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePrimaryAction}
                className="w-full py-3.5 px-4 sm:px-5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs sm:text-sm rounded-xl inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#d4af37]/20"
              >
                <span>{renderPrimaryCtaLabel()}</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </section>

        {/* Section 4: 3-Step 18+ Onboarding & Safety Proof */}
        <section className="space-y-6">
          <div className="space-y-2 max-w-2xl">
            <div className="text-xs font-mono uppercase tracking-wider text-[#d4af37]">
              Onboarding &amp; Compliance
            </div>
            <h2 className="font-brand text-2xl sm:text-3xl font-bold tracking-tight text-white">
              From Fan Account to Verified Creator in Three Clear Steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#fce7b0]">Step 01</span>
                <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h3 className="font-brand text-base font-bold text-white">
                Set Your Creator Profile &amp; Pricing
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Choose your public display name, primary ACOVON category, bio, and base monthly subscription rate right on your existing login.
              </p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#fce7b0]">Step 02</span>
                <Lock className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h3 className="font-brand text-base font-bold text-white">
                Complete 18+ Government ID Audit
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Submit a valid government ID and biometric match for compliance review by accredited ACOVON verification officers.
              </p>
            </div>

            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-[#fce7b0]">Step 03</span>
                <LayoutDashboard className="w-4 h-4 text-[#d4af37]" />
              </div>
              <h3 className="font-brand text-base font-bold text-white">
                Launch Creator Studio &amp; Withdraw
              </h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Once approved, Creator Studio, Go Live, Create Post, and payout withdrawals activate automatically with zero second-account hassle.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5: Final Conversion Block */}
        <section className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 sm:p-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h2 className="font-brand text-2xl font-bold text-white">
              {isApprovedCreator
                ? 'Your ACOVON Creator Studio Is Active'
                : 'Ready to Build Your Creator Business on ACOVON?'}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
              {isApprovedCreator
                ? `Signed in as ${currentUser.name} (@${currentUser.username}). Jump into Creator Studio to publish new content, manage tiers, or review payouts.`
                : isAuthenticated
                  ? `Signed in as ${currentUser.name} (@${currentUser.username}). Your application upgrades this exact account—no separate registration required.`
                  : 'Create a free ACOVON account or sign in to submit your 2-step creator verification and start monetizing your content.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
            <button
              type="button"
              onClick={handlePrimaryAction}
              className="w-full xs:w-auto justify-center px-5 sm:px-6 py-3.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-sm rounded-xl inline-flex items-center gap-2 shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer shrink-0"
            >
              <span>{renderPrimaryCtaLabel()}</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <button
              type="button"
              onClick={onBackToFeed}
              className="w-full xs:w-auto justify-center px-5 py-3.5 bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-200 font-semibold text-sm rounded-xl transition-colors cursor-pointer shrink-0"
            >
              Return to Feed
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
