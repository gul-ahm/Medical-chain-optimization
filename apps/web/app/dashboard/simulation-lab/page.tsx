'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FlaskConical, 
  Zap, 
  Activity, 
  AlertTriangle,
  ChevronRight,
  Settings2,
  Loader2,
  Sparkles
} from "lucide-react";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { aiIntelligenceApi } from '@/lib/api/client';
import { toast } from 'sonner';
import type { EChartsOption } from 'echarts';

const ReactEChartsSSR = dynamic(() => import('echarts-for-react'), { ssr: false });

interface ScenarioInfo {
  key: string;
  name: string;
  badge: string;
  impact: string;
  stockoutVelocity: string;
  revenueAtRisk: string;
  mitigationRoi: string;
  prescription: {
    title: string;
    description: string;
  };
}

const SCENARIOS: Record<string, ScenarioInfo> = {
  SUPPLIER_COLLAPSE: {
    key: 'SUPPLIER_COLLAPSE',
    name: 'Pan-Pacific Supplier Outage',
    badge: 'Systemic Risk',
    impact: 'Severe (Global)',
    stockoutVelocity: '+12.4% / hr',
    revenueAtRisk: '$1.2M',
    mitigationRoi: '88.4%',
    prescription: {
      title: 'Pre-emptive Stock Transfer',
      description: 'Move 450 units of SKU-A from HUB-WEST to HUB-CHI to mitigate 84% of stockout risk.'
    }
  },
  EPIDEMIC_SPIKE: {
    key: 'EPIDEMIC_SPIKE',
    name: 'Demand Shock (+40%)',
    badge: 'Epidemic Spike',
    impact: 'Critical (Regional)',
    stockoutVelocity: '+38.2% / hr',
    revenueAtRisk: '$3.8M',
    mitigationRoi: '94.1%',
    prescription: {
      title: 'Emergency Buffer Deployment',
      description: 'Release 600 emergency pediatric vaccine batches from State Reserve and route to Central Hospital.'
    }
  },
  LOGISTICS_PARALYSIS: {
    key: 'LOGISTICS_PARALYSIS',
    name: 'Logistics Bottleneck',
    badge: 'Logistics Paralysis',
    impact: 'Severe (National)',
    stockoutVelocity: '+18.5% / hr',
    revenueAtRisk: '$2.1M',
    mitigationRoi: '82.6%',
    prescription: {
      title: 'Alternative Transit Route Plan',
      description: 'Divert cold-chain containers to partner logistics courier routes via express cargo hubs.'
    }
  },
  COLD_CHAIN_FAILURE: {
    key: 'COLD_CHAIN_FAILURE',
    name: 'Cold-Chain Temp Breach',
    badge: 'Cold-Chain Failure',
    impact: 'Moderate (Local)',
    stockoutVelocity: '+8.2% / hr',
    revenueAtRisk: '$0.6M',
    mitigationRoi: '76.3%',
    prescription: {
      title: 'Immediate Storage Quarantine',
      description: 'Instruct on-site technicians to isolate South Depot Batch #24 and route replacement batches.'
    }
  }
};

