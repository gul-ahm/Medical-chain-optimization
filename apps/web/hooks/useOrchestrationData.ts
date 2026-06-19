'use client';

import { useQuery } from '@tanstack/react-query';
import { orchestrationApi } from '@/lib/api/client';

export function useOrchestrationData() {
  const workflowsQuery = useQuery({
    queryKey: ['orchestration', 'workflows'],
    queryFn: async () => {
      const res = await orchestrationApi.getWorkflows();
      return res.data;
    },
    staleTime: 10000,
  });

  return {
    workflows: workflowsQuery.data || [],
    isLoading: workflowsQuery.isLoading,
    isError: workflowsQuery.isError,
  };
}
