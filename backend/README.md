# 🗄️ DMS Backend — Self-Hosted Document Management System API

A production-ready Node.js + Express + TypeScript backend for the Document Management System, designed to be hosted on your own server.

## 🏗️ Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 16
- **Authentication**: JWT (access + refresh tokens)
- **File Storage**: Local filesystem
- **Containerization**: Docker + Docker Compose
- **Validation**: Zod
- **Security**: Helmet, CORS, rate limiting, bcrypt

## 📋 Prerequisites

Choose ONE of:

### Option A: Docker (Recommended — easiest)
- Docker 20.10+
- Docker Compose V2

### Option B: Native Install
- Node.js 20+
- pnpm (or npm)
- PostgreSQL 14+

---

## 🚀 Quick Start (Docker — Recommended)

```bash
# 1. Clone/navigate to backend directory
cd /workspace/backend

# 2. Copy environment file
cp .env.example .env

# 3. (IMPORTANT) Edit .env — change JWT secrets and admin password!
nano .env

# 4. Start everything (PostgreSQL + backend)
docker compose up -d

# 5. Run migrations (inside the container)
docker compose exec backend node -e "require('./dist/db/migrate')"
# OR if you prefer a shell:
docker compose exec backend sh -c "node dist/db/migrate.js || npx ts-node src/db/migrate.ts"

# 6. Seed initial admin user + tags
docker compose exec backend sh -c "node dist/db/seed.js || npx ts-node src/db/seed.ts"

# 7. Verify
curl http://localhost:4000/health
```

**Default admin credentials** (from `.env`):
- Email: `admin@docmanager.com`
- Password: `PdAdmin`

⚠️ **Change the password on first login!**

---

## 🛠️ Native Install (Without Docker)

```bash
cd /workspace/backend

# 1. Install dependencies
pnpm install   # or: npm install

# 2. Set up PostgreSQL database
createdb dms_db
createuser dms_user --pwprompt

# 3. Configure environment
cp .env.example .env
# Edit .env with your DB credentials and JWT secrets

# 4. Run migrations
pnpm run migrate

# 5. Seed admin user
pnpm run seed

# 6. Start in development mode
pnpm run dev

# Or build for production
pnpm run build
pnpm start
```

Server will be running at `http://localhost:4000`.

---

## 📡 API Reference

Base URL: `http://localhost:4000/api`

### 🔐 Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login, returns access + refresh tokens | Public |
| POST | `/auth/refresh` | Exchange refresh token for new access token | Public |
| POST | `/auth/logout` | Logout current session | Bearer |
| GET | `/auth/me` | Get current user profile | Bearer |

### 👥 Users
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/users` | List users (filters: department, role, status, search) | Any |
| GET | `/users/:id` | Get user by ID | Any |
| POST | `/users` | Create user | Admin |
| PATCH | `/users/:id` | Update user | Admin |
| DELETE | `/users/:id` | Delete user | Admin |
| POST | `/users/:id/reset-password` | Reset user password | Admin |
| GET | `/users/stats/departments` | User count per department | Any |

### 📂 Folders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/folders?parent_id=...` | List folders (use `parent_id=null` for root) |
| GET | `/folders/:id` | Get folder |
| POST | `/folders` | Create folder |
| PATCH | `/folders/:id` | Update folder |
| DELETE | `/folders/:id` | Delete folder (cascades subfolders) |

### 📄 Documents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/documents` | List documents (filters: folder_id, department, status, starred, owner_id, search) |
| GET | `/documents/:id` | Get document metadata |
| POST | `/documents` | Upload document (multipart/form-data, field `file`) |
| GET | `/documents/:id/download` | Download original file |
| PATCH | `/documents/:id` | Update metadata |
| DELETE | `/documents/:id` | Delete document + file |
| POST | `/documents/:id/star` | Toggle star |

### 🏷️ Tags
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tags` | List all tags |
| POST | `/tags` | Create tag |
| PATCH | `/tags/:id` | Update tag |
| DELETE | `/tags/:id` | Delete tag |
| POST | `/tags/documents/:docId/:tagId` | Attach tag to document |
| DELETE | `/tags/documents/:docId/:tagId` | Detach tag from document |
| GET | `/tags/documents/:docId` | List tags on document |

### 🔗 Document Shares
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/shares` | Create share link (permission, password, expiry) | Bearer |
| GET | `/shares` | List shares (filter by document_id) | Bearer |
| DELETE | `/shares/:id` | Revoke share | Bearer |
| GET | `/shares/public/:token?password=...` | Public access to shared document | Public |
| GET | `/shares/public/:token/download?password=...` | Public download | Public |

### 📋 Audit Logs
| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/audit` | Query audit logs (filters: user_id, resource_type, resource_id, action, limit) | Any |
| DELETE | `/audit?before=ISO_DATE` | Purge audit logs | Admin |

---

## 🧪 Example Requests

```bash
# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@docmanager.com","password":"PdAdmin"}'

# Upload a document
curl -X POST http://localhost:4000/api/documents \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "file=@/path/to/file.pdf" \
  -F "title=My Document" \
  -F "department=IT"

# List documents
curl http://localhost:4000/api/documents \
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

---

## 🔒 Security Hardening Checklist (Production)

- [ ] Change `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` to long random strings (≥32 chars)
- [ ] Change default admin password immediately after first login
- [ ] Use HTTPS (reverse proxy with Nginx/Caddy + Let's Encrypt)
- [ ] Set strict `CORS_ORIGIN` to your exact frontend domain
- [ ] Restrict PostgreSQL port (5432) to internal network only
- [ ] Enable firewall (ufw): allow only 80, 443, 22
- [ ] Set up regular PostgreSQL backups (`pg_dump`)
- [ ] Back up the `uploads/` volume regularly
- [ ] Monitor `audit_logs` table for suspicious activity
- [ ] Keep Node.js and dependencies updated (`pnpm audit`)

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/         # Environment config
│   ├── db/             # Database pool, migrations, seeds, schema.sql
│   ├── middleware/     # auth, error handler
│   ├── routes/         # auth, users, folders, documents, tags, audit, shares
│   ├── utils/          # jwt, audit logging
│   └── server.ts       # Entry point
├── uploads/            # Uploaded files (volume in Docker)
├── Dockerfile
├── docker-compose.yml
├── .env.example
├── tsconfig.json
└── package.json
```

---

## 🐳 Docker Commands Cheat Sheet

```bash
# Start
docker compose up -d

# View logs
docker compose logs -f backend
docker compose logs -f postgres

# Stop
docker compose down

# Stop + remove volumes (destroys data!)
docker compose down -v

# Rebuild after code changes
docker compose up -d --build

# Access PostgreSQL shell
docker compose exec postgres psql -U dms_user -d dms_db

# Backup database
docker compose exec postgres pg_dump -U dms_user dms_db > backup.sql

# Restore database
cat backup.sql | docker compose exec -T postgres psql -U dms_user dms_db
```

---

## 🔌 Frontend Integration

The frontend needs to point to this backend. In your React app, set:

```env
VITE_API_URL=http://localhost:4000/api
```

Then use the provided `apiClient` (see frontend `src/services/api.ts`).

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` on DB | Ensure PostgreSQL container is healthy: `docker compose ps` |
| Migration errors | Drop & recreate DB, run `pnpm run migrate` again |
| 401 errors on every request | Check `JWT_ACCESS_SECRET` matches between restarts |
| File upload fails | Check `MAX_FILE_SIZE_MB` and disk space |
| CORS errors | Add your frontend URL to `CORS_ORIGIN` |

---

## 📝 License

Self-hosted — yours to own and modify.