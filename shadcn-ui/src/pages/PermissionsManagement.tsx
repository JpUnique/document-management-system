import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDocuments } from '@/context/DocumentContext';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ArrowLeft, UserPlus, Trash2, Shield, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';

const PermissionsManagement: React.FC = () => {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { documents, updateDocument } = useDocuments();
  const { currentUser } = useAuth();
  
  const document = documents.find(d => d.id === documentId);
  
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPermission, setNewUserPermission] = useState<'view' | 'edit'>('view');
  
  if (!document) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Document not found</h2>
          <Button asChild>
            <Link to="/documents">Go to Documents</Link>
          </Button>
        </div>
      </MainLayout>
    );
  }
  
  const handleAddUser = async () => {
    if (!newUserEmail.trim()) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    // Check if user already has permissions
    const hasViewPermission = document.permissions.viewUsers.includes(newUserEmail);
    const hasEditPermission = document.permissions.editUsers.includes(newUserEmail);
    
    if (hasViewPermission || hasEditPermission) {
      toast.error('User already has permissions for this document');
      return;
    }
    
    const updatedPermissions = { ...document.permissions };
    
    if (newUserPermission === 'view') {
      updatedPermissions.viewUsers = [...updatedPermissions.viewUsers, newUserEmail];
    } else {
      updatedPermissions.editUsers = [...updatedPermissions.editUsers, newUserEmail];
      // Edit permission includes view permission
      if (!updatedPermissions.viewUsers.includes(newUserEmail)) {
        updatedPermissions.viewUsers = [...updatedPermissions.viewUsers, newUserEmail];
      }
    }
    
    await updateDocument(document.id, { permissions: updatedPermissions });
    setNewUserEmail('');
    toast.success(`Added ${newUserPermission} permission for ${newUserEmail}`);
  };
  
  const handleRemoveUser = async (email: string) => {
    const updatedPermissions = {
      viewUsers: document.permissions.viewUsers.filter(u => u !== email),
      editUsers: document.permissions.editUsers.filter(u => u !== email)
    };
    
    await updateDocument(document.id, { permissions: updatedPermissions });
    toast.success(`Removed permissions for ${email}`);
  };
  
  const handleChangePermission = async (email: string, permission: 'view' | 'edit') => {
    const updatedPermissions = { ...document.permissions };
    
    if (permission === 'view') {
      // Remove from edit, keep in view
      updatedPermissions.editUsers = updatedPermissions.editUsers.filter(u => u !== email);
      if (!updatedPermissions.viewUsers.includes(email)) {
        updatedPermissions.viewUsers = [...updatedPermissions.viewUsers, email];
      }
    } else {
      // Add to edit, ensure in view
      if (!updatedPermissions.editUsers.includes(email)) {
        updatedPermissions.editUsers = [...updatedPermissions.editUsers, email];
      }
      if (!updatedPermissions.viewUsers.includes(email)) {
        updatedPermissions.viewUsers = [...updatedPermissions.viewUsers, email];
      }
    }
    
    await updateDocument(document.id, { permissions: updatedPermissions });
    toast.success(`Updated permission for ${email}`);
  };
  
  // Get all unique users with their highest permission level
  const allUsers = Array.from(
    new Set([...document.permissions.viewUsers, ...document.permissions.editUsers])
  ).map(email => ({
    email,
    permission: document.permissions.editUsers.includes(email) ? 'edit' : 'view'
  }));
  
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate(`/documents/${documentId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Document
          </Button>
        </div>
        
        <div>
          <h1 className="text-2xl font-bold">Permissions Management</h1>
          <p className="text-muted-foreground">
            Manage who can view and edit "{document.name}"
          </p>
        </div>
        
        {/* Add User Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Add User Permission
            </CardTitle>
            <CardDescription>
              Grant view or edit access to users by email address
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
              <div className="space-y-2">
                <Label htmlFor="user-email">User Email</Label>
                <Input
                  id="user-email"
                  type="email"
                  placeholder="user@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddUser();
                    }
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="permission-type">Permission</Label>
                <Select 
                  value={newUserPermission} 
                  onValueChange={(value: 'view' | 'edit') => setNewUserPermission(value)}
                >
                  <SelectTrigger id="permission-type" className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="view">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        View
                      </div>
                    </SelectItem>
                    <SelectItem value="edit">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4" />
                        Edit
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-end">
                <Button onClick={handleAddUser}>
                  Add User
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Current Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Current Permissions
            </CardTitle>
            <CardDescription>
              Users who have access to this document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allUsers.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Permission Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((user) => (
                    <TableRow key={user.email}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Select
                          value={user.permission}
                          onValueChange={(value: 'view' | 'edit') => 
                            handleChangePermission(user.email, value)
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">
                              <div className="flex items-center gap-2">
                                <Eye className="h-4 w-4" />
                                View
                              </div>
                            </SelectItem>
                            <SelectItem value="edit">
                              <div className="flex items-center gap-2">
                                <Edit className="h-4 w-4" />
                                Edit
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.email)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No users have been granted permissions yet</p>
                <p className="text-sm mt-1">Add users above to share this document</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Permission Info */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Levels</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <Eye className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium">View Permission</p>
                <p className="text-sm text-muted-foreground">
                  Users can view and download the document, but cannot make changes
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Edit className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium">Edit Permission</p>
                <p className="text-sm text-muted-foreground">
                  Users can view, download, and modify document properties (includes view permission)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PermissionsManagement;