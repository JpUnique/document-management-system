export interface User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: 'admin' | 'editor' | 'viewer';
  department?: string;
  avatar?: string;
  permissions: UserPermissions;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  lastLogin?: string;
}

export interface UserPermissions {
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  canShare: boolean;
  canManageUsers: boolean;
  canManagePermissions: boolean;
}

export interface UserCredentials {
  userId: string;
  email: string;
  password: string; // In production, this should be hashed
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
}