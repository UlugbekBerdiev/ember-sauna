import { NextResponse } from "next/server";
import { finalizePaidCheckout } from "@/lib/promo";
import { getStripe } from "@/lib/stripe-server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
  const signature = request.headers.get("stripe-signature") ?? "";
  if (!secret || !signature) {
    return NextResponse.json({ error: "stripe" }, { status: 400 });
  }
  const payload = await request.text();
  try {
    const event = getStripe().webhooks.constructEvent(payload, signature, secret);
    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object;
      const charged = intent.amount_received > 0 ? intent.amount_received : intent.amount;
      await finalizePaidCheckout(intent.id, charged);
    }
    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "stripe" }, { status: 400 });
  }
}
