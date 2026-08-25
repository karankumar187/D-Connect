'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/TopNav';
import { ConfirmDisconnectModal } from '@/components/modals/ConfirmDisconnectModal';
import { SafeDiscordAccount, SyncLogItem } from '@/lib/types';
import {
  ArrowLeft,
  RefreshCw,
  Trash2,
  Copy,
  Check,
  Shield,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Info,
  KeyRound,
  History,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function AccountDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [account, setAccount] = useState<SafeDiscordAccount | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchAccountData = useCallback(async () => {
    if (!id) return;
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const [accRes, histRes] = await Promise.all([
        fetch(`/api/discord/accounts/${id}`),
        fetch(`/api/discord/accounts/${id}/history`),
      ]);

      if (accRes.ok) {
        const accData = await accRes.json();
        setAccount(accData.account);
      } else {
        showToast('Account not found', 'error');
        router.push('/accounts');
        return;
      }

      if (histRes.ok) {
        const histData = await histRes.json();
        setSyncLogs(histData.logs || []);
      }
    } catch (e) {
      console.error('Error loading account details:', e);
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchAccountData();
  }, [fetchAccountData]);

  const handleCopyId = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.discordUserId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleRefresh = async () => {
    if (!account) return;
    setIsRefreshing(true);
    try {
      const res = await fetch(`/api/discord/accounts/${account.id}/refresh`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Account synchronized successfully', 'success');
        setAccount(data.account);
        fetchAccountData();
      } else {
        showToast(data.error || 'Failed to synchronize account', 'error');
        fetchAccountData();
      }
    } catch {
      showToast('Network error during synchronization', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReconnect = async () => {
    if (!account) return;
    try {
      const res = await fetch(`/api/discord/accounts/${account.id}/reconnect`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.message || data.error || 'Failed to initiate reconnect', 'error');
      }
    } catch {
      showToast('Error initiating reconnect flow', 'error');
    }
  };

  const handleConfirmDisconnect = async () => {
    if (!account) return;
    setIsDisconnecting(true);
    try {
      const res = await fetch(`/api/discord/accounts/${account.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/dashboard');
      } else {
        showToast('Failed to disconnect account', 'error');
      }
    } catch {
      showToast('Error disconnecting account', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleUpdateNitroPlan = async (plan: string) => {
    if (!account) return;
    try {
      const res = await fetch(`/api/discord/accounts/${account.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nitroPlan: plan === 'None' ? null : plan,
          nitroStatus: plan === 'None' ? 'inactive' : 'active',
        }),
      });
      const data = await res.json();
      if (res.ok && data.account) {
        setAccount(data.account);
        showToast(`Nitro status updated to: ${plan}`, 'success');
      } else {
        showToast('Failed to update Nitro status', 'error');
      }
    } catch {
      showToast('Error updating Nitro status', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6]">
        <TopNav user={user} />
        <div className="max-w-6xl mx-auto px-4 py-8 animate-pulse space-y-6">
          <div className="w-32 h-5 bg-[#141518] rounded-full" />
          <div className="w-full h-64 bg-[#141518] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!account) return null;

  const isConnected = account.authorizationStatus === 'connected';
  const needsReauth =
    account.authorizationStatus === 'reauthorization_required' ||
    account.authorizationStatus === 'expired';

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] pb-16 selection:bg-[#7C3AED] selection:text-white">
      <TopNav user={user} />

      {toastMessage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 animate-in slide-in-from-top duration-200">
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
              ) : (
                <AlertCircle size={16} className="text-rose-400 shrink-0" />
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

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {/* Back Link */}
        <Link
          href="/accounts"
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Accounts</span>
        </Link>

        {/* Profile Banner Card */}
        <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-7 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={account.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt={account.username}
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl object-cover ring-2 ring-[#22242A] bg-[#0A0A0C]"
                />
                <div
                  className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ring-3 ring-[#141518] ${
                    isConnected
                      ? 'bg-emerald-500'
                      : needsReauth
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </div>

              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-white tracking-tight">
                    {account.globalName || account.username}
                  </h2>
                  {isConnected ? (
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                      Needs Reauth
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-400 font-mono mt-0.5">
                  @{account.username}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-2.5">
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1A1B20] text-zinc-300 text-xs font-mono border border-[#22242A] hover:text-white transition-colors"
                  >
                    <span>ID: {account.discordUserId}</span>
                    {copiedId ? (
                      <Check size={12} className="text-emerald-400" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>

                  {account.email && (
                    <span className="text-xs text-zinc-400">
                      Email: <span className="text-zinc-200">{account.email}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 self-stretch sm:self-auto justify-end">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-black bg-white hover:bg-zinc-200 rounded-full shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw
                  size={13}
                  className={isRefreshing ? 'animate-spin' : ''}
                />
                <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
              </button>

              {needsReauth && (
                <button
                  onClick={handleReconnect}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-full transition-colors"
                >
                  Reconnect
                </button>
              )}

              <button
                onClick={() => setIsDisconnectModalOpen(true)}
                className="p-2.5 text-zinc-400 hover:text-rose-400 bg-[#1A1B20] hover:bg-rose-500/10 border border-[#22242A] hover:border-rose-500/30 rounded-full transition-colors"
                title="Disconnect account"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Security Card */}
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-white border-b border-[#22242A]/60 pb-3">
              <Shield size={16} className="text-[#A855F7]" />
              <span>OAuth2 Authorization & Security</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-[#22242A]/40">
                <span className="text-zinc-400">Connection State</span>
                <span className={isConnected ? 'text-emerald-400' : 'text-amber-400'}>
                  {isConnected ? 'Active & Valid' : 'Reauthorization Required'}
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#22242A]/40">
                <span className="text-zinc-400">Token Storage</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                  <KeyRound size={13} />
                  <span>AES-256-GCM Encrypted</span>
                </span>
              </div>

              <div className="flex justify-between py-1.5 border-b border-[#22242A]/40">
                <span className="text-zinc-400">Token Expiry</span>
                <span className="text-zinc-200 font-mono">
                  {format(new Date(account.tokenExpiresAt), 'PPpp')}
                </span>
              </div>

              <div className="flex justify-between py-1.5">
                <span className="text-zinc-400">Last Synced</span>
                <span className="text-zinc-200">
                  {account.lastSyncedAt
                    ? formatDistanceToNow(new Date(account.lastSyncedAt), {
                        addSuffix: true,
                      })
                    : 'Never'}
                </span>
              </div>
            </div>
          </div>

          {/* Nitro Subscription Card */}
          <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#22242A]/60 pb-3">
              <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
                <Sparkles size={16} className="text-[#A855F7]" />
                <span>Discord Nitro Status</span>
              </div>
              {account.nitroStatus === 'active' ? (
                <span className="text-[10px] font-medium text-[#C084FC] bg-[#7C3AED]/20 px-2.5 py-0.5 rounded-full border border-[#7C3AED]/30">
                  {account.nitroPlan || 'Nitro Active'}
                </span>
              ) : (
                <span className="text-[10px] font-medium text-zinc-400 bg-zinc-800/60 px-2.5 py-0.5 rounded-full border border-zinc-700/40">
                  API Restricted / None
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#1A1B20] border border-[#2B2245] rounded-2xl space-y-2">
                <p className="text-[11px] font-semibold text-zinc-300">Select / Override Plan:</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {['Nitro', 'Nitro Basic', 'Nitro Classic', 'None'].map((plan) => (
                    <button
                      key={plan}
                      onClick={() => handleUpdateNitroPlan(plan)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
                        (account.nitroPlan === plan) || (plan === 'None' && account.nitroStatus !== 'active')
                          ? 'bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white font-semibold shadow-sm'
                          : 'bg-[#141518] text-zinc-400 hover:text-white border border-[#22242A]'
                      }`}
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {account.nitroStatus === 'active' ? (
                <div className="p-3.5 bg-[#7C3AED]/10 border border-[#7C3AED]/25 rounded-2xl space-y-1">
                  <p className="font-semibold text-white">Active Plan: {account.nitroPlan || 'Nitro'}</p>
                  <p className="text-zinc-300 text-[11px]">
                    Includes custom emoji, HD streaming, profile badge & server boosts.
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-[#1A1B20] border border-[#22242A] rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
                    <Info size={13} className="text-[#A855F7]" />
                    <span>Auto-detection from Discord</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Discord restricts billing metadata on standard OAuth apps. You can select your plan above or click Sync Now to auto-detect.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sync History Table */}
        <div className="bg-[#141518] border border-[#22242A] rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-[#22242A]/60 pb-3">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-white">
              <History size={16} className="text-[#A855F7]" />
              <span>Synchronization Log History</span>
            </div>
            <span className="text-xs text-zinc-400">{syncLogs.length} events</span>
          </div>

          {syncLogs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#22242A]/60 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 px-3">Timestamp</th>
                    <th className="pb-3 px-3">Duration</th>
                    <th className="pb-3 px-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#22242A]/40">
                  {syncLogs.map((log) => {
                    const durationMs = log.completedAt
                      ? new Date(log.completedAt).getTime() -
                        new Date(log.startedAt).getTime()
                      : null;

                    return (
                      <tr key={log.id} className="hover:bg-[#1A1B20]/60 transition-colors">
                        <td className="py-3 px-3">
                          {log.status === 'success' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                              <CheckCircle2 size={13} />
                              <span>Success</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-medium">
                              <AlertCircle size={13} />
                              <span>Failed</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-zinc-300 font-mono text-[11px]">
                          {format(new Date(log.startedAt), 'PP p')}
                        </td>
                        <td className="py-3 px-3 text-zinc-400 font-mono text-[11px]">
                          {durationMs !== null ? `${durationMs}ms` : '—'}
                        </td>
                        <td className="py-3 px-3 text-zinc-300 text-[11px] truncate max-w-xs">
                          {log.errorMessage || log.details || 'Official API profile sync'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 text-center py-6">
              No synchronization events recorded yet.
            </p>
          )}
        </div>
      </main>

      <ConfirmDisconnectModal
        account={account}
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        onConfirm={handleConfirmDisconnect}
        isDisconnecting={isDisconnecting}
      />
    </div>
  );
}
