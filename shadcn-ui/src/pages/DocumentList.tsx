import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  FilePlus,
  FolderPlus,
  FileText,
  Trash,
  Download,
  Pencil,
  Star,
  Tags,
  SlidersHorizontal,
  Search,
  X,
} from 'lucide-react';
import { Document, SearchFilters } from '@/types/document';

const DocumentList: React.FC = () => {
  const { documents, folders, tags, deleteDocument, starDocument } = useDocuments();
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Apply filters to documents
  const filteredDocuments = documents.filter(doc => {
    // Search by name or content
    const matchesSearch = searchQuery === '' || 
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by type
    const matchesType = selectedType === null || doc.type === selectedType;
    
    // Filter by folder
    const matchesFolder = selectedFolder === null || doc.folderId === selectedFolder;
    
    // Filter by tag
    const matchesTag = selectedTag === null || doc.tags.includes(selectedTag);
    
    return matchesSearch && matchesType && matchesFolder && matchesTag;
  });
  
  // Sort by most recent
  const sortedDocuments = [...filteredDocuments].sort(
    (a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
  );
  
  // Get current page documents
  const indexOfLastDoc = currentPage * itemsPerPage;
  const indexOfFirstDoc = indexOfLastDoc - itemsPerPage;
  const currentDocuments = sortedDocuments.slice(indexOfFirstDoc, indexOfLastDoc);
  
  // Page change handlers
  const totalPages = Math.ceil(sortedDocuments.length / itemsPerPage);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  
  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedDocuments.length === currentDocuments.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(currentDocuments.map(doc => doc.id));
    }
  };
  
  const toggleSelectDocument = (docId: string) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId) 
        : [...prev, docId]
    );
  };

  // Handle actions on multiple documents
  const handleBulkAction = (action: 'delete' | 'move' | 'tag') => {
    if (action === 'delete' && selectedDocuments.length > 0) {
      if (window.confirm(`Delete ${selectedDocuments.length} selected documents?`)) {
        selectedDocuments.forEach(id => deleteDocument(id));
        setSelectedDocuments([]);
      }
    }
    // Additional bulk actions can be implemented here
  };
  
  // File type icon mapping
  const fileTypeIcons: Record<string, JSX.Element> = {
    'pdf': <FileText className="h-4 w-4 text-red-500" />,
    'doc': <FileText className="h-4 w-4 text-blue-500" />,
    'docx': <FileText className="h-4 w-4 text-blue-500" />,
    'xls': <FileText className="h-4 w-4 text-green-500" />,
    'xlsx': <FileText className="h-4 w-4 text-green-500" />,
    'ppt': <FileText className="h-4 w-4 text-orange-500" />,
    'pptx': <FileText className="h-4 w-4 text-orange-500" />,
    'txt': <FileText className="h-4 w-4 text-gray-500" />,
    'default': <FileText className="h-4 w-4 text-gray-500" />
  };
  
  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedType(null);
    setSelectedFolder(null);
    setSelectedTag(null);
  };
  
  // Unique file types in the documents
  const fileTypes = Array.from(new Set(documents.map(doc => doc.type)));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header and actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">Documents</h1>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-primary/10 text-primary" : ""}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" asChild>
              <Link to="/folders/new" className="flex items-center gap-2">
                <FolderPlus className="h-4 w-4" />
                <span className="hidden sm:inline">New Folder</span>
              </Link>
            </Button>
            
            <Button asChild>
              <Link to="/documents/new" className="flex items-center gap-2">
                <FilePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Link>
            </Button>
          </div>
        </div>
        
        {/* Search and filters */}
        <div className="space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search documents..."
              className="pl-9 pr-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {/* Filter panels */}
          {showFilters && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 p-4 border rounded-md bg-accent/20">
              <div className="space-y-2">
                <Label htmlFor="type-filter">File Type</Label>
                <Select 
                  value={selectedType || ""} 
                  onValueChange={(value) => setSelectedType(value || null)}
                >
                  <SelectTrigger id="type-filter">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {fileTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="folder-filter">Folder</Label>
                <Select 
                  value={selectedFolder || ""} 
                  onValueChange={(value) => setSelectedFolder(value || null)}
                >
                  <SelectTrigger id="folder-filter">
                    <SelectValue placeholder="All folders" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All folders</SelectItem>
                    {folders.map(folder => (
                      <SelectItem key={folder.id} value={folder.id}>
                        {folder.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tag-filter">Tag</Label>
                <Select 
                  value={selectedTag || ""} 
                  onValueChange={(value) => setSelectedTag(value || null)}
                >
                  <SelectTrigger id="tag-filter">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All tags</SelectItem>
                    {tags.map(tag => (
                      <SelectItem key={tag.id} value={tag.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="h-2 w-2 rounded-full" 
                            style={{ backgroundColor: tag.color }} 
                          />
                          {tag.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button 
                  variant="ghost" 
                  onClick={resetFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Reset filters
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Selected documents actions */}
        {selectedDocuments.length > 0 && (
          <div className="bg-primary/5 p-2 rounded-md flex items-center justify-between">
            <span className="text-sm px-2">{selectedDocuments.length} selected</span>
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleBulkAction('delete')}
              >
                <Trash className="h-4 w-4 mr-1" /> Delete
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedDocuments([])}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
        
        {/* Documents table */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]">
                  <Checkbox 
                    checked={selectedDocuments.length === currentDocuments.length && currentDocuments.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Folder</TableHead>
                <TableHead className="hidden md:table-cell">Size</TableHead>
                <TableHead className="hidden md:table-cell">Uploaded</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentDocuments.length > 0 ? (
                currentDocuments.map(doc => {
                  const icon = fileTypeIcons[doc.type] || fileTypeIcons.default;
                  const folder = folders.find(f => f.id === doc.folderId);
                  const isSelected = selectedDocuments.includes(doc.id);
                  
                  return (
                    <TableRow 
                      key={doc.id} 
                      className={isSelected ? "bg-primary/5" : ""}
                    >
                      <TableCell>
                        <Checkbox 
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectDocument(doc.id)}
                          aria-label={`Select ${doc.name}`}
                        />
                      </TableCell>
                      <TableCell>
                        {icon}
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/documents/${doc.id}`} 
                          className="font-medium hover:underline"
                        >
                          {doc.name}
                        </Link>
                        <div className="text-xs text-muted-foreground md:hidden">
                          {folder?.name || "No folder"} • {new Date(doc.uploadDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {folder?.name || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {new Date(doc.uploadDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => starDocument(doc.id, !doc.starred)}
                              className="flex items-center gap-2"
                            >
                              <Star className={`h-4 w-4 ${doc.starred ? "text-yellow-500 fill-yellow-500" : ""}`} />
                              {doc.starred ? "Remove from starred" : "Add to starred"}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to={`/documents/${doc.id}/edit`} className="flex items-center gap-2">
                                <Pencil className="h-4 w-4" />
                                Edit properties
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Download className="h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <Tags className="h-4 w-4" />
                              Manage tags
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                if (window.confirm(`Delete ${doc.name}?`)) {
                                  deleteDocument(doc.id);
                                }
                              }}
                              className="text-destructive flex items-center gap-2"
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center py-8">
                      <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                      <p className="text-lg font-medium">No documents found</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        {searchQuery || selectedType || selectedFolder || selectedTag ? 
                          "Try adjusting your filters" : 
                          "Upload your first document to get started"}
                      </p>
                      {!(searchQuery || selectedType || selectedFolder || selectedTag) && (
                        <Button asChild>
                          <Link to="/documents/new">Upload Document</Link>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {sortedDocuments.length > itemsPerPage && (
            <div className="flex items-center justify-between p-4 border-t">
              <div className="text-sm text-muted-foreground">
                Showing {indexOfFirstDoc + 1} to {Math.min(indexOfLastDoc, sortedDocuments.length)} of {sortedDocuments.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={prevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={nextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default DocumentList;