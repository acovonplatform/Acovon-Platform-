import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Post } from '../../types';
import { 
  X, 
  User, 
  Users, 
  Sparkles, 
  Bookmark, 
  Heart, 
  Receipt, 
  Share2, 
  Video, 
  Image as ImageIcon, 
  CheckCircle2, 
  UserCheck, 
  UserX, 
  Crown, 
  Calendar, 
  Wallet,
  Play,
  Lock,
  ExternalLink
} from 'lucide-react';

interface FanProfileModalProps {
  onClose: () => void;
  onNavigateToCreator: (creatorId: string) => void;
  onOpenSubscribeModal: (creatorId: string) => void;
  onOpenVideoPlayer: (postId: string) => void;
  onOpenPhotoViewer: (postId: string) => void;
}

export const FanProfileModal: React.FC<FanProfileModalProps> = ({
  onClose,
  onNavigateToCreator,
  onOpenSubscribeModal,
  onOpenVideoPlayer,
  onOpenPhotoViewer
}) => {
  const { 
    currentUser, 
    creators, 
    posts, 
    following, 
    toggleFollowCreator, 
    subscriptions, 
    cancelSubscription,
    savedPostIds, 
    purchases,
    transactions
  } = useApp();

  type ProfileTab = 'following' | 'subscriptions' | 'saved_videos' | 'saved_photos' | 'liked' | 'purchases';
  const [activeTab, setActiveTab] = useState<ProfileTab>('following');

  // Followed creators
  const followedCreators = creators.filter(c => following.includes(c.id));

  // Saved posts
  const savedPosts = posts.filter(p => savedPostIds.includes(p.id));
  const savedVideos = savedPosts.filter(p => p.media && p.media.some(m => m.type === 'video'));
  const savedPhotos = savedPosts.filter(p => p.media && p.media.some(m => m.type === 'image'));

  // Liked posts
  const likedPosts = posts.filter(p => p.isLiked);

  // Unlocked / Purchased posts
  const purchasedPosts = posts.filter(p => purchases.some(pur => pur.postId === p.id));

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-[#121215] border border-[#27272a] rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 my-auto">
        
        {/* Profile Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-[#18181f] via-[#141418] to-[#18181f] border-b border-[#26262b] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img 
              src={currentUser.avatar} 
              alt={currentUser.name} 
              className="w-16 h-16 rounded-2xl object-cover border-2 border-[#d4af37] shadow-xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-brand font-bold text-lg text-white">{currentUser.name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-[#d4af37]/20 text-[#fce7b0] border border-[#d4af37]/30">
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-neutral-400">@{currentUser.username} · Member since {currentUser.dateJoined}</p>
              <div className="flex items-center gap-4 text-xs font-mono text-neutral-300 mt-1">
                <span>Wallet: <strong className="text-[#fce7b0]">${currentUser.walletBalance.toFixed(2)}</strong></span>
                <span>Following: <strong className="text-white">{following.length}</strong></span>
                <span>Subscriptions: <strong className="text-white">{subscriptions.filter(s => s.status === 'active').length}</strong></span>
              </div>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-[#1e1e24] hover:bg-[#282830] text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1 p-2 bg-[#141418] border-b border-[#26262b] overflow-x-auto no-scrollbar">
          {[
            { id: 'following', label: 'Following', count: followedCreators.length, icon: Users },
            { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.filter(s => s.status === 'active').length, icon: Crown },
            { id: 'saved_videos', label: 'Saved Videos', count: savedVideos.length, icon: Video },
            { id: 'saved_photos', label: 'Saved Photos', count: savedPhotos.length, icon: ImageIcon },
            { id: 'liked', label: 'Liked Posts', count: likedPosts.length, icon: Heart },
            { id: 'purchases', label: 'Purchased Vault', count: purchasedPosts.length, icon: Receipt },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ProfileTab)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1e1e26] text-[#fce7b0] border border-[#d4af37]/40 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-[#1a1a20]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#d4af37]' : ''}`} />
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-60">({tab.count})</span>
              </button>
            );
          })}
        </div>

        {/* Tab Viewport */}
        <div className="flex-1 p-5 overflow-y-auto max-h-[55vh]">
          
          {/* TAB 1: Following List */}
          {activeTab === 'following' && (
            <div className="space-y-3">
              {followedCreators.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  You are not following any creators yet. Explore the feed to discover top creators!
                </div>
              ) : (
                followedCreators.map(creator => (
                  <div key={creator.id} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-2xl flex items-center justify-between gap-3">
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToCreator(creator.id);
                      }}
                      className="flex items-center gap-3 text-left group cursor-pointer"
                    >
                      <img 
                        src={creator.avatar} 
                        alt={creator.name} 
                        className="w-12 h-12 rounded-xl object-cover border border-[#d4af37]/40 group-hover:scale-105 transition-transform"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-white group-hover:text-[#fce7b0]">{creator.name}</span>
                          {creator.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />}
                        </div>
                        <div className="text-xs text-neutral-400">@{creator.username} · {creator.category}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{creator.followersCount} followers</div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleFollowCreator(creator.id)}
                        className="px-3 py-1.5 bg-[#22222a] hover:bg-[#2e2e38] text-neutral-300 text-xs font-semibold rounded-xl border border-neutral-700 transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Following</span>
                      </button>
                      <button
                        onClick={() => {
                          onClose();
                          onOpenSubscribeModal(creator.id);
                        }}
                        className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>Subscribe</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 2: Subscriptions */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-3">
              {subscriptions.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No active creator subscriptions.
                </div>
              ) : (
                subscriptions.map(sub => {
                  const creator = creators.find(c => c.id === sub.creatorId);
                  return (
                    <div key={sub.id} className="p-4 bg-[#18181c] border border-[#27272a] rounded-2xl flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={creator?.avatar} 
                          alt={creator?.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-[#d4af37]"
                        />
                        <div>
                          <div className="text-sm font-bold text-white">{creator?.name}</div>
                          <div className="text-xs text-[#d4af37] font-semibold">{sub.tierName} Tier · ${sub.monthlyPrice.toFixed(2)}/mo</div>
                          <div className="text-[11px] text-neutral-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>Renews on {sub.nextRenewalDate}</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        {sub.status === 'active' ? (
                          <button
                            onClick={() => {
                              if (confirm(`Cancel renewal for ${creator?.name}?`)) {
                                cancelSubscription(sub.id);
                              }
                            }}
                            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-[#202028] border border-neutral-700 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel Auto-Renew
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-500 font-medium">Cancelled</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Saved Videos */}
          {activeTab === 'saved_videos' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {savedVideos.length === 0 ? (
                <div className="col-span-full p-8 text-center text-xs text-neutral-400">
                  No saved videos yet. Tap the bookmark icon on any feed video to save it!
                </div>
              ) : (
                savedVideos.map(post => {
                  const videoAsset = post.media?.find(m => m.type === 'video');
                  return (
                    <div 
                      key={post.id}
                      onClick={() => {
                        onClose();
                        onOpenVideoPlayer(post.id);
                      }}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-black border border-[#27272a] hover:border-[#d4af37]/60 cursor-pointer shadow-lg"
                    >
                      <img 
                        src={videoAsset?.thumbnailUrl || videoAsset?.url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white mb-1">
                          <Play className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
                          <span className="truncate">{post.creatorName}</span>
                        </div>
                        <p className="text-[11px] text-neutral-300 line-clamp-1">{post.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 4: Saved Photos */}
          {activeTab === 'saved_photos' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {savedPhotos.length === 0 ? (
                <div className="col-span-full p-8 text-center text-xs text-neutral-400">
                  No saved photos yet. Tap the bookmark icon on any photo in the feed to save it!
                </div>
              ) : (
                savedPhotos.map(post => {
                  const imageAsset = post.media?.find(m => m.type === 'image');
                  return (
                    <div 
                      key={post.id}
                      onClick={() => {
                        onClose();
                        onOpenPhotoViewer(post.id);
                      }}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-black border border-[#27272a] hover:border-[#d4af37]/60 cursor-pointer shadow-lg"
                    >
                      <img 
                        src={imageAsset?.url} 
                        alt="" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-3">
                        <span className="text-xs font-bold text-white truncate">{post.creatorName}</span>
                        <p className="text-[11px] text-neutral-300 line-clamp-1">{post.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 5: Liked Posts */}
          {activeTab === 'liked' && (
            <div className="space-y-3">
              {likedPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No liked posts yet.
                </div>
              ) : (
                likedPosts.map(post => (
                  <div key={post.id} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={post.media?.[0]?.thumbnailUrl || post.media?.[0]?.url || post.creatorAvatar} 
                        alt="" 
                        className="w-12 h-12 rounded-xl object-cover border border-[#27272a] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{post.creatorName}</div>
                        <div className="text-[11px] text-neutral-300 line-clamp-1">{post.content}</div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{post.likesCount} likes · {post.createdAt}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {post.media?.some(m => m.type === 'video') ? (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenVideoPlayer(post.id);
                          }}
                          className="px-3 py-1.5 bg-[#1e1e24] hover:bg-[#282832] text-[#fce7b0] text-xs font-semibold rounded-xl border border-[#d4af37]/30 cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Watch</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onClose();
                            onOpenPhotoViewer(post.id);
                          }}
                          className="px-3 py-1.5 bg-[#1e1e24] hover:bg-[#282832] text-[#fce7b0] text-xs font-semibold rounded-xl border border-[#d4af37]/30 cursor-pointer flex items-center gap-1"
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 6: Purchased Vault */}
          {activeTab === 'purchases' && (
            <div className="space-y-3">
              {purchasedPosts.length === 0 ? (
                <div className="p-8 text-center text-xs text-neutral-400">
                  No unlocked pay-per-view videos yet.
                </div>
              ) : (
                purchasedPosts.map(post => (
                  <div key={post.id} className="p-3.5 bg-[#18181c] border border-amber-500/30 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={post.media?.[0]?.thumbnailUrl || post.media?.[0]?.url || post.creatorAvatar} 
                        alt="" 
                        className="w-12 h-12 rounded-xl object-cover border border-amber-500/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          <span>{post.creatorName}</span>
                          <span className="text-[10px] text-emerald-400 font-mono font-normal">Unlocked PPV</span>
                        </div>
                        <div className="text-[11px] text-neutral-300 line-clamp-1">{post.content}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenVideoPlayer(post.id);
                      }}
                      className="px-3.5 py-1.5 bg-[#d4af37] text-black text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Play</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
