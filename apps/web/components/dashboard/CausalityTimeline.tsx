'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { GitCommit, Truck, Thermometer, ShieldAlert, Package, ArrowDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CausalStep {
  id: string;
  label: string;
  type: 'LOGISTICS' | 'HARDWARE' | 'INVENTORY' | 'DEMAND';
  description: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export const CausalityTimeline: React.FC = () => {
  const [steps, setSteps] = useState<CausalStep[]>([]);

  const fetchWithFallback = async (v1Url: string, directUrl: string, options?: RequestInit) => {
    try {
      const res = await fetch(v1Url, options);
      if (!res.ok) throw new Error('v1 route offline');
      return res;
    } catch (err) {
      return await fetch(directUrl, options);
    }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['causality-timeline'],
    queryFn: async () => {
      const res = await fetchWithFallback(
        '/api/v1/ai/observability/lineage/default-timeline',
        '/api/v1/ai/observability/lineage/default-timeline'
      );
      if (!res.ok) throw new Error('Failed to retrieve lineage tree');
      const json = await res.json();
      return json.causality_trace || json.data || [];
    },
    refetchInterval: 30000,
    staleTime: 30000,
  });

  useEffect(() => {
    if (Array.isArray(data)) {
      const mapped = data.map((node: any, idx: number) => {
        const nodeType = String(node.node_type || '').toUpperCase();
        
        let label = nodeType;
        if (node.details?.event) label = String(node.details.event).replace(/_/g, ' ');
        if (node.details?.alert) label = String(node.details.alert).replace(/_/g, ' ');
        if (node.details?.strategy) label = String(node.details.strategy).replace(/_/g, ' ');

        let type: 'LOGISTICS' | 'HARDWARE' | 'INVENTORY' | 'DEMAND' = 'INVENTORY';
        if (nodeType.includes('INGESTION') || nodeType.includes('LOGISTICS')) type = 'LOGISTICS';
        if (nodeType.includes('HARDWARE') || nodeType.includes('SENSOR')) type = 'HARDWARE';
        if (nodeType.includes('DEMAND') || nodeType.includes('FORECAST')) type = 'DEMAND';

        let severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'INFO';
        if (nodeType.includes('RISK') || nodeType.includes('ALERT') || nodeType.includes('WARNING')) severity = 'WARNING';
        if (nodeType.includes('CRITICAL') || nodeType.includes('SHORTAGE') || nodeType.includes('PLANNER')) severity = 'CRITICAL';

        let description = '';
        if (node.details) {
          description = Object.entries(node.details)
            .map(([key, val]) => `${key.replace(/_/g, ' ')}: ${val}`)
            .join(', ');
        } else {
          description = `Operational tracking node of type ${nodeType}`;
        }

        return {
          id: idx.toString(),
          label,
          type,
          description,
          severity
        };
      });
      setSteps(mapped);
    }
  }, [data]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'LOGISTICS': return <Truck className="w-4 h-4" />;
      case 'HARDWARE': return <Thermometer className="w-4 h-4" />;
      case 'INVENTORY': return <ShieldAlert className="w-4 h-4" />;
      case 'DEMAND': return <Package className="w-4 h-4" />;
      default: return <GitCommit className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <GitCommit className="w-5 h-5 text-indigo-400 animate-pulse" />
        <h3 className="font-bold text-slate-100 tracking-tight text-sm uppercase">Operational Causality Chain</h3>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          <span className="text-xs text-slate-500 font-mono">Reconstructing causality tree...</span>
        </div>
      ) : isError ? (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs font-bold font-mono">
          [CRITICAL] Telemetry stream disconnected. AI Causality engine is offline.
        </div>
      ) : steps.length === 0 ? (
        <div className="py-6 text-center text-xs text-slate-500 font-mono">
          No causal steps registered.
        </div>
      ) : (
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800 animate-in fade-in duration-300">
          {steps.map((step, idx) => (
            <div key={step.id} className="relative">
              <div className={cn(
                "absolute -left-[23px] top-1.5 w-4 h-4 rounded-full border-2 bg-slate-950 z-10 flex items-center justify-center",
                step.severity === 'CRITICAL' ? 'border-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]' :
                step.severity === 'WARNING' ? 'border-amber-500' : 'border-slate-600'
              )}>
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  step.severity === 'CRITICAL' ? 'bg-rose-500' :
                  step.severity === 'WARNING' ? 'bg-amber-500' : 'bg-slate-600'
                )} />
              </div>

              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn(
                    "p-1 rounded bg-slate-950",
                    step.severity === 'CRITICAL' ? 'text-rose-500' :
                    step.severity === 'WARNING' ? 'text-amber-500' : 'text-slate-400'
                  )}>
                    {getIcon(step.type)}
                  </span>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{step.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug font-medium">{step.description}</p>
              </div>
              
              {idx < steps.length - 1 && (
                <div className="absolute -left-[23px] bottom-[-22px] w-4 h-4 flex items-center justify-center z-10 text-slate-700">
                  <ArrowDown className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10">
        <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-wider text-center font-mono">
          Forensic Reconstruction Validated by AI Graph Intelligence
        </p>
      </div>
    </div>
  );
};

export default CausalityTimeline;
