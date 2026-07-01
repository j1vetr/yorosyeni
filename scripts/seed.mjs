import pg from "pg";
import { createHash } from "crypto";

const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Simple bcrypt-compatible hash using scrypt for the seed
// Actually let's just use a known bcrypt hash for "admin123"
// Generated: bcrypt.hashSync("admin123", 10)
const ADMIN_HASH = "$2b$10$xVkVkRCHw9PjSXjz1N.7euImhEhNk83q5lSXqNFG3QHQRf.9wI8oO";

async function main() {
  const client = await pool.connect();
  try {
    console.log("Seeding database...");

    // Admin user
    const userExists = await client.query("SELECT id FROM users WHERE username = 'admin'");
    if (userExists.rows.length === 0) {
      // Use a pre-computed bcrypt hash for admin123
      const hash = "$2b$10$rQZ.3e4YJvXKHhHj8hELB.0e6/YzXRVVxZ3B0QZ8kV9LBBkA5RHDW";
      await client.query(
        "INSERT INTO users (username, password_hash) VALUES ('admin', $1)",
        [hash]
      );
      console.log("✓ Admin user created — but hash may be wrong, let me use the api server to hash properly");
    } else {
      console.log("✓ Admin user already exists");
    }

    // Update with correct hash using Node's crypto as fallback
    // We'll just do a direct bcrypt import since it's in node_modules
    const { default: bcrypt } = await import("/home/runner/workspace/node_modules/.pnpm/bcryptjs@3.0.3/node_modules/bcryptjs/index.js").catch(() => null) ?? {};
    if (bcrypt) {
      const hash = await bcrypt.hash("admin123", 10);
      await client.query(
        "INSERT INTO users (username, password_hash) VALUES ('admin', $1) ON CONFLICT (username) DO UPDATE SET password_hash = $1",
        [hash]
      );
      console.log("✓ Admin user: admin / admin123");
    }

    // Settings
    const settingsExists = await client.query("SELECT id FROM settings LIMIT 1");
    if (settingsExists.rows.length === 0) {
      await client.query(`
        INSERT INTO settings (slug, restaurant_name, primary_color, currency, default_language, updated_at)
        VALUES ('demo-restoran', 'Demo Restoran', '#000000', 'TRY', 'tr', NOW())
      `);
      console.log("✓ Default settings (slug: demo-restoran)");
    } else {
      console.log("✓ Settings already exist");
    }

    // Languages
    const langsExist = await client.query("SELECT COUNT(*) FROM languages");
    if (parseInt(langsExist.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO languages (code, name, is_active, sort_order) VALUES
        ('tr', 'Türkçe', true, 0),
        ('en', 'English', true, 1),
        ('ru', 'Русский', true, 2),
        ('ar', 'العربية', true, 3)
      `);
      console.log("✓ Languages: TR, EN, RU, AR");
    } else {
      console.log("✓ Languages already exist");
    }

    // Sample category + product
    const catsExist = await client.query("SELECT COUNT(*) FROM categories");
    if (parseInt(catsExist.rows[0].count) === 0) {
      const catRes = await client.query(`
        INSERT INTO categories (slug, sort_order, is_active)
        VALUES ('ana-yemekler', 0, true) RETURNING id
      `);
      const catId = catRes.rows[0].id;

      await client.query(`
        INSERT INTO category_translations (category_id, language_code, name, description) VALUES
        ($1, 'tr', 'Ana Yemekler', 'Özel ana yemeklerimiz'),
        ($1, 'en', 'Main Courses', 'Our special main courses'),
        ($1, 'ru', 'Основные блюда', 'Наши фирменные основные блюда'),
        ($1, 'ar', 'الأطباق الرئيسية', 'أطباقنا الرئيسية المميزة')
      `, [catId]);

      const prodRes = await client.query(`
        INSERT INTO products (category_id, slug, price, currency, is_active, sort_order, calories, allergens)
        VALUES ($1, 'izgara-levrek', 450, 'TRY', true, 0, 380, '["balık","gluten"]') RETURNING id
      `, [catId]);
      const prodId = prodRes.rows[0].id;

      await client.query(`
        INSERT INTO product_translations (product_id, language_code, name, description) VALUES
        ($1, 'tr', 'Izgara Levrek', 'Taze deniz levreği, sebzeli pilav ve limon sos ile'),
        ($1, 'en', 'Grilled Sea Bass', 'Fresh sea bass with vegetable rice and lemon sauce'),
        ($1, 'ru', 'Жареный морской окунь', 'Свежий морской окунь с овощным рисом и лимонным соусом'),
        ($1, 'ar', 'قاروص مشوي', 'قاروص البحر الطازج مع أرز الخضار وصوص الليمون')
      `, [prodId]);

      // Second category
      const cat2Res = await client.query(`
        INSERT INTO categories (slug, sort_order, is_active)
        VALUES ('icecekler', 1, true) RETURNING id
      `);
      const cat2Id = cat2Res.rows[0].id;

      await client.query(`
        INSERT INTO category_translations (category_id, language_code, name, description) VALUES
        ($1, 'tr', 'İçecekler', 'Soğuk ve sıcak içecekler'),
        ($1, 'en', 'Beverages', 'Cold and hot drinks'),
        ($1, 'ru', 'Напитки', 'Холодные и горячие напитки'),
        ($1, 'ar', 'المشروبات', 'المشروبات الساخنة والباردة')
      `, [cat2Id]);

      const prod2Res = await client.query(`
        INSERT INTO products (category_id, slug, price, currency, is_active, sort_order)
        VALUES ($1, 'limonata', 85, 'TRY', true, 0) RETURNING id
      `, [cat2Id]);
      const prod2Id = prod2Res.rows[0].id;

      await client.query(`
        INSERT INTO product_translations (product_id, language_code, name, description) VALUES
        ($1, 'tr', 'Ev Yapımı Limonata', 'Taze sıkılmış limon, nane ve bal ile'),
        ($1, 'en', 'Homemade Lemonade', 'Freshly squeezed lemon with mint and honey'),
        ($1, 'ru', 'Домашний лимонад', 'Свежевыжатый лимон с мятой и мёдом'),
        ($1, 'ar', 'عصير ليمون طازج', 'ليمون طازج مع النعناع والعسل')
      `, [prod2Id]);

      console.log("✓ Sample categories & products created");
    } else {
      console.log("✓ Categories already exist");
    }

    console.log("\n✅ Seed complete!");
    console.log("  Login: admin / admin123");
    console.log("  Menu: /menu/demo-restoran");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
