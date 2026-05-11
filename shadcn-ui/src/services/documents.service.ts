import { api, API_BASE_URL, tokenStorage } from './api';

export interface BackendDocument {
  id: string;
  title: string;
  description?: string | null;
  file_name: string;
  file_type: string;
  file_size: number;
  file_path: string;
  folder_id?: string | null;
  folder_name?: string | null;
  owner_id: string;
  owner_name?: string | null;
  department?: string | null;
  status: 'draft' | 'published' | 'archived';
  is_starred: boolean;
  version: number;
  last_accessed?: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentFilters {
  folder_id?: string;
  department?: string;
  status?: string;
  starred?: boolean;
  owner_id?: string;
  search?: string;
}

function buildQuery(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`).join('&');
}

export const documentsService = {
  async list(filters?: DocumentFilters): Promise<BackendDocument[]> {
    const query: Record<string, string | undefined> = {
      folder_id: filters?.folder_id,
      department: filters?.department,
      status: filters?.status,
      owner_id: filters?.owner_id,
      search: filters?.search,
      starred: filters?.starred ? 'true' : undefined,
    };
    const data = await api.get<{ documents: BackendDocument[] }>(`/documents${buildQuery(query)}`);
    return data.documents;
  },

  async get(id: string): Promise<BackendDocument> {
    const data = await api.get<{ document: BackendDocument }>(`/documents/${id}`);
    return data.document;
  },

  async upload(file: File, meta: {
    title?: string;
    description?: string;
    folder_id?: string;
    department?: string;
    status?: string;
  }): Promise<BackendDocument> {
    const formData = new FormData();
    formData.append('file', file);
    if (meta.title) formData.append('title', meta.title);
    if (meta.description) formData.append('description', meta.description);
    if (meta.folder_id) formData.append('folder_id', meta.folder_id);
    if (meta.department) formData.append('department', meta.department);
    if (meta.status) formData.append('status', meta.status);

    const data = await api.upload<{ document: BackendDocument }>('/documents', formData);
    return data.document;
  },

  async update(id: string, payload: Partial<BackendDocument>): Promise<BackendDocument> {
    const data = await api.patch<{ document: BackendDocument }>(`/documents/${id}`, payload);
    return data.document;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },

  async toggleStar(id: string): Promise<boolean> {
    const data = await api.post<{ is_starred: boolean }>(`/documents/${id}/star`);
    return data.is_starred;
  },

  getDownloadUrl(id: string): string {
    return `${API_BASE_URL}/documents/${id}/download`;
  },

  async download(id: string, fileName: string): Promise<void> {
    const token = tokenStorage.getAccessToken();
    const res = await fetch(this.getDownloadUrl(id), {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
};