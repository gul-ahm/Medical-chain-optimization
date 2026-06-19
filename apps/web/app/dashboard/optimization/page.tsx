'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Warehouse, ArrowLeftRight, ShieldCheck, AlertTriangle, TrendingDown, BrainCircuit,
  RefreshCw, CheckCircle2, Clock, Package, Zap, XCircle, Loader2
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { ChartCard } from '@/components/dashboard/ChartCard';
import { SectionHeader } from '@/components/dashboard/SectionHeader';
import { DataTable } from '@/components/dashboard/DataTable';
import { StreamStatus } from '@/components/dashboard/StreamStatus';
import { useStreamingDashboard } from '@/lib/hooks/useStreamingDashboard';
import { cn } from '@/lib/utils';
import type { EChartsOption } from 'echarts';
import type { ColumnDef } from '@tanstack/react-table';

// Define Transfer interface matching the backend schema
interface Transfer {
  id: string;
  from: string;
  to: string;
  sku: string;
  qty: number;
  savings: string;
  confidence: number;
  status: string;
}

const transferColumns: ColumnDef<Transfer, unknown>[] = [
  { 
    accessorKey: 'id', 
    header: 'ID', 
    cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.id}</span> 
  },
  { accessorKey: 'from', header: 'From Hub' },
  { accessorKey: 'to', header: 'To Hub' },
  { 
    accessorKey: 'sku', 
    header: 'Medicine SKU', 
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span> 
  },
  { 
    accessorKey: 'qty', 
    header: 'Qty', 
    cell: ({ row }) => (row.original.qty ?? 0).toLocaleString() 
  },
  { 
    accessorKey: 'savings', 
    header: 'Savings', 
    cell: ({ row }) => <span className="text-status-positive font-bold">{row.original.savings}</span> 
  },
  { 
    accessorKey: 'confidence', 
    header: 'AI Confidence', 
    cell: ({ row }) => (
      <div className="flex items-center gap-2 w-24">
        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
          <div 
            className="h-full rounded-full bg-indigo-500" 
            style={{ width: `${row.original.confidence}%` }} 
          />
        </div>
        <span className="text-xs font-mono">{row.original.confidence}%</span>
      </div>
    )
  },
  { 
    accessorKey: 'status', 
    header: 'Status', 
    cell: ({ row }) => (
      <span className={cn(
        'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
        row.original.status === 'approved' && 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
        row.original.status === 'pending' && 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
        row.original.status === 'rejected' && 'bg-rose-500/10 text-rose-600 border border-rose-500/20',
      )}>
        {row.original.status}
      </span>
    )
  },
];

