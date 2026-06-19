import { useEffect, useRef, useState, useCallback } from 'react';

export type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'error';
export type TransportType = 'sse' | 'websocket';

export interface RealtimeStreamOptions<T> {
  endpoint: string;
  transport?: TransportType;
  eventTypes?: string[];
  onMessage?: (event: string, payload: T) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event | Error) => void;
  enabled?: boolean;
  maxRetries?: number;
  heartbeatIntervalMs?: number;
  staleTimeoutMs?: number;
}

export interface RealtimeStreamState<T> {
  status: ConnectionStatus;
  lastEvent: { type: string; payload: T; timestamp: number } | null;
  retryCount: number;
  error: string | null;
}

const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

function getBackoffDelay(attempt: number): number {
  const delay = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS);
  const jitter = delay * 0.2 * Math.random();
  return delay + jitter;
}

import { config as appConfig } from '../config';

export function useRealtimeStream<T = unknown>(options: RealtimeStreamOptions<T>) {
  const {
    endpoint,
    transport = 'sse',
    eventTypes = [],
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    enabled = true,
    maxRetries = 10,
    heartbeatIntervalMs = 30000,
    staleTimeoutMs = 60000,
  } = options;

  const [state, setState] = useState<RealtimeStreamState<T>>({
    status: 'disconnected',
    lastEvent: null,
    retryCount: 0,
    error: null,
  });

  const sourceRef = useRef<EventSource | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartbeatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const mountedRef = useRef(true);

  const onMessageRef = useRef(onMessage);
  const onConnectRef = useRef(onConnect);
  const onDisconnectRef = useRef(onDisconnect);
  const onErrorRef = useRef(onError);
  onMessageRef.current = onMessage;
  onConnectRef.current = onConnect;
  onDisconnectRef.current = onDisconnect;
  onErrorRef.current = onError;

  const safeSetState = useCallback((update: Partial<RealtimeStreamState<T>>) => {
    if (mountedRef.current) {
      setState((prev) => ({ ...prev, ...update }));
    }
  }, []);

  const handlePayload = useCallback((eventType: string, raw: string) => {
    try {
      const payload = JSON.parse(raw) as T;
      lastActivityRef.current = Date.now();
      safeSetState({ lastEvent: { type: eventType, payload, timestamp: Date.now() } });
      onMessageRef.current?.(eventType, payload);
    } catch (err) {
      console.error(`[RealtimeStream] Parse error for ${eventType}:`, err);
    }
  }, [safeSetState]);

  const cleanup = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    if (heartbeatTimerRef.current) {
      clearTimeout(heartbeatTimerRef.current);
      heartbeatTimerRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.close();
      sourceRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const scheduleRetry = useCallback(() => {
    if (retryCountRef.current >= maxRetries) {
      safeSetState({ status: 'error', error: `Max retries (${maxRetries}) exceeded` });
      onErrorRef.current?.(new Error('Max retries exceeded'));
      return;
    }
    const delay = getBackoffDelay(retryCountRef.current);
    retryCountRef.current += 1;
    safeSetState({ status: 'reconnecting', retryCount: retryCountRef.current });
    retryTimerRef.current = setTimeout(() => {
      if (mountedRef.current) connect();
    }, delay);
  }, [maxRetries, safeSetState]);

  const startHeartbeatMonitor = useCallback(() => {
    if (heartbeatTimerRef.current) clearTimeout(heartbeatTimerRef.current);
    heartbeatTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      if (elapsed > staleTimeoutMs) {
        console.warn('[RealtimeStream] Stale connection detected, reconnecting...');
        cleanup();
        scheduleRetry();
      }
    }, heartbeatIntervalMs) as unknown as ReturnType<typeof setTimeout>;
  }, [staleTimeoutMs, heartbeatIntervalMs, cleanup, scheduleRetry]);

  const connectSSE = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';
    const correlationId = typeof window !== 'undefined' ? localStorage.getItem('correlation_id') || Math.random().toString(36).substring(7) : '';
    
    const baseUrl = endpoint.startsWith('/api/') ? '' : (process.env.NEXT_PUBLIC_API_URL || '/api/v1');
    const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${token}&correlationId=${correlationId}`;

    console.log(`[RealtimeStream] Connecting to SSE: ${endpoint}`);
    safeSetState({ status: 'connecting', error: null });
    
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onopen = () => {
      console.log(`[RealtimeStream] SSE connected: ${endpoint}`);
      retryCountRef.current = 0;
      lastActivityRef.current = Date.now();
      safeSetState({ status: 'connected', retryCount: 0, error: null });
      onConnectRef.current?.();
      startHeartbeatMonitor();
    };

    source.onerror = (e) => {
      console.error(`[RealtimeStream] SSE error on ${endpoint}:`, e);
      onErrorRef.current?.(e);
      source.close();
      sourceRef.current = null;
      onDisconnectRef.current?.();
      scheduleRetry();
    };

    // Default message handler
    source.onmessage = (e) => {
      handlePayload('message', e.data);
    };

    // Named event handlers
    eventTypes.forEach((type) => {
      source.addEventListener(type, ((e: MessageEvent) => {
        handlePayload(type, e.data);
      }) as EventListener);
    });
  }, [endpoint, eventTypes, handlePayload, safeSetState, scheduleRetry, startHeartbeatMonitor]);

  const connectWebSocket = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') || '' : '';
    const baseUrl = appConfig.websocket.baseWsUrl;
    const url = `${baseUrl}${endpoint}${endpoint.includes('?') ? '&' : '?'}token=${token}`;

    safeSetState({ status: 'connecting', error: null });
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCountRef.current = 0;
      lastActivityRef.current = Date.now();
      safeSetState({ status: 'connected', retryCount: 0, error: null });
      onConnectRef.current?.();
      startHeartbeatMonitor();
    };

    ws.onmessage = (e) => {
      try {
        const envelope = JSON.parse(e.data) as { event?: string; type?: string; payload?: unknown; data?: unknown };
        const eventType = envelope.event || envelope.type || 'message';
        const payload = envelope.payload || envelope.data || envelope;
        lastActivityRef.current = Date.now();
        safeSetState({ lastEvent: { type: eventType, payload: payload as T, timestamp: Date.now() } });
        onMessageRef.current?.(eventType, payload as T);
      } catch (err) {
        console.error('[RealtimeStream] WS parse error:', err);
      }
    };

    ws.onerror = (e) => {
      console.error('[RealtimeStream] WS error:', e);
      onErrorRef.current?.(e);
    };

    ws.onclose = () => {
      wsRef.current = null;
      onDisconnectRef.current?.();
      if (mountedRef.current && enabled) {
        scheduleRetry();
      }
    };
  }, [endpoint, enabled, safeSetState, scheduleRetry, startHeartbeatMonitor]);

  const connect = useCallback(() => {
    cleanup();
    if (typeof window === 'undefined') return;
    if (transport === 'websocket') {
      connectWebSocket();
    } else {
      connectSSE();
    }
  }, [transport, cleanup, connectSSE, connectWebSocket]);

  const disconnect = useCallback(() => {
    cleanup();
    safeSetState({ status: 'disconnected', error: null });
    onDisconnectRef.current?.();
  }, [cleanup, safeSetState]);

  useEffect(() => {
    mountedRef.current = true;
    if (enabled) {
      connect();
    } else {
      disconnect();
    }
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [enabled, endpoint, transport]);

  return {
    ...state,
    connect,
    disconnect,
  };
}
