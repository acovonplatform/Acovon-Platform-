import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { AcovonLogoIcon } from '../common/AcovonLogoIcon';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ArrowRight,
  Shield,
  FileText,
  DollarSign,
  UserCheck
} from 'lucide-react';
import { OFFICIAL_CATEGORIES, CategoryItem } from '../../data/officialCategories';

interface BecomeCreatorModalProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export const BecomeCreatorModal: React.FC<BecomeCreatorModalProps> = ({
  onClose,
  onSuccess
}) => {
  const { 
    currentUser, 
    applyToBecomeCreator, 
    userPendingVerification,
    verifications
  } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [displayName, setDisplayName] = useState(currentUser.name || '');
  const [category, setCategory] = useState('Amateur');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState('');
  const [monthlyTierPrice, setMonthlyTierPrice] = useState(14.99);

  // Verification step details
  const [legalName, setLegalName] = useState(currentUser.name || '');
  const [dateOfBirth, setDateOfBirth] = useState('2000-01-15');
  const [documentType, setDocumentType] = useState<'passport' | 'drivers_license' | 'national_id'>('drivers_license');
  const [documentNumber, setDocumentNumber] = useState('');
  const [docFileUrl, setDocFileUrl] = useState('');
  const [selfieUrl, setSelfieUrl] = useState(currentUser.avatar || '');
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedConfirmation, setSubmittedConfirmation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUploadVerificationImage = async (
    file: File,
    target: 'doc' | 'selfie'
  ) => {
    if (!file) return;
    if (target === 'doc') setUploadingDoc(true);
    else setUploadingSelfie(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        headers: {
          'Content-Type': file.type || 'application/octet-stream',
          'x-file-name': file.name,
          'x-mime-type': file.type || 'image/jpeg',
          'x-owner-id': currentUser.id
        },
        body: file
      });
      const data = await res.json();
      if (res.ok && data?.success && data.url) {
        if (target === 'doc') setDocFileUrl(data.url);
        else setSelfieUrl(data.url);
      } else {
        setErrorMessage(data?.error || 'Failed to upload verification image.');
      }
    } catch {
      setErrorMessage('Network error uploading verification image.');
    } finally {
      if (target === 'doc') setUploadingDoc(false);
      else setUploadingSelfie(false);
    }
  };

  // If already pending or rejected
  const isPending = !!userPendingVerification || submittedConfirmation;
  const cleanUserEmail = String(currentUser.email || '').trim().toLowerCase();
  const latestRejectedVerification = verifications.find(
    v =>
      v.status === 'rejected' &&
      (v.userId === currentUser.id || (cleanUserEmail && String(v.email || '').toLowerCase() === cleanUserEmail))
  );

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!displayName.trim()) {
      setErrorMessage('Please enter a creator display name.');
      return;
    }
    setStep(2);
  };

  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!documentNumber.trim()) {
      setErrorMessage('Please provide your ID document number.');
      return;
    }
    if (!ageConfirmed) {
      setErrorMessage('You must confirm you are at least 18 years of age.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('You must accept Acovon Creator Terms & Compliance standards.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await applyToBecomeCreator({
        displayName: displayName.trim(),
        category,
        bio: bio.trim() || 'Independent content creator on Acovon.',
        socialLinks: socialLinks.trim(),
        monthlyTierPrice: Number(monthlyTierPrice) || 14.99,
        dateOfBirth,
        documentType,
        documentNumber: documentNumber.trim(),
        documentFileUrl: docFileUrl,
        selfieUrl: selfieUrl,
        ageConfirmed: true,
        termsAccepted: true
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to submit application.');
      } else {
        setSubmittedConfirmation(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to submit application. Please retry.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-xl w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-7 space-y-5 sm:space-y-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 acovon-modal-panel">
        
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-4 border-b border-[#26262b]">
          <div className="flex items-center gap-3">
            <AcovonLogoIcon size="md" />
            <div>
              <h3 className="font-brand text-lg font-bold text-white flex items-center gap-2">
                <span>Become an Acovon Creator</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#d4af37]/15 text-[#fce7b0] border border-[#d4af37]/30">
                  18+ Verified
                </span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Upgrade your existing ACOVON account ({currentUser.email}) to unlock Creator Studio.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-[#1a1a20] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Linked Single-Account Identity Banner */}
        <div className="p-3 bg-[#16161b] border border-[#27272a] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <UserCheck className="w-4 h-4 text-[#d4af37] shrink-0" />
            <div>
              <span className="text-neutral-400">Linked ACOVON Account: </span>
              <span className="text-white font-semibold">{currentUser.name}</span>
              <span className="text-neutral-400"> (@{currentUser.username} · {currentUser.email})</span>
            </div>
          </div>
          <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-[#27272a] text-neutral-300">
            Single Login
          </span>
        </div>

        {/* Existing Pending Application / Submission Confirmed Banner */}
        {isPending ? (
          <div className="space-y-5">
            {submittedConfirmation && (
              <div className="p-3.5 bg-emerald-950/50 border border-emerald-500/40 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Application submitted and delivered to the ACOVON Admin Control Center queue for review.
                </span>
              </div>
            )}
            <div className="p-4 bg-[#18181c] border border-amber-500/30 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-5 h-5 animate-pulse" />
                <h4 className="font-bold text-sm text-white">Creator Application Pending Admin Review</h4>
              </div>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Your application for <strong>{userPendingVerification?.name || displayName || currentUser.name}</strong> was submitted on <strong>{userPendingVerification?.submittedAt || 'just now'}</strong> and is linked to your existing ACOVON account (<strong>{currentUser.email}</strong>).
              </p>
              <p className="text-xs text-neutral-400 leading-relaxed">
                While your application is pending review by an authorized ACOVON Administrator, your account remains a <strong>Fan</strong> account. Once approved by an Admin, Creator Studio, Go Live, and Create Post will activate automatically on this account without requiring a second registration or new email.
              </p>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 text-[11px] pt-1 text-neutral-400">
                <div>Document: <span className="text-white capitalize">{(userPendingVerification?.documentType || documentType).replace('_', ' ')}</span></div>
                <div>ID Ref: <span className="text-white font-mono">{userPendingVerification?.documentNumber || documentNumber}</span></div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#1a1a20] hover:bg-[#252530] text-neutral-200 text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          <div>
            {latestRejectedVerification && (
              <div className="mb-4 p-3.5 bg-rose-950/30 border border-rose-500/40 rounded-xl text-xs text-rose-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Previous Creator Application Not Approved</span>
                </div>
                <p className="text-[11px] text-rose-200/80">
                  {currentUser.creatorRejectionReason || latestRejectedVerification.notes || 'Your previous verification document could not be approved. Your account remains a Fan account. You may submit an updated application below.'}
                </p>
              </div>
            )}
            {/* Step Indicators */}
            <div className="flex items-center justify-between mb-6 px-2">
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 1 ? 'bg-[#d4af37] text-black' : 'bg-emerald-600 text-white'
                }`}>
                  {step > 1 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <span className={`text-xs font-medium ${step === 1 ? 'text-white' : 'text-neutral-400'}`}>
                  Creator Profile
                </span>
              </div>
              <div className="h-px bg-[#27272a] flex-1 mx-4" />
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === 2 ? 'bg-[#d4af37] text-black' : 'bg-[#1e1e24] text-neutral-400'
                }`}>
                  2
                </div>
                <span className={`text-xs font-medium ${step === 2 ? 'text-white' : 'text-neutral-400'}`}>
                  18+ Identity Audit
                </span>
              </div>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* STEP 1: Creator Profile & Monetization Details */}
            {step === 1 && (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Creator Public Display Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Your public creator display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Primary Official Category *</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      {OFFICIAL_CATEGORIES.map((cat: CategoryItem) => (
                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Base Monthly Subscription ($) *</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-neutral-400">$</span>
                      <input
                        type="number"
                        step="0.5"
                        min="4.99"
                        max="250"
                        value={monthlyTierPrice}
                        onChange={(e) => setMonthlyTierPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#18181c] border border-[#27272a] rounded-xl pl-7 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Creator Bio & Mission</label>
                  <textarea
                    rows={3}
                    placeholder="Tell your future subscribers what exclusive content, livestreams, and perks they can expect..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-neutral-300">Social Accounts (for verification review)</label>
                  <input
                    type="text"
                    placeholder="e.g. twitter.com/handle, instagram.com/handle"
                    value={socialLinks}
                    onChange={(e) => setSocialLinks(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-[#d4af37]/20"
                  >
                    <span>Proceed to 18+ Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: 18+ Age & Government ID Verification */}
            {step === 2 && (
              <form onSubmit={handleSubmitApplication} className="space-y-4">
                <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex items-start gap-2.5 text-xs text-neutral-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Compliance Standard:</span> Acovon enforces strict 18+ identification verification. Identification is audited by accredited verification officers before publishing or payout release.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Legal Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="As shown on official ID"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Date of Birth (Must be 18+) *</label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      max="2008-01-01"
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">ID Document Type *</label>
                    <select
                      value={documentType}
                      onChange={(e) => setDocumentType(e.target.value as any)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    >
                      <option value="drivers_license">Driver's License</option>
                      <option value="passport">Passport</option>
                      <option value="national_id">National ID Card</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-neutral-300">Document / License Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. DL-88492049"
                      value={documentNumber}
                      onChange={(e) => setDocumentNumber(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>

                {/* ID & Biometric Uploads */}
                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2 text-center">
                    <div className="text-[11px] font-semibold text-neutral-300 flex items-center justify-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>ID Document Image</span>
                    </div>
                    {docFileUrl ? (
                      <img
                        src={docFileUrl}
                        alt="ID Document"
                        className="w-full h-20 rounded-lg object-cover border border-[#27272a]"
                      />
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-[#121216] border border-dashed border-[#2f2f38] flex flex-col items-center justify-center text-[10px] text-neutral-500 gap-1">
                        <FileText className="w-5 h-5 text-neutral-600" />
                        <span>No ID uploaded yet</span>
                      </div>
                    )}
                    <label className="inline-flex items-center justify-center gap-1 text-[10px] text-[#fce7b0] hover:underline cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingDoc ? 'Uploading...' : docFileUrl ? 'Replace ID Photo' : 'Upload ID Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadVerificationImage(file, 'doc');
                        }}
                      />
                    </label>
                    {docFileUrl && (
                      <span className="text-[10px] text-emerald-400 font-mono block">Uploaded &amp; Encrypted</span>
                    )}
                  </div>

                  <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2 text-center">
                    <div className="text-[11px] font-semibold text-neutral-300 flex items-center justify-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>Facial Biometric Selfie</span>
                    </div>
                    {selfieUrl ? (
                      <img
                        src={selfieUrl}
                        alt="Facial Selfie"
                        className="w-full h-20 rounded-lg object-cover border border-[#27272a]"
                      />
                    ) : (
                      <div className="w-full h-20 rounded-lg bg-[#121216] border border-dashed border-[#2f2f38] flex flex-col items-center justify-center text-[10px] text-neutral-500 gap-1">
                        <Camera className="w-5 h-5 text-neutral-600" />
                        <span>No selfie uploaded yet</span>
                      </div>
                    )}
                    <label className="inline-flex items-center justify-center gap-1 text-[10px] text-[#fce7b0] hover:underline cursor-pointer">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingSelfie ? 'Uploading...' : selfieUrl ? 'Replace Selfie' : 'Upload Selfie'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadVerificationImage(file, 'selfie');
                        }}
                      />
                    </label>
                    {selfieUrl && (
                      <span className="text-[10px] text-emerald-400 font-mono block">Biometric Ready</span>
                    )}
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-2 pt-2 border-t border-[#26262b]">
                  <label className="flex items-start gap-2.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ageConfirmed}
                      onChange={(e) => setAgeConfirmed(e.target.checked)}
                      className="mt-0.5 rounded border-[#27272a] text-[#d4af37] focus:ring-0"
                    />
                    <span>
                      I certify that I am at least 18 years of age and the sole legal owner of this identification document.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-neutral-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-[#27272a] text-[#d4af37] focus:ring-0"
                    />
                    <span>
                      I accept the Acovon Creator Agreement, Privacy Policy, and 20% platform commission standard.
                    </span>
                  </label>
                </div>

                <div className="flex flex-wrap justify-between items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
                  >
                    Back to Profile
                  </button>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-xs text-neutral-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-[#d4af37]/20 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
