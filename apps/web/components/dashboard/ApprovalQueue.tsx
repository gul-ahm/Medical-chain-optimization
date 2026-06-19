"use client";

import React from 'react';
import { WithPermission } from '@/lib/auth/WithPermission';

export function ApprovalQueue() {
  // Mock data for the architectural scaffold
  const pendingRequests = [
    { id: "req-SKU-99-500", action: "TRANSFER_EXECUTION", qty: 500, warehouse: "WH-CENTRAL" }
  ];

  const handleDecision = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      // Stub: Fetch call to POST /api/v1/approvals/{id}/decide with JWT in Auth header
      console.log(`Sending ${decision} for ${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <WithPermission 
      requiredRole="operations_admin" 
      fallback={<div className="p-4 bg-slate-100 text-slate-500 rounded-md">You do not have permission to view the Governance Approval Queue.</div>}
    >
      <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Operations Approval Queue</h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No pending approvals.</p>
        ) : (
          <div className="space-y-4">
            {pendingRequests.map(req => (
              <div key={req.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800 rounded-md">
                <div>
                  <p className="font-semibold">{req.action}</p>
                  <p className="text-sm text-slate-500">Transfer {req.qty} units from {req.warehouse}</p>
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => handleDecision(req.id, 'APPROVED')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                  <button onClick={() => handleDecision(req.id, 'REJECTED')} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </WithPermission>
  );
}
