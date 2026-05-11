import { api, API_BASE_URL } from './api';

export interface BackendShare {
  id: string;
  document_id: string;
  share_token: string;
  shared_by?: string | null;
  permission: 'view' | 'edit' | 'download';
  password_hash?: string | null;
  expires_at?: string | null;
  access_count: number;
  created_at: string;
}

export const sharesService = {
  async create(payload: {
    document_id: string;
    permission?: 'view' | 'edit' | 'download';
    password?: string;
    expires_at?: string | null;
  }): Promise<BackendShare> {
    const data = await api.post<{ share: BackendShare }>('/shares', payload);
    return data.share;
  },

  async list(documentId?: string): Promise<BackendShare[]> {
    const query = documentId ? `?document_id=${encodeURIComponent(documentId)}` : '';
    const data = await api.get<{ shares: BackendShare[] }>(`/shares${query}`);
    return data.shares;
  },

  async revoke(id: string): Promise<void> {
    await api.delete(`/shares/${id}`);
  },

  buildShareUrl(token: string): string {
    // Frontend can build a user-facing URL that opens a public-share page
    return `${window.location.origin}/share/${token}`;
  },

  getPublicApiUrl(token: string): string {
    return `${API_BASE_URL}/shares/public/${token}`;
  },
};