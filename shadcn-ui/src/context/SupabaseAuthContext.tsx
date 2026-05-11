import React, { createContext, useState, useEffect, useContext } from 'react';
import { User } from '@/types/document';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

interface SupabaseAuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (user: Partial<User>) => Promise<boolean>;
  isSupabaseEnabled: boolean;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | undefined>(undefined);

export const useSupabaseAuthContext = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuthContext must be used within a SupabaseAuthProvider');
  }
  return context;
};

const STORAGE_KEY = 'docmanager_auth';
const USERS_STORAGE_KEY = 'docmanager_users';

export const SupabaseAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabaseAuth = useSupabaseAuth();
  const [localUser, setLocalUser] = useState<User | null>(null);
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  
  // Check if Supabase is configured
  const isSupabaseEnabled = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

  // Initialize with demo data if no users exist (localStorage mode)
  useEffect(() => {
    if (!isSupabaseEnabled) {
      const initializeUsers = () => {
        const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
        if (!existingUsers) {
          const adminUser: User = {
            id: 'admin-1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'admin',
            createdAt: new Date().toISOString()
          };
          
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([adminUser]));
        }
      };
      
      initializeUsers();
    }
  }, [isSupabaseEnabled]);

  // Load user from localStorage on mount (localStorage mode)
  useEffect(() => {
    if (!isSupabaseEnabled) {
      const savedUser = localStorage.getItem(STORAGE_KEY);
      if (savedUser) {
        setLocalUser(JSON.parse(savedUser));
      }
      setIsLocalLoading(false);
    }
  }, [isSupabaseEnabled]);

  // Convert Supabase user to local User type
  const convertSupabaseUser = (supabaseUser: { id: string; full_name: string; email: string; role: string; created_at: string }): User => {
    return {
      id: supabaseUser.id,
      name: supabaseUser.full_name,
      email: supabaseUser.email,
      role: supabaseUser.role.toLowerCase(),
      createdAt: supabaseUser.created_at
    };
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabaseAuth.signIn(email, password);
      return !error && !!data;
    } else {
      // localStorage mode
      setIsLocalLoading(true);
      
      try {
        const usersStr = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
        const users: User[] = JSON.parse(usersStr);
        
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          setLocalUser(user);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          return true;
        }
        
        return false;
      } catch (error) {
        console.error('Login failed:', error);
        return false;
      } finally {
        setIsLocalLoading(false);
      }
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    if (isSupabaseEnabled) {
      const { data, error } = await supabaseAuth.signUp(email, password, name);
      return !error && !!data;
    } else {
      // localStorage mode
      setIsLocalLoading(true);
      
      try {
        const usersStr = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
        const users: User[] = JSON.parse(usersStr);
        
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          return false;
        }
        
        const newUser: User = {
          id: `user-${Date.now()}`,
          name,
          email,
          role: 'viewer',
          createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        
        setLocalUser(newUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
        
        return true;
      } catch (error) {
        console.error('Registration failed:', error);
        return false;
      } finally {
        setIsLocalLoading(false);
      }
    }
  };

  const logout = async () => {
    if (isSupabaseEnabled) {
      await supabaseAuth.signOut();
    } else {
      setLocalUser(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (isSupabaseEnabled) {
      // TODO: Implement Supabase profile update
      return false;
    } else {
      if (!localUser) return false;
      
      try {
        const usersStr = localStorage.getItem(USERS_STORAGE_KEY) || '[]';
        const users: User[] = JSON.parse(usersStr);
        
        const updatedUsers = users.map(user => {
          if (user.id === localUser.id) {
            return { ...user, ...userData };
          }
          return user;
        });
        
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updatedUsers));
        
        const updatedUser = { ...localUser, ...userData };
        setLocalUser(updatedUser);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUser));
        
        return true;
      } catch (error) {
        console.error('Profile update failed:', error);
        return false;
      }
    }
  };

  const currentUser = isSupabaseEnabled 
    ? (supabaseAuth.user ? convertSupabaseUser(supabaseAuth.user) : null)
    : localUser;

  const isLoading = isSupabaseEnabled ? supabaseAuth.loading : isLocalLoading;

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
    isSupabaseEnabled
  };

  return <SupabaseAuthContext.Provider value={value}>{children}</SupabaseAuthContext.Provider>;
};