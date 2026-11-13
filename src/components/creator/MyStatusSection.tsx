import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, Image as ImageIcon, Video as VideoIcon, Type, 
  Trash2, Eye, Heart, Clock, Sparkles, Check, 
  Upload, Users, Shield, Lock, Globe, AlertCircle, RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreatorStatus, StatusAudience } from '../../types';
import {
  uploadUserFileToSupabase,
  deleteSupabaseFileByPath
} from '../../services/supabase';

interface MyStatusSectionProps {
  onOpenViewer?: (creatorId: string) => void;
  initialTab?: 'manage' | 'create' | 'archive';
  tabRequestKey?: number;
}

const TEXT_GRADIENTS = [
  { id: 'gold', label: 'Noir Gold', value: 'linear-gradient(135deg, #1f1205 0%, #997819 100%)' },
  { id: 'emerald', label: 'Emerald Velvet', value: 'linear-gradient(135deg, #041f14 0%, #059669 100%)' },
  { id: 'royal', label: 'Royal Amethyst', value: 'linear-gradient(135deg, #1e0936 0%, #7c3aed 100%)' },
  { id: 'sunset', label: 'Sunset Amber', value: 'linear-gradient(135deg, #380d0d 0%, #ea580c 100%)' },
  { id: 'carbon', label: 'Carbon Night', value: 'linear-gradient(135deg, #09090b 0%, #27272a 100%)' },
  { id: 'ocean', label: 'Deep Abyss', value: 'linear-gradient(135deg, #081d33 0%, #0284c7 100%)' }
];

