import React from 'react';
import { Home, Compass, Grid, Radio, MessageSquare, LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  currentTab: string;
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenCreatePost: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onNavigate
}) => {
  const { currentUser, isCurrentUserApprovedCreator, livestreams, messages, t } = useApp();
  
  const isCreator = isCurrentUserApprovedCreator;
  const liveCount = livestreams.filter(s => s.status === 'live').length;
  const unreadMessageCount = Object.values(messages).flat().filter(m => m.receiverId === currentUser.id && !m.read).length;

  const navItems = isCreator ? [
    { id: 'feed', label: t('nav.feed', 'Feed'), icon: Home },
    { id: 'explore', label: t('nav.explore', 'Explore'), icon: Compass },
    { id: 'categories', label: t('nav.categories', 'Categories'), icon: Grid },
    { 
      id: 'live', 
      label: t('nav.live', 'Live'), 
      icon: Radio,
      badge: liveCount > 0 ? liveCount : undefined,
      badgeColor: 'bg-red-600 text-white animate-pulse'
    },
    { 
      id: 'messages', 
      label: t('nav.messages', 'Messages'), 
      icon: MessageSquare,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      badgeColor: 'bg-[#d4af37] text-black font-bold'
    },
    { 
      id: 'creator-studio', 
      label: t('nav.studio_short', 'Studio'), 
      icon: LayoutDashboard 
    }
  ] : [
    { id: 'feed', label: t('nav.feed', 'Feed'), icon: Home },
    { id: 'explore', label: t('nav.explore', 'Explore'), icon: Compass },
    { id: 'categories', label: t('nav.categories', 'Categories'), icon: Grid },
    { 
      id: 'live', 
      label: t('nav.live', 'Live'), 
      icon: Radio,
      badge: liveCount > 0 ? liveCount : undefined,
      badgeColor: 'bg-red-600 text-white animate-pulse'
    },
    { 
      id: 'messages', 
      label: t('nav.messages', 'Messages'), 
      icon: MessageSquare,
      badge: unreadMessageCount > 0 ? unreadMessageCount : undefined,
      badgeColor: 'bg-[#d4af37] text-black font-bold'
    }
  ];

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f5]/95 dark:bg-[#09090b]/95 backdrop-blur-xl border-t border-stone-200 dark:border-[#26262b] px-1.5 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))] flex items-center justify-around transition-colors shadow-[0_-4px_20px_rgba(0,0,0,0.25)]"
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onNavigate(item.id)}
            className={`flex-1 min-w-0 min-h-[48px] flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer relative active:scale-95 ${
              isActive
                ? 'text-[#9a7418] dark:text-[#d4af37]'
                : 'text-stone-500 dark:text-neutral-400 hover:text-stone-900 dark:hover:text-neutral-200'
            }`}
          >
            {isActive && (
              <span className="absolute top-0.5 w-5 h-0.5 rounded-full bg-[#9a7418] dark:bg-[#d4af37]" />
            )}
            <div className="relative flex items-center justify-center">
              <Icon className={`w-5 h-5 ${item.id === 'live' && liveCount > 0 ? 'text-red-500 animate-pulse' : ''}`} />
              {item.badge !== undefined && (
                <span className={`absolute -top-1.5 -right-2.5 px-1 min-w-[16px] h-4 rounded-full text-[9px] leading-none flex items-center justify-center font-mono ${item.badgeColor || 'bg-neutral-800'}`}>
                  {item.badge}
                </span>
              )}
            </div>
            <span className="mt-1 truncate max-w-full leading-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
