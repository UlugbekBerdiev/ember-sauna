import Stripe from "stripe";
import { PromoError } from "@/lib/promo";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim() ?? "";
  if (!key.startsWith("sk_")) {
    throw new PromoError("stripe", "Card payment is not configured.");
  }
  return new Stripe(key);
}

export async function readSucceededCharge(paymentIntentId: string) {
  if (!/^pi_[A-Za-z0-9_]+$/.test(paymentIntentId)) {
    throw new PromoError("invalid", "This payment could not be confirmed.");
  }
  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== "succeeded") {
    throw new PromoError("stripe", "The card payment has not been completed.");
  }
  const charged = intent.amount_received > 0 ? intent.amount_received : intent.amount;
  return { id: intent.id, chargedCents: charged };
}
