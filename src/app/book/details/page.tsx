"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { BookingShell } from "@/components/booking-shell";
import { useBooking } from "@/lib/booking-store";

export default function DetailsPage() {
  const router = useRouter();
  const { booking, updateBooking } = useBooking();
  const field = (name: keyof typeof booking, label: string, options: { type?: string; autoComplete?: string; required?: boolean } = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input className="input" id={name} name={name} type={options.type} autoComplete={options.autoComplete} required={options.required ?? true} value={String(booking[name])} onChange={(event) => updateBooking({ [name]: event.target.value })} />
    </div>
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    router.push("/book/payment");
  }

  return (
    <BookingShell activeStep={2}>
      <section className="booking-panel" aria-labelledby="details-heading">
        <p className="eyebrow">Delivery and contact</p>
        <h1 id="details-heading">Where should we bring the heat?</h1>
        <p>Enter your contact and delivery details. Eligibility and site-access review will be server-validated in a later phase.</p>
        <form className="form-grid" onSubmit={submit}>
          {field("firstName", "First name", { autoComplete: "given-name" })}
          {field("lastName", "Last name", { autoComplete: "family-name" })}
          {field("email", "Email", { type: "email", autoComplete: "email" })}
          {field("phone", "Mobile phone", { type: "tel", autoComplete: "tel" })}
          <div className="full">{field("address", "Delivery address", { autoComplete: "street-address" })}</div>
          {field("city", "City", { autoComplete: "address-level2" })}
          {field("state", "State", { autoComplete: "address-level1" })}
          {field("zip", "ZIP code", { autoComplete: "postal-code" })}
          <div className="field">
            <label htmlFor="notes">Delivery or access notes (optional)</label>
            <textarea className="input" id="notes" value={booking.notes} onChange={(event) => updateBooking({ notes: event.target.value })} />
          </div>
          <div className="booking-actions full"><Link className="link-arrow" href="/book">← Back to dates</Link><button className="button" type="submit">Continue to payment</button></div>
        </form>
      </section>
    </BookingShell>
  );
}
