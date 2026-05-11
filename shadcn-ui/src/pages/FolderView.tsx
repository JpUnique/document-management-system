import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Folder, ChevronRight, MoreHorizontal, FilePlus, FileText, Trash, Pencil, Loader2, FolderPlus } from 'lucide-react';
import { Document, Folder as FolderType } from '@/types/document';

const FolderView: React.FC = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const { documents, folders, addFolder, renameFolder, deleteFolder } = useDocuments();
  
  const [currentFolder, setCurrentFolder] = useState<FolderType | null>(null);
  const [parentFolder, setParentFolder] = useState<FolderType | null>(null);
  const [folderDocuments, setFolderDocuments] = useState<Document[]>([]);
  const [childFolders, setChildFolders] = useState<FolderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [breadcrumbs, setBreadcrumbs] = useState<FolderType[]>([]);
  
  // Dialog states
  const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
  const [isRenameFolderDialogOpen, setIsRenameFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Load folder data when folderId changes
  useEffect(() => {
    const loadFolderData = () => {
      setIsLoading(true);
      
      // Find the current folder
      const folder = folders.find(f => f.id === folderId) || 
                    (folderId === 'root' ? { 
                      id: 'root', 
                      name: 'Root', 
                      parentId: null,
                      userId: 'system'
                    } : null);
      
      setCurrentFolder(folder);
      
      if (folder) {
        // Find documents in this folder
        const docs = documents.filter(doc => doc.folderId === folder.id);
        setFolderDocuments(docs);
        
        // Find subfolders
        const subFolders = folders.filter(f => f.parentId === folder.id);
        setChildFolders(subFolders);
        
        // Find parent folder
        const parent = folder.parentId ? folders.find(f => f.id === folder.parentId) : null;
        setParentFolder(parent);
        
        // Build breadcrumbs
        const buildBreadcrumbs = (folderId: string | null): FolderType[] => {
          if (!folderId) return [];
          const folder = folders.find(f => f.id === folderId);
          if (!folder) return [];
          return [...buildBreadcrumbs(folder.parentId), folder];
        };
        
        if (folder.id === 'root') {
          setBreadcrumbs([]);
        } else {
          setBreadcrumbs(buildBreadcrumbs(folder.id));
        }
      }
      
      setIsLoading(false);
    };
    
    loadFolderData();
  }, [folderId, folders, documents]);
  
  // Handle new folder creation
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Create new folder
      const newFolder = {
        id: `folder_${Date.now()}`,
        name: newFolderName.trim(),
        parentId: currentFolder?.id || 'root',
        userId: 'current-user' // In a real app, get from auth context
      };
      
      await addFolder(newFolder);
      
      // Reset and close dialog
      setNewFolderName('');
      setIsNewFolderDialogOpen(false);
    } catch (error) {
      console.error('Error creating folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle folder rename
  const handleRenameFolder = async () => {
    if (!currentFolder || !newFolderName.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await renameFolder(currentFolder.id, newFolderName);
      setIsRenameFolderDialogOpen(false);
    } catch (error) {
      console.error('Error renaming folder:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle folder deletion
  const handleDeleteFolder = async () => {
    if (!currentFolder) return;
    
    // Check if folder has contents
    const hasDocs = folderDocuments.length > 0;
    const hasSubfolders = childFolders.length > 0;
    
    if (hasDocs || hasSubfolders) {
      alert('Cannot delete folder that contains documents or subfolders');
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete "${currentFolder.name}"?`)) {
      try {
        await deleteFolder(currentFolder.id);
        navigate(parentFolder ? `/folders/${parentFolder.id}` : '/folders/root');
      } catch (error) {
        console.error('Error deleting folder:', error);
      }
    }
  };

  // Generate breadcrumb links
  const renderBreadcrumbs = () => {
    return (
      <div className="flex items-center space-x-1 text-sm mb-4">
        <Link 
          to="/folders/root" 
          className="text-muted-foreground hover:text-foreground"
        >
          Root
        </Link>
        
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
            <Link 
              to={`/folders/${crumb.id}`}
              className={`${index === breadcrumbs.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {crumb.name}
            </Link>
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    );
  }
  
  if (!currentFolder) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Folder not found</h2>
          <p className="text-muted-foreground mb-6">The folder you're looking for doesn't exist</p>
          <Button asChild>
            <Link to="/folders/root">Go to Root Folder</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header with breadcrumbs and actions */}
        <div>
          {renderBreadcrumbs()}
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">{currentFolder.name}</h1>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(true)}>
                <FolderPlus className="h-4 w-4 mr-2" />
                New Folder
              </Button>
              
              <Button asChild>
                <Link to="/documents/new" state={{ folderId: currentFolder.id }} className="flex items-center">
                  <FilePlus className="h-4 w-4 mr-2" />
                  Upload
                </Link>
              </Button>
              
              {currentFolder.id !== 'root' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setNewFolderName(currentFolder.name);
                      setIsRenameFolderDialogOpen(true);
                    }}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Rename Folder
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDeleteFolder} className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete Folder
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
        
        {/* Folder contents */}
        <Card>
          {(childFolders.length > 0 || folderDocuments.length > 0) ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]"></TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead className="hidden md:table-cell">Modified</TableHead>
                  <TableHead className="hidden md:table-cell">Size</TableHead>
                  <TableHead className="w-[30px]"></TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {/* Parent folder (back button) */}
                {parentFolder && (
                  <TableRow>
                    <TableCell>
                      <Folder className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/folders/${parentFolder.id}`} 
                        className="flex items-center text-muted-foreground hover:text-foreground"
                      >
                        ..
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">Folder</TableCell>
                    <TableCell className="hidden md:table-cell">-</TableCell>
                    <TableCell className="hidden md:table-cell">-</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                )}
                
                {/* Child folders */}
                {childFolders.map(folder => (
                  <TableRow key={folder.id}>
                    <TableCell>
                      <Folder className="h-4 w-4 text-blue-500" />
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/folders/${folder.id}`} 
                        className="font-medium hover:underline"
                      >
                        {folder.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">Folder</TableCell>
                    <TableCell className="hidden md:table-cell">-</TableCell>
                    <TableCell className="hidden md:table-cell">-</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
                
                {/* Documents */}
                {folderDocuments.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <FileText className="h-4 w-4 text-gray-500" />
                    </TableCell>
                    <TableCell>
                      <Link 
                        to={`/documents/${doc.id}`} 
                        className="font-medium hover:underline"
                      >
                        {doc.name}
                      </Link>
                    </TableCell>
                    <TableCell className="hidden md:table-cell uppercase">
                      {doc.type}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(doc.size / 1024 / 1024).toFixed(2)} MB
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">This folder is empty</h3>
              <p className="text-muted-foreground mb-6">Upload documents or create folders to get started</p>
              <div className="flex justify-center gap-4">
                <Button variant="outline" onClick={() => setIsNewFolderDialogOpen(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  New Folder
                </Button>
                <Button asChild>
                  <Link to="/documents/new" state={{ folderId: currentFolder.id }}>
                    <FilePlus className="h-4 w-4 mr-2" />
                    Upload Document
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {/* New folder dialog */}
      <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create new folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            
            <Button 
              onClick={handleCreateFolder} 
              disabled={!newFolderName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Rename folder dialog */}
      <Dialog open={isRenameFolderDialogOpen} onOpenChange={setIsRenameFolderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename folder</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              autoFocus
            />
          </div>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            
            <Button 
              onClick={handleRenameFolder} 
              disabled={!newFolderName.trim() || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default FolderView;