import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

let pending: Promise<void> | undefined;

export function ensureDatabase() {
  pending ??= applyMigrations().catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

function openClient(connectionString: string) {
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 8000,
  });
  client.on("error", () => undefined);
  return client;
}

async function applyMigrations() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED?.trim() || process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");

  const client = openClient(connectionString);
  await client.connect();
  try {
    await client.query("select pg_advisory_lock(7272741)").catch(() => undefined);
    const adminTable = await client.query<{ name: string | null }>(
      `select to_regclass('public."AdminUser"') as name`,
    );
    if (!adminTable.rows[0]?.name) {
      await applyMigrationFile(client, "20261118045904_init_admin");
      await applyMigrationFile(client, "20261118122500_add_admin_session_version");
      return;
    }

    const sessionVersion = await client.query(
      `select 1
       from information_schema.columns
       where table_schema = 'public'
         and table_name = 'AdminUser'
         and column_name = 'sessionVersion'`,
    );
    if (sessionVersion.rowCount === 0) {
      await applyMigrationFile(client, "20261118122500_add_admin_session_version");
    }
  } finally {
    await client.query("select pg_advisory_unlock(7272741)").catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}

async function applyMigrationFile(client: pg.Client, directory: string) {
  const sql = await readFile(
    path.join(process.cwd(), "prisma", "migrations", directory, "migration.sql"),
    "utf8",
  );
  const statements = sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.replace(/--.*$/gm, "").trim().length > 0);
  for (const statement of statements) {
    await client.query(statement);
  }
}
