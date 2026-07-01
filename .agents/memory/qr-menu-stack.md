---
name: QR Menu project stack
description: Architecture and port assignments for the QR Menu SaaS platform
---

## Architecture
- **Frontend**: `artifacts/qr-menu/` — React+Vite, port from `$PORT` env (typically 19636), path `/`
- **API server**: `artifacts/api-server/` — Express 5, port 8080, built via `build.mjs` + esbuild
- **Database**: PostgreSQL via `$DATABASE_URL`, Drizzle ORM
- **Auth**: express-session + bcryptjs; session in `req.session.userId`

## Key conventions
- Vite proxy in `vite.config.ts`: `/api` → `http://localhost:8080` (dev only)
- API calls from frontend use `${BASE_URL}/api/...` pattern (see `src/lib/api.ts`)
- Session cookie is `sameSite: "lax"` in dev, `"none"` + `secure:true` in prod
- All admin routes behind `requireAuth` middleware in `lib/auth.ts`
- DB push: `pnpm --filter @workspace/db run push`

## Seed credentials
- Admin: `admin` / `admin123`
- Menu slug: `demo-restoran` → `/menu/demo-restoran`

**Why:** Documented so future sessions can quickly understand the setup without reading all configs.
