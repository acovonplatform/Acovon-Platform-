import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Sparkles, 
  MessageSquare, 
  ExternalLink, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Search,
  Compass,
  CreditCard,
  Layers,
  Heart,
  Video
} from 'lucide-react';
import { Post } from '../../types';
import { PostCard } from '../feed/PostCard';
import { VerifiedBadge } from '../common/VerifiedBadge';

interface MySubscriptionsViewProps {
  onNavigateToCreator: (creatorId: string) => void;
  onNavigateToMessages: (creatorId?: string) => void;
  onExplore: () => void;
  onOpenTipModal: (creatorId: string, creatorName: string) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  onOpenShareModal?: (post: Post) => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
}

export const MySubscriptionsView: React.FC<MySubscriptionsViewProps> = ({
  onNavigateToCreator,
  onNavigateToMessages,
  onExplore,
  onOpenTipModal,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenVideoPlayer,
  onOpenPhotoViewer
}) => {
  const { subscriptions, creators, posts, cancelSubscription, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'creators' | 'posts'>('creators');
  const [searchQuery, setSearchQuery] = useState('');

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  const totalMonthlySpend = activeSubs.reduce((acc, curr) => acc + curr.monthlyPrice, 0);

  // Subscribed creator IDs
  const subscribedCreatorIds = activeSubs.map(s => s.creatorId);

  // Filtered posts from subscribed creators
  const subscribedPosts = posts.filter(p => subscribedCreatorIds.includes(p.creatorId));

  // Filtered subscriptions based on search query
  const filteredSubs = subscriptions.filter(sub => {
    const creator = creators.find(c => c.id === sub.creatorId);
    if (!creator) return false;
    const match = creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  creator.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  creator.category.toLowerCase().includes(searchQuery.toLowerCase());
    return match;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 space-y-6">
      
      {/* Header & Overview Banner */}
      <div className="bg-gradient-to-r from-[#141418] via-[#18181f] to-[#121215] border border-[#27272a] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-brand text-white tracking-wide">
              My Subscriptions
            </h1>
          </div>
          <p className="text-xs text-neutral-400">
            Manage your active patron subscriptions, view renewal schedules, and access exclusive content.
          </p>
        </div>

        {/* Quick Spend Statistics */}
        <div className="flex items-center gap-3">
          <div className="bg-[#18181c] border border-[#27272a] rounded-xl px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Active Tiers</span>
            <span className="text-lg font-mono font-bold text-[#fce7b0]">{activeSubs.length}</span>
          </div>
          <div className="bg-[#18181c] border border-[#27272a] rounded-xl px-4 py-2.5 text-center">
            <span className="text-[10px] text-neutral-400 uppercase tracking-wider block">Monthly Total</span>
            <span className="text-lg font-mono font-bold text-emerald-400">${totalMonthlySpend.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#26262b] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('creators')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'creators'
                ? 'bg-[#18181f] text-[#fce7b0] border border-[#d4af37]/30 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Subscribed Creators ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'posts'
                ? 'bg-[#18181f] text-[#fce7b0] border border-[#d4af37]/30 shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Subscribers Feed ({subscribedPosts.length})
          </button>
        </div>

        {activeTab === 'creators' && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter subscriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141418] border border-[#27272a] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        )}
      </div>

      {/* VIEW 1: Subscribed Creators Cards */}
      {activeTab === 'creators' && (
        <div>
          {filteredSubs.length === 0 ? (
            <div className="p-12 text-center bg-[#121215] border border-[#27272a] rounded-2xl space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#18181c] border border-[#27272a] flex items-center justify-center mx-auto text-neutral-400">
                <Compass className="w-6 h-6 text-[#d4af37]" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-white text-sm">No creator subscriptions found</h3>
                <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                  Subscribe to verified creators to unlock full feed access, direct video calls, and subscriber-only livestreams.
                </p>
              </div>
              <button
                onClick={onExplore}
                className="px-5 py-2.5 bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
              >
                Discover Creators on Explore
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredSubs.map((sub) => {
                const creator = creators.find(c => c.id === sub.creatorId);
                if (!creator) return null;
                const isActive = sub.status === 'active';

                return (
                  <div
                    key={sub.id}
                    className="bg-[#121215] border border-[#27272a] hover:border-[#383842] rounded-2xl overflow-hidden transition-all shadow-md group flex flex-col justify-between"
                  >
                    {/* Cover & Avatar Header */}
                    <div>
                      <div className="relative h-24 bg-[#1a1a20] overflow-hidden">
                        <img
                          src={creator.coverImage}
                          alt={creator.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121215] via-transparent to-black/30" />
                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase bg-black/70 backdrop-blur-md text-[#fce7b0] border border-[#d4af37]/30">
                          {creator.category}
                        </span>
                      </div>

                      <div className="px-5 pt-0 pb-4 relative">
                        <div className="flex items-end justify-between -mt-8 mb-3">
                          <img
                            src={creator.avatar}
                            alt={creator.name}
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-[#121215] ring-2 ring-[#d4af37]/60 shadow-lg"
                          />
                          <button
                            onClick={() => onNavigateToCreator(creator.id)}
                            className="px-3 py-1.5 bg-[#1a1a20] hover:bg-[#252530] text-neutral-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <span>Profile</span>
                            <ExternalLink className="w-3 h-3 text-neutral-400" />
                          </button>
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-white group-hover:text-[#fce7b0] transition-colors">
                              {creator.name}
                            </h3>
                            <VerifiedBadge creatorId={creator.id} size="xs" />
                          </div>
                          <span className="text-[11px] text-neutral-400">@{creator.username}</span>
                        </div>

                        {/* Subscription Tier Details Pill */}
                        <div className="mt-3.5 p-3 bg-[#18181c] border border-[#27272a] rounded-xl space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#fce7b0]">{sub.tierName}</span>
                            <span className="font-mono font-bold text-white">${sub.monthlyPrice.toFixed(2)}/mo</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-neutral-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-neutral-500" />
                              <span>{isActive ? `Renews: ${sub.nextRenewalDate}` : 'Cancelled'}</span>
                            </span>
                            <span className={`text-[10px] font-mono uppercase px-1.5 py-0.2 rounded ${
                              isActive ? 'bg-emerald-950 text-emerald-400' : 'bg-neutral-800 text-neutral-400'
                            }`}>
                              {sub.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="p-4 pt-0 border-t border-[#1c1c22] mt-2 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onNavigateToMessages(creator.id)}
                        className="flex-1 py-2 bg-[#18181c] hover:bg-[#22222a] text-neutral-300 hover:text-white rounded-xl text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                        <span>Direct Chat</span>
                      </button>

                      {isActive && (
                        <button
                          onClick={() => {
                            if (confirm(`Cancel auto-renewal for ${creator.name}? You will retain access until ${sub.nextRenewalDate}.`)) {
                              cancelSubscription(sub.id);
                            }
                          }}
                          className="px-3 py-2 text-neutral-400 hover:text-red-400 hover:bg-red-950/20 rounded-xl text-xs transition-colors cursor-pointer"
                          title="Cancel subscription renewal"
                        >
                          Cancel Renewal
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: Subscribed Feed (Posts only from subscribed creators) */}
      {activeTab === 'posts' && (
        <div className="max-w-2xl mx-auto space-y-6">
          {subscribedPosts.length === 0 ? (
            <div className="p-10 text-center bg-[#121215] border border-[#27272a] rounded-2xl space-y-3">
              <p className="text-neutral-400 text-xs">No posts available from your subscribed creators.</p>
              <button
                onClick={onExplore}
                className="px-4 py-2 bg-[#d4af37] text-black font-semibold text-xs rounded-xl"
              >
                Discover More Creators
              </button>
            </div>
          ) : (
            subscribedPosts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onNavigateToCreator={onNavigateToCreator}
                onOpenTipModal={onOpenTipModal}
                onOpenSubscribeModal={onOpenSubscribeModal}
                onOpenShareModal={onOpenShareModal}
                onOpenVideoPlayer={onOpenVideoPlayer}
                onOpenPhotoViewer={onOpenPhotoViewer}
              />
            ))
          )}
        </div>
      )}

    </div>
  );
};
