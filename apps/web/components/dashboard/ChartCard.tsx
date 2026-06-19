'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { RefreshCw, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

export interface ChartCardProps {
  title: string;
  subtitle?: string;
  option: EChartsOption | null;
  height?: number;
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  isLive?: boolean;
  errorMessage?: string;
  onRefresh?: () => void;
  toolbar?: React.ReactNode;
  className?: string;
  minimal?: boolean;
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse flex flex-col items-center justify-center gap-3" style={{ height }}>
      <div className="h-3 w-3/4 rounded bg-muted" />
      <div className="flex items-end gap-2 h-1/2 w-3/4">
        {[40, 65, 50, 80, 55, 70, 45, 75, 60].map((h, i) => (
          <div key={i} className="flex-1 rounded-t bg-muted" style={{ height: `${h}%` }} />
        ))}
      </div>
      <div className="h-2 w-2/3 rounded bg-muted" />
    </div>
  );
}

function EmptyState({ height }: { height: number }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-2" style={{ height }}>
      <BarChart3 className="h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
      <p className="text-sm text-muted-foreground">No data available</p>
      <p className="text-xs text-muted-foreground/60">Data will appear here once available.</p>
    </div>
  );
}

function ErrorState({ height, message, onRetry }: { height: number; message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center gap-3" style={{ height }}>
      <AlertCircle className="h-10 w-10 text-status-critical/60" aria-hidden="true" />
      <div>
        <p className="text-sm font-medium text-foreground">Failed to load chart</p>
        <p className="text-xs text-muted-foreground mt-0.5">{message || 'An unexpected error occurred.'}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="gap-1.5">
          <RefreshCw className="h-3 w-3" aria-hidden="true" /> Retry
        </Button>
      )}
    </div>
  );
}

export function ChartCard({
  title,
  subtitle,
  option,
  height = 300,
  isLoading = false,
  isError = false,
  isEmpty = false,
  isLive = false,
  errorMessage,
  onRefresh,
  toolbar,
  className,
  minimal = false,
}: ChartCardProps) {
  const chartContent = isLoading ? (
    <ChartSkeleton height={height} />
  ) : isError ? (
    <ErrorState height={height} message={errorMessage} onRetry={onRefresh} />
  ) : isEmpty || !option ? (
    <EmptyState height={height} />
  ) : (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
      opts={{ renderer: 'svg' }}
    />
  );

  if (minimal) {
    return <div className={cn("w-full", className)}>{chartContent}</div>;
  }

  return (
    <Card className={cn('overflow-hidden flex flex-col justify-between h-full min-h-[320px]', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{title}</CardTitle>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[10px] text-status-positive font-medium bg-status-positive/10 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-status-positive animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
            {subtitle && <CardDescription className="mt-0.5">{subtitle}</CardDescription>}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {toolbar}
            {onRefresh && (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh} aria-label="Refresh chart">
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col justify-center">
        {chartContent}
      </CardContent>
    </Card>
  );
}
