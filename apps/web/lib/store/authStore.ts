import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  role: string;
  user: any | null;
  setAuth: (token: string, role: string, user: any) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      role: 'viewer',
      user: null,
      setAuth: (token, role, user) => set({ token, role, user }),
      logout: () => set({ token: null, role: 'viewer', user: null }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
