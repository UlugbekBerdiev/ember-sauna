import { randomInt } from "node:crypto";

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizePromoCode(value: string) {
  const code = value
    .trim()
    .toUpperCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^A-Z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const compact = code.replace(/-/g, "");
  if (compact.length < 4 || compact.length > 24) return "";
  return code;
}

export function applyPercentDiscount(amountCents: number, percentOff: number) {
  if (!Number.isInteger(amountCents) || amountCents < 0) {
    throw new Error("Amount is invalid.");
  }
  if (!Number.isInteger(percentOff) || percentOff < 1 || percentOff > 100) {
    throw new Error("Percent must be from 1 to 100.");
  }
  if (percentOff === 100) return { discountCents: amountCents, totalCents: 0 };
  const discountCents = Math.round((amountCents * percentOff) / 100);
  return { discountCents, totalCents: amountCents - discountCents };
}

export function generatePromoCode() {
  let suffix = "";
  for (let index = 0; index < 6; index += 1) {
    suffix += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
  }
  return `EMBER-${suffix}`;
}
