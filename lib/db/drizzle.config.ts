import { defineConfig } from "drizzle-kit";
import path from "path";
import { existsSync } from "fs";
import { config } from "dotenv";

// Load .env from repo root if it exists (useful on servers where DATABASE_URL
// is not exported in the shell environment).
const rootEnv = path.resolve(__dirname, "../../.env");
if (existsSync(rootEnv)) config({ path: rootEnv });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Export it or add it to a .env file in the project root.");
}

export default defineConfig({
  schema: path.join(__dirname, "./src/schema/index.ts"),
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
