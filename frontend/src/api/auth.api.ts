import { http } from './http';
import type { AuthUser } from '@/store/authStore';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthUser> => {
    const { data } = await http.post<AuthUser>('/api/v1/auth/login', { email, password });
    return data;
  },

  register: async (payload: { email: string; password: string; displayName: string; inviteToken?: string }): Promise<AuthUser> => {
    const { data } = await http.post<AuthUser>('/api/v1/auth/register', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await http.get('/api/v1/auth/logout');
  },

  me: async (): Promise<AuthUser> => {
    const { data } = await http.get<AuthUser>('/api/v1/auth/me');
    return data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await http.post('/api/v1/auth/forgot-password', { email });
  },
};
