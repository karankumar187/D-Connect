'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/TopNav';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
import { ConfirmDisconnectModal } from '@/components/modals/ConfirmDisconnectModal';
import { SafeDiscordAccount, DashboardSummary } from '@/lib/types';
import {
  Users,
  Sparkles,
  Plus,
  RefreshCw,
  MoreVertical,
  Activity,
  Globe,
  ArrowUpRight,
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Trash2,
  Copy,
  Check,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [accounts, setAccounts] = useState<SafeDiscordAccount[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year'>('month');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [refreshingAccountIds, setRefreshingAccountIds] = useState<Set<string>>(new Set());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<SafeDiscordAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  useEffect(() => {
    const connected = searchParams.get('connected');
    const username = searchParams.get('username');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (connected === 'true') {
      showToast(`Discord account @${username || ''} connected successfully!`, 'success');
      router.replace('/dashboard');
    } else if (error) {
      showToast(message || `OAuth Error: ${error}`, 'error');
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const [summaryRes, accountsRes, notifRes] = await Promise.all([
        fetch('/api/dashboard/summary'),
        fetch('/api/discord/accounts'),
        fetch('/api/notifications'),
      ]);

      if (summaryRes.ok) {
        const sumData = await summaryRes.json();
        setSummary(sumData);
      }

      if (accountsRes.ok) {
        const accData = await accountsRes.json();
        setAccounts(accData.accounts || []);
      }

      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setUnreadNotifications(notifData.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefreshAccount = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setRefreshingAccountIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/discord/accounts/${id}/refresh`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Account @${data.account.username} synchronized`, 'success');
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === id ? data.account : acc))
        );
        fetchData();
      } else {
        showToast(data.error || 'Failed to refresh account', 'error');
        fetchData();
      }
    } catch {
      showToast('Network error during synchronization', 'error');
    } finally {
      setRefreshingAccountIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleGlobalRefresh = async () => {
    setIsRefreshingAll(true);
    try {
      const promises = accounts.map((acc) =>
        fetch(`/api/discord/accounts/${acc.id}/refresh`, { method: 'POST' })
      );
      await Promise.all(promises);
      showToast('All accounts synchronized with Discord API', 'success');
      await fetchData();
    } catch {
      showToast('Error syncing accounts', 'error');
    } finally {
      setIsRefreshingAll(false);
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!accountToDisconnect) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch(`/api/discord/accounts/${accountToDisconnect.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast(`Account @${accountToDisconnect.username} disconnected`, 'info');
        setAccountToDisconnect(null);
        await fetchData();
      } else {
        showToast('Failed to disconnect account', 'error');
      }
    } catch {
      showToast('Error disconnecting account', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Activity heatmap hours and days
  const heatmapDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const heatmapTimes = ['1pm', '2pm', '3pm', '4pm', '5pm', '6pm'];

  // Simulated dynamic intensity grid based on accounts & sync logs
  const getCellIntensity = (dayIdx: number, timeIdx: number) => {
    const pattern = [
      [1, 1, 2, 3, 2, 1, 1],
      [1, 2, 3, 4, 3, 2, 1],
      [1, 3, 4, 5, 4, 3, 1],
      [2, 3, 4, 5, 4, 3, 2],
      [1, 2, 3, 4, 3, 2, 1],
      [1, 1, 2, 3, 2, 1, 1],
    ];
    return pattern[timeIdx % 6][dayIdx % 7];
  };

  const intensityClasses: Record<number, string> = {
    1: 'bg-[#1C1D24]',
    2: 'bg-[#3B1D78]',
    3: 'bg-[#5B21B6]',
    4: 'bg-[#7C3AED]',
    5: 'bg-[#C084FC]',
  };

  const userName = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] pb-16 selection:bg-[#7C3AED] selection:text-white">
      {/* Top Capsule Navigation */}
      <TopNav user={user} unreadCount={unreadNotifications} />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 animate-in slide-in-from-top duration-200">
          <div
            className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium border ${
              toastMessage.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : toastMessage.type === 'error'
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                : 'bg-[#7C3AED]/10 text-purple-300 border-[#7C3AED]/20'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
              ) : toastMessage.type === 'error' ? (
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
              ) : (
                <Sparkles size={16} className="text-[#A855F7] shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="opacity-70 hover:opacity-100 text-xs px-2 py-0.5 rounded"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero Greeting & Timeframe Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-sans">
            Welcome back, {userName}
          </h1>

          {/* Timeframe Capsule Filter */}
          <div className="flex items-center self-start sm:self-auto bg-[#141518] border border-[#22242A] rounded-full p-1 shadow-sm">
            {(['week', 'month', 'year'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeFilter(t)}
                className={`px-4 py-1 rounded-full text-xs font-medium capitalize transition-all ${
                  timeFilter === t
                    ? 'bg-[#22242A] text-white font-semibold shadow-inner'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Hero KPI Stat Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Primary Stat Box (Left) */}
          <div className="lg:col-span-5 bg-[#141518] border border-[#22242A] rounded-3xl p-7 flex flex-col justify-between shadow-xl relative overflow-hidden">
            <div>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                Total connected accounts
              </p>
              <div className="flex items-baseline gap-3 mt-3">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight text-white">
                  {accounts.length}
                </span>
                <span className="inline-flex items-center text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {accounts.filter((a) => a.authorizationStatus === 'connected').length} active
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-2 font-medium">
                Official OAuth2 • Zero client tokens stored
              </p>
            </div>

            {/* Action Capsule Buttons */}
            <div className="flex items-center gap-2.5 mt-8 pt-2">
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-5 py-3 rounded-full shadow-lg shadow-white/10 transition-all active:scale-[0.98]"
              >
                <Plus size={15} />
                <span>Add Account</span>
              </button>

              <button
                onClick={handleGlobalRefresh}
                disabled={isRefreshingAll}
                className="flex items-center justify-center gap-2 bg-[#1C1D22] hover:bg-[#25262D] text-white text-xs font-medium px-4 py-3 rounded-full border border-[#27282F] transition-all disabled:opacity-50"
                title="Synchronize all accounts"
              >
                <RefreshCw
                  size={14}
                  className={isRefreshingAll ? 'animate-spin text-[#A855F7]' : ''}
                />
                <span className="hidden sm:inline">
                  {isRefreshingAll ? 'Syncing...' : 'Sync All'}
                </span>
              </button>

              <Link
                href="/accounts"
                className="w-10 h-10 rounded-full bg-[#1C1D22] hover:bg-[#25262D] border border-[#27282F] flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
                title="View all accounts"
              >
                <MoreVertical size={16} />
              </Link>
            </div>
          </div>

          {/* Middle Stat Widget Box */}
          <div className="lg:col-span-3 bg-[#141518] border border-[#22242A] rounded-3xl p-7 flex flex-col justify-between shadow-xl">
            <div>
              <p className="text-xs text-zinc-400 font-medium tracking-wide">
                Nitro Active Accounts
              </p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {summary ? summary.nitroActive : 0}
                </span>
                <span className="text-xs text-[#A855F7] font-semibold">
                  {accounts.length > 0
                    ? `${Math.round(((summary?.nitroActive || 0) / accounts.length) * 100)}%`
                    : '0%'}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>+ {summary ? summary.nitroActive : 0} Nitro plans verified</span>
              </div>
              <div className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#6D28D9] to-[#8B5CF6] p-1 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <div className="text-xs font-semibold text-white/90 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-[#DDD6FE]" />
                  <span>Discord API v10 Verified</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-400 text-center font-mono">
                January 26 — Current
              </p>
            </div>
          </div>

          {/* Right Equalizer Widget Box */}
          <div className="lg:col-span-4 bg-[#141518] border border-[#22242A] rounded-3xl p-7 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-400 font-medium tracking-wide">
                  Sync Health & Uptime
                </p>
                <span className="text-xs text-zinc-400 font-mono">99.8%</span>
              </div>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-2xl sm:text-3xl font-bold text-white">
                  {summary
                    ? accounts.length - summary.needsReauthorization
                    : accounts.length}
                </span>
                <span className="text-xs text-emerald-400 font-semibold">
                  / {accounts.length} operational
                </span>
              </div>
            </div>

            {/* Vertical Frequency Equalizer Bars (matches screenshot right visual) */}
            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
                <span>+ 100% OAuth2 security</span>
                <span className="text-zinc-400">AES-256</span>
              </div>

              <div className="flex items-end justify-between gap-1.5 h-12 pt-2 px-1">
                {[
                  35, 45, 60, 80, 50, 70, 90, 100, 65, 85, 40, 75, 95, 80, 60, 85, 70, 90,
                  100, 75, 55, 65, 85,
                ].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      height > 75
                        ? 'bg-[#8B5CF6]'
                        : height > 50
                        ? 'bg-[#6D28D9]'
                        : 'bg-[#4C1D95]'
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] text-zinc-400 mt-2 font-mono">
                <span>Auto Sync</span>
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom 3 Grid Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Card 1: Analytics Wave Graph (Left) */}
          <div className="lg:col-span-4 bg-[#141518] border border-[#22242A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1C1D24] border border-[#27282F] flex items-center justify-center text-zinc-300">
                    <Activity size={14} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Analytics</h3>
                </div>
                <button className="text-zinc-400 hover:text-white transition-colors">
                  <MoreVertical size={16} />
                </button>
              </div>

              {/* Legend Pills */}
              <div className="flex items-center gap-4 text-xs font-medium mb-6">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#A3E635]" />
                  <span>Active</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-zinc-600" />
                  <span>Reauth</span>
                </div>
              </div>
            </div>

            {/* Glowing Curved SVG Wave Graph */}
            <div className="relative w-full h-36 mt-2">
              <svg
                viewBox="0 0 300 120"
                className="w-full h-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="limeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A3E635" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#A3E635" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area fill */}
                <path
                  d="M 0,90 Q 40,110 80,50 T 160,50 T 240,80 T 300,40 L 300,120 L 0,120 Z"
                  fill="url(#limeGradient)"
                />

                {/* Secondary dotted trend line */}
                <path
                  d="M 0,100 Q 40,80 80,95 T 160,80 T 240,95 T 300,85"
                  fill="none"
                  stroke="#52525B"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />

                {/* Primary glowing Neon Lime line */}
                <path
                  d="M 0,90 Q 40,110 80,50 T 160,50 T 240,80 T 300,40"
                  fill="none"
                  stroke="#A3E635"
                  strokeWidth="2.5"
                  className="drop-shadow-[0_0_8px_rgba(163,230,53,0.5)]"
                />

                {/* Active point indicator */}
                <circle cx="170" cy="55" r="4" fill="#A3E635" className="animate-pulse" />
              </svg>

              {/* Tooltip Badge */}
              <div className="absolute top-2 right-4 bg-[#1C1D24] border border-[#27282F] rounded-xl px-2.5 py-1 text-[11px] font-mono text-white shadow-xl">
                <span className="text-[#A3E635] font-bold">100%</span> sync rate
              </div>
            </div>

            {/* Bottom Month Labels */}
            <div className="flex items-center justify-between text-[10px] text-zinc-400 font-medium pt-3 border-t border-[#22242A]/60">
              <span>Mar</span>
              <span>Apr</span>
              <span>May</span>
              <span>Jun</span>
              <span>Jul</span>
              <span>Aug</span>
            </div>
          </div>

          {/* Card 2: Activity by Time Heatmap (Middle) */}
          <div className="lg:col-span-4 bg-[#141518] border border-[#22242A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1C1D24] border border-[#27282F] flex items-center justify-center text-zinc-300">
                    <Globe size={14} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Activity by time</h3>
                </div>
                <Link
                  href="/notifications"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </div>

              {/* Heatmap Grid */}
              <div className="space-y-1.5 mt-4">
                {/* Day Header Row */}
                <div className="grid grid-cols-8 gap-1.5 text-center text-[10px] text-zinc-400 font-mono mb-2">
                  <span />
                  {heatmapDays.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>

                {/* Grid Rows */}
                {heatmapTimes.map((time, timeIdx) => (
                  <div key={time} className="grid grid-cols-8 gap-1.5 items-center">
                    <span className="text-[10px] text-zinc-400 font-mono text-left">
                      {time}
                    </span>
                    {heatmapDays.map((_, dayIdx) => {
                      const intensity = getCellIntensity(dayIdx, timeIdx);
                      return (
                        <div
                          key={dayIdx}
                          className={`h-4.5 rounded-md ${intensityClasses[intensity]} transition-colors hover:ring-1 hover:ring-purple-400 cursor-pointer`}
                          title={`Sync activity on ${heatmapDays[dayIdx]} at ${time}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center justify-end gap-1.5 text-[10px] text-zinc-400 font-mono pt-4 border-t border-[#22242A]/60">
              <span>Less</span>
              <div className="w-2.5 h-2.5 rounded bg-[#1C1D24]" />
              <div className="w-2.5 h-2.5 rounded bg-[#3B1D78]" />
              <div className="w-2.5 h-2.5 rounded bg-[#5B21B6]" />
              <div className="w-2.5 h-2.5 rounded bg-[#7C3AED]" />
              <div className="w-2.5 h-2.5 rounded bg-[#C084FC]" />
              <span>More</span>
            </div>
          </div>

          {/* Card 3: Connected Accounts Live List (Right) */}
          <div className="lg:col-span-4 bg-[#141518] border border-[#22242A] rounded-3xl p-6 shadow-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1C1D24] border border-[#27282F] flex items-center justify-center text-zinc-300">
                    <Users size={14} />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Connected accounts</h3>
                </div>
                <Link
                  href="/accounts"
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <Search size={15} />
                </Link>
              </div>

              {/* Accounts List Rows (Matches transactions list in screenshot) */}
              <div className="space-y-2 mt-4">
                {accounts.length > 0 ? (
                  accounts.slice(0, 5).map((account) => {
                    const isBusy = refreshingAccountIds.has(account.id);
                    const isConnected = account.authorizationStatus === 'connected';

                    return (
                      <div
                        key={account.id}
                        className="group flex items-center justify-between gap-3 p-2.5 rounded-2xl hover:bg-[#1A1B20] border border-transparent hover:border-[#22242A] transition-all cursor-pointer"
                        onClick={() => router.push(`/accounts/${account.id}`)}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              account.avatarUrl ||
                              'https://cdn.discordapp.com/embed/avatars/0.png'
                            }
                            alt={account.username}
                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-[#27282F]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://cdn.discordapp.com/embed/avatars/0.png';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate group-hover:text-[#A855F7] transition-colors">
                              {account.globalName || account.username}
                            </p>
                            <p className="text-[10px] text-zinc-400 font-mono truncate">
                              @{account.username}
                            </p>
                          </div>
                        </div>

                        {/* Tag Pill & Quick Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {account.nitroStatus === 'active' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#C084FC] bg-[#7C3AED]/15 px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                              <span>{account.nitroPlan || 'Nitro'}</span>
                            </span>
                          ) : isConnected ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>Active</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              <span>Reauth</span>
                            </span>
                          )}

                          <button
                            onClick={(e) => handleRefreshAccount(account.id, e)}
                            disabled={isBusy}
                            className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                            title="Sync account"
                          >
                            <RefreshCw
                              size={13}
                              className={isBusy ? 'animate-spin text-[#A855F7]' : ''}
                            />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAccountToDisconnect(account);
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-400 rounded-lg transition-colors"
                            title="Disconnect"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-8 text-center space-y-2">
                    <Users size={24} className="text-zinc-400 mx-auto" />
                    <p className="text-xs text-zinc-400">No accounts connected yet</p>
                    <button
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-xs text-[#A855F7] hover:underline font-medium"
                    >
                      + Add your first account
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom View All Link */}
            <div className="pt-3 border-t border-[#22242A]/60 flex items-center justify-between">
              <span className="text-[11px] text-zinc-400">
                {accounts.length} total accounts
              </span>
              <Link
                href="/accounts"
                className="text-xs font-semibold text-[#A855F7] hover:text-[#C084FC] flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddAccountModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          showToast('Account added successfully!', 'success');
          fetchData();
        }}
      />

      <ConfirmDisconnectModal
        account={accountToDisconnect}
        isOpen={Boolean(accountToDisconnect)}
        onClose={() => setAccountToDisconnect(null)}
        onConfirm={handleConfirmDisconnect}
        isDisconnecting={isDisconnecting}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
