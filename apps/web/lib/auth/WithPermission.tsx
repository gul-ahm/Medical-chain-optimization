"use client";

import React, { ReactNode } from 'react';
import { useAuthStore } from '@/lib/store/authStore';

// Assuming ROLE_HIERARCHY mimics the backend logic
const ROLE_HIERARCHY: Record<string, number> = {
  "viewer": 1,
  "analyst": 2,
  "planner": 3,
  "warehouse_manager": 4,
  "operations_admin": 5,
  "super_admin": 10
};

interface WithPermissionProps {
  requiredRole: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function WithPermission({ requiredRole, children, fallback = null }: WithPermissionProps) {
  // In a real implementation, useAuthStore tracks the decoded JWT
  // Stubbing with operations_admin for architectural demonstration
  const currentUserRole = "operations_admin"; // useAuthStore((s) => s.role);
  
  const userLevel = ROLE_HIERARCHY[currentUserRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 99;

  if (userLevel >= requiredLevel) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