const DEMO_PRESET_PHOTOS = [
  { label: 'Backstage Fitting', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=900' },
  { label: 'Studio Audio Deck', url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900' },
  { label: 'High Altitude Trail', url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=900' },
  { label: 'Met Gala Afterparty', url: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=900' }
];

const DEMO_PRESET_VIDEOS = [
  { 
    label: 'Runway Teaser (0:15)', 
    url: '/videos/sample1.mp4', 
    thumb: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900' 
  },
  { 
    label: 'Studio Rehearsal (0:12)', 
    url: '/videos/sample2.mp4', 
    thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=900' 
  }
];

export const MyStatusSection: React.FC<MyStatusSectionProps> = ({
  onOpenViewer,
  initialTab,
  tabRequestKey
}) => {
  const { 
    currentUser, 
    statuses, 
    getActiveCreatorStatuses, 
    publishStatus, 
    deleteStatus 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'manage' | 'create' | 'archive'>(initialTab || 'manage');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, tabRequestKey]);
  
  // Create Status Form State
  const [contentType, setContentType] = useState<'photo' | 'video' | 'text'>('photo');
  const [caption, setCaption] = useState<string>('');
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [backgroundColor, setBackgroundColor] = useState<string>(TEXT_GRADIENTS[0].value);
  const [mediaUrl, setMediaUrl] = useState<string>(DEMO_PRESET_PHOTOS[0].url);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [audience, setAudience] = useState<StatusAudience>('public');
  const [selectedTierId, setSelectedTierId] = useState<string>('');
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string>('');
  const [publishErrorMsg, setPublishErrorMsg] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [selectedViewerStatusId, setSelectedViewerStatusId] = useState<string | null>(null);
  const [pendingStoragePath, setPendingStoragePath] = useState<string | null>(null);
  const [statusStorageMap, setStatusStorageMap] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(`acovon_status_storage_map_${currentUser.id}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Active statuses for this creator
  const activeStatuses = getActiveCreatorStatuses(currentUser.id);
  const archivedStatuses = statuses.filter(s => s.creatorId === currentUser.id && (s.isArchived || new Date(s.expiresAt).getTime() <= Date.now()));

  // Handle file upload to Supabase Storage ("app-files")
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Remove previous staged upload if user picks another file before publishing
    if (pendingStoragePath) {
      await deleteSupabaseFileByPath({ storagePath: pendingStoragePath, uid: currentUser.id });
      setPendingStoragePath(null);
    }

    const tempStatusId = `status_${Date.now()}`;

    if (file.type.startsWith('image/')) {
      setContentType('photo');
      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUser.id,
        file,
        featureName: 'statuses',
        itemId: tempStatusId,
        visibility: audience === 'public' ? 'public' : audience === 'followers' ? 'followers' : 'subscribers'
      });
      if (uploadRes.signedUrl) {
        setMediaUrl(uploadRes.signedUrl);
      }
      if (uploadRes.storagePath) {
        setPendingStoragePath(uploadRes.storagePath);
      }
    } else if (file.type.startsWith('video/')) {
      setContentType('video');
      const videoObjectUrl = URL.createObjectURL(file);
      // Generate initial thumbnail from canvas
      const vid = document.createElement('video');
      vid.src = videoObjectUrl;
      vid.crossOrigin = 'anonymous';
      vid.currentTime = 0.5;
      vid.onloadeddata = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = vid.videoWidth || 640;
          canvas.height = vid.videoHeight || 360;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
            setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.8));
          }
        } catch {
          setThumbnailUrl('https://images.unsplash.com/photo-1509631179647-0177331693ae?w=900');
        }
      };

      const uploadRes = await uploadUserFileToSupabase({
        uid: currentUser.id,
        file,
        featureName: 'statuses',
        itemId: tempStatusId,
        visibility: audience === 'public' ? 'public' : audience === 'followers' ? 'followers' : 'subscribers'
      });
      setMediaUrl(uploadRes.signedUrl || videoObjectUrl);
      if (uploadRes.storagePath) {
        setPendingStoragePath(uploadRes.storagePath);
      }
    }
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    setPublishErrorMsg('');
    setIsPublishing(true);

    if (contentType === 'text' && !textOverlay.trim()) {
      setPublishErrorMsg('Please enter text for your status.');
      setIsPublishing(false);
      return;
    }

    if (contentType !== 'text' && !mediaUrl) {
      setPublishErrorMsg('Please select or upload media for your status.');
      setIsPublishing(false);
      return;
    }

    const res = publishStatus({
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      creatorUsername: currentUser.username,
      creatorAvatar: currentUser.avatar,
      type: contentType,
      mediaUrl: contentType === 'text' ? undefined : mediaUrl,
      thumbnailUrl: contentType === 'video' ? (thumbnailUrl || mediaUrl) : undefined,
      caption: caption.trim() || undefined,
      textOverlay: contentType === 'text' ? textOverlay.trim() : undefined,
      backgroundColor: contentType === 'text' ? backgroundColor : undefined,
      audience,
      allowedTierId: audience === 'tier_specific' ? selectedTierId : undefined
    });

    setIsPublishing(false);
    if (res.success) {
      if (pendingStoragePath && res.status?.id) {
        const nextMap = { ...statusStorageMap, [res.status.id]: pendingStoragePath };
        setStatusStorageMap(nextMap);
        try {
          localStorage.setItem(`acovon_status_storage_map_${currentUser.id}`, JSON.stringify(nextMap));
        } catch {
          // ignore
        }
        setPendingStoragePath(null);
      }
      setPublishSuccessMsg('Status published! It is now live for 24 hours on the home stories feed.');
      // Reset form
      setTextOverlay('');
      setCaption('');
      setTimeout(() => {
        setPublishSuccessMsg('');
        setActiveTab('manage');
      }, 1500);
    }
  };

  const formatHoursLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">Creator Stories & Status</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold">
              24-Hour Moments
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Share immediate backstage updates, photos, short clips, and thoughts directly with your fans and VIP subscribers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeStatuses.length > 0 && onOpenViewer && (
            <button
              onClick={() => onOpenViewer(currentUser.id)}
              className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition border border-neutral-700 cursor-pointer"
            >
              <Eye className="w-4 h-4" />
              <span>Preview My Story</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-semibold text-xs flex items-center gap-1.5 transition shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Status</span>
          </button>
        </div>
      </div>

      {/* Navigation Pill Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'manage' 
              ? 'bg-amber-400 text-black' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          Active Statuses ({activeStatuses.length})
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'create' 
              ? 'bg-amber-400 text-black' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          Create Status
        </button>
        <button
          onClick={() => setActiveTab('archive')}
          className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'archive' 
              ? 'bg-amber-400 text-black' 
              : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60'
          }`}
        >
          Archive & Past Stories ({archivedStatuses.length})
        </button>
      </div>

      {/* TAB 1: MANAGE ACTIVE STATUSES */}
      {activeTab === 'manage' && (
        <div className="space-y-4">
          {activeStatuses.length === 0 ? (
            <div className="p-6 sm:p-8 text-center rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">No Active Status Updates</h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                Keep your audience engaged. Creators with active stories appear at the top of the home feed in a highlighted gold ring.
              </p>
              <button
                onClick={() => setActiveTab('create')}
                className="mt-2 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Post Your First Status</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 3xl:grid-cols-4 gap-4">
              {activeStatuses.map((st) => (
                <div 
                  key={st.id} 
                  className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-lg flex flex-col justify-between"
                >
                  {/* Status Preview Card */}
                  <div className="relative aspect-[9/12] w-full bg-black overflow-hidden flex items-center justify-center">
                    {st.type === 'text' ? (
                      <div 
                        className="w-full h-full p-6 flex flex-col items-center justify-center text-center text-white"
                        style={{ background: st.backgroundColor || 'linear-gradient(135deg, #1f1205 0%, #997819 100%)' }}
                      >
                        <p className="text-lg font-serif italic drop-shadow-md">
                          "{st.textOverlay || st.caption}"
                        </p>
                      </div>
                    ) : st.type === 'video' ? (
                      <div className="w-full h-full relative">
                        <img 
                          src={st.thumbnailUrl || st.mediaUrl} 
                          alt="Video thumbnail"
                          className="w-full h-full object-cover opacity-80"
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center">
                            <VideoIcon className="w-5 h-5" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={st.mediaUrl} 
                        alt={st.caption || 'Photo status'}
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Top Badges */}
                    <div className="absolute top-2.5 inset-x-2.5 flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-white font-medium text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        <span>{formatHoursLeft(st.expiresAt)}</span>
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold text-[10px]">
                        {st.audience === 'public' ? 'Public' : st.audience === 'followers' ? 'Followers' : 'Subscribers'}
                      </span>
                    </div>

                    {/* Caption Overlay */}
                    {st.caption && st.type !== 'text' && (
                      <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black via-black/70 to-transparent text-white text-xs">
                        <p className="line-clamp-2">{st.caption}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Stats & Actions */}
                  <div className="p-3 bg-neutral-900 border-t border-neutral-800 space-y-2">
                    <div className="flex items-center justify-between text-xs text-neutral-300">
                      <button
                        onClick={() => setSelectedViewerStatusId(selectedViewerStatusId === st.id ? null : st.id)}
                        className="flex items-center gap-1.5 hover:text-amber-400 font-medium"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>{st.uniqueViews?.length || st.viewsCount || 0} unique viewers</span>
                      </button>

                      <div className="flex items-center gap-1 text-rose-400">
                        <Heart className="w-3.5 h-3.5 fill-current" />
                        <span>{st.reactions?.length || 0}</span>
                      </div>
                    </div>

                    {/* Unique Viewers Dropdown Preview */}
                    {selectedViewerStatusId === st.id && (
                      <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700 space-y-1.5 text-xs">
                        <div className="font-semibold text-[11px] text-neutral-300">Audience who viewed this:</div>
                        {(!st.uniqueViews || st.uniqueViews.length === 0) ? (
                          <div className="text-[11px] text-neutral-500">No viewers yet</div>
                        ) : (
                          <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                            {st.uniqueViews.map(uv => (
                              <div key={uv.userId} className="flex items-center justify-between text-[11px]">
                                <span className="text-neutral-200">{uv.userName}</span>
                                <span className="text-neutral-500 text-[10px]">{new Date(uv.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {onOpenViewer && (
                        <button
                          onClick={() => onOpenViewer(currentUser.id)}
                          className="text-xs text-amber-400 hover:underline font-semibold cursor-pointer"
                        >
                          View in Player
                        </button>
                      )}

                      {confirmDeleteId === st.id ? (
                        <div className="flex items-center gap-1.5 ml-auto">
                          <button
                            onClick={async () => {
                              const storagePath = statusStorageMap[st.id];
                              if (storagePath) {
                                await deleteSupabaseFileByPath({ storagePath, uid: currentUser.id });
                                const nextMap = { ...statusStorageMap };
                                delete nextMap[st.id];
                                setStatusStorageMap(nextMap);
                                try {
                                  localStorage.setItem(`acovon_status_storage_map_${currentUser.id}`, JSON.stringify(nextMap));
                                } catch {
                                  // ignore
                                }
                              }
                              deleteStatus(st.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-neutral-800 text-neutral-300 text-[11px] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(st.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition cursor-pointer ml-auto"
                          title="Delete status"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CREATE STATUS */}
      {activeTab === 'create' && (
        <form onSubmit={handlePublish} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 sm:p-6 space-y-5 sm:space-y-6">
          {publishErrorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{publishErrorMsg}</span>
            </div>
          )}
          {publishSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{publishSuccessMsg}</span>
            </div>
          )}

          {/* Step 1: Format Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              1. Choose Status Format
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setContentType('photo')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  contentType === 'photo' 
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300' 
                    : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">Photo</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('video')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  contentType === 'video' 
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300' 
                    : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white'
                }`}
              >
                <VideoIcon className="w-5 h-5" />
                <span className="text-xs font-semibold">Short Video</span>
              </button>

              <button
                type="button"
                onClick={() => setContentType('text')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition ${
                  contentType === 'text' 
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300' 
                    : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400 hover:text-white'
                }`}
              >
                <Type className="w-5 h-5" />
                <span className="text-xs font-semibold">Text Gradient</span>
              </button>
            </div>
          </div>

          {/* Step 2: Content Input based on format */}
          {contentType === 'text' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Gradient Theme
                </label>
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-6 gap-2">
                  {TEXT_GRADIENTS.map(grad => (
                    <button
                      key={grad.id}
                      type="button"
                      onClick={() => setBackgroundColor(grad.value)}
                      className={`h-12 rounded-xl transition border relative ${
                        backgroundColor === grad.value ? 'ring-2 ring-amber-400 border-white' : 'border-neutral-700'
                      }`}
                      style={{ background: grad.value }}
                      title={grad.label}
                    >
                      {backgroundColor === grad.value && (
                        <Check className="w-4 h-4 text-white absolute inset-0 m-auto drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Status Message / Quote
                </label>
                <textarea
                  rows={4}
                  value={textOverlay}
                  onChange={(e) => setTextOverlay(e.target.value)}
                  placeholder="Share a backstage thought, quick reminder, or mood update..."
                  className="w-full p-4 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Live Text Preview Box */}
              <div 
                className="w-full aspect-[16/9] rounded-2xl p-6 flex flex-col items-center justify-center text-center text-white shadow-inner"
                style={{ background: backgroundColor }}
              >
                <p className="font-serif italic text-lg md:text-xl drop-shadow-md max-w-md">
                  "{textOverlay || 'Your status message will appear here with luxury styling.'}"
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Upload Media or Choose Preset
                </label>

                {/* Upload Button */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-6 border-2 border-dashed border-neutral-700 hover:border-amber-400 rounded-2xl text-center cursor-pointer bg-neutral-800/30 hover:bg-neutral-800/60 transition group"
                >
                  <Upload className="w-6 h-6 text-neutral-400 group-hover:text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-white">Click or tap to upload {contentType}</p>
                  <p className="text-[11px] text-neutral-400 mt-1">Supports JPG, PNG, WEBP, MP4, MOV</p>
                  <input 
                    ref={fileInputRef} 
                    type="file" 
                    accept={contentType === 'photo' ? 'image/*' : 'video/*'} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </div>

                {/* Presets Row */}
                <div className="mt-3">
                  <div className="text-[11px] font-medium text-neutral-400 mb-2">Or select a licensed demonstration asset:</div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2">
                    {contentType === 'photo' ? (
                      DEMO_PRESET_PHOTOS.map(p => (
                        <button
                          key={p.label}
                          type="button"
                          onClick={() => setMediaUrl(p.url)}
                          className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition ${
                            mediaUrl === p.url ? 'bg-amber-400/20 border-amber-400' : 'bg-neutral-800/40 border-neutral-700'
                          }`}
                        >
                          <img src={p.url} alt={p.label} className="w-9 h-9 rounded-lg object-cover" />
                          <span className="text-[11px] font-medium text-white truncate">{p.label}</span>
                        </button>
                      ))
                    ) : (
                      DEMO_PRESET_VIDEOS.map(v => (
                        <button
                          key={v.label}
                          type="button"
                          onClick={() => {
                            setMediaUrl(v.url);
                            setThumbnailUrl(v.thumb);
                          }}
                          className={`p-1.5 rounded-xl border text-left flex items-center gap-2 transition ${
                            mediaUrl === v.url ? 'bg-amber-400/20 border-amber-400' : 'bg-neutral-800/40 border-neutral-700'
                          }`}
                        >
                          <img src={v.thumb} alt={v.label} className="w-9 h-9 rounded-lg object-cover" />
                          <span className="text-[11px] font-medium text-white truncate">{v.label}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Optional Story Caption
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="e.g. Backstage at the rehearsal... soundcheck in 10 minutes!"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-xs placeholder-neutral-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Media Preview Box */}
              {mediaUrl && (
                <div className="relative aspect-[16/9] max-h-56 rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-neutral-800">
                  {contentType === 'photo' ? (
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <video
                      src={mediaUrl || '/videos/sample1.mp4'}
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
                  )}
                  {caption && (
                    <div className="absolute bottom-0 inset-x-0 p-2 bg-black/60 backdrop-blur text-white text-xs text-center">
                      {caption}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Audience & Privacy Selector */}
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-2">
              2. Status Audience & Privacy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label 
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  audience === 'public' 
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300' 
                    : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="audience" 
                  checked={audience === 'public'} 
                  onChange={() => setAudience('public')}
                  className="text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-400" />
                    <span>Public</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">Visible to all visitors</div>
                </div>
              </label>

              <label 
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  audience === 'followers' 
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300' 
                    : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="audience" 
                  checked={audience === 'followers'} 
                  onChange={() => setAudience('followers')}
                  className="text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-400" />
                    <span>Followers Only</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">Requires following you</div>
                </div>
              </label>

              <label 
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition ${
                  audience === 'subscribers' 
                    ? 'bg-amber-400/10 border-amber-400 text-amber-300' 
                    : 'bg-neutral-800/40 border-neutral-700/60 text-neutral-400'
                }`}
              >
                <input 
                  type="radio" 
                  name="audience" 
                  checked={audience === 'subscribers'} 
                  onChange={() => setAudience('subscribers')}
                  className="text-amber-500 focus:ring-amber-400"
                />
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Subscribers Only</span>
                  </div>
                  <div className="text-[10px] text-neutral-400">Exclusive VIP tier fans</div>
                </div>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-neutral-800">
            <span className="text-[11px] text-neutral-500 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Automatically expires after 24 hours</span>
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('manage')}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPublishing}
                className="px-5 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold shadow-lg transition cursor-pointer"
              >
                {isPublishing ? 'Publishing...' : 'Publish Status'}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 3: ARCHIVE */}
      {activeTab === 'archive' && (
        <div className="space-y-4">
          {archivedStatuses.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-500">
              Your status history will appear here once stories complete their 24-hour cycle.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 3xl:grid-cols-4 gap-3">
              {archivedStatuses.map(arch => (
                <div key={arch.id} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-3">
                  <div className="w-12 h-16 rounded-lg bg-neutral-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {arch.type === 'text' ? (
                      <div className="w-full h-full text-[9px] p-1 font-serif" style={{ background: arch.backgroundColor }}>
                        "{arch.textOverlay?.slice(0, 20)}..."
                      </div>
                    ) : (
                      <img src={arch.thumbnailUrl || arch.mediaUrl} alt="Archived" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-white truncate">{arch.caption || arch.textOverlay || 'Status'}</div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Posted {new Date(arch.createdAt).toLocaleDateString()}</div>
                    <div className="text-[10px] text-amber-400/90 font-medium mt-1 flex items-center gap-2">
                      <span>{arch.uniqueViews?.length || arch.viewsCount || 0} views</span>
                      <span>·</span>
                      <span>{arch.reactions?.length || 0} likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
