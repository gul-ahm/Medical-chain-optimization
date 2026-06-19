import { useEffect, useRef } from 'react';
import { useInventoryStore } from '@/lib/store/inventoryStore';
import { toast } from 'sonner';

export function useSSE(endpoint: string) {
  const updateStock = useInventoryStore((s) => s.updateStock);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      eventSource = new EventSource(endpoint);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Check for heartbeat
          if (data.status === "heartbeat") return;

          if (data.metadata?.event_type === "InventoryDeducted") {
            updateStock(data.payload.sku, data.payload.warehouse_id, -data.payload.deducted_quantity);
          }
        } catch (err) {
          // Silent fail or send to observability
        }
      };

      eventSource.onerror = (err) => {
        eventSource?.close();
        
        // Exponential backoff for reconnection
        toast.error('Real-time connection lost. Reconnecting...');
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [endpoint, updateStock]);
}
