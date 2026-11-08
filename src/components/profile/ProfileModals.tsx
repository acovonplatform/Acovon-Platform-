import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  X, 
  CreditCard, 
  Shield, 
  Lock, 
  CheckCircle2, 
  User, 
  Settings as SettingsIcon, 
  HelpCircle, 
  AlertCircle, 
  Trash2, 
  Plus, 
  ExternalLink,
  DollarSign,
  Calendar,
  Sparkles,
  Smartphone,
  Eye,
  Key,
  Bell,
  RefreshCw,
  Sun,
  Moon,
  Monitor,
  Globe,
  Languages,
  Search,
  Check
} from 'lucide-react';
import { CreatorProfile } from '../../types';
import {
  formatLocalizedDate,
  formatLocalizedNumber,
  formatLocalizedCurrency
} from '../../data/i18nData';

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateCreatorProfile } = useApp();
  const isCreator = 'bio' in currentUser;
  const creator = isCreator ? (currentUser as CreatorProfile) : null;

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(creator?.bio || '');
  const [category, setCategory] = useState(creator?.category || 'Fashion & Lifestyle');
  const [country, setCountry] = useState(creator?.country || 'United States');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [videoCallPrice, setVideoCallPrice] = useState(creator?.callRatePerMinute || 4.5);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreator && creator) {
      updateCreatorProfile(creator.id, {
        name,
        username,
        bio,
        category,
        country,
        avatar,
        callRatePerMinute: videoCallPrice
      });
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-lg font-bold text-white">Edit Profile</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-white font-medium">Profile successfully updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            <div className="flex items-center gap-4">
              <img 
                src={avatar} 
                alt={name} 
                className="w-16 h-16 rounded-full object-cover border-2 border-[#d4af37]/50" 
              />
              <div className="flex-1 space-y-1">
                <label className="text-xs text-neutral-400">Avatar Image URL</label>
                <input 
                  type="url"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400">Display Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-neutral-400">Username (@handle)</label>
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)} 
                  required
                  className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                />
              </div>
            </div>

            {isCreator && (
              <>
                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Bio & Introduction</label>
                  <textarea 
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Category</label>
                    <input 
                      type="text"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-neutral-400">Video Call Rate ($/min)</label>
                    <input 
                      type="number"
                      step="0.5"
                      value={videoCallPrice}
                      onChange={(e) => setVideoCallPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#18181c] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#d4af37]"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-[#27272a]">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-5 py-2 text-xs font-semibold bg-[#d4af37] hover:bg-[#e5c07b] text-black rounded-xl transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const PaymentMethodsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [methods, setMethods] = useState([
    { id: '1', type: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
    { id: '2', type: 'Mastercard', last4: '8812', exp: '09/27', isDefault: false },
    { id: '3', type: 'Crypto Wallet (USDC/USDT)', last4: '0x8F9...3B1a', exp: 'Polygon ERC-20', isDefault: false }
  ]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardNumber) return;
    setMethods(prev => [
      ...prev,
      {
        id: String(Date.now()),
        type: 'Visa',
        last4: newCardNumber.slice(-4) || '9999',
        exp: newCardExpiry || '12/29',
        isDefault: false
      }
    ]);
    setShowAddForm(false);
    setNewCardNumber('');
    setNewCardExpiry('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-lg font-bold text-white">Payment Methods</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {methods.map(m => (
            <div key={m.id} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#22222a] flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-neutral-300" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-2">
                    <span>{m.type} •••• {m.last4}</span>
                    {m.isDefault && (
                      <span className="text-[10px] text-[#d4af37] bg-[#d4af37]/10 px-1.5 py-0.5 rounded">Default</span>
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400">Expires {m.exp}</div>
                </div>
              </div>
              <button 
                onClick={() => setMethods(prev => prev.filter(x => x.id !== m.id))}
                className="text-neutral-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                title="Remove method"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {showAddForm ? (
          <form onSubmit={handleAdd} className="space-y-3 p-3.5 bg-[#18181c]/80 border border-[#d4af37]/30 rounded-xl">
            <div className="text-xs font-semibold text-white">Add New Card</div>
            <input 
              type="text" 
              placeholder="Card Number (e.g. 4242 4242 4242 4242)"
              value={newCardNumber}
              onChange={(e) => setNewCardNumber(e.target.value)}
              required
              className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text" 
                placeholder="MM/YY"
                value={newCardExpiry}
                onChange={(e) => setNewCardExpiry(e.target.value)}
                required
                className="bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
              <input 
                type="text" 
                placeholder="CVC"
                required
                className="bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button 
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-neutral-400"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold bg-[#d4af37] text-black rounded-lg"
              >
                Save Card
              </button>
            </div>
          </form>
        ) : (
          <button 
            onClick={() => setShowAddForm(true)}
            className="w-full py-2.5 border border-dashed border-[#27272a] hover:border-[#d4af37]/50 rounded-xl text-xs font-medium text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#d4af37]" />
            <span>Add New Payment Method</span>
          </button>
        )}

        <div className="p-3 bg-[#16161b] rounded-xl flex items-start gap-2.5 text-[11px] text-neutral-400">
          <Shield className="w-4 h-4 text-[#d4af37] shrink-0 mt-0.5" />
          <span>PCI-DSS Level 1 Encrypted. 256-bit tokenization prevents storing raw card credentials.</span>
        </div>
      </div>
    </div>
  );
};

export const SubscriptionManagementModal: React.FC<{ 
  onClose: () => void;
  onExploreCreators: () => void;
}> = ({ onClose, onExploreCreators }) => {
  const { subscriptions, creators, cancelSubscription } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-lg font-bold text-white">Subscription Management</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {subscriptions.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-neutral-400 text-xs">You have no active creator subscriptions.</p>
              <button 
                onClick={() => { onClose(); onExploreCreators(); }}
                className="px-4 py-2 bg-[#d4af37] text-black text-xs font-semibold rounded-xl"
              >
                Discover Creators
              </button>
            </div>
          ) : (
            subscriptions.map(sub => {
              const creator = creators.find(c => c.id === sub.creatorId);
              return (
                <div key={sub.id} className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={creator?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'} 
                      alt={creator?.name || 'Creator'} 
                      className="w-10 h-10 rounded-full object-cover border border-[#d4af37]/40"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white">{creator?.name || 'Creator'}</div>
                      <div className="text-[11px] text-[#d4af37]">{sub.tierName} Tier · ${sub.monthlyPrice.toFixed(2)}/mo</div>
                      <div className="text-[10px] text-neutral-500">Renews on {sub.nextRenewalDate}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {sub.status === 'active' ? (
                      <button 
                        onClick={() => {
                          if (confirm(`Cancel renewal for ${creator?.name}? You keep access until ${sub.nextRenewalDate}.`)) {
                            cancelSubscription(sub.id);
                          }
                        }}
                        className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-400 hover:bg-[#222] rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel Auto-Renew
                      </button>
                    ) : (
                      <span className="text-[11px] text-neutral-500 font-medium">Cancelled</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-[#27272a] flex justify-between items-center text-xs text-neutral-400">
          <span>Active Subscriptions: {subscriptions.filter(s => s.status === 'active').length}</span>
          <button onClick={onClose} className="text-[#fce7b0] hover:underline cursor-pointer">Done</button>
        </div>
      </div>
    </div>
  );
};

export const PurchaseHistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { purchases, transactions } = useApp();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-lg font-bold text-white">Purchase & Transaction History</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {transactions.map(t => (
            <div key={t.id} className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between text-xs">
              <div>
                <div className="font-semibold text-white capitalize">{t.description || t.type.replace('_', ' ')}</div>
                <div className="text-[10px] text-neutral-500">{t.createdAt} · ID: {t.id}</div>
              </div>
              <div className="text-right">
                <div className={`font-mono font-bold ${t.type.includes('tip_received') || t.type.includes('deposit') ? 'text-emerald-400' : 'text-neutral-200'}`}>
                  {t.type.includes('tip_received') || t.type.includes('deposit') ? '+' : '-'}${t.amount.toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-400 capitalize">{t.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-[#27272a] text-right">
          <button onClick={onClose} className="px-4 py-1.5 text-xs bg-[#22222a] hover:bg-[#2b2b35] text-white rounded-lg transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<{
  onClose: () => void;
  initialTab?: 'language' | 'personalization' | 'general';
}> = ({ onClose, initialTab = 'language' }) => {
  const {
    creators,
    fanInterestProfiles,
    activeRecommendationFanId,
    activeFanInterestProfile,
    switchRecommendationFanPersona,
    updateFanCategoryPreference,
    unhideCreatorForFan,
    resetFanRecommendations,
    appearanceMode,
    resolvedColorMode,
    setAppearanceMode,
    activeBrandingTheme,
    supportedLanguages,
    activeLanguageCode,
    activeLanguageMeta,
    languagePreferenceMode,
    detectedDeviceLanguage,
    simulatedBrowserLocale,
    setSimulatedBrowserLocale,
    setUserLanguagePreference,
    t
  } = useApp();

  const [activeTab, setActiveTab] = useState<'language' | 'personalization' | 'general'>(initialTab);
  const [languageSearch, setLanguageSearch] = useState('');
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [currency, setCurrency] = useState('USD ($)');
  const [saved, setSaved] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const enabledLanguages = supportedLanguages.filter(l => l.enabled);
  const filteredLanguages = enabledLanguages.filter(lang => {
    const q = languageSearch.trim().toLowerCase();
    if (!q) return true;
    return (
      lang.nativeName.toLowerCase().includes(q) ||
      lang.englishName.toLowerCase().includes(q) ||
      lang.code.toLowerCase().includes(q) ||
      lang.regionLabel.toLowerCase().includes(q)
    );
  });

  const allInterestCategories = [
    'Fitness & Bodybuilding',
    'Photography & Cinematography',
    'Culinary Arts & Gourmet',
    'Tech & Software Development',
    'Fashion & Luxury'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white">
              Account, Language &amp; Feed Settings
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Sub-Tabs (Language / اللغة, Feed Personalization, Security & Preferences) */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#18181c] border border-[#27272a] rounded-xl text-xs shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('language')}
            className={`py-2 px-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'language'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate" data-no-translate="true">Language / اللغة</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personalization')}
            className={`py-2 px-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'personalization'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Personalization</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`py-2 px-2 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'general'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Preferences</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {activeTab === 'language' ? (
            <>
              {/* Active Language & RTL/LTR Status Card */}
              <div className="p-3.5 bg-[#18181c] border border-[#d4af37]/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#d4af37]" data-no-translate="true">
                    Profile → Settings → Language / اللغة
                  </div>
                  <div className="text-sm font-bold text-white flex items-center gap-2">
                    <span data-no-translate="true">{activeLanguageMeta.nativeName}</span>
                    <span className="text-neutral-400 font-normal">({activeLanguageMeta.englishName})</span>
                  </div>
                  <div className="text-[11px] text-neutral-400">
                    Saved to your account · Automatically applies across all sessions and devices
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 rounded-lg bg-[#121215] border border-[#27272a] font-mono text-[10px] text-[#fce7b0] uppercase">
                    {activeLanguageMeta.dir.toUpperCase()} Layout
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 font-mono text-[10px] text-emerald-300 capitalize">
                    {languagePreferenceMode} Mode
                  </span>
                </div>
              </div>

              {/* 3 Language Preference Modes: Automatic, Manual, English */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2.5">
                <div className="font-semibold text-white">
                  Language Selection Mode
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setUserLanguagePreference('automatic')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      languagePreferenceMode === 'automatic'
                        ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold'
                        : 'bg-[#121215] text-neutral-300 hover:text-white border-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Automatic</span>
                      {languagePreferenceMode === 'automatic' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`text-[10px] leading-snug ${languagePreferenceMode === 'automatic' ? 'text-black/80' : 'text-neutral-400'}`}>
                      Follow device or browser language ({detectedDeviceLanguage.matchedLanguageCode.toUpperCase()})
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserLanguagePreference('manual', activeLanguageCode)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      languagePreferenceMode === 'manual'
                        ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold'
                        : 'bg-[#121215] text-neutral-300 hover:text-white border-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Manual</span>
                      {languagePreferenceMode === 'manual' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`text-[10px] leading-snug ${languagePreferenceMode === 'manual' ? 'text-black/80' : 'text-neutral-400'}`}>
                      Always use your chosen language across devices
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setUserLanguagePreference('english', 'en')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer space-y-1 ${
                      languagePreferenceMode === 'english'
                        ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold'
                        : 'bg-[#121215] text-neutral-300 hover:text-white border-[#27272a]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold" data-no-translate="true">English</span>
                      {languagePreferenceMode === 'english' && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`text-[10px] leading-snug ${languagePreferenceMode === 'english' ? 'text-black/80' : 'text-neutral-400'}`}>
                      Explicitly lock platform to English (LTR)
                    </div>
                  </button>
                </div>
              </div>

              {/* Searchable 19-Language Selector */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <Languages className="w-4 h-4 text-[#d4af37]" />
                    <span data-no-translate="true">Select Language / اختر اللغة ({enabledLanguages.length})</span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    Instant switch · RTL &amp; LTR supported
                  </span>
                </div>

                {/* Search Box */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={languageSearch}
                    onChange={(e) => setLanguageSearch(e.target.value)}
                    placeholder={t('settings.search_languages', 'Search 19 languages by native or English name...')}
                    className="w-full bg-[#121215] border border-[#27272a] focus:border-[#d4af37] rounded-xl pl-8 pr-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                {/* Language Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {filteredLanguages.map(lang => {
                    const isSelected = activeLanguageCode === lang.code;
                    return (
                      <button
                        key={lang.code}
                        type="button"
                        onClick={() => setUserLanguagePreference('manual', lang.code)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#d4af37]/15 border-[#d4af37] text-white'
                            : 'bg-[#121215] border-[#25252e] hover:border-[#383842] text-neutral-300'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-white flex items-center gap-1.5">
                            <span data-no-translate="true">{lang.nativeName}</span>
                            {lang.dir === 'rtl' && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#d4af37]/20 text-[#fce7b0]">
                                RTL
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-neutral-400 truncate" data-no-translate="true">
                            {lang.englishName} · {lang.code}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#d4af37] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Automatic Device Language Detection Simulator & Regional Formatting Preview */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">
                    Device / Browser Language Detection
                  </span>
                  <span className="text-[10px] font-mono text-[#fce7b0]" data-no-translate="true">
                    Detected: {detectedDeviceLanguage.detectedRawLocale} → {detectedDeviceLanguage.matchedLanguageCode.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400">
                  When <strong>Automatic</strong> mode is active, ACOVON detects your phone or browser language and falls back to English if unsupported. Test device locale detection below:
                </p>
                <div className="flex flex-wrap gap-1.5" data-no-translate="true">
                  {[
                    { label: 'Real Browser Default', locale: '' },
                    { label: 'Phone: Arabic (ar-SA)', locale: 'ar-SA' },
                    { label: 'Phone: French (fr-FR)', locale: 'fr-FR' },
                    { label: 'Phone: Spanish (es-ES)', locale: 'es-ES' },
                    { label: 'Phone: Urdu (ur-PK)', locale: 'ur-PK' },
                    { label: 'Unsupported (fi-FI → EN)', locale: 'fi-FI' }
                  ].map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setSimulatedBrowserLocale(preset.locale);
                        setUserLanguagePreference('automatic');
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-medium cursor-pointer transition-colors ${
                        simulatedBrowserLocale === preset.locale && languagePreferenceMode === 'automatic'
                          ? 'bg-[#d4af37] text-black border-[#d4af37] font-bold'
                          : 'bg-[#121215] text-neutral-300 border-[#27272a] hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Localized Formatting Preview */}
                <div className="pt-2 border-t border-[#27272a] grid grid-cols-3 gap-2 text-[10px]">
                  <div className="p-2 rounded-lg bg-[#121215] border border-[#25252e]">
                    <div className="text-neutral-400">Localized Date</div>
                    <div className="font-semibold text-white mt-0.5" data-no-translate="true">
                      {formatLocalizedDate(new Date(), activeLanguageMeta.localeTag)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121215] border border-[#25252e]">
                    <div className="text-neutral-400">Number Format</div>
                    <div className="font-semibold text-white mt-0.5" data-no-translate="true">
                      {formatLocalizedNumber(148250.75, activeLanguageMeta.localeTag)}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#121215] border border-[#25252e]">
                    <div className="text-neutral-400">Payment Currency</div>
                    <div className="font-semibold text-[#fce7b0] mt-0.5" data-no-translate="true">
                      {formatLocalizedCurrency(29.99, activeLanguageMeta.localeTag, 'USD')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'personalization' ? (
            <>
              {/* Active Fan Persona Selector */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Active Fan Interest Profile</span>
                  <span className="text-[10px] font-mono text-[#d4af37]">{activeFanInterestProfile.personaLabel}</span>
                </div>
                <select
                  value={activeRecommendationFanId}
                  onChange={(e) => switchRecommendationFanPersona(e.target.value)}
                  className="w-full bg-[#121215] border border-[#2e2e38] rounded-lg px-3 py-2 text-xs text-white"
                >
                  {Object.values(fanInterestProfiles).map(prof => (
                    <option key={prof.fanId} value={prof.fanId}>
                      {prof.fanName} — {prof.personaLabel}
                    </option>
                  ))}
                </select>
              </div>

              {/* Interest Categories Management (Boost, Reduce, Remove) */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Inferred Interest Categories</div>
                    <div className="text-[11px] text-neutral-400">
                      Boost topics you love or reduce/remove categories from your For You &amp; Free Posts feeds
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {allInterestCategories.map(cat => {
                    const score = Math.round(activeFanInterestProfile.categoryScores[cat] || 0);
                    return (
                      <div
                        key={cat}
                        className="p-2.5 bg-[#121215] border border-[#25252e] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-semibold text-neutral-200">{cat}</div>
                          <div className="text-[10px] font-mono text-[#fce7b0]">
                            Affinity Score: {score} pts
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateFanCategoryPreference(cat, 'boost')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/70 border border-emerald-500/30 text-emerald-300 text-[10px] font-semibold cursor-pointer"
                          >
                            + Boost
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFanCategoryPreference(cat, 'reduce')}
                            className="px-2.5 py-1 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 border border-amber-500/30 text-amber-300 text-[10px] font-semibold cursor-pointer"
                          >
                            - Reduce
                          </button>
                          <button
                            type="button"
                            onClick={() => updateFanCategoryPreference(cat, 'remove')}
                            className="px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/30 text-rose-300 text-[10px] font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Hidden Creators Management */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-2.5">
                <div className="font-semibold text-white">Hidden Creators ({(activeFanInterestProfile.hiddenCreatorIds || []).length})</div>
                {(activeFanInterestProfile.hiddenCreatorIds || []).length === 0 ? (
                  <p className="text-[11px] text-neutral-400">
                    You have not hidden any creators from your personalized recommendations.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {(activeFanInterestProfile.hiddenCreatorIds || []).map(cid => {
                      const creatorObj = creators.find(c => c.id === cid);
                      return (
                        <div
                          key={cid}
                          className="p-2 bg-[#121215] border border-[#25252e] rounded-lg flex items-center justify-between"
                        >
                          <span className="text-neutral-200 font-medium">{creatorObj?.name || cid}</span>
                          <button
                            type="button"
                            onClick={() => unhideCreatorForFan(cid)}
                            className="px-2.5 py-1 rounded bg-[#d4af37]/20 border border-[#d4af37]/40 text-[#fce7b0] text-[10px] font-semibold cursor-pointer"
                          >
                            Unhide Creator
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reset Personalized Recommendations */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between gap-3">
                <div>
                  <div className="font-semibold text-white">Reset Personalized Recommendations</div>
                  <div className="text-[11px] text-neutral-400">
                    Clear learned watch history scores, Not Interested flags, and hidden creators to start fresh
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetFanRecommendations();
                    setResetSuccessToast(true);
                    setTimeout(() => setResetSuccessToast(false), 2500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900/70 border border-rose-500/40 text-rose-200 font-semibold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{resetSuccessToast ? 'Reset Complete ✓' : 'Reset Engine'}</span>
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Appearance Mode (Light Mode / Dark Mode / System Default) */}
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">Display Appearance Mode</div>
                    <div className="text-[11px] text-neutral-400">
                      Choose Light Mode, Dark Mode, or follow your device System Default ({activeBrandingTheme.name})
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-[#d4af37] uppercase px-2 py-0.5 rounded bg-[#121215] border border-[#27272a]">
                    {appearanceMode === 'system' ? `System (${resolvedColorMode})` : appearanceMode}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setAppearanceMode('dark')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      appearanceMode === 'dark'
                        ? 'bg-[#d4af37] text-black border-[#d4af37]'
                        : 'bg-[#121215] text-neutral-300 hover:text-white border-[#27272a]'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppearanceMode('light')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      appearanceMode === 'light'
                        ? 'bg-[#d4af37] text-black border-[#d4af37]'
                        : 'bg-[#121215] text-neutral-300 hover:text-white border-[#27272a]'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light Mode</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAppearanceMode('system')}
                    className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      appearanceMode === 'system'
                        ? 'bg-[#d4af37] text-black border-[#d4af37]'
                        : 'bg-[#121215] text-neutral-300 hover:text-white border-[#27272a]'
                    }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span>System Default</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Email &amp; Push Notifications</div>
                  <div className="text-[11px] text-neutral-400">Receive alerts for new tips, calls, and messages</div>
                </div>
                <input 
                  type="checkbox"
                  checked={emailNotifs}
                  onChange={(e) => setEmailNotifs(e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#18181c] rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">Two-Factor Authentication (2FA)</div>
                  <div className="text-[11px] text-neutral-400">Secure wallet payouts and profile changes</div>
                </div>
                <input 
                  type="checkbox"
                  checked={twoFactor}
                  onChange={(e) => setTwoFactor(e.target.checked)}
                  className="w-4 h-4 accent-[#d4af37] cursor-pointer"
                />
              </div>

              <div className="p-3 bg-[#18181c] rounded-xl space-y-1.5">
                <label className="font-semibold text-white block">Preferred Display Currency</label>
                <select 
                  value={currency} 
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
                >
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                  <option>GBP (£)</option>
                  <option>CAD ($)</option>
                  <option>USDC (Crypto)</option>
                </select>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a] shrink-0">
          <button onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 cursor-pointer">Cancel</button>
          <button 
            onClick={() => {
              setSaved(true);
              setTimeout(() => {
                setSaved(false);
                onClose();
              }, 600);
            }} 
            className="px-4 py-2 text-xs font-semibold bg-[#d4af37] text-black rounded-xl cursor-pointer"
          >
            {saved ? 'Saved!' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};

export const PrivacyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [watermarking, setWatermarking] = useState(true);
  const [anonymousBrowsing, setAnonymousBrowsing] = useState(false);
  const [dmPermission, setDmPermission] = useState('subscribers_only');

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-lg font-bold text-white">Privacy & Safety</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-[#18181c] rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Dynamic DRM Watermarking</div>
              <div className="text-[11px] text-neutral-400">Embed viewer ID watermark on private photos & videos</div>
            </div>
            <input 
              type="checkbox"
              checked={watermarking}
              onChange={(e) => setWatermarking(e.target.checked)}
              className="w-4 h-4 accent-[#d4af37] cursor-pointer"
            />
          </div>

          <div className="p-3 bg-[#18181c] rounded-xl flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">Stealth Fan Browsing</div>
              <div className="text-[11px] text-neutral-400">Hide online indicator status from live viewer lists</div>
            </div>
            <input 
              type="checkbox"
              checked={anonymousBrowsing}
              onChange={(e) => setAnonymousBrowsing(e.target.checked)}
              className="w-4 h-4 accent-[#d4af37] cursor-pointer"
            />
          </div>

          <div className="p-3 bg-[#18181c] rounded-xl space-y-1.5">
            <label className="font-semibold text-white block">Direct Message Inbound Policy</label>
            <select 
              value={dmPermission} 
              onChange={(e) => setDmPermission(e.target.value)}
              className="w-full bg-[#121215] border border-[#27272a] rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="all">Allow all users (Standard PPV pricing)</option>
              <option value="subscribers_only">Subscribers only</option>
              <option value="paid_requests_only">Paid message requests only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#27272a]">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold bg-[#d4af37] text-black rounded-xl">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export const HelpCenterModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const faqs = [
    { q: 'How do payouts work for creators?', a: 'Creators keep 80% of subscriptions, PPV sales, live gifts, and custom requests. Payouts can be requested via Direct Bank ACH or Crypto USDC.' },
    { q: 'How does Paid Video Calling charge viewers?', a: 'Billing begins only after the creator accepts the call. Charges accrue dynamically per minute at the creator rate and stop instantly upon disconnect.' },
    { q: 'What are Highlight Clips in Acovon Live?', a: 'Viewers can click "Create Clip" during any ongoing livestream to automatically save the last 30 seconds into the creator\'s content gallery.' },
    { q: 'Can I remove platform ads?', a: 'Yes! Subscribing to any creator or activating the Ad-Free VIP membership removes all promotional banner and interstitial ads.' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#d4af37]" />
            <h3 className="font-brand text-lg font-bold text-white">Acovon Help Center & Academy</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
          {faqs.map((f, i) => (
            <div key={i} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-1 text-xs">
              <div className="font-semibold text-[#fce7b0]">{f.q}</div>
              <div className="text-neutral-400 leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#1a1a20] rounded-xl flex items-center justify-between text-xs">
          <span className="text-neutral-300">Need immediate creator support?</span>
          <span className="text-[#d4af37] font-semibold">support@acovon.com</span>
        </div>
      </div>
    </div>
  );
};
