"use client";

import React, { useState } from 'react';
import { Shield, Globe, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { config } from '@/lib/config';

export default function StrategicOperationsPage() {
  const [procurementSku, setProcurementSku] = useState('');
  const [procurementQty, setProcurementQty] = useState(100);
  const [procurementResult, setProcurementResult] = useState<any>(null);
  
  const [geopoliticalRegion, setGeopoliticalRegion] = useState('');
  const [disruptionResult, setDisruptionResult] = useState<any>(null);

  const [hierarchyScope, setHierarchyScope] = useState('GLOBAL');
  const [hierarchyResult, setHierarchyResult] = useState<any>(null);

  const [isLoading, setIsLoading] = useState(false);

  const handleProcurement = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${config.api.aiUrl}/strategic/procurement/negotiate?sku=${procurementSku}&qty=${procurementQty}`);
      const data = await res.json();
      setProcurementResult(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleDisruption = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${config.api.aiUrl}/strategic/disruption/geopolitical?outage=${geopoliticalRegion}`);
      const data = await res.json();
      setDisruptionResult(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const handleHierarchy = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${config.api.aiUrl}/strategic/decision/hierarchy?scope=${hierarchyScope}`);
      const data = await res.json();
      setHierarchyResult(data);
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          Strategic Operations Command
        </h1>
        <p className="text-slate-400 mt-2">Manage procurement negotiations, geopolitical disruptions, and escalation hierarchies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Procurement Negotiation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Autonomous Procurement
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Target SKU</label>
              <input 
                type="text" 
                value={procurementSku}
                onChange={e => setProcurementSku(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200"
                placeholder="e.g. MED-001"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Quantity</label>
              <input 
                type="number" 
                value={procurementQty}
                onChange={e => setProcurementQty(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200"
              />
            </div>
            <button 
              onClick={handleProcurement}
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md transition-colors"
            >
              Negotiate Contract
            </button>
            
            {procurementResult && (
              <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-300 overflow-auto max-h-32">
                {JSON.stringify(procurementResult, null, 2)}
              </div>
            )}
          </div>
        </div>

        {/* Geopolitical Disruption */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-rose-500" />
            Geopolitical Disruption Simulator
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Outage Region</label>
              <input 
                type="text" 
                value={geopoliticalRegion}
                onChange={e => setGeopoliticalRegion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200"
                placeholder="e.g. SUEZ_CANAL"
              />
            </div>
            <button 
              onClick={handleDisruption}
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-medium py-2 rounded-md transition-colors"
            >
              Analyze Impact
            </button>
            
            {disruptionResult && (
              <div className="mt-4 p-3 bg-slate-950 rounded border border-slate-800 font-mono text-xs text-slate-300 overflow-auto max-h-32">
                {JSON.stringify(disruptionResult, null, 2)}
              </div>
            )}
          </div>
        </div>

        {/* Decision Hierarchy */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-500" />
            Decision Hierarchy & Audit Lineage
          </h2>
          <div className="space-y-4 flex flex-col sm:flex-row items-end gap-4">
            <div className="flex-1 w-full">
              <label className="block text-sm text-slate-400 mb-1">Scope</label>
              <select 
                value={hierarchyScope}
                onChange={e => setHierarchyScope(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-slate-200"
              >
                <option value="GLOBAL">Global</option>
                <option value="REGIONAL">Regional</option>
                <option value="LOCAL">Local</option>
              </select>
            </div>
            <button 
              onClick={handleHierarchy}
              disabled={isLoading}
              className="bg-sky-600 hover:bg-sky-700 text-white font-medium py-2 px-6 rounded-md transition-colors w-full sm:w-auto"
            >
              Fetch Hierarchy
            </button>
          </div>
          
          {hierarchyResult && (
            <div className="mt-4 p-4 bg-slate-950 rounded border border-slate-800 font-mono text-sm text-slate-300 overflow-auto max-h-64">
              {JSON.stringify(hierarchyResult, null, 2)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
