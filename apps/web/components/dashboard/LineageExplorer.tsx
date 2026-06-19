'use client';

import React, { useState, useEffect } from 'react';
import { GitPullRequest, Search, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TraceNode {
  node_type: string;
  timestamp: string;
  details: Record<string, any>;
}

export const LineageExplorer: React.FC = () => {
  const [searchId, setSearchId] = useState('trace-default');
  const [traceNodes, setTraceNodes] = useState<TraceNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWithFallback = async (v1Url: string, directUrl: string, options?: RequestInit) => {
    try {
      const res = await fetch(v1Url, options);
      if (!res.ok) throw new Error('v1 route offline');
      return res;
    } catch (err) {
      return await fetch(directUrl, options);
    }
  };

  const handleSearch = async (targetId: string) => {
    if (!targetId.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithFallback(
        `/api/v1/ai/observability/lineage/${targetId.trim()}`,
        `/api/v1/ai/observability/lineage/${targetId.trim()}`
      );
      if (res.ok) {
        const json = await res.json();
        const rawTrace = json.causality_trace || json.data || [];
        if (Array.isArray(rawTrace) && rawTrace.length > 0) {
          const mapped = rawTrace.map((node: any) => {
            let tsStr = '00:00:00';
            if (node.timestamp) {
              const d = new Date(node.timestamp * 1000);
              tsStr = d.toLocaleTimeString();
            }
            return {
              node_type: node.node_type || 'TRACKING_NODE',
              timestamp: tsStr,
              details: node.details || {}
            };
          });
          setTraceNodes(mapped);
        } else {
          setTraceNodes([]);
          setError("Trace ID not found in transaction ledger.");
        }
      } else {
        throw new Error('Server returned non-200');
      }
    } catch (err) {
      console.error(err);
      setError("Trace database is unreachable.");
      setTraceNodes([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('trace-default');
  }, []);

  return (
    <div className="p-6 bg-slate-950/80 rounded-3xl border border-sky-500/30 shadow-[0_0_50px_rgba(56,189,248,0.05)] backdrop-blur-2xl font-mono">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sky-500/10 pb-4 mb-6 gap-4 font-sans">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400">
            <GitPullRequest className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Causality & Event Lineage Explorer</h3>
            <p className="text-[11px] text-slate-400 font-mono">Trace Provenance of AI & Inventory Actions</p>
          </div>
        </div>
        
        {/* Search Control */}
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
          <input 
            type="text" 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch(searchId)}
            placeholder="Trace ID..."
            className="bg-transparent border-0 text-slate-200 text-xs px-3 focus:outline-none focus:ring-0 font-mono w-40"
            disabled={isLoading}
          />
          <button 
            onClick={() => handleSearch(searchId)}
            disabled={isLoading}
            className="p-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 rounded-lg transition-all"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span className="text-xs text-slate-500">Querying immutable transaction log...</span>
        </div>
      ) : error ? (
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10 text-center space-y-2 animate-in fade-in duration-300">
          <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
          <div className="text-xs font-bold text-rose-455 uppercase tracking-wide">Trace Query Failure</div>
          <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-relaxed">
            {error}. Enforce connection bounds to port 8008 or try searching for "trace-default".
          </p>
        </div>
      ) : traceNodes.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Search a valid Trace ID to inspect dynamic causal events.
        </div>
      ) : (
        <div className="relative border-l border-slate-800 pl-6 ml-3 space-y-6 animate-in fade-in duration-300">
          {traceNodes.map((node, index) => (
            <div key={index} className="relative">
              {/* Circular Marker */}
              <div className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] border-2 border-slate-950 flex items-center justify-center animate-pulse" />
              
              <div className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 hover:border-sky-500/20 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold text-emerald-400 font-mono uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {node.node_type}
                  </span>
                  <span className="text-[10px] text-slate-550 font-mono font-semibold">{node.timestamp}</span>
                </div>
                
                <div className="text-xs text-slate-300 font-mono space-y-1">
                  {Object.entries(node.details).map(([key, val]) => (
                    <div key={key} className="flex justify-between border-b border-slate-800/50 pb-1">
                      <span className="text-slate-500 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-slate-200 font-bold">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LineageExplorer;
