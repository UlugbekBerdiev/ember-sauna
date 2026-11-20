import { NextResponse } from "next/server";
import { promoResponse, readBody } from "@/lib/checkout-body";
import { rejectsCrossSitePost } from "@/lib/form-post";
import { finalizePaidCheckout } from "@/lib/promo";
import { readSucceededCharge } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) {
    return NextResponse.json({ error: "retry" }, { status: 403 });
  }
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });
  try {
    const charge = await readSucceededCharge(String(body.paymentIntentId ?? ""));
    const booking = await finalizePaidCheckout(charge.id, charge.chargedCents);
    return NextResponse.json(booking);
  } catch (error) {
    return promoResponse(error);
  }
}
