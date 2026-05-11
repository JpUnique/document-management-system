# DMS Backend Build - Todo

## Architecture
- **Frontend**: React + shadcn/ui + Tailwind (UI unchanged)
- **Backend**: Node.js 20 + Express + TypeScript (at `/workspace/backend`)
- **Database**: PostgreSQL 16 (Docker)
- **Auth**: JWT access (15m) + refresh (7d) tokens
- **Storage**: Local filesystem at `backend/uploads/`
- **Deployment**: Docker Compose

## Development Tasks
- [x] Backend project structure (package.json, tsconfig, env config)
- [x] PostgreSQL schema with migrations (9 tables + indexes + triggers)
- [x] JWT authentication system (login, register, logout, refresh, me)
- [x] User Management API (CRUD + filters + stats + reset-password)
- [x] Documents API (upload, list, get, update, delete, star, download)
- [x] Folders API (hierarchical CRUD with counts)
- [x] Tags API + document_tags many-to-many + attach/detach
- [x] Audit Logs API (query + admin purge)
- [x] Document Sharing API (password-protected, expiring, public access)
- [x] Dashboard & Analytics API (stats, activity timeline, breakdowns)
- [x] Trash/Recycle Bin API (list, restore, purge, empty)
- [x] Document Versions API (upload, list, download past versions)
- [x] Bulk Operations API (delete, archive, move, update multiple docs)
- [x] Profile API (self-update, change password)
- [x] Docker Compose setup (postgres + backend + volumes + healthchecks)
- [x] Dockerfile (multi-stage build)
- [x] Smoke test script (`pnpm run smoke-test`)
- [x] Frontend API service layer — all 12 services
- [x] Frontend `.env.example` with `VITE_API_URL`
- [x] Backend README with setup + API reference
- [x] Integration guide (INTEGRATION.md)
- [x] Completeness report (COMPLETE.md)

## Deliverables
- `/workspace/backend/` — complete backend codebase
- `/workspace/backend/README.md` — setup guide
- `/workspace/backend/INTEGRATION.md` — frontend integration guide
- `/workspace/backend/COMPLETE.md` — full completeness report
- `/workspace/shadcn-ui/src/services/` — 12 API services covering all endpoints

## Admin Credentials (Seed)
- Email: `admin@docmanager.com`
- Password: `PdAdmin`

## Total Endpoints: 48

## Major Version Migrations (Task 07)
- [x] React 18 → 19.2.6
- [x] React DOM 18 → 19.2.6
- [x] TypeScript 5.x → 6.0.3
- [x] Vite 5.x → 6.4.2 (Vite 8 requires Node.js 20.19+, not available)
- [x] ESLint 8 → 9.39.4 (flat config)
- [x] Tailwind CSS 3 → 4.3.0 (@tailwindcss/vite plugin, CSS-first config)
- [x] react-day-picker v8 → v10 (Calendar component updated)
- [x] All safe dependency updates applied

### Migration Notes
- Vite 8 blocked by Node.js 20.11.0 (requires 20.19+); staying on Vite 6.4.2
- Tailwind v4 uses `@import "tailwindcss"` + `@theme` in CSS, no more `tailwind.config.ts` or `postcss.config.js`
- ESLint 9 uses flat config (`eslint.config.js`) instead of `.eslintrc`
- TypeScript 6 uses `--module nodenext` and stricter type checking