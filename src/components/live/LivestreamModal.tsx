import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { MOCK_GIFTS } from '../../data/mockData';
import { VirtualGift } from '../../types';
import {
  X,
  Radio,
  Users,
  DollarSign,
  Gift,
  Send,
  Sparkles,
  Lock,
  Key,
  MessageSquare,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Share2,
  Zap,
  HelpCircle,
  CheckCircle2,
  Video,
  VideoOff,
  Mic,
  MicOff,
  CreditCard,
  Crown,
  Scissors,
  BarChart2,
  Film,
  Eye,
  UserPlus
} from 'lucide-react';
import { LivePollOverlay } from './LivePollOverlay';
import { CreatePollModal } from './CreatePollModal';
import { CreateClipModal } from './CreateClipModal';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface LivestreamModalProps {
  onNavigateToCreator?: (creatorId: string) => void;
}

export const LivestreamModal: React.FC<LivestreamModalProps> = ({
  onNavigateToCreator
}) => {
  const {
    livestreams,
    activeLivestreamId,
    setActiveLivestreamId,
    currentUser,
    liveChat,
    sendLiveChatMessage,
    sendLiveGift,
    sendLiveTip,
    purchaseLivestreamTicket,
    unlockInviteStream,
    canUserAccessLivestream,
    canUserAccessReplay,
    purchaseLivestreamRecording,
    incrementReplayView,
    toggleFollowCreator,
    creators,
    subscribeToCreator,
    endBroadcast
  } = useApp();

  const stream = livestreams.find(s => s.id === activeLivestreamId);

  // States
  const [chatInput, setChatInput] = useState('');
  const [selectedChatType, setSelectedChatType] = useState<'standard' | 'highlighted' | 'priority_question'>('standard');
  const [showGiftDrawer, setShowGiftDrawer] = useState(false);
  const [showTipDrawer, setShowTipDrawer] = useState(false);
  const [customTipAmount, setCustomTipAmount] = useState('10');
  const [tipNote, setTipNote] = useState('');
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState('');
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [celebrationGift, setCelebrationGift] = useState<{ senderName: string; gift: VirtualGift } | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);
  const [selectedTierForUpgrade, setSelectedTierForUpgrade] = useState<string>('');
  const [actionError, setActionError] = useState<string>('');
  const [showClipModal, setShowClipModal] = useState<boolean>(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState<boolean>(false);
  const [recordingPurchaseSuccess, setRecordingPurchaseSuccess] = useState<string>('');

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCountedReplayViewRef = useRef<string | null>(null);

  // Auto-scroll chat
  const streamMessages = (stream && liveChat[stream.id]) || [];
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [streamMessages.length, selectedChatType]);

  // Clear celebration after 4.5 seconds
  useEffect(() => {
    if (celebrationGift) {
      const timer = setTimeout(() => setCelebrationGift(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [celebrationGift]);

  // Count replay view once when an ended replay is opened and unlocked
  useEffect(() => {
    if (stream && stream.status === 'ended' && hasCountedReplayViewRef.current !== stream.id) {
      const check = canUserAccessReplay(stream);
      if (check.canAccess) {
        hasCountedReplayViewRef.current = stream.id;
        incrementReplayView(stream.id);
      }
    }
  }, [stream?.id, stream?.status, stream?.purchasedReplayUserIds?.length]);

  if (!stream) return null;

  const isCreatorOfStream = currentUser.id === stream.creatorId;
  const isEndedReplay = stream.status === 'ended';
  const liveAccessCheck = canUserAccessLivestream(stream);
  const replayAccessCheck = canUserAccessReplay(stream);
  const canWatchVideo = isEndedReplay ? replayAccessCheck.canAccess : liveAccessCheck.canAccess;
  const streamCreator = creators.find(c => c.id === stream.creatorId);
  const recMode = stream.recordingSettings?.mode || 'disabled';
  const isReplayAlreadyPurchased = Boolean(
    stream.purchasedReplayUserIds?.includes(currentUser.id) ||
      (stream.recordingSettings?.includeReplayWithLiveTicket &&
        stream.purchasedViewerIds?.includes(currentUser.id))
  );

  // Play / Pause handler
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setShowCopyToast(true);
    setTimeout(() => setShowCopyToast(false), 2500);
  };

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    setActionError('');

    let amount = 0;
    if (selectedChatType === 'highlighted') amount = 2.0;
    if (selectedChatType === 'priority_question') amount = 5.0;

    const res = sendLiveChatMessage(stream.id, chatInput.trim(), selectedChatType, amount);
    if (!res.success) {
      setActionError(res.error || 'Failed to send message');
      return;
    }
    setChatInput('');
    setSelectedChatType('standard');
  };

  const handleSendGift = (gift: VirtualGift) => {
    setActionError('');
    const res = sendLiveGift(stream.id, gift.id);
    if (!res.success) {
      setActionError(res.error || 'Failed to send gift');
      return;
    }
    setShowGiftDrawer(false);
    setCelebrationGift({ senderName: currentUser.name, gift });
  };

  const handleSendTip = (amount: number) => {
    setActionError('');
    const res = sendLiveTip(stream.id, amount, tipNote);
    if (!res.success) {
      setActionError(res.error || 'Failed to send tip');
      return;
    }
    setShowTipDrawer(false);
    setTipNote('');
    // Trigger celebration for large tips >= $25
    if (amount >= 25) {
      setCelebrationGift({
        senderName: currentUser.name,
        gift: {
          id: 'tip_super',
          name: `$${amount.toFixed(2)} Tip`,
          price: amount,
          icon: '✨',
          animationColor: '#d4af37',
          description: 'Generous stream contribution'
        }
      });
    }
  };

  const handleUnlockPasscode = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    const res = unlockInviteStream(stream.id, passcodeInput);
    if (!res.success) {
      setPasscodeError(res.error || 'Incorrect passcode');
    }
  };

  const handleTicketPurchase = () => {
    setActionError('');
    const res = purchaseLivestreamTicket(stream.id);
    if (!res.success) {
      setActionError(res.error || 'Ticket purchase failed');
    }
  };

  const handleSubscribeNow = (tierId?: string) => {
    setActionError('');
    const targetTierId = tierId || selectedTierForUpgrade || streamCreator?.tiers[0]?.id;
    if (!targetTierId) return;
    const res = subscribeToCreator(stream.creatorId, targetTierId);
    if (!res.success) {
      setActionError(res.error || 'Subscription failed');
    }
  };

  const handlePurchaseRecording = () => {
    setActionError('');
    setRecordingPurchaseSuccess('');
    const res = purchaseLivestreamRecording(stream.id);
    if (!res.success) {
      setActionError(res.error || 'Recording purchase failed');
    } else {
      setRecordingPurchaseSuccess(
        `Official recording unlocked! Added "${stream.title}" to your Purchased Replays library.`
      );
      setTimeout(() => setRecordingPurchaseSuccess(''), 4500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Toast Notification for Link Copy */}
      {showCopyToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-60 bg-zinc-900 border border-[#d4af37]/40 px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-sm text-[#fce7b0]">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37]" />
          Stream link copied to clipboard!
        </div>
      )}

      {/* Main Container */}
      <div className="relative w-full h-[100dvh] lg:h-full max-w-[1720px] lg:max-h-[96vh] flex flex-col lg:flex-row bg-[#0c0c0e] lg:rounded-2xl border-0 lg:border border-zinc-800/80 overflow-hidden shadow-2xl">
        
        {/* Left/Main Column: Video Player & Controls */}
        <div className="flex-none lg:flex-1 flex flex-col relative h-[44dvh] sm:h-[50dvh] lg:h-full bg-black overflow-hidden">
          
          {/* Top Bar Overlay */}
          <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between gap-2 p-2.5 sm:p-4 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
            {/* Creator Info & Live Badge */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <img
                  src={stream.creatorAvatar}
                  alt={stream.creatorName}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full object-cover border-2 border-[#d4af37]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-emerald-500 rounded-full border-2 border-black" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h3 className="font-semibold text-white text-xs sm:text-base tracking-wide truncate">
                    {stream.creatorName}
                  </h3>
                  <span className="text-[11px] text-neutral-400 inline-flex items-center gap-1">
                    <span>@{stream.creatorUsername}</span>
                    <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                  </span>
                  {isEndedReplay ? (
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#fce7b0]">
                      <Film className="w-3 h-3 text-[#d4af37]" />
                      <span>Replay</span>
                    </span>
                  ) : stream.status === 'scheduled' ? (
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      Scheduled
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white animate-pulse">
                      <Radio className="w-3 h-3" />
                      <span>Live</span>
                    </span>
                  )}

                  {/* Official Recording Active Indicator */}
                  {!isEndedReplay && recMode !== 'disabled' && (
                    <span
                      className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900/90 border border-red-500/40 text-red-300"
                      title="This broadcast is being recorded by ACOVON servers for official replay distribution"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                      REC · {recMode === 'paid' ? `Paid Replay ($${(stream.recordingSettings?.price || 9.99).toFixed(2)})` : 'Free Replay Enabled'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] sm:text-xs text-zinc-400 truncate max-w-[200px] sm:max-w-md">
                  {stream.title}
                </p>
              </div>
            </div>

            {/* Right Header Stats & Close */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Non-Intrusive Recording Unlock / Status Action in Header */}
              {recMode === 'paid' && !isCreatorOfStream && (
                isReplayAlreadyPurchased ? (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Recording Unlocked</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handlePurchaseRecording}
                    className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black text-xs font-bold hover:brightness-110 transition-all shadow-lg shadow-[#d4af37]/20 cursor-pointer"
                    title="Unlock official full-length server recording of this broadcast"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>Unlock Recording (${(stream.recordingSettings?.price || 9.99).toFixed(2)})</span>
                  </button>
                )
              )}

              {recMode === 'free' && !isEndedReplay && (
                <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-[11px] font-semibold text-emerald-300">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Free Replay After Stream</span>
                </span>
              )}

              {/* Viewer / Replay Counter */}
              <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-[11px] sm:text-xs font-medium text-zinc-300">
                {isEndedReplay ? (
                  <>
                    <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{(stream.replayViewsCount || 0).toLocaleString()}</span>
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5 text-zinc-400" />
                    <span>{stream.viewerCount.toLocaleString()}</span>
                  </>
                )}
              </div>

              {/* Creator Gross Revenue Badge (visible only to stream creator or admin) */}
              {(isCreatorOfStream || currentUser.role === 'admin') && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-xs font-semibold text-[#fce7b0]">
                  <DollarSign className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Gross: ${stream.totalRevenue.toFixed(2)}</span>
                </div>
              )}

              {/* Share */}
              <button
                type="button"
                onClick={handleShare}
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors cursor-pointer"
                title="Share stream"
              >
                <Share2 className="w-4 h-4" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={() => setActiveLivestreamId(null)}
                className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                title="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Recording Purchase Confirmation Toast Inside Player */}
          {recordingPurchaseSuccess && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 bg-emerald-950/95 border border-emerald-500/60 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{recordingPurchaseSuccess}</span>
            </div>
          )}

          {/* Video / Stream Area or Locked Gate UI */}
          <div className="relative flex-1 flex items-center justify-center bg-zinc-950">
            {canWatchVideo ? (
              <>
                {/* Active Video Stream */}
                <video
                  ref={videoRef}
                  src={stream.videoStreamUrl || '/videos/sample1.mp4'}
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
                  className="w-full h-full object-cover"
                />

                {/* Floating Celebration Overlay (When someone sends gift/tip) */}
                {celebrationGift && (
                  <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none animate-in zoom-in-90 fade-in duration-300">
                    <div className="px-6 py-3 rounded-2xl bg-black/85 border border-[#d4af37] shadow-[0_0_40px_rgba(212,175,55,0.35)] flex items-center gap-4 text-white">
                      <span className="text-4xl animate-bounce">{celebrationGift.gift.icon}</span>
                      <div>
                        <div className="text-xs uppercase tracking-wider text-[#d4af37] font-bold">
                          Stream Celebration
                        </div>
                        <div className="text-sm font-semibold">
                          <span className="text-[#fce7b0]">{celebrationGift.senderName}</span> sent {celebrationGift.gift.name}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30">
                        +${celebrationGift.gift.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive Live Stream Poll Overlay (Real-time voting & instant results) */}
                {stream.activePoll && (
                  <LivePollOverlay
                    streamId={stream.id}
                    poll={stream.activePoll}
                    isCreator={isCreatorOfStream}
                    onOpenCreatePoll={() => setShowCreatePollModal(true)}
                  />
                )}

                {/* Video Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex items-center justify-between z-20">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <button
                      onClick={togglePlay}
                      className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={toggleMute}
                      className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                    <span className="text-xs text-zinc-400 font-mono hidden sm:inline">1080p · 60fps</span>

                    {/* Create Clip Button (Last 30 seconds -> saved as Highlight to creator gallery) */}
                    <button
                      onClick={() => setShowClipModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 hover:bg-[#d4af37]/25 border border-[#d4af37]/50 hover:border-[#d4af37] text-xs font-semibold text-[#fce7b0] transition-all shadow-md group cursor-pointer"
                      title="Save last 30s of livestream as a Highlight in creator's content gallery"
                    >
                      <Scissors className="w-3.5 h-3.5 text-[#d4af37] group-hover:rotate-12 transition-transform" />
                      <span>Create Clip</span>
                    </button>
                  </div>

                  {/* Creator studio controls if host */}
                  {isCreatorOfStream && (
                    <div className="flex items-center gap-2">
                      {/* Launch Live Poll Button */}
                      <button
                        onClick={() => setShowCreatePollModal(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-[#d4af37]/50 hover:border-[#d4af37] text-xs font-semibold text-[#fce7b0] transition-all cursor-pointer"
                        title="Launch real-time poll to livestream viewers"
                      >
                        <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span className="hidden sm:inline">{stream.activePoll?.isActive ? 'Manage Poll' : 'Live Poll'}</span>
                        <span className="sm:hidden">Poll</span>
                      </button>

                      <button
                        onClick={() => setIsMicOn(!isMicOn)}
                        className={`p-2 rounded-full border transition-colors ${isMicOn ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-red-500/20 border-red-500 text-red-400'}`}
                        title="Toggle Mic"
                      >
                        {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => setIsCameraOn(!isCameraOn)}
                        className={`p-2 rounded-full border transition-colors ${isCameraOn ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-red-500/20 border-red-500 text-red-400'}`}
                        title="Toggle Camera"
                      >
                        {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to end this livestream broadcast?')) {
                            endBroadcast(stream.id);
                            setActiveLivestreamId(null);
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors cursor-pointer"
                      >
                        End Broadcast
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : isEndedReplay ? (
              /* ============================================================ */
              /* LOCKED OFFICIAL REPLAY GATE UI (AFTER LIVESTREAM HAS ENDED)  */
              /* ============================================================ */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 overflow-hidden">
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20 scale-105"
                  style={{ backgroundImage: `url(${stream.coverImage})` }}
                />

                <div className="relative z-10 max-w-lg w-full bg-[#121215]/95 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                  <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
                    <Film className="w-7 h-7" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1 block">
                    {replayAccessCheck.reason === 'replay_purchase_required' && 'Official Paid Broadcast Recording'}
                    {replayAccessCheck.reason === 'follower_required' && 'Followers-Only Official Replay'}
                    {replayAccessCheck.reason === 'subscription_required' && 'Subscribers-Only Official Replay'}
                    {replayAccessCheck.reason === 'tier_upgrade_required' && 'VIP Tier Official Replay'}
                    {replayAccessCheck.reason === 'recording_disabled' && 'Live Broadcast Ended · No Replay'}
                    {replayAccessCheck.reason === 'recording_unpublished' && 'Replay Currently Unpublished'}
                    {replayAccessCheck.reason === 'invite_required' && 'Private Invited Replay'}
                  </span>

                  <h2 className="text-xl font-bold text-white mb-2">{stream.title}</h2>
                  <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
                    {stream.recordingSettings?.description || stream.description}
                  </p>

                  {/* REPLAY GATE 1: Paid Recording Unlock */}
                  {replayAccessCheck.reason === 'replay_purchase_required' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-zinc-900/90 border border-[#d4af37]/30 flex items-center justify-between text-left">
                        <div>
                          <div className="text-xs text-zinc-400">Official Server Recording</div>
                          <div className="text-sm font-semibold text-white">
                            Full {stream.expectedDurationMinutes}-Min Replay Access
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-0.5">
                            Availability: {stream.recordingExpiresAt || 'Unlimited On-Demand'}
                          </div>
                        </div>
                        <div className="text-2xl font-bold font-mono text-[#d4af37]">
                          ${(replayAccessCheck.price || 9.99).toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={handlePurchaseRecording}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4" />
                        Unlock Official Recording (${(replayAccessCheck.price || 9.99).toFixed(2)})
                      </button>

                      <p className="text-[11px] text-zinc-500">
                        Instant unlock via your Acovon Wallet (${currentUser.walletBalance.toFixed(2)} available). Added permanently to your Purchased Replays library.
                      </p>
                    </div>
                  )}

                  {/* REPLAY GATE 2: Follower Required */}
                  {replayAccessCheck.reason === 'follower_required' && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-300">
                        Follow <span className="text-[#fce7b0] font-semibold">{stream.creatorName}</span> for free to watch this official broadcast replay.
                      </p>
                      <button
                        onClick={() => toggleFollowCreator(stream.creatorId)}
                        className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4" />
                        Follow {stream.creatorName} to Watch Free Replay
                      </button>
                    </div>
                  )}

                  {/* REPLAY GATE 3: Subscribers Only / Tier Upgrade */}
                  {(replayAccessCheck.reason === 'subscription_required' ||
                    replayAccessCheck.reason === 'tier_upgrade_required') && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-300">
                        This official recording is complimentary for{' '}
                        <span className="text-[#fce7b0] font-semibold">
                          {replayAccessCheck.requiredTierNames?.join(' or ') || `${stream.creatorName}'s active subscribers`}
                        </span>.
                      </p>
                      {streamCreator && streamCreator.tiers.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left my-3">
                          {streamCreator.tiers.map(tier => (
                            <button
                              key={tier.id}
                              onClick={() => handleSubscribeNow(tier.id)}
                              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#d4af37] transition-all text-left flex flex-col justify-between cursor-pointer"
                            >
                              <div className="font-semibold text-white text-xs">{tier.name}</div>
                              <div className="text-sm font-bold text-[#d4af37] mt-1">${tier.price.toFixed(2)}/mo</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleSubscribeNow()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-sm hover:brightness-110 transition-all cursor-pointer"
                      >
                        Subscribe to Unlock Replay
                      </button>
                    </div>
                  )}

                  {/* REPLAY GATE 4: Recording Disabled or Unpublished */}
                  {(replayAccessCheck.reason === 'recording_disabled' ||
                    replayAccessCheck.reason === 'recording_unpublished') && (
                    <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-400">
                      {replayAccessCheck.reason === 'recording_disabled'
                        ? 'The creator disabled official recording for this broadcast. No replay was archived.'
                        : 'This recording is currently unpublished by the creator and unavailable for new viewers.'}
                    </div>
                  )}

                  {actionError && (
                    <div className="mt-4 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-400">
                      {actionError}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* LOCKED LIVESTREAM GATE UI */
              <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950 overflow-hidden">
                {/* Blurred Cover Background */}
                <div
                  className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-20 scale-105"
                  style={{ backgroundImage: `url(${stream.coverImage})` }}
                />

                <div className="relative z-10 max-w-lg w-full bg-[#121215]/90 border border-zinc-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
                  <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center mx-auto mb-4 text-[#d4af37]">
                    <Lock className="w-7 h-7" />
                  </div>

                  <span className="text-xs font-bold uppercase tracking-widest text-[#d4af37] mb-1 block">
                    {stream.accessMode === 'all_subscribers' && 'Subscribers Only Stream'}
                    {stream.accessMode === 'selected_plan' && 'Tier Restricted Livestream'}
                    {stream.accessMode === 'pay_per_view' && 'Pay-Per-View Live Event'}
                    {stream.accessMode === 'private_invite' && 'Private Invitation Stream'}
                  </span>

                  <h2 className="text-xl font-bold text-white mb-2">{stream.title}</h2>
                  <p className="text-sm text-zinc-400 mb-6">
                    {stream.description}
                  </p>

                  {/* GATE TYPE 1: All Subscribers Only */}
                  {liveAccessCheck.reason === 'subscription_required' && (
                    <div className="space-y-4">
                      <p className="text-xs text-zinc-300">
                        Join <span className="text-[#fce7b0] font-semibold">{stream.creatorName}&apos;s</span> membership to instantly unlock this livestream and all subscriber privileges.
                      </p>
                      {streamCreator && streamCreator.tiers.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left my-3">
                          {streamCreator.tiers.map(tier => (
                            <button
                              key={tier.id}
                              onClick={() => handleSubscribeNow(tier.id)}
                              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-[#d4af37] transition-all text-left flex flex-col justify-between"
                            >
                              <div className="font-semibold text-white text-xs">{tier.name}</div>
                              <div className="text-sm font-bold text-[#d4af37] mt-1">${tier.price.toFixed(2)}/mo</div>
                            </button>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={() => handleSubscribeNow()}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#d4af37]/10"
                      >
                        Subscribe to Join Livestream
                      </button>
                    </div>
                  )}

                  {/* GATE TYPE 2: Selected Subscription Plan */}
                  {liveAccessCheck.reason === 'tier_upgrade_required' && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300">
                        Exclusively available to: <span className="font-semibold text-[#fce7b0]">{liveAccessCheck.requiredTierNames?.join(' or ')}</span>.
                      </div>
                      <p className="text-xs text-zinc-400">
                        Upgrade your current membership to gain entry to this private atelier stream.
                      </p>
                      {streamCreator && (
                        <div className="space-y-2 text-left">
                          {streamCreator.tiers
                            .filter(t => stream.allowedTierIds?.includes(t.id))
                            .map(tier => (
                              <button
                                key={tier.id}
                                onClick={() => handleSubscribeNow(tier.id)}
                                className="w-full p-3 rounded-xl bg-zinc-900 border border-[#d4af37]/40 hover:border-[#d4af37] transition-all flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-semibold text-white text-sm flex items-center gap-1.5">
                                    <Crown className="w-4 h-4 text-[#d4af37]" />
                                    {tier.name}
                                  </div>
                                  <div className="text-xs text-zinc-400">{tier.perks?.[0] || 'Exclusive access'}</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-[#d4af37]">${tier.price.toFixed(2)}/mo</div>
                                  <span className="text-[10px] text-zinc-400">Upgrade</span>
                                </div>
                              </button>
                            ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* GATE TYPE 3: Pay-Per-View */}
                  {liveAccessCheck.reason === 'ppv_purchase_required' && (
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-zinc-900/90 border border-[#d4af37]/30 flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-xs text-zinc-400">Admission Ticket</div>
                          <div className="text-sm font-semibold text-white">Full Live Event Access</div>
                        </div>
                        <div className="text-xl font-bold text-[#d4af37]">
                          ${liveAccessCheck.price?.toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={handleTicketPurchase}
                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#aa8c2c] text-black font-bold text-sm hover:brightness-110 transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        Purchase Entry Ticket (${liveAccessCheck.price?.toFixed(2)})
                      </button>

                      <p className="text-[11px] text-zinc-500">
                        Deducted instantly from your Acovon Wallet balance (${Number(currentUser?.walletBalance || 0).toFixed(2)} available).
                      </p>
                    </div>
                  )}

                  {/* GATE TYPE 4: Private Invitation */}
                  {liveAccessCheck.reason === 'invite_required' && (
                    <form onSubmit={handleUnlockPasscode} className="space-y-4">
                      <p className="text-xs text-zinc-400">
                        This session is restricted to invited VIP guests. Enter the invitation passcode provided by the creator.
                      </p>
                      <div>
                        <div className="relative">
                          <Key className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={passcodeInput}
                            onChange={(e) => setPasscodeInput(e.target.value)}
                            placeholder="e.g. ACOVON-KAI-77"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        </div>
                        {passcodeError && (
                          <p className="text-xs text-red-400 mt-1 text-left">{passcodeError}</p>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 rounded-xl bg-zinc-200 hover:bg-white text-black font-bold text-sm transition-colors"
                      >
                        Unlock With Passcode
                      </button>
                    </form>
                  )}

                  {actionError && (
                    <div className="mt-4 p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-400">
                      {actionError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Chat & Interactivity */}
        <div className="w-full lg:w-[420px] flex flex-col h-[48vh] lg:h-full bg-[#111114] border-t lg:border-t-0 lg:border-l border-zinc-800">
          
          {/* Live Chat Header */}
          <div className="px-4 py-3 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#d4af37]" />
              <h4 className="font-semibold text-white text-sm">Live Interaction</h4>
            </div>

            <div className="flex items-center gap-2">
              {stream.settings.subscribersOnlyChat && (
                <span className="text-[10px] font-medium text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                  Subscribers Chat Only
                </span>
              )}
            </div>
          </div>

          {/* Non-Intrusive Official Recording & Replay Status Bar */}
          {recMode !== 'disabled' && (
            <div className="px-4 py-2.5 bg-zinc-950/90 border-b border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <Film className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                <div className="truncate">
                  {recMode === 'free' ? (
                    <span className="text-emerald-300 font-medium">
                      Free Official Replay ({stream.recordingSettings?.replayPermission?.replace('_', ' ') || 'public'})
                    </span>
                  ) : isReplayAlreadyPurchased || isCreatorOfStream ? (
                    <span className="text-emerald-300 font-medium">
                      Official Recording Unlocked ✓
                    </span>
                  ) : (
                    <span className="text-zinc-300">
                      Official Replay:{' '}
                      <strong className="text-[#fce7b0]">
                        ${(stream.recordingSettings?.price || 9.99).toFixed(2)}
                      </strong>
                    </span>
                  )}
                </div>
              </div>

              {recMode === 'paid' && !isCreatorOfStream && !isReplayAlreadyPurchased && (
                <button
                  onClick={handlePurchaseRecording}
                  className="px-2.5 py-1 rounded-lg bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-[11px] shrink-0 transition-colors cursor-pointer"
                >
                  Unlock Recording
                </button>
              )}
            </div>
          )}

          {/* Messages Stream */}
          <div
            ref={chatScrollRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs"
          >
            {streamMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 p-6">
                <Sparkles className="w-8 h-8 text-zinc-600 mb-2" />
                <p>Welcome to Acovon Live!</p>
                <p className="text-[11px] text-zinc-600 mt-1">Be the first to say hello or support the creator.</p>
              </div>
            ) : (
              streamMessages.map((msg) => {
                const isHighlight = msg.type === 'highlighted';
                const isQuestion = msg.type === 'priority_question';
                const isGift = msg.type === 'gift';
                const isTip = msg.type === 'tip';

                return (
                  <div
                    key={msg.id}
                    className={`rounded-xl p-2.5 transition-all ${
                      isHighlight
                        ? 'bg-gradient-to-r from-[#d4af37]/20 to-zinc-900 border border-[#d4af37]/60 shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                        : isQuestion
                        ? 'bg-gradient-to-r from-purple-900/30 to-zinc-900 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                        : isGift
                        ? 'bg-amber-950/30 border border-amber-500/40'
                        : isTip
                        ? 'bg-emerald-950/30 border border-emerald-500/40'
                        : 'bg-zinc-900/40 hover:bg-zinc-900/70 border border-transparent hover:border-zinc-800'
                    }`}
                  >
                    {/* Header: Role badge, Sender Name, Time */}
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={msg.senderAvatar}
                          alt={msg.senderName}
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span className="font-semibold text-zinc-200 truncate max-w-[140px]">
                          {msg.senderName}
                        </span>
                        {msg.senderRole === 'creator' && (
                          <VerifiedBadge creatorId={stream.creatorId} size="xs" />
                        )}

                        {/* Role badges */}
                        {msg.senderRole === 'creator' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#d4af37] text-black">
                            Host
                          </span>
                        )}
                        {msg.senderRole === 'moderator' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-600 text-white">
                            Mod
                          </span>
                        )}
                        {msg.senderRole === 'vip' && (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40">
                            VIP
                          </span>
                        )}
                        {msg.senderRole === 'subscriber' && (
                          <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                            Sub
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {msg.amountPaid && (
                          <span className="text-[10px] font-bold text-[#d4af37] bg-[#d4af37]/15 px-1.5 py-0.2 rounded">
                            ${msg.amountPaid.toFixed(2)}
                          </span>
                        )}
                        <span className="text-[10px] text-zinc-500">{msg.timestamp}</span>
                      </div>
                    </div>

                    {/* Message Body */}
                    {isGift && msg.giftData ? (
                      <div className="flex items-center gap-2 mt-1 py-1">
                        <span className="text-2xl">{msg.giftData.icon}</span>
                        <div>
                          <div className="text-white font-medium">{msg.message}</div>
                          <div className="text-[10px] text-zinc-400">{msg.giftData.description}</div>
                        </div>
                      </div>
                    ) : isQuestion ? (
                      <div className="mt-1">
                        <div className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1 mb-0.5">
                          <HelpCircle className="w-3 h-3" />
                          Priority Q&amp;A
                        </div>
                        <p className="text-white text-xs font-medium leading-relaxed">{msg.message}</p>
                      </div>
                    ) : (
                      <p className="text-zinc-300 text-xs leading-relaxed break-words">
                        {msg.message}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action Error Banner */}
          {actionError && (
            <div className="px-4 py-2 bg-red-950/80 border-t border-red-500/40 text-xs text-red-300 flex items-center justify-between">
              <span>{actionError}</span>
              <button onClick={() => setActionError('')} className="p-0.5 text-zinc-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Virtual Gift Drawer Overlay */}
          {showGiftDrawer && (
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                  <Gift className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Send Virtual Gift</span>
                </div>
                <button
                  onClick={() => setShowGiftDrawer(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {MOCK_GIFTS.map((gift) => (
                  <button
                    key={gift.id}
                    onClick={() => handleSendGift(gift)}
                    className="p-2.5 rounded-xl bg-zinc-950/80 hover:bg-black border border-zinc-800 hover:border-[#d4af37] transition-all flex flex-col items-center text-center group"
                  >
                    <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                      {gift.icon}
                    </span>
                    <span className="text-[11px] font-medium text-white truncate w-full">
                      {gift.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#d4af37] mt-0.5">
                      ${gift.price.toFixed(2)}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Tip Drawer Overlay */}
          {showTipDrawer && (
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 animate-in slide-in-from-bottom duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-white font-semibold text-xs">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Direct Creator Tip</span>
                </div>
                <button
                  onClick={() => setShowTipDrawer(false)}
                  className="text-zinc-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[5, 10, 25, 50].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setCustomTipAmount(amt.toString())}
                    className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      customTipAmount === amt.toString()
                        ? 'bg-[#d4af37] text-black border-[#d4af37]'
                        : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>

              {/* Custom Amount + Optional Note */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">$</span>
                  <input
                    type="number"
                    value={customTipAmount}
                    onChange={(e) => setCustomTipAmount(e.target.value)}
                    placeholder="Custom amount"
                    className="w-full pl-6 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>
                <input
                  type="text"
                  value={tipNote}
                  onChange={(e) => setTipNote(e.target.value)}
                  placeholder="Add an encouraging note (optional)..."
                  maxLength={100}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <button
                onClick={() => handleSendTip(parseFloat(customTipAmount) || 5)}
                className="w-full py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold text-xs hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
              >
                Send ${parseFloat(customTipAmount) || 5} Tip
              </button>
            </div>
          )}

          {/* Chat Type Selector: Standard, Highlighted ($2), Priority Question ($5) */}
          <div className="px-3 pt-2 pb-1 bg-zinc-950/90 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedChatType('standard')}
                className={`px-2 py-1 rounded transition-colors ${
                  selectedChatType === 'standard'
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Chat
              </button>
              {stream.settings.enableHighlightedMessages && (
                <button
                  type="button"
                  onClick={() => setSelectedChatType('highlighted')}
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                    selectedChatType === 'highlighted'
                      ? 'bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40 font-medium'
                      : 'text-zinc-400 hover:text-[#d4af37]'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-[#d4af37]" />
                  Highlight ($2)
                </button>
              )}
              {stream.settings.enablePaidMessages && (
                <button
                  type="button"
                  onClick={() => setSelectedChatType('priority_question')}
                  className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                    selectedChatType === 'priority_question'
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40 font-medium'
                      : 'text-zinc-400 hover:text-purple-300'
                  }`}
                >
                  <HelpCircle className="w-3 h-3 text-purple-400" />
                  Priority Q ($5)
                </button>
              )}
            </div>

            {/* Quick Action Drawer Toggles */}
            <div className="flex items-center gap-1">
              {stream.settings.enableGifts && (
                <button
                  type="button"
                  onClick={() => {
                    setShowGiftDrawer(!showGiftDrawer);
                    setShowTipDrawer(false);
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    showGiftDrawer
                      ? 'bg-[#d4af37] text-black'
                      : 'text-zinc-400 hover:text-[#d4af37]'
                  }`}
                  title="Send Virtual Gift"
                >
                  <Gift className="w-3.5 h-3.5" />
                </button>
              )}
              {stream.settings.enableTips && (
                <button
                  type="button"
                  onClick={() => {
                    setShowTipDrawer(!showTipDrawer);
                    setShowGiftDrawer(false);
                  }}
                  className={`p-1.5 rounded transition-colors ${
                    showTipDrawer
                      ? 'bg-emerald-500 text-white'
                      : 'text-zinc-400 hover:text-emerald-400'
                  }`}
                  title="Direct Tip"
                >
                  <Zap className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Create Clip Action */}
              <button
                type="button"
                onClick={() => setShowClipModal(true)}
                className="p-1.5 rounded text-zinc-400 hover:text-[#d4af37] transition-colors cursor-pointer"
                title="Create 30s Clip (Saved as Highlight to Content Gallery)"
              >
                <Scissors className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Chat Input Field Form */}
          <form
            onSubmit={handleSendChat}
            className="p-3 bg-zinc-950 border-t border-zinc-800 flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                selectedChatType === 'highlighted'
                  ? 'Send highlighted chat ($2.00)...'
                  : selectedChatType === 'priority_question'
                  ? 'Ask a priority question ($5.00)...'
                  : 'Say something in live chat...'
              }
              className="flex-1 bg-zinc-900 border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="p-2 rounded-xl bg-[#d4af37] hover:bg-[#c29e2f] text-black font-semibold disabled:opacity-40 disabled:hover:bg-[#d4af37] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>

      {/* Viewer / Creator 30s Clip Capture Modal */}
      {showClipModal && (
        <CreateClipModal
          stream={stream}
          onClose={() => setShowClipModal(false)}
          onNavigateToGallery={(creatorId) => {
            setActiveLivestreamId(null);
            if (onNavigateToCreator) onNavigateToCreator(creatorId);
          }}
        />
      )}

      {/* Host Creator Live Poll Configuration Modal */}
      {showCreatePollModal && (
        <CreatePollModal
          streamId={stream.id}
          onClose={() => setShowCreatePollModal(false)}
        />
      )}

    </div>
  );
};
