import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Building, 
  Coins, 
  ShieldCheck, 
  History,
  Lock,
  AlertCircle
} from 'lucide-react';

interface WalletModalProps {
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
  const { 
    currentUser, 
    isCurrentUserApprovedCreator,
    transactions, 
    depositFunds, 
    withdrawFunds, 
    commissionSettings 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'deposit' | 'withdraw' | 'history'>('overview');
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [customDeposit, setCustomDeposit] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<number>(100);
  const [payoutMethod, setPayoutMethod] = useState<'stripe' | 'wire' | 'crypto'>('stripe');
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; error?: boolean } | null>(null);

  const isCreator = isCurrentUserApprovedCreator || currentUser.role === 'creator';
  const userTransactions = transactions.filter(t => t.userId === currentUser.id);
  const totalSpent = userTransactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = customDeposit ? Number(customDeposit) : depositAmount;
    if (isNaN(amount) || amount <= 0) {
      setFeedbackMsg({ text: 'Please enter a valid deposit amount.', error: true });
      return;
    }

    depositFunds(amount);
    setFeedbackMsg({ text: `Successfully credited $${amount.toFixed(2)} to your Acovon wallet.` });
    setCustomDeposit('');
    setTimeout(() => setActiveTab('overview'), 1200);
  };

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      setFeedbackMsg({ text: 'Please enter a valid amount.', error: true });
      return;
    }

    const methodName = payoutMethod === 'stripe' ? 'Stripe Connect' : payoutMethod === 'wire' ? 'Direct Bank Wire (IBAN)' : 'USDC Vault';
    const res = withdrawFunds(withdrawAmount, methodName);

    if (res.success) {
      setFeedbackMsg({ text: `Withdrawal of $${withdrawAmount.toFixed(2)} dispatched to your ${methodName}.` });
      setTimeout(() => setActiveTab('overview'), 1500);
    } else {
      setFeedbackMsg({ text: res.error || 'Withdrawal failed.', error: true });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[92dvh] overflow-y-auto animate-in zoom-in-95 acovon-modal-panel">
        
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 sm:mb-6 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5 text-[#d4af37]" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-white truncate">Acovon Financial Wallet</h2>
            <div className="text-xs text-neutral-400 truncate">
              Account: {currentUser.name} ({currentUser.username})
            </div>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 p-1 bg-[#18181c] border border-[#27272a] rounded-xl mb-5 sm:mb-6 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => { setActiveTab('overview'); setFeedbackMsg(null); }}
            className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Balance Overview
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('deposit'); setFeedbackMsg(null); }}
            className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'deposit' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Add Funds
          </button>
          {isCreator && (
            <button
              type="button"
              onClick={() => { setActiveTab('withdraw'); setFeedbackMsg(null); }}
              className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === 'withdraw' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Withdraw Payout
            </button>
          )}
          <button
            type="button"
            onClick={() => { setActiveTab('history'); setFeedbackMsg(null); }}
            className={`flex-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'history' ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Ledger History
          </button>
        </div>

        {feedbackMsg && (
          <div className={`p-3 rounded-xl text-xs mb-4 ${
            feedbackMsg.error
              ? 'bg-rose-950/50 border border-rose-800 text-rose-300'
              : 'bg-emerald-950/50 border border-emerald-800 text-emerald-300'
          }`}>
            {feedbackMsg.text}
          </div>
        )}

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-1">
                <span className="text-xs text-neutral-400">Available Liquid Balance</span>
                <div className="text-3xl font-bold font-mono text-white tabular-nums">
                  ${Number(currentUser?.walletBalance || 0).toFixed(2)}
                </div>
                <span className="text-[11px] text-neutral-500">Ready for instant unlocks, subscriptions & video calls</span>
              </div>

              {isCreator ? (
                <div className="p-5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-1">
                  <span className="text-xs text-neutral-400">Pending Escrow Obligation</span>
                  <div className="text-3xl font-bold font-mono text-[#fce7b0] tabular-nums">
                    ${('pendingBalance' in currentUser ? currentUser.pendingBalance : 0).toFixed(2)}
                  </div>
                  <span className="text-[11px] text-neutral-500">Released upon custom video delivery acceptance</span>
                </div>
              ) : (
                <div className="p-5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-1">
                  <span className="text-xs text-neutral-400">Total Spent &amp; Supported</span>
                  <div className="text-3xl font-bold font-mono text-neutral-300 tabular-nums">
                    ${totalSpent.toFixed(2)}
                  </div>
                  <span className="text-[11px] text-neutral-500">Across subscriptions, tips, and video calls</span>
                </div>
              )}
            </div>

            {/* Quick action buttons */}
            <div className="flex flex-wrap xs:flex-nowrap gap-3">
              <button
                onClick={() => setActiveTab('deposit')}
                className="flex-1 min-w-[140px] py-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Deposit Instant Funds</span>
              </button>

              {isCreator && (
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className="flex-1 min-w-[140px] py-3 bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Request Payout</span>
                </button>
              )}
            </div>

            {/* Recent 3 transactions preview */}
            <div>
              <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Recent Activity
              </div>
              <div className="space-y-2">
                {userTransactions.length === 0 ? (
                  <div className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl text-center text-xs text-neutral-500">
                    No wallet transactions recorded yet.
                  </div>
                ) : (
                  userTransactions.slice(0, 3).map(tx => (
                    <div key={tx.id} className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex flex-wrap xs:flex-nowrap items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-medium text-white">{tx.description}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{tx.createdAt} · {tx.id}</div>
                      </div>
                      <div className={`font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-neutral-200'}`}>
                        {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <form onSubmit={handleDeposit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Select Pre-set Deposit Amount
              </label>
              <div className="grid grid-cols-2 xs:grid-cols-4 gap-2">
                {[25, 50, 100, 250].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => { setDepositAmount(amt); setCustomDeposit(''); }}
                    className={`py-3 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                      depositAmount === amt && !customDeposit
                        ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#fce7b0]'
                        : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-400 mb-1">
                Or Enter Custom USD Amount
              </label>
              <input
                type="number"
                min="5"
                placeholder="e.g. 150.00"
                value={customDeposit}
                onChange={(e) => setCustomDeposit(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
              />
            </div>

            <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center gap-3 text-xs text-neutral-400">
              <CreditCard className="w-5 h-5 text-[#d4af37] shrink-0" />
              <div>
                <div className="font-semibold text-neutral-200">Instant Card & Apple Pay Checkout</div>
                <div className="text-[10px]">Secure 256-bit PCI-DSS simulated checkout. No real cards charged.</div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 cursor-pointer"
            >
              Confirm Deposit of ${customDeposit || depositAmount}
            </button>
          </form>
        )}

        {/* Withdraw Tab (Creators) */}
        {activeTab === 'withdraw' && isCreator && (
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Withdrawal Amount ($ USD)
              </label>
              <input
                type="number"
                min={commissionSettings.minWithdrawalAmount}
                max={currentUser?.walletBalance || 0}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(Number(e.target.value))}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
              />
              <div className="text-[11px] text-neutral-500 mt-1">
                Minimum withdrawal threshold: ${commissionSettings.minWithdrawalAmount.toFixed(2)}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                Destination Payout Method
              </label>
              <div className="space-y-2">
                {[
                  { id: 'stripe' as const, label: 'Stripe Connect (Express Account)', desc: 'Direct bank transfer to your verified debit/checking account' },
                  { id: 'wire' as const, label: 'International SWIFT / SEPA Bank Wire', desc: 'Direct corporate wire to international bank account' },
                  { id: 'crypto' as const, label: 'Instant USDC Settlement', desc: 'Direct on-chain payout to verified Polygon/Solana address' }
                ].map(opt => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      payoutMethod === opt.id
                        ? 'bg-[#1e1e24] border-[#d4af37] text-white'
                        : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payoutMethod"
                      checked={payoutMethod === opt.id}
                      onChange={() => setPayoutMethod(opt.id)}
                      className="mt-0.5 accent-[#d4af37]"
                    />
                    <div>
                      <div className="text-xs font-semibold text-neutral-200">{opt.label}</div>
                      <div className="text-[11px] text-neutral-500">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 cursor-pointer"
            >
              Withdraw ${withdrawAmount.toFixed(2)}
            </button>
          </form>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {userTransactions.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-xs">No transactions logged yet.</div>
            ) : (
              userTransactions.map(tx => (
                <div key={tx.id} className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex flex-wrap xs:flex-nowrap items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="font-semibold text-neutral-200">{tx.description}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Ref: {tx.id} · {tx.createdAt}
                      {tx.platformFee ? ` · Platform fee: $${tx.platformFee.toFixed(2)}` : ''}
                    </div>
                  </div>
                  <div className={`font-mono font-bold tabular-nums ${
                    tx.amount > 0 ? 'text-emerald-400' : 'text-neutral-200'
                  }`}>
                    {tx.amount > 0 ? `+$${tx.amount.toFixed(2)}` : `-$${Math.abs(tx.amount).toFixed(2)}`}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
