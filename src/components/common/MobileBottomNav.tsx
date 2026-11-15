import React, { useEffect, useRef } from 'react';
import { Home, Compass, Radio, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenCreatePost: () => void;
  isKeyboardOpen?: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate,
  isKeyboardOpen = false
}) => {
  const { currentUser, isAuthenticated, isCurrentUserApprovedCreator, livestreams, messages } = useApp();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const updateHeight = () => {
      if (typeof window === 'undefined') return;
      const isDesktop = window.innerWidth >= 768;
      if (isDesktop || isKeyboardOpen || !navRef.current) {
        document.documentElement.style.setProperty('--acovon-mobile-nav-height', '0px');
      } else {
        const rect = navRef.current.getBoundingClientRect();
        document.documentElement.style.setProperty('--acovon-mobile-nav-height', `${Math.round(rect.height)}px`);
      }
    };

    updateHeight();
    const ro = typeof ResizeObserver !== 'undefined' && navRef.current
      ? new ResizeObserver(() => updateHeight())
      : null;
    if (ro && navRef.current) ro.observe(navRef.current);
    window.addEventListener('resize', updateHeight);
    window.addEventListener('orientationchange', updateHeight);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateHeight);
      window.removeEventListener('orientationchange', updateHeight);
      document.documentElement.style.setProperty('--acovon-mobile-nav-height', '0px');
    };
  }, [isKeyboardOpen]);
  
  const isCreator = isAuthenticated && isCurrentUserApprovedCreator;
  const liveCount = livestreams.filter(s => s.status === 'live').length;
  const unreadMessageCount = isAuthenticated
    ? Object.values(messages).flat().filter(m => m.receiverId === currentUser.id && !m.read).length
    : 0;

  const navItems = !isAuthenticated
    ? [
        { id: 'feed', label: 'Feed', icon: Home },
        { id: 'explore', label: 'Explore', icon: Compass },
        {
          id: 'live',
          label: 'Live',
          icon: Radio,
          badge: liveCount > 0 ? liveCount : undefined,
          badgeColor: 'bg-red-600 text-white animate-pulse'
        }
      ]
    : isCreator
    ? [
        { id: 'feed', label: 'Feed', icon: Home },
        { id: 'explore', label: 'Explore', icon: Compass },
        {
          id: 'live',
          label: 'Live',
          icon: Radio,
          badge: liveCount > 0 ? liveCount : undefined,
          badgeColor: 'bg-red-600 text-white animate-pulse'
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: MessageSquare,
          badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
          badgeColor: 'bg-[#d4af37] text-black font-bold'
        },
        {
          id: 'creator-studio',
          label: 'Studio',
          icon: LayoutDashboard
        }
      ]
    : [
        { id: 'feed', label: 'Feed', icon: Home },
        { id: 'explore', label: 'Explore', icon: Compass },
        {
          id: 'live',
          label: 'Live',
          icon: Radio,
          badge: liveCount > 0 ? liveCount : undefined,
          badgeColor: 'bg-red-600 text-white animate-pulse'
        },
        {
          id: 'messages',
          label: 'Messages',
          icon: MessageSquare,
          badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
          badgeColor: 'bg-[#d4af37] text-black font-bold'
        }
      ];

  if (isKeyboardOpen) {
    return null;
  }

  return (
    <nav
      ref={navRef}
      aria-label="Mobile bottom navigation"
      className="acovon-mobile-nav md:hidden fixed bottom-0 left-0 right-0 z-40 w-full overflow-x-clip bg-[#faf8f5]/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-t border-stone-200 dark:border-[#26262b] px-1 xs:px-2 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 min-w-0 min-h-[46px] xs:min-h-[48px] flex flex-col items-center justify-center py-1 px-0.5 sm:px-1 rounded-xl text-[9.5px] min-[390px]:text-[10.5px] sm:text-[11px] font-semibold transition-all cursor-pointer relative overflow-hidden active:scale-95 ${
              isActive
                ? 'text-[#9a7418] dark:text-[#d4af37]'
                : 'text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
            }`}
          >
            {isActive && (
              <span className="absolute top-0.5 w-5 h-0.5 rounded-full bg-[#9a7418] dark:bg-[#d4af37]" />
            )}
            <div className="relative flex items-center justify-center">
              <Icon className={`w-4 h-4 min-[360px]:w-5 min-[360px]:h-5 ${item.id === 'live' && liveCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
              {item.badge !== undefined && (
                <span className={`absolute -top-1.5 -right-2 px-1 min-w-[14px] h-3.5 min-[360px]:min-w-[15px] min-[360px]:h-4 rounded-full text-[8.5px] min-[360px]:text-[9px] leading-none flex items-center justify-center font-mono ${item.badgeColor || 'bg-neutral-800'}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="mt-0.5 min-[360px]:mt-1 truncate max-w-full leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

