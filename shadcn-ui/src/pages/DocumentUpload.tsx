import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Upload, X, AlertCircle, FolderArchive } from 'lucide-react';

const DocumentUpload: React.FC = () => {
  const navigate = useNavigate();
  const { addDocument, folders } = useDocuments();
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<File[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [folderId, setFolderId] = useState('root');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  
  // Handle file selection from input (supports multiple files)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const fileArray = Array.from(selectedFiles);
      setFiles(fileArray);
      if (!name && fileArray.length === 1) {
        setName(fileArray[0].name);
      } else if (!name && fileArray.length > 1) {
        setName(`${fileArray.length} files`);
      }
    }
  };
  
  // Handle file drop (supports multiple files)
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(droppedFiles);
      if (!name && droppedFiles.length === 1) {
        setName(droppedFiles[0].name);
      } else if (!name && droppedFiles.length > 1) {
        setName(`${droppedFiles.length} files`);
      }
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }
    
    if (!name) {
      setError('Please enter a name for the document(s)');
      return;
    }
    
    if (!currentUser) {
      setError('You must be logged in to upload documents');
      return;
    }
    
    setError('');
    setIsUploading(true);
    
    try {
      // Upload each file
      for (const file of files) {
        // Extract file type from extension
        const fileExtension = file.name.split('.').pop() || '';
        
        // Create the document with correct structure
        const newDoc = {
          name: files.length === 1 ? name : file.name,
          description: description,
          type: fileExtension.toLowerCase(),
          size: file.size,
          uploadedBy: currentUser.id,
          folder: folderId,
          tags: [],
          status: 'completed' as const,
          url: URL.createObjectURL(file),
          pages: []
        };
        
        // Add the document to the store (this will trigger activity tracking)
        await addDocument(newDoc);
      }
      
      // Navigate to documents list after successful upload
      setTimeout(() => {
        navigate('/documents');
      }, 500);
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('An error occurred while uploading the document(s)');
      setIsUploading(false);
    }
  };
  
  // Clear the selected files
  const clearFiles = () => {
    setFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Get file size display
  const getFileSize = (size: number) => {
    if (size < 1024) {
      return `${size} bytes`;
    } else if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(2)} KB`;
    } else {
      return `${(size / (1024 * 1024)).toFixed(2)} MB`;
    }
  };
  
  // Get total size of all files
  const getTotalSize = () => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return getFileSize(total);
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Upload Document(s)</h1>
        
        <Card>
          <form onSubmit={handleSubmit}>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
              <CardDescription>
                Upload single or multiple files, folders, or zip archives
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* File drop zone */}
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                  ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActive(false);
                }}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {files.length > 0 ? (
                  <div className="flex items-center justify-center flex-col">
                    <div className="flex items-center mb-4">
                      {files.length === 1 ? (
                        <FileText className="h-12 w-12 text-primary" />
                      ) : (
                        <FolderArchive className="h-12 w-12 text-primary" />
                      )}
                    </div>
                    {files.length === 1 ? (
                      <>
                        <p className="font-medium">{files[0].name}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {getFileSize(files[0].size)}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{files.length} files selected</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Total size: {getTotalSize()}
                        </p>
                        <div className="mt-3 max-h-32 overflow-y-auto w-full">
                          {files.map((file, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                              {file.name} ({getFileSize(file.size)})
                            </p>
                          ))}
                        </div>
                      </>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFiles();
                      }}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove All
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-12 w-12 text-muted-foreground mb-2" />
                    <h3 className="font-medium text-base">Drag and drop your files here</h3>
                    <p className="text-sm text-muted-foreground mb-2">
                      or click to browse from your computer
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Supports single files, multiple files, folders, and ZIP archives
                    </p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, ZIP, and more
                    </p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  multiple
                  webkitdirectory=""
                  directory=""
                  onChange={handleFileChange}
                />
              </div>
              
              {/* Document details */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Document Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter document name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="folder">Folder</Label>
                    <Select 
                      value={folderId} 
                      onValueChange={setFolderId}
                    >
                      <SelectTrigger id="folder">
                        <SelectValue placeholder="Select folder" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="root">Root Folder</SelectItem>
                        {folders.filter(folder => folder.id !== 'root').map(folder => (
                          <SelectItem key={folder.id} value={folder.id}>
                            {folder.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter a description for this document"
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(-1)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              
              <Button 
                type="submit" 
                disabled={files.length === 0 || isUploading}
              >
                {isUploading ? 'Uploading...' : `Upload ${files.length > 1 ? `${files.length} Files` : 'Document'}`}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DocumentUpload;