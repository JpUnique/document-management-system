import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Plus, Trash2, Edit2, Tag as TagIcon, AlertCircle } from 'lucide-react';

const TagsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { tags, documents, addTag, updateTag, deleteTag } = useDocuments();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<{ id: string; name: string; color: string } | null>(null);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');
  const [error, setError] = useState('');

  const predefinedColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e'
  ];

  const handleCreateTag = () => {
    setError('');
    
    if (!newTagName.trim()) {
      setError('Please enter a tag name');
      return;
    }

    if (tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase())) {
      setError('A tag with this name already exists');
      return;
    }

    addTag({
      id: `tag-${Date.now()}`,
      name: newTagName.trim(),
      color: newTagColor
    });

    setNewTagName('');
    setNewTagColor('#3b82f6');
    setIsCreateDialogOpen(false);
  };

  const handleEditTag = () => {
    if (!editingTag) return;
    
    setError('');
    
    if (!editingTag.name.trim()) {
      setError('Please enter a tag name');
      return;
    }

    if (tags.some(t => t.id !== editingTag.id && t.name.toLowerCase() === editingTag.name.trim().toLowerCase())) {
      setError('A tag with this name already exists');
      return;
    }

    updateTag(editingTag.id, {
      name: editingTag.name.trim(),
      color: editingTag.color
    });

    setEditingTag(null);
    setIsEditDialogOpen(false);
  };

  const handleDeleteTag = (tagId: string) => {
    if (window.confirm('Are you sure you want to delete this tag? It will be removed from all documents.')) {
      deleteTag(tagId);
    }
  };

  const getTagDocumentCount = (tagId: string) => {
    return documents.filter(doc => doc.tags.includes(tagId)).length;
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Manage Tags</h1>
              <p className="text-muted-foreground mt-1">
                Create and organize tags for your documents
              </p>
            </div>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tag</DialogTitle>
                <DialogDescription>
                  Add a new tag to organize your documents
                </DialogDescription>
              </DialogHeader>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tag-name">Tag Name</Label>
                  <Input
                    id="tag-name"
                    placeholder="Enter tag name"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tag Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          newTagColor === color ? 'border-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setNewTagColor(color)}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTag}>Create Tag</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tags List */}
        {tags.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <TagIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tags Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first tag to start organizing documents
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Tag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tags.map((tag) => {
              const docCount = getTagDocumentCount(tag.id);
              return (
                <Card key={tag.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1">
                        <div
                          className="h-4 w-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        <CardTitle className="text-lg">{tag.name}</CardTitle>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingTag(tag);
                            setIsEditDialogOpen(true);
                            setError('');
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTag(tag.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription>
                      {docCount} {docCount === 1 ? 'document' : 'documents'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => navigate(`/tag/${tag.id}`)}
                    >
                      View Documents
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Edit Tag Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>
                Update tag name and color
              </DialogDescription>
            </DialogHeader>
            
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {editingTag && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-tag-name">Tag Name</Label>
                  <Input
                    id="edit-tag-name"
                    placeholder="Enter tag name"
                    value={editingTag.name}
                    onChange={(e) => setEditingTag({ ...editingTag, name: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Tag Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {predefinedColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`h-8 w-8 rounded-full border-2 transition-all ${
                          editingTag.color === color ? 'border-primary scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => setEditingTag({ ...editingTag, color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditTag}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default TagsManagement;