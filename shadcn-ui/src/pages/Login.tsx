import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useLicense } from '@/context/LicenseContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';
import { BRANDING, getLogoUrl } from '@/config/branding';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { isLicenseValid, validation } = useLicense();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');
  
  // Initialize admin user on component mount
  useEffect(() => {
    const initAdmin = () => {
      try {
        const USERS_KEY = 'docmanager_users';
        const existingUsers = localStorage.getItem(USERS_KEY);
        
        // Always ensure admin user exists
        const adminUser = {
          id: 'admin-1',
          name: 'Admin',
          email: 'admin',
          password: 'PdAdmin',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        
        if (!existingUsers) {
          localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
          console.log('✅ Admin user created');
        } else {
          const users = JSON.parse(existingUsers);
          const hasAdmin = users.some((u: { email: string }) => u.email === 'admin');
          if (!hasAdmin) {
            users.push(adminUser);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            console.log('✅ Admin user added to existing users');
          }
        }
      } catch (error) {
        console.error('Failed to initialize admin:', error);
      }
    };
    
    initAdmin();
  }, []);
  
  const testDirectLogin = () => {
    const usersStr = localStorage.getItem('docmanager_users') || '[]';
    const users = JSON.parse(usersStr);
    
    let info = '=== DEBUG INFO ===\n';
    info += `Total users: ${users.length}\n\n`;
    
    users.forEach((user: { email: string; password: string; role: string }, index: number) => {
      info += `User ${index + 1}:\n`;
      info += `  Username: "${user.email}"\n`;
      info += `  Password: "${user.password}"\n`;
      info += `  Role: ${user.role}\n\n`;
    });
    
    info += `Your input:\n`;
    info += `  Username: "${username}"\n`;
    info += `  Password: "${password}"\n\n`;
    
    const matchingUser = users.find((u: { email: string; password: string }) => 
      u.email === username && u.password === password
    );
    
    if (matchingUser) {
      info += '✅ CREDENTIALS MATCH!\n';
      info += 'You can login with these credentials.';
    } else {
      info += '❌ NO MATCH\n';
      const userExists = users.find((u: { email: string }) => u.email === username);
      if (userExists) {
        info += `Username exists but password is wrong.\n`;
        info += `Expected: "${userExists.password}"`;
      } else {
        info += `Username "${username}" not found.`;
      }
    }
    
    setDebugInfo(info);
    alert(info);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDebugInfo('');
    
    const trimmedUsername = username.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedUsername || !trimmedPassword) {
      setError('Please enter both username and password');
      return;
    }
    
    // License check temporarily disabled for debugging
    // if (!isLicenseValid) {
    //   setError('No valid license found. Please activate your license first.');
    //   return;
    // }
    
    setIsLoading(true);
    
    try {
      console.log('🔐 Attempting login with:', { username: trimmedUsername });
      const success = await login(trimmedUsername, trimmedPassword);
      
      if (success) {
        console.log('✅ Login successful, navigating to dashboard');
        navigate('/');
      } else {
        console.log('❌ Login failed');
        setError('Invalid username or password. Default credentials: admin / PdAdmin');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('An error occurred during login.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and title */}
        <div className="text-center">
          <div className="flex justify-center">
            <img src="/assets/images/logo.png" alt="DocManager Logo" className="h-16 w-16" />
          </div>
          <h2 className="mt-2 text-3xl font-bold text-gray-900">DocManager</h2>
          <p className="mt-1 text-sm text-gray-500">Document management made simple</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Login to your account</CardTitle>
            <CardDescription>
              Enter your credentials to access your documents
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {/* License warning - Temporarily disabled */}
              {/* {!isLicenseValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {validation?.error || 'No valid license found.'}
                    <Link to="/activate-license" className="block mt-2 underline font-medium">
                      Click here to activate your license
                    </Link>
                  </AlertDescription>
                </Alert>
              )} */}
              
              {/* Error message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {/* Debug info */}
              {debugInfo && (
                <Alert>
                  <AlertDescription>
                    <pre className="text-xs whitespace-pre-wrap">{debugInfo}</pre>
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Default credentials hint */}
              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Default Login:</strong> admin / PdAdmin
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
              
              {/* License activation button - Temporarily hidden */}
              {/* {!isLicenseValid && (
                <Button 
                  type="button"
                  variant="outline"
                  className="w-full" 
                  asChild
                >
                  <Link to="/activate-license">
                    Activate License
                  </Link>
                </Button>
              )} */}
              
              <Button 
                type="button"
                variant="outline"
                className="w-full" 
                onClick={testDirectLogin}
              >
                🔍 Test Login (Debug)
              </Button>
              
              <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:underline">
                  Create an account
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;