'use client';

import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/lib/api/client';
import { useDashboardStore } from '@/lib/store/dashboardStore';
import { useEffect } from 'react';

export function useInventoryData() {
  const store = useDashboardStore();

  const stockQuery = useQuery({
    queryKey: ['inventory', 'stock'],
    queryFn: async () => {
      const res = await inventoryApi.getStock();
      return res.data;
    },
    staleTime: 30000,
  });

  const movementsQuery = useQuery({
    queryKey: ['inventory', 'movements'],
    queryFn: async () => {
      const res = await inventoryApi.getMovements();
      return res.data;
    },
    staleTime: 10000,
  });

  // Sync initial data to store if needed
  useEffect(() => {
    if (stockQuery.data) {
      // In a real app, we might calculate KPIs from raw stock data
      // For now, we assume the backend might send aggregated KPIs too
    }
  }, [stockQuery.data]);

  return {
    stock: stockQuery.data?.data || [],
    movements: movementsQuery.data?.data || [],
    isLoading: stockQuery.isLoading || movementsQuery.isLoading,
    isError: stockQuery.isError || movementsQuery.isError,
    refresh: () => {
      stockQuery.refetch();
      movementsQuery.refetch();
    }
  };
}
