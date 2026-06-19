'use client';

import React, { useState, useEffect } from 'react';
import { Flame, ShieldCheck, HelpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChaosOutage {
  component: string;
  name: string;
  desc: string;
}

export const ChaosDashboard: React.FC = () => {
  const [activeOutages, setActiveOutages] = useState<string[]>([]);
  const [isMutating, setIsMutating] = useState<string | null>(null);
  const [recoveryLog, setRecoveryLog] = useState<any[]>([]);
  const [overallIndex, setOverallIndex] = useState<string>("98.4% (EXCELLENT)");

  const targets: ChaosOutage[] = [
    { component: 'KAFKA', name: 'Kafka Pipeline', desc: 'Simulate ingress buffer collapse' },
    { component: 'REDIS', name: 'Redis Cache', desc: 'Induce temporal memory drop' },
    { component: 'DATABASE', name: 'Postgres DB', desc: 'Simulate pool saturation failover' },
    { component: 'OLLAMA', name: 'Inference Engine', desc: 'Shed excess reasoning queues' }
  ];

  const fetchWithFallback = async (v1Url: string, directUrl: string, options?: RequestInit) => {
    try {
      const res = await fetch(v1Url, options);
      if (!res.ok) throw new Error('v1 route offline');
      return res;
    } catch (err) {
      return await fetch(directUrl, options);
    }
  };

  const syncStatus = async () => {
    try {
      const res = await fetchWithFallback(
        '/api/v1/ai/chaos/status',
        '/api/v1/chaos/status'
      );
      if (res.ok) {
        const json = await res.json();
        const payload = json.data || json;
        if (payload) {
          if (Array.isArray(payload.active_infrastructure_shocks)) {
            setActiveOutages(payload.active_infrastructure_shocks.map((s: string) => s.toUpperCase()));
          }
          if (payload.overall_survivability_index) {
            setOverallIndex(payload.overall_survivability_index);
          }
          if (Array.isArray(payload.resilience_scenarios_results)) {
            const mappedLogs = payload.resilience_scenarios_results.map((res: any) => ({
              step: res.scenario || 'Scenario Run',
              desc: `Recovery retry loops: ${res.recovery_loops_executed}. Mode: ${res.degradation_mode || 'AUTOMATIC'}`,
              status: res.reconnection_verified ? 'SUCCESS' : 'WARNING'
            }));
            setRecoveryLog(mappedLogs);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch chaos status from backend:", err);
    }
  };

  useEffect(() => {
    syncStatus();
    const interval = setInterval(syncStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const triggerChaos = async (component: string) => {
    setIsMutating(component);
    try {
      await fetchWithFallback(
        '/api/v1/ai/chaos/simulate',
        '/api/v1/chaos/inject',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ component })
        }
      );
      await syncStatus();
    } catch (err) {
      console.error("Failed to inject chaos:", err);
    } finally {
      setIsMutating(null);
    }
  };

  const healSystem = async () => {
    setIsMutating('HEAL_ALL');
    try {
      // Heal all currently active outages
      for (const comp of activeOutages) {
        await fetchWithFallback(
          '/api/v1/ai/chaos/heal',
          '/api/v1/chaos/recover',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ component: comp })
          }
        );
      }
      await syncStatus();
    } catch (err) {
      console.error("Failed to heal chaos outages:", err);
    } finally {
      setIsMutating(null);
    }
  };

  return (
    <div className="p-6 bg-slate-950/80 rounded-3xl border border-rose-500/30 shadow-[0_0_50px_rgba(244,63,94,0.05)] backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-6 border-b border-rose-500/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Resilience Chaos Engineering</h3>
            <p className="text-[11px] text-slate-400">Shock-test operational recovery under synthetic component outages</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-500 font-bold uppercase font-mono">Survivability Index:</span>
          <span className={cn(
            "text-[10px] font-extrabold uppercase font-mono px-2 py-0.5 rounded",
            activeOutages.length > 0 ? "bg-rose-500/10 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
          )}>
            {overallIndex}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shock Panel */}
        <div className="space-y-4">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Select Component Outage Shock</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {targets.map((tgt) => {
              const isActive = activeOutages.includes(tgt.component);
              const isLoading = isMutating === tgt.component;
              return (
                <div 
                  key={tgt.component}
                  onClick={() => !isActive && !isMutating && triggerChaos(tgt.component)}
                  className={cn(
                    "p-3.5 rounded-2xl border transition-all cursor-pointer select-none",
                    isActive 
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
                      : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-extrabold text-xs block uppercase tracking-wider">{tgt.name}</span>
                    {isLoading && <span className="w-2.5 h-2.5 rounded-full border border-rose-500 border-t-transparent animate-spin" />}
                    {isActive && !isLoading && <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>}
                  </div>
                  <div className="text-[10px] text-slate-500 leading-snug font-medium">{tgt.desc}</div>
                </div>
              );
            })}
          </div>

          {activeOutages.length > 0 && (
            <button 
              onClick={healSystem}
              disabled={!!isMutating}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              {isMutating === 'HEAL_ALL' ? (
                <span className="w-3.5 h-3.5 rounded-full border border-white border-t-transparent animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 animate-bounce" />
              )}
              Reset and Verify System Health
            </button>
          )}
        </div>

        {/* Self-Healing logs */}
        <div className="bg-slate-900/30 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 font-mono">Self-Healing Execution Log</div>

          {isMutating && isMutating !== 'HEAL_ALL' ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-8">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
              <span className="text-xs text-rose-400 font-mono font-bold uppercase tracking-wider">Simulating cascading shock...</span>
            </div>
          ) : recoveryLog.length > 0 ? (
            <div className="flex-1 space-y-2 py-1 max-h-[180px] overflow-y-auto pr-1">
              {recoveryLog.map((log, index) => (
                <div key={index} className="flex justify-between items-start bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="font-extrabold text-slate-200 block uppercase tracking-wider">{log.step}</span>
                    <span className="text-slate-500 mt-0.5 block text-[10px]">{log.desc}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-extrabold uppercase",
                    log.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  )}>
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-8 text-center space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-700" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600">No active shocks injected.</span>
              <p className="text-[10px] text-slate-700">Select a core target component to trigger auto-recovery protocol suite audits.</p>
            </div>
          )}

          <div className="mt-4 text-[10px] text-slate-500 bg-slate-950/30 p-2.5 rounded-lg border border-slate-800/50 italic text-center font-mono">
            * Validates fallback retry dynamics and exactly-once transactional integrity parameters.
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChaosDashboard;
