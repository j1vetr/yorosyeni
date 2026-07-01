---
name: QR Menu OpenAPI contract
description: Durable API contract rules for the QR Menu platform — methods, paths, and upload flow
---

## HTTP method rule
All update operations use **PATCH** (not PUT). This applies to:
- `PATCH /settings`
- `PATCH /languages/:id`
- `PATCH /categories/:id`
- `PATCH /products/:id`

**Why:** OpenAPI spec specifies PATCH throughout. Previous builds used PUT and failed code review twice.

**How to apply:** Any new update route or frontend `apiFetch` for an update must use PATCH.

## Analytics path
Spec path is `/analytics/views` (not `/analytics/timeseries`). Both are served for backwards compatibility but `/analytics/views` is canonical. Period enum: `daily | weekly | monthly` (also accepts legacy `7d | 30d | 90d`).

## Image upload flow (product images must be publicly accessible)
1. `POST /api/storage/uploads/request-url` → `{ uploadURL, objectPath }`
2. `PUT uploadURL` (presigned GCS URL) with file body (client-side, no auth)
3. `POST /api/storage/uploads/confirm` with `{ objectPath }` → `{ servingUrl }` — server sets `visibility: "public"` ACL
4. Store `servingUrl` as `imageUrl` on the product

**Why:** Products uploaded to PRIVATE_OBJECT_DIR need an explicit public ACL to be served on the public menu without authentication. The `/storage/objects/*` route checks ACL before enforcing auth — public objects are served without auth, private objects require a valid session.

## AI generation logging
Every call to `POST /ai/generate` is logged to `ai_generation_logs` table (productId, productName, model, tokensUsed, success, errorMessage). The frontend passes `productId` in the request body when editing an existing product.
