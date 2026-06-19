import React from 'react';
import { History, Clock, FileSearch, HelpCircle } from 'lucide-react';

interface TimelineEvent {
  timestamp: string;
  event: string;
  impact: string;
  evidence: string;
}

interface OperationalTimelineProps {
  timeline: TimelineEvent[];
  rootCause: string;
  isLoading?: boolean;
}

const OperationalTimeline: React.FC<OperationalTimelineProps> = ({ timeline, rootCause, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900/40 rounded-xl border border-slate-800 border-dashed">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
        <div className="text-slate-400 text-sm font-medium animate-pulse">Reconstructing Operational Timeline...</div>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
        <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
        <p className="text-slate-400 text-sm">No forensic timeline data available. Run an investigation to generate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          <FileSearch className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-slate-100 uppercase text-xs tracking-widest">Root Cause Summary</h3>
        </div>
        <p className="text-sm text-slate-300 leading-relaxed italic">
          "{rootCause}"
        </p>
      </div>

      <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {timeline.map((event, idx) => (
          <div key={idx} className="relative">
            <div className="absolute -left-[28px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-500 z-10 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
            
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
              <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-emerald-400/80 bg-emerald-400/5 px-2 py-0.5 rounded border border-emerald-500/10">
                <Clock className="w-3 h-3" />
                {event.timestamp}
              </div>
              <h4 className="text-sm font-bold text-slate-100">{event.event}</h4>
            </div>
            
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/50">
              <div className="text-xs text-slate-300 mb-2 leading-relaxed">
                <span className="text-slate-500 font-bold uppercase text-[10px] mr-2">Impact:</span>
                {event.impact}
              </div>
              <div className="pt-2 border-t border-slate-800/50 flex items-center gap-2 text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                <History className="w-3 h-3" />
                Evidence Trace: {event.evidence}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OperationalTimeline;
