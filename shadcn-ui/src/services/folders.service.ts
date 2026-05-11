import { api } from './api';

export interface BackendFolder {
  id: string;
  name: string;
  parent_id?: string | null;
  owner_id?: string | null;
  owner_name?: string | null;
  department?: string | null;
  document_count?: number;
  subfolder_count?: number;
  created_at: string;
  updated_at: string;
}

export const foldersService = {
  async list(parentId?: string | null): Promise<BackendFolder[]> {
    const query = parentId === null ? '?parent_id=null' : parentId ? `?parent_id=${encodeURIComponent(parentId)}` : '';
    const data = await api.get<{ folders: BackendFolder[] }>(`/folders${query}`);
    return data.folders;
  },

  async get(id: string): Promise<BackendFolder> {
    const data = await api.get<{ folder: BackendFolder }>(`/folders/${id}`);
    return data.folder;
  },

  async create(payload: { name: string; parent_id?: string | null; department?: string | null }): Promise<BackendFolder> {
    const data = await api.post<{ folder: BackendFolder }>('/folders', payload);
    return data.folder;
  },

  async update(id: string, payload: Partial<BackendFolder>): Promise<BackendFolder> {
    const data = await api.patch<{ folder: BackendFolder }>(`/folders/${id}`, payload);
    return data.folder;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/folders/${id}`);
  },
};