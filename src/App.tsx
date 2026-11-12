import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { LandingPage } from './components/public/LandingPage';
import { FeedView } from './components/feed/FeedView';
import { ExplorePage } from './components/explore/ExplorePage';
import { CategoriesDiscoveryPage } from './components/discovery/CategoriesDiscoveryPage';
import { CreatorProfilePage } from './components/creator/CreatorProfilePage';
import { CustomRequestsManager } from './components/requests/CustomRequestsManager';
import { ChatView } from './components/messages/ChatView';
import { CreatorDashboard, StudioCategory } from './components/creator/CreatorDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminLoginPage } from './components/admin/AdminLoginPage';
import { AdminSetupPage } from './components/admin/AdminSetupPage';
import { AdminAccessDenied } from './components/admin/AdminAccessDenied';
import { WalletModal } from './components/wallet/WalletModal';
import { CreatePostModal } from './components/feed/CreatePostModal';
import { EditPostModal } from './components/feed/EditPostModal';
import { DeletePostModal } from './components/feed/DeletePostModal';
import { VideoCallModal } from './components/videocall/VideoCallModal';
import { AuthModal } from './components/auth/AuthModal';
import { AdFreeModal } from './components/ads/AdFreeModal';
import { CreatorAdvertisingModal } from './components/creator/CreatorAdvertisingModal';
import { LivestreamsHub } from './components/live/LivestreamsHub';
import { LivestreamModal } from './components/live/LivestreamModal';
import { CreateLivestreamModal } from './components/live/CreateLivestreamModal';
import { 
  EditProfileModal,
  PaymentMethodsModal,
  SubscriptionManagementModal,
  PurchaseHistoryModal,
  SettingsModal,
  PrivacyModal,
  HelpCenterModal
} from './components/profile/ProfileModals';
import { BecomeCreatorModal } from './components/creator/BecomeCreatorModal';
import { MySubscriptionsView } from './components/fan/MySubscriptionsView';
import { SubscribeModal } from './components/common/SubscribeModal';
import { ShareModal } from './components/common/ShareModal';
import { FullScreenVideoModal } from './components/feed/FullScreenVideoModal';
import { FullScreenPhotoModal } from './components/feed/FullScreenPhotoModal';
import { FanProfileModal } from './components/profile/FanProfileModal';
import { StatusViewerModal } from './components/status/StatusViewerModal';
import { ImportantAnnouncementPopupModal } from './components/common/AnnouncementExperience';
import { GlobalDomTranslator } from './components/common/GlobalDomTranslator';
import { supabase } from './supabaseClient.js';
import { Post } from './types';
import { X, Shield, Lock, FileText, Coins } from 'lucide-react';

