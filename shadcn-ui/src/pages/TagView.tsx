import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User } from 'lucide-react';

const TagView: React.FC = () => {
  const { tagId } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { documents, tags } = useDocuments();

  const tag = tags.find(t => t.id === tagId);
  const taggedDocuments = documents.filter(doc => doc.tags.includes(tagId || ''));

  if (!tag) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Tag Not Found</h2>
          <p className="text-muted-foreground mb-4">The tag you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/documents')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Documents
          </Button>
        </div>
      </MainLayout>
    );
  }

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
              <div className="flex items-center gap-2">
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <h1 className="text-3xl font-bold">{tag.name}</h1>
              </div>
              <p className="text-muted-foreground mt-1">
                {taggedDocuments.length} {taggedDocuments.length === 1 ? 'document' : 'documents'} with this tag
              </p>
            </div>
          </div>
          <Button onClick={() => navigate('/tags/manage')}>
            Manage Tags
          </Button>
        </div>

        {/* Documents List */}
        {taggedDocuments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Documents Found</h3>
              <p className="text-muted-foreground mb-4">
                There are no documents with this tag yet.
              </p>
              <Button onClick={() => navigate('/documents/new')}>
                Upload Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {taggedDocuments.map((doc) => (
              <Card
                key={doc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {doc.name}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        {doc.description || 'No description'}
                      </CardDescription>
                    </div>
                    <Badge variant={doc.status === 'approved' ? 'default' : 'secondary'}>
                      {doc.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{doc.uploadedBy}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {doc.tags.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      {doc.tags.map(tagId => {
                        const docTag = tags.find(t => t.id === tagId);
                        if (!docTag) return null;
                        return (
                          <Badge
                            key={tagId}
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: docTag.color }}
                            />
                            {docTag.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default TagView;