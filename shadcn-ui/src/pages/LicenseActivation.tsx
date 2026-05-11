/**
 * License Activation Page
 * Allows users to activate their license key
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLicense } from '@/context/LicenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Key } from 'lucide-react';
import { BRANDING, getLogoUrl } from '@/config/branding';

const LicenseActivation: React.FC = () => {
  const navigate = useNavigate();
  const { activateLicenseKey } = useLicense();
  
  const [licenseKey, setLicenseKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!licenseKey.trim()) {
      setError('Please enter a license key');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await activateLicenseKey(licenseKey.trim());
      
      if (result.isValid) {
        setSuccess(`License activated successfully! Valid for ${result.daysRemaining} days.`);
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.error || 'Failed to activate license');
      }
    } catch (err) {
      setError('An error occurred during activation');
    } finally {
      setIsLoading(false);
    }
  };

  const formatLicenseKey = (value: string) => {
    // Remove all non-alphanumeric characters
    const cleaned = value.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    // Add hyphens every 6 characters
    const formatted = cleaned.match(/.{1,6}/g)?.join('-') || cleaned;
    
    return formatted;
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatLicenseKey(e.target.value);
    setLicenseKey(formatted);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and title */}
        <div className="text-center">
          <div className="flex justify-center">
            <img 
              src={getLogoUrl()} 
              alt={BRANDING.logo.alt} 
              className="h-16 w-16" 
            />
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">{BRANDING.appName}</h2>
          <p className="mt-1 text-sm text-gray-500">License Activation</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Activate Your License
            </CardTitle>
            <CardDescription>
              Enter your 24-character license key to activate the application
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleActivate}>
            <CardContent className="space-y-4">
              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Success message */}
              {success && (
                <Alert className="border-green-500 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="licenseKey">License Key</Label>
                <Input
                  id="licenseKey"
                  type="text"
                  placeholder="XXXXXX-XXXXXX-XXXXXX-XXXXXX"
                  value={licenseKey}
                  onChange={handleKeyChange}
                  maxLength={29} // 24 chars + 4 hyphens
                  className="font-mono text-center text-lg tracking-wider"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter the license key provided by your administrator
                </p>
              </div>
              
              <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
                <p className="font-medium mb-1">License Key Format:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>24 characters long (excluding hyphens)</li>
                  <li>Format: XXXXXX-XXXXXX-XXXXXX-XXXXXX</li>
                  <li>Case-insensitive</li>
                </ul>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || success !== ''}
              >
                {isLoading ? 'Activating...' : success ? 'Redirecting...' : 'Activate License'}
              </Button>
              
              <div className="text-center text-sm text-muted-foreground">
                Need a license key? Contact your administrator
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default LicenseActivation;