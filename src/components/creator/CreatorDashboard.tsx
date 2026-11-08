import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { CreatorProfile, Post, RecordingMode, ReplayPermission } from '../../types';
import { 
  TrendingUp, 
  Users, 
  Coins, 
  Video, 
  Sparkles, 
  ArrowUpRight, 
  BarChart3, 
  Rocket, 
  CheckCircle2, 
  Clock, 
  Flame,
  Radio,
  FileText,
  FolderOpen,
  Calendar,
  Heart,
  MessageSquare,
  Gift,
  DollarSign,
  Ticket,
  Eye,
  Shield,
  Layers,
  Award,
  Download,
  PlusCircle,
  Play,
  Scissors,
  UserCheck,
  Crown,
  Edit3,
  Film,
  Lock,
  Globe,
  Trash2
} from 'lucide-react';
import { EditProfileSection } from './EditProfileSection';
import { ProfileBrandingSection } from './ProfileBrandingSection';
import { SubscriptionPlansSection } from './SubscriptionPlansSection';
import { MonetizationRatesSection } from './MonetizationRatesSection';
import { ProfilePreviewSection } from './ProfilePreviewSection';
import { MyStatusSection } from './MyStatusSection';
import { GetVerifiedSection } from './GetVerifiedSection';
import { VerifiedBadge } from '../common/VerifiedBadge';
import { RoleTargetedAnnouncementBanners } from '../common/AnnouncementExperience';

interface CreatorDashboardProps {
  onOpenCreatePost: () => void;
  onNavigateToRequests: () => void;
  onOpenWallet: () => void;
  onNavigateToProfile?: (creatorId: string) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  onOpenStatusViewer?: (creatorId: string) => void;
}

type StudioCategory = 'PROFILE' | 'VERIFICATION' | 'CONTENT' | 'MONETIZATION' | 'AUDIENCE' | 'LIVE' | 'PROMOTION' | 'ANALYTICS';

