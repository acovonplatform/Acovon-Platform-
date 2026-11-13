import React from 'react';

export const OFFICIAL_ACOVON_LOGO_SRC =
  '/assets/aistudio/Glossy_Gold_A_Play_Orbital_Emblem_024a7fc6.png';

interface AcovonLogoIconProps {
  size?: 'xs' | 'sm' | 'header' | 'md' | 'lg';
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AcovonLogoIconProps['size']>, string> = {
  xs: 'w-6 h-6',
  sm: 'w-7 h-7 sm:w-8 sm:h-8',
  header: 'w-8 h-8 sm:w-9 sm:h-9',
  md: 'w-10 h-10',
  lg: 'w-12 h-12 sm:w-14 sm:h-14'
};

export const AcovonLogoIcon: React.FC<AcovonLogoIconProps> = ({
  size = 'header',
  className = ''
}) => {
  return (
    <img
      src={OFFICIAL_ACOVON_LOGO_SRC}
      alt="ACOVON Official Logo"
      draggable={false}
      className={`${SIZE_CLASSES[size]} object-contain shrink-0 select-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.28)] dark:drop-shadow-[0_2px_10px_rgba(212,175,55,0.28)] ${className}`}
    />
  );
};
