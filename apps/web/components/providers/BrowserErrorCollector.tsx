'use client';

import { useEffect } from 'react';

/**
 * Enterprise Browser Error Collector
 * Monkey-patches console.error and intercepts global runtime exceptions/unhandled promise rejections,
 * streaming devtool console diagnostics in real-time to the active Python orchestrator.
 */
export function BrowserErrorCollector() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reportError = async (errorData: any) => {
      try {
        await fetch('http://localhost:8099/log-error', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
          mode: 'cors',
        });
      } catch (err) {
        // Silent catch to prevent recursive diagnostic feedback loops
      }
    };

    // 1. Intercept global runtime exceptions
    const handleError = (event: ErrorEvent) => {
      const errorData = {
        type: 'UNCAUGHT_EXCEPTION',
        message: event.message || 'Unknown runtime error',
        filename: event.filename || 'Unknown source',
        lineno: event.lineno || 0,
        colno: event.colno || 0,
        stack: event.error?.stack || 'No stack trace available',
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      reportError(errorData);
    };

    // 2. Intercept unhandled promise rejections
    const handleRejection = (event: PromiseRejectionEvent) => {
      const errorData = {
        type: 'UNHANDLED_REJECTION',
        message: event.reason?.message || String(event.reason) || 'Promise rejection',
        filename: 'PromiseBoundary',
        lineno: 0,
        colno: 0,
        stack: event.reason?.stack || 'No stack trace available',
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      reportError(errorData);
    };

    // 3. Monkey-patch console.error to capture logged console exceptions
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      originalConsoleError.apply(console, args);
      
      const message = args.map(arg => {
        if (arg instanceof Error) return arg.message;
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg); } catch(e) { return String(arg); }
        }
        return String(arg);
      }).join(' ');

      // Filter out standard development websocket/SSE connection warning noise
      if (message.includes('WebSocket') || message.includes('EventSource') || message.includes('RealtimeStream')) {
        return;
      }

      const stack = args.find(arg => arg instanceof Error)?.stack || new Error().stack || 'No stack trace';

      const errorData = {
        type: 'CONSOLE_ERROR',
        message,
        filename: 'BrowserConsole',
        lineno: 0,
        colno: 0,
        stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
      };
      reportError(errorData);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      console.error = originalConsoleError;
    };
  }, []);

  return null;
}
