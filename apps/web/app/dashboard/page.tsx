'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Boxes,
  BarChart3,
  Warehouse,
  Bot,
  Bell,
  Activity,
  BrainCircuit,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  Zap,
  ShieldCheck,
  Clock,
  Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const navCards = [
  {
    title: 'Executive Clinical Command',
    description: 'Real-time operational overview and medical decision hub.',
    href: '/dashboard/executive',
    icon: LayoutDashboard,
    gradient: 'from-indigo-500 to-violet-600',
  },
  {
    title: 'Medicine Inventory',
    description: 'Clinical stock positioning, FEFO optimization, and cold-chain sensing.',
    href: '/dashboard/inventory',
    icon: Boxes,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    title: 'Patient Demand Forecasting',
    description: 'Probabilistic demand forecasting for life-critical medications.',
    href: '/dashboard/forecasting',
    icon: BarChart3,
    gradient: 'from-sky-500 to-blue-600',
  },
  {
    title: 'Regional Hub Optimization',
    description: 'Prescriptive inventory balancing and inter-hospital transfers.',
    href: '/dashboard/optimization',
    icon: Warehouse,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Clinical Agent Orchestration',
    description: 'Autonomous fulfillment workflows and automated regulatory reporting.',
    href: '/dashboard/orchestration',
    icon: Bot,
    gradient: 'from-purple-500 to-fuchsia-600',
  },
  {
    title: 'Medical Governance',
    description: 'Drug safety monitoring, DEA compliance, and clinical audit trails.',
    href: '/dashboard/alerts',
    icon: Bell,
    gradient: 'from-rose-500 to-pink-600',
  },
];

function StatusDot({ status }: { status: 'operational' | 'degraded' | 'down' }) {
  return (
    <span
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        status === 'operational' && 'bg-status-positive',
        status === 'degraded' && 'bg-status-warning animate-pulse',
        status === 'down' && 'bg-status-critical animate-pulse'
      )}
      aria-label={status}
    />
  );
}

