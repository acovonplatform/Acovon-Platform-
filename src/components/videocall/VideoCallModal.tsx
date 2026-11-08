import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  ShieldCheck, 
  AlertTriangle, 
  Coins, 
  Clock, 
  Maximize2,
  Check,
  Zap,
  DollarSign
} from 'lucide-react';

export const VideoCallModal: React.FC = () => {
  const { 
    videoCallSession, 
    endVideoCall, 
    updateCallDuration, 
    currentUser, 
    acceptIncomingCall, 
    rejectCall 
  } = useApp();

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Setup local camera stream
  useEffect(() => {
    let active = true;

    async function initCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true
          });
          if (active) {
            streamRef.current = stream;
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = stream;
            }
          }
        }
      } catch (err: any) {
        console.warn('Camera/mic access was not granted or simulated:', err);
        setCameraError('Camera stream not permitted in this sandbox iframe. Virtual video stream active.');
      }
    }

    if (videoCallSession) {
      initCamera();
    }

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoCallSession]);

  // Real-time call duration timer that triggers every second during active call
  useEffect(() => {
    if (!videoCallSession || videoCallSession.status !== 'connected') {
      return;
    }

    // Reset seconds counter when call connects
    setSecondsElapsed(0);

    const timerInterval = setInterval(() => {
      setSecondsElapsed(prevSeconds => {
        const nextSeconds = prevSeconds + 1;
        // Dynamically inform context of current duration and update state
        updateCallDuration(nextSeconds);
        return nextSeconds;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [videoCallSession?.status]);

  if (!videoCallSession) return null;

  const ratePerMin = videoCallSession.ratePerMinute;
  const ratePerSecond = ratePerMin / 60;
  
  // Real-time dynamic cost calculated every second
  const liveDynamicCost = Number(((secondsElapsed / 60) * ratePerMin).toFixed(2));
  const spendingLimit = videoCallSession.spendingLimit;
  const remainingBudget = Math.max(0, spendingLimit - liveDynamicCost);
  const remainingMinutes = remainingBudget / ratePerMin;
  const isBudgetWarning = remainingMinutes <= 1.0;
  const budgetPercentageUsed = Math.min(100, Math.round((liveDynamicCost / spendingLimit) * 100));

  // Format MM:SS with leading zeroes
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  };

  const handleToggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 animate-in fade-in duration-200">
      
      {/* Top Status Header */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between border-b border-[#27272a] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#1a1a20] border border-[#d4af37]/40 flex items-center justify-center font-brand font-bold text-sm text-[#fce7b0]">
            {videoCallSession.creatorName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-white text-sm sm:text-base flex items-center gap-1.5">
                <span>Private Video Call with {videoCallSession.creatorName}</span>
                <VerifiedBadge creatorId={videoCallSession.creatorId} size="sm" />
              </h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
                Encrypted WebRTC
              </span>
            </div>
            <div className="text-xs text-neutral-400">
              Rate: ${ratePerMin.toFixed(2)}/min (${ratePerSecond.toFixed(3)}/sec) · Billed solely during connected session
            </div>
          </div>
        </div>

        {/* Live Call Telemetry / Cost Counter in Header */}
        {videoCallSession.status === 'connected' && (
          <div className="flex items-center gap-4 text-right">
            <div className="bg-[#141418] border border-[#27272a] px-3.5 py-1.5 rounded-xl">
              <div className="text-xs text-neutral-400 flex items-center justify-end gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                <span className="font-mono text-sm font-bold text-white tabular-nums tracking-wider">
                  {formatTimer(secondsElapsed)}
                </span>
              </div>
              <div className="text-xs font-mono font-semibold text-[#fce7b0] tabular-nums mt-0.5">
                Live Cost: ${liveDynamicCost.toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Video Viewport */}
      <div className="max-w-5xl mx-auto w-full flex-1 my-4 relative rounded-2xl overflow-hidden bg-[#121215] border border-[#27272a] flex items-center justify-center">
        
        {/* State 1: Requesting / Ringing */}
        {videoCallSession.status === 'requesting' && (
          <div className="text-center p-6 space-y-4 max-w-md bg-[#18181c]/90 border border-[#27272a] rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/40 mx-auto flex items-center justify-center animate-pulse">
              <Video className="w-8 h-8 text-[#d4af37]" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-white flex items-center justify-center gap-1.5">
                <span>Ringing {videoCallSession.creatorName}...</span>
                <VerifiedBadge creatorId={videoCallSession.creatorId} size="sm" />
              </h4>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-[11px] text-amber-300 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>Charges are PAUSED (Not yet connected)</span>
              </div>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed bg-[#121215] p-3 rounded-xl border border-[#27272a]">
              <strong>Acovon Billing Rule:</strong> You are <em>never</em> charged for calling or waiting. Charges of <strong>${ratePerMin.toFixed(2)}/min</strong> apply <strong>only when the creator answers</strong>, strictly calculated by actual connected call duration.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-2.5">
              <button
                onClick={acceptIncomingCall}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Answer Call as Creator</span>
              </button>
              <button
                onClick={endVideoCall}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-xl cursor-pointer"
              >
                Cancel Call
              </button>
            </div>
          </div>
        )}

        {/* State 2: Active Connected Call */}
        {videoCallSession.status === 'connected' && (
          <>
            {/* Remote Creator Stream Simulation */}
            <div className="absolute inset-0 w-full h-full bg-black">
              <video
                src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Creator label */}
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md border border-[#27272a] px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-200 flex items-center gap-1.5 z-10">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{videoCallSession.creatorName}</span>
                <VerifiedBadge creatorId={videoCallSession.creatorId} size="xs" />
                <span className="text-neutral-400">(Live 1080p WebRTC)</span>
              </div>
            </div>

            {/* REAL-TIME DURATION & DYNAMIC BILLING HUD (Heads-Up Display) */}
            <div className="absolute top-4 right-4 z-20 bg-black/85 backdrop-blur-md border border-[#d4af37]/40 rounded-2xl p-3.5 shadow-2xl max-w-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                    ACTIVE CALL
                  </span>
                </div>
                
                {/* Real-time Call Duration Timer updating every second */}
                <div className="flex items-center gap-1 text-sm font-mono font-bold text-white tabular-nums">
                  <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>{formatTimer(secondsElapsed)}</span>
                </div>
              </div>

              {/* Dynamic Cost Counter updating every second */}
              <div className="bg-[#141418] border border-[#27272a] p-2.5 rounded-xl">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] text-neutral-400">Total Billed:</span>
                  <div className="text-base font-extrabold font-mono text-[#fce7b0] tabular-nums">
                    ${liveDynamicCost.toFixed(2)}
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mt-0.5">
                  <span>Rate: ${ratePerMin.toFixed(2)}/min</span>
                  <span>+${ratePerSecond.toFixed(3)}/s</span>
                </div>
              </div>

              {/* Spending Limit Depletion Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>Limit: ${spendingLimit.toFixed(2)}</span>
                  <span className="font-mono text-neutral-300">${remainingBudget.toFixed(2)} left</span>
                </div>
                <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      isBudgetWarning ? 'bg-amber-500' : 'bg-[#d4af37]'
                    }`}
                    style={{ width: `${budgetPercentageUsed}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Local Fan Video PIP (Picture in Picture) */}
            <div className="absolute bottom-4 right-4 w-36 sm:w-48 aspect-video rounded-xl overflow-hidden border border-[#d4af37]/40 shadow-2xl bg-[#18181c] z-10">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isVideoEnabled ? '' : 'hidden'}`}
              />
              {!isVideoEnabled && (
                <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-xs text-neutral-400">
                  Camera Off
                </div>
              )}
              <div className="absolute bottom-1 left-2 text-[10px] bg-black/70 px-1.5 py-0.5 rounded text-neutral-300">
                You
              </div>
            </div>

            {/* Spending Limit Warning Banner */}
            {isBudgetWarning && (
              <div className="absolute bottom-20 left-4 bg-amber-950/90 border border-amber-500/60 text-amber-200 px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xl animate-bounce z-20">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <div className="font-semibold text-[11px]">Spending Limit Alert</div>
                  <div className="text-[10px] text-amber-300">Less than 1 minute remaining before automatic disconnection.</div>
                </div>
              </div>
            )}
          </>
        )}

        {/* State 3: Completed Call Settlement Summary */}
        {videoCallSession.status === 'completed' && (
          <div className="text-center p-6 space-y-4 max-w-md bg-[#18181c] border border-[#27272a] rounded-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-[#141418] border border-neutral-700 mx-auto flex items-center justify-center">
              <PhoneOff className="w-8 h-8 text-neutral-400" />
            </div>
            
            <div>
              <h4 className="text-lg font-bold text-white">Call Ended & Settled</h4>
              <p className="text-xs text-neutral-400 mt-0.5">Billing ended immediately upon disconnect.</p>
            </div>

            <div className="bg-[#141418] border border-[#27272a] rounded-xl p-4 text-xs space-y-2.5 text-left">
              <div className="flex justify-between text-neutral-400">
                <span>Final Duration:</span>
                <span className="font-mono text-white font-bold">{formatTimer(secondsElapsed)} ({secondsElapsed}s)</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Creator Billing Rate:</span>
                <span className="font-mono text-white">${ratePerMin.toFixed(2)} / min</span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Platform Commission (20%):</span>
                <span className="font-mono text-neutral-400">${(liveDynamicCost * 0.20).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-neutral-400 border-t border-[#27272a] pt-2 font-semibold">
                <span className="text-[#fce7b0]">Total Deducted from Wallet:</span>
                <span className="font-mono text-base text-[#fce7b0] font-bold">${liveDynamicCost.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                rejectCall();
                setSecondsElapsed(0);
              }}
              className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl cursor-pointer shadow-lg shadow-[#d4af37]/20"
            >
              Done & Close Summary
            </button>
          </div>
        )}

      </div>

      {/* Bottom Controls Bar (during active call) */}
      {videoCallSession.status === 'connected' && (
        <div className="max-w-md mx-auto w-full flex items-center justify-center gap-4 py-2">
          <button
            onClick={handleToggleMute}
            className={`p-3.5 rounded-full cursor-pointer transition-colors ${
              isMuted ? 'bg-red-950/80 border border-red-700 text-red-300' : 'bg-[#18181c] border border-[#27272a] text-white hover:bg-[#25252c]'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={handleToggleVideo}
            className={`p-3.5 rounded-full cursor-pointer transition-colors ${
              !isVideoEnabled ? 'bg-red-950/80 border border-red-700 text-red-300' : 'bg-[#18181c] border border-[#27272a] text-white hover:bg-[#25252c]'
            }`}
            title={isVideoEnabled ? 'Turn camera off' : 'Turn camera on'}
          >
            {!isVideoEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={endVideoCall}
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-red-950/50 cursor-pointer transition-all hover:scale-105"
          >
            <PhoneOff className="w-4 h-4" />
            <span>End Call (${liveDynamicCost.toFixed(2)})</span>
          </button>
        </div>
      )}

    </div>
  );
};
