import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import {
  registerWithFirebaseEmail,
  loginWithFirebaseEmail,
  signInWithFirebaseGoogle,
  sendFirebasePasswordReset,
  resolvedFirebaseConfig
} from '../../services/firebase';

interface AuthModalProps {
  initialMode?: 'register' | 'login';
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  initialMode = 'register',
  onClose,
  onSuccess
}) => {
  const {
    registerAccount,
    authenticateAccount,
    activeLanguageCode,
    appearanceMode
  } = useApp();

  const [mode, setMode] = useState<'register' | 'login' | 'forgot_password'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is18PlusAgreed, setIs18PlusAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consoleHint, setConsoleHint] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSampleCredentials, setShowSampleCredentials] = useState(false);

  const switchMode = (nextMode: 'register' | 'login' | 'forgot_password') => {
    setMode(nextMode);
    setError(null);
    setConsoleHint(null);
    setResetSent(false);
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setConsoleHint(null);
    setIsSubmitting(true);

    try {
      const fbRes = await signInWithFirebaseGoogle({
        preferredLanguage: activeLanguageCode,
        appearancePreference: appearanceMode
      });

      if (!fbRes.success || !fbRes.profile) {
        setError(fbRes.error || 'Google Sign-In could not be completed.');
        setIsSubmitting(false);
        return;
      }

      const targetEmail = fbRes.email || `${fbRes.profile.username}@acovon.user`;
      // Synchronize with ACOVON application state
      const loginRes = authenticateAccount(targetEmail, 'firebase_oauth_session');
      if (!loginRes.success) {
        registerAccount({
          fullName: fbRes.profile.full_legal_name,
          username: fbRes.profile.username,
          email: targetEmail,
          password: 'FirebaseOAuth!2026',
          confirmPassword: 'FirebaseOAuth!2026',
          is18PlusConfirmed: true
        });
      }

      setIsSubmitting(false);
      onSuccess();
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConsoleHint(null);

    if (mode === 'forgot_password') {
      if (!email.trim()) {
        setError('Please enter the email address associated with your ACOVON account.');
        return;
      }
      setIsSubmitting(true);
      await sendFirebasePasswordReset(email.trim());
      setIsSubmitting(false);
      setResetSent(true);
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!is18PlusAgreed) {
        setError('You must confirm that you are 18+ and accept the Terms & Privacy Policy.');
        return;
      }

      setIsSubmitting(true);

      // 1. Attempt Firebase Authentication + Cloud Firestore registration
      const fbReg = await registerWithFirebaseEmail({
        fullName,
        username,
        email,
        password,
        preferredLanguage: activeLanguageCode,
        appearancePreference: appearanceMode
      });

      if (!fbReg.success && !fbReg.providerNotEnabledInConsole) {
        setIsSubmitting(false);
        setError(fbReg.error || 'Could not create your Firebase account.');
        return;
      }

      if (fbReg.providerNotEnabledInConsole && fbReg.error) {
        setConsoleHint(fbReg.error);
      }

      // 2. Register in ACOVON unified state (always assigns default 'fan' role)
      const result = registerAccount({
        fullName,
        username,
        email,
        password,
        confirmPassword,
        is18PlusConfirmed: is18PlusAgreed
      });

      setIsSubmitting(false);

      if (!result.success) {
        setError(result.error || 'Could not create your account. Please check your information.');
        return;
      }

      onSuccess();
      onClose();
      return;
    }

    // Standard Unified Login — checks Firebase Auth + existing ACOVON accounts (Fan, Creator, Admin)
    setIsSubmitting(true);
    const fbLogin = await loginWithFirebaseEmail(email, password);

    if (
      !fbLogin.success &&
      fbLogin.error &&
      fbLogin.error.includes('Account is currently')
    ) {
      // Suspended or disabled in Firestore
      setIsSubmitting(false);
      setError(fbLogin.error);
      return;
    }

    const authResult = authenticateAccount(email, password);
    setIsSubmitting(false);

    if (!authResult.success && !fbLogin.success) {
      setError(authResult.error || fbLogin.error || 'Invalid login credentials.');
      return;
    }

    onSuccess();
    onClose();
  };

  const fillExistingAccount = (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword('acovon2025');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between gap-2.5 mb-2 pr-7">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#d4af37] text-black font-bold font-brand flex items-center justify-center text-sm">
              A
            </div>
            <span className="font-brand font-bold text-white text-lg tracking-wider">ACOVON</span>
          </div>
          <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ShieldCheck className="w-3 h-3" />
            Firebase Auth
          </span>
        </div>

        {mode === 'register' && (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Create Your Account</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Join ACOVON to discover creators, enjoy exclusive content, and manage your private Cloud Storage vault.
            </p>
          </>
        )}

        {mode === 'login' && (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Welcome Back</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Log in to your ACOVON account and continue where you left off.
            </p>
          </>
        )}

        {mode === 'forgot_password' && (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Reset Your Password</h3>
            <p className="text-xs text-neutral-400 mb-4 leading-relaxed">
              Enter your ACOVON account email address and Firebase Authentication will send password recovery instructions.
            </p>
          </>
        )}

        {/* 1-Click Google Sign-In via Firebase Popup */}
        {mode !== 'forgot_password' && (
          <div className="mb-4">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-neutral-100 text-black font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>Continue with Google (Firebase Auth)</span>
            </button>

            <div className="flex items-center gap-3 my-3.5">
              <div className="h-px bg-[#27272a] flex-1" />
              <span className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
                or with Email &amp; Password
              </span>
              <div className="h-px bg-[#27272a] flex-1" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-neutral-300 mb-1 font-medium">Full Legal Name</label>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={120}
                  placeholder="e.g. Jordan Cross"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-neutral-300 mb-1 font-medium">Username</label>
                <input
                  type="text"
                  required
                  minLength={3}
                  maxLength={40}
                  placeholder="e.g. jordancross"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-neutral-300 mb-1 font-medium">Email Address</label>
            <input
              type="email"
              required
              placeholder="you@domain.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {mode !== 'forgot_password' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-neutral-300 font-medium">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('forgot_password')}
                    className="text-[11px] text-[#d4af37] hover:underline font-medium cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-neutral-300 mb-1 font-medium">Confirm Password</label>
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>
          )}

          {mode === 'register' && (
            <div className="pt-1">
              <label className="flex items-start gap-2.5 p-3 bg-[#18181c] border border-[#27272a] rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={is18PlusAgreed}
                  onChange={(e) => setIs18PlusAgreed(e.target.checked)}
                  className="mt-0.5 accent-[#d4af37] shrink-0"
                />
                <span className="text-[11px] text-neutral-300 leading-snug">
                  I certify that I am at least 18 years of age and agree to the ACOVON Terms of Service and Anti-Exploitation Safety Policies.
                </span>
              </label>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {consoleHint && (
            <div className="p-2.5 bg-amber-950/40 border border-amber-700/60 text-amber-200 rounded-xl text-[11px] leading-relaxed">
              <strong>Firebase Console Note:</strong> {consoleHint} (Project:{' '}
              <code>{resolvedFirebaseConfig.projectId}</code>)
            </div>
          )}

          {mode === 'forgot_password' && resetSent && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Password Reset Link Dispatched</p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  If an account exists for <strong>{email}</strong>, Firebase password recovery instructions have been sent.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] disabled:opacity-50 text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer mt-2 flex items-center justify-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {mode === 'register'
                ? 'Create Account'
                : mode === 'login'
                ? 'Log In'
                : 'Send Recovery Link'}
            </span>
          </button>
        </form>

        {/* Quick-Fill Existing Accounts Helper for Testing Automatic Role Detection */}
        {mode === 'login' && (
          <div className="mt-4 pt-3 border-t border-[#27272a]/70">
            <button
              type="button"
              onClick={() => setShowSampleCredentials((prev) => !prev)}
              className="w-full flex items-center justify-between text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer py-1"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Fill existing account email to test automatic role detection</span>
              </span>
              {showSampleCredentials ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>

            {showSampleCredentials && (
              <div className="mt-2 grid grid-cols-1 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillExistingAccount('jordan@example.com')}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-medium">jordan@example.com</span>
                  <span className="text-[10px] text-neutral-400">Standard Fan Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillExistingAccount('chloe@atelier.paris')}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-medium">chloe@atelier.paris</span>
                  <span className="text-[10px] text-amber-400">
                    Pending Creator App (Logs in as Fan)
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => fillExistingAccount('elena@acovon.creator')}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-medium">elena@acovon.creator</span>
                  <span className="text-[10px] text-[#d4af37]">Approved Creator Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => fillExistingAccount('julian.sterling@acovon.com')}
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-left transition-colors cursor-pointer"
                >
                  <span className="text-white font-medium">julian.sterling@acovon.com</span>
                  <span className="text-[10px] text-emerald-400">Super Admin Account</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[#27272a] text-center text-xs text-neutral-400">
          {mode === 'register' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                Log In
              </button>
            </span>
          ) : mode === 'login' ? (
            <span>
              Need an account?{' '}
              <button
                type="button"
                onClick={() => switchMode('register')}
                className="text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                Join ACOVON
              </button>
            </span>
          ) : (
            <span>
              Remembered your password?{' '}
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="text-[#d4af37] hover:underline font-semibold cursor-pointer"
              >
                Log In
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
