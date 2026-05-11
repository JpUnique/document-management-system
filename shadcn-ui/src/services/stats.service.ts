import { api } from './api';

export interface DashboardStats {
  users: { total: number; active: number };
  documents: {
    total: number;
    starred: number;
    published: number;
    draft: number;
    archived: number;
  };
  folders: { total: number };
  storage: { total_bytes: number; total_mb: number };
  recent_documents: Array<{
    id: string;
    title: string;
    file_type: string;
    updated_at: string;
    owner_name: string | null;
  }>;
  by_department: Array<{ department: string; count: number }>;
  by_status: Array<{ status: string; count: number }>;
  by_type: Array<{ category: string; count: number }>;
}

export interface ActivityPoint {
  date: string;
  count: number;
  document_actions: number;
  user_actions: number;
}

export const statsService = {
  async dashboard(): Promise<DashboardStats> {
    return api.get<DashboardStats>('/stats/dashboard');
  },
  async activity(): Promise<ActivityPoint[]> {
    const data = await api.get<{ activity: ActivityPoint[] }>('/stats/activity');
    return data.activity;
  },
};