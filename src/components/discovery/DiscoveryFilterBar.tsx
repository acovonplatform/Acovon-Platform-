import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { CategoryRecord, CountryRecord } from '../../types';
import {
  Search,
  Filter,
  Globe,
  Tag,
  UserCheck,
  Check,
  X,
  ChevronDown,
  RotateCcw,
  Film
} from 'lucide-react';

// ============================================================================
// 1. Reusable Single Country Selector (Used for Video Country & Creator Country)
// ============================================================================
interface SearchableCountrySelectorProps {
  value: string;
  onChange: (countryName: string, countryRecord: CountryRecord) => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
}

export const SearchableCountrySelector: React.FC<SearchableCountrySelectorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Search country by name or ISO code (e.g. France, UAE, Japan)...',
  helperText,
  required = false,
  className = ''
}) => {
  const { activeCountries, getCountryFlagAndName } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCountryMeta = useMemo(
    () => getCountryFlagAndName(value),
    [value, getCountryFlagAndName]
  );

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCountries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeCountries;
    return activeCountries.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.iso_code.toLowerCase().includes(q) ||
        (c.region && c.region.toLowerCase().includes(q)) ||
        (c.aliases && c.aliases.some(a => a.toLowerCase().includes(q)))
    );
  }, [activeCountries, searchQuery]);

  return (
    <div ref={containerRef} className={`relative space-y-1.5 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-stone-800 dark:text-neutral-200 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#d4af37]" />
            <span>{label}</span>
            {required && <span className="text-amber-400">*</span>}
          </label>
          {selectedCountryMeta && (
            <span className="text-[11px] font-medium text-[#fce7b0] flex items-center gap-1">
              <span>{selectedCountryMeta.flag}</span>
              <span>{selectedCountryMeta.name}</span>
              <span className="text-neutral-500 font-mono">({selectedCountryMeta.iso_code})</span>
            </span>
          )}
        </div>
      )}

      {helperText && (
        <p className="text-[11px] text-stone-500 dark:text-neutral-400">{helperText}</p>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className="w-full bg-white dark:bg-[#18181c] border border-stone-300 dark:border-[#27272a] hover:border-[#d4af37]/60 rounded-xl px-3.5 py-2.5 text-xs text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
      >
        {selectedCountryMeta ? (
          <span className="flex items-center gap-2 text-stone-900 dark:text-white font-medium truncate">
            <span className="text-base leading-none">{selectedCountryMeta.flag}</span>
            <span>{selectedCountryMeta.name}</span>
            <span className="text-[10px] font-mono text-stone-500 dark:text-neutral-400">
              · {selectedCountryMeta.iso_code}
            </span>
          </span>
        ) : (
          <span className="text-stone-400 dark:text-neutral-500 truncate">
            Select a country...
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-[#d4af37]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#141418] border border-stone-300 dark:border-[#2e2e38] rounded-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-stone-100 dark:bg-[#1c1c22] border border-stone-300 dark:border-[#2e2e38] rounded-xl pl-8 pr-8 py-1.5 text-xs text-stone-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-52 overflow-y-auto divide-y divide-stone-100 dark:divide-[#1e1e26] pr-0.5">
            {filteredCountries.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500">
                No matching countries found for &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              filteredCountries.map(country => {
                const isSelected =
                  selectedCountryMeta?.id === country.id ||
                  value.toLowerCase() === country.name.toLowerCase();
                return (
                  <button
                    key={country.id}
                    type="button"
                    onClick={() => {
                      onChange(country.name, country);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#d4af37]/20 text-stone-900 dark:text-[#fce7b0] font-semibold'
                        : 'text-stone-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1e1e26]'
                    }`}
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <span className="text-base leading-none shrink-0">{country.flag}</span>
                      <span className="truncate">{country.name}</span>
                      {country.aliases && country.aliases.length > 0 && (
                        <span className="text-[10px] text-neutral-500 truncate hidden sm:inline">
                          ({country.aliases[0]})
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-neutral-500">
                        {country.iso_code}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. Multi-Select Searchable Dropdown (Used inside DiscoveryFilterBar)
// ============================================================================
interface MultiSelectDropdownProps {
  label: string;
  allLabel: string;
  icon: React.ReactNode;
  selectedValues: string[];
  onToggleValue: (val: string) => void;
  onClearValues: () => void;
  options: Array<{
    value: string;
    label: string;
    flag?: string;
    subLabel?: string;
    searchKeywords?: string[];
  }>;
  searchPlaceholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  label,
  allLabel,
  icon,
  selectedValues,
  onToggleValue,
  onClearValues,
  options,
  searchPlaceholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      opt =>
        opt.label.toLowerCase().includes(q) ||
        opt.value.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (opt.searchKeywords && opt.searchKeywords.some(k => k.toLowerCase().includes(q)))
    );
  }, [options, search]);

  const buttonSummary = useMemo(() => {
    if (selectedValues.length === 0) return allLabel;
    if (selectedValues.length === 1) {
      const match = options.find(o => o.value === selectedValues[0]);
      return match ? `${match.flag ? `${match.flag} ` : ''}${match.label}` : selectedValues[0];
    }
    return `${selectedValues.length} Selected`;
  }, [selectedValues, options, allLabel]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        className={`w-full sm:w-auto min-w-[175px] px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
          selectedValues.length > 0
            ? 'bg-amber-50 dark:bg-[#1f1c12] border-[#d4af37] text-stone-900 dark:text-[#fce7b0] font-semibold'
            : 'bg-white dark:bg-[#141418] border-stone-300 dark:border-[#27272a] text-stone-700 dark:text-neutral-300 hover:border-stone-400 dark:hover:border-[#3a3a44]'
        }`}
      >
        <span className="flex items-center gap-1.5 truncate">
          {icon}
          <span className="text-stone-400 dark:text-neutral-400 font-normal">{label}:</span>
          <span className="truncate">{buttonSummary}</span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${
            isOpen ? 'rotate-180 text-[#d4af37]' : 'text-neutral-400'
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 z-50 bg-white dark:bg-[#141418] border border-stone-300 dark:border-[#2e2e38] rounded-2xl shadow-2xl p-2.5 space-y-2 animate-in fade-in zoom-in-95">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full bg-stone-100 dark:bg-[#1c1c22] border border-stone-300 dark:border-[#2e2e38] rounded-xl pl-8 pr-7 py-1.5 text-xs text-stone-900 dark:text-white placeholder-neutral-500 focus:outline-none focus:border-[#d4af37]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between px-1 text-[11px]">
            <button
              type="button"
              onClick={() => onClearValues()}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                selectedValues.length === 0
                  ? 'bg-[#d4af37]/20 text-stone-900 dark:text-[#fce7b0] font-semibold'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              {allLabel}
            </button>
            {selectedValues.length > 0 && (
              <button
                type="button"
                onClick={() => onClearValues()}
                className="text-amber-500 dark:text-[#d4af37] hover:underline cursor-pointer"
              >
                Clear ({selectedValues.length})
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto divide-y divide-stone-100 dark:divide-[#1e1e26] pr-0.5">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-neutral-500">
                No matches for &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onToggleValue(opt.value)}
                    className={`w-full px-2.5 py-2 text-left text-xs flex items-center justify-between gap-2 rounded-lg transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#d4af37]/20 text-stone-900 dark:text-[#fce7b0] font-semibold'
                        : 'text-stone-700 dark:text-neutral-300 hover:bg-stone-100 dark:hover:bg-[#1e1e26]'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      {opt.flag && <span className="text-base leading-none shrink-0">{opt.flag}</span>}
                      <span className="truncate">{opt.label}</span>
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {opt.subLabel && (
                        <span className="text-[10px] font-mono text-neutral-500">
                          {opt.subLabel}
                        </span>
                      )}
                      <span
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          isSelected
                            ? 'bg-[#d4af37] border-[#d4af37] text-black'
                            : 'border-neutral-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. Combined Category, Video Country & Creator Country Discovery Filter Bar
// ============================================================================
export interface DiscoveryFilterState {
  categories: string[];
  videoCountries: string[];
  creatorCountries: string[];
}

interface DiscoveryFilterBarProps {
  appliedFilters: DiscoveryFilterState;
  onApplyFilters: (next: DiscoveryFilterState) => void;
  showVideoCountryFilter?: boolean;
  showCreatorCountryFilter?: boolean;
  showCategoryFilter?: boolean;
  totalMatchingCount?: number;
  resultUnitLabel?: string;
  onNavigateToCategoriesHub?: () => void;
}

export const DiscoveryFilterBar: React.FC<DiscoveryFilterBarProps> = ({
  appliedFilters,
  onApplyFilters,
  showVideoCountryFilter = true,
  showCreatorCountryFilter = true,
  showCategoryFilter = true,
  totalMatchingCount,
  resultUnitLabel = 'results',
  onNavigateToCategoriesHub
}) => {
  const { activeCategories, activeCountries, getCountryFlagAndName } = useApp();

  // Draft state supports staging multiple selections and clicking "Apply Filters" (as well as immediate clear)
  const [draftCategories, setDraftCategories] = useState<string[]>(appliedFilters.categories);
  const [draftVideoCountries, setDraftVideoCountries] = useState<string[]>(
    appliedFilters.videoCountries
  );
  const [draftCreatorCountries, setDraftCreatorCountries] = useState<string[]>(
    appliedFilters.creatorCountries
  );
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync draft when parent appliedFilters change externally
  useEffect(() => {
    setDraftCategories(appliedFilters.categories);
    setDraftVideoCountries(appliedFilters.videoCountries);
    setDraftCreatorCountries(appliedFilters.creatorCountries);
  }, [
    appliedFilters.categories,
    appliedFilters.videoCountries,
    appliedFilters.creatorCountries
  ]);

  const categoryOptions = useMemo(
    () =>
      activeCategories.map((cat: CategoryRecord) => ({
        value: cat.name,
        label: cat.name,
        searchKeywords: [cat.slug, cat.description]
      })),
    [activeCategories]
  );

  const countryOptions = useMemo(
    () =>
      activeCountries.map((c: CountryRecord) => ({
        value: c.name,
        label: c.name,
        flag: c.flag,
        subLabel: c.iso_code,
        searchKeywords: [c.iso_code, ...(c.aliases || []), c.region || '']
      })),
    [activeCountries]
  );

  const toggleDraftItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    val: string
  ) => {
    const next = list.includes(val) ? list.filter(x => x !== val) : [...list, val];
    setList(next);
  };

  const hasUnappliedChanges =
    JSON.stringify(draftCategories) !== JSON.stringify(appliedFilters.categories) ||
    JSON.stringify(draftVideoCountries) !== JSON.stringify(appliedFilters.videoCountries) ||
    JSON.stringify(draftCreatorCountries) !== JSON.stringify(appliedFilters.creatorCountries);

  const totalDraftCount =
    draftCategories.length + draftVideoCountries.length + draftCreatorCountries.length;

  const totalAppliedCount =
    appliedFilters.categories.length +
    appliedFilters.videoCountries.length +
    appliedFilters.creatorCountries.length;

  const handleApply = () => {
    onApplyFilters({
      categories: draftCategories,
      videoCountries: draftVideoCountries,
      creatorCountries: draftCreatorCountries
    });
    setMobileFilterOpen(false);
  };

  const handleClearAll = () => {
    setDraftCategories([]);
    setDraftVideoCountries([]);
    setDraftCreatorCountries([]);
    onApplyFilters({
      categories: [],
      videoCountries: [],
      creatorCountries: []
    });
  };

  const removeAppliedFilter = (
    type: 'category' | 'videoCountry' | 'creatorCountry',
    val: string
  ) => {
    const next: DiscoveryFilterState = {
      categories:
        type === 'category'
          ? appliedFilters.categories.filter(x => x !== val)
          : appliedFilters.categories,
      videoCountries:
        type === 'videoCountry'
          ? appliedFilters.videoCountries.filter(x => x !== val)
          : appliedFilters.videoCountries,
      creatorCountries:
        type === 'creatorCountry'
          ? appliedFilters.creatorCountries.filter(x => x !== val)
          : appliedFilters.creatorCountries
    };
    setDraftCategories(next.categories);
    setDraftVideoCountries(next.videoCountries);
    setDraftCreatorCountries(next.creatorCountries);
    onApplyFilters(next);
  };

  return (
    <div className="bg-white dark:bg-[#121216] border border-stone-200 dark:border-[#26262b] rounded-2xl p-3 sm:p-4 space-y-3 mb-5">
      {/* Mobile Filter Toggle Header */}
      <div className="flex items-center justify-between gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(prev => !prev)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-stone-100 dark:bg-[#18181f] border border-stone-300 dark:border-[#2e2e38] text-xs font-semibold text-stone-900 dark:text-white cursor-pointer"
        >
          <Filter className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Discovery Filters</span>
          {totalAppliedCount > 0 && (
            <span className="font-mono text-[#d4af37]">({totalAppliedCount})</span>
          )}
        </button>

        <div className="flex items-center gap-2">
          {totalAppliedCount > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Clear All
            </button>
          )}
          {onNavigateToCategoriesHub && (
            <button
              type="button"
              onClick={onNavigateToCategoriesHub}
              className="text-xs font-semibold text-[#d4af37] hover:underline cursor-pointer"
            >
              Browse All Categories
            </button>
          )}
        </div>
      </div>

      {/* Filter Controls Row (Always visible on desktop, collapsible on mobile) */}
      <div
        className={`${
          mobileFilterOpen ? 'flex' : 'hidden sm:flex'
        } flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-2.5`}
      >
        <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
          {showCategoryFilter && (
            <MultiSelectDropdown
              label="Category"
              allLabel="All Categories"
              icon={<Tag className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
              selectedValues={draftCategories}
              onToggleValue={val => toggleDraftItem(draftCategories, setDraftCategories, val)}
              onClearValues={() => setDraftCategories([])}
              options={categoryOptions}
              searchPlaceholder="Search categories (e.g. Amateur, Fashion)..."
            />
          )}

          {showVideoCountryFilter && (
            <MultiSelectDropdown
              label="Video Country"
              allLabel="All Countries"
              icon={<Film className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
              selectedValues={draftVideoCountries}
              onToggleValue={val =>
                toggleDraftItem(draftVideoCountries, setDraftVideoCountries, val)
              }
              onClearValues={() => setDraftVideoCountries([])}
              options={countryOptions}
              searchPlaceholder="Search video country (e.g. France, Japan)..."
            />
          )}

          {showCreatorCountryFilter && (
            <MultiSelectDropdown
              label="Creator Country"
              allLabel="All Creator Countries"
              icon={<UserCheck className="w-3.5 h-3.5 text-[#d4af37] shrink-0" />}
              selectedValues={draftCreatorCountries}
              onToggleValue={val =>
                toggleDraftItem(draftCreatorCountries, setDraftCreatorCountries, val)
              }
              onClearValues={() => setDraftCreatorCountries([])}
              options={countryOptions}
              searchPlaceholder="Search creator country (e.g. UAE, USA)..."
            />
          )}
        </div>

        {/* Apply Filters & Clear All Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleApply}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              hasUnappliedChanges
                ? 'bg-[#d4af37] hover:bg-[#e5c07b] text-black shadow-md shadow-[#d4af37]/20'
                : 'bg-stone-200 dark:bg-[#1e1e26] hover:bg-[#d4af37] hover:text-black text-stone-800 dark:text-neutral-200'
            }`}
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Filters</span>
          </button>

          {(totalAppliedCount > 0 || totalDraftCount > 0) && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-2 rounded-xl bg-stone-100 dark:bg-[#18181c] hover:bg-stone-200 dark:hover:bg-[#24242c] border border-stone-300 dark:border-[#2e2e38] text-xs font-medium text-stone-600 dark:text-neutral-300 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Selected Filter Indicators & Matching Result Summary */}
      {(totalAppliedCount > 0 || totalMatchingCount !== undefined) && (
        <div className="pt-2 border-t border-stone-200 dark:border-[#222228] flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            {totalAppliedCount === 0 ? (
              <span className="text-[11px] text-stone-500 dark:text-neutral-400">
                Showing all categories &amp; countries
              </span>
            ) : (
              <>
                <span className="text-[11px] text-stone-500 dark:text-neutral-400 mr-1">
                  Active Filters:
                </span>
                {appliedFilters.categories.map(cat => (
                  <button
                    key={`cat_${cat}`}
                    type="button"
                    onClick={() => removeAppliedFilter('category', cat)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18181f] border border-[#d4af37]/40 text-[#fce7b0] text-[11px] font-medium hover:border-[#d4af37] cursor-pointer"
                  >
                    <span>Category: {cat}</span>
                    <X className="w-3 h-3 text-neutral-400 hover:text-white" />
                  </button>
                ))}
                {appliedFilters.videoCountries.map(vc => {
                  const meta = getCountryFlagAndName(vc);
                  return (
                    <button
                      key={`vc_${vc}`}
                      type="button"
                      onClick={() => removeAppliedFilter('videoCountry', vc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18181f] border border-sky-500/40 text-sky-200 text-[11px] font-medium hover:border-sky-400 cursor-pointer"
                    >
                      <span>
                        Video Country: {meta ? `${meta.flag} ${meta.name}` : vc}
                      </span>
                      <X className="w-3 h-3 text-neutral-400 hover:text-white" />
                    </button>
                  );
                })}
                {appliedFilters.creatorCountries.map(cc => {
                  const meta = getCountryFlagAndName(cc);
                  return (
                    <button
                      key={`cc_${cc}`}
                      type="button"
                      onClick={() => removeAppliedFilter('creatorCountry', cc)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#18181f] border border-emerald-500/40 text-emerald-200 text-[11px] font-medium hover:border-emerald-400 cursor-pointer"
                    >
                      <span>
                        Creator Country: {meta ? `${meta.flag} ${meta.name}` : cc}
                      </span>
                      <X className="w-3 h-3 text-neutral-400 hover:text-white" />
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {totalMatchingCount !== undefined && (
            <span className="text-[11px] font-mono tabular-nums text-stone-500 dark:text-neutral-400">
              {totalMatchingCount} {resultUnitLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
