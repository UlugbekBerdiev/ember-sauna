import "server-only";

import { randomBytes } from "node:crypto";
import pg from "pg";
import { ensureDatabase } from "@/lib/ensure-database";

let cached: string | undefined;

export async function getSessionSecret() {
  const fromEnv = process.env.SESSION_SECRET?.trim() ?? "";
  if (fromEnv.length >= 32) return fromEnv;
  if (cached && cached.length >= 32) return cached;
  const secret = await loadOrCreate();
  cached = secret;
  return secret;
}

async function loadOrCreate() {
  await ensureDatabase();
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 8000,
  });
  client.on("error", () => undefined);
  await client.connect();
  try {
    await client.query(
      `create table if not exists "AppSetting" (key text primary key, value text not null)`,
    );
    const created = randomBytes(32).toString("base64url");
    await client.query(
      `insert into "AppSetting" (key, value) values ('session_secret', $1) on conflict (key) do nothing`,
      [created],
    );
    const result = await client.query<{ value: string }>(
      `select value from "AppSetting" where key = 'session_secret'`,
    );
    const value = result.rows[0]?.value ?? "";
    if (value.length < 32) throw new Error("Session secret could not be stored.");
    return value;
  } finally {
    await client.end().catch(() => undefined);
  }
}
