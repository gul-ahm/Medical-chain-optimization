'use client';

import * as React from 'react';
import {
  Bell, X, CheckCheck, Filter, AlertTriangle, AlertCircle, Info,
  BrainCircuit, Bot, Boxes, BarChart3, Warehouse, ShieldCheck, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRealtimeStream } from '@/lib/realtime/useRealtimeStream';
import { cn } from '@/lib/utils';

// ── Types ──
export type NotificationSeverity = 'critical' | 'warning' | 'info' | 'success';
export type NotificationDomain =
  | 'inventory' | 'forecasting' | 'optimization' | 'orchestration'
  | 'governance' | 'ai' | 'system';

export interface Notification {
  id: string;
  title: string;
  detail?: string;
  severity: NotificationSeverity;
  domain: NotificationDomain;
  timestamp: Date;
  read: boolean;
  source?: string;
  expanded?: boolean;
}

// ── Seed Data ──
const SEED_NOTIFICATIONS: Notification[] = [
  { id: 's1', title: 'SKU-7823 projected stockout in 48h at WH-04', detail: 'Current stock: 48 units. Reorder point: 200. Auto-reorder queued.', severity: 'critical', domain: 'inventory', timestamp: new Date(Date.now() - 3 * 60000), read: false, source: 'Inventory Agent' },
  { id: 's2', title: 'Forecast drift exceeds 8% threshold for Region NW', detail: 'Drift score: 8.2. Recommend triggering DemandNet retrain.', severity: 'warning', domain: 'forecasting', timestamp: new Date(Date.now() - 12 * 60000), read: false, source: 'Forecasting Agent' },
  { id: 's3', title: 'Transfer WF-9901 awaiting governance approval', detail: 'Policy: Transfer > $50K. Estimated savings: $28,400.', severity: 'warning', domain: 'governance', timestamp: new Date(Date.now() - 18 * 60000), read: true, source: 'Governance Agent' },
  { id: 's4', title: 'DemandNet-v3.2 retrain completed successfully', detail: 'MAPE improved: 5.0% → 4.2%. Model promoted to champion.', severity: 'success', domain: 'ai', timestamp: new Date(Date.now() - 42 * 60000), read: true, source: 'ML Pipeline' },
  { id: 's5', title: 'WH-09 utilization at 95% — approaching capacity', detail: 'Recommend redistributing 1,200 units to WH-07.', severity: 'warning', domain: 'optimization', timestamp: new Date(Date.now() - 55 * 60000), read: true, source: 'Optimization Agent' },
];

// ── Config ──
const DOMAIN_ICONS: Record<NotificationDomain, React.ElementType> = {
  inventory: Boxes, forecasting: BarChart3, optimization: Warehouse,
  orchestration: Bot, governance: ShieldCheck, ai: BrainCircuit, system: AlertCircle,
};

const DOMAIN_COLORS: Record<NotificationDomain, string> = {
  inventory: 'text-emerald-500 bg-emerald-500/10',
  forecasting: 'text-sky-500 bg-sky-500/10',
  optimization: 'text-amber-500 bg-amber-500/10',
  orchestration: 'text-indigo-500 bg-indigo-500/10',
  governance: 'text-violet-500 bg-violet-500/10',
  ai: 'text-ai bg-ai/10',
  system: 'text-muted-foreground bg-muted',
};

const SEVERITY_COLORS: Record<NotificationSeverity, string> = {
  critical: 'bg-status-critical',
  warning: 'bg-status-warning',
  info: 'bg-sky-400',
  success: 'bg-status-positive',
};

const SEVERITY_LABEL_COLORS: Record<NotificationSeverity, string> = {
  critical: 'bg-status-critical/10 text-status-critical',
  warning: 'bg-status-warning/10 text-status-warning',
  info: 'bg-sky-400/10 text-sky-400',
  success: 'bg-status-positive/10 text-status-positive',
};

function formatRelativeTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function inferDomainFromEvent(event: string, payload: Record<string, unknown>): NotificationDomain {
  if (event === 'alert') return (payload.domain as NotificationDomain) || 'system';
  if (event === 'drift_alert') return 'forecasting';
  if (event === 'insight_generated') return 'optimization';
  if (event === 'workflow_update') return 'orchestration';
  if (event === 'escalation_raised') return 'governance';
  if (event === 'system_health') return 'system';
  return 'ai';
}

function eventToNotification(event: string, raw: unknown): Notification | null {
  const payload = (raw as Record<string, unknown>)?.payload as Record<string, unknown> | undefined;
  if (!payload) return null;

  const domain = inferDomainFromEvent(event, payload);
  const severity: NotificationSeverity =
    (payload.severity as NotificationSeverity) ??
    (event === 'drift_alert' ? 'warning' : event === 'escalation_raised' ? 'warning' : 'info');

  const title = (payload.message as string) ??
    (payload.action as string) ??
    (payload.policy as string) ??
    (payload.event as string) ??
    `${event} received`;

  return {
    id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    title,
    detail: (payload.recommendation as string) ?? (payload.resolution as string) ?? undefined,
    severity,
    domain,
    timestamp: new Date(),
    read: false,
    source: (payload.source as string) ?? (payload.agent as string) ?? 'System',
  };
}

