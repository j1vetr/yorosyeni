import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import router from "./routes";
import { logger } from "./lib/logger";
import path from "path";
import fs from "fs/promises";
import { db } from "./lib/db";
import { settingsTable, productsTable, productTranslationsTable, categoriesTable } from "@workspace/db/schema";
import { eq, and } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
    username: string;
  }
}

const isProd = process.env.NODE_ENV === "production";

const sessionSecret = process.env.SESSION_SECRET;
if (isProd && !sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required in production");
}

// Parse explicit origin allowlist once at startup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ?.split(",")
  .map((o) => o.trim())
  .filter(Boolean) ?? [];

const app: Express = express();

// Trust nginx reverse proxy — enables req.secure + correct IP via X-Forwarded-* headers
app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(
  cors({
    origin: (origin, callback) => {
      // Same-origin / server-to-server requests carry no Origin header — always allow
      if (!origin) return callback(null, true);

      // Explicit allowlist always wins
      if (allowedOrigins.length > 0) {
        return callback(null, allowedOrigins.includes(origin));
      }

      // Production without an explicit allowlist: fail closed — reject all cross-origin requests
      if (isProd) {
        return callback(null, false);
      }

      // Development only: allow localhost and Replit preview domains for convenience
      if (
        origin.includes("localhost") ||
        origin.includes(".replit.dev") ||
        origin.includes(".repl.co") ||
        origin.includes(".replit.app")
      ) {
        return callback(null, true);
      }

      return callback(null, false);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: sessionSecret ?? "qrmenu-dev-only-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      // SameSite: "lax" is safe because the API and frontend are co-hosted
      // on the same domain (both served through the Replit proxy).
      // "none" would require Secure + broad CORS, creating unnecessary exposure.
      // 'auto' = Express checks req.secure (respects trust proxy + X-Forwarded-Proto)
      // Works for both HTTP and HTTPS; no hardcoded boolean needed
      secure: isProd ? "auto" : false,
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  })
);

app.use("/api", router);

// Production: serve built frontend static files with dynamic meta injection
if (isProd) {
  const staticDir = path.resolve(process.cwd(), "artifacts/qr-menu/dist/public");
  app.use(express.static(staticDir));

  // Cache base restaurant HTML (5 min)
  let cachedHtml: string | null = null;
  let cacheTime = 0;
  const CACHE_TTL = 5 * 60 * 1000;

  // Per-product OG cache: slug → { html, ts }
  const productCache = new Map<string, { html: string; ts: number }>();
  const PRODUCT_CACHE_TTL = 10 * 60 * 1000; // 10 min

  // Product URL pattern: /categories/:catSlug/:productSlug
  const PRODUCT_RE = /^\/categories\/([^/]+)\/([^/]+)\/?$/;

  async function getBaseHtml(): Promise<string> {
    const now = Date.now();
    if (!cachedHtml || now - cacheTime > CACHE_TTL) {
      const template = await fs.readFile(path.join(staticDir, "index.html"), "utf-8");
      const rows = await db.select().from(settingsTable).limit(1);
      const s = rows[0];
      const name = s?.restaurantName ?? "Menü";
      const logo = s?.logoUrl ?? "";
      cachedHtml = template
        .replace(/__RESTAURANT_NAME__/g, escMeta(name))
        .replace(/__RESTAURANT_LOGO__/g, escMeta(logo));
      cacheTime = now;
    }
    return cachedHtml!;
  }

  function escMeta(s: string) {
    return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  app.use(async (req, res) => {
    try {
      const match = PRODUCT_RE.exec(req.path);

      if (match) {
        const [, catSlug, productSlug] = match;
        const cacheKey = `${catSlug}/${productSlug}`;
        const cached = productCache.get(cacheKey);
        if (cached && Date.now() - cached.ts < PRODUCT_CACHE_TTL) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.send(cached.html);
        }

        // Fetch settings + product in parallel
        const [settingsRows, productRows] = await Promise.all([
          db.select().from(settingsTable).limit(1),
          db
            .select({
              imageUrl: productsTable.imageUrl,
              name: productTranslationsTable.name,
              description: productTranslationsTable.description,
            })
            .from(productsTable)
            .innerJoin(categoriesTable, eq(categoriesTable.id, productsTable.categoryId))
            .leftJoin(
              productTranslationsTable,
              and(
                eq(productTranslationsTable.productId, productsTable.id),
                eq(productTranslationsTable.languageCode, "tr")
              )
            )
            .where(and(eq(categoriesTable.slug, catSlug), eq(productsTable.slug, productSlug)))
            .limit(1),
        ]);

        const s = settingsRows[0];
        const restaurantName = s?.restaurantName ?? "Menü";
        const product = productRows[0];

        if (product) {
          const productName = product.name ?? productSlug;
          const ogTitle = `${productName} — ${restaurantName}`;
          const ogDesc = product.description ?? restaurantName;
          const ogImage = product.imageUrl ?? s?.logoUrl ?? "";
          const siteUrl = `https://qrmenu.yoroscaferestaurant.com`;

          const template = await fs.readFile(path.join(staticDir, "index.html"), "utf-8");
          const html = template
            .replace(/<title>[^<]*<\/title>/, `<title>${escMeta(ogTitle)}</title>`)
            .replace(/content="__RESTAURANT_NAME__[^"]*"/g, `content="${escMeta(ogTitle)}"`)
            .replace(/content="__RESTAURANT_NAME__ [^"]*menüsü[^"]*"/g, `content="${escMeta(ogDesc)}"`)
            .replace(/__RESTAURANT_NAME__ — Menü/g, escMeta(ogTitle))
            .replace(/__RESTAURANT_NAME__ dijital menüsü\./g, escMeta(ogDesc))
            .replace(/__RESTAURANT_NAME__/g, escMeta(restaurantName))
            .replace(/__RESTAURANT_LOGO__/g, escMeta(ogImage))
            .replace(/content="summary"/g, 'content="summary_large_image"')
            // override og:image specifically
            .replace(
              /(<meta property="og:image" content=")[^"]*(")/,
              `$1${escMeta(ogImage)}$2`
            )
            .replace(
              /(<meta name="twitter:image" content=")[^"]*(")/,
              `$1${escMeta(ogImage)}$2`
            )
            // canonical URL for the product page
            .replace(
              /<\/head>/,
              `<link rel="canonical" href="${siteUrl}/categories/${encodeURIComponent(catSlug)}/${encodeURIComponent(productSlug)}" />\n</head>`
            );

          productCache.set(cacheKey, { html, ts: Date.now() });
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          return res.send(html);
        }
      }

      // Default: restaurant-level HTML
      const html = await getBaseHtml();
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    } catch {
      res.sendFile(path.join(staticDir, "index.html"));
    }
  });
}

export default app;