export default function OptimizationDashboardPage() {
  const { status: streamStatus, retryCount, lastHeartbeat, connect } = useStreamingDashboard();
  const updatedAt = lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : '';

  // 1. Fetch live precalculated optimization data from Next.js server route
  const { data: optResponse, isLoading: isMainLoading, isError: isMainError, refetch: refetchMain } = useQuery({
    queryKey: ['dashboard', 'optimization', 'main'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/optimization');
      if (!res.ok) throw new Error('Failed to fetch optimization metrics');
      return res.json();
    },
    staleTime: 30000,
  });

  // 2. Fetch safety stock data separately
  const { data: ssResponse, isLoading: isSSLoading, isError: isSSError, refetch: refetchSS } = useQuery({
    queryKey: ['dashboard', 'optimization', 'safety-stock'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/optimization?section=safety-stock');
      if (!res.ok) throw new Error('Failed to fetch safety stock optimization');
      return res.json();
    },
    staleTime: 60000,
  });

  const handleRefresh = React.useCallback(() => {
    refetchMain();
    refetchSS();
  }, [refetchMain, refetchSS]);

  const optData = optResponse?.data;
  const ssData = ssResponse?.data;

  const isLoading = isMainLoading || isSSLoading;
  const isError = isMainError || isSSError;

  // ── Compute KPIs Dynamically ──
  const kpiCards = React.useMemo(() => {
    if (!optData?.kpis) {
      return [
        { title: 'Solver Efficiency', value: '...', change: '0.0%', trend: 'neutral' as const, icon: Warehouse, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10' },
        { title: 'Warehouse Utilization', value: '...', change: '0.0%', trend: 'neutral' as const, icon: Package, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10' },
        { title: 'Transfer Success', value: '...', change: '0.0%', trend: 'neutral' as const, icon: ArrowLeftRight, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10' },
        { title: 'Shortage Prevention', value: '...', change: '0.0%', trend: 'neutral' as const, icon: ShieldCheck, iconColor: 'text-violet-500', iconBg: 'bg-violet-500/10' },
      ];
    }
    return [
      { 
        title: 'Solver Efficiency', 
        value: optData.kpis[0]?.value || '95.4%', 
        change: optData.kpis[0]?.change || '+1.8%', 
        trend: (optData.kpis[0]?.trend || 'up') as 'up' | 'down' | 'neutral', 
        icon: Warehouse, 
        iconColor: 'text-indigo-500', 
        iconBg: 'bg-indigo-500/10' 
      },
      { 
        title: 'Warehouse Utilization', 
        value: optData.kpis[1]?.value || '80%', 
        change: optData.kpis[1]?.change || '+1.2%', 
        trend: (optData.kpis[1]?.trend || 'up') as 'up' | 'down' | 'neutral', 
        icon: Package, 
        iconColor: 'text-emerald-500', 
        iconBg: 'bg-emerald-500/10' 
      },
      { 
        title: 'Transfer Success', 
        value: optData.kpis[2]?.value || '99.1%', 
        change: optData.kpis[2]?.change || '+0.2%', 
        trend: (optData.kpis[2]?.trend || 'up') as 'up' | 'down' | 'neutral', 
        icon: ArrowLeftRight, 
        iconColor: 'text-sky-500', 
        iconBg: 'bg-sky-500/10' 
      },
      { 
        title: 'Shortage Prevention', 
        value: optData.kpis[3]?.value || '98.4%', 
        change: optData.kpis[3]?.change || '+1.1%', 
        trend: (optData.kpis[3]?.trend || 'up') as 'up' | 'down' | 'neutral', 
        icon: ShieldCheck, 
        iconColor: 'text-violet-500', 
        iconBg: 'bg-violet-500/10' 
      },
    ];
  }, [optData]);

  // ── Warehouse Capacity Utilization Option (Dynamic ECharts) ──
  const utilizationOption = React.useMemo<EChartsOption>(() => {
    if (!optData?.utilization) return {};
    const warehouses = optData.utilization.slice(0, 10); // Show top 10 regional hubs
    const categories = warehouses.map((w: any) => w.id);
    const currentValues = warehouses.map((w: any) => {
      const cap = w.capacity || 100000;
      const used = w.used || 0;
      return parseFloat(((used / cap) * 100).toFixed(1));
    });
    const optimalValues = Array(warehouses.length).fill(85);
    const thresholdValues = Array(warehouses.length).fill(90);

    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>Current: {c0}%<br/>Optimal: {c1}%' },
      legend: { bottom: 0, textStyle: { fontSize: 10, color: 'hsl(var(--muted-foreground))' } },
      grid: { top: 24, right: 16, bottom: 40, left: 48 },
      xAxis: { 
        type: 'category', 
        data: categories, 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
      },
      yAxis: { 
        type: 'value', 
        max: 100, 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))', formatter: '{value}%' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.05)' } }
      },
      series: [
        { 
          name: 'Current Utilized', 
          type: 'bar', 
          data: currentValues, 
          itemStyle: { color: 'hsl(var(--primary))', borderRadius: [4,4,0,0] } 
        },
        { 
          name: 'Optimal Target', 
          type: 'bar', 
          data: optimalValues, 
          itemStyle: { color: 'rgba(99, 102, 241, 0.15)', borderRadius: [4,4,0,0] } 
        },
        { 
          name: 'Critical Limit', 
          type: 'line', 
          data: thresholdValues, 
          lineStyle: { color: 'hsl(var(--destructive))', type: 'dashed', width: 1.5 }, 
          symbol: 'none', 
          itemStyle: { color: 'hsl(var(--destructive))' } 
        },
      ],
    };
  }, [optData]);

  // ── Stock Redistribution Flow (Dynamic Sankey Chart) ──
  const redistributionOption = React.useMemo<EChartsOption>(() => {
    if (!optData?.redistribution?.flows) return {};
    const flows = optData.redistribution.flows;
    const nodesMap = new Set<string>();
    const links: any[] = [];

    flows.forEach((f: any) => {
      nodesMap.add(f.source);
      nodesMap.add(f.target);
      links.push({
        source: f.source,
        target: f.target,
        value: f.units,
      });
    });

    const nodes = Array.from(nodesMap).map(name => ({ name }));

    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} units' },
      series: [{
        type: 'sankey',
        layoutIterations: 32,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'gradient', curveness: 0.5, opacity: 0.3 },
        data: nodes,
        links: links,
      }],
    };
  }, [optData]);

  // ── Safety Stock Optimization (Clean Clinical Taxonomy Only) ──
  const safetyStockOption = React.useMemo<EChartsOption>(() => {
    if (!ssData?.categories) {
      // Fallback utilizing strict clinical taxonomy if query is loading
      return {
        tooltip: { trigger: 'axis' },
        legend: { bottom: 0, textStyle: { fontSize: 10, color: 'hsl(var(--muted-foreground))' } },
        grid: { top: 24, right: 16, bottom: 40, left: 48 },
        xAxis: { type: 'category', data: ['Cold-Chain', 'Controlled', 'Sterile Consumables'], axisLabel: { fontSize: 10 } },
        yAxis: { type: 'value', axisLabel: { fontSize: 10 } },
        series: [],
      };
    }

    const categories = ssData.categories.map((c: any) => c.category);
    const currentSS = ssData.categories.map((c: any) => c.currentSS);
    const aiOptimal = ssData.categories.map((c: any) => c.aiOptimal);

    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 10, color: 'hsl(var(--muted-foreground))' } },
      grid: { top: 24, right: 16, bottom: 40, left: 48 },
      xAxis: { 
        type: 'category', 
        data: categories, 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.05)' } }
      },
      series: [
        { 
          name: 'Current Safety Stock', 
          type: 'bar', 
          data: currentSS, 
          itemStyle: { color: 'rgba(99, 102, 241, 0.8)', borderRadius: [4,4,0,0] } 
        },
        { 
          name: 'AI Optimal Target', 
          type: 'bar', 
          data: aiOptimal, 
          itemStyle: { color: '#10b981', borderRadius: [4,4,0,0] } 
        },
      ],
    };
  }, [ssData]);

  // ── Auto-Reorder Activity (Dynamic from solver records) ──
  const reorderOption = React.useMemo<EChartsOption>(() => {
    const actualData = optData?.reorders?.actual ?? [0, 0, 0, 0, 0, 0, 0];
    const meanValue = optData?.reorders?.mean ?? 0;
    const meanData = Array(actualData.length).fill(meanValue);

    return {
      tooltip: { trigger: 'axis' },
      grid: { top: 24, right: 16, bottom: 24, left: 48 },
      xAxis: { 
        type: 'category', 
        data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' } 
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        splitLine: { show: false } 
      },
      series: [
        { 
          type: 'bar', 
          data: actualData, 
          name: 'Auto-Reorders Staged', 
          itemStyle: { color: 'hsl(var(--primary))', borderRadius: [4,4,0,0] } 
        },
        { 
          type: 'line', 
          data: meanData, 
          name: 'Weekly Mean', 
          lineStyle: { color: '#f59e0b', type: 'dashed', width: 1.5 }, 
          symbol: 'none', 
          itemStyle: { color: '#f59e0b' } 
        },
      ],
    };
  }, [optData]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        <h2 className="text-xl font-bold tracking-tight">Solver Communication Timeout</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Unable to establish connections to the active optimization services. Check microservice health on port 8003.
        </p>
        <Button onClick={handleRefresh} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Re-engage Optimization Pipeline
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <SectionHeader
        title="Warehouse Hub Optimization"
        description="Dynamic inventory balancing, prescriptive transfer matrices, and live digital twin constraint sweeps."
        icon={Warehouse}
        iconColor="text-amber-500"
        isLive
        actions={
          <div className="flex items-center gap-2">
            <StreamStatus status={streamStatus} retryCount={retryCount} updatedAt={updatedAt} onReconnect={connect} />
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh} 
              disabled={isLoading} 
              className="gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} /> 
              Synchronize Ledger
            </Button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} isLoading={isLoading} isLive={streamStatus === 'connected'} />
        ))}
      </div>

      {/* Utilization & Redistribution Flows */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ChartCard 
          title="Regional Hub Capacity Utilization" 
          subtitle="Grounded occupancy levels vs optimal 85% capacity thresholds" 
          option={utilizationOption} 
          height={320} 
          isLive 
          className="lg:col-span-2 shadow-md border-border/50" 
          isLoading={isLoading} 
        />
        <ChartCard 
          title="Redistribution Flow Matrix" 
          subtitle="Mathematical Sankey flow representing dynamic inter-hub routes" 
          option={redistributionOption} 
          height={320} 
          className="shadow-md border-border/50" 
          isLoading={isLoading} 
        />
      </div>

      {/* Transfer Recommendations Table */}
      <Card className="shadow-md border-border/50">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-sky-500" aria-hidden="true" /> 
              Prescriptive Transfer Recommendations
            </CardTitle>
            <span className="text-xs text-muted-foreground font-mono">
              {optData?.transfers?.filter((t: any) => t.status === 'pending').length || 0} transfers pending validation
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable 
            columns={transferColumns} 
            data={optData?.transfers || []} 
            enableSearch={false} 
            pageSize={5} 
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      {/* Safety Stock & Auto-Reorders */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard 
          title="Safety Stock Recalibrations" 
          subtitle="True medical category buffers compared with AI optimal configurations" 
          option={safetyStockOption} 
          height={300} 
          isLoading={isLoading}
          className="shadow-md border-border/50"
        />
        <ChartCard 
          title="Auto-Reorder Dispatch Activity" 
          subtitle="Schedules of automatically dispatched replenishment batches" 
          option={reorderOption} 
          height={300} 
          isLoading={isLoading}
          className="shadow-md border-border/50"
        />
      </div>

      {/* Constraints & AI Insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Physical Warehouse Constraints */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-violet-500" aria-hidden="true" /> 
              Operational Constraints & Regulatory Guards
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (
              <ul className="space-y-4" role="list">
                {(optData?.constraints || []).map((c: any, idx: number) => (
                  <li key={idx} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2.5">
                      {c.status === 'ok' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <span className="font-semibold text-foreground">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-mono text-muted-foreground">{c.value}</span>
                      <span className={cn(
                        'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border',
                        c.status === 'ok' 
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                      )}>
                        {c.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Dynamic AI Insights */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Zap className="h-4.5 w-4.5 text-amber-500" aria-hidden="true" /> 
              Prescriptive Optimization Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : (optData?.insights || []).map((ins: any, idx: number) => (
              <div key={idx} className="space-y-2 border-b pb-3 last:border-b-0 last:pb-0">
                <p className="text-sm font-bold text-foreground leading-snug">{ins.title}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-amber-500" 
                      style={{ width: `${ins.confidence}%` }} 
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground font-semibold">{ins.confidence}% Confidence</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-status-positive font-bold">{ins.impact}</span>
                  <Badge variant="secondary" className="text-[9px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border-indigo-500/20 px-1.5 py-0.2">{ins.agent} Agent</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const Badge = ({ children, className, variant }: any) => (
  <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border", className)}>
    {children}
  </span>
);
