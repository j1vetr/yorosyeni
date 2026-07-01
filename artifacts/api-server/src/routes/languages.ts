import { Router } from "express";
import { db } from "../lib/db";
import { languagesTable } from "@workspace/db/schema";
import { requireAuth } from "../lib/auth";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/languages", requireAuth, async (_req, res): Promise<void> => {
  const rows = await db.select().from(languagesTable).orderBy(languagesTable.sortOrder);
  res.json(rows);
});

router.post("/languages", requireAuth, async (req, res): Promise<void> => {
  const [created] = await db.insert(languagesTable).values(req.body).returning();
  res.status(201).json(created);
});

router.patch("/languages/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  const [updated] = await db
    .update(languagesTable)
    .set(req.body)
    .where(eq(languagesTable.id, id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json(updated);
});

router.delete("/languages/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id);
  await db.delete(languagesTable).where(eq(languagesTable.id, id));
  res.status(204).end();
});

export default router;
