'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { MobileNav } from '@/components/MobileNav';
import {
  ShieldCheck,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Server,
  Database,
  Lock,
  RefreshCw,
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string | null } | null>(null);
  const [health, setHealth] = useState<{
    status: string;
    discordOAuthConfigured: boolean;
    version: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const healthRes = await fetch('/api/health');
        if (healthRes.ok) {
          const healthData = await healthRes.json();
          setHealth(healthData);
        }
      } catch (e) {
        console.error('Settings load error', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#141517] text-[#F2F3F5]">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <Header
          title="Settings & Configuration"
          subtitle="System security status, Discord Developer Portal integration guide, and environment keys"
        />

        <main className="flex-1 p-6 space-y-6 max-w-4xl w-full mx-auto">
          {/* System Health & Status */}
          <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-[#3F4147]/40 pb-3">
              <Server size={18} className="text-[#5865F2]" />
              <span>System & Environment Status</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-[#1E1F22] rounded-2xl border border-[#3F4147]/40 space-y-1">
                <span className="text-zinc-400">Database Engine</span>
                <p className="text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Database size={14} />
                  <span>MongoDB (Prisma ORM)</span>
                </p>
              </div>

              <div className="p-4 bg-[#1E1F22] rounded-2xl border border-[#3F4147]/40 space-y-1">
                <span className="text-zinc-400">Encryption Layer</span>
                <p className="text-emerald-400 font-semibold flex items-center gap-1.5 pt-1">
                  <Lock size={14} />
                  <span>AES-256-GCM Active</span>
                </p>
              </div>

              <div className="p-4 bg-[#1E1F22] rounded-2xl border border-[#3F4147]/40 space-y-1">
                <span className="text-zinc-400">Discord OAuth2 Keys</span>
                <p
                  className={`font-semibold flex items-center gap-1.5 pt-1 ${
                    health?.discordOAuthConfigured
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {health?.discordOAuthConfigured ? (
                    <>
                      <CheckCircle2 size={14} />
                      <span>Configured</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle size={14} />
                      <span>Pending Setup / Demo</span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Discord Developer Portal Setup Guide */}
          <div className="bg-[#2B2D31] border border-[#3F4147]/60 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#3F4147]/40 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Key size={18} className="text-[#5865F2]" />
                <span>Discord Developer Portal Setup Guide</span>
              </h3>
              <a
                href="https://discord.com/developers/applications"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-[#5865F2] hover:text-[#8891f7] font-medium"
              >
                <span>Open Discord Portal</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <div className="space-y-4 text-xs text-zinc-300">
              <p className="text-zinc-400 leading-relaxed">
                To connect real Discord accounts using the official OAuth2 flow, register a free application in Discord&apos;s Developer Portal:
              </p>

              <ol className="list-decimal list-inside space-y-2.5 text-zinc-300 leading-relaxed">
                <li>
                  Go to{' '}
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#5865F2] underline"
                  >
                    Discord Developer Portal
                  </a>{' '}
                  and click <span className="font-semibold text-white">New Application</span>.
                </li>
                <li>
                  Navigate to <span className="font-semibold text-white">OAuth2</span> in the left sidebar.
                </li>
                <li>
                  In the <span className="font-semibold text-white">Redirects</span> section, add:
                  <div className="mt-1.5 p-2.5 bg-[#141517] rounded-xl font-mono text-zinc-200 border border-[#3F4147]/60 select-all">
                    http://localhost:3000/api/auth/discord/callback
                  </div>
                </li>
                <li>
                  Copy your <span className="font-semibold text-white">Client ID</span> and{' '}
                  <span className="font-semibold text-white">Client Secret</span> (Reset Secret if needed).
                </li>
                <li>
                  Paste them into your <span className="font-mono text-zinc-200">.env</span> file:
                  <pre className="mt-1.5 p-3 bg-[#141517] rounded-xl font-mono text-[11px] text-emerald-400 border border-[#3F4147]/60 overflow-x-auto">
{`DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback`}
                  </pre>
                </li>
              </ol>
            </div>
          </div>

          {/* Security Boundary Declaration */}
          <div className="bg-[#1E1F22] border border-[#3F4147]/50 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <span>Strict Security & Official API Policy</span>
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              This dashboard strictly implements official Discord OAuth2 and REST API capabilities.
              It does not use self-bots, token extraction from local storage, cookie scraping, browser automation, or undocumented private endpoints.
            </p>
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
