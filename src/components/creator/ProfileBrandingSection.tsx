import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile } from '../../types';
import { ImageCropModal } from './ImageCropModal';
import { 
  Camera, 
  Upload, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  Smartphone, 
  Monitor, 
  RotateCcw,
  CheckCircle2,
  Trash2
} from 'lucide-react';

interface ProfileBrandingSectionProps {
  onOpenPreview?: () => void;
}

export const ProfileBrandingSection: React.FC<ProfileBrandingSectionProps> = ({
  onOpenPreview
}) => {
  const { currentUser, updateCreatorProfile } = useApp();
  const creator = currentUser as CreatorProfile;

  // File input refs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Crop modal state
  const [cropModalData, setCropModalData] = useState<{
    imageSrc: string;
    aspectRatio: 'square' | 'cover';
    title: string;
    target: 'avatar' | 'cover';
  } | null>(null);

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Handle selected file from device
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>, target: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: JPG, JPEG, PNG, WEBP
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setErrorToast('Please select a valid image file (JPG, PNG, or WEBP).');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    // Validate size: 15MB max
    if (file.size > 15 * 1024 * 1024) {
      setErrorToast('Image file size must be less than 15MB.');
      setTimeout(() => setErrorToast(null), 4000);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropModalData({
          imageSrc: reader.result,
          aspectRatio: target === 'avatar' ? 'square' : 'cover',
          title: target === 'avatar' ? 'Reposition & Crop Profile Picture' : 'Reposition & Crop Cover Photo',
          target
        });
      }
    };
    reader.readAsDataURL(file);

    // Reset input value so same file can be re-selected if desired
    e.target.value = '';
  };

  // Save cropped result into persistent creator profile
  const handleSaveCroppedImage = (croppedDataUrl: string) => {
    if (!cropModalData) return;

    const { target } = cropModalData;
    const updates: Partial<CreatorProfile> = {};

    if (target === 'avatar') {
      updates.avatar = croppedDataUrl;
    } else {
      updates.coverImage = croppedDataUrl;
    }

    const res = updateCreatorProfile(creator.id, updates);
    setCropModalData(null);

    if (res.success) {
      setSuccessToast(
        target === 'avatar' 
          ? 'Profile picture updated everywhere across ACOVON!' 
          : 'Cover photo updated on your public profile showcase!'
      );
      setTimeout(() => setSuccessToast(null), 3500);
    } else {
      setErrorToast(res.error || 'Failed to update photo.');
      setTimeout(() => setErrorToast(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => handleFileSelected(e, 'avatar')}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => handleFileSelected(e, 'cover')}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26262b]">
        <div>
          <h2 className="text-xl font-bold font-brand text-white">
            Profile Picture &amp; Cover Photo
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Personalize your visual brand identity with real device upload, zooming, and positioning tools.
          </p>
        </div>

        {onOpenPreview && (
          <button
            type="button"
            onClick={onOpenPreview}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#fce7b0] bg-[#1a1810] border border-[#d4af37]/40 hover:bg-[#242116] transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Preview Public Appearance</span>
          </button>
        )}
      </div>

      {/* Feedback alerts */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {errorToast && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorToast}</span>
        </div>
      )}

      {/* Profile Picture Card */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Camera className="w-4 h-4 text-[#d4af37]" />
              <span>Creator Profile Picture</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Your primary brand avatar shown on posts, stories, chat, and subscriptions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Change Profile Picture</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 bg-[#18181c] rounded-xl border border-[#26262b]">
          <div className="relative group shrink-0">
            <img
              src={creator.avatar}
              alt={creator.name}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-[#d4af37]/80 shadow-xl"
            />
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
            >
              <Camera className="w-6 h-6 text-[#d4af37]" />
              <span className="text-[10px] font-semibold mt-1">Upload New</span>
            </button>
          </div>

          <div className="space-y-2 text-xs text-center sm:text-left">
            <div className="text-white font-semibold">Recommended Avatar Specifications</div>
            <ul className="text-neutral-400 text-[11px] space-y-1 list-disc pl-4 inline-block text-left">
              <li>Dimensions: 600 × 600 px or square aspect ratio</li>
              <li>Supported formats: JPG, JPEG, PNG, WEBP</li>
              <li>Maximum file size: 15MB</li>
              <li>Centered portrait framing with smooth facial visibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cover Banner Card */}
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4af37]" />
              <span>Public Showcase Cover Photo</span>
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              The panoramic banner displayed at the top of your public creator profile.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop / Mobile Preview Mode Toggle */}
            <div className="flex items-center gap-1 bg-[#18181c] p-1 rounded-xl border border-[#27272a]">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-[#27272a] text-[#fce7b0] font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-[#27272a] text-[#fce7b0] font-semibold' : 'text-neutral-400 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Change Cover Photo</span>
            </button>
          </div>
        </div>

        {/* Live Banner Viewport Preview */}
        <div className="relative rounded-2xl overflow-hidden bg-black border border-[#27272a] group">
          <div className={`relative overflow-hidden transition-all ${
            previewDevice === 'mobile' ? 'h-48 max-w-sm mx-auto' : 'h-56 sm:h-72 w-full'
          }`}>
            <img
              src={creator.coverImage}
              alt="Cover Banner"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Simulated Avatar Overlay in Banner corner */}
            <div className="absolute bottom-4 left-4 flex items-center gap-3">
              <img
                src={creator.avatar}
                alt=""
                className="w-12 h-12 rounded-xl object-cover border-2 border-black shadow-lg"
              />
              <div className="text-white drop-shadow-md">
                <div className="font-bold text-sm flex items-center gap-1">
                  <span>{creator.name}</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
                </div>
                <div className="text-[11px] text-neutral-300">@{creator.username}</div>
              </div>
            </div>

            {/* Hover change button */}
            <button
              type="button"
              onClick={() => coverInputRef.current?.click()}
              className="absolute top-4 right-4 px-3 py-1.5 rounded-xl bg-black/75 hover:bg-black text-white text-xs font-semibold backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Upload New Banner</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#18181c] rounded-xl border border-[#26262b] text-xs space-y-1">
          <div className="text-white font-semibold">Recommended Cover Banner Specifications</div>
          <p className="text-neutral-400 text-[11px] leading-relaxed">
            Optimal dimensions: 1920 × 640 px (3:1 panoramic ratio). Safe margins protect focal content when dynamically rendered across iPhone, iPad, Android tablets, and ultrawide desktop monitors.
          </p>
        </div>
      </div>

      {/* Active Crop Modal */}
      {cropModalData && (
        <ImageCropModal
          imageSrc={cropModalData.imageSrc}
          aspectRatio={cropModalData.aspectRatio}
          title={cropModalData.title}
          onSave={handleSaveCroppedImage}
          onClose={() => setCropModalData(null)}
        />
      )}
    </div>
  );
};
