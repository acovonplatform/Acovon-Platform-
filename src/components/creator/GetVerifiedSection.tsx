import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, PaidVerificationStatus } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Wallet,
  Clock,
  AlertTriangle,
  RefreshCw,
  Receipt,
  Lock,
  Sparkles,
  Check,
  X,
  ArrowRight,
  Calendar,
  Ban
} from 'lucide-react';

interface GetVerifiedSectionProps {
  onNavigateToProfile?: (creatorId: string) => void;
}

const CURRENCY_SYMBOL: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const STATUS_BADGE_CONFIG: Record<
  PaidVerificationStatus,
  { label: string; colorClass: string; dotClass: string; description: string }
> = {
  not_verified: {
    label: 'Not Verified',
    colorClass: 'text-neutral-300 border-neutral-700 bg-neutral-900/80',
    dotClass: 'bg-neutral-500',
    description: 'Your creator account does not currently have an active blue verification badge.'
  },
  payment_pending: {
    label: 'Payment Pending',
    colorClass: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
    dotClass: 'bg-amber-400 animate-pulse',
    description:
      'Your verification payment has been submitted and is awaiting payment gateway settlement confirmation. Your blue badge will activate automatically once confirmed.'
  },
  verified: {
    label: 'Verified',
    colorClass: 'text-sky-300 border-sky-500/40 bg-sky-950/40',
    dotClass: 'bg-[#1D9BF0]',
    description:
      'Congratulations! Your ACOVON account is now verified. Your official blue verification badge is active across the entire platform.'
  },
  expired: {
    label: 'Expired',
    colorClass: 'text-orange-300 border-orange-500/40 bg-orange-950/40',
    dotClass: 'bg-orange-400',
    description: 'Your time-limited verification period has expired. Purchase or renew verification to reactivate your blue badge.'
  },
  renewal_required: {
    label: 'Renewal Required',
    colorClass: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
    dotClass: 'bg-amber-400',
    description:
      'Your verification period has reached expiration. Renew your verification below to immediately restore your official blue badge.'
  },
  suspended: {
    label: 'Suspended',
    colorClass: 'text-rose-300 border-rose-500/40 bg-rose-950/40',
    dotClass: 'bg-rose-400',
    description:
      'Your blue verification badge has been temporarily suspended by ACOVON Administration and is currently hidden from public views.'
  },
  revoked: {
    label: 'Revoked',
    colorClass: 'text-red-300 border-red-500/40 bg-red-950/50',
    dotClass: 'bg-red-500',
    description:
      'Your creator verification badge has been permanently revoked due to a platform policy violation.'
  }
};

