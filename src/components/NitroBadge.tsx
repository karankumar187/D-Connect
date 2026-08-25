import React from 'react';
import { NitroStatus } from '@/lib/types';
import { Sparkles, HelpCircle, MinusCircle } from 'lucide-react';

interface NitroBadgeProps {
  status: NitroStatus | string;
  plan?: string | null;
  size?: 'sm' | 'md';
}

export function NitroBadge({ status, plan, size = 'md' }: NitroBadgeProps) {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = isSmall ? 12 : 14;

  if (status === 'active') {
    return (
      <span
        title={plan || 'Discord Nitro Active'}
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-[#5865F2]/15 text-[#8891f7] border border-[#5865F2]/30 ${sizeClasses}`}
      >
        <Sparkles size={iconSize} className="text-[#EB459E]" />
        <span>{plan || 'Nitro Active'}</span>
      </span>
    );
  }

  if (status === 'inactive') {
    return (
      <span
        title="No active Discord Nitro subscription detected via API"
        className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-700/30 text-zinc-400 border border-zinc-700/50 ${sizeClasses}`}
      >
        <MinusCircle size={iconSize} className="text-zinc-500" />
        <span>No Nitro</span>
      </span>
    );
  }

  // Not available or Unknown (Official API restriction)
  return (
    <span
      title="Nitro status is not exposed by standard Discord API without partner identify.premium scope"
      className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 ${sizeClasses}`}
    >
      <HelpCircle size={iconSize} className="text-zinc-500" />
      <span>API Restricted</span>
    </span>
  );
}
