import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import bcrypt from "bcryptjs";
import * as schema from "../lib/db/src/schema/index.js";
import { eq } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool, { schema });

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const existingUser = await db
    .select()
    .from(schema.usersTable)
    .where(eq(schema.usersTable.username, "admin"));

  if (existingUser.length === 0) {
    const passwordHash = await bcrypt.hash("admin123", 10);
    await db.insert(schema.usersTable).values({
      username: "admin",
      passwordHash,
    });
    console.log("✓ Admin user created (username: admin, password: admin123)");
  } else {
    console.log("✓ Admin user already exists");
  }

  // Create default settings
  const existingSettings = await db.select().from(schema.settingsTable).limit(1);
  if (existingSettings.length === 0) {
    await db.insert(schema.settingsTable).values({
      slug: "demo-restoran",
      restaurantName: "Demo Restoran",
      primaryColor: "#000000",
      currency: "TRY",
      defaultLanguage: "tr",
    });
    console.log("✓ Default settings created (slug: demo-restoran)");
  } else {
    console.log("✓ Settings already exist");
  }

  // Create languages
  const existingLangs = await db.select().from(schema.languagesTable);
  if (existingLangs.length === 0) {
    await db.insert(schema.languagesTable).values([
      { code: "tr", name: "Türkçe", isActive: true, sortOrder: 0 },
      { code: "en", name: "English", isActive: true, sortOrder: 1 },
      { code: "ru", name: "Русский", isActive: true, sortOrder: 2 },
      { code: "ar", name: "العربية", isActive: true, sortOrder: 3 },
    ]);
    console.log("✓ Languages created (TR, EN, RU, AR)");
  } else {
    console.log("✓ Languages already exist");
  }

  // Create sample category
  const existingCats = await db.select().from(schema.categoriesTable);
  if (existingCats.length === 0) {
    const [cat] = await db
      .insert(schema.categoriesTable)
      .values({ slug: "ana-yemekler", sortOrder: 0, isActive: true })
      .returning();

    await db.insert(schema.categoryTranslationsTable).values([
      { categoryId: cat.id, languageCode: "tr", name: "Ana Yemekler", description: "Özel ana yemeklerimiz" },
      { categoryId: cat.id, languageCode: "en", name: "Main Courses", description: "Our special main courses" },
      { categoryId: cat.id, languageCode: "ru", name: "Основные блюда", description: "Наши фирменные основные блюда" },
      { categoryId: cat.id, languageCode: "ar", name: "الأطباق الرئيسية", description: "أطباقنا الرئيسية المميزة" },
    ]);

    // Sample product
    const [prod] = await db
      .insert(schema.productsTable)
      .values({
        categoryId: cat.id,
        slug: "izgara-levrek",
        price: 450,
        currency: "TRY",
        isActive: true,
        sortOrder: 0,
        calories: 380,
        allergens: ["balık", "gluten"],
      })
      .returning();

    await db.insert(schema.productTranslationsTable).values([
      { productId: prod.id, languageCode: "tr", name: "Izgara Levrek", description: "Taze deniz levreği, sebzeli pilav ve limon sos ile" },
      { productId: prod.id, languageCode: "en", name: "Grilled Sea Bass", description: "Fresh sea bass with vegetable rice and lemon sauce" },
      { productId: prod.id, languageCode: "ru", name: "Жареный морской окунь", description: "Свежий морской окунь с овощным рисом и лимонным соусом" },
      { productId: prod.id, languageCode: "ar", name: "قاروص مشوي", description: "قاروص البحر الطازج مع أرز الخضار وصوص الليمون" },
    ]);

    console.log("✓ Sample category and product created");
  } else {
    console.log("✓ Categories already exist");
  }

  console.log("\n✅ Seed complete!");
  console.log("  Login: admin / admin123");
  console.log("  Menu URL: /menu/demo-restoran");

  await pool.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
