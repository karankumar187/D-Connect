'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { AccountCard } from '@/components/AccountCard';
import { AddAccountModal } from '@/components/modals/AddAccountModal';
import { ConfirmDisconnectModal } from '@/components/modals/ConfirmDisconnectModal';
import { SafeDiscordAccount } from '@/lib/types';
import { Users, Search, Plus, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AccountsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [accounts, setAccounts] = useState<SafeDiscordAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [accountToDisconnect, setAccountToDisconnect] = useState<SafeDiscordAccount | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [refreshingAccountIds, setRefreshingAccountIds] = useState<Set<string>>(new Set());

  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const fetchData = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const accountsRes = await fetch('/api/discord/accounts');
      if (accountsRes.ok) {
        const accData = await accountsRes.json();
        setAccounts(accData.accounts || []);
      }
    } catch (e) {
      console.error('Error fetching accounts:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefreshAccount = async (id: string) => {
    setRefreshingAccountIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/discord/accounts/${id}/refresh`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Account @${data.account.username} refreshed`, 'success');
        setAccounts((prev) =>
          prev.map((acc) => (acc.id === id ? data.account : acc))
        );
      } else {
        showToast(data.error || 'Failed to refresh', 'error');
      }
    } catch {
      showToast('Network error during sync', 'error');
    } finally {
      setRefreshingAccountIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleReconnect = async (id: string) => {
    try {
      const res = await fetch(`/api/discord/accounts/${id}/reconnect`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.message || data.error || 'Failed to reconnect', 'error');
      }
    } catch {
      showToast('Error initiating reconnect', 'error');
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
        showToast('Failed to disconnect', 'error');
      }
    } catch {
      showToast('Error disconnecting account', 'error');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const filteredAccounts = accounts.filter(
    (acc) =>
      acc.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (acc.globalName &&
        acc.globalName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      acc.discordUserId.includes(searchQuery)
  );

  return (
    <div className="flex min-h-screen bg-[#141517] text-[#F2F3F5]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          title="Connected Accounts"
          subtitle="Manage each Discord account's authorization status and profile details"
          onAddAccount={() => setIsAddModalOpen(true)}
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
          {/* Top Search bar */}
          <div className="flex items-center justify-between gap-4 bg-[#1E1F22] p-3.5 rounded-2xl border border-[#3F4147]/50">
            <div className="relative flex-1">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search connected accounts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#2B2D31] text-xs text-white placeholder-zinc-400 pl-10 pr-4 py-2.5 rounded-xl border border-[#3F4147]/60 focus:outline-none focus:border-[#5865F2] transition-colors"
              />
            </div>
            <span className="text-xs text-zinc-400 font-medium whitespace-nowrap px-2">
              {filteredAccounts.length} {filteredAccounts.length === 1 ? 'account' : 'accounts'}
            </span>
          </div>

          {/* Accounts Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-[#2B2D31] border border-[#3F4147]/40 rounded-2xl p-5 h-48 animate-pulse"
                />
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
            <div className="bg-[#2B2D31]/40 border border-[#3F4147]/50 rounded-3xl p-12 text-center max-w-lg mx-auto my-8 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[#5865F2]/15 text-[#5865F2] flex items-center justify-center mx-auto">
                <Users size={32} />
              </div>
              <h3 className="text-base font-bold text-white">No accounts found</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Click below to add and authorize a Discord account via official OAuth2.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-[#5865F2] hover:bg-[#4752C4] rounded-xl shadow-lg shadow-[#5865F2]/25"
              >
                <Plus size={16} />
                <span>Add Discord Account</span>
              </button>
            </div>
          )}
        </main>
      </div>

      <MobileNav />

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

