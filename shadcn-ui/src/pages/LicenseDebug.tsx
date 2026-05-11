/**
 * License Debug Page
 * Helps diagnose license activation issues
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { getAllLicenses } from '@/lib/licenseManager';

const LicenseDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState('');

  const runDebug = () => {
    try {
      const licenses = getAllLicenses();
      
      let info = '=== LICENSE DATABASE DEBUG ===\n\n';
      info += `Total licenses in database: ${licenses.length}\n\n`;
      
      if (licenses.length === 0) {
        info += '❌ NO LICENSES FOUND IN DATABASE\n';
        info += 'Please generate a license first from License Management page.\n';
      } else {
        licenses.forEach((lic, idx) => {
          info += `License ${idx + 1}:\n`;
          info += `  Key: "${lic.key}"\n`;
          info += `  Key (no hyphens): "${lic.key.replace(/[-\s]/g, '')}"\n`;
          info += `  Key length: ${lic.key.replace(/[-\s]/g, '').length} chars\n`;
          info += `  Client: ${lic.clientName}\n`;
          info += `  Email: ${lic.email}\n`;
          info += `  Status: ${lic.status}\n`;
          info += `  Issued: ${new Date(lic.issuedDate).toLocaleDateString()}\n`;
          info += `  Expires: ${new Date(lic.expiryDate).toLocaleDateString()}\n`;
          info += `  Days remaining: ${Math.ceil((new Date(lic.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}\n`;
          info += '\n';
        });
      }
      
      // Check current activated license
      const currentLicense = localStorage.getItem('docmanager_license');
      info += '=== CURRENT ACTIVATED LICENSE ===\n\n';
      if (currentLicense) {
        const lic = JSON.parse(currentLicense);
        info += `✅ License is activated\n`;
        info += `  Key: "${lic.key}"\n`;
        info += `  Client: ${lic.clientName}\n`;
        info += `  Status: ${lic.status}\n`;
      } else {
        info += '❌ No license currently activated\n';
      }
      
      setDebugInfo(info);
    } catch (error) {
      setDebugInfo(`Error: ${error}`);
    }
  };

  const testActivation = () => {
    const licenses = getAllLicenses();
    if (licenses.length === 0) {
      alert('No licenses in database. Generate one first!');
      return;
    }
    
    const testKey = prompt('Enter license key to test:');
    if (!testKey) return;
    
    const cleanKey = testKey.replace(/[-\s]/g, '').toUpperCase();
    
    let info = '=== ACTIVATION TEST ===\n\n';
    info += `Input key: "${testKey}"\n`;
    info += `Cleaned key: "${cleanKey}"\n`;
    info += `Key length: ${cleanKey.length} chars\n\n`;
    
    const found = licenses.find(l => l.key.replace(/[-\s]/g, '').toUpperCase() === cleanKey);
    
    if (found) {
      info += '✅ LICENSE FOUND IN DATABASE!\n';
      info += `  Matched key: "${found.key}"\n`;
      info += `  Client: ${found.clientName}\n`;
      info += `  Status: ${found.status}\n`;
    } else {
      info += '❌ LICENSE NOT FOUND\n\n';
      info += 'Available keys in database:\n';
      licenses.forEach((lic, idx) => {
        info += `  ${idx + 1}. "${lic.key}" (cleaned: "${lic.key.replace(/[-\s]/g, '')}")\n`;
      });
    }
    
    alert(info);
    setDebugInfo(info);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>License System Debug Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={runDebug}>
              Show All Licenses
            </Button>
            <Button onClick={testActivation} variant="outline">
              Test License Key
            </Button>
          </div>
          
          {debugInfo && (
            <Alert>
              <AlertDescription>
                <pre className="text-xs whitespace-pre-wrap font-mono">
                  {debugInfo}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LicenseDebug;