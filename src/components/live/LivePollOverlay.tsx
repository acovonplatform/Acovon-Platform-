import React, { useState, useEffect } from 'react';
import { LivePoll } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  BarChart2, 
  CheckCircle2, 
  Clock, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  StopCircle,
  Users
} from 'lucide-react';

interface LivePollOverlayProps {
  streamId: string;
  poll: LivePoll;
  isCreator: boolean;
  onOpenCreatePoll?: () => void;
}

export const LivePollOverlay: React.FC<LivePollOverlayProps> = ({
  streamId,
  poll,
  isCreator,
  onOpenCreatePoll
}) => {
  const { currentUser, voteLivePoll, endLivePoll } = useApp();
  const [isMinimized, setIsMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(poll.durationSeconds || 180);
  const [justVotedId, setJustVotedId] = useState<string | null>(null);

  const hasVoted = Boolean(poll.votedUserIds?.[currentUser.id]);
  const userVotedOptionId = poll.votedUserIds?.[currentUser.id];

  // Countdown timer
  useEffect(() => {
    if (!poll.isActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (isCreator) {
            endLivePoll(streamId);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [poll.isActive, streamId, isCreator, endLivePoll]);

  // Gentle live audience simulation: random audience votes tick in every 5 seconds
  useEffect(() => {
    if (!poll.isActive) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.35 && poll.options.length > 0) {
        const randomOpt = poll.options[Math.floor(Math.random() * poll.options.length)];
        const simUserId = `sim_viewer_${Math.floor(Math.random() * 500)}`;
        // Only simulate if not current user
        if (simUserId !== currentUser.id) {
          voteLivePoll(streamId, poll.id, randomOpt.id);
        }
      }
    }, 4500);

    return () => clearInterval(interval);
  }, [poll.isActive, poll.id, poll.options, streamId, currentUser.id, voteLivePoll]);

  const handleVote = (optionId: string) => {
    if (!poll.isActive) return;
    setJustVotedId(optionId);
    voteLivePoll(streamId, poll.id, optionId);
    setTimeout(() => setJustVotedId(null), 1000);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!poll.isActive && poll.totalVotes === 0) return null;

  // Minimized Floating Pill
  if (isMinimized) {
    return (
      <div className="absolute bottom-16 left-4 z-30 animate-in fade-in slide-in-from-bottom-2">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/90 hover:bg-black border border-[#d4af37]/60 text-xs font-semibold text-[#fce7b0] shadow-2xl backdrop-blur-md transition-all group"
        >
          <div className="w-2 h-2 rounded-full bg-[#d4af37] animate-ping" />
          <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
          <span className="truncate max-w-[180px]">{poll.question}</span>
          <span className="text-[10px] text-zinc-400 font-mono">({poll.totalVotes})</span>
          <ChevronUp className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-16 sm:bottom-20 left-4 right-4 sm:right-auto sm:max-w-sm z-30 animate-in zoom-in-95 fade-in duration-200">
      <div className="bg-[#0e0e12]/95 border border-[#d4af37]/45 rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.85)] backdrop-blur-xl text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-zinc-800/80">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${poll.isActive ? 'bg-[#d4af37]' : 'bg-zinc-500'} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${poll.isActive ? 'bg-[#d4af37]' : 'bg-zinc-500'}`} />
            </span>
            <span className="text-[11px] font-bold tracking-wider uppercase text-[#fce7b0] flex items-center gap-1 font-brand">
              <BarChart2 className="w-3.5 h-3.5 text-[#d4af37]" />
              {poll.isActive ? 'Live Stream Poll' : 'Poll Closed'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {poll.isActive && timeLeft > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 bg-zinc-900/90 px-2 py-0.5 rounded-full border border-zinc-800">
                <Clock className="w-3 h-3 text-[#d4af37]" />
                <span>{formatTimer(timeLeft)}</span>
              </div>
            )}

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
              title="Minimize Poll"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Question */}
        <h4 className="font-semibold text-sm text-zinc-100 leading-snug mb-3">
          {poll.question}
        </h4>

        {/* Options / Results */}
        <div className="space-y-2 mb-3">
          {poll.options.map(option => {
            const percentage = poll.totalVotes > 0 
              ? Math.round((option.votes / poll.totalVotes) * 100) 
              : 0;
            const isUserVote = userVotedOptionId === option.id;
            const isWinning = poll.totalVotes > 0 && option.votes === Math.max(...poll.options.map(o => o.votes));

            // If user hasn't voted and poll is active, show interactive vote buttons
            if (!hasVoted && poll.isActive) {
              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900/90 hover:bg-[#1f1f28] border border-zinc-800 hover:border-[#d4af37] text-left text-xs font-medium text-zinc-200 hover:text-white transition-all flex items-center justify-between group cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <span className="truncate pr-2">{option.text}</span>
                  <span className="text-[11px] text-zinc-500 group-hover:text-[#fce7b0] font-semibold shrink-0">
                    Vote
                  </span>
                </button>
              );
            }

            // Results view (after user voted or poll concluded)
            return (
              <div
                key={option.id}
                onClick={() => poll.isActive && handleVote(option.id)}
                className={`relative overflow-hidden rounded-xl border p-2.5 transition-all cursor-pointer ${
                  isUserVote
                    ? 'border-[#d4af37] bg-zinc-900/90'
                    : 'border-zinc-800/90 bg-zinc-950/70 hover:border-zinc-700'
                }`}
              >
                {/* Background animated fill bar */}
                <div
                  className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ${
                    isUserVote
                      ? 'bg-gradient-to-r from-[#d4af37]/30 to-[#fce7b0]/20'
                      : isWinning
                      ? 'bg-zinc-800/80'
                      : 'bg-zinc-900/50'
                  }`}
                  style={{ width: `${percentage}%` }}
                />

                {/* Option Content Overlay */}
                <div className="relative z-10 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isUserVote && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                    )}
                    <span className={`truncate font-medium ${isUserVote ? 'text-[#fce7b0] font-semibold' : 'text-zinc-200'}`}>
                      {option.text}
                    </span>
                    {isUserVote && (
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#d4af37]/20 text-[#fce7b0] font-bold shrink-0">
                        You
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                    <span className="text-zinc-400 text-[10px] hidden sm:inline">
                      {option.votes}
                    </span>
                    <span className={`font-bold ${isUserVote ? 'text-[#fce7b0]' : 'text-white'}`}>
                      {percentage}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer info & Creator Controls */}
        <div className="flex items-center justify-between pt-1 text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-zinc-500" />
            <span className="font-mono">{poll.totalVotes} total votes</span>
          </div>

          {/* Host creator end poll button */}
          {isCreator && poll.isActive && (
            <button
              onClick={() => endLivePoll(streamId)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-300 font-semibold text-[10px] transition-colors"
            >
              <StopCircle className="w-3 h-3" />
              <span>End Poll</span>
            </button>
          )}

          {/* Host launch new poll button if ended */}
          {isCreator && !poll.isActive && onOpenCreatePoll && (
            <button
              onClick={onOpenCreatePoll}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-[10px] transition-colors"
            >
              <Sparkles className="w-3 h-3" />
              <span>New Poll</span>
            </button>
          )}

          {!isCreator && poll.isActive && !hasVoted && (
            <span className="text-zinc-500 text-[10px]">Tap any option to vote</span>
          )}

          {!isCreator && hasVoted && (
            <span className="text-zinc-500 text-[10px]">Real-time results</span>
          )}
        </div>

      </div>
    </div>
  );
};
