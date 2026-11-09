import React, { useState, useRef, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ChatAttachmentItem, CustomVideoRequest, ChatMessage } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { TranslateContentButton } from '../common/TranslateContentButton';
import {
  uploadUserFileToSupabase,
  deleteSupabaseFileByPath
} from '../../services/supabase';
import {
  Send,
  Coins,
  Lock,
  Unlock,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  CheckCheck,
  Sparkles,
  Paperclip,
  CheckCircle2,
  Archive,
  DollarSign,
  Search,
  ChevronLeft,
  X,
  Check,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneMissed,
  Clapperboard,
  Clock,
  Upload,
  Eye,
  AlertCircle,
  MoreVertical,
  Flag,
  ShieldAlert,
  Play,
  Plus,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface ChatViewProps {
  initialRecipientId?: string;
}

type InboxFilterTab =
  | 'all'
  | 'unread'
  | 'video_calls'
  | 'custom_requests'
  | 'paid_media'
  | 'pending_requests'
  | 'archived';

interface StagedAttachment {
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'document';
  fileSizeFormatted: string;
  url: string;
  thumbnailUrl?: string;
  description: string;
  isPaid: boolean;
  price: string;
  uploadProgress: number;
  uploadError?: string;
  storagePath?: string;
  supabaseFileId?: string;
}

const DEMO_QUICK_MEDIA = [
  {
    fileName: 'Paris_Atelier_Fitting_Lookbook.jpg',
    fileType: 'image' as const,
    fileSizeFormatted: '2.8 MB',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=50'
  },
  {
    fileName: 'Backstage_Runway_Rehearsal_4K.mp4',
    fileType: 'video' as const,
    fileSizeFormatted: '16.4 MB',
    url: '/videos/sample1.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=500&q=60'
  },
  {
    fileName: 'VIP_Styling_Lookbook_Notes.jpg',
    fileType: 'image' as const,
    fileSizeFormatted: '3.1 MB',
    url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85',
    thumbnailUrl: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=50'
  },
  {
    fileName: 'Studio_Soundcheck_Session_Clip.mp4',
    fileType: 'video' as const,
    fileSizeFormatted: '14.9 MB',
    url: '/videos/sample2.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=500&q=60'
  }
];

export const ChatView: React.FC<ChatViewProps> = ({ initialRecipientId = 'creator_elena' }) => {
  const {
    currentUser,
    activeRole,
    isCurrentUserApprovedCreator,
    creators,
    messages,
    customRequests,
    videoCallSession,
    sendMessage,
    unlockPaidMessage,
    markThreadAsRead,
    tipCreator,
    initiateVideoCall,
    acceptIncomingCall,
    rejectCall,
    createCustomVideoRequest,
    updateCustomRequestStatus
  } = useApp();

  const isCreatorRole = isCurrentUserApprovedCreator || currentUser.role === 'creator' || activeRole === 'creator';

  const [activeTab, setActiveTab] = useState<InboxFilterTab>('all');
  const [selectedRecipientId, setSelectedRecipientId] = useState(initialRecipientId);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Existing Paid Text Message state (preserved)
  const [isLockedMessageMode, setIsLockedMessageMode] = useState(false);
  const [lockPrice, setLockPrice] = useState<string>('15.00');

  // Multiple Media Attachment Sending Panel state
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [stagedAttachments, setStagedAttachments] = useState<StagedAttachment[]>([]);
  const [pricingMode, setPricingMode] = useState<'individual' | 'bundle'>('individual');
  const [bundleIsPaid, setBundleIsPaid] = useState<boolean>(true);
  const [bundlePrice, setBundlePrice] = useState<string>('25.00');

  // Video Call Pre-Confirmation Modal state
  const [showCallConfirmModal, setShowCallConfirmModal] = useState(false);
  const [callSpendingLimit, setCallSpendingLimit] = useState<number>(45);
  const [callError, setCallError] = useState<string | null>(null);

  // Fan New Custom Video Request Modal inside Inbox
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [reqTitle, setReqTitle] = useState('');
  const [reqInstructions, setReqInstructions] = useState('');
  const [reqRecipientName, setReqRecipientName] = useState(currentUser.name);
  const [reqDuration, setReqDuration] = useState<number>(3);
  const [reqBudget, setReqBudget] = useState<string>('150.00');
  const [reqDeadline, setReqDeadline] = useState<string>(
    new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reqError, setReqError] = useState<string | null>(null);

  // Creator Approve / Decline / Deliver Custom Request Modals inside Inbox
  const [approvingRequest, setApprovingRequest] = useState<CustomVideoRequest | null>(null);
  const [approvePrice, setApprovePrice] = useState<string>('');
  const [approveDeadline, setApproveDeadline] = useState<string>('');

  const [decliningRequest, setDecliningRequest] = useState<CustomVideoRequest | null>(null);
  const [declineReason, setDeclineReason] = useState<string>('');

  const [deliveringRequest, setDeliveringRequest] = useState<CustomVideoRequest | null>(null);
  const [deliveryVideoUrl, setDeliveryVideoUrl] = useState<string>('');
  const [deliveryVideoFileName, setDeliveryVideoFileName] = useState<string>('');
  const [deliveryVideoFileSize, setDeliveryVideoFileSize] = useState<string>('');
  const [deliveryStoragePath, setDeliveryStoragePath] = useState<string | undefined>(undefined);
  const [deliverySupabaseFileId, setDeliverySupabaseFileId] = useState<string | undefined>(undefined);
  const [isUploadingDeliveryVideo, setIsUploadingDeliveryVideo] = useState<boolean>(false);
  const [deliveryUploadError, setDeliveryUploadError] = useState<string | null>(null);
  const [deliveryNotes, setDeliveryNotes] = useState<string>('');

  // Tip Modal state
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState<string>('20');

  // Fullscreen Media Lightbox for unlocked items
  const [lightboxMedia, setLightboxMedia] = useState<{
    url: string;
    type: 'image' | 'video' | 'document';
    title?: string;
  } | null>(null);

  // Options menu & status feedback
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const deliveryVideoInputRef = useRef<HTMLInputElement | null>(null);

  const triggerToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(null), 3500);
  };

  // Message requests mock (preserved & connected to Pending Requests filter)
  const [messageRequests, setMessageRequests] = useState([
    {
      id: 'req_dm_1',
      senderName: 'Derrick West',
      handle: '@dwest_fan',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      preview: 'Hello Elena, would love to commission a special private video styling consultation for our anniversary.',
      offeredFee: 50.00,
      time: '2h ago'
    },
    {
      id: 'req_dm_2',
      senderName: 'Sienna Miller',
      handle: '@sienna_m',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      preview: 'Hi! Can I ask about your VIP membership perks before joining your circle?',
      offeredFee: 15.00,
      time: '5h ago'
    }
  ]);

  const recipientCreator = creators.find(c => c.id === selectedRecipientId) || creators[0];
  const conversation = messages[selectedRecipientId] || [];

  // Requests belonging to this conversation thread
  const threadCustomRequests = useMemo(() => {
    return customRequests.filter(r => r.creatorId === selectedRecipientId);
  }, [customRequests, selectedRecipientId]);

  const pendingCreatorRequestsCount = useMemo(() => {
    return customRequests.filter(r =>
      (isCreatorRole ? r.creatorId === currentUser.id : true) &&
      (r.status === 'pending' || r.status === 'new_request' || r.status === 'awaiting_creator_review')
    ).length;
  }, [customRequests, isCreatorRole, currentUser.id]);

  // Filter conversations according to the 6 required inbox filters
  const filteredCreators = useMemo(() => {
    return creators.filter(c => {
      if (
        searchQuery &&
        !c.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !c.username.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      const isArchived = archivedIds.includes(c.id);
      if (activeTab === 'archived') return isArchived;
      if (isArchived) return false;

      const chatMsgs = messages[c.id] || [];
      const creatorReqs = customRequests.filter(r => r.creatorId === c.id);

      if (activeTab === 'unread') {
        return chatMsgs.some(m => !m.read && m.senderId !== currentUser.id);
      }
      if (activeTab === 'video_calls') {
        return chatMsgs.some(m => !!m.videoCallEvent) || c.isLiveForCalls;
      }
      if (activeTab === 'custom_requests') {
        return creatorReqs.length > 0 || chatMsgs.some(m => !!m.customRequestId);
      }
      if (activeTab === 'paid_media') {
        return chatMsgs.some(m => m.isPaid || (m.attachments && m.attachments.some(a => a.isPaid)));
      }
      if (activeTab === 'pending_requests') {
        return creatorReqs.some(r =>
          r.status === 'pending' ||
          r.status === 'new_request' ||
          r.status === 'awaiting_creator_review' ||
          r.status === 'in_progress'
        );
      }

      return true;
    });
  }, [creators, searchQuery, archivedIds, activeTab, messages, customRequests, currentUser.id]);

  // Handle selecting files from device and uploading to Supabase Storage ("app-files")
  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
    forcedType?: 'image' | 'video' | 'document'
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);
    e.target.value = '';
    setShowMediaPanel(true);

    for (const file of files) {
      // Validate file size (max 250MB for video, 25MB for image/doc)
      const maxMB = file.type.startsWith('video/') ? 250 : 25;
      const sizeMB = file.size / (1024 * 1024);
      const formattedSize = sizeMB < 1 ? `${Math.max(1, Math.round(sizeMB * 1024))} KB` : `${sizeMB.toFixed(1)} MB`;

      let detectedType: 'image' | 'video' | 'document' = forcedType || 'image';
      if (file.type.startsWith('video/')) detectedType = 'video';
      else if (file.type.startsWith('image/')) detectedType = 'image';
      else detectedType = 'document';

      const itemId = `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (sizeMB > maxMB) {
        setStagedAttachments(prev => [
          ...prev,
          {
            id: itemId,
            fileName: file.name,
            fileType: detectedType,
            fileSizeFormatted: formattedSize,
            url: '',
            description: '',
            isPaid: isCreatorRole,
            price: '15.00',
            uploadProgress: 0,
            uploadError: `File exceeds ${maxMB}MB maximum size limit.`
          }
        ]);
        continue;
      }

      const objectUrl = URL.createObjectURL(file);
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUser.id,
        file,
        featureName: 'messages',
        itemId,
        visibility: 'message_attachment'
      });

      const resolvedUrl = uploadRes.signedUrl || objectUrl;

      setStagedAttachments(prev => [
        ...prev,
        {
          id: itemId,
          fileName: file.name,
          fileType: detectedType,
          fileSizeFormatted: formattedSize,
          url: resolvedUrl,
          thumbnailUrl: detectedType === 'image' ? resolvedUrl : undefined,
          description: '',
          isPaid: isCreatorRole,
          price: '15.00',
          uploadProgress: 100,
          storagePath: uploadRes.storagePath,
          supabaseFileId: uploadRes.record?.file_id
        }
      ]);

      // If video, generate a canvas thumbnail frame
      if (detectedType === 'video') {
        const vid = document.createElement('video');
        vid.src = objectUrl;
        vid.muted = true;
        vid.currentTime = 0.5;
        vid.onloadeddata = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = vid.videoWidth || 480;
            canvas.height = vid.videoHeight || 270;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
              const thumbData = canvas.toDataURL('image/jpeg', 0.75);
              setStagedAttachments(prev =>
                prev.map(item => (item.id === itemId ? { ...item, thumbnailUrl: thumbData } : item))
              );
            }
          } catch {
            // fallback
          }
        };
      }
    }
  };

  const handleAddDemoAsset = (demo: typeof DEMO_QUICK_MEDIA[0]) => {
    const newItem: StagedAttachment = {
      id: `att_demo_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      fileName: demo.fileName,
      fileType: demo.fileType,
      fileSizeFormatted: demo.fileSizeFormatted,
      url: demo.url,
      thumbnailUrl: demo.thumbnailUrl,
      description: '',
      isPaid: isCreatorRole,
      price: demo.fileType === 'video' ? '25.00' : '15.00',
      uploadProgress: 100
    };
    setStagedAttachments(prev => [...prev, newItem]);
    setShowMediaPanel(true);
  };

  // Send message (text or multi-attachment or paid text)
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    // Case 1: Sending staged media attachments
    if (stagedAttachments.length > 0) {
      const validAttachments = stagedAttachments.filter(a => !a.uploadError && a.url);
      if (validAttachments.length === 0) {
        triggerToast('Please remove failed uploads before sending.');
        return;
      }

      const finalAttachments: ChatAttachmentItem[] = validAttachments.map(att => {
        const itemPaid = isCreatorRole
          ? pricingMode === 'bundle'
            ? bundleIsPaid
            : att.isPaid
          : false;
        const parsedItemPrice = Math.max(0, parseFloat(att.price) || 0);
        return {
          id: att.id,
          fileName: att.fileName,
          fileType: att.fileType,
          fileSizeFormatted: att.fileSizeFormatted,
          url: att.url,
          thumbnailUrl: att.thumbnailUrl,
          description: att.description.trim() || undefined,
          isPaid: itemPaid && parsedItemPrice > 0,
          price: itemPaid ? parsedItemPrice : undefined,
          isUnlocked: !itemPaid
        };
      });

      const anyPaid = finalAttachments.some(a => a.isPaid);
      const totalBundlePrice =
        pricingMode === 'bundle' && bundleIsPaid
          ? Math.max(1, parseFloat(bundlePrice) || 15)
          : finalAttachments.reduce((acc, a) => acc + (a.isPaid ? a.price || 0 : 0), 0);

      const firstAtt = finalAttachments[0];
      const msgContent =
        inputText.trim() ||
        firstAtt.description ||
        (anyPaid
          ? `Exclusive ${finalAttachments.length > 1 ? `${finalAttachments.length} media items` : firstAtt.fileType} (${firstAtt.fileName})`
          : `Shared ${finalAttachments.length} ${finalAttachments.length > 1 ? 'files' : firstAtt.fileType}`);

      sendMessage(
        selectedRecipientId,
        msgContent,
        anyPaid,
        anyPaid ? totalBundlePrice : undefined,
        firstAtt.url,
        {
          mediaType: firstAtt.fileType,
          mediaThumbnailUrl: firstAtt.thumbnailUrl,
          mediaFileName: firstAtt.fileName,
          mediaDescription: firstAtt.description,
          attachments: finalAttachments,
          pricingMode
        }
      );

      setStagedAttachments([]);
      setShowMediaPanel(false);
      setInputText('');
      triggerToast(anyPaid ? `Sent paid media ($${totalBundlePrice.toFixed(2)})` : 'Media sent!');
      return;
    }

    // Case 2: Standard or Paid Text Message (preserving existing feature)
    if (!inputText.trim()) return;

    if (isLockedMessageMode && isCreatorRole) {
      const parsedLockPrice = Math.max(1, parseFloat(lockPrice) || 15);
      sendMessage(
        selectedRecipientId,
        inputText.trim(),
        true,
        parsedLockPrice
      );
      setIsLockedMessageMode(false);
      triggerToast(`Sent locked paid message ($${parsedLockPrice.toFixed(2)})`);
    } else {
      sendMessage(selectedRecipientId, inputText.trim());
    }

    setInputText('');
  };

  const handleUnlock = (messageId: string, attachmentId?: string) => {
    const res = unlockPaidMessage(selectedRecipientId, messageId, attachmentId);
    if (!res.success) {
      triggerToast(res.error || 'Could not unlock media');
    } else {
      triggerToast('Unlocked! Added to your purchase history.');
    }
  };

  // Start Video Call workflow from Inbox Header
  const handleConfirmStartCall = () => {
    setCallError(null);
    const res = initiateVideoCall(selectedRecipientId, callSpendingLimit);
    if (!res.success) {
      setCallError(res.error || 'Unable to start call.');
      return;
    }
    setShowCallConfirmModal(false);
  };

  // Submit new Custom Video Request from inside Inbox
  const handleSubmitCustomRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setReqError(null);
    const parsedPrice = parseFloat(reqBudget);
    if (!reqTitle.trim() || !reqInstructions.trim()) {
      setReqError('Please provide a request title and detailed instructions.');
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice < (recipientCreator.customRequestBasePrice || 50)) {
      setReqError(`Minimum budget for ${recipientCreator.name} is $${(recipientCreator.customRequestBasePrice || 50).toFixed(2)}.`);
      return;
    }

    const res = createCustomVideoRequest({
      creatorId: selectedRecipientId,
      title: reqTitle.trim(),
      instructions: reqInstructions.trim(),
      recipientName: reqRecipientName.trim() || currentUser.name,
      videoDurationMinutes: reqDuration,
      price: parsedPrice,
      deliveryDeadline: reqDeadline
    });

    if (!res.success) {
      setReqError(res.error || 'Could not create request.');
      return;
    }

    setShowNewRequestModal(false);
    setReqTitle('');
    setReqInstructions('');
    triggerToast('Custom Video Request submitted and added to this conversation!');
  };

  // Creator approves request inside conversation
  const handleCreatorApproveRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingRequest) return;
    const finalPrice = parseFloat(approvePrice) || approvingRequest.price;
    updateCustomRequestStatus(approvingRequest.id, 'accepted', undefined, undefined, {
      negotiatedPrice: finalPrice,
      confirmedDeadline: approveDeadline || approvingRequest.deliveryDeadline
    });
    setApprovingRequest(null);
    triggerToast('Request approved! Fan has been notified in this conversation.');
  };

  // Creator declines request inside conversation
  const handleCreatorDeclineRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!decliningRequest) return;
    updateCustomRequestStatus(decliningRequest.id, 'declined', undefined, undefined, {
      declineReason: declineReason.trim() || 'Creator schedule is currently at capacity.'
    });
    setDecliningRequest(null);
    setDeclineReason('');
    triggerToast('Request declined and fan escrow refunded.');
  };

  const handleDeliveryVideoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setDeliveryUploadError(null);

    if (!file.type.startsWith('video/') && !/\.(mp4|mov|webm|m4v|mkv)$/i.test(file.name)) {
      setDeliveryUploadError('Please select a valid video file (MP4, MOV, or WEBM).');
      e.target.value = '';
      return;
    }

    setIsUploadingDeliveryVideo(true);
    try {
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUser.id,
        file,
        featureName: 'custom-requests',
        itemId: deliveringRequest?.id || `req_${Date.now()}`,
        visibility: 'private'
      });

      const localPreview = URL.createObjectURL(file);
      const finalUrl = uploadRes.signedUrl || localPreview;
      setDeliveryVideoUrl(finalUrl);
      setDeliveryVideoFileName(file.name);
      setDeliveryVideoFileSize(`${(file.size / (1024 * 1024)).toFixed(1)} MB`);
      setDeliveryStoragePath(uploadRes.storagePath);
      setDeliverySupabaseFileId(uploadRes.record?.file_id);
    } catch {
      setDeliveryUploadError('Failed to upload video file. Please try again.');
    } finally {
      setIsUploadingDeliveryVideo(false);
      e.target.value = '';
    }
  };

  const handleRemoveDeliveryVideoFile = async () => {
    if (deliveryStoragePath) {
      await deleteSupabaseFileByPath({
        storagePath: deliveryStoragePath,
        fileId: deliverySupabaseFileId,
        uid: currentUser.id
      });
    }
    setDeliveryVideoUrl('');
    setDeliveryVideoFileName('');
    setDeliveryVideoFileSize('');
    setDeliveryStoragePath(undefined);
    setDeliverySupabaseFileId(undefined);
    setDeliveryUploadError(null);
  };

  // Creator delivers video inside conversation
  const handleCreatorDeliverRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deliveringRequest) return;
    if (!deliveryVideoUrl.trim()) {
      setDeliveryUploadError('Please upload a video file before delivering.');
      return;
    }
    updateCustomRequestStatus(
      deliveringRequest.id,
      'delivered',
      deliveryVideoUrl.trim(),
      deliveryNotes.trim() || 'Delivered your custom video!'
    );
    setDeliveringRequest(null);
    setDeliveryVideoUrl('');
    setDeliveryVideoFileName('');
    setDeliveryVideoFileSize('');
    setDeliveryStoragePath(undefined);
    setDeliverySupabaseFileId(undefined);
    setDeliveryUploadError(null);
    setDeliveryNotes('');
    triggerToast('Custom video delivered! Fan can now review and release escrow.');
  };

  const handleTipSubmit = () => {
    const parsedTip = Math.max(1, parseFloat(tipAmount) || 20);
    const res = tipCreator(selectedRecipientId, parsedTip);
    if (res.success) {
      setShowTipModal(false);
      triggerToast(`Sent $${parsedTip.toFixed(2)} tip to ${recipientCreator.name}!`);
    } else {
      triggerToast(res.error || 'Failed to send tip');
    }
  };

  const toggleArchive = (id: string) => {
    setArchivedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const getRequestStatusLabel = (status: CustomVideoRequest['status']) => {
    switch (status) {
      case 'new_request':
      case 'pending':
        return { label: 'Awaiting Creator Review', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'awaiting_creator_review':
        return { label: 'Awaiting Creator Review', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'accepted':
      case 'approved':
        return { label: 'Approved · In Production', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'awaiting_payment':
        return { label: 'Awaiting Payment', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' };
      case 'in_progress':
        return { label: 'In Progress', color: 'bg-[#d4af37]/20 text-[#fce7b0] border-[#d4af37]/40' };
      case 'delivered':
        return { label: 'Delivered · Ready for Fan Approval', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
      case 'completed':
        return { label: 'Completed · Escrow Released', color: 'bg-emerald-950/80 text-emerald-400 border-emerald-700/50' };
      case 'declined':
      case 'rejected':
        return { label: 'Declined · Escrow Refunded', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      case 'cancelled':
        return { label: 'Cancelled', color: 'bg-neutral-700/40 text-neutral-300 border-neutral-600' };
      case 'disputed':
        return { label: 'Disputed · Under Review', color: 'bg-orange-500/20 text-orange-300 border-orange-500/40' };
      case 'refunded':
        return { label: 'Refunded to Fan', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40' };
      default:
        return { label: String(status), color: 'bg-neutral-800 text-neutral-300 border-neutral-700' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-4 h-[calc(100dvh-8.25rem)] md:h-[calc(100dvh-5.5rem)] min-h-[420px] md:min-h-[580px] flex gap-3 sm:gap-4 relative">
      {/* Toast Feedback Banner */}
      {actionToast && (
        <div className="fixed bottom-20 left-3 right-3 sm:left-auto sm:right-6 z-50 px-4 py-2.5 rounded-xl bg-[#18181c] border border-[#d4af37] text-[#fce7b0] text-xs font-semibold shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#d4af37] shrink-0" />
          <span className="truncate">{actionToast}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* LEFT COLUMN: INBOX CONVERSATIONS & FILTER HUB                     */}
      {/* ================================================================= */}
      <div
        className={`w-full md:w-88 lg:w-96 bg-[#121215] border border-[#27272a] rounded-2xl p-3 sm:p-3.5 flex flex-col shrink-0 ${
          mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Inbox Header & Pending Request Reminder Banner */}
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Private Inbox</span>
              {pendingCreatorRequestsCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {pendingCreatorRequestsCount} Pending {pendingCreatorRequestsCount === 1 ? 'Request' : 'Requests'}
                </span>
              )}
            </h2>
            <p className="text-[11px] text-neutral-400">
              {isCreatorRole ? 'Creator Monetization & Client Concierge' : 'Direct Creator Messaging, Calls & Vault'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab(activeTab === 'archived' ? 'all' : 'archived')}
            className={`p-1.5 rounded-lg border text-xs transition ${
              activeTab === 'archived'
                ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0]'
                : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
            }`}
            title="Archived Conversations"
          >
            <Archive className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Reminder Banner if there are pending custom video requests */}
        {pendingCreatorRequestsCount > 0 && (
          <div
            onClick={() => setActiveTab('pending_requests')}
            className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#d4af37]/10 to-transparent border border-amber-500/40 flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
          >
            <div className="flex items-center gap-2">
              <Clapperboard className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="text-[11px]">
                <span className="font-bold text-amber-200">Action Required: </span>
                <span className="text-neutral-300">
                  {pendingCreatorRequestsCount} custom video {pendingCreatorRequestsCount === 1 ? 'request awaits' : 'requests await'} review
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#d4af37] underline ml-2 shrink-0">View</span>
          </div>
        )}

        {/* 6 Inbox Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 mb-2.5 border-b border-[#26262b]">
          {[
            { id: 'all' as const, label: 'All Messages' },
            { id: 'unread' as const, label: 'Unread' },
            { id: 'pending_requests' as const, label: 'Pending Requests', badge: pendingCreatorRequestsCount },
            { id: 'custom_requests' as const, label: 'Custom Video Requests' },
            { id: 'paid_media' as const, label: 'Paid Media' },
            { id: 'video_calls' as const, label: 'Video Call Requests' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#d4af37] text-black font-bold shadow-sm'
                  : 'bg-[#18181c] text-neutral-400 hover:text-white border border-[#27272a]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge ? (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                    activeTab === tab.id ? 'bg-black text-[#d4af37]' : 'bg-amber-500 text-black'
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative mb-3">
          <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search creators, requests, or messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#18181c] border border-[#27272a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        {/* Conversations List */}
        <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
          {filteredCreators.length === 0 ? (
            <div className="py-12 text-center text-xs text-neutral-500 space-y-2">
              <p>No conversations match "{activeTab.replace('_', ' ')}".</p>
              {activeTab !== 'all' && (
                <button
                  onClick={() => setActiveTab('all')}
                  className="text-[#d4af37] underline text-[11px]"
                >
                  Show All Messages
                </button>
              )}
            </div>
          ) : (
            filteredCreators.map(c => {
              const isSelected = c.id === selectedRecipientId;
              const chatMsgs = messages[c.id] || [];
              const lastMsg = chatMsgs[chatMsgs.length - 1];
              const unreadCount = chatMsgs.filter(m => !m.read && m.senderId !== currentUser.id).length;
              const hasLockedMedia = chatMsgs.some(
                m => (m.isPaid && !m.isUnlocked) || (m.attachments && m.attachments.some(a => a.isPaid && !a.isUnlocked))
              );
              const pendingReqsForCreator = customRequests.filter(
                r =>
                  r.creatorId === c.id &&
                  (r.status === 'pending' || r.status === 'new_request' || r.status === 'awaiting_creator_review')
              );

              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedRecipientId(c.id);
                    markThreadAsRead(c.id);
                    setMobileShowChat(true);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left flex items-center gap-3 transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-[#1e1e24] border-[#d4af37]/50 shadow-md'
                      : pendingReqsForCreator.length > 0
                      ? 'bg-amber-950/15 border-amber-500/30 hover:bg-[#18181c]'
                      : 'border-transparent hover:bg-[#18181c]'
                  }`}
                >
                  <div className="relative shrink-0">
                    <img
                      src={c.avatar}
                      alt={c.name}
                      className="w-11 h-11 rounded-full object-cover border border-[#27272a]"
                    />
                    {c.isLiveForCalls && (
                      <span
                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#121215]"
                        title="Available for Video Calls"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-xs text-white truncate flex items-center gap-1.5">
                        <span className="truncate">{c.name}</span>
                        <span className="text-[10px] text-neutral-400 font-normal inline-flex items-center gap-0.5">
                          @{c.username}
                          <VerifiedBadge creatorId={c.id} size="xs" />
                        </span>
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {pendingReqsForCreator.length > 0 && (
                          <span className="text-[9px] bg-amber-500 text-black font-bold px-1.5 py-0.5 rounded-full">
                            New Request
                          </span>
                        )}
                        {hasLockedMedia && (
                          <span className="text-[9px] bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/30 px-1.5 py-0.5 rounded font-mono">
                            Paid Media
                          </span>
                        )}
                        {unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#d4af37] text-black text-[10px] font-bold flex items-center justify-center">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {lastMsg ? lastMsg.content : 'Start a private conversation'}
                    </div>

                    <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-500">
                      <span>${(c.callRatePerMinute || 4.5).toFixed(2)}/min call</span>
                      <span>·</span>
                      <span>{c.isLiveForCalls ? 'Online for Calls' : 'Offline for Calls'}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}

          {/* Direct Message Fee Requests Section when on Pending Requests filter */}
          {activeTab === 'pending_requests' && messageRequests.length > 0 && (
            <div className="pt-3 mt-3 border-t border-[#26262b] space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-1">
                Priority Paid DM Introductions ({messageRequests.length})
              </div>
              {messageRequests.map(req => (
                <div key={req.id} className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={req.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                      <div>
                        <div className="font-semibold text-white">{req.senderName}</div>
                        <div className="text-[10px] text-neutral-400">{req.handle}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-[#fce7b0] font-bold">+${req.offeredFee.toFixed(2)}</span>
                  </div>
                  <p className="text-[11px] text-neutral-300 leading-snug">{req.preview}</p>
                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#26262b]">
                    <button
                      onClick={() => setMessageRequests(prev => prev.filter(r => r.id !== req.id))}
                      className="px-2.5 py-1 text-[10px] text-neutral-400 hover:text-white"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => {
                        setMessageRequests(prev => prev.filter(r => r.id !== req.id));
                        triggerToast(`Accepted introduction from ${req.senderName} (+$${req.offeredFee.toFixed(2)})`);
                      }}
                      className="px-3 py-1 bg-[#d4af37] text-black text-[10px] font-bold rounded-lg"
                    >
                      Accept & Reply
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* RIGHT COLUMN: ACTIVE CONVERSATION THREAD & TOOLBAR                */}
      {/* ================================================================= */}
      <div
        className={`flex-1 bg-[#121215] border border-[#27272a] rounded-2xl flex flex-col overflow-hidden ${
          !mobileShowChat ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* 1. CONVERSATION HEADER WITH VIDEO CALL BUTTON & STATUS */}
        <div className="p-2.5 sm:p-3.5 border-b border-[#26262b] flex items-center justify-between bg-[#141418] gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMobileShowChat(false)}
              className="md:hidden p-1.5 -ml-1 text-neutral-300 hover:text-white rounded-lg bg-[#1c1c22] border border-[#27272a] shrink-0"
              title="Back to Conversations"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative shrink-0">
              <img
                src={recipientCreator.avatar}
                alt={recipientCreator.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-[#d4af37]/50"
              />
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#141418] ${
                  recipientCreator.isLiveForCalls ? 'bg-emerald-500' : 'bg-neutral-500'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 sm:gap-1.5 font-bold text-xs sm:text-sm text-white min-w-0">
                <span className="truncate">{recipientCreator.name}</span>
                <span className="text-[10px] text-neutral-400 font-normal inline-flex items-center gap-0.5">
                  @{recipientCreator.username}
                  <VerifiedBadge creatorId={recipientCreator.id} size="xs" />
                </span>
                {isCreatorRole && (
                  <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                    Creator View
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-neutral-400 truncate">
                <span className={`truncate ${recipientCreator.isLiveForCalls ? 'text-emerald-400 font-medium' : 'text-neutral-500'}`}>
                  {recipientCreator.isLiveForCalls ? '● Available for Calls' : '○ Offline for Calls'}
                </span>
                <span className="shrink-0">·</span>
                <span className="font-mono text-[#fce7b0] shrink-0">
                  ${(recipientCreator.callRatePerMinute || 4.5).toFixed(2)}/m
                </span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons: Strictly Fan-only for Video Call, Custom Video, and Tip */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isCreatorRole && (
              <>
                {/* 1. VIDEO CALL BUTTON (Fan Only) */}
                <button
                  type="button"
                  onClick={() => {
                    setCallError(null);
                    setShowCallConfirmModal(true);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md ${
                    recipientCreator.isLiveForCalls
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-[#1e1e24] hover:bg-[#27272f] text-neutral-300 border border-[#27272a]'
                  }`}
                  title={`Start 1-on-1 Video Call ($${(recipientCreator.callRatePerMinute || 4.5).toFixed(2)}/min)`}
                >
                  <VideoIcon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Video Call</span>
                </button>

                {/* 2. CUSTOM VIDEO REQUEST BUTTON (Fan Only) */}
                <button
                  type="button"
                  onClick={() => {
                    setReqBudget(String(recipientCreator.customRequestBasePrice || 150));
                    setShowNewRequestModal(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 bg-[#1a1a20] hover:bg-[#25252e] border border-[#d4af37]/40 text-[#fce7b0] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Submit a Custom Video Request"
                >
                  <Clapperboard className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />
                  <span className="hidden lg:inline">Custom Video</span>
                </button>

                {/* 3. SEND TIP BUTTON (Fan Only) */}
                <button
                  type="button"
                  onClick={() => setShowTipModal(true)}
                  className="px-2.5 sm:px-3 py-1.5 bg-[#1a1a20] hover:bg-[#25252e] border border-[#d4af37]/30 text-[#d4af37] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                  title="Send Tip"
                >
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Tip</span>
                </button>
              </>
            )}

            {/* Conversation Options Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-[#18181c] border border-[#27272a]"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showHeaderMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl bg-[#18181c] border border-[#27272a] shadow-2xl py-1.5 z-30 text-xs">
                  <button
                    onClick={() => {
                      toggleArchive(selectedRecipientId);
                      setShowHeaderMenu(false);
                      triggerToast(
                        archivedIds.includes(selectedRecipientId)
                          ? 'Conversation unarchived'
                          : 'Conversation archived'
                      );
                    }}
                    className="w-full px-3.5 py-2 text-left text-neutral-300 hover:bg-[#222228] flex items-center gap-2"
                  >
                    <Archive className="w-3.5 h-3.5 text-neutral-400" />
                    <span>
                      {archivedIds.includes(selectedRecipientId) ? 'Unarchive Chat' : 'Archive Chat'}
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      triggerToast('Conversation reported to Trust & Safety team.');
                    }}
                    className="w-full px-3.5 py-2 text-left text-rose-400 hover:bg-[#222228] flex items-center gap-2"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    <span>Report Conversation</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* INCOMING VIDEO CALL BANNER INSIDE INBOX (When a call is requesting) */}
        {videoCallSession && videoCallSession.status === 'requesting' && (
          <div className="px-4 py-3 bg-gradient-to-r from-emerald-950/90 via-emerald-900/60 to-[#141418] border-b border-emerald-500/40 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 animate-pulse">
                <PhoneIncoming className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>
                    {isCreatorRole
                      ? `Incoming Video Call from ${videoCallSession.fanName}`
                      : `Calling ${videoCallSession.creatorName}...`}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                    ${videoCallSession.ratePerMinute.toFixed(2)}/min
                  </span>
                </div>
                <p className="text-[11px] text-neutral-300">
                  Billing starts only after the call is accepted and connected. Unanswered calls are $0.00.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isCreatorRole && (
                <button
                  onClick={acceptIncomingCall}
                  className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Accept Call</span>
                </button>
              )}
              <button
                onClick={rejectCall}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span>{isCreatorRole ? 'Decline' : 'Cancel'}</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. MESSAGE THREAD HISTORY (Messages, Paid Media, Custom Video Request Cards, Call Logs) */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4">
          {conversation.map(msg => {
            const isMine = msg.senderId === currentUser.id;
            const linkedRequest = msg.customRequestId
              ? customRequests.find(r => r.id === msg.customRequestId)
              : undefined;

            // A. Custom Video Request Card inside Conversation
            if (linkedRequest) {
              const statusInfo = getRequestStatusLabel(linkedRequest.status);
              const isPendingForCreator =
                linkedRequest.status === 'pending' ||
                linkedRequest.status === 'new_request' ||
                linkedRequest.status === 'awaiting_creator_review';

              return (
                <div key={msg.id} className="my-2">
                  <div className="max-w-lg mx-auto rounded-2xl bg-gradient-to-b from-[#1a1a22] to-[#141418] border border-[#d4af37]/40 p-4 shadow-xl space-y-3">
                    <div className="flex items-center justify-between gap-2 border-b border-[#27272a] pb-2.5">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-[#d4af37]/15 text-[#d4af37]">
                          <Clapperboard className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white flex items-center gap-1.5">
                            <span>Custom Video Request</span>
                            <span className="font-mono text-[10px] text-neutral-400">#{linkedRequest.id}</span>
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            Requested by {linkedRequest.fanName} · Submitted {linkedRequest.createdAt}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="font-bold text-white text-sm">{linkedRequest.title}</div>
                      <p className="text-neutral-300 leading-relaxed bg-[#111114] p-3 rounded-xl border border-[#25252c]">
                        {linkedRequest.instructions}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                      <div className="p-2 rounded-xl bg-[#121215] border border-[#25252c]">
                        <div className="text-neutral-500 text-[10px]">Proposed Budget</div>
                        <div className="font-mono font-bold text-[#fce7b0] text-sm">
                          ${linkedRequest.price.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#121215] border border-[#25252c]">
                        <div className="text-neutral-500 text-[10px]">Target Length</div>
                        <div className="font-semibold text-white">{linkedRequest.videoDurationMinutes} mins</div>
                      </div>
                      <div className="p-2 rounded-xl bg-[#121215] border border-[#25252c]">
                        <div className="text-neutral-500 text-[10px]">Delivery Deadline</div>
                        <div className="font-semibold text-white">{linkedRequest.deliveryDeadline}</div>
                      </div>
                    </div>

                    {linkedRequest.declineReason && (
                      <div className="p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                        <strong>Decline Note:</strong> {linkedRequest.declineReason}
                      </div>
                    )}

                    {/* Delivered Video Preview inside Request Card */}
                    {linkedRequest.deliveredVideoUrl &&
                      (linkedRequest.status === 'delivered' || linkedRequest.status === 'completed') && (
                        <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                          <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Delivered Custom Video</span>
                          </div>
                          {linkedRequest.deliveredNotes && (
                            <p className="text-xs text-neutral-300 italic">"{linkedRequest.deliveredNotes}"</p>
                          )}
                          <video
                            src={linkedRequest.deliveredVideoUrl || '/videos/sample1.mp4'}
                            controls
                            onError={(e) => {
                              const el = e.currentTarget;
                              if (!el.src.includes('/videos/sample1.mp4')) {
                                el.src = '/videos/sample1.mp4';
                                el.load();
                              }
                            }}
                            className="w-full max-h-56 rounded-lg bg-black"
                          />
                          {!isCreatorRole && linkedRequest.status === 'delivered' && (
                            <button
                              onClick={() => {
                                updateCustomRequestStatus(linkedRequest.id, 'completed');
                                triggerToast('Marked Completed! Escrow funds released to creator.');
                              }}
                              className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition cursor-pointer"
                            >
                              Approve Delivery & Release Escrow (${linkedRequest.price.toFixed(2)})
                            </button>
                          )}
                        </div>
                      )}

                    {/* Creator Actions: Approve / Decline / Deliver */}
                    {isCreatorRole && isPendingForCreator && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#27272a]">
                        <button
                          onClick={() => {
                            setApprovingRequest(linkedRequest);
                            setApprovePrice(String(linkedRequest.price));
                            setApproveDeadline(linkedRequest.deliveryDeadline);
                          }}
                          className="flex-1 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Approve Request</span>
                        </button>
                        <button
                          onClick={() => {
                            setDecliningRequest(linkedRequest);
                            setDeclineReason('');
                          }}
                          className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <X className="w-4 h-4" />
                          <span>Decline Request</span>
                        </button>
                      </div>
                    )}

                    {isCreatorRole &&
                      (linkedRequest.status === 'accepted' ||
                        linkedRequest.status === 'approved' ||
                        linkedRequest.status === 'in_progress') && (
                        <div className="pt-2 border-t border-[#27272a]">
                          <button
                            onClick={() => setDeliveringRequest(linkedRequest)}
                            className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Deliver Completed Custom Video</span>
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              );
            }

            // B. Video Call Event Notification / History Card inside Conversation
            if (msg.videoCallEvent) {
              const ev = msg.videoCallEvent;
              const isCompleted = ev.status === 'completed';
              return (
                <div key={msg.id} className="flex justify-center my-1">
                  <div className="px-4 py-2.5 rounded-2xl bg-[#18181f] border border-[#27272a] flex items-center gap-3 text-xs max-w-md">
                    <div
                      className={`p-2 rounded-full ${
                        isCompleted
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {isCompleted ? <PhoneCall className="w-4 h-4" /> : <PhoneMissed className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{msg.content}</div>
                      <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                        <span>Rate: ${ev.ratePerMinute.toFixed(2)}/min</span>
                        <span>·</span>
                        <span className="font-mono text-[#fce7b0]">
                          Billed: ${(ev.totalCharged || 0).toFixed(2)}
                        </span>
                        <span>·</span>
                        <span>{ev.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // C. Direct Tip Message
            if (msg.isTip) {
              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="p-3.5 bg-gradient-to-r from-[#d4af37]/20 to-[#8a6e18]/25 border border-[#d4af37]/50 rounded-2xl text-xs max-w-sm space-y-1 shadow-lg">
                    <div className="flex items-center gap-1.5 text-[#fce7b0] font-bold">
                      <Sparkles className="w-4 h-4 text-[#d4af37]" />
                      <span>Direct Creator Tip: ${msg.tipAmount?.toFixed(2)}</span>
                    </div>
                    <div className="text-neutral-200">{msg.content}</div>
                    <div className="text-[10px] text-neutral-400 text-right">{msg.createdAt}</div>
                  </div>
                </div>
              );
            }

            // D. Multi-Attachment or Single Media Message (Free or Paid)
            if (msg.attachments && msg.attachments.length > 0) {
              const allItemsUnlocked = isMine || msg.isUnlocked || msg.attachments.every(a => !a.isPaid || a.isUnlocked);
              const isBundleMode = msg.pricingMode === 'bundle' && msg.isPaid && !allItemsUnlocked;

              return (
                <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                  <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-2xl max-w-md w-full space-y-3 shadow-xl">
                    {/* Creator Header Badge */}
                    <div className="flex items-center justify-between text-xs border-b border-[#26262b] pb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <span>{isMine ? 'You' : recipientCreator.name}</span>
                          {!isMine && (
                            <span className="text-[10px] text-neutral-400 font-normal inline-flex items-center gap-0.5">
                              @{recipientCreator.username}
                              <VerifiedBadge creatorId={recipientCreator.id} size="xs" />
                            </span>
                          )}
                        </span>
                        {msg.isPaid ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              allItemsUnlocked
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/40'
                            }`}
                          >
                            {allItemsUnlocked ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Purchased & Unlocked</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Paid Media · ${msg.price?.toFixed(2)}</span>
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-300">
                            Free Media
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-500">{msg.createdAt}</span>
                    </div>

                    {/* Message Caption / Description */}
                    {msg.content && <p className="text-xs text-neutral-200 leading-relaxed">{msg.content}</p>}

                    {/* Attachment Cards Grid */}
                    <div className="space-y-2.5">
                      {msg.attachments.map(att => {
                        const itemUnlocked = isMine || !att.isPaid || att.isUnlocked || msg.isUnlocked;

                        return (
                          <div
                            key={att.id}
                            className="rounded-xl overflow-hidden border border-[#27272a] bg-[#111114]"
                          >
                            {itemUnlocked ? (
                              /* AUTHORIZED UNLOCKED MEDIA VIEW */
                              <div className="space-y-2 p-2">
                                {att.fileType === 'video' ? (
                                  <div className="relative rounded-lg overflow-hidden bg-black">
                                    <video
                                      src={att.url || '/videos/sample1.mp4'}
                                      poster={att.thumbnailUrl}
                                      controls
                                      onError={(e) => {
                                        const el = e.currentTarget;
                                        if (!el.src.includes('/videos/sample1.mp4')) {
                                          el.src = '/videos/sample1.mp4';
                                          el.load();
                                        }
                                      }}
                                      className="w-full max-h-64 object-contain"
                                    />
                                  </div>
                                ) : att.fileType === 'image' ? (
                                  <div
                                    onClick={() =>
                                      setLightboxMedia({
                                        url: att.url,
                                        type: 'image',
                                        title: att.description || att.fileName
                                      })
                                    }
                                    className="relative rounded-lg overflow-hidden cursor-pointer group"
                                  >
                                    <img
                                      src={att.url}
                                      alt={att.fileName}
                                      className="w-full max-h-64 object-cover group-hover:scale-[1.02] transition"
                                    />
                                    <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-[10px] flex items-center gap-1">
                                      <Eye className="w-3 h-3" /> Full Screen
                                    </span>
                                  </div>
                                ) : (
                                  <div className="p-3 flex items-center justify-between bg-[#18181c] rounded-lg">
                                    <div className="flex items-center gap-2 text-xs text-white">
                                      <FileText className="w-4 h-4 text-[#d4af37]" />
                                      <span>{att.fileName}</span>
                                    </div>
                                    <a
                                      href={att.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[11px] text-[#d4af37] underline"
                                    >
                                      Open File
                                    </a>
                                  </div>
                                )}

                                <div className="flex items-center justify-between px-1 text-[11px] text-neutral-400">
                                  <span className="truncate">{att.description || att.fileName}</span>
                                  {att.fileSizeFormatted && (
                                    <span className="font-mono text-[10px] text-neutral-500">
                                      {att.fileSizeFormatted}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ) : (
                              /* PROTECTED LOCKED PREVIEW (Never exposes full resolution or original video URL) */
                              <div className="p-3 space-y-2.5">
                                <div className="relative h-40 rounded-lg overflow-hidden bg-neutral-950 border border-[#27272a] flex items-center justify-center">
                                  {att.thumbnailUrl && (
                                    <img
                                      src={att.thumbnailUrl}
                                      alt="Protected Preview"
                                      className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-40 select-none pointer-events-none"
                                    />
                                  )}
                                  <div className="relative z-10 text-center p-4 space-y-1.5">
                                    <div className="w-10 h-10 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/50 flex items-center justify-center mx-auto text-[#fce7b0]">
                                      <Lock className="w-5 h-5" />
                                    </div>
                                    <div className="text-xs font-bold text-white">
                                      Locked {att.fileType === 'video' ? 'Private Video' : 'Private Photo'}
                                    </div>
                                    <div className="text-[10px] text-neutral-400">
                                      {att.fileName} {att.fileSizeFormatted ? `· ${att.fileSizeFormatted}` : ''}
                                    </div>
                                  </div>
                                </div>

                                {att.description && (
                                  <p className="text-[11px] text-neutral-300 px-1">{att.description}</p>
                                )}

                                {!isBundleMode && (
                                  <button
                                    onClick={() => handleUnlock(msg.id, att.id)}
                                    className="w-full py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition"
                                  >
                                    <Unlock className="w-3.5 h-3.5" />
                                    <span>Pay to View · ${(att.price || msg.price || 15).toFixed(2)}</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bundle Unlock Button if multiple items are priced as one collection */}
                    {isBundleMode && !isMine && (
                      <button
                        onClick={() => handleUnlock(msg.id)}
                        className="w-full py-2.5 bg-gradient-to-r from-[#d4af37] to-[#b59024] hover:from-[#e5c07b] hover:to-[#d4af37] text-black font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>
                          Unlock Complete Collection ({msg.attachments.length} items) · ${msg.price?.toFixed(2)}
                        </span>
                      </button>
                    )}

                    {/* Payment Confirmation Receipt */}
                    {msg.paymentConfirmation && (
                      <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 flex items-center justify-between text-[10px] text-emerald-300">
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Payment Confirmed ({msg.paymentConfirmation.itemLabel})</span>
                        </span>
                        <span className="font-mono font-bold">${msg.paymentConfirmation.amount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // E. Legacy Paid Text or Single Media Message (Preserving Existing Functionality)
            if (msg.isPaid && !msg.isUnlocked && !isMine) {
              return (
                <div key={msg.id} className="flex flex-col items-start">
                  <div className="p-4 bg-[#18181c] border border-[#d4af37]/40 rounded-2xl max-w-sm space-y-3 shadow-xl">
                    <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#fce7b0]">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-4 h-4 text-[#d4af37]" />
                        <span>Exclusive Paid Message</span>
                      </div>
                      <span className="font-mono font-bold">${msg.price?.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-neutral-400 italic">
                      This private message from {recipientCreator.name} is locked. Unlock to view full message content.
                    </p>
                    <div className="w-full h-24 rounded-xl bg-black/60 backdrop-blur-md border border-[#27272a] flex items-center justify-center">
                      <div className="text-center p-3">
                        <Lock className="w-5 h-5 text-[#d4af37] mx-auto mb-1" />
                        <span className="text-[11px] text-neutral-400">Protected Content</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnlock(msg.id)}
                      className="w-full py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock for ${msg.price?.toFixed(2)}</span>
                    </button>
                  </div>
                </div>
              );
            }

            // F. Standard Text or Unlocked Legacy Message
            return (
              <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3 rounded-2xl text-xs max-w-sm space-y-1.5 ${
                    isMine
                      ? 'bg-[#d4af37] text-black font-medium'
                      : 'bg-[#18181c] text-neutral-200 border border-[#27272a]'
                  }`}
                >
                  {msg.isPaid && (
                    <div
                      className={`text-[10px] font-bold flex items-center gap-1 pb-1 border-b ${
                        isMine ? 'border-black/20 text-black' : 'border-neutral-700 text-emerald-400'
                      }`}
                    >
                      <Unlock className="w-3 h-3" />
                      <span>Paid Message (${msg.price?.toFixed(2)})</span>
                    </div>
                  )}
                  {msg.mediaUrl && (
                    <img
                      src={msg.mediaUrl}
                      alt="attachment"
                      onClick={() => setLightboxMedia({ url: msg.mediaUrl!, type: 'image' })}
                      className="w-full rounded-lg mb-1.5 object-cover max-h-52 cursor-pointer"
                    />
                  )}
                  <p data-ugc="true" className="leading-relaxed whitespace-pre-line">{msg.content}</p>
                  {!isMine && msg.content && (
                    <TranslateContentButton text={msg.content} contentType="message" compact />
                  )}
                  <div
                    className={`text-[10px] text-right flex items-center justify-end gap-1 ${
                      isMine ? 'text-black/65' : 'text-neutral-500'
                    }`}
                  >
                    <span>{msg.createdAt || msg.timestamp}</span>
                    {isMine && <CheckCheck className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 3. MULTI-ATTACHMENT & PAID MEDIA SENDING PANEL */}
        {showMediaPanel && (
          <div className="p-3.5 bg-[#16161c] border-t border-[#27272a] space-y-3 max-h-80 overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Private Media Attachments ({stagedAttachments.length})
                </span>
                {isCreatorRole && stagedAttachments.length > 1 && (
                  <div className="flex items-center gap-1 bg-[#111115] p-0.5 rounded-lg border border-[#27272a] text-[10px]">
                    <button
                      type="button"
                      onClick={() => setPricingMode('individual')}
                      className={`px-2 py-1 rounded-md font-semibold ${
                        pricingMode === 'individual' ? 'bg-[#d4af37] text-black' : 'text-neutral-400'
                      }`}
                    >
                      Price Individually
                    </button>
                    <button
                      type="button"
                      onClick={() => setPricingMode('bundle')}
                      className={`px-2 py-1 rounded-md font-semibold ${
                        pricingMode === 'bundle' ? 'bg-[#d4af37] text-black' : 'text-neutral-400'
                      }`}
                    >
                      Combined Bundle Price
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setStagedAttachments([]);
                  setShowMediaPanel(false);
                }}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
            </div>

            {/* Bundle Pricing Control when multiple files are in bundle mode */}
            {isCreatorRole && stagedAttachments.length > 1 && pricingMode === 'bundle' && (
              <div className="p-2.5 rounded-xl bg-[#111115] border border-[#d4af37]/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer">
                    <input
                      type="radio"
                      checked={!bundleIsPaid}
                      onChange={() => setBundleIsPaid(false)}
                      className="accent-[#d4af37]"
                    />
                    <span>Free Collection</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[#fce7b0] font-semibold cursor-pointer">
                    <input
                      type="radio"
                      checked={bundleIsPaid}
                      onChange={() => setBundleIsPaid(true)}
                      className="accent-[#d4af37]"
                    />
                    <span>Paid Collection</span>
                  </label>
                </div>
                {bundleIsPaid && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-neutral-400">Collection Price ($):</span>
                    <input
                      type="number"
                      min="1"
                      step="0.50"
                      value={bundlePrice}
                      onChange={e => setBundlePrice(e.target.value)}
                      className="w-24 bg-[#18181c] border border-[#d4af37]/50 rounded-lg px-2 py-1 text-white font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Quick Licensed Demo Media Selector for Instant Testing */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="text-[10px] text-neutral-400 shrink-0">Quick attach studio asset:</span>
              {DEMO_QUICK_MEDIA.map(demo => (
                <button
                  key={demo.fileName}
                  type="button"
                  onClick={() => handleAddDemoAsset(demo)}
                  className="px-2.5 py-1 rounded-lg bg-[#1e1e26] hover:bg-[#272732] border border-[#2e2e38] text-[10px] text-neutral-200 flex items-center gap-1.5 shrink-0"
                >
                  {demo.fileType === 'video' ? (
                    <VideoIcon className="w-3 h-3 text-amber-400" />
                  ) : (
                    <ImageIcon className="w-3 h-3 text-emerald-400" />
                  )}
                  <span className="truncate max-w-[140px]">{demo.fileName}</span>
                </button>
              ))}
            </div>

            {/* Staged Attachment Items List */}
            {stagedAttachments.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-[#27272a] text-center text-xs text-neutral-400">
                Select photos or videos from your device or choose a studio asset above.
              </div>
            ) : (
              <div className="space-y-2">
                {stagedAttachments.map((att, idx) => (
                  <div
                    key={att.id}
                    className="p-2.5 rounded-xl bg-[#111115] border border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-[#27272a] flex items-center justify-center">
                        {att.fileType === 'image' && att.url ? (
                          <img src={att.url} alt="" className="w-full h-full object-cover" />
                        ) : att.fileType === 'video' ? (
                          att.thumbnailUrl ? (
                            <img src={att.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <VideoIcon className="w-5 h-5 text-amber-400" />
                          )
                        ) : (
                          <FileText className="w-5 h-5 text-neutral-400" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white truncate">{att.fileName}</span>
                          <span className="text-[10px] uppercase px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 font-mono">
                            {att.fileType} · {att.fileSizeFormatted}
                          </span>
                        </div>
                        {att.uploadError ? (
                          <div className="text-[11px] text-rose-400">{att.uploadError}</div>
                        ) : (
                          <input
                            type="text"
                            placeholder="Optional description or caption for this file..."
                            value={att.description}
                            onChange={e => {
                              const val = e.target.value;
                              setStagedAttachments(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, description: val } : item))
                              );
                            }}
                            className="w-full bg-[#18181c] border border-[#27272a] rounded-lg px-2.5 py-1 text-[11px] text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                          />
                        )}
                      </div>
                    </div>

                    {/* Individual Free vs Paid + Custom Currency Price Field */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isCreatorRole && pricingMode === 'individual' && !att.uploadError && (
                        <div className="flex items-center gap-2 bg-[#18181c] px-2.5 py-1.5 rounded-xl border border-[#27272a]">
                          <button
                            type="button"
                            onClick={() =>
                              setStagedAttachments(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, isPaid: false } : item))
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              !att.isPaid ? 'bg-emerald-500 text-black' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Free
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setStagedAttachments(prev =>
                                prev.map((item, i) => (i === idx ? { ...item, isPaid: true } : item))
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                              att.isPaid ? 'bg-[#d4af37] text-black' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            Paid
                          </button>

                          {att.isPaid && (
                            <div className="flex items-center gap-1 pl-1 border-l border-[#27272a]">
                              <span className="text-[#d4af37] font-mono font-bold">$</span>
                              <input
                                type="number"
                                min="1"
                                step="0.50"
                                value={att.price}
                                onChange={e => {
                                  const val = e.target.value;
                                  setStagedAttachments(prev =>
                                    prev.map((item, i) => (i === idx ? { ...item, price: val } : item))
                                  );
                                }}
                                placeholder="Custom"
                                className="w-16 bg-[#111115] border border-[#d4af37]/40 rounded px-1.5 py-0.5 text-white font-mono text-xs focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (att.storagePath) {
                            deleteSupabaseFileByPath({
                              storagePath: att.storagePath,
                              fileId: att.supabaseFileId,
                              uid: currentUser.id
                            });
                          }
                          setStagedAttachments(prev => prev.filter((_, i) => i !== idx));
                        }}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. MESSAGE INPUT TOOLBAR */}
        <form onSubmit={handleSend} className="p-3 bg-[#141418] border-t border-[#26262b] space-y-2">
          {/* Creator Paid Text Message Bar (Preserving Existing Functionality) */}
          {isCreatorRole && (
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs px-1">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer text-[#d4af37] font-semibold">
                  <input
                    type="checkbox"
                    checked={isLockedMessageMode}
                    onChange={e => setIsLockedMessageMode(e.target.checked)}
                    className="accent-[#d4af37]"
                  />
                  <span>Set Paid Message Price</span>
                </label>

                {isLockedMessageMode && (
                  <div className="flex items-center gap-1 text-[11px] text-neutral-300">
                    <span>$</span>
                    <input
                      type="number"
                      min="1"
                      step="0.50"
                      value={lockPrice}
                      onChange={e => setLockPrice(e.target.value)}
                      className="w-20 bg-[#18181c] border border-[#d4af37]/50 rounded-lg px-2 py-0.5 text-white font-mono"
                    />
                  </div>
                )}
              </div>

              <span className="text-[10px] text-neutral-500">
                Attach photos/videos below to send Free or Paid media with custom pricing
              </span>
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            multiple
            onChange={e => handleFilesSelected(e, 'image')}
            className="hidden"
          />
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/webm"
            multiple
            onChange={e => handleFilesSelected(e, 'video')}
            className="hidden"
          />
          <input
            ref={docInputRef}
            type="file"
            multiple
            onChange={e => handleFilesSelected(e)}
            className="hidden"
          />

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Photo Attachment Button */}
            <button
              type="button"
              onClick={() => {
                setShowMediaPanel(true);
                photoInputRef.current?.click();
              }}
              className="p-2.5 rounded-xl bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-300 hover:text-[#d4af37] transition cursor-pointer"
              title="Attach Photos (Free or Paid)"
            >
              <ImageIcon className="w-4 h-4" />
            </button>

            {/* Video Attachment Button */}
            <button
              type="button"
              onClick={() => {
                setShowMediaPanel(true);
                videoInputRef.current?.click();
              }}
              className="p-2.5 rounded-xl bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-neutral-300 hover:text-[#d4af37] transition cursor-pointer"
              title="Attach Videos (Free or Paid)"
            >
              <VideoIcon className="w-4 h-4" />
            </button>

            {/* Multi-file / Media Panel Toggle Button */}
            <button
              type="button"
              onClick={() => setShowMediaPanel(!showMediaPanel)}
              className={`p-2.5 rounded-xl border transition cursor-pointer ${
                showMediaPanel
                  ? 'bg-[#d4af37]/20 border-[#d4af37] text-[#fce7b0]'
                  : 'bg-[#18181c] hover:bg-[#22222a] border-[#27272a] text-neutral-300'
              }`}
              title="Open Media Attachment & Pricing Panel"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={
                stagedAttachments.length > 0
                  ? 'Add a message with your attached media...'
                  : isLockedMessageMode
                  ? `Write locked paid message ($${lockPrice})...`
                  : `Message ${recipientCreator.name}...`
              }
              className="flex-1 bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />

            {/* Send Button */}
            <button
              type="submit"
              className="px-4 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </form>
      </div>

      {/* ================================================================= */}
      {/* MODAL 1: VIDEO CALL RATE & CONFIRMATION MODAL                     */}
      {/* ================================================================= */}
      {showCallConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
                  <VideoIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">1-on-1 Private Video Call</h3>
                  <p className="text-[11px] text-neutral-400">with {recipientCreator.name}</p>
                </div>
              </div>
              <button onClick={() => setShowCallConfirmModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[#18181c] border border-[#27272a] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Creator Call Rate:</span>
                <span className="font-mono font-bold text-[#fce7b0] text-sm">
                  ${(recipientCreator.callRatePerMinute || 4.5).toFixed(2)} / minute
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Creator Status:</span>
                <span className={recipientCreator.isLiveForCalls ? 'text-emerald-400 font-semibold' : 'text-rose-400'}>
                  {recipientCreator.isLiveForCalls ? 'Available Now' : 'Currently Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Your Wallet Balance:</span>
                <span className="font-mono text-white font-semibold">${Number(currentUser?.walletBalance || 0).toFixed(2)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Maximum Call Spending Cap ($)
              </label>
              <input
                type="number"
                min={recipientCreator.callRatePerMinute || 5}
                max={Math.max(recipientCreator.callRatePerMinute || 5, currentUser?.walletBalance || 0)}
                value={callSpendingLimit}
                onChange={e => setCallSpendingLimit(Number(e.target.value))}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3.5 py-2 text-xs text-white font-mono"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Billing begins only after {recipientCreator.name} accepts and the video stream connects. You are never charged for unanswered or declined calls.
              </p>
            </div>

            {callError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{callError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCallConfirmModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18181c] text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmStartCall}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Request Video Call</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: FAN CREATE CUSTOM VIDEO REQUEST INSIDE INBOX             */}
      {/* ================================================================= */}
      {showNewRequestModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitCustomRequest}
            className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-[#d4af37]" />
                <h3 className="font-bold text-white text-sm">
                  Request Custom Video from {recipientCreator.name}
                </h3>
              </div>
              <button type="button" onClick={() => setShowNewRequestModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Request Title</label>
                <input
                  type="text"
                  required
                  value={reqTitle}
                  onChange={e => setReqTitle(e.target.value)}
                  placeholder="e.g. Personalized Wardrobe Critique / Studio Walkthrough"
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Detailed Instructions</label>
                <textarea
                  rows={3}
                  required
                  value={reqInstructions}
                  onChange={e => setReqInstructions(e.target.value)}
                  placeholder="Describe specifically what you would like filmed, mentioned, or demonstrated..."
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-neutral-400 text-[11px] mb-1">Proposed Budget ($)</label>
                  <input
                    type="number"
                    min={recipientCreator.customRequestBasePrice || 50}
                    step="5"
                    value={reqBudget}
                    onChange={e => setReqBudget(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#d4af37]/50 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 text-[11px] mb-1">Length (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={reqDuration}
                    onChange={e => setReqDuration(Number(e.target.value))}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-neutral-400 text-[11px] mb-1">Delivery Deadline</label>
                  <input
                    type="date"
                    value={reqDeadline}
                    onChange={e => setReqDeadline(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-2.5 py-2 text-white"
                  />
                </div>
              </div>
            </div>

            {reqError && (
              <div className="p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs">
                {reqError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowNewRequestModal(false)}
                className="px-4 py-2 rounded-xl bg-[#18181c] text-neutral-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs cursor-pointer"
              >
                Submit Request (${parseFloat(reqBudget || '0').toFixed(2)} Escrow)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 3: CREATOR APPROVE REQUEST MODAL                            */}
      {/* ================================================================= */}
      {approvingRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatorApproveRequest}
            className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="font-bold text-white text-sm">Approve Custom Video Request</h3>
              <button type="button" onClick={() => setApprovingRequest(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#18181c] border border-[#27272a]">
                <div className="font-bold text-white">{approvingRequest.title}</div>
                <div className="text-neutral-400 mt-1">Fan: {approvingRequest.fanName}</div>
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">
                  Confirmed Price ($) (Accept proposed budget or set custom price)
                </label>
                <input
                  type="number"
                  min="10"
                  step="1"
                  value={approvePrice}
                  onChange={e => setApprovePrice(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#d4af37]/50 rounded-xl px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Confirmed Delivery Deadline</label>
                <input
                  type="date"
                  value={approveDeadline}
                  onChange={e => setApproveDeadline(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 rounded-xl bg-[#18181c] text-neutral-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#d4af37] text-black font-bold text-xs cursor-pointer"
              >
                Confirm & Approve
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 4: CREATOR DECLINE REQUEST MODAL                            */}
      {/* ================================================================= */}
      {decliningRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatorDeclineRequest}
            className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="font-bold text-white text-sm">Decline Custom Video Request</h3>
              <button type="button" onClick={() => setDecliningRequest(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Declining this request will immediately refund the fan's ${decliningRequest.price.toFixed(2)} escrow balance.
            </p>

            <div>
              <label className="block text-xs text-neutral-300 font-semibold mb-1">Optional Reason for Fan</label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={e => setDeclineReason(e.target.value)}
                placeholder="Let the fan know why you cannot fulfill this request right now..."
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDecliningRequest(null)}
                className="px-4 py-2 rounded-xl bg-[#18181c] text-neutral-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
              >
                Decline & Refund Fan
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 5: CREATOR DELIVER CUSTOM VIDEO MODAL                       */}
      {/* ================================================================= */}
      {deliveringRequest && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreatorDeliverRequest}
            className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <h3 className="font-bold text-white text-sm">Deliver Custom Video</h3>
              <button
                type="button"
                onClick={() => {
                  setDeliveringRequest(null);
                  setDeliveryUploadError(null);
                }}
                className="text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-neutral-300 font-semibold mb-1.5">Video File</label>
                <input
                  ref={deliveryVideoInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,video/*"
                  onChange={handleDeliveryVideoFileSelect}
                  className="hidden"
                />

                {!deliveryVideoUrl ? (
                  <button
                    type="button"
                    disabled={isUploadingDeliveryVideo}
                    onClick={() => deliveryVideoInputRef.current?.click()}
                    className="w-full py-6 px-4 bg-[#18181c] hover:bg-[#1f1f26] border border-dashed border-[#383842] hover:border-[#d4af37] rounded-xl flex flex-col items-center justify-center gap-2 text-neutral-300 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Upload className="w-6 h-6 text-[#d4af37]" />
                    <span className="font-semibold text-white">
                      {isUploadingDeliveryVideo ? 'Uploading Video File...' : 'Click to Upload Video File'}
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      MP4, MOV, or WEBM (up to 500 MB)
                    </span>
                  </button>
                ) : (
                  <div className="bg-[#18181c] border border-[#27272a] rounded-xl p-3 space-y-2.5">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        src={deliveryVideoUrl}
                        controls
                        playsInline
                        preload="metadata"
                        onError={(e) => {
                          const el = e.currentTarget;
                          if (!el.src.includes('/videos/sample1.mp4')) {
                            el.src = '/videos/sample1.mp4';
                            el.load();
                          }
                        }}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">
                          {deliveryVideoFileName || 'Uploaded Custom Video'}
                        </div>
                        {deliveryVideoFileSize && (
                          <div className="text-[10px] text-neutral-400 font-mono">
                            {deliveryVideoFileSize}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => deliveryVideoInputRef.current?.click()}
                          className="px-2.5 py-1 rounded-lg bg-[#23232b] hover:bg-[#2c2c36] text-neutral-200 text-[11px] font-medium cursor-pointer"
                        >
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveDeliveryVideoFile}
                          className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 text-rose-300 cursor-pointer"
                          title="Remove uploaded video"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {deliveryUploadError && (
                  <p className="text-rose-400 text-[11px] mt-1.5">{deliveryUploadError}</p>
                )}
              </div>
              <div>
                <label className="block text-neutral-300 font-semibold mb-1">Delivery Message to Fan</label>
                <textarea
                  rows={3}
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Add personal notes for the fan with your video delivery..."
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setDeliveringRequest(null);
                  setDeliveryUploadError(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#18181c] text-neutral-300 text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploadingDeliveryVideo || !deliveryVideoUrl}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-bold text-xs cursor-pointer"
              >
                {isUploadingDeliveryVideo ? 'Uploading...' : 'Deliver Video to Conversation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 6: TIP MODAL                                                */}
      {/* ================================================================= */}
      {showTipModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-sm w-full p-5 space-y-4">
            <h4 className="font-semibold text-sm text-white">Send Direct Tip to {recipientCreator.name}</h4>
            <div className="grid grid-cols-4 gap-2">
              {['5', '10', '20', '50'].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors ${
                    tipAmount === amt ? 'bg-[#d4af37] text-black' : 'bg-[#18181c] text-neutral-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-400">Custom Tip ($):</span>
              <input
                type="number"
                min="1"
                value={tipAmount}
                onChange={e => setTipAmount(e.target.value)}
                className="flex-1 bg-[#18181c] border border-[#27272a] rounded-lg px-3 py-1.5 text-white font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowTipModal(false)} className="px-3 py-1.5 text-xs text-neutral-400">
                Cancel
              </button>
              <button
                onClick={handleTipSubmit}
                className="px-4 py-1.5 bg-[#d4af37] text-black font-semibold text-xs rounded-lg cursor-pointer"
              >
                Tip ${parseFloat(tipAmount || '0').toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 7: FULLSCREEN LIGHTBOX FOR UNLOCKED MEDIA                   */}
      {/* ================================================================= */}
      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
        >
          <button
            onClick={() => setLightboxMedia(null)}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <div onClick={e => e.stopPropagation()} className="max-w-4xl max-h-[85vh] flex flex-col items-center">
            {lightboxMedia.type === 'video' ? (
              <video
                src={lightboxMedia.url || '/videos/sample1.mp4'}
                controls
                autoPlay
                onError={(e) => {
                  const el = e.currentTarget;
                  if (!el.src.includes('/videos/sample1.mp4')) {
                    el.src = '/videos/sample1.mp4';
                    el.load();
                  }
                }}
                className="max-h-[78vh] rounded-xl"
              />
            ) : (
              <img src={lightboxMedia.url} alt="" className="max-h-[78vh] object-contain rounded-xl" />
            )}
            {lightboxMedia.title && (
              <p className="text-xs text-neutral-300 mt-3">{lightboxMedia.title}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
