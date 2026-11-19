import { NextResponse } from "next/server";
import { PromoError } from "@/lib/promo";

export function promoResponse(error: unknown) {
  if (error instanceof PromoError) {
    return NextResponse.json({ error: error.code, message: error.message }, { status: 400 });
  }
  return NextResponse.json(
    { error: "database", message: "The booking database is unavailable. Try again." },
    { status: 503 },
  );
}

export async function readBody(request: Request) {
  const raw = await request.text();
  if (raw.length > 8000) return null;
  try {
    const body = JSON.parse(raw) as Record<string, unknown>;
    return body && typeof body === "object" ? body : null;
  } catch {
    return null;
  }
}

export function readDates(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").slice(0, 14);
}
