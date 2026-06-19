'use client';

import { useAIIntelligence } from '@/hooks/useAIIntelligence';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bot, Loader2, ShieldCheck, History } from 'lucide-react';
import MitigationPlanComparison from './MitigationPlanComparison';
import { useState } from 'react';
import { toast } from 'sonner';

export function AIRecommendationsList({ warehouseId }: { warehouseId?: string }) {
  const { mitigationPlans, isLoadingMitigation, recordDecision } = useAIIntelligence(warehouseId);
  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async (plan: any) => {
    setIsApproving(true);
    try {
      await recordDecision({
        decisionId: `dec-${Date.now()}`,
        status: 'APPROVED',
        operatorId: 'EXECUTIVE-01',
        metadata: { plan_type: plan.strategy_type, warehouse_id: warehouseId }
      });
      toast.success(`${plan.strategy_type} Plan Approved`, {
        description: 'The operational actions have been queued for execution.'
      });
    } catch (error) {
      toast.error('Failed to record decision');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <Card className="shadow-sm border-indigo-500/20 h-full">
      <CardHeader className="pb-2 border-b bg-indigo-500/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-700">
            <Bot className="h-4 w-4" /> Operational Decision Intelligence
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
              Multi-Step Reasoning Active
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 h-[calc(100%-60px)] overflow-y-auto">
        {isLoadingMitigation ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm animate-pulse font-medium">Running Multi-Step Operational Simulations...</p>
          </div>
        ) : !mitigationPlans ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3 text-muted-foreground opacity-60">
            <ShieldCheck className="h-10 w-10" />
            <p className="text-sm">No critical mitigation required for this sector.</p>
          </div>
        ) : (
          <MitigationPlanComparison 
            plans={mitigationPlans.ranked_mitigation_strategies} 
            evidenceChain={mitigationPlans.evidence_chain}
            onApprove={handleApprove}
          />
        )}
      </CardContent>
    </Card>
  );
}
