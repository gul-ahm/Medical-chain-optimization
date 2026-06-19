'use client';

import { useQuery } from '@tanstack/react-query';
import { forecastingApi } from '@/lib/api/client';

export function useForecastingData(sku?: string) {
  const forecastQuery = useQuery({
    queryKey: ['forecasting', 'forecast', sku],
    queryFn: async () => {
      if (!sku) return null;
      const res = await forecastingApi.getForecast(sku);
      return res.data;
    },
    enabled: !!sku,
    staleTime: 60000,
  });

  const accuracyQuery = useQuery({
    queryKey: ['forecasting', 'accuracy'],
    queryFn: async () => {
      const res = await forecastingApi.getAccuracy();
      return res.data;
    },
    staleTime: 300000,
  });

  return {
    forecast: forecastQuery.data,
    accuracy: accuracyQuery.data,
    isLoading: forecastQuery.isLoading || accuracyQuery.isLoading,
    isError: forecastQuery.isError || accuracyQuery.isError,
  };
}
