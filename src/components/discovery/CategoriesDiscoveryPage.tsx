import React, { useState, useMemo } from 'react';
import {
  Grid,
  Globe,
  Search,
  Clock,
  Flame,
  Play,
  Image as ImageIcon,
  ArrowLeft,
  Users,
  Video,
  CheckCircle2,
  X,
  ChevronRight,
  Compass
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryRecord, CountryRecord, Post, CreatorProfile } from '../../types';
import { DiscoveryFilterBar, DiscoveryFilterState } from './DiscoveryFilterBar';
import { PostCard } from '../feed/PostCard';
import { VerifiedBadge } from '../common/VerifiedBadge';
import {
  matchesCategoryIdentifier,
  matchesCountryIdentifier
} from '../../data/globalTaxonomy';

interface CategoriesDiscoveryPageProps {
  onSelectCreator: (creatorId: string) => void;
  onNavigate?: (tab: string, creatorId?: string) => void;
  onOpenTipModal?: (creatorId: string, creatorName: string) => void;
  onOpenSubscribeModal?: (creatorId: string) => void;
  onOpenShareModal?: (post: Post) => void;
  onOpenVideoPlayer?: (postId: string, initialTime?: number) => void;
  onOpenPhotoViewer?: (postId: string, mediaIndex?: number) => void;
  initialMode?: 'categories' | 'countries';
  initialCategorySlug?: string | null;
  initialCountryCode?: string | null;
}

