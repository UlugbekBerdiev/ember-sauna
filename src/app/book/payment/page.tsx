"use client";

import { useState } from "react";
import Link from "next/link";
import { BookingShell } from "@/components/booking-shell";
import { CardCheckout } from "@/components/card-checkout";
import { BookingScheduleSummary } from "@/components/booking-schedule-summary";
import { PromoCheckout, type PromoQuote } from "@/components/promo-checkout";
import { useBooking } from "@/lib/booking-store";
import { billableDateKeys, calculateRentalPrice, formatCurrency, fromDateKey } from "@/lib/pricing";

export default function PaymentPage() {
  const { booking } = useBooking();
  const billedKeys = booking.checkInAt && booking.checkOutAt
    ? billableDateKeys(booking.dates, booking.checkInAt, booking.checkOutAt)
    : booking.dates;
  const pricing = calculateRentalPrice(billedKeys.map(fromDateKey));
  const datesKey = `${billedKeys.join(",")}|${booking.checkInAt}|${booking.checkOutAt}`;
  const [promo, setPromo] = useState<{ datesKey: string; quote: PromoQuote } | null>(null);
  const activePromo = promo?.datesKey === datesKey ? promo.quote : null;
  const total = activePromo ? activePromo.totalCents : pricing.total;

  return (
    <BookingShell activeStep={3}>
      <div className="container booking-layout">
        <section className="booking-panel" style={{margin: 0}} aria-labelledby="payment-heading">
          <p className="eyebrow">Secure card payment</p>
          <h1 id="payment-heading">Complete your booking</h1>
          <PromoCheckout key={datesKey} booking={booking} onQuote={(quote) => setPromo(quote ? { datesKey, quote } : null)} />
          {total > 0 && (
            <CardCheckout booking={booking} code={activePromo?.code ?? ""} amountCents={total} />
          )}
          <div className="booking-actions"><Link className="link-arrow" href="/book/details">← Back to details</Link></div>
        </section>
        <aside className="summary-card">
          <div className="summary-content">
            <p className="eyebrow">Order summary</p>
            <BookingScheduleSummary checkInAt={booking.checkInAt} checkOutAt={booking.checkOutAt} />
            {(booking.checkInAt || booking.checkOutAt) && <hr className="gold-rule" />}
            {pricing.lineItems.map(({ date, amount }) => <div className="summary-line" key={date.toISOString()}><p>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p><p>{formatCurrency(amount)}</p></div>)}
            {billedKeys.length > booking.dates.length && <p className="placeholder-note">This stay runs past {booking.dates.length * 24} hours, so it is priced as a {billedKeys.length}-day rental.</p>}
            {!pricing.lineItems.length && <p>No dates selected. <Link className="link-arrow" href="/book">Choose dates</Link>.</p>}
            <hr className="gold-rule" />
            <div className="summary-line"><p>Rental subtotal</p><p>{formatCurrency(pricing.subtotal)}</p></div>
            {pricing.discount > 0 && <div className="summary-line"><p>{pricing.discountRate * 100}% multi-day discount</p><p>−{formatCurrency(pricing.discount)}</p></div>}
            {activePromo && <div className="summary-line"><p>Promo {activePromo.code} · {activePromo.percentOff}% off</p><p>−{formatCurrency(activePromo.discountCents)}</p></div>}
            <div className="summary-line summary-total"><p>Total</p><p>{formatCurrency(total)}</p></div>
            {booking.address && <><hr className="gold-rule" /><p>{booking.address}<br />{booking.city}, {booking.state} {booking.zip}</p></>}
            <p className="placeholder-note">Final production checkout must add configured delivery fees, taxes, deposit, legal agreement, server-side availability recheck, and a price snapshot before creating payment.</p>
          </div>
        </aside>
      </div>
    </BookingShell>
  );
}
