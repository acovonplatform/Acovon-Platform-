import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Post } from '../../types';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Send, 
  Lock, 
  Globe, 
  Users, 
  Ticket, 
  MessageSquare, 
  ShieldAlert, 
  UserX, 
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

interface ShareModalProps {
  post: Post;
  onClose: () => void;
  onNavigateToMessages?: (recipientId: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  post,
  onClose,
  onNavigateToMessages
}) => {
  const { 
    creators, 
    currentUser, 
    isAuthenticated,
    requireAuth,
    forwardPostInMessage, 
    submitPostRecommendationFeedback
  } = useApp();

  const [copied, setCopied] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    creators.find(c => c.id !== post.creatorId && c.id !== currentUser.id)?.id || 'creator_marcus'
  );
  const [personalNote, setPersonalNote] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportReason, setReportReason] = useState('copyright');
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const postUrl = `${window.location.origin}/#post_${post.id}`;
  const firstMedia = post.media && post.media.length > 0 ? post.media[0] : null;
  const mediaThumb = firstMedia?.thumbnailUrl || firstMedia?.url || '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `ACOVON: ${post.creatorName}'s Post`,
          text: `Check out ${post.creatorName}'s exclusive post on ACOVON:\n"${post.content.slice(0, 100)}..."`,
          url: postUrl
        });
      } catch (err) {
        console.log('Share canceled', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleForwardInACOVON = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth('forward posts via ACOVON messaging')) return;
    if (!selectedRecipientId) return;

    setSendingMessage(true);
    const result = forwardPostInMessage(post.id, selectedRecipientId, personalNote);
    setSendingMessage(false);

    if (result.success) {
      setMessageSent(true);
      setTimeout(() => {
        setMessageSent(false);
        if (onNavigateToMessages) {
          onNavigateToMessages(selectedRecipientId);
        }
        onClose();
      }, 1200);
    }
  };

  const handleSocialShare = (platform: 'whatsapp' | 'twitter' | 'telegram' | 'reddit' | 'email') => {
    const text = encodeURIComponent(`Watch this on ACOVON by ${post.creatorName}: "${post.content.slice(0, 80)}..."`);
    const encodedUrl = encodeURIComponent(postUrl);

    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${text}&url=${encodedUrl}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodedUrl}&text=${text}`;
        break;
      case 'reddit':
        url = `https://reddit.com/submit?url=${encodedUrl}&title=${text}`;
        break;
      case 'email':
        url = `mailto:?subject=${encodeURIComponent(`ACOVON Post by ${post.creatorName}`)}&body=${text}%0A%0A${encodedUrl}`;
        break;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requireAuth('report this post')) return;
    submitPostRecommendationFeedback(post.id, 'report_content', reportReason);
    setReportSubmitted(true);
    setTimeout(() => {
      setShowReport(false);
      setReportSubmitted(false);
    }, 1500);
  };

  // Contacts / other creators for forwarding
  const candidateRecipients = creators.filter(c => !isAuthenticated || c.id !== currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto acovon-modal-panel">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#26262b] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Share2 className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand font-bold text-base text-white truncate">Share Video / Post</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#18181c] hover:bg-[#22222a] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {/* Post Card Preview */}
          <div className="p-4 sm:p-5 border-b border-[#26262b] bg-[#16161b]">
          <div className="flex items-center gap-3">
            {mediaThumb ? (
              <img 
                src={mediaThumb} 
                alt="Post preview" 
                className="w-16 h-16 rounded-xl object-cover border border-[#27272a] shrink-0" 
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-[#222] border border-[#27272a] flex items-center justify-center text-neutral-500 shrink-0">
                <Share2 className="w-6 h-6" />
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white truncate">{post.creatorName}</span>
                <span className="text-[10px] text-neutral-400 font-mono">@{post.creatorUsername}</span>
              </div>
              <p className="text-[11px] text-neutral-300 line-clamp-2">
                {post.content || 'Exclusive media drop on Acovon.'}
              </p>
              
              {/* Protection Badge */}
              <div className="flex items-center gap-1.5 pt-0.5">
                {post.visibility === 'pay_per_view' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-600/30 px-2 py-0.2 rounded-full">
                    <Ticket className="w-2.5 h-2.5" />
                    PPV Vault (${post.ppvPrice?.toFixed(2) || '9.99'})
                  </span>
                )}
                {post.visibility === 'subscribers' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#fce7b0] bg-[#d4af37]/15 border border-[#d4af37]/30 px-2 py-0.2 rounded-full">
                    <Users className="w-2.5 h-2.5" />
                    Subscribers-Only
                  </span>
                )}
                {post.visibility === 'public' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-neutral-400 bg-neutral-900 border border-neutral-700 px-2 py-0.2 rounded-full">
                    <Globe className="w-2.5 h-2.5" />
                    Public Post
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Access Control Notice */}
          <div className="mt-3 p-2 bg-[#101014] rounded-lg border border-[#222228] text-[10px] text-neutral-400 flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
            <span>
              Original access rights are strictly enforced. Protected pay-per-view or subscriber-exclusive media cannot be viewed without verified entitlement.
            </span>
          </div>
        </div>

        {/* Share Actions */}
        <div className="p-4 sm:p-5 space-y-4">
          
          {/* Quick Copy Link & Native Share */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={handleCopyLink}
              className={`p-3 rounded-2xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copied 
                  ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300' 
                  : 'bg-[#18181c] border-[#27272a] text-white hover:border-[#d4af37]/50 hover:bg-[#202028]'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-[#d4af37]" />}
              <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
            </button>

            <button
              onClick={handleNativeShare}
              className="p-3 bg-[#18181c] hover:bg-[#202028] border border-[#27272a] hover:border-[#d4af37]/50 text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#d4af37]" />
              <span>Device Share</span>
            </button>
          </div>

          {/* Forward inside ACOVON Direct Messages */}
          <div className="p-3.5 bg-[#16161b] rounded-2xl border border-[#27272a] space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Forward via ACOVON Message</span>
            </label>

            {!isAuthenticated ? (
              <div className="flex items-center justify-between gap-3 p-2.5 bg-[#121215] border border-[#27272a] rounded-xl">
                <span className="text-xs text-neutral-400">
                  Log in or sign up to forward posts via direct message.
                </span>
                <button
                  type="button"
                  onClick={() => requireAuth('forward posts via ACOVON messaging')}
                  className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-lg shrink-0 cursor-pointer"
                >
                  Log In
                </button>
              </div>
            ) : messageSent ? (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-center text-xs text-emerald-300 font-medium animate-in fade-in">
                ✓ Post forwarded into private chat!
              </div>
            ) : (
              <form onSubmit={handleForwardInACOVON} className="space-y-2.5">
                <select
                  value={selectedRecipientId}
                  onChange={(e) => setSelectedRecipientId(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                >
                  {candidateRecipients.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} (@{r.username})
                    </option>
                  ))}
                </select>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Optional message to recipient..."
                    value={personalNote}
                    onChange={(e) => setPersonalNote(e.target.value)}
                    className="w-full bg-[#121215] border border-[#27272a] rounded-xl pl-3 pr-20 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage}
                    className="absolute right-1 top-1 bottom-1 px-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* External Social Networks */}
          <div className="space-y-2">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Share to External Platforms
            </label>
            <div className="grid grid-cols-3 xs:grid-cols-5 gap-2 text-center">
              {[
                { id: 'whatsapp', label: 'WhatsApp', color: 'hover:border-emerald-500/50 hover:text-emerald-400' },
                { id: 'twitter', label: 'X (Twitter)', color: 'hover:border-sky-500/50 hover:text-sky-400' },
                { id: 'telegram', label: 'Telegram', color: 'hover:border-blue-500/50 hover:text-blue-400' },
                { id: 'reddit', label: 'Reddit', color: 'hover:border-orange-500/50 hover:text-orange-400' },
                { id: 'email', label: 'Email', color: 'hover:border-yellow-500/50 hover:text-yellow-400' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => handleSocialShare(p.id as any)}
                  className={`p-2.5 bg-[#18181c] border border-[#27272a] rounded-xl text-[11px] font-medium text-neutral-300 transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${p.color}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate w-full text-[10px]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Safety: Report Content / Block Creator */}
          <div className="pt-2 border-t border-[#26262b] flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-500">
            <button
              onClick={() => {
                if (requireAuth('report this post')) setShowReport(true);
              }}
              className="hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Report post</span>
            </button>
            <button
              onClick={() => {
                if (!requireAuth('mute or hide creators from your feed')) return;
                submitPostRecommendationFeedback(post.id, 'hide_creator');
                onClose();
              }}
              className="hover:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <UserX className="w-3.5 h-3.5" />
              <span>Hide creator posts</span>
            </button>
          </div>

          {/* Embedded Report Form */}
          {showReport && (
            <form onSubmit={handleSubmitReport} className="p-3.5 bg-red-950/20 border border-red-500/30 rounded-2xl space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                  Submit Content Report
                </span>
                <button 
                  type="button" 
                  onClick={() => setShowReport(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {reportSubmitted ? (
                <div className="text-xs text-emerald-300 font-medium">
                  Report submitted. Trust &amp; Safety team has flagged this post for audit.
                </div>
              ) : (
                <>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    <option value="copyright">Copyright Infringement</option>
                    <option value="guidelines">Community Guidelines Violation</option>
                    <option value="spam">Commercial Spam / Scam</option>
                    <option value="other">Other Concern</option>
                  </select>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-lg"
                    >
                      Confirm Report
                    </button>
                  </div>
                </>
              )}
            </form>
          )}

        </div>
        </div>

      </div>
    </div>
  );
};
