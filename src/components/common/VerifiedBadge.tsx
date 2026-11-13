import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../context/AppContext';

export interface VerifiedBadgeProps {
  creatorId?: string;
  forceShow?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  title?: string;
}

const SIZE_MAP: Record<NonNullable<VerifiedBadgeProps['size']>, { box: string; text: string }> = {
  xs: {
    box: 'w-4 h-4 sm:w-[18px] sm:h-[18px]', // 16px mobile, 18px desktop
    text: 'text-[10px]'
  },
  sm: {
    box: 'w-4 h-4 sm:w-[18px] sm:h-[18px]', // 16px mobile, 18px desktop
    text: 'text-[10px]'
  },
  md: {
    box: 'w-[17px] h-[17px] sm:w-[18px] sm:h-[18px]', // 17px mobile, 18px desktop
    text: 'text-[11px]'
  },
  lg: {
    box: 'w-[18px] h-[18px] sm:w-5 sm:h-5', // 18px mobile, 20px desktop
    text: 'text-xs'
  },
  xl: {
    box: 'w-[18px] h-[18px] sm:w-5 sm:h-5', // 18px mobile, 20px desktop
    text: 'text-xs'
  }
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  creatorId,
  forceShow = false,
  size = 'sm',
  showLabel = false,
  className = '',
  title = 'Verified Creator on ACOVON'
}) => {
  const { isCreatorVerifiedBadgeActive } = useApp();
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: 'top' | 'bottom' }>({
    top: 0,
    left: 0,
    placement: 'top'
  });

  const badgeRef = useRef<HTMLSpanElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isActive = forceShow || (creatorId ? isCreatorVerifiedBadgeActive(creatorId) : false);

  const updatePopoverPosition = useCallback(() => {
    const el = badgeRef.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const clampedLeft = Math.min(Math.max(centerX, 110), window.innerWidth - 110);
    const placeBelow = rect.top < 54;
    setCoords({
      top: placeBelow ? rect.bottom + 8 : rect.top - 8,
      left: clampedLeft,
      placement: placeBelow ? 'bottom' : 'top'
    });
  }, []);

  useEffect(() => {
    if (!isPopoverOpen) return;
    updatePopoverPosition();

    const handleOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        badgeRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return;
      }
      setIsPopoverOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPopoverOpen(false);
      }
    };

    const handleScroll = () => {
      setIsPopoverOpen(false);
    };

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isPopoverOpen, updatePopoverPosition]);

  if (!isActive) return null;

  const dims = SIZE_MAP[size] || SIZE_MAP.sm;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    updatePopoverPosition();
    setIsPopoverOpen(prev => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      updatePopoverPosition();
      setIsPopoverOpen(prev => !prev);
    }
  };

  const handleMouseEnter = () => {
    updatePopoverPosition();
    setIsPopoverOpen(true);
  };

  const handleMouseLeave = () => {
    setIsPopoverOpen(false);
  };

  return (
    <>
      <span
        ref={badgeRef}
        role="button"
        tabIndex={0}
        title={title}
        aria-label={title}
        aria-expanded={isPopoverOpen}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`inline-flex items-center gap-1 shrink-0 select-none align-middle cursor-pointer focus:outline-none touch-manipulation ${className}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${dims.box} shrink-0 select-none block rounded-full`}
          style={{ borderRadius: '50%' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="12" fill="#258BFF" />
          <path
            d="M7 12.4l3.1 3.1 6.9-6.9"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {showLabel && (
          <span className={`${dims.text} font-semibold text-[#258BFF] tracking-tight`}>
            Verified
          </span>
        )}
      </span>

      {isPopoverOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popoverRef}
            role="tooltip"
            onClick={e => e.stopPropagation()}
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                coords.placement === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translate(-50%, 0)'
            }}
            className="fixed z-[9999] px-2.5 py-1.5 rounded-lg bg-[#111216] border border-[#2a2d36] text-white text-[11px] font-semibold whitespace-nowrap shadow-xl pointer-events-auto flex items-center gap-1.5"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-3.5 h-3.5 shrink-0 rounded-full"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="12" fill="#258BFF" />
              <path
                d="M7 12.4l3.1 3.1 6.9-6.9"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Verified Creator on ACOVON</span>
          </div>,
          document.body
        )}
    </>
  );
};
