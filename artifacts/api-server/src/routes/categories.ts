import { Router } from "express";
import { db } from "../lib/db";
import { categoriesTable, categoryTranslationsTable } from "@workspace/db/schema";
import { requireAuth } from "../lib/auth";
import { eq, asc } from "drizzle-orm";

const router = Router();

async function getCategoryWithTranslations(id: number) {
  const [category] = await db.select().from(categoriesTable).where(eq(categoriesTable.id, id));
  if (!category) return null;
  const translations = await db
    .select()
    .from(categoryTranslationsTable)
    .where(eq(categoryTranslationsTable.categoryId, id));
  return { ...category, translations };
}

router.get("/categories", requireAuth, async (_req, res): Promise<void> => {
  const cats = await db.select().from(categoriesTable).orderBy(asc(categoriesTable.sortOrder));
  const withTranslations = await Promise.all(cats.map((c) => getCategoryWithTranslations(c.id)));
  res.json(withTranslations.filter(Boolean));
});

router.post("/categories", requireAuth, async (req, res): Promise<void> => {
  const { translations, ...catData } = req.body;
  const [created] = await db.insert(categoriesTable).values(catData).returning();
  if (translations?.length) {
    await db.insert(categoryTranslationsTable).values(
      translations.map((t: { languageCode: string; name: string; description?: string }) => ({
        ...t,
        categoryId: created.id,
      }))
    );
  }
  const full = await getCategoryWithTranslations(created.id);
  res.status(201).json(full);
});

router.get("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const full = await getCategoryWithTranslations(id);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(full);
});

router.patch("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const { translations, ...catData } = req.body;
  if (Object.keys(catData).length > 0) {
    await db.update(categoriesTable).set(catData).where(eq(categoriesTable.id, id));
  }
  if (translations) {
    await db.delete(categoryTranslationsTable).where(eq(categoryTranslationsTable.categoryId, id));
    if (translations.length > 0) {
      await db.insert(categoryTranslationsTable).values(
        translations.map((t: { languageCode: string; name: string; description?: string }) => ({
          ...t,
          categoryId: id,
        }))
      );
    }
  }
  const full = await getCategoryWithTranslations(id);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(full);
});

router.delete("/categories/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
  res.status(204).end();
});

router.post("/categories/reorder", requireAuth, async (req, res): Promise<void> => {
  const { ids } = req.body as { ids: number[] };
  await Promise.all(
    ids.map((id, index) =>
      db.update(categoriesTable).set({ sortOrder: index }).where(eq(categoriesTable.id, id))
    )
  );
  res.json({ ok: true });
});

export default router;
