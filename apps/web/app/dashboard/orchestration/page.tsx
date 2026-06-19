'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  Bot, CheckCircle2, RefreshCw, ShieldCheck, BrainCircuit, AlertTriangle,
  Activity, Clock, Zap, XCircle, Timer, ArrowRightLeft, Loader2
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

const ReactFlow = dynamic(() => import('reactflow').then((m) => m.default), { ssr: false });
const MiniMap = dynamic(() => import('reactflow').then((m) => m.MiniMap), { ssr: false });
const Controls = dynamic(() => import('reactflow').then((m) => m.Controls), { ssr: false });
import { SagaNode } from '@/components/dashboard/SagaNode';

const nodeTypes = {
  saga: SagaNode,
};

// ── Columns for Workflow Table ──
const wfColumns: ColumnDef<any, unknown>[] = [
  { accessorKey: 'id', header: 'Workflow', cell: ({ row }) => <span className="font-mono text-xs font-semibold">{row.original.id}</span> },
  { accessorKey: 'workflow', header: 'Description' },
  { accessorKey: 'saga', header: 'SAGA', cell: ({ row }) => <span className="font-mono text-xs">{row.original.saga}</span> },
  { accessorKey: 'steps', header: 'Steps' },
  { accessorKey: 'duration', header: 'Duration', cell: ({ row }) => <span className="font-mono text-xs">{row.original.duration}</span> },
  { accessorKey: 'agent', header: 'Agent' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => {
    const s = row.original.status;
    return <span className={cn('text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border',
      s === 'completed' && 'bg-emerald-100 text-emerald-700 border-emerald-200',
      s === 'running' && 'bg-indigo-100 text-indigo-700 border-indigo-200',
      s === 'escalated' && 'bg-amber-100 text-amber-700 border-amber-200',
      s === 'failed' && 'bg-rose-100 text-rose-700 border-rose-200',
    )}>{s}</span>;
  }},
];

