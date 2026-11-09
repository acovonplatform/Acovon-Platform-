import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LivestreamAccessMode } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  Radio,
  Users,
  DollarSign,
  Lock,
  Globe,
  Crown,
  Ticket,
  Key,
  Calendar,
  Sparkles,
  Plus,
  Play,
  CheckCircle2,
  Filter,
  Flame,
  ArrowRight,
  BarChart2,
  Film,
  Eye
} from 'lucide-react';

export const LivestreamsHub: React.FC = () => {
  const {
    livestreams,
    setActiveLivestreamId,
    setIsCreateLiveModalOpen,
    currentUser,
    activeRole,
    canUserAccessLivestream,
    canUserAccessReplay,
    purchaseLivestreamRecording,
    showDemoBadges
  } = useApp();

  const isCreator = currentUser.role === 'creator' || activeRole === 'creator';

  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedModeFilter, setSelectedModeFilter] = useState<string>('all');
  const [replayTabFilter, setReplayTabFilter] = useState<'all_replays' | 'my_purchased'>('all_replays');
  const [hubFeedback, setHubFeedback] = useState<string>('');

  // Filter streams
  const filteredStreams = livestreams.filter(stream => {
    if (selectedCategory !== 'All Categories' && stream.category !== selectedCategory) {
      return false;
    }
    if (selectedModeFilter === 'live_now' && stream.status !== 'live') return false;
    if (selectedModeFilter === 'upcoming' && stream.status !== 'scheduled') return false;
    if (selectedModeFilter === 'replays' && stream.status !== 'ended') return false;
    if (selectedModeFilter === 'featured' && stream.viewerCount < 400 && stream.status !== 'live') return false;
    if (selectedModeFilter === 'public' && stream.accessMode !== 'public') return false;
    if (selectedModeFilter === 'subscriber_only' && stream.accessMode !== 'all_subscribers' && stream.accessMode !== 'selected_plan') return false;
    if (selectedModeFilter === 'paid_ppv' && stream.accessMode !== 'pay_per_view') return false;
    return true;
  });

  const liveNowStreams = filteredStreams.filter(s => s.status === 'live');
  const scheduledStreams = filteredStreams.filter(s => s.status === 'scheduled');
  const recordedReplayStreams = filteredStreams.filter(
    s =>
      s.status === 'ended' &&
      s.recordingSettings &&
      s.recordingSettings.mode !== 'disabled' &&
      s.recordingStatus !== 'removed' &&
      (s.isReplayPublished !== false ||
        s.purchasedReplayUserIds?.includes(currentUser.id) ||
        s.creatorId === currentUser.id)
  );
  const myPurchasedReplays = livestreams.filter(
    s =>
      s.status === 'ended' &&
      (s.purchasedReplayUserIds?.includes(currentUser.id) ||
        (s.recordingSettings?.includeReplayWithLiveTicket &&
          s.purchasedViewerIds?.includes(currentUser.id)))
  );
  const displayedReplays =
    replayTabFilter === 'my_purchased' ? myPurchasedReplays : recordedReplayStreams;

  const getModeBadge = (mode: LivestreamAccessMode, ppvPrice?: number) => {
    switch (mode) {
      case 'public':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-300 bg-blue-950/70 border border-blue-500/30 px-2 py-0.5 rounded-full backdrop-blur-md">
            <Globe className="w-3 h-3" />
            Public Live
          </span>
        );
      case 'all_subscribers':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-2 py-0.5 rounded-full backdrop-blur-md">
            <Users className="w-3 h-3" />
            Subscribers Only
          </span>
        );
      case 'selected_plan':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#fce7b0] bg-[#d4af37]/20 border border-[#d4af37]/40 px-2 py-0.5 rounded-full backdrop-blur-md">
            <Crown className="w-3 h-3 text-[#d4af37]" />
            Tier Exclusive
          </span>
        );
      case 'pay_per_view':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full backdrop-blur-md">
            <Ticket className="w-3 h-3" />
            PPV Ticket ${ppvPrice?.toFixed(2) || '9.99'}
          </span>
        );
      case 'private_invite':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-300 bg-purple-950/70 border border-purple-500/30 px-2 py-0.5 rounded-full backdrop-blur-md">
            <Key className="w-3 h-3" />
            Private Invite
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* HERO BANNER: ACOVON LIVE */}
      <div className="relative rounded-3xl overflow-hidden border border-zinc-800 bg-gradient-to-r from-zinc-950 via-[#141418] to-zinc-950 p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#d4af37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-80 h-80 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 text-xs font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            Acovon Live Broadcast Network
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Real-Time Creator Experience &amp; Monetization
          </h1>

          <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
            Tune into live masterclasses, studio sessions, and exclusive VIP roundtables. Support creators with virtual gifts, priority questions, and live tipping.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {isCreator && (
              <button
                onClick={() => setIsCreateLiveModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer"
              >
                <Radio className="w-4 h-4" />
                Go Live as Creator
              </button>
            )}

            {liveNowStreams.length > 0 && (
              <button
                onClick={() => setActiveLivestreamId(liveNowStreams[0].id)}
                className="px-5 py-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-semibold text-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                Watch Featured Stream
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#d4af37] text-black shadow-md shadow-[#d4af37]/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Discovery Filter Pills */}
        <div className="flex items-center gap-2 text-xs overflow-x-auto pb-1 scrollbar-none">
          <span className="text-zinc-500 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Discover:
          </span>
          {[
            { id: 'all', label: 'All Streams' },
            { id: 'live_now', label: 'Live Now' },
            { id: 'replays', label: 'Official Replays' },
            { id: 'upcoming', label: 'Upcoming Livestreams' },
            { id: 'featured', label: 'Featured Streams' },
            { id: 'public', label: 'Public Streams' },
            { id: 'subscriber_only', label: 'Subscriber-Only Streams' },
            { id: 'paid_ppv', label: 'Paid PPV Live Events' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedModeFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedModeFilter === f.id
                  ? 'bg-[#d4af37] text-black font-semibold shadow-sm'
                  : 'bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {hubFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{hubFeedback}</span>
        </div>
      )}

      {/* SECTION 1: LIVE NOW */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-wide">Live Now</h2>
            <span className="text-xs text-zinc-500 font-mono">({liveNowStreams.length})</span>
          </div>
          <span className="text-xs text-zinc-400">Broadcasting in real-time</span>
        </div>

        {liveNowStreams.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <Radio className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No streams currently live</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              There are no live broadcasts matching your current filter. Start your own broadcast or check scheduled events.
            </p>
            <button
              onClick={() => setIsCreateLiveModalOpen(true)}
              className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors"
            >
              Start Broadcast
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveNowStreams.map(stream => {
              const access = canUserAccessLivestream(stream);
              const isLocked = !access.canAccess;

              return (
                <div
                  key={stream.id}
                  onClick={() => setActiveLivestreamId(stream.id)}
                  className="group relative rounded-2xl overflow-hidden bg-[#111114] border border-zinc-800/80 hover:border-[#d4af37]/60 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col"
                >
                  {/* Thumbnail / Cover */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    <img
                      src={stream.coverImage}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/20 to-black/60" />

                    {/* Live Badge & Viewers (Top Left & Right) */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-md animate-pulse">
                        <Radio className="w-3 h-3" />
                        Live
                      </span>
                      {showDemoBadges && stream.isDemo && (
                        <span className="text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded bg-zinc-900/90 border border-zinc-700 text-zinc-300 backdrop-blur-md">
                          DEMO
                        </span>
                      )}
                      {getModeBadge(stream.accessMode, stream.ppvTicketPrice)}
                      {stream.recordingSettings && stream.recordingSettings.mode !== 'disabled' && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-red-200 bg-red-950/80 border border-red-500/40 px-2 py-0.5 rounded-full shadow-md">
                          <Film className="w-3 h-3 text-red-400" />
                          {stream.recordingSettings.mode === 'paid'
                            ? `Replay $${(stream.recordingSettings.price || 9.99).toFixed(2)}`
                            : 'Free Replay'}
                        </span>
                      )}
                      {stream.activePoll?.isActive && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold text-[#fce7b0] bg-black/80 border border-[#d4af37]/50 px-2 py-0.5 rounded-full shadow-md">
                          <BarChart2 className="w-3 h-3 text-[#d4af37]" />
                          Live Poll
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-semibold text-zinc-200">
                      <Users className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{stream.viewerCount.toLocaleString()}</span>
                    </div>

                    {/* Lock Overlay Badge if non-permitted */}
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-black/80 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] mb-2 shadow-lg">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {stream.accessMode === 'all_subscribers' && 'Subscribers Only'}
                          {stream.accessMode === 'selected_plan' && 'VIP Tier Only'}
                          {stream.accessMode === 'pay_per_view' && `Ticket: $${stream.ppvTicketPrice?.toFixed(2)}`}
                          {stream.accessMode === 'private_invite' && 'Passcode Required'}
                        </span>
                        <span className="text-[11px] text-zinc-300 mt-1">
                          Click to view entry details
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info Card Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Creator Row */}
                      <div className="flex items-center gap-2.5 mb-2">
                        <img
                          src={stream.creatorAvatar}
                          alt={stream.creatorName}
                          className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/60"
                        />
                        <span className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                          <span className="truncate">{stream.creatorName}</span>
                          <span className="text-[10px] text-zinc-400 font-normal inline-flex items-center gap-0.5">
                            @{stream.creatorUsername}
                            <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                          </span>
                        </span>
                        <span className="text-[11px] text-zinc-500 font-mono ml-auto">
                          {stream.startedAt || 'Active'}
                        </span>
                      </div>

                      {/* Stream Title */}
                      <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[#fce7b0] transition-colors mb-2">
                        {stream.title}
                      </h3>

                      {/* Description Teaser */}
                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {stream.description}
                      </p>
                    </div>

                    {/* Footer Tags & CTA */}
                    <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-[11px] text-zinc-500">
                        <span>#{stream.category.split(' ')[0]}</span>
                        {stream.tags[0] && <span>· #{stream.tags[0]}</span>}
                      </div>

                      <span className="font-bold text-[#d4af37] group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                        {isLocked ? 'Unlock Stream' : 'Join Live'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: SCHEDULED LIVESTREAMS */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-xl font-bold text-white tracking-wide">Upcoming Live Events</h2>
            <span className="text-xs text-zinc-500 font-mono">({scheduledStreams.length})</span>
          </div>
          <span className="text-xs text-zinc-400">Pre-order tickets or set reminders</span>
        </div>

        {scheduledStreams.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-500">
            No upcoming scheduled broadcasts at this time. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledStreams.map(stream => (
              <div
                key={stream.id}
                onClick={() => setActiveLivestreamId(stream.id)}
                className="p-4 rounded-2xl bg-[#111114] border border-zinc-800 hover:border-[#d4af37]/60 transition-all cursor-pointer flex gap-4 items-center group"
              >
                <img
                  src={stream.coverImage}
                  alt={stream.title}
                  className="w-28 h-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/10 px-2 py-0.5 rounded">
                      {stream.scheduledFor || 'Upcoming'}
                    </span>
                    {getModeBadge(stream.accessMode, stream.ppvTicketPrice)}
                  </div>
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-[#fce7b0] transition-colors">
                    {stream.title}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-400">
                    <span className="inline-flex items-center gap-1 text-zinc-200 font-medium">
                      <span>{stream.creatorName}</span>
                      <span className="text-[10px] text-zinc-400 font-normal inline-flex items-center gap-0.5">
                        @{stream.creatorUsername}
                        <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                      </span>
                    </span>
                    <span>·</span>
                    <span>{stream.expectedDurationMinutes} min duration</span>
                    {stream.recordingSettings && stream.recordingSettings.mode !== 'disabled' && (
                      <>
                        <span>·</span>
                        <span className="text-[#fce7b0]">
                          {stream.recordingSettings.mode === 'paid'
                            ? `Replay $${(stream.recordingSettings.price || 9.99).toFixed(2)}`
                            : 'Free Replay'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: OFFICIAL RECORDED REPLAYS & FAN REPLAY LIBRARY */}
      <div className="space-y-4 pt-6 border-t border-zinc-800/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-[#d4af37]" />
              <h2 className="text-xl font-bold text-white tracking-wide">
                Official Recorded Replays &amp; Vault
              </h2>
              <span className="text-xs text-zinc-500 font-mono">({displayedReplays.length})</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Creator-authorized server recordings available for free or on-demand purchase.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setReplayTabFilter('all_replays')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                replayTabFilter === 'all_replays'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              All Official Replays ({recordedReplayStreams.length})
            </button>
            <button
              onClick={() => setReplayTabFilter('my_purchased')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                replayTabFilter === 'my_purchased'
                  ? 'bg-[#d4af37] text-black shadow-md'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
              }`}
            >
              My Purchased Replays ({myPurchasedReplays.length})
            </button>
          </div>
        </div>

        {displayedReplays.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-500">
            {replayTabFilter === 'my_purchased'
              ? 'You have not purchased any paid livestream recordings yet. Unlock an official replay below to add it to your permanent library.'
              : 'No completed livestream recordings match your current category filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedReplays.map(stream => {
              const replayCheck = canUserAccessReplay(stream);
              const isUnlocked = replayCheck.canAccess;
              const recMode = stream.recordingSettings?.mode || 'free';
              const recPrice = stream.recordingSettings?.price || 9.99;
              const isPurchasedByMe = Boolean(
                stream.purchasedReplayUserIds?.includes(currentUser.id) ||
                  (stream.recordingSettings?.includeReplayWithLiveTicket &&
                    stream.purchasedViewerIds?.includes(currentUser.id))
              );

              return (
                <div
                  key={stream.id}
                  onClick={() => setActiveLivestreamId(stream.id)}
                  className="group relative rounded-2xl overflow-hidden bg-[#111114] border border-zinc-800/80 hover:border-[#d4af37]/60 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    <img
                      src={stream.coverImage}
                      alt={stream.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/25 to-black/60" />

                    {/* Top Left Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-zinc-900/90 border border-[#d4af37]/50 text-[#fce7b0]">
                        <Film className="w-3 h-3 text-[#d4af37]" />
                        Official Replay
                      </span>

                      {recMode === 'free' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300">
                          Free Replay
                        </span>
                      ) : isPurchasedByMe ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300">
                          Purchased ✓
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#fce7b0]">
                          Paid Replay · ${recPrice.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Top Right Views */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-zinc-200">
                      <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>{(stream.replayViewsCount || 0).toLocaleString()}</span>
                    </div>

                    {/* Center Overlay if Locked */}
                    {!isUnlocked && (
                      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-black/85 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37] mb-2 shadow-lg">
                          <Lock className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {recMode === 'paid'
                            ? `Unlock Recording · $${recPrice.toFixed(2)}`
                            : replayCheck.reason === 'follower_required'
                            ? 'Followers Only Replay'
                            : 'Subscribers Only Replay'}
                        </span>
                        <span className="text-[11px] text-zinc-300 mt-0.5">
                          {stream.expectedDurationMinutes} min full broadcast
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <img
                          src={stream.creatorAvatar}
                          alt={stream.creatorName}
                          className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/60"
                        />
                        <span className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                          <span className="truncate">{stream.creatorName}</span>
                          <span className="text-[10px] text-zinc-400 font-normal inline-flex items-center gap-0.5">
                            @{stream.creatorUsername}
                            <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                          </span>
                        </span>
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                          {stream.endedAt || stream.startedAt}
                        </span>
                      </div>

                      <h3 className="font-bold text-white text-sm line-clamp-2 group-hover:text-[#fce7b0] transition-colors mb-1.5">
                        {stream.title}
                      </h3>

                      <p className="text-xs text-zinc-400 line-clamp-2 mb-3">
                        {stream.recordingSettings?.description || stream.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-zinc-500 font-mono">
                        {stream.expectedDurationMinutes}m · {stream.recordingExpiresAt === 'Unlimited' ? 'Permanent Access' : `Until ${stream.recordingExpiresAt || 'Unlimited'}`}
                      </span>

                      {!isUnlocked && recMode === 'paid' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const res = purchaseLivestreamRecording(stream.id);
                            if (res.success) {
                              setHubFeedback(`Unlocked "${stream.title}"! Opening replay player...`);
                              setTimeout(() => setHubFeedback(''), 4000);
                              setActiveLivestreamId(stream.id);
                            } else {
                              setActiveLivestreamId(stream.id);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-xs hover:brightness-110 transition-all cursor-pointer"
                        >
                          Unlock (${recPrice.toFixed(2)})
                        </button>
                      ) : (
                        <span className="font-bold text-[#d4af37] group-hover:translate-x-1 transition-transform flex items-center gap-1 text-xs">
                          {isUnlocked ? 'Watch Replay' : 'Unlock Replay'}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
