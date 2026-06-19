import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { CheckCircle2, Clock, AlertTriangle, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export const SagaNode = memo(({ data }: any) => {
  const status = data.status || 'pending';
  
  return (
    <div 
      style={{ width: '150px' }}
      className={cn(
        "px-3 py-1.5 rounded-lg border-2 shadow-lg transition-all overflow-hidden",
        status === 'completed' && "bg-status-positive/10 border-status-positive text-status-positive",
        status === 'running' && "bg-primary/10 border-primary text-primary animate-pulse",
        status === 'failed' && "bg-status-critical/10 border-status-critical text-status-critical",
        status === 'pending' && "bg-muted border-border text-muted-foreground"
      )}
    >
      <Handle type="target" position={Position.Left} className="w-2 h-2 !bg-border" />
      
      <div className="flex items-center gap-2">
        <div className="shrink-0">
          {status === 'completed' && <CheckCircle2 className="h-4 w-4" />}
          {status === 'running' && <Play className="h-4 w-4 fill-current" />}
          {status === 'failed' && <AlertTriangle className="h-4 w-4" />}
          {status === 'pending' && <Clock className="h-4 w-4" />}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70 truncate">{data.agent || 'System'}</span>
          <span className="text-xs font-semibold leading-tight truncate">{data.label}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-border" />
    </div>
  );
});

SagaNode.displayName = 'SagaNode';
