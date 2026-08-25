'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Search, Bell, LogOut, LayoutDashboard, Users } from 'lucide-react';

interface TopNavProps {
  user?: {
    email: string;
    name?: string | null;
  } | null;
  unreadCount?: number;
  onSearchClick?: () => void;
}

export function TopNav({ user, unreadCount = 0, onSearchClick }: TopNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    { label: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' || pathname === '/', icon: LayoutDashboard },
    { label: 'Accounts', href: '/accounts', active: pathname.startsWith('/accounts'), icon: Users },
    {
      label: 'Notifications',
      href: '/notifications',
      active: pathname.startsWith('/notifications'),
      badge: unreadCount > 0 ? unreadCount : undefined,
      icon: Bell,
    },
  ];

  return (
    <>
      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-5 pb-3 flex items-center justify-between gap-3 z-40">
        {/* Brand Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#C084FC] p-[1.5px] flex items-center justify-center shadow-lg shadow-purple-900/40 group-hover:scale-105 transition-transform ring-2 ring-purple-500/20">
            <div className="w-full h-full bg-[#0A0A0C] rounded-full flex items-center justify-center">
              <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#DDD6FE] shadow-inner" />
            </div>
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white font-sans flex items-center gap-1.5">
            <span>D-Connect</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-pulse" />
          </span>
        </Link>

        {/* Desktop Floating Center Pill Navigation */}
        <nav className="hidden md:flex items-center bg-[#141518]/90 backdrop-blur-md border border-[#2B2245]/80 hover:border-purple-500/30 rounded-full p-1 shadow-lg shadow-black/40 transition-colors">
          {navItems.map((item) => {
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-white to-zinc-100 text-black font-semibold shadow-md shadow-white/10'
                    : 'text-zinc-400 hover:text-white hover:bg-purple-950/20'
                }`}
              >
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="ml-1.5 text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#7C3AED] text-white shadow-sm shadow-purple-900/40">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons & Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Search button */}
          {onSearchClick ? (
            <button
              onClick={onSearchClick}
              className="w-9 h-9 rounded-full bg-[#141518] hover:bg-[#1C1D24] border border-[#22242A] hover:border-purple-500/40 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Search"
            >
              <Search size={15} />
            </button>
          ) : (
            <Link
              href="/accounts"
              className="w-9 h-9 rounded-full bg-[#141518] hover:bg-[#1C1D24] border border-[#22242A] hover:border-purple-500/40 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
              title="Search accounts"
            >
              <Search size={15} />
            </Link>
          )}

          {/* Notifications button */}
          <Link
            href="/notifications"
            className="relative w-9 h-9 rounded-full bg-[#141518] hover:bg-[#1C1D24] border border-[#22242A] hover:border-purple-500/40 flex items-center justify-center text-zinc-300 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell size={15} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#A855F7] ring-2 ring-[#141518] shadow-sm shadow-purple-500/50" />
            )}
          </Link>

          {/* User Profile Capsule / Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full bg-[#141518] hover:bg-[#1C1D24] border border-[#22242A] hover:border-purple-500/40 transition-all ring-1 ring-purple-500/10"
              aria-label="User profile menu"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#C084FC] flex items-center justify-center text-white text-xs font-bold uppercase shadow-md shadow-purple-900/30">
                {user?.name ? user.name.charAt(0) : user?.email?.charAt(0) || 'U'}
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#141518] border border-[#2B2245] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-[#22242A] mb-1">
                  <p className="text-xs font-semibold text-white truncate">
                    {user?.name || 'Dashboard User'}
                  </p>
                  <p className="text-[11px] text-[#A855F7] truncate">{user?.email}</p>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut size={14} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Floating Mobile Bottom Navigation Bar (Visible only on mobile screens < 768px) */}
      <div className="md:hidden fixed bottom-4 inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav className="pointer-events-auto flex items-center gap-1 bg-[#141518]/95 backdrop-blur-xl border border-[#2B2245]/90 rounded-full px-3 py-2 shadow-2xl shadow-black/80 ring-1 ring-purple-500/20">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-gradient-to-r from-white to-zinc-100 text-black font-semibold shadow-md shadow-white/10'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#7C3AED] text-white">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
