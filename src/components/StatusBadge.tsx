import React from 'react';
import { AuthorizationStatus } from '@/lib/types';
import { CheckCircle2, AlertTriangle, XCircle, Clock, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: AuthorizationStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isSmall = size === 'sm';
  const sizeClasses = isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  const iconSize = isSmall ? 12 : 14;

  switch (status) {
    case 'connected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}
        >
          <CheckCircle2 size={iconSize} className="text-emerald-400" />
          <span>Connected</span>
        </span>
      );

    case 'reauthorization_required':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}
        >
          <AlertTriangle size={iconSize} className="text-amber-400" />
          <span>Needs Reauth</span>
        </span>
      );

    case 'expired':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 ${sizeClasses}`}
        >
          <Clock size={iconSize} className="text-orange-400" />
          <span>Token Expired</span>
        </span>
      );

    case 'disconnected':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 ${sizeClasses}`}
        >
          <XCircle size={iconSize} className="text-zinc-400" />
          <span>Disconnected</span>
        </span>
      );

    case 'error':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}
        >
          <AlertCircle size={iconSize} className="text-rose-400" />
          <span>Sync Error</span>
        </span>
      );
  }
}
