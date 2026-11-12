import React, { useState, useEffect } from 'react';
import { Languages, Sparkles, EyeOff, ShieldCheck, Globe } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SupportedLanguageCode } from '../../data/i18nData';

interface TranslateContentButtonProps {
  text: string;
  contentRef?: string;
  contentType?:
    | 'post'
    | 'video'
    | 'photo'
    | 'bio'
    | 'comment'
    | 'status'
    | 'announcement'
    | 'message';
  compact?: boolean;
  className?: string;
  renderPrimaryText?: boolean;
  textClassName?: string;
}

/**
 * User-Generated Content (UGC) Translation Component.
 * - Strictly preserves the creator's original content (never mutates database/state records).
 * - When Platform Translation is DISABLED (default): displays original content only, with a manual "Translate" button.
 * - Clicking "Translate" manually translates only that item into the user's Preferred Translation Language
 *   and NEVER enables automatic Platform Translation.
 * - When Platform Translation is ENABLED by the user: automatically displays the translated version in the user's
 *   Preferred Translation Language with a "Translated" indicator label and a "Show Original" toggle.
 */
export const TranslateContentButton: React.FC<TranslateContentButtonProps> = ({
  text,
  contentRef,
  contentType = 'post',
  compact = false,
  className = '',
  renderPrimaryText = false,
  textClassName = 'text-neutral-200 text-sm leading-relaxed whitespace-pre-line break-words'
}) => {
  const {
    supportedLanguages,
    preferredTranslationLanguage,
    preferredTranslationLanguageMeta,
    platformTranslationEnabled,
    setPreferredTranslationLanguage,
    translateContentItem,
    t
  } = useApp();

  // Local manual override per content item:
  // null = follow global `platformTranslationEnabled` (which defaults to false)
  // 'translated' = user manually clicked Translate on this specific item
  // 'original' = user clicked Show Original on this specific item
  const [manualOverride, setManualOverride] = useState<'translated' | 'original' | null>(null);
  const [showQuickLangPicker, setShowQuickLangPicker] = useState(false);

  // Immediately synchronize when the user toggles Platform Translation ON/OFF or changes Preferred Translation Language
  useEffect(() => {
    setManualOverride(null);
    setShowQuickLangPicker(false);
  }, [platformTranslationEnabled, preferredTranslationLanguage]);

  if (!text || !text.trim()) return null;

  const isShowingTranslation =
    manualOverride === 'translated'
      ? true
      : manualOverride === 'original'
      ? false
      : Boolean(platformTranslationEnabled === true);

  const translationResult = translateContentItem({
    contentRef: contentRef || `${contentType}_${text.slice(0, 48)}`,
    text,
    targetLang: preferredTranslationLanguage
  });

  const isSameLanguageAsOriginal =
    translationResult.detectedSourceLang === preferredTranslationLanguage;

  const enabledLanguages = supportedLanguages.filter(l => l.enabled);

  const handleToggleTranslate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isShowingTranslation) {
      setManualOverride('original');
      setShowQuickLangPicker(false);
    } else {
      setManualOverride('translated');
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`} data-no-translate="true">
      {/* Optional Primary Text Renderer (switches cleanly between Original and Translated while keeping Original accessible) */}
      {renderPrimaryText && (
        <div>
          {isShowingTranslation ? (
            <div className="space-y-1">
              <p
                data-ugc="true"
                dir={translationResult.targetDir}
                className={textClassName}
              >
                {translationResult.translatedText}
              </p>
            </div>
          ) : (
            <p data-ugc="true" className={textClassName}>
              {text}
            </p>
          )}
        </div>
      )}

      {/* Action Row: Translate / Show Original Button + Translated Status Label */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={handleToggleTranslate}
          className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
            compact
              ? 'text-[10px] text-[#d4af37] hover:underline'
              : 'text-[11px] px-2.5 py-0.5 rounded-lg bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-[#d4af37]'
          }`}
        >
          {isShowingTranslation ? (
            <>
              <EyeOff className="w-3 h-3 shrink-0" />
              <span>{t('feed.show_original', 'Show Original')}</span>
            </>
          ) : (
            <>
              <Languages className="w-3 h-3 shrink-0" />
              <span>
                {t('feed.translate', 'Translate')} · {preferredTranslationLanguageMeta.nativeName}
              </span>
            </>
          )}
        </button>

        {isShowingTranslation && (
          <>
            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#fce7b0]">
              <Sparkles className="w-2.5 h-2.5 text-[#d4af37] shrink-0" />
              <span>
                {platformTranslationEnabled && manualOverride === null
                  ? `Translated (${translationResult.detectedSourceEnglishName} → ${preferredTranslationLanguageMeta.englishName})`
                  : `Translated (${translationResult.detectedSourceEnglishName} → ${preferredTranslationLanguageMeta.englishName})`}
              </span>
            </span>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setShowQuickLangPicker(prev => !prev);
              }}
              className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#18181f] hover:bg-[#24242e] text-neutral-300 hover:text-white border border-[#2c2c36] cursor-pointer"
              title="Change Preferred Translation Language"
            >
              <Globe className="w-2.5 h-2.5 text-[#d4af37]" />
              <span>{preferredTranslationLanguageMeta.nativeName}</span>
            </button>
          </>
        )}

        {contentType === 'message' && isShowingTranslation && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>Private translation · Original preserved</span>
          </span>
        )}
      </div>

      {/* Inline Quick Preferred Translation Language Picker (when opened) */}
      {isShowingTranslation && showQuickLangPicker && (
        <div
          dir="ltr"
          onClick={e => e.stopPropagation()}
          className="p-2.5 rounded-xl bg-[#111116] border border-[#2c2c36] space-y-1.5 animate-in fade-in"
        >
          <div className="text-[10px] text-neutral-400 flex items-center justify-between">
            <span>Select Preferred Translation Language:</span>
            <span className="text-[#fce7b0] font-semibold">
              {preferredTranslationLanguageMeta.nativeName} ({preferredTranslationLanguageMeta.englishName})
            </span>
          </div>
          <div className="flex flex-wrap gap-1 max-h-28 overflow-y-auto">
            {enabledLanguages.map(lang => (
              <button
                key={lang.code}
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setPreferredTranslationLanguage(lang.code as SupportedLanguageCode);
                  setManualOverride('translated');
                  setShowQuickLangPicker(false);
                }}
                className={`px-2 py-0.5 rounded text-[10px] cursor-pointer transition-colors ${
                  preferredTranslationLanguage === lang.code
                    ? 'bg-[#d4af37] text-black font-bold'
                    : 'bg-[#18181f] text-neutral-300 hover:text-white border border-[#27272a]'
                }`}
              >
                {lang.nativeName} ({lang.englishName})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* When renderPrimaryText is true and source language matches Preferred Translation Language, offer 1-click target language switch */}
      {renderPrimaryText && isShowingTranslation && isSameLanguageAsOriginal && !showQuickLangPicker && (
        <div
          dir="ltr"
          onClick={e => e.stopPropagation()}
          className="flex items-center gap-2 text-[10px] text-neutral-400"
        >
          <span>
            Original language is already {preferredTranslationLanguageMeta.englishName}.
          </span>
          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              setShowQuickLangPicker(true);
            }}
            className="text-[#d4af37] hover:underline font-semibold cursor-pointer"
          >
            Choose another translation language
          </button>
        </div>
      )}

      {/* Translated Content Box (shown when renderPrimaryText is false and translation is active) */}
      {!renderPrimaryText && isShowingTranslation && (
        <div
          dir={translationResult.targetDir}
          onClick={e => e.stopPropagation()}
          className="p-2.5 rounded-xl bg-[#141418] border border-[#d4af37]/30 space-y-1.5 animate-in fade-in"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap text-[10px] text-[#d4af37]">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>
                {t('feed.translated_from_original', 'Translated from')} {translationResult.detectedSourceEnglishName} → {preferredTranslationLanguageMeta.nativeName} ({preferredTranslationLanguageMeta.englishName})
              </span>
            </span>

            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                setManualOverride('original');
                setShowQuickLangPicker(false);
              }}
              className="inline-flex items-center gap-1 text-neutral-400 hover:text-white cursor-pointer font-medium"
            >
              <EyeOff className="w-3 h-3" />
              <span>{t('feed.show_original', 'Show Original')}</span>
            </button>
          </div>

          <p
            data-ugc="true"
            className="text-xs text-neutral-100 leading-relaxed whitespace-pre-line break-words"
          >
            {translationResult.translatedText}
          </p>

          {isSameLanguageAsOriginal && !showQuickLangPicker && (
            <div
              dir="ltr"
              className="pt-1 border-t border-white/5 flex items-center justify-between gap-2 text-[10px] text-neutral-400"
            >
              <span>
                Content is already in your Preferred Translation Language ({preferredTranslationLanguageMeta.englishName}).
              </span>
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  setShowQuickLangPicker(true);
                }}
                className="text-[#d4af37] hover:underline font-semibold shrink-0 cursor-pointer"
              >
                Change Target Language
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
