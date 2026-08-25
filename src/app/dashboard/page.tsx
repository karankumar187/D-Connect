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
  Search,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  Trash2,
  Copy,
  Check,
  KeyRound,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
    return true;
  });

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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
        {/* Hero Header & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white font-sans">
              Welcome back, {userName}
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Official Discord OAuth2 multi-account management and synchronization hub
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            {accounts.length > 0 && (
              <button
                onClick={handleGlobalRefresh}
                disabled={isRefreshingAll}
                className="flex items-center gap-2 bg-[#141518] hover:bg-[#1C1D22] text-zinc-300 hover:text-white text-xs font-medium px-4 py-2.5 rounded-full border border-[#22242A] transition-all disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={isRefreshingAll ? 'animate-spin text-[#A855F7]' : ''}
                />
                <span>{isRefreshingAll ? 'Syncing...' : 'Sync All'}</span>
              </button>
            )}

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg shadow-white/10 transition-all active:scale-[0.98]"
            >
              <Plus size={15} />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {/* Clean Functional KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Connected */}
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-3">
              <span>Connected Accounts</span>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <Users size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {summary ? summary.totalConnected : accounts.length}
              </span>
              <span className="text-xs text-emerald-400 font-medium">
                {accounts.filter((a) => a.authorizationStatus === 'connected').length} active
              </span>
            </div>
          </div>

          {/* Card 2: Nitro Active */}
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-3">
              <span>Nitro Active</span>
              <div className="w-8 h-8 rounded-full bg-[#7C3AED]/15 text-[#A855F7] flex items-center justify-center">
                <Sparkles size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {summary ? summary.nitroActive : 0}
              </span>
              <span className="text-xs text-zinc-400 font-medium">accounts</span>
            </div>
          </div>

          {/* Card 3: Reauthorization Needed */}
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-3">
              <span>Needs Reauth</span>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <AlertTriangle size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-white">
                {summary ? summary.needsReauthorization : 0}
              </span>
              <span className="text-xs text-zinc-400 font-medium">pending</span>
            </div>
          </div>

          {/* Card 4: Security Status */}
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mb-3">
              <span>Token Security</span>
              <div className="w-8 h-8 rounded-full bg-[#7C3AED]/15 text-emerald-400 flex items-center justify-center">
                <KeyRound size={15} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold text-emerald-400">AES-256-GCM</span>
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Encrypted at rest</p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#141518] p-3 rounded-2xl border border-[#22242A]">
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search connected accounts by username or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1A1B20] text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-2.5 rounded-xl border border-[#22242A] focus:outline-none focus:border-[#7C3AED] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex items-center gap-1 bg-[#1A1B20] p-1 rounded-xl border border-[#22242A] text-xs font-medium">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                All ({accounts.length})
              </button>
              <button
                onClick={() => setStatusFilter('connected')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'connected'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Connected
              </button>
              <button
                onClick={() => setStatusFilter('needs_reauth')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'needs_reauth'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Reauth
              </button>
              <button
                onClick={() => setStatusFilter('nitro_active')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  statusFilter === 'nitro_active'
                    ? 'bg-white text-black font-semibold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Nitro
              </button>
            </div>
          </div>
        </div>

        {/* Primary Accounts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#141518] border border-[#22242A] rounded-3xl p-6 h-52 animate-pulse"
              />
            ))}
          </div>
        ) : filteredAccounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAccounts.map((account) => {
              const isBusy = refreshingAccountIds.has(account.id);
              const isConnected = account.authorizationStatus === 'connected';
              const needsReauth =
                account.authorizationStatus === 'reauthorization_required' ||
                account.authorizationStatus === 'expired';

              return (
                <div
                  key={account.id}
                  className="bg-[#141518] hover:bg-[#18191E] border border-[#22242A] hover:border-[#7C3AED]/40 rounded-3xl p-6 transition-all duration-200 shadow-xl flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row: Avatar & Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={
                              account.avatarUrl ||
                              'https://cdn.discordapp.com/embed/avatars/0.png'
                            }
                            alt={account.username}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-[#22242A] bg-[#0A0A0C]"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://cdn.discordapp.com/embed/avatars/0.png';
                            }}
                          />
                          <div
                            className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ring-2 ring-[#141518] ${
                              isConnected
                                ? 'bg-emerald-500'
                                : needsReauth
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>

                        <div className="overflow-hidden">
                          <h3 className="font-semibold text-white text-sm truncate group-hover:text-[#A855F7] transition-colors">
                            {account.globalName || account.username}
                          </h3>
                          <p className="text-xs text-zinc-400 font-mono mt-0.5 truncate">
                            @{account.username}
                          </p>
                          <button
                            onClick={(e) => handleCopyId(account.discordUserId, e)}
                            className="inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-200 mt-1 font-mono transition-colors"
                          >
                            <span>ID: {account.discordUserId}</span>
                            {copiedId === account.discordUserId ? (
                              <Check size={11} className="text-emerald-400" />
                            ) : (
                              <Copy size={11} />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Tag Pill */}
                      {account.nitroStatus === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#C084FC] bg-[#7C3AED]/15 px-2.5 py-1 rounded-full border border-[#7C3AED]/30">
                          <Sparkles size={11} />
                          <span>{account.nitroPlan || 'Nitro'}</span>
                        </span>
                      ) : isConnected ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>Connected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                          <AlertTriangle size={11} />
                          <span>Reauth</span>
                        </span>
                      )}
                    </div>

                    {/* Metadata row */}
                    <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-4 pt-3 border-t border-[#22242A]/60">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>
                          {account.lastSyncedAt
                            ? formatDistanceToNow(new Date(account.lastSyncedAt), {
                                addSuffix: true,
                              })
                            : 'Never synced'}
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-emerald-400">
                        AES-256-GCM
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-[#22242A]/60">
                    <Link
                      href={`/accounts/${account.id}`}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-[#1A1B20] hover:bg-[#22242A] border border-[#22242A] rounded-full transition-colors"
                    >
                      <span>Details & Logs</span>
                      <ExternalLink size={12} />
                    </Link>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleRefreshAccount(account.id, e)}
                        disabled={isBusy}
                        title="Sync account"
                        className="p-2 text-zinc-300 hover:text-white bg-[#1A1B20] hover:bg-[#22242A] border border-[#22242A] rounded-full transition-colors disabled:opacity-50"
                      >
                        <RefreshCw
                          size={13}
                          className={isBusy ? 'animate-spin text-[#A855F7]' : ''}
                        />
                      </button>

                      <button
                        onClick={() => setAccountToDisconnect(account)}
                        title="Disconnect"
                        className="p-2 text-zinc-400 hover:text-rose-400 bg-[#1A1B20] hover:bg-rose-500/10 border border-[#22242A] hover:border-rose-500/30 rounded-full transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xl">
            <div className="w-14 h-14 rounded-full bg-[#7C3AED]/15 text-[#A855F7] flex items-center justify-center mx-auto">
              <Users size={28} />
            </div>
            <h3 className="text-base font-semibold text-white">
              {searchQuery || statusFilter !== 'all'
                ? 'No matching accounts'
                : 'No accounts connected yet'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery || statusFilter !== 'all'
                ? 'Try clearing your search query or changing filter pills.'
                : 'Connect your Discord accounts securely using official Discord OAuth2.'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
                className="px-4 py-2 text-xs font-semibold text-zinc-200 bg-[#1A1B20] hover:bg-[#22242A] rounded-full border border-[#22242A] transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-full shadow-lg transition-all"
              >
                <Plus size={15} />
                <span>Connect First Account</span>
              </button>
            )}
          </div>
        )}
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
