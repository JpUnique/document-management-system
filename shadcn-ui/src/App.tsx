import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ActivityProvider } from '@/context/ActivityContext';
import { DocumentProvider } from '@/context/DocumentContext';
import { UserManagementProvider } from '@/context/UserManagementContext';
import { ShareProvider } from '@/context/ShareContext';
import { LicenseProvider } from '@/context/LicenseContext';

// Pages
import Dashboard from './pages/Dashboard';
import DocumentList from './pages/DocumentList';
import DocumentUpload from './pages/DocumentUpload';
import DocumentView from './pages/DocumentView';
import FolderView from './pages/FolderView';
import PermissionsManagement from './pages/PermissionsManagement';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import TwoFactorAuth from './pages/TwoFactorAuth';
import TagView from './pages/TagView';
import TagsManagement from './pages/TagsManagement';
import RecentDocuments from './pages/RecentDocuments';
import StarredDocuments from './pages/StarredDocuments';
import UserManagement from './pages/UserManagement';
import DocumentShare from './pages/DocumentShare';
import LicenseActivation from './pages/LicenseActivation';
import LicenseManagement from './pages/LicenseManagement';
import LicenseDebug from './pages/LicenseDebug';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

// Protected Route component
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  // Check if user is authenticated by looking for the auth token using the same key as AuthContext
  const isAuthenticated = localStorage.getItem('docmanager_auth') !== null;
  return isAuthenticated ? <>{element}</> : <Navigate to="/login" />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <LicenseProvider>
        <AuthProvider>
          <ActivityProvider>
            <DocumentProvider>
              <UserManagementProvider>
                <ShareProvider>
                  <BrowserRouter>
                    <Routes>
                      {/* License activation route */}
                      <Route path="/activate-license" element={<LicenseActivation />} />
                      <Route path="/license-debug" element={<LicenseDebug />} />
                      
                      {/* Auth routes */}
                      <Route path="/login" element={<Login />} />
                      <Route path="/register" element={<Register />} />
                      
                      {/* Protected routes */}
                      <Route path="/" element={<ProtectedRoute element={<Dashboard />} />} />
                      <Route path="/documents" element={<ProtectedRoute element={<DocumentList />} />} />
                      <Route path="/documents/new" element={<ProtectedRoute element={<DocumentUpload />} />} />
                      <Route path="/documents/:documentId" element={<ProtectedRoute element={<DocumentView />} />} />
                      <Route path="/documents/:documentId/permissions" element={<ProtectedRoute element={<PermissionsManagement />} />} />
                      <Route path="/documents/:documentId/share" element={<ProtectedRoute element={<DocumentShare />} />} />
                      <Route path="/folders/:folderId" element={<ProtectedRoute element={<FolderView />} />} />
                      <Route path="/recent" element={<ProtectedRoute element={<RecentDocuments />} />} />
                      <Route path="/starred" element={<ProtectedRoute element={<StarredDocuments />} />} />
                      <Route path="/profile" element={<ProtectedRoute element={<Profile />} />} />
                      <Route path="/settings/change-password" element={<ProtectedRoute element={<ChangePassword />} />} />
                      <Route path="/settings/two-factor" element={<ProtectedRoute element={<TwoFactorAuth />} />} />
                      <Route path="/tag/:tagId" element={<ProtectedRoute element={<TagView />} />} />
                      <Route path="/tags/manage" element={<ProtectedRoute element={<TagsManagement />} />} />
                      <Route path="/users" element={<ProtectedRoute element={<UserManagement />} />} />
                      <Route path="/admin/licenses" element={<ProtectedRoute element={<LicenseManagement />} />} />
                      
                      {/* Fallback route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </ShareProvider>
              </UserManagementProvider>
            </DocumentProvider>
          </ActivityProvider>
        </AuthProvider>
      </LicenseProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
