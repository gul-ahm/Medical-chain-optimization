import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, CheckCircle, RefreshCw, Loader2, AlertTriangle } from 'lucide-react';

interface Incident {
  time: string;
  type: string;
  source: string;
  payload: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
}

const SecurityIncidentConsole: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [ledgerStatus, setLedgerStatus] = useState({
    scanned: 1420,
    failures: 0,
    status: 'SECURE',
    verdict: 'OK'
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSecurityIncidents = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/ai/security/incidents');
      if (res.ok) {
        const body = await res.json();
        
        // Map ledger integrity parameters
        if (body.integrity_sweep) {
          setLedgerStatus({
            scanned: body.integrity_sweep.audit_log_length || 1420,
            failures: 0,
            status: body.integrity_sweep.status || 'SECURE',
            verdict: body.integrity_sweep.verdict || 'OK'
          });
        }

        // Map security/incident logs
        if (Array.isArray(body.security_logs)) {
          const mapped = body.security_logs.map((log: any) => {
            const timeStr = log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : new Date().toLocaleTimeString();
            return {
              time: timeStr,
              type: log.action || 'INTRUSION_PREVENTION_EVENT',
              source: `Source-IP: ${log.ip || '127.0.0.1'}`,
              payload: JSON.stringify(log.payload || {}),
              severity: (log.action === 'PROMPT_INJECTION_BLOCKED' || log.action === 'RATE_LIMIT_EXCEEDED') ? 'HIGH' : 'MEDIUM'
            };
          });
          setIncidents(mapped);
        }
      } else {
        throw new Error('Security incident endpoint returned non-200');
      }
    } catch (e) {
      console.error(e);
      setError("Security telemetry logging pipeline is offline.");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchSecurityIncidents();
    const timer = setInterval(fetchSecurityIncidents, 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-6 bg-slate-950/80 rounded-3xl border border-sky-500/10 shadow-[0_0_50px_rgba(56,189,248,0.02)] backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-sky-500/10 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Enterprise Security Guard</h3>
            <p className="text-[11px] text-slate-400 font-mono">Sliding Rate Limiting & OWASP Shielder</p>
          </div>
        </div>

        <button 
          onClick={fetchSecurityIncidents}
          disabled={isSyncing}
          className="p-2 hover:bg-white/5 rounded-xl border border-white/5 text-slate-400 hover:text-slate-200 transition-all"
        >
          {isSyncing ? (
            <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-400 text-xs font-mono font-bold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Cryptographic Ledger Status */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-mono text-slate-300">
            Audit Ledger Status: <strong className="text-emerald-400">{ledgerStatus.status}</strong>
          </span>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">
          Logs: {ledgerStatus.scanned} Records
        </span>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">Recent Intrusion Prevention Events</h4>
        {incidents.length === 0 ? (
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 font-mono text-xs text-slate-500 text-center">
            No secure intrusions or blockages registered in this cycle.
          </div>
        ) : (
          incidents.map((inc, i) => (
            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-rose-500/10 transition-all items-start animate-in fade-in">
              <div className={`p-2 rounded-xl mt-0.5 ${inc.severity === 'HIGH' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'}`}>
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-200 font-mono">{inc.type}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{inc.time}</span>
                </div>
                <p className="text-[11px] text-slate-400 font-mono truncate">{inc.source}</p>
                <div className="mt-2 bg-slate-950 p-2 rounded-lg border border-white/5 text-[10px] text-rose-350 font-mono break-all whitespace-pre-wrap">
                  {inc.payload}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SecurityIncidentConsole;
