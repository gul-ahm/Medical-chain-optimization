'use client';

import * as React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  subtitle?: string;
  footer?: React.ReactNode;
  isLive?: boolean;
  isLoading?: boolean;
  className?: string;
}

export function KpiCard({
  title,
  value,
  change,
  trend = 'neutral',
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  subtitle,
  footer,
  isLive = false,
  isLoading = false,
  className,
}: KpiCardProps) {
  const trendColor = trend === 'up' ? 'text-status-positive' : trend === 'down' ? 'text-status-critical' : 'text-muted-foreground';
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  if (isLoading) {
    return (
      <Card className={cn('transition-shadow hover:shadow-md', className)}>
        <CardContent className="p-5">
          <div className="animate-pulse space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-9 w-9 rounded-lg bg-muted" />
              <div className="h-4 w-12 rounded bg-muted" />
            </div>
            <div className="h-7 w-24 rounded bg-muted" />
            <div className="h-3 w-32 rounded bg-muted" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('transition-all duration-200 hover:shadow-md group', className)}>
      <CardContent className="p-5">
        {/* Top row: icon + trend */}
        <div className="flex items-center justify-between mb-3">
          {Icon && (
            <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg transition-transform group-hover:scale-105', iconBg)}>
              <Icon className={cn('h-4.5 w-4.5', iconColor)} aria-hidden="true" />
            </div>
          )}
          {change && (
            <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', trendColor)}>
              <TrendIcon className="h-3 w-3" aria-hidden="true" />
              {change}
            </span>
          )}
        </div>

        {/* Value */}
        <p className="text-2xl font-bold text-foreground leading-none tracking-tight">{value}</p>

        {/* Title + live indicator */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <p className="text-xs text-muted-foreground">{title}</p>
          {isLive && (
            <span className="flex items-center gap-1 text-[10px] text-status-positive font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-status-positive animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        {/* Optional subtitle */}
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/70 mt-1">{subtitle}</p>
        )}

        {/* Optional footer */}
        {footer && (
          <div className="mt-3 pt-3 border-t border-border">
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
