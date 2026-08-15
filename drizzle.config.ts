import { defineConfig } from "drizzle-kit";

// 로컬: PGlite 파일 DB에 push / 프로덕션: DATABASE_URL(Supabase)에 push
export default defineConfig(
  process.env.DATABASE_URL
    ? {
        dialect: "postgresql",
        schema: "./src/db/schema.ts",
        dbCredentials: { url: process.env.DATABASE_URL },
      }
    : {
        dialect: "postgresql",
        driver: "pglite",
        schema: "./src/db/schema.ts",
        dbCredentials: { url: "./.data/pglite" },
      }
);
