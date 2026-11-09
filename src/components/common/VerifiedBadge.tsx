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

const SIZE_MAP: Record<NonNullable<VerifiedBadgeProps['size']>, { box: string; text: string }> = {
  xs: {
    box: 'w-3 h-3', // 12px - TikTok / Instagram compact handle size
    text: 'text-[9px]'
  },
  sm: {
    box: 'w-3.5 h-3.5', // 14px - standard feed handle size
    text: 'text-[10px]'
  },
  md: {
    box: 'w-4 h-4', // 16px - profile header handle size
    text: 'text-[11px]'
  },
  lg: {
    box: 'w-[18px] h-[18px]',
    text: 'text-xs'
  },
  xl: {
    box: 'w-5 h-5', // 20px - clean modal size
    text: 'text-xs'
  }
};

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  creatorId,
  forceShow = false,
  size = 'xs',
  showLabel = false,
  className = '',
  title = 'Verified Creator'
}) => {
  const { isCreatorVerifiedBadgeActive } = useApp();

  const isActive = forceShow || (creatorId ? isCreatorVerifiedBadgeActive(creatorId) : false);
  if (!isActive) return null;

  const dims = SIZE_MAP[size] || SIZE_MAP.xs;

  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex items-center gap-1 shrink-0 select-none align-middle ${className}`}
    >
      <svg
        viewBox="0 0 40 40"
        className={`${dims.box} shrink-0 select-none inline-block align-middle`}
        aria-hidden="true"
      >
        {/* TikTok & Instagram authentic scalloped blue rosette */}
        <path
          d="M19.998 3.094 14.638 0l-5.9 3.094-6.358 1.1 1.1 6.358L0 14.638l3.094 5.36L0 25.358l3.48 4.086-1.1 6.358 6.358 1.1 5.9 3.094 5.36-3.094 5.36 3.094 5.9-3.094 6.358-1.1-1.1-6.358 3.48-4.086-3.094-5.36 3.094-5.36-3.48-4.086 1.1-6.358-6.358-1.1-5.9-3.094-5.36 3.094Z"
          fill="#0095F6"
        />
        {/* Crisp White Checkmark */}
        <path
          d="M12.5 20.5 17 25l11-11"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {showLabel && (
        <span className={`${dims.text} font-semibold text-[#0095F6] tracking-tight`}>
          Verified
        </span>
      )}
    </span>
  );
};
