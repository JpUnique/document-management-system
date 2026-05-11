import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserPermissions, UserCredentials } from '@/types/user';

interface UserManagementContextType {
  users: User[];
  credentials: UserCredentials[];
  isLoading: boolean;
  error: string | null;
  addUser: (user: Omit<User, 'id' | 'createdAt'>, password: string) => Promise<User>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  updateUserPermissions: (userId: string, permissions: Partial<UserPermissions>) => Promise<void>;
  updateUserCredentials: (userId: string, newPassword: string) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  getUserById: (userId: string) => User | undefined;
}

const UserManagementContext = createContext<UserManagementContextType | undefined>(undefined);

const USERS_KEY = 'dms_users';
const CREDENTIALS_KEY = 'dms_credentials';

export const UserManagementProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [credentials, setCredentials] = useState<UserCredentials[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with default admin user
  useEffect(() => {
    const initializeData = () => {
      if (!localStorage.getItem(USERS_KEY)) {
        const defaultUsers: User[] = [
          {
            id: 'user-1',
            email: 'admin@example.com',
            name: 'Admin User',
            role: 'admin',
            department: 'IT',
            permissions: {
              canRead: true,
              canWrite: true,
              canDelete: true,
              canShare: true,
              canManageUsers: true,
              canManagePermissions: true
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          },
          {
            id: 'user-2',
            email: 'john.doe@example.com',
            name: 'John Doe',
            role: 'editor',
            department: 'Marketing',
            permissions: {
              canRead: true,
              canWrite: true,
              canDelete: false,
              canShare: true,
              canManageUsers: false,
              canManagePermissions: false
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          },
          {
            id: 'user-3',
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            role: 'viewer',
            department: 'Sales',
            permissions: {
              canRead: true,
              canWrite: false,
              canDelete: false,
              canShare: false,
              canManageUsers: false,
              canManagePermissions: false
            },
            status: 'active',
            createdAt: new Date().toISOString()
          }
        ];

        const defaultCredentials: UserCredentials[] = [
          {
            userId: 'user-1',
            email: 'admin@example.com',
            password: 'admin123',
            twoFactorEnabled: true,
            lastPasswordChange: new Date().toISOString()
          },
          {
            userId: 'user-2',
            email: 'john.doe@example.com',
            password: 'password123',
            twoFactorEnabled: false,
            lastPasswordChange: new Date().toISOString()
          },
          {
            userId: 'user-3',
            email: 'jane.smith@example.com',
            password: 'password123',
            twoFactorEnabled: false,
            lastPasswordChange: new Date().toISOString()
          }
        ];

        localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers));
        localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(defaultCredentials));
      }
    };

    initializeData();
  }, []);

  // Load data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        setIsLoading(true);
        const loadedUsers = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const loadedCredentials = JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '[]');
        
        setUsers(loadedUsers);
        setCredentials(loadedCredentials);
        setError(null);
      } catch (err) {
        console.error('Failed to load user data:', err);
        setError('Failed to load user data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>, password: string): Promise<User> => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const newCredentials: UserCredentials = {
      userId: newUser.id,
      email: newUser.email,
      password: password,
      twoFactorEnabled: false,
      lastPasswordChange: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    const updatedCredentials = [...credentials, newCredentials];

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));

    setUsers(updatedUsers);
    setCredentials(updatedCredentials);

    return newUser;
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<void> => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, ...updates } : user
    );

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    // Update email in credentials if changed
    if (updates.email) {
      const updatedCredentials = credentials.map(cred =>
        cred.userId === userId ? { ...cred, email: updates.email! } : cred
      );
      localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
      setCredentials(updatedCredentials);
    }
  };

  const deleteUser = async (userId: string): Promise<void> => {
    const updatedUsers = users.filter(user => user.id !== userId);
    const updatedCredentials = credentials.filter(cred => cred.userId !== userId);

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));

    setUsers(updatedUsers);
    setCredentials(updatedCredentials);
  };

  const updateUserPermissions = async (userId: string, newPermissions: Partial<UserPermissions>): Promise<void> => {
    const updatedUsers = users.map(user =>
      user.id === userId
        ? { ...user, permissions: { ...user.permissions, ...newPermissions } }
        : user
    );

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const updateUserCredentials = async (userId: string, newPassword: string): Promise<void> => {
    const updatedCredentials = credentials.map(cred =>
      cred.userId === userId
        ? { ...cred, password: newPassword, lastPasswordChange: new Date().toISOString() }
        : cred
    );

    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(updatedCredentials));
    setCredentials(updatedCredentials);
  };

  const toggleUserStatus = async (userId: string): Promise<void> => {
    const updatedUsers = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          status: user.status === 'active' ? 'inactive' : 'active'
        } as User;
      }
      return user;
    });

    localStorage.setItem(USERS_KEY, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const getUserById = (userId: string): User | undefined => {
    return users.find(user => user.id === userId);
  };

  return (
    <UserManagementContext.Provider
      value={{
        users,
        credentials,
        isLoading,
        error,
        addUser,
        updateUser,
        deleteUser,
        updateUserPermissions,
        updateUserCredentials,
        toggleUserStatus,
        getUserById
      }}
    >
      {children}
    </UserManagementContext.Provider>
  );
};

export const useUserManagement = () => {
  const context = useContext(UserManagementContext);
  if (!context) {
    throw new Error('useUserManagement must be used within UserManagementProvider');
  }
  return context;
};