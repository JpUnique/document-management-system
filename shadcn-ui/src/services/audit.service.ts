import { api } from './api';

export interface BackendAuditLog {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface AuditFilters {
  user_id?: string;
  resource_type?: string;
  resource_id?: string;
  action?: string;
  limit?: number;
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}

export const auditService = {
  async list(filters?: AuditFilters): Promise<BackendAuditLog[]> {
    const data = await api.get<{ logs: BackendAuditLog[] }>(`/audit${buildQuery(filters || {})}`);
    return data.logs;
  },
};