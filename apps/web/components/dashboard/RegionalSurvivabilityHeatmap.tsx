import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle2, TrendingUp, Network } from 'lucide-react';

interface RegionStatus {
  name: string;
  score: number;
  status: 'STABLE' | 'VULNERABLE' | 'CRITICAL';
  trend: 'up' | 'down' | 'neutral';
}

const RegionalSurvivabilityHeatmap: React.FC = () => {
  const [regions, setRegions] = useState<RegionStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchSurvivabilityData = async () => {
      try {
        const res = await fetch('/api/dashboard/executive?section=survivability');
        if (res.ok) {
          const body = await res.json();
          if (body.success && body.data && body.data.regions) {
            setRegions(body.data.regions);
          }
        }
      } catch (err) {
        console.error('Failed to fetch regional survivability:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvivabilityData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-xl text-center text-xs text-slate-400 py-12 animate-pulse">
        Loading Network Survivability Heatmap...
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-900/50 rounded-2xl border border-white/5 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-indigo-400" />
          <h3 className="font-bold text-slate-100 tracking-tight text-sm uppercase">Network Survivability Heatmap</h3>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Stable</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /> Critical</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {regions.map((region) => (
          <div 
            key={region.name}
            className={`p-4 rounded-xl border transition-all duration-300 ${
              region.status === 'CRITICAL' ? 'bg-rose-950/30 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
              region.status === 'VULNERABLE' ? 'bg-amber-950/20 border-amber-500/30' :
              'bg-emerald-950/10 border-emerald-500/20'
            }`}
          >
            <div className="text-[10px] font-bold text-slate-400 mb-1 truncate">{region.name}</div>
            <div className="flex items-end justify-between">
              <div className={`text-2xl font-bold ${
                region.status === 'CRITICAL' ? 'text-rose-400' :
                region.status === 'VULNERABLE' ? 'text-amber-400' :
                'text-emerald-400'
              }`}>{region.score}%</div>
              {region.status === 'CRITICAL' ? <AlertTriangle className="w-4 h-4 text-rose-500 mb-1" /> :
               region.status === 'VULNERABLE' ? <Shield className="w-4 h-4 text-amber-500 mb-1" /> :
               <CheckCircle2 className="w-4 h-4 text-emerald-500 mb-1" />}
            </div>
            
            <div className="mt-3 w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  region.status === 'CRITICAL' ? 'bg-rose-500' :
                  region.status === 'VULNERABLE' ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${region.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-white/5 rounded-lg border border-white/5">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-4 h-4 text-rose-400 mt-1" />
          <div>
            <div className="text-xs font-bold text-slate-200">Systemic Vulnerability Detected</div>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              Active operational disruptions are projected to cascade across neighboring centralized hubs. 
              Review optimization suggestions for emergency balancing transfers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalSurvivabilityHeatmap;
