'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Bell, Settings } from 'lucide-react';

export function MobileNav({ unreadCount = 0 }: { unreadCount?: number }) {
  const pathname = usePathname();

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
      label: 'Alerts',
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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#1E1F22] border-t border-[#3F4147]/60 px-4 py-2 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-xs font-medium relative transition-colors ${
              item.active ? 'text-[#5865F2]' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Icon size={20} />
            <span className="text-[10px]">{item.label}</span>
            {item.badge !== undefined && (
              <span className="absolute top-0 right-2 w-3.5 h-3.5 bg-[#5865F2] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
