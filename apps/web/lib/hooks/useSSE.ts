import { useEffect, useRef, useCallback } from 'react';
import { useDashboardStore } from '../store/dashboardStore';

const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000; // 1 second

export function useSSE(url: string) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  const setConnectionStatus = useDashboardStore((s) => s.setConnectionStatus);
  const setRetryCount = useDashboardStore((s) => s.setRetryCount);
  const updateHeartbeat = useDashboardStore((s) => s.updateHeartbeat);
  const addActivity = useDashboardStore((s) => s.addActivity);

  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus('connecting');
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      console.log(`[SSE] Connected to ${url}`);
      setConnectionStatus('connected');
      retryCountRef.current = 0;
      setRetryCount(0);
    };

    es.addEventListener('heartbeat', (e) => {
      console.debug('[SSE] Heartbeat received', e.data);
      updateHeartbeat();
    });

    es.addEventListener('InventoryDeducted', (e) => {
      try {
        const payload = JSON.parse(e.data);
        console.log('[SSE] InventoryDeducted received', payload);
        
        // Push strictly to Zustand
        addActivity('inventory', {
          id: payload.metadata?.event_id || Math.random().toString(),
          action: 'DEDUCTION',
          entity: payload.payload?.sku || 'Unknown',
          agent: 'System',
          timestamp: new Date().toISOString(),
          type: 'inventory_mutation'
        });
      } catch (err) {
        console.error('[SSE] Failed to parse event', err);
      }
    });

    es.onerror = (err) => {
      console.error(`[SSE] Connection error on ${url}`, err);
      es.close();
      setConnectionStatus('reconnecting');

      if (retryCountRef.current < MAX_RETRIES) {
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current);
        retryCountRef.current += 1;
        setRetryCount(retryCountRef.current);
        
        console.log(`[SSE] Retrying in ${delay}ms (Attempt ${retryCountRef.current})`);
        retryTimeoutRef.current = setTimeout(connect, delay);
      } else {
        setConnectionStatus('error');
        console.error('[SSE] Max retries exhausted');
      }
    };
  }, [url, setConnectionStatus, setRetryCount, updateHeartbeat, addActivity]);

  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      setConnectionStatus('disconnected');
    };
  }, [connect, setConnectionStatus]);
}
