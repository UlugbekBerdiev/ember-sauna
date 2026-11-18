import "server-only";

import { randomUUID } from "node:crypto";
import pg from "pg";
import { ensureDatabase } from "@/lib/ensure-database";

export type AdminAccount = {
  id: string;
  username: string;
  email: string | null;
  passwordHash: string;
  sessionVersion: number;
};

async function withClient<T>(run: (client: pg.Client) => Promise<T>) {
  await ensureDatabase();
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 8000,
  });
  client.on("error", () => undefined);
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function countAdmins() {
  return withClient(async (client) => {
    const result = await client.query<{ count: number }>(
      `select count(*)::int as count from "AdminUser"`,
    );
    return result.rows[0]?.count ?? 0;
  });
}

export async function findAdminByUsername(username: string) {
  return withClient(async (client) => {
    const result = await client.query<AdminAccount>(
      `select id, username, email, "passwordHash", "sessionVersion"
       from "AdminUser"
       where username = $1`,
      [username],
    );
    return result.rows[0] ?? null;
  });
}

export async function findAdminForSession(id: string, sessionVersion: number) {
  return withClient(async (client) => {
    const result = await client.query<Pick<AdminAccount, "id" | "username" | "email">>(
      `select id, username, email
       from "AdminUser"
       where id = $1 and "sessionVersion" = $2`,
      [id, sessionVersion],
    );
    return result.rows[0] ?? null;
  });
}

export async function createAdmin(username: string, passwordHash: string) {
  return withClient(async (client) => {
    await client.query(
      `insert into "AdminUser" (id, username, "passwordHash", "sessionVersion", "failedLoginAttempts", "createdAt", "updatedAt")
       values ($1, $2, $3, 0, 0, now(), now())`,
      [randomUUID(), username, passwordHash],
    );
  });
}

export async function revokeAdminSession(id: string, sessionVersion: number) {
  return withClient(async (client) => {
    await client.query(
      `update "AdminUser"
       set "sessionVersion" = "sessionVersion" + 1, "updatedAt" = now()
       where id = $1 and "sessionVersion" = $2`,
      [id, sessionVersion],
    );
  });
}
