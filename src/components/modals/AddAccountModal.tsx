'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddAccountModal({
  isOpen,
  onClose,
  onSuccess,
}: AddAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState(false);

  if (!isOpen) return null;

  const handleConnectOfficial = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/discord/connect', { method: 'POST' });
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (data.configured === false) {
          setError(
            'Discord Developer OAuth credentials are not configured in your .env file yet. You can use Demo Connect below to test, or add DISCORD_CLIENT_ID in settings.'
          );
        } else {
          setError(data.error || data.message || 'Failed to initialize Discord OAuth');
        }
        return;
      }

      // Redirect user to official Discord authorization page
      window.location.href = data.url;
    } catch (err: any) {
      setError(err.message || 'Network error connecting to Discord OAuth');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoAccount = async () => {
    setDemoLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/dev/demo-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to add demo account');
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add demo account');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#2B2D31] border border-[#3F4147] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#3F4147]/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Connect Discord Account
              </h3>
              <p className="text-xs text-zinc-400">Official OAuth2 Authorization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1E1F22] rounded-xl transition-colors"
          >
            <X size={18} />
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
          <div className="bg-[#1E1F22] border border-[#3F4147]/50 rounded-2xl p-4 space-y-2.5 text-xs text-zinc-300">
            <div className="flex items-center gap-2 text-zinc-200 font-semibold">
              <CheckCircle2 size={15} className="text-emerald-400" />
              <span>100% Official & Policy-Compliant</span>
            </div>
            <p className="text-zinc-400 leading-relaxed text-[11px]">
              You will be securely redirected to Discord&apos;s official authorization page
              (<span className="font-mono text-zinc-300">discord.com/oauth2</span>) to authorize access.
            </p>
            <ul className="space-y-1.5 text-[11px] text-zinc-400 pt-1">
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                Zero passwords or user tokens requested.
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                OAuth credentials encrypted server-side with AES-256-GCM.
              </li>
              <li className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#5865F2]" />
                Connect and manage all your accounts independently without limits.
              </li>
            </ul>
          </div>

          {/* Connect Button */}
          <button
            onClick={handleConnectOfficial}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-4 bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm rounded-xl shadow-lg shadow-[#5865F2]/25 transition-all disabled:opacity-50"
          >
            <ExternalLink size={16} />
            <span>{loading ? 'Redirecting to Discord...' : 'Authorize via Discord OAuth2'}</span>
          </button>

          {/* Demo Sandbox Option */}
          <div className="pt-2 border-t border-[#3F4147]/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#EB459E]" />
                <span>Development & Demo Mode</span>
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
              Want to test multi-account cards and features before setting up Discord Developer Portal keys?
            </p>
            <button
              onClick={handleCreateDemoAccount}
              disabled={demoLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#1E1F22] hover:bg-[#313338] text-zinc-200 border border-[#3F4147]/70 hover:border-[#5865F2]/50 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <span>{demoLoading ? 'Linking...' : '+ Connect Sample Account (Instant Demo)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
