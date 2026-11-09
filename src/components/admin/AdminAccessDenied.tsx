import React from 'react';
import { ShieldAlert, Lock, ArrowLeft, LogIn } from 'lucide-react';

interface AdminAccessDeniedProps {
  onNavigateHome: () => void;
  onNavigateToLogin: () => void;
}

export const AdminAccessDenied: React.FC<AdminAccessDeniedProps> = ({
  onNavigateHome,
  onNavigateToLogin
}) => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-[#101014] border border-rose-500/30 shadow-2xl rounded-2xl p-8 text-center space-y-6 animate-in zoom-in-95">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-center justify-center mx-auto text-rose-400 shadow-lg">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-mono font-semibold uppercase">
            <Lock className="w-3.5 h-3.5" />
            <span>403 Restricted Route</span>
          </div>
          <h1 className="text-xl font-bold font-brand text-white">Administrative Access Required</h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            The ACOVON Admin Control Center is restricted to authenticated system administrators with verified Super Admin credentials. Fans, creators, and unauthorized sessions are strictly denied access.
          </p>
        </div>

        <div className="pt-2 space-y-2.5">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-3 bg-[#d4af37] hover:bg-[#e0bc45] text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#d4af37]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>Go to Admin Login</span>
          </button>
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full py-2.5 bg-[#18181f] hover:bg-[#23232c] text-neutral-300 text-xs font-medium rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Platform</span>
          </button>
        </div>
      </div>
    </div>
  );
};
