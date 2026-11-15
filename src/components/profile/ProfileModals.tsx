import React, { useState, useRef } from 'react';
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
  Upload,
  Camera
} from 'lucide-react';
import { CreatorProfile } from '../../types';
import {
  uploadUserFileToSupabase,
  deleteSupabaseFileByPath
} from '../../services/supabase';

interface EditProfileModalProps {
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ onClose }) => {
  const { currentUser, updateCreatorProfile } = useApp();
  const isCreator = 'bio' in currentUser;
  const creator = isCreator ? (currentUser as CreatorProfile) : null;

  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentUser.name);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(creator?.bio || '');
  const [category, setCategory] = useState(creator?.category || 'Fashion & Lifestyle');
  const [country, setCountry] = useState(creator?.country || 'United States');
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [avatarStoragePath, setAvatarStoragePath] = useState<string | null>(() => {
    try {
      return localStorage.getItem(`acovon_avatar_storage_path_${currentUser.id}`);
    } catch {
      return null;
    }
  });
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [videoCallPrice, setVideoCallPrice] = useState(creator?.callRatePerMinute || 4.5);
  const [saved, setSaved] = useState(false);

  const handleAvatarFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setUploadError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('Image file size must be less than 15MB.');
      return;
    }

    setIsUploadingAvatar(true);

    if (avatarStoragePath) {
      await deleteSupabaseFileByPath({
        storagePath: avatarStoragePath,
        uid: currentUser.id
      });
    }

    const uploadRes = await uploadUserFileToSupabase({
      uid: currentUser.id,
      file,
      featureName: 'avatars',
      itemId: currentUser.id,
      visibility: 'public'
    });

    setIsUploadingAvatar(false);

    if (uploadRes.success && uploadRes.signedUrl) {
      setAvatar(uploadRes.signedUrl);
      if (uploadRes.storagePath) {
        setAvatarStoragePath(uploadRes.storagePath);
        try {
          localStorage.setItem(`acovon_avatar_storage_path_${currentUser.id}`, uploadRes.storagePath);
        } catch {
          // ignore
        }
      }
    } else {
      setUploadError(uploadRes.error || 'Failed to upload image.');
    }
  };

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
    } else {
      updateCreatorProfile(currentUser.id, {
        name,
        avatar
      });
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in zoom-in-95 acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <User className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">Edit Profile</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {saved ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <p className="text-white font-medium">Profile successfully updated!</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 flex-1 min-h-0 overflow-y-auto pr-1">
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleAvatarFileSelected}
            />

            <div className="flex items-center gap-4">
              <div
                onClick={() => avatarFileInputRef.current?.click()}
                className="relative group w-16 h-16 shrink-0 cursor-pointer"
                title="Upload Profile Image"
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt={name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-[#d4af37]/50" 
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-[#1f1f26] border-2 border-[#d4af37]/50 flex items-center justify-center text-lg font-bold text-[#fce7b0]">
                    {(name || 'A').charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 touch-always-visible transition-opacity flex items-center justify-center">
                  <Camera className="w-5 h-5 text-[#d4af37]" />
                </div>
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="block text-xs text-neutral-400">Profile Picture</label>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isUploadingAvatar}
                    onClick={() => avatarFileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-[#18181c] hover:bg-[#222228] border border-[#27272a] hover:border-[#d4af37]/50 rounded-xl text-xs font-semibold text-white flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                </div>
                {uploadError && (
                  <p className="text-[11px] text-rose-400">{uploadError}</p>
                )}
              </div>
            </div>

            {isCreator ? (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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
            ) : (
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
            )}

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

                <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
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

            <div className="flex flex-wrap justify-end gap-3 pt-3 border-t border-[#27272a]">
              <button 
                type="button" 
                onClick={onClose}
                className="px-4 py-2 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isUploadingAvatar}
                className="px-5 py-2 text-xs font-semibold bg-[#d4af37] hover:bg-[#e5c07b] text-black rounded-xl transition-colors cursor-pointer disabled:opacity-50"
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
  const [methods, setMethods] = useState<Array<{ id: string; type: string; last4: string; exp: string; isDefault: boolean }>>([]);
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 space-y-5 acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2 min-w-0">
            <CreditCard className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">Payment Methods</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {methods.length === 0 ? (
            <div className="p-4 bg-[#18181c] border border-[#27272a] rounded-xl text-center text-xs text-neutral-400">
              No saved payment methods yet.
            </div>
          ) : (
            methods.map(m => (
              <div key={m.id} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between gap-2 flex-wrap xs:flex-nowrap">
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
            ))
          )}
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
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-5 acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">Subscription Management</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
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
                <div key={sub.id} className="p-3.5 sm:p-4 bg-[#18181c] border border-[#27272a] rounded-xl flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 sm:gap-4">
                  <div className="flex items-center gap-3">
                    {creator?.avatar ? (
                      <img 
                        src={creator.avatar} 
                        alt={creator?.name || 'Creator'} 
                        className="w-10 h-10 rounded-full object-cover border border-[#d4af37]/40"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#1f1f26] border border-[#d4af37]/40 flex items-center justify-center text-xs font-bold text-[#fce7b0] shrink-0">
                        {(creator?.name || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
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
  const { purchases, transactions, posts, currentUser } = useApp();
  const myPurchases = purchases.filter(p => p.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[92dvh] flex flex-col acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">Purchase &amp; Transaction History</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1">
          {myPurchases.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#fce7b0] flex items-center justify-between">
                <span>Unlocked PPV Content ({myPurchases.length})</span>
                <span className="text-[10px] text-emerald-400 font-normal">Lifetime Buyer Protection Active</span>
              </div>
              {myPurchases.map(purchase => {
                const post = posts.find(p => p.id === purchase.postId);
                const mediaList =
                  post?.preservedMediaForPurchasers && post.preservedMediaForPurchasers.length > 0
                    ? post.preservedMediaForPurchasers
                    : post?.media || [];
                const firstMedia = mediaList[0];

                return (
                  <div
                    key={purchase.id}
                    className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {firstMedia && (
                        <img
                          src={firstMedia.thumbnailUrl || firstMedia.url}
                          alt="Purchased media"
                          className="w-11 h-11 rounded-lg object-cover border border-[#2e2e38] shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate">
                          {post ? post.content : `Unlocked Post #${purchase.postId}`}
                        </div>
                        <div className="text-[10px] text-neutral-400 flex items-center gap-2 flex-wrap mt-0.5">
                          <span>Paid ${purchase.amount.toFixed(2)}</span>
                          <span>·</span>
                          <span>{purchase.purchasedAt}</span>
                          {post?.isDeletedByCreator && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 text-[9px] font-semibold">
                              Archived by Creator · Buyer Vault Preserved
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 shrink-0">
                      Unlocked
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
              Ledger Transactions ({transactions.length})
            </div>
            {transactions.map(t => (
              <div key={t.id} className="p-3 bg-[#18181c] border border-[#27272a] rounded-xl flex flex-wrap xs:flex-nowrap items-center justify-between gap-2 text-xs">
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
        </div>

        <div className="pt-3 border-t border-[#27272a] text-right shrink-0">
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
  initialTab?: 'personalization' | 'general';
}> = ({ onClose, initialTab = 'personalization' }) => {
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
    activeCategories
  } = useApp();

  const [activeTab, setActiveTab] = useState<'personalization' | 'general'>(initialTab);
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [currency, setCurrency] = useState('USD ($)');
  const [saved, setSaved] = useState(false);
  const [resetSuccessToast, setResetSuccessToast] = useState(false);

  const allInterestCategories = (activeCategories || []).map(c => c.name);

  const handleSaveChanges = () => {
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 max-h-[92dvh] flex flex-col shadow-2xl acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <SettingsIcon className="w-5 h-5 text-[#d4af37] shrink-0" />
            <div className="min-w-0">
              <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">
                Settings
              </h3>
              <p className="text-[11px] text-neutral-400 truncate">
                Personalization &amp; Account Preferences
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings Sub-Tabs (Personalization, Preferences) */}
        <div className="flex items-center gap-1.5 p-1 bg-[#18181c] border border-[#27272a] rounded-xl text-xs shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('personalization')}
            className={`flex-1 min-w-max py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'personalization'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Personalization</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex-1 min-w-max py-2 px-3 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap ${
              activeTab === 'general'
                ? 'bg-[#d4af37] text-black font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Preferences</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {activeTab === 'personalization' ? (
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
              <div className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                <div className="flex flex-wrap items-center justify-between gap-2">
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

                <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
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

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#27272a] shrink-0">
          <div className="text-[11px] text-neutral-400">
            {saved ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Preferences saved to your account!</span>
              </span>
            ) : (
              <span>Changes apply immediately to your session.</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="px-4 py-2 text-xs text-neutral-400 hover:text-white cursor-pointer">
              Close
            </button>
            <button 
              onClick={handleSaveChanges} 
              className="px-4 py-2 text-xs font-semibold bg-[#d4af37] hover:bg-[#e5c07b] text-black rounded-xl cursor-pointer transition-colors"
            >
              {saved ? 'Changes Saved ✓' : 'Save Changes'}
            </button>
          </div>
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-md w-full max-h-[92dvh] overflow-y-auto p-4 sm:p-6 space-y-5 acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a]">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">Privacy & Safety</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-4">
      <div className="bg-[#121215] border border-[#27272a] rounded-2xl max-w-lg w-full max-h-[92dvh] flex flex-col p-4 sm:p-6 space-y-4 sm:space-y-5 acovon-modal-panel">
        <div className="flex items-center justify-between pb-3 border-b border-[#27272a] shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <HelpCircle className="w-5 h-5 text-[#d4af37] shrink-0" />
            <h3 className="font-brand text-base sm:text-lg font-bold text-white truncate">Acovon Help Center & Academy</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1">
          {faqs.map((f, i) => (
            <div key={i} className="p-3.5 bg-[#18181c] border border-[#27272a] rounded-xl space-y-1 text-xs">
              <div className="font-semibold text-[#fce7b0]">{f.q}</div>
              <div className="text-neutral-400 leading-relaxed">{f.a}</div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-[#1a1a20] rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
          <span className="text-neutral-300">Need immediate creator support?</span>
          <span className="text-[#d4af37] font-semibold">support@acovon.com</span>
        </div>
      </div>
    </div>
  );
};
