import { api } from './api';

export const bulkService = {
  async deleteDocuments(ids: string[]): Promise<number> {
    const res = await api.post<{ deleted: number }>('/bulk/documents/delete', { ids });
    return res.deleted;
  },
  async archiveDocuments(ids: string[]): Promise<number> {
    const res = await api.post<{ archived: number }>('/bulk/documents/archive', { ids });
    return res.archived;
  },
  async moveDocuments(ids: string[], folderId: string | null): Promise<number> {
    const res = await api.post<{ moved: number }>('/bulk/documents/move', { ids, folder_id: folderId });
    return res.moved;
  },
  async updateDocuments(ids: string[], payload: { status?: string; department?: string | null }): Promise<number> {
    const res = await api.post<{ updated: number }>('/bulk/documents/update', { ids, ...payload });
    return res.updated;
  },
};