import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldCheck,
  Lock,
  User,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Crown,
  Sparkles,
  Check,
  XCircle
} from 'lucide-react';

interface AdminSetupPageProps {
  onNavigateHome: () => void;
  onNavigateToLogin: () => void;
  onSetupSuccess: () => void;
}

export const AdminSetupPage: React.FC<AdminSetupPageProps> = ({
  onNavigateHome,
  onNavigateToLogin,
  onSetupSuccess
}) => {
  const { adminSetupStatus, checkAdminSetupStatus, setupInitialAdmin } = useApp();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [certifyOwnership, setCertifyOwnership] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    checkAdminSetupStatus();
  }, [checkAdminSetupStatus]);

  // Password requirements calculation
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isPasswordValid = hasMinLength && hasUpper && hasLower && hasDigit;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // If setup is already closed on backend, reject immediately
    if (adminSetupStatus.isSetupCompleted) {
      setErrorMessage('Initial administrator registration is permanently closed. An administrator account already exists.');
      return;
    }

    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Please provide your full legal name (at least 2 characters).');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail)) {
      setErrorMessage('Please enter a valid administrator email address.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMessage('Please meet all password security requirements before proceeding.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('Password and confirmation password do not match.');
      return;
    }

    if (!certifyOwnership) {
      setErrorMessage('You must certify that you are the authorized platform owner.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await setupInitialAdmin({
        fullName: fullName.trim(),
        email: cleanEmail,
        username: username.trim() || cleanEmail.split('@')[0],
        password,
        confirmPassword
      });

      if (res.success) {
        setSuccessMessage('Super Administrator account successfully provisioned! Public admin registration is now permanently closed.');
        setTimeout(() => {
          onSetupSuccess();
        }, 1200);
      } else {
        setErrorMessage(res.error || 'Failed to provision initial administrator account.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Server setup error';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // IF SETUP IS ALREADY COMPLETED: Display immutable locked state (Never render registration form)
  if (adminSetupStatus.isSetupCompleted) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-[#101014] border border-[#272730] shadow-2xl rounded-2xl p-8 text-center space-y-6 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-[#d4af37]/50 flex items-center justify-center mx-auto text-[#fce7b0] shadow-lg">
            <Lock className="w-8 h-8 text-[#d4af37]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-semibold uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Setup Slot Completed</span>
            </div>
            <h1 className="text-xl font-bold font-brand text-white">Administrator Setup Closed</h1>
            <p className="text-xs text-neutral-400 leading-relaxed">
              The single authorized Super Administrator slot for ACOVON has already been provisioned and sealed. Public administrator registration is permanently closed to prevent unauthorized account creation.
            </p>
            {adminSetupStatus.setupCompletedAt && (
              <p className="text-[11px] text-neutral-500 font-mono">
                Provisioned: {adminSetupStatus.setupCompletedAt}
              </p>
            )}
          </div>

          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="w-full py-3 bg-[#d4af37] hover:bg-[#e0bc45] text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Proceed to Admin Login</span>
            </button>
            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full py-2.5 bg-[#18181f] hover:bg-[#23232c] text-neutral-300 text-xs font-medium rounded-xl transition-colors cursor-pointer"
            >
              Return to Public Platform
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 relative">
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-gradient-to-br from-[#d4af37]/15 via-[#7a6114]/10 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer group"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Return Home</span>
          </button>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs text-[#d4af37] hover:underline cursor-pointer"
          >
            Go to Admin Login
          </button>
        </div>

        {/* Setup Card */}
        <div className="bg-[#101014] border border-[#272730] shadow-2xl rounded-2xl p-7 sm:p-9 backdrop-blur-xl space-y-6">
          {/* Header */}
          <div className="space-y-3 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#d4af37] to-[#806414] text-black shadow-xl mx-auto">
              <Crown className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-brand font-bold text-2xl tracking-wider text-white">ACOVON</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#fce7b0] font-semibold">
                  Initial Setup
                </span>
              </div>
              <h1 className="text-lg font-bold text-white mt-1">
                One-Time Super Administrator Account Creation
              </h1>
              <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
                This dedicated slot configures the root platform owner account with full executive authority. Once submitted, this slot permanently seals.
              </p>
            </div>
          </div>

          {/* Security Guarantee Notice */}
          <div className="p-3.5 bg-gradient-to-r from-[#211a0f] to-[#141418] border border-[#d4af37]/40 rounded-xl space-y-1.5 text-xs">
            <div className="flex items-center gap-2 text-[#fce7b0] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span>Single-Slot Authorization Guarantee</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Only one initial administrator can be provisioned. The server enforces atomic, immutable closure immediately upon creation. Ordinary users, fans, and creators will never have access to this portal.
            </p>
          </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder="e.g. Julian Sterling"
                    required
                    className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Admin Username</label>
                <div className="relative">
                  <span className="text-xs text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="admin_root"
                    className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-neutral-300">Official Administrator Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@acovon.com"
                  required
                  className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Master Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    required
                    className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-neutral-300">Confirm Password</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-type password"
                    required
                    className="w-full bg-[#18181f] border border-[#2e2e38] rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37] transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Password security criteria checklist */}
            <div className="p-3 bg-[#16161c] border border-[#24242e] rounded-xl grid grid-cols-2 gap-2 text-[11px]">
              <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {hasMinLength ? <Check className="w-3 h-3 text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 ml-1" />}
                <span>At least 8 characters</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {hasUpper ? <Check className="w-3 h-3 text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 ml-1" />}
                <span>Uppercase letter (A-Z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {hasLower ? <Check className="w-3 h-3 text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 ml-1" />}
                <span>Lowercase letter (a-z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasDigit ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {hasDigit ? <Check className="w-3 h-3 text-emerald-400" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 ml-1" />}
                <span>Number digit (0-9)</span>
              </div>
            </div>

            {/* Certification Checkbox */}
            <label className="flex items-start gap-2.5 pt-1 text-xs text-neutral-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={certifyOwnership}
                onChange={e => setCertifyOwnership(e.target.checked)}
                className="mt-0.5 rounded border-[#2e2e38] text-[#d4af37] focus:ring-[#d4af37] cursor-pointer"
              />
              <span className="leading-relaxed text-[11px] text-neutral-400">
                I certify that I am the authorized platform owner. I understand that submitting this form creates the Super Administrator account and permanently closes administrator registration.
              </span>
            </label>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isLoading || !certifyOwnership || !isPasswordValid || !passwordsMatch}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#d4af37] to-[#a8861e] hover:from-[#e0bc45] hover:to-[#be9823] text-black text-xs font-bold rounded-xl transition-all shadow-xl shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning Super Administrator...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Complete One-Time Setup &amp; Lock Slot</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
