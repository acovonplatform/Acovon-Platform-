import React from 'react';
import { useApp } from '../../context/AppContext';

export interface VerifiedBadgeProps {
  creatorId?: string;
  forceShow?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
  title?: string;
}

const SIZE_MAP: Record<NonNullable<VerifiedBadgeProps['size']>, { box: string; icon: string; text: string }> = {
  xs: {
    box: 'w-3 h-3',
    icon: 'w-2 h-2',
    text: 'text-[9px]'
  },
  sm: {
    box: 'w-3.5 h-3.5',
    icon: 'w-2 h-2',
    text: 'text-[10px]'
  },
  md: {
    box: 'w-4 h-4',
    icon: 'w-2.5 h-2.5',
    text: 'text-[11px]'
  },
  lg: {
    box: 'w-5 h-5',
    icon: 'w-3 h-3',
    text: 'text-xs'
  },
  xl: {
    box: 'w-7 h-7',
    icon: 'w-4 h-4',
    text: 'text-xs'
  }
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  creatorId,
  forceShow = false,
  size = 'sm',
  showLabel = false,
  className = '',
  title = 'Official ACOVON Verified Creator'
}) => {
  const { isCreatorVerifiedBadgeActive } = useApp();

  const isActive = forceShow || (creatorId ? isCreatorVerifiedBadgeActive(creatorId) : false);
  if (!isActive) return null;

  const dims = SIZE_MAP[size] || SIZE_MAP.sm;

  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-1 shrink-0 select-none align-middle ${className}`}
    >
      <span
        className={`${dims.box} rounded-full bg-gradient-to-br from-[#2AABEE] via-[#1D9BF0] to-[#0B66C3] ring-1 ring-sky-300/35 shadow-[0_0_6px_rgba(29,155,240,0.35)] inline-flex items-center justify-center relative overflow-hidden`}
      >
        {/* Subtle inner specular highlight for original ACOVON medallion look */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/25 pointer-events-none" />
        <svg
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${dims.icon} text-white relative z-10`}
        >
          <path
            d="M3.75 8.35L6.6 11.2L12.45 5.1"
            stroke="currentColor"
            strokeWidth="2.35"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {showLabel && (
        <span className={`${dims.text} font-semibold text-sky-400 tracking-tight`}>
          Verified
        </span>
      )}
    </span>
  );
};
