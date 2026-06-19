import { useCallback, useEffect, useRef } from 'react';
import { generateCorrelationId } from '@/lib/utils';

// ── Types ──
export interface MetricEvent {
  name: string;
  value: number;
  type: 'latency' | 'count' | 'render' | 'throughput';
  tags?: Record<string, string>;
  timestamp: string;
  correlationId: string;
}

export interface TelemetryEvent {
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, any>;
  timestamp: string;
  correlationId: string;
}

export interface ObservabilityOptions {
  dashboardName: string;
  batchIntervalMs?: number;
  staleThresholdMs?: number;
}

// ── Hook ──
export function useDashboardObservability(options: ObservabilityOptions) {
  const { dashboardName, batchIntervalMs = 5000, staleThresholdMs = 60000 } = options;
  
  const correlationIdRef = useRef(generateCorrelationId());
  const metricBufferRef = useRef<MetricEvent[]>([]);
  const telemetryBufferRef = useRef<TelemetryEvent[]>([]);
  const lastEventTimestampRef = useRef<number>(Date.now());
  const mountTimeRef = useRef<number>(performance.now());

  // ── Batch Flushing ──
  const flush = useCallback(() => {
    if (metricBufferRef.current.length === 0 && telemetryBufferRef.current.length === 0) return;

    const metrics = [...metricBufferRef.current];
    const telemetry = [...telemetryBufferRef.current];
    
    metricBufferRef.current = [];
    telemetryBufferRef.current = [];

    // In production, this would send to an observability endpoint (e.g., OpenTelemetry, Datadog)
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Observability:${dashboardName}] Flushing batch:`, { 
        metricsCount: metrics.length, 
        telemetryCount: telemetry.length,
        correlationId: correlationIdRef.current 
      });
    }
  }, [dashboardName]);

  // ── Helpers ──
  const trackMetric = useCallback((metric: Omit<MetricEvent, 'timestamp' | 'correlationId'>) => {
    metricBufferRef.current.push({
      ...metric,
      timestamp: new Date().toISOString(),
      correlationId: correlationIdRef.current,
    });
  }, []);

  const trackLog = useCallback((log: Omit<TelemetryEvent, 'timestamp' | 'correlationId'>) => {
    telemetryBufferRef.current.push({
      ...log,
      timestamp: new Date().toISOString(),
      correlationId: correlationIdRef.current,
    });
  }, []);

  const trackApiLatency = useCallback((endpoint: string, durationMs: number, status: number) => {
    trackMetric({
      name: 'api_request_latency',
      value: durationMs,
      type: 'latency',
      tags: { endpoint, status: String(status) },
    });
  }, [trackMetric]);

  const trackStreamEvent = useCallback((event: string) => {
    lastEventTimestampRef.current = Date.now();
    trackMetric({
      name: 'sse_event_received',
      value: 1,
      type: 'throughput',
      tags: { event },
    });
  }, [trackMetric]);

  const trackInteraction = useCallback((name: string, action: (...args: any[]) => void | Promise<void>) => {
    return async (...args: any[]) => {
      const start = performance.now();
      try {
        await action(...args);
        trackMetric({
          name: 'interaction_duration',
          value: performance.now() - start,
          type: 'latency',
          tags: { interaction: name, success: 'true' },
        });
      } catch (err) {
        trackMetric({
          name: 'interaction_duration',
          value: performance.now() - start,
          type: 'latency',
          tags: { interaction: name, success: 'false' },
        });
        trackLog({ level: 'error', message: `Interaction ${name} failed`, context: { error: err } });
        throw err;
      }
    };
  }, [trackMetric, trackLog]);

  // ── Lifecycle ──
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Track load timing
    const loadTime = performance.now() - mountTimeRef.current;
    trackMetric({ name: 'dashboard_load_time', value: loadTime, type: 'render' });

    // Stale stream detection interval
    const staleInterval = setInterval(() => {
      const timeSinceLastEvent = Date.now() - lastEventTimestampRef.current;
      if (timeSinceLastEvent > staleThresholdMs) {
        trackLog({ 
          level: 'warn', 
          message: 'Stream connection may be stale', 
          context: { timeSinceLastEvent, threshold: staleThresholdMs } 
        });
      }
    }, 10000);

    // Batch flush interval
    const flushInterval = setInterval(flush, batchIntervalMs);

    return () => {
      clearInterval(staleInterval);
      clearInterval(flushInterval);
      flush(); // Final flush on unmount
      
      const sessionDuration = performance.now() - mountTimeRef.current;
      trackMetric({ name: 'session_duration', value: sessionDuration, type: 'latency' });
    };
  }, [batchIntervalMs, flush, trackLog, trackMetric, staleThresholdMs]);

  return {
    correlationId: correlationIdRef.current,
    trackApiLatency,
    trackStreamEvent,
    trackInteraction,
    trackLog,
    trackMetric,
  };
}
