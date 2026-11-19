import { NextResponse } from "next/server";
import { rejectsCrossSitePost } from "@/lib/form-post";
import { redeemFreePromo } from "@/lib/promo";
import { promoResponse, readBody, readDates } from "@/lib/checkout-body";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) {
    return NextResponse.json({ error: "retry" }, { status: 403 });
  }
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const booking = await redeemFreePromo({
      code: String(body.code ?? ""),
      dates: readDates(body.dates),
      checkInTime: String(body.checkInTime ?? ""),
      firstName: String(body.firstName ?? ""),
      lastName: String(body.lastName ?? ""),
      email: String(body.email ?? ""),
      phone: String(body.phone ?? ""),
      address: String(body.address ?? ""),
      city: String(body.city ?? ""),
      state: String(body.state ?? ""),
      zip: String(body.zip ?? ""),
      notes: String(body.notes ?? ""),
    });
    return NextResponse.json(booking);
  } catch (error) {
    return promoResponse(error);
  }
}
