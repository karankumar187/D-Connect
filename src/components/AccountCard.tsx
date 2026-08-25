'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SafeDiscordAccount } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { NitroBadge } from './NitroBadge';
import {
  RefreshCw,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AccountCardProps {
  account: SafeDiscordAccount;
  onRefresh: (id: string) => Promise<void>;
  onDisconnect: (account: SafeDiscordAccount) => void;
  onReconnect?: (id: string) => Promise<void>;
  isRefreshing?: boolean;
}

export function AccountCard({
  account,
  onRefresh,
  onDisconnect,
  onReconnect,
  isRefreshing = false,
}: AccountCardProps) {
  const [copiedId, setCopiedId] = useState(false);
  const [localRefreshing, setLocalRefreshing] = useState(false);

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(account.discordUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRefreshClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLocalRefreshing(true);
    try {
      await onRefresh(account.id);
    } finally {
      setLocalRefreshing(false);
    }
  };

  const isBusy = isRefreshing || localRefreshing;
  const needsReauth =
    account.authorizationStatus === 'reauthorization_required' ||
    account.authorizationStatus === 'expired';

  const lastSyncText = account.lastSyncedAt
    ? `${formatDistanceToNow(new Date(account.lastSyncedAt), { addSuffix: true })}`
    : 'Never synced';

  return (
    <div className="flex flex-col justify-between bg-[#2B2D31] hover:bg-[#2e3035] border border-[#3F4147]/60 hover:border-[#5865F2]/40 rounded-2xl p-5 transition-all duration-200 shadow-md group">
      {/* Top Section: Avatar, Names & Badges */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={account.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={account.username}
                className="w-13 h-13 rounded-2xl object-cover ring-2 ring-[#3F4147]/70 bg-[#1E1F22]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://cdn.discordapp.com/embed/avatars/0.png';
                }}
              />
              <div
                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-[#2B2D31] ${
                  account.authorizationStatus === 'connected'
                    ? 'bg-emerald-500'
                    : needsReauth
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </div>

            <div className="overflow-hidden">
              <h3 className="font-semibold text-white text-base truncate leading-tight group-hover:text-[#8891f7] transition-colors">
                {account.globalName || account.username}
              </h3>
              <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                @{account.username}
              </p>
              <button
                onClick={handleCopyId}
                title="Copy Discord Snowflake ID"
                className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 mt-1 font-mono transition-colors"
              >
                <span>ID: {account.discordUserId}</span>
                {copiedId ? (
                  <Check size={11} className="text-emerald-400" />
                ) : (
                  <Copy size={11} />
                )}
              </button>
            </div>
          </div>

          <StatusBadge status={account.authorizationStatus} size="sm" />
        </div>

        {/* Badges & Meta Row */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-[#3F4147]/40">
          <NitroBadge status={account.nitroStatus} plan={account.nitroPlan} size="sm" />
          
          <div className="flex items-center gap-1 text-[11px] text-zinc-400 ml-auto font-medium">
            <Clock size={12} className="text-zinc-400" />
            <span>{lastSyncText}</span>
          </div>
        </div>

        {/* Reauth Warning Alert if Needed */}
        {needsReauth && (
          <div className="mt-3.5 p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <AlertTriangle size={14} className="shrink-0" />
              <span className="text-[11px] leading-tight font-medium">
                Authorization expired. Reconnect required.
              </span>
            </div>
            {onReconnect && (
              <button
                onClick={() => onReconnect(account.id)}
                className="text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-500 px-2.5 py-1 rounded-lg shrink-0 transition-colors"
              >
                Reconnect
              </button>
            )}
          </div>
        )}
      </div>

      {/* Bottom Actions Bar */}
      <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-[#3F4147]/50">
        <Link
          href={`/accounts/${account.id}`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-200 bg-[#1E1F22] hover:bg-[#313338] hover:text-white border border-[#3F4147]/60 rounded-xl transition-colors"
        >
          <span>Details</span>
          <ExternalLink size={12} />
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleRefreshClick}
            disabled={isBusy}
            title="Synchronize with Discord API"
            className="p-2 text-zinc-300 hover:text-white bg-[#1E1F22] hover:bg-[#313338] border border-[#3F4147]/60 rounded-xl transition-colors disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={`${isBusy ? 'animate-spin text-[#5865F2]' : ''}`}
            />
          </button>

          <button
            onClick={() => onDisconnect(account)}
            title="Disconnect Account"
            className="p-2 text-zinc-400 hover:text-rose-400 bg-[#1E1F22] hover:bg-rose-500/10 border border-[#3F4147]/60 hover:border-rose-500/30 rounded-xl transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
