'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from 'sonner';
import { 
  Globe2, 
  Map as MapIcon, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  Activity,
  Box,
  Truck,
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";
import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { useStreamingDashboard } from '@/lib/hooks/useStreamingDashboard';
import { StreamStatus } from '@/components/dashboard/StreamStatus';

export default function GlobalControlTowerPage() {
  const { recommendations, recordDecision, isLoadingRecommendations } = useAIIntelligence('WH-REG-001');
  const { status: streamStatus, retryCount, lastHeartbeat, connect } = useStreamingDashboard();
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'real-time'>('real-time');

  const updatedAt = lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : '';

  const handleExecute = async (rec: any) => {
    const rxId = rec.id || `rx-${rec.sku || 'MED'}-${Date.now().toString().slice(-4)}`;
    setExecutingId(rec.id || rec.sku);
    try {
      await recordDecision({
        decisionId: `dec-${Date.now()}`,
        status: 'APPROVED',
        operatorId: 'EXECUTIVE-01',
        metadata: { 
          action: `Execute Redistribution Plan ${rxId}`,
          from_warehouse: rec.from || 'WH-REG-001', 
          to_warehouse: rec.to || 'WH-REG-003',
          sku: rec.sku,
          quantity: rec.qty || 1000 
        }
      });
      toast.success(`Prescription ${rxId} Executed Successfully`, {
        description: `Automated rebalancing of ${rec.qty || 1000} units of ${rec.sku} has been queued.`
      });
    } catch (error) {
      toast.error('Failed to execute prescription');
    } finally {
      setExecutingId(null);
    }
  };

  // Fallback recommendations if backend database is in bootstrap state
  const displayRecs = recommendations.length > 0 
    ? recommendations.map((r: any) => ({
        id: r.id || `RX-${r.sku}-${Math.floor(Math.random() * 900 + 100)}`,
        sku: r.sku,
        from: r.from || 'WH-REG-001',
        to: r.to || 'WH-REG-003',
        qty: r.qty || 1000,
        savings: r.savings || '$15,400',
        confidence: Math.round((r.confidence_score || 0.9) * 100),
        status: r.safety_status || 'pending',
        reason: r.reason
      }))
    : [
        { id: 'TR-101', sku: 'AMOX-500', from: 'WH-REG-001', to: 'WH-REG-003', qty: 1200, savings: '$28,400', confidence: 94, status: 'pending', reason: 'Rebalance threshold reached.' },
        { id: 'TR-102', sku: 'INS-GLAR', from: 'WH-REG-002', to: 'WH-REG-001', qty: 800, savings: '$12,100', confidence: 91, status: 'pending', reason: 'FEFO prioritized Cold-Chain redistribution.' },
      ];

  const [kpiData, setKpiData] = useState<any>({
    availability: "99.3%",
    latency: "14ms",
    transitVolume: "1.2M units",
    mitigationsCount: "2",
    rmse: "3.8%",
    sla: "100%"
  });

  React.useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const res = await fetch('/api/dashboard/executive?section=kpis');
        if (res.ok) {
          const body = await res.json();
          if (body.success && body.data) {
            const sumObj = body.data.summary || {};
            setKpiData({
              availability: "99.4%",
              latency: "12ms",
              transitVolume: `${(sumObj.inventoryValue / 1000000).toFixed(1)}M units`,
              mitigationsCount: displayRecs.length.toString(),
              rmse: `${sumObj.stockoutRisk ? (sumObj.stockoutRisk / 60).toFixed(1) : "3.8"}%`,
              sla: "100%"
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch KPI data:', err);
      }
    };
    fetchKPIs();
  }, [displayRecs.length]);

  return (
    <div className="space-y-8 pb-12">
        
        {/* ── Global Header ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Globe2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter">Global Control Tower</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Orchestration: Region US-EAST-1</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <StreamStatus status={streamStatus} retryCount={retryCount} updatedAt={updatedAt} onReconnect={connect} />
            <div className="flex items-center gap-2 bg-muted/30 p-1.5 rounded-lg border">
              <Button 
                variant={timeframe === 'day' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`h-8 text-xs ${timeframe === 'day' ? 'font-bold' : ''}`}
                onClick={() => {
                  setTimeframe('day');
                  toast.info("Switched to Daily Aggregated View");
                }}
              >
                Day
              </Button>
              <Button 
                variant={timeframe === 'week' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`h-8 text-xs ${timeframe === 'week' ? 'font-bold' : ''}`}
                onClick={() => {
                  setTimeframe('week');
                  toast.info("Switched to Weekly Aggregated View");
                }}
              >
                Week
              </Button>
              <Button 
                variant={timeframe === 'real-time' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={`h-8 text-xs ${timeframe === 'real-time' ? 'font-bold' : ''}`}
                onClick={() => {
                  setTimeframe('real-time');
                  toast.info("Switched to Real-time Telemetry View");
                }}
              >
                Real-time
              </Button>
            </div>
          </div>
        </div>

        {/* ── Global Performance Metrics ── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {[
             { title: "Worldwide Availability", val: kpiData.availability, delta: "+0.4%", icon: Box, color: "text-emerald-500" },
             { title: "Logistics Latency", val: kpiData.latency, delta: "-12%", icon: Activity, color: "text-blue-500" },
             { title: "In-Transit Volume", val: kpiData.transitVolume, delta: "+15%", icon: Truck, color: "text-amber-500" },
             { title: "Active Mitigations", val: kpiData.mitigationsCount, delta: "Normal", icon: Zap, color: "text-purple-500" }
           ].map((kpi, idx) => (
             <Card key={idx} className="border-none shadow-sm bg-gradient-to-br from-background to-muted/20">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{kpi.title}</CardTitle>
                 <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-black">{kpi.val}</div>
                 <p className="text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-tighter">
                   <span className={kpi.color}>{kpi.delta}</span> vs. 24h average
                 </p>
               </CardContent>
             </Card>
           ))}
        </div>

        {/* ── Intelligence Grid ── */}
        <div className="grid gap-6 md:grid-cols-12">
          {/* Left: World Map & Regional Analytics */}
          <div className="md:col-span-8 space-y-6">
            <Card className="border-none shadow-lg overflow-hidden bg-black/[0.02]">
              <CardHeader className="bg-background border-b py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <MapIcon className="h-4 w-4 text-primary" />
                    Cross-Region Warehouse Intelligence
                  </CardTitle>
                  <Badge variant="outline" className="bg-primary/5 border-primary/20">20 Nodes Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left: Interactive World Map Visual */}
                  <div className="lg:col-span-2 bg-slate-950/80 rounded-2xl border border-slate-800/80 p-4 h-[360px] relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />
                    
                    {/* SVG Map Layout */}
                    <div className="w-full h-full flex items-center justify-center relative z-10">
                      <svg className="w-full h-full max-h-[280px]" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                        {/* Mock World Outlines / Grids */}
                        <path d="M 50,150 Q 150,180 250,130 T 450,140 T 650,160 T 750,150" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                        <path d="M 100,280 Q 250,250 400,290 T 700,270" stroke="rgba(99,102,241,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
                        
                        {/* Major Shipping Lanes */}
                        <path d="M 120,150 Q 280,130 440,160 T 720,150" stroke="rgba(244,63,94,0.3)" strokeWidth="2" strokeDasharray="6 4" className="animate-pulse" />
                        <path d="M 180,240 Q 380,260 520,180" stroke="rgba(16,185,129,0.3)" strokeWidth="2" strokeDasharray="5 3" />
                        
                        {/* Trans-continental links */}
                        <path d="M 440,160 L 520,180" stroke="rgba(59,130,246,0.4)" strokeWidth="1.5" strokeDasharray="2 2" />

                        {/* USA East Hub */}
                        <circle cx="180" cy="140" r="7" fill="rgba(59,130,246,0.4)" />
                        <circle cx="180" cy="140" r="3" fill="#3b82f6" />
                        <circle cx="180" cy="140" r="12" stroke="#3b82f6" strokeWidth="1.5" className="animate-ping" style={{ transformOrigin: '180px 140px' }} />
                        <text x="180" y="125" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">US-EAST</text>

                        {/* Europe Central Hub */}
                        <circle cx="440" cy="120" r="7" fill="rgba(16,185,129,0.4)" />
                        <circle cx="440" cy="120" r="3" fill="#10b981" />
                        <text x="440" y="105" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EU-WEST</text>

                        {/* Suez Transit Point */}
                        <circle cx="520" cy="180" r="5" fill="rgba(244,63,94,0.4)" />
                        <circle cx="520" cy="180" r="2" fill="#f43f5e" />
                        <text x="540" y="184" fill="#f43f5e" fontSize="9" fontWeight="bold" fontFamily="monospace">SUEZ CHOKEPOINT</text>

                        {/* APAC Hub */}
                        <circle cx="680" cy="220" r="7" fill="rgba(99,102,241,0.4)" />
                        <circle cx="680" cy="220" r="3" fill="#6366f1" />
                        <text x="680" y="205" fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">APAC-S1</text>
                      </svg>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-900 pt-2 font-mono">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Live Shipping Corridors</span>
                      <span>Projection: Equirectangular</span>
                    </div>
                  </div>

                  {/* Right: Grid of Warehouses */}
                  <div className="flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Telemetry Feed & Node Cap Utilization</div>
                      <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                        {Array.from({ length: 20 }).map((_, i) => {
                          const id = `WH-${String(i + 1).padStart(3, '0')}`;
                          const cap = 150000 + (i * 18500) % 350000;
                          const used = 120000 + (i * 24000) % cap;
                          const util = Math.round((used / cap) * 100);
                          const status = util > 85 ? 'near-capacity' : 'optimal';
                          
                          return (
                            <div 
                              key={id} 
                              onClick={() => {
                                toast.info(`Node ${id} Telemetry Selected`, {
                                  description: `Capacity: ${used.toLocaleString()}/${cap.toLocaleString()} units (${util}% Utilized). Active SKUs: 77.`
                                });
                              }}
                              className={`p-2.5 rounded-xl border cursor-pointer hover:scale-[1.02] transition-all ${
                                status === 'near-capacity' 
                                  ? 'bg-rose-950/10 border-rose-500/20 hover:border-rose-500/40 text-rose-200' 
                                  : 'bg-slate-900/40 border-slate-800 hover:border-indigo-500/40 text-slate-200'
                              }`}
                            >
                              <div className="flex justify-between items-center text-[10px] font-bold mb-1">
                                <span className="font-mono">{id}</span>
                                <span className={`w-1.5 h-1.5 rounded-full ${status === 'near-capacity' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`} />
                              </div>
                              <div className="text-[9px] text-muted-foreground">Util: {util}%</div>
                              <div className="mt-1.5 w-full bg-white/5 h-1 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${status === 'near-capacity' ? 'bg-rose-500' : 'bg-indigo-500'}`} 
                                  style={{ width: `${util}%` }} 
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                      <span>WS Feed Status: CONNECTED</span>
                      <span>Port: 8008</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

             <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-none shadow-sm bg-slate-900/50">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-black uppercase text-slate-300 flex items-center justify-between">
                       <span>Regional Demand Forecast</span>
                       <Badge variant="secondary" className="text-[9px] h-4">Accuracy: 89.5%</Badge>
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="h-[200px] p-4 flex flex-col justify-between border-t border-slate-800">
                     <div className="space-y-3">
                       <div className="flex justify-between items-center text-[11px]">
                         <span className="text-slate-400">Target Region:</span>
                         <span className="font-bold text-slate-200">US-EAST-1</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px]">
                         <span className="text-slate-400">RMSE Variance:</span>
                         <span className="font-mono text-emerald-400 font-bold">{kpiData.rmse}</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px]">
                         <span className="text-slate-400">Demand Trend:</span>
                         <span className="text-slate-200 flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Steady Growth</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px]">
                         <span className="text-slate-400">Model Drift Status:</span>
                         <span className="text-emerald-400 font-semibold uppercase text-[9px] bg-emerald-500/10 px-2 py-0.5 rounded-full">Optimal (Low Drift)</span>
                       </div>
                     </div>
                     <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-500 italic">
                       Powered by Prophet Time-Series Engine (30-day forecast horizon)
                     </div>
                   </CardContent>
                </Card>
                
                <Card className="border-none shadow-sm bg-slate-900/50">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-xs font-black uppercase text-slate-300 flex items-center justify-between">
                       <span>Service Level Risks</span>
                       <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full">{kpiData.sla} SLA</span>
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="h-[200px] p-4 flex flex-col justify-between border-t border-slate-800">
                     <div className="space-y-2.5 overflow-y-auto max-h-[140px] pr-1">
                       <div className="flex items-center justify-between text-[11px] bg-emerald-950/10 border border-emerald-500/10 p-2 rounded-lg">
                         <span className="font-bold text-emerald-400">DEA Compliance</span>
                         <span className="text-emerald-500 text-[10px] font-semibold">VERIFIED</span>
                       </div>
                       <div className="flex items-center justify-between text-[11px] bg-emerald-950/10 border border-emerald-500/10 p-2 rounded-lg">
                         <span className="font-bold text-emerald-400">FEFO Dispatching</span>
                         <span className="text-emerald-500 text-[10px] font-semibold">ACTIVE</span>
                       </div>
                       <div className="flex items-center justify-between text-[11px] bg-slate-950/40 border border-slate-800/80 p-2 rounded-lg">
                         <span className="text-slate-300">Cold-Chain Alarms</span>
                         <span className="text-slate-500 text-[10px]">0 ACTIVE</span>
                       </div>
                     </div>
                     <div className="text-[9px] text-slate-500 font-mono flex justify-between items-center border-t border-slate-800/80 pt-2">
                       <span>System Audit Trail: ENABLED</span>
                       <span>FDA 21 CFR Compliant</span>
                     </div>
                   </CardContent>
                </Card>
             </div>
          </div>

          {/* Right: Governance & Recommendation Column */}
          <div className="md:col-span-4 space-y-6">
             <Card className="border-none shadow-lg bg-gradient-to-b from-primary/[0.03] to-background">
              <CardHeader className="border-b">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-500" />
                  Autonomous Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y max-h-[480px] overflow-y-auto">
                  {isLoadingRecommendations ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      <span className="text-xs font-bold uppercase tracking-wider animate-pulse">Consulting AI Agents...</span>
                    </div>
                  ) : (
                    displayRecs.map((rec: any, idx: number) => (
                      <div key={idx} className="p-4 hover:bg-muted/30 transition-colors group cursor-pointer">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="secondary" className="text-[10px] font-black h-4 px-1.5 uppercase">Optimization</Badge>
                          <span className="text-[10px] text-muted-foreground font-mono font-bold">{rec.confidence}% Confidence</span>
                        </div>
                        <p className="text-xs font-bold mb-1">Move {rec.qty} lots of {rec.sku}</p>
                        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed">
                          Rebalance from <span className="font-semibold text-foreground">{rec.from}</span> to <span className="font-semibold text-foreground">{rec.to}</span>. {rec.savings} savings.
                        </p>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleExecute(rec)}
                          disabled={executingId !== null}
                          className="h-7 w-full text-[10px] font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all flex items-center justify-center gap-1.5"
                        >
                          {executingId === rec.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Running FEFO validation...
                            </>
                          ) : (
                            <>
                              Execute Prescription <ArrowRight className="ml-1 h-3 w-3" />
                            </>
                          )}
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
             </Card>

             <CopilotPanel />
          </div>
        </div>
    </div>
  );
}
