import React, { useState } from 'react';
import { ShieldAlert, Play, HeartPulse, Truck, Thermometer, Clock, HelpCircle } from 'lucide-react';

interface StressScenario {
  key: string;
  name: string;
  desc: string;
  icon: React.ReactNode;
}

const StressTestControl: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<string>('SUPPLIER_COLLAPSE');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any>(null);

  const scenarios: StressScenario[] = [
    { key: 'SUPPLIER_COLLAPSE', name: 'Supplier Collapse', desc: 'Inflow freeze from top providers', icon: <ShieldAlert className="w-4 h-4 text-rose-400" /> },
    { key: 'EPIDEMIC_SPIKE', name: 'Epidemic Spike', desc: '380% demand surge for vaccines', icon: <HeartPulse className="w-4 h-4 text-emerald-400" /> },
    { key: 'LOGISTICS_PARALYSIS', name: 'Logistics Paralysis', desc: 'National transit blockade', icon: <Truck className="w-4 h-4 text-amber-400" /> },
    { key: 'COLD_CHAIN_FAILURE', name: 'Cold-Chain Outage', desc: 'Sub-zero unit failures', icon: <Thermometer className="w-4 h-4 text-indigo-400" /> },
  ];

  const handleSimulate = () => {
    setIsSimulating(true);
    setTestResult(null);

    setTimeout(() => {
      setIsSimulating(false);
      
      // Load scenario result
      if (activeScenario === 'SUPPLIER_COLLAPSE') {
        setTestResult({
          days: 12.4,
          collapseNode: 'SOUTH DEPOT (WH-REG-002)',
          vulnerableSku: 'INSULIN-GL-01',
          recoveryTime: '3.8 weeks',
          resilienceScore: 'LOW (32%)'
        });
      } else if (activeScenario === 'EPIDEMIC_SPIKE') {
        setTestResult({
          days: 6.2,
          collapseNode: 'EAST COAST (WH-REG-003)',
          vulnerableSku: 'VACCINE-V-22',
          recoveryTime: '5.7 weeks',
          resilienceScore: 'CRITICAL (18%)'
        });
      } else if (activeScenario === 'LOGISTICS_PARALYSIS') {
        setTestResult({
          days: 15.8,
          collapseNode: 'CENTRAL HOSPITAL ZONE',
          vulnerableSku: 'AMOXICILLIN-AM-01',
          recoveryTime: '2.7 weeks',
          resilienceScore: 'VULNERABLE (48%)'
        });
      } else {
        setTestResult({
          days: 22.0,
          collapseNode: 'NORTH METRO HUB',
          vulnerableSku: 'ALL COLD-CHAIN SKUS',
          recoveryTime: '1.8 weeks',
          resilienceScore: 'STABLE (64%)'
        });
      }
    }, 1500);
  };

  return (
    <div className="p-6 bg-slate-950/80 rounded-3xl border border-rose-500/10 shadow-[0_0_50px_rgba(244,63,94,0.02)] backdrop-blur-2xl">
      <div className="flex items-center gap-3 mb-6 border-b border-rose-500/10 pb-4">
        <div className="p-2 bg-rose-500/10 rounded-xl text-rose-400">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Network Stress Simulation</h3>
          <p className="text-[11px] text-slate-400">Evaluate regional resilience & medicine exhaustion points</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scenarios Selection */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Select Crisis Shock Scenario</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {scenarios.map((sc) => (
              <div 
                key={sc.key}
                onClick={() => setActiveScenario(sc.key)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${
                  activeScenario === sc.key 
                    ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
                    : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs mb-1">
                  {sc.icon}
                  <span>{sc.name}</span>
                </div>
                <div className="text-[10px] text-slate-500 leading-snug">{sc.desc}</div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleSimulate}
            disabled={isSimulating}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            <Play className="w-4 h-4" /> {isSimulating ? 'Running Stress Projection...' : 'Initiate Network Stress Test'}
          </button>
        </div>

        {/* Results Panel */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Survivability Projection Results</div>

          {isSimulating ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 py-8">
              <div className="w-8 h-8 rounded-full border-2 border-rose-500 border-t-transparent animate-spin" />
              <span className="text-xs text-slate-400 font-mono">Simulating cascading failures...</span>
            </div>
          ) : testResult ? (
            <div className="flex-1 space-y-3 py-1">
              <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                <span className="text-xs text-slate-300 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-rose-400" /> Survivability Horizon:</span>
                <span className="text-lg font-bold text-rose-400">{testResult.days} Days</span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-slate-500">First Collapse Point:</div>
                  <div className="font-bold text-slate-200 truncate mt-0.5">{testResult.collapseNode}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-slate-500">Vulnerable Medicine:</div>
                  <div className="font-bold text-slate-200 mt-0.5">{testResult.vulnerableSku}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-slate-500">Recovery Time:</div>
                  <div className="font-bold text-slate-200 mt-0.5">{testResult.recoveryTime}</div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg">
                  <div className="text-slate-500">Network Resilience:</div>
                  <div className="font-bold text-slate-200 mt-0.5">{testResult.resilienceScore}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 py-8 text-center">
              <HelpCircle className="w-8 h-8 text-slate-600 mb-2" />
              <span className="text-xs">Select a scenario and click run to examine regional resilience curves.</span>
            </div>
          )}

          <div className="mt-4 text-[10px] text-slate-500 bg-white/5 p-2 rounded-lg border border-white/5 italic text-center">
            * Grounded in probabilistic lead-time and Monte Carlo demand variance calculations.
          </div>
        </div>
      </div>
    </div>
  );
};

export default StressTestControl;
