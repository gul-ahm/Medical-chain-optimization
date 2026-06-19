import React, { useState, useEffect } from 'react';
import { Layers, Activity, Play, ShieldCheck, Database, RefreshCw, Loader2 } from 'lucide-react';

interface Snapshot {
  id: string;
  time: string;
  elements: number;
  status: string;
}

const DigitalTwinExplorer: React.FC = () => {
  const [activeSnapshot, setActiveSnapshot] = useState<string>('snap-current');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [syncedCount, setSyncedCount] = useState<number>(4);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([
    { id: 'snap-01', time: '12:00:00 (Current)', elements: 85, status: 'SYNCHRONIZED' },
    { id: 'snap-02', time: '11:45:00', elements: 85, status: 'ARCHIVED' },
    { id: 'snap-03', time: '11:30:00', elements: 84, status: 'ARCHIVED' },
    { id: 'snap-04', time: '11:15:00', elements: 84, status: 'ARCHIVED' },
  ]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/v1/ai/digital-twin/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        const newSnapId = data.snapshot_id || `snap-${Date.now().toString().slice(-4)}`;

        // Add new snapshot to the list dynamically
        const newSnap: Snapshot = {
          id: newSnapId,
          time: new Date().toLocaleTimeString(),
          elements: 85 + Math.floor(Math.random() * 5),
          status: 'SYNCHRONIZED'
        };

        setSnapshots(prev => [newSnap, ...prev.slice(0, 4)]);
        setActiveSnapshot(newSnapId);
        setSyncedCount(prev => prev + 1);
      }
    } catch (e) {
      console.error("Failed to sync digital twin snapshot", e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-950/80 rounded-3xl border border-indigo-500/10 shadow-[0_0_50px_rgba(99,102,241,0.05)] backdrop-blur-2xl">
      <div className="flex items-center justify-between mb-6 border-b border-indigo-500/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400">
            <Layers className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-sm uppercase tracking-wider">Enterprise Digital Twin</h3>
            <p className="text-[11px] text-slate-400">Continuous network state tracking & simulation sandbox</p>
          </div>
        </div>

        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all"
        >
          {isSyncing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          Force Snapshot Sync
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Snapshots List */}
        <div className="space-y-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">State Snapshots Timeline</div>
          <div className="space-y-2">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                onClick={() => setActiveSnapshot(snap.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all ${activeSnapshot === snap.id
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-200'
                  : 'bg-white/5 border-white/5 hover:border-white/10 text-slate-400'
                  }`}
              >
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono font-bold">{snap.id.toUpperCase()}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${snap.status === 'SYNCHRONIZED' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-400'
                    }`}>{snap.status}</span>
                </div>
                <div className="text-[10px] flex justify-between">
                  <span>{snap.time}</span>
                  <span>{snap.elements} active nodes</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Temporal Replay Controller */}
        <div className="bg-slate-900/40 p-4 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-200">Temporal State Replay</span>
            <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Snapshots Synced: {syncedCount}
            </span>
          </div>

          <div className="h-28 bg-slate-950 rounded-xl border border-white/5 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Visual simulation representation */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5" />
            <div className="z-10 text-center space-y-2">
              <div className="flex justify-center gap-4 text-xs font-bold">
                <div className="flex items-center gap-1"><Database className="w-4 h-4 text-indigo-400" /> WH-REG-001: 940u</div>
                <div className="flex items-center gap-1"><Activity className="w-4 h-4 text-purple-400" /> WH-REG-002: 120u</div>
              </div>
              <p className="text-[10px] text-slate-500 italic">
                {isPlaying ? 'Replaying state evolution from snap-04 to current state...' : 'Replay paused. Select snapshot to begin playbacks.'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <button
              onClick={togglePlayback}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
            >
              <Play className="w-4 h-4" /> {isPlaying ? 'Pause Playback' : 'Replay Timeline'}
            </button>
            <div className="flex-1 bg-white/5 h-1.5 rounded-full overflow-hidden relative">
              <div
                className={`h-full bg-indigo-500 rounded-full transition-all duration-1000 ${isPlaying ? 'w-full' : 'w-1/3'}`}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">00:45 / 01:20</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalTwinExplorer;

