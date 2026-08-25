'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddAccountModal({ isOpen, onClose, onSuccess }: AddAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConnectOfficial = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/discord/connect', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to start Discord authorization');
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.message || 'Discord OAuth2 is not configured on server.');
        setLoading(false);
      }
    } catch {
      setError('Network error connecting to authentication server.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141518] border border-[#22242A] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#22242A]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#7C3AED]/20 text-[#A855F7] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Connect Account</h3>
              <p className="text-xs text-zinc-400">Official Discord OAuth2</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#1A1B20] rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-rose-400 text-xs leading-relaxed">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Security & Flow Highlights */}
          <div className="bg-[#1A1B20] border border-[#22242A] rounded-2xl p-4 space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
              <span>100% Policy-Compliant</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              You will be securely redirected to Discord&apos;s official authorization page
              (<span className="font-mono text-zinc-300">discord.com/oauth2</span>).
            </p>
            <ul className="space-y-1.5 text-[11px] text-zinc-400 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                Zero passwords or user tokens requested.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                OAuth credentials encrypted server-side with AES-256-GCM.
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                Connect and manage all your accounts independently.
              </li>
            </ul>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnectOfficial}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-3.5 px-4 rounded-full shadow-xl transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                <span>Authorize with Discord</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
