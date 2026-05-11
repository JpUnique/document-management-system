import { api } from './api';
import type { AuthUser } from './auth.service';

export interface User extends AuthUser {
  created_at?: string;
  updated_at?: string;
}

export interface UserFilters {
  department?: string;
  role?: string;
  status?: string;
  search?: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`).join('&');
}

export const usersService = {
  async list(filters?: UserFilters): Promise<User[]> {
    const data = await api.get<{ users: User[] }>(`/users${buildQuery(filters || {})}`);
    return data.users;
  },

  async get(id: string): Promise<User> {
    const data = await api.get<{ user: User }>(`/users/${id}`);
    return data.user;
  },

  async create(payload: {
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'editor' | 'viewer';
    department?: string;
  }): Promise<User> {
    const data = await api.post<{ user: User }>('/users', payload);
    return data.user;
  },

  async update(id: string, payload: Partial<User>): Promise<User> {
    const data = await api.patch<{ user: User }>(`/users/${id}`, payload);
    return data.user;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async resetPassword(id: string, password: string): Promise<void> {
    await api.post(`/users/${id}/reset-password`, { password });
  },

  async getDepartmentStats(): Promise<{ department: string; user_count: number }[]> {
    const data = await api.get<{ departments: { department: string; user_count: number }[] }>(
      '/users/stats/departments'
    );
    return data.departments;
  },
};