const ALL_FILTERS: (NotificationSeverity | 'all')[] = ['all', 'critical', 'warning', 'info', 'success'];

// ── Main Component ──
export interface NotificationCenterProps {
  compact?: boolean;
  maxVisible?: number;
  className?: string;
}

export function NotificationCenter({ compact = false, maxVisible = 50, className }: NotificationCenterProps) {
  const [notifications, setNotifications] = React.useState<Notification[]>(SEED_NOTIFICATIONS);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState<NotificationSeverity | 'all'>('all');
  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const panelRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Stream ──
  useRealtimeStream<unknown>({
    endpoint: '/api/stream/dashboard',
    transport: 'sse',
    eventTypes: ['alert', 'drift_alert', 'insight_generated', 'workflow_update', 'escalation_raised'],
    onMessage: React.useCallback((event: string, payload: unknown) => {
      const notification = eventToNotification(event, payload);
      if (!notification) return;
      setNotifications((prev) => [notification, ...prev].slice(0, maxVisible));
    }, [maxVisible]),
  });

  // ── Click outside ──
  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = filter === 'all' ? notifications : notifications.filter((n) => n.severity === filter);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));
  const clearAll = () => setNotifications([]);
  const toggleExpand = (id: string) => setExpandedIds((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div ref={panelRef} className={cn('relative', className)}>
      {/* Bell trigger */}
      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9"
        onClick={() => setOpen((p) => !p)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-status-critical text-[9px] font-bold text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notification center"
          className={cn(
            'absolute right-0 top-full mt-2 z-50 rounded-lg border border-border bg-popover shadow-xl',
            'animate-in fade-in-0 zoom-in-95',
            compact ? 'w-80' : 'w-[420px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-status-critical text-white rounded-full px-1.5 py-0.5">{unreadCount}</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs px-2" onClick={markAllRead}>
                  <CheckCheck className="h-3 w-3" /> All read
                </Button>
              )}
              <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={clearAll}>Clear</Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} aria-label="Close notifications">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto">
            <Filter className="h-3 w-3 text-muted-foreground shrink-0 mr-1" aria-hidden="true" />
            {ALL_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap transition-colors',
                  filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* List */}
          <div className={cn('overflow-y-auto divide-y divide-border/50', compact ? 'max-h-72' : 'max-h-[480px]')}>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-muted-foreground">
                <Bell className="h-8 w-8 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              filtered.map((n) => {
                const DomainIcon = DOMAIN_ICONS[n.domain];
                const isExpanded = expandedIds.has(n.id);
                return (
                  <div
                    key={n.id}
                    className={cn('group relative px-4 py-3 transition-colors hover:bg-muted/40', !n.read && 'bg-accent/20')}
                    onClick={() => markRead(n.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && markRead(n.id)}
                    aria-label={n.title}
                  >
                    <div className="flex items-start gap-3">
                      {/* Domain icon */}
                      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5', DOMAIN_COLORS[n.domain])}>
                        <DomainIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Unread dot */}
                            {!n.read && (
                              <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', SEVERITY_COLORS[n.severity])} />
                            )}
                            <p className={cn('text-sm leading-tight', !n.read ? 'font-semibold text-foreground' : 'text-foreground/80')}>
                              {n.title}
                            </p>
                          </div>
                          {/* Dismiss */}
                          <button
                            className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-foreground transition-opacity"
                            onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                            aria-label="Dismiss notification"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Meta row */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={cn('text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full', SEVERITY_LABEL_COLORS[n.severity])}>
                            {n.severity}
                          </span>
                          <span className="text-[10px] text-muted-foreground capitalize">{n.domain}</span>
                          {n.source && <span className="text-[10px] text-muted-foreground">· {n.source}</span>}
                          <span className="text-[10px] text-muted-foreground ml-auto">{formatRelativeTime(n.timestamp)}</span>
                        </div>

                        {/* Expandable detail */}
                        {n.detail && (
                          <>
                            <button
                              className="flex items-center gap-0.5 mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                              onClick={(e) => { e.stopPropagation(); toggleExpand(n.id); }}
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              {isExpanded ? 'Less' : 'Details'}
                            </button>
                            {isExpanded && (
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed border-l-2 border-border pl-2">
                                {n.detail}
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border">
            <span className="text-[10px] text-muted-foreground">{filtered.length} notification{filtered.length !== 1 ? 's' : ''}</span>
            <span className="flex items-center gap-1 text-[10px] text-status-positive">
              <span className="h-1.5 w-1.5 rounded-full bg-status-positive animate-pulse" />
              Live
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
