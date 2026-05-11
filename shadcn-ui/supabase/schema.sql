-- Enterprise Document Management System - Database Schema
-- This schema supports multi-user, departmental organization, and audit trails

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USERS TABLE (with Departments)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  department TEXT CHECK (department IN (
    'Finance', 'HR', 'Procurement', 'Inventory', 
    'Project Management', 'Assets/Maintenance', 'Logistics',
    'IT', 'Operations', 'Administration'
  )),
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User permissions (stored as JSONB for flexibility)
CREATE TABLE IF NOT EXISTS user_permissions (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  can_read BOOLEAN NOT NULL DEFAULT true,
  can_write BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_share BOOLEAN NOT NULL DEFAULT false,
  can_manage_users BOOLEAN NOT NULL DEFAULT false,
  can_manage_permissions BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 2. FOLDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 3. TAGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 4. DOCUMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL, -- Supabase Storage path
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  department TEXT, -- Inherit from owner or set explicitly
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_starred BOOLEAN NOT NULL DEFAULT false,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_accessed TIMESTAMPTZ
);

-- Document tags junction table
CREATE TABLE IF NOT EXISTS document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- =====================================================
-- 5. DOCUMENT VERSIONS (Version Control)
-- =====================================================
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  change_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, version_number)
);

-- =====================================================
-- 6. DOCUMENT PERMISSIONS (Granular Access Control)
-- =====================================================
CREATE TABLE IF NOT EXISTS document_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  department TEXT, -- Allow department-level permissions
  permission_type TEXT NOT NULL CHECK (permission_type IN ('read', 'write', 'delete', 'share')),
  granted_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(document_id, user_id, permission_type)
);

-- =====================================================
-- 7. AUDIT LOGS (Compliance & Security)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'create', 'read', 'update', 'delete', 'download', 'share'
  resource_type TEXT NOT NULL, -- 'document', 'user', 'folder', 'tag'
  resource_id UUID,
  details JSONB, -- Additional context
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 8. DOCUMENT COMMENTS (Collaboration)
-- =====================================================
CREATE TABLE IF NOT EXISTS document_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_folder ON documents(folder_id);
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_comments ENABLE ROW LEVEL SECURITY;

-- Users: Can read their own data, admins can read all
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage users" ON users
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Documents: Users can see documents they own or have permission to view
CREATE POLICY "Users can view own documents" ON documents
  FOR SELECT USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM document_permissions 
      WHERE document_id = documents.id 
      AND user_id = auth.uid() 
      AND permission_type = 'read'
    )
    OR department IN (
      SELECT department FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can create documents" ON documents
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update own documents" ON documents
  FOR UPDATE USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM document_permissions 
      WHERE document_id = documents.id 
      AND user_id = auth.uid() 
      AND permission_type = 'write'
    )
  );

CREATE POLICY "Users can delete own documents" ON documents
  FOR DELETE USING (
    owner_id = auth.uid() 
    OR EXISTS (
      SELECT 1 FROM document_permissions 
      WHERE document_id = documents.id 
      AND user_id = auth.uid() 
      AND permission_type = 'delete'
    )
  );

-- Folders: Users can manage their own folders
CREATE POLICY "Users can manage own folders" ON folders
  FOR ALL USING (owner_id = auth.uid());

-- Tags: Everyone can read, only admins can manage
CREATE POLICY "Everyone can view tags" ON tags
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage tags" ON tags
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- Audit Logs: Only admins can view
CREATE POLICY "Admins can view audit logs" ON audit_logs
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  ));

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at BEFORE UPDATE ON folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create audit log entry
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object('old', to_jsonb(OLD), 'new', to_jsonb(NEW))
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers to documents
CREATE TRIGGER audit_documents AFTER INSERT OR UPDATE OR DELETE ON documents
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =====================================================
-- SEED DATA (Default Admin User)
-- =====================================================

-- Insert default admin user (password should be hashed in production)
INSERT INTO users (id, email, name, role, department, status)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'admin@docmanager.com',
  'System Administrator',
  'admin',
  'IT',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Set admin permissions
INSERT INTO user_permissions (user_id, can_read, can_write, can_delete, can_share, can_manage_users, can_manage_permissions)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  true, true, true, true, true, true
) ON CONFLICT (user_id) DO NOTHING;

-- Create root folder
INSERT INTO folders (id, name, parent_id, owner_id)
VALUES (
  '00000000-0000-0000-0000-000000000002',
  'Root',
  NULL,
  '00000000-0000-0000-0000-000000000001'
) ON CONFLICT (id) DO NOTHING;

-- Create default tags
INSERT INTO tags (name, color) VALUES
  ('Important', '#EF4444'),
  ('Urgent', '#F59E0B'),
  ('Confidential', '#8B5CF6'),
  ('Draft', '#6B7280'),
  ('Approved', '#10B981')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- STORAGE BUCKET SETUP
-- =====================================================
-- Note: This needs to be executed via Supabase Dashboard or API
-- CREATE BUCKET documents (public: false, file_size_limit: 52428800); -- 50MB limit