import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Video, 
  Clapperboard, 
  Lock, 
  Coins, 
  MessageSquare, 
  ShieldCheck, 
  ArrowRight, 
  TrendingUp, 
  Users, 
  Check, 
  Award,
  DollarSign,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_MEDIA_VIDEOS } from '../../data/demoContent';

interface LandingPageProps {
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
}

interface HeroCreatorPromoSlide {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorUsername: string;
  creatorAvatar: string;
  title: string;
  subtitle: string;
  packageBadge: string;
  videoUrl: string;
  posterUrl: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAuth }) => {
  const { creators, promotions, posts } = useApp();

  // Build list of creator promotion videos from active creator promotions + promoted creator video posts
  const promoSlides = useMemo<HeroCreatorPromoSlide[]>(() => {
    const slides: HeroCreatorPromoSlide[] = [];
    const activePromos = promotions.filter(p => p.status === 'active' || p.status === 'pending_approval');

    activePromos.forEach((promo, idx) => {
      const creator = creators.find(c => c.id === promo.creatorId) || creators[idx % Math.max(1, creators.length)];
      const targetPost = promo.targetPostId
        ? posts.find(p => p.id === promo.targetPostId)
        : posts.find(p => p.creatorId === promo.creatorId && p.media?.some(m => m.type === 'video'));
      const videoMedia = targetPost?.media?.find(m => m.type === 'video');

      slides.push({
        id: promo.id,
        creatorId: creator?.id || promo.creatorId,
        creatorName: creator?.name || promo.creatorName,
        creatorUsername: creator?.username || promo.creatorName.toLowerCase().replace(/\s+/g, ''),
        creatorAvatar: creator?.avatar || '/src/assets/images/creator_avatar_elena_1793476684335.jpg',
        title: targetPost
          ? `${creator?.name || promo.creatorName} — ${targetPost.content.slice(0, 44)}...`
          : `${creator?.name || promo.creatorName} Couture & Vault Spotlight`,
        subtitle: targetPost?.ppvPrice
          ? `Promoted PPV Vault · ${targetPost.ppvPreviewDuration || 15}s Free Preview · $${targetPost.ppvPrice.toFixed(2)} Full Unlock`
          : `${promo.packageTitle} · From $${creator?.tiers?.[0]?.price?.toFixed(2) || '14.99'}/mo`,
        packageBadge: promo.packageTitle || 'Creator Promotion',
        videoUrl: videoMedia?.url || DEMO_MEDIA_VIDEOS[idx % DEMO_MEDIA_VIDEOS.length] || '/videos/sample1.mp4',
        posterUrl: videoMedia?.thumbnailUrl || creator?.coverImage || '/src/assets/images/hero_acovon_creator_1793476683041.jpg'
      });
    });

    // Ensure multiple creator promotion videos are always in rotation
    const fallbackCreators = creators.slice(0, 5);
    fallbackCreators.forEach((creator, idx) => {
      if (slides.some(s => s.creatorId === creator.id)) return;
      const creatorVideoPost = posts.find(
        p => p.creatorId === creator.id && p.media?.some(m => m.type === 'video')
      );
      const videoMedia = creatorVideoPost?.media?.find(m => m.type === 'video');

      slides.push({
        id: `hero_promo_${creator.id}`,
        creatorId: creator.id,
        creatorName: creator.name,
        creatorUsername: creator.username,
        creatorAvatar: creator.avatar,
        title: `${creator.name} — ${creator.category} Exclusive`,
        subtitle: creatorVideoPost?.ppvPrice
          ? `PPV Vault · ${creatorVideoPost.ppvPreviewDuration || 15}s Free Preview · $${creatorVideoPost.ppvPrice.toFixed(2)} Full Unlock`
          : `Featured Creator Promotion · Subscriptions from $${creator.tiers?.[0]?.price?.toFixed(2) || '14.99'}/mo`,
        packageBadge: 'Promoted Creator Spotlight',
        videoUrl: videoMedia?.url || DEMO_MEDIA_VIDEOS[(idx + 1) % DEMO_MEDIA_VIDEOS.length] || '/videos/sample1.mp4',
        posterUrl: videoMedia?.thumbnailUrl || creator.coverImage || '/src/assets/images/hero_acovon_creator_1793476683041.jpg'
      });
    });

    return slides;
  }, [promotions, creators, posts]);

  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Rotate creator promotion videos automatically every 5 seconds
  useEffect(() => {
    if (promoSlides.length <= 1) return;
    const interval = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promoSlides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promoSlides.length]);

  const currentPromo = promoSlides[activePromoIndex % Math.max(1, promoSlides.length)];

  // Calculator state
  const [followers, setFollowers] = useState(25000);
  const [subPrice, setSubPrice] = useState(19.99);
  const [conversionPercent, setConversionPercent] = useState(3.0);
  const [customRequestsCount, setCustomRequestsCount] = useState(8);
  const [videoCallHours, setVideoCallHours] = useState(6);

  // Math calculation
  const payingSubs = Math.round((followers * (conversionPercent / 100)));
  const subRevenue = payingSubs * subPrice;
  const customRevenue = customRequestsCount * 125;
  const callRevenue = videoCallHours * 60 * 6.0; // $6/min
  const grossMonthly = subRevenue + customRevenue + callRevenue;
  const creatorNetEarnings = grossMonthly * 0.80; // 80% take home

  return (
    <div className="space-y-24 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 md:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#18181c] border border-[#d4af37]/40 rounded-full text-xs text-[#fce7b0]">
              <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>The Next Generation Creator Economy</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-brand tracking-tight text-white leading-[1.1]">
              Where Creators <br />
              <span className="gold-gradient-text">Monetize Their Influence.</span>
            </h1>

            <p className="text-sm sm:text-base text-neutral-300 max-w-xl leading-relaxed">
              Acovon unifies multi-tier subscriptions, timed-preview video vaults, real-time paid private video calls, and personalized video requests with 80%+ direct creator payouts.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onOpenAuth('register')}
                className="px-6 py-3.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs sm:text-sm rounded-xl shadow-xl shadow-[#d4af37]/25 flex items-center gap-2 transition-all hover:scale-105 cursor-pointer"
              >
                <span>Create Your Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('explore')}
                className="px-6 py-3.5 bg-[#141418] hover:bg-[#1e1e24] border border-[#27272a] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all cursor-pointer"
              >
                Discover Creators
              </button>
            </div>

            {/* Zero-Pill Social Proof */}
            <div className="pt-4 flex items-center gap-6 text-xs text-neutral-400">
              <div>
                <span className="font-bold text-white font-mono text-sm tabular-nums">80% - 85%</span>
                <div className="text-[11px] text-neutral-500">Direct Creator Split</div>
              </div>
              <span className="text-neutral-700">|</span>
              <div>
                <span className="font-bold text-white font-mono text-sm tabular-nums">Instant</span>
                <div className="text-[11px] text-neutral-500">Per-Minute Call Billing</div>
              </div>
              <span className="text-neutral-700">|</span>
              <div>
                <span className="font-bold text-white font-mono text-sm tabular-nums">Escrow</span>
                <div className="text-[11px] text-neutral-500">Commission Protection</div>
              </div>
            </div>
          </div>

          {/* Hero Visual Asset — Auto-Rotating Creator Promotions Multi-Video Carousel (Every 5 Seconds) */}
          <div className="relative">
            {currentPromo && (
              <div className="relative rounded-2xl overflow-hidden border border-[#26262b] shadow-2xl group bg-[#0d0d10] aspect-[4/3] sm:aspect-[16/11]">
                <video
                  key={currentPromo.id}
                  src={currentPromo.videoUrl}
                  poster={currentPromo.posterUrl}
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  onError={(e) => {
                    const el = e.currentTarget;
                    if (!el.src.includes('/videos/sample1.mp4')) {
                      el.src = '/videos/sample1.mp4';
                      el.load();
                    }
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/40 pointer-events-none" />

                {/* Top Bar: Creator Promotion Badge, Slide Indicators & Audio Toggle */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/65 backdrop-blur-md border border-[#d4af37]/40 rounded-xl text-[11px] text-[#fce7b0]">
                    <span className="w-2 h-2 rounded-full bg-[#d4af37] animate-pulse" />
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-[#d4af37]">Promoted</span>
                    <span className="text-neutral-500">·</span>
                    <span className="truncate max-w-[160px] sm:max-w-[220px] font-medium text-white">
                      {currentPromo.packageBadge}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setActivePromoIndex(prev => (prev - 1 + promoSlides.length) % promoSlides.length)
                      }
                      className="p-1.5 bg-black/65 hover:bg-black/85 backdrop-blur-md border border-[#27272a] text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Previous Promoted Video"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActivePromoIndex(prev => (prev + 1) % promoSlides.length)
                      }
                      className="p-1.5 bg-black/65 hover:bg-black/85 backdrop-blur-md border border-[#27272a] text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title="Next Promoted Video"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMuted(prev => !prev)}
                      className="p-1.5 bg-black/65 hover:bg-black/85 backdrop-blur-md border border-[#27272a] text-neutral-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                      title={isMuted ? 'Unmute Promotion Video' : 'Mute Promotion Video'}
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </button>
                  </div>
                </div>

                {/* Slide Dots Indicator (5s per video) */}
                <div className="absolute bottom-24 left-6 right-6 flex items-center gap-1.5 z-10">
                  {promoSlides.map((slide, idx) => {
                    const isCurrent = idx === activePromoIndex;
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => setActivePromoIndex(idx)}
                        aria-label={`View promotion ${idx + 1} by ${slide.creatorName}`}
                        className={`h-1 rounded-full transition-all cursor-pointer ${
                          isCurrent ? 'flex-1 bg-[#d4af37]' : 'w-5 bg-white/30 hover:bg-white/60'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Float Glass Overlay Box */}
                <div className="absolute bottom-5 left-5 right-5 p-4 bg-black/70 backdrop-blur-md border border-[#27272a] rounded-xl flex items-center justify-between gap-3 text-xs z-10">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={currentPromo.creatorAvatar}
                      alt={currentPromo.creatorName}
                      className="w-10 h-10 rounded-xl object-cover border border-[#d4af37]/60 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-white truncate">{currentPromo.title}</div>
                      <div className="text-neutral-300 text-[11px] truncate">{currentPromo.subtitle}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('creator-profile', currentPromo.creatorId)}
                    className="px-3.5 py-2 bg-[#d4af37] text-black font-semibold rounded-lg text-xs hover:bg-[#e5c07b] cursor-pointer shrink-0 shadow-md"
                  >
                    Watch
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* 7 Revenue Streams Bento Grid */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold font-brand text-white">
            7 Unified Monetization Streams
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Never rely on a single revenue model. Acovon gives creators multiple ways to monetize every audience interaction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Acovon Live Feature Card */}
          <div className="p-6 bg-gradient-to-br from-red-950/20 via-[#121215] to-[#121215] border border-red-500/30 hover:border-[#d4af37] rounded-2xl transition-all space-y-3 cursor-pointer group" onClick={() => onNavigate('live')}>
            <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mr-1" />
              <Video className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white text-base group-hover:text-[#fce7b0] transition-colors">Acovon Live Studio</h3>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider bg-red-950/60 px-2 py-0.5 rounded border border-red-500/30">New</span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              5 access modes: Public, Subscribers-only, Tier-exclusive, Pay-Per-View tickets, &amp; Private Passcode invites. Monetize with virtual gifts &amp; paid priority Q&amp;A.
            </p>
          </div>

          <div className="p-6 bg-[#121215] border border-[#26262b] hover:border-[#383842] rounded-2xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#d4af37]" />
            </div>
            <h3 className="font-bold text-white text-base">Recurring Subscriptions</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Build dependable Monthly Recurring Revenue (MRR) with custom tiers, discounted multi-month billing, and exclusive member perks.
            </p>
          </div>

          <div className="p-6 bg-[#121215] border border-[#26262b] hover:border-[#383842] rounded-2xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
              <Video className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="font-bold text-white text-base">Paid Private Video Calls</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Connect 1-on-1 with fans over real-time WebRTC video. Per-minute rates with automated billing that begins only once connected.
            </p>
          </div>

          <div className="p-6 bg-[#121215] border border-[#26262b] hover:border-[#383842] rounded-2xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-white text-base">Pay-To-View Timed Previews</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Give fans 10s, 15s, or 30s of free high-def video teaser before locking. Genuine server-side access control permanently unlocks purchases.
            </p>
          </div>

          <div className="p-6 bg-[#121215] border border-[#26262b] hover:border-[#383842] rounded-2xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
              <Clapperboard className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-white text-base">Personalized Custom Videos</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Accept customized video requests with buyer notes and escrow payment protection. Deliver directly through the creator dashboard.
            </p>
          </div>

          <div className="p-6 bg-[#121215] border border-[#26262b] hover:border-[#383842] rounded-2xl transition-all space-y-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-rose-400" />
            </div>
            <h3 className="font-bold text-white text-base">Paid Locked Messages</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Send private photo and video releases via direct messages. Fans pay a one-time fee to unlock exclusive media in chat.
            </p>
          </div>

        </div>
      </section>

      {/* Interactive Creator Earnings Calculator */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="bg-[#121215] border border-[#d4af37]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#d4af37]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-xl mb-8 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#d4af37]">
              Potential Revenue Estimator
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-brand text-white">
              Calculate Your Monthly Acovon Earnings
            </h2>
            <p className="text-xs text-neutral-400">
              Estimate your monthly income across subscriptions, custom commissions, and private video calls.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            
            {/* Sliders Area */}
            <div className="lg:col-span-2 space-y-6 text-xs">
              
              <div>
                <div className="flex justify-between text-neutral-300 font-medium mb-1.5">
                  <span>Audience Reach</span>
                  <span className="font-mono text-white font-bold">{followers.toLocaleString()} followers</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="200000"
                  step="2000"
                  value={followers}
                  onChange={(e) => setFollowers(Number(e.target.value))}
                  className="w-full accent-[#d4af37] bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-300 font-medium mb-1.5">
                  <span>Subscription Monthly Price</span>
                  <span className="font-mono text-white font-bold">${subPrice.toFixed(2)}/mo</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="1"
                  value={subPrice}
                  onChange={(e) => setSubPrice(Number(e.target.value))}
                  className="w-full accent-[#d4af37] bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-neutral-300 font-medium mb-1.5">
                  <span>Estimated Paid Conversion</span>
                  <span className="font-mono text-white font-bold">{conversionPercent}% ({payingSubs} subscribers)</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  step="0.5"
                  value={conversionPercent}
                  onChange={(e) => setConversionPercent(Number(e.target.value))}
                  className="w-full accent-[#d4af37] bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex justify-between text-neutral-300 font-medium mb-1.5">
                    <span>Custom Videos / Mo</span>
                    <span className="font-mono text-white font-bold">{customRequestsCount}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30"
                    value={customRequestsCount}
                    onChange={(e) => setCustomRequestsCount(Number(e.target.value))}
                    className="w-full accent-[#d4af37] bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-neutral-300 font-medium mb-1.5">
                    <span>Video Call Hours / Mo</span>
                    <span className="font-mono text-white font-bold">{videoCallHours}h</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={videoCallHours}
                    onChange={(e) => setVideoCallHours(Number(e.target.value))}
                    className="w-full accent-[#d4af37] bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

            </div>

            {/* Total Estimated Take-Home Card */}
            <div className="bg-[#18181c] border border-[#d4af37]/40 rounded-2xl p-6 text-center space-y-4">
              <span className="text-xs text-neutral-400 font-medium block">
                Estimated Net Take-Home
              </span>

              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#fce7b0] tabular-nums">
                ${Math.round(creatorNetEarnings).toLocaleString()}/mo
              </div>

              <div className="text-[11px] text-neutral-500 border-t border-[#27272a] pt-3 text-left space-y-1">
                <div className="flex justify-between">
                  <span>Subscriptions:</span>
                  <span className="font-mono text-neutral-300">${Math.round(subRevenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custom Videos:</span>
                  <span className="font-mono text-neutral-300">${Math.round(customRevenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Private Video Calls:</span>
                  <span className="font-mono text-neutral-300">${Math.round(callRevenue).toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => onOpenAuth('register')}
                className="w-full py-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer"
              >
                Create Your ACOVON Account
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* Featured Creators Showcase */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold font-brand text-white">Trending Acovon Creators</h2>
            <p className="text-xs text-neutral-400 mt-1">Discover verified leaders in fashion, music, athletics, and art.</p>
          </div>
          <button
            onClick={() => onNavigate('explore')}
            className="text-xs font-semibold text-[#d4af37] hover:underline flex items-center gap-1 self-start"
          >
            <span>View All Creators</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creators.slice(0, 3).map(creator => (
            <div
              key={creator.id}
              onClick={() => onNavigate('creator-profile', creator.id)}
              className="bg-[#121215] border border-[#27272a] hover:border-[#383842] rounded-2xl overflow-hidden cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="h-40 overflow-hidden relative">
                <img
                  src={creator.coverImage}
                  alt={creator.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-5 pt-0 relative">
                <div className="flex items-end justify-between -mt-8 mb-2">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-14 h-14 rounded-xl object-cover border-2 border-[#121215]"
                  />
                  <span className="text-xs font-mono font-bold text-[#fce7b0]">
                    From ${creator.tiers[0]?.price}/mo
                  </span>
                </div>
                <h3 className="font-bold text-white text-base group-hover:text-[#fce7b0] transition-colors">
                  {creator.name}
                </h3>
                <div className="text-xs text-neutral-400 mb-2">{creator.category}</div>
                <p className="text-xs text-neutral-300 line-clamp-2 leading-relaxed">
                  {creator.bio}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};
