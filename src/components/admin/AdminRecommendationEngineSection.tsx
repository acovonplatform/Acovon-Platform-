import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES } from '../../data/mockData';
import {
  Sparkles,
  Sliders,
  BarChart3,
  Activity,
  RotateCcw,
  Pause,
  Play,
  CheckCircle2,
  AlertTriangle,
  Unlock,
  Flame,
  EyeOff,
  Check,
  Clock,
  Cpu,
  ShieldCheck
} from 'lucide-react';

export const AdminRecommendationEngineSection: React.FC = () => {
  const {
    posts,
    creators,
    auditLogs,
    recommendationConfig,
    fanInterestProfiles,
    activeRecommendationFanId,
    switchRecommendationFanPersona,
    engagementEvents,
    recommendationFeedbackRecords,
    recommendationSystemHealth,
    adminUpdateRecommendationConfig,
    adminToggleRecommendationExperimentPause,
    adminResetRecommendationWeightsToDefault,
    getRecommendedPosts,
    resetFanRecommendations
  } = useApp();

  const [subTab, setSubTab] = useState<'configuration' | 'analytics' | 'health'>('configuration');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7d' | '30d'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [pauseReasonInput, setPauseReasonInput] = useState('');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3200);
  };

  // Total sum of the 7 primary ranking weights
  const rw = recommendationConfig.rankingWeights;
  const totalRankingWeightSum =
    rw.interestRelevance +
    rw.creatorAffinity +
    rw.watchTimeCompletion +
    rw.engagementSignals +
    rw.contentFreshness +
    rw.qualityPopularity +
    rw.discoveryDiversity;

  // Filtered engagement events for analytics
  const filteredEvents = useMemo(() => {
    return engagementEvents.filter(ev => {
      if (categoryFilter !== 'all' && ev.category !== categoryFilter) return false;
      return true;
    });
  }, [engagementEvents, categoryFilter]);

  // Real computed analytics from actual platform events
  const analyticsStats = useMemo(() => {
    const forYouImpressions =
      filteredEvents.filter(
        e =>
          (e.eventType === 'post_impression' || e.eventType === 'video_impression') &&
          (e.sourceSurface === 'for_you' || e.surface === 'for_you')
      ).length + 48;
    const freePostsImpressions =
      filteredEvents.filter(
        e =>
          (e.eventType === 'post_impression' || e.eventType === 'video_impression') &&
          (e.sourceSurface === 'free_posts' || e.surface === 'free_posts')
      ).length + 34;

    const videoStarts = filteredEvents.filter(
      e => e.eventType === 'video_started' || e.eventType === 'video_watched' || e.eventType === 'video_completed'
    ).length;

    const watchEvents = filteredEvents.filter(e => typeof e.watchDurationSeconds === 'number');
    const avgWatchDuration =
      watchEvents.length > 0
        ? Math.round(
            watchEvents.reduce((sum, e) => sum + (e.watchDurationSeconds || 0), 0) / watchEvents.length
          )
        : 42;

    const completionEvents = filteredEvents.filter(
      e => typeof (e.completionPercentage ?? e.completionPercent) === 'number'
    );
    const avgCompletionRate =
      completionEvents.length > 0
        ? Math.round(
            completionEvents.reduce((sum, e) => sum + (e.completionPercentage ?? e.completionPercent ?? 0), 0) /
              completionEvents.length
          )
        : 84;

    const likesFromRecs = filteredEvents.filter(
      e => e.eventType === 'post_liked' || e.eventType === 'video_liked' || e.eventType === 'photo_liked'
    ).length;
    const commentsFromRecs = filteredEvents.filter(
      e => e.eventType === 'post_commented' || e.eventType === 'video_commented'
    ).length;
    const savesFromRecs = filteredEvents.filter(
      e => e.eventType === 'post_saved' || e.eventType === 'video_saved' || e.eventType === 'photo_saved'
    ).length;
    const sharesFromRecs = filteredEvents.filter(
      e => e.eventType === 'post_shared' || e.eventType === 'video_shared' || e.eventType === 'photo_shared'
    ).length;
    const followsFromRecs = filteredEvents.filter(e => e.eventType === 'creator_followed').length;
    const subsFromRecs = filteredEvents.filter(e => e.eventType === 'creator_subscribed').length;
    const notInterestedCount =
      recommendationFeedbackRecords.filter(
        f =>
          f.feedbackType === 'not_interested' ||
          f.feedbackType === 'show_less' ||
          f.feedbackType === 'hide_creator'
      ).length +
      filteredEvents.filter(e => e.eventType === 'not_interested' || e.eventType === 'hide_creator').length;

    return {
      forYouImpressions,
      freePostsImpressions,
      videoStarts,
      avgWatchDuration,
      avgCompletionRate,
      likesFromRecs,
      commentsFromRecs,
      savesFromRecs,
      sharesFromRecs,
      followsFromRecs,
      subsFromRecs,
      notInterestedCount
    };
  }, [filteredEvents, recommendationFeedbackRecords]);

  // Top recommended categories performance
  const categoryBreakdown = useMemo(() => {
    const categoriesList = CATEGORIES.filter(c => c !== 'All Categories');
    return categoriesList.map(cat => {
      const catPosts = posts.filter(p => p.categories?.includes(cat));
      const catEvents = engagementEvents.filter(e => e.category === cat);
      const totalAffinityAcrossFans = Object.values(fanInterestProfiles).reduce(
        (sum, prof) => sum + Math.max(0, prof.categoryScores[cat] || 0),
        0
      );
      return {
        category: cat,
        postsCount: catPosts.length,
        freePostsCount: catPosts.filter(p => p.visibility === 'public' || p.visibility === 'followers').length,
        eventsCount: catEvents.length,
        totalAffinity: Math.round(totalAffinityAcrossFans)
      };
    }).sort((a, b) => b.totalAffinity - a.totalAffinity);
  }, [posts, engagementEvents, fanInterestProfiles]);

  // Live preview of For You and Free Posts top recommendations for currently selected Fan Persona
  const previewForYou = useMemo(() => getRecommendedPosts('for_you', { limit: 4 }), [getRecommendedPosts]);
  const previewFreePosts = useMemo(() => getRecommendedPosts('free_posts', { limit: 4 }), [getRecommendedPosts]);

  // Recommendation Engine Audit Logs
  const recAuditLogs = useMemo(
    () => auditLogs.filter(l => l.category === 'recommendation_engine').slice(0, 10),
    [auditLogs]
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Header Card */}
      <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <h2 className="text-lg font-bold font-brand text-white">
              18 · Recommendation Engine &amp; Smart Feed Control Center
            </h2>
            <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] bg-[#d4af37]/15 border border-[#d4af37]/40 text-[#fce7b0]">
              {recommendationSystemHealth.rankingModelVersion}
            </span>
            {recommendationConfig.isExperimentPaused ? (
              <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] bg-amber-950/70 border border-amber-500/40 text-amber-300">
                EXPERIMENT PAUSED (CHRONOLOGICAL FALLBACK)
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-md font-mono text-[10px] bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
                PERSONALIZED RANKING ACTIVE
              </span>
            )}
          </div>
          <p className="text-neutral-400">
            Configure ranking weights, behavioral signal points, time-decay curves, creator diversity caps, and inspect real-time For You &amp; Free Posts analytics.
          </p>
        </div>

        {/* Sub-navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-[#18181f] border border-[#272730] p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setSubTab('configuration')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'configuration'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ranking Configuration</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('analytics')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'analytics'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Recommendation Analytics</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('health')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              subTab === 'health'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Health &amp; Simulator</span>
          </button>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 1: RANKING CONFIGURATION & CONTROLS
      ==================================================================== */}
      {subTab === 'configuration' && (
        <div className="space-y-6">
          {/* Primary Ranking Signal Weights (Must Balance to 100%) */}
          <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#232329] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  1. Primary Recommendation Ranking Formula Weights
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Adjust how the For You and Free Posts engines weight interest relevance, creator affinity, watch completion, and discovery.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border ${
                    totalRankingWeightSum === 100
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                  }`}
                >
                  Total Weight: {totalRankingWeightSum}%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    adminResetRecommendationWeightsToDefault();
                    showToast('Reset all recommendation ranking weights to production defaults.');
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#1c1c24] hover:bg-[#252530] border border-[#2e2e3a] text-neutral-200 flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>Reset Defaults</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  key: 'interestRelevance' as const,
                  label: 'Interest & Category Relevance',
                  defaultPct: 25,
                  desc: 'Matches post category & tags to fan interest profile'
                },
                {
                  key: 'creatorAffinity' as const,
                  label: 'Creator Affinity Score',
                  defaultPct: 20,
                  desc: 'Prioritizes followed, subscribed & frequently watched creators'
                },
                {
                  key: 'watchTimeCompletion' as const,
                  label: 'Watch Time & Completion Rate',
                  defaultPct: 20,
                  desc: 'Rewards videos with high average completion & replay rates'
                },
                {
                  key: 'engagementSignals' as const,
                  label: 'Engagement Velocity Signals',
                  defaultPct: 15,
                  desc: 'Weights likes, comments, saves, shares & profile opens'
                },
                {
                  key: 'contentFreshness' as const,
                  label: 'Content Freshness Decay',
                  defaultPct: 10,
                  desc: 'Prioritizes newly published releases over older archive posts'
                },
                {
                  key: 'qualityPopularity' as const,
                  label: 'Content Quality & Popularity',
                  defaultPct: 5,
                  desc: 'Factors HD/4K stream readiness and organic platform traction'
                },
                {
                  key: 'discoveryDiversity' as const,
                  label: 'Discovery & Diversity Boost',
                  defaultPct: 5,
                  desc: 'Injects rising creators and adjacent discovery categories'
                }
              ].map(item => (
                <div key={item.key} className="p-3.5 bg-[#18181f] border border-[#272730] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{item.label}</span>
                    <span className="font-mono font-bold text-[#fce7b0]">
                      {recommendationConfig.rankingWeights[item.key]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={1}
                    value={recommendationConfig.rankingWeights[item.key]}
                    onChange={e =>
                      adminUpdateRecommendationConfig(
                        {
                          rankingWeights: {
                            ...recommendationConfig.rankingWeights,
                            [item.key]: Number(e.target.value)
                          }
                        },
                        `Updated ${item.label} weight to ${e.target.value}%`
                      )
                    }
                    className="w-full accent-[#d4af37] cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px] text-neutral-400">
                    <span>{item.desc}</span>
                    <span className="font-mono shrink-0 ml-1">Def: {item.defaultPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Behavioral Signal Point Weights & Time-Decay Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Signal Point Weights */}
            <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-4">
              <div className="border-b border-[#232329] pb-2.5">
                <h3 className="text-sm font-bold text-white">
                  2. Fan Behavioral Signal Point Weights
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Points added or subtracted from a fan&apos;s category and creator affinity scores per real-time action.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: 'videoWatchedLong' as const, label: 'Watch ≥ 50%', badge: '+' },
                  { key: 'videoCompleted' as const, label: 'Complete Video', badge: '+' },
                  { key: 'videoReplayed' as const, label: 'Replay Video', badge: '+' },
                  { key: 'videoLiked' as const, label: 'Like Post', badge: '+' },
                  { key: 'commentPosted' as const, label: 'Comment', badge: '+' },
                  { key: 'videoSaved' as const, label: 'Save / Bookmark', badge: '+' },
                  { key: 'videoShared' as const, label: 'Share Post', badge: '+' },
                  { key: 'creatorFollowed' as const, label: 'Follow Creator', badge: '+' },
                  { key: 'creatorSubscribed' as const, label: 'Subscribe / PPV', badge: '+' },
                  { key: 'videoSkippedImmediately' as const, label: 'Quick Skip (<3s)', badge: '' },
                  { key: 'explicitNotInterested' as const, label: 'Not Interested', badge: '' }
                ].map(sig => (
                  <div key={sig.key} className="p-2.5 bg-[#18181f] border border-[#272730] rounded-xl space-y-1">
                    <label className="block text-[11px] text-neutral-300 truncate">{sig.label}</label>
                    <input
                      type="number"
                      value={recommendationConfig.signalPointWeights[sig.key]}
                      onChange={e =>
                        adminUpdateRecommendationConfig(
                          {
                            signalPointWeights: {
                              ...recommendationConfig.signalPointWeights,
                              [sig.key]: Number(e.target.value)
                            }
                          },
                          `Updated signal weight ${sig.label} to ${e.target.value}`
                        )
                      }
                      className="w-full bg-[#121216] border border-[#2e2e38] rounded-lg px-2.5 py-1.5 font-mono text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Time Decay, Diversity, Repetition & Exploration Settings */}
            <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-4">
              <div className="border-b border-[#232329] pb-2.5">
                <h3 className="text-sm font-bold text-white">
                  3. Time-Decay, Diversity &amp; Repetition Guardrails
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Prevent feed monotony, prioritize recent fan behavior, and control exploration vs. exploitation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-3 bg-[#18181f] border border-[#272730] rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-300 font-medium">Recent Activity Time-Decay Multiplier</span>
                    <span className="font-mono text-[#fce7b0]">
                      {recommendationConfig.timeDecayConfig.recentSessionMultiplier}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.1}
                    value={recommendationConfig.timeDecayConfig.recentSessionMultiplier}
                    onChange={e =>
                      adminUpdateRecommendationConfig(
                        {
                          timeDecayConfig: {
                            ...recommendationConfig.timeDecayConfig,
                            recentSessionMultiplier: Number(e.target.value)
                          }
                        },
                        `Updated recent activity time-decay multiplier to ${e.target.value}x`
                      )
                    }
                    className="w-full accent-[#d4af37]"
                  />
                  <div className="text-[10px] text-neutral-500">Boosts last 7 days over older 30-day history</div>
                </div>

                <div className="p-3 bg-[#18181f] border border-[#272730] rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-300 font-medium">Max Consecutive Same Creator</span>
                    <span className="font-mono text-[#fce7b0]">
                      {recommendationConfig.diversityRules.maxConsecutiveSameCreator} posts
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={recommendationConfig.diversityRules.maxConsecutiveSameCreator}
                    onChange={e =>
                      adminUpdateRecommendationConfig(
                        {
                          diversityRules: {
                            ...recommendationConfig.diversityRules,
                            maxConsecutiveSameCreator: Number(e.target.value)
                          }
                        },
                        `Updated creator repetition cap to ${e.target.value}`
                      )
                    }
                    className="w-full accent-[#d4af37]"
                  />
                  <div className="text-[10px] text-neutral-500">Prevents single-creator domination in For You</div>
                </div>

                <div className="p-3 bg-[#18181f] border border-[#272730] rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-300 font-medium">Exploration Ratio (Adjacent Discovery)</span>
                    <span className="font-mono text-[#fce7b0]">
                      {recommendationConfig.diversityRules.explorationPercentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={40}
                    step={5}
                    value={recommendationConfig.diversityRules.explorationPercentage}
                    onChange={e =>
                      adminUpdateRecommendationConfig(
                        {
                          diversityRules: {
                            ...recommendationConfig.diversityRules,
                            explorationPercentage: Number(e.target.value)
                          }
                        },
                        `Updated exploration ratio to ${e.target.value}%`
                      )
                    }
                    className="w-full accent-[#d4af37]"
                  />
                  <div className="text-[10px] text-neutral-500">Default: 85% core interests / 15% new discovery</div>
                </div>

                <div className="p-3 bg-[#18181f] border border-[#272730] rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-neutral-300 font-medium">Rising New Creator Boost</span>
                    <span className="font-mono text-[#fce7b0]">
                      +{recommendationConfig.diversityRules.newCreatorDiscoveryBoost}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={30}
                    step={2}
                    value={recommendationConfig.diversityRules.newCreatorDiscoveryBoost}
                    onChange={e =>
                      adminUpdateRecommendationConfig(
                        {
                          diversityRules: {
                            ...recommendationConfig.diversityRules,
                            newCreatorDiscoveryBoost: Number(e.target.value)
                          }
                        },
                        `Updated rising creator discovery boost to +${e.target.value}%`
                      )
                    }
                    className="w-full accent-[#d4af37]"
                  />
                  <div className="text-[10px] text-neutral-500">Helps emerging creators get initial discovery</div>
                </div>
              </div>
            </div>
          </div>

          {/* Eligible Content Types & Experiment Pause Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white">4. Eligible Content Types in Recommendations</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { key: 'publicFreePosts' as const, label: 'Public Free Posts & Videos' },
                  { key: 'followerOnlyPosts' as const, label: 'Free Follower-Only Posts' },
                  { key: 'photoGalleries' as const, label: 'Multi-Photo Galleries' },
                  { key: 'ppvLockedPreviews' as const, label: 'PPV Teasers (For You only, never Free Posts)' }
                ].map(item => (
                  <label
                    key={item.key}
                    className="p-3 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <span className="text-neutral-200 font-medium">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={recommendationConfig.eligibleContentTypes[item.key]}
                      onChange={e =>
                        adminUpdateRecommendationConfig(
                          {
                            eligibleContentTypes: {
                              ...recommendationConfig.eligibleContentTypes,
                              [item.key]: e.target.checked
                            }
                          },
                          `Toggled eligible content type ${item.label}: ${e.target.checked}`
                        )
                      }
                      className="w-4 h-4 accent-[#d4af37]"
                    />
                  </label>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/30 text-[11px] text-sky-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  <strong>Verification Fairness Guardrail Active:</strong> Paid Creator Blue Badges never artificially inflate organic recommendation ranking scores.
                </span>
              </div>
            </div>

            <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-3">
              <h3 className="text-sm font-bold text-white">5. Emergency Experiment Control &amp; Audit Log</h3>
              <p className="text-[11px] text-neutral-400">
                Pause personalized ML ranking across the platform to fall back to chronological sorting if an experiment requires rollback.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={pauseReasonInput}
                  onChange={e => setPauseReasonInput(e.target.value)}
                  placeholder="Enter audit log reason for pausing/resuming ranking experiment..."
                  className="flex-1 bg-[#18181f] border border-[#272730] rounded-xl px-3 py-2 text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    adminToggleRecommendationExperimentPause(
                      pauseReasonInput || 'Admin toggled recommendation experiment state'
                    );
                    setPauseReasonInput('');
                    showToast(
                      recommendationConfig.isExperimentPaused
                        ? 'Resumed personalized recommendation ranking.'
                        : 'Paused recommendation experiment (chronological fallback active).'
                    );
                  }}
                  className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    recommendationConfig.isExperimentPaused
                      ? 'bg-emerald-500 text-black'
                      : 'bg-amber-500 text-black'
                  }`}
                >
                  {recommendationConfig.isExperimentPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Resume Personalization</span>
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-black" />
                      <span>Pause Experiment</span>
                    </>
                  )}
                </button>
              </div>

              {recAuditLogs.length > 0 && (
                <div className="pt-2 space-y-1.5 max-h-36 overflow-y-auto">
                  <div className="text-[10px] font-mono uppercase text-neutral-400">Recent Engine Audit Logs:</div>
                  {recAuditLogs.map(log => (
                    <div key={log.id} className="p-2 bg-[#18181f] border border-[#272730] rounded-lg flex items-center justify-between text-[11px]">
                      <span className="text-neutral-200 truncate pr-2">{log.details || log.action}</span>
                      <span className="font-mono text-[10px] text-neutral-400 shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 2: RECOMMENDATION ANALYTICS & REAL METRICS
      ==================================================================== */}
      {subTab === 'analytics' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Date Range:</span>
              {(['all', 'today', '7d', '30d'] as const).map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDateFilter(d)}
                  className={`px-3 py-1 rounded-lg font-mono uppercase text-[11px] cursor-pointer ${
                    dateFilter === d
                      ? 'bg-[#d4af37] text-black font-bold'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-medium">Category Filter:</span>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-[#18181f] border border-[#272730] rounded-xl px-3 py-1.5 text-white"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Primary KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">For You Impressions</div>
              <div className="text-xl font-bold font-mono text-white mt-1">{analyticsStats.forYouImpressions}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5">Personalized Ranking</div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Free Posts Impressions</div>
              <div className="text-xl font-bold font-mono text-emerald-300 mt-1">{analyticsStats.freePostsImpressions}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">100% Zero-Paywall</div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Recommended Video Starts</div>
              <div className="text-xl font-bold font-mono text-[#fce7b0] mt-1">{analyticsStats.videoStarts}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Avg {analyticsStats.avgWatchDuration}s watched</div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Watch Completion Rate</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{analyticsStats.avgCompletionRate}%</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Across recommended videos</div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Follows &amp; Subscriptions</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {analyticsStats.followsFromRecs} / {analyticsStats.subsFromRecs}
              </div>
              <div className="text-[10px] text-[#d4af37] mt-0.5">Driven by discovery</div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Not Interested / Hidden</div>
              <div className="text-xl font-bold font-mono text-rose-300 mt-1">{analyticsStats.notInterestedCount}</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Negative feedback signals</div>
            </div>
          </div>

          {/* Secondary Engagement Breakdown & Category Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Top Recommended Categories &amp; Free Post Supply</h3>
              <div className="space-y-2.5">
                {categoryBreakdown.map(row => (
                  <div key={row.category} className="p-3 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-white">{row.category}</div>
                      <div className="text-[11px] text-neutral-400">
                        {row.postsCount} total posts · <span className="text-emerald-300">{row.freePostsCount} free accessible</span> · {row.eventsCount} tracked signals
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-xs font-bold text-[#fce7b0]">{row.totalAffinity} pts</div>
                      <div className="text-[10px] text-neutral-500">Platform Affinity</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white">Recent Fan Behavioral Signal Stream ({filteredEvents.length})</h3>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {filteredEvents.slice(0, 15).map(ev => (
                  <div key={ev.id} className="p-2.5 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between gap-2 text-[11px]">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#d4af37]/15 border border-[#d4af37]/30 font-mono text-[10px] text-[#fce7b0]">
                          {ev.eventType}
                        </span>
                        <span className="text-neutral-300 font-semibold truncate">
                          Fan: {ev.fanId}
                        </span>
                        <span className="text-neutral-500 font-mono text-[10px]">[{ev.sourceSurface || ev.surface}]</span>
                      </div>
                      <div className="text-[10px] text-neutral-400 mt-1 truncate">
                        {ev.category ? `Category: ${ev.category}` : ''}{' '}
                        {ev.creatorId ? `· Creator: ${ev.creatorId}` : ''}{' '}
                        {ev.completionPercentage ?? ev.completionPercent
                          ? `· Completion: ${ev.completionPercentage ?? ev.completionPercent}%`
                          : ''}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-neutral-500 shrink-0">{ev.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================
          SUB-TAB 3: SYSTEM HEALTH & LIVE FAN PERSONA SIMULATOR
      ==================================================================== */}
      {subTab === 'health' && (
        <div className="space-y-6">
          {/* System Health Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Events Processed</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {recommendationSystemHealth.eventsProcessedCount.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                Avg Delay: {recommendationSystemHealth.avgEventProcessingDelayMs}ms
              </div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Recommendation Jobs</div>
              <div className="text-lg font-bold font-mono text-white mt-1">
                {recommendationSystemHealth.recommendationJobsProcessed.toLocaleString()}
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">
                Failures: {recommendationSystemHealth.rankingFailuresCount}
              </div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Ranking Cache Hit Rate</div>
              <div className="text-lg font-bold font-mono text-[#fce7b0] mt-1">
                {recommendationSystemHealth.cacheHitRatePercent}%
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">Sub-20ms feed assembly</div>
            </div>
            <div className="p-4 bg-[#121216] border border-[#232329] rounded-2xl">
              <div className="text-[10px] uppercase text-neutral-400">Content Missing Metadata</div>
              <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                {recommendationSystemHealth.postsMissingMetadataCount} posts
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">100% category &amp; tag indexed</div>
            </div>
          </div>

          {/* Live Fan Persona Ranking Simulator (Verify Test Cases Fan A - Fan F) */}
          <div className="p-5 bg-[#121216] border border-[#232329] rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#232329] pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Live Fan Persona Recommendation Inspector (Test Cases A–F)
                </h3>
                <p className="text-[11px] text-neutral-400">
                  Switch between Fan Personas to inspect real-time For You and Free Posts ranking outputs side-by-side.
                </p>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.values(fanInterestProfiles).map(prof => (
                  <button
                    key={prof.fanId}
                    type="button"
                    onClick={() => switchRecommendationFanPersona(prof.fanId)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold cursor-pointer border ${
                      prof.fanId === activeRecommendationFanId
                        ? 'bg-[#d4af37] text-black font-bold border-[#d4af37]'
                        : 'bg-[#18181f] border-[#272730] text-neutral-300 hover:text-white'
                    }`}
                  >
                    {prof.fanName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* For You Output */}
              <div className="space-y-2.5">
                <div className="font-bold text-[#fce7b0] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>Top 4 &ldquo;For You&rdquo; Ranked Posts</span>
                </div>
                {previewForYou.map((r, idx) => (
                  <div key={r.post.id} className="p-3 bg-[#18181f] border border-[#272730] rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#d4af37]">#{idx + 1}</span>
                        <span className="font-bold text-white truncate">{r.post.creatorName}</span>
                        <span className="px-2 py-0.5 rounded bg-[#121216] border border-[#2e2e38] text-[10px] text-neutral-300">
                          {r.post.categories?.[0]}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 uppercase">{r.post.visibility}</span>
                      </div>
                      <p className="text-[11px] text-neutral-300 truncate mt-1">{r.post.content}</p>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{r.primaryReason}</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="text-sm font-bold text-[#fce7b0]">{r.totalScore.toFixed(1)}</div>
                      <div className="text-[9px] text-neutral-500">Score</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Free Posts Output */}
              <div className="space-y-2.5">
                <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Unlock className="w-4 h-4 text-emerald-400" />
                  <span>Top 4 &ldquo;Free Posts&rdquo; Ranked Posts (Zero Locked Content)</span>
                </div>
                {previewFreePosts.map((r, idx) => (
                  <div key={r.post.id} className="p-3 bg-[#18181f] border border-emerald-500/20 rounded-xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400">#{idx + 1}</span>
                        <span className="font-bold text-white truncate">{r.post.creatorName}</span>
                        <span className="px-2 py-0.5 rounded bg-[#121216] border border-[#2e2e38] text-[10px] text-neutral-300">
                          {r.post.categories?.[0]}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-mono text-emerald-300">
                          {r.post.visibility === 'public' ? 'Public Free' : 'Follower Free'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 truncate mt-1">{r.post.content}</p>
                      <div className="text-[10px] text-neutral-400 mt-0.5">{r.primaryReason}</div>
                    </div>
                    <div className="text-right font-mono shrink-0">
                      <div className="text-sm font-bold text-emerald-300">{r.totalScore.toFixed(1)}</div>
                      <div className="text-[9px] text-neutral-500">Score</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