export const CategoriesDiscoveryPage: React.FC<CategoriesDiscoveryPageProps> = ({
  onSelectCreator,
  onNavigate,
  onOpenTipModal,
  onOpenSubscribeModal,
  onOpenShareModal,
  onOpenVideoPlayer,
  onOpenPhotoViewer,
  initialMode = 'categories',
  initialCategorySlug = null,
  initialCountryCode = null
}) => {
  const {
    activeCategories,
    activeCountries,
    posts,
    creators,
    getCountryFlagAndName,
    isAuthenticated,
    currentUser
  } = useApp();

  // Top-level mode: 'categories' or 'countries'
  const [discoveryMode, setDiscoveryMode] = useState<'categories' | 'countries'>(initialMode);

  // Selected drill-down category or country
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(() => {
    if (!initialCategorySlug) return null;
    const found = activeCategories.find(
      c =>
        c.id === initialCategorySlug ||
        c.slug === initialCategorySlug ||
        c.name.toLowerCase() === initialCategorySlug.toLowerCase()
    );
    return found ? found.id : null;
  });

  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(() => {
    if (!initialCountryCode) return null;
    const found = activeCountries.find(
      c =>
        c.id === initialCountryCode ||
        c.iso_code.toLowerCase() === initialCountryCode.toLowerCase() ||
        c.name.toLowerCase() === initialCountryCode.toLowerCase()
    );
    return found ? found.id : null;
  });

  // Category Directory states
  const [categorySearch, setCategorySearch] = useState('');
  const [categoryTab, setCategoryTab] = useState<'all' | 'popular' | 'recent'>('all');

  // Global combined filters on the Categories Directory page
  const [globalFilters, setGlobalFilters] = useState<DiscoveryFilterState>({
    categories: [],
    videoCountries: [],
    creatorCountries: []
  });

  // Selected Category Content view states
  const [catViewVideoCountries, setCatViewVideoCountries] = useState<string[]>([]);
  const [catViewCreatorCountries, setCatViewCreatorCountries] = useState<string[]>([]);
  const [catViewExtraCategories, setCatViewExtraCategories] = useState<string[]>([]);
  const [catViewMediaType, setCatViewMediaType] = useState<'all' | 'video' | 'photo'>('all');
  const [catViewSort, setCatViewSort] = useState<'latest' | 'popular'>('latest');
  const [catViewSearch, setCatViewSearch] = useState('');

  // Country Directory states
  const [countrySearch, setCountrySearch] = useState('');
  const [countryDirectoryFilter, setCountryDirectoryFilter] = useState<
    'all' | 'with_content' | 'with_creators'
  >('all');

  // Selected Country Content view states
  const [countryDetailTab, setCountryDetailTab] = useState<'videos' | 'creators'>('videos');
  const [countryDetailCategoryFilter, setCountryDetailCategoryFilter] = useState<string>('All');
  const [countryDetailCreatorCountryFilter, setCountryDetailCreatorCountryFilter] = useState<
    string[]
  >([]);
  const [countryDetailSort, setCountryDetailSort] = useState<'latest' | 'popular'>('latest');

  // Creators lookup map
  const creatorMap = useMemo(() => {
    const map = new Map<string, CreatorProfile>();
    creators.forEach(c => map.set(c.id, c));
    return map;
  }, [creators]);

  // Publicly discoverable published posts
  const discoverablePosts = useMemo(() => {
    return posts.filter(p => {
      if (p.isDeletedByCreator || p.publicationStatus === 'deleted') return false;
      if (p.moderationStatus && p.moderationStatus !== 'approved') return false;
      if (p.isDraft) return false;
      if (p.visibility === 'private' && p.creatorId !== currentUser?.id) return false;
      if (p.scheduledFor && new Date(p.scheduledFor) > new Date()) return false;
      const creator = creatorMap.get(p.creatorId);
      if (creator && (creator.accountStatus === 'suspended' || creator.accountStatus === 'banned')) {
        return false;
      }
      return true;
    });
  }, [posts, currentUser?.id, creatorMap]);

  // Calculate genuine engagement and post count per category
  const categoryStats = useMemo(() => {
    const stats = new Map<
      string,
      {
        postCount: number;
        videoCount: number;
        photoCount: number;
        engagementScore: number;
        latestTimestamp: number;
        countriesSet: Set<string>;
      }
    >();

    activeCategories.forEach(cat => {
      stats.set(cat.id, {
        postCount: 0,
        videoCount: 0,
        photoCount: 0,
        engagementScore: 0,
        latestTimestamp: 0,
        countriesSet: new Set<string>()
      });
    });

    discoverablePosts.forEach(post => {
      const hasVideo = post.media?.some(m => m.type === 'video');
      const hasPhoto = post.media?.some(m => m.type === 'image');

      activeCategories.forEach(cat => {
        const matches = matchesCategoryIdentifier(
          post.categories,
          post.category_ids,
          [cat.name],
          activeCategories
        );

        if (matches) {
          const current = stats.get(cat.id)!;
          current.postCount += 1;
          if (hasVideo) current.videoCount += 1;
          if (!hasVideo && hasPhoto) current.photoCount += 1;
          current.engagementScore +=
            (post.viewsCount || 0) + (post.likesCount || 0) * 5 + (post.commentsCount || 0) * 10;

          if (post.country) {
            current.countriesSet.add(post.country);
          }

          const parsedTime = Date.parse(post.createdAt);
          if (!Number.isNaN(parsedTime) && parsedTime > current.latestTimestamp) {
            current.latestTimestamp = parsedTime;
          } else if (
            post.createdAt.toLowerCase().includes('just now') ||
            post.createdAt.toLowerCase().includes('hour')
          ) {
            current.latestTimestamp = Math.max(current.latestTimestamp, Date.now());
          } else if (post.createdAt.toLowerCase().includes('day')) {
            current.latestTimestamp = Math.max(current.latestTimestamp, Date.now() - 86400000);
          }
        }
      });
    });

    return stats;
  }, [activeCategories, discoverablePosts]);

  // Calculate stats per country (Videos from Country vs Creators from Country)
  const countryStats = useMemo(() => {
    const stats = new Map<
      string,
      { videoPostCount: number; creatorCount: number; categoriesInCountry: Set<string> }
    >();

    activeCountries.forEach(country => {
      stats.set(country.id, {
        videoPostCount: 0,
        creatorCount: 0,
        categoriesInCountry: new Set<string>()
      });
    });

    // Video Country counts
    discoverablePosts.forEach(post => {
      if (!post.country && !post.video_country_id) return;
      activeCountries.forEach(country => {
        if (
          matchesCountryIdentifier(
            post.country,
            post.video_country_id,
            [country.name],
            activeCountries
          )
        ) {
          const entry = stats.get(country.id)!;
          entry.videoPostCount += 1;
          (post.categories || []).forEach(c => entry.categoriesInCountry.add(c));
        }
      });
    });

    // Creator Country counts
    creators.forEach(creator => {
      if (creator.accountStatus === 'suspended' || creator.accountStatus === 'banned') return;
      if (!creator.country && !creator.creator_country_id) return;
      activeCountries.forEach(country => {
        if (
          matchesCountryIdentifier(
            creator.country,
            creator.creator_country_id,
            [country.name],
            activeCountries
          )
        ) {
          const entry = stats.get(country.id)!;
          entry.creatorCount += 1;
        }
      });
    });

    return stats;
  }, [activeCountries, discoverablePosts, creators]);

  // Filtered & sorted categories for directory view
  const displayedCategories = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    const list = activeCategories.filter(cat => {
      if (!q) return true;
      return (
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q) ||
        (cat.description || '').toLowerCase().includes(q)
      );
    });

    return [...list].sort((a, b) => {
      const statA = categoryStats.get(a.id);
      const statB = categoryStats.get(b.id);
      if (categoryTab === 'popular') {
        const diff = (statB?.engagementScore || 0) - (statA?.engagementScore || 0);
        if (diff !== 0) return diff;
        return (statB?.postCount || 0) - (statA?.postCount || 0);
      }
      if (categoryTab === 'recent') {
        const diff = (statB?.latestTimestamp || 0) - (statA?.latestTimestamp || 0);
        if (diff !== 0) return diff;
        return (statB?.postCount || 0) - (statA?.postCount || 0);
      }
      return a.display_order - b.display_order;
    });
  }, [activeCategories, categorySearch, categoryTab, categoryStats]);

  // Combined multi-filter results when globalFilters has active selections on the directory view
  const hasGlobalCombinedFilters =
    globalFilters.categories.length > 0 ||
    globalFilters.videoCountries.length > 0 ||
    globalFilters.creatorCountries.length > 0;

  const globalCombinedPosts = useMemo(() => {
    if (!hasGlobalCombinedFilters) return [];
    return discoverablePosts.filter(post => {
      if (
        globalFilters.categories.length > 0 &&
        !matchesCategoryIdentifier(
          post.categories,
          post.category_ids,
          globalFilters.categories,
          activeCategories
        )
      ) {
        return false;
      }
      if (
        globalFilters.videoCountries.length > 0 &&
        !matchesCountryIdentifier(
          post.country,
          post.video_country_id,
          globalFilters.videoCountries,
          activeCountries
        )
      ) {
        return false;
      }
      if (globalFilters.creatorCountries.length > 0) {
        const creator = creatorMap.get(post.creatorId);
        if (
          !matchesCountryIdentifier(
            creator?.country,
            creator?.creator_country_id,
            globalFilters.creatorCountries,
            activeCountries
          )
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    hasGlobalCombinedFilters,
    discoverablePosts,
    globalFilters,
    activeCategories,
    activeCountries,
    creatorMap
  ]);

  // Filtered & sorted countries for directory view
  const displayedCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    const list = activeCountries.filter(country => {
      const stat = countryStats.get(country.id);
      if (countryDirectoryFilter === 'with_content' && (stat?.videoPostCount || 0) === 0) {
        return false;
      }
      if (countryDirectoryFilter === 'with_creators' && (stat?.creatorCount || 0) === 0) {
        return false;
      }
      if (!q) return true;
      return (
        country.name.toLowerCase().includes(q) ||
        country.iso_code.toLowerCase().includes(q) ||
        (country.aliases || []).some(a => a.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      const statA = countryStats.get(a.id);
      const statB = countryStats.get(b.id);
      const totalA = (statA?.videoPostCount || 0) + (statA?.creatorCount || 0);
      const totalB = (statB?.videoPostCount || 0) + (statB?.creatorCount || 0);
      if (totalA > 0 && totalB === 0) return -1;
      if (totalB > 0 && totalA === 0) return 1;
      if (totalA !== totalB && countryDirectoryFilter !== 'all') return totalB - totalA;
      return a.name.localeCompare(b.name);
    });
  }, [activeCountries, countrySearch, countryDirectoryFilter, countryStats]);

  // Currently selected Category object
  const selectedCategory: CategoryRecord | undefined = useMemo(
    () => activeCategories.find(c => c.id === selectedCategoryId),
    [activeCategories, selectedCategoryId]
  );

  // Currently selected Country object
  const selectedCountry: CountryRecord | undefined = useMemo(
    () => activeCountries.find(c => c.id === selectedCountryId),
    [activeCountries, selectedCountryId]
  );

  // Posts matching the selected Category + any additional Category/Country filters
  const selectedCategoryPosts = useMemo(() => {
    if (!selectedCategory) return [];
    const targetCategoryNames = [selectedCategory.name, ...catViewExtraCategories];

    const filtered = discoverablePosts.filter(post => {
      const matchesCat = matchesCategoryIdentifier(
        post.categories,
        post.category_ids,
        targetCategoryNames,
        activeCategories
      );
      if (!matchesCat) return false;

      // Media type filter
      const hasVideo = post.media?.some(m => m.type === 'video');
      const hasPhoto = post.media?.some(m => m.type === 'image');
      if (catViewMediaType === 'video' && !hasVideo) return false;
      if (catViewMediaType === 'photo' && (hasVideo || !hasPhoto)) return false;

      // Video Country filter
      if (
        catViewVideoCountries.length > 0 &&
        !matchesCountryIdentifier(
          post.country,
          post.video_country_id,
          catViewVideoCountries,
          activeCountries
        )
      ) {
        return false;
      }

      // Creator Country filter
      if (catViewCreatorCountries.length > 0) {
        const creator = creatorMap.get(post.creatorId);
        if (
          !matchesCountryIdentifier(
            creator?.country,
            creator?.creator_country_id,
            catViewCreatorCountries,
            activeCountries
          )
        ) {
          return false;
        }
      }

      // Search query
      if (catViewSearch.trim()) {
        const q = catViewSearch.toLowerCase();
        const creator = creatorMap.get(post.creatorId);
        const inCaption = post.content.toLowerCase().includes(q);
        const inCreator =
          creator?.name.toLowerCase().includes(q) ||
          creator?.username.toLowerCase().includes(q);
        const inCountry = (post.country || '').toLowerCase().includes(q);
        if (!inCaption && !inCreator && !inCountry) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (catViewSort === 'popular') {
        const scoreA = (a.viewsCount || 0) + (a.likesCount || 0) * 5;
        const scoreB = (b.viewsCount || 0) + (b.likesCount || 0) * 5;
        return scoreB - scoreA;
      }
      return b.id.localeCompare(a.id);
    });
  }, [
    selectedCategory,
    catViewExtraCategories,
    discoverablePosts,
    catViewMediaType,
    catViewVideoCountries,
    catViewCreatorCountries,
    catViewSearch,
    catViewSort,
    creatorMap,
    activeCategories,
    activeCountries
  ]);

  // Posts and Creators matching the selected Country
  const selectedCountryVideos = useMemo(() => {
    if (!selectedCountry) return [];
    const filtered = discoverablePosts.filter(post => {
      const matchesVidCountry = matchesCountryIdentifier(
        post.country,
        post.video_country_id,
        [selectedCountry.name],
        activeCountries
      );
      if (!matchesVidCountry) return false;

      if (countryDetailCategoryFilter !== 'All') {
        const matchesCat = matchesCategoryIdentifier(
          post.categories,
          post.category_ids,
          [countryDetailCategoryFilter],
          activeCategories
        );
        if (!matchesCat) return false;
      }

      if (countryDetailCreatorCountryFilter.length > 0) {
        const creator = creatorMap.get(post.creatorId);
        const matchesCrCountry = matchesCountryIdentifier(
          creator?.country,
          creator?.creator_country_id,
          countryDetailCreatorCountryFilter,
          activeCountries
        );
        if (!matchesCrCountry) return false;
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (countryDetailSort === 'popular') {
        return (
          (b.viewsCount || 0) +
          (b.likesCount || 0) * 5 -
          ((a.viewsCount || 0) + (a.likesCount || 0) * 5)
        );
      }
      return b.id.localeCompare(a.id);
    });
  }, [
    selectedCountry,
    discoverablePosts,
    countryDetailCategoryFilter,
    countryDetailCreatorCountryFilter,
    countryDetailSort,
    creatorMap,
    activeCountries,
    activeCategories
  ]);

  const selectedCountryCreators = useMemo(() => {
    if (!selectedCountry) return [];
    return creators.filter(creator => {
      if (creator.accountStatus === 'suspended' || creator.accountStatus === 'banned') return false;
      return matchesCountryIdentifier(
        creator.country,
        creator.creator_country_id,
        [selectedCountry.name],
        activeCountries
      );
    });
  }, [selectedCountry, creators, activeCountries]);

  const availableCategoriesInSelectedCountry = useMemo(() => {
    if (!selectedCountry) return [];
    const set = new Set<string>();
    discoverablePosts.forEach(post => {
      if (
        matchesCountryIdentifier(
          post.country,
          post.video_country_id,
          [selectedCountry.name],
          activeCountries
        )
      ) {
        (post.categories || []).forEach(c => set.add(c));
      }
    });
    return Array.from(set);
  }, [selectedCountry, discoverablePosts, activeCountries]);

  const handleOpenCategory = (catId: string) => {
    setSelectedCategoryId(catId);
    setSelectedCountryId(null);
    setCatViewVideoCountries([]);
    setCatViewCreatorCountries([]);
    setCatViewExtraCategories([]);
    setCatViewMediaType('all');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenCountry = (countryId: string, defaultTab: 'videos' | 'creators' = 'videos') => {
    setSelectedCountryId(countryId);
    setSelectedCategoryId(null);
    setCountryDetailTab(defaultTab);
    setCountryDetailCategoryFilter('All');
    setCountryDetailCreatorCountryFilter([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTipFallback = (creatorId: string, creatorName: string) => {
    if (onOpenTipModal) {
      onOpenTipModal(creatorId, creatorName);
    } else {
      onSelectCreator(creatorId);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-white py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Hero & Mode Switcher */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#16161d] via-[#121216] to-[#09090b] border border-[#27272a] p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/30 text-[#fce7b0] text-xs font-bold uppercase tracking-wider">
                <Compass className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Global Categories &amp; Countries Discovery</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                {selectedCategory
                  ? selectedCategory.name
                  : selectedCountry
                  ? `${selectedCountry.flag} ${selectedCountry.name}`
                  : discoveryMode === 'categories'
                  ? 'Explore Official Categories'
                  : 'Explore World Countries'}
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
                {selectedCategory
                  ? selectedCategory.description ||
                    `Browse public videos, photos, and creators in ${selectedCategory.name}. Filter by Video Country or Creator Country.`
                  : selectedCountry
                  ? `Discover public videos filmed or tagged in ${selectedCountry.name} (Video Country) and verified creators based in ${selectedCountry.name} (Creator Country).`
                  : 'Discover videos, photos, and creators across official ACOVON categories and ISO 3166-1 countries. Filter independently by Category, Video Country, and Creator Country.'}
              </p>
            </div>

            {/* Primary Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setDiscoveryMode('categories');
                  setSelectedCategoryId(null);
                  setSelectedCountryId(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  discoveryMode === 'categories' && !selectedCountry
                    ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                    : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#2b2b36]'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span>Categories</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black tabular-nums ${
                    discoveryMode === 'categories' && !selectedCountry
                      ? 'bg-black/15 text-black'
                      : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  {activeCategories.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDiscoveryMode('countries');
                  setSelectedCategoryId(null);
                  setSelectedCountryId(null);
                }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  discoveryMode === 'countries' || Boolean(selectedCountry)
                    ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                    : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#2b2b36]'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Countries</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-black tabular-nums ${
                    discoveryMode === 'countries' || Boolean(selectedCountry)
                      ? 'bg-black/15 text-black'
                      : 'bg-white/10 text-neutral-300'
                  }`}
                >
                  {activeCountries.length}
                </span>
              </button>
            </div>
          </div>

          {/* Breadcrumb navigation when inside a specific category or country */}
          {(selectedCategory || selectedCountry) && (
            <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedCategory) {
                      setSelectedCategoryId(null);
                      setDiscoveryMode('categories');
                    } else {
                      setSelectedCountryId(null);
                      setDiscoveryMode('countries');
                    }
                  }}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-neutral-200 font-semibold transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to {selectedCategory ? 'All Categories' : 'All Countries'}</span>
                </button>
                <ChevronRight className="w-4 h-4 text-neutral-600" />
                <span className="text-[#fce7b0] font-bold">
                  {selectedCategory
                    ? selectedCategory.name
                    : `${selectedCountry?.flag} ${selectedCountry?.name} (${selectedCountry?.iso_code})`}
                </span>
              </div>

              {!isAuthenticated && onNavigate && (
                <div className="flex items-center gap-3 text-xs text-neutral-400">
                  <span>Browsing public content as Guest</span>
                  <button
                    type="button"
                    onClick={() => onNavigate('landing')}
                    className="px-3 py-1.5 rounded-lg bg-[#d4af37] hover:bg-[#e5c07b] text-black font-bold transition-all cursor-pointer"
                  >
                    Sign In for Full Access
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: SELECTED CATEGORY DETAIL VIEW                             */}
        {/* ================================================================= */}
        {selectedCategory && (
          <div className="space-y-6">
            <DiscoveryFilterBar
              appliedFilters={{
                categories: [selectedCategory.name, ...catViewExtraCategories],
                videoCountries: catViewVideoCountries,
                creatorCountries: catViewCreatorCountries
              }}
              onApplyFilters={filters => {
                if (filters.categories.length === 0) {
                  setCatViewExtraCategories([]);
                } else {
                  const extras = filters.categories.filter(c => c !== selectedCategory.name);
                  setCatViewExtraCategories(extras);
                }
                setCatViewVideoCountries(filters.videoCountries);
                setCatViewCreatorCountries(filters.creatorCountries);
              }}
              totalMatchingCount={selectedCategoryPosts.length}
              resultUnitLabel="posts"
            />

            {/* Secondary Controls: Search, Media Type, Sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121216] border border-[#26262b] rounded-2xl p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={catViewSearch}
                  onChange={e => setCatViewSearch(e.target.value)}
                  placeholder={`Search captions, creators, or countries in ${selectedCategory.name}...`}
                  className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl pl-10 pr-9 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
                />
                {catViewSearch && (
                  <button
                    type="button"
                    onClick={() => setCatViewSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Media Type Switcher */}
                <div className="flex items-center bg-[#18181f] p-1 rounded-xl border border-[#2b2b36]">
                  {(['all', 'video', 'photo'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setCatViewMediaType(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        catViewMediaType === type
                          ? 'bg-[#d4af37] text-black'
                          : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {type === 'all' ? 'All Media' : `${type}s`}
                    </button>
                  ))}
                </div>

                {/* Sort Switcher */}
                <div className="flex items-center bg-[#18181f] p-1 rounded-xl border border-[#2b2b36]">
                  <button
                    type="button"
                    onClick={() => setCatViewSort('latest')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      catViewSort === 'latest'
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Latest</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatViewSort('popular')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      catViewSort === 'popular'
                        ? 'bg-white text-black'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span>Popular</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Posts Feed */}
            {selectedCategoryPosts.length === 0 ? (
              <div className="bg-[#121216] border border-[#26262b] rounded-3xl p-12 text-center max-w-xl mx-auto my-8 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#d4af37]/15 border border-[#d4af37]/30 flex items-center justify-center mx-auto text-[#d4af37]">
                  <Video className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  No matching posts in {selectedCategory.name}
                </h3>
                <p className="text-xs text-neutral-400">
                  {catViewVideoCountries.length > 0 ||
                  catViewCreatorCountries.length > 0 ||
                  catViewSearch
                    ? 'No posts matched your selected Video Country or Creator Country filters. Clear filters to view all posts in this category.'
                    : 'There are currently no published public posts assigned to this category yet.'}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  {(catViewVideoCountries.length > 0 ||
                    catViewCreatorCountries.length > 0 ||
                    catViewSearch ||
                    catViewMediaType !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setCatViewVideoCountries([]);
                        setCatViewCreatorCountries([]);
                        setCatViewExtraCategories([]);
                        setCatViewMediaType('all');
                        setCatViewSearch('');
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#d4af37] text-black text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear Category Filters
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setSelectedCategoryId(null)}
                    className="px-4 py-2.5 rounded-xl bg-[#1c1c24] hover:bg-[#262630] text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Browse Other Categories
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl mx-auto space-y-6">
                {selectedCategoryPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onNavigateToCreator={onSelectCreator}
                    onOpenTipModal={handleTipFallback}
                    onOpenSubscribeModal={onOpenSubscribeModal}
                    onOpenShareModal={onOpenShareModal}
                    onOpenVideoPlayer={onOpenVideoPlayer}
                    onOpenPhotoViewer={onOpenPhotoViewer}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 2: SELECTED COUNTRY DETAIL VIEW                              */}
        {/* ================================================================= */}
        {selectedCountry && !selectedCategory && (
          <div className="space-y-6">
            {/* Country Distinction Tabs: Videos from Country (Video Country) vs Creators from Country (Creator Country) */}
            <div className="bg-[#121216] border border-[#26262b] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCountryDetailTab('videos')}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    countryDetailTab === 'videos'
                      ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>
                    Videos &amp; Posts from {selectedCountry.flag} {selectedCountry.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/20 text-xs font-black tabular-nums">
                    {selectedCountryVideos.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCountryDetailTab('creators')}
                  className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    countryDetailTab === 'creators'
                      ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>
                    Creators from {selectedCountry.flag} {selectedCountry.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-black/20 text-xs font-black tabular-nums">
                    {selectedCountryCreators.length}
                  </span>
                </button>
              </div>

              {/* Sort when on Videos tab */}
              {countryDetailTab === 'videos' && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCountryDetailSort('latest')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      countryDetailSort === 'latest'
                        ? 'bg-white text-black'
                        : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                    }`}
                  >
                    Latest
                  </button>
                  <button
                    type="button"
                    onClick={() => setCountryDetailSort('popular')}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      countryDetailSort === 'popular'
                        ? 'bg-white text-black'
                        : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                    }`}
                  >
                    Popular
                  </button>
                </div>
              )}
            </div>

            {/* Available Categories in this Country */}
            {countryDetailTab === 'videos' && availableCategoriesInSelectedCountry.length > 0 && (
              <div className="bg-[#121216] border border-[#26262b] rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5 text-[#d4af37]" />
                  <span>
                    Categories Available in {selectedCountry.flag} {selectedCountry.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCountryDetailCategoryFilter('All')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      countryDetailCategoryFilter === 'All'
                        ? 'bg-[#d4af37] text-black'
                        : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                    }`}
                  >
                    All Categories
                  </button>
                  {availableCategoriesInSelectedCountry.map(catName => (
                    <button
                      key={catName}
                      type="button"
                      onClick={() => setCountryDetailCategoryFilter(catName)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        countryDetailCategoryFilter === catName
                          ? 'bg-[#d4af37] text-black'
                          : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#2b2b36]'
                      }`}
                    >
                      {catName}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 1: Videos from Selected Country (Video Country) */}
            {countryDetailTab === 'videos' && (
              <div>
                {selectedCountryVideos.length === 0 ? (
                  <div className="bg-[#121216] border border-[#26262b] rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                    <div className="text-4xl">{selectedCountry.flag}</div>
                    <h3 className="text-lg font-bold text-white">
                      No public videos tagged with {selectedCountry.name} as Video Country yet
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Video Country is independent from Creator Country. Check the Creators tab to see if creators based in {selectedCountry.name} have published videos filmed in other countries.
                    </p>
                    <div className="flex flex-wrap justify-center gap-3 pt-2">
                      {selectedCountryCreators.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setCountryDetailTab('creators')}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 text-black text-xs font-bold transition-all cursor-pointer"
                        >
                          View {selectedCountryCreators.length} Creator
                          {selectedCountryCreators.length === 1 ? '' : 's'} from{' '}
                          {selectedCountry.name}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedCountryId(null)}
                        className="px-4 py-2.5 rounded-xl bg-[#1c1c24] hover:bg-[#262630] text-white text-xs font-bold transition-all cursor-pointer"
                      >
                        Explore Other Countries
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {selectedCountryVideos.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onNavigateToCreator={onSelectCreator}
                        onOpenTipModal={handleTipFallback}
                        onOpenSubscribeModal={onOpenSubscribeModal}
                        onOpenShareModal={onOpenShareModal}
                        onOpenVideoPlayer={onOpenVideoPlayer}
                        onOpenPhotoViewer={onOpenPhotoViewer}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Creators from Selected Country (Creator Country) */}
            {countryDetailTab === 'creators' && (
              <div>
                {selectedCountryCreators.length === 0 ? (
                  <div className="bg-[#121216] border border-[#26262b] rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
                    <div className="text-4xl">{selectedCountry.flag}</div>
                    <h3 className="text-lg font-bold text-white">
                      No creators currently list {selectedCountry.name} as their Creator Country
                    </h3>
                    <p className="text-xs text-neutral-400">
                      Creators can set or update their Creator Country in their profile settings.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedCountryId(null)}
                      className="px-4 py-2.5 rounded-xl bg-[#1c1c24] hover:bg-[#262630] text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Browse All Countries
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedCountryCreators.map(creator => {
                      const creatorCountryMeta = getCountryFlagAndName(creator.country);
                      const creatorPosts = discoverablePosts.filter(p => p.creatorId === creator.id);
                      return (
                        <div
                          key={creator.id}
                          onClick={() => onSelectCreator(creator.id)}
                          className="group cursor-pointer rounded-3xl bg-[#121216] border border-[#26262b] hover:border-[#d4af37]/50 overflow-hidden transition-all flex flex-col justify-between shadow-xl"
                        >
                          <div>
                            <div className="h-28 w-full relative overflow-hidden bg-neutral-900">
                              <img
                                src={creator.coverImage}
                                alt={creator.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/30 to-transparent" />
                              {creatorCountryMeta && (
                                <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-xs font-bold text-[#fce7b0] flex items-center gap-1.5">
                                  <span>{creatorCountryMeta.flag}</span>
                                  <span>{creatorCountryMeta.name}</span>
                                </div>
                              )}
                            </div>

                            <div className="px-5 pb-5 -mt-8 relative z-10 space-y-3">
                              <div className="flex items-end justify-between gap-3">
                                <img
                                  src={creator.avatar}
                                  alt={creator.name}
                                  referrerPolicy="no-referrer"
                                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#121216] shadow-lg"
                                />
                                <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-neutral-300 tabular-nums">
                                  {creatorPosts.length} {creatorPosts.length === 1 ? 'post' : 'posts'}
                                </span>
                              </div>

                              <div>
                                <div className="flex items-center gap-1.5">
                                  <h3 className="text-base font-bold text-white group-hover:text-[#fce7b0] transition-colors">
                                    {creator.name}
                                  </h3>
                                </div>
                                <p className="text-xs text-neutral-400 font-medium inline-flex items-center gap-1">
                                  <span>@{creator.username}</span>
                                  <VerifiedBadge creatorId={creator.id} size="xs" />
                                </p>
                              </div>

                              <p className="text-xs text-neutral-400 line-clamp-2">{creator.bio}</p>

                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {(creator.categories && creator.categories.length > 0
                                  ? creator.categories
                                  : [creator.category]
                                )
                                  .slice(0, 3)
                                  .map(cat => (
                                    <span
                                      key={cat}
                                      className="px-2 py-0.5 rounded-md bg-white/5 text-[11px] font-medium text-[#fce7b0]"
                                    >
                                      {cat}
                                    </span>
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="px-5 py-3.5 bg-[#16161c] border-t border-white/5 flex items-center justify-between text-xs">
                            <span className="text-neutral-400 font-medium tabular-nums">
                              {(creator.followersCount || 0).toLocaleString()} followers
                            </span>
                            <span className="text-[#d4af37] font-bold group-hover:translate-x-0.5 transition-transform">
                              View Profile &rarr;
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: CATEGORIES DIRECTORY GRID + COMBINED DISCOVERY FILTER     */}
        {/* ================================================================= */}
        {!selectedCategory && !selectedCountry && discoveryMode === 'categories' && (
          <div className="space-y-6">
            {/* Combined Category + Video Country + Creator Country Filter Bar */}
            <DiscoveryFilterBar
              appliedFilters={globalFilters}
              onApplyFilters={setGlobalFilters}
              totalMatchingCount={
                hasGlobalCombinedFilters ? globalCombinedPosts.length : undefined
              }
              resultUnitLabel="matching posts"
            />

            {/* If user applied combined filters right from the Categories hub, show matching posts */}
            {hasGlobalCombinedFilters && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base sm:text-lg font-bold text-white">
                    Filtered Discovery Results ({globalCombinedPosts.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() =>
                      setGlobalFilters({
                        categories: [],
                        videoCountries: [],
                        creatorCountries: []
                      })
                    }
                    className="text-xs font-bold text-[#d4af37] hover:underline cursor-pointer"
                  >
                    Return to Categories Grid
                  </button>
                </div>

                {globalCombinedPosts.length === 0 ? (
                  <div className="p-10 rounded-3xl bg-[#121216] border border-[#26262b] text-center space-y-3">
                    <p className="text-sm font-bold text-white">
                      No posts match your combined Category, Video Country, and Creator Country filters.
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setGlobalFilters({
                          categories: [],
                          videoCountries: [],
                          creatorCountries: []
                        })
                      }
                      className="px-4 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-bold cursor-pointer"
                    >
                      Clear All Filters
                    </button>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto space-y-6">
                    {globalCombinedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onNavigateToCreator={onSelectCreator}
                        onOpenTipModal={handleTipFallback}
                        onOpenSubscribeModal={onOpenSubscribeModal}
                        onOpenShareModal={onOpenShareModal}
                        onOpenVideoPlayer={onOpenVideoPlayer}
                        onOpenPhotoViewer={onOpenPhotoViewer}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Search and Category Sorting Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121216] border border-[#26262b] rounded-2xl p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                  placeholder="Search official categories (e.g., Amateur, Music, Fashion, Fitness)..."
                  className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
                />
                {categorySearch && (
                  <button
                    type="button"
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryTab('all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryTab === 'all'
                      ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>All Active Categories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('popular')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryTab === 'popular'
                      ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Popular Categories</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryTab('recent')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    categoryTab === 'recent'
                      ? 'bg-[#d4af37] text-black shadow-lg shadow-[#d4af37]/20'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Recently Active</span>
                </button>
              </div>
            </div>

            {/* Categories Grid */}
            {displayedCategories.length === 0 ? (
              <div className="bg-[#121216] border border-[#26262b] rounded-3xl p-12 text-center space-y-3">
                <p className="text-base font-bold text-white">
                  No categories match &ldquo;{categorySearch}&rdquo;
                </p>
                <button
                  type="button"
                  onClick={() => setCategorySearch('')}
                  className="px-4 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-bold cursor-pointer"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {displayedCategories.map(cat => {
                  const stat = categoryStats.get(cat.id);
                  const postCount = stat?.postCount || 0;
                  const countriesCount = stat?.countriesSet.size || 0;

                  return (
                    <div
                      key={cat.id}
                      onClick={() => handleOpenCategory(cat.id)}
                      className="group cursor-pointer rounded-3xl bg-[#121216] border border-[#26262b] hover:border-[#d4af37]/60 overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg"
                    >
                      <div>
                        <div className="relative h-44 w-full overflow-hidden bg-neutral-900">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            onError={e => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&auto=format&fit=crop&q=80';
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/40 to-transparent" />

                          {/* Top badges */}
                          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
                            <span className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white tabular-nums">
                              {postCount} {postCount === 1 ? 'post' : 'posts'}
                            </span>
                            {countriesCount > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-[#d4af37]/90 text-black text-[11px] font-bold flex items-center gap-1 tabular-nums">
                                <Globe className="w-3 h-3" />
                                <span>
                                  {countriesCount} {countriesCount === 1 ? 'country' : 'countries'}
                                </span>
                              </span>
                            )}
                          </div>

                          <div className="absolute bottom-3 left-4 right-4">
                            <h3 className="text-lg font-black text-white group-hover:text-[#fce7b0] transition-colors leading-snug">
                              {cat.name}
                            </h3>
                          </div>
                        </div>

                        <div className="p-4">
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {cat.description || `Explore verified videos and photos in ${cat.name}.`}
                          </p>
                        </div>
                      </div>

                      <div className="px-4 py-3 bg-[#16161c] border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-medium tabular-nums">
                          <span className="flex items-center gap-1">
                            <Play className="w-3 h-3 text-[#d4af37]" />
                            <span>{stat?.videoCount || 0}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-sky-400" />
                            <span>{stat?.photoCount || 0}</span>
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#d4af37] group-hover:translate-x-0.5 transition-all">
                          <span>Explore Category</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 4: COUNTRIES DIRECTORY GRID (ISO 3166-1)                     */}
        {/* ================================================================= */}
        {!selectedCategory && !selectedCountry && discoveryMode === 'countries' && (
          <div className="space-y-6">
            {/* Search and Filter Bar for Countries */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121216] border border-[#26262b] rounded-2xl p-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={countrySearch}
                  onChange={e => setCountrySearch(e.target.value)}
                  placeholder="Search country by name or ISO code (e.g., France, FR, UAE, Japan, US)..."
                  className="w-full bg-[#18181f] border border-[#2b2b36] rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
                />
                {countrySearch && (
                  <button
                    type="button"
                    onClick={() => setCountrySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCountryDirectoryFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    countryDirectoryFilter === 'all'
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  All ISO Countries ({activeCountries.length})
                </button>
                <button
                  type="button"
                  onClick={() => setCountryDirectoryFilter('with_content')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    countryDirectoryFilter === 'with_content'
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  With Videos
                </button>
                <button
                  type="button"
                  onClick={() => setCountryDirectoryFilter('with_creators')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    countryDirectoryFilter === 'with_creators'
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-[#2b2b36]'
                  }`}
                >
                  With Creators
                </button>
              </div>
            </div>

            {displayedCountries.length === 0 ? (
              <div className="bg-[#121216] border border-[#26262b] rounded-3xl p-12 text-center space-y-3">
                <p className="text-base font-bold text-white">
                  No countries match your current filter
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCountrySearch('');
                    setCountryDirectoryFilter('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#d4af37] text-black text-xs font-bold cursor-pointer"
                >
                  Show All Countries
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedCountries.map(country => {
                  const stat = countryStats.get(country.id);
                  const videoCount = stat?.videoPostCount || 0;
                  const creatorCount = stat?.creatorCount || 0;
                  const hasActivity = videoCount > 0 || creatorCount > 0;

                  return (
                    <div
                      key={country.id}
                      onClick={() =>
                        handleOpenCountry(
                          country.id,
                          videoCount > 0 ? 'videos' : creatorCount > 0 ? 'creators' : 'videos'
                        )
                      }
                      className={`group cursor-pointer rounded-2xl p-4 border transition-all flex flex-col justify-between gap-4 ${
                        hasActivity
                          ? 'bg-[#121216] border-[#d4af37]/40 hover:border-[#d4af37] shadow-lg'
                          : 'bg-[#121216]/60 border-[#26262b] hover:border-[#3a3a46]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-3xl leading-none shrink-0">{country.flag}</span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-bold text-white truncate group-hover:text-[#fce7b0] transition-colors">
                              {country.name}
                            </h3>
                            <span className="text-[11px] font-mono uppercase text-neutral-500">
                              ISO: {country.iso_code}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-neutral-600 group-hover:text-[#d4af37] group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-xs">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenCountry(country.id, 'videos');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                            videoCount > 0
                              ? 'bg-[#d4af37]/15 text-[#fce7b0] border border-[#d4af37]/30 hover:bg-[#d4af37]/25'
                              : 'bg-[#18181f] text-neutral-500'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-medium">
                            <Video className="w-3 h-3" />
                            <span>Videos</span>
                          </span>
                          <span className="font-black tabular-nums">{videoCount}</span>
                        </button>

                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenCountry(country.id, 'creators');
                          }}
                          className={`px-2.5 py-1.5 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                            creatorCount > 0
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25'
                              : 'bg-[#18181f] text-neutral-500'
                          }`}
                        >
                          <span className="flex items-center gap-1 font-medium">
                            <Users className="w-3 h-3" />
                            <span>Creators</span>
                          </span>
                          <span className="font-black tabular-nums">{creatorCount}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
