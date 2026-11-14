import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { LivestreamAccessMode } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  Radio,
  Users,
  Lock,
  Globe,
  Crown,
  Ticket,
  Key,
  Calendar,
  CheckCircle2,
  ArrowRight,
  BarChart2,
  Film,
  Eye,
  Search,
  X
} from 'lucide-react';

interface LivestreamsHubProps {
  searchQuery?: string;
  onClearSearch?: () => void;
}

export const LivestreamsHub: React.FC<LivestreamsHubProps> = ({
  searchQuery = '',
  onClearSearch
}) => {
  const {
    livestreams,
    setActiveLivestreamId,
    setIsCreateLiveModalOpen,
    currentUser,
    isAuthenticated,
    activeRole,
    canUserAccessLivestream,
    canUserAccessReplay,
    purchaseLivestreamRecording
  } = useApp();

  const isCreator = isAuthenticated && (currentUser.role === 'creator' || activeRole === 'creator');

  const [replayTabFilter, setReplayTabFilter] = useState<'all_replays' | 'my_purchased'>('all_replays');
  const [hubFeedback, setHubFeedback] = useState<string>('');

  // Filter streams
  const normalizedSearch = searchQuery.trim().toLowerCase();
  const matchesLiveSearch = (stream: (typeof livestreams)[number]) => {
    if (!normalizedSearch) return true;
    const cleanQ = normalizedSearch.replace(/^[@#]/, '');
    return (
      stream.title.toLowerCase().includes(normalizedSearch) ||
      stream.description.toLowerCase().includes(normalizedSearch) ||
      stream.creatorName.toLowerCase().includes(normalizedSearch) ||
      stream.creatorUsername.toLowerCase().includes(cleanQ) ||
      stream.category.toLowerCase().includes(normalizedSearch) ||
      stream.accessMode.replace(/_/g, ' ').toLowerCase().includes(normalizedSearch)
    );
  };

  const filteredStreams = livestreams.filter(matchesLiveSearch);

  const liveNowStreams = filteredStreams.filter(s => s.status === 'live');
  const scheduledStreams = filteredStreams.filter(s => s.status === 'scheduled');
  const recordedReplayStreams = filteredStreams.filter(
    s =>
      s.status === 'ended' &&
      s.recordingSettings &&
      s.recordingSettings.mode !== 'disabled' &&
      s.recordingStatus !== 'removed' &&
      (s.isReplayPublished !== false ||
        (isAuthenticated &&
          (s.purchasedReplayUserIds?.includes(currentUser.id) ||
            s.creatorId === currentUser.id)))
  );
  const myPurchasedReplays = isAuthenticated
    ? livestreams.filter(
        s =>
          matchesLiveSearch(s) &&
          s.status === 'ended' &&
          (s.purchasedReplayUserIds?.includes(currentUser.id) ||
            (s.recordingSettings?.includeReplayWithLiveTicket &&
              s.purchasedViewerIds?.includes(currentUser.id)))
      )
    : [];
  const displayedReplays =
    isAuthenticated && replayTabFilter === 'my_purchased' ? myPurchasedReplays : recordedReplayStreams;

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

      {hubFeedback && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{hubFeedback}</span>
        </div>
      )}

      {normalizedSearch.length > 0 && (
        <div className="px-3.5 py-2 rounded-xl bg-[#141418] border border-[#27272a] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-neutral-300">
            <Search className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
            <span>
              Filtering live &amp; replays by <strong className="text-[#fce7b0]">&ldquo;{searchQuery.trim()}&rdquo;</strong> ({filteredStreams.length} {filteredStreams.length === 1 ? 'broadcast' : 'broadcasts'})
            </span>
          </div>
          {onClearSearch && (
            <button
              type="button"
              onClick={onClearSearch}
              className="px-2 py-0.5 rounded-lg bg-[#1f1f26] hover:bg-[#2a2a34] text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      )}

      {/* SECTION 1: LIVE NOW */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">Live Now</h2>
            <span className="text-xs text-zinc-500 font-mono">({liveNowStreams.length})</span>
          </div>
          <span className="text-xs text-zinc-400">Broadcasting in real-time</span>
        </div>

        {liveNowStreams.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
            <Radio className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No streams currently live</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              There are no live broadcasts matching your current filter. Check scheduled events or replays below.
            </p>
            {isCreator && (
              <button
                onClick={() => setIsCreateLiveModalOpen(true)}
                className="mt-4 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-white transition-colors cursor-pointer"
              >
                Start Broadcast
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-6">
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
                    {stream.coverImage ? (
                      <img
                        src={stream.coverImage}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-zinc-700">
                        <Radio className="w-10 h-10" />
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/20 to-black/60" />

                    {/* Live Badge & Viewers (Top Left & Right) */}
                    <div className="absolute top-2.5 left-2.5 right-20 flex flex-wrap items-center gap-1.5">
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white shadow-md animate-pulse">
                        <Radio className="w-3 h-3" />
                        Live
                      </span>
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
                        {stream.creatorAvatar ? (
                          <img
                            src={stream.creatorAvatar}
                            alt={stream.creatorName}
                            className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/60"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-zinc-800 border border-[#d4af37]/60 flex items-center justify-center text-[10px] font-bold text-[#fce7b0]">
                            {(stream.creatorName || 'C').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="text-xs font-semibold text-zinc-200 truncate flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 truncate">
                            <span className="truncate">{stream.creatorName}</span>
                            <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                          </span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            @{stream.creatorUsername}
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#d4af37]" />
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">Upcoming Live Events</h2>
            <span className="text-xs text-zinc-500 font-mono">({scheduledStreams.length})</span>
          </div>
          <span className="text-xs text-zinc-400">Pre-order tickets or set reminders</span>
        </div>

        {scheduledStreams.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-500">
            No upcoming scheduled broadcasts at this time. Check back soon!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-4">
            {scheduledStreams.map(stream => (
              <div
                key={stream.id}
                onClick={() => setActiveLivestreamId(stream.id)}
                className="p-3.5 sm:p-4 rounded-2xl bg-[#111114] border border-zinc-800 hover:border-[#d4af37]/60 transition-all cursor-pointer flex flex-col xs:flex-row gap-3 sm:gap-4 xs:items-center group"
              >
                {stream.coverImage ? (
                  <img
                    src={stream.coverImage}
                    alt={stream.title}
                    className="w-full xs:w-28 h-32 xs:h-20 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-full xs:w-28 h-32 xs:h-20 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                    <Radio className="w-6 h-6" />
                  </div>
                )}
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
                    <span className="inline-flex items-center gap-1.5 text-zinc-200 font-medium">
                      <span className="inline-flex items-center gap-1">
                        <span>{stream.creatorName}</span>
                        <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                      </span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        @{stream.creatorUsername}
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

          <div className="flex flex-wrap items-center gap-2">
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
            {isAuthenticated && (
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
            )}
          </div>
        </div>

        {displayedReplays.length === 0 ? (
          <div className="p-10 text-center rounded-2xl bg-zinc-950/40 border border-zinc-800/60 text-xs text-zinc-500">
            {isAuthenticated && replayTabFilter === 'my_purchased'
              ? 'You have not purchased any paid livestream recordings yet. Unlock an official replay below to add it to your permanent library.'
              : 'No completed livestream recordings match your current category filter.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4 sm:gap-6">
            {displayedReplays.map(stream => {
              const replayCheck = canUserAccessReplay(stream);
              const isUnlocked = replayCheck.canAccess;
              const recMode = stream.recordingSettings?.mode || 'free';
              const recPrice = stream.recordingSettings?.price || 9.99;
              const isPurchasedByMe = Boolean(
                isAuthenticated &&
                  (stream.purchasedReplayUserIds?.includes(currentUser.id) ||
                    (stream.recordingSettings?.includeReplayWithLiveTicket &&
                      stream.purchasedViewerIds?.includes(currentUser.id)))
              );

              return (
                <div
                  key={stream.id}
                  onClick={() => setActiveLivestreamId(stream.id)}
                  className="group relative rounded-2xl overflow-hidden bg-[#111114] border border-zinc-800/80 hover:border-[#d4af37]/60 transition-all cursor-pointer shadow-lg hover:shadow-2xl flex flex-col"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-zinc-900">
                    {stream.coverImage ? (
                      <img
                        src={stream.coverImage}
                        alt={stream.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-900 to-black text-zinc-700">
                        <Film className="w-10 h-10" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111114] via-black/25 to-black/60" />

                    {/* Top Left Badges */}
                    <div className="absolute top-2.5 left-2.5 right-20 flex items-center gap-1.5 flex-wrap">
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
                          <span className="inline-flex items-center gap-1 truncate">
                            <span className="truncate">{stream.creatorName}</span>
                            <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                          </span>
                          <span className="text-[10px] text-zinc-400 font-normal">
                            @{stream.creatorUsername}
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
