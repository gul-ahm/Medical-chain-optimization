/**
 * Enterprise RBAC Authorization Layer
 * Standardizes roles, permissions, and hierarchy across the platform.
 */

export enum UserRole {
  ADMIN = 'ADMIN',
  EXECUTIVE = 'EXECUTIVE',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  FORECAST_ANALYST = 'FORECAST_ANALYST',
  OPERATIONS_MANAGER = 'OPERATIONS_MANAGER',
  GOVERNANCE_OFFICER = 'GOVERNANCE_OFFICER',
  VIEWER = 'VIEWER',
}

export type Permission =
  | 'dashboard:executive:view'
  | 'dashboard:inventory:view'
  | 'dashboard:inventory:manage'
  | 'dashboard:forecast:view'
  | 'dashboard:forecast:manage'
  | 'dashboard:optimization:view'
  | 'dashboard:optimization:manage'
  | 'dashboard:orchestration:view'
  | 'dashboard:orchestration:manage'
  | 'realtime:stream:view'
  | 'alert:manage'
  | 'governance:approve'
  | 'operational:override'
  | 'export:data';

/**
 * Role to Permission Mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    'dashboard:executive:view',
    'dashboard:inventory:view',
    'dashboard:inventory:manage',
    'dashboard:forecast:view',
    'dashboard:forecast:manage',
    'dashboard:optimization:view',
    'dashboard:optimization:manage',
    'dashboard:orchestration:view',
    'dashboard:orchestration:manage',
    'realtime:stream:view',
    'alert:manage',
    'governance:approve',
    'operational:override',
    'export:data',
  ],
  [UserRole.EXECUTIVE]: [
    'dashboard:executive:view',
    'dashboard:inventory:view',
    'dashboard:forecast:view',
    'dashboard:optimization:view',
    'dashboard:orchestration:view',
    'realtime:stream:view',
    'export:data',
  ],
  [UserRole.INVENTORY_MANAGER]: [
    'dashboard:inventory:view',
    'dashboard:inventory:manage',
    'dashboard:optimization:view',
    'realtime:stream:view',
    'alert:manage',
  ],
  [UserRole.FORECAST_ANALYST]: [
    'dashboard:forecast:view',
    'dashboard:forecast:manage',
    'realtime:stream:view',
  ],
  [UserRole.OPERATIONS_MANAGER]: [
    'dashboard:inventory:view',
    'dashboard:inventory:manage',
    'dashboard:optimization:view',
    'dashboard:optimization:manage',
    'dashboard:orchestration:view',
    'realtime:stream:view',
    'alert:manage',
    'operational:override',
  ],
  [UserRole.GOVERNANCE_OFFICER]: [
    'dashboard:executive:view',
    'dashboard:orchestration:view',
    'dashboard:orchestration:manage',
    'realtime:stream:view',
    'governance:approve',
  ],
  [UserRole.VIEWER]: [
    'dashboard:executive:view',
    'dashboard:inventory:view',
    'dashboard:forecast:view',
    'dashboard:optimization:view',
    'dashboard:orchestration:view',
    'realtime:stream:view',
  ],
};

/**
 * Role Hierarchy Definition
 * Lower values indicate higher priority/access.
 */
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 0,
  [UserRole.EXECUTIVE]: 1,
  [UserRole.OPERATIONS_MANAGER]: 2,
  [UserRole.INVENTORY_MANAGER]: 3,
  [UserRole.GOVERNANCE_OFFICER]: 3,
  [UserRole.FORECAST_ANALYST]: 4,
  [UserRole.VIEWER]: 5,
};

/**
 * Authorization Helpers
 */

export function hasPermission(role: UserRole, permission: Permission): boolean {
  // Admin bypass
  if (role === UserRole.ADMIN) return true;
  
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Checks if a role is equal to or higher than the target role in the hierarchy.
 */
export function isAtLeastRole(currentRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[currentRole] <= ROLE_HIERARCHY[targetRole];
}

/**
 * Route Authorization Map
 * Maps dashboard routes to required viewing permissions.
 */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  '/dashboard/executive': 'dashboard:executive:view',
  '/dashboard/inventory': 'dashboard:inventory:view',
  '/dashboard/forecasting': 'dashboard:forecast:view',
  '/dashboard/optimization': 'dashboard:optimization:view',
  '/dashboard/orchestration': 'dashboard:orchestration:view',
};

export function canAccessRoute(role: UserRole, route: string): boolean {
  const requiredPermission = ROUTE_PERMISSIONS[route];
  if (!requiredPermission) return true; // Default to allow if not explicitly protected
  return hasPermission(role, requiredPermission);
}
