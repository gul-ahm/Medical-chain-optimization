"use client";

import { useEffect } from 'react';
import { useSSE } from '@/lib/hooks/useSSE';
import { config } from '@/lib/config';
import { OfflineBanner } from '@/components/dashboard/shared/OfflineBanner';
import { useDashboardStore } from '@/lib/store/dashboardStore';

export function SSEProvider({ children }: { children: React.ReactNode }) {
  // Mounts the SSE hook which silently pumps events into Zustand
  useSSE(config.websocket.inventoryStream);
  const status = useDashboardStore((s) => s.connection.status);

  return (
    <>
      {status === 'disconnected' || status === 'error' ? <OfflineBanner /> : null}
      {children}
    </>
  );
}
