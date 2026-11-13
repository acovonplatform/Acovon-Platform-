import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, Post } from '../../types';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { 
  CheckCircle2, 
  MapPin, 
  Globe, 
  Instagram, 
  Twitter, 
  Youtube, 
  Film, 
  Camera, 
  Lock, 
  Play, 
  Check, 
  Crown, 
  Coins, 
  MessageSquare, 
  PhoneCall, 
  Smartphone, 
  Monitor, 
  Edit3, 
  ExternalLink,
  Layers,
  Heart,
  Eye
} from 'lucide-react';

interface ProfilePreviewSectionProps {
  onNavigateToEditProfile?: () => void;
  onNavigateToBranding?: () => void;
  onNavigateToPlans?: () => void;
  onOpenPublicProfile?: () => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
}

export const ProfilePreviewSection: React.FC<ProfilePreviewSectionProps> = ({
  onNavigateToEditProfile,
  onNavigateToBranding,
  onNavigateToPlans,
  onOpenPublicProfile,
  onOpenSubscribeModal
}) => {
  const { currentUser, posts } = useApp();
  const creator = currentUser as CreatorProfile;

  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'posts' | 'tiers' | 'vault'>('posts');

  const myPosts = posts.filter(p => p.creatorId === creator.id);
  const ppvPosts = myPosts.filter(p => p.visibility === 'pay_per_view');
  const activeTiers = (creator.tiers || []).filter(t => t.isActive !== false);

  return (
    <div className="space-y-6">
      {/* Header & Device Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#26262b]">
        <div>
          <h2 className="text-xl font-bold font-brand text-white flex items-center gap-2">
            <span>Preview My Profile</span>
            <Eye className="w-5 h-5 text-[#d4af37]" />
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Real-time interactive view showing exactly how fans and subscribers experience your profile.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-[#141418] p-1 rounded-xl border border-[#27272a]">
            <button
              type="button"
              onClick={() => setPreviewDevice('desktop')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-[#27272a] text-[#fce7b0]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewDevice('mobile')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-[#27272a] text-[#fce7b0]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile Phone</span>
            </button>
          </div>

          {onOpenPublicProfile && (
            <button
              type="button"
              onClick={onOpenPublicProfile}
              className="px-3.5 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Public Page</span>
            </button>
          )}
        </div>
      </div>

      {/* Frame Container */}
      <div className={`mx-auto bg-[#09090b] border border-[#27272a] rounded-3xl overflow-hidden shadow-2xl transition-all ${
        previewDevice === 'mobile' ? 'max-w-md ring-8 ring-[#18181c]' : 'w-full'
      }`}>

        {/* Cover Photo Banner */}
        <div className="relative w-full h-48 sm:h-64 bg-neutral-900 overflow-hidden group">
          <img
            src={creator.coverImage}
            alt={creator.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/30 to-transparent" />

          {onNavigateToBranding && (
            <button
              type="button"
              onClick={onNavigateToBranding}
              className="touch-always-visible absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 hover:bg-black text-white text-[11px] font-semibold border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3 text-[#d4af37]" />
              <span>Change Cover</span>
            </button>
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 sm:px-6 -mt-16 sm:-mt-20 relative z-10 pb-8 space-y-5">
          
          {/* Header Row: Avatar, Identity, CTA Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-[#222228]">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div className="relative shrink-0 group">
                <img
                  src={creator.avatar}
                  alt={creator.name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-[#09090b] shadow-2xl"
                />
                {creator.isLiveForCalls && (
                  <div className="absolute -top-1 -right-1 bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                    <span>CALLS READY</span>
                  </div>
                )}
                {onNavigateToBranding && (
                  <button
                    type="button"
                    onClick={onNavigateToBranding}
                    className="touch-always-visible absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-semibold cursor-pointer"
                  >
                    Edit Photo
                  </button>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold font-brand text-white">
                    {creator.name}
                  </h1>
                  <VerifiedBadge creatorId={creator.id} size="lg" />
                </div>
                <div className="text-xs text-neutral-400">
                  <span>@{creator.username}</span>
                </div>
                {creator.location && (
                  <div className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-neutral-400" />
                    <span>{creator.location}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons as Fans see them */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenSubscribeModal && onOpenSubscribeModal(creator.id)}
                className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Subscribe from ${activeTiers[0]?.price ? activeTiers[0].price.toFixed(2) : '9.99'}/mo</span>
              </button>

              <button
                type="button"
                className="px-3 py-2 bg-[#18181c] border border-[#27272a] text-neutral-300 font-semibold text-xs rounded-xl cursor-default"
              >
                Follow
              </button>

              <button
                type="button"
                className="p-2 bg-[#18181c] border border-[#27272a] text-[#d4af37] rounded-xl cursor-default"
                title="Send Tip"
              >
                <Coins className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-[#121215] rounded-xl border border-[#1f1f25] text-center">
            <div>
              <div className="text-base font-bold font-mono text-white">
                {(creator.followersCount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-400 uppercase font-medium">Followers</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-[#fce7b0]">
                {(creator.subscribersCount || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-400 uppercase font-medium">Subscribers</div>
            </div>
            <div>
              <div className="text-base font-bold font-mono text-white">
                {myPosts.length}
              </div>
              <div className="text-[10px] text-neutral-400 uppercase font-medium">Posts</div>
            </div>
          </div>

          {/* Biography & Categories */}
          <div className="space-y-2.5">
            {creator.bio && (
              <p className="text-xs text-neutral-300 leading-relaxed">
                {creator.bio}
              </p>
            )}

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              {(creator.categories && creator.categories.length > 0 ? creator.categories : [creator.category || 'Fashion & Luxury']).map(c => (
                <span key={c} className="px-2 py-0.5 rounded bg-[#18181c] border border-[#26262b] text-[10px] text-[#fce7b0] font-medium">
                  {c}
                </span>
              ))}
            </div>

            {/* Social Links */}
            {creator.socialLinks && (
              <div className="flex flex-wrap items-center gap-3 pt-1 text-neutral-400 text-xs">
                {creator.socialLinks.website && (
                  <span className="flex items-center gap-1 hover:text-[#d4af37]">
                    <Globe className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="text-[11px] truncate max-w-[150px]">{creator.socialLinks.website.replace('https://', '')}</span>
                  </span>
                )}
                {creator.socialLinks.instagram && (
                  <span className="flex items-center gap-1 hover:text-pink-400">
                    <Instagram className="w-3.5 h-3.5" />
                    <span className="text-[11px]">Instagram</span>
                  </span>
                )}
                {creator.socialLinks.twitter && (
                  <span className="flex items-center gap-1 hover:text-sky-400">
                    <Twitter className="w-3.5 h-3.5" />
                    <span className="text-[11px]">X</span>
                  </span>
                )}
                {creator.socialLinks.youtube && (
                  <span className="flex items-center gap-1 hover:text-red-400">
                    <Youtube className="w-3.5 h-3.5" />
                    <span className="text-[11px]">YouTube</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-4 border-b border-[#222228] text-xs pt-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('posts')}
              className={`pb-2.5 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'posts' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              All Content ({myPosts.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tiers')}
              className={`pb-2.5 font-semibold transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap shrink-0 ${
                activeTab === 'tiers' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Crown className="w-3 h-3 text-[#d4af37]" />
              <span>Subscription Plans ({activeTiers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`pb-2.5 font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === 'vault' ? 'text-[#fce7b0] border-b-2 border-[#d4af37]' : 'text-neutral-400 hover:text-white'
              }`}
            >
              PPV Vault ({ppvPosts.length})
            </button>
          </div>

          {/* Tab Content 1: Posts Grid */}
          {activeTab === 'posts' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {myPosts.length > 0 ? (
                myPosts.map(post => {
                  const media = post.media[0];
                  return (
                    <div key={post.id} className="relative aspect-square rounded-xl bg-black overflow-hidden group">
                      <img
                        src={media?.thumbnailUrl || media?.url || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2.5">
                        <div className="text-[10px] text-white flex items-center gap-2">
                          <span className="flex items-center gap-0.5"><Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> {post.likesCount}</span>
                          <span className="capitalize text-neutral-300">{post.visibility}</span>
                        </div>
                      </div>
                      {media?.type === 'video' && (
                        <div className="absolute top-2 right-2 p-1 rounded-md bg-black/70 text-[#d4af37]">
                          <Play className="w-3 h-3 fill-[#d4af37]" />
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-neutral-500">
                  No public content published yet.
                </div>
              )}
            </div>
          )}

          {/* Tab Content 2: Subscription Plans Cards */}
          {activeTab === 'tiers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeTiers.map(tier => (
                <div
                  key={tier.id}
                  className="bg-[#121215] border border-[#27272a] hover:border-[#3d3d46] rounded-2xl p-4 flex flex-col justify-between space-y-4"
                >
                  <div>
                    <div className="text-xs uppercase tracking-wider text-[#d4af37] font-bold">
                      {tier.name}
                    </div>
                    {tier.description && (
                      <p className="text-[11px] text-neutral-400 mt-1 leading-snug">
                        {tier.description}
                      </p>
                    )}

                    <div className="flex items-baseline gap-1 my-2.5">
                      <span className="text-2xl font-bold font-mono text-white">
                        ${tier.price.toFixed(2)}
                      </span>
                      <span className="text-xs text-neutral-400">/ mo</span>
                    </div>

                    {tier.introductoryOffer && (
                      <div className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[10px] font-semibold mb-2 inline-block">
                        {tier.introductoryOffer}
                      </div>
                    )}

                    <div className="border-t border-[#1f1f23] pt-2.5 space-y-1.5 text-[11px] text-neutral-300">
                      {tier.perks.map((p, i) => (
                        <div key={i} className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-[#d4af37] shrink-0 mt-0.5" />
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenSubscribeModal && onOpenSubscribeModal(creator.id)}
                    className="w-full py-2 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    Select Plan · ${tier.price.toFixed(2)}/mo
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Tab Content 3: PPV Vault Releases */}
          {activeTab === 'vault' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
              {ppvPosts.length > 0 ? (
                ppvPosts.map(post => {
                  const media = post.media[0];
                  return (
                    <div key={post.id} className="relative aspect-video rounded-xl bg-black overflow-hidden border border-[#27272a]">
                      <img
                        src={media?.thumbnailUrl || media?.url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#d4af37] text-black text-[10px] font-bold">
                        ${post.ppvPrice || 9.99}
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-neutral-300" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full py-8 text-center text-xs text-neutral-500">
                  No pay-per-view releases configured.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
