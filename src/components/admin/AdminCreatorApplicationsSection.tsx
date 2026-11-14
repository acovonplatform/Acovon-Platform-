import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorVerification } from '../../types';
import {
  CheckCircle2,
  XCircle,
  Search,
  ShieldCheck,
  X,
  RefreshCw,
  Eye,
  Calendar,
  FileText,
  History,
  AlertTriangle
} from 'lucide-react';

export const AdminCreatorApplicationsSection: React.FC = () => {
  const {
    verifications,
    users,
    reviewVerification,
    creatorApplicationAuditLogs,
    creatorApplicationCounts,
    creatorApplicationSyncStatus,
    refreshCreatorApplications
  } = useApp();

  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Full inspection modal ("Review" button)
  const [reviewingApplication, setReviewingApplication] = useState<CreatorVerification | null>(null);

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    type: 'approve' | 'reject' | 'info_requested';
    verification: CreatorVerification;
  } | null>(null);
  const [reviewNotesInput, setReviewNotesInput] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);

  // Toast feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showBanner = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 5000);
  };

  useEffect(() => {
    refreshCreatorApplications({ reconcile: true }).catch(() => {});
  }, []);

  const allUnifiedUsers = useMemo(() => {
    return Object.values(users || {}).filter(Boolean);
  }, [users]);

  const resolveApplicantEmail = (v: CreatorVerification) => {
    const vUsername = String(v.username || '').toLowerCase();
    const applicantAccount = allUnifiedUsers.find(
      u => u.id === v.userId || (vUsername && String(u.username || '').toLowerCase() === vUsername)
    );
    return {
      applicantAccount,
      email: (v.email && v.email.includes('@') ? v.email : '') || applicantAccount?.email || 'No email on file',
      avatar:
        v.avatar ||
        applicantAccount?.avatar ||
        v.selfieUrl ||
        ''
    };
  };

  // Filtered applications across all valid records
  const filteredApplications = useMemo(() => {
    return (Array.isArray(verifications) ? verifications : []).filter(v => {
      if (!v) return false;
      const { email } = resolveApplicantEmail(v);

      // Tab filter
      if (activeTab === 'pending' && v.status !== 'pending' && v.status !== 'info_requested') return false;
      if (activeTab === 'approved' && v.status !== 'approved') return false;
      if (activeTab === 'rejected' && v.status !== 'rejected') return false;

      // Status dropdown filter
      if (statusFilter !== 'all' && v.status !== statusFilter) return false;

      // Submission date filter
      if (dateFilter.trim()) {
        if (!String(v.submittedAt || '').includes(dateFilter.trim())) return false;
      }

      // Search query filter (Name, Username, Email, Application ID, Status, Doc Number, Date)
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const hay = [
          v.name,
          v.username,
          email,
          v.id,
          v.userId,
          v.status,
          v.documentNumber,
          v.submittedAt,
          v.applicationData?.category
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      return true;
    });
  }, [verifications, allUnifiedUsers, activeTab, statusFilter, dateFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedApplications = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, safeCurrentPage, pageSize]);

  const countAll = creatorApplicationCounts.all;
  const countPending = creatorApplicationCounts.pending;
  const countApproved = creatorApplicationCounts.approved;
  const countRejected = creatorApplicationCounts.rejected;

  const handleManualSync = async () => {
    const res = await refreshCreatorApplications({ reconcile: true });
    if (res.success) {
      showBanner('success', `Synchronized ${res.total ?? countAll} centralized creator applications.`);
    } else {
      showBanner('error', res.error || 'Failed to sync applications.');
    }
  };

  const handleExecuteReview = async () => {
    if (!confirmModal || isSubmittingDecision) return;
    const { type, verification } = confirmModal;
    const notes =
      reviewNotesInput.trim() ||
      (type === 'approve'
        ? 'Biometric 18+ ID and Creator application approved by administrator.'
        : type === 'info_requested'
        ? 'Please upload clearer identification details for review.'
        : 'Creator application rejected.');

    setIsSubmittingDecision(true);
    try {
      const targetStatus: 'approved' | 'rejected' | 'info_requested' =
        type === 'approve' ? 'approved' : type === 'reject' ? 'rejected' : 'info_requested';
      const res = await reviewVerification(verification.id, targetStatus, notes);
      if (!res.success) {
        showBanner('error', res.error || 'Unable to process application decision.');
        return;
      }

      if (type === 'approve') {
        showBanner(
          'success',
          `Approved application for ${verification.name}. Existing account upgraded from Fan to Creator.`
        );
      } else if (type === 'info_requested') {
        showBanner('success', `Requested additional verification details from ${verification.name}.`);
      } else {
        showBanner('success', `Rejected application for ${verification.name}. Account role remains Fan.`);
      }

      setConfirmModal(null);
      setReviewingApplication(null);
      setReviewNotesInput('');
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sync Error Banner (never silent) */}
      {creatorApplicationSyncStatus.error && (
        <div className="p-3.5 rounded-xl text-xs border bg-rose-950/60 border-rose-500/40 text-rose-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{creatorApplicationSyncStatus.error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualSync}
              className="px-3 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800/70 border border-rose-500/40 text-white font-semibold cursor-pointer"
            >
              Retry Sync
            </button>
          </div>
        </div>
      )}

      {/* Supabase Remote Mirror Notice (only when external SQL schema hasn't been executed) */}
      {!creatorApplicationSyncStatus.error &&
        creatorApplicationSyncStatus.supabaseAvailable === false &&
        creatorApplicationSyncStatus.supabaseCode === 'PGRST205' && (
          <div className="p-3 rounded-xl text-[11px] border bg-amber-950/40 border-amber-500/30 text-amber-200 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <strong>Centralized Server Queue Active:</strong> All ACOVON creator applications are persisted and synced here. To also enable direct Supabase table mirroring (<code>public.creator_applications</code>), run <code>supabase/schema.sql</code> in the Supabase SQL Editor.
            </div>
          </div>
        )}

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs font-medium border flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Header & Stats Card */}
      <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#d4af37]" />
              <span>Creator Applications Management</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Centralized review queue synced across all applicants. Approving an application automatically upgrades that exact account from Fan to Creator.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="px-2.5 py-1 rounded-lg bg-[#18181f] border border-[#272730] text-neutral-300">
              Total: <strong className="text-white">{countAll}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300">
              Pending: <strong className="text-amber-200">{countPending}</strong>
            </span>
            <button
              type="button"
              onClick={handleManualSync}
              disabled={creatorApplicationSyncStatus.isSyncing}
              className="px-3 py-1 rounded-lg bg-[#18181f] hover:bg-[#23232c] border border-[#2e2e3a] text-neutral-200 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#d4af37] ${creatorApplicationSyncStatus.isSyncing ? 'animate-spin' : ''}`}
              />
              <span>{creatorApplicationSyncStatus.isSyncing ? 'Syncing...' : 'Sync Applications'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[#232329] pb-4">
          {[
            { id: 'all', label: `All Applications (${countAll})` },
            { id: 'pending', label: `Pending (${countPending})` },
            { id: 'approved', label: `Approved (${countApproved})` },
            { id: 'rejected', label: `Rejected (${countRejected})` }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id as typeof activeTab);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#d4af37]/20 border-[#d4af37]/50 text-[#fce7b0]'
                  : 'bg-[#18181f] border-[#272730] text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, @username, email, application ID, status..."
              className="w-full bg-[#18181f] border border-[#272730] rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:border-[#d4af37]"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="info_requested">Info Requested</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="relative flex items-center">
            <Calendar className="w-3.5 h-3.5 text-neutral-500 absolute left-3 pointer-events-none" />
            <input
              type="date"
              value={dateFilter}
              onChange={e => {
                setDateFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Filter by submission date"
              className="w-full bg-[#18181f] border border-[#272730] rounded-xl pl-9 pr-8 py-2 text-white"
            />
            {dateFilter && (
              <button
                type="button"
                onClick={() => setDateFilter('')}
                title="Clear date filter"
                className="absolute right-2.5 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Applications List */}
        <div className="space-y-4">
          {paginatedApplications.length === 0 ? (
            <div className="text-center py-12 text-neutral-500 text-xs">
              No creator applications match your search or filter criteria.
            </div>
          ) : (
            paginatedApplications.map(v => {
              const { email, avatar } = resolveApplicantEmail(v);
              const isApproved = v.status === 'approved';
              const isRejected = v.status === 'rejected';
              const isPendingOrInfo = v.status === 'pending' || v.status === 'info_requested';

              return (
                <div
                  key={v.id}
                  className="p-4 sm:p-5 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col xl:flex-row xl:items-center justify-between gap-5 text-xs"
                >
                  {/* Applicant Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={v.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#2e2e38]"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#24242d] border border-[#2e2e38] flex items-center justify-center text-xs font-bold text-[#fce7b0] shrink-0">
                          {(v.name || 'C').slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-white text-sm flex items-center gap-2 flex-wrap">
                          <span>{v.name || 'Creator Applicant'}</span>
                          <span className="text-neutral-400 font-normal">(@{v.username || 'unknown'})</span>
                          <span
                            className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded border ${
                              isApproved
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                : isRejected
                                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                                : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                            }`}
                          >
                            {String(v.status || 'pending').replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-neutral-400 text-[11px] mt-0.5 break-all">
                          Email: <strong className="text-neutral-200">{email}</strong> · App ID:{' '}
                          <span className="font-mono text-neutral-300">{v.id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-[#121216] rounded-lg border border-[#232329] text-[11px]">
                      <div>
                        <span className="text-neutral-400">Category:</span>{' '}
                        <strong className="text-white">{v.applicationData?.category || 'General'}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400">Initial Tier Price:</span>{' '}
                        <strong className="text-[#fce7b0]">${v.applicationData?.monthlyTierPrice || 14.99}/mo</strong>
                      </div>
                      <div>
                        <span className="text-neutral-400">Document Type:</span>{' '}
                        <strong className="text-white capitalize">
                          {String(v.documentType || 'drivers_license').replace('_', ' ')}
                        </strong>
                      </div>
                      <div>
                        <span className="text-neutral-400">Document Number:</span>{' '}
                        <strong className="font-mono text-white">{v.documentNumber || 'N/A'}</strong>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-neutral-400">Submitted:</span>{' '}
                        <span className="text-neutral-300">{v.submittedAt}</span>
                      </div>
                    </div>

                    {v.applicationData?.bio && (
                      <div className="text-neutral-300 italic text-[11px] bg-[#15151a] p-2.5 rounded-lg border border-[#25252e]">
                        "{v.applicationData.bio}"
                      </div>
                    )}

                    {v.notes && (
                      <div className="text-[11px] text-neutral-400">
                        <strong>Audit Notes:</strong> {v.notes}
                      </div>
                    )}
                  </div>

                  {/* Document Thumbnails & Action Buttons */}
                  <div className="flex flex-col sm:flex-row xl:flex-col items-center gap-3 shrink-0">
                    <div className="flex items-center gap-2">
                      {(v.selfieUrl || avatar) ? (
                        <a href={v.selfieUrl || avatar} target="_blank" rel="noreferrer" title="View Facial Selfie">
                          <img
                            src={v.selfieUrl || avatar}
                            alt="Selfie"
                            className="w-14 h-14 rounded-lg object-cover border border-[#2e2e38] hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-[#121216] border border-[#2e2e38] flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
                          No Selfie
                        </div>
                      )}
                      {v.documentFileUrl ? (
                        <a href={v.documentFileUrl} target="_blank" rel="noreferrer" title="View Government ID Document">
                          <img
                            src={v.documentFileUrl}
                            alt="ID Doc"
                            className="w-20 h-14 rounded-lg object-cover border border-[#2e2e38] hover:opacity-90 transition-opacity"
                          />
                        </a>
                      ) : (
                        <div className="w-20 h-14 rounded-lg bg-[#121216] border border-[#2e2e38] flex items-center justify-center text-[10px] text-neutral-500 text-center px-1">
                          No ID Uploaded
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-center">
                      <button
                        type="button"
                        onClick={() => setReviewingApplication(v)}
                        className="px-3 py-2 bg-[#23232e] hover:bg-[#2c2c3a] text-neutral-100 font-semibold rounded-xl cursor-pointer text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review</span>
                      </button>

                      {isPendingOrInfo ? (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewNotesInput('');
                              setConfirmModal({ type: 'approve', verification: v });
                            }}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl cursor-pointer text-xs shadow-md transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setReviewNotesInput('');
                              setConfirmModal({ type: 'reject', verification: v });
                            }}
                            className="px-3.5 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-semibold rounded-xl cursor-pointer text-xs transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <div className="text-center font-mono text-[11px] text-neutral-400 py-1">
                          Reviewed by {v.reviewedByAdminName || 'Admin'} on {v.reviewedAt || 'N/A'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-[#232329] text-xs">
            <div className="text-neutral-400">
              Page {safeCurrentPage} of {totalPages} ({filteredApplications.length} matching applications)
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={safeCurrentPage === 1}
                className="px-3 py-1.5 rounded-lg bg-[#18181f] border border-[#272730] text-neutral-300 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={safeCurrentPage === totalPages}
                className="px-3 py-1.5 rounded-lg bg-[#18181f] border border-[#272730] text-neutral-300 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Application Decision Audit History */}
      {creatorApplicationAuditLogs.length > 0 && (
        <div className="bg-[#121216] border border-[#232329] rounded-2xl p-4 sm:p-6 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History className="w-4 h-4 text-[#d4af37]" />
            <span>Creator Application Decision Audit Log</span>
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {creatorApplicationAuditLogs.slice(0, 20).map(log => (
              <div
                key={log.id}
                className="p-3 bg-[#18181f] border border-[#272730] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div className="space-y-0.5">
                  <div className="text-white font-semibold">
                    {log.applicantName} ({log.applicantEmail}) —{' '}
                    <span className="uppercase font-mono text-[10px] text-[#fce7b0]">{log.action}</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    {log.previousStatus} → <strong className="text-neutral-200">{log.newStatus}</strong> · By{' '}
                    {log.adminName} ({log.adminRole})
                  </div>
                  {log.notes && <div className="text-[11px] text-neutral-500">{log.notes}</div>}
                </div>
                <div className="font-mono text-[11px] text-neutral-500 shrink-0">{log.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Review Inspection Modal */}
      {reviewingApplication && (() => {
        const { email, avatar, applicantAccount } = resolveApplicantEmail(reviewingApplication);
        const canDecide =
          reviewingApplication.status === 'pending' || reviewingApplication.status === 'info_requested';

        return (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#121216] border border-[#2e2e38] rounded-2xl max-w-2xl w-full p-6 space-y-5 text-xs shadow-2xl my-auto">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#232329]">
                <div className="flex items-center gap-3">
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={reviewingApplication.name}
                      className="w-12 h-12 rounded-full object-cover border border-[#2e2e38]"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-[#24242d] border border-[#2e2e38] flex items-center justify-center text-sm font-bold text-[#fce7b0] shrink-0">
                      {(reviewingApplication.name || 'C').slice(0, 2).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {reviewingApplication.name} (@{reviewingApplication.username})
                    </h3>
                    <div className="text-neutral-400">
                      {email} · App ID: <span className="font-mono">{reviewingApplication.id}</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewingApplication(null)}
                  className="text-neutral-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-[#18181f] border border-[#272730] rounded-xl">
                <div>
                  <span className="text-neutral-400">Current Account Role:</span>{' '}
                  <strong className="text-white uppercase">{applicantAccount?.role || 'fan'}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Application Status:</span>{' '}
                  <strong className="text-[#fce7b0] uppercase">{reviewingApplication.status.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Submitted At:</span>{' '}
                  <strong className="text-white">{reviewingApplication.submittedAt}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">Category:</span>{' '}
                  <strong className="text-white">{reviewingApplication.applicationData?.category || 'General'}</strong>
                </div>
                <div>
                  <span className="text-neutral-400">ID Type:</span>{' '}
                  <strong className="text-white capitalize">
                    {String(reviewingApplication.documentType || '').replace('_', ' ')}
                  </strong>
                </div>
                <div>
                  <span className="text-neutral-400">ID Number:</span>{' '}
                  <strong className="font-mono text-white">{reviewingApplication.documentNumber}</strong>
                </div>
                {reviewingApplication.applicationData?.dateOfBirth && (
                  <div>
                    <span className="text-neutral-400">Date of Birth:</span>{' '}
                    <strong className="text-white">{reviewingApplication.applicationData.dateOfBirth}</strong>
                  </div>
                )}
                {reviewingApplication.applicationData?.socialLinks && (
                  <div className="sm:col-span-2">
                    <span className="text-neutral-400">Social Links:</span>{' '}
                    <strong className="text-neutral-200">{reviewingApplication.applicationData.socialLinks}</strong>
                  </div>
                )}
                {reviewingApplication.applicationData?.bio && (
                  <div className="sm:col-span-2 pt-1 border-t border-[#232329]">
                    <span className="text-neutral-400 block mb-1">Creator Bio:</span>
                    <p className="text-neutral-200 italic">"{reviewingApplication.applicationData.bio}"</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#18181f] border border-[#272730] rounded-xl space-y-2 text-center">
                  <div className="text-neutral-300 font-semibold flex items-center justify-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Government ID Document</span>
                  </div>
                  {reviewingApplication.documentFileUrl ? (
                    <img
                      src={reviewingApplication.documentFileUrl}
                      alt="Government ID"
                      className="w-full h-36 object-cover rounded-lg border border-[#2e2e38]"
                    />
                  ) : (
                    <div className="w-full h-36 rounded-lg border border-dashed border-[#2e2e38] bg-[#121216] flex items-center justify-center text-neutral-500">
                      No ID uploaded yet
                    </div>
                  )}
                </div>
                <div className="p-3 bg-[#18181f] border border-[#272730] rounded-xl space-y-2 text-center">
                  <div className="text-neutral-300 font-semibold">Live Biometric Selfie</div>
                  {(reviewingApplication.selfieUrl || avatar) ? (
                    <img
                      src={reviewingApplication.selfieUrl || avatar}
                      alt="Applicant Selfie"
                      className="w-full h-36 object-cover rounded-lg border border-[#2e2e38]"
                    />
                  ) : (
                    <div className="w-full h-36 rounded-lg border border-dashed border-[#2e2e38] bg-[#121216] flex items-center justify-center text-neutral-500">
                      No selfie uploaded yet
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReviewingApplication(null)}
                  className="px-4 py-2 bg-[#1c1c24] hover:bg-[#25252f] text-neutral-300 font-semibold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                {canDecide && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewNotesInput('');
                        setConfirmModal({ type: 'info_requested', verification: reviewingApplication });
                      }}
                      className="px-4 py-2 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/40 text-amber-200 font-semibold rounded-xl cursor-pointer"
                    >
                      Request Info
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewNotesInput('');
                        setConfirmModal({ type: 'reject', verification: reviewingApplication });
                      }}
                      className="px-4 py-2 bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-200 font-semibold rounded-xl cursor-pointer"
                    >
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReviewNotesInput('');
                        setConfirmModal({ type: 'approve', verification: reviewingApplication });
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl cursor-pointer"
                    >
                      Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#121216] border border-[#2e2e38] rounded-2xl max-w-md w-full p-6 space-y-4 text-xs shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                {confirmModal.type === 'approve' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span>
                  {confirmModal.type === 'approve'
                    ? 'Approve Creator Application?'
                    : confirmModal.type === 'info_requested'
                    ? 'Request Additional Information?'
                    : 'Reject Creator Application?'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-neutral-300 leading-relaxed">
              {confirmModal.type === 'approve' ? (
                <>
                  Approve this Creator application? The applicant's existing account will be upgraded from Fan to Creator.
                  <span className="block mt-1 text-neutral-400">
                    Account: <strong className="text-white">@{confirmModal.verification.username}</strong> (
                    {resolveApplicantEmail(confirmModal.verification).email})
                  </span>
                </>
              ) : confirmModal.type === 'info_requested' ? (
                <>
                  Request additional verification details from{' '}
                  <strong className="text-white">@{confirmModal.verification.username}</strong>? Their account will remain a Fan while pending review.
                </>
              ) : (
                <>
                  Reject this Creator application? The applicant's account (
                  <strong className="text-white">@{confirmModal.verification.username}</strong>) will remain a Fan, and a notification will be sent explaining the decision.
                </>
              )}
            </p>

            <div className="space-y-1.5">
              <label className="block text-neutral-400 font-medium">Review Notes / Audit Reason</label>
              <input
                type="text"
                value={reviewNotesInput}
                onChange={e => setReviewNotesInput(e.target.value)}
                placeholder={
                  confirmModal.type === 'approve'
                    ? 'Biometric 18+ ID and facial selfie verified.'
                    : confirmModal.type === 'info_requested'
                    ? 'Please re-upload an unobstructed government ID.'
                    : 'Document expired or unverifiable.'
                }
                className="w-full bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-4 py-2 bg-[#1c1c24] hover:bg-[#25252f] text-neutral-300 font-semibold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingDecision}
                onClick={handleExecuteReview}
                className={`px-4 py-2 font-semibold text-white rounded-xl cursor-pointer shadow-md disabled:opacity-50 ${
                  confirmModal.type === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : confirmModal.type === 'info_requested'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isSubmittingDecision
                  ? 'Processing...'
                  : confirmModal.type === 'approve'
                  ? 'Confirm & Upgrade to Creator'
                  : confirmModal.type === 'info_requested'
                  ? 'Send Info Request'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
