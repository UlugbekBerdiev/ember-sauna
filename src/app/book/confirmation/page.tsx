"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BookingShell } from "@/components/booking-shell";

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<BookingShell activeStep={3}><section className="booking-panel"><p>Confirming your booking</p></section></BookingShell>}>
      <Confirmation />
    </Suspense>
  );
}

function Confirmation() {
  const params = useSearchParams();
  const initialReference = params.get("reference") ?? "";
  const paymentIntentId = params.get("payment_intent") ?? "";
  const failed = params.get("redirect_status") === "failed";
  const [reference, setReference] = useState(initialReference);
  const [message, setMessage] = useState(
    initialReference
      ? ""
      : failed
        ? "The card payment was not completed."
        : paymentIntentId
          ? "Confirming your payment."
          : "This page opens after a card payment.",
  );

  useEffect(() => {
    if (reference || !paymentIntentId || failed) return;
    let cancelled = false;
    void fetch("/api/checkout/complete", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    })
      .then(async (response) => {
        const result = await response.json().catch(() => ({})) as { reference?: string; message?: string };
        if (cancelled) return;
        if (!response.ok || !result.reference) {
          setMessage(result.message || "The booking was not saved.");
          return;
        }
        setReference(result.reference);
        setMessage("");
      })
      .catch(() => {
        if (!cancelled) setMessage("The booking was not saved.");
      });
    return () => {
      cancelled = true;
    };
  }, [failed, paymentIntentId, reference]);

  return (
    <BookingShell activeStep={3}>
      <section className="booking-panel" aria-labelledby="confirmation-heading">
        <p className="eyebrow">Booking confirmation</p>
        <h1 id="confirmation-heading">{reference ? "Your booking is confirmed" : "Confirming your booking"}</h1>
        {reference && <p>Reference <strong>{reference}</strong>. Save this reference. Ember does not send an email or a text message for the booking.</p>}
        {!reference && <p>{message}</p>}
        <div className="booking-actions">
          <Link className="link-arrow" href="/">Back to Ember</Link>
        </div>
      </section>
    </BookingShell>
  );
}
