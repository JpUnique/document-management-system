import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, AlertCircle, CheckCircle2, Shield, Smartphone, Key, Copy, Check } from 'lucide-react';

const TwoFactorAuth: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [step, setStep] = useState<'setup' | 'verify' | 'complete'>('setup');
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Demo secret key for QR code
  const secretKey = 'JBSWY3DPEHPK3PXP';
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/DocManager:${currentUser?.email}?secret=${secretKey}&issuer=DocManager`;

  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const generateBackupCodes = (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 8; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  };

  const handleEnable2FA = () => {
    setError('');
    setStep('verify');
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsProcessing(true);

    try {
      // Simulate verification delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, verify the code with the server
      // For demo, accept any 6-digit code
      if (verificationCode.length === 6 && /^\d+$/.test(verificationCode)) {
        const codes = generateBackupCodes();
        setBackupCodes(codes);
        setIsEnabled(true);
        setStep('complete');
        setSuccess('Two-factor authentication has been enabled successfully!');
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err) {
      setError('Failed to verify code. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
      return;
    }

    setIsProcessing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsEnabled(false);
      setStep('setup');
      setVerificationCode('');
      setBackupCodes([]);
      setSuccess('Two-factor authentication has been disabled.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to disable 2FA. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyAllBackupCodes = () => {
    const allCodes = backupCodes.join('\n');
    navigator.clipboard.writeText(allCodes);
    setCopiedCode('all');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold">Two-Factor Authentication</h1>
              {isEnabled && (
                <Badge className="bg-green-500 hover:bg-green-600">
                  <Shield className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Add an extra layer of security to your account
            </p>
          </div>
        </div>

        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isEnabled && step === 'setup' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>What is Two-Factor Authentication?</CardTitle>
                <CardDescription>
                  2FA adds an extra layer of security by requiring a code from your phone in addition to your password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Enhanced Security</h4>
                    <p className="text-sm text-muted-foreground">
                      Protect your account even if your password is compromised
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Authenticator App</h4>
                    <p className="text-sm text-muted-foreground">
                      Use apps like Google Authenticator or Authy to generate codes
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Key className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium">Backup Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive backup codes to access your account if you lose your device
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleEnable2FA} className="w-full">
                  Enable Two-Factor Authentication
                </Button>
              </CardFooter>
            </Card>
          </>
        )}

        {!isEnabled && step === 'verify' && (
          <Card>
            <CardHeader>
              <CardTitle>Set Up Authenticator App</CardTitle>
              <CardDescription>
                Scan the QR code with your authenticator app
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border">
                  <img src={qrCodeUrl} alt="QR Code" className="h-48 w-48" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Can't scan the QR code? Enter this key manually:
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <code className="px-3 py-1 bg-muted rounded text-sm font-mono">
                      {secretKey}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => copyToClipboard(secretKey)}
                    >
                      {copiedCode === secretKey ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep('setup')}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" disabled={isProcessing} className="flex-1">
                    {isProcessing ? 'Verifying...' : 'Verify & Enable'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isEnabled && step === 'complete' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  2FA Successfully Enabled
                </CardTitle>
                <CardDescription>
                  Save your backup codes in a secure location
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Important:</strong> Save these backup codes in a secure place. You can use them to access your account if you lose your authenticator device.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Backup Codes</Label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={copyAllBackupCodes}
                    >
                      {copiedCode === 'all' ? (
                        <>
                          <Check className="h-4 w-4 mr-2 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg">
                    {backupCodes.map((code, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-background rounded border"
                      >
                        <code className="text-sm font-mono">{code}</code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => copyToClipboard(code)}
                        >
                          {copiedCode === code ? (
                            <Check className="h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={() => navigate('/profile')} className="w-full">
                  Done
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manage 2FA</CardTitle>
                <CardDescription>
                  Disable two-factor authentication if needed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                  <div>
                    <h4 className="font-medium text-destructive">Disable 2FA</h4>
                    <p className="text-sm text-muted-foreground">
                      Remove two-factor authentication from your account
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={handleDisable2FA}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Disabling...' : 'Disable'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {isEnabled && step === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                2FA is Active
              </CardTitle>
              <CardDescription>
                Your account is protected with two-factor authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  Two-factor authentication is currently enabled on your account
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/50">
                <div>
                  <h4 className="font-medium text-destructive">Disable 2FA</h4>
                  <p className="text-sm text-muted-foreground">
                    Remove two-factor authentication from your account
                  </p>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleDisable2FA}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Disabling...' : 'Disable'}
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" onClick={() => navigate('/profile')} className="w-full">
                Back to Profile
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};

export default TwoFactorAuth;