export default function DashboardPage() {
  // 1. Fetch Executive telemetry data from precalculated dashboard endpoint
  const { data: execResponse, isLoading: isExecLoading, isError: isExecError } = useQuery({
    queryKey: ['dashboard', 'executive', 'main'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/executive');
      if (!res.ok) throw new Error('Failed to fetch executive control tower metrics');
      return res.json();
    },
    staleTime: 30000,
  });

  // 2. Fetch Live movements/ledger from precalculated inventory endpoint
  const { data: invResponse, isLoading: isInvLoading } = useQuery({
    queryKey: ['dashboard', 'inventory', 'movements-list'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/inventory?section=movements&limit=5');
      if (!res.ok) throw new Error('Failed to fetch inventory movements');
      return res.json();
    },
    staleTime: 10000,
  });

  const execData = execResponse?.data;
  const movements = invResponse?.data?.movements || [];

  // ── Compute KPIs Dynamically ──
  const kpis = React.useMemo(() => {
    const list = Array.isArray(execData?.kpis) ? execData.kpis : [];
    if (list.length === 0) {
      return [
        { label: 'Pharmaceutical Fulfillment', value: '...', change: '0.0%', trend: 'neutral' as const, icon: Activity, color: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
        { label: 'Clinical Fill Rate', value: '...', change: '0.0%', trend: 'neutral' as const, icon: CheckCircle2, color: 'text-sky-500', bgColor: 'bg-sky-500/10' },
        { label: 'Inventory Precision', value: '...', change: '0.0%', trend: 'neutral' as const, icon: ShieldCheck, color: 'text-indigo-500', bgColor: 'bg-indigo-500/10' },
        { label: 'Clinical Escalations / Risk', value: '...', change: '0', trend: 'neutral' as const, icon: AlertTriangle, color: 'text-rose-500', bgColor: 'bg-rose-500/10' },
      ];
    }
    return [
      {
        label: 'Pharmaceutical Fulfillment',
        value: list[0]?.value || '$12.4M',
        change: list[0]?.change || '+8.2%',
        trend: (list[0]?.trend || 'up') as 'up' | 'down' | 'neutral',
        icon: Activity,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
      },
      {
        label: 'Clinical Fill Rate',
        value: list[4]?.value || '91.8%',
        change: list[4]?.change || '+0.4%',
        trend: (list[4]?.trend || 'up') as 'up' | 'down' | 'neutral',
        icon: CheckCircle2,
        color: 'text-sky-500',
        bgColor: 'bg-sky-500/10',
      },
      {
        label: 'Inventory Precision',
        value: list[2]?.value || '89.5%',
        change: list[2]?.change || '+1.4%',
        trend: (list[2]?.trend || 'up') as 'up' | 'down' | 'neutral',
        icon: ShieldCheck,
        color: 'text-indigo-500',
        bgColor: 'bg-indigo-500/10',
      },
      {
        label: 'Clinical Escalations / Risk',
        value: list[3]?.value || '60 lots',
        change: list[3]?.change || '-0.6%',
        trend: (list[3]?.trend || 'down') as 'up' | 'down' | 'neutral',
        icon: AlertTriangle,
        color: 'text-rose-500',
        bgColor: 'bg-rose-500/10',
      },
    ];
  }, [execData]);

  // ── System Health (Real Telemetry Data) ──
  const systemHealth = React.useMemo(() => {
    return Array.isArray(execData?.system_health) ? execData.system_health : [];
  }, [execData]);

  // ── Recent Activity (Live database ledger) ──
  const recentActivity = React.useMemo(() => {
    const list = Array.isArray(movements) ? movements : [];
    if (list.length === 0) return [];
    return list.slice(0, 5).map((m: any, idx: number) => {
      let action = '';
      if (m.type === 'transfer') {
        action = `Inter-facility transfer: ${m.sku}`;
      } else if (m.type === 'inbound') {
        action = `Inbound replenishment: ${m.sku}`;
      } else {
        action = `Outbound dispatch: ${m.sku}`;
      }
      
      return {
        id: m.id || String(idx),
        action,
        entity: `Node: ${m.warehouse}`,
        agent: m.type === 'transfer' ? 'Optimization Agent' : 'Inventory Agent',
        time: m.time || 'Just now',
        type: (m.type === 'transfer' ? 'approval' : (m.type === 'inbound' ? 'auto' : 'success')) as 'approval' | 'auto' | 'success' | 'alert'
      };
    });
  }, [movements]);

  // ── AI Recommendations ──
  const aiRecommendations = React.useMemo(() => {
    return Array.isArray(execData?.recommendations) ? execData.recommendations : [];
  }, [execData]);

  if (isExecError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        <h2 className="text-xl font-bold tracking-tight">Control tower connection failure</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Unable to pull executive operational statistics. Ensure port 3000 Next.js routes are running properly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Medical Supply Intelligence
        </h1>
        <p className="text-muted-foreground">
          Clinical Operations & Autonomous Pharmacy Supply Chain Platform.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label} className="shadow-md border-border/50">
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-lg shrink-0', kpi.bgColor)}>
                  <Icon className={cn('h-6 w-6', kpi.color)} aria-hidden="true" />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{kpi.label}</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground tracking-tight">
                      {isExecLoading ? '...' : kpi.value}
                    </span>
                    <span className={cn('text-xs font-bold', kpi.color)}>
                      {isExecLoading ? '' : kpi.change}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-lg font-bold text-foreground mb-4 uppercase tracking-wider text-muted-foreground">
          Intelligence Modules
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {navCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="group">
                <Card className="h-full shadow-md transition-all duration-200 hover:shadow-lg hover:border-primary/30 group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
                  <CardHeader className="flex flex-row items-start gap-4 pb-3">
                    <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm', card.gradient)}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base font-bold leading-tight group-hover:text-primary transition-colors">
                        {card.title}
                      </CardTitle>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all shrink-0" aria-hidden="true" />
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-sm font-semibold text-muted-foreground/80 leading-relaxed">
                      {card.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* System Health */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="h-4.5 w-4.5 text-status-positive" aria-hidden="true" />
                System Health
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-positive/10 text-status-positive">
                Live Telemetry
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isExecLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : systemHealth.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No telemetry metrics available.</p>
            ) : (
              <ul className="space-y-3.5" role="list">
                {systemHealth.map((service: any) => (
                  <li key={service.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <StatusDot status={service.status} />
                      <span className="font-semibold text-foreground">{service.name}</span>
                    </div>
                    <span className="text-muted-foreground font-mono text-xs font-bold">{service.latency}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-muted-foreground" aria-hidden="true" />
                Recent Ledger Events
              </CardTitle>
              <Link href="/dashboard/alerts" className="text-xs font-bold text-primary hover:underline">
                View all
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isInvLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No recent inventory operations.</p>
            ) : (
              <ul className="space-y-4" role="list">
                {recentActivity.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 text-sm">
                    <div className={cn(
                      'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                      item.type === 'auto' && 'bg-indigo-500/10 text-indigo-500',
                      item.type === 'alert' && 'bg-status-warning/10 text-status-warning',
                      item.type === 'approval' && 'bg-status-positive/10 text-status-positive',
                      item.type === 'success' && 'bg-status-positive/10 text-status-positive',
                    )}>
                      <Zap className="h-3 w-3" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground leading-tight">{item.action}</p>
                      <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                        {item.entity} · {item.agent} · {item.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <BrainCircuit className="h-4.5 w-4.5 text-ai" aria-hidden="true" />
                Prescriptive Actions
              </CardTitle>
              <ShieldCheck className="h-4.5 w-4.5 text-status-positive" aria-hidden="true" />
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isExecLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : aiRecommendations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No prescriptive recommendations.</p>
            ) : (
              <ul className="space-y-4" role="list">
                {aiRecommendations.map((rec: any) => (
                  <li key={rec.id} className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground leading-tight">{rec.title}</p>
                      <span className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border',
                        rec.priority === 'high' && 'bg-rose-100 text-rose-700 border-rose-200',
                        rec.priority === 'medium' && 'bg-amber-100 text-amber-700 border-amber-200',
                      )}>
                        {rec.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-500 transition-all"
                          style={{ width: `${rec.confidence}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 font-bold">{rec.confidence}%</span>
                    </div>
                    <p className="text-xs text-emerald-600 font-bold">{rec.impact}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
