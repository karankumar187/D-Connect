'use client';

import React from 'react';
import { Plus, RefreshCw, Bell } from 'lucide-react';
import Link from 'next/link';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddAccount?: () => void;
  onGlobalRefresh?: () => void;
  isRefreshing?: boolean;
  unreadNotifications?: number;
}

export function Header({
  title,
  subtitle,
  onAddAccount,
  onGlobalRefresh,
  isRefreshing,
  unreadNotifications = 0,
}: HeaderProps) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-[#3F4147]/40 bg-[#1E1F22]/80 backdrop-blur-md sticky top-0 z-20">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-400 mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {onGlobalRefresh && (
          <button
            onClick={onGlobalRefresh}
            disabled={isRefreshing}
            title="Sync all accounts with Discord API"
            className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-300 bg-[#2B2D31] hover:bg-[#313338] border border-[#3F4147]/60 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw
              size={14}
              className={`${isRefreshing ? 'animate-spin text-[#5865F2]' : ''}`}
            />
            <span className="hidden sm:inline">
              {isRefreshing ? 'Syncing...' : 'Sync All'}
            </span>
          </button>
        )}

        <Link
          href="/notifications"
          className="relative p-2 text-zinc-300 bg-[#2B2D31] hover:bg-[#313338] border border-[#3F4147]/60 rounded-lg transition-colors"
          title="Notifications"
        >
          <Bell size={16} />
          {unreadNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#5865F2] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadNotifications > 9 ? '9+' : unreadNotifications}
            </span>
          )}
        </Link>

        {onAddAccount && (
          <button
            onClick={onAddAccount}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-lg shadow-sm shadow-[#5865F2]/25 transition-all"
          >
            <Plus size={16} />
            <span>Add Account</span>
          </button>
        )}
      </div>
    </header>
  );
}
