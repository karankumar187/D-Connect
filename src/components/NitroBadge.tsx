import React from 'react';
import { NitroStatus } from '@/lib/types';
import { Sparkles, MinusCircle, HelpCircle } from 'lucide-react';

interface NitroBadgeProps {
  status: NitroStatus | string;
  plan?: string | null;
  size?: 'sm' | 'md';
}

export function NitroBadge({ status, plan, size = 'md' }: NitroBadgeProps) {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall
    ? 'px-2.5 py-0.5 text-[10px]'
    : 'px-3 py-1 text-xs';
  const iconSize = isSmall ? 11 : 13;

  if (status === 'active' || (plan && plan !== 'None')) {
    const planName = plan || 'Nitro';

    if (planName.includes('Basic')) {
      return (
        <span
          title="Discord Nitro Basic ($2.99/mo)"
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-[#1E3A8A]/30 text-[#93C5FD] border border-[#3B82F6]/40 shadow-sm ${sizeClasses}`}
        >
          <Sparkles size={iconSize} className="text-[#60A5FA]" />
          <span>Nitro Basic</span>
        </span>
      );
    }

    if (planName.includes('Classic')) {
      return (
        <span
          title="Discord Nitro Classic ($4.99/mo)"
          className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-[#312E81]/30 text-[#C7D2FE] border border-[#6366F1]/40 shadow-sm ${sizeClasses}`}
        >
          <Sparkles size={iconSize} className="text-[#818CF8]" />
          <span>Nitro Classic</span>
        </span>
      );
    }

    // Default Full Nitro ($9.99/mo)
    return (
      <span
        title="Discord Nitro ($9.99/mo - 2x Server Boosts, HD Stream, 500MB)"
        className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-gradient-to-r from-[#7C3AED]/30 to-[#9333EA]/30 text-[#DDD6FE] border border-[#7C3AED]/50 shadow-sm shadow-purple-900/30 ${sizeClasses}`}
      >
        <Sparkles size={iconSize} className="text-[#C084FC]" />
        <span>{planName}</span>
      </span>
    );
  }

  if (status === 'inactive' || plan === 'None') {
    return (
      <span
        title="No active Discord Nitro subscription"
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#1A1B20] text-zinc-400 border border-[#22242A] ${sizeClasses}`}
      >
        <MinusCircle size={iconSize} className="text-zinc-500" />
        <span>No Nitro</span>
      </span>
    );
  }

  // Not available or unknown
  return (
    <span
      title="Nitro status not exposed on standard Discord API"
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#1A1B20] text-zinc-400 border border-[#22242A] ${sizeClasses}`}
    >
      <HelpCircle size={iconSize} className="text-zinc-500" />
      <span>No Nitro</span>
    </span>
  );
}
