import React from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full z-50 bg-rose-500/90 text-white px-4 py-2 flex items-center justify-center gap-3 backdrop-blur-md shadow-lg border-b border-rose-600">
      <WifiOff className="w-5 h-5 animate-pulse" />
      <span className="text-sm font-semibold tracking-wide">
        CRITICAL: LIVE TELEMETRY DISCONNECTED. DISPLAYING DEGRADED/STALE STATE.
      </span>
      <AlertTriangle className="w-4 h-4 ml-2 opacity-70" />
    </div>
  );
};
