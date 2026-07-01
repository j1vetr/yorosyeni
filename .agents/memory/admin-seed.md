---
name: Database seeding approach
description: How to seed the PostgreSQL database in this workspace (no pnpm script context)
---

## Rule
Workspace packages (e.g. `@workspace/db`) cannot be imported directly from the `scripts/` folder via `tsx` because pnpm's workspace protocol doesn't resolve for scripts run outside their package context.

## Working approaches
1. **Direct SQL via psql**: `psql "$DATABASE_URL" -f seed.sql` — fastest, no dependencies
2. **bcrypt hash generation**: `node -e "require('/home/runner/workspace/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js').hash('password', 10).then(h => console.log(h))"`
3. **pnpm dlx tsx**: Works but requires all imports to be resolvable without workspace protocol

**Why:** The seed script needs `drizzle-orm` and `pg` which are only installed in specific workspace packages, not at the root.
