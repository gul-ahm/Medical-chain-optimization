'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Microscope, 
  Loader2, 
  AlertTriangle, 
  FileText, 
  Activity, 
  ShieldAlert, 
  RefreshCw 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AIShortageForensics({ sku, warehouseId }: { sku: string; warehouseId: string }) {
  const [investigationData, setInvestigationData] = useState<any>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInvestigate = async () => {
    setIsPending(true);
    setError(null);
    setInvestigationData(null);

    try {
      let response;
      try {
        // Try the actual FastAPI route first
        response = await fetch('/api/v1/ai/shortage-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku,
            warehouse_id: warehouseId,
          }),
        });
        if (!response.ok) {
          throw new Error('API v1 offline');
        }
      } catch (err) {
        // Fallback to direct path specified in directive
        response = await fetch('/ai/shortage-analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sku,
            warehouse_id: warehouseId,
          }),
        });
      }

      if (!response.ok) {
        throw new Error('AI Orchestrator responded with an error');
      }

      const resData = await response.json();
      const forensicData = resData.data || resData;

      if (forensicData.error) {
        throw new Error(forensicData.error);
      }

      setInvestigationData(forensicData);
    } catch (err) {
      console.error(err);
      setError('AI Orchestrator is offline.');
    } finally {
      setIsPending(false);
    }
  };

  const getRiskStyle = (risk: string) => {
    const r = String(risk || '').toUpperCase();
    if (r.includes('HIGH')) {
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)] animate-pulse';
    }
    if (r.includes('MEDIUM') || r.includes('MODERATE')) {
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/30';
    }
    if (r.includes('LOW')) {
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
    }
    return 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30';
  };

  return (
    <div className="w-full">
      {investigationData ? (
        <div className="space-y-4 p-5 rounded-2xl border border-indigo-500/30 bg-slate-900/60 backdrop-blur-md shadow-2xl animate-in fade-in duration-500">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Microscope className="h-4 w-4 text-indigo-500 animate-pulse" /> Clinical Shortage Forensics
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setInvestigationData(null)} 
              className="h-7 text-[10px] uppercase font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50 rounded-lg px-3 transition-all"
            >
              Reset Audit
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Root Cause Analysis */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Root Cause Analysis
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-indigo-500/10 text-xs text-slate-300 leading-relaxed font-medium">
                {investigationData.root_cause || "No root cause data returned."}
              </div>
            </div>

            {/* Risk Assessment Level */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> Clinical Risk Assessment
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "px-3 py-1 text-[10px] font-extrabold uppercase rounded-full tracking-wider shrink-0",
                  getRiskStyle(investigationData.risk_assessment)
                )}>
                  {investigationData.risk_assessment || "UNKNOWN"}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Priority level registered on clinical supply telemetry.
                </span>
              </div>
            </div>

            {/* Mitigation Strategy Plan */}
            <div className="space-y-1">
              <div className="text-[10px] font-bold uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Mitigation Strategy Plan
              </div>
              <div className="p-3 bg-slate-950/50 rounded-xl border border-emerald-500/20 text-xs text-emerald-400/90 leading-relaxed font-semibold">
                {typeof investigationData.mitigation_plan === 'object' && investigationData.mitigation_plan !== null ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {Object.entries(investigationData.mitigation_plan).map(([key, val]: [string, any]) => (
                      <li key={key}>
                        <strong className="text-emerald-300">{key}:</strong>{' '}
                        {typeof val === 'object' && val !== null ? (
                          <span className="text-slate-300">
                            {Object.entries(val).map(([subK, subV]) => `${subK}: ${subV}`).join(', ')}
                          </span>
                        ) : (
                          String(val)
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  investigationData.mitigation_plan || "No mitigation strategy plan returned."
                )}
              </div>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs font-bold flex flex-col gap-2 animate-in fade-in duration-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>CRITICAL ERROR: FORENSICS OFFLINE</span>
          </div>
          <p className="font-mono text-[10px] text-rose-400/80 leading-normal">
            Endpoint /ai/shortage-analysis is unreachable. AI Forensic Agent is unable to construct causality chain.
          </p>
          <Button 
            size="sm"
            variant="outline"
            onClick={handleInvestigate}
            className="mt-1 h-7 text-[10px] uppercase font-bold border-rose-500/30 text-rose-400 hover:bg-rose-500/20 w-full"
          >
            <RefreshCw className="h-3 w-3 mr-1" /> Retry Connection
          </Button>
        </div>
      ) : (
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleInvestigate}
          disabled={isPending}
          className="h-8 text-xs border-rose-500/30 text-rose-400 bg-rose-950/10 hover:bg-rose-500/20 hover:text-rose-200 hover:border-rose-400/50 shadow-sm transition-all w-full font-bold uppercase tracking-wider flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-400" />
              <span>Analyzing Clinical Telemetry...</span>
            </>
          ) : (
            <>
              <Microscope className="h-3.5 w-3.5 text-rose-400" />
              <span>Initiate Forensic Investigation</span>
            </>
          )}
        </Button>
      )}
    </div>
  );
}
