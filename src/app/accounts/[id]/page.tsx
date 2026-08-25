'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { StatusBadge } from '@/components/StatusBadge';
import { NitroBadge } from '@/components/NitroBadge';
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
  Calendar,
  KeyRound,
  ExternalLink,
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#141517] text-[#F2F3F5]">
        <Sidebar user={user} />
        <div className="flex-1 p-8 animate-pulse space-y-6">
          <div className="w-48 h-6 bg-[#2B2D31] rounded-lg" />
          <div className="w-full h-64 bg-[#2B2D31] rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!account) return null;

  const needsReauth =
    account.authorizationStatus === 'reauthorization_required' ||
    account.authorizationStatus === 'expired';

  return (
    <div className="flex min-h-screen bg-[#141517] text-[#F2F3F5]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          title={`@${account.username}`}
          subtitle="Official Discord Account Details & Sync Logs"
        />

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

        <main className="flex-1 p-6 space-y-6 max-w-6xl w-full mx-auto">
          {/* Back Link */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Back to Dashboard</span>
          </Link>

          {/* Top Profile Banner Card */}
          <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                {/* Avatar */}
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={account.avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                    alt={account.username}
                    className="w-20 h-20 rounded-3xl object-cover ring-4 ring-[#1E1F22] bg-[#1E1F22]"
                  />
                  <div
                    className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-3 ring-[#2B2D31] ${
                      account.authorizationStatus === 'connected'
                        ? 'bg-emerald-500'
                        : needsReauth
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                </div>

                {/* Names & Snowflake */}
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {account.globalName || account.username}
                    </h2>
                    <StatusBadge status={account.authorizationStatus} />
                  </div>
                  <p className="text-sm text-zinc-400 font-mono mt-0.5">
                    @{account.username}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <button
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#1E1F22] text-zinc-300 text-xs font-mono border border-[#3F4147]/60 hover:text-white transition-colors"
                      title="Copy Discord Snowflake ID"
                    >
                      <span>Snowflake: {account.discordUserId}</span>
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

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-xl shadow-md shadow-[#5865F2]/25 transition-all disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={isRefreshing ? 'animate-spin' : ''}
                  />
                  <span>{isRefreshing ? 'Synchronizing...' : 'Sync Now'}</span>
                </button>

                {needsReauth && (
                  <button
                    onClick={handleReconnect}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-md transition-colors"
                  >
                    <span>Reconnect</span>
                  </button>
                )}

                <button
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="p-2.5 text-zinc-400 hover:text-rose-400 bg-[#1E1F22] hover:bg-rose-500/10 border border-[#3F4147]/60 hover:border-rose-500/30 rounded-xl transition-colors"
                  title="Disconnect account"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Two-Column Section: Authorization & Nitro */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 1: Authorization & Credentials Status */}
            <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2.5 text-sm font-bold text-white border-b border-[#3F4147]/40 pb-3">
                <Shield size={18} className="text-[#5865F2]" />
                <span>OAuth2 Authorization Status</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#3F4147]/30">
                  <span className="text-zinc-400">Connection State</span>
                  <StatusBadge status={account.authorizationStatus} size="sm" />
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#3F4147]/30">
                  <span className="text-zinc-400">Token Security</span>
                  <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
                    <KeyRound size={13} />
                    <span>AES-256-GCM Encrypted at Rest</span>
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#3F4147]/30">
                  <span className="text-zinc-400">Token Expiry</span>
                  <span className="text-zinc-200 font-mono">
                    {format(new Date(account.tokenExpiresAt), 'PPpp')}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-[#3F4147]/30">
                  <span className="text-zinc-400">Last Synced</span>
                  <span className="text-zinc-200">
                    {account.lastSyncedAt
                      ? formatDistanceToNow(new Date(account.lastSyncedAt), {
                          addSuffix: true,
                        })
                      : 'Never'}
                  </span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-zinc-400">First Connected</span>
                  <span className="text-zinc-200 font-mono">
                    {format(new Date(account.createdAt), 'PP')}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Nitro / Subscription Status (Official API Only) */}
            <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#3F4147]/40 pb-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                  <Sparkles size={18} className="text-[#EB459E]" />
                  <span>Discord Nitro Status</span>
                </div>
                <NitroBadge status={account.nitroStatus} plan={account.nitroPlan} />
              </div>

              <div className="space-y-3 text-xs">
                {account.nitroStatus === 'active' ? (
                  <div className="p-4 bg-[#5865F2]/10 border border-[#5865F2]/20 rounded-2xl space-y-2">
                    <p className="font-semibold text-white">
                      Active Plan: {account.nitroPlan}
                    </p>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      Confirmed via Discord API v10 <span className="font-mono">premium_type</span> field.
                    </p>
                  </div>
                ) : account.nitroStatus === 'inactive' ? (
                  <div className="p-4 bg-zinc-800/40 border border-zinc-700/50 rounded-2xl space-y-1.5">
                    <p className="font-semibold text-zinc-300">No Nitro Subscription Active</p>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      The official Discord API reports <span className="font-mono">premium_type = 0</span> (None).
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-800/40 border border-zinc-700/40 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-zinc-300 font-medium">
                      <Info size={15} className="text-zinc-400 shrink-0" />
                      <span>Not exposed via standard public Discord OAuth2</span>
                    </div>
                    <p className="text-zinc-400 text-[11px] leading-relaxed">
                      Discord restricts subscription billing metadata on public OAuth apps unless the partner-level <span className="font-mono text-zinc-300">identify.premium</span> scope is approved. Per specification guidelines, this dashboard refuses to scrape or guess.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-2">
                  <span>Policy Compliance:</span>
                  <span className="text-emerald-400 font-semibold">100% Official API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: History & Sync Logs Table */}
          <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4147]/40 pb-3">
              <div className="flex items-center gap-2.5 text-sm font-bold text-white">
                <History size={18} className="text-[#5865F2]" />
                <span>Synchronization & Event History</span>
              </div>
              <span className="text-xs text-zinc-400">{syncLogs.length} events logged</span>
            </div>

            {syncLogs.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#3F4147]/40 text-zinc-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3">Timestamp</th>
                      <th className="pb-3 px-3">Duration</th>
                      <th className="pb-3 px-3">Details / Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#3F4147]/30">
                    {syncLogs.map((log) => {
                      const durationMs = log.completedAt
                        ? new Date(log.completedAt).getTime() -
                          new Date(log.startedAt).getTime()
                        : null;

                      return (
                        <tr key={log.id} className="hover:bg-[#1E1F22]/50 transition-colors">
                          <td className="py-3 px-3">
                            {log.status === 'success' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                                <CheckCircle2 size={13} />
                                <span>Success</span>
                              </span>
                            ) : log.status === 'rate_limited' ? (
                              <span className="inline-flex items-center gap-1 text-amber-400 font-medium">
                                <Clock size={13} />
                                <span>Rate Limited</span>
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
                            {durationMs !== null ? `${durationMs}ms` : 'In progress'}
                          </td>
                          <td className="py-3 px-3 text-zinc-300 text-[11px] max-w-xs truncate">
                            {log.errorMessage || log.details || 'Official API profile fetch'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 text-center py-6">
                No synchronization history recorded yet.
              </p>
            )}
          </div>
        </main>
      </div>

      <MobileNav />

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
