import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import MainLayout from '@/components/layout/MainLayout';
import DocumentViewer from '@/components/document/DocumentViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import {
  FileText,
  ChevronRight,
  Download,
  Star,
  MoreHorizontal,
  Pencil,
  Trash,
  MessageSquare,
  Clock,
  Tag as TagIcon,
  Share2,
  ArrowLeft,
  StarOff,
  Loader2
} from 'lucide-react';
import { Document, Comment, Folder, Tag } from '@/types/document';
import { cn } from '@/lib/utils';

const DocumentView: React.FC = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { 
    documents, 
    folders, 
    tags, 
    addComment, 
    deleteDocument, 
    updateDocument,
    openInDesktopApp,
    getDocumentPages
  } = useDocuments();
  
  const [document, setDocument] = useState<Document | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [documentTags, setDocumentTags] = useState<Tag[]>([]);
  
  // Dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Load document data
  useEffect(() => {
    const loadDocumentData = () => {
      setIsLoading(true);
      
      // Find document by ID
      const doc = documents.find(d => d.id === documentId);
      setDocument(doc || null);
      
      if (doc) {
        // Find folder
        const docFolder = folders.find(f => f.id === doc.folder);
        setFolder(docFolder || null);
        
        // Get document tags
        const docTags = tags.filter(tag => doc.tags.includes(tag.id));
        setDocumentTags(docTags);
      }
      
      setIsLoading(false);
    };
    
    loadDocumentData();
  }, [documentId, documents, folders, tags]);
  
  // Handle document deletion
  const handleDeleteDocument = async () => {
    if (!document) return;
    
    try {
      await deleteDocument(document.id);
      navigate('/documents');
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleteDialogOpen(false);
    }
  };
  
  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!document || !newComment.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      const comment: Comment = {
        id: `comment_${Date.now()}`,
        documentId: document.id,
        userId: 'current-user', // In a real app, get from auth context
        userName: 'Current User', // In a real app, get from auth context
        content: newComment.trim(),
        createdAt: new Date().toISOString()
      };
      
      await addComment(comment);
      setNewComment('');
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle opening document in desktop app
  const [isOpeningInDesktop, setIsOpeningInDesktop] = useState(false);
  
  const handleOpenInDesktopApp = async () => {
    if (!document) return;
    
    setIsOpeningInDesktop(true);
    try {
      const success = await openInDesktopApp(document.id);
      if (!success) {
        console.error('Failed to open document in desktop app');
      }
    } catch (error) {
      console.error('Error opening document in desktop app:', error);
    } finally {
      setIsOpeningInDesktop(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
  
  if (!document) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <p className="text-muted-foreground mb-6">The document you're looking for doesn't exist</p>
          <Button asChild>
            <Link to="/documents">Go to Documents</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  // Get document file type icon
  const getFileTypeIcon = () => {
    const iconClasses = "h-12 w-12";
    
    switch (document.type.toLowerCase()) {
      case 'pdf':
        return <FileText className={cn(iconClasses, "text-red-500")} />;
      case 'doc':
      case 'docx':
        return <FileText className={cn(iconClasses, "text-blue-500")} />;
      case 'xls':
      case 'xlsx':
        return <FileText className={cn(iconClasses, "text-green-500")} />;
      case 'ppt':
      case 'pptx':
        return <FileText className={cn(iconClasses, "text-orange-500")} />;
      default:
        return <FileText className={cn(iconClasses, "text-gray-500")} />;
    }
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Back button and breadcrumbs */}
        <div className="flex items-center text-sm text-muted-foreground mb-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-1 px-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          
          <ChevronRight className="h-4 w-4 mx-1" />
          
          <Link 
            to="/folders/root" 
            className="hover:text-foreground transition-colors"
          >
            Documents
          </Link>
          
          {folder && (
            <>
              <ChevronRight className="h-4 w-4 mx-1" />
              <Link 
                to={`/folders/${folder.id}`}
                className="hover:text-foreground transition-colors"
              >
                {folder.name}
              </Link>
            </>
          )}
          
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-foreground font-medium truncate">
            {document.name}
          </span>
        </div>
        
        {/* Header with actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {getFileTypeIcon()}
            
            <div>
              <h1 className="text-2xl font-bold">{document.name}</h1>
              <p className="text-sm text-muted-foreground">
                Uploaded on {formatDate(document.uploadDate)} • {(document.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => document && updateDocument(document.id, { starred: !document.starred })}
              className={document.starred ? "text-amber-500" : ""}
            >
              {document.starred ? 
                <Star className="h-4 w-4 fill-amber-500" /> : 
                <StarOff className="h-4 w-4" />
              }
            </Button>
            
            <Button asChild variant="outline">
              <a href={document.downloadUrl || "#"} download={document.name}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </a>
            </Button>
            
            {document.electronAppCompatible && (
              <Button 
                variant="outline" 
                onClick={handleOpenInDesktopApp}
                disabled={isOpeningInDesktop}
              >
                {isOpeningInDesktop ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 17H5C3.89543 17 3 16.1046 3 15V5C3 3.89543 3.89543 3 5 3H19C20.1046 3 21 3.89543 21 5V15C21 16.1046 20.1046 17 19 17H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12 10V21M12 21L9 18M12 21L15 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                Open in Desktop
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => navigate(`/documents/${document.id}/share`)}
              title="Share document"
            >
              <Share2 className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/documents/${document.id}/permissions`} className="flex items-center">
                    <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 5V3M12 21V19M5 12H3M21 12H19M6.34315 6.34315L4.92893 4.92893M19.0711 19.0711L17.6569 17.6569M6.34315 17.6569L4.92893 19.0711M19.0711 4.92893L17.6569 6.34315" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Manage Permissions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)} className="text-destructive">
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* Document tags */}
        {documentTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {documentTags.map(tag => (
              <div 
                key={tag.id}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                style={{ backgroundColor: `${tag.color}20` }}
              >
                <div 
                  className="h-2 w-2 rounded-full" 
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Document content tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="indexed">
              Indexed Pages
              {document.pages && (
                <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 rounded-full">
                  {document.pages.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
            <TabsTrigger value="comments">
              Comments
              {document.comments && document.comments.length > 0 && (
                <span className="ml-1 bg-primary/10 text-primary text-xs px-1.5 rounded-full">
                  {document.comments.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                {/* Type-specific document viewer */}
                <DocumentViewer document={document} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="indexed" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Indexed Pages</h3>
                    <p className="text-sm text-muted-foreground">
                      {document.pages ? `${document.pages.length} pages indexed` : 'No pages indexed yet'}
                    </p>
                  </div>
                  
                  {document.pages && document.pages.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {document.pages.map((page) => (
                        <div key={page.id} className="border rounded-lg overflow-hidden">
                          <div className="aspect-[3/4] relative bg-gray-100 flex items-center justify-center">
                            {page.thumbnailUrl ? (
                              <img 
                                src={page.thumbnailUrl} 
                                alt={`Page ${page.pageNumber}`} 
                                className="object-contain w-full h-full"
                              />
                            ) : (
                              <FileText className="h-12 w-12 text-muted-foreground" />
                            )}
                          </div>
                          <div className="p-3">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium">Page {page.pageNumber}</h4>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-2">
                              {page.textContent || 'No extracted text available'}
                            </div>
                            {page.indexedKeywords && page.indexedKeywords.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {page.indexedKeywords.map((keyword, idx) => (
                                  <span 
                                    key={idx}
                                    className="px-1.5 py-0.5 bg-gray-100 text-xs rounded"
                                  >
                                    {keyword}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-md border-muted">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-base font-medium">No indexed pages available</h3>
                      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                        This document hasn't been indexed yet or doesn't contain extractable pages.
                      </p>
                      <Button variant="outline" className="mt-4">
                        Start Indexing
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="comments" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                {/* Comments section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Comments</h3>
                  
                  {/* Comment list */}
                  <div className="space-y-4 mb-6">
                    {document.comments.length > 0 ? (
                      document.comments
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map(comment => (
                          <div key={comment.id} className="flex gap-3 py-3 border-b last:border-0">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <span className="font-medium text-primary text-sm">
                                {comment.userName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">{comment.userName}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-sm">{comment.content}</p>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-8">
                        <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                        <h4 className="text-sm font-medium">No comments yet</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Be the first to comment on this document
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Add comment form */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Add a comment</h4>
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSubmitComment}
                        disabled={!newComment.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Posting...
                          </>
                        ) : 'Post Comment'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="accessibility" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">File Accessibility Features</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    This {document.type.toUpperCase()} file has the following accessibility features available:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Content Features</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center justify-between">
                          <span>Content Preview</span>
                          {document.accessibilityFeatures?.contentPreview ? (
                            <span className="text-green-600 font-medium">Available</span>
                          ) : (
                            <span className="text-red-500 font-medium">Not Available</span>
                          )}
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Text Extraction</span>
                          {document.accessibilityFeatures?.textExtraction ? (
                            <span className="text-green-600 font-medium">Available</span>
                          ) : (
                            <span className="text-red-500 font-medium">Not Available</span>
                          )}
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Text Search</span>
                          {document.accessibilityFeatures?.searchable ? (
                            <span className="text-green-600 font-medium">Available</span>
                          ) : (
                            <span className="text-red-500 font-medium">Not Available</span>
                          )}
                        </li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-2">Interaction Features</h4>
                      <ul className="space-y-2">
                        <li className="flex items-center justify-between">
                          <span>Annotations</span>
                          {document.accessibilityFeatures?.annotationSupport ? (
                            <span className="text-green-600 font-medium">Available</span>
                          ) : (
                            <span className="text-red-500 font-medium">Not Available</span>
                          )}
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Metadata Extraction</span>
                          {document.accessibilityFeatures?.metadataExtraction ? (
                            <span className="text-green-600 font-medium">Available</span>
                          ) : (
                            <span className="text-red-500 font-medium">Not Available</span>
                          )}
                        </li>
                        <li className="flex items-center justify-between">
                          <span>Desktop App Support</span>
                          {document.accessibilityFeatures?.electronAppCompatible ? (
                            <span className="text-green-600 font-medium">Available</span>
                          ) : (
                            <span className="text-red-500 font-medium">Not Available</span>
                          )}
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">File Type Compatibility</h4>
                    <div className="flex flex-wrap gap-2">
                      {['pdf', 'docx', 'xlsx', 'pptx', 'jpg', 'mp4', 'mp3'].map(type => (
                        <div
                          key={type}
                          className={`px-2 py-1 rounded-md text-xs ${
                            document.type.toLowerCase() === type
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {type.toUpperCase()}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Different file types have different levels of accessibility. Some formats like PDF and DOCX 
                      provide rich accessibility features, while others like images and audio files have more limited options.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                {/* Version history - in a real app, this would show document revisions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Version History</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-medium">Current version</span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(document.uploadDate)}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Uploaded by {document.uploadedBy}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-center py-4 text-sm text-muted-foreground">
                      No previous versions found
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{document.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            
            <Button 
              variant="destructive" 
              onClick={handleDeleteDocument}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default DocumentView;