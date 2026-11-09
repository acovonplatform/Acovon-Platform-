import React from 'react';
import { Shield, Lock, Award, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#f4f1ea] dark:bg-[#09090b] border-t border-stone-200 dark:border-[#1f1f23] text-stone-600 dark:text-neutral-400 text-xs py-12 px-6 lg:px-12 mt-16 transition-colors">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        
        {/* Brand Column */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-br from-[#d4af37] to-[#7a6114] flex items-center justify-center">
              <span className="font-brand text-black font-bold text-sm">A</span>
            </div>
            <span className="font-brand text-lg font-bold tracking-widest text-stone-900 dark:text-white">ACOVON</span>
          </div>
          <p className="text-neutral-400 max-w-sm text-xs leading-relaxed">
            Where Creators Monetize Their Influence. The premier global platform for creator subscriptions, exclusive vault media, paid private video calls, and personalized video commissions.
          </p>
          <div className="flex items-center gap-4 text-xs text-neutral-500 pt-2">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Strict 18+ Identity Verification</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Escrow Payment Protection</span>
            </div>
          </div>
        </div>

        {/* Column 2: Platform */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200">Platform</div>
          <ul className="space-y-2">
            <li><button onClick={() => onNavigate('explore')} className="hover:text-white transition-colors cursor-pointer">Explore Creators</button></li>
            <li><button onClick={() => onNavigate('feed')} className="hover:text-white transition-colors cursor-pointer">Live Feed</button></li>
            <li><button onClick={() => onNavigate('requests')} className="hover:text-white transition-colors cursor-pointer">Custom Video Requests</button></li>
            <li><button onClick={() => onNavigate('pricing')} className="hover:text-white transition-colors cursor-pointer">Pricing & Monetization</button></li>
          </ul>
        </div>

        {/* Column 3: Creators */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200">Creators</div>
          <ul className="space-y-2">
            <li><button onClick={() => onNavigate('creator-studio')} className="hover:text-white transition-colors cursor-pointer">Creator Studio</button></li>
            <li><button onClick={() => onNavigate('become-creator')} className="hover:text-white transition-colors cursor-pointer">Become a Creator</button></li>
            <li><button onClick={() => onNavigate('earnings-calculator')} className="hover:text-white transition-colors cursor-pointer">Earnings Calculator</button></li>
            <li><button onClick={() => onNavigate('payout-terms')} className="hover:text-white transition-colors cursor-pointer">Payout Policies</button></li>
          </ul>
        </div>

        {/* Column 4: Trust & Legal */}
        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-200">Safety & Trust</div>
          <ul className="space-y-2">
            <li><button onClick={() => onNavigate('community-guidelines')} className="hover:text-white transition-colors cursor-pointer">Community Guidelines</button></li>
            <li><button onClick={() => onNavigate('verification-rules')} className="hover:text-white transition-colors cursor-pointer">Age & ID Verification</button></li>
            <li><button onClick={() => onNavigate('terms')} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button></li>
            <li><button onClick={() => onNavigate('privacy')} className="hover:text-white transition-colors cursor-pointer">Privacy & GDPR</button></li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('admin-login')}
                className="text-stone-500 dark:text-neutral-500 hover:text-stone-900 dark:hover:text-neutral-200 transition-colors cursor-pointer flex items-center gap-1.5 pt-1"
                title="ACOVON Platform Administration Portal"
              >
                <Lock className="w-3 h-3 text-[#d4af37]/80" />
                <span>Admin Login</span>
              </button>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-[#1f1f23] flex flex-col sm:flex-row items-center justify-between gap-4 text-neutral-500 text-[11px]">
        <div>© 2026 ACOVON International Inc. All rights reserved. Registered trademark.</div>
        <div className="flex items-center gap-5 flex-wrap">
          <span>Global Multi-Currency Settlements</span>
          <span aria-hidden="true">·</span>
          <span>End-to-End Escrow Protection</span>
          <span aria-hidden="true">·</span>
          <span>256-bit Encrypted Streams</span>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => onNavigate('admin-login')}
            className="hover:text-neutral-300 transition-colors cursor-pointer flex items-center gap-1 font-medium"
            title="Secure Administrator Access"
          >
            <Lock className="w-2.5 h-2.5 text-[#d4af37]" />
            <span>Admin Login</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
