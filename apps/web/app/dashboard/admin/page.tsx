"use client";

import React, { useState } from 'react';
import { Server, ShieldAlert, CreditCard, RefreshCw, Archive, Copy, Play } from 'lucide-react';
import { config } from '@/lib/config';

export default function SaasAdminPage() {
  const [tenantId, setTenantId] = useState('TENANT-001');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const executeAction = async (endpoint: string, method: string = 'POST') => {
    setIsLoading(true);
    try {
      const res = await fetch(`${config.api.orchestrationUrl}${endpoint}`, { method });
      const data = await res.json();
      setResult({ endpoint, status: res.status, data });
    } catch (e) {
      console.error(e);
      setResult({ endpoint, error: String(e) });
    }
    setIsLoading(false);
  };

  const executeAiAction = async (endpoint: string, method: string = 'POST') => {
    setIsLoading(true);
    try {
      const res = await fetch(`${config.api.aiUrl}${endpoint}`, { method });
      const data = await res.json();
      setResult({ endpoint, status: res.status, data });
    } catch (e) {
      console.error(e);
      setResult({ endpoint, error: String(e) });
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <Server className="w-8 h-8 text-amber-500" />
          SaaS Admin Console
        </h1>
        <p className="text-slate-400 mt-2">Manage tenants, backups, failovers, and incident billing.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tenant Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Archive className="w-5 h-5 text-sky-500" />
            Tenant Operations
          </h2>
          <div className="space-y-3">
            <button onClick={() => executeAction('/saas/tenant/backup')} disabled={isLoading} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded border border-slate-700 transition-colors">
              Trigger Global Backup <Archive className="w-4 h-4" />
            </button>
            <button onClick={() => executeAction('/saas/tenant/clone')} disabled={isLoading} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded border border-slate-700 transition-colors">
              Clone Active Tenant <Copy className="w-4 h-4" />
            </button>
            <button onClick={() => executeAction('/saas/release/freeze')} disabled={isLoading} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-rose-300 py-2 px-4 rounded border border-rose-900/50 transition-colors">
              Enact Code Freeze <ShieldAlert className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Disaster & Failover */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            Disaster Recovery
          </h2>
          <div className="space-y-3">
            <button onClick={() => executeAction('/saas/disaster/failover')} disabled={isLoading} className="w-full flex items-center justify-between bg-rose-900/40 hover:bg-rose-900/60 text-rose-200 py-2 px-4 rounded border border-rose-800 transition-colors">
              Initiate Failover <Play className="w-4 h-4" />
            </button>
            <button onClick={() => executeAction('/saas/incidents/page', 'GET')} disabled={isLoading} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded border border-slate-700 transition-colors">
              Page Incident Managers <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Governance & Billing */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            Governance & Billing
          </h2>
          <div className="space-y-3">
            <button onClick={() => executeAction('/saas/rbac/audit', 'GET')} disabled={isLoading} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded border border-slate-700 transition-colors">
              Audit RBAC Roles <ShieldAlert className="w-4 h-4" />
            </button>
            <button onClick={() => executeAction('/saas/billing/meter', 'GET')} disabled={isLoading} className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 px-4 rounded border border-slate-700 transition-colors">
              Meter Cloud Billing <CreditCard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Output Console */}
        <div className="lg:col-span-3 bg-slate-950 border border-slate-800 rounded-xl p-4">
          <h3 className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wide">Execution Output Log</h3>
          <div className="bg-black/50 rounded p-4 h-48 overflow-y-auto font-mono text-xs text-green-400">
            {isLoading && <p className="animate-pulse">Executing system command...</p>}
            {!isLoading && !result && <p className="text-slate-600">Awaiting input.</p>}
            {result && (
              <pre>{JSON.stringify(result, null, 2)}</pre>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
