import { Router } from "express";
import { db } from "../lib/db";
import { productsTable, productTranslationsTable, analyticsEventsTable } from "@workspace/db/schema";
import { requireAuth } from "../lib/auth";
import { eq, asc } from "drizzle-orm";

const router = Router();

async function getProductWithTranslations(id: number) {
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, id));
  if (!product) return null;
  const translations = await db
    .select()
    .from(productTranslationsTable)
    .where(eq(productTranslationsTable.productId, id));
  return { ...product, translations };
}

router.get("/products", requireAuth, async (req, res): Promise<void> => {
  const categoryId = req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined;
  const rows = categoryId
    ? await db.select().from(productsTable).where(eq(productsTable.categoryId, categoryId)).orderBy(asc(productsTable.sortOrder))
    : await db.select().from(productsTable).orderBy(asc(productsTable.sortOrder));
  const withTr = await Promise.all(rows.map((p) => getProductWithTranslations(p.id)));
  res.json(withTr.filter(Boolean));
});

router.post("/products", requireAuth, async (req, res): Promise<void> => {
  const { translations, ...productData } = req.body;
  const [created] = await db.insert(productsTable).values(productData).returning();
  if (translations?.length) {
    await db.insert(productTranslationsTable).values(
      translations.map((t: Record<string, string>) => ({
        ...t,
        productId: created.id,
      }))
    );
  }
  const full = await getProductWithTranslations(created.id);
  res.status(201).json(full);
});

router.get("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const full = await getProductWithTranslations(id);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(full);
});

router.patch("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { translations, ...productData } = req.body;
  if (Object.keys(productData).length > 0) {
    await db.update(productsTable).set(productData).where(eq(productsTable.id, id));
  }
  if (translations) {
    await db.delete(productTranslationsTable).where(eq(productTranslationsTable.productId, id));
    if (translations.length > 0) {
      await db.insert(productTranslationsTable).values(
        translations.map((t: Record<string, string>) => ({
          ...t,
          productId: id,
        }))
      );
    }
  }
  const full = await getProductWithTranslations(id);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(full);
});

router.delete("/products/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(productsTable).where(eq(productsTable.id, id));
  res.status(204).end();
});

router.post("/products/reorder", requireAuth, async (req, res): Promise<void> => {
  const { ids } = req.body as { ids: number[] };
  await Promise.all(
    ids.map((id, index) =>
      db.update(productsTable).set({ sortOrder: index }).where(eq(productsTable.id, id))
    )
  );
  res.json({ ok: true });
});

router.post("/products/:id/view", async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const lang = req.body?.lang ?? req.query.lang ?? null;
  await db.insert(analyticsEventsTable).values({
    type: "product_view",
    productId: id,
    languageCode: lang as string | undefined,
    userAgent: req.headers["user-agent"],
  });
  res.json({ ok: true });
});

export default router;
