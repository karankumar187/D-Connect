'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bell,
  Settings,
  LogOut,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface SidebarProps {
  user?: {
    email: string;
    name?: string | null;
  } | null;
  unreadCount?: number;
}

export function Sidebar({ user, unreadCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error', e);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/',
    },
    {
      label: 'Accounts',
      href: '/accounts',
      icon: Users,
      active: pathname.startsWith('/accounts'),
    },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: Bell,
      active: pathname.startsWith('/notifications'),
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: Settings,
      active: pathname.startsWith('/settings'),
    },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#1E1F22] border-r border-[#3F4147]/40 h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-6 h-16 border-b border-[#3F4147]/40">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#5865F2] to-[#8891f7] flex items-center justify-center shadow-md shadow-[#5865F2]/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white leading-tight">
            Discord Hub
          </h1>
          <p className="text-[11px] text-zinc-400 font-medium">Multi-Account SaaS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2">
          <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase">
            Management
          </span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                item.active
                  ? 'bg-[#5865F2] text-white shadow-sm shadow-[#5865F2]/30'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#2B2D31]/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className={item.active ? 'text-white' : 'text-zinc-400'} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    item.active
                      ? 'bg-white text-[#5865F2]'
                      : 'bg-[#5865F2] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Security Status Card */}
      <div className="px-4 py-3 mx-3 mb-4 rounded-xl bg-[#2B2D31]/80 border border-[#3F4147]/50">
        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
          <ShieldCheck size={14} />
          <span>Official OAuth2 & AES-256</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-relaxed">
          Tokens encrypted at rest. Zero self-bots or token pasting.
        </p>
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-[#3F4147]/40 flex items-center justify-between bg-[#141517]/50">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#3F4147] flex items-center justify-center text-xs font-semibold text-white uppercase shrink-0">
            {user?.name ? user.name.charAt(0) : user?.email?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-medium text-white truncate">
              {user?.name || user?.email || 'Dashboard User'}
            </p>
            <p className="text-[10px] text-zinc-400 truncate">
              {user?.email || 'user@local'}
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          title="Log out"
          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
