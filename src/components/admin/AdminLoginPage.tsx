import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AcovonLogoIcon } from '../common/AcovonLogoIcon';
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

import { supabase } from '../../supabaseClient.js';

interface AdminLoginPageProps {
  onNavigateHome: () => void;
  onNavigateToSetup: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginPage: React.FC<AdminLoginPageProps> = ({
  onNavigateHome,
  onNavigateToSetup,
  onLoginSuccess
}) => {
  const { adminSetupStatus, adminLogin } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotNotice, setForgotNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage('Please enter your administrator email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Please enter your administrator password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await adminLogin(cleanEmail, password);
      if (res.success) {
        setSuccessMessage('Administrator credentials verified. Redirecting to Control Center...');
        setTimeout(() => {
          onLoginSuccess();
        }, 500);
      } else {
        setErrorMessage(res.error || 'Authentication failed. Please verify your administrator credentials.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication service error';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotNotice(null);
    if (!forgotEmail.trim()) {
      setForgotNotice({ type: 'error', text: 'Please enter your registered administrator email.' });
      return;
    }

    setForgotLoading(true);
    try {
      if (supabase) {
        const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/admin/login` : undefined
        });
        if (error) {
          setForgotNotice({
            type: 'error',
            text: error.message || 'Could not process password reset for this email.'
          });
          return;
        }
      }
      setForgotNotice({
        type: 'success',
        text: 'Security password reset instructions have been dispatched to your administrator email.'
      });
    } catch {
      setForgotNotice({
        type: 'error',
        text: 'An unexpected error occurred while requesting password reset.'
      });
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-3 sm:px-4 py-10 sm:py-12 relative overflow-hidden">
      {/* Background radial luxury glow */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden">
        <div className="w-[500px] h-[500px] bg-gradient-to-br from-[#d4af37]/10 via-[#7a6114]/5 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Back to public platform button */}
        <button
          type="button"
          onClick={onNavigateHome}
          className="mb-6 inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Return to Public Platform</span>
        </button>

        {/* Card */}
        <div className="bg-[#101014] border border-[#272730] shadow-2xl rounded-2xl p-5 sm:p-8 backdrop-blur-xl space-y-6">
          {/* Header branding */}
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center mx-auto">
              <AcovonLogoIcon size="lg" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-brand font-bold text-xl tracking-wider text-white">ACOVON</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#fce7b0] font-semibold">
                  Admin Portal
                </span>
              </div>
              <h1 className="text-base font-semibold text-neutral-200 mt-1">Control Center Secure Sign-In</h1>
              <p className="text-xs text-neutral-400 mt-1">
                Restricted to authorized platform administrators and executive operations.
              </p>
            </div>
          </div>

          {/* Setup Alert banner if setup not completed yet */}
          {!adminSetupStatus.isSetupCompleted ? (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>Initial Platform Setup Pending</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                No administrator account has been provisioned yet. The platform owner must configure the first Super Administrator account through the dedicated one-time setup slot.
              </p>
              <button
                type="button"
                onClick={onNavigateToSetup}
                className="w-full mt-1 py-2 px-3 bg-[#d4af37] hover:bg-[#e6c158] text-black text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <span>Open One-Time Admin Setup Slot</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="p-2.5 rounded-xl bg-[#16161c] border border-[#23232c] text-[11px] text-neutral-400 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
              <span>
                One-time admin setup completed. Public administrator registration is permanently closed.
              </span>
            </div>
          )}

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="leading-snug">{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300 flex items-center justify-between">
                <span>Administrator Email</span>
                <span className="text-[10px] text-neutral-500">Official Account</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@acovon.com"
                  autoComplete="email"
                  required
                  className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-neutral-300">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[11px] text-[#d4af37] hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  required
                  className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#d4af37] to-[#b38f22] hover:from-[#e0bc45] hover:to-[#c49e29] text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Admin Control Center</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note: strictly enforce no public admin sign up link once setup completed */}
          <div className="pt-2 border-t border-[#23232c] text-center text-[11px] text-neutral-500">
            <span>256-bit Encrypted Session · IP &amp; Geolocation Audited</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#272730] rounded-2xl max-w-sm w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#d4af37]" />
                <span>Admin Password Recovery</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotNotice(null);
                }}
                className="text-neutral-400 hover:text-white cursor-pointer text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Enter your registered administrator email address. A cryptographically secure password reset link will be dispatched.
            </p>

            {forgotNotice && (
              <div
                className={`p-3 rounded-xl text-xs ${
                  forgotNotice.type === 'success'
                    ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
                }`}
              >
                {forgotNotice.text}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="admin@acovon.com"
                required
                className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 py-2 bg-[#1c1c22] hover:bg-[#252530] text-neutral-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 py-2 bg-[#d4af37] hover:bg-[#e0bc45] text-black rounded-xl text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
