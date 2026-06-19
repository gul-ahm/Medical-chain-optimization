'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bot, User, Send, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AICopilotPanel({ warehouseId }: { warehouseId?: string }) {
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || isPending) return;
    const userQuery = input.trim();
    setInput('');
    setError(null);

    // Append user message immediately
    setChatHistory((prev) => [...prev, { role: 'user', content: userQuery }]);
    setIsPending(true);

    try {
      let response;
      try {
        // Try the direct FastAPI port first to bypass Next.js proxy timeouts
        response = await fetch('http://localhost:8008/api/v1/ai/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userQuery,
            warehouse_id: warehouseId || 'WH-REG-001',
          }),
        });
        if (!response.ok) {
          throw new Error('Direct API offline');
        }
      } catch (err) {
        // Fallback to proxy routes if running in different port environments
        try {
          response = await fetch('/api/v1/ai/copilot/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: userQuery,
              warehouse_id: warehouseId || 'WH-REG-001',
            }),
          });
        } catch (proxyErr) {
          response = await fetch('/ai/copilot/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              query: userQuery,
              warehouse_id: warehouseId || 'WH-REG-001',
            }),
          });
        }
      }

      if (!response.ok) {
        throw new Error('AI Orchestrator responded with an error');
      }

      const resData = await response.json();
      const aiResponse = resData.data?.response || resData.response || resData.data || 'No response returned from copilot.';

      setChatHistory((prev) => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      console.error(err);
      setError('AI Orchestrator is offline.');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card className="h-[500px] flex flex-col shadow-2xl border-indigo-500/30 bg-slate-900/60 backdrop-blur-md">
      <CardHeader className="pb-3 border-b border-indigo-500/20 bg-indigo-500/5">
        <CardTitle className="text-xs font-extrabold flex items-center gap-2 text-indigo-400 uppercase tracking-wider">
          <Bot className="h-5 w-5 text-indigo-500 animate-pulse" /> Executive Operational Copilot
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 animate-in fade-in duration-300">
        {chatHistory.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 opacity-60">
            <Sparkles className="h-10 w-10 text-indigo-400 animate-bounce" />
            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider leading-relaxed">
              Ask me about warehouse risks, <br /> storage rules, or supply optimization.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs font-bold flex flex-col gap-2 animate-in fade-in duration-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>CRITICAL ERROR: AI ORCHESTRATION OFFLINE</span>
            </div>
            <p className="font-mono text-[10px] text-rose-400/80 leading-normal">
              Endpoint /ai/copilot/chat is unreachable. Operational telemetry cannot resolve semantic graphs. Check backend service status.
            </p>
          </div>
        )}
        
        {chatHistory.map((msg, i) => (
          <div key={i} className={cn(
            "flex gap-3 max-w-[85%] animate-in fade-in duration-200",
            msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
          )}>
            <div className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center shrink-0 border shadow-sm",
              msg.role === 'user' ? "bg-slate-800 text-slate-300 border-slate-700" : "bg-indigo-950/50 text-indigo-400 border-indigo-500/30"
            )}>
              {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
            </div>
            <div className={cn(
              "p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-sm",
              msg.role === 'user' 
                ? "bg-indigo-600 text-white rounded-tr-none border border-indigo-500" 
                : "bg-slate-800/80 border border-slate-700 text-slate-200 rounded-tl-none"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isPending && (
          <div className="flex gap-3 mr-auto max-w-[85%] animate-in fade-in duration-200">
            <div className="h-8 w-8 rounded-full bg-indigo-950/50 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
            <div className="p-3 rounded-2xl text-xs font-bold bg-slate-800/80 border border-slate-700 rounded-tl-none animate-pulse text-indigo-300">
              Analyzing operational graph...
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 border-t border-slate-800">
        <div className="flex w-full items-center gap-2">
          <Input 
            placeholder="Type your operational query..." 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isPending}
            className="flex-1 text-xs bg-slate-950 border-slate-800 text-slate-200 focus-visible:ring-indigo-500"
          />
          <Button size="icon" onClick={handleSend} disabled={isPending || !input.trim()} className="bg-indigo-600 hover:bg-indigo-700 h-9 w-9 shrink-0 text-white shadow-lg shadow-indigo-600/20">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
