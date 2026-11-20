"use client";

import { FormEvent, useState } from "react";
import type { BookingDetails } from "@/lib/booking-store";

export type PromoQuote = {
  code: string;
  percentOff: number;
  discountCents: number;
  totalCents: number;
};

export function PromoCheckout({
  booking,
  onQuote,
}: {
  booking: BookingDetails;
  onQuote: (quote: PromoQuote | null) => void;
}) {
  const [code, setCode] = useState("");
  const [quote, setQuote] = useState<PromoQuote | null>(null);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [reference, setReference] = useState("");

  async function apply(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setReference("");
    try {
      const next = await postQuote("/api/checkout/promo", { code, dates: booking.dates });
      setQuote(next);
      onQuote(next);
      setMessage(
        next.totalCents === 0
          ? `${next.code} covers the full total. Confirm to use this one-time code.`
          : `${next.code} takes ${next.percentOff}% off. The code stays unused until the card payment succeeds.`,
      );
    } catch (error) {
      setQuote(null);
      onQuote(null);
      setMessage(error instanceof Error ? error.message : "That code is not valid.");
    } finally {
      setPending(false);
    }
  }

  async function confirm() {
    if (!quote || quote.totalCents !== 0) return;
    setPending(true);
    setMessage("");
    try {
      const result = await postJson("/api/checkout/redeem", { ...booking, code: quote.code });
      setReference(String(result.reference ?? ""));
      setMessage(`${quote.code} is used. Your booking is confirmed.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That code could not be used.");
    } finally {
      setPending(false);
    }
  }

  if (reference) {
    return (
      <div className="checkout-placeholder">
        <p className="eyebrow">Booking confirmed</p>
        <p>Reference <strong>{reference}</strong>. The promo code can only be used once.</p>
      </div>
    );
  }

  return (
    <form className="form-grid" onSubmit={apply}>
      <div className="field">
        <label htmlFor="promo-code">Promo code</label>
        <input
          className="input"
          id="promo-code"
          name="promo-code"
          autoComplete="off"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="EMBER-XXXXXX"
        />
      </div>
      <div className="field" style={{ alignSelf: "end" }}>
        <button className="button" id="apply-promo" type="submit" disabled={pending || booking.dates.length === 0}>
          Apply code
        </button>
      </div>
      {message && <p className="full placeholder-note">{message}</p>}
      {quote && quote.totalCents === 0 && (
        <div className="full">
          <button className="button" type="button" disabled={pending} onClick={confirm}>
            Confirm free booking
          </button>
        </div>
      )}
    </form>
  );
}

async function postQuote(path: string, body: unknown) {
  const result = await postJson(path, body);
  if (
    typeof result.code !== "string"
    || typeof result.percentOff !== "number"
    || typeof result.discountCents !== "number"
    || typeof result.totalCents !== "number"
  ) {
    throw new Error("That code is not valid.");
  }
  return result as PromoQuote;
}

async function postJson(path: string, body: unknown) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({})) as {
    message?: string;
    reference?: string;
    code?: string;
    percentOff?: number;
    discountCents?: number;
    totalCents?: number;
  };
  if (!response.ok) throw new Error(result.message || "That code is not valid.");
  return result;
}
