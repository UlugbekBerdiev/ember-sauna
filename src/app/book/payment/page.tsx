"use client";

import Link from "next/link";
import { BookingShell } from "@/components/booking-shell";
import { useBooking } from "@/lib/booking-store";
import { calculateRentalPrice, formatCurrency, fromDateKey } from "@/lib/pricing";

export default function PaymentPage() {
  const { booking } = useBooking();
  const pricing = calculateRentalPrice(booking.dates.map(fromDateKey));

  return (
    <BookingShell activeStep={3}>
      <div className="container booking-layout">
        <section className="booking-panel" style={{margin: 0}} aria-labelledby="payment-heading">
          <p className="eyebrow">Secure card payment</p>
          <h1 id="payment-heading">Complete your booking</h1>
          <div className="checkout-placeholder">
            <p className="eyebrow">Stripe Payment Element mount point</p>
            <p>The secure card form will appear here after a server-created PaymentIntent and Stripe publishable key are configured.</p>
            <p className="placeholder-note">No card fields are simulated, no payment is submitted, and this button cannot confirm a booking.</p>
          </div>
          <button className="button" type="button" disabled aria-describedby="stripe-note">Payment setup required</button>
          <p id="stripe-note" className="placeholder-note">Stripe is not connected in this implementation phase.</p>
          <div className="booking-actions"><Link className="link-arrow" href="/book/details">← Back to details</Link></div>
        </section>
        <aside className="summary-card">
          <div className="summary-content">
            <p className="eyebrow">Order summary</p>
            {pricing.lineItems.map(({ date, amount }) => <div className="summary-line" key={date.toISOString()}><p>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p><p>{formatCurrency(amount)}</p></div>)}
            {!pricing.lineItems.length && <p>No dates selected. <Link className="link-arrow" href="/book">Choose dates</Link>.</p>}
            <hr className="gold-rule" />
            <div className="summary-line"><p>Rental subtotal</p><p>{formatCurrency(pricing.subtotal)}</p></div>
            {pricing.discount > 0 && <div className="summary-line"><p>{pricing.discountRate * 100}% multi-day discount</p><p>−{formatCurrency(pricing.discount)}</p></div>}
            <div className="summary-line summary-total"><p>Total</p><p>{formatCurrency(pricing.total)}</p></div>
            {booking.address && <><hr className="gold-rule" /><p>{booking.address}<br />{booking.city}, {booking.state} {booking.zip}</p></>}
            <p className="placeholder-note">Final production checkout must add configured delivery fees, taxes, deposit, legal agreement, server-side availability recheck, and a price snapshot before creating payment.</p>
          </div>
        </aside>
      </div>
    </BookingShell>
  );
}
