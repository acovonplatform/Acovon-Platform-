import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import {
  AnnouncementAudience,
  AnnouncementCategory,
  AnnouncementDisplayFormat,
  AnnouncementNotificationMode,
  AnnouncementPriority,
  AnnouncementStatus,
  PlatformAnnouncement
} from '../../types';
import {
  uploadUserFileToSupabase,
  deleteSupabaseFileByPath
} from '../../services/supabase';
import {
  Megaphone,
  Plus,
  Search,
  Eye,
  Edit3,
  Pause,
  Play,
  Archive,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Crown,
  Globe,
  Send,
  RefreshCw,
  Image as ImageIcon,
  Link2,
  ShieldAlert,
  FileText,
  Sparkles,
  X,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  CornerDownLeft,
  History,
  CheckCheck,
  Bell,
  Mail,
  BellOff,
  ExternalLink
} from 'lucide-react';

const ANNOUNCEMENT_CATEGORIES: AnnouncementCategory[] = [
  'General Update',
  'New Feature',
  'Important Notice',
  'Maintenance',
  'Payment Update',
  'Creator Update',
  'Fan Update',
  'Security Notice',
  'Policy Update',
  'Promotion',
  'Emergency Notice'
];

const INTERNAL_ROUTES = [
  { value: 'feed', label: 'Home / Feed (feed)' },
  { value: 'explore', label: 'Explore Creators (explore)' },
  { value: 'live', label: 'ACOVON Live Hub (live)' },
  { value: 'messages', label: 'Direct Messages (messages)' },
  { value: 'subscriptions', label: 'My Subscriptions (subscriptions)' },
  { value: 'creator-studio', label: 'Creator Studio (creator-studio)' },
  { value: 'wallet', label: 'ACOVON Wallet (wallet)' },
  { value: 'privacy', label: 'Privacy & Security Settings (privacy)' },
  { value: 'terms', label: 'Terms of Service (terms)' },
  { value: 'support', label: 'Help & Support Concierge (support)' }
];

const TIMEZONES = [
  'UTC',
  'America/New_York (EST/EDT)',
  'America/Los_Angeles (PST/PDT)',
  'Europe/London (GMT/BST)',
  'Europe/Zurich (CET/CEST)',
  'Asia/Tokyo (JST)'
];

export const sanitizeAnnouncementHtml = (html: string): string => {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
};

