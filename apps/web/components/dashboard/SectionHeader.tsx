import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps {
  title: string;
  description?: string;
  icon?: React.ElementType;
  iconColor?: string;
  badge?: React.ReactNode;
  isLive?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  icon: Icon,
  iconColor = 'text-primary',
  badge,
  isLive = false,
  actions,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {Icon && <Icon className={cn('h-5 w-5 shrink-0', iconColor)} aria-hidden="true" />}
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
          {isLive && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-status-positive bg-status-positive/10 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-status-positive animate-pulse" />
              LIVE
            </span>
          )}
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 mt-2 sm:mt-0 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
