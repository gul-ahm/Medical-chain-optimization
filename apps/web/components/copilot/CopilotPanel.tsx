'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from 'lucide-react';
import {
  Send,
  Bot,
  User,
  Zap,
  BarChart3,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { cn } from '@/lib/utils';
import { useCopilot } from '@/components/providers/CopilotProvider';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  timestamp: string;
  type?: 'text' | 'recommendation' | 'alert';
}

export const CopilotPanel: React.FC = () => {
  const { messages, input, setInput, isLoading, error, sendMessage, handleQuickAction } = useCopilot();
  const [selectedRecommendation, setSelectedRecommendation] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);



  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput('');
  };

  const handleApplyRecommendation = () => {
    sendMessage(`Applied recommendation: ${selectedRecommendation}`);
    setSelectedRecommendation(null);
  };

  return (
    <Card className="flex flex-col h-[600px] border-l-0 rounded-none shadow-2xl bg-slate-900/60 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between py-4 border-b border-indigo-500/20 bg-indigo-500/5">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500/10 p-2 rounded-full">
            <Bot className="h-5 w-5 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <CardTitle className="text-xs font-extrabold uppercase tracking-wider text-indigo-300">Simulation Lab Copilot</CardTitle>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] text-emerald-400 uppercase font-extrabold tracking-wider">Operational Mode</span>
            </div>
          </div>
        </div>
        <Badge variant="outline" className="text-[9px] uppercase font-extrabold border-indigo-500/30 text-indigo-400 bg-indigo-950/40">Ollama Air-Gapped</Badge>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-60">
                <Sparkles className="h-10 w-10 text-indigo-400 animate-bounce" />
                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider leading-relaxed">
                  System Initialized. <br /> Ask me to run capacity projections or cold-chain rules.
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs font-bold flex flex-col gap-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                  <span>Local Ollama Orchestrator is offline.</span>
                </div>
                <p className="font-mono text-[10px] text-rose-400/80 leading-normal">
                  Endpoint /ai/copilot/chat is unreachable. Supply chain intelligence RAG is unavailable.
                </p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border ${msg.role === 'user' ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-indigo-950/50 text-indigo-400 border-indigo-500/30'}`}>
                    {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`space-y-2 p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-500' : 'bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none'}`}>
                    {msg.content}
                    {msg.type === 'recommendation' && (
                      <div className="mt-2 p-2 bg-slate-950/80 rounded-lg border border-indigo-500/20 flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors" onClick={() => setSelectedRecommendation(msg.content)}>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase">
                          <Zap className="h-3 w-3 text-amber-500" />
                          Strategic Recommendation
                        </div>
                        <Button variant="ghost" size="icon" className="h-5 w-5 p-0 text-indigo-400 hover:text-indigo-200">
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-pulse">
                <div className="flex gap-3 max-w-[85%]">
                  <div className="mt-1 flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center border bg-indigo-950/50 text-indigo-400 border-indigo-500/30">
                    <Bot className="h-4 w-4 animate-bounce" />
                  </div>
                  <div className="p-3 rounded-2xl text-xs font-bold bg-slate-800/80 border border-slate-700 rounded-tl-none flex items-center gap-2 text-indigo-300">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Analyzing network constraints...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t border-slate-850 bg-slate-950/20 flex flex-col gap-3">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Analyze regional hub capacity constraints under active outage')}
            className="h-7 text-[9px] px-2.5 whitespace-nowrap bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 uppercase font-extrabold tracking-wider"
            disabled={isLoading}
          >
            <BarChart3 className="mr-1 h-3.5 w-3.5 text-indigo-400" /> Analyze Capacity
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Review active compliance policy rules for cold-chain transportation')}
            className="h-7 text-[9px] px-2.5 whitespace-nowrap bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 uppercase font-extrabold tracking-wider"
            disabled={isLoading}
          >
            <ShieldCheck className="mr-1 h-3.5 w-3.5 text-indigo-400" /> Policy Audit
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('Perform network-wide risk forecasting and identify imminent shortages')}
            className="h-7 text-[9px] px-2.5 whitespace-nowrap bg-slate-900 border-slate-800 text-slate-300 hover:text-slate-100 hover:bg-slate-800 uppercase font-extrabold tracking-wider"
            disabled={isLoading}
          >
            <AlertTriangle className="mr-1 h-3.5 w-3.5 text-indigo-400" /> Risk Forecast
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          <Input
            placeholder={isLoading ? "Thinking..." : "Ask the Copilot..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="bg-slate-950 border-slate-850 text-slate-200 focus-visible:ring-indigo-500 text-xs"
            disabled={isLoading}
          />
          <Button size="icon" onClick={handleSend} disabled={!input.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-700 h-9 w-9 shrink-0 text-white shadow-lg shadow-indigo-600/20">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </CardFooter>

      {/* Recommendation Review Modal */}
      {selectedRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border bg-indigo-500/10 flex items-center justify-between">
              <h3 className="font-bold text-indigo-700 flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" />
                Review Recommendation
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedRecommendation(null)}>Close</Button>
            </div>
            <div className="p-6 text-sm text-foreground/80 leading-relaxed max-h-[60vh] overflow-y-auto">
              {selectedRecommendation}
            </div>
            <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedRecommendation(null)}>Cancel</Button>
              <Button onClick={handleApplyRecommendation} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg">Approve & Apply</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
