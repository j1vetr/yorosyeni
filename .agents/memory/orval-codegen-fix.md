---
name: Orval codegen TS2308 collision fix
description: How to fix TypeScript TS2308 "already exported a member" errors from orval in this workspace
---

## Rule
When orval generates both a `zod` client AND a `schemas` (TypeScript types) folder, both export identically-named symbols (e.g. `FetchPublicMenuParams`). Re-exporting both from `lib/api-zod/src/index.ts` causes TS2308.

## Fix applied
1. Remove `schemas: { path: "generated/types", type: "typescript" }` from orval's `zod` output config.
2. Add `indexFiles: false` to the `zod` output config so orval doesn't regenerate the barrel.
3. After `orval` runs, write a clean barrel: `printf 'export * from "./generated/api";\n' > ../api-zod/src/index.ts`.
4. Codegen script: `"codegen": "orval --config ./orval.config.ts && printf '...' > ../api-zod/src/index.ts && pnpm -w run typecheck:libs"`

**Why:** Orval generates Params types for any endpoint that has query/path params. The same name appears in both the Zod schemas file and the TypeScript types file, causing the duplicate export error.
