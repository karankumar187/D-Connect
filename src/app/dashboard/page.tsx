'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AccountCard } from '@/components/AccountCard';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
import { ConfirmDisconnectModal } from '@/components/modals/ConfirmDisconnectModal';
import { SafeDiscordAccount, DashboardSummary } from '@/lib/types';
import {
  Users,
  Sparkles,
  MinusCircle,
  AlertTriangle,
  Search,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  HelpCircle,
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [accounts, setAccounts] = useState<SafeDiscordAccount[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);
  const [refreshingAccountIds, setRefreshingAccountIds] = useState<Set<string>>(new Set());

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<SafeDiscordAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  // Check URL search params for OAuth callback results
  useEffect(() => {
    const connected = searchParams.get('connected');
    const username = searchParams.get('username');
    const error = searchParams.get('error');
    const message = searchParams.get('message');

    if (connected === 'true') {
      showToast(
        `Discord account @${username || ''} connected successfully!`,
        'success'
      );
      router.replace('/dashboard');
    } else if (error) {
      showToast(message || `OAuth Error: ${error}`, 'error');
      router.replace('/dashboard');
    }
  }, [searchParams, router]);

  const fetchData = useCallback(async () => {
    try {
      // 1. Check user session
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      // 2. Fetch summary & accounts in parallel
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

  // Handle single account manual refresh
  const handleRefreshAccount = async (id: string) => {
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

  // Handle global refresh for all accounts
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

  // Handle account reconnect
  const handleReconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/discord/accounts/${id}/reconnect`, {
        method: 'POST',
      });
      const data = await res.json();

      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.message || data.error || 'Failed to start reconnect', 'error');
      }
    } catch {
      showToast('Error initializing reconnect flow', 'error');
    }
  };

  // Handle account disconnect confirmation
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

  // Filter accounts by search query and status tab
  const filteredAccounts = accounts.filter((acc) => {
    const matchesSearch =
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.globalName &&
        acc.globalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      acc.discordUserId.includes(searchQuery);

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'connected') return acc.authorizationStatus === 'connected';
    if (statusFilter === 'needs_reauth')
      return (
        acc.authorizationStatus === 'reauthorization_required' ||
        acc.authorizationStatus === 'expired'
      );
    if (statusFilter === 'nitro_active') return acc.nitroStatus === 'active';
    if (statusFilter === 'nitro_inactive') return acc.nitroStatus === 'inactive';
    if (statusFilter === 'nitro_not_available')
      return acc.nitroStatus === 'not_available' || acc.nitroStatus === 'unknown';

    return true;
  });

  return (
    <div className="flex min-h-screen bg-[#141517] text-[#F2F3F5]">
      <Sidebar user={user} unreadCount={unreadNotifications} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          title="Account Overview"
          subtitle="Monitor and synchronize your connected Discord accounts via official APIs"
          onAddAccount={() => setIsAddModalOpen(true)}
          onGlobalRefresh={accounts.length > 0 ? handleGlobalRefresh : undefined}
          isRefreshing={isRefreshingAll}
          unreadNotifications={unreadNotifications}
        />

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="px-6 pt-4 animate-in slide-in-from-top duration-200">
            <div
              className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 text-xs font-medium border ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : toastMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                  : 'bg-[#5865F2]/10 text-indigo-300 border-[#5865F2]/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {toastMessage.type === 'success' ? (
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                ) : toastMessage.type === 'error' ? (
                  <AlertCircle size={16} className="text-rose-400 shrink-0" />
                ) : (
                  <Sparkles size={16} className="text-[#5865F2] shrink-0" />
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

        <main className="flex-1 p-6 space-y-6 max-w-7xl w-full mx-auto">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Connected Accounts */}
            <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
                <span>Connected Accounts</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Users size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {summary ? summary.totalConnected : 0}
                </span>
                <span className="text-xs text-zinc-400 font-medium">connected</span>
              </div>
            </div>

            {/* Card 2: Nitro Active */}
            <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
                <span>Nitro Active</span>
                <div className="w-8 h-8 rounded-xl bg-[#5865F2]/15 text-[#8891f7] flex items-center justify-center">
                  <Sparkles size={16} className="text-[#EB459E]" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {summary ? summary.nitroActive : 0}
                </span>
                <span className="text-xs text-zinc-400 font-medium">accounts</span>
              </div>
            </div>

            {/* Card 3: Nitro Inactive / Restricted */}
            <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
                <span>API Restricted / None</span>
                <div className="w-8 h-8 rounded-xl bg-zinc-700/30 text-zinc-400 flex items-center justify-center">
                  <MinusCircle size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">
                  {summary
                    ? summary.nitroInactive + summary.nitroNotAvailable
                    : 0}
                </span>
                <span className="text-xs text-zinc-400 font-medium">accounts</span>
              </div>
            </div>

            {/* Card 4: Needs Reauthorization */}
            <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-zinc-400 text-xs font-medium mb-3">
                <span>Needs Reauth</span>
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <AlertTriangle size={16} />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-amber-400">
                  {summary ? summary.needsReauthorization : 0}
                </span>
                <span className="text-xs text-zinc-400 font-medium">action required</span>
              </div>
            </div>
          </div>

          {/* Search, Filter Bar & Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#1E1F22] p-3 rounded-2xl border border-[#3F4147]/50">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search by username, display name, or Snowflake ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2B2D31] text-xs text-white placeholder-zinc-400 pl-10 pr-4 py-2.5 rounded-xl border border-[#3F4147]/60 focus:outline-none focus:border-[#5865F2] transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <div className="flex items-center gap-1 bg-[#2B2D31] p-1 rounded-xl border border-[#3F4147]/60 text-xs font-medium">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-[#5865F2] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  All ({accounts.length})
                </button>
                <button
                  onClick={() => setStatusFilter('connected')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'connected'
                      ? 'bg-[#5865F2] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Connected
                </button>
                <button
                  onClick={() => setStatusFilter('needs_reauth')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'needs_reauth'
                      ? 'bg-[#5865F2] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Reauth ({summary?.needsReauthorization || 0})
                </button>
                <button
                  onClick={() => setStatusFilter('nitro_active')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    statusFilter === 'nitro_active'
                      ? 'bg-[#5865F2] text-white shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Nitro Active
                </button>
              </div>
            </div>
          </div>

          {/* Accounts Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#2B2D31] border border-[#3F4147]/40 rounded-2xl p-5 h-48 animate-pulse space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#3F4147]/40" />
                    <div className="space-y-2 flex-1">
                      <div className="w-24 h-4 bg-[#3F4147]/40 rounded" />
                      <div className="w-16 h-3 bg-[#3F4147]/30 rounded" />
                    </div>
                  </div>
                  <div className="w-full h-8 bg-[#3F4147]/20 rounded-xl" />
                </div>
              ))}
            </div>
          ) : filteredAccounts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAccounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onRefresh={handleRefreshAccount}
                  onDisconnect={(acc) => setAccountToDisconnect(acc)}
                  onReconnect={handleReconnect}
                  isRefreshing={refreshingAccountIds.has(account.id)}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-[#2B2D31]/40 border border-[#3F4147]/50 rounded-3xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/15 text-[#5865F2] flex items-center justify-center mx-auto shadow-inner">
                <Users size={32} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {searchQuery || statusFilter !== 'all'
                    ? 'No accounts match your filter'
                    : 'No Discord accounts connected yet'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Try clearing your search query or changing the filter status above.'
                    : 'Connect all your Discord accounts securely using official OAuth2 authorization.'}
                </p>
              </div>

              {searchQuery || statusFilter !== 'all' ? (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-zinc-200 bg-[#1E1F22] hover:bg-[#313338] rounded-xl border border-[#3F4147]/60 transition-colors"
                >
                  Clear Filters
                </button>
              ) : (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-xl shadow-lg shadow-[#5865F2]/25 transition-all"
                >
                  <Plus size={16} />
                  <span>Connect First Account</span>
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      <MobileNav unreadCount={unreadNotifications} />

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
        <div className="min-h-screen bg-[#141517] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

