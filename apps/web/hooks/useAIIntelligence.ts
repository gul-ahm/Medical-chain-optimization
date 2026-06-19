'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { aiIntelligenceApi } from '@/lib/api/client';
import { useState } from 'react';

export function useAIIntelligence(warehouseId?: string) {
  const recommendationsQuery = useQuery({
    queryKey: ['ai', 'recommendations', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const res = await aiIntelligenceApi.getRecommendations(warehouseId);
      return res.data.data.recommendations || [];
    },
    enabled: !!warehouseId,
    staleTime: 60000,
  });

  const mitigationPlansQuery = useQuery({
    queryKey: ['ai', 'mitigation-plans', warehouseId],
    queryFn: async () => {
      if (!warehouseId) return null;
      const res = await aiIntelligenceApi.getMitigationPlans(warehouseId);
      return res.data.data;
    },
    enabled: !!warehouseId,
    staleTime: 60000,
  });

  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; content: string }[]>([]);

  const copilotMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await aiIntelligenceApi.copilotChat(query, warehouseId);
      return res.data.response;
    },
    onSuccess: (data, query) => {
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: query },
        { role: 'ai', content: data },
      ]);
    },
  });

  const investigationMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await aiIntelligenceApi.investigateIncident(query, warehouseId);
      return res.data.data;
    },
  });

  const decisionMutation = useMutation({
    mutationFn: async (data: { decisionId: string; status: string; operatorId: string; metadata?: any }) => {
      const res = await aiIntelligenceApi.recordDecision(data.decisionId, data.status, data.operatorId, data.metadata);
      return res.data;
    },
  });

  const shortageAnalysisMutation = useMutation({
    mutationFn: async (sku: string) => {
      if (!warehouseId) throw new Error('Warehouse ID required');
      const res = await aiIntelligenceApi.analyzeShortage(sku, warehouseId);
      return res.data.data;
    },
  });

  return {
    recommendations: recommendationsQuery.data || [],
    isLoadingRecommendations: recommendationsQuery.isLoading,
    mitigationPlans: mitigationPlansQuery.data,
    isLoadingMitigation: mitigationPlansQuery.isLoading,
    chatHistory,
    askCopilot: copilotMutation.mutate,
    isAskingCopilot: copilotMutation.isPending,
    investigateIncident: investigationMutation.mutateAsync,
    isInvestigating: investigationMutation.isPending,
    recordDecision: decisionMutation.mutateAsync,
    analyzeShortage: shortageAnalysisMutation.mutateAsync,
    isAnalyzingShortage: shortageAnalysisMutation.isPending,
  };
}
