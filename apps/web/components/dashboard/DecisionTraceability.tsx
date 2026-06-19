import React from 'react';
import { ShieldCheck, Database, Zap, AlertTriangle } from 'lucide-react';

interface DecisionTraceabilityProps {
  evidenceChain: {
    datasets_analyzed: string[];
    constraints_triggered: string[];
    confidence_score: number;
    audit_trace?: string;
  };
}

const DecisionTraceability: React.FC<DecisionTraceabilityProps> = ({ evidenceChain }) => {
  return (
    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <ShieldCheck className="w-5 h-5 text-emerald-400" />
        <h4 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">AI Decision Traceability</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <Database className="w-3 h-3" />
            <span>DATASETS ANALYZED</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {evidenceChain.datasets_analyzed.map((ds) => (
              <span key={ds} className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-300 font-mono">
                {ds}
              </span>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
            <AlertTriangle className="w-3 h-3" />
            <span>CONSTRAINTS EVALUATED</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {evidenceChain.constraints_triggered.map((ct) => (
              <span key={ct} className="px-2 py-1 bg-amber-900/20 text-amber-400 rounded text-[10px] font-semibold border border-amber-900/30">
                {ct}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-slate-400 uppercase">Reasoning Confidence</span>
          </div>
          <span className="text-sm font-bold text-emerald-400">
            {(evidenceChain.confidence_score * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-slate-800 h-1 mt-2 rounded-full overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-500" 
            style={{ width: `${evidenceChain.confidence_score * 100}%` }}
          />
        </div>
      </div>

      {evidenceChain.audit_trace && (
        <div className="mt-3 p-2 bg-slate-800/50 rounded border border-slate-700/50 italic text-[11px] text-slate-400">
          " {evidenceChain.audit_trace} "
        </div>
      )}
    </div>
  );
};

export default DecisionTraceability;