export const GetVerifiedSection: React.FC<GetVerifiedSectionProps> = ({ onNavigateToProfile }) => {
  const {
    currentUser,
    creators,
    switchUserRole,
    verificationSettings,
    getCreatorVerificationRecord,
    verificationTransactions,
    isCreatorVerifiedBadgeActive,
    purchaseCreatorVerification,
    confirmPendingVerificationPayment,
    resetCreatorVerificationForTest
  } = useApp();

  const creator = currentUser as CreatorProfile;
  const record = getCreatorVerificationRecord(creator.id);
  const badgeActive = isCreatorVerifiedBadgeActive(creator.id);
  const myTransactions = verificationTransactions.filter(t => t.creatorId === creator.id);
  const pendingTx = myTransactions.find(t => t.paymentStatus === 'pending');

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRenewalCheckout, setIsRenewalCheckout] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<'stripe_checkout' | 'acovon_wallet' | 'apple_pay'>(
    'stripe_checkout'
  );
  const [simulateOutcome, setSimulateOutcome] = useState<'completed' | 'pending' | 'failed'>('completed');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutIdempotencyKey, setCheckoutIdempotencyKey] = useState<string>('');

  // Feedback banner state
  const [justVerifiedBanner, setJustVerifiedBanner] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const currencySymbol = CURRENCY_SYMBOL[verificationSettings.currency] || '$';
  const durationLabel =
    verificationSettings.durationType === 'lifetime'
      ? 'Lifetime Verification'
      : verificationSettings.durationType === 'annual'
      ? '12 Months (365 Days)'
      : verificationSettings.durationType === 'monthly'
      ? '30 Days (Monthly)'
      : `${verificationSettings.durationDays || 30} Days`;

  const statusMeta = STATUS_BADGE_CONFIG[record.status] || STATUS_BADGE_CONFIG.not_verified;

  const canPurchaseInitial =
    verificationSettings.isActive &&
    verificationSettings.isPublished &&
    (record.status === 'not_verified' ||
      (record.status === 'expired' && !verificationSettings.renewalEnabled));

  const canRenew =
    verificationSettings.isActive &&
    verificationSettings.isPublished &&
    verificationSettings.durationType !== 'lifetime' &&
    verificationSettings.renewalEnabled &&
    (record.status === 'renewal_required' || record.status === 'expired' || record.status === 'verified');

  const openCheckoutModal = (renewal: boolean) => {
    setErrorBanner(null);
    setIsRenewalCheckout(renewal);
    setSimulateOutcome('completed');
    setAgreedTerms(true);
    setCheckoutIdempotencyKey(
      `idem_${creator.id}_${renewal ? 'renew' : 'init'}_${Date.now()}`
    );
    setIsCheckoutOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!agreedTerms) {
      setErrorBanner('Please confirm the ACOVON Verification Terms before completing payment.');
      return;
    }

    setIsProcessing(true);
    setErrorBanner(null);

    setTimeout(() => {
      const res = purchaseCreatorVerification({
        creatorId: creator.id,
        paymentProvider: selectedProvider,
        simulateOutcome,
        idempotencyKey: checkoutIdempotencyKey,
        isRenewal: isRenewalCheckout
      });

      setIsProcessing(false);

      if (!res.success) {
        setErrorBanner(res.error || 'Verification payment could not be completed.');
        return;
      }

      setIsCheckoutOpen(false);
      if (res.status === 'verified') {
        setJustVerifiedBanner(
          'Congratulations! Your ACOVON account is now verified. Your official blue verification badge is active.'
        );
      } else if (res.status === 'payment_pending') {
        setJustVerifiedBanner(
          'Payment submitted and pending gateway confirmation. Your blue badge will activate automatically once payment is settled.'
        );
      }
    }, 350);
  };

  const handleSettlePendingWebhook = (txId: string) => {
    const res = confirmPendingVerificationPayment(txId);
    if (res.success) {
      setJustVerifiedBanner(
        'Congratulations! Your ACOVON account is now verified. Your official blue verification badge is active.'
      );
      setErrorBanner(null);
    } else {
      setErrorBanner(res.error || 'Could not settle pending transaction.');
    }
  };

  const activeCheckoutPrice = isRenewalCheckout
    ? verificationSettings.renewalPrice
    : verificationSettings.price;

  return (
    <div className="space-y-6">
      {/* Top Interactive Creator Account & Verification State Switcher for Seamless Testing */}
      <div className="p-4 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
            Instant Automatic Paid Verification System
          </div>
          <p className="text-xs text-neutral-400">
            No ID re-uploads, no application forms, and no manual review queue. Switch creator accounts or reset state below to test instant purchase, renewal, or pending webhook confirmation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={creator.id}
            onChange={e => {
              setJustVerifiedBanner(null);
              setErrorBanner(null);
              switchUserRole('creator', e.target.value);
            }}
            aria-label="Switch Creator Account"
            className="bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            {creators.map(c => {
              const rec = getCreatorVerificationRecord(c.id);
              return (
                <option key={c.id} value={c.id}>
                  {c.name} (@{c.username}) — [{rec.status.toUpperCase()}]
                </option>
              );
            })}
          </select>

          {record.status !== 'not_verified' && (
            <button
              type="button"
              onClick={() => {
                setJustVerifiedBanner(null);
                setErrorBanner(null);
                resetCreatorVerificationForTest(creator.id, 'not_verified');
              }}
              className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium transition-colors"
            >
              Reset to Unverified (Test Purchase)
            </button>
          )}
        </div>
      </div>

      {/* Congratulations / Activation Banner */}
      {justVerifiedBanner && (
        <div className="p-5 rounded-xl bg-gradient-to-r from-sky-950/90 via-sky-900/40 to-neutral-900 border border-sky-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
          <div className="flex items-start gap-3.5">
            <VerifiedBadge forceShow size="lg" className="mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                {justVerifiedBanner}
              </h3>
              <p className="text-xs text-sky-200/80 mt-1">
                Your official blue verification badge is now visible beside your display name and @username across profiles, home feed posts, videos, comments, messages, status updates, and livestreams.
              </p>
            </div>
          </div>
          {onNavigateToProfile && (
            <button
              type="button"
              onClick={() => onNavigateToProfile(creator.id)}
              className="px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-sky-500 text-white text-xs font-semibold shrink-0 transition-colors"
            >
              View My Public Profile
            </button>
          )}
        </div>
      )}

      {/* Error Banner */}
      {errorBanner && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-between gap-3 text-xs text-rose-200">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-rose-300 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Current Verification Status Card */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-neutral-700"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{creator.name}</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-0.5">
                <span className="inline-flex items-center gap-1 font-medium text-neutral-200">
                  @{creator.username}
                  <VerifiedBadge creatorId={creator.id} size="xs" />
                </span>
                <span aria-hidden="true">·</span>
                <span>Creator ID: {creator.id}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 ${statusMeta.colorClass}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusMeta.dotClass}`} />
              <span>Status: {statusMeta.label}</span>
            </div>
            {onNavigateToProfile && (
              <button
                type="button"
                onClick={() => onNavigateToProfile(creator.id)}
                className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-neutral-200 transition-colors"
              >
                Inspect Profile Badge
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-neutral-300 leading-relaxed">{statusMeta.description}</p>

        {record.statusReason && (
          <div className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong className="text-white">Status Note:</strong> {record.statusReason}
            </span>
          </div>
        )}

        {/* Metadata row when verified or previously purchased */}
        {(record.purchaseDate || record.expirationDate || record.lastRenewalDate) && (
          <div className="pt-3 border-t border-neutral-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-neutral-400">
            {record.purchaseDate && (
              <div>
                Purchased: <span className="text-neutral-200 font-medium">{record.purchaseDate}</span>
              </div>
            )}
            {record.amountPaid > 0 && (
              <div>
                Paid:{' '}
                <span className="text-neutral-200 font-medium">
                  {CURRENCY_SYMBOL[record.currency] || '$'}
                  {record.amountPaid.toFixed(2)} {record.currency}
                </span>
              </div>
            )}
            <div>
              Validity:{' '}
              <span className="text-sky-400 font-medium">
                {record.expirationDate ? `Expires ${record.expirationDate}` : 'Lifetime Verification'}
              </span>
            </div>
            {record.lastRenewalDate && (
              <div>
                Last Renewed: <span className="text-neutral-200 font-medium">{record.lastRenewalDate}</span>
              </div>
            )}
          </div>
        )}

        {/* Pending Payment Action Bar */}
        {record.status === 'payment_pending' && pendingTx && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-amber-200">
              <span className="font-semibold">Pending Payment Reference:</span> {pendingTx.providerTransactionId} ({pendingTx.currency} {pendingTx.amount.toFixed(2)})
            </div>
            <button
              type="button"
              onClick={() => handleSettlePendingWebhook(pendingTx.id)}
              className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-semibold text-xs transition-colors shrink-0"
            >
              Simulate Webhook Payment Confirmation
            </button>
          </div>
        )}
      </div>

      {/* Main "Get Your Blue Verification Badge" Offer & Benefits Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Verification Offer Details & Benefits */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center shrink-0">
                <VerifiedBadge forceShow size="xl" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-sky-400">
                  Official ACOVON Creator Verification
                </div>
                <h3 className="text-xl font-bold text-white mt-0.5">
                  Get Your Blue Verification Badge
                </h3>
                <p className="text-xs text-neutral-300 mt-2 leading-relaxed">
                  {verificationSettings.description}
                </p>
              </div>
            </div>

            {/* Benefits List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Included Verification Benefits
              </h4>
              <div className="space-y-2.5">
                {verificationSettings.benefits.map((benefit, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800/80"
                  >
                    <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-sky-400" />
                    </div>
                    <span className="text-xs text-neutral-200 leading-relaxed">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-neutral-950/90 border border-neutral-800/90 text-[11px] text-neutral-400 leading-relaxed">
            <strong className="text-neutral-200">Zero Paperwork Required:</strong> Your creator identity and onboarding profile are already verified on ACOVON. Your blue badge activates automatically the moment payment confirmation is received.
          </div>
        </div>

        {/* Right 5 Cols: Live Badge Preview & Instant Purchase Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-gradient-to-b from-sky-950/30 via-neutral-900 to-neutral-900 border border-sky-500/30 flex flex-col justify-between space-y-6">
          <div className="space-y-5">
            {/* Live Preview Box */}
            <div className="p-4 rounded-xl bg-neutral-950/90 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-neutral-400">
                <span className="font-semibold uppercase tracking-wider text-sky-400">
                  Live Badge Preview Across ACOVON
                </span>
                <span>16 Platform Placements</span>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-neutral-900 border border-neutral-800">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-11 h-11 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white truncate">
                    {creator.name}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-neutral-400 truncate">
                    <span className="inline-flex items-center gap-1 font-medium text-neutral-200">
                      @{creator.username}
                      <VerifiedBadge forceShow size="xs" />
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-neutral-400">Verified Creator</span>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-neutral-400 flex flex-wrap gap-x-2 gap-y-1">
                <span>Public Profile</span>
                <span>·</span>
                <span>Home Feed</span>
                <span>·</span>
                <span>Video Player</span>
                <span>·</span>
                <span>Comments</span>
                <span>·</span>
                <span>Inbox & DMs</span>
                <span>·</span>
                <span>Livestreams</span>
                <span>·</span>
                <span>Discovery</span>
              </div>
            </div>

            {/* Pricing & Validity Summary */}
            <div className="p-5 rounded-xl bg-neutral-950/80 border border-neutral-800 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xs text-neutral-400">{verificationSettings.planName}</div>
                  <div className="text-3xl font-extrabold text-white mt-1">
                    {currencySymbol}
                    {verificationSettings.price.toFixed(2)}{' '}
                    <span className="text-xs font-semibold text-neutral-400">
                      {verificationSettings.currency}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400">Validity</div>
                  <div className="text-xs font-semibold text-sky-400 mt-1">{durationLabel}</div>
                </div>
              </div>

              {verificationSettings.durationType !== 'lifetime' && verificationSettings.renewalEnabled && (
                <div className="pt-2 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                  <span>Renewal Rate</span>
                  <span className="text-neutral-200 font-semibold">
                    {currencySymbol}
                    {verificationSettings.renewalPrice.toFixed(2)} {verificationSettings.currency}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Primary CTA Buttons based on verification state */}
          <div className="space-y-3">
            {!verificationSettings.isActive || !verificationSettings.isPublished ? (
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-400">
                Paid Creator Verification is currently disabled by Platform Administration.
              </div>
            ) : record.status === 'verified' && verificationSettings.durationType === 'lifetime' ? (
              <div className="space-y-2.5">
                <div className="w-full py-3.5 px-4 rounded-xl bg-sky-500/15 border border-sky-500/40 text-sky-300 font-semibold text-xs flex items-center justify-center gap-2">
                  <VerifiedBadge forceShow size="sm" />
                  <span>Official Blue Verification Badge Active (Lifetime)</span>
                </div>
                <p className="text-[11px] text-neutral-400 text-center">
                  Your account has permanent lifetime verification. Duplicate purchases are disabled.
                </p>
              </div>
            ) : canRenew ? (
              <button
                type="button"
                onClick={() => openCheckoutModal(true)}
                className="w-full py-3.5 px-5 rounded-xl bg-[#1D9BF0] hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  Renew Verification ({currencySymbol}
                  {verificationSettings.renewalPrice.toFixed(2)} {verificationSettings.currency})
                </span>
              </button>
            ) : canPurchaseInitial ? (
              <button
                type="button"
                onClick={() => openCheckoutModal(false)}
                className="w-full py-3.5 px-5 rounded-xl bg-[#1D9BF0] hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2.5 transition-all"
              >
                <VerifiedBadge forceShow size="sm" />
                <span>
                  Get Verified — {currencySymbol}
                  {verificationSettings.price.toFixed(2)} {verificationSettings.currency}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : record.status === 'suspended' || record.status === 'revoked' ? (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-center text-xs text-rose-200">
                Verification badge is currently {record.status}. Only an Administrator can restore verification status.
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Creator's Verification Payment & Receipt History */}
      <div className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-sky-400" />
              <span>Verification Payment & Receipt History</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Official transaction records for your creator verification badge purchases and renewals.
            </p>
          </div>
          <span className="text-xs text-neutral-400">{myTransactions.length} Record(s)</span>
        </div>

        {myTransactions.length === 0 ? (
          <div className="p-8 rounded-xl bg-neutral-950/60 border border-neutral-800/80 text-center text-xs text-neutral-500">
            No verification payment transactions recorded for @{creator.username} yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400">
                  <th className="py-2.5 px-3 font-medium">Transaction ID</th>
                  <th className="py-2.5 px-3 font-medium">Type</th>
                  <th className="py-2.5 px-3 font-medium">Plan</th>
                  <th className="py-2.5 px-3 font-medium">Method / Reference</th>
                  <th className="py-2.5 px-3 font-medium">Amount</th>
                  <th className="py-2.5 px-3 font-medium">Payment Status</th>
                  <th className="py-2.5 px-3 font-medium">Refund Status</th>
                  <th className="py-2.5 px-3 font-medium">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {myTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-neutral-800/30">
                    <td className="py-3 px-3 font-mono text-neutral-200">{tx.id}</td>
                    <td className="py-3 px-3 capitalize text-neutral-300">{tx.transactionType}</td>
                    <td className="py-3 px-3 text-white font-medium">{tx.planName}</td>
                    <td className="py-3 px-3 text-neutral-400">
                      <span className="uppercase">{tx.paymentProvider.replace('_', ' ')}</span> ·{' '}
                      <span className="font-mono text-[11px]">{tx.providerTransactionId}</span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white">
                      {CURRENCY_SYMBOL[tx.currency] || '$'}
                      {tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-semibold ${
                          tx.paymentStatus === 'completed'
                            ? 'text-emerald-400'
                            : tx.paymentStatus === 'pending'
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {tx.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={
                          tx.refundStatus === 'completed'
                            ? 'text-amber-300 font-semibold'
                            : 'text-neutral-400'
                        }
                      >
                        {tx.refundStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-neutral-400">{tx.paymentTimestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Confirmation Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <VerifiedBadge forceShow size="md" />
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isRenewalCheckout
                      ? 'Renew Creator Verification'
                      : 'Confirm Creator Verification Purchase'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Instant automatic blue badge activation upon confirmed payment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="text-neutral-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Summary Box */}
              <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Creator Account</span>
                  <span className="text-white font-semibold flex items-center gap-1.5">
                    {creator.name} (@{creator.username})
                    <VerifiedBadge forceShow size="xs" />
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Verification Plan</span>
                  <span className="text-neutral-200 font-medium">
                    {verificationSettings.planName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Validity Period</span>
                  <span className="text-sky-400 font-medium">{durationLabel}</span>
                </div>
                <div className="pt-2.5 border-t border-neutral-800 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">Total Verification Fee</span>
                  <span className="text-lg font-extrabold text-white">
                    {currencySymbol}
                    {activeCheckoutPrice.toFixed(2)} {verificationSettings.currency}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Select Payment Method
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedProvider('stripe_checkout')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedProvider === 'stripe_checkout'
                        ? 'bg-sky-950/40 border-sky-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-sky-400 mb-1.5" />
                    <div className="text-xs font-semibold">Stripe Card</div>
                    <div className="text-[10px] text-neutral-400">Visa / Mastercard</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider('acovon_wallet')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedProvider === 'acovon_wallet'
                        ? 'bg-sky-950/40 border-sky-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-emerald-400 mb-1.5" />
                    <div className="text-xs font-semibold">ACOVON Wallet</div>
                    <div className="text-[10px] text-neutral-400">
                      Avail: ${creator.walletBalance.toFixed(2)}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedProvider('apple_pay')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedProvider === 'apple_pay'
                        ? 'bg-sky-950/40 border-sky-500 text-white'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <Lock className="w-4 h-4 text-purple-400 mb-1.5" />
                    <div className="text-xs font-semibold">Apple Pay</div>
                    <div className="text-[10px] text-neutral-400">Instant Biometric</div>
                  </button>
                </div>
              </div>

              {/* Payment Gateway Confirmation Mode (Allows testing Confirmed vs Pending vs Failed) */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Payment Gateway Confirmation Mode
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulateOutcome('completed')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      simulateOutcome === 'completed'
                        ? 'bg-emerald-950/50 border-emerald-500/60 text-emerald-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Confirmed (Instant)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateOutcome('pending')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      simulateOutcome === 'pending'
                        ? 'bg-amber-950/50 border-amber-500/60 text-amber-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Pending Webhook
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateOutcome('failed')}
                    className={`py-2 px-3 rounded-lg border text-xs font-medium transition-colors ${
                      simulateOutcome === 'failed'
                        ? 'bg-rose-950/50 border-rose-500/60 text-rose-300'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    Simulate Decline
                  </button>
                </div>
              </div>

              {/* Applicable Terms */}
              <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="text-[11px] text-neutral-400 leading-relaxed">
                  {verificationSettings.termsAndConditions}
                </div>
                <label className="flex items-center gap-2.5 text-xs text-neutral-200 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={e => setAgreedTerms(e.target.checked)}
                    className="rounded border-neutral-700 bg-neutral-900 text-sky-500 focus:ring-sky-500"
                  />
                  <span>I agree to the ACOVON Creator Verification Terms & Conditions</span>
                </label>
              </div>

              {errorBanner && (
                <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200">
                  {errorBanner}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleConfirmPayment}
                className="px-5 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 transition-all"
              >
                <VerifiedBadge forceShow size="xs" />
                <span>
                  {isProcessing
                    ? 'Verifying Payment...'
                    : `Pay ${currencySymbol}${activeCheckoutPrice.toFixed(2)} ${verificationSettings.currency} & Activate Badge`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
