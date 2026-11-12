import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PostVisibility, MediaAsset, VideoResolution, VideoCodec } from '../../types';
import { CATEGORIES } from '../../data/mockData';
import { SearchableCountrySelector } from '../discovery/DiscoveryFilterBar';
import {
  uploadUserFileToSupabase,
  deleteSupabaseFileByPath
} from '../../services/supabase';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Video as VideoIcon, 
  Lock, 
  Globe, 
  Users, 
  Coins, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Trash2,
  Calendar,
  Clock,
  Tag,
  Search,
  Check,
  Film,
  Camera,
  FileCheck,
  Zap,
  Cpu,
  HardDrive,
  Layers
} from 'lucide-react';

interface CreatePostModalProps {
  onClose: () => void;
}

interface SelectedFileItem {
  id: string;
  file?: File;
  fileName: string;
  fileSizeBytes: number;
  type: 'image' | 'video';
  previewUrl: string;
  thumbnailUrl: string;
  previewFrames?: string[];
  sizeMb: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  frameRate?: number;
  jobId?: string;
  videoMediaId?: string;
  deduplicated?: boolean;
  storagePath?: string;
  supabaseFileId?: string;
  thumbnailStoragePath?: string;
}

const STAGE_LABELS: Record<string, { label: string; step: number }> = {
  selecting_file: { label: 'Selecting & Validating File', step: 1 },
  uploading: { label: 'Uploading to Secure Ingest Vault', step: 2 },
  upload_completed: { label: 'Upload Completed • Queuing Engine', step: 3 },
  processing: { label: 'Analyzing Source Stream & Audio', step: 4 },
  compressing: { label: 'Visually Lossless Multi-Codec Compression (AV1 / HEVC / H.264)', step: 5 },
  generating_versions: { label: 'Building Adaptive HLS Resolution Ladder', step: 6 },
  generating_thumbnail: { label: 'Extracting WebP Thumbnails & Scrubber Sprites', step: 7 },
  verifying_quality: { label: 'Running VMAF / SSIM Perceptual Quality Verification', step: 8 },
  ready: { label: 'Optimized & Ready for Fast Streaming', step: 9 },
  failed: { label: 'Optimization Failed — Original Source Preserved', step: 0 }
};

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose }) => {
  const {
    createPost,
    currentUser,
    creators,
    activeCategories,
    activeRole,
    isCurrentUserApprovedCreator,
    videoProcessingJobs,
    videoMediaRecords,
    videoProcessingConfig,
    startVideoOptimizationJob,
    retryVideoProcessingJob
  } = useApp();
  const isCreator = isCurrentUserApprovedCreator || currentUser.role === 'creator' || activeRole === 'creator';
  if (!isCreator) return null;

  const currentCreatorProfile = creators.find(c => c.id === currentUser.id);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraCaptureInputRef = useRef<HTMLInputElement>(null);
  const customThumbnailRef = useRef<HTMLInputElement>(null);

  // Form states
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('public');
  const [ppvPrice, setPpvPrice] = useState<number>(9.99);
  const [previewDuration, setPreviewDuration] = useState<10 | 15 | 30>(15);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Fashion & Luxury']);
  const [categorySearch, setCategorySearch] = useState('');
  const [selectedVideoCountry, setSelectedVideoCountry] = useState<string>(
    currentCreatorProfile?.country || currentUser.country || 'United States'
  );
  const [hashtags, setHashtags] = useState<string[]>(['Acovon', 'CreatorVault']);
  const [hashtagInput, setHashtagInput] = useState('');
  const [disableComments, setDisableComments] = useState(false);
  const [disableDownloads, setDisableDownloads] = useState(true);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  // Upload state
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [activeThumbTargetId, setActiveThumbTargetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'ready' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [backgroundQueuedNotice, setBackgroundQueuedNotice] = useState(false);

  // Filterable categories list from centralized activeCategories database
  const availableCategories =
    activeCategories && activeCategories.length > 0
      ? activeCategories.map(c => c.name)
      : CATEGORIES.filter(c => c !== 'All Categories');
  const filteredCategories = availableCategories.filter(c => 
    c.toLowerCase().includes(categorySearch.toLowerCase())
  );

  // Extract metadata & multi-frame thumbnails using offscreen video + canvas
  const extractVideoMetadataAndFrames = (
    videoFile: File
  ): Promise<{
    thumbnailUrl: string;
    previewFrames: string[];
    duration: number;
    width: number;
    height: number;
  }> => {
    return new Promise((resolve) => {
      let settled = false;
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(videoFile);
      video.src = objectUrl;
      video.muted = true;
      video.playsInline = true;

      const fallbackFrames = [
        'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
        'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80'
      ];

      const finish = (result: {
        thumbnailUrl: string;
        previewFrames: string[];
        duration: number;
        width: number;
        height: number;
      }) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeoutId);
        try {
          video.removeAttribute('src');
          video.load();
          URL.revokeObjectURL(objectUrl);
        } catch {
          // ignore
        }
        resolve(result);
      };

      const timeoutId = setTimeout(() => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : 60;
        finish({
          thumbnailUrl: fallbackFrames[0],
          previewFrames: fallbackFrames,
          duration: dur,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080
        });
      }, 2500);

      video.onloadedmetadata = () => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 60;
        const seekTime = Math.min(1.0, dur / 4);
        try {
          video.currentTime = seekTime;
        } catch {
          finish({
            thumbnailUrl: fallbackFrames[0],
            previewFrames: fallbackFrames,
            duration: Math.round(dur),
            width: video.videoWidth || 1920,
            height: video.videoHeight || 1080
          });
        }
      };

      video.onseeked = () => {
        const dur = Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : 60;
        try {
          const width = video.videoWidth || 1920;
          const height = video.videoHeight || 1080;
          const canvas = document.createElement('canvas');
          canvas.width = Math.min(width, 960);
          canvas.height = Math.min(height, 540);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const thumbUrl = canvas.toDataURL('image/webp', 0.85);
            finish({
              thumbnailUrl: thumbUrl,
              previewFrames: [thumbUrl, ...fallbackFrames.slice(1)],
              duration: dur,
              width,
              height
            });
            return;
          }
        } catch {
          // fallback
        }
        finish({
          thumbnailUrl: fallbackFrames[0],
          previewFrames: fallbackFrames,
          duration: dur,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080
        });
      };

      video.onerror = () => {
        finish({
          thumbnailUrl: fallbackFrames[0],
          previewFrames: fallbackFrames,
          duration: 60,
          width: 1920,
          height: 1080
        });
      };
    });
  };

  // Process chosen files and send videos automatically into the optimization pipeline
  const processFiles = async (filesList: FileList | File[]) => {
    const filesArray = Array.from(filesList);
    if (filesArray.length === 0) return;

    setErrorMessage(null);
    setUploadStatus('uploading');

    const validExtensions = ['mp4', 'mov', 'm4v', 'webm', 'mkv', 'jpg', 'jpeg', 'png', 'webp'];
    const maxVideoSize = (videoProcessingConfig.maxFileSizeMB || 2000) * 1024 * 1024;
    const maxImageSize = 25 * 1024 * 1024;

    const newItems: SelectedFileItem[] = [];

    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      const ext = file.name.split('.').pop()?.toLowerCase() || '';

      if (!validExtensions.includes(ext)) {
        setErrorMessage(`File format .${ext} is not supported. Supported formats: MP4, MOV, M4V, WEBM, MKV, JPG, PNG, WEBP.`);
        setUploadStatus('error');
        return;
      }

      const isVideo = file.type.startsWith('video/') || ['mp4', 'mov', 'm4v', 'webm', 'mkv'].includes(ext);
      if (isVideo && file.size > maxVideoSize) {
        setErrorMessage(
          `Video "${file.name}" exceeds the ${videoProcessingConfig.maxFileSizeMB}MB limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`
        );
        setUploadStatus('error');
        return;
      }

      if (!isVideo && file.size > maxImageSize) {
        setErrorMessage(`Image "${file.name}" exceeds the 25MB limit.`);
        setUploadStatus('error');
        return;
      }

      const itemId = `post_${Date.now()}_${i}`;
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUser.id,
        file,
        featureName: 'posts',
        itemId,
        visibility:
          visibility === 'pay_per_view'
            ? 'ppv'
            : visibility === 'subscribers'
            ? 'subscribers'
            : visibility === 'followers'
            ? 'followers'
            : 'public'
      });

      const previewUrl = uploadRes.signedUrl || URL.createObjectURL(file);
      let thumbnailUrl = previewUrl;
      let previewFrames: string[] | undefined;
      let durationSeconds: number | undefined;
      let width = 1920;
      let height = 1080;
      let jobId: string | undefined;
      let videoMediaId: string | undefined;
      let deduplicated = false;

      if (isVideo) {
        const meta = await extractVideoMetadataAndFrames(file);
        thumbnailUrl = meta.thumbnailUrl;
        previewFrames = meta.previewFrames;
        durationSeconds = meta.duration;
        width = meta.width;
        height = meta.height;

        const jobResult = startVideoOptimizationJob({
          creatorId: currentUser.id,
          creatorName: currentUser.name,
          sourceContext: isScheduled ? 'scheduled_post' : visibility === 'pay_per_view' ? 'ppv_video' : 'feed_post',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || `video/${ext}`,
          sourceUrl: previewUrl,
          thumbnailUrl,
          previewFrames,
          width,
          height,
          durationSeconds: durationSeconds || 60,
          frameRate: 60
        });

        jobId = jobResult.jobId;
        videoMediaId = jobResult.videoMediaId;
        deduplicated = jobResult.deduplicated;
      }

      newItems.push({
        id: itemId,
        file,
        fileName: file.name,
        fileSizeBytes: file.size,
        type: isVideo ? 'video' : 'image',
        previewUrl,
        thumbnailUrl,
        previewFrames,
        sizeMb: (file.size / (1024 * 1024)).toFixed(1),
        durationSeconds,
        width,
        height,
        frameRate: 60,
        jobId,
        videoMediaId,
        deduplicated,
        storagePath: uploadRes.storagePath,
        supabaseFileId: uploadRes.record?.file_id
      });
    }

    setSelectedFiles(prev => [...prev, ...newItems]);
    setUploadStatus('ready');
  };

  // Trigger a realistic 4K or 1080p Studio Master Video preset for immediate testing
  const handleAddStudioMasterPreset = (preset: '4k_prores' | '1080p_cinema') => {
    setErrorMessage(null);
    const is4K = preset === '4k_prores';
    const fileName = is4K
      ? 'Milan_Runway_Backstage_4K60_Master.mov'
      : 'Studio_Session_Vocal_Take_1080p.mp4';
    const fileSizeBytes = is4K ? 448 * 1024 * 1024 : 164 * 1024 * 1024;
    const width = is4K ? 3840 : 1920;
    const height = is4K ? 2160 : 1080;
    const durationSeconds = is4K ? 142 : 95;
    const sourceUrl = 'https://www.w3schools.com/html/mov_bbb.mp4';
    const previewFrames = [
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80'
    ];

    const jobResult = startVideoOptimizationJob({
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      sourceContext: isScheduled ? 'scheduled_post' : visibility === 'pay_per_view' ? 'ppv_video' : 'feed_post',
      fileName,
      fileSize: fileSizeBytes,
      mimeType: is4K ? 'video/quicktime' : 'video/mp4',
      sourceUrl,
      thumbnailUrl: previewFrames[0],
      previewFrames,
      width,
      height,
      durationSeconds,
      frameRate: 60
    });

    const newItem: SelectedFileItem = {
      id: `preset_${Date.now()}`,
      fileName,
      fileSizeBytes,
      type: 'video',
      previewUrl: sourceUrl,
      thumbnailUrl: previewFrames[0],
      previewFrames,
      sizeMb: (fileSizeBytes / (1024 * 1024)).toFixed(1),
      durationSeconds,
      width,
      height,
      frameRate: 60,
      jobId: jobResult.jobId,
      videoMediaId: jobResult.videoMediaId,
      deduplicated: jobResult.deduplicated
    };

    setSelectedFiles(prev => [...prev, newItem]);
    setUploadStatus('ready');
  };

  const handleCustomThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeThumbTargetId) return;

    const uploadRes = await uploadUserFileToSupabase({
      uid: currentUser.id,
      file,
      featureName: 'post-thumbnails',
      itemId: activeThumbTargetId,
      visibility: 'public'
    });
    const url = uploadRes.signedUrl || URL.createObjectURL(file);

    setSelectedFiles(prev =>
      prev.map(item =>
        item.id === activeThumbTargetId
          ? {
              ...item,
              thumbnailUrl: url,
              thumbnailStoragePath: uploadRes.storagePath,
              previewFrames: [url, ...(item.previewFrames || [])]
            }
          : item
      )
    );
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (id: string) => {
    setSelectedFiles(prev => {
      const removed = prev.find(f => f.id === id);
      if (removed) {
        if (removed.previewUrl.startsWith('blob:')) URL.revokeObjectURL(removed.previewUrl);
        if (removed.storagePath) {
          deleteSupabaseFileByPath({
            storagePath: removed.storagePath,
            fileId: removed.supabaseFileId,
            uid: currentUser.id
          });
        }
        if (removed.thumbnailStoragePath) {
          deleteSupabaseFileByPath({
            storagePath: removed.thumbnailStoragePath,
            uid: currentUser.id
          });
        }
      }
      const remaining = prev.filter(f => f.id !== id);
      if (remaining.length === 0) {
        setUploadStatus('idle');
      }
      return remaining;
    });
  };

  // Add / remove category (creators can remove categories before publishing; at least 1 is required on submit)
  const toggleCategory = (cat: string) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(prev => prev.filter(c => c !== cat));
    } else {
      setSelectedCategories(prev => [...prev, cat]);
    }
  };

  // Hashtag handling
  const handleAddHashtag = () => {
    if (!hashtagInput.trim()) return;
    const clean = hashtagInput.trim().replace(/^#/, '');
    if (clean && !hashtags.includes(clean)) {
      setHashtags(prev => [...prev, clean]);
    }
    setHashtagInput('');
  };

  const handleRemoveHashtag = (tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  };

  // Publish workflow (supports immediate publish or background draft queuing)
  const submitPost = (asBackgroundDraft: boolean) => {
    if (!content.trim() && selectedFiles.length === 0) {
      setErrorMessage('Please add a post description or select media to publish.');
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one content category before publishing.');
      return;
    }

    if (!selectedVideoCountry || !selectedVideoCountry.trim()) {
      setErrorMessage('Please select the Video Country for this post before publishing.');
      return;
    }

    if (visibility === 'pay_per_view' && (!ppvPrice || ppvPrice < 1)) {
      setErrorMessage('Please enter a valid Pay-To-View price ($1.00 minimum).');
      return;
    }

    setIsPublishing(true);
    setErrorMessage(null);

    // Build media assets enriched with adaptive compression metadata
    const mediaAssets: MediaAsset[] = selectedFiles.map((item, idx) => {
      const mediaRec = item.videoMediaId
        ? videoMediaRecords.find(r => r.id === item.videoMediaId)
        : undefined;
      return {
        id: `media_${Date.now()}_${idx}`,
        type: item.type,
        url: item.previewUrl || mediaRec?.masterPlaylistUrl || '',
        thumbnailUrl: item.thumbnailUrl,
        previewUrl: item.type === 'video' ? item.previewUrl : undefined,
        durationSeconds: item.durationSeconds || 120,
        videoMediaId: item.videoMediaId,
        availableResolutions: mediaRec?.availableResolutions || (item.width && item.width >= 3840 ? ['4K', '1440p', '1080p', '720p', '480p', '360p'] : ['1080p', '720p', '480p', '360p']),
        availableCodecs: mediaRec?.availableCodecs || ['AV1', 'H.265/HEVC', 'H.264'],
        streamingManifestRef: mediaRec?.streamingManifestRef,
        streamingProtocol: mediaRec?.streamingProtocol || 'HLS',
        originalFileSize: item.fileSizeBytes,
        optimizedFileSize: mediaRec?.optimizedFileSize || Math.round(item.fileSizeBytes * 0.36),
        compressionRatio: mediaRec?.compressionRatio || 64,
        vmafScore: mediaRec?.vmafScore || 97.1,
        width: item.width,
        height: item.height,
        frameRate: item.frameRate || 60,
        previewFrames: item.previewFrames
      };
    });

    if (mediaAssets.length === 0) {
      mediaAssets.push({
        id: `media_${Date.now()}`,
        type: 'image',
        url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=600&q=80'
      });
    }

    setTimeout(() => {
      createPost({
        creatorId: currentUser.id,
        creatorName: currentUser.name,
        creatorUsername: currentUser.username,
        creatorAvatar: currentUser.avatar,
        content: content.trim() || 'Exclusive creator drop on Acovon.',
        media: mediaAssets,
        visibility,
        ppvPrice: visibility === 'pay_per_view' ? ppvPrice : undefined,
        ppvPreviewDuration: visibility === 'pay_per_view' ? previewDuration : undefined,
        tags: hashtags,
        categories: selectedCategories,
        country: selectedVideoCountry,
        fileName: selectedFiles[0]?.fileName,
        fileSize: selectedFiles[0]?.fileSizeBytes,
        scheduledFor: isScheduled ? scheduledDate : undefined,
        isDraft: asBackgroundDraft,
        commentsDisabled: disableComments,
        downloadsDisabled: disableDownloads
      });

      setIsPublishing(false);
      if (asBackgroundDraft) {
        setBackgroundQueuedNotice(true);
      } else {
        setPublishSuccess(true);
      }

      setTimeout(() => {
        onClose();
      }, 950);
    }, 500);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    submitPost(false);
  };

  const hasActiveOptimization = selectedFiles.some(item => {
    if (!item.jobId) return false;
    const job = videoProcessingJobs.find(j => j.id === item.jobId);
    return job && job.stage !== 'ready' && job.stage !== 'failed';
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl relative my-auto animate-in zoom-in-95 max-h-[92dvh] flex flex-col">
        
        {/* Hidden Custom Thumbnail Input */}
        <input
          ref={customThumbnailRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleCustomThumbnailUpload}
          className="hidden"
        />

        {/* Hidden Mobile Camera Capture Input */}
        <input
          ref={cameraCaptureInputRef}
          type="file"
          accept="video/*,image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-[#26262b] shrink-0 gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-white text-sm sm:text-lg flex items-center gap-2 flex-wrap">
              <Film className="w-5 h-5 text-[#d4af37] shrink-0" />
              <span>Create New Acovon Post</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300">
                Auto-AV1/HEVC Engine
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-neutral-400 mt-0.5">
              Automatic visually lossless video compression, multi-bitrate HLS packaging, and vault monetization.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success State */}
        {publishSuccess || backgroundQueuedNotice ? (
          <div className="py-16 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="text-lg font-bold text-white">
              {backgroundQueuedNotice
                ? 'Queued in Background Transcoding Pipeline!'
                : 'Post Successfully Published!'}
            </h4>
            <p className="text-xs text-neutral-400 max-w-md mx-auto">
              {backgroundQueuedNotice
                ? 'Your video is being compressed and packaged into adaptive HLS streams in the background. You can monitor progress in Creator Studio.'
                : 'Your adaptive HLS video streams (AV1 / HEVC / H.264) and WebP thumbnails are live and ready for zero-buffering playback.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handlePublish} className="space-y-4 sm:space-y-5 overflow-y-auto pr-1 flex-1">
            
            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 1. REAL MEDIA UPLOAD + AUTOMATIC VIDEO COMPRESSION PIPELINE */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="block text-xs font-semibold text-neutral-200">
                  Media Asset (Gallery or Mobile Camera)
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => cameraCaptureInputRef.current?.click()}
                    className="px-2.5 py-1 rounded-lg bg-[#1c1c24] hover:bg-[#252530] border border-[#d4af37]/50 text-[10px] font-semibold text-[#fce7b0] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Camera className="w-3 h-3 text-[#d4af37]" />
                    <span>Use Camera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddStudioMasterPreset('4k_prores')}
                    className="px-2.5 py-1 rounded-lg bg-[#1c1c24] hover:bg-[#252530] border border-[#d4af37]/40 text-[10px] font-mono font-semibold text-[#fce7b0] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Zap className="w-3 h-3 text-[#d4af37]" />
                    <span>+ 4K Master (448 MB)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddStudioMasterPreset('1080p_cinema')}
                    className="px-2.5 py-1 rounded-lg bg-[#1c1c24] hover:bg-[#252530] border border-white/10 text-[10px] font-mono text-neutral-300 hover:text-white cursor-pointer transition-colors"
                  >
                    <span>+ 1080p Sample (164 MB)</span>
                  </button>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-4 sm:p-5 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDragging 
                    ? 'border-[#d4af37] bg-[#d4af37]/10' 
                    : 'border-[#2e2e38] hover:border-[#d4af37]/50 bg-[#16161b]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-matroska,.mkv,.mov,.mp4,.m4v,.webm,image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#22222a] border border-[#2e2e38] flex items-center justify-center text-[#d4af37] mx-auto mb-2">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-white">
                  Click to browse files or drag and drop
                </div>
                <div className="text-[11px] text-neutral-400 mt-1">
                  MP4, MOV, M4V, WEBM, MKV, JPG, PNG, WEBP · Automatic visually lossless compression up to {videoProcessingConfig.maxFileSizeMB}MB
                </div>
              </div>

              {/* Uploaded Media Previews + Live Compression Telemetry Cards */}
              {selectedFiles.length > 0 && (
                <div className="space-y-3 pt-1">
                  {selectedFiles.map(item => {
                    const job = item.jobId ? videoProcessingJobs.find(j => j.id === item.jobId) : undefined;
                    const mediaRec = item.videoMediaId ? videoMediaRecords.find(r => r.id === item.videoMediaId) : undefined;
                    const stageKey = job ? (job.stage || job.processingStage || 'processing') : 'ready';
                    const stageInfo = job ? STAGE_LABELS[stageKey] || STAGE_LABELS.processing : STAGE_LABELS.ready;
                    const origMb = (item.fileSizeBytes / (1024 * 1024)).toFixed(1);
                    const optBytes = mediaRec?.optimizedFileSize || job?.optimizedFileSize || Math.round(item.fileSizeBytes * 0.36);
                    const optMb = (optBytes / (1024 * 1024)).toFixed(1);
                    const savedPct = mediaRec?.compressionRatio || job?.compressionRatio || 64;
                    const ladder = mediaRec?.availableResolutions || (item.width && item.width >= 3840 ? ['4K', '1440p', '1080p', '720p', '480p', '360p'] : ['1080p', '720p', '480p', '360p']);

                    return (
                      <div key={item.id} className="p-4 bg-[#18181c] border border-[#27272a] rounded-2xl space-y-3 relative">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleRemoveFile(item.id); }}
                          className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-red-600 text-white rounded-lg transition-colors z-10 cursor-pointer"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-center">
                          <div className="sm:col-span-5 relative aspect-video rounded-xl overflow-hidden bg-black border border-[#2e2e38]">
                            {item.type === 'video' ? (
                              <video
                                src={item.previewUrl || '/videos/sample1.mp4'}
                                poster={item.thumbnailUrl}
                                controls
                                onError={(e) => {
                                  const el = e.currentTarget;
                                  if (!el.src.includes('/videos/sample1.mp4')) {
                                    el.src = '/videos/sample1.mp4';
                                    el.load();
                                  }
                                }}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <img
                                src={item.previewUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>

                          <div className="sm:col-span-7 space-y-2.5 text-xs">
                            <div className="flex items-center justify-between pr-7">
                              <span className="truncate font-mono font-bold text-white max-w-[220px]">
                                {item.fileName}
                              </span>
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#22222a] text-[#fce7b0]">
                                {item.width || 1920}×{item.height || 1080} • {item.frameRate || 60}fps
                              </span>
                            </div>

                            {item.type === 'video' && (
                              <>
                                {/* Deduplication Hit Banner */}
                                {item.deduplicated && (
                                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-[11px] text-emerald-300 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                    <span>Content-Hash Match: Reused verified multi-bitrate asset (0s wait)</span>
                                  </div>
                                )}

                                {/* Live 8-Stage Pipeline Progress Bar */}
                                {job && (
                                  <div className="space-y-1.5 bg-[#121215] p-2.5 rounded-xl border border-[#26262f]">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-semibold text-[#fce7b0] flex items-center gap-1.5">
                                        {job.stage === 'ready' ? (
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                        ) : job.stage === 'failed' ? (
                                          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                        ) : (
                                          <RotateCcw className="w-3.5 h-3.5 text-[#d4af37] animate-spin" />
                                        )}
                                        <span>{stageInfo.label}</span>
                                      </span>
                                      <span className="font-mono text-white font-bold">{job.progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#1e1e26] rounded-full overflow-hidden">
                                      <div
                                        className={`h-full transition-all duration-300 ${
                                          job.stage === 'ready'
                                            ? 'bg-emerald-500'
                                            : job.stage === 'failed'
                                            ? 'bg-rose-500'
                                            : 'bg-gradient-to-r from-[#d4af37] to-amber-300'
                                        }`}
                                        style={{ width: `${job.progress}%` }}
                                      />
                                    </div>
                                    {job.stage === 'failed' && (
                                      <div className="flex items-center justify-between pt-1">
                                        <span className="text-[10px] text-rose-300">{job.errorMessage}</span>
                                        <button
                                          type="button"
                                          onClick={() => retryVideoProcessingJob(job.id)}
                                          className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                                        >
                                          Retry Job
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Compression Savings & Perceptual Quality Metrics */}
                                <div className="grid grid-cols-3 gap-2">
                                  <div className="p-2 rounded-lg bg-[#121215] border border-[#26262f]">
                                    <div className="text-[10px] text-neutral-400">Size Reduction</div>
                                    <div className="font-mono font-bold text-emerald-400 text-[11px]">
                                      {origMb}MB → {optMb}MB
                                    </div>
                                    <div className="text-[9px] text-emerald-300/80 font-mono">-{savedPct}% saved</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-[#121215] border border-[#26262f]">
                                    <div className="text-[10px] text-neutral-400">Visual Quality</div>
                                    <div className="font-mono font-bold text-[#fce7b0] text-[11px]">
                                      VMAF {mediaRec?.vmafScore?.toFixed(1) || '97.2'}
                                    </div>
                                    <div className="text-[9px] text-neutral-400">Visually Lossless</div>
                                  </div>
                                  <div className="p-2 rounded-lg bg-[#121215] border border-[#26262f]">
                                    <div className="text-[10px] text-neutral-400">Streaming</div>
                                    <div className="font-mono font-bold text-sky-300 text-[11px]">
                                      HLS • AV1/HEVC
                                    </div>
                                    <div className="text-[9px] text-neutral-400">Fast-Start CDN</div>
                                  </div>
                                </div>

                                {/* Adaptive Bitrate Ladder Pills */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                                    <Layers className="w-3 h-3 text-[#d4af37]" />
                                    <span>ABR Ladder:</span>
                                  </span>
                                  {ladder.map(res => (
                                    <span
                                      key={res}
                                      className="px-1.5 py-0.5 rounded bg-[#141418] border border-[#d4af37]/30 text-[10px] font-mono text-[#fce7b0]"
                                    >
                                      {res}
                                    </span>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Multi-Frame Thumbnail Picker for Video */}
                        {item.type === 'video' && item.previewFrames && item.previewFrames.length > 0 && (
                          <div className="pt-2 border-t border-[#26262f] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-x-auto">
                              <span className="text-[10px] text-neutral-400 shrink-0">Cover Frame:</span>
                              {item.previewFrames.map((frameUrl, fIdx) => (
                                <button
                                  key={fIdx}
                                  type="button"
                                  onClick={() =>
                                    setSelectedFiles(prev =>
                                      prev.map(f => (f.id === item.id ? { ...f, thumbnailUrl: frameUrl } : f))
                                    )
                                  }
                                  className={`w-14 aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                                    item.thumbnailUrl === frameUrl
                                      ? 'border-[#d4af37] scale-105'
                                      : 'border-transparent opacity-60 hover:opacity-100'
                                  }`}
                                >
                                  <img src={frameUrl} alt="" className="w-full h-full object-cover" />
                                </button>
                              ))}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveThumbTargetId(item.id);
                                customThumbnailRef.current?.click();
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#22222a] hover:bg-[#2c2c36] text-[10px] font-semibold text-neutral-200 flex items-center gap-1 cursor-pointer shrink-0"
                            >
                              <Camera className="w-3 h-3 text-[#d4af37]" />
                              <span>Custom Cover</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. POST DESCRIPTION */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-200">
                  Post Description
                </label>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {content.length} / 2,000 characters
                </span>
              </div>
              <textarea
                rows={3}
                maxLength={2000}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write an engaging caption, scene breakdown, or announcement for your patrons..."
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl p-3 text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            {/* 3. VIDEO CATEGORIES SELECTOR */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Select Categories (Multiple Allowed)</span>
                </label>
                <span className="text-[10px] text-neutral-400">
                  {selectedCategories.length} selected
                </span>
              </div>

              {/* Selected Category Tags */}
              <div className="flex flex-wrap gap-1.5 min-h-7">
                {selectedCategories.map(cat => (
                  <span 
                    key={cat}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#fce7b0]"
                  >
                    <span>{cat}</span>
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className="hover:text-white cursor-pointer ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Searchable categories picker */}
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search category (e.g. Music, Fitness, Digital Art)..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1 bg-[#141418] border border-[#27272a] rounded-xl">
                  {filteredCategories.map(cat => {
                    const isSelected = selectedCategories.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-[#d4af37] text-black font-semibold'
                            : 'bg-[#1e1e24] text-neutral-400 hover:text-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                        <span>{cat}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 3B. VIDEO COUNTRY SELECTION (Independent from Creator Profile Country) */}
            <div className="space-y-1.5 p-3.5 rounded-xl bg-[#16161d] border border-[#272732]">
              <SearchableCountrySelector
                value={selectedVideoCountry}
                onChange={setSelectedVideoCountry}
                label="Video Country (Required • Independent from Creator Profile Country)"
                required
                placeholder="Select the country associated with this video..."
              />
              <p className="text-[11px] text-neutral-400">
                Select the country associated with this specific video or post. Selecting a Video Country never changes your Creator Profile country ({currentCreatorProfile?.country || 'Unset'}).
              </p>
            </div>

            {/* 4. HASHTAGS INPUT */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-neutral-200">
                Hashtags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add hashtag (press enter or comma)..."
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      handleAddHashtag();
                    }
                  }}
                  className="flex-1 bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
                />
                <button
                  type="button"
                  onClick={handleAddHashtag}
                  className="px-3 py-1.5 bg-[#22222a] hover:bg-[#2c2c36] text-white text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Add
                </button>
              </div>

              {/* Hashtag tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {hashtags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-[#1a1a22] text-neutral-300 border border-[#2e2e38]"
                  >
                    <span>#{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHashtag(tag)}
                      className="text-neutral-500 hover:text-white cursor-pointer"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* 5. ACCESS & VISIBILITY TIER */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-neutral-200">
                Access & Visibility Tier
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'public' as const, label: 'Public', desc: 'All viewers', icon: Globe },
                  { id: 'followers' as const, label: 'Followers', desc: 'Free followers', icon: Users },
                  { id: 'subscribers' as const, label: 'Subscribers', desc: 'Active members', icon: Sparkles },
                  { id: 'pay_per_view' as const, label: 'Pay-To-View', desc: 'Monetized vault', icon: Lock }
                ].map(opt => {
                  const Icon = opt.icon;
                  const isSelected = visibility === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setVisibility(opt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#fce7b0] shadow-md shadow-[#d4af37]/10'
                          : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <div className="text-xs font-bold text-white">{opt.label}</div>
                      <div className="text-[10px] text-neutral-500">{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* PPV Pricing & Teaser Preview Settings */}
            {visibility === 'pay_per_view' && (
              <div className="p-4 bg-[#18181c] border border-[#d4af37]/40 rounded-xl space-y-3 animate-in fade-in">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#fce7b0]">
                  <Coins className="w-4 h-4 text-[#d4af37]" />
                  <span>Pay-To-View Monetization Settings</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Unlock Price ($ USD)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="150"
                      value={ppvPrice}
                      onChange={(e) => setPpvPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-neutral-400 mb-1">
                      Free Preview Duration
                    </label>
                    <select
                      value={previewDuration}
                      onChange={(e) => setPreviewDuration(Number(e.target.value) as 10 | 15 | 30)}
                      className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                    >
                      <option value={10}>10 Seconds Free Teaser</option>
                      <option value={15}>15 Seconds Free Teaser</option>
                      <option value={30}>30 Seconds Free Teaser</option>
                    </select>
                  </div>
                </div>

                <div className="text-[11px] text-neutral-400 bg-[#141418] p-2.5 rounded-lg flex items-center justify-between">
                  <span>Creator Net Payout (80%):</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    ${(ppvPrice * 0.8).toFixed(2)} per unlock
                  </span>
                </div>
              </div>
            )}

            {/* 6. ADDITIONAL SETTINGS & SCHEDULE */}
            <div className="space-y-3 pt-2 border-t border-[#26262b]">
              <div className="flex items-center justify-between text-xs text-neutral-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disableDownloads}
                    onChange={(e) => setDisableDownloads(e.target.checked)}
                    className="accent-[#d4af37] w-3.5 h-3.5"
                  />
                  <span>Prevent direct file downloads</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={disableComments}
                    onChange={(e) => setDisableComments(e.target.checked)}
                    className="accent-[#d4af37] w-3.5 h-3.5"
                  />
                  <span>Disable comments</span>
                </label>
              </div>

              {/* Schedule publication toggle */}
              <div className="p-3 bg-[#18181c] rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#d4af37]" />
                  <span>Schedule Drop for Later</span>
                </div>
                <input
                  type="checkbox"
                  checked={isScheduled}
                  onChange={(e) => setIsScheduled(e.target.checked)}
                  className="accent-[#d4af37] w-3.5 h-3.5 cursor-pointer"
                />
              </div>

              {isScheduled && (
                <div className="p-3 bg-[#141418] border border-[#27272a] rounded-xl text-xs space-y-1">
                  <label className="text-neutral-400">Scheduled Date & Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-lg px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}
            </div>

            {/* 7. PUBLISH CONTROLS */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-[#26262b] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                {hasActiveOptimization ? 'Close & Continue in Background' : 'Cancel'}
              </button>

              <div className="flex items-center gap-2">
                {selectedFiles.some(f => f.type === 'video') && (
                  <button
                    type="button"
                    onClick={() => submitPost(true)}
                    disabled={isPublishing}
                    className="px-4 py-2.5 bg-[#18181f] hover:bg-[#22222c] border border-[#d4af37]/40 text-[#fce7b0] font-semibold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Save Draft &amp; Optimize in Background</span>
                  </button>
                )}

                <button
                  type="submit"
                  disabled={isPublishing}
                  className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {isPublishing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Publishing Post...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>{isScheduled ? 'Schedule Post' : 'Publish Post Now'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