function AppContent() {
  const { tipCreator, isCurrentUserApprovedCreator, isAuthenticated, currentUser } = useApp();
  const isCreator = isCurrentUserApprovedCreator;

  const [currentTab, setCurrentTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/admin/login') return 'admin-login';
      if (path === '/admin/setup') return 'admin-setup';
      if (path === '/admin' || path === '/admin-panel') return 'admin-panel';
    }
    return isAuthenticated ? 'feed' : 'landing';
  });
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('creator_elena');
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  
  // Modals state
  const [showWallet, setShowWallet] = useState<boolean>(false);
  const [showCreatePost, setShowCreatePost] = useState<boolean>(false);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showAdFree, setShowAdFree] = useState<boolean>(false);
  const [showCreatorAd, setShowCreatorAd] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState<boolean>(false);
  const [showSubscriptions, setShowSubscriptions] = useState<boolean>(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showPrivacy, setShowPrivacy] = useState<boolean>(false);
  const [showHelpCenter, setShowHelpCenter] = useState<boolean>(false);
  const [showBecomeCreator, setShowBecomeCreator] = useState<boolean>(false);
  const [showFanProfile, setShowFanProfile] = useState<boolean>(false);
  const [studioTargetSection, setStudioTargetSection] = useState<{
    category: StudioCategory;
    subItem: string;
    key: number;
  } | null>(null);
  const [accessDeniedNotice, setAccessDeniedNotice] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [infoModalTitle, setInfoModalTitle] = useState<string | null>(null);

  // Handle Supabase email verification / OAuth callback tokens and protect private pages with supabase.auth.getSession()
  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = searchParams.get('token_hash');
      const otpType = searchParams.get('type') as
        | 'signup'
        | 'email'
        | 'recovery'
        | 'invite'
        | 'magiclink'
        | null;
      const authCode = searchParams.get('code');

      if (tokenHash && otpType) {
        await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType });
      } else if (authCode) {
        await supabase.auth.exchangeCodeForSession(authCode);
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      const isAdminRoute = pathname.startsWith('/admin') || ['admin-login', 'admin-setup', 'admin-access-denied'].includes(currentTab);

      if (data.session) {
        if (!isAdminRoute && (currentTab === 'landing' || pathname === '/login')) {
          window.history.pushState({}, '', '/');
          setCurrentTab('feed');
        }
      } else {
        if (isAdminRoute) {
          return;
        }

        const isPublicGuestTab = ['landing', 'categories', 'countries', 'explore', 'creator-profile'].includes(currentTab);
        if (!isPublicGuestTab) {
          window.history.pushState({}, '', '/login');
          setCurrentTab('landing');
          setAuthMode('login');
          setShowAuth(true);
        } else if (pathname === '/login') {
          setAuthMode('login');
          setShowAuth(true);
        }
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [isAuthenticated, currentTab]);

  // Media Viewers & Social Interaction States
  const [subscribeTargetCreatorId, setSubscribeTargetCreatorId] = useState<string | null>(null);
  const [shareTargetPost, setShareTargetPost] = useState<Post | null>(null);
  const [fullScreenVideoPostId, setFullScreenVideoPostId] = useState<string | null>(null);
  const [fullScreenVideoTime, setFullScreenVideoTime] = useState<number>(0);
  const [fullScreenPhotoPostId, setFullScreenPhotoPostId] = useState<string | null>(null);
  const [fullScreenPhotoIndex, setFullScreenPhotoIndex] = useState<number>(0);
  const [activeStatusCreatorId, setActiveStatusCreatorId] = useState<string | null>(null);

  // Tip Modal state
  const [tipTarget, setTipTarget] = useState<{ id: string; name: string } | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(20);
  const [tipNote, setTipNote] = useState<string>('');

  const handleNavigate = async (tab: string, creatorId?: string) => {
    // Clear access notice when navigating
    setAccessDeniedNotice(null);

    // Dedicated Secure Admin Routing
    if (tab === 'admin-login') {
      window.history.pushState({}, '', '/admin/login');
      setCurrentTab('admin-login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'admin-setup') {
      window.history.pushState({}, '', '/admin/setup');
      setCurrentTab('admin-setup');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'admin-access-denied') {
      window.history.pushState({}, '', '/admin');
      setCurrentTab('admin-access-denied');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (tab === 'admin-panel' || tab === 'admin') {
      const isAdminUser = currentUser?.role === 'admin' || !!(currentUser as any)?.adminPermissionLevel;
      if (!isAdminUser) {
        window.history.pushState({}, '', '/admin');
        setCurrentTab('admin-access-denied');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      window.history.pushState({}, '', '/admin');
      setCurrentTab('admin-panel');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (['terms', 'privacy', 'community-guidelines', 'verification-rules', 'pricing', 'become-creator', 'earnings-calculator', 'payout-terms'].includes(tab)) {
      if (tab === 'become-creator') {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          window.history.pushState({}, '', '/login');
          setAuthMode('login');
          setShowAuth(true);
          return;
        }
        setShowBecomeCreator(true);
        return;
      }
      setInfoModalTitle(tab);
      return;
    }

    // Protect private pages with supabase.auth.getSession() — allow public guest discovery pages (landing, categories, countries, explore, creator-profile)
    const isPublicGuestTab = ['landing', 'categories', 'countries', 'explore', 'creator-profile'].includes(tab);
    if (!isPublicGuestTab) {
      const { data } = await supabase.auth.getSession();
      if (!data.session && !isAuthenticated) {
        window.history.pushState({}, '', '/login');
        setCurrentTab('landing');
        setAuthMode('login');
        setShowAuth(true);
        return;
      }
    }

    // Once authenticated, never show the landing page again — Home is the Feed
    const resolvedTab = isAuthenticated && tab === 'landing' ? 'feed' : tab;

    // Role-based Access Control (RBAC): Fans cannot access creator pages
    if (!isCreator && (resolvedTab === 'creator-studio' || resolvedTab === 'requests' || resolvedTab === 'creator-dashboard')) {
      setAccessDeniedNotice('Access Restricted: Creator Studio and creator management tools are reserved for approved creator accounts. Apply below to unlock full creator capabilities.');
      setShowBecomeCreator(true);
      setCurrentTab('feed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (creatorId) {
      setSelectedCreatorId(creatorId);
    }
    setCurrentTab(resolvedTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCreatePost = () => {
    if (!isCreator) {
      setAccessDeniedNotice('Content publishing is reserved for verified creator accounts. Complete your creator application to publish posts.');
      setShowBecomeCreator(true);
      return;
    }
    setShowCreatePost(true);
  };

  const handleOpenTipModal = (creatorId: string, creatorName: string) => {
    setTipTarget({ id: creatorId, name: creatorName });
  };

  const handleExecuteTip = () => {
    if (!tipTarget) return;
    const res = tipCreator(tipTarget.id, tipAmount, tipNote);
    if (res.success) {
      setTipTarget(null);
      setTipNote('');
      alert(`Tip of $${tipAmount.toFixed(2)} sent to ${tipTarget.name}!`);
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col justify-between selection:bg-[#d4af37]/30 selection:text-[#fef08a] transition-colors duration-200">
      
      {/* Top Header */}
      <Header
        currentTab={isAuthenticated && currentTab === 'landing' ? 'feed' : currentTab}
        onNavigate={handleNavigate}
        onOpenWallet={() => setShowWallet(true)}
        onOpenCreatePost={handleOpenCreatePost}
        onOpenAuth={(mode = 'login') => {
          setAuthMode(mode);
          setShowAuth(true);
        }}
        onOpenAdFree={() => setShowAdFree(true)}
        onOpenCreatorAd={() => setShowCreatorAd(true)}
        onOpenEditProfile={() => {
          if (isCreator) {
            setStudioTargetSection({
              category: 'PROFILE',
              subItem: 'edit_profile',
              key: Date.now()
            });
            setCurrentTab('creator-studio');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            setShowEditProfile(true);
          }
        }}
        onOpenPaymentMethods={() => setShowPaymentMethods(true)}
        onOpenSubscriptions={() => {
          if (isCreator) {
            setShowSubscriptions(true);
          } else {
            handleNavigate('subscriptions');
          }
        }}
        onOpenPurchaseHistory={() => setShowPurchaseHistory(true)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenPrivacy={() => setShowPrivacy(true)}
        onOpenHelpCenter={() => setShowHelpCenter(true)}
        onOpenBecomeCreator={() => setShowBecomeCreator(true)}
        onOpenFanProfile={() => setShowFanProfile(true)}
        searchQuery={globalSearchQuery}
        onSearchChange={setGlobalSearchQuery}
      />

      {/* RBAC Access Denied Notification Banner */}
      {accessDeniedNotice && (
        <div className="max-w-4xl mx-auto px-4 pt-4 w-full animate-in fade-in slide-in-from-top-2">
          <div className="p-3.5 bg-gradient-to-r from-[#211d14] via-[#1c1810] to-[#141418] border border-[#d4af37]/60 rounded-xl flex items-center justify-between gap-3 shadow-xl">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-[#d4af37] shrink-0" />
              <span className="text-xs text-neutral-200">{accessDeniedNotice}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  setAccessDeniedNotice(null);
                  setShowBecomeCreator(true);
                }}
                className="px-3.5 py-1.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                Apply to Become Creator
              </button>
              <button
                onClick={() => setAccessDeniedNotice(null)}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewport */}
      <main className="flex-1 pb-16 md:pb-0">
        {!isAuthenticated && currentTab === 'landing' && (
          <LandingPage
            onNavigate={handleNavigate}
            onOpenAuth={(mode = 'register') => {
              setAuthMode(mode);
              setShowAuth(true);
            }}
          />
        )}

        {isAuthenticated && (currentTab === 'feed' || currentTab === 'landing') && (
          <FeedView
            onNavigateToCreator={(id) => handleNavigate('creator-profile', id)}
            onOpenCreatePost={handleOpenCreatePost}
            onOpenTipModal={handleOpenTipModal}
            onGoAdFree={() => setShowAdFree(true)}
            onOpenCreatorAd={() => setShowCreatorAd(true)}
            onNavigateToRequests={() => isCreator ? handleNavigate('requests') : handleNavigate('feed')}
            onOpenSubscribeModal={(creatorId) => setSubscribeTargetCreatorId(creatorId)}
            onOpenShareModal={(post) => setShareTargetPost(post)}
            onOpenVideoPlayer={(postId, time) => {
              setFullScreenVideoPostId(postId);
              setFullScreenVideoTime(time || 0);
            }}
            onOpenPhotoViewer={(postId, mediaIdx) => {
              setFullScreenPhotoPostId(postId);
              setFullScreenPhotoIndex(mediaIdx || 0);
            }}
            onOpenStatusViewer={(creatorId) => setActiveStatusCreatorId(creatorId)}
            onOpenCreateStatus={() => {
              if (isCreator) {
                handleNavigate('creator-studio');
              } else {
                setShowBecomeCreator(true);
              }
            }}
            onNavigate={handleNavigate}
            onOpenWallet={() => setShowWallet(true)}
            onOpenPrivacy={() => setShowPrivacy(true)}
            onOpenHelpCenter={() => setShowHelpCenter(true)}
            searchQuery={globalSearchQuery}
            onClearSearch={() => setGlobalSearchQuery('')}
          />
        )}

        {(currentTab === 'categories' || currentTab === 'countries') && (
          <CategoriesDiscoveryPage
            initialMode={currentTab === 'countries' ? 'countries' : 'categories'}
            onSelectCreator={(id) => handleNavigate('creator-profile', id)}
            onNavigate={handleNavigate}
            onOpenTipModal={handleOpenTipModal}
            onOpenSubscribeModal={(creatorId) => setSubscribeTargetCreatorId(creatorId)}
            onOpenShareModal={(post) => setShareTargetPost(post)}
            onOpenVideoPlayer={(postId, time) => {
              setFullScreenVideoPostId(postId);
              setFullScreenVideoTime(time || 0);
            }}
            onOpenPhotoViewer={(postId, mediaIdx) => {
              setFullScreenPhotoPostId(postId);
              setFullScreenPhotoIndex(mediaIdx || 0);
            }}
          />
        )}

        {currentTab === 'explore' && (
          <ExplorePage
            onSelectCreator={(id) => handleNavigate('creator-profile', id)}
            onOpenCreatorAd={() => setShowCreatorAd(true)}
            onGoAdFree={() => setShowAdFree(true)}
            onOpenSubscribeModal={(creatorId) => setSubscribeTargetCreatorId(creatorId)}
            onOpenVideoPlayer={(postId, time) => {
              setFullScreenVideoPostId(postId);
              setFullScreenVideoTime(time || 0);
            }}
            onOpenPhotoViewer={(postId, mediaIdx) => {
              setFullScreenPhotoPostId(postId);
              setFullScreenPhotoIndex(mediaIdx || 0);
            }}
          />
        )}

        {currentTab === 'live' && (
          <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-6">
            <LivestreamsHub />
          </div>
        )}

        {currentTab === 'creator-profile' && (
          <CreatorProfilePage
            creatorId={selectedCreatorId}
            onNavigateToMessages={() => handleNavigate('messages')}
            onOpenTipModal={handleOpenTipModal}
            onOpenSubscribeModal={(creatorId) => setSubscribeTargetCreatorId(creatorId)}
            onOpenShareModal={(post) => setShareTargetPost(post)}
            onOpenVideoPlayer={(postId, time) => {
              setFullScreenVideoPostId(postId);
              setFullScreenVideoTime(time || 0);
            }}
            onOpenPhotoViewer={(postId, mediaIdx) => {
              setFullScreenPhotoPostId(postId);
              setFullScreenPhotoIndex(mediaIdx || 0);
            }}
          />
        )}

        {/* Dedicated Fan My Subscriptions View */}
        {currentTab === 'subscriptions' && (
          <MySubscriptionsView
            onNavigateToCreator={(id) => handleNavigate('creator-profile', id)}
            onNavigateToMessages={(id) => handleNavigate('messages', id)}
            onExplore={() => handleNavigate('explore')}
            onOpenTipModal={handleOpenTipModal}
            onOpenSubscribeModal={(creatorId) => setSubscribeTargetCreatorId(creatorId)}
            onOpenShareModal={(post) => setShareTargetPost(post)}
            onOpenVideoPlayer={(postId, time) => {
              setFullScreenVideoPostId(postId);
              setFullScreenVideoTime(time || 0);
            }}
            onOpenPhotoViewer={(postId, mediaIdx) => {
              setFullScreenPhotoPostId(postId);
              setFullScreenPhotoIndex(mediaIdx || 0);
            }}
          />
        )}

        {/* Creator-Only Custom Video Requests Manager */}
        {currentTab === 'requests' && (
          isCreator ? (
            <CustomRequestsManager
              onNavigateToMessages={() => handleNavigate('messages')}
            />
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-brand text-white">Creator Access Restricted</h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Custom Video Requests management is strictly available to verified creator accounts.
              </p>
              <button
                onClick={() => setShowBecomeCreator(true)}
                className="px-6 py-2.5 bg-[#d4af37] text-black font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Apply to Become a Creator
              </button>
            </div>
          )
        )}

        {currentTab === 'messages' && (
          <ChatView
            initialRecipientId={selectedCreatorId}
          />
        )}

        {/* Creator-Only Central Creator Studio */}
        {currentTab === 'creator-studio' && (
          isCreator ? (
            <CreatorDashboard
              onOpenCreatePost={handleOpenCreatePost}
              onNavigateToRequests={() => handleNavigate('requests')}
              onOpenWallet={() => setShowWallet(true)}
              onNavigateToProfile={(id) => handleNavigate('creator-profile', id)}
              onOpenSubscribeModal={(creatorId) => setSubscribeTargetCreatorId(creatorId)}
              onOpenStatusViewer={(creatorId) => setActiveStatusCreatorId(creatorId)}
              initialSection={studioTargetSection}
            />
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold font-brand text-white">Creator Studio Restricted</h2>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Creator Studio and creator management tools are strictly available to verified creator accounts. Apply to unlock publishing, broadcast studios, and monetization.
              </p>
              <button
                onClick={() => setShowBecomeCreator(true)}
                className="px-6 py-2.5 bg-[#d4af37] text-black font-bold text-xs rounded-xl shadow-lg cursor-pointer"
              >
                Apply to Become a Creator
              </button>
            </div>
          )
        )}

        {currentTab === 'admin-login' && (
          <AdminLoginPage
            onNavigateHome={() => handleNavigate('feed')}
            onNavigateToSetup={() => handleNavigate('admin-setup')}
            onLoginSuccess={() => handleNavigate('admin-panel')}
          />
        )}

        {currentTab === 'admin-setup' && (
          <AdminSetupPage
            onNavigateHome={() => handleNavigate('feed')}
            onNavigateToLogin={() => handleNavigate('admin-login')}
            onSetupSuccess={() => handleNavigate('admin-panel')}
          />
        )}

        {currentTab === 'admin-access-denied' && (
          <AdminAccessDenied
            onNavigateHome={() => handleNavigate('feed')}
            onNavigateToLogin={() => handleNavigate('admin-login')}
          />
        )}

        {currentTab === 'admin-panel' && (
          currentUser?.role === 'admin' || (currentUser as any)?.adminPermissionLevel ? (
            <AdminDashboard onExit={() => handleNavigate('feed')} />
          ) : (
            <AdminAccessDenied
              onNavigateHome={() => handleNavigate('feed')}
              onNavigateToLogin={() => handleNavigate('admin-login')}
            />
          )
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Mobile Bottom Navigation — shown for authenticated users on public/fan/creator tabs */}
      {isAuthenticated && !['admin-panel', 'admin-login', 'admin-setup', 'admin-access-denied'].includes(currentTab) && (
        <MobileBottomNav
          currentTab={currentTab === 'landing' ? 'feed' : currentTab}
          onNavigate={handleNavigate}
          onOpenCreatePost={handleOpenCreatePost}
        />
      )}

      {/* Global Modals */}
      {showWallet && <WalletModal onClose={() => setShowWallet(false)} />}
      
      {showCreatePost && isCreator && <CreatePostModal onClose={() => setShowCreatePost(false)} />}

      {/* Creator Post Editing & Deletion Modals */}
      <EditPostModal />
      <DeletePostModal />

      {showBecomeCreator && (
        <BecomeCreatorModal
          onClose={() => setShowBecomeCreator(false)}
          onSuccess={() => {
            // Keep user on current screen or reload
          }}
        />
      )}
      
      {showAuth && (
        <AuthModal
          initialMode={authMode}
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setCurrentTab('feed');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      {/* Ad-Free VIP Upgrade Modal */}
      {showAdFree && (
        <AdFreeModal
          onClose={() => setShowAdFree(false)}
          onExploreCreators={() => handleNavigate('explore')}
        />
      )}

      {/* Creator Self-Service Advertising Modal */}
      {showCreatorAd && (
        <CreatorAdvertisingModal
          onClose={() => setShowCreatorAd(false)}
          onSuccess={() => {
            alert('Your advertising campaign is now live! Boosted placement active in Discovery & Feed.');
            handleNavigate('explore');
          }}
        />
      )}

      {/* Video Call Modal */}
      <VideoCallModal />

      {/* Acovon Live Stream View & Host Studio */}
      <LivestreamModal onNavigateToCreator={(id) => handleNavigate('creator-profile', id)} />

      {/* Creator Broadcast Configuration Modal */}
      <CreateLivestreamModal />

      {/* Profile & Account Modals */}
      {showEditProfile && (
        <EditProfileModal onClose={() => setShowEditProfile(false)} />
      )}

      {showPaymentMethods && (
        <PaymentMethodsModal onClose={() => setShowPaymentMethods(false)} />
      )}

      {showSubscriptions && (
        <SubscriptionManagementModal 
          onClose={() => setShowSubscriptions(false)}
          onExploreCreators={() => handleNavigate('explore')}
        />
      )}

      {showPurchaseHistory && (
        <PurchaseHistoryModal onClose={() => setShowPurchaseHistory(false)} />
      )}

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}

      {showPrivacy && (
        <PrivacyModal onClose={() => setShowPrivacy(false)} />
      )}

      {showHelpCenter && (
        <HelpCenterModal onClose={() => setShowHelpCenter(false)} />
      )}

      {/* Creator Subscription Modal */}
      {subscribeTargetCreatorId && (
        <SubscribeModal
          creatorId={subscribeTargetCreatorId}
          onClose={() => setSubscribeTargetCreatorId(null)}
        />
      )}

      {/* Media Share & Forward Modal */}
      {shareTargetPost && (
        <ShareModal
          post={shareTargetPost}
          onClose={() => setShareTargetPost(null)}
          onNavigateToMessages={(id) => handleNavigate('messages', id)}
        />
      )}

      {/* Full-Screen Video Player Modal (Immersive Video Feed & Controls) */}
      {fullScreenVideoPostId && (
        <FullScreenVideoModal
          initialPostId={fullScreenVideoPostId}
          initialTime={fullScreenVideoTime}
          onClose={() => setFullScreenVideoPostId(null)}
          onNavigateToCreator={(id) => handleNavigate('creator-profile', id)}
          onOpenSubscribeModal={(id) => setSubscribeTargetCreatorId(id)}
          onOpenShareModal={(post) => setShareTargetPost(post)}
          onOpenTipModal={handleOpenTipModal}
        />
      )}

      {/* Full-Screen Photo Viewer with Pinch-To-Zoom and Pan */}
      {fullScreenPhotoPostId && (
        <FullScreenPhotoModal
          initialPostId={fullScreenPhotoPostId}
          initialMediaIndex={fullScreenPhotoIndex}
          onClose={() => setFullScreenPhotoPostId(null)}
          onNavigateToCreator={(id) => handleNavigate('creator-profile', id)}
          onOpenSubscribeModal={(id) => setSubscribeTargetCreatorId(id)}
          onOpenShareModal={(post) => setShareTargetPost(post)}
          onOpenTipModal={handleOpenTipModal}
        />
      )}

      {/* Fan Profile Modal (Following, Subscriptions, Saved Videos/Photos, Liked Posts) */}
      {showFanProfile && (
        <FanProfileModal
          onClose={() => setShowFanProfile(false)}
          onNavigateToCreator={(id) => handleNavigate('creator-profile', id)}
          onOpenSubscribeModal={(id) => setSubscribeTargetCreatorId(id)}
          onOpenVideoPlayer={(id) => {
            setFullScreenVideoPostId(id);
            setFullScreenVideoTime(0);
          }}
          onOpenPhotoViewer={(id) => {
            setFullScreenPhotoPostId(id);
            setFullScreenPhotoIndex(0);
          }}
        />
      )}

      {/* Quick Direct Tip Modal */}
      {tipTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-[#d4af37]" />
                <h4 className="font-semibold text-sm text-white">Send Direct Tip</h4>
              </div>
              <button
                onClick={() => setTipTarget(null)}
                className="p-1 text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400">
              Directly support <strong>{tipTarget.name}</strong>. Net proceeds go directly to their creator wallet.
            </p>

            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTipAmount(amt)}
                  className={`py-2 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors ${
                    tipAmount === amt ? 'bg-[#d4af37] text-black' : 'bg-[#18181c] text-neutral-300'
                  }`}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <div>
              <input
                type="text"
                placeholder="Optional personal message / note..."
                value={tipNote}
                onChange={(e) => setTipNote(e.target.value)}
                className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTipTarget(null)}
                className="px-3 py-1.5 text-xs text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteTip}
                className="px-4 py-1.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-semibold text-xs rounded-xl shadow-lg shadow-[#d4af37]/20"
              >
                Send ${tipAmount}.00 Tip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Status / Stories Viewer */}
      {activeStatusCreatorId && (
        <StatusViewerModal
          initialCreatorId={activeStatusCreatorId}
          onClose={() => setActiveStatusCreatorId(null)}
          onNavigateToCreatorProfile={(creatorId) => {
            setActiveStatusCreatorId(null);
            handleNavigate('creator-profile', creatorId);
          }}
          onOpenSubscribeModal={(creatorId) => {
            setActiveStatusCreatorId(null);
            setSubscribeTargetCreatorId(creatorId);
          }}
        />
      )}

      {/* Informational Policy Modal */}
      {infoModalTitle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272a] pb-3">
              <div className="flex items-center gap-2 text-[#d4af37]">
                <Shield className="w-5 h-5" />
                <h3 className="font-bold text-white text-base capitalize">
                  {infoModalTitle.replace('-', ' ')}
                </h3>
              </div>
              <button onClick={() => setInfoModalTitle(null)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-neutral-300 space-y-3 leading-relaxed max-h-80 overflow-y-auto pr-2">
              <p>
                <strong>ACOVON Global Compliance & Trust Standards:</strong> All creators and subscribers operate under our unified monetization framework.
              </p>
              <ul className="list-disc pl-4 space-y-1 text-neutral-400">
                <li>Strict 18+ Age & Government Identification Verification before payout release.</li>
                <li>Zero tolerance for non-consensual imagery, exploitation, or copyright infringement.</li>
                <li>Escrow-backed custom commissions with dispute resolution mechanisms.</li>
                <li>256-bit encrypted WebRTC media streams with real-time per-minute call protection.</li>
              </ul>
              <p className="text-neutral-500 text-[11px]">
                Questions or support inquiries: legal@acovon.com · 24/7 Creator Concierge.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInfoModalTitle(null)}
                className="px-4 py-2 bg-[#d4af37] text-black font-semibold text-xs rounded-xl"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Important Role-Targeted Announcement Popup Modal */}
      {currentTab !== 'landing' && currentTab !== 'admin' && (
        <ImportantAnnouncementPopupModal
          onNavigate={handleNavigate}
          onOpenWallet={() => setShowWallet(true)}
          onOpenPrivacy={() => setShowPrivacy(true)}
          onOpenHelpCenter={() => setShowHelpCenter(true)}
        />
      )}

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <GlobalDomTranslator />
      <AppContent />
    </AppProvider>
  );
}
