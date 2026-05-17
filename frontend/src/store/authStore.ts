import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/auth.api';

export type Role = 'admin' | 'operator' | 'service_manager' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  provider: 'local' | 'keycloak';
}

interface AuthState {
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:    (email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
  fetchMe:  () => Promise<void>;
  setUser:  (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:            null,
      isAuthenticated: false,
      isLoading:       false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const user = await authApi.login(email, password);
          set({ user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        await authApi.logout();
        set({ user: null, isAuthenticated: false });
        window.location.href = '/login';
      },

      fetchMe: async () => {
        set({ isLoading: true });
        try {
          const user = await authApi.me();
          set({ user, isAuthenticated: true });
        } catch {
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isLoading: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: 'axilog-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
