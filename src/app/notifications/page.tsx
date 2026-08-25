'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TopNav } from '@/components/TopNav';
import { NotificationItem } from '@/lib/types';
import {
  Bell,
  CheckCheck,
  ShieldCheck,
  AlertTriangle,
  Info,
  CheckCircle2,
  Trash2,
  ArrowLeft,
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
        return <CheckCircle2 size={15} className="text-emerald-400" />;
      case 'reauth_required':
        return <AlertTriangle size={15} className="text-amber-400" />;
      case 'account_disconnected':
        return <Trash2 size={15} className="text-rose-400" />;
      default:
        return <Info size={15} className="text-[#A855F7]" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] pb-16 selection:bg-[#7C3AED] selection:text-white">
      <TopNav user={user} unreadCount={unreadCount} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-white font-sans">
              Notifications
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Audit log of connections, token alerts, and synchronization events
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#141518] hover:bg-[#1A1B20] text-zinc-300 hover:text-white text-xs font-medium border border-[#22242A] transition-colors"
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
                className="p-4 bg-[#141518] rounded-3xl border border-[#22242A] h-20 animate-pulse"
              />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-3xl border transition-all flex items-start gap-3.5 ${
                  !item.readAt
                    ? 'bg-[#141518] border-[#7C3AED]/40 shadow-lg shadow-purple-950/20'
                    : 'bg-[#101114] border-[#22242A]/60 opacity-75'
                }`}
              >
                <div className="p-2 rounded-full bg-[#1A1B20] border border-[#22242A] shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-semibold text-white truncate">
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
          <div className="p-12 text-center bg-[#141518] border border-[#22242A] rounded-3xl space-y-2">
            <ShieldCheck size={28} className="text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">All caught up!</p>
            <p className="text-xs text-zinc-400">
              No new security or sync alerts at this time.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
