import React, { useState, useMemo, useRef } from 'react';
import {
  Grid,
  Globe,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Video,
  Users,
  Sparkles,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryRecord } from '../../types';
import {
  matchesCategoryIdentifier,
  matchesCountryIdentifier
} from '../../data/globalTaxonomy';
import { uploadUserFileToSupabase } from '../../services/supabase';

const DEFAULT_CATEGORY_COVER = '';

export const AdminCategoriesCountriesSection: React.FC = () => {
  const {
    currentUser,
    categories,
    countries,
    posts,
    creators,
    adminAddCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminToggleCountryActive
  } = useApp();

  const [subTab, setSubTab] = useState<'categories' | 'countries'>('categories');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4000);
  };

  // Category Management State
  const [catSearch, setCatSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<CategoryRecord | null>(null);
  const [isDeletingCategory, setIsDeletingCategory] = useState(false);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formCoverFileName, setFormCoverFileName] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [coverUploadProgress, setCoverUploadProgress] = useState(0);
  const [coverUploadError, setCoverUploadError] = useState<string | null>(null);
  const [isDraggingCover, setIsDraggingCover] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(categories.length + 1);
  const [formIsActive, setFormIsActive] = useState(true);

  const coverFileInputRef = useRef<HTMLInputElement>(null);

  // Country Management State
  const [countrySearch, setCountrySearch] = useState('');
  const [countryStatusFilter, setCountryStatusFilter] = useState<'all' | 'active' | 'inactive'>(
    'all'
  );

  // Calculate post count per category
  const categoryUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    categories.forEach(c => map.set(c.id, 0));

    posts.forEach(post => {
      if (post.isDeletedByCreator || post.publicationStatus === 'deleted') return;
      categories.forEach(cat => {
        const matches = matchesCategoryIdentifier(
          post.categories,
          post.category_ids,
          [cat.name],
          categories
        );
        if (matches) {
          map.set(cat.id, (map.get(cat.id) || 0) + 1);
        }
      });
    });
    return map;
  }, [categories, posts]);

  // Calculate creator & video count per country
  const countryUsageMap = useMemo(() => {
    const map = new Map<string, { videos: number; creators: number }>();
    countries.forEach(c => map.set(c.id, { videos: 0, creators: 0 }));

    posts.forEach(post => {
      if (post.isDeletedByCreator || post.publicationStatus === 'deleted') return;
      if (!post.country && !post.video_country_id) return;
      countries.forEach(country => {
        if (
          matchesCountryIdentifier(
            post.country,
            post.video_country_id,
            [country.name],
            countries
          )
        ) {
          const item = map.get(country.id)!;
          item.videos += 1;
        }
      });
    });

    creators.forEach(creator => {
      if (!creator.country && !creator.creator_country_id) return;
      countries.forEach(country => {
        if (
          matchesCountryIdentifier(
            creator.country,
            creator.creator_country_id,
            [country.name],
            countries
          )
        ) {
          const item = map.get(country.id)!;
          item.creators += 1;
        }
      });
    });

    return map;
  }, [countries, posts, creators]);

  const filteredCategories = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    return [...categories]
      .filter(c => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q))
      .sort((a, b) => a.display_order - b.display_order);
  }, [categories, catSearch]);

  const filteredCountries = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    return [...countries]
      .filter(c => {
        if (countryStatusFilter === 'active' && !c.is_active) return false;
        if (countryStatusFilter === 'inactive' && c.is_active) return false;
        if (!q) return true;
        return (
          c.name.toLowerCase().includes(q) ||
          c.iso_code.toLowerCase().includes(q) ||
          (c.aliases || []).some(a => a.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countries, countrySearch, countryStatusFilter]);

  const resetCoverUploadState = () => {
    setFormCoverFileName(null);
    setIsUploadingCover(false);
    setCoverUploadProgress(0);
    setCoverUploadError(null);
    setIsDraggingCover(false);
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormImage(DEFAULT_CATEGORY_COVER);
    setFormDisplayOrder(categories.length + 1);
    setFormIsActive(true);
    resetCoverUploadState();
    setShowAddModal(true);
  };

  const openEditModal = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormImage(cat.image || DEFAULT_CATEGORY_COVER);
    setFormDisplayOrder(cat.display_order);
    setFormIsActive(cat.is_active);
    resetCoverUploadState();
    setShowAddModal(true);
  };

  const processCoverFileUpload = async (file: File) => {
    setCoverUploadError(null);

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!file.type || !allowedTypes.includes(file.type.toLowerCase())) {
      setCoverUploadError('Please choose a JPG, PNG, WEBP, or GIF image file.');
      return;
    }

    if (file.size <= 0 || file.size > 15 * 1024 * 1024) {
      setCoverUploadError('Cover image must be greater than 0 bytes and under 15 MB.');
      return;
    }

    setIsUploadingCover(true);
    setCoverUploadProgress(15);

    const res = await uploadUserFileToSupabase({
      uid: currentUser?.id || 'admin',
      file,
      featureName: 'covers',
      itemId: editingCategory?.id || `category_${Date.now()}`,
      visibility: 'public',
      onProgress: percent => setCoverUploadProgress(percent)
    });

    setIsUploadingCover(false);

    if (!res.success || !res.signedUrl) {
      setCoverUploadError(res.error || 'Failed to upload category cover image. Please try again.');
      setCoverUploadProgress(0);
      return;
    }

    setFormImage(res.signedUrl);
    setFormCoverFileName(file.name);
    setCoverUploadProgress(100);
  };

  const handleCoverInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    await processCoverFileUpload(file);
  };

  const handleCoverDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingCover(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processCoverFileUpload(file);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingCover || isSavingCategory) return;

    if (!formName.trim()) {
      showNotice('error', 'Category name is required.');
      return;
    }

    setIsSavingCategory(true);
    try {
      if (editingCategory) {
        const res = await adminUpdateCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim(),
          image: formImage.trim() || editingCategory.image || DEFAULT_CATEGORY_COVER,
          display_order: Number(formDisplayOrder) || editingCategory.display_order,
          is_active: formIsActive
        });
        if (!res.success) {
          showNotice('error', res.error || 'Failed to update category.');
          return;
        }
        showNotice('success', `Updated official category "${formName.trim()}".`);
      } else {
        const res = await adminAddCategory({
          name: formName.trim(),
          description: formDescription.trim(),
          image: formImage.trim() || DEFAULT_CATEGORY_COVER,
          display_order: Number(formDisplayOrder) || categories.length + 1
        });
        if (!res.success) {
          showNotice('error', res.error || 'Failed to create category.');
          return;
        }
        showNotice('success', `Added official category "${formName.trim()}".`);
      }
      setShowAddModal(false);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory || isDeletingCategory) return;
    setIsDeletingCategory(true);
    const targetName = deletingCategory.name;
    const res = await adminDeleteCategory(deletingCategory.id);
    setIsDeletingCategory(false);

    if (!res.success) {
      showNotice('error', res.error || `Failed to delete category "${targetName}".`);
      return;
    }

    if (editingCategory?.id === deletingCategory.id) {
      setShowAddModal(false);
      setEditingCategory(null);
    }
    setDeletingCategory(null);
    showNotice('success', `Deleted official category "${targetName}" from ACOVON.`);
  };

  const handleMoveOrder = async (cat: CategoryRecord, direction: 'up' | 'down') => {
    const newOrder =
      direction === 'up' ? Math.max(1, cat.display_order - 1) : cat.display_order + 1;
    await adminUpdateCategory(cat.id, { display_order: newOrder });
  };

  const deletingCategoryPostCount = deletingCategory
    ? categoryUsageMap.get(deletingCategory.id) || 0
    : 0;

  return (
    <div className="bg-[#121216] border border-[#272730] rounded-3xl p-4 sm:p-6 space-y-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4af37] shrink-0" />
            <span>Official Categories &amp; ISO 3166-1 Countries Database</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Centralized taxonomy management across Feed, Explore, Creator Profiles, Creator Studio, and Post Publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSubTab('categories')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'categories'
                ? 'bg-[#d4af37] text-black'
                : 'bg-[#18181f] text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>Categories ({categories.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab('countries')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              subTab === 'countries'
                ? 'bg-[#d4af37] text-black'
                : 'bg-[#18181f] text-neutral-400 hover:text-white border border-white/10'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>ISO Countries ({countries.length})</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 1: OFFICIAL CATEGORIES                                    */}
      {/* ================================================================= */}
      {subTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catSearch}
                onChange={e => setCatSearch(e.target.value)}
                placeholder="Search official categories..."
                className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add Official Category</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left border-collapse whitespace-nowrap tabular-nums">
              <thead>
                <tr className="bg-[#18181f] text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10">
                  <th className="py-3.5 px-4">Order</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Posts Using</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 px-4 text-center text-neutral-400 text-xs">
                      No official categories match your filter. Click &ldquo;Add Official Category&rdquo; to create one.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map(cat => {
                    const postCount = categoryUsageMap.get(cat.id) || 0;
                    return (
                      <tr key={cat.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs text-neutral-400 w-6 tabular-nums">
                              #{cat.display_order}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(cat, 'up')}
                              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveOrder(cat, 'down')}
                              className="p-1 rounded hover:bg-white/10 text-neutral-400 hover:text-white cursor-pointer"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 min-w-[200px] whitespace-normal">
                          <div className="flex items-center gap-3">
                            {cat.image ? (
                              <img
                                src={cat.image}
                                alt={cat.name}
                                className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-[#1d1d26] border border-white/10 shrink-0 flex items-center justify-center text-[#d4af37]/60">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-white">{cat.name}</div>
                              {cat.description && (
                                <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs">
                                  {cat.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-neutral-400">{cat.slug}</td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-1 rounded-lg bg-white/5 text-xs font-bold text-neutral-200 tabular-nums">
                            {postCount} {postCount === 1 ? 'post' : 'posts'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              cat.is_active
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-400 border border-white/10'
                            }`}
                          >
                            {cat.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditModal(cat)}
                              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-neutral-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                adminUpdateCategory(cat.id, { is_active: !cat.is_active })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                                cat.is_active
                                  ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                                  : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                              }`}
                            >
                              {cat.is_active ? (
                                <>
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingCategory(cat)}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/25 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              title={`Delete ${cat.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: ISO 3166-1 COUNTRIES                                   */}
      {/* ================================================================= */}
      {subTab === 'countries' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={countrySearch}
                onChange={e => setCountrySearch(e.target.value)}
                placeholder="Search country by name or ISO code..."
                className="w-full bg-[#18181f] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#d4af37]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(['all', 'active', 'inactive'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setCountryStatusFilter(status)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    countryStatusFilter === status
                      ? 'bg-[#d4af37] text-black'
                      : 'bg-[#18181f] text-neutral-400 hover:text-white border border-white/10'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10">
            <table className="w-full text-left border-collapse whitespace-nowrap tabular-nums">
              <thead className="sticky top-0 z-10 bg-[#18181f]">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 border-b border-white/10">
                  <th className="py-3.5 px-4">Flag &amp; Country Name</th>
                  <th className="py-3.5 px-4">ISO 3166-1 Code</th>
                  <th className="py-3.5 px-4">Videos (Video Country)</th>
                  <th className="py-3.5 px-4">Creators (Creator Country)</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredCountries.map(country => {
                  const usage = countryUsageMap.get(country.id) || { videos: 0, creators: 0 };
                  return (
                    <tr key={country.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{country.flag}</span>
                          <span className="font-bold text-white">{country.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-[#fce7b0] font-bold">
                        {country.iso_code}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs font-bold text-neutral-300 tabular-nums">
                          <Video className="w-3.5 h-3.5 text-[#d4af37]" />
                          <span>{usage.videos}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 text-xs font-bold text-neutral-300 tabular-nums">
                          <Users className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{usage.creators}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            country.is_active
                              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                              : 'bg-neutral-800 text-neutral-400 border border-white/10'
                          }`}
                        >
                          {country.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => adminToggleCountryActive(country.id, !country.is_active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            country.is_active
                              ? 'bg-amber-500/15 text-amber-300 hover:bg-amber-500/25'
                              : 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25'
                          }`}
                        >
                          {country.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
          <div className="bg-[#14141a] border border-white/15 rounded-3xl max-w-lg w-full p-5 sm:p-6 max-h-[92dvh] overflow-y-auto acovon-modal-panel space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-base font-bold text-white">
                {editingCategory
                  ? `Edit Category: ${editingCategory.name}`
                  : 'Add Official Category'}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g., Cinematic Travel & Vlogs"
                  className="w-full bg-[#18181f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Describe the content belonging to this official category..."
                  className="w-full bg-[#18181f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              {/* Direct Cover Image File Upload (No URL Input Required) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <label className="block text-xs font-bold uppercase text-neutral-400">
                    Category Cover Image
                  </label>
                  <div className="flex items-center gap-2">
                    {formImage && formImage !== DEFAULT_CATEGORY_COVER && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormImage(DEFAULT_CATEGORY_COVER);
                          setFormCoverFileName(null);
                          setCoverUploadError(null);
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-white cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reset Default</span>
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isUploadingCover}
                      onClick={() => coverFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#d4af37]/15 hover:bg-[#d4af37]/25 border border-[#d4af37]/30 text-[#fce7b0] text-[11px] font-bold cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{formCoverFileName ? 'Replace Image' : 'Upload Cover'}</span>
                    </button>
                  </div>
                </div>

                <input
                  ref={coverFileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleCoverInputChange}
                  className="hidden"
                />

                <div
                  onDragOver={e => {
                    e.preventDefault();
                    setIsDraggingCover(true);
                  }}
                  onDragLeave={() => setIsDraggingCover(false)}
                  onDrop={handleCoverDrop}
                  onClick={() => {
                    if (!isUploadingCover) coverFileInputRef.current?.click();
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ' ') && !isUploadingCover) {
                      e.preventDefault();
                      coverFileInputRef.current?.click();
                    }
                  }}
                  className={`relative rounded-2xl overflow-hidden border transition-all cursor-pointer group ${
                    isDraggingCover
                      ? 'border-[#d4af37] ring-2 ring-[#d4af37]/30 bg-[#d4af37]/10'
                      : 'border-white/10 hover:border-[#d4af37]/50 bg-[#18181f]'
                  }`}
                >
                  <div className="relative h-36 sm:h-40 w-full overflow-hidden bg-gradient-to-br from-[#1b1811] via-[#131318] to-black/60">
                    {formImage ? (
                      <img
                        src={formImage}
                        alt={formName || 'Category cover preview'}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d4af37]/25">
                        <ImageIcon className="w-12 h-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />

                    {/* Uploading Overlay */}
                    {isUploadingCover && (
                      <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center gap-2 px-4">
                        <Loader2 className="w-6 h-6 text-[#d4af37] animate-spin" />
                        <span className="text-xs font-bold text-white">
                          Uploading Cover... {coverUploadProgress}%
                        </span>
                        <div className="w-40 h-1.5 rounded-full bg-white/15 overflow-hidden">
                          <div
                            className="h-full bg-[#d4af37] transition-all duration-200"
                            style={{ width: `${Math.min(100, Math.max(10, coverUploadProgress))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Preview Caption & Upload Trigger */}
                    {!isUploadingCover && (
                      <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[#fce7b0]">
                            <ImageIcon className="w-3 h-3 shrink-0" />
                            <span>
                              {formCoverFileName
                                ? `Uploaded: ${formCoverFileName}`
                                : 'Cover Preview (Tap or drop image)'}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-white truncate mt-0.5">
                            {formName.trim() || 'Official Category Card'}
                          </div>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/75 border border-white/20 text-white text-[11px] font-semibold group-hover:bg-[#d4af37] group-hover:text-black group-hover:border-[#d4af37] transition-colors">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Choose File</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {coverUploadError && (
                  <p className="mt-1.5 text-[11px] font-semibold text-rose-400">
                    {coverUploadError}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  Upload JPG, PNG, WEBP, or GIF directly from your device (max 15 MB).
                </p>
              </div>

              <div className="grid grid-cols-1 xs:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formDisplayOrder}
                    onChange={e => setFormDisplayOrder(Number(e.target.value))}
                    className="w-full bg-[#18181f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
                    Status
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 cursor-pointer ${
                      formIsActive
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                        : 'bg-[#18181f] border-white/10 text-neutral-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>{formIsActive ? 'Active (Visible)' : 'Inactive (Hidden)'}</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
                <div>
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => setDeletingCategory(editingCategory)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Category</span>
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingCover || isSavingCategory}
                    className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {(isUploadingCover || isSavingCategory) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>
                      {isUploadingCover
                        ? 'Uploading Cover...'
                        : isSavingCategory
                        ? 'Saving...'
                        : editingCategory
                        ? 'Save Changes'
                        : 'Create Category'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Official Category Confirmation Modal */}
      {deletingCategory && (
        <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#14141a] border border-rose-500/30 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl acovon-modal-panel">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Delete Official Category</h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    This removes the category across ACOVON.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setDeletingCategory(null)}
                className="p-2 rounded-xl bg-white/5 text-neutral-400 hover:text-white cursor-pointer disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#18181f] border border-white/10">
              {deletingCategory.image ? (
                <img
                  src={deletingCategory.image}
                  alt={deletingCategory.name}
                  className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-[#1d1d26] border border-white/10 shrink-0 flex items-center justify-center text-[#d4af37]/60">
                  <ImageIcon className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{deletingCategory.name}</div>
                <div className="text-[11px] font-mono text-neutral-400 truncate">
                  /{deletingCategory.slug}
                </div>
              </div>
            </div>

            {deletingCategoryPostCount > 0 ? (
              <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>{deletingCategoryPostCount}</strong>{' '}
                {deletingCategoryPostCount === 1 ? 'post currently references' : 'posts currently reference'}{' '}
                this category. Deleting it will remove the tag from Feed, Explore filters, and Creator Studio pickers.
              </div>
            ) : (
              <p className="text-xs text-neutral-300 leading-relaxed">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white">&ldquo;{deletingCategory.name}&rdquo;</strong> from the official categories list?
              </p>
            )}

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={() => setDeletingCategory(null)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingCategory}
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {isDeletingCategory ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isDeletingCategory ? 'Deleting...' : 'Confirm Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
