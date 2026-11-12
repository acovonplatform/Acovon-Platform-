import React, { useState, useMemo } from 'react';
import {
  Grid,
  Globe,
  Plus,
  Edit3,
  Check,
  X,
  Search,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Video,
  Users,
  Sparkles
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CategoryRecord } from '../../types';
import {
  matchesCategoryIdentifier,
  matchesCountryIdentifier
} from '../../data/globalTaxonomy';

export const AdminCategoriesCountriesSection: React.FC = () => {
  const {
    categories,
    countries,
    posts,
    creators,
    adminAddCategory,
    adminUpdateCategory,
    adminToggleCountryActive
  } = useApp();

  const [subTab, setSubTab] = useState<'categories' | 'countries'>('categories');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const showNotice = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Category Management State
  const [catSearch, setCatSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRecord | null>(null);

  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(categories.length + 1);
  const [formIsActive, setFormIsActive] = useState(true);

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

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName('');
    setFormDescription('');
    setFormImage('/src/assets/images/creator_cover_luxury_1793476684350.jpg');
    setFormDisplayOrder(categories.length + 1);
    setFormIsActive(true);
    setShowAddModal(true);
  };

  const openEditModal = (cat: CategoryRecord) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDescription(cat.description || '');
    setFormImage(cat.image);
    setFormDisplayOrder(cat.display_order);
    setFormIsActive(cat.is_active);
    setShowAddModal(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showNotice('error', 'Category name is required.');
      return;
    }

    if (editingCategory) {
      const res = await adminUpdateCategory(editingCategory.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        image: formImage.trim() || editingCategory.image,
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
        image:
          formImage.trim() || '/src/assets/images/creator_cover_luxury_1793476684350.jpg',
        display_order: Number(formDisplayOrder) || categories.length + 1
      });
      if (!res.success) {
        showNotice('error', res.error || 'Failed to create category.');
        return;
      }
      showNotice('success', `Added official category "${formName.trim()}".`);
    }
    setShowAddModal(false);
  };

  const handleMoveOrder = async (cat: CategoryRecord, direction: 'up' | 'down') => {
    const newOrder =
      direction === 'up' ? Math.max(1, cat.display_order - 1) : cat.display_order + 1;
    await adminUpdateCategory(cat.id, { display_order: newOrder });
  };

  return (
    <div className="bg-[#121216] border border-[#272730] rounded-3xl p-6 space-y-6">
      {/* Header & Mode Switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <span>Official Categories &amp; ISO 3166-1 Countries Database</span>
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Centralized taxonomy management across Feed, Explore, Creator Profiles, Creator Studio, and Post Publishing.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Official Category</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-left border-collapse">
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
                {filteredCategories.map(cat => {
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
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-10 h-10 rounded-xl object-cover border border-white/10 shrink-0"
                          />
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
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

            <div className="flex items-center gap-2">
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

          <div className="max-h-[520px] overflow-y-auto rounded-2xl border border-white/10">
            <table className="w-full text-left border-collapse">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#14141a] border border-white/15 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
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

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-400 mb-1.5">
                  Cover Visual URL
                </label>
                <input
                  type="text"
                  value={formImage}
                  onChange={e => setFormImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-[#18181f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#d4af37] hover:bg-[#e5c07b] text-black text-xs font-bold cursor-pointer"
                >
                  {editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
