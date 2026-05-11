import React, { createContext, useContext, useState, useCallback } from 'react';
import { DocumentShare } from '@/types/share';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface ShareContextType {
  shares: DocumentShare[];
  createShare: (documentId: string, documentName: string, shareType: 'public' | 'private', permission: 'view' | 'edit', sharedWith?: string, expiresInDays?: number) => Promise<DocumentShare>;
  revokeShare: (shareId: string) => Promise<void>;
  getDocumentShares: (documentId: string) => DocumentShare[];
  getShareByLink: (shareLink: string) => DocumentShare | undefined;
  updateSharePermission: (shareId: string, permission: 'view' | 'edit') => Promise<void>;
  toggleShareStatus: (shareId: string) => Promise<void>;
}

const ShareContext = createContext<ShareContextType | undefined>(undefined);

export const ShareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [shares, setShares] = useState<DocumentShare[]>(() => {
    const stored = localStorage.getItem('docmanager_shares');
    return stored ? JSON.parse(stored) : [];
  });

  const saveShares = useCallback((updatedShares: DocumentShare[]) => {
    setShares(updatedShares);
    localStorage.setItem('docmanager_shares', JSON.stringify(updatedShares));
  }, []);

  const generateShareLink = useCallback(() => {
    const randomId = Math.random().toString(36).substring(2, 15);
    return `${window.location.origin}/shared/${randomId}`;
  }, []);

  const createShare = useCallback(async (
    documentId: string,
    documentName: string,
    shareType: 'public' | 'private',
    permission: 'view' | 'edit',
    sharedWith?: string,
    expiresInDays?: number
  ): Promise<DocumentShare> => {
    if (!currentUser) {
      throw new Error('Must be logged in to share documents');
    }

    const newShare: DocumentShare = {
      id: `share-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      documentId,
      documentName,
      sharedBy: currentUser.email,
      sharedWith,
      shareType,
      permission,
      shareLink: generateShareLink(),
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined,
      createdAt: new Date(),
      accessCount: 0,
      isActive: true,
    };

    const updatedShares = [...shares, newShare];
    saveShares(updatedShares);
    
    toast.success('Share link created successfully!');
    return newShare;
  }, [currentUser, shares, saveShares, generateShareLink]);

  const revokeShare = useCallback(async (shareId: string) => {
    const updatedShares = shares.filter(share => share.id !== shareId);
    saveShares(updatedShares);
    toast.success('Share link revoked');
  }, [shares, saveShares]);

  const getDocumentShares = useCallback((documentId: string) => {
    return shares.filter(share => share.documentId === documentId && share.isActive);
  }, [shares]);

  const getShareByLink = useCallback((shareLink: string) => {
    const share = shares.find(s => s.shareLink === shareLink && s.isActive);
    
    if (share) {
      // Check if expired
      if (share.expiresAt && new Date(share.expiresAt) < new Date()) {
        return undefined;
      }
      
      // Increment access count
      const updatedShares = shares.map(s => 
        s.id === share.id ? { ...s, accessCount: s.accessCount + 1 } : s
      );
      saveShares(updatedShares);
    }
    
    return share;
  }, [shares, saveShares]);

  const updateSharePermission = useCallback(async (shareId: string, permission: 'view' | 'edit') => {
    const updatedShares = shares.map(share =>
      share.id === shareId ? { ...share, permission } : share
    );
    saveShares(updatedShares);
    toast.success('Share permission updated');
  }, [shares, saveShares]);

  const toggleShareStatus = useCallback(async (shareId: string) => {
    const updatedShares = shares.map(share =>
      share.id === shareId ? { ...share, isActive: !share.isActive } : share
    );
    saveShares(updatedShares);
    toast.success('Share status updated');
  }, [shares, saveShares]);

  return (
    <ShareContext.Provider
      value={{
        shares,
        createShare,
        revokeShare,
        getDocumentShares,
        getShareByLink,
        updateSharePermission,
        toggleShareStatus,
      }}
    >
      {children}
    </ShareContext.Provider>
  );
};

export const useShare = () => {
  const context = useContext(ShareContext);
  if (!context) {
    throw new Error('useShare must be used within ShareProvider');
  }
  return context;
};