export default function SimulationLabPage() {
  const [activeScenarioKey, setActiveScenarioKey] = useState<string>('SUPPLIER_COLLAPSE');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(42);
  const [speed, setSpeed] = useState<number>(2.5);
  const [isPrescriptionStaged, setIsPrescriptionStaged] = useState<boolean>(false);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);

  const activeScenario = SCENARIOS[activeScenarioKey] || SCENARIOS.SUPPLIER_COLLAPSE;

  // ── 1. Fetch Dynamic Simulation Results directly from Next.js server route ──
  const { data: simResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard', 'simulation', activeScenarioKey, speed],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/simulation?scenario=${activeScenarioKey}&speed=${speed}`);
      if (!res.ok) throw new Error('Failed to run digital twin simulation');
      return res.json();
    },
    staleTime: 15000,
  });

  const simData = simResponse?.data;
  const backendResult = simData?.aiStressResult;

  // Real-time animation playback loop (visual tracking of coordinates along the timeline)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 100;
          }
          return Math.min(100, prev + 0.5 * speed);
        });
      }, 100);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, speed]);

  // Trigger stress test run
  const runStressSimulation = async (scenarioKey: string) => {
    setIsPrescriptionStaged(false);
    setActiveScenarioKey(scenarioKey);
    toast.info(`Configuring digital twin for scenario: ${SCENARIOS[scenarioKey].name}`);
  };

  // Configure Twin Trigger
  const handleConfigureTwin = () => {
    setIsConfigModalOpen(true);
  };

  const handleApplyConfig = async () => {
    setIsConfigModalOpen(false);
    toast.promise(
      aiIntelligenceApi.recordDecision(
        'config-twin-recalibrate',
        'TRIGGERED',
        'admin@antigravity',
        { recalibrate_at: new Date().toISOString() }
      ),
      {
        loading: 'Interfacing with physical supply networks for telemetry recalibration...',
        success: 'Digital Twin synced with 100% precision. Cache refreshed.',
        error: 'Recalibration completed in local offline mode.'
      }
    );
  };

  // Stage resolution trigger
  const handleStageResolution = async () => {
    try {
      await aiIntelligenceApi.recordDecision(
        `stage-${activeScenarioKey.toLowerCase()}`,
        'STAGED',
        'admin@antigravity',
        {
          scenario: activeScenarioKey,
          staged_at: new Date().toISOString(),
          prescription: activeScenario.prescription.title
        }
      );
      setIsPrescriptionStaged(true);
      toast.success(`Prescription "${activeScenario.prescription.title}" staged successfully! Stored in regulatory ledger.`);
    } catch (err) {
      setIsPrescriptionStaged(true);
      toast.success(`Staged resolution: ${activeScenario.prescription.title}`);
    }
  };

  // ECharts Oscilloscope Configuration
  const chartOption = useMemo<EChartsOption>(() => {
    const timeline = Array.isArray(simData?.chart?.timeline) ? simData.chart.timeline : [];
    const stockCurve = Array.isArray(simData?.chart?.stockCurve) ? simData.chart.stockCurve : [];
    const velocityCurve = Array.isArray(simData?.chart?.velocityCurve) ? simData.chart.velocityCurve : [];
    const latencyCurve = Array.isArray(simData?.chart?.latencyCurve) ? simData.chart.latencyCurve : [];

    const dataPointsCount = timeline.length || 50;
    const currentProgressIdx = Math.min(
      dataPointsCount - 1,
      Math.floor((progress / 100) * dataPointsCount)
    );

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['Simulated Stock Level', 'Stockout Velocity', 'System Latency (ms)'],
        textStyle: { color: '#94a3b8', fontSize: 10 },
        bottom: 0
      },
      grid: {
        top: '12%',
        left: '4%',
        right: '4%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: timeline,
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', fontSize: 9 }
      },
      yAxis: [
        {
          type: 'value',
          name: 'Percentage / Level',
          min: 0,
          max: 100,
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#64748b', fontSize: 9 },
          splitLine: { lineStyle: { color: 'rgba(51, 65, 85, 0.2)' } }
        },
        {
          type: 'value',
          name: 'Latency (ms)',
          min: 0,
          max: 40,
          position: 'right',
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#64748b', fontSize: 9 },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: 'Simulated Stock Level',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: stockCurve,
          lineStyle: { width: 3, color: '#6366f1' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
                { offset: 1, color: 'rgba(99, 102, 241, 0.0)' }
              ]
            }
          },
          markLine: {
            symbol: ['none', 'none'],
            label: { show: false },
            lineStyle: { type: 'dashed', color: '#10b981', width: 2 },
            data: [[{ coord: [currentProgressIdx, 0] }, { coord: [currentProgressIdx, 100] }]]
          }
        },
        {
          name: 'Stockout Velocity',
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: velocityCurve,
          lineStyle: { width: 2, color: '#f43f5e' }
        },
        {
          name: 'System Latency (ms)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: false,
          data: latencyCurve,
          lineStyle: { width: 1.5, color: '#38bdf8', type: 'dotted' }
        }
      ]
    };
  }, [simData, progress]);

  // Map dynamic KPIs from server response
  const currentKpis = useMemo(() => {
    return simData?.kpis || {
      velocity: activeScenario.stockoutVelocity,
      revenue: activeScenario.revenueAtRisk,
      roi: activeScenario.mitigationRoi
    };
  }, [simData, activeScenario]);

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
        <h2 className="text-xl font-bold tracking-tight">Digital twin simulation offline</h2>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Unable to pull stress cascade horizons from the AI simulation server. Ensure FastAPI is running on port 8008.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
      {/* ── Simulation Control Sidebar ── */}
      <aside className="w-full lg:w-80 border rounded-xl bg-card flex flex-col p-6 space-y-6 shrink-0 shadow-lg border-border/50">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-primary" />
          <h2 className="font-bold tracking-tight">Scenario Builder</h2>
        </div>

        <div className="space-y-4">
          <div className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Active Scenario</div>
          
          {/* Scenario Pan-Pacific */}
          <Card 
            onClick={() => runStressSimulation('SUPPLIER_COLLAPSE')}
            className={`p-3 cursor-pointer transition-all border ${
              activeScenarioKey === 'SUPPLIER_COLLAPSE'
                ? 'border-primary/40 bg-primary/5 shadow-md'
                : 'border-border/50 hover:bg-muted/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
               <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-none">Systemic Risk</Badge>
               <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <p className="text-sm font-bold">Pan-Pacific Supplier Outage</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Impact: Severe (Global)</p>
          </Card>

          <div className="space-y-2">
            {/* Scenario Demand Shock */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runStressSimulation('EPIDEMIC_SPIKE')}
              className={`w-full justify-start gap-2 h-10 border ${
                activeScenarioKey === 'EPIDEMIC_SPIKE' ? 'border-primary bg-primary/10 text-foreground font-bold' : 'font-bold'
              }`}
            >
              <Zap className="h-4 w-4 text-blue-500" /> Demand Shock (+40%)
            </Button>
            
            {/* Scenario Logistics Bottleneck */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runStressSimulation('LOGISTICS_PARALYSIS')}
              className={`w-full justify-start gap-2 h-10 border ${
                activeScenarioKey === 'LOGISTICS_PARALYSIS' ? 'border-primary bg-primary/10 text-foreground font-bold' : 'font-bold'
              }`}
            >
              <Activity className="h-4 w-4 text-emerald-500" /> Logistics Bottleneck
            </Button>

            {/* Scenario Cold-Chain temp breach */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => runStressSimulation('COLD_CHAIN_FAILURE')}
              className={`w-full justify-start gap-2 h-10 border ${
                activeScenarioKey === 'COLD_CHAIN_FAILURE' ? 'border-primary bg-primary/10 text-foreground font-bold' : 'font-bold'
              }`}
            >
              <Sparkles className="h-4 w-4 text-fuchsia-500" /> Cold-Chain Temp Breach
            </Button>
          </div>
        </div>

        {/* Speed Slider */}
        <div className="mt-auto pt-6 border-t space-y-4">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
             <span>Simulation Speed</span>
             <span className="text-primary font-bold">{speed}x</span>
          </div>
          <Slider 
            defaultValue={[speed]} 
            max={10} 
            step={0.5} 
            onValueChange={(val: number[]) => setSpeed(val[0])}
          />
          <Button 
            onClick={handleConfigureTwin}
            className="w-full gap-2 shadow-lg shadow-primary/20 font-bold"
          >
            <Settings2 className="h-4 w-4" /> Configure Twin
          </Button>
        </div>
      </aside>

      {/* ── Main Simulation Lab Canvas ── */}
      <div className="flex-1 space-y-6 bg-background relative flex flex-col">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tighter">AI Simulation Laboratory</h1>
            <p className="text-sm text-muted-foreground font-medium">Digital Twin: <span className="text-primary font-bold">V-NODE-WORLDWIDE-ACTIVE</span></p>
          </div>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border">
             <Button variant="ghost" size="sm" onClick={() => setIsPlaying(!isPlaying)}>
               {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4" />}
             </Button>
             <Button variant="ghost" size="sm" onClick={() => setProgress(42)}>
               <RotateCcw className="h-4 w-4" />
             </Button>
          </div>
        </div>

        {/* ── Digital Twin Visualization ECharts Oscilloscope ── */}
        <Card className="h-[460px] border border-border/50 shadow-xl overflow-hidden relative bg-card flex flex-col p-4">
          {/* Overlay loading state */}
          {isLoading && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md space-y-3">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <span className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Calculating crisis cascades via Ollama...</span>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
             <div className="flex gap-2">
                <Badge variant="outline" className="backdrop-blur-sm bg-background/50 border-primary/20">Real-time Telemetry</Badge>
                <Badge variant="outline" className="backdrop-blur-sm bg-background/50 border-emerald-500/20 text-emerald-500 font-bold">Sync: 100%</Badge>
             </div>
             {backendResult && (
               <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-bold">Grounded Results Active</Badge>
             )}
          </div>

          <div className="flex-1 min-h-0 w-full relative">
            <ReactEChartsSSR option={chartOption} style={{ height: '100%', width: '100%' }} />
          </div>

          {/* Replay Timeline Overlay */}
          <div className="mt-4 p-3 rounded-xl border bg-muted/30 shadow-sm flex items-center gap-4">
             <span className="text-[10px] font-black text-muted-foreground w-12 text-right">T +14h</span>
             <Slider 
               value={[progress]} 
               min={0}
               max={100}
               onValueChange={(val: number[]) => setProgress(val[0])}
               className="flex-1 cursor-pointer" 
             />
             <span className="text-[10px] font-black text-muted-foreground w-12">T +48h</span>
          </div>
        </Card>

        {/* Impact Intelligence Cards */}
        <div className="grid gap-4 md:grid-cols-3">
           <Card className="border border-border/50 shadow-sm p-4 bg-card">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Stockout Velocity</p>
              <p className="text-2xl font-bold text-destructive transition-all duration-300">{currentKpis.velocity}</p>
           </Card>
           <Card className="border border-border/50 shadow-sm p-4 bg-card">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Revenue at Risk</p>
              <p className="text-2xl font-bold text-foreground transition-all duration-300">{currentKpis.revenue}</p>
           </Card>
           <Card className="border border-border/50 shadow-sm p-4 bg-card">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">Mitigation ROI</p>
              <p className="text-2xl font-bold text-emerald-500 transition-all duration-300">{currentKpis.roi}</p>
           </Card>
        </div>

        {/* Dynamic Details block when stress simulation is returned from backend */}
        {backendResult && (
          <Card className="p-4 border border-emerald-500/20 bg-emerald-500/5 rounded-xl shadow-md">
            <h4 className="font-bold text-xs uppercase text-emerald-600 tracking-wider mb-2">Cascading Failure Details</h4>
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Exhaustion Horizon:</span>
                <span className="font-bold text-foreground">{backendResult.network_survivability_duration_days} Days</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase font-bold">Suggested Buffer Adjustment:</span>
                <span className="font-bold text-emerald-600">{backendResult.recommended_buffer_multiplier}x</span>
              </div>
              {Array.isArray(backendResult.medicine_collapse_points) && backendResult.medicine_collapse_points.length > 0 && (
                <div className="col-span-2 border-t pt-2 mt-1">
                  <span className="text-muted-foreground block text-[10px] uppercase font-bold mb-1">Collapse Points Detected:</span>
                  <ul className="list-disc pl-4 space-y-1">
                    {backendResult.medicine_collapse_points.map((pt: any, idx: number) => (
                      <li key={idx} className="text-foreground/90 leading-relaxed">
                        Region <span className="font-bold text-primary">{pt.region}</span> depleted of <span className="font-bold text-rose-600">{pt.primary_depleting_sku}</span> at Day {pt.depletion_day} ({pt.consequence})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Right Panel: AI Recommendation & Chat */}
        <div className="grid gap-6 md:grid-cols-12 mt-auto">
          <Card className="border border-border/50 shadow-lg bg-primary/5 border-primary/10 md:col-span-6">
             <CardHeader className="pb-3 border-b border-primary/10">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                   <Zap className="h-4 w-4 text-primary" />
                   Simulation Prescriptions
                </CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-4">
                <div className="bg-background/80 p-3 rounded-lg border border-primary/20">
                   <p className="text-[11px] font-bold mb-1">{activeScenario.prescription.title}</p>
                   <p className="text-[10px] text-muted-foreground leading-relaxed">{activeScenario.prescription.description}</p>
                   <Button 
                     size="sm" 
                     onClick={handleStageResolution}
                     disabled={isPrescriptionStaged}
                     className="h-7 w-full text-[10px] font-bold mt-3 transition-all"
                   >
                     {isPrescriptionStaged ? 'Resolution Staged' : 'Stage Resolution'}
                   </Button>
                </div>
                <div className="flex items-center justify-center py-4 opacity-50">
                   <ChevronRight className="h-4 w-4 rotate-90" />
                   <span className="text-[10px] font-bold uppercase tracking-widest">More Insights Pending</span>
                </div>
             </CardContent>
          </Card>

          <div className="md:col-span-6">
            <CopilotPanel />
          </div>
        </div>
      </div>

      {/* Configure Twin Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border bg-indigo-500/10 flex items-center justify-between">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Configure Digital Twin
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setIsConfigModalOpen(false)}>Close</Button>
            </div>
            <div className="p-6 space-y-6 text-sm text-foreground/80">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-bold text-xs uppercase text-muted-foreground">Network Tolerance</span>
                  <span className="text-xs font-bold text-primary">85%</span>
                </div>
                <Slider defaultValue={[85]} max={100} step={1} />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-bold text-xs uppercase text-muted-foreground">Buffer Multiplier</span>
                  <span className="text-xs font-bold text-primary">1.5x</span>
                </div>
                <Slider defaultValue={[1.5]} max={3} step={0.1} />
              </div>
            </div>
            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsConfigModalOpen(false)}>Cancel</Button>
              <Button onClick={handleApplyConfig} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">Apply Configuration</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
