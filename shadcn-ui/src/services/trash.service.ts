import { api } from './api';
import type { BackendDocument } from './documents.service';

export const trashService = {
  async list(): Promise<BackendDocument[]> {
    const data = await api.get<{ documents: BackendDocument[] }>('/trash');
    return data.documents;
  },
  async restore(id: string): Promise<BackendDocument> {
    const data = await api.post<{ document: BackendDocument }>(`/trash/${id}/restore`);
    return data.document;
  },
  async purge(id: string): Promise<void> {
    await api.delete(`/trash/${id}`);
  },
  async empty(): Promise<{ purged: number }> {
    return api.delete<{ purged: number }>('/trash');
  },
};