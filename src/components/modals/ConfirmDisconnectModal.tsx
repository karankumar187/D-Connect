'use client';

import React from 'react';
import { SafeDiscordAccount } from '@/lib/types';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface ConfirmDisconnectModalProps {
  account: SafeDiscordAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDisconnecting: boolean;
}

export function ConfirmDisconnectModal({
  account,
  isOpen,
  onClose,
  onConfirm,
  isDisconnecting,
}: ConfirmDisconnectModalProps) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#2B2D31] border border-[#3F4147] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#3F4147]/50">
          <div className="flex items-center gap-2.5 text-rose-400">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <h3 className="font-bold text-base text-white">Disconnect Account</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-[#1E1F22] rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#1E1F22] rounded-2xl border border-[#3F4147]/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={account.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
              alt={account.username}
              className="w-10 h-10 rounded-xl object-cover"
            />
            <div className="overflow-hidden">
              <p className="font-semibold text-white text-sm truncate">
                {account.globalName || account.username}
              </p>
              <p className="text-xs text-zinc-400 font-mono">@{account.username}</p>
            </div>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to disconnect this Discord account from the dashboard?
            Stored OAuth tokens and synchronization logs for this account will be removed.
            Other connected accounts will remain unaffected.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              onClick={onClose}
              disabled={isDisconnecting}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white bg-[#1E1F22] hover:bg-[#313338] rounded-xl border border-[#3F4147]/60 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDisconnecting}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-md shadow-rose-600/20 disabled:opacity-50"
            >
              <Trash2 size={14} />
              <span>{isDisconnecting ? 'Disconnecting...' : 'Disconnect Account'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
