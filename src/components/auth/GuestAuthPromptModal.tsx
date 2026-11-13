import React from 'react';
import { X, LogIn, UserPlus, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface GuestAuthPromptModalProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const GuestAuthPromptModal: React.FC<GuestAuthPromptModalProps> = ({ onOpenAuth }) => {
  const { guestAuthPrompt, closeGuestAuthPrompt, activeBrandingTheme, resolvedColorMode } = useApp();

  if (!guestAuthPrompt.isOpen) return null;

  const isLight = resolvedColorMode === 'light';
  const primaryColor = activeBrandingTheme?.tokens?.accentPrimary || '#d4af37';

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-auth-prompt-title"
      onClick={closeGuestAuthPrompt}
    >
      <div
        className={`relative w-full max-w-md max-h-[92dvh] overflow-y-auto rounded-2xl border p-4 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-150 acovon-modal-panel ${
          isLight
            ? 'bg-white border-neutral-200 text-neutral-900'
            : 'bg-[#121215] border-[#27272a] text-white'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={closeGuestAuthPrompt}
          aria-label="Close"
          className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
            isLight
              ? 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
              : 'text-neutral-400 hover:text-white hover:bg-[#1e1e24]'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div
            className="w-9 h-9 rounded-xl font-bold font-brand flex items-center justify-center text-base text-black shadow-md"
            style={{ backgroundColor: primaryColor }}
          >
            A
          </div>
          <div>
            <span className="font-brand font-bold tracking-wider text-base block leading-none">
              ACOVON
            </span>
            <span className="text-[11px] text-[#d4af37] font-semibold">
              Creator Discovery &amp; Membership
            </span>
          </div>
        </div>

        {/* Optional Action Context */}
        {guestAuthPrompt.actionLabel && (
          <div
            className={`mb-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              isLight
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-[#d4af37]/10 border-[#d4af37]/30 text-[#fce7b0]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-[#d4af37]" />
            <span>Sign in required to {guestAuthPrompt.actionLabel}</span>
          </div>
        )}

        {/* Exact Prompt Copy */}
        <h3
          id="guest-auth-prompt-title"
          className="text-xl font-bold tracking-tight mb-2"
        >
          Join ACOVON
        </h3>
        <p
          className={`text-sm leading-relaxed mb-6 ${
            isLight ? 'text-neutral-600' : 'text-neutral-300'
          }`}
        >
          Create your free account or log in to interact with creators and enjoy everything ACOVON has to offer.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={() => {
              closeGuestAuthPrompt();
              onOpenAuth('register');
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-sm text-black transition-all shadow-lg cursor-pointer hover:brightness-105"
            style={{ backgroundColor: primaryColor }}
          >
            <UserPlus className="w-4 h-4" />
            <span>Sign Up</span>
          </button>

          <button
            type="button"
            onClick={() => {
              closeGuestAuthPrompt();
              onOpenAuth('login');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm border transition-all cursor-pointer ${
              isLight
                ? 'bg-neutral-100 hover:bg-neutral-200 border-neutral-300 text-neutral-900'
                : 'bg-[#18181c] hover:bg-[#222228] border-[#2e2e36] text-white'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Log In</span>
          </button>
        </div>

        <button
          type="button"
          onClick={closeGuestAuthPrompt}
          className={`mt-3 w-full py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
            isLight
              ? 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100'
              : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
          }`}
        >
          Continue Watching
        </button>
      </div>
    </div>
  );
};
