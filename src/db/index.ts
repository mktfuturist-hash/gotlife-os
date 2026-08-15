import { drizzle as drizzlePg, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import { PGlite } from "@electric-sql/pglite";
import path from "node:path";
import * as schema from "./schema";

// DATABASE_URL이 있으면 실제 Postgres(Supabase), 없으면 로컬 내장 PGlite.
// 두 드라이버 모두 동일한 pg 스키마를 사용하므로 쿼리 인터페이스가 같다.
export type Db = PostgresJsDatabase<typeof schema>;

function build(): Db {
  if (process.env.DATABASE_URL) {
    const client = postgres(process.env.DATABASE_URL, { prepare: false });
    return drizzlePg(client, { schema });
  }
  const client = new PGlite(path.resolve(process.cwd(), ".data/pglite"));
  return drizzlePglite(client, { schema }) as unknown as Db;
}

const globalForDb = globalThis as unknown as { __db?: Db };

export const db: Db = globalForDb.__db ?? build();

if (process.env.NODE_ENV !== "production") globalForDb.__db = db;

export * from "./schema";
