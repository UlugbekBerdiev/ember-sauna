import { NextResponse } from "next/server";
import { promoResponse, readBody, readDates } from "@/lib/checkout-body";
import { rejectsCrossSitePost } from "@/lib/form-post";
import { PromoError, previewCheckout, rememberCheckout, type RedeemInput } from "@/lib/promo";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (rejectsCrossSitePost(request)) {
    return NextResponse.json({ error: "retry" }, { status: 403 });
  }
  const body = await readBody(request);
  if (!body) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const input = readCheckout(body);
  try {
    const preview = await previewCheckout(input);
    if (preview.amountDue === 0) {
      return NextResponse.json({ free: true });
    }
    if (preview.amountDue < 50) {
      throw new PromoError("balance", "The remaining balance is below the card minimum.");
    }
    const intent = await getStripe().paymentIntents.create({
      amount: preview.amountDue,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: input.email.trim().toLowerCase(),
      metadata: {
        promoCode: preview.promo?.code ?? "",
      },
    });
    if (!intent.client_secret) {
      throw new PromoError("stripe", "Card payment could not be started.");
    }
    await rememberCheckout(intent.id, input, preview.amountDue, preview.promo?.code ?? null);
    return NextResponse.json({ clientSecret: intent.client_secret });
  } catch (error) {
    return promoResponse(error);
  }
}

function readCheckout(body: Record<string, unknown>): RedeemInput {
  return {
    code: String(body.code ?? ""),
    dates: readDates(body.dates),
    checkInTime: String(body.checkInTime ?? ""),
    checkOutTime: String(body.checkOutTime ?? ""),
    firstName: String(body.firstName ?? ""),
    lastName: String(body.lastName ?? ""),
    email: String(body.email ?? ""),
    phone: String(body.phone ?? ""),
    address: String(body.address ?? ""),
    city: String(body.city ?? ""),
    state: String(body.state ?? ""),
    zip: String(body.zip ?? ""),
    notes: String(body.notes ?? ""),
  };
}
