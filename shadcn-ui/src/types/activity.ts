export interface Activity {
  id: string;
  type: 'upload' | 'edit' | 'delete' | 'share' | 'download' | 'comment' | 'view';
  documentId: string;
  documentName: string;
  userId: string;
  userName: string;
  timestamp: string;
  details?: string;
}

export interface ActivityStats {
  date: string;
  uploads: number;
  edits: number;
  views: number;
  shares: number;
  total: number;
}