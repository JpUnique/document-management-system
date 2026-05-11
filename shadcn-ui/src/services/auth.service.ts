import { api, tokenStorage } from './api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  department?: string | null;
  avatar_url?: string | null;
  status?: string;
  last_login?: string | null;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthUser> {
    const data = await api.post<LoginResponse>('/auth/login', { email, password }, { skipAuth: true });
    tokenStorage.setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },

  async register(payload: {
    email: string;
    password: string;
    name: string;
    role?: 'admin' | 'editor' | 'viewer';
    department?: string;
  }): Promise<AuthUser> {
    const data = await api.post<{ user: AuthUser }>('/auth/register', payload, { skipAuth: true });
    return data.user;
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore errors; always clear tokens
    }
    tokenStorage.clear();
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const token = tokenStorage.getAccessToken();
    if (!token) return null;
    try {
      const data = await api.get<{ user: AuthUser }>('/auth/me');
      return data.user;
    } catch {
      tokenStorage.clear();
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.getAccessToken();
  },
};