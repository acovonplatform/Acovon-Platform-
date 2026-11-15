import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile } from '../../types';
import { SearchableCountrySelector } from '../discovery/DiscoveryFilterBar';
import { 
  CheckCircle2, 
  ShieldCheck, 
  Globe, 
  MapPin, 
  Instagram, 
  Twitter, 
  Youtube, 
  Video, 
  Save, 
  RotateCcw, 
  Check, 
  AlertCircle,
  ExternalLink,
  Sparkles,
  Layers,
  AtSign,
  User
} from 'lucide-react';

interface EditProfileSectionProps {
  onOpenPreview?: () => void;
  onNavigateToBranding?: () => void;
}

export const EditProfileSection: React.FC<EditProfileSectionProps> = ({
  onOpenPreview,
  onNavigateToBranding
}) => {
  const { currentUser, creators, activeCategories, updateCreatorProfile } = useApp();
  const creator = currentUser as CreatorProfile;

  // Local form state initialized with creator values
  const [name, setName] = useState(creator.name || '');
  const [username, setUsername] = useState(creator.username || '');
  const [bio, setBio] = useState(creator.bio || '');
  const [creatorCountry, setCreatorCountry] = useState(creator.country || 'United States');
  const [location, setLocation] = useState(creator.location || creator.country || '');
  const [category, setCategory] = useState(creator.category || 'Fashion & Luxury');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    creator.categories || [creator.category || 'Amateur']
  );
  const [website, setWebsite] = useState(creator.website || creator.socialLinks?.website || '');
  const [instagram, setInstagram] = useState(creator.socialLinks?.instagram || '');
  const [twitter, setTwitter] = useState(creator.socialLinks?.twitter || '');
  const [youtube, setYoutube] = useState(creator.socialLinks?.youtube || '');
  const [tiktok, setTiktok] = useState(creator.socialLinks?.tiktok || '');
  const [twitch, setTwitch] = useState(creator.socialLinks?.twitch || '');

  // Status feedback
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const categoryOptions = activeCategories || [];

  // Toggle category in multiselect
  const handleToggleCategory = (catName: string) => {
    if (selectedCategories.includes(catName)) {
      if (selectedCategories.length === 1) return; // Keep at least one
      setSelectedCategories(prev => prev.filter(c => c !== catName));
    } else {
      if (selectedCategories.length >= 6) {
        setErrorMessage('You can select up to 6 categories for your showcase.');
        setTimeout(() => setErrorMessage(null), 3000);
        return;
      }
      setSelectedCategories(prev => [...prev, catName]);
    }
  };

  const handleReset = () => {
    setName(creator.name || '');
    setUsername(creator.username || '');
    setBio(creator.bio || '');
    setCreatorCountry(creator.country || 'United States');
    setLocation(creator.location || creator.country || '');
    setCategory(creator.category || 'Fashion & Luxury');
    setSelectedCategories(creator.categories || [creator.category || 'Amateur']);
    setWebsite(creator.website || creator.socialLinks?.website || '');
    setInstagram(creator.socialLinks?.instagram || '');
    setTwitter(creator.socialLinks?.twitter || '');
    setYoutube(creator.socialLinks?.youtube || '');
    setTiktok(creator.socialLinks?.tiktok || '');
    setTwitch(creator.socialLinks?.twitch || '');
    setErrorMessage(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate name
    if (!name.trim()) {
      setErrorMessage('Display name cannot be empty.');
      return;
    }

    // Validate username
    const sanitizedUsername = username.trim().toLowerCase().replace(/^@/, '');
    if (!sanitizedUsername || sanitizedUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (!/^[a-z0-9_]+$/.test(sanitizedUsername)) {
      setErrorMessage('Username can only contain letters, numbers, and underscores.');
      return;
    }

    // Check availability if changed
    const usernameTaken = creators.some(
      c => c.id !== creator.id && c.username.toLowerCase() === sanitizedUsername
    );
    if (usernameTaken) {
      setErrorMessage(`@${sanitizedUsername} is already taken by another creator.`);
      return;
    }

    const updates: Partial<CreatorProfile> = {
      name: name.trim(),
      username: sanitizedUsername,
      bio: bio.trim(),
      country: creatorCountry.trim() || creator.country,
      location: location.trim(),
      category: selectedCategories[0] || category,
      categories: selectedCategories,
      website: website.trim(),
      socialLinks: {
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        youtube: youtube.trim(),
        tiktok: tiktok.trim(),
        twitch: twitch.trim(),
        website: website.trim()
      }
    };

    const res = updateCreatorProfile(creator.id, updates);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } else {
      setErrorMessage(res.error || 'Failed to save profile changes.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26262b]">
        <div>
          <h2 className="text-xl font-bold font-brand text-white flex items-center gap-2">
            <span>Edit My Profile</span>
            {creator.isVerified && (
              <CheckCircle2 className="w-5 h-5 text-[#d4af37] fill-[#d4af37]" />
            )}
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Manage your public identity, biographical summary, categories, and verified links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToBranding && (
            <button
              type="button"
              onClick={onNavigateToBranding}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white bg-[#18181c] border border-[#27272a] hover:border-[#383842] transition-colors cursor-pointer"
            >
              Change Photos
            </button>
          )}
          {onOpenPreview && (
            <button
              type="button"
              onClick={onOpenPreview}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[#fce7b0] bg-[#1a1810] border border-[#d4af37]/40 hover:bg-[#242116] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Preview Profile</span>
            </button>
          )}
        </div>
      </div>

      {/* Success / Error Banners */}
      {savedSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile changes successfully saved and synchronized across all ACOVON showcases!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Profile Edit Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Identity & Bio */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 sm:p-6 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <User className="w-4 h-4 text-[#d4af37]" />
            <span>Public Identity & Biography</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Creator Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your creator display name"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
                required
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                The public name displayed on your feed posts and profile header.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Username / Handle *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-neutral-500 text-xs">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="your_handle"
                  className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
                  required
                />
              </div>
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Unique handle used for mentions, direct messages, and URL routing.
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-300">
                Biography / About Me
              </label>
              <span className={`text-[11px] font-mono ${bio.length > 450 ? 'text-amber-400' : 'text-neutral-500'}`}>
                {bio.length} / 500
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 500))}
              rows={4}
              placeholder="Introduce your background, artistic style, exclusive content releases, and what subscribers receive..."
              className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl p-3.5 text-xs text-white placeholder-neutral-500 focus:outline-none transition-colors leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <SearchableCountrySelector
                value={creatorCountry}
                onChange={setCreatorCountry}
                label="Creator Country (Official Profile Country)"
                placeholder="Select your profile country..."
              />
              <span className="text-[11px] text-neutral-500 mt-1 block">
                Identifies your profile country. Remains independent from individual Video Countries.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                <span>City / Studio Location (Optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Dubai, Paris, or Los Angeles"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-neutral-400" />
                <span>Official Website Link</span>
              </label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbrand.com"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Creator Categories */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#d4af37]" />
              <span>Showcase Categories</span>
            </h3>
            <span className="text-[11px] text-[#fce7b0] font-mono">
              {selectedCategories.length} selected (max 6)
            </span>
          </div>

          <p className="text-xs text-neutral-400">
            Select the categories that describe your creative focus. These power Explore discovery filters and video categorization.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            {categoryOptions.map(cat => {
              const isSelected = selectedCategories.includes(cat.name);
              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleToggleCategory(cat.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#d4af37] text-black font-semibold shadow-md shadow-[#d4af37]/20'
                      : 'bg-[#18181c] text-neutral-300 hover:text-white border border-[#27272a] hover:border-[#383842]'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 3: Social Media Links */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 sm:p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#d4af37]" />
            <span>Social Media Channels & External Links</span>
          </h3>
          <p className="text-xs text-neutral-400">
            Connect your verified external channels to make cross-promotion seamless.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5 text-pink-400" />
                <span>Instagram Profile</span>
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/yourhandle"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
                <span>X / Twitter Profile</span>
              </label>
              <input
                type="text"
                value={twitter}
                onChange={(e) => setTwitter(e.target.value)}
                placeholder="https://x.com/yourhandle"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5 text-red-500" />
                <span>YouTube Channel</span>
              </label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5 text-emerald-400" />
                <span>TikTok Profile</span>
              </label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@yourhandle"
                className="w-full bg-[#18181c] border border-[#27272a] focus:border-[#d4af37] rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none transition-colors font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Verification & Trust Status */}
        <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 sm:p-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#d4af37]" />
              <span>Identity & Trust Standards</span>
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
              AUDITED 18+
            </span>
          </div>

          <div className="p-4 bg-[#18181c] rounded-xl border border-[#26262b] space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-300">
              <span className="font-semibold text-white">Government ID Verification</span>
              <span className="text-emerald-400 font-mono flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Verified Active</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-300">
              <span className="font-semibold text-white">Verified Creator Gold Badge</span>
              <span className="text-[#fce7b0] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
                <span>Active Showcase</span>
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-300">
              <span className="font-semibold text-white">Last Profile Update</span>
              <span className="text-neutral-400 font-mono">
                {creator.profileUpdatedAt ? new Date(creator.profileUpdatedAt).toLocaleDateString() : 'Initial Launch'}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-[#18181c] border border-[#27272a] hover:border-[#383842] transition-colors cursor-pointer flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Discard Changes</span>
          </button>

          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl text-xs font-bold text-black bg-[#d4af37] hover:bg-[#e5c07b] shadow-xl shadow-[#d4af37]/20 transition-all cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Information</span>
          </button>
        </div>

      </form>
    </div>
  );
};
