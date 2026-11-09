import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { VerifiedBadge } from './VerifiedBadge';
import { 
  User, 
  Edit3, 
  Wallet, 
  CreditCard, 
  Sparkles, 
  Receipt, 
  Settings, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Check, 
  ShieldAlert, 
  UserCheck,
  ChevronDown,
  LayoutDashboard,
  Sun,
  Moon,
  Monitor,
  Globe,
  FolderLock
} from 'lucide-react';

interface ProfileMenuProps {
  onNavigate: (tab: string, creatorId?: string) => void;
  onOpenWallet: () => void;
  onOpenEditProfile: () => void;
  onOpenPaymentMethods: () => void;
  onOpenSubscriptions: () => void;
  onOpenPurchaseHistory: () => void;
  onOpenSettings: () => void;
  onOpenPrivacy: () => void;
  onOpenHelpCenter: () => void;
  onOpenAuth: () => void;
  onOpenBecomeCreator?: () => void;
  onOpenFanProfile?: () => void;
}

export const ProfileMenu: React.FC<ProfileMenuProps> = ({
  onNavigate,
  onOpenWallet,
  onOpenEditProfile,
  onOpenPaymentMethods,
  onOpenSubscriptions,
  onOpenPurchaseHistory,
  onOpenSettings,
  onOpenPrivacy,
  onOpenHelpCenter,
  onOpenAuth,
  onOpenBecomeCreator,
  onOpenFanProfile
}) => {
  const {
    currentUser,
    activeRole,
    isCurrentUserApprovedCreator,
    userPendingVerification,
    switchUserRole,
    logoutUser,
    appearanceMode,
    resolvedColorMode,
    setAppearanceMode,
    activeLanguageMeta,
    supportedLanguages,
    activeLanguageCode,
    setUserLanguagePreference
  } = useApp();
  const isCreator = isCurrentUserApprovedCreator;
  const [isOpen, setIsOpen] = useState(false);
  const [showPersonaSubmenu, setShowPersonaSubmenu] = useState(false);
  const [showLanguageSubmenu, setShowLanguageSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowPersonaSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAuthorizedAdmin = currentUser.role === 'admin' || currentUser.adminPermissionLevel !== undefined;

  const roleOptions: { label: string; role: UserRole; subtitle: string; specificId?: string }[] = useMemo(() => {
    const list: { label: string; role: UserRole; subtitle: string; specificId?: string }[] = [
      { label: 'Jordan Cross', role: 'fan', subtitle: 'Subscriber & Content Patron' },
      { label: 'Elena Vance', role: 'creator', specificId: 'creator_elena', subtitle: 'Fashion Director · $38.4k' },
      { label: 'Marcus Thorne', role: 'creator', specificId: 'creator_marcus', subtitle: 'Music Producer · Calls Enabled' }
    ];

    // Only authorized administrators can switch between administrative operators
    if (isAuthorizedAdmin) {
      list.push(
        { label: 'Julian Sterling', role: 'admin', specificId: 'user_admin_1', subtitle: 'Super Admin · Full Platform Control' },
        { label: 'Evelyn Cross', role: 'admin', specificId: 'user_admin_2', subtitle: 'Admin · General Operations' },
        { label: 'Clara Vance', role: 'moderator', specificId: 'user_mod_1', subtitle: 'Moderator · Trust, Safety & Live' },
        { label: 'Henrik Lindqvist', role: 'admin', specificId: 'user_admin_finance', subtitle: 'Finance Admin · Payouts & Ledger' },
        { label: 'Sophia Lin', role: 'admin', specificId: 'user_admin_support', subtitle: 'Support Admin · Tickets & Disputes' }
      );
    }

    return list;
  }, [isAuthorizedAdmin]);

  const handleSelectRole = (opt: typeof roleOptions[0]) => {
    switchUserRole(opt.role, opt.specificId);
    setShowPersonaSubmenu(false);
    setIsOpen(false);
    if (opt.role === 'creator') onNavigate('creator-studio');
    else if (opt.role === 'admin' || opt.role === 'moderator') onNavigate('admin-panel');
    else onNavigate('feed');
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Avatar & Toggle Button */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowPersonaSubmenu(false);
        }}
        className="flex items-center gap-1.5 sm:gap-2.5 min-h-[38px] p-1 sm:pl-2 sm:pr-3 sm:py-1.5 bg-[#141418] hover:bg-[#1c1c22] border border-[#27272a] hover:border-[#383842] rounded-xl cursor-pointer transition-all focus:outline-none"
        title="Open Profile Menu"
      >
        <div className="relative shrink-0">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-7 h-7 rounded-full object-cover border border-[#d4af37]/60"
          />
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#141418]" />
        </div>
        
        <div className="hidden sm:flex flex-col text-left leading-none">
          <span className="text-xs font-semibold text-neutral-200 truncate max-w-[115px]">
            {currentUser.name}
          </span>
          <span className="text-[10px] text-neutral-400 truncate max-w-[115px] flex items-center gap-1 mt-0.5">
            <span>@{currentUser.username}</span>
            {isCreator && <VerifiedBadge creatorId={currentUser.id} size="xs" />}
          </span>
        </div>
        
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180 text-white' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed left-3 right-3 top-[60px] w-auto max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-72 sm:max-w-none bg-[#121215] border border-[#27272a] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 backdrop-blur-xl">
          
          {/* User Overview Card */}
          <div className="p-3 bg-[#18181c] rounded-xl mb-2 border border-[#27272a]">
            <div className="flex items-center gap-3">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-10 h-10 rounded-full object-cover border border-[#d4af37]/50"
              />
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                  <span>@{currentUser.username}</span>
                  {isCreator && <VerifiedBadge creatorId={currentUser.id} size="xs" />}
                </div>
                <div className="text-[10px] font-mono text-[#fce7b0] mt-0.5">
                  Balance: ${Number(currentUser?.walletBalance || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div className="space-y-0.5">
            {isCreator && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('creator-studio');
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#fce7b0] bg-[#1a1810] hover:bg-[#242116] border border-[#d4af37]/30 rounded-lg transition-colors flex items-center justify-between cursor-pointer mb-1"
              >
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-[#d4af37]" />
                  <span>Creator Studio</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[#d4af37]" />
              </button>
            )}

            {!isCreator && onOpenBecomeCreator && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenBecomeCreator();
                }}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#fce7b0] bg-[#1a1810] hover:bg-[#242116] border border-[#d4af37]/40 rounded-lg transition-colors flex items-center justify-between cursor-pointer mb-1 shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#d4af37]" />
                  <span>{userPendingVerification ? 'Creator Application (Pending)' : 'Become a Creator'}</span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#d4af37]/20 text-[#fce7b0]">
                  {userPendingVerification ? 'Pending' : '18+'}
                </span>
              </button>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                if (isCreator) {
                  onNavigate('creator-profile', currentUser.id);
                } else if (onOpenFanProfile) {
                  onOpenFanProfile();
                } else {
                  onNavigate('creator-profile', 'creator_elena');
                }
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <User className="w-4 h-4 text-[#d4af37]" />
                <span>My Profile</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenEditProfile();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-4 h-4 text-neutral-400" />
                <span>Edit Profile</span>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#26262b] my-1.5" />

          {/* Finances & Content Section */}
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenWallet();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-[#d4af37]" />
                <span>{isCreator ? 'Wallet & Earnings' : 'Wallet / Purchases'}</span>
              </div>
              <span className="text-[10px] font-mono text-[#fce7b0]">${Number(currentUser?.walletBalance || 0).toFixed(2)}</span>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                if (isCreator) {
                  onOpenSubscriptions();
                } else {
                  onNavigate('subscriptions');
                }
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#d4af37]" />
                <span>My Subscriptions</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPurchaseHistory();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Receipt className="w-4 h-4 text-neutral-400" />
                <span>Purchase History</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPaymentMethods();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-neutral-400" />
                <span>Payment Methods</span>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#26262b] my-1.5" />

          {/* Settings & Support */}
          <div className="space-y-0.5">
            <button
              onClick={() => {
                setIsOpen(false);
                onOpenSettings();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4 text-neutral-400" />
                <span>Settings</span>
              </div>
            </button>

            {/* Language / اللغة Selector in Profile Menu */}
            <button
              type="button"
              onClick={() => setShowLanguageSubmenu(prev => !prev)}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[#d4af37]" />
                <span data-no-translate="true">Language / اللغة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold text-[#fce7b0]" data-no-translate="true">
                  {activeLanguageMeta.nativeName}
                </span>
                <ChevronRight
                  className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${
                    showLanguageSubmenu ? 'rotate-90' : ''
                  }`}
                />
              </div>
            </button>

            {showLanguageSubmenu && (
              <div className="p-1.5 space-y-1 bg-[#16161b] rounded-xl border border-[#27272a] my-1 max-h-48 overflow-y-auto">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    setShowLanguageSubmenu(false);
                    onOpenSettings();
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[#d4af37] bg-[#1a1810] hover:bg-[#242116] border border-[#d4af37]/30 flex items-center justify-between cursor-pointer mb-1"
                >
                  <span>Full Language Settings (Search 19)</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                {supportedLanguages
                  .filter(l => l.enabled)
                  .map(lang => {
                    const isSelected = activeLanguageCode === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => {
                          setUserLanguagePreference('manual', lang.code);
                          setShowLanguageSubmenu(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-[#d4af37]/15 text-[#fce7b0] font-semibold'
                            : 'hover:bg-[#1f1f26] text-neutral-300 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span data-no-translate="true">{lang.nativeName}</span>
                          <span className="text-[10px] text-neutral-500" data-no-translate="true">
                            ({lang.englishName})
                          </span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                      </button>
                    );
                  })}
              </div>
            )}

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenPrivacy();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-neutral-400" />
                <span>Privacy & Safety</span>
              </div>
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                onOpenHelpCenter();
              }}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <HelpCircle className="w-4 h-4 text-neutral-400" />
                <span>Help Center</span>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#26262b] my-1.5" />

          {/* Appearance Mode Switcher (Dark Mode / Light Mode / System Default) */}
          <div className="px-2 py-1.5 space-y-1.5">
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-neutral-400 font-medium">Appearance</span>
              <span className="text-[10px] font-mono text-[#d4af37] capitalize">
                {appearanceMode === 'system' ? `System (${resolvedColorMode})` : `${appearanceMode} Mode`}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#18181c] border border-[#27272a] rounded-xl">
              <button
                type="button"
                onClick={() => setAppearanceMode('dark')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  appearanceMode === 'dark'
                    ? 'bg-[#d4af37] text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Switch to Dark Mode"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setAppearanceMode('light')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  appearanceMode === 'light'
                    ? 'bg-[#d4af37] text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Switch to Light Mode"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setAppearanceMode('system')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors ${
                  appearanceMode === 'system'
                    ? 'bg-[#d4af37] text-black shadow-xs'
                    : 'text-neutral-400 hover:text-white'
                }`}
                title="Follow Device System Default"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>

          {/* Admin panel if applicable */}
          {(activeRole === 'admin' || activeRole === 'moderator') && (
            <>
              <div className="h-px bg-[#26262b] my-1.5" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigate('admin-panel');
                }}
                className="w-full text-left px-3 py-2 text-xs text-[#fce7b0] hover:bg-[#252530] border border-[#d4af37]/30 rounded-lg transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-[#d4af37]" />
                  <span className="font-semibold">Platform Control Panel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Divider */}
          <div className="h-px bg-[#26262b] my-1.5" />

          {/* Role Persona Switcher Submenu */}
          <div className="space-y-0.5">
            <button
              onClick={() => setShowPersonaSubmenu(!showPersonaSubmenu)}
              className="w-full text-left px-3 py-2 text-xs text-neutral-300 hover:text-white hover:bg-[#1a1a20] rounded-lg transition-colors flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-4 h-4 text-[#d4af37]" />
                <span>Switch Platform Role</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-neutral-500 transition-transform ${showPersonaSubmenu ? 'rotate-90' : ''}`} />
            </button>

            {showPersonaSubmenu && (
              <div className="pl-2 pr-1 py-1 space-y-1 bg-[#16161b] rounded-lg border border-[#27272a] my-1">
                {roleOptions.map((opt) => {
                  const isSelected = activeRole === opt.role && (!opt.specificId || currentUser.id === opt.specificId);
                  return (
                    <button
                      key={opt.label}
                      onClick={() => handleSelectRole(opt)}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#d4af37]/15 text-[#fce7b0]' : 'hover:bg-[#1f1f26] text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-[10px] text-neutral-500">{opt.subtitle}</div>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#d4af37]" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Log Out */}
          <div className="mt-1 pt-1 border-t border-[#26262b]">
            <button
              onClick={() => {
                setIsOpen(false);
                logoutUser();
                onNavigate('landing');
              }}
              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      )}
    </div>
  );
};
