import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  PaidVerificationStatus,
  VerificationCurrency,
  VerificationDurationType,
  VerificationRefundStatus,
  VerificationTransaction
} from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  ShieldCheck,
  DollarSign,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  RefreshCw,
  Search,
  Settings,
  BarChart3,
  Receipt,
  FileText,
  Eye,
  Plus,
  Trash2,
  Check,
  X
} from 'lucide-react';

const CURRENCY_SYM: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£'
};

export const AdminCreatorVerificationSection: React.FC = () => {
  const {
    creators,
    verificationSettings,
    creatorVerificationRecords,
    verificationTransactions,
    verificationAuditLogs,
    isCreatorVerifiedBadgeActive,
    getCreatorVerificationRecord,
    confirmPendingVerificationPayment,
    adminUpdateVerificationSettings,
    adminSuspendCreatorVerification,
    adminRestoreCreatorVerification,
    adminRevokeCreatorVerification,
    adminManageVerificationRefund,
    adminTriggerVerificationExpiry
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    'revenue_overview' | 'creators_management' | 'pricing_config' | 'transactions_refunds' | 'audit_logs'
  >('revenue_overview');

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showBanner = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Sub-tab 1: Revenue Dashboard Filters
  const [dateFilter, setDateFilter] = useState<'all' | '30d' | '90d' | '2026' | '2025'>('all');

  // Sub-tab 2: Creators Management Filters & Action Modals
  const [creatorSearch, setCreatorSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaidVerificationStatus>('all');
  const [inspectCreatorId, setInspectCreatorId] = useState<string | null>(null);
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'restore' | 'revoke';
    creatorId: string;
    creatorName: string;
  } | null>(null);
  const [actionReason, setActionReason] = useState('');

  // Sub-tab 3: Pricing & Plan Configuration Form State
  const [planNameInput, setPlanNameInput] = useState(verificationSettings.planName);
  const [priceInput, setPriceInput] = useState(String(verificationSettings.price));
  const [currencyInput, setCurrencyInput] = useState<VerificationCurrency>(verificationSettings.currency);
  const [durationTypeInput, setDurationTypeInput] = useState<VerificationDurationType>(
    verificationSettings.durationType
  );
  const [durationDaysInput, setDurationDaysInput] = useState(
    String(verificationSettings.durationDays || 30)
  );
  const [renewalEnabledInput, setRenewalEnabledInput] = useState(verificationSettings.renewalEnabled);
  const [renewalPriceInput, setRenewalPriceInput] = useState(String(verificationSettings.renewalPrice));
  const [isActiveInput, setIsActiveInput] = useState(verificationSettings.isActive);
  const [isPublishedInput, setIsPublishedInput] = useState(verificationSettings.isPublished);
  const [descInput, setDescInput] = useState(verificationSettings.description);
  const [termsInput, setTermsInput] = useState(verificationSettings.termsAndConditions);
  const [benefitsInput, setBenefitsInput] = useState<string[]>(verificationSettings.benefits);
  const [newBenefitText, setNewBenefitText] = useState('');

  // Sub-tab 4: Refund Management Modal State
  const [refundModalTx, setRefundModalTx] = useState<VerificationTransaction | null>(null);
  const [refundTargetStatus, setRefundTargetStatus] = useState<VerificationRefundStatus>('completed');
  const [refundReasonInput, setRefundReasonInput] = useState('');
  const [keepBadgeOverrideReason, setKeepBadgeOverrideReason] = useState('');

  // Merged list of all creators with their verification records
  const allCreatorRows = useMemo(() => {
    return creators.map(c => {
      const rec = getCreatorVerificationRecord(c.id);
      const activeBadge = isCreatorVerifiedBadgeActive(c.id);
      return {
        creator: c,
        record: rec,
        activeBadge
      };
    });
  }, [creators, creatorVerificationRecords, verificationSettings]);

  const filteredCreatorRows = useMemo(() => {
    return allCreatorRows.filter(({ creator, record }) => {
      if (statusFilter !== 'all' && record.status !== statusFilter) return false;
      if (creatorSearch.trim()) {
        const q = creatorSearch.toLowerCase();
        return (
          creator.name.toLowerCase().includes(q) ||
          creator.username.toLowerCase().includes(q) ||
          creator.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allCreatorRows, statusFilter, creatorSearch]);

  // Filtered transactions by date range
  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    return verificationTransactions.filter(tx => {
      if (dateFilter === 'all') return true;
      if (dateFilter === '2026') return tx.paymentTimestamp.startsWith('2026');
      if (dateFilter === '2025') return tx.paymentTimestamp.startsWith('2025');
      const txTime = new Date(tx.paymentTimestamp.replace(' ', 'T')).getTime();
      if (isNaN(txTime)) return true;
      const daysDiff = (now - txTime) / (1000 * 60 * 60 * 24);
      if (dateFilter === '30d') return daysDiff <= 30;
      if (dateFilter === '90d') return daysDiff <= 90;
      return true;
    });
  }, [verificationTransactions, dateFilter]);

  // Real Financial & Verification Analytics computed strictly from actual records
  const revenueStats = useMemo(() => {
    const totalVerifiedCreators = allCreatorRows.filter(r => r.record.status === 'verified').length;
    const totalActiveBlueBadges = allCreatorRows.filter(r => r.activeBadge).length;

    const completedTxs = filteredTransactions.filter(t => t.paymentStatus === 'completed');
    const failedTxs = filteredTransactions.filter(t => t.paymentStatus === 'failed');
    const pendingTxs = filteredTransactions.filter(t => t.paymentStatus === 'pending');
    const refundedTxs = filteredTransactions.filter(t => t.refundStatus === 'completed');

    const grossRevenue = completedTxs.reduce((sum, t) => sum + t.amount, 0);
    const refundedTotal = refundedTxs.reduce((sum, t) => sum + (t.refundAmount ?? t.amount), 0);
    const netVerificationRevenue = Math.max(0, grossRevenue - refundedTotal);

    const renewalRevenue = completedTxs
      .filter(t => t.transactionType === 'renewal' && t.refundStatus !== 'completed')
      .reduce((sum, t) => sum + t.amount, 0);

    const failedPaymentTotal = failedTxs.reduce((sum, t) => sum + t.amount, 0);

    // Revenue by currency
    const byCurrency: Record<string, { gross: number; refunded: number; net: number; count: number }> = {
      USD: { gross: 0, refunded: 0, net: 0, count: 0 },
      EUR: { gross: 0, refunded: 0, net: 0, count: 0 },
      GBP: { gross: 0, refunded: 0, net: 0, count: 0 }
    };
    completedTxs.forEach(t => {
      if (!byCurrency[t.currency]) {
        byCurrency[t.currency] = { gross: 0, refunded: 0, net: 0, count: 0 };
      }
      byCurrency[t.currency].gross += t.amount;
      byCurrency[t.currency].count += 1;
      if (t.refundStatus === 'completed') {
        byCurrency[t.currency].refunded += t.refundAmount ?? t.amount;
      }
      byCurrency[t.currency].net = Math.max(
        0,
        byCurrency[t.currency].gross - byCurrency[t.currency].refunded
      );
    });

    // Revenue by month (YYYY-MM)
    const monthMap: Record<string, { month: string; gross: number; count: number }> = {};
    completedTxs.forEach(t => {
      if (t.refundStatus === 'completed') return;
      const monthKey = t.paymentTimestamp.slice(0, 7);
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = { month: monthKey, gross: 0, count: 0 };
      }
      monthMap[monthKey].gross += t.amount;
      monthMap[monthKey].count += 1;
    });
    const monthlySeries = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    return {
      totalVerifiedCreators,
      totalActiveBlueBadges,
      totalPurchasesCount: completedTxs.length,
      grossRevenue,
      netVerificationRevenue,
      renewalRevenue,
      refundedTotal,
      refundedCount: refundedTxs.length,
      failedPaymentTotal,
      failedCount: failedTxs.length,
      pendingCount: pendingTxs.length,
      byCurrency,
      monthlySeries
    };
  }, [allCreatorRows, filteredTransactions]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedPrice = parseFloat(priceInput);
    const parsedRenewalPrice = parseFloat(renewalPriceInput);
    const parsedDays =
      durationTypeInput === 'lifetime'
        ? null
        : durationTypeInput === 'monthly'
        ? 30
        : durationTypeInput === 'annual'
        ? 365
        : Math.max(1, parseInt(durationDaysInput, 10) || 30);

    const res = adminUpdateVerificationSettings({
      planName: planNameInput.trim() || 'ACOVON Official Blue Verification Badge',
      price: parsedPrice,
      currency: currencyInput,
      durationType: durationTypeInput,
      durationDays: parsedDays,
      renewalEnabled: renewalEnabledInput,
      renewalPrice: parsedRenewalPrice,
      isActive: isActiveInput,
      isPublished: isPublishedInput,
      description: descInput.trim(),
      termsAndConditions: termsInput.trim(),
      benefits: benefitsInput.filter(b => b.trim().length > 0)
    });

    if (res.success) {
      showBanner(
        'success',
        `Verification settings updated (${CURRENCY_SYM[currencyInput]}${parsedPrice.toFixed(2)} ${currencyInput} · ${durationTypeInput}). New purchases will use this price immediately.`
      );
    } else {
      showBanner('error', res.error || 'Failed to update verification settings.');
    }
  };

  const handleConfirmCreatorAction = () => {
    if (!actionModal) return;
    const { type, creatorId, creatorName } = actionModal;
    let res: { success: boolean; error?: string };

    if (type === 'suspend') {
      res = adminSuspendCreatorVerification(creatorId, actionReason);
    } else if (type === 'restore') {
      res = adminRestoreCreatorVerification(
        creatorId,
        actionReason || 'Verification restored by Administrator.'
      );
    } else {
      res = adminRevokeCreatorVerification(creatorId, actionReason);
    }

    if (res.success) {
      showBanner('success', `Successfully executed ${type.toUpperCase()} for ${creatorName}.`);
      setActionModal(null);
      setActionReason('');
    } else {
      showBanner('error', res.error || 'Action could not be completed.');
    }
  };

  const handleConfirmRefundUpdate = () => {
    if (!refundModalTx) return;
    const res = adminManageVerificationRefund(
      refundModalTx.id,
      refundTargetStatus,
      refundReasonInput,
      keepBadgeOverrideReason
    );
    if (res.success) {
      showBanner(
        'success',
        `Refund status for ${refundModalTx.id} (${refundModalTx.creatorName}) updated to ${refundTargetStatus.toUpperCase()}.`
      );
      setRefundModalTx(null);
      setRefundReasonInput('');
      setKeepBadgeOverrideReason('');
    } else {
      showBanner('error', res.error || 'Failed to update refund status.');
    }
  };

  const inspectedCreatorRow = inspectCreatorId
    ? allCreatorRows.find(r => r.creator.id === inspectCreatorId)
    : null;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="p-4 sm:p-6 rounded-2xl bg-[#111115] border border-[#24242c] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-500/40 flex items-center justify-center shrink-0">
            <VerifiedBadge forceShow size="lg" />
          </div>
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-sky-400">
              Admin Control Center · Automatic Blue Tick System
            </div>
            <h2 className="text-xl font-bold text-white mt-0.5">
              Creator Verification Management
            </h2>
            <p className="text-xs text-neutral-400 mt-1">
              Control paid blue verification pricing, duration, renewals, creator badge status (suspend, restore, revoke), refunds, and real-time verification revenue.
            </p>
          </div>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-neutral-800">
          {[
            { id: 'revenue_overview', label: 'Revenue & KPIs', icon: BarChart3 },
            { id: 'creators_management', label: 'Verified Creators', icon: Users },
            { id: 'pricing_config', label: 'Price & Plan Settings', icon: Settings },
            { id: 'transactions_refunds', label: 'Payments & Refunds', icon: Receipt },
            { id: 'audit_logs', label: 'Audit Logs', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  active
                    ? 'bg-[#1D9BF0] text-white shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-medium flex items-center justify-between ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 1: VERIFICATION REVENUE DASHBOARD & KPI OVERVIEW            */}
      {/* =================================================================== */}
      {activeSubTab === 'revenue_overview' && (
        <div className="space-y-6">
          {/* Date Range Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#111115] border border-[#24242c] p-4 rounded-xl">
            <div className="text-xs text-neutral-300 font-medium">
              All financial figures below are dynamically computed from real{' '}
              <code className="text-sky-400">verificationTransactions</code> &{' '}
              <code className="text-sky-400">creatorVerificationRecords</code>.
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', '30d', '90d', '2026', '2025'] as const).map(df => (
                <button
                  key={df}
                  type="button"
                  onClick={() => setDateFilter(df)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase transition-colors ${
                    dateFilter === df
                      ? 'bg-sky-500/20 border border-sky-500/50 text-sky-300'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {df === 'all' ? 'All Time' : df}
                </button>
              ))}
            </div>
          </div>

          {/* 8 Primary KPI Cards */}
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 tabular-nums">
            <div className="p-5 rounded-xl bg-[#111115] border border-[#24242c]">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                Total Verified Creators
              </div>
              <div className="text-2xl font-extrabold text-white mt-1 flex items-center gap-2">
                <span>{revenueStats.totalVerifiedCreators}</span>
                <VerifiedBadge forceShow size="sm" />
              </div>
              <div className="text-[11px] text-sky-400 mt-1">
                {revenueStats.totalActiveBlueBadges} active public blue badges
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#111115] border border-[#24242c]">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                Net Verification Revenue
              </div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                ${revenueStats.netVerificationRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Gross: ${revenueStats.grossRevenue.toFixed(2)} ({revenueStats.totalPurchasesCount} paid)
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#111115] border border-[#24242c]">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                Renewal Revenue
              </div>
              <div className="text-2xl font-extrabold text-sky-400 mt-1">
                ${revenueStats.renewalRevenue.toFixed(2)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                Active Plan Price: {CURRENCY_SYM[verificationSettings.currency]}
                {verificationSettings.price.toFixed(2)} {verificationSettings.currency}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-[#111115] border border-[#24242c]">
              <div className="text-[11px] uppercase tracking-wider text-neutral-400">
                Refunds & Failed Payments
              </div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                ${revenueStats.refundedTotal.toFixed(2)}
              </div>
              <div className="text-[11px] text-neutral-400 mt-1">
                {revenueStats.refundedCount} Refunded · {revenueStats.failedCount} Failed ($
                {revenueStats.failedPaymentTotal.toFixed(2)})
              </div>
            </div>
          </div>

          {/* Monthly Revenue Chart & Currency Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl bg-[#111115] border border-[#24242c] space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Verification Revenue by Month</h3>
                  <p className="text-xs text-neutral-400">
                    Completed verification badge purchases and renewals aggregated by month
                  </p>
                </div>
                <span className="text-xs text-sky-400 font-semibold">
                  {revenueStats.monthlySeries.length} Active Months
                </span>
              </div>

              {revenueStats.monthlySeries.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-500">
                  No completed transactions in selected period.
                </div>
              ) : (
                <div className="space-y-3 pt-2 tabular-nums">
                  {revenueStats.monthlySeries.map(item => {
                    const maxGross = Math.max(...revenueStats.monthlySeries.map(m => m.gross), 100);
                    const pct = Math.min(100, Math.round((item.gross / maxGross) * 100));
                    return (
                      <div key={item.month} className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-neutral-300">{item.month}</span>
                          <span className="text-white font-semibold">
                            ${item.gross.toFixed(2)} ({item.count} purchase{item.count > 1 ? 's' : ''})
                          </span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-neutral-900 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#1D9BF0] to-sky-400"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl bg-[#111115] border border-[#24242c] space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Revenue by Currency</h3>
                <p className="text-xs text-neutral-400">
                  Breakdown of verification payments across supported settlement currencies
                </p>
              </div>

              <div className="space-y-3 tabular-nums">
                {Object.entries(revenueStats.byCurrency).map(([curr, stats]) => (
                  <div
                    key={curr}
                    className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {curr} ({CURRENCY_SYM[curr] || '$'})
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        {stats.count} completed transaction(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-emerald-400">
                        {CURRENCY_SYM[curr] || '$'}
                        {stats.net.toFixed(2)} Net
                      </div>
                      {stats.refunded > 0 && (
                        <div className="text-[10px] text-amber-400">
                          Refunded: {CURRENCY_SYM[curr] || '$'}
                          {stats.refunded.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 2: VERIFIED CREATORS MANAGEMENT                             */}
      {/* =================================================================== */}
      {activeSubTab === 'creators_management' && (
        <div className="space-y-4">
          {/* Search & Status Filter Bar */}
          <div className="p-4 rounded-xl bg-[#111115] border border-[#24242c] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={creatorSearch}
                onChange={e => setCreatorSearch(e.target.value)}
                placeholder="Search creators by name, @username, or Creator ID..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  'all',
                  'verified',
                  'payment_pending',
                  'renewal_required',
                  'expired',
                  'suspended',
                  'revoked',
                  'not_verified'
                ] as const
              ).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold capitalize transition-colors ${
                    statusFilter === st
                      ? 'bg-[#1D9BF0] text-white'
                      : 'bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Creators Verification Table */}
          <div className="rounded-2xl bg-[#111115] border border-[#24242c] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs whitespace-nowrap tabular-nums">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400">
                    <th className="py-3 px-4 font-medium">Creator</th>
                    <th className="py-3 px-4 font-medium">Creator ID</th>
                    <th className="py-3 px-4 font-medium">Verification Status</th>
                    <th className="py-3 px-4 font-medium">Purchase Date</th>
                    <th className="py-3 px-4 font-medium">Amount Paid</th>
                    <th className="py-3 px-4 font-medium">Expiration / Validity</th>
                    <th className="py-3 px-4 font-medium">Last Renewal</th>
                    <th className="py-3 px-4 font-medium text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/60">
                  {filteredCreatorRows.map(({ creator, record, activeBadge }) => {
                    const pendingCreatorTx = verificationTransactions.find(
                      t => t.creatorId === creator.id && t.paymentStatus === 'pending'
                    );
                    return (
                      <tr key={creator.id} className="hover:bg-neutral-900/40">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={creator.avatar}
                              alt={creator.name}
                              className="w-9 h-9 rounded-full object-cover"
                            />
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{creator.name}</span>
                                <VerifiedBadge creatorId={creator.id} size="xs" />
                              </div>
                              <div className="text-[11px] text-neutral-400">
                                <span>@{creator.username}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-neutral-300">{creator.id}</td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-semibold capitalize ${
                              record.status === 'verified'
                                ? 'text-sky-400'
                                : record.status === 'payment_pending' || record.status === 'renewal_required'
                                ? 'text-amber-400'
                                : record.status === 'suspended' || record.status === 'revoked'
                                ? 'text-rose-400'
                                : 'text-neutral-400'
                            }`}
                          >
                            {record.status.replace('_', ' ')}
                          </span>
                          {activeBadge && (
                            <span className="ml-2 text-[10px] text-emerald-400">· Live Badge</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300">
                          {record.purchaseDate || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {record.amountPaid > 0
                            ? `${CURRENCY_SYM[record.currency] || '$'}${record.amountPaid.toFixed(2)} ${record.currency}`
                            : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300">
                          {record.status === 'not_verified'
                            ? '—'
                            : record.expirationDate
                            ? record.expirationDate
                            : 'Lifetime'}
                        </td>
                        <td className="py-3.5 px-4 text-neutral-400">
                          {record.lastRenewalDate || '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setInspectCreatorId(creator.id)}
                              className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium"
                            >
                              History
                            </button>

                            {record.status === 'payment_pending' && pendingCreatorTx && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = confirmPendingVerificationPayment(pendingCreatorTx.id);
                                  if (res.success) {
                                    showBanner(
                                      'success',
                                      `Confirmed pending payment and activated blue badge for ${creator.name}.`
                                    );
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                              >
                                Confirm Payment
                              </button>
                            )}

                            {record.status === 'verified' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionModal({
                                      type: 'suspend',
                                      creatorId: creator.id,
                                      creatorName: creator.name
                                    });
                                    setActionReason('');
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-300 text-[11px] font-medium"
                                >
                                  Suspend
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    adminTriggerVerificationExpiry(creator.id);
                                    showBanner(
                                      'success',
                                      `Simulated verification period expiration for ${creator.name}.`
                                    );
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[11px] font-medium"
                                  title="Test time-limited verification expiration"
                                >
                                  Expire
                                </button>
                              </>
                            )}

                            {(record.status === 'suspended' ||
                              record.status === 'revoked' ||
                              record.status === 'expired' ||
                              record.status === 'renewal_required' ||
                              record.status === 'not_verified') && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionModal({
                                    type: 'restore',
                                    creatorId: creator.id,
                                    creatorName: creator.name
                                  });
                                  setActionReason('Verification restored/activated by Administrator.');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-sky-950/80 hover:bg-sky-900 border border-sky-500/40 text-sky-300 text-[11px] font-medium"
                              >
                                Restore / Activate
                              </button>
                            )}

                            {record.status !== 'revoked' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setActionModal({
                                    type: 'revoke',
                                    creatorId: creator.id,
                                    creatorName: creator.name
                                  });
                                  setActionReason('');
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-medium"
                              >
                                Revoke
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 3: VERIFICATION CONFIGURATION & PRICE MANAGEMENT            */}
      {/* =================================================================== */}
      {activeSubTab === 'pricing_config' && (
        <form
          onSubmit={handleSaveSettings}
          className="p-4 sm:p-6 rounded-2xl bg-[#111115] border border-[#24242c] space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <h3 className="text-base font-bold text-white">
                Verification Pricing, Duration & Offer Configuration
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Changes saved here immediately update the Creator Studio "Get Verified" offer. Existing completed purchases retain their historical transaction amounts.
              </p>
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#1D9BF0] hover:bg-sky-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 shrink-0"
            >
              Save Verification Configuration
            </button>
          </div>

          {/* Toggles Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Enable Paid Verification</div>
                <div className="text-[11px] text-neutral-400">
                  Allow creators to purchase verification
                </div>
              </div>
              <input
                type="checkbox"
                checked={isActiveInput}
                onChange={e => setIsActiveInput(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500"
              />
            </label>

            <label className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Publish Offer in Creator Studio</div>
                <div className="text-[11px] text-neutral-400">
                  Display "Get Verified" card to creators
                </div>
              </div>
              <input
                type="checkbox"
                checked={isPublishedInput}
                onChange={e => setIsPublishedInput(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500"
              />
            </label>

            <label className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between cursor-pointer">
              <div>
                <div className="text-xs font-bold text-white">Enable Time-Limited Renewals</div>
                <div className="text-[11px] text-neutral-400">
                  Allow creators to renew when time-limited
                </div>
              </div>
              <input
                type="checkbox"
                checked={renewalEnabledInput}
                onChange={e => setRenewalEnabledInput(e.target.checked)}
                className="w-4 h-4 rounded text-sky-500"
              />
            </label>
          </div>

          {/* Price, Currency & Duration Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Verification Plan Name
              </label>
              <input
                type="text"
                value={planNameInput}
                onChange={e => setPlanNameInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Verification Price (Positive Amount)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={priceInput}
                onChange={e => setPriceInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">Currency</label>
              <select
                value={currencyInput}
                onChange={e => setCurrencyInput(e.target.value as VerificationCurrency)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Verification Duration Type
              </label>
              <select
                value={durationTypeInput}
                onChange={e => setDurationTypeInput(e.target.value as VerificationDurationType)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="lifetime">Lifetime Verification (Never Expires)</option>
                <option value="monthly">Monthly Verification (30 Days)</option>
                <option value="annual">Annual Verification (365 Days)</option>
                <option value="custom_days">Custom Duration (Days)</option>
              </select>
            </div>

            {durationTypeInput === 'custom_days' && (
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-neutral-300">
                  Custom Duration (Days)
                </label>
                <input
                  type="number"
                  min="1"
                  value={durationDaysInput}
                  onChange={e => setDurationDaysInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Renewal Fee ({currencyInput})
              </label>
              <input
                type="number"
                step="0.01"
                min="0.50"
                value={renewalPriceInput}
                onChange={e => setRenewalPriceInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
          </div>

          {/* Description & Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Verification Offer Description
              </label>
              <textarea
                rows={3}
                value={descInput}
                onChange={e => setDescInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Verification Terms & Conditions
              </label>
              <textarea
                rows={3}
                value={termsInput}
                onChange={e => setTermsInput(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white"
              />
            </div>
          </div>

          {/* Benefits List Editor */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-neutral-300">
              Verification Benefits Displayed in Creator Studio
            </label>
            <div className="space-y-2">
              {benefitsInput.map((b, i) => (
                <div key={i} className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
                  <input
                    type="text"
                    value={b}
                    onChange={e => {
                      const copy = [...benefitsInput];
                      copy[i] = e.target.value;
                      setBenefitsInput(copy);
                    }}
                    className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setBenefitsInput(benefitsInput.filter((_, idx) => idx !== i))}
                    className="p-2 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 self-end xs:self-auto shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2">
              <input
                type="text"
                value={newBenefitText}
                onChange={e => setNewBenefitText(e.target.value)}
                placeholder="Add another verification benefit..."
                className="flex-1 min-w-0 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (newBenefitText.trim()) {
                    setBenefitsInput([...benefitsInput, newBenefitText.trim()]);
                    setNewBenefitText('');
                  }
                }}
                className="px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Benefit</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 4: VERIFICATION PAYMENTS & REFUND MANAGEMENT                */}
      {/* =================================================================== */}
      {activeSubTab === 'transactions_refunds' && (
        <div className="rounded-2xl bg-[#111115] border border-[#24242c] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Verification Payment & Refund Ledger
              </h3>
              <p className="text-xs text-neutral-400">
                Inspect payment gateway references, idempotency keys, and issue audited verification refunds. Completed refunds automatically deactivate the creator's paid blue badge unless an authorized override is recorded.
              </p>
            </div>
            <span className="text-xs text-neutral-400">
              {verificationTransactions.length} Total Transactions
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs whitespace-nowrap tabular-nums">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-950/60 text-neutral-400">
                  <th className="py-3 px-4 font-medium">Tx ID</th>
                  <th className="py-3 px-4 font-medium">Creator</th>
                  <th className="py-3 px-4 font-medium">Type</th>
                  <th className="py-3 px-4 font-medium">Provider / Ref</th>
                  <th className="py-3 px-4 font-medium">Amount</th>
                  <th className="py-3 px-4 font-medium">Payment Status</th>
                  <th className="py-3 px-4 font-medium">Refund Status</th>
                  <th className="py-3 px-4 font-medium">Timestamp</th>
                  <th className="py-3 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {verificationTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-neutral-900/40">
                    <td className="py-3 px-4 font-mono text-neutral-200">{tx.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span>{tx.creatorName}</span>
                        <VerifiedBadge creatorId={tx.creatorId} size="xs" />
                      </div>
                      <div className="text-[11px] text-neutral-400">
                        <span>@{tx.creatorUsername}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 capitalize text-neutral-300">{tx.transactionType}</td>
                    <td className="py-3 px-4 text-neutral-400">
                      <div className="uppercase text-[11px]">{tx.paymentProvider.replace('_', ' ')}</div>
                      <div className="font-mono text-[10px] text-neutral-500">
                        {tx.providerTransactionId}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {CURRENCY_SYM[tx.currency] || '$'}
                      {tx.amount.toFixed(2)} {tx.currency}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <span
                        className={`font-medium ${
                          tx.refundStatus === 'completed'
                            ? 'text-amber-300'
                            : tx.refundStatus === 'pending' || tx.refundStatus === 'processing'
                            ? 'text-sky-300'
                            : 'text-neutral-500'
                        }`}
                      >
                        {tx.refundStatus.replace('_', ' ')}
                      </span>
                      {tx.refundTransactionId && (
                        <div className="font-mono text-[10px] text-neutral-500">
                          {tx.refundTransactionId}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-neutral-400">{tx.paymentTimestamp}</td>
                    <td className="py-3 px-4 text-right">
                      {tx.paymentStatus === 'completed' && (
                        <button
                          type="button"
                          onClick={() => {
                            setRefundModalTx(tx);
                            setRefundTargetStatus(
                              tx.refundStatus === 'not_requested' ? 'completed' : tx.refundStatus
                            );
                            setRefundReasonInput(tx.refundReason || '');
                            setKeepBadgeOverrideReason(tx.keepBadgeAuthorizedReason || '');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-semibold"
                        >
                          Manage Refund
                        </button>
                      )}
                      {tx.paymentStatus === 'pending' && (
                        <button
                          type="button"
                          onClick={() => {
                            const res = confirmPendingVerificationPayment(tx.id);
                            if (res.success) {
                              showBanner('success', `Confirmed pending payment ${tx.id}.`);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold"
                        >
                          Settle Webhook
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUB-TAB 5: VERIFICATION AUDIT LOGS                                  */}
      {/* =================================================================== */}
      {activeSubTab === 'audit_logs' && (
        <div className="rounded-2xl bg-[#111115] border border-[#24242c] overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-neutral-800">
            <h3 className="text-sm font-bold text-white">
              Creator Verification Administrative & System Audit Trail
            </h3>
            <p className="text-xs text-neutral-400">
              Immutable log of all verification purchases, price changes, suspensions, restorations, revocations, and refund actions.
            </p>
          </div>
          <div className="divide-y divide-neutral-800/60">
            {verificationAuditLogs.map(log => (
              <div
                key={log.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-neutral-900/40 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-white flex flex-wrap items-center gap-2">
                    <span>{log.action}</span>
                    {log.creatorName && (
                      <span className="text-sky-400 font-normal">· {log.creatorName}</span>
                    )}
                  </div>
                  <div className="text-neutral-400">{log.reason}</div>
                  {(log.previousStatus || log.newStatus) && (
                    <div className="text-[11px] text-neutral-500 font-mono">
                      Transition: {log.previousStatus || '—'} → {log.newStatus || '—'}
                    </div>
                  )}
                </div>
                <div className="sm:text-right text-[11px] text-neutral-400 shrink-0">
                  <div className="text-neutral-200 font-medium">{log.adminName}</div>
                  <div className="font-mono">{log.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: SUSPEND / RESTORE / REVOKE CREATOR VERIFICATION              */}
      {/* =================================================================== */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white capitalize">
                {actionModal.type} Creator Verification — {actionModal.creatorName}
              </h3>
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-400">
              {actionModal.type === 'suspend'
                ? 'Suspending verification immediately hides the blue badge from all public views across ACOVON until restored.'
                : actionModal.type === 'revoke'
                ? 'Revoking verification permanently removes the blue badge for severe policy, impersonation, or fraud violations.'
                : 'Restoring verification immediately reactivates the official blue badge across all 16 platform placements.'}
            </p>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Administrative Reason (Recorded in Audit Log)
              </label>
              <textarea
                rows={3}
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder="Enter mandatory reason for audit trail..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white"
              />
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmCreatorAction}
                className={`px-4 py-2 rounded-lg text-white text-xs font-bold capitalize ${
                  actionModal.type === 'restore'
                    ? 'bg-[#1D9BF0] hover:bg-sky-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                Confirm {actionModal.type}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: MANAGE VERIFICATION REFUND                                   */}
      {/* =================================================================== */}
      {refundModalTx && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">
                Manage Verification Refund ({refundModalTx.id})
              </h3>
              <button
                type="button"
                onClick={() => setRefundModalTx(null)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs space-y-1">
              <div>
                Creator: <strong className="text-white">{refundModalTx.creatorName}</strong> (@
                {refundModalTx.creatorUsername})
              </div>
              <div>
                Original Payment:{' '}
                <strong className="text-emerald-400">
                  {CURRENCY_SYM[refundModalTx.currency] || '$'}
                  {refundModalTx.amount.toFixed(2)} {refundModalTx.currency}
                </strong>{' '}
                via {refundModalTx.paymentProvider.replace('_', ' ')}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">Refund Status</label>
              <select
                value={refundTargetStatus}
                onChange={e => setRefundTargetStatus(e.target.value as VerificationRefundStatus)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                <option value="pending">Pending Refund Review (Suspends Badge)</option>
                <option value="processing">Processing Refund (Suspends Badge)</option>
                <option value="completed">Completed Refund (Revokes/Removes Paid Badge)</option>
                <option value="failed">Refund Failed / Declined</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Refund Reason (Required)
              </label>
              <textarea
                rows={2}
                value={refundReasonInput}
                onChange={e => setRefundReasonInput(e.target.value)}
                placeholder="e.g. Creator requested billing refund within 24 hours..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-neutral-300">
                Authorized Badge Retention Override (Optional — Leave blank to automatically deactivate badge)
              </label>
              <input
                type="text"
                value={keepBadgeOverrideReason}
                onChange={e => setKeepBadgeOverrideReason(e.target.value)}
                placeholder="Leave blank to remove blue badge on refund, or enter executive override reason..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRefundModalTx(null)}
                className="px-4 py-2 rounded-lg bg-neutral-800 text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRefundUpdate}
                className="px-4 py-2 rounded-lg bg-[#1D9BF0] hover:bg-sky-500 text-white text-xs font-bold"
              >
                Update Refund & Badge Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: INSPECT CREATOR VERIFICATION & PAYMENT HISTORY               */}
      {/* =================================================================== */}
      {inspectedCreatorRow && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-neutral-900 border border-neutral-800 p-5 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto acovon-modal-panel">
            <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={inspectedCreatorRow.creator.avatar}
                  alt={inspectedCreatorRow.creator.name}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white flex flex-wrap items-center gap-1.5">
                    <span>{inspectedCreatorRow.creator.name}</span>
                    <VerifiedBadge creatorId={inspectedCreatorRow.creator.id} size="xs" />
                  </h3>
                  <div className="text-xs text-neutral-400 inline-flex flex-wrap items-center gap-1">
                    <span>@{inspectedCreatorRow.creator.username}</span>
                    <span>· ID: {inspectedCreatorRow.creator.id}</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectCreatorId(null)}
                className="text-neutral-400 hover:text-white shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-400">Current Status</div>
                <div className="text-white font-bold capitalize mt-0.5">
                  {inspectedCreatorRow.record.status.replace('_', ' ')}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-400">Purchase Date</div>
                <div className="text-white font-semibold mt-0.5">
                  {inspectedCreatorRow.record.purchaseDate || '—'}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div className="text-neutral-400">Expiration</div>
                <div className="text-sky-400 font-semibold mt-0.5">
                  {inspectedCreatorRow.record.expirationDate || 'Lifetime'}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Payment History for {inspectedCreatorRow.creator.name}
              </h4>
              <div className="divide-y divide-neutral-800 rounded-xl bg-neutral-950 border border-neutral-800">
                {verificationTransactions
                  .filter(t => t.creatorId === inspectedCreatorRow.creator.id)
                  .map(t => (
                    <div
                      key={t.id}
                      className="p-3 flex flex-col xs:flex-row xs:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-white">
                          {t.id} · {t.planName}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {t.paymentProvider} ({t.providerTransactionId}) · {t.paymentTimestamp}
                        </div>
                      </div>
                      <div className="xs:text-right shrink-0 tabular-nums">
                        <div className="font-bold text-white">
                          {CURRENCY_SYM[t.currency] || '$'}
                          {t.amount.toFixed(2)} {t.currency}
                        </div>
                        <div className="text-[11px] text-emerald-400 uppercase">
                          {t.paymentStatus} · Refund: {t.refundStatus}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
