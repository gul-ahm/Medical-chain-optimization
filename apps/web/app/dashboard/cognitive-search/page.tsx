'use client';

import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Sparkles, 
  FileText, 
  Box, 
  ShieldCheck, 
  ArrowRight,
  TrendingUp,
  Clock,
  History
} from "lucide-react";
import { CopilotPanel } from "@/components/copilot/CopilotPanel";

export default function CognitiveSearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Main Search View ── */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 scrollbar-hide">
        
        {/* ── Premium Search Header ── */}
        <div className="max-w-4xl mx-auto text-center space-y-6 py-12">
           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 border border-primary/10 mb-2">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Cognitive Intelligence Search</span>
           </div>
           <h1 className="text-5xl font-black tracking-tighter">What can I find for you today?</h1>
           
           <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <Input 
                className="h-20 pl-16 pr-32 text-xl rounded-2xl border-none shadow-2xl bg-muted/30 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                placeholder="Search inventory, suppliers, or operational policies..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <div className="absolute inset-y-0 right-4 flex items-center">
                 <Button className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20">Analyze</Button>
              </div>
           </div>

           <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mr-2">Suggestions:</span>
              {["Lead times for HUB-CHI", "SKU-992 Velocity", "Pharma Compliance", "Consensus Log"].map(tag => (
                <Badge key={tag} variant="secondary" className="px-3 py-1 text-[10px] font-bold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors">
                  {tag}
                </Badge>
              ))}
           </div>
        </div>

        {/* ── Search Results & Intelligence Grid ── */}
        <div className="max-w-6xl mx-auto grid gap-8 md:grid-cols-12 pb-24">
           
           {/* Left: Intelligence Results */}
           <div className="md:col-span-8 space-y-8">
              
              {/* Category: Knowledge Fragments */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">Semantic Knowledge</h2>
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">24 Results</Badge>
                 </div>
                 {[1, 2].map(i => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                       <CardContent className="p-6 flex gap-6">
                          <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                             <FileText className="h-6 w-6 text-blue-500" />
                          </div>
                          <div className="space-y-2">
                             <h3 className="font-bold text-lg group-hover:text-primary transition-colors">Standard Operating Procedure: Regional Hub Transfers</h3>
                             <p className="text-sm text-muted-foreground leading-relaxed">This document outlines the multi-agent consensus requirements for transferring hazardous materials between US-EAST and US-WEST regions...</p>
                             <div className="flex items-center gap-4 pt-2">
                                <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> Updated 2d ago</span>
                                <span className="text-[10px] font-bold text-primary flex items-center gap-1">Governance Validated <ShieldCheck className="h-3 w-3" /></span>
                             </div>
                          </div>
                       </CardContent>
                    </Card>
                 ))}
              </div>

              {/* Category: Inventory Intelligence */}
              <div className="space-y-4 pt-4">
                 <h2 className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground px-2">Live Inventory State</h2>
                 <Card className="border-none shadow-sm overflow-hidden">
                    <div className="grid grid-cols-4 divide-x border-b bg-muted/20">
                       {["SKU", "Warehouse", "Availability", "Risk"].map(h => <div key={h} className="p-3 text-[10px] font-black uppercase text-muted-foreground text-center">{h}</div>)}
                    </div>
                    {[1, 2, 3].map(i => (
                       <div key={i} className="grid grid-cols-4 divide-x hover:bg-muted/10 transition-colors">
                          <div className="p-4 text-xs font-bold text-center">SKU-CORE-{i}01</div>
                          <div className="p-4 text-xs text-center">HUB-CHI-01</div>
                          <div className="p-4 text-xs font-bold text-center text-emerald-500">98%</div>
                          <div className="p-4 text-xs text-center"><Badge variant="outline" className="text-[8px] font-bold text-emerald-500 border-emerald-500/20 bg-emerald-500/5 uppercase">Stable</Badge></div>
                       </div>
                    ))}
                 </Card>
              </div>
           </div>

           {/* Right: AI Insights & Quick Actions */}
           <div className="md:col-span-4 space-y-8">
              <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 to-background">
                 <CardHeader className="pb-3 border-b border-primary/10">
                    <CardTitle className="text-sm font-black flex items-center gap-2">
                       <Sparkles className="h-4 w-4 text-primary" />
                       Intelligence Prescriptions
                    </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                       <div className="flex items-center gap-2 text-emerald-500">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Opportunity Identified</span>
                       </div>
                       <p className="text-xs font-bold">Consolidate Midwest Shipments</p>
                       <p className="text-[11px] text-muted-foreground leading-relaxed">Semantic analysis of recent search patterns suggests an upcoming surge in US-EAST-1 demand. Consolidating orders now could save $4.2k.</p>
                       <Button size="sm" className="w-full h-8 text-[10px] font-bold mt-2">Open Strategy Lab <ArrowRight className="ml-2 h-3 w-3" /></Button>
                    </div>
                    
                    <div className="pt-6 border-t border-primary/10">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                          <History className="h-3 w-3" /> Recent Insights
                       </h4>
                       <div className="space-y-3">
                          {["Safety Stock Policy v2", "Supplier Risk: Aether Corp", "Q3 Peak Strategy"].map(item => (
                             <div key={item} className="flex items-center justify-between text-xs font-medium hover:text-primary cursor-pointer group">
                                {item}
                                <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-all" />
                             </div>
                          ))}
                       </div>
                    </div>
                 </CardContent>
              </Card>

              <CopilotPanel />
           </div>
        </div>
      </main>
    </div>
  );
}
