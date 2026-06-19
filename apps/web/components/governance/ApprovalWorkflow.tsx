'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, History } from "lucide-react";

interface ApprovalCase {
  id: string;
  workflow_id: string;
  decision_type: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  details: {
    impact_value: number;
    description: string;
    risk_level: string;
  };
  created_at: string;
}

export const ApprovalWorkflow: React.FC = () => {
  const [queue, setQueue] = useState<ApprovalCase[]>([
    {
      id: "GOV-20260510-001",
      workflow_id: "WKF-772",
      decision_type: "Operational:Override",
      priority: "critical",
      details: {
        impact_value: 45000,
        description: "Emergency inventory transfer from Central Hub to Southern Region to prevent 95% stockout risk.",
        risk_level: "High - Exceeds regional budget threshold"
      },
      created_at: "2026-05-10T09:12:00Z"
    }
  ]);

  const handleAction = (id: string, action: 'approve' | 'reject' | 'escalate') => {
    // In production, this would call the governance_service API
    console.log(`Action ${action} triggered for ${id}`);
    setQueue(prev => prev.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Governance Control Center</h2>
          <p className="text-muted-foreground">Manage autonomous overrides and human-in-the-loop approvals.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" />
            Audit Trail
          </Button>
          <Button variant="outline" size="sm">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Policy Editor
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {queue.length === 0 ? (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
              <p className="text-lg font-medium">All clear</p>
              <p className="text-sm text-muted-foreground">There are no pending governance cases requiring your review.</p>
            </CardContent>
          </Card>
        ) : (
          queue.map((caseItem) => (
            <Card key={caseItem.id} className="overflow-hidden border-l-4 border-l-destructive">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {caseItem.id}
                      <Badge variant={caseItem.priority === 'critical' ? 'destructive' : 'secondary'}>
                        {caseItem.priority.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CardDescription>{caseItem.decision_type}</CardDescription>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Received: {new Date(caseItem.created_at).toLocaleTimeString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Proposal Details</p>
                    <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                      {caseItem.details.description}
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Impact Value:</span>
                      <span className="font-mono font-bold text-emerald-500">
                        ${(caseItem.details.impact_value ?? 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Risk Assessment:</span>
                      <span className="flex items-center gap-1 text-amber-500 font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        {caseItem.details.risk_level}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleAction(caseItem.id, 'reject')}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleAction(caseItem.id, 'escalate')}>
                        Escalate
                      </Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(caseItem.id, 'approve')}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve Decision
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
