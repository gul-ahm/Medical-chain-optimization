'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  Layers, 
  Zap, 
  BarChart, 
  ShieldCheck, 
  Info,
  Clock,
  ArrowRight,
  ChevronDown
} from "lucide-react";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";

export default function ExplainabilityPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Main Explainability View ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-10 space-y-10 scrollbar-hide">
        
        {/* ── Transparency Header ── */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-8">
          <div className="flex items-center gap-5">
            <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
              <Eye className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter">AI Explainability Lab</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 font-bold text-[10px]">MODEL: PRODUCTION-v4.2</Badge>
                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Type: XGBoost + SHAP Explainer</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button variant="outline" size="sm" className="gap-2 font-bold h-9">
               <ShieldCheck className="h-4 w-4 text-primary" /> Governance Validated
             </Button>
             <Button size="sm" className="gap-2 shadow-lg shadow-primary/20 font-bold h-9">
               Download Audit Report <ArrowRight className="h-4 w-4" />
             </Button>
          </div>
        </div>

        {/* ── Global Feature Importance ── */}
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-7 space-y-6">
            <Card className="border-none shadow-xl bg-muted/20 overflow-hidden">
              <CardHeader className="bg-background border-b py-4">
                 <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                       <BarChart className="h-4 w-4" /> Global Feature Attribution (SHAP)
                    </CardTitle>
                    <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold">Configure <ChevronDown className="ml-1 h-3 w-3" /></Button>
                 </div>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center p-0 relative">
                 <div className="text-center opacity-30 select-none">
                    <Layers className="h-16 w-16 mx-auto mb-4 animate-pulse text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Multi-Agent Attribution Layer</p>
                 </div>
                 {/* Feature List Overlay Mock */}
                 <div className="absolute right-8 top-8 bottom-8 w-48 space-y-4">
                    {[
                      { label: "Inventory_Age", val: "24%", color: "bg-primary" },
                      { label: "Lead_Time_Var", val: "18%", color: "bg-blue-500" },
                      { label: "Historical_Drift", val: "14%", color: "bg-purple-500" },
                      { label: "Regional_Demand", val: "12%", color: "bg-amber-500" }
                    ].map(f => (
                      <div key={f.label} className="space-y-1">
                         <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter">
                            <span>{f.label}</span>
                            <span>{f.val}</span>
                         </div>
                         <div className="h-1 w-full bg-background rounded-full overflow-hidden">
                            <div className={`h-full ${f.color}`} style={{ width: f.val }} />
                         </div>
                      </div>
                    ))}
                 </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
               <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Calibration Plot</CardTitle></CardHeader>
                  <CardContent className="h-32 border-t flex items-center justify-center bg-black/[0.01]">
                    <Zap className="h-6 w-6 text-emerald-500 opacity-20" />
                  </CardContent>
               </Card>
               <Card className="border-none shadow-sm">
                  <CardHeader><CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Confidence Reliability</CardTitle></CardHeader>
                  <CardContent className="h-32 border-t flex items-center justify-center bg-black/[0.01]">
                    <ShieldCheck className="h-6 w-6 text-primary opacity-20" />
                  </CardContent>
               </Card>
            </div>
          </div>

          {/* Right: Local Decision Breakdown & Copilot */}
          <div className="md:col-span-5 space-y-8">
             <Card className="border-none shadow-2xl bg-gradient-to-br from-primary/[0.03] to-background">
                <CardHeader className="border-b">
                   <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                         <Info className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-black">Local Prediction Audit</CardTitle>
                        <p className="text-[10px] text-muted-foreground font-medium">ID: REQ-992-ALPHA</p>
                      </div>
                   </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                   <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-muted-foreground">Action:</span>
                         <Badge className="bg-primary/20 text-primary border-none font-bold">APPROVE_TRANSFER</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className="text-xs font-bold text-muted-foreground">Confidence:</span>
                         <span className="text-sm font-black text-emerald-500">94.2%</span>
                      </div>
                   </div>
                   
                   <div className="pt-6 border-t space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                        <Clock className="h-3 w-3" /> Decision Rationale
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                         The model approved this transfer primarily due to <span className="text-primary font-bold">Inventory_Age</span> (24% weight) and a predicted <span className="text-primary font-bold">Regional_Demand</span> spike (12% weight). 
                         External macro-economic signals added an 8% boost to the final confidence score.
                      </p>
                   </div>

                   <Button variant="outline" className="w-full h-10 text-xs font-bold border-primary/20 hover:bg-primary/5">
                      View SHAP Force Plot <ChevronDown className="ml-2 h-4 w-4" />
                   </Button>
                </CardContent>
             </Card>

             <CopilotPanel />
          </div>
        </div>
      </main>
    </div>
  );
}
