export interface DocumentShare {
  id: string;
  documentId: string;
  documentName: string;
  sharedBy: string;
  sharedWith?: string; // Email of recipient, undefined for public links
  shareType: 'public' | 'private';
  permission: 'view' | 'edit';
  shareLink: string;
  expiresAt?: Date;
  createdAt: Date;
  accessCount: number;
  isActive: boolean;
}

export interface ShareSettings {
  allowPublicSharing: boolean;
  allowExternalSharing: boolean;
  defaultExpiration: number; // days
  requirePassword: boolean;
}