import React from 'react';
import { Target, ShieldAlert, LifeBuoy, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import DecisionTraceability from './DecisionTraceability';

interface MitigationPlan {
  strategy_type: 'PRIMARY' | 'FALLBACK' | 'EMERGENCY';
  actions: string[];
  reasoning: string;
  risk_assessment: string;
  expected_outcome: string;
  projected_simulation?: {
    overall_confidence: number;
    wastage_reduction_estimate: string;
    shortage_prevention_rate: string;
  };
  safety_validation?: {
    is_safe: boolean;
    audit_trace: string;
  };
}

interface MitigationPlanComparisonProps {
  plans: MitigationPlan[];
  evidenceChain: any;
  onApprove: (plan: MitigationPlan) => void;
}

const MitigationPlanComparison: React.FC<MitigationPlanComparisonProps> = ({ plans = [], evidenceChain, onApprove }) => {
  if (!Array.isArray(plans)) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div 
            key={plan.strategy_type}
            className={`relative p-5 rounded-xl border transition-all duration-300 ${
              plan.strategy_type === 'PRIMARY' 
                ? 'bg-emerald-950/20 border-emerald-500/30 ring-1 ring-emerald-500/20' 
                : plan.strategy_type === 'FALLBACK'
                ? 'bg-blue-950/20 border-blue-500/30'
                : 'bg-rose-950/20 border-rose-500/30'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {plan.strategy_type === 'PRIMARY' ? <Target className="w-5 h-5 text-emerald-400" /> :
                 plan.strategy_type === 'FALLBACK' ? <LifeBuoy className="w-5 h-5 text-blue-400" /> :
                 <ShieldAlert className="w-5 h-5 text-rose-400" />}
                <h3 className="font-bold text-slate-100 tracking-tight">{plan.strategy_type} PLAN</h3>
              </div>
              {plan.safety_validation?.is_safe ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-500" />
              )}
            </div>

            <div className="space-y-3 mb-6">
              {plan.actions.map((action, idx) => (
                <div key={idx} className="flex gap-2 items-start text-sm text-slate-300">
                  <ArrowRight className="w-4 h-4 text-slate-500 mt-1 flex-shrink-0" />
                  <span>{action}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-black/40 rounded-lg mb-6 border border-white/5">
              <div className="text-[11px] text-slate-500 uppercase font-bold mb-1">Projected Outcome</div>
              <div className="text-sm text-slate-200 font-medium">{plan.expected_outcome}</div>
              <div className="mt-2 flex justify-between text-[11px]">
                <span className="text-emerald-400/80">Wastage Reduction: {plan.projected_simulation?.wastage_reduction_estimate}</span>
                <span className="text-emerald-400/80">Prevention: {plan.projected_simulation?.shortage_prevention_rate}</span>
              </div>
            </div>

            <button 
              onClick={() => onApprove(plan)}
              disabled={!plan.safety_validation?.is_safe}
              className={`w-full py-2.5 rounded-lg text-sm font-bold transition-all ${
                plan.strategy_type === 'PRIMARY'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              APPROVE & EXECUTE
            </button>
          </div>
        ))}
      </div>

      <DecisionTraceability evidenceChain={evidenceChain} />
    </div>
  );
};

export default MitigationPlanComparison;
