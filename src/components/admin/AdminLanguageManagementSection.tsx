import React, { useState, useMemo } from 'react';
import {
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Send,
  Edit3,
  Check,
  X,
  ArrowRightLeft,
  ShieldCheck,
  Languages,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguageCode, TranslationKeyRecord } from '../../data/i18nData';

export const AdminLanguageManagementSection: React.FC = () => {
  const {
    supportedLanguages,
    translationRecords,
    activeLanguageCode,
    languagePreferenceMode,
    detectedDeviceLanguage: detectedBrowserLanguage,
    setUserLanguagePreference: setLanguagePreference,
    adminToggleLanguageEnabled,
    adminUpdateTranslationEntry,
    adminAddTranslationKey,
    adminPublishTranslations,
    t,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'languages' | 'dictionary' | 'add_key'>('languages');
  const [languageSearch, setLanguageSearch] = useState('');
  const [dictSearch, setDictSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedInspectLang, setSelectedInspectLang] = useState<SupportedLanguageCode>('ar');
  const [filterMissingOnly, setFilterMissingOnly] = useState(false);

  // Inline editing state
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Add key state
  const [newKeyId, setNewKeyId] = useState('');
  const [newKeyCategory, setNewKeyCategory] = useState<TranslationKeyRecord['category']>('common');
  const [newKeyEnglishText, setNewKeyEnglishText] = useState('');
  const [newKeyArabicText, setNewKeyArabicText] = useState('');
  const [newKeyFrenchText, setNewKeyFrenchText] = useState('');
  const [newKeySpanishText, setNewKeySpanishText] = useState('');

  const enabledLanguagesCount = useMemo(
    () => supportedLanguages.filter(l => l.enabled).length,
    [supportedLanguages]
  );

  const rtlLanguagesCount = useMemo(
    () => supportedLanguages.filter(l => l.dir === 'rtl' && l.enabled).length,
    [supportedLanguages]
  );

  const missingTranslationsCount = useMemo(() => {
    let missing = 0;
    translationRecords.forEach(record => {
      supportedLanguages.forEach(lang => {
        const val = record.translations[lang.code];
        if (!val || !val.trim()) {
          missing += 1;
        }
      });
    });
    return missing;
  }, [translationRecords, supportedLanguages]);

  const filteredLanguages = useMemo(() => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return supportedLanguages;
    return supportedLanguages.filter(
      l =>
        l.nativeName.toLowerCase().includes(q) ||
        l.englishName.toLowerCase().includes(q) ||
        l.code.toLowerCase().includes(q) ||
        l.regionLabel.toLowerCase().includes(q)
    );
  }, [supportedLanguages, languageSearch]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    translationRecords.forEach(r => set.add(r.category));
    return ['ALL', ...Array.from(set)];
  }, [translationRecords]);

  const filteredDictionary = useMemo(() => {
    const q = dictSearch.trim().toLowerCase();
    return translationRecords.filter(record => {
      if (selectedCategory !== 'ALL' && record.category !== selectedCategory) return false;
      const targetVal = record.translations[selectedInspectLang] || '';
      if (filterMissingOnly && targetVal.trim().length > 0) {
        return false;
      }
      if (!q) return true;
      return (
        record.key.toLowerCase().includes(q) ||
        record.englishText.toLowerCase().includes(q) ||
        targetVal.toLowerCase().includes(q)
      );
    });
  }, [translationRecords, dictSearch, selectedCategory, selectedInspectLang, filterMissingOnly]);

  const handleStartEdit = (key: string, currentVal: string) => {
    setEditingKey(key);
    setEditingValue(currentVal);
  };

  const handleSaveEdit = (key: string) => {
    adminUpdateTranslationEntry(key, selectedInspectLang, editingValue);
    setEditingKey(null);
    setEditingValue('');
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyId.trim() || !newKeyEnglishText.trim()) return;
    const partialTranslations: Partial<Record<SupportedLanguageCode, string>> = {
      en: newKeyEnglishText.trim(),
    };
    if (newKeyArabicText.trim()) partialTranslations.ar = newKeyArabicText.trim();
    if (newKeyFrenchText.trim()) partialTranslations.fr = newKeyFrenchText.trim();
    if (newKeySpanishText.trim()) partialTranslations.es = newKeySpanishText.trim();

    adminAddTranslationKey({
      key: newKeyId.trim(),
      category: newKeyCategory,
      englishText: newKeyEnglishText.trim(),
      initialTranslations: partialTranslations,
    });
    setNewKeyId('');
    setNewKeyEnglishText('');
    setNewKeyArabicText('');
    setNewKeyFrenchText('');
    setNewKeySpanishText('');
    setActiveSubTab('dictionary');
  };

  const selectedLangMeta = supportedLanguages.find(l => l.code === selectedInspectLang);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-start sm:items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white flex flex-wrap items-center gap-2">
                  <span>{t('admin.languageManagement', 'Global Language & Translation Studio')}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                    19 Locales Active
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Manage supported platform languages, automatic browser detection, RTL layout engines (Arabic & Urdu), and centralized translation dictionaries.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => adminPublishTranslations()}
              className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-violet-600/20 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{t('admin.publishTranslations', 'Publish Translation Updates')}</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Strip */}
        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-zinc-800/80 tabular-nums">
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Supported Languages</span>
              <Languages className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1" dir="ltr">
              {enabledLanguagesCount} / {supportedLanguages.length}
            </div>
            <div className="text-[11px] text-emerald-400 mt-0.5">
              English (en) locked as fallback
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>RTL Script Engines</span>
              <ArrowRightLeft className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1" dir="ltr">
              {rtlLanguagesCount} Active
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              العربية (ar) & اردو (ur)
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Dictionary Keys</span>
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white mt-1" dir="ltr">
              {translationRecords.length} Keys
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              {missingTranslationsCount === 0
                ? '100% Fallback Coverage'
                : `${missingTranslationsCount} entries using EN fallback`}
            </div>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5">
            <div className="text-xs text-zinc-400 flex items-center justify-between">
              <span>Current Session Locale</span>
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-white mt-1 truncate">
              {supportedLanguages.find(l => l.code === activeLanguageCode)?.nativeName} ({activeLanguageCode})
            </div>
            <div className="text-[11px] text-zinc-400 mt-0.5">
              Mode: <span className="text-zinc-200 capitalize">{languagePreferenceMode}</span> (Device: {detectedBrowserLanguage.matchedLanguageCode})
            </div>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 rounded-xl p-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab('languages')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeSubTab === 'languages'
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            1. Supported Languages ({supportedLanguages.length})
          </button>
          <button
            onClick={() => setActiveSubTab('dictionary')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeSubTab === 'dictionary'
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            2. Translation Dictionary ({translationRecords.length})
          </button>
          <button
            onClick={() => setActiveSubTab('add_key')}
            className={`px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubTab === 'add_key'
                ? 'bg-violet-600 text-white shadow'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>3. Add Translation Key</span>
          </button>
        </div>

        {/* Quick Live Preview Switcher */}
        <div className="flex flex-wrap items-center gap-2 px-2 w-full sm:w-auto">
          <span className="text-xs text-zinc-400">Live Preview Language:</span>
          <select
            value={activeLanguageCode}
            onChange={e => setLanguagePreference('manual', e.target.value as SupportedLanguageCode)}
            className="w-full sm:w-auto max-w-full min-w-0 bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500"
          >
            {supportedLanguages
              .filter(l => l.enabled)
              .map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} — {lang.englishName} ({lang.code})
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* TAB 1: SUPPORTED LANGUAGES */}
      {activeSubTab === 'languages' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Platform Languages & Regional Configuration</h3>
              <p className="text-xs text-zinc-400">
                Enable or disable languages for automatic browser detection and user profile selection. Disabled languages safely fall back to English.
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={languageSearch}
                onChange={e => setLanguageSearch(e.target.value)}
                placeholder="Search language or ISO code..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredLanguages.map(lang => {
              const isCurrentActive = activeLanguageCode === lang.code;
              const isEnglish = lang.code === 'en';
              const translatedCount = translationRecords.filter(
                r => r.translations[lang.code] && r.translations[lang.code].trim().length > 0
              ).length;
              const coveragePercent =
                translationRecords.length > 0
                  ? Math.round((translatedCount / translationRecords.length) * 100)
                  : 100;

              return (
                <div
                  key={lang.code}
                  className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
                    lang.enabled
                      ? isCurrentActive
                        ? 'bg-violet-950/25 border-violet-500/50'
                        : 'bg-zinc-950/60 border-zinc-800'
                      : 'bg-zinc-950/30 border-zinc-800/50 opacity-65'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-white" data-no-translate="true">
                          {lang.nativeName}
                        </span>
                        <span
                          className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300"
                          dir="ltr"
                          data-no-translate="true"
                        >
                          {lang.code}
                        </span>
                        {lang.dir === 'rtl' && (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            RTL
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400 mt-0.5">
                        {lang.englishName} • {lang.regionLabel}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {lang.enabled ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" />
                          Enabled
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                          Disabled
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Coverage Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Dictionary Coverage</span>
                      <span className="text-zinc-200 font-semibold" dir="ltr">
                        {coveragePercent}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden" dir="ltr">
                      <div
                        className="h-full bg-violet-500 rounded-full"
                        style={{ width: `${coveragePercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-800/70">
                    <button
                      onClick={() => {
                        setSelectedInspectLang(lang.code);
                        setActiveSubTab('dictionary');
                      }}
                      className="text-xs text-violet-400 hover:text-violet-300 font-medium cursor-pointer"
                    >
                      Inspect Translations →
                    </button>

                    <div className="flex items-center gap-2">
                      {lang.enabled && !isCurrentActive && (
                        <button
                          onClick={() => setLanguagePreference('manual', lang.code)}
                          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium cursor-pointer"
                        >
                          Preview UI
                        </button>
                      )}
                      {isEnglish ? (
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          Default Fallback
                        </span>
                      ) : (
                        <button
                          onClick={() => adminToggleLanguageEnabled(lang.code)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            lang.enabled
                              ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {lang.enabled ? 'Disable' : 'Enable'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: TRANSLATION DICTIONARY MANAGER */}
      {activeSubTab === 'dictionary' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
              <div className="w-full sm:w-auto min-w-0">
                <label className="block text-[11px] text-zinc-400 mb-1">Target Language to Edit</label>
                <select
                  value={selectedInspectLang}
                  onChange={e => setSelectedInspectLang(e.target.value as SupportedLanguageCode)}
                  className="w-full sm:w-auto max-w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  {supportedLanguages.map(l => (
                    <option key={l.code} value={l.code}>
                      {l.nativeName} — {l.englishName} ({l.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-auto min-w-0">
                <label className="block text-[11px] text-zinc-400 mb-1">Module Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full sm:w-auto max-w-full min-w-0 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500 uppercase"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-0 sm:pt-4">
                <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2">
                  <input
                    type="checkbox"
                    checked={filterMissingOnly}
                    onChange={e => setFilterMissingOnly(e.target.checked)}
                    className="rounded border-zinc-700 text-violet-600 focus:ring-violet-500"
                  />
                  <span>Show Missing Only</span>
                </label>
              </div>
            </div>

            <div className="relative w-full lg:w-80">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={dictSearch}
                onChange={e => setDictSearch(e.target.value)}
                placeholder="Search key, English source, or translation..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-zinc-800 rounded-xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase">
                  <th className="py-3 px-4">Key & Category</th>
                  <th className="py-3 px-4">English Source (Fallback)</th>
                  <th className="py-3 px-4">
                    {selectedLangMeta?.nativeName} ({selectedInspectLang}) Translation
                  </th>
                  <th className="py-3 px-4 text-right">Status & Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70 text-xs sm:text-sm">
                {filteredDictionary.map(record => {
                  const currentVal = record.translations[selectedInspectLang] || '';
                  const isMissing = !currentVal.trim();
                  const isEditingThis = editingKey === record.key;

                  return (
                    <tr key={record.key} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-3 px-4 align-top">
                        <div className="font-mono text-xs text-violet-300" dir="ltr" data-no-translate="true">
                          {record.key}
                        </div>
                        <span className="inline-block mt-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                          {record.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 align-top text-zinc-300" data-no-translate="true">
                        {record.englishText}
                      </td>

                      <td className="py-3 px-4 align-top min-w-[220px]">
                        {isEditingThis ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editingValue}
                              onChange={e => setEditingValue(e.target.value)}
                              dir={selectedLangMeta?.dir === 'rtl' ? 'rtl' : 'ltr'}
                              className="w-full bg-zinc-950 border border-violet-500 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-white focus:outline-none"
                              autoFocus
                            />
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(record.key)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingKey(null)}
                                className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            dir={selectedLangMeta?.dir === 'rtl' ? 'rtl' : 'ltr'}
                            data-no-translate="true"
                            className={`font-medium ${
                              isMissing ? 'text-amber-400 italic' : 'text-white'
                            }`}
                          >
                            {isMissing
                              ? `[Missing — Uses English fallback: "${record.englishText}"]`
                              : currentVal}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 align-top text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {isMissing ? (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <AlertTriangle className="w-3 h-3" />
                              Fallback
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Published
                            </span>
                          )}

                          {!isEditingThis && (
                            <button
                              onClick={() => handleStartEdit(record.key, currentVal || record.englishText)}
                              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors cursor-pointer"
                              title="Edit translation"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* TAB 3: ADD NEW TRANSLATION KEY */}
      {activeSubTab === 'add_key' && (
        <form
          onSubmit={handleCreateKey}
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-6 max-w-2xl space-y-4"
        >
          <div>
            <h3 className="text-base font-bold text-white">Add New Platform Translation Key</h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              New keys automatically populate across all 19 supported languages with English fallback until localized strings are provided.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Translation Key ID (dot notation) *
              </label>
              <input
                type="text"
                required
                value={newKeyId}
                onChange={e => setNewKeyId(e.target.value)}
                placeholder="e.g. feed.superThanksButton"
                dir="ltr"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Platform Section Category *
              </label>
              <select
                value={newKeyCategory}
                onChange={e => setNewKeyCategory(e.target.value as TranslationKeyRecord['category'])}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
              >
                <option value="common">Common</option>
                <option value="navigation">Navigation</option>
                <option value="settings">Settings</option>
                <option value="feed">Feed</option>
                <option value="explore">Explore</option>
                <option value="profile">Profile</option>
                <option value="creator_studio">Creator Studio</option>
                <option value="wallet">Wallet & Checkout</option>
                <option value="messages">Messaging</option>
                <option value="live">Livestreams</option>
                <option value="requests_calls">Custom Requests & Calls</option>
                <option value="notifications">Notifications</option>
                <option value="admin">Admin Control Center</option>
                <option value="auth">Authentication</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              English Source Text (Mandatory Fallback) *
            </label>
            <input
              type="text"
              required
              value={newKeyEnglishText}
              onChange={e => setNewKeyEnglishText(e.target.value)}
              placeholder="e.g. Send Super Support"
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-violet-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Arabic (العربية - RTL)</label>
              <input
                type="text"
                dir="rtl"
                value={newKeyArabicText}
                onChange={e => setNewKeyArabicText(e.target.value)}
                placeholder="اختياري..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">French (Français)</label>
              <input
                type="text"
                value={newKeyFrenchText}
                onChange={e => setNewKeyFrenchText(e.target.value)}
                placeholder="Optionnel..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Spanish (Español)</label>
              <input
                type="text"
                value={newKeySpanishText}
                onChange={e => setNewKeySpanishText(e.target.value)}
                placeholder="Opcional..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-violet-500"
              />
            </div>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('dictionary')}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs sm:text-sm font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Key to Dictionary</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
