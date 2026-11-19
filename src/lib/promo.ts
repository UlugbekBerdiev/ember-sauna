import "server-only";

import { randomBytes, randomUUID } from "node:crypto";
import pg from "pg";
import { ensureDatabase } from "@/lib/ensure-database";
import { calculateBookingSchedule } from "@/lib/booking-time";
import { calculateRentalPrice, fromDateKey, toDateKey } from "@/lib/pricing";
import { applyPercentDiscount, generatePromoCode, normalizePromoCode } from "@/lib/promo-code";

export { applyPercentDiscount, generatePromoCode, normalizePromoCode };

export type PromoQuote = {
  code: string;
  percentOff: number;
  discountCents: number;
  totalCents: number;
};

export type PromoRecord = {
  id: string;
  code: string;
  percentOff: number;
  createdAt: Date;
  redeemedAt: Date | null;
  bookingReference: string | null;
};

export async function createPromoCode(input: { code?: string; percentOff: number }) {
  const percentOff = Number(input.percentOff);
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    throw new PromoError("percent", "Choose a discount from 1 to 100 percent.");
  }
  const code = input.code?.trim() ? normalizePromoCode(input.code) : generatePromoCode();
  if (!code) throw new PromoError("code", "Use 4 to 24 letters or numbers.");

  return withClient(async (client) => {
    try {
      const result = await client.query<{ code: string }>(
        `insert into "PromoCode" (id, code, "percentOff")
         values ($1, $2, $3)
         returning code`,
        [randomUUID(), code, percentOff],
      );
      return result.rows[0].code;
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new PromoError("code", "That code already exists.");
      }
      throw error;
    }
  });
}

export async function listPromoCodes() {
  return withClient(async (client) => {
    const result = await client.query<PromoRecord>(
      `select promo.id, promo.code, promo."percentOff", promo."createdAt", promo."redeemedAt",
              booking.reference as "bookingReference"
       from "PromoCode" promo
       left join "Booking" booking on booking.id = promo."bookingId"
       order by promo."createdAt" desc
       limit 100`,
    );
    return result.rows;
  });
}

export async function retirePromoCode(id: string) {
  return withClient(async (client) => {
    const result = await client.query(
      `update "PromoCode"
       set "redeemedAt" = now()
       where id = $1 and "redeemedAt" is null and "bookingId" is null`,
      [id],
    );
    return (result.rowCount ?? 0) > 0;
  });
}

export async function quotePromoCode(codeInput: string, dateKeys: string[]) {
  const code = normalizePromoCode(codeInput);
  if (!code) throw new PromoError("invalid", "That code is not valid.");
  const pricing = priceDates(dateKeys);

  return withClient(async (client) => {
    const promo = await findAvailableCode(client, code);
    const discount = applyPercentDiscount(pricing.total, promo.percentOff);
    return {
      code: promo.code,
      percentOff: promo.percentOff,
      discountCents: discount.discountCents,
      totalCents: discount.totalCents,
    } satisfies PromoQuote;
  });
}

export type RedeemInput = {
  code: string;
  dates: string[];
  checkInTime: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
};

export async function redeemFreePromo(input: RedeemInput) {
  const code = normalizePromoCode(input.code);
  if (!code) throw new PromoError("invalid", "That code is not valid.");
  const guest = readGuest(input);
  const schedule = calculateBookingSchedule(guest.dates, guest.checkInTime);
  if (!schedule) throw new PromoError("dates", "Choose dates that are still available.");
  const pricing = priceDates(guest.dates);

  return withClient(async (client) => {
    await client.query("begin");
    try {
      const promo = await client.query<{
        id: string;
        code: string;
        percentOff: number;
        redeemedAt: Date | null;
      }>(
        `select id, code, "percentOff", "redeemedAt"
         from "PromoCode"
         where code = $1
         for update`,
        [code],
      );
      const row = promo.rows[0];
      if (!row) throw new PromoError("invalid", "That code is not valid.");
      if (row.redeemedAt) throw new PromoError("used", "That code has already been used.");
      const discount = applyPercentDiscount(pricing.total, row.percentOff);
      if (discount.totalCents !== 0) {
        throw new PromoError(
          "balance",
          "This code does not cover the full total. Card payment for the rest is not connected yet, so the code stays unused.",
        );
      }

      const bookingId = randomUUID();
      const reference = await insertBooking(client, {
        id: bookingId,
        guest,
        schedule,
        pricing,
        promoCode: row.code,
        promoDiscountCents: discount.discountCents,
      });
      const redeemed = await client.query(
        `update "PromoCode"
         set "redeemedAt" = now(), "bookingId" = $2
         where id = $1 and "redeemedAt" is null`,
        [row.id, bookingId],
      );
      if ((redeemed.rowCount ?? 0) !== 1) {
        throw new PromoError("used", "That code has already been used.");
      }
      await client.query("commit");
      return { reference, code: row.code };
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    }
  });
}

