"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import type { BookingDetails } from "@/lib/booking-store";
import { formatCurrency } from "@/lib/pricing";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const stripePromise = publishableKey.startsWith("pk_") ? loadStripe(publishableKey) : null;

export function CardCheckout({
  booking,
  code,
  amountCents,
}: {
  booking: BookingDetails;
  code: string;
  amountCents: number;
}) {
  const [clientSecret, setClientSecret] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  if (!stripePromise) {
    return <p className="placeholder-note">Card payment is not configured on this deployment.</p>;
  }

  async function start() {
    setPending(true);
    setMessage("");
    try {
      const response = await fetch("/api/checkout/payment-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...booking, code }),
      });
      const result = await response.json().catch(() => ({})) as { message?: string; clientSecret?: string };
      if (!response.ok || !result.clientSecret) {
        throw new Error(result.message || "Card payment could not be started.");
      }
      setClientSecret(result.clientSecret);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Card payment could not be started.");
    } finally {
      setPending(false);
    }
  }

  if (!clientSecret) {
    return (
      <div>
        <button className="button" type="button" disabled={pending || booking.dates.length === 0} onClick={start}>
          {pending ? "Starting payment" : `Pay ${formatCurrency(amountCents)}`}
        </button>
        {message && <p className="placeholder-note">{message}</p>}
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "night" } }}>
      <PayForm />
    </Elements>
  );
}

function PayForm() {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function pay(event: FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setPending(true);
    setMessage("");
    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: { return_url: `${window.location.origin}/book/confirmation` },
    });
    if (result.error) {
      setMessage(result.error.message || "The card payment was not completed.");
      setPending(false);
      return;
    }
    const paymentIntentId = result.paymentIntent?.id ?? "";
    try {
      const response = await fetch("/api/checkout/complete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ paymentIntentId }),
      });
      const saved = await response.json().catch(() => ({})) as { reference?: string; message?: string };
      if (!response.ok || !saved.reference) {
        throw new Error(saved.message || "The payment succeeded, but the booking was not saved.");
      }
      router.push(`/book/confirmation?reference=${encodeURIComponent(saved.reference)}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The booking was not saved.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={pay}>
      <PaymentElement />
      <div className="booking-actions">
        <button className="button" type="submit" disabled={pending || !stripe || !elements}>
          {pending ? "Confirming payment" : "Pay and confirm booking"}
        </button>
      </div>
      {message && <p className="placeholder-note">{message}</p>}
    </form>
  );
}
