'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import { NotificationItem } from '@/lib/types';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const meRes = await fetch('/api/auth/me');
      if (!meRes.ok) {
        router.push('/login');
        return;
      }
      const meData = await meRes.json();
      setUser(meData.user);

      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, readAt: new Date().toISOString() }))
      );
    } catch (e) {
      console.error('Error marking notifications as read:', e);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'account_connected':
        return <CheckCircle2 size={16} className="text-emerald-400" />;
      case 'reauth_required':
        return <AlertTriangle size={16} className="text-amber-400" />;
      case 'account_disconnected':
        return <Trash2 size={16} className="text-rose-400" />;
      default:
        return <Info size={16} className="text-[#5865F2]" />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#141517] text-[#F2F3F5]">
      <Sidebar user={user} unreadCount={unreadCount} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          title="Notification Center"
          subtitle="Audit logs of account connections, sync events, and token expiration alerts"
          unreadNotifications={unreadCount}
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Bell size={18} className="text-[#5865F2]" />
              <span>Activity & Security Alerts</span>
            </h3>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2B2D31] hover:bg-[#313338] text-zinc-300 hover:text-white text-xs font-medium border border-[#3F4147]/60 transition-colors"
              >
                <CheckCheck size={14} />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 bg-[#2B2D31] rounded-2xl border border-[#3F4147]/40 h-20 animate-pulse"
                />
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3">
              {notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                    !item.readAt
                      ? 'bg-[#2B2D31] border-[#5865F2]/40 shadow-sm'
                      : 'bg-[#1E1F22] border-[#3F4147]/40 opacity-80'
                  }`}
                >
                  <div className="p-2 rounded-xl bg-[#141517] shrink-0 mt-0.5">
                    {getNotificationIcon(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-zinc-400 shrink-0 font-mono">
                        {formatDistanceToNow(new Date(item.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-[#2B2D31]/40 border border-[#3F4147]/40 rounded-3xl space-y-2">
              <ShieldCheck size={32} className="text-emerald-400 mx-auto" />
              <p className="text-sm font-semibold text-white">All caught up!</p>
              <p className="text-xs text-zinc-400">
                No new security or sync alerts at this time.
              </p>
            </div>
          )}
        </main>
      </div>

      <MobileNav unreadCount={unreadCount} />
    </div>
  );
}
