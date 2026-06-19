'use client';

import * as React from 'react';
import { RefreshCw, Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConnectionStatus } from '@/lib/realtime/useRealtimeStream';

export interface StreamStatusProps {
  status: ConnectionStatus;
  retryCount?: number;
  updatedAt?: string | null;
  onReconnect?: () => void;
  className?: string;
  compact?: boolean;
}

export function StreamStatus({
  status,
  retryCount = 0,
  updatedAt,
  onReconnect,
  className,
  compact = false,
}: StreamStatusProps) {
  const isConnected = status === 'connected';
  const isReconnecting = status === 'reconnecting';
  const isError = status === 'error';

  if (compact) {
    return (
      <span
        className={cn('inline-flex items-center gap-1.5', className)}
        title={`Stream: ${status}${retryCount > 0 ? ` (retry ${retryCount})` : ''}`}
      >
        <span
          className={cn(
            'h-2 w-2 rounded-full',
            isConnected && 'bg-status-positive animate-pulse',
            isReconnecting && 'bg-status-warning animate-ping',
            isError && 'bg-status-critical',
            status === 'disconnected' && 'bg-muted-foreground',
            status === 'connecting' && 'bg-sky-400 animate-pulse',
          )}
        />
        {!compact && (
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
            {isConnected ? 'Live' : status}
          </span>
        )}
      </span>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Status pill */}
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
          isConnected && 'bg-status-positive/10 text-status-positive',
          isReconnecting && 'bg-status-warning/10 text-status-warning',
          isError && 'bg-status-critical/10 text-status-critical',
          status === 'disconnected' && 'bg-muted text-muted-foreground',
          status === 'connecting' && 'bg-sky-500/10 text-sky-500',
        )}
      >
        {isConnected && <Wifi className="h-3 w-3" aria-hidden="true" />}
        {(isReconnecting || status === 'connecting') && (
          <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
        )}
        {(status === 'disconnected' || isError) && <WifiOff className="h-3 w-3" aria-hidden="true" />}

        {isConnected ? 'Live' : isReconnecting ? `Retry ${retryCount}` : status}
      </span>

      {/* Last updated timestamp */}
      {isConnected && updatedAt && (
        <span className="text-[10px] text-muted-foreground hidden sm:inline">
          Updated {updatedAt}
        </span>
      )}

      {/* Error reconnect button */}
      {(isError || status === 'disconnected') && onReconnect && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 text-xs px-2"
          onClick={onReconnect}
          aria-label="Reconnect stream"
        >
          <RefreshCw className="h-3 w-3" /> Reconnect
        </Button>
      )}

      {/* Error icon */}
      {isError && (
        <AlertCircle className="h-3.5 w-3.5 text-status-critical" aria-hidden="true" />
      )}
    </div>
  );
}
