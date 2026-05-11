import { api, API_BASE_URL, tokenStorage } from './api';

export interface DocumentVersion {
  id: string;
  document_id: string;
  version: number;
  file_path: string;
  file_size: number;
  uploaded_by: string | null;
  uploaded_by_name: string | null;
  change_note: string | null;
  created_at: string;
}

export const versionsService = {
  async list(documentId: string): Promise<DocumentVersion[]> {
    const data = await api.get<{ versions: DocumentVersion[] }>(`/documents/${documentId}/versions`);
    return data.versions;
  },
  async upload(documentId: string, file: File, changeNote?: string): Promise<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);
    if (changeNote) formData.append('change_note', changeNote);
    const data = await api.upload<{ version: DocumentVersion }>(`/documents/${documentId}/versions`, formData);
    return data.version;
  },
  async download(documentId: string, versionId: string, fileName: string): Promise<void> {
    const token = tokenStorage.getAccessToken();
    const res = await fetch(`${API_BASE_URL}/documents/${documentId}/versions/${versionId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
  },
};