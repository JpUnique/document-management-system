# 🔗 Frontend ↔ Backend Integration Guide

This guide explains how to connect your existing DMS frontend to the new self-hosted backend **without changing any UI**.

## ✅ What's Already Done

The frontend now includes a complete API service layer at `src/services/`:

| File | Purpose |
|------|---------|
| `api.ts` | Core HTTP client with auto token refresh |
| `auth.service.ts` | Login, register, logout, current user |
| `users.service.ts` | User CRUD + department stats |
| `documents.service.ts` | Document upload, download, CRUD |
| `folders.service.ts` | Folder hierarchy CRUD |
| `tags.service.ts` | Tag management + attach/detach to docs |
| `shares.service.ts` | Document share links with permissions |
| `audit.service.ts` | Audit log querying |

All services are exported from `src/services/index.ts`:

```ts
import { authService, documentsService, usersService, foldersService, tagsService, sharesService, auditService } from '@/services';
```

## 🚀 How to Use (Connecting Existing Contexts)

Your existing UI uses Context providers backed by localStorage. To switch to the backend, update each context's state-loading logic:

### 1. Authentication (`AuthContext.tsx`)
```ts
import { authService } from '@/services';

// Replace localStorage login with:
const user = await authService.login(email, password);

// On app mount, restore session:
useEffect(() => {
  authService.getCurrentUser().then(user => setUser(user));
}, []);

// Logout:
await authService.logout();
```

### 2. User Management (`UserManagementContext.tsx`)
```ts
import { usersService } from '@/services';

// Load users:
const users = await usersService.list({ department: 'Finance' });

// Create:
await usersService.create({ email, password, name, role, department });

// Update / Delete:
await usersService.update(id, { name, role });
await usersService.delete(id);
```

### 3. Documents (`DocumentContext.tsx`)
```ts
import { documentsService } from '@/services';

// Upload (file from an <input type="file">):
const doc = await documentsService.upload(file, {
  title: 'Report',
  department: 'IT',
  folder_id: currentFolderId,
});

// List:
const docs = await documentsService.list({ folder_id, search });

// Download:
await documentsService.download(doc.id, doc.file_name);

// Star / Unstar:
await documentsService.toggleStar(doc.id);
```

### 4. Folders
```ts
import { foldersService } from '@/services';

const rootFolders = await foldersService.list(null);  // root level
const subFolders = await foldersService.list(parentId);
await foldersService.create({ name: 'New Folder', parent_id: parentId });
```

### 5. Tags
```ts
import { tagsService } from '@/services';

const tags = await tagsService.list();
await tagsService.attachToDocument(docId, tagId);
```

### 6. Document Sharing (`ShareContext.tsx`)
```ts
import { sharesService } from '@/services';

const share = await sharesService.create({
  document_id: docId,
  permission: 'view',
  password: 'optional-password',
  expires_at: '2026-12-31T23:59:59Z',
});

const publicUrl = sharesService.buildShareUrl(share.share_token);
```

## 🔧 Step-by-Step Migration

1. **Start the backend** (see `backend/README.md`)
2. **Configure frontend env:**
   ```bash
   cd /workspace/shadcn-ui
   cp .env.example .env
   # Edit .env and set VITE_API_URL=http://your-server:4000/api
   ```
3. **Restart the dev server** so Vite picks up env vars
4. **Test login** with `admin@docmanager.com` / `PdAdmin`
5. **Migrate contexts** one at a time, starting with AuthContext

## 🛡️ Keeping the UI Unchanged

Because everything happens **inside the context providers**, all your pages and components (`UserManagement.tsx`, `DocumentView.tsx`, `DocumentShare.tsx`, etc.) keep their existing imports and behavior. Only the data source changes.

## 🔄 Hybrid Mode (Optional)

You can keep localStorage as a fallback by wrapping service calls with try/catch:
```ts
try {
  const users = await usersService.list();
  return users;
} catch {
  return loadFromLocalStorage();  // fallback
}
```

## 🆘 Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS error | Add frontend URL to backend `CORS_ORIGIN` env var |
| 401 on every request | Check tokens in localStorage, verify JWT secrets match |
| `Network error` | Ensure backend is running: `curl http://localhost:4000/health` |
| Vite doesn't see env | Restart `pnpm run dev` after editing `.env` |