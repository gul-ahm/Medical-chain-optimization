'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { decodeJwt } from 'jose';

export interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => void;
  logout: () => void;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const handleToken = useCallback((token: string) => {
    try {
      const decoded = decodeJwt(token);
      const isExpired = (decoded.exp ?? 0) * 1000 < Date.now();

      if (isExpired) {
        throw new Error('Token expired');
      }

      const userPayload: User = {
        id: (decoded.sub as string) || '',
        email: (decoded.email as string) || '',
        roles: (decoded.roles as string[]) || [],
        permissions: (decoded.permissions as string[]) || [],
      };

      setUser(userPayload);
      localStorage.setItem('access_token', token);
      document.cookie = `access_token=${token}; path=/; max-age=86400; samesite=strict`;
    } catch (e) {
      console.error('Invalid or expired token', e);
      setUser(null);
      localStorage.removeItem('access_token');
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      handleToken(token);
    } else if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
      // ── TEMP DEV BYPASS ──
      // Inject mock admin user for local development testing
      const mockAdmin: User = {
        id: 'dev-admin-id',
        email: 'admin@antigravity.local',
        roles: ['ADMIN'],
        permissions: ['*'], // In production, these are specific strings
      };
      setUser(mockAdmin);
    }
    setIsLoading(false);
  }, [handleToken]);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = useCallback((token: string) => {
    handleToken(token);
    router.push('/');
  }, [handleToken, router]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('access_token');
    document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
    router.push('/login');
  }, [router]);

  const hasRole = useCallback((role: string) => {
    return user?.roles.includes(role) ?? false;
  }, [user]);

  const hasPermission = useCallback((permission: string) => {
    if (user?.roles.includes('system_admin')) return true;
    return user?.permissions.includes(permission) ?? false;
  }, [user]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
