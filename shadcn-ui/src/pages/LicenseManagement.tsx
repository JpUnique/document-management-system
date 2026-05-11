/**
 * License Management Page (Admin Only)
 * Allows super admins to generate and manage license keys
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, Key, Copy, Plus, Trash2 } from 'lucide-react';
import { generateLicense, saveLicenseToDatabase, getAllLicenses, revokeLicense } from '@/lib/licenseManager';
import { License } from '@/types/license';

const LicenseManagement: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [licenses, setLicenses] = useState<License[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLicense, setNewLicense] = useState({
    clientName: '',
    email: '',
    durationYears: 1,
  });
  const [generatedKey, setGeneratedKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Load licenses
  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = () => {
    const allLicenses = getAllLicenses();
    setLicenses(allLicenses);
  };

  const handleGenerateLicense = () => {
    setError('');
    setSuccess('');
    
    console.log('🎯 Generate License button clicked');
    console.log('  Client Name:', newLicense.clientName);
    console.log('  Email:', newLicense.email);
    console.log('  Duration:', newLicense.durationYears);
    
    if (!newLicense.clientName.trim() || !newLicense.email.trim()) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      console.log('📝 Generating license...');
      const license = generateLicense({
        clientName: newLicense.clientName,
        email: newLicense.email,
        durationYears: newLicense.durationYears,
      });
      
      console.log('✅ License object created:', license);
      console.log('  License key:', license.key);
      
      console.log('💾 Calling saveLicenseToDatabase...');
      saveLicenseToDatabase(license);
      console.log('✅ saveLicenseToDatabase completed');
      
      // Verify it was saved
      const allLicenses = getAllLicenses();
      console.log('🔍 Verification - Total licenses after save:', allLicenses.length);
      allLicenses.forEach((lic, idx) => {
        console.log(`  License ${idx + 1}: ${lic.key} (${lic.clientName})`);
      });
      
      setGeneratedKey(license.key);
      setSuccess(`License generated successfully for ${newLicense.clientName}`);
      
      // Reset form
      setNewLicense({
        clientName: '',
        email: '',
        durationYears: 1,
      });
      
      // Reload licenses
      loadLicenses();
    } catch (err) {
      console.error('❌ Error generating license:', err);
      setError('Failed to generate license: ' + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setSuccess('License key copied to clipboard!');
    setTimeout(() => setSuccess(''), 2000);
  };

  const handleRevokeLicense = (key: string) => {
    if (window.confirm('Are you sure you want to revoke this license?')) {
      const success = revokeLicense(key);
      if (success) {
        setSuccess('License revoked successfully');
        loadLicenses();
      } else {
        setError('Failed to revoke license');
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'revoked':
        return <Badge variant="secondary">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">License Management</h1>
        <p className="text-muted-foreground">Generate and manage license keys for clients</p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-4 border-green-500 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Generate License Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mb-6">
            <Plus className="mr-2 h-4 w-4" />
            Generate New License
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate New License</DialogTitle>
            <DialogDescription>
              Create a new license key for a client
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                placeholder="Company or Individual Name"
                value={newLicense.clientName}
                onChange={(e) => setNewLicense({ ...newLicense, clientName: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="client@example.com"
                value={newLicense.email}
                onChange={(e) => setNewLicense({ ...newLicense, email: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">License Duration</Label>
              <Select
                value={newLicense.durationYears.toString()}
                onValueChange={(value) => setNewLicense({ ...newLicense, durationYears: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Year</SelectItem>
                  <SelectItem value="2">2 Years</SelectItem>
                  <SelectItem value="3">3 Years</SelectItem>
                  <SelectItem value="5">5 Years</SelectItem>
                  <SelectItem value="10">10 Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {generatedKey && (
              <div className="space-y-2">
                <Label>Generated License Key</Label>
                <div className="flex gap-2">
                  <Input
                    value={generatedKey}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopyKey(generatedKey)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setGeneratedKey('');
                setError('');
                setSuccess('');
              }}
            >
              Close
            </Button>
            <Button onClick={handleGenerateLicense}>
              <Key className="mr-2 h-4 w-4" />
              Generate License
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Licenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Licenses</CardTitle>
          <CardDescription>
            Total: {licenses.length} license{licenses.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>License Key</TableHead>
                <TableHead>Issued Date</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No licenses generated yet
                  </TableCell>
                </TableRow>
              ) : (
                licenses.map((license) => (
                  <TableRow key={license.key}>
                    <TableCell className="font-medium">{license.clientName}</TableCell>
                    <TableCell>{license.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {license.key}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleCopyKey(license.key)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(license.issuedDate)}</TableCell>
                    <TableCell>{formatDate(license.expiryDate)}</TableCell>
                    <TableCell>{getStatusBadge(license.status)}</TableCell>
                    <TableCell>
                      {license.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleRevokeLicense(license.key)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseManagement;