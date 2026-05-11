import { api } from './api';

export interface BackendTag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export const tagsService = {
  async list(): Promise<BackendTag[]> {
    const data = await api.get<{ tags: BackendTag[] }>('/tags');
    return data.tags;
  },

  async create(payload: { name: string; color?: string }): Promise<BackendTag> {
    const data = await api.post<{ tag: BackendTag }>('/tags', payload);
    return data.tag;
  },

  async update(id: string, payload: { name?: string; color?: string }): Promise<BackendTag> {
    const data = await api.patch<{ tag: BackendTag }>(`/tags/${id}`, payload);
    return data.tag;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/tags/${id}`);
  },

  async attachToDocument(documentId: string, tagId: string): Promise<void> {
    await api.post(`/tags/documents/${documentId}/${tagId}`);
  },

  async detachFromDocument(documentId: string, tagId: string): Promise<void> {
    await api.delete(`/tags/documents/${documentId}/${tagId}`);
  },

  async getDocumentTags(documentId: string): Promise<BackendTag[]> {
    const data = await api.get<{ tags: BackendTag[] }>(`/tags/documents/${documentId}`);
    return data.tags;
  },
};