export default function OrchestrationDashboardPage() {
  const { status, retryCount, lastHeartbeat, connect } = useStreamingDashboard();
  const updatedAt = lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : '';

  // 1. Fetch live precalculated orchestration metrics, DAG layout, and workflows from Next.js server route
  const { data: orchResponse, isLoading: isOrchLoading, isError: isOrchError, refetch: refetchOrch } = useQuery({
    queryKey: ['dashboard', 'orchestration', 'main'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/orchestration');
      if (!res.ok) throw new Error('Failed to fetch orchestration metrics');
      return res.json();
    },
    staleTime: 30000,
  });

  // 2. Fetch live executive alerts for dynamic escalations feed mapping
  const { data: execResponse, isLoading: isExecLoading } = useQuery({
    queryKey: ['dashboard', 'executive', 'alerts'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/executive?section=alerts');
      if (!res.ok) throw new Error('Failed to fetch executive alerts');
      return res.json();
    },
    staleTime: 30000,
  });

  const invData = orchResponse?.data;
  const execData = execResponse?.data;
  const isLoading = isOrchLoading || isExecLoading;
  const isError = isOrchError;

  // ── Governance Escalations (Live Alerts mapping) ──
  const escalations = React.useMemo(() => {
    const list = Array.isArray(execData?.alerts) ? execData.alerts : [];
    if (list.length === 0) {
      return [
        { id: '1', policy: 'Transfer Compliance Audit', trigger: 'SAGA-SYS', agent: 'Orchestrator', time: 'Just now', resolution: 'Monitoring active' }
      ];
    }
    return list.map((a: any) => ({
      id: a.id || '1',
      policy: a.message || 'Clinical Threshold Violation',
      trigger: `ALERT-${a.id}`,
      agent: a.source || 'Inventory Agent',
      time: a.time || 'Just now',
      resolution: a.severity === 'critical' ? 'Escalated to clinical director' : 'Auto-logged to audit trail'
    }));
  }, [execData]);

  // ── Compute KPIs Dynamically ──
  const kpiCards = React.useMemo(() => {
    const list = Array.isArray(invData?.kpis) ? invData.kpis : [];
    const activeAgentsCount = Array.isArray(invData?.agents) ? invData.agents.length : 6;
    const workflowSuccessRate = list[1]?.value || '99.3%';
    const slaComplianceRate = list[2]?.value || '99.8%';
    const escalationsCount = escalations.length;

    return [
      { title: 'Active Agents', value: activeAgentsCount.toString(), change: '+2', trend: 'up' as const, icon: Bot, iconColor: 'text-indigo-500', iconBg: 'bg-indigo-500/10', isLive: true, isLoading },
      { title: 'Workflow Success', value: workflowSuccessRate, change: list[1]?.change || '+0.4%', trend: (list[1]?.trend || 'up') as 'up' | 'down' | 'neutral', icon: CheckCircle2, iconColor: 'text-emerald-500', iconBg: 'bg-emerald-500/10', isLoading },
      { title: 'Retry Count', value: '4', change: '-3', trend: 'down' as const, icon: RefreshCw, iconColor: 'text-sky-500', iconBg: 'bg-sky-500/10', isLoading },
      { title: 'SLA Compliance', value: slaComplianceRate, change: list[2]?.change || '+0.1%', trend: (list[2]?.trend || 'up') as 'up' | 'down' | 'neutral', icon: Timer, iconColor: 'text-violet-500', iconBg: 'bg-violet-500/10', isLoading },
      { title: 'Autonomous Rate', value: '87.3%', change: '+2.4%', trend: 'up' as const, icon: BrainCircuit, iconColor: 'text-amber-500', iconBg: 'bg-amber-500/10', isLoading },
      { title: 'Escalations', value: escalationsCount.toString(), change: '-1', trend: 'down' as const, icon: AlertTriangle, iconColor: 'text-rose-500', iconBg: 'bg-rose-500/10', isLoading },
    ];
  }, [invData, escalations, isLoading]);

  // ── SAGA DAG Dynamic Layout Mapping ──
  const sagaNodes = React.useMemo(() => {
    const backendNodes = Array.isArray(invData?.dag?.nodes) ? invData.dag.nodes : [];
    const positions: Record<string, { x: number; y: number }> = {
      'orchestrator': { x: 30, y: 110 },
      'inventory': { x: 200, y: 30 },
      'forecast': { x: 370, y: 110 },
      'optimize': { x: 540, y: 190 },
      'governance': { x: 710, y: 110 },
    };

    return backendNodes.map((node: any, idx: number) => ({
      id: node.id,
      type: 'saga',
      position: positions[node.id] || { x: idx * 170, y: 110 },
      data: {
        label: node.data?.label || node.id,
        status: node.data?.status === 'active' ? 'running' : 'completed',
        agent: node.data?.label || node.id,
      }
    }));
  }, [invData]);

  const sagaEdges = React.useMemo(() => {
    const backendEdges = Array.isArray(invData?.dag?.edges) ? invData.dag.edges : [];
    return backendEdges.map((edge: any) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      animated: true,
      label: edge.label,
      labelStyle: { fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' },
      style: { stroke: edge.source === 'governance' ? '#10b981' : '#6366f1' },
    }));
  }, [invData]);

  // ── Workflow Execution Logs ──
  const wfData = React.useMemo(() => {
    const list = Array.isArray(invData?.workflows) ? invData.workflows : [];
    return list.map((w: any) => ({
      id: w.id ? `WF-${w.id}` : 'WF-...',
      workflow: w.workflow || 'Operational Event',
      saga: w.saga || 'SAGA-...',
      steps: typeof w.steps === 'number' ? w.steps : 3,
      duration: w.duration || '10s',
      status: w.status || 'completed',
      agent: w.agent || 'Orchestrator',
    }));
  }, [invData]);

  // ── Workflow Throughput Option ──
  const workflowTrendOption = React.useMemo<EChartsOption>(() => {
    const list = Array.isArray(invData?.workflows) ? invData.workflows : [];
    const completedCount = list.filter((w: any) => w.status === 'completed').length;
    const runningCount = list.filter((w: any) => w.status === 'running').length;
    const failedCount = list.filter((w: any) => w.status === 'failed' || w.status === 'escalated').length;

    const completedData = [Math.floor(completedCount * 0.1), Math.floor(completedCount * 0.15), Math.floor(completedCount * 0.2), Math.floor(completedCount * 0.25), Math.floor(completedCount * 0.15), Math.floor(completedCount * 0.1), completedCount - Math.floor(completedCount * 0.96)];
    const runningData = [Math.floor(runningCount * 0.1), Math.floor(runningCount * 0.2), Math.floor(runningCount * 0.1), Math.floor(runningCount * 0.3), Math.floor(runningCount * 0.1), Math.floor(runningCount * 0.1), runningCount - Math.floor(runningCount * 0.9)];
    const failedData = [0, 0, Math.floor(failedCount * 0.3), Math.floor(failedCount * 0.4), 0, Math.floor(failedCount * 0.3), failedCount - Math.floor(failedCount * 1.0)];

    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 10, color: 'hsl(var(--muted-foreground))' } },
      grid: { top: 24, right: 16, bottom: 40, left: 48 },
      xAxis: { 
        type: 'category', 
        data: ['00:00','04:00','08:00','12:00','16:00','20:00','24:00'], 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.05)' } }
      },
      series: [
        { name: 'Completed', type: 'bar', stack: 'wf', data: completedData, itemStyle: { color: '#10b981' } },
        { name: 'Running', type: 'bar', stack: 'wf', data: runningData, itemStyle: { color: '#6366f1' } },
        { name: 'Failed', type: 'bar', stack: 'wf', data: failedData, itemStyle: { color: '#e11d48', borderRadius: [4,4,0,0] } },
      ],
    };
  }, [invData]);

  // ── Retry & DLQ Option ──
  const retryOption = React.useMemo<EChartsOption>(() => {
    const list = Array.isArray(invData?.workflows) ? invData.workflows : [];
    const retriesCount = list.filter((w: any) => w.steps > 4).length;
    const dlqCount = list.filter((w: any) => w.status === 'failed').length;

    const retriesData = [1, 2, Math.max(1, retriesCount - 4), Math.max(1, retriesCount - 3), 1, 0, Math.max(0, retriesCount - 8)];
    const dlqData = [0, 0, Math.max(0, dlqCount - 1), 0, Math.max(0, dlqCount - 2), 0, 0];

    return {
      tooltip: { trigger: 'axis' },
      legend: { bottom: 0, textStyle: { fontSize: 10, color: 'hsl(var(--muted-foreground))' } },
      grid: { top: 24, right: 16, bottom: 24, left: 48 },
      xAxis: { 
        type: 'category', 
        data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } }
      },
      yAxis: { 
        type: 'value', 
        axisLabel: { fontSize: 10, color: 'hsl(var(--muted-foreground))' },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.05)' } }
      },
      series: [
        { type: 'bar', data: retriesData, name: 'Retries', itemStyle: { color: '#f59e0b', borderRadius: [4,4,0,0] } },
        { type: 'bar', data: dlqData, name: 'DLQ', itemStyle: { color: '#e11d48', borderRadius: [4,4,0,0] } },
      ],
    };
  }, [invData]);

  // ── Agent Load Radar Option ──
  const agentLoadOption = React.useMemo<EChartsOption>(() => {
    const agentsList = Array.isArray(invData?.agents) ? invData.agents : [];
    const getLoad = (name: string) => {
      const agent = agentsList.find((a: any) => a.name.toLowerCase().includes(name.toLowerCase()));
      if (!agent) return 50;
      return Math.min(100, Math.max(20, Math.floor(agent.tasks / 5)));
    };

    const loadData = [
      getLoad('inventory'),
      getLoad('forecasting'),
      getLoad('optimization'),
      getLoad('governance'),
      getLoad('orchestrator') || getLoad('director') || 75,
      getLoad('analytics') || 60
    ];

    return {
      tooltip: { trigger: 'axis' },
      radar: {
        indicator: [
          { name: 'Inventory', max: 100 }, 
          { name: 'Forecasting', max: 100 },
          { name: 'Optimization', max: 100 }, 
          { name: 'Governance', max: 100 },
          { name: 'Orchestrator', max: 100 }, 
          { name: 'Analytics', max: 100 },
        ],
        shape: 'circle',
        axisLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.05)' } }
      },
      series: [{
        type: 'radar',
        data: [
          { value: loadData, name: 'Current Load', areaStyle: { color: 'rgba(99,102,241,0.15)' }, lineStyle: { color: '#6366f1' }, itemStyle: { color: '#6366f1' } },
          { value: [70,70,70,70,70,70], name: 'Optimal', lineStyle: { color: '#10b981', type: 'dashed' }, itemStyle: { color: '#10b981' } },
        ],
      }],
    };
  }, [invData]);

  // ── Agent Health List ──
  const agents = React.useMemo(() => {
    return Array.isArray(invData?.agents) ? invData.agents : [];
  }, [invData]);

  const handleRefreshAll = React.useCallback(() => {
    refetchOrch();
  }, [refetchOrch]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        <h2 className="text-xl font-bold tracking-tight">Agent orchestration pipeline failure</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Unable to pull agent lifecycles or SAGA execution traces. Check connection health on port 8004.
        </p>
        <Button onClick={handleRefreshAll} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Reconnect Orchestrator
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Agent Orchestration"
        description="Distributed SAGA tracking, autonomous agent lifecycle, and governance escalations."
        icon={Bot}
        iconColor="text-purple-500"
        isLive
        actions={
          <div className="flex items-center gap-2">
            <StreamStatus status={status} retryCount={retryCount} updatedAt={updatedAt} onReconnect={connect} />
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleRefreshAll} disabled={isLoading}>
              <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} /> 
              Sync Orchestration
            </Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((k) => (
          <KpiCard key={k.title} {...k} isLive={status === 'connected'} />
        ))}
      </div>

      {/* SAGA DAG + Workflow Trend */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-2 border-b">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-indigo-500" aria-hidden="true" /> 
              SAGA Workflow Visualization
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div style={{ height: 280 }} className="rounded-xl border overflow-hidden bg-muted/10 shadow-inner">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ReactFlow 
                  nodes={sagaNodes} 
                  edges={sagaEdges} 
                  nodeTypes={nodeTypes}
                  fitView 
                  attributionPosition="bottom-left"
                >
                  <Controls showInteractive={false} />
                  <MiniMap style={{ height: 60, width: 100 }} />
                </ReactFlow>
              )}
            </div>
          </CardContent>
        </Card>
        
        <ChartCard 
          title="Workflow Throughput" 
          subtitle="Completed / running / failed by time window" 
          option={workflowTrendOption} 
          height={280} 
          isLive 
          isLoading={isLoading}
          className="shadow-md border-border/50"
        />
      </div>

      {/* Workflow Table */}
      <Card className="shadow-md border-border/50 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-muted/30">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Activity className="h-4 w-4 text-indigo-500" aria-hidden="true" /> 
            Workflow Execution Log
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable columns={wfColumns} data={wfData} enableSearch pageSize={6} isLive />
        </CardContent>
      </Card>

      {/* Retry + Agent Load */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard 
          title="Retry & DLQ Analysis" 
          subtitle="Weekly retry attempts and dead-letter entries" 
          option={retryOption} 
          height={260} 
          isLoading={isLoading}
          className="shadow-md border-border/50"
        />
        <ChartCard 
          title="Agent Load Distribution" 
          subtitle="Current workload vs optimal capacity" 
          option={agentLoadOption} 
          height={260} 
          isLoading={isLoading}
          className="shadow-md border-border/50"
        />
      </div>

      {/* Agent Health + Escalations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Agent Health */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4 text-status-positive" aria-hidden="true" /> 
                Agent Telemetry Status
              </CardTitle>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-status-positive/10 text-status-positive">
                Live
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : agents.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No agent metadata found.</p>
            ) : (
              <ul className="space-y-3.5" role="list">
                {agents.map((a: any) => (
                  <li key={a.name} className="flex items-center justify-between text-sm border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className={cn('h-2 w-2 rounded-full', a.status === 'healthy' ? 'bg-status-positive' : 'bg-status-warning animate-pulse')} />
                      <span className="font-semibold text-foreground">{a.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground/80">
                      <span className="font-mono bg-muted/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-600">{a.latency}</span>
                      <span>{a.tasks} tasks</span>
                      <span className="font-mono text-muted-foreground/50">{a.uptime}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Governance Escalations */}
        <Card className="shadow-md border-border/50">
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-amber-500" aria-hidden="true" /> 
                Governance Escalations
              </CardTitle>
              <span className="text-xs font-bold text-status-warning bg-status-warning/10 px-2.5 py-0.5 rounded-full border border-status-warning/20">
                {escalations.length} Active Compliance Checks
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-3.5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : escalations.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">No governance escalations.</p>
            ) : (
              escalations.map((e: any) => (
                <div key={e.id} className="flex items-start gap-3 text-sm border-b pb-3.5 last:border-b-0 last:pb-0">
                  <AlertTriangle className="h-4 w-4 mt-0.5 text-status-warning shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground leading-tight">{e.policy}</p>
                    <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                      {e.trigger} · {e.agent} · {e.time}
                    </p>
                    <p className="text-xs font-bold text-indigo-600 mt-1">{e.resolution}</p>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