export class PromoError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

function priceDates(dateKeys: string[]) {
  if (!Array.isArray(dateKeys) || dateKeys.length < 1 || dateKeys.length > 14) {
    throw new PromoError("dates", "Choose dates that are still available.");
  }
  const dates = dateKeys.map((key) => {
    if (typeof key !== "string" || toDateKey(fromDateKey(key)) !== key) {
      throw new PromoError("dates", "Choose dates that are still available.");
    }
    return fromDateKey(key);
  });
  const pricing = calculateRentalPrice(dates);
  if (!pricing.lineItems.length || pricing.total < 1) {
    throw new PromoError("dates", "Choose dates that are still available.");
  }
  return pricing;
}

function readGuest(input: RedeemInput) {
  const text = (value: string, max: number) => value.trim().slice(0, max);
  const firstName = text(input.firstName ?? "", 40);
  const lastName = text(input.lastName ?? "", 40);
  const email = text(input.email ?? "", 120).toLowerCase();
  const phone = text(input.phone ?? "", 20);
  const address = text(input.address ?? "", 120);
  const city = text(input.city ?? "", 60);
  const state = text(input.state ?? "", 2).toUpperCase();
  const zip = text(input.zip ?? "", 10);
  const notes = text(input.notes ?? "", 500);
  const checkInTime = text(input.checkInTime ?? "", 5);
  if (
    firstName.length < 1
    || lastName.length < 1
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || phone.length < 7
    || address.length < 4
    || city.length < 2
    || !/^[A-Z]{2}$/.test(state)
    || !/^\d{5}(-\d{4})?$/.test(zip)
  ) {
    throw new PromoError("details", "Check the contact and delivery details, then try the code again.");
  }
  return {
    dates: input.dates,
    checkInTime,
    firstName,
    lastName,
    email,
    phone,
    address,
    city,
    state,
    zip,
    notes,
  };
}

async function findAvailableCode(client: pg.Client, code: string) {
  const result = await client.query<{ code: string; percentOff: number; redeemedAt: Date | null }>(
    `select code, "percentOff", "redeemedAt" from "PromoCode" where code = $1`,
    [code],
  );
  const promo = result.rows[0];
  if (!promo) throw new PromoError("invalid", "That code is not valid.");
  if (promo.redeemedAt) throw new PromoError("used", "That code has already been used.");
  return promo;
}

async function insertBooking(
  client: pg.Client,
  input: {
    id: string;
    guest: ReturnType<typeof readGuest>;
    schedule: { checkInAt: string; checkOutAt: string };
    pricing: ReturnType<typeof calculateRentalPrice>;
    promoCode: string;
    promoDiscountCents: number;
  },
) {
  const snapshot = input.pricing.lineItems.map((item) => ({
    date: toDateKey(item.date),
    amountCents: item.amount,
  }));
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const reference = `ES${randomBytes(3).toString("hex").toUpperCase()}`;
    try {
      await client.query(
        `insert into "Booking" (
           id, reference, "customerName", phone, email, "deliveryAddress", city, state, "postalCode",
           "deliveryNotes", "selectedDates", "checkInAt", "checkOutAt", "durationDays",
           "perDayPriceSnapshot", "subtotalCents", "discountCents", "totalCents",
           "paymentStatus", "promoCode", "promoDiscountCents", status, "updatedAt"
         ) values (
           $1, $2, $3, $4, $5, $6, $7, $8, $9,
           $10, $11::timestamp[], $12, $13, $14,
           $15::jsonb, $16, $17, 0,
           'PAID', $18, $19, 'CONFIRMED', now()
         )`,
        [
          input.id,
          reference,
          `${input.guest.firstName} ${input.guest.lastName}`,
          input.guest.phone,
          input.guest.email,
          input.guest.address,
          input.guest.city,
          input.guest.state,
          input.guest.zip,
          input.guest.notes || null,
          input.guest.dates.map((date) => `${date}T12:00:00-05:00`),
          new Date(`${input.schedule.checkInAt}-05:00`),
          new Date(`${input.schedule.checkOutAt}-05:00`),
          input.pricing.lineItems.length,
          JSON.stringify(snapshot),
          input.pricing.subtotal,
          input.pricing.discount,
          input.promoCode,
          input.promoDiscountCents,
        ],
      );
      return reference;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  throw new Error("Could not save the booking.");
}

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

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}
