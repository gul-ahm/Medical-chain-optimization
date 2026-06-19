'use client';

import { useCallback, useEffect } from 'react';
import { useRealtimeStream, type ConnectionStatus } from '@/lib/realtime/useRealtimeStream';
import { useDashboardStore, type Alert, type Activity } from '@/lib/store/dashboardStore';

export interface StreamEvent {
  event: string;
  domain?: string;
  payload: Record<string, unknown>;
  correlationId?: string;
}

export function useStreamingDashboard() {
  const store = useDashboardStore();

  const onMessage = useCallback((event: string, payload: any) => {
    const typedPayload = payload as Record<string, any>;
    const domain = (typedPayload.domain as string) || 'executive';
    
    // Update store based on event type
    switch (event) {
      case 'kpi_update':
        store.updateKpis(domain as any, typedPayload.payload || typedPayload);
        break;
      
      case 'inventory_deducted':
      case 'stock_update':
        store.updateKpis('inventory', typedPayload);
        break;

      case 'alert':
      case 'drift_alert':
      case 'forecast_drift':
      case 'escalation_raised': {
        const alert: Alert = {
          id: typedPayload.id || Math.random().toString(36).substr(2, 9),
          severity: typedPayload.severity || 'info',
          message: typedPayload.message || (event === 'forecast_drift' ? `Drift detected: ${typedPayload.sku}` : 'Operational event'),
          domain: domain,
          timestamp: new Date().toISOString(),
        };
        store.addAlert(alert);
        break;
      }

      case 'workflow_update':
      case 'insight_generated': {
        const activity: Activity = {
          id: typedPayload.id || Math.random().toString(36).substr(2, 9),
          action: typedPayload.action || 'Event triggered',
          entity: typedPayload.entity || 'System',
          agent: typedPayload.agent || 'AI Engine',
          timestamp: new Date().toISOString(),
          type: event,
        };
        store.addActivity(domain, activity);
        break;
      }
      
      case 'heartbeat':
        store.updateHeartbeat();
        break;
    }
  }, [store]);

  const stream = useRealtimeStream<unknown>({
    endpoint: '/api/stream/dashboard',
    transport: 'sse',
    eventTypes: [
      'connected',
      'kpi_update',
      'inventory_deducted',
      'stock_update',
      'alert',
      'drift_alert',
      'forecast_drift',
      'insight_generated',
      'workflow_update',
      'escalation_raised',
      'system_health',
      'heartbeat',
    ],
    onMessage,
    onConnect: useCallback(() => store.setConnectionStatus('connected'), [store]),
    onDisconnect: useCallback(() => store.setConnectionStatus('disconnected'), [store]),
    onError: useCallback(() => store.setConnectionStatus('error'), [store]),
    enabled: true,
  });

  // Sync connection status and retry count to store
  useEffect(() => {
    store.setConnectionStatus(stream.status as any);
    store.setRetryCount(stream.retryCount);
  }, [stream.status, stream.retryCount]);

  return {
    ...stream,
    lastHeartbeat: store.connection.lastHeartbeat,
  };
}
