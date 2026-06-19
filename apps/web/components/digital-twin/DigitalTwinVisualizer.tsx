'use client';

import React, { useMemo } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Handle, 
  Position, 
  NodeProps, 
  Edge,
  Node,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Zap, Box } from "lucide-react";

// ── Custom Warehouse Node ──
const WarehouseNode = ({ data }: NodeProps) => {
  return (
    <div className="px-6 py-4 shadow-2xl rounded-2xl bg-white border-2 border-primary/10 w-64 group hover:border-primary/40 transition-all">
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-primary border-none" />
      
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
           <div className="p-2 rounded-lg bg-primary/10">
              <Box className="h-4 w-4 text-primary" />
           </div>
           <span className="text-xs font-black uppercase tracking-tighter">{data.label}</span>
        </div>
        <Badge variant={data.status === 'CRITICAL' ? 'destructive' : 'outline'} className="text-[10px] font-bold">
           {data.status}
        </Badge>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
           <span>Utilization</span>
           <span className={data.utilization > 85 ? 'text-destructive' : ''}>{data.utilization}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
           <div 
             className={`h-full transition-all duration-1000 ${data.utilization > 85 ? 'bg-destructive' : 'bg-primary'}`} 
             style={{ width: `${data.utilization}%` }} 
           />
        </div>
      </div>

      {data.recommendation && (
        <div className="mt-4 p-2 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
           <Zap className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
           <p className="text-[9px] font-medium leading-tight text-amber-700">{data.recommendation}</p>
        </div>
      )}

      {data.status === 'CRITICAL' && (
        <div className="absolute -top-3 -right-3">
           <div className="relative">
              <div className="absolute inset-0 bg-destructive rounded-full animate-ping" />
              <AlertCircle className="h-6 w-6 text-destructive relative bg-white rounded-full" />
           </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-primary border-none" />
    </div>
  );
};

const nodeTypes = { warehouse: WarehouseNode };

// ── Main Visualizer Component ──
interface DigitalTwinVisualizerProps {
  nodes: Node[];
  edges: Edge[];
}

export const DigitalTwinVisualizer: React.FC<DigitalTwinVisualizerProps> = ({ nodes, edges }) => {
  const defaultEdgeOptions = useMemo(() => ({
    style: { strokeWidth: 3, stroke: '#2563eb', opacity: 0.2 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#2563eb',
    },
    animated: true,
  }), []);

  return (
    <div className="h-full w-full bg-black/[0.02] rounded-3xl overflow-hidden border shadow-inner relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        className="bg-dot-pattern"
      >
        <Background color="#cbd5e1" gap={20} />
        <Controls className="!bg-white !shadow-2xl !border-none !rounded-xl overflow-hidden" />
      </ReactFlow>
      
      {/* ── Overlay Legend ── */}
      <div className="absolute bottom-6 left-6 p-4 rounded-2xl backdrop-blur-md bg-white/70 border shadow-xl flex gap-6 items-center">
         <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Stable Node</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-destructive" />
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">At Risk</span>
         </div>
         <div className="flex items-center gap-2 border-l pl-6">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Live Inventory Flow</span>
         </div>
      </div>
    </div>
  );
};
