import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';

interface CollapsibleDescriptionTextProps {
  text: string;
  dir?: 'ltr' | 'rtl' | 'auto';
  textClassName?: string;
  variant?: 'default' | 'overlay';
  compact?: boolean;
  linkify?: boolean;
  maxExpandedHeightClass?: string;
  resetKey?: string;
  className?: string;
  dataUgc?: boolean;
  hasExtraContent?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const TOKEN_REGEX = /((?:https?:\/\/|www\.)[^\s<>()]+|#[A-Za-z0-9_\u00C0-\u024F]+)/g;
const TRAILING_PUNCTUATION_REGEX = /[.,!?;:)\]]+$/;

function renderFormattedText(text: string, linkify: boolean): React.ReactNode {
  if (!linkify) {
    return text;
  }

  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(TOKEN_REGEX);
    return (
      <React.Fragment key={lineIdx}>
        {parts.map((part, partIdx) => {
          if (!part) return null;

          if (/^(https?:\/\/|www\.)/i.test(part)) {
            const trailingMatch = part.match(TRAILING_PUNCTUATION_REGEX);
            const trailing = trailingMatch ? trailingMatch[0] : '';
            const cleanUrl = trailing ? part.slice(0, -trailing.length) : part;
            const href = /^https?:\/\//i.test(cleanUrl) ? cleanUrl : `https://${cleanUrl}`;

            return (
              <React.Fragment key={partIdx}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-[#d4af37] hover:text-[#fce7b0] underline underline-offset-2 break-all"
                >
                  {cleanUrl}
                </a>
                {trailing}
              </React.Fragment>
            );
          }

          if (part.startsWith('#') && part.length > 1) {
            return (
              <span key={partIdx} className="text-[#d4af37] font-medium">
                {part}
              </span>
            );
          }

          return <React.Fragment key={partIdx}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 && '\n'}
      </React.Fragment>
    );
  });
}

export const CollapsibleDescriptionText: React.FC<CollapsibleDescriptionTextProps> = ({
  text,
  dir,
  textClassName = 'text-neutral-200 text-sm leading-relaxed',
  variant = 'default',
  compact = false,
  linkify = true,
  maxExpandedHeightClass = '',
  resetKey,
  className = '',
  dataUgc = true,
  hasExtraContent = false,
  onExpandedChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsTruncation, setNeedsTruncation] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  const normalized = (text || '').replace(/\r\n/g, '\n').trimEnd();
  const lines = normalized.split('\n');
  const firstNonEmpty = lines.find(l => l.trim().length > 0) ?? '';
  const firstLine = lines[0]?.trim().length ? lines[0] : firstNonEmpty;
  const hasMultipleLines = lines.length > 1;

  // Reset expansion state only when switching to a different item (e.g. next video/photo in modal),
  // NOT when switching between original & translated versions of the same post.
  useEffect(() => {
    setIsExpanded(false);
    onExpandedChange?.(false);
  }, [resetKey]);

  useLayoutEffect(() => {
    const checkOverflow = () => {
      if (!normalized) {
        setNeedsTruncation(false);
        return;
      }
      if (hasMultipleLines) {
        setNeedsTruncation(true);
        return;
      }
      const container = containerRef.current;
      const measure = measureRef.current;
      if (!container || !measure) return;

      const overflows = measure.scrollWidth > container.clientWidth + 1;
      setNeedsTruncation(overflows);
    };

    checkOverflow();

    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(container);

    let cancelled = false;
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) checkOverflow();
      });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [normalized, firstLine, hasMultipleLines, textClassName, dir]);

  if (!normalized) return null;

  const toggleButtonClasses =
    variant === 'overlay'
      ? compact
        ? 'inline-flex items-center px-1.5 py-0.5 rounded bg-black/55 hover:bg-black/80 text-[#fce7b0] hover:text-white font-semibold text-[11px] leading-none transition-colors cursor-pointer touch-manipulation select-none'
        : 'inline-flex items-center px-2 py-0.5 rounded bg-black/60 hover:bg-black/85 text-[#fce7b0] hover:text-white font-semibold text-xs leading-tight transition-colors cursor-pointer touch-manipulation select-none'
      : compact
      ? 'inline-flex items-center px-1.5 py-0.5 rounded hover:bg-[#1e1e26] text-[#d4af37] hover:text-[#fce7b0] font-semibold text-xs leading-none transition-colors cursor-pointer touch-manipulation select-none'
      : 'inline-flex items-center px-1.5 py-0.5 rounded hover:bg-[#1e1e26] text-[#d4af37] hover:text-[#fce7b0] font-semibold text-xs sm:text-[13px] leading-none transition-colors cursor-pointer touch-manipulation select-none';

  const showToggleButton = needsTruncation || Boolean(hasExtraContent);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !isExpanded;
    setIsExpanded(next);
    onExpandedChange?.(next);
  };

  // Strip multi-line forcing classes from collapsed/measurement variants so 1-line layout stays strictly 1 line
  const sanitizedBaseClasses = textClassName
    .replace(/\bwhitespace-pre-line\b/g, '')
    .replace(/\bwhitespace-pre-wrap\b/g, '')
    .replace(/\bline-clamp-\d+\b/g, '')
    .trim();

  return (
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
      {/* Hidden single-line measurement mirror to detect true visual overflow accurately */}
      <span
        ref={measureRef}
        aria-hidden="true"
        dir={dir}
        className={`invisible pointer-events-none select-none absolute left-0 top-0 whitespace-nowrap ${sanitizedBaseClasses}`}
      >
        {firstLine}
      </span>

      {!isExpanded ? (
        <div
          dir={dir}
          className="flex items-baseline gap-1.5 min-w-0 max-w-full transition-all duration-200"
        >
          <span
            data-ugc={dataUgc ? 'true' : undefined}
            className={`min-w-0 truncate block ${sanitizedBaseClasses}`}
          >
            {firstLine}
          </span>
          {showToggleButton && (
            <button
              type="button"
              onClick={handleToggle}
              aria-expanded={false}
              className={`shrink-0 ${toggleButtonClasses}`}
            >
              More
            </button>
          )}
        </div>
      ) : (
        <div
          dir={dir}
          onClick={e => e.stopPropagation()}
          className={`transition-all duration-200 animate-in fade-in ${
            variant === 'overlay'
              ? `rounded-xl bg-black/75 backdrop-blur-md border border-white/10 px-2.5 py-2 ${maxExpandedHeightClass}`
              : maxExpandedHeightClass
          }`}
        >
          <p
            data-ugc={dataUgc ? 'true' : undefined}
            className={`whitespace-pre-line break-words ${sanitizedBaseClasses}`}
          >
            {renderFormattedText(normalized, linkify)}
            {showToggleButton && (
              <>
                {' '}
                <button
                  type="button"
                  onClick={handleToggle}
                  aria-expanded={true}
                  className={`align-baseline ml-0.5 ${toggleButtonClasses}`}
                >
                  Show Less
                </button>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
};
