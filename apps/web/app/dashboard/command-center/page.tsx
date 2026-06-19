'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  Network, 
  BarChart3,
  RefreshCcw
} from "lucide-react";
import { ApprovalWorkflow } from "@/components/governance/ApprovalWorkflow";

export default function CommandCenterPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      {/* ── Header & Action Bar ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Autonomous Command Center</h1>
          <p className="text-muted-foreground">Real-time orchestration and governance of the global supply chain intelligence.</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 py-1">
            <Activity className="mr-2 h-3 w-3 animate-pulse" />
            System Live: 99.9%
          </Badge>
          <Button size="sm">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh Intelligence
          </Button>
        </div>
      </div>

      {/* ── Mission Critical KPIs ── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Network Integrity</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">98.4%</div>
            <p className="text-xs text-muted-foreground mt-1">+0.2% from last hour</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Autonomous Decisions</CardTitle>
            <Zap className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,284</div>
            <p className="text-xs text-muted-foreground mt-1">24 pending approval</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Hotspots</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-destructive font-medium mt-1">Critical escalation required</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Forecast Drift</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.2%</div>
            <p className="text-xs text-muted-foreground mt-1">Within optimal bounds</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Intelligence Grid ── */}
      <div className="grid gap-6 md:grid-cols-12">
        {/* Left Column: Network & Recommendations */}
        <div className="md:col-span-8 space-y-6">
          <Tabs defaultValue="network" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="network">Network Topology</TabsTrigger>
              <TabsTrigger value="anomalies">Anomaly Heatmap</TabsTrigger>
            </TabsList>
            <TabsContent value="network" className="mt-4">
              <Card className="h-[400px] flex items-center justify-center bg-black/5 border-dashed">
                <div className="text-center">
                  <Network className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">React Flow: Supply Chain Topology Visualization</p>
                </div>
              </Card>
            </TabsContent>
            <TabsContent value="anomalies" className="mt-4">
               <Card className="h-[400px] flex items-center justify-center bg-black/5 border-dashed">
                <div className="text-center">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">ECharts: Regional Anomaly Heatmap</p>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Strategic AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Replenish HUB-CHICAGO-02</p>
                      <p className="text-xs text-muted-foreground">Confidence: 94% • Est. ROI: $12.4k</p>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Governance Queue */}
        <div className="md:col-span-4">
          <ApprovalWorkflow />
        </div>
      </div>
    </div>
  );
}
