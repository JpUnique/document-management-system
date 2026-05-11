export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadDate: string;
  lastModified: string;
  tags: string[];
  description: string;
  status: 'processing' | 'completed' | 'error' | 'pending';
  url: string;
  thumbnailUrl?: string;
  permissions: {
    viewUsers: string[];
    editUsers: string[];
  };
  starred: boolean;
  folder: string;
  pages?: DocumentPage[];
  downloadUrl?: string;
  electronAppCompatible?: boolean;
  accessibilityFeatures?: {
    searchable: boolean;
    textExtraction: boolean;
    contentPreview: boolean;
    annotationSupport: boolean;
    electronAppCompatible: boolean;
    metadataExtraction: boolean;
  };
  comments: Comment[];
  content?: string;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdBy: string;
  createdAt: string;
  documents: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  documentId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface DocumentPage {
  id: string;
  documentId: string;
  pageNumber: number;
  content: string;
  textContent?: string; // Extracted text for search
  thumbnailUrl?: string;
  indexedKeywords?: string[]; // Keywords extracted during indexing
}

export interface Notification {
  id: string;
  userId: string;
  type: 'share' | 'comment' | 'update' | 'system';
  content: string;
  documentId?: string;
  read: boolean;
  createdAt: string;
}

export interface SearchFilters {
  query: string;
  type?: string[];
  tags?: string[];
  dateRange?: {
    from: string;
    to: string;
  };
  folder?: string;
  uploadedBy?: string;
}