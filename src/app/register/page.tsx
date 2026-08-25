'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, Lock, Mail, User } from 'lucide-react';

function RegisterContent() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Network connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-[#F3F4F6] flex flex-col justify-center items-center p-4 selection:bg-[#7C3AED] selection:text-white">
      {/* Brand Header */}
      <div className="mb-8 text-center space-y-2">
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#9333EA] to-[#C084FC] p-[2px] flex items-center justify-center mx-auto shadow-xl shadow-purple-900/30">
          <div className="w-full h-full bg-[#0A0A0C] rounded-full flex items-center justify-center">
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#A855F7] to-[#DDD6FE]" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-sans">
          Create an account
        </h1>
        <p className="text-xs text-zinc-400">
          Start managing all your Discord accounts securely
        </p>
      </div>

      {/* Register Card */}
      <div className="w-full max-w-sm bg-[#141518] border border-[#22242A] rounded-3xl p-7 shadow-2xl space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-rose-400 text-xs leading-relaxed animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Your name</label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-[#1A1B20] text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-3 rounded-2xl border border-[#22242A] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Email address</label>
            <div className="relative">
              <Mail
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#1A1B20] text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-3 rounded-2xl border border-[#22242A] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300">Password</label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#1A1B20] text-xs text-white placeholder-zinc-500 pl-10 pr-4 py-3 rounded-2xl border border-[#22242A] focus:outline-none focus:border-[#7C3AED] transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white hover:bg-zinc-200 text-black text-xs font-semibold py-3.5 px-4 rounded-full shadow-lg shadow-white/5 transition-all disabled:opacity-50 active:scale-[0.98] mt-2"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#22242A]/60 text-center text-xs text-zinc-400">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-white hover:text-[#A855F7] font-semibold transition-colors"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