export const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
  onOpenCreatePost,
  onNavigateToRequests,
  onOpenWallet,
  onNavigateToProfile,
  onOpenSubscribeModal,
  onOpenStatusViewer
}) => {
  const { 
    currentUser, 
    posts, 
    subscriptions, 
    promotions, 
    customRequests,
    livestreams,
    createPromotionCampaign,
    setIsCreateLiveModalOpen,
    setActiveLivestreamId,
    updateLivestreamRecording,
    transactions,
    videoProcessingJobs,
    videoMediaRecords,
    startVideoOptimizationJob,
    retryVideoProcessingJob,
    cancelVideoProcessingJob,
    isCreatorVerifiedBadgeActive,
    getCreatorVerificationRecord,
    verificationSettings,
    isCurrentUserApprovedCreator
  } = useApp();

  // Navigation state within Creator Studio
  const [activeCategory, setActiveCategory] = useState<StudioCategory>('CONTENT');
  const [activeSubItem, setActiveSubItem] = useState<string>('my_posts');
  const [timeRange, setTimeRange] = useState<'today' | '7d' | '30d' | '90d'>('30d');

  // Promotion campaign form
  const [promoType, setPromoType] = useState<'boost_profile' | 'promote_post' | 'featured_creator'>('boost_profile');
  const [promoBudget, setPromoBudget] = useState(25);
  const [promoSucceeded, setPromoSucceeded] = useState(false);

  // Live Recording inline editor state
  const [editingRecordingId, setEditingRecordingId] = useState<string | null>(null);
  const [editRecMode, setEditRecMode] = useState<RecordingMode>('paid');
  const [editRecPrice, setEditRecPrice] = useState<string>('14.99');
  const [editRecAvail, setEditRecAvail] = useState<number | 'unlimited'>('unlimited');
  const [editRecPermission, setEditRecPermission] = useState<ReplayPermission>('paid');
  const [editRecDesc, setEditRecDesc] = useState<string>('');
  const [recFeedback, setRecFeedback] = useState<string>('');

  // Authorization Check: Fans cannot browse Creator Studio data
  if (currentUser.role !== 'creator' && !isCurrentUserApprovedCreator) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold font-brand text-white">Creator Access Restricted</h2>
        <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed">
          Creator Studio is reserved for approved Acovon creator accounts. Fan accounts cannot access creator metrics, content management, or broadcast tools.
        </p>
      </div>
    );
  }

  const creator = currentUser as CreatorProfile;
  const myPosts = posts.filter(p => p.creatorId === creator.id);
  const highlightClips = myPosts.filter(p => p.isHighlight);
  const mySubscribersCount = creator.subscribersCount || 0;
  const myEarnings = creator.totalEarnings || 0;
  const mrr = (mySubscribersCount * 22.5).toFixed(0);

  // Studio Sections & Sub-items definition
  const sections: {
    category: StudioCategory;
    label: string;
    icon: any;
    subItems: { id: string; label: string }[];
  }[] = [
    {
      category: 'PROFILE',
      label: 'Profile & Plans',
      icon: UserCheck,
      subItems: [
        { id: 'edit_profile', label: 'Edit My Profile' },
        { id: 'get_verified', label: 'Get Verified (Blue Badge)' },
        { id: 'photos_branding', label: 'Profile Picture & Cover Photo' },
        { id: 'subscription_plans', label: 'Subscription Plans' },
        { id: 'monetization_rates', label: 'My Pricing & Monetization' },
        { id: 'preview_profile', label: 'Preview My Profile' }
      ]
    },
    {
      category: 'VERIFICATION',
      label: 'Get Verified',
      icon: Award,
      subItems: [
        { id: 'get_verified', label: 'Official Blue Verification Badge' }
      ]
    },
    {
      category: 'CONTENT',
      label: 'Content',
      icon: FolderOpen,
      subItems: [
        { id: 'my_posts', label: 'My Posts' },
        { id: 'my_status', label: 'My Status / Stories' },
        { id: 'upload_content', label: 'Upload Content' },
        { id: 'content_library', label: 'Content Library' },
        { id: 'scheduled_posts', label: 'Scheduled Posts' }
      ]
    },
    {
      category: 'AUDIENCE',
      label: 'Audience',
      icon: Users,
      subItems: [
        { id: 'subscribers', label: 'Subscribers' },
        { id: 'followers', label: 'Followers' },
        { id: 'messages', label: 'Messages' },
        { id: 'community', label: 'Community' }
      ]
    },
    {
      category: 'MONETIZATION',
      label: 'Monetization',
      icon: Coins,
      subItems: [
        { id: 'subscription_plans', label: 'Subscription Plans' },
        { id: 'monetization_rates', label: 'My Pricing & Monetization' },
        { id: 'pay_per_view', label: 'Pay-per-view' },
        { id: 'custom_requests', label: 'Custom Video Requests' },
        { id: 'paid_messages', label: 'Paid Messages' },
        { id: 'tips_gifts', label: 'Tips and Gifts' },
        { id: 'livestream_earnings', label: 'Livestream Earnings' }
      ]
    },
    {
      category: 'LIVE',
      label: 'Live',
      icon: Radio,
      subItems: [
        { id: 'go_live', label: 'Go Live' },
        { id: 'my_recordings', label: 'My Live Recordings' },
        { id: 'scheduled_live', label: 'Scheduled Livestreams' },
        { id: 'live_history', label: 'Livestream History' },
        { id: 'live_analytics', label: 'Live Analytics' }
      ]
    },
    {
      category: 'PROMOTION',
      label: 'Promotion',
      icon: Rocket,
      subItems: [
        { id: 'promote_profile', label: 'Promote Profile' },
        { id: 'promote_posts', label: 'Promote Posts' },
        { id: 'campaigns', label: 'Advertising Campaigns' }
      ]
    },
    {
      category: 'ANALYTICS',
      label: 'Analytics',
      icon: BarChart3,
      subItems: [
        { id: 'earnings', label: 'Earnings' },
        { id: 'performance', label: 'Performance' },
        { id: 'audience_analytics', label: 'Audience Analytics' },
        { id: 'revenue_reports', label: 'Revenue Reports' }
      ]
    }
  ];

  const handleSelectCategory = (cat: StudioCategory) => {
    setActiveCategory(cat);
    const sec = sections.find(s => s.category === cat);
    if (sec && sec.subItems.length > 0) {
      setActiveSubItem(sec.subItems[0].id);
    }
  };

  const handleLaunchPromo = (e: React.FormEvent) => {
    e.preventDefault();
    const packageTitle = promoType === 'boost_profile' 
      ? 'Top Discovery Boost Placement' 
      : promoType === 'promote_post' 
      ? 'Featured Feed Spotlight' 
      : 'Frontpage Featured Creator Badge';

    const res = createPromotionCampaign({
      creatorId: creator.id,
      creatorName: creator.name,
      type: promoType,
      budget: promoBudget,
      packageTitle,
      durationDays: promoBudget === 10 ? 3 : promoBudget === 25 ? 7 : 14
    });

    if (res.success) {
      setPromoSucceeded(true);
      setTimeout(() => setPromoSucceeded(false), 3000);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6 overflow-x-hidden">

      {/* Creator-Targeted & Platform-Wide Announcement Banners / Persistent Notices */}
      <RoleTargetedAnnouncementBanners
        onNavigate={(tab) => {
          if (tab === 'requests') onNavigateToRequests();
          else if (tab === 'wallet') onOpenWallet();
        }}
        onOpenWallet={onOpenWallet}
      />

      {/* Top Banner & Quick Metrics */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#26262b]">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold font-brand tracking-wide text-white">Creator Studio</h1>
            <span className="text-xs font-medium text-neutral-300 flex items-center gap-1.5">
              · {creator.name}
              <VerifiedBadge creatorId={creator.id} size="sm" showLabel />
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Central business management: content, audience, monetization, official blue verification, live broadcasting, promotions, and analytics.
          </p>
        </div>

        {/* Quick actions, Time range selector & Wallet quick view */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveCategory('VERIFICATION');
              setActiveSubItem('get_verified');
            }}
            className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer ${
              isCreatorVerifiedBadgeActive(creator.id)
                ? 'bg-sky-950/60 hover:bg-sky-900/70 border border-sky-500/40 text-sky-200'
                : 'bg-[#1D9BF0] hover:bg-sky-500 text-white shadow-md shadow-sky-500/20'
            }`}
          >
            <VerifiedBadge forceShow size="xs" />
            <span>
              {isCreatorVerifiedBadgeActive(creator.id)
                ? 'Blue Badge Active'
                : `Get Verified ($${verificationSettings.price.toFixed(2)})`}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('PROFILE');
              setActiveSubItem('edit_profile');
            }}
            className="px-3 py-1.5 bg-[#141418] hover:bg-[#1c1c22] border border-[#27272a] hover:border-[#383842] rounded-xl text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Edit Profile</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('PROFILE');
              setActiveSubItem('subscription_plans');
            }}
            className="px-3 py-1.5 bg-[#141418] hover:bg-[#1c1c22] border border-[#27272a] hover:border-[#383842] rounded-xl text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Plans</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('PROFILE');
              setActiveSubItem('preview_profile');
            }}
            className="px-3 py-1.5 bg-[#1a1810] hover:bg-[#242116] border border-[#d4af37]/40 rounded-xl text-xs font-semibold text-[#fce7b0] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>Preview Profile</span>
          </button>

          <div className="flex items-center gap-1 p-1 bg-[#141418] border border-[#27272a] rounded-xl">
            {(['today', '7d', '30d', '90d'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTimeRange(t)}
                className={`px-2 sm:px-2.5 py-1 text-[11px] font-medium rounded-lg uppercase transition-colors cursor-pointer ${
                  timeRange === t ? 'bg-[#27272a] text-white shadow-sm' : 'text-neutral-400 hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <button
            type="button"
            onClick={onOpenWallet}
            className="px-3 py-1.5 bg-[#141418] hover:bg-[#1c1c22] border border-[#d4af37]/40 rounded-xl text-xs font-mono font-bold text-[#fce7b0] flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Coins className="w-4 h-4 text-[#d4af37]" />
            <span>${creator.walletBalance.toFixed(2)}</span>
          </button>
        </div>
      </div>

      {/* Studio Category Navigation Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isCatActive = activeCategory === sec.category;
          return (
            <button
              key={sec.category}
              type="button"
              onClick={() => handleSelectCategory(sec.category)}
              className={`p-2.5 sm:p-3 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer min-w-0 ${
                isCatActive
                  ? 'bg-[#18181f] border-[#d4af37] text-white shadow-lg shadow-[#d4af37]/10'
                  : 'bg-[#121215] border-[#27272a] text-neutral-400 hover:text-neutral-200 hover:bg-[#16161b]'
              }`}
            >
              <div className={`p-1.5 rounded-lg shrink-0 ${isCatActive ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#1a1a20] text-neutral-400'}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight truncate">{sec.label}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5 truncate">{sec.subItems.length} items</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-Items Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-[#26262b]">
        {sections.find(s => s.category === activeCategory)?.subItems.map(sub => {
          const isSubActive = activeSubItem === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => setActiveSubItem(sub.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                isSubActive
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'bg-[#141418] border border-[#27272a] text-neutral-400 hover:text-white'
              }`}
            >
              {sub.label}
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* 0. PROFILE & PLANS SECTION                               */}
      {/* ======================================================== */}
      {activeCategory === 'PROFILE' && (
        <div className="space-y-6">
          {activeSubItem === 'edit_profile' && (
            <EditProfileSection
              onOpenPreview={() => {
                setActiveCategory('PROFILE');
                setActiveSubItem('preview_profile');
              }}
              onNavigateToBranding={() => {
                setActiveCategory('PROFILE');
                setActiveSubItem('photos_branding');
              }}
            />
          )}

          {activeSubItem === 'photos_branding' && (
            <ProfileBrandingSection
              onOpenPreview={() => {
                setActiveCategory('PROFILE');
                setActiveSubItem('preview_profile');
              }}
            />
          )}

          {activeSubItem === 'subscription_plans' && (
            <SubscriptionPlansSection
              onOpenPreview={() => {
                setActiveCategory('PROFILE');
                setActiveSubItem('preview_profile');
              }}
            />
          )}

          {activeSubItem === 'monetization_rates' && (
            <MonetizationRatesSection
              onNavigateToPlans={() => {
                setActiveCategory('PROFILE');
                setActiveSubItem('subscription_plans');
              }}
            />
          )}

          {activeSubItem === 'preview_profile' && (
            <ProfilePreviewSection
              onNavigateToEditProfile={() => setActiveSubItem('edit_profile')}
              onNavigateToBranding={() => setActiveSubItem('photos_branding')}
              onNavigateToPlans={() => setActiveSubItem('subscription_plans')}
              onOpenPublicProfile={() => onNavigateToProfile && onNavigateToProfile(creator.id)}
              onOpenSubscribeModal={onOpenSubscribeModal}
            />
          )}

          {activeSubItem === 'get_verified' && (
            <GetVerifiedSection onNavigateToProfile={onNavigateToProfile} />
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 0B. GET VERIFIED (OFFICIAL BLUE BADGE) SECTION           */}
      {/* ======================================================== */}
      {activeCategory === 'VERIFICATION' && (
        <GetVerifiedSection onNavigateToProfile={onNavigateToProfile} />
      )}

      {/* ======================================================== */}
      {/* 1. CONTENT SECTION                                      */}
      {/* ======================================================== */}
      {activeCategory === 'CONTENT' && (
        <div className="space-y-6">
          {/* Sub-item: My Status / Stories */}
          {activeSubItem === 'my_status' && (
            <MyStatusSection onOpenViewer={onOpenStatusViewer} />
          )}

          {/* Sub-item: My Posts */}
          {activeSubItem === 'my_posts' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">My Published Content</h3>
                  <p className="text-xs text-neutral-400">Manage visibility, likes, pay-per-view prices, and adaptive streaming ladders.</p>
                </div>
                <button
                  onClick={onOpenCreatePost}
                  className="px-4 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Upload New</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myPosts.map(p => {
                  const firstMedia = p.media[0];
                  return (
                    <div key={p.id} className="bg-[#121215] border border-[#27272a] rounded-2xl overflow-hidden flex flex-col justify-between">
                      <div className="relative aspect-video bg-black">
                        {firstMedia && (
                          <img 
                            src={firstMedia.thumbnailUrl || firstMedia.url} 
                            alt="" 
                            className="w-full h-full object-cover" 
                          />
                        )}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/70 backdrop-blur-md text-white border border-white/20 capitalize">
                            {p.visibility}
                          </span>
                          {p.ppvPrice && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d4af37] text-black font-mono">
                              ${p.ppvPrice.toFixed(2)} PPV
                            </span>
                          )}
                          {p.isHighlight && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white flex items-center gap-1">
                              <Scissors className="w-2.5 h-2.5" />
                              <span>Highlight</span>
                            </span>
                          )}
                        </div>
                        {firstMedia?.type === 'video' && (
                          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded bg-black/80 border border-emerald-500/40 text-[9px] font-mono text-emerald-300">
                              HLS • {firstMedia.availableCodecs?.[0] || 'AV1'} • -{firstMedia.compressionRatio || 64}% size
                            </span>
                            <span className="px-2 py-0.5 rounded bg-black/80 border border-[#d4af37]/40 text-[9px] font-mono text-[#fce7b0]">
                              {firstMedia.availableResolutions?.[0] || '1080p'} → 360p
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-4 space-y-2">
                        <p className="text-xs text-neutral-200 line-clamp-2">{p.content}</p>
                        <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-2 border-t border-[#26262b]">
                          <span>{p.likesCount} Likes · {p.commentsCount} Comments</span>
                          <span>{p.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sub-item: Upload Content & Background Video Compression Queue */}
          {activeSubItem === 'upload_content' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-5 bg-[#121215] border border-[#27272a] rounded-2xl p-6 text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mx-auto">
                    <Film className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-white">Publish to Your Exclusive Vault</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Every uploaded video is automatically compressed using visually lossless multi-codec encoding (AV1 / HEVC / H.264) and packaged into adaptive HLS streams (4K down to 360p).
                  </p>
                  <div className="flex flex-col gap-2 pt-1">
                    <button
                      onClick={onOpenCreatePost}
                      className="w-full px-5 py-3 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer"
                    >
                      Open Content Publisher
                    </button>
                    <button
                      onClick={() => {
                        startVideoOptimizationJob({
                          creatorId: creator.id,
                          creatorName: creator.name,
                          sourceContext: 'creator_studio',
                          fileName: `Studio_Vault_Drop_4K_${new Date().toISOString().slice(11, 19).replace(/:/g, '')}.mov`,
                          fileSize: 512 * 1024 * 1024,
                          mimeType: 'video/quicktime',
                          sourceUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
                          thumbnailUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=900&q=80',
                          width: 3840,
                          height: 2160,
                          durationSeconds: 165,
                          frameRate: 60
                        });
                      }}
                      className="w-full px-4 py-2.5 bg-[#18181f] hover:bg-[#22222c] border border-[#d4af37]/40 text-[#fce7b0] font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                      + Queue Background 4K Video Compression Test (512 MB)
                    </button>
                  </div>
                </div>

                {/* Live Creator Video Optimization & Transcoding Queue */}
                <div className="lg:col-span-7 bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#d4af37]" />
                        <span>Background Video Optimization &amp; Transcoding Queue</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400">
                        Non-blocking background worker — continue managing your studio while videos optimize.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                      ~64% Avg Size Saved
                    </span>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {videoProcessingJobs
                      .filter(j => j.creatorId === creator.id || j.creatorId === 'creator_1')
                      .map(job => {
                        const origMb = (job.originalFileSize / (1024 * 1024)).toFixed(1);
                        const optMb = job.optimizedFileSize
                          ? (job.optimizedFileSize / (1024 * 1024)).toFixed(1)
                          : (job.originalFileSize * 0.36 / (1024 * 1024)).toFixed(1);
                        return (
                          <div
                            key={job.id}
                            className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="font-mono font-bold text-white truncate">{job.fileName}</div>
                                <div className="text-[10px] text-neutral-400 flex items-center gap-2 mt-0.5">
                                  <span className="uppercase text-[#fce7b0]">{job.sourceContext.replace('_', ' ')}</span>
                                  <span>•</span>
                                  <span>{origMb} MB → {optMb} MB ({job.compressionRatio || 64}% smaller)</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                    job.stage === 'ready' || job.jobStatus === 'completed'
                                      ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40'
                                      : job.stage === 'failed' || job.jobStatus === 'failed'
                                      ? 'bg-rose-950/70 text-rose-300 border border-rose-500/40'
                                      : 'bg-amber-950/70 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {(job.stage || job.processingStage || 'processing').replace('_', ' ')} ({job.progress ?? job.progressPercentage}%)
                                </span>
                                {(job.stage === 'failed' || job.jobStatus === 'failed') && (
                                  <button
                                    onClick={() => retryVideoProcessingJob(job.id)}
                                    className="px-2.5 py-1 bg-[#d4af37] text-black font-bold rounded-lg text-[10px] cursor-pointer"
                                  >
                                    Retry
                                  </button>
                                )}
                                {job.stage !== 'ready' && job.jobStatus !== 'completed' && job.stage !== 'failed' && job.jobStatus !== 'failed' && (
                                  <button
                                    onClick={() => cancelVideoProcessingJob(job.id)}
                                    className="px-2 py-1 bg-rose-950/70 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="w-full h-1.5 bg-[#121215] rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${
                                  job.stage === 'ready'
                                    ? 'bg-emerald-500'
                                    : job.stage === 'failed'
                                    ? 'bg-rose-500'
                                    : 'bg-[#d4af37]'
                                }`}
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                            {job.errorMessage && (
                              <div className="text-[10px] text-rose-300">{job.errorMessage}</div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-item: Content Library */}
          {activeSubItem === 'content_library' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Content Library, Adaptive Vault &amp; Live Clips</h3>
                  <p className="text-xs text-neutral-400">All optimized media assets, multi-bitrate ladders, and 30-second live highlights.</p>
                </div>
                <span className="text-xs text-neutral-400 font-mono">
                  {highlightClips.length} Highlights · {videoMediaRecords.length} Optimized Vault Videos
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {myPosts.flatMap(p => p.media).map((m, idx) => (
                  <div key={idx} className="group relative aspect-square bg-[#18181c] border border-[#27272a] rounded-xl overflow-hidden">
                    <img src={m.thumbnailUrl || m.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent p-2.5 flex flex-col justify-end">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white font-semibold uppercase">{m.type}</span>
                        {m.type === 'video' && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                            -{m.compressionRatio || 64}%
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#fce7b0] font-mono">
                        {m.type === 'video'
                          ? `${m.availableResolutions?.join('/') || '1080p/720p/480p/360p'}`
                          : `Asset #${idx + 1}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-item: Scheduled Posts */}
          {activeSubItem === 'scheduled_posts' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Scheduled Publishing Queue</h3>
                <span className="text-xs text-neutral-400">2 drops queued for this week</span>
              </div>
              <div className="space-y-3">
                {[
                  { title: 'Behind The Scenes: Milan Haute Couture Fall Edition', time: 'Tomorrow at 18:00 UTC', type: 'PPV Video ($14.99)' },
                  { title: 'Exclusive Masterclass: Music Production Stems & Vocals', time: 'Friday at 20:00 UTC', type: 'Subscriber Exclusive' }
                ].map((s, idx) => (
                  <div key={idx} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-white">{s.title}</div>
                      <div className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>{s.time}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#22222a] text-[#fce7b0]">
                      {s.type}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. AUDIENCE SECTION                                     */}
      {/* ======================================================== */}
      {activeCategory === 'AUDIENCE' && (
        <div className="space-y-6">
          {/* Sub-item: Subscribers */}
          {activeSubItem === 'subscribers' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl space-y-1">
                  <div className="text-xs text-neutral-400">Total Active Subscribers</div>
                  <div className="text-2xl font-bold font-mono text-white">{mySubscribersCount.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-400">+12% new subscribers this month</div>
                </div>
                <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl space-y-1">
                  <div className="text-xs text-neutral-400">Monthly Recurring Revenue</div>
                  <div className="text-2xl font-bold font-mono text-[#fce7b0]">${Number(mrr).toLocaleString()}</div>
                  <div className="text-[11px] text-neutral-400">Calculated after platform fee</div>
                </div>
                <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl space-y-1">
                  <div className="text-xs text-neutral-400">Subscriber Retention</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400">94.2%</div>
                  <div className="text-[11px] text-neutral-400">30-day renewal completion</div>
                </div>
              </div>

              <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-3">
                <h4 className="text-sm font-bold text-white">Recent Active Subscribers</h4>
                <div className="space-y-2">
                  {subscriptions.map(sub => (
                    <div key={sub.id} className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#24242d] flex items-center justify-center font-bold text-[#d4af37]">
                          {sub.fanId.slice(4, 6).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white">Patron {sub.fanId}</div>
                          <div className="text-[10px] text-neutral-400">{sub.tierName} Tier · Next renewal {sub.nextRenewalDate}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-[#fce7b0]">
                        ${sub.monthlyPrice.toFixed(2)}/mo
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-item: Followers */}
          {activeSubItem === 'followers' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Free Followers Funnel</h3>
                  <p className="text-xs text-neutral-400">Followers can see public updates and be converted into paid subscribers.</p>
                </div>
                <div className="text-xl font-bold font-mono text-white">14,250 Followers</div>
              </div>
              <div className="p-4 bg-[#18181c] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-neutral-200">Free to Paid Conversion Rate</span>
                  <div className="text-[11px] text-neutral-500">Industry benchmark: 2.5%</div>
                </div>
                <span className="text-base font-bold font-mono text-emerald-400">9.96%</span>
              </div>
            </div>
          )}

          {/* Sub-item: Messages */}
          {activeSubItem === 'messages' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Direct Fan Inquiries & VIP Messages</h3>
                  <p className="text-xs text-neutral-400">Direct conversations with paying subscribers and paid message unlocks.</p>
                </div>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Manage your conversations, send locked pay-per-view images/videos inside chat threads, and reply to VIP members.
              </p>
              <div className="p-4 bg-[#18181c] rounded-xl flex items-center justify-between">
                <div className="text-xs">
                  <div className="font-semibold text-white">Active Message Threads: 18</div>
                  <div className="text-[11px] text-[#fce7b0]">3 pending paid unlock requests</div>
                </div>
                <button
                  onClick={() => window.location.href = '#messages'}
                  className="px-4 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl cursor-pointer"
                >
                  Go to Messages Hub
                </button>
              </div>
            </div>
          )}

          {/* Sub-item: Community */}
          {activeSubItem === 'community' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Community Engagement</h3>
              <p className="text-xs text-neutral-400">
                Post comments, poll results, and community feedback from your active fanbase.
              </p>
              <div className="p-4 bg-[#18181c] rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-neutral-300">
                  <span>Community Sentiment Score</span>
                  <span className="font-mono text-emerald-400 font-bold">98.4% Positive</span>
                </div>
                <div className="w-full bg-[#121215] h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[98.4%]" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. MONETIZATION SECTION                                 */}
      {/* ======================================================== */}
      {activeCategory === 'MONETIZATION' && (
        <div className="space-y-6">
          {/* Sub-item: Subscription Plans */}
          {(activeSubItem === 'subscription_plans' || activeSubItem === 'subscriptions') && (
            <SubscriptionPlansSection
              onOpenPreview={() => {
                setActiveCategory('PROFILE');
                setActiveSubItem('preview_profile');
              }}
            />
          )}

          {/* Sub-item: My Pricing & Rates */}
          {activeSubItem === 'monetization_rates' && (
            <MonetizationRatesSection
              onNavigateToPlans={() => setActiveSubItem('subscription_plans')}
            />
          )}

          {/* Sub-item: Pay-per-view */}
          {activeSubItem === 'pay_per_view' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Pay-Per-View Content Vault</h3>
                  <p className="text-xs text-neutral-400">Individual unlock revenue generated by locked posts and video teasers.</p>
                </div>
                <div className="text-xl font-bold font-mono text-[#fce7b0]">$9,228.00 Earned</div>
              </div>
              <div className="p-4 bg-[#18181c] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-white">Average PPV Unlock Price</span>
                  <div className="text-[11px] text-neutral-500">Across 615 total unlocks</div>
                </div>
                <span className="font-mono font-bold text-white">$15.00</span>
              </div>
            </div>
          )}

          {/* Sub-item: Custom Video Requests */}
          {activeSubItem === 'custom_requests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Custom Video Requests</h3>
                  <p className="text-xs text-neutral-400">Escrow-backed personalized video requests from patrons.</p>
                </div>
                <button
                  onClick={onNavigateToRequests}
                  className="px-4 py-2 bg-[#d4af37] text-black text-xs font-bold rounded-xl cursor-pointer"
                >
                  Manage Requests Queue
                </button>
              </div>

              <div className="space-y-3">
                {customRequests.slice(0, 3).map(req => (
                  <div key={req.id} className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{req.title}</div>
                      <div className="text-[11px] text-neutral-400">For {req.recipientName} · By @{req.fanUsername}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-[#fce7b0]">${req.price.toFixed(2)}</div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold">{req.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-item: Paid Messages */}
          {activeSubItem === 'paid_messages' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Paid Direct Messages</h3>
              <p className="text-xs text-neutral-400">Revenue earned from paid message requests and locked media attachments in chat.</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#18181c] rounded-xl text-xs space-y-1">
                  <div className="text-neutral-400">Paid Message Earnings</div>
                  <div className="text-xl font-bold font-mono text-[#fce7b0]">$1,538.00</div>
                </div>
                <div className="p-4 bg-[#18181c] rounded-xl text-xs space-y-1">
                  <div className="text-neutral-400">Average Message Price</div>
                  <div className="text-xl font-bold font-mono text-white">$15.00</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-item: Tips and Gifts */}
          {activeSubItem === 'tips_gifts' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white">Tips and Virtual Gifts</h3>
              <p className="text-xs text-neutral-400">Tips received during live broadcasts and directly on feed posts.</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Virtual Champagne', value: '$25.00', count: 48 },
                  { name: 'Super Diamond', value: '$50.00', count: 18 },
                  { name: 'Golden Acovon Crown', value: '$100.00', count: 9 }
                ].map((g, i) => (
                  <div key={i} className="p-4 bg-[#18181c] rounded-xl text-xs space-y-1">
                    <div className="font-semibold text-white">{g.name}</div>
                    <div className="text-lg font-mono font-bold text-[#fce7b0]">{g.value}</div>
                    <div className="text-[10px] text-neutral-500">{g.count} gifts received</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-item: Livestream Earnings */}
          {activeSubItem === 'livestream_earnings' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Livestream &amp; Replay Revenue Streams</h3>
                  <p className="text-xs text-neutral-400">PPV ticket sales, official paid replay unlocks, highlight chat badges, and live tips.</p>
                </div>
                <div className="text-xl font-bold font-mono text-[#fce7b0]">$6,959.00 Gross</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 bg-[#18181c] rounded-xl space-y-1">
                  <div className="font-semibold text-white">PPV Live Ticket Gross</div>
                  <div className="text-[11px] text-neutral-400">324 tickets sold across pay-per-view live broadcasts.</div>
                </div>
                <div className="p-4 bg-[#18181c] rounded-xl space-y-1 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-[#fce7b0]">Official Paid Replay Revenue</div>
                    <div className="text-[11px] text-neutral-400">Monetize recordings after streams end.</div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCategory('LIVE');
                      setActiveSubItem('my_recordings');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#d4af37] text-black font-bold text-xs cursor-pointer"
                  >
                    Manage Recordings
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. LIVE SECTION                                         */}
      {/* ======================================================== */}
      {activeCategory === 'LIVE' && (
        <div className="space-y-6">
          {/* Sub-item: Go Live */}
          {activeSubItem === 'go_live' && (
            <div className="bg-gradient-to-r from-red-950/40 via-[#181416] to-[#121215] border border-red-500/30 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-500 mx-auto animate-pulse">
                <Radio className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white">Start Acovon Live Broadcast</h3>
              <p className="text-xs text-neutral-300 leading-relaxed">
                Choose between Public, All Subscribers Only, Selected Tier, Pay-Per-View, or Private Invite. Configure Official Server-Side Recording (Disabled, Free Replay, or Custom Paid Replay) before going live.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setIsCreateLiveModalOpen(true)}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Radio className="w-4 h-4" />
                  <span>Configure &amp; Launch Live Stream</span>
                </button>
                <button
                  onClick={() => setActiveSubItem('my_recordings')}
                  className="px-5 py-3 bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-[#fce7b0] font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <Film className="w-4 h-4 text-[#d4af37]" />
                  <span>My Live Recordings</span>
                </button>
              </div>
            </div>
          )}

          {/* Sub-item: My Live Recordings */}
          {activeSubItem === 'my_recordings' && (() => {
            const myStreams = livestreams.filter(s => s.creatorId === creator.id);
            const totalFreeReplayViews = myStreams
              .filter(s => s.recordingSettings?.mode === 'free')
              .reduce((acc, s) => acc + (s.replayViewsCount || 0), 0);
            const totalAllReplayViews = myStreams.reduce((acc, s) => acc + (s.replayViewsCount || 0), 0);
            const totalPaidReplayPurchases = myStreams.reduce((acc, s) => acc + (s.replayPurchasesCount || 0), 0);
            const totalReplayGross = myStreams.reduce((acc, s) => acc + (s.replayGrossRevenue || 0), 0);
            const totalReplayPlatformFee = myStreams.reduce((acc, s) => acc + (s.replayPlatformFee || 0), 0);
            const totalReplayNet = myStreams.reduce((acc, s) => acc + (s.replayNetRevenue || 0), 0);

            const handleStartEditRecording = (s: typeof myStreams[0]) => {
              setEditingRecordingId(s.id);
              setEditRecMode(s.recordingSettings?.mode || 'paid');
              setEditRecPrice(String(s.recordingSettings?.price || 14.99));
              setEditRecAvail(s.recordingSettings?.availabilityDays || 'unlimited');
              setEditRecPermission(s.recordingSettings?.replayPermission || 'paid');
              setEditRecDesc(s.recordingSettings?.description || s.description);
            };

            const handleSaveRecordingChanges = (streamId: string) => {
              const parsedPrice = Number(editRecPrice);
              if (editRecMode === 'paid' && (isNaN(parsedPrice) || parsedPrice < 1.99 || parsedPrice > 500)) {
                setRecFeedback('Error: Custom recording price must be between $1.99 and $500.00.');
                return;
              }
              const res = updateLivestreamRecording(streamId, {
                mode: editRecMode,
                price: editRecMode === 'paid' ? parsedPrice : undefined,
                availabilityDays: editRecAvail,
                description: editRecDesc,
                replayPermission:
                  editRecMode === 'paid'
                    ? 'paid'
                    : editRecMode === 'free' && editRecPermission === 'paid'
                    ? 'public'
                    : editRecPermission
              });
              if (res.success) {
                setEditingRecordingId(null);
                setRecFeedback(
                  'Recording settings & pricing updated for future viewers. Existing buyers retain permanent access.'
                );
                setTimeout(() => setRecFeedback(''), 4000);
              } else {
                setRecFeedback(res.error || 'Failed to update recording.');
              }
            };

            return (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Film className="w-5 h-5 text-[#d4af37]" />
                      <h3 className="text-base font-bold text-white">My Live Recordings &amp; Replay Monetization</h3>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Control official server recordings, custom replay pricing, audience permissions, and availability periods.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCreateLiveModalOpen(true)}
                    className="px-4 py-2 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>New Recorded Broadcast</span>
                  </button>
                </div>

                {recFeedback && (
                  <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{recFeedback}</span>
                  </div>
                )}

                {/* Recording Revenue Analytics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl">
                    <div className="text-[11px] text-neutral-400">Replay Views</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      {totalAllReplayViews.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-0.5">
                      {totalFreeReplayViews} free views
                    </div>
                  </div>

                  <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl">
                    <div className="text-[11px] text-neutral-400">Paid Replay Purchases</div>
                    <div className="text-xl font-bold font-mono text-[#fce7b0] mt-1">
                      {totalPaidReplayPurchases.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Individual unlocks</div>
                  </div>

                  <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl">
                    <div className="text-[11px] text-neutral-400">Gross Replay Revenue</div>
                    <div className="text-xl font-bold font-mono text-white mt-1">
                      ${totalReplayGross.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">100% gross volume</div>
                  </div>

                  <div className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl">
                    <div className="text-[11px] text-neutral-400">Platform Commission (20%)</div>
                    <div className="text-xl font-bold font-mono text-neutral-400 mt-1">
                      ${totalReplayPlatformFee.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-neutral-500 mt-0.5">Hosting &amp; bandwidth</div>
                  </div>

                  <div className="p-4 bg-[#121215] border border-[#d4af37]/40 rounded-2xl">
                    <div className="text-[11px] text-[#fce7b0]">Creator Net Earnings (80%)</div>
                    <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                      ${totalReplayNet.toFixed(2)}
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-0.5">Credited to wallet</div>
                  </div>
                </div>

                {/* Recordings List */}
                <div className="space-y-4">
                  {myStreams.length === 0 ? (
                    <div className="p-10 text-center bg-[#121215] border border-[#27272a] rounded-2xl text-xs text-neutral-400">
                      You have no recorded broadcasts yet. Start a livestream with Free or Paid Recording enabled to archive replays here.
                    </div>
                  ) : (
                    myStreams.map(s => {
                      const recMode = s.recordingSettings?.mode || 'disabled';
                      const recPrice = s.recordingSettings?.price || 0;
                      const isPublished = s.isReplayPublished !== false && s.recordingStatus !== 'unpublished';
                      const isEditing = editingRecordingId === s.id;

                      return (
                        <div
                          key={s.id}
                          className="p-5 bg-[#121215] border border-[#27272a] rounded-2xl space-y-4"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            {/* Left: Thumbnail & Metadata */}
                            <div className="flex items-start gap-4 min-w-0">
                              <div className="relative w-28 h-20 rounded-xl bg-black overflow-hidden shrink-0 border border-zinc-800">
                                <img src={s.coverImage} alt={s.title} className="w-full h-full object-cover" />
                                <span
                                  className={`absolute top-1.5 left-1.5 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                                    s.status === 'live'
                                      ? 'bg-red-600 text-white'
                                      : s.recordingStatus === 'ready'
                                      ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/40'
                                      : 'bg-zinc-900/90 text-zinc-300'
                                  }`}
                                >
                                  {s.status === 'live' ? 'REC · LIVE' : s.recordingStatus || 'ready'}
                                </span>
                              </div>

                              <div className="min-w-0 space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-white text-sm truncate">{s.title}</h4>
                                  {recMode === 'disabled' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-zinc-800 text-zinc-400">
                                      Recording Disabled
                                    </span>
                                  )}
                                  {recMode === 'free' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/70 border border-emerald-500/30 text-emerald-300">
                                      Free Replay ({s.recordingSettings?.replayPermission?.replace('_', ' ') || 'public'})
                                    </span>
                                  )}
                                  {recMode === 'paid' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fce7b0]">
                                      Paid Recording · ${recPrice.toFixed(2)} USD
                                    </span>
                                  )}
                                  {!isPublished && recMode !== 'disabled' && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/70 border border-amber-500/40 text-amber-300">
                                      Unpublished (Hidden from New Buyers)
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs text-neutral-400 line-clamp-1">
                                  {s.recordingSettings?.description || s.description}
                                </p>

                                <div className="flex flex-wrap items-center gap-3 text-[11px] text-neutral-500 font-mono pt-0.5">
                                  <span>Published: {s.recordingPublishedAt || s.startedAt || 'Live'}</span>
                                  <span>·</span>
                                  <span>Expires: {s.recordingExpiresAt || 'Unlimited'}</span>
                                  <span>·</span>
                                  <span>Views: {(s.replayViewsCount || 0).toLocaleString()}</span>
                                  <span>·</span>
                                  <span>Purchases: {(s.replayPurchasesCount || 0).toLocaleString()}</span>
                                  <span>·</span>
                                  <span className="text-[#fce7b0] font-semibold">
                                    Gross: ${(s.replayGrossRevenue || 0).toFixed(2)} (Net: ${(s.replayNetRevenue || 0).toFixed(2)})
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Right: Creator Management Buttons */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                onClick={() => setActiveLivestreamId(s.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#18181c] hover:bg-[#222228] border border-[#27272a] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5 text-[#d4af37]" />
                                <span>{s.status === 'live' ? 'Open Stream' : 'Preview Replay'}</span>
                              </button>

                              <button
                                onClick={() => (isEditing ? setEditingRecordingId(null) : handleStartEditRecording(s))}
                                className="px-3 py-1.5 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/40 text-xs font-semibold text-[#fce7b0] flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit3 className="w-3.5 h-3.5 text-[#d4af37]" />
                                <span>{isEditing ? 'Close Editor' : 'Edit Price & Access'}</span>
                              </button>

                              {recMode !== 'disabled' && (
                                <button
                                  onClick={() => {
                                    updateLivestreamRecording(s.id, { isReplayPublished: !isPublished });
                                    setRecFeedback(
                                      !isPublished
                                        ? `Published "${s.title}" to Official Replays.`
                                        : `Unpublished "${s.title}" from new buyers (existing buyers keep access).`
                                    );
                                    setTimeout(() => setRecFeedback(''), 3500);
                                  }}
                                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    isPublished
                                      ? 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:text-white'
                                      : 'bg-emerald-600/20 border-emerald-500/40 text-emerald-300'
                                  }`}
                                >
                                  {isPublished ? 'Unpublish' : 'Publish Replay'}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Recording Settings Editor */}
                          {isEditing && (
                            <div className="pt-4 border-t border-[#27272a] space-y-4 bg-[#16161a] p-4 rounded-xl">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#d4af37]">
                                  Update Replay Monetization &amp; Permissions
                                </span>
                                <span className="text-[11px] text-neutral-400">
                                  {(s.replayPurchasesCount || 0) > 0
                                    ? `Note: ${s.replayPurchasesCount} existing buyers automatically keep their purchased replay access.`
                                    : 'Applies immediately to all viewers'}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <label className="block text-neutral-400 mb-1">Recording Access Mode</label>
                                  <select
                                    value={editRecMode}
                                    onChange={(e) => setEditRecMode(e.target.value as RecordingMode)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-zinc-700 text-white"
                                  >
                                    <option value="disabled">Option A: Disabled (No Replay)</option>
                                    <option value="free">Option B: Free Recording</option>
                                    <option value="paid">Option C: Paid Recording</option>
                                  </select>
                                </div>

                                {editRecMode === 'paid' ? (
                                  <div>
                                    <label className="block text-[#fce7b0] mb-1">Future Buyer Price (USD)</label>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="1.99"
                                      max="500"
                                      value={editRecPrice}
                                      onChange={(e) => setEditRecPrice(e.target.value)}
                                      className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-[#d4af37]/50 text-white font-mono"
                                    />
                                  </div>
                                ) : editRecMode === 'free' ? (
                                  <div>
                                    <label className="block text-neutral-400 mb-1">Free Replay Audience</label>
                                    <select
                                      value={editRecPermission}
                                      onChange={(e) => setEditRecPermission(e.target.value as ReplayPermission)}
                                      className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-zinc-700 text-white"
                                    >
                                      <option value="public">Public (Everyone)</option>
                                      <option value="followers">Followers Only</option>
                                      <option value="subscribers">Active Subscribers Only</option>
                                      <option value="selected_plan">Selected Tier Only</option>
                                    </select>
                                  </div>
                                ) : null}

                                <div>
                                  <label className="block text-neutral-400 mb-1">Availability Period</label>
                                  <select
                                    value={String(editRecAvail)}
                                    onChange={(e) =>
                                      setEditRecAvail(
                                        e.target.value === 'unlimited' ? 'unlimited' : Number(e.target.value)
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-zinc-700 text-white"
                                  >
                                    <option value="7">7 Days</option>
                                    <option value="30">30 Days</option>
                                    <option value="90">90 Days</option>
                                    <option value="unlimited">Unlimited</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-neutral-400 mb-1">Description</label>
                                  <input
                                    type="text"
                                    value={editRecDesc}
                                    onChange={(e) => setEditRecDesc(e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg bg-[#111114] border border-zinc-700 text-white"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingRecordingId(null)}
                                  className="px-4 py-1.5 rounded-lg text-xs text-neutral-400 hover:text-white cursor-pointer"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveRecordingChanges(s.id)}
                                  className="px-4 py-1.5 rounded-lg bg-[#d4af37] text-black font-bold text-xs cursor-pointer"
                                >
                                  Save Recording Settings
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })()}

          {/* Sub-item: Scheduled Livestreams */}
          {activeSubItem === 'scheduled_live' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Upcoming Scheduled Broadcasts</h3>
                <button
                  onClick={() => setIsCreateLiveModalOpen(true)}
                  className="px-3 py-1.5 bg-[#d4af37] text-black text-xs font-bold rounded-lg cursor-pointer"
                >
                  Schedule Stream
                </button>
              </div>

              <div className="space-y-3">
                {livestreams.filter(s => s.status === 'scheduled').map(s => (
                  <div key={s.id} className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-black overflow-hidden shrink-0">
                        <img src={s.coverImage} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="font-bold text-white">{s.title}</div>
                        <div className="text-[10px] text-neutral-400 capitalize">
                          {s.accessMode.replace('_', ' ')} · {s.scheduledFor} · Replay: {s.recordingSettings?.mode || 'disabled'}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-[#22222a] text-[#fce7b0]">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-item: Livestream History */}
          {activeSubItem === 'live_history' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Past Broadcast Archives</h3>
                <button
                  onClick={() => setActiveSubItem('my_recordings')}
                  className="text-xs text-[#d4af37] hover:underline cursor-pointer"
                >
                  Manage Replay Pricing &amp; Access →
                </button>
              </div>
              {livestreams.filter(s => s.status === 'ended').map((h) => (
                <div key={h.id} className="p-4 bg-[#121215] border border-[#27272a] rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-white">{h.title}</div>
                    <div className="text-[10px] text-neutral-400">
                      {h.endedAt || h.startedAt} · Duration: {h.expectedDurationMinutes}m · Recording: {h.recordingSettings?.mode || 'disabled'}
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-neutral-200">{(h.replayViewsCount || 0).toLocaleString()} replay views</div>
                    <div className="text-[#fce7b0] font-bold">${(h.replayGrossRevenue || 0).toFixed(2)} replay gross</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sub-item: Live Analytics */}
          {activeSubItem === 'live_analytics' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-[#121215] border border-[#27272a] rounded-2xl">
                <div className="text-xs text-neutral-400 mb-1">Average Concurrent Viewers</div>
                <div className="text-2xl font-bold font-mono text-white">1,620</div>
                <div className="text-[11px] text-emerald-400 mt-1">+24% vs last month</div>
              </div>
              <div className="p-5 bg-[#121215] border border-[#27272a] rounded-2xl">
                <div className="text-xs text-neutral-400 mb-1">Live Chat Messages / Min</div>
                <div className="text-2xl font-bold font-mono text-[#fce7b0]">142 msg/min</div>
                <div className="text-[11px] text-neutral-400 mt-1">High engagement velocity</div>
              </div>
              <div className="p-5 bg-[#121215] border border-[#27272a] rounded-2xl">
                <div className="text-xs text-neutral-400 mb-1">Highlight Clips Created</div>
                <div className="text-2xl font-bold font-mono text-white">{highlightClips.length || 8}</div>
                <div className="text-[11px] text-neutral-400 mt-1">Saved to content library</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. PROMOTION SECTION                                    */}
      {/* ======================================================== */}
      {activeCategory === 'PROMOTION' && (
        <div className="space-y-6">
          {/* Sub-item: Promote Profile / Posts / Campaigns */}
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-6">
            <div className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-[#d4af37]" />
              <div>
                <h3 className="font-bold text-white text-base">Self-Service Creator Promotions</h3>
                <p className="text-xs text-neutral-400">Boost discovery and feed placement with guaranteed impressions.</p>
              </div>
            </div>

            <form onSubmit={handleLaunchPromo} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'boost_profile' as const, label: 'Boost Profile', desc: 'Top placement on Discovery & Category pages' },
                  { id: 'promote_post' as const, label: 'Promote Post', desc: 'Spotlight video into high-intent recommendation feeds' },
                  { id: 'featured_creator' as const, label: 'Featured Creator', desc: 'Front-page marquee hero rotation' }
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPromoType(opt.id)}
                    className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                      promoType === opt.id
                        ? 'bg-[#1e1e24] border-[#d4af37] text-white shadow-lg shadow-[#d4af37]/10'
                        : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-xs text-neutral-200 mb-1">{opt.label}</div>
                    <div className="text-[11px] text-neutral-500 leading-snug">{opt.desc}</div>
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-2">
                  Select Budget Package
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { amt: 10, days: 3, label: 'Starter ($10)' },
                    { amt: 25, days: 7, label: 'Growth ($25 · Recommended)' },
                    { amt: 50, days: 14, label: 'Premium ($50)' }
                  ].map(b => (
                    <button
                      key={b.amt}
                      type="button"
                      onClick={() => setPromoBudget(b.amt)}
                      className={`p-3 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                        promoBudget === b.amt
                          ? 'bg-[#d4af37]/15 border-[#d4af37] text-[#fce7b0]'
                          : 'bg-[#18181c] border-[#27272a] text-neutral-400 hover:text-white'
                      }`}
                    >
                      <div>{b.label}</div>
                      <div className="text-[10px] text-neutral-500 font-sans font-normal mt-0.5">{b.days} Days Duration</div>
                    </button>
                  ))}
                </div>
              </div>

              {promoSucceeded && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs text-emerald-300">
                  Campaign activated! Your content is now prioritized in discovery feeds.
                </div>
              )}

              <button
                type="submit"
                className="px-6 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20 transition-all cursor-pointer"
              >
                Launch Promotion (${promoBudget}.00)
              </button>
            </form>
          </div>

          {/* Active Campaigns List */}
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
            <h4 className="text-sm font-bold text-white">Active Promotion Campaigns</h4>
            <div className="space-y-3">
              {promotions.map(camp => (
                <div key={camp.id} className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-white">{camp.packageTitle}</div>
                    <div className="text-[10px] text-neutral-500 font-mono">
                      Budget: ${camp.budget} · Active until {camp.endDate}
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-neutral-300 font-mono">
                    <div>
                      <div className="text-[10px] text-neutral-500 font-sans">Impressions</div>
                      <div>{camp.impressions.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 font-sans">Clicks</div>
                      <div>{camp.clicks}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-neutral-500 font-sans">Visits</div>
                      <div className="text-[#fce7b0]">{camp.profileVisits}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 6. ANALYTICS SECTION                                    */}
      {/* ======================================================== */}
      {activeCategory === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Sub-item: Earnings */}
          {activeSubItem === 'earnings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-[#121215] border border-[#26262b] rounded-2xl space-y-1">
                  <div className="text-xs text-neutral-400">Total Lifetime Gross</div>
                  <div className="text-2xl font-bold font-mono text-white">${myEarnings.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-400">+18.4% growth</div>
                </div>
                <div className="p-5 bg-[#121215] border border-[#26262b] rounded-2xl space-y-1">
                  <div className="text-xs text-neutral-400">Available Payout Balance</div>
                  <div className="text-2xl font-bold font-mono text-[#fce7b0]">${creator.walletBalance.toFixed(2)}</div>
                  <button onClick={onOpenWallet} className="text-[11px] text-[#d4af37] hover:underline cursor-pointer">
                    Request Payout →
                  </button>
                </div>
                <div className="p-5 bg-[#121215] border border-[#26262b] rounded-2xl space-y-1">
                  <div className="text-xs text-neutral-400">Average Monthly Revenue</div>
                  <div className="text-2xl font-bold font-mono text-white">$12,850.00</div>
                  <div className="text-[11px] text-neutral-400">Recurring baseline</div>
                </div>
              </div>

              {/* Revenue Streams Distribution */}
              <div className="bg-[#121215] border border-[#26262b] rounded-2xl p-6 space-y-4">
                <h4 className="text-sm font-bold text-white">Gross Revenue Distribution</h4>
                <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden flex">
                  <div style={{ width: '48%' }} className="bg-[#d4af37]" title="Subscriptions 48%" />
                  <div style={{ width: '24%' }} className="bg-emerald-500" title="PPV Vault 24%" />
                  <div style={{ width: '16%' }} className="bg-blue-500" title="Custom Videos 16%" />
                  <div style={{ width: '8%' }} className="bg-purple-500" title="Video Calls 8%" />
                  <div style={{ width: '4%' }} className="bg-rose-500" title="Tips 4%" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  <div className="text-xs"><span className="text-[#d4af37] font-bold">48%</span> Subscriptions</div>
                  <div className="text-xs"><span className="text-emerald-400 font-bold">24%</span> PPV Vault</div>
                  <div className="text-xs"><span className="text-blue-400 font-bold">16%</span> Custom Videos</div>
                  <div className="text-xs"><span className="text-purple-400 font-bold">8%</span> Video Calls</div>
                  <div className="text-xs"><span className="text-rose-400 font-bold">4%</span> Tips & Gifts</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-item: Performance */}
          {activeSubItem === 'performance' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 bg-[#121215] border border-[#26262b] rounded-2xl">
                <div className="text-xs text-neutral-400 mb-1">Fan Conversion Rate</div>
                <div className="text-2xl font-bold font-mono text-white">4.82%</div>
                <div className="text-[11px] text-neutral-500 mt-1">Profile visits to paid patrons</div>
              </div>
              <div className="p-5 bg-[#121215] border border-[#26262b] rounded-2xl">
                <div className="text-xs text-neutral-400 mb-1">Average Revenue Per User (ARPU)</div>
                <div className="text-2xl font-bold font-mono text-[#fce7b0]">$27.10</div>
                <div className="text-[11px] text-neutral-500 mt-1">Blended monthly gross per active fan</div>
              </div>
              <div className="p-5 bg-[#121215] border border-[#26262b] rounded-2xl">
                <div className="text-xs text-neutral-400 mb-1">Private Call Hours Billed</div>
                <div className="text-2xl font-bold font-mono text-white">28.4 hrs</div>
                <div className="text-[11px] text-neutral-500 mt-1">Billed at ${creator.callRatePerMinute.toFixed(2)}/min</div>
              </div>
            </div>
          )}

          {/* Sub-item: Audience Analytics */}
          {activeSubItem === 'audience_analytics' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <h4 className="text-sm font-bold text-white">Audience Demographics & Top Regions</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-[#18181c] rounded-xl space-y-1">
                  <div className="text-neutral-400">United States</div>
                  <div className="text-lg font-bold font-mono text-white">45%</div>
                </div>
                <div className="p-3 bg-[#18181c] rounded-xl space-y-1">
                  <div className="text-neutral-400">United Kingdom</div>
                  <div className="text-lg font-bold font-mono text-white">20%</div>
                </div>
                <div className="p-3 bg-[#18181c] rounded-xl space-y-1">
                  <div className="text-neutral-400">European Union</div>
                  <div className="text-lg font-bold font-mono text-white">18%</div>
                </div>
                <div className="p-3 bg-[#18181c] rounded-xl space-y-1">
                  <div className="text-neutral-400">Canada & Australia</div>
                  <div className="text-lg font-bold font-mono text-white">17%</div>
                </div>
              </div>
            </div>
          )}

          {/* Sub-item: Revenue Reports */}
          {activeSubItem === 'revenue_reports' && (
            <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Financial Statements & Reports</h4>
                  <p className="text-xs text-neutral-400">Download audited statements for taxation and payouts.</p>
                </div>
                <button
                  onClick={() => alert('Exporting monthly statement CSV for ' + creator.name + '...')}
                  className="px-4 py-2 bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-xs font-semibold rounded-xl text-neutral-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>

              <div className="space-y-2">
                {transactions.slice(0, 4).map(tx => (
                  <div key={tx.id} className="p-3 bg-[#18181c] rounded-xl flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-white capitalize">{tx.description || tx.type}</span>
                      <div className="text-[10px] text-neutral-500 font-sans">{tx.createdAt}</div>
                    </div>
                    <span className="text-[#fce7b0] font-bold">${tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
