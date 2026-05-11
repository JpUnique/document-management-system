import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/types/document';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (user: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'docmanager_auth';
const USERS_STORAGE_KEY = 'docmanager_users';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize with demo data if no users exist
  useEffect(() => {
    const initializeUsers = () => {
      try {
        console.log('AuthContext: Initializing users');
        
        // Check if localStorage is available
        if (typeof localStorage === 'undefined') {
          console.error('localStorage is not available');
          return;
        }
        
        // FORCE RESET: Always recreate admin user for testing
        const adminUser: User = {
          id: 'admin-1',
          name: 'Admin',
          email: 'admin',
          password: 'PdAdmin',
          role: 'admin',
          createdAt: new Date().toISOString()
        };
        
        console.log('AuthContext: Force creating admin user', adminUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([adminUser]));
        console.log('AuthContext: Admin user created successfully');
        console.log('AuthContext: Login with username: admin, password: PdAdmin');
      } catch (error) {
        console.error('AuthContext: Error initializing users:', error);
      }
    };
    
    initializeUsers();
  }, []);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEY);
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      console.log('=== AUTHCONTEXT LOGIN ===');
      console.log('AuthContext: Starting login process');
      console.log('AuthContext: Received email:', email);
      console.log('AuthContext: Received password:', password);
      console.log('AuthContext: Email type:', typeof email);
      console.log('AuthContext: Password type:', typeof password);
      
      // Check if localStorage is available
      if (typeof localStorage === 'undefined') {
        console.error('localStorage is not available');
        return false;
      }
      
      // In a real app, this would be an API call
      const usersStr = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
      console.log('AuthContext: Retrieved users from storage', usersStr);
      
      const users: User[] = JSON.parse(usersStr);
      console.log('AuthContext: Parsed users', users);
      console.log('AuthContext: Number of users:', users.length);
      
      // Log each user for debugging
      users.forEach((u, index) => {
        console.log(`User ${index}:`, {
          id: u.id,
          email: u.email,
          password: u.password,
          role: u.role,
          emailMatch: u.email === email,
          passwordMatch: u.password === password
        });
      });
      
      // Find user by email (username)
      const user = users.find(u => u.email === email);
      console.log('AuthContext: Found user:', user);
      
      // Check password
      if (user && user.password === password) {
        console.log('AuthContext: Password matches! Setting current user');
        setCurrentUser(user);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
        console.log('AuthContext: Login successful');
        return true;
      }
      
      console.log('AuthContext: Invalid credentials');
      console.log('AuthContext: User found?', !!user);
      if (user) {
        console.log('AuthContext: Expected password:', user.password);
        console.log('AuthContext: Received password:', password);
        console.log('AuthContext: Passwords match?', user.password === password);
      }
      return false;
    } catch (error) {
      console.error('AuthContext: Login failed with error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      const usersStr = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
      const users: User[] = JSON.parse(usersStr);
      
      // Check if email already exists
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return false;
      }
      
      // Create new user with password
      const newUser: User = {
        id: `user-${Date.now()}`,
        name,
        email,
        password: password,
        role: 'viewer', // Default role for new users
        createdAt: new Date().toISOString()
      };
      
      // Update storage
      users.push(newUser);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      
      // Auto login the new user
      setCurrentUser(newUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
      
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;
    
    try {
      const usersStr = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
      const users: User[] = JSON.parse(usersStr);
      
      const updatedUsers = users.map(user => {
        if (user.id === currentUser.id) {
          return { ...user, ...userData };
        }
        return user;
      });
      
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
      
      const updatedUser = { ...currentUser, ...userData };
      setCurrentUser(updatedUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Profile update failed:', error);
      return false;
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};