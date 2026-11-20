import "server-only";

import pg from "pg";
import { ensureDatabase } from "@/lib/ensure-database";
import type { StayWindow } from "@/lib/booking-time";

const openStaySql = `select "checkInAt", "checkOutAt" from "Booking" where status <> 'CANCELED'`;

export async function listOpenStays() {
  await ensureDatabase();
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) throw new Error("DATABASE_URL is required.");
  const client = new pg.Client({ connectionString, connectionTimeoutMillis: 8000 });
  client.on("error", () => undefined);
  await client.connect();
  try {
    const result = await client.query<StayWindow>(openStaySql);
    return result.rows;
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function lockOpenStays(client: pg.Client) {
  const result = await client.query<StayWindow>(`${openStaySql} for update`);
  return result.rows;
}
