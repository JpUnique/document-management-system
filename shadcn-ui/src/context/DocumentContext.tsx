import React, { createContext, useState, useEffect, useContext } from 'react';
import { Document, Folder, Tag, Comment, Notification, SearchFilters } from '@/types/document';
import { useAuth } from './AuthContext';
import { useActivity } from './ActivityContext';

interface DocumentContextType {
  documents: Document[];
  folders: Folder[];
  tags: Tag[];
  comments: Comment[];
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  
  // Document CRUD operations
  addDocument: (document: Omit<Document, 'id'>) => Promise<Document>;
  updateDocument: (id: string, document: Partial<Document>) => Promise<Document | null>;
  deleteDocument: (id: string) => Promise<boolean>;
  getDocument: (id: string) => Document | undefined;
  searchDocuments: (filters: SearchFilters) => Document[];
  starDocument: (id: string, starred: boolean) => Promise<void>;
  
  // Folder operations
  addFolder: (folder: Omit<Folder, 'id'>) => Promise<Folder>;
  updateFolder: (id: string, folder: Partial<Folder>) => Promise<Folder | null>;
  deleteFolder: (id: string) => Promise<boolean>;
  
  // Tag operations
  addTag: (tag: Omit<Tag, 'id'>) => Promise<Tag>;
  updateTag: (id: string, tag: Partial<Tag>) => Promise<Tag | null>;
  deleteTag: (id: string) => Promise<boolean>;
  
  // Comment operations
  addComment: (comment: Omit<Comment, 'id'>) => Promise<Comment>;
  deleteComment: (id: string) => Promise<boolean>;
  
  // Document processing
  processDocument: (id: string) => Promise<Document | null>;
  
  // Desktop integration
  openInDesktopApp: (id: string) => Promise<boolean>;
  
  // Document page operations
  getDocumentPages: (documentId: string) => DocumentPage[];
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const useDocuments = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocuments must be used within a DocumentProvider');
  }
  return context;
};

