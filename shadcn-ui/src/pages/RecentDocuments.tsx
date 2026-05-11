import React from 'react';
import { Link } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { Document } from '@/types/document';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, FileText } from 'lucide-react';

// Document card component
const DocumentCard: React.FC<{ doc: Document }> = ({ doc }) => {
  const fileTypeIcons: Record<string, React.ReactNode> = {
    'pdf': <FileText className="h-10 w-10 text-red-500" />,
    'doc': <FileText className="h-10 w-10 text-blue-500" />,
    'docx': <FileText className="h-10 w-10 text-blue-500" />,
    'xls': <FileText className="h-10 w-10 text-green-500" />,
    'xlsx': <FileText className="h-10 w-10 text-green-500" />,
    'ppt': <FileText className="h-10 w-10 text-orange-500" />,
    'pptx': <FileText className="h-10 w-10 text-orange-500" />,
    'txt': <FileText className="h-10 w-10 text-gray-500" />,
    'default': <FileText className="h-10 w-10 text-gray-500" />
  };

  const icon = fileTypeIcons[doc.type] || fileTypeIcons.default;
  const formattedDate = new Date(doc.uploadDate).toLocaleDateString();

  return (
    <Link to={`/documents/${doc.id}`}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            {icon}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm truncate">{doc.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">
                {formattedDate} • {(doc.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <div className="flex gap-2 mt-2">
                {doc.tags.map(tagId => (
                  <span 
                    key={tagId} 
                    className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                  >
                    {tagId}
                  </span>
                ))}
              </div>
            </div>
            {doc.status === 'processing' && (
              <div className="flex items-center">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const RecentDocuments: React.FC = () => {
  const { documents } = useDocuments();

  // Get recent documents (sorted by upload date, most recent first)
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime())
    .slice(0, 20); // Show last 20 documents

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Clock className="h-8 w-8" />
              Recent Documents
            </h1>
            <p className="text-muted-foreground mt-1">
              Your most recently uploaded documents
            </p>
          </div>
          <Button asChild>
            <Link to="/documents/new">Upload New Document</Link>
          </Button>
        </div>

        {/* Documents grid */}
        {recentDocuments.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {recentDocuments.map(doc => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No recent documents</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Upload a document to see it here
              </p>
              <Button asChild>
                <Link to="/documents/new">Upload Document</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default RecentDocuments;