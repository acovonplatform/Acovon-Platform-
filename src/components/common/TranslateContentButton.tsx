import React, { useState } from 'react';
import { Languages, Sparkles, EyeOff, ShieldCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { translateUserGeneratedText } from '../../data/i18nData';

interface TranslateContentButtonProps {
  text: string;
  contentType?: 'post' | 'bio' | 'comment' | 'announcement' | 'message';
  compact?: boolean;
  className?: string;
}

/**
 * Optional User-Generated Content (UGC) Translation Component.
 * Distinguishes between interface translation and creator/user content:
 * - Never replaces or overwrites the creator's original post, bio, comment, or message.
 * - Translates on-demand into the user's preferred language when clicked.
 * - Includes an explicit privacy indicator for private messages.
 */
export const TranslateContentButton: React.FC<TranslateContentButtonProps> = ({
  text,
  contentType = 'post',
  compact = false,
  className = ''
}) => {
  const { activeLanguageCode, activeLanguageMeta, t } = useApp();
  const [isTranslated, setIsTranslated] = useState(false);

  if (!text || !text.trim()) return null;

  const targetLangCode = activeLanguageCode === 'en' ? 'ar' : activeLanguageCode;
  const targetLangLabel =
    activeLanguageCode === 'en' ? 'العربية / Français / Español' : activeLanguageMeta.nativeName;

  const translatedText =
    activeLanguageCode === 'en'
      ? `${translateUserGeneratedText(text, 'ar')}`
      : translateUserGeneratedText(text, targetLangCode);

  return (
    <div className={`space-y-1.5 ${className}`} data-no-translate="true">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsTranslated(prev => !prev);
          }}
          className={`inline-flex items-center gap-1.5 font-medium transition-colors cursor-pointer ${
            compact
              ? 'text-[10px] text-[#d4af37] hover:underline'
              : 'text-[11px] px-2 py-0.5 rounded-lg bg-[#18181c] hover:bg-[#22222a] border border-[#27272a] text-[#d4af37]'
          }`}
        >
          <Languages className="w-3 h-3 shrink-0" />
          <span>
            {isTranslated
              ? t('feed.show_original', 'Show Original')
              : `${t('feed.translate', 'Translate')} (${
                  activeLanguageCode === 'en' ? 'العربية' : activeLanguageMeta.nativeName
                })`}
          </span>
        </button>

        {contentType === 'message' && isTranslated && (
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400">
            <ShieldCheck className="w-3 h-3" />
            <span>On-device private translation · Original message preserved</span>
          </span>
        )}
      </div>

      {isTranslated && (
        <div
          dir={activeLanguageCode === 'en' || activeLanguageMeta.dir === 'rtl' ? 'rtl' : 'ltr'}
          className="p-2.5 rounded-xl bg-[#141418] border border-[#d4af37]/30 space-y-1 animate-in fade-in"
        >
          <div className="flex items-center justify-between gap-2 text-[10px] text-[#d4af37]">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>
                {t('feed.translated_from_original', 'Translated from original')} · {targetLangLabel}
              </span>
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsTranslated(false);
              }}
              className="inline-flex items-center gap-1 text-neutral-400 hover:text-white cursor-pointer"
            >
              <EyeOff className="w-3 h-3" />
              <span>{t('feed.show_original', 'Show Original')}</span>
            </button>
          </div>
          <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-line">
            {translatedText}
          </p>
        </div>
      )}
    </div>
  );
};