// Storage keys for localStorage
const DOCUMENTS_KEY = 'docmanager_documents';
const FOLDERS_KEY = 'docmanager_folders';
const TAGS_KEY = 'docmanager_tags';
const COMMENTS_KEY = 'docmanager_comments';
const NOTIFICATIONS_KEY = 'docmanager_notifications';

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { addActivity } = useActivity();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with demo data if empty
  useEffect(() => {
    const initializeData = () => {
      // Initialize folders if none exist
      if (!localStorage.getItem(FOLDERS_KEY)) {
        const rootFolder: Folder = {
          id: 'root',
          name: 'All Documents',
          parentId: null,
          createdBy: 'system',
          createdAt: new Date().toISOString(),
          documents: []
        };
        
        localStorage.setItem(FOLDERS_KEY, JSON.stringify([rootFolder]));
      }
      
      // Initialize tags if none exist
      if (!localStorage.getItem(TAGS_KEY)) {
        const defaultTags: Tag[] = [
          { id: 'tag-1', name: 'Important', color: '#ff5252' },
          { id: 'tag-2', name: 'Contract', color: '#2196f3' },
          { id: 'tag-3', name: 'Report', color: '#4caf50' },
          { id: 'tag-4', name: 'Archive', color: '#9e9e9e' }
        ];
        
        localStorage.setItem(TAGS_KEY, JSON.stringify(defaultTags));
      }
    };
    
    initializeData();
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true);
        
        const loadedDocuments = JSON.parse(localStorage.getItem(DOCUMENTS_KEY) || '[]');
        const loadedFolders = JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');
        const loadedTags = JSON.parse(localStorage.getItem(TAGS_KEY) || '[]');
        const loadedComments = JSON.parse(localStorage.getItem(COMMENTS_KEY) || '[]');
        const loadedNotifications = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]');
        
        // Migrate documents to ensure they have the starred property
        const migratedDocuments = loadedDocuments.map((doc: Document) => ({
          ...doc,
          starred: doc.starred !== undefined ? doc.starred : false
        }));
        
        // Save migrated documents back to localStorage if any changes were made
        if (JSON.stringify(loadedDocuments) !== JSON.stringify(migratedDocuments)) {
          localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(migratedDocuments));
        }
        
        setDocuments(migratedDocuments);
        setFolders(loadedFolders);
        setTags(loadedTags);
        setComments(loadedComments);
        setNotifications(loadedNotifications);
        
        setError(null);
      } catch (err) {
        console.error('Failed to load data from localStorage:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Document CRUD operations
  const addDocument = async (doc: Omit<Document, 'id'>): Promise<Document> => {
    console.log('=== ADD DOCUMENT ===');
    console.log('Document to add:', doc);
    console.log('Current user:', currentUser);
    console.log('addActivity function available:', !!addActivity);
    
    const newDocument: Document = {
      ...doc,
      id: `doc-${Date.now()}`,
      uploadDate: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      comments: doc.comments || [],
      starred: doc.starred !== undefined ? doc.starred : false
    };
    
    console.log('New document created:', newDocument);
    
    const updatedDocuments = [...documents, newDocument];
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
    setDocuments(updatedDocuments);
    
    // Update folder
    if (doc.folder) {
      const updatedFolders = folders.map(folder => {
        if (folder.id === doc.folder) {
          return {
            ...folder,
            documents: [...folder.documents, newDocument.id]
          };
        }
        return folder;
      });
      
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
      setFolders(updatedFolders);
    }
    
    // Track activity
    console.log('Attempting to track activity...');
    if (addActivity && currentUser) {
      console.log('Calling addActivity');
      addActivity({
        type: 'upload',
        documentId: newDocument.id,
        documentName: newDocument.name,
        userId: currentUser.id,
        userName: currentUser.name,
        details: `Uploaded document "${newDocument.name}"`
      });
      console.log('Activity tracked successfully');
    } else {
      console.warn('Cannot track activity - addActivity:', !!addActivity, 'currentUser:', !!currentUser);
    }
    
    return newDocument;
  };

  const updateDocument = async (id: string, docUpdate: Partial<Document>): Promise<Document | null> => {
    const docIndex = documents.findIndex(doc => doc.id === id);
    if (docIndex === -1) return null;
    
    const updatedDoc = {
      ...documents[docIndex],
      ...docUpdate,
      lastModified: new Date().toISOString()
    };
    
    const updatedDocuments = [...documents];
    updatedDocuments[docIndex] = updatedDoc;
    
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
    setDocuments(updatedDocuments);
    
    // Track activity (only for significant updates, not status changes)
    if (addActivity && currentUser && docUpdate.name) {
      addActivity({
        type: 'edit',
        documentId: updatedDoc.id,
        documentName: updatedDoc.name,
        userId: currentUser.id,
        userName: currentUser.name,
        details: `Updated document "${updatedDoc.name}"`
      });
    }
    
    return updatedDoc;
  };

  const deleteDocument = async (id: string): Promise<boolean> => {
    try {
      const doc = documents.find(doc => doc.id === id);
      if (!doc) return false;
      
      // Track activity before deletion
      if (addActivity && currentUser) {
        addActivity({
          type: 'delete',
          documentId: doc.id,
          documentName: doc.name,
          userId: currentUser.id,
          userName: currentUser.name,
          details: `Deleted document "${doc.name}"`
        });
      }
      
      // Remove document from its folder
      if (doc.folder) {
        const updatedFolders = folders.map(folder => {
          if (folder.id === doc.folder) {
            return {
              ...folder,
              documents: folder.documents.filter(docId => docId !== id)
            };
          }
          return folder;
        });
        
        localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
        setFolders(updatedFolders);
      }
      
      // Delete related comments
      const updatedComments = comments.filter(comment => comment.documentId !== id);
      localStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments));
      setComments(updatedComments);
      
      // Delete the document
      const updatedDocuments = documents.filter(doc => doc.id !== id);
      localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocuments));
      setDocuments(updatedDocuments);
      
      return true;
    } catch (error) {
      console.error('Error deleting document:', error);
      return false;
    }
  };

  const getDocument = (id: string): Document | undefined => {
    return documents.find(doc => doc.id === id);
  };

  const starDocument = async (id: string, starred: boolean): Promise<void> => {
    await updateDocument(id, { starred });
  };

  const searchDocuments = (filters: SearchFilters): Document[] => {
    let results = [...documents];
    
    // Text search
    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(doc => 
        doc.name.toLowerCase().includes(query) || 
        doc.description.toLowerCase().includes(query)
      );
    }
    
    // Filter by type
    if (filters.type && filters.type.length > 0) {
      results = results.filter(doc => filters.type?.includes(doc.type));
    }
    
    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(doc => 
        filters.tags?.some(tagId => doc.tags.includes(tagId))
      );
    }
    
    // Filter by date range
    if (filters.dateRange) {
      const { from, to } = filters.dateRange;
      results = results.filter(doc => {
        const uploadDate = new Date(doc.uploadDate);
        return (!from || new Date(from) <= uploadDate) && 
               (!to || uploadDate <= new Date(to));
      });
    }
    
    // Filter by folder
    if (filters.folder) {
      results = results.filter(doc => doc.folder === filters.folder);
    }
    
    // Filter by uploader
    if (filters.uploadedBy) {
      results = results.filter(doc => doc.uploadedBy === filters.uploadedBy);
    }
    
    return results;
  };

  // Folder operations
  const addFolder = async (folder: Omit<Folder, 'id'>): Promise<Folder> => {
    const newFolder: Folder = {
      ...folder,
      id: `folder-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedFolders = [...folders, newFolder];
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
    setFolders(updatedFolders);
    
    return newFolder;
  };

  const updateFolder = async (id: string, folderUpdate: Partial<Folder>): Promise<Folder | null> => {
    const folderIndex = folders.findIndex(folder => folder.id === id);
    if (folderIndex === -1) return null;
    
    const updatedFolder = {
      ...folders[folderIndex],
      ...folderUpdate
    };
    
    const updatedFolders = [...folders];
    updatedFolders[folderIndex] = updatedFolder;
    
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
    setFolders(updatedFolders);
    
    return updatedFolder;
  };

  const deleteFolder = async (id: string): Promise<boolean> => {
    // Don't allow deleting the root folder
    if (id === 'root') return false;
    
    // Move documents in this folder to the root folder
    const folderToDelete = folders.find(folder => folder.id === id);
    if (!folderToDelete) return false;
    
    // Update documents to be in the root folder
    const docsToUpdate = documents.filter(doc => doc.folder === id);
    const updatedDocs = documents.map(doc => {
      if (doc.folder === id) {
        return { ...doc, folder: 'root' };
      }
      return doc;
    });
    
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocs));
    setDocuments(updatedDocs);
    
    // Update root folder to include these documents
    const rootFolder = folders.find(folder => folder.id === 'root');
    if (rootFolder) {
      const updatedRootFolder = {
        ...rootFolder,
        documents: [...rootFolder.documents, ...folderToDelete.documents]
      };
      
      const updatedFolders = folders.map(folder => 
        folder.id === 'root' ? updatedRootFolder : folder
      ).filter(folder => folder.id !== id);
      
      localStorage.setItem(FOLDERS_KEY, JSON.stringify(updatedFolders));
      setFolders(updatedFolders);
    }
    
    return true;
  };

  // Tag operations
  const addTag = async (tag: Omit<Tag, 'id'>): Promise<Tag> => {
    const newTag: Tag = {
      ...tag,
      id: `tag-${Date.now()}`
    };
    
    const updatedTags = [...tags, newTag];
    localStorage.setItem(TAGS_KEY, JSON.stringify(updatedTags));
    setTags(updatedTags);
    
    return newTag;
  };

  const updateTag = async (id: string, tagUpdate: Partial<Tag>): Promise<Tag | null> => {
    const tagIndex = tags.findIndex(tag => tag.id === id);
    if (tagIndex === -1) return null;
    
    const updatedTag = {
      ...tags[tagIndex],
      ...tagUpdate
    };
    
    const updatedTags = [...tags];
    updatedTags[tagIndex] = updatedTag;
    
    localStorage.setItem(TAGS_KEY, JSON.stringify(updatedTags));
    setTags(updatedTags);
    
    return updatedTag;
  };

  const deleteTag = async (id: string): Promise<boolean> => {
    // Remove tag from all documents first
    const updatedDocs = documents.map(doc => ({
      ...doc,
      tags: doc.tags.filter(tagId => tagId !== id)
    }));
    
    localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updatedDocs));
    setDocuments(updatedDocs);
    
    // Remove the tag
    const updatedTags = tags.filter(tag => tag.id !== id);
    localStorage.setItem(TAGS_KEY, JSON.stringify(updatedTags));
    setTags(updatedTags);
    
    return true;
  };

  // Comment operations
  const addComment = async (comment: Omit<Comment, 'id'>): Promise<Comment> => {
    const newComment: Comment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    const updatedComments = [...comments, newComment];
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments));
    setComments(updatedComments);
    
    // Create notification for document owner
    const document = documents.find(doc => doc.id === comment.documentId);
    if (document && document.uploadedBy !== comment.userId) {
      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        userId: document.uploadedBy,
        type: 'comment',
        content: `New comment on document "${document.name}"`,
        documentId: document.id,
        read: false,
        createdAt: new Date().toISOString()
      };
      
      const updatedNotifications = [...notifications, newNotification];
      localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    }
    
    return newComment;
  };

  const deleteComment = async (id: string): Promise<boolean> => {
    const updatedComments = comments.filter(comment => comment.id !== id);
    localStorage.setItem(COMMENTS_KEY, JSON.stringify(updatedComments));
    setComments(updatedComments);
    
    return true;
  };

  // Document processing with indexing
  const processDocument = async (id: string): Promise<Document | null> => {
    const document = documents.find(doc => doc.id === id);
    if (!document) return null;
    
    // Update status to processing
    const processingDoc = await updateDocument(id, { status: 'processing' });
    
    // Determine file type specific features
    const fileType = document.type.toLowerCase();
    const fileExtension = document.name.split('.').pop()?.toLowerCase() || fileType;
    
    // Set accessibility features based on file type
    const accessibilityFeatures = {
      searchable: false,
      textExtraction: false,
      contentPreview: false,
      annotationSupport: false,
      electronAppCompatible: false,
      metadataExtraction: false
    };
    
    // Document types with text content
    if (['pdf', 'doc', 'docx', 'rtf', 'txt', 'odt'].includes(fileType)) {
      accessibilityFeatures.searchable = true;
      accessibilityFeatures.textExtraction = true;
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.annotationSupport = true;
      accessibilityFeatures.electronAppCompatible = true;
      accessibilityFeatures.metadataExtraction = true;
    } 
    // Spreadsheet files
    else if (['xls', 'xlsx', 'csv', 'ods'].includes(fileType)) {
      accessibilityFeatures.searchable = true;
      accessibilityFeatures.textExtraction = true;
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.electronAppCompatible = true;
      accessibilityFeatures.metadataExtraction = true;
    } 
    // Presentation files
    else if (['ppt', 'pptx', 'odp'].includes(fileType)) {
      accessibilityFeatures.searchable = true;
      accessibilityFeatures.textExtraction = true;
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.electronAppCompatible = true;
      accessibilityFeatures.metadataExtraction = true;
    } 
    // Image files
    else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'].includes(fileExtension)) {
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.electronAppCompatible = true;
      accessibilityFeatures.metadataExtraction = true;
    } 
    // Video files
    else if (['mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv'].includes(fileExtension)) {
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.electronAppCompatible = true;
      accessibilityFeatures.metadataExtraction = true;
    } 
    // Audio files
    else if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(fileExtension)) {
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.electronAppCompatible = true;
      accessibilityFeatures.metadataExtraction = true;
    } 
    // Code files
    else if (['html', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'py', 'java', 'c', 'cpp', 'cs', 'php'].includes(fileExtension)) {
      accessibilityFeatures.searchable = true;
      accessibilityFeatures.textExtraction = true;
      accessibilityFeatures.contentPreview = true;
      accessibilityFeatures.electronAppCompatible = true;
    }
    
    // Simulate processing delay
    return new Promise((resolve) => {
      setTimeout(async () => {
        // Generate sample pages with indexing data
        const documentPages: DocumentPage[] = [];
        
        // Create simulated pages based on document type
        let pageCount = Math.floor(Math.random() * 10) + 1; // Random 1-10 pages
        
        // Adjust page count based on file type
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(fileExtension)) {
          pageCount = 1; // Images have just one page
        }
        
        for (let i = 1; i <= pageCount; i++) {
          const pageId = `page_${document.id}_${i}`;
          let keywords: string[] = [];
          
          if (accessibilityFeatures.searchable) {
            keywords = ['document', 'content', 'page', document.name.split('.')[0]];
            
            if (document.type === 'pdf' || document.type === 'docx') {
              keywords.push('text', 'paragraph', 'section');
            } else if (document.type === 'xlsx' || document.type === 'xls') {
              keywords.push('table', 'data', 'cell');
            } else if (document.type === 'pptx' || document.type === 'ppt') {
              keywords.push('slide', 'presentation', 'bullet');
            }
          }
          
          documentPages.push({
            id: pageId,
            documentId: document.id,
            pageNumber: i,
            content: `Sample content for page ${i}`,
            textContent: accessibilityFeatures.textExtraction 
              ? `This is the extracted text content from page ${i} of document ${document.name}`
              : undefined,
            thumbnailUrl: `https://via.placeholder.com/200x300?text=Page+${i}`,
            indexedKeywords: accessibilityFeatures.searchable ? keywords : undefined
          });
        }
        
        // Simulate processing completion
        const processedDoc = await updateDocument(id, { 
          status: 'completed',
          pages: documentPages,
          downloadUrl: `/api/documents/${id}/download`, // In a real app, this would be a valid endpoint
          electronAppCompatible: accessibilityFeatures.electronAppCompatible,
          accessibilityFeatures
        });
        
        resolve(processedDoc);
      }, 3000);
    });
  };

  // Get document pages
  const getDocumentPages = (documentId: string): DocumentPage[] => {
    const document = documents.find(doc => doc.id === documentId);
    return document?.pages || [];
  };
  
  // Desktop app integration
  const openInDesktopApp = async (id: string): Promise<boolean> => {
    const document = documents.find(doc => doc.id === id);
    if (!document || !document.electronAppCompatible) {
      return false;
    }
    
    // In a real app, this would use electron or a custom protocol handler
    // to open the document in a desktop application
    console.log(`Opening document ${id} in desktop application`);
    
    // Simulate successful desktop app launch
    return new Promise((resolve) => {
      setTimeout(() => resolve(true), 1000);
    });
  };

  const value = {
    documents,
    folders,
    tags,
    comments,
    notifications,
    isLoading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    getDocument,
    searchDocuments,
    starDocument,
    addFolder,
    updateFolder,
    deleteFolder,
    addTag,
    updateTag,
    deleteTag,
    addComment,
    deleteComment,
    processDocument,
    openInDesktopApp,
    getDocumentPages
  };

  return <DocumentContext.Provider value={value}>{children}</DocumentContext.Provider>;
};