export const AdminAnnouncementManagementSection: React.FC = () => {
  const {
    announcements,
    announcementRecipients,
    users,
    creators,
    activeAdminPermissionLevel,
    canAdminPerformAnnouncementAction,
    adminCreateAnnouncement,
    adminUpdateAnnouncement,
    adminPublishAnnouncement,
    adminPauseResumeAnnouncement,
    adminArchiveAnnouncement,
    adminDeleteAnnouncement,
    adminRetryFailedAnnouncementNotifications,
    adminSimulateScheduledAndExpirySweep,
    auditLogs,
    currentUser
  } = useApp();

  // Feedback banner state
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [audienceFilter, setAudienceFilter] = useState<'all' | AnnouncementAudience>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | AnnouncementCategory>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | AnnouncementPriority>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AnnouncementStatus>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<PlatformAnnouncement | null>(null);
  const [inspectingAnnouncement, setInspectingAnnouncement] = useState<PlatformAnnouncement | null>(null);
  const [inspectTab, setInspectTab] = useState<'preview' | 'recipients' | 'versions' | 'audit'>('preview');

  // Editor Form State
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formBodyHtml, setFormBodyHtml] = useState('');
  const [formCategory, setFormCategory] = useState<AnnouncementCategory>('General Update');
  const [formPriority, setFormPriority] = useState<AnnouncementPriority>('normal');
  const [formAudience, setFormAudience] = useState<AnnouncementAudience>('everyone');
  const [formPublishMode, setFormPublishMode] = useState<'draft' | 'published' | 'scheduled'>('published');
  const [formDisplayFormats, setFormDisplayFormats] = useState<AnnouncementDisplayFormat[]>([
    'announcement_center',
    'dashboard_banner'
  ]);
  const [formRequiresAck, setFormRequiresAck] = useState(false);
  const [formIsMandatory, setFormIsMandatory] = useState(false);
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formImageFileName, setFormImageFileName] = useState('');
  const [formImageStoragePath, setFormImageStoragePath] = useState<string | null>(null);
  const [formImageSizeKb, setFormImageSizeKb] = useState<number | undefined>(undefined);
  const [imageUploadProgress, setImageUploadProgress] = useState<number | null>(null);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [formCtaEnabled, setFormCtaEnabled] = useState(false);
  const [formCtaLabel, setFormCtaLabel] = useState('');
  const [formCtaUrl, setFormCtaUrl] = useState('explore');
  const [formCtaOpenMode, setFormCtaOpenMode] = useState<'internal' | 'external'>('internal');
  const [formNotificationMode, setFormNotificationMode] = useState<AnnouncementNotificationMode>('in_app_only');
  const [formTimezone, setFormTimezone] = useState('UTC');
  const [formPublishAt, setFormPublishAt] = useState('2026-11-15 10:00:00');
  const [formExpiresAt, setFormExpiresAt] = useState('2026-12-31 23:59:00');
  const [formChangeSummary, setFormChangeSummary] = useState('');
  const [previewRoleMode, setPreviewRoleMode] = useState<'fan' | 'creator'>('fan');

  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Eligible active fan & creator counts for real recipient calculation
  const eligibleAccountCounts = useMemo(() => {
    const activeFans = Object.values(users).filter(
      u => u.role === 'fan' && (!u.accountStatus || u.accountStatus === 'active' || u.accountStatus === 'restricted')
    ).length;
    const activeCreators = creators.filter(
      c => !c.accountStatus || c.accountStatus === 'active' || c.accountStatus === 'restricted'
    ).length;
    return {
      fans: activeFans,
      creators: activeCreators,
      everyone: activeFans + activeCreators
    };
  }, [users, creators]);

  // Real-time computed dashboard metrics from actual state records
  const dashboardStats = useMemo(() => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const total = announcements.length;
    const published = announcements.filter(a => a.status === 'published').length;
    const draft = announcements.filter(a => a.status === 'draft').length;
    const scheduled = announcements.filter(a => a.status === 'scheduled').length;
    const expired = announcements.filter(
      a => a.status === 'expired' || (a.status === 'published' && a.expiresAt && a.expiresAt <= nowStr)
    ).length;
    const active = announcements.filter(
      a => a.status === 'published' && (!a.expiresAt || a.expiresAt > nowStr)
    ).length;

    const totalEligibleRecipients = announcementRecipients.length;
    const deliveredNotifications = announcementRecipients.filter(
      r => r.notificationStatus === 'delivered'
    ).length;
    const readAnnouncements = announcementRecipients.filter(r => Boolean(r.readAt)).length;
    const unreadAnnouncements = announcementRecipients.filter(r => !r.readAt).length;
    const acknowledgments = announcementRecipients.filter(r => Boolean(r.acknowledgedAt)).length;
    const deliveryFailures = announcementRecipients.filter(
      r => r.notificationStatus === 'failed'
    ).length;

    return {
      total,
      published,
      draft,
      scheduled,
      expired,
      active,
      totalEligibleRecipients,
      deliveredNotifications,
      readAnnouncements,
      unreadAnnouncements,
      acknowledgments,
      deliveryFailures
    };
  }, [announcements, announcementRecipients]);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements.filter(ann => {
      if (audienceFilter !== 'all' && ann.audience !== audienceFilter) return false;
      if (categoryFilter !== 'all' && ann.category !== categoryFilter) return false;
      if (priorityFilter !== 'all' && ann.priority !== priorityFilter) return false;
      if (statusFilter !== 'all' && ann.status !== statusFilter) return false;

      if (dateRangeFilter !== 'all') {
        const refDate = ann.publishedAt || ann.createdAt;
        if (dateRangeFilter === 'today' && !refDate.startsWith('2026-11-03')) return false;
        if (dateRangeFilter === '7d' && refDate < '2026-10-27') return false;
        if (dateRangeFilter === '30d' && refDate < '2026-10-04') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = ann.title.toLowerCase().includes(q);
        const matchSummary = ann.summary.toLowerCase().includes(q);
        const matchCat = ann.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSummary && !matchCat) return false;
      }

      return true;
    });
  }, [
    announcements,
    audienceFilter,
    categoryFilter,
    priorityFilter,
    statusFilter,
    dateRangeFilter,
    searchQuery
  ]);

  // Open Editor for New Announcement
  const handleOpenCreateModal = () => {
    const defaultCategory: AnnouncementCategory =
      activeAdminPermissionLevel === 'finance_admin' ? 'Payment Update' : 'General Update';
    const defaultMode: 'draft' | 'published' | 'scheduled' =
      activeAdminPermissionLevel === 'support_admin' ? 'draft' : 'published';

    const perm = canAdminPerformAnnouncementAction('create_draft', defaultCategory, 'draft');
    if (!perm.allowed) {
      showFeedback('error', perm.reason || 'Your admin role does not have permission to create announcements.');
      return;
    }

    setEditingAnnouncement(null);
    setFormTitle('');
    setFormSummary('');
    setFormBodyHtml('<p>Enter your official ACOVON platform announcement details here...</p>');
    setFormCategory(defaultCategory);
    setFormPriority('normal');
    setFormAudience('everyone');
    setFormPublishMode(defaultMode);
    setFormDisplayFormats(['announcement_center', 'dashboard_banner']);
    setFormRequiresAck(false);
    setFormIsMandatory(false);
    setFormImageUrl('');
    setFormImageFileName('');
    setFormImageSizeKb(undefined);
    setImageUploadProgress(null);
    setImageUploadError(null);
    setFormCtaEnabled(false);
    setFormCtaLabel('Learn More');
    setFormCtaUrl('explore');
    setFormCtaOpenMode('internal');
    setFormNotificationMode('in_app_only');
    setFormTimezone('UTC');
    setFormPublishAt('2026-11-15 10:00:00');
    setFormExpiresAt('2026-12-31 23:59:00');
    setFormChangeSummary('');
    setIsEditorOpen(true);
  };

  // Open Editor for Existing Announcement
  const handleOpenEditModal = (ann: PlatformAnnouncement) => {
    const perm = canAdminPerformAnnouncementAction('edit', ann.category, ann.status);
    if (!perm.allowed) {
      showFeedback('error', perm.reason || 'Permission denied to edit this announcement.');
      return;
    }

    setEditingAnnouncement(ann);
    setFormTitle(ann.title);
    setFormSummary(ann.summary);
    setFormBodyHtml(ann.bodyHtml);
    setFormCategory(ann.category);
    setFormPriority(ann.priority);
    setFormAudience(ann.audience);
    setFormPublishMode(
      ann.status === 'scheduled' ? 'scheduled' : ann.status === 'draft' ? 'draft' : 'published'
    );
    setFormDisplayFormats(ann.displayFormats);
    setFormRequiresAck(ann.requiresAcknowledgment);
    setFormIsMandatory(ann.isMandatoryNotice);
    setFormImageUrl(ann.imageUrl || '');
    setFormImageFileName(ann.imageFileName || '');
    setFormImageSizeKb(ann.imageFileSizeKb);
    setImageUploadProgress(null);
    setImageUploadError(null);
    setFormCtaEnabled(ann.cta.enabled);
    setFormCtaLabel(ann.cta.label || 'Learn More');
    setFormCtaUrl(ann.cta.destinationUrl || 'explore');
    setFormCtaOpenMode(ann.cta.openMode || 'internal');
    setFormNotificationMode(ann.notificationMode);
    setFormTimezone(ann.timezone || 'UTC');
    setFormPublishAt(ann.publishAt || '2026-11-15 10:00:00');
    setFormExpiresAt(ann.expiresAt || '');
    setFormChangeSummary('');
    setPreviewRoleMode(ann.audience === 'creators_only' ? 'creator' : 'fan');
    setIsEditorOpen(true);
  };

  // Rich-Text Formatting Toolbar Helper
  const insertRichTextTag = (prefix: string, suffix: string, sampleText: string) => {
    const el = bodyTextareaRef.current;
    if (!el) {
      setFormBodyHtml(prev => `${prev}${prefix}${sampleText}${suffix}`);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = formBodyHtml.substring(start, end) || sampleText;
    const nextText =
      formBodyHtml.substring(0, start) + prefix + selected + suffix + formBodyHtml.substring(end);
    setFormBodyHtml(nextText);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selected.length);
    }, 10);
  };

  // Image Upload Handler connected to Supabase Storage ("app-files")
  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError(null);
    const validMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['jpg', 'jpeg', 'png', 'webp'];

    if (!validMimeTypes.includes(file.type) && !validExts.includes(ext)) {
      setImageUploadError(
        `Unsupported file format "${file.name}". Only JPG, JPEG, PNG, and WEBP images are permitted.`
      );
      return;
    }

    const maxBytes = 8 * 1024 * 1024; // 8 MB max
    if (file.size > maxBytes) {
      setImageUploadError(
        `Image file is too large (${(file.size / (1024 * 1024)).toFixed(2)} MB). Maximum allowed size is 8.00 MB.`
      );
      return;
    }

    if (formImageStoragePath) {
      await deleteSupabaseFileByPath({ storagePath: formImageStoragePath, uid: currentUser.id });
      setFormImageStoragePath(null);
    }

    setImageUploadProgress(25);
    const uploadRes = await uploadUserFileToSupabase({
      uid: currentUser.id,
      file,
      featureName: 'announcements',
      itemId: editingAnnouncement?.id || `ann_${Date.now()}`,
      visibility: 'public',
      onProgress: (pct) => setImageUploadProgress(pct)
    });

    if (uploadRes.success && uploadRes.signedUrl) {
      setFormImageUrl(uploadRes.signedUrl);
      setFormImageFileName(file.name);
      setFormImageSizeKb(Math.max(1, Math.round(file.size / 1024)));
      setFormImageStoragePath(uploadRes.storagePath || null);
      setImageUploadProgress(100);
      setTimeout(() => setImageUploadProgress(null), 600);
    } else {
      setImageUploadProgress(null);
      setImageUploadError(uploadRes.error || 'Failed to upload image file.');
    }
  };

  const toggleDisplayFormat = (fmt: AnnouncementDisplayFormat) => {
    setFormDisplayFormats(prev =>
      prev.includes(fmt) ? prev.filter(f => f !== fmt) : [...prev, fmt]
    );
  };

  // Submit Create or Update Announcement
  const handleSaveAnnouncement = () => {
    const sanitizedHtml = sanitizeAnnouncementHtml(formBodyHtml);

    if (editingAnnouncement) {
      const res = adminUpdateAnnouncement(
        editingAnnouncement.id,
        {
          title: formTitle,
          summary: formSummary || formTitle,
          bodyHtml: sanitizedHtml,
          category: formCategory,
          priority: formPriority,
          audience: formAudience,
          status: formPublishMode,
          displayFormats: formDisplayFormats,
          requiresAcknowledgment: formRequiresAck,
          isMandatoryNotice: formIsMandatory,
          imageUrl: formImageUrl || undefined,
          imageFileName: formImageFileName || undefined,
          imageFileSizeKb: formImageSizeKb,
          cta: {
            enabled: formCtaEnabled,
            label: formCtaLabel,
            destinationUrl: formCtaUrl,
            openMode: formCtaOpenMode
          },
          notificationMode: formNotificationMode,
          timezone: formTimezone,
          publishAt: formPublishMode === 'scheduled' ? formPublishAt : editingAnnouncement.publishAt,
          expiresAt: formExpiresAt ? formExpiresAt : undefined
        },
        formChangeSummary || undefined
      );

      if (res.success) {
        setIsEditorOpen(false);
        showFeedback('success', `Announcement "${formTitle}" updated successfully.`);
      } else {
        showFeedback('error', res.error || 'Failed to update announcement.');
      }
    } else {
      const res = adminCreateAnnouncement({
        title: formTitle,
        summary: formSummary || formTitle,
        bodyHtml: sanitizedHtml,
        category: formCategory,
        priority: formPriority,
        audience: formAudience,
        status: formPublishMode,
        displayFormats: formDisplayFormats,
        requiresAcknowledgment: formRequiresAck,
        isMandatoryNotice: formIsMandatory,
        imageUrl: formImageUrl || undefined,
        imageFileName: formImageFileName || undefined,
        imageFileSizeKb: formImageSizeKb,
        cta: {
          enabled: formCtaEnabled,
          label: formCtaLabel,
          destinationUrl: formCtaUrl,
          openMode: formCtaOpenMode
        },
        notificationMode: formNotificationMode,
        timezone: formTimezone,
        publishAt: formPublishMode === 'scheduled' ? formPublishAt : undefined,
        expiresAt: formExpiresAt ? formExpiresAt : undefined
      });

      if (res.success) {
        setIsEditorOpen(false);
        showFeedback(
          'success',
          formPublishMode === 'published'
            ? `Announcement "${formTitle}" published and delivered to ${
                formAudience === 'fans_only'
                  ? 'Fans Only'
                  : formAudience === 'creators_only'
                  ? 'Creators Only'
                  : 'Everyone'
              }.`
            : formPublishMode === 'scheduled'
            ? `Announcement "${formTitle}" scheduled for ${formPublishAt} (${formTimezone}).`
            : `Announcement "${formTitle}" saved as Draft.`
        );
      } else {
        showFeedback('error', res.error || 'Failed to create announcement.');
      }
    }
  };

  const renderAudienceBadge = (audience: AnnouncementAudience) => {
    if (audience === 'fans_only') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-sky-950/70 text-sky-300 border border-sky-500/40">
          <Users className="w-3 h-3 text-sky-400" />
          <span>Fans Only</span>
        </span>
      );
    }
    if (audience === 'creators_only') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#241e12] text-[#fce7b0] border border-[#d4af37]/50">
          <Crown className="w-3 h-3 text-[#d4af37]" />
          <span>Creators Only</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
        <Globe className="w-3 h-3 text-emerald-400" />
        <span>Everyone</span>
      </span>
    );
  };

  const renderPriorityBadge = (priority: AnnouncementPriority) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-rose-950/80 text-rose-300 border border-rose-500/50">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          Urgent
        </span>
      );
    }
    if (priority === 'important') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-950/80 text-amber-300 border border-amber-500/50">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Important
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-[#1d1d24] text-neutral-300 border border-[#2e2e38]">
        Normal
      </span>
    );
  };

  const renderStatusBadge = (status: AnnouncementStatus) => {
    switch (status) {
      case 'published':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-950/70 text-emerald-300 border border-emerald-500/40">
            Published
          </span>
        );
      case 'scheduled':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-sky-950/70 text-sky-300 border border-sky-500/40">
            Scheduled
          </span>
        );
      case 'draft':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-800 text-neutral-300 border border-neutral-700">
            Draft
          </span>
        );
      case 'paused':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/70 text-amber-300 border border-amber-500/40">
            Paused
          </span>
        );
      case 'expired':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-900 text-neutral-400 border border-neutral-800">
            Expired
          </span>
        );
      case 'archived':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-purple-950/60 text-purple-300 border border-purple-500/30">
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  // Announcement Audit Logs
  const announcementAuditLogs = useMemo(
    () => auditLogs.filter(l => l.category === 'announcement_management'),
    [auditLogs]
  );

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="bg-[#121216] border border-[#26262f] rounded-2xl p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#d4af37]/15 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-brand text-white">
                  Announcement Management &amp; Platform Communications
                </h2>
                <p className="text-xs text-neutral-400">
                  Create, target, schedule, and audit official platform communications with strict Audience Isolation (Fans Only, Creators Only, Everyone).
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                const res = adminSimulateScheduledAndExpirySweep();
                showFeedback(
                  'success',
                  `Lifecycle check completed: ${res.publishedCount} scheduled announcement(s) published, ${res.expiredCount} announcement(s) marked expired.`
                );
              }}
              className="px-3.5 py-2 bg-[#1b1b22] hover:bg-[#23232c] border border-[#2e2e38] rounded-xl text-xs font-medium text-neutral-200 flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Run scheduled publication & expiration check now"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Sync Schedule &amp; Expiry</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-lg shadow-[#d4af37]/10"
            >
              <Plus className="w-4 h-4" />
              <span>Create Announcement</span>
            </button>
          </div>
        </div>

        {/* Active Role Permission Matrix Banner */}
        <div className="mt-4 pt-4 border-t border-[#22222a] flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <div className="flex items-center gap-2 text-neutral-300">
            <ShieldAlert className="w-4 h-4 text-[#d4af37] shrink-0" />
            <span>
              Active Role Policy (<strong className="text-[#fce7b0] uppercase font-mono">{activeAdminPermissionLevel}</strong>):
            </span>
            <span className="text-neutral-400">
              {activeAdminPermissionLevel === 'super_admin' &&
                'Full authority: Create, Edit, Publish, Schedule, Pause, Archive, Delete, and Retry Notifications.'}
              {activeAdminPermissionLevel === 'admin' &&
                'General Admin authority: Create, Edit, Schedule, Publish, Pause, and Archive announcements.'}
              {activeAdminPermissionLevel === 'finance_admin' &&
                'Finance Admin authority: View all announcements; Create, Edit, and Publish "Payment Update" notices.'}
              {activeAdminPermissionLevel === 'support_admin' &&
                'Support Admin authority: View announcements and Create/Edit Drafts (cannot publish directly).'}
              {activeAdminPermissionLevel === 'moderator' &&
                'Moderator authority: Read-only inspection of platform announcements and recipient logs.'}
            </span>
          </div>
          <div className="flex items-center gap-3 text-neutral-400 font-mono">
            <span>Eligible Fans: <strong className="text-sky-300">{eligibleAccountCounts.fans}</strong></span>
            <span>•</span>
            <span>Eligible Creators: <strong className="text-[#fce7b0]">{eligibleAccountCounts.creators}</strong></span>
            <span>•</span>
            <span>Everyone: <strong className="text-emerald-300">{eligibleAccountCounts.everyone}</strong></span>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-neutral-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 12 Real-Time Computed Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Announcements', value: dashboardStats.total, accent: 'text-white' },
          { label: 'Published', value: dashboardStats.published, accent: 'text-emerald-400' },
          { label: 'Active Now', value: dashboardStats.active, accent: 'text-[#fce7b0]' },
          { label: 'Drafts', value: dashboardStats.draft, accent: 'text-neutral-300' },
          { label: 'Scheduled', value: dashboardStats.scheduled, accent: 'text-sky-400' },
          { label: 'Expired', value: dashboardStats.expired, accent: 'text-neutral-400' },
          { label: 'Eligible Recipients', value: dashboardStats.totalEligibleRecipients, accent: 'text-white' },
          { label: 'Delivered Notifs', value: dashboardStats.deliveredNotifications, accent: 'text-emerald-400' },
          { label: 'Read Count', value: dashboardStats.readAnnouncements, accent: 'text-[#fce7b0]' },
          { label: 'Unread Count', value: dashboardStats.unreadAnnouncements, accent: 'text-amber-300' },
          { label: 'Acknowledgments', value: dashboardStats.acknowledgments, accent: 'text-sky-300' },
          { label: 'Delivery Failures', value: dashboardStats.deliveryFailures, accent: dashboardStats.deliveryFailures > 0 ? 'text-rose-400' : 'text-neutral-400' }
        ].map((stat, idx) => (
          <div
            key={idx}
            className="bg-[#121216] border border-[#23232c] rounded-xl p-3.5 flex flex-col justify-between"
          >
            <span className="text-[11px] text-neutral-400">{stat.label}</span>
            <span className={`text-xl font-bold font-mono mt-1 ${stat.accent}`}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-[#121216] border border-[#26262f] rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search title, summary, or category..."
              className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl pl-8 pr-3 py-2 text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Audience Filter */}
          <div>
            <select
              value={audienceFilter}
              onChange={e => setAudienceFilter(e.target.value as typeof audienceFilter)}
              className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
            >
              <option value="all">All Audiences</option>
              <option value="fans_only">Fans Only</option>
              <option value="creators_only">Creators Only</option>
              <option value="everyone">Everyone (Fans &amp; Creators)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as typeof categoryFilter)}
              className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
            >
              <option value="all">All Categories (11)</option>
              {ANNOUNCEMENT_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as typeof priorityFilter)}
              className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="important">Important</option>
              <option value="normal">Normal</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
              className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#1e1e26] text-[11px] text-neutral-400">
          <div className="flex items-center gap-2">
            <span>Date Range:</span>
            {(['all', 'today', '7d', '30d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRangeFilter(range)}
                className={`px-2.5 py-1 rounded-lg cursor-pointer transition-colors ${
                  dateRangeFilter === range
                    ? 'bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40 font-semibold'
                    : 'bg-[#18181f] text-neutral-400 hover:text-white'
                }`}
              >
                {range === 'all'
                  ? 'All Time'
                  : range === 'today'
                  ? 'Today'
                  : range === '7d'
                  ? 'Last 7 Days'
                  : 'Last 30 Days'}
              </button>
            ))}
          </div>
          <span>
            Showing <strong className="text-white">{filteredAnnouncements.length}</strong> of{' '}
            {announcements.length} announcements
          </span>
        </div>
      </div>

      {/* Announcement Management Table */}
      <div className="bg-[#121216] border border-[#26262f] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#24242d] bg-[#16161c] text-[11px] font-mono uppercase text-neutral-400">
                <th className="py-3.5 px-4">Title &amp; Display Surfaces</th>
                <th className="py-3.5 px-3">Audience</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Priority</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Published Date</th>
                <th className="py-3.5 px-3">Expires Date</th>
                <th className="py-3.5 px-3">Reads &amp; Acks</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f27]">
              {filteredAnnouncements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-neutral-500">
                    No announcements match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredAnnouncements.map(ann => {
                  const recs = announcementRecipients.filter(r => r.announcementId === ann.id);
                  const readCount = recs.filter(r => Boolean(r.readAt)).length;
                  const ackCount = recs.filter(r => Boolean(r.acknowledgedAt)).length;
                  const failedCount = recs.filter(r => r.notificationStatus === 'failed').length;

                  return (
                    <tr key={ann.id} className="hover:bg-[#16161d] transition-colors">
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-semibold text-white line-clamp-1">{ann.title}</div>
                        <div className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">
                          {ann.summary}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          {ann.displayFormats.map(fmt => (
                            <span
                              key={fmt}
                              className="px-1.5 py-0.5 rounded bg-[#1d1d26] text-[10px] text-neutral-300 font-mono"
                            >
                              {fmt === 'announcement_center'
                                ? 'Center'
                                : fmt === 'dashboard_banner'
                                ? 'Banner'
                                : fmt === 'important_popup'
                                ? 'Popup'
                                : 'Persistent'}
                            </span>
                          ))}
                          {ann.requiresAcknowledgment && (
                            <span className="px-1.5 py-0.5 rounded bg-[#d4af37]/15 text-[#fce7b0] text-[10px] font-mono">
                              Ack Required
                            </span>
                          )}
                          {ann.versionCount > 1 && (
                            <span className="px-1.5 py-0.5 rounded bg-sky-950/60 text-sky-300 text-[10px] font-mono">
                              v{ann.versionCount}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderAudienceBadge(ann.audience)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="text-neutral-200 font-medium">{ann.category}</span>
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderPriorityBadge(ann.priority)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {renderStatusBadge(ann.status)}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-300">
                        {ann.publishedAt || ann.publishAt || '—'}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-400">
                        {ann.expiresAt || 'No expiry'}
                      </td>

                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="text-[11px] font-mono text-white">
                          {readCount} / {recs.length} read
                        </div>
                        {ann.requiresAcknowledgment && (
                          <div className="text-[10px] font-mono text-[#fce7b0]">
                            {ackCount} acknowledged
                          </div>
                        )}
                        {failedCount > 0 && (
                          <div className="text-[10px] font-mono text-rose-400">
                            {failedCount} failed delivery
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setInspectingAnnouncement(ann);
                              setInspectTab('preview');
                            }}
                            className="p-1.5 bg-[#1d1d26] hover:bg-[#272732] text-neutral-200 rounded-lg cursor-pointer"
                            title="View Details, Recipients & Version History"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleOpenEditModal(ann)}
                            className="p-1.5 bg-[#1d1d26] hover:bg-[#272732] text-neutral-200 rounded-lg cursor-pointer"
                            title="Edit Announcement"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {(ann.status === 'draft' || ann.status === 'scheduled') && (
                            <button
                              onClick={() => {
                                const res = adminPublishAnnouncement(ann.id);
                                if (res.success) {
                                  showFeedback('success', `Published "${ann.title}" immediately.`);
                                } else {
                                  showFeedback('error', res.error || 'Permission denied.');
                                }
                              }}
                              className="p-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 rounded-lg cursor-pointer"
                              title="Publish Now"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {ann.status === 'published' && (
                            <button
                              onClick={() => {
                                const res = adminPauseResumeAnnouncement(ann.id, 'paused');
                                if (res.success) {
                                  showFeedback('success', `Paused "${ann.title}".`);
                                } else {
                                  showFeedback('error', res.error || 'Permission denied.');
                                }
                              }}
                              className="p-1.5 bg-amber-950/70 hover:bg-amber-900/80 text-amber-300 border border-amber-500/30 rounded-lg cursor-pointer"
                              title="Pause Announcement"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {ann.status === 'paused' && (
                            <button
                              onClick={() => {
                                const res = adminPauseResumeAnnouncement(ann.id, 'published');
                                if (res.success) {
                                  showFeedback('success', `Resumed "${ann.title}".`);
                                } else {
                                  showFeedback('error', res.error || 'Permission denied.');
                                }
                              }}
                              className="p-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/30 rounded-lg cursor-pointer"
                              title="Resume Announcement"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {ann.status !== 'archived' && (
                            <button
                              onClick={() => {
                                const res = adminArchiveAnnouncement(ann.id);
                                if (res.success) {
                                  showFeedback('success', `Archived "${ann.title}".`);
                                } else {
                                  showFeedback('error', res.error || 'Permission denied.');
                                }
                              }}
                              className="p-1.5 bg-[#1d1d26] hover:bg-[#272732] text-neutral-300 rounded-lg cursor-pointer"
                              title="Archive Announcement"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => {
                              const res = adminDeleteAnnouncement(ann.id);
                              if (res.success) {
                                showFeedback('success', res.message || 'Deleted announcement.');
                              } else {
                                showFeedback('error', res.error || 'Permission denied.');
                              }
                            }}
                            className="p-1.5 bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 border border-rose-500/30 rounded-lg cursor-pointer"
                            title="Delete Announcement"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================================================================
          CREATE / EDIT ANNOUNCEMENT MODAL WITH LIVE AUDIENCE PREVIEW
      ====================================================================== */}
      {isEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#2d2d38] rounded-2xl max-w-6xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#25252f] flex items-center justify-between bg-[#15151b]">
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-5 h-5 text-[#d4af37]" />
                <h3 className="text-base font-bold text-white">
                  {editingAnnouncement ? `Edit Announcement: ${editingAnnouncement.title}` : 'Create Official Platform Announcement'}
                </h3>
              </div>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: 2-Column Split (Editor Form + Live Audience Preview) */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
              {/* Left 7 Columns: Configuration & Rich Editor */}
              <div className="lg:col-span-7 space-y-5">
                {/* 1. REQUIRED AUDIENCE SELECTOR */}
                <div className="bg-[#17171f] border border-[#2b2b36] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <span>1. Target Audience Selection (Required)</span>
                      <span className="text-[#d4af37]">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-neutral-400">
                      Strict Role Isolation Enforced
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      {
                        id: 'fans_only' as AnnouncementAudience,
                        title: 'Fans Only',
                        desc: `Exclusively visible to Fan accounts (${eligibleAccountCounts.fans} fans). Creators never see this.`,
                        icon: Users,
                        activeClass: 'border-sky-500 bg-sky-950/40 text-sky-200'
                      },
                      {
                        id: 'creators_only' as AnnouncementAudience,
                        title: 'Creators Only',
                        desc: `Exclusively visible to Creator accounts (${eligibleAccountCounts.creators} creators). Fans never see this.`,
                        icon: Crown,
                        activeClass: 'border-[#d4af37] bg-[#241e12] text-[#fce7b0]'
                      },
                      {
                        id: 'everyone' as AnnouncementAudience,
                        title: 'Everyone',
                        desc: `Visible to both Fans & Creators (${eligibleAccountCounts.everyone} total accounts).`,
                        icon: Globe,
                        activeClass: 'border-emerald-500 bg-emerald-950/40 text-emerald-200'
                      }
                    ].map(opt => {
                      const Icon = opt.icon;
                      const isSelected = formAudience === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setFormAudience(opt.id);
                            if (opt.id === 'fans_only') setPreviewRoleMode('fan');
                            if (opt.id === 'creators_only') setPreviewRoleMode('creator');
                          }}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? opt.activeClass
                              : 'border-[#272732] bg-[#131318] text-neutral-300 hover:border-neutral-600'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5" />
                              {opt.title}
                            </span>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <p className="text-[10px] opacity-80 mt-1.5 leading-relaxed">{opt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. TITLE, SUMMARY, CATEGORY & PRIORITY */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Announcement Title <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="e.g. Creator Studio 4.6: Instant Payout Rails & Replay Analytics"
                      className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div>
                    <label className="block text-neutral-300 font-medium mb-1">
                      Short Summary / Banner &amp; Notification Preview Text <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formSummary}
                      onChange={e => setFormSummary(e.target.value)}
                      placeholder="Concise 1-sentence summary shown in dashboard banners and notifications..."
                      className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Category</label>
                      <select
                        value={formCategory}
                        onChange={e => setFormCategory(e.target.value as AnnouncementCategory)}
                        className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                      >
                        {ANNOUNCEMENT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-300 font-medium mb-1">Priority Level</label>
                      <select
                        value={formPriority}
                        onChange={e => setFormPriority(e.target.value as AnnouncementPriority)}
                        className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                      >
                        <option value="normal">Normal — Standard Update</option>
                        <option value="important">Important — Highlighted Notice</option>
                        <option value="urgent">Urgent — High-Visibility Alert</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 3. RICH-TEXT ANNOUNCEMENT BODY EDITOR */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-neutral-300 font-medium">
                      Full Announcement Body (Rich Text / HTML) <span className="text-rose-400">*</span>
                    </label>
                    <span className="text-[10px] text-neutral-500">
                      Supports paragraphs, headings, bold, italic, lists, links &amp; line breaks
                    </span>
                  </div>

                  {/* Formatting Toolbar */}
                  <div className="flex flex-wrap items-center gap-1 p-1.5 bg-[#181820] border border-[#2b2b36] rounded-t-xl">
                    <button
                      type="button"
                      onClick={() => insertRichTextTag('<p>', '</p>', 'Paragraph text')}
                      className="px-2 py-1 rounded hover:bg-[#252530] text-neutral-300 text-[11px] font-mono cursor-pointer"
                      title="Insert Paragraph"
                    >
                      ¶ Paragraph
                    </button>
                    <button
                      type="button"
                      onClick={() => insertRichTextTag('<h4>', '</h4>', 'Section Heading')}
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Heading"
                    >
                      <Heading2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertRichTextTag('<strong>', '</strong>', 'bold text')}
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertRichTextTag('<em>', '</em>', 'italic text')}
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertRichTextTag('<ul>\n  <li>', '</li>\n</ul>', 'Bullet list item')
                      }
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Bullet List"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertRichTextTag('<ol>\n  <li>', '</li>\n</ol>', 'Numbered list item')
                      }
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Numbered List"
                    >
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        insertRichTextTag('<a href="https://acovon.com">', '</a>', 'Link label')
                      }
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Insert Link"
                    >
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertRichTextTag('<br/>', '', '')}
                      className="p-1.5 rounded hover:bg-[#252530] text-neutral-300 cursor-pointer"
                      title="Line Break"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <textarea
                    ref={bodyTextareaRef}
                    rows={6}
                    value={formBodyHtml}
                    onChange={e => setFormBodyHtml(e.target.value)}
                    className="w-full bg-[#14141a] border border-t-0 border-[#2b2b36] rounded-b-xl p-3.5 text-white font-mono text-xs leading-relaxed focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                {/* 4. DISPLAY FORMATS & ACKNOWLEDGMENT OPTIONS */}
                <div className="bg-[#17171f] border border-[#2b2b36] rounded-xl p-4 space-y-3">
                  <label className="font-bold text-white uppercase tracking-wider text-[11px] block">
                    4. Display Surfaces &amp; Acknowledgment Rules
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      {
                        id: 'announcement_center' as AnnouncementDisplayFormat,
                        label: 'Announcement Center',
                        desc: 'Shown in the user Updates & Notifications drawer.'
                      },
                      {
                        id: 'dashboard_banner' as AnnouncementDisplayFormat,
                        label: 'Dashboard Announcement Banner',
                        desc: 'Top banner in Fan Feed or Creator Studio.'
                      },
                      {
                        id: 'important_popup' as AnnouncementDisplayFormat,
                        label: 'Important Announcement Popup',
                        desc: 'Modal dialog shown once until acknowledged.'
                      },
                      {
                        id: 'persistent_notice' as AnnouncementDisplayFormat,
                        label: 'Persistent Important Notice',
                        desc: 'Stays pinned until user explicitly acknowledges.'
                      }
                    ].map(fmt => {
                      const checked = formDisplayFormats.includes(fmt.id);
                      return (
                        <label
                          key={fmt.id}
                          className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer ${
                            checked
                              ? 'bg-[#20202b] border-[#d4af37]/50 text-white'
                              : 'bg-[#131318] border-[#252530] text-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleDisplayFormat(fmt.id)}
                            className="mt-0.5 accent-[#d4af37]"
                          />
                          <div>
                            <div className="font-semibold text-xs">{fmt.label}</div>
                            <div className="text-[10px] text-neutral-400">{fmt.desc}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t border-[#252530] flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                      <input
                        type="checkbox"
                        checked={formRequiresAck}
                        onChange={e => setFormRequiresAck(e.target.checked)}
                        className="accent-[#d4af37]"
                      />
                      <span>Require Explicit User Acknowledgment ("I Understand / Acknowledge")</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-neutral-200">
                      <input
                        type="checkbox"
                        checked={formIsMandatory}
                        onChange={e => setFormIsMandatory(e.target.checked)}
                        className="accent-[#d4af37]"
                      />
                      <span>Mandatory Security / Policy Notice (Preserve Compliance Audit)</span>
                    </label>
                  </div>
                </div>

                {/* 5. OPTIONAL IMAGE UPLOAD (JPG, JPEG, PNG, WEBP) */}
                <div className="bg-[#17171f] border border-[#2b2b36] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-[#d4af37]" />
                      <span>5. Optional Announcement Banner Image (JPG, JPEG, PNG, WEBP)</span>
                    </label>
                    {formImageUrl && (
                      <button
                        type="button"
                        onClick={async () => {
                          if (formImageStoragePath) {
                            await deleteSupabaseFileByPath({
                              storagePath: formImageStoragePath,
                              uid: currentUser.id
                            });
                            setFormImageStoragePath(null);
                          }
                          setFormImageUrl('');
                          setFormImageFileName('');
                          setFormImageSizeKb(undefined);
                        }}
                        className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-[#24242f] hover:bg-[#2d2d3b] border border-[#383846] rounded-xl text-white font-medium cursor-pointer"
                    >
                      {formImageUrl ? 'Replace Image File...' : 'Upload Image File...'}
                    </button>
                    <input
                      type="text"
                      value={formImageUrl}
                      onChange={e => {
                        setFormImageUrl(e.target.value);
                        setFormImageFileName('custom_banner_image.webp');
                      }}
                      placeholder="Or paste image URL (https://...)"
                      className="flex-1 bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-1.5 text-white"
                    />
                  </div>

                  {imageUploadProgress !== null && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono text-[#fce7b0]">
                        <span>Optimizing &amp; validating announcement image...</span>
                        <span>{imageUploadProgress}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#111115] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#d4af37] transition-all"
                          style={{ width: `${imageUploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {imageUploadError && (
                    <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-500/40 text-rose-200 text-[11px]">
                      {imageUploadError}
                    </div>
                  )}

                  {formImageFileName && (
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Attached: <strong className="text-neutral-200">{formImageFileName}</strong>
                      {formImageSizeKb ? ` (${formImageSizeKb} KB)` : ''}
                    </div>
                  )}
                </div>

                {/* 6. OPTIONAL CALL-TO-ACTION (CTA) BUTTON */}
                <div className="bg-[#17171f] border border-[#2b2b36] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formCtaEnabled}
                        onChange={e => setFormCtaEnabled(e.target.checked)}
                        className="accent-[#d4af37]"
                      />
                      <span>6. Include Call-To-Action (CTA) Button</span>
                    </label>
                  </div>

                  {formCtaEnabled && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-neutral-400 mb-1">Button Label</label>
                        <input
                          type="text"
                          value={formCtaLabel}
                          onChange={e => setFormCtaLabel(e.target.value)}
                          placeholder="e.g. Open Creator Studio"
                          className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Open Mode</label>
                        <select
                          value={formCtaOpenMode}
                          onChange={e => {
                            const mode = e.target.value as 'internal' | 'external';
                            setFormCtaOpenMode(mode);
                            if (mode === 'internal' && formCtaUrl.startsWith('http')) {
                              setFormCtaUrl('explore');
                            } else if (mode === 'external' && !formCtaUrl.startsWith('http')) {
                              setFormCtaUrl('https://acovon.com/updates');
                            }
                          }}
                          className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                        >
                          <option value="internal">Internal Platform Page</option>
                          <option value="external">External Link (New Tab)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-neutral-400 mb-1">Destination Route / URL</label>
                        {formCtaOpenMode === 'internal' ? (
                          <select
                            value={formCtaUrl}
                            onChange={e => setFormCtaUrl(e.target.value)}
                            className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                          >
                            {INTERNAL_ROUTES.map(r => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formCtaUrl}
                            onChange={e => setFormCtaUrl(e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white font-mono"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. PUBLICATION, SCHEDULING, EXPIRATION & NOTIFICATION MODE */}
                <div className="bg-[#17171f] border border-[#2b2b36] rounded-xl p-4 space-y-3">
                  <label className="font-bold text-white uppercase tracking-wider text-[11px] block">
                    7. Publication Timing, Expiration &amp; Notification Delivery
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {[
                      { id: 'published' as const, label: 'Publish Immediately', icon: Send },
                      { id: 'scheduled' as const, label: 'Schedule for Later', icon: Clock },
                      { id: 'draft' as const, label: 'Save as Draft', icon: FileText }
                    ].map(m => {
                      const Icon = m.icon;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setFormPublishMode(m.id)}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 font-semibold cursor-pointer ${
                            formPublishMode === m.id
                              ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0]'
                              : 'bg-[#131318] border-[#272732] text-neutral-400'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{m.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {formPublishMode === 'scheduled' && (
                      <div>
                        <label className="block text-neutral-400 mb-1">Scheduled Publish Date/Time</label>
                        <input
                          type="text"
                          value={formPublishAt}
                          onChange={e => setFormPublishAt(e.target.value)}
                          placeholder="YYYY-MM-DD HH:mm:ss"
                          className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white font-mono"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-neutral-400 mb-1">Timezone</label>
                      <select
                        value={formTimezone}
                        onChange={e => setFormTimezone(e.target.value)}
                        className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                      >
                        {TIMEZONES.map(tz => (
                          <option key={tz} value={tz}>
                            {tz}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-neutral-400 mb-1">Expiration Date/Time (Optional)</label>
                      <input
                        type="text"
                        value={formExpiresAt}
                        onChange={e => setFormExpiresAt(e.target.value)}
                        placeholder="YYYY-MM-DD HH:mm:ss"
                        className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#252530]">
                    <label className="block text-neutral-300 font-medium mb-2">
                      Notification Dispatch Mode (Sent only to targeted audience; no duplicate resends on edit)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'in_app_only' as AnnouncementNotificationMode,
                          label: 'In-App Notification Only',
                          icon: Bell
                        },
                        {
                          id: 'in_app_and_email' as AnnouncementNotificationMode,
                          label: 'In-App + Email Dispatch',
                          icon: Mail
                        },
                        {
                          id: 'silent_display' as AnnouncementNotificationMode,
                          label: 'Silent Display (No Alert)',
                          icon: BellOff
                        }
                      ].map(nm => {
                        const Icon = nm.icon;
                        return (
                          <button
                            key={nm.id}
                            type="button"
                            onClick={() => setFormNotificationMode(nm.id)}
                            className={`p-2.5 rounded-xl border flex items-center gap-2 text-left cursor-pointer ${
                              formNotificationMode === nm.id
                                ? 'bg-[#20202b] border-[#d4af37]/50 text-white font-semibold'
                                : 'bg-[#131318] border-[#252530] text-neutral-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                            <span className="text-[11px]">{nm.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {editingAnnouncement && (
                    <div className="pt-2">
                      <label className="block text-neutral-300 mb-1">
                        Version History Change Note (Recorded in Audit &amp; Version History)
                      </label>
                      <input
                        type="text"
                        value={formChangeSummary}
                        onChange={e => setFormChangeSummary(e.target.value)}
                        placeholder="Describe what was updated in this revision..."
                        className="w-full bg-[#131318] border border-[#2b2b36] rounded-xl px-3 py-2 text-white"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Right 5 Columns: Live Role-Isolated Preview */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-[#16161d] border border-[#2b2b36] rounded-2xl p-4 space-y-4 sticky top-0">
                  <div className="flex items-center justify-between border-b border-[#252530] pb-3">
                    <div>
                      <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                        Live Audience Isolation Simulator
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Verify exactly how Fans vs. Creators experience this announcement
                      </p>
                    </div>
                    <div className="flex items-center gap-1 bg-[#111116] p-1 rounded-xl border border-[#262630]">
                      <button
                        type="button"
                        onClick={() => setPreviewRoleMode('fan')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          previewRoleMode === 'fan'
                            ? 'bg-sky-500 text-black'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Fan View
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewRoleMode('creator')}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                          previewRoleMode === 'creator'
                            ? 'bg-[#d4af37] text-black'
                            : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        Creator View
                      </button>
                    </div>
                  </div>

                  {/* Role Eligibility Check in Preview */}
                  {((previewRoleMode === 'fan' && formAudience === 'creators_only') ||
                    (previewRoleMode === 'creator' && formAudience === 'fans_only')) ? (
                    <div className="p-6 rounded-xl bg-[#121217] border border-dashed border-rose-500/40 text-center space-y-2">
                      <ShieldAlert className="w-8 h-8 text-rose-400 mx-auto" />
                      <div className="text-sm font-bold text-white">
                        Strictly Hidden from {previewRoleMode === 'fan' ? 'Fan Accounts' : 'Creator Accounts'}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        Because the audience is set to{' '}
                        <strong className="text-white">
                          {formAudience === 'creators_only' ? 'Creators Only' : 'Fans Only'}
                        </strong>
                        , backend and client queries completely block this announcement from appearing in{' '}
                        {previewRoleMode === 'fan' ? 'Fan Feeds, Fan Notifications, or direct URLs' : 'Creator Studio, Creator Notifications, or direct URLs'}.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Preview Card */}
                      <div className="rounded-2xl bg-[#111115] border border-[#d4af37]/40 overflow-hidden shadow-xl">
                        {formImageUrl && (
                          <div className="h-36 w-full overflow-hidden bg-black relative">
                            <img
                              src={formImageUrl}
                              alt="Announcement preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {renderAudienceBadge(formAudience)}
                              <span className="px-2 py-0.5 rounded bg-[#1d1d26] text-[10px] text-neutral-300 font-mono">
                                {formCategory}
                              </span>
                            </div>
                            {renderPriorityBadge(formPriority)}
                          </div>

                          <h5 className="text-sm font-bold text-white leading-snug">
                            {formTitle || 'Untitled Platform Announcement'}
                          </h5>

                          <div
                            className="text-xs text-neutral-300 space-y-2 leading-relaxed prose prose-invert max-w-none"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeAnnouncementHtml(formBodyHtml)
                            }}
                          />

                          <div className="pt-3 border-t border-[#22222a] flex flex-wrap items-center justify-between gap-2">
                            {formCtaEnabled && formCtaLabel && (
                              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#d4af37] text-black font-bold text-xs">
                                <span>{formCtaLabel}</span>
                                <ExternalLink className="w-3 h-3" />
                              </span>
                            )}
                            {formRequiresAck && (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1e1e28] border border-[#d4af37]/40 text-[#fce7b0] text-[11px] font-semibold">
                                <CheckCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                                <span>Acknowledge Notice</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-[#131319] border border-[#24242f] text-[11px] text-neutral-400 space-y-1">
                        <div>
                          • Active Display Formats:{' '}
                          <strong className="text-neutral-200">
                            {formDisplayFormats.join(', ') || 'None selected'}
                          </strong>
                        </div>
                        <div>
                          • Notification Dispatch:{' '}
                          <strong className="text-neutral-200">{formNotificationMode}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-[#25252f] bg-[#15151b] flex items-center justify-between gap-3">
              <div className="text-xs text-neutral-400">
                Target Audience:{' '}
                <strong className="text-white">
                  {formAudience === 'fans_only'
                    ? `Fans Only (${eligibleAccountCounts.fans} fans)`
                    : formAudience === 'creators_only'
                    ? `Creators Only (${eligibleAccountCounts.creators} creators)`
                    : `Everyone (${eligibleAccountCounts.everyone} accounts)`}
                </strong>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 bg-[#20202a] hover:bg-[#292935] text-neutral-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveAnnouncement}
                  className="px-5 py-2 bg-[#d4af37] hover:bg-[#e5c158] text-black font-bold rounded-xl text-xs cursor-pointer shadow-lg shadow-[#d4af37]/15"
                >
                  {editingAnnouncement
                    ? 'Save Announcement Changes'
                    : formPublishMode === 'published'
                    ? 'Publish Announcement Now'
                    : formPublishMode === 'scheduled'
                    ? 'Schedule Announcement'
                    : 'Save Announcement Draft'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          INSPECTOR MODAL: PREVIEW, RECIPIENT DELIVERY LOGS & VERSION HISTORY
      ====================================================================== */}
      {inspectingAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#121216] border border-[#2d2d38] rounded-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden shadow-2xl text-xs">
            <div className="px-6 py-4 border-b border-[#25252f] flex items-center justify-between bg-[#15151b]">
              <div className="flex items-center gap-2.5">
                {renderAudienceBadge(inspectingAnnouncement.audience)}
                <h3 className="text-sm font-bold text-white truncate max-w-md">
                  {inspectingAnnouncement.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingAnnouncement(null)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tabs */}
            <div className="px-6 pt-3 border-b border-[#24242e] bg-[#14141a] flex items-center gap-2">
              {[
                { id: 'preview' as const, label: 'Formatted Announcement View', icon: Eye },
                {
                  id: 'recipients' as const,
                  label: `Recipient Delivery & Read Logs (${
                    announcementRecipients.filter(r => r.announcementId === inspectingAnnouncement.id).length
                  })`,
                  icon: Users
                },
                {
                  id: 'versions' as const,
                  label: `Version History (v${inspectingAnnouncement.versionCount})`,
                  icon: History
                },
                {
                  id: 'audit' as const,
                  label: 'Admin Audit Trail',
                  icon: FileText
                }
              ].map(t => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    onClick={() => setInspectTab(t.id)}
                    className={`px-3.5 py-2.5 border-b-2 font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
                      inspectTab === t.id
                        ? 'border-[#d4af37] text-[#fce7b0]'
                        : 'border-transparent text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {inspectTab === 'preview' && (
                <div className="space-y-4">
                  {inspectingAnnouncement.imageUrl && (
                    <img
                      src={inspectingAnnouncement.imageUrl}
                      alt={inspectingAnnouncement.title}
                      className="w-full max-h-60 object-cover rounded-xl border border-[#2b2b36]"
                    />
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    {renderAudienceBadge(inspectingAnnouncement.audience)}
                    {renderPriorityBadge(inspectingAnnouncement.priority)}
                    {renderStatusBadge(inspectingAnnouncement.status)}
                    <span className="px-2 py-0.5 rounded bg-[#1d1d26] text-neutral-300 font-mono text-[11px]">
                      {inspectingAnnouncement.category}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">{inspectingAnnouncement.title}</h4>
                  <p className="text-neutral-400 italic">{inspectingAnnouncement.summary}</p>
                  <div
                    className="p-4 rounded-xl bg-[#16161d] border border-[#262630] text-neutral-200 space-y-2 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: sanitizeAnnouncementHtml(inspectingAnnouncement.bodyHtml)
                    }}
                  />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] font-mono bg-[#16161d] p-3.5 rounded-xl border border-[#25252f]">
                    <div>
                      <span className="text-neutral-500 block">Created By</span>
                      <span className="text-white">{inspectingAnnouncement.createdByAdminName}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Published At</span>
                      <span className="text-white">{inspectingAnnouncement.publishedAt || 'Not published'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Expires At</span>
                      <span className="text-white">{inspectingAnnouncement.expiresAt || 'Never'}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500 block">Notification Mode</span>
                      <span className="text-white">{inspectingAnnouncement.notificationMode}</span>
                    </div>
                  </div>
                </div>
              )}

              {inspectTab === 'recipients' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400">
                      Showing individual delivery, read, and acknowledgment records for{' '}
                      <strong className="text-white">{inspectingAnnouncement.title}</strong>
                    </span>
                    {announcementRecipients.some(
                      r =>
                        r.announcementId === inspectingAnnouncement.id &&
                        r.notificationStatus === 'failed'
                    ) && (
                      <button
                        onClick={() => {
                          const res = adminRetryFailedAnnouncementNotifications(inspectingAnnouncement.id);
                          if (res.success) {
                            showFeedback('success', `Retried and delivered ${res.retriedCount} failed notification(s).`);
                          } else {
                            showFeedback('error', res.error || 'Retry failed.');
                          }
                        }}
                        className="px-3 py-1.5 bg-[#d4af37] text-black font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retry Failed Deliveries</span>
                      </button>
                    )}
                  </div>

                  <div className="border border-[#262630] rounded-xl overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#17171f] border-b border-[#262630] text-[10px] font-mono uppercase text-neutral-400">
                          <th className="py-2.5 px-3">Recipient</th>
                          <th className="py-2.5 px-3">Account Role</th>
                          <th className="py-2.5 px-3">Delivery Status</th>
                          <th className="py-2.5 px-3">Read Timestamp</th>
                          <th className="py-2.5 px-3">Acknowledged Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1f1f27]">
                        {announcementRecipients
                          .filter(r => r.announcementId === inspectingAnnouncement.id)
                          .map(r => (
                            <tr key={r.id}>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-white">{r.userName}</div>
                                <div className="text-[10px] text-neutral-500">@{r.userUsername}</div>
                              </td>
                              <td className="py-2.5 px-3 uppercase font-mono text-[10px]">
                                <span
                                  className={
                                    r.userRole === 'creator' ? 'text-[#fce7b0]' : 'text-sky-300'
                                  }
                                >
                                  {r.userRole}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                                    r.notificationStatus === 'delivered'
                                      ? 'bg-emerald-950/70 text-emerald-300'
                                      : r.notificationStatus === 'failed'
                                      ? 'bg-rose-950/70 text-rose-300'
                                      : 'bg-neutral-800 text-neutral-400'
                                  }`}
                                >
                                  {r.notificationStatus}
                                </span>
                                {r.errorDetails && (
                                  <div className="text-[10px] text-rose-400 mt-0.5">
                                    {r.errorDetails}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px]">
                                {r.readAt ? (
                                  <span className="text-emerald-300">{r.readAt}</span>
                                ) : (
                                  <span className="text-neutral-500">Unread</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-[11px]">
                                {r.acknowledgedAt ? (
                                  <span className="text-[#fce7b0]">{r.acknowledgedAt}</span>
                                ) : (
                                  <span className="text-neutral-500">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {inspectTab === 'versions' && (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-[#16161d] border border-[#262630] flex items-center justify-between">
                    <div>
                      <span className="text-white font-semibold">
                        Current Active Version: v{inspectingAnnouncement.versionCount}
                      </span>
                      <p className="text-[11px] text-neutral-400">
                        Last updated {inspectingAnnouncement.updatedAt} by{' '}
                        {inspectingAnnouncement.updatedByAdminName} ({inspectingAnnouncement.updatedByAdminRole})
                      </p>
                    </div>
                  </div>

                  {inspectingAnnouncement.versionHistory.length === 0 ? (
                    <div className="py-8 text-center text-neutral-500">
                      No post-publication edits recorded yet.
                    </div>
                  ) : (
                    inspectingAnnouncement.versionHistory.map(vh => (
                      <div
                        key={vh.id}
                        className="p-3.5 rounded-xl bg-[#15151c] border border-[#252530] space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#fce7b0]">
                            Version v{vh.versionNumber} Snapshot
                          </span>
                          <span className="font-mono text-[11px] text-neutral-400">{vh.editedAt}</span>
                        </div>
                        <div className="text-neutral-200 font-medium">{vh.changeSummary}</div>
                        <div className="text-[11px] text-neutral-400">
                          Edited by {vh.editedByAdminName} ({vh.editedByAdminRole}) • Previous Title: "{vh.snapshotTitle}" • Audience: {vh.snapshotAudience}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {inspectTab === 'audit' && (
                <div className="space-y-2.5">
                  {announcementAuditLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3 rounded-xl bg-[#16161d] border border-[#252530] flex items-start justify-between gap-3"
                    >
                      <div>
                        <div className="font-semibold text-white">{log.action}</div>
                        <div className="text-[11px] text-neutral-300 mt-0.5">{log.details}</div>
                        <div className="text-[10px] text-neutral-500 mt-1">
                          Admin: {log.adminName} ({log.adminRole}) • Target: {log.targetLabel}
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-neutral-400 shrink-0">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
