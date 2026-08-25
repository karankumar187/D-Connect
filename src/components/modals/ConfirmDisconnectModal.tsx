'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { SafeDiscordAccount } from '@/lib/types';

interface ConfirmDisconnectModalProps {
  account: SafeDiscordAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDisconnecting?: boolean;
}

export function ConfirmDisconnectModal({
  account,
  isOpen,
  onClose,
  onConfirm,
  isDisconnecting = false,
}: ConfirmDisconnectModalProps) {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#141518] border border-[#22242A] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#22242A]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Disconnect Account</h3>
              <p className="text-xs text-zinc-400">Revoke OAuth & Data</p>
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
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-300 leading-relaxed">
            Are you sure you want to disconnect{' '}
            <strong className="text-white font-semibold">
              @{account.username}
            </strong>
            ?
          </p>

          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-xs text-rose-300 leading-relaxed space-y-1">
            <p className="font-semibold text-rose-400">What will happen:</p>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-rose-300/90 pt-1">
              <li>All encrypted access & refresh tokens will be deleted.</li>
              <li>Background synchronization for this account will stop.</li>
              <li>You can reconnect this account anytime via official OAuth.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isDisconnecting}
              className="px-5 py-2.5 rounded-full text-xs font-semibold text-zinc-300 hover:text-white bg-[#1A1B20] hover:bg-[#22242A] border border-[#22242A] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isDisconnecting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-600/20 disabled:opacity-50"
            >
              {isDisconnecting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Disconnect</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
