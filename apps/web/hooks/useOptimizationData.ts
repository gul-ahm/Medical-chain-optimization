'use client';

import { useQuery } from '@tanstack/react-query';
import { optimizationApi } from '@/lib/api/client';

export function useOptimizationData() {
  const utilizationQuery = useQuery({
    queryKey: ['optimization', 'utilization'],
    queryFn: async () => {
      const res = await optimizationApi.getUtilization();
      return res.data;
    },
    staleTime: 60000,
  });

  const recommendationsQuery = useQuery({
    queryKey: ['optimization', 'recommendations'],
    queryFn: async () => {
      const res = await optimizationApi.getRecommendations();
      return res.data;
    },
    staleTime: 30000,
  });

  return {
    utilization: utilizationQuery.data || [],
    recommendations: recommendationsQuery.data || [],
    isLoading: utilizationQuery.isLoading || recommendationsQuery.isLoading,
    isError: utilizationQuery.isError || recommendationsQuery.isError,
  };
}
