import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { supabase } from '../../supabaseClient.js';
import { X, AlertCircle, CheckCircle2, KeyRound, ChevronDown, ChevronUp } from 'lucide-react';

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
  const { registerAccount, authenticateAccount } = useApp();

  const [mode, setMode] = useState<'register' | 'login' | 'forgot_password'>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'success' || window.history.state?.signupSuccess) {
      return 'login';
    }
    return initialMode;
  });
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('email') || window.history.state?.email || '';
  });
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is18PlusAgreed, setIs18PlusAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('signup') === 'success' || window.history.state?.signupSuccess) {
      return 'Your account has been created successfully! You can now log in below.';
    }
    return null;
  });
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [showSampleCredentials, setShowSampleCredentials] = useState(false);

  const switchMode = (nextMode: 'register' | 'login' | 'forgot_password') => {
    setMode(nextMode);
    setError(null);
    setConfirmationMessage(null);
    setRequiresEmailVerification(false);
    setResetSent(false);
  };

  const handleResendConfirmation = async () => {
    const targetEmail = email.trim();
    if (!targetEmail) {
      setError('Please enter your email address first.');
      return;
    }
    setResendingEmail(true);
    setError(null);

    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    setResendingEmail(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }

    setConfirmationMessage(
      `A new confirmation email has been sent to ${targetEmail}. Please check your inbox and spam folder.`
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setConfirmationMessage(null);

    if (mode === 'forgot_password') {
      if (!email.trim()) {
        setError('Please enter the email address associated with your ACOVON account.');
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin
      });
      if (resetError) {
        setError(resetError.message);
        return;
      }
      setResetSent(true);
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match. Please verify your password confirmation.');
        return;
      }
      if (!is18PlusAgreed) {
        setError('You must certify that you are at least 18 years of age and agree to the ACOVON Terms of Service.');
        return;
      }

      const signedUpEmail = email.trim();

      // 1) Sign Up with Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: signedUpEmail,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_legal_name: fullName.trim(),
            username: username.trim()
          }
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const emailVerificationNeeded = !signUpData.session;

      // Do NOT auto-login after signup — sign out temporary session and take user to Sign In with pre-filled email
      if (signUpData.session) {
        await supabase.auth.signOut();
      }

      window.history.pushState(
        { signupSuccess: true, email: signedUpEmail },
        '',
        `/login?signup=success&email=${encodeURIComponent(signedUpEmail)}`
      );
      setEmail(signedUpEmail);
      setPassword('');
      setConfirmPassword('');
      setMode('login');
      setRequiresEmailVerification(emailVerificationNeeded);
      setConfirmationMessage(
        emailVerificationNeeded
          ? 'Your account has been created. Please check your email and verify your address before logging in.'
          : 'Your account has been created successfully! You can now log in below.'
      );
      return;
    }

    // 2) Sign In with Supabase Auth
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    // Only redirect when a real session exists after login
    if (!signInData.session) {
      setError('Could not establish an active login session. Please try again.');
      return;
    }

    // Ensure authenticated Supabase user is loaded into app session
    const localAuth = authenticateAccount(email, password);
    if (!localAuth.success && signInData.user) {
      const fallbackUsername = (signInData.user.email?.split('@')[0] || 'member')
        .toLowerCase()
        .replace(/[^a-z0-9_.-]/g, '');
      registerAccount({
        fullName: signInData.user.user_metadata?.full_legal_name || fullName.trim() || fallbackUsername,
        username:
          signInData.user.user_metadata?.username ||
          username.trim() ||
          `${fallbackUsername}_${signInData.user.id.slice(0, 4)}`,
        email: signInData.user.email || email.trim(),
        password,
        confirmPassword: password,
        is18PlusConfirmed: true
      });
    }

    // 3) Redirect user to the Home page ("/")
    window.history.pushState({}, '', '/');
    onSuccess();
    onClose();
  };

  const fillExistingAccount = (sampleEmail: string) => {
    setEmail(sampleEmail);
    setPassword('acovon2025');
    setError(null);
    setConfirmationMessage(null);
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

        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 rounded bg-[#d4af37] text-black font-bold font-brand flex items-center justify-center text-sm">
            A
          </div>
          <span className="font-brand font-bold text-white text-lg tracking-wider">ACOVON</span>
        </div>

        {mode === 'register' && (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Create Your Account</h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Join ACOVON to discover creators, enjoy exclusive content, and connect with your favorite creators.
            </p>
          </>
        )}

        {mode === 'login' && (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Welcome Back</h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Log in to your ACOVON account and continue where you left off.
            </p>
          </>
        )}

        {mode === 'forgot_password' && (
          <>
            <h3 className="text-xl font-bold text-white mb-1">Reset Your Password</h3>
            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Enter your ACOVON account email address and we will send you password recovery instructions.
            </p>
          </>
        )}

        {mode === 'login' && confirmationMessage && (
          <div className="mb-4 p-3 bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 rounded-xl text-xs space-y-2">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{confirmationMessage}</span>
            </div>
            {requiresEmailVerification && (
              <div className="pl-6">
                <button
                  type="button"
                  disabled={resendingEmail}
                  onClick={handleResendConfirmation}
                  className="text-[11px] font-semibold text-[#d4af37] hover:underline cursor-pointer disabled:opacity-50"
                >
                  {resendingEmail ? 'Sending verification email...' : "Didn't receive it? Resend verification email"}
                </button>
              </div>
            )}
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
            <div className="p-2.5 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('confirm') && email.trim() && (
                <div className="pl-5">
                  <button
                    type="button"
                    disabled={resendingEmail}
                    onClick={handleResendConfirmation}
                    className="text-[11px] font-semibold text-[#d4af37] hover:underline cursor-pointer disabled:opacity-50"
                  >
                    {resendingEmail ? 'Sending verification email...' : 'Resend verification email'}
                  </button>
                </div>
              )}
            </div>
          )}

          {mode === 'forgot_password' && resetSent && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/70 text-emerald-300 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Password Reset Link Sent</p>
                <p className="text-[11px] text-emerald-200/80 mt-0.5">
                  If an account exists for <strong>{email}</strong>, recovery instructions have been sent.
                </p>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer mt-2"
          >
            {mode === 'register'
              ? 'Create Account'
              : mode === 'login'
              ? 'Log In'
              : 'Send Recovery Link'}
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
              {showSampleCredentials ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
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
                  <span className="text-[10px] text-amber-400">Pending Creator App (Logs in as Fan)</span>
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
