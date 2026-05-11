import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useDocuments } from '@/context/DocumentContext';
import { useShare } from '@/context/ShareContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Share2, Copy, Mail, Link2, Clock, Eye, Edit, Trash2, 
  Users, Globe, Lock, CheckCircle2, XCircle 
} from 'lucide-react';
import { format } from 'date-fns';

const DocumentShare = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { documents } = useDocuments();
  const { createShare, getDocumentShares, revokeShare, updateSharePermission, toggleShareStatus } = useShare();

  const [shareType, setShareType] = useState<'public' | 'private'>('public');
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresInDays, setExpiresInDays] = useState<string>('7');
  const [hasExpiration, setHasExpiration] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const document = documents.find(doc => doc.id === documentId);
  const documentShares = documentId ? getDocumentShares(documentId) : [];

  useEffect(() => {
    if (!document) {
      toast.error('Document not found');
      navigate('/documents');
    }
  }, [document, navigate]);

  if (!document) return null;

  const handleCreateShare = async () => {
    if (!documentId) return;

    if (shareType === 'private' && !recipientEmail) {
      toast.error('Please enter recipient email for private sharing');
      return;
    }

    setIsCreating(true);
    try {
      const newShare = await createShare(
        documentId,
        document.name,
        shareType,
        permission,
        shareType === 'private' ? recipientEmail : undefined,
        hasExpiration ? parseInt(expiresInDays) : undefined
      );

      // Copy link to clipboard
      await navigator.clipboard.writeText(newShare.shareLink);
      toast.success('Share link copied to clipboard!');

      // Reset form
      setRecipientEmail('');
      setShareType('public');
      setPermission('view');
    } catch (error) {
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyLink = async (shareLink: string) => {
    try {
      await navigator.clipboard.writeText(shareLink);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  const handleRevokeShare = async (shareId: string) => {
    if (confirm('Are you sure you want to revoke this share link?')) {
      await revokeShare(shareId);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Share Document</h1>
            <p className="text-muted-foreground mt-1">
              Share "{document.name}" with others
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate(`/documents/${documentId}`)}>
            Back to Document
          </Button>
        </div>

        {/* Create New Share */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Create Share Link
            </CardTitle>
            <CardDescription>
              Generate a new share link for this document
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Share Type */}
            <div className="space-y-2">
              <Label>Share Type</Label>
              <Select value={shareType} onValueChange={(value: 'public' | 'private') => setShareType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>Public - Anyone with link</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Private - Specific person</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recipient Email (for private shares) */}
            {shareType === 'private' && (
              <div className="space-y-2">
                <Label htmlFor="recipient">Recipient Email</Label>
                <div className="flex gap-2">
                  <Mail className="h-4 w-4 mt-3 text-muted-foreground" />
                  <Input
                    id="recipient"
                    type="email"
                    placeholder="user@example.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Permission Level */}
            <div className="space-y-2">
              <Label>Permission Level</Label>
              <Select value={permission} onValueChange={(value: 'view' | 'edit') => setPermission(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>View Only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="edit">
                    <div className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      <span>Can Edit</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Link Expiration</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={hasExpiration}
                    onCheckedChange={setHasExpiration}
                  />
                  <span className="text-sm text-muted-foreground">
                    {hasExpiration ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
              
              {hasExpiration && (
                <Select value={expiresInDays} onValueChange={setExpiresInDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 day</SelectItem>
                    <SelectItem value="7">7 days</SelectItem>
                    <SelectItem value="14">14 days</SelectItem>
                    <SelectItem value="30">30 days</SelectItem>
                    <SelectItem value="90">90 days</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <Button 
              onClick={handleCreateShare} 
              disabled={isCreating}
              className="w-full"
            >
              <Link2 className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Share Link'}
            </Button>
          </CardContent>
        </Card>

        {/* Active Shares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Shares ({documentShares.length})
            </CardTitle>
            <CardDescription>
              Manage existing share links for this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {documentShares.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Share2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No active shares yet</p>
                <p className="text-sm">Create a share link to get started</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documentShares.map((share) => (
                  <div key={share.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          {share.shareType === 'public' ? (
                            <Globe className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Lock className="h-4 w-4 text-amber-500" />
                          )}
                          <span className="font-medium">
                            {share.shareType === 'public' ? 'Public Link' : `Shared with ${share.sharedWith}`}
                          </span>
                          <Badge variant={share.isActive ? 'default' : 'secondary'}>
                            {share.isActive ? (
                              <>
                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                          <Badge variant="outline">
                            {share.permission === 'view' ? (
                              <>
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </>
                            ) : (
                              <>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>
                              Created {format(new Date(share.createdAt), 'MMM d, yyyy')}
                              {share.expiresAt && ` • Expires ${format(new Date(share.expiresAt), 'MMM d, yyyy')}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-3 w-3" />
                            <span>{share.accessCount} views</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(share.shareLink)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleShareStatus(share.id)}
                        >
                          {share.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeShare(share.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div className="bg-muted p-2 rounded text-sm font-mono break-all">
                      {share.shareLink}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default DocumentShare;