'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ShieldAlert, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/components/providers/AuthProvider';
import { UserRole, Permission, hasPermission, isAtLeastRole, ROUTE_PERMISSIONS } from '@/lib/auth/rbac';

// ── Types ──
export interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: Permission;
  fallback?: React.ReactNode;
}


// ── Component ──
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    if (isLoading) return;

    // ── TEMP DEV BYPASS ──
    // Allow access in development or if explicitly bypassed to enable local inspection.
    const isDevBypass = 
      process.env.NODE_ENV === 'development' || 
      process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true';

    if (isDevBypass) {
      setIsAuthorized(true);
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    let authorized = true;
    const currentPermission = requiredPermission || ROUTE_PERMISSIONS[pathname];

    if (user) {
      // Check if user has at least one role that satisfies the requirement
      if (requiredRole) {
        const hasRequiredRole = user.roles.some(role => isAtLeastRole(role as UserRole, requiredRole));
        if (!hasRequiredRole) authorized = false;
      }

      // Check permissions
      if (currentPermission) {
        const hasReqPermission = user.roles.some(role => hasPermission(role as UserRole, currentPermission as Permission));
        if (!hasReqPermission) authorized = false;
      }
    } else {
      authorized = false;
    }

    setIsAuthorized(authorized);
  }, [isAuthenticated, isLoading, user, requiredRole, requiredPermission, pathname, router]);

  // Loading state
  if (isLoading || isAuthorized === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] w-full gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium animate-pulse">
          Validating authorization...
        </p>
      </div>
    );
  }

  // Unauthorized state
  if (!isAuthorized) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-6">
        <Card className="w-full max-w-md border-status-critical/20 shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-status-critical/10">
              <ShieldAlert className="h-6 w-6 text-status-critical" aria-hidden="true" />
            </div>
            <CardTitle className="text-xl font-bold">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              You do not have the required permissions to access this module. 
              Please contact your administrator if you believe this is an error.
            </p>
            <div className="flex flex-col gap-2 p-3 rounded-lg bg-muted/50 text-[11px] text-left font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase">Required Role:</span>
                <span className="text-foreground">{requiredRole || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground uppercase">Required Permission:</span>
                <span className="text-foreground truncate ml-4">{requiredPermission || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button variant="default" className="w-full gap-2" onClick={() => router.push('/dashboard')}>
              Return to Dashboard
            </Button>
            <Button variant="ghost" className="w-full gap-2 text-muted-foreground" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" /> Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Authorized
  return <>{children}</>;
}

// ── High Order Component Pattern ──
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
