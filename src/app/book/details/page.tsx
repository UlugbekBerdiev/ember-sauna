"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AddressAutocomplete } from "@/components/address-autocomplete";
import { BookingShell } from "@/components/booking-shell";
import { BookingScheduleSummary } from "@/components/booking-schedule-summary";
import { isCompletePostal } from "@/lib/address-suggest";
import { useBooking } from "@/lib/booking-store";

export default function DetailsPage() {
  const router = useRouter();
  const { booking, updateBooking } = useBooking();
  const [addressError, setAddressError] = useState("");
  const field = (name: keyof typeof booking, label: string, options: { type?: string; autoComplete?: string; required?: boolean } = {}) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input className="input" id={name} name={name} type={options.type} autoComplete={options.autoComplete} required={options.required ?? true} value={String(booking[name])} onChange={(event) => updateBooking({ [name]: event.target.value })} />
    </div>
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!isCompletePostal(booking)) {
      setAddressError("Choose a suggested address, or enter it as Street, City, ST 12345.");
      return;
    }
    setAddressError("");
    router.push("/book/payment");
  }

  return (
    <BookingShell activeStep={2}>
      <section className="booking-panel" aria-labelledby="details-heading">
        <p className="eyebrow">Delivery and contact</p>
        <h1 id="details-heading">Where should we bring the heat?</h1>
        <p>Enter your contact details and start typing the delivery address. Choose a suggestion, and the street, city, state, and ZIP are saved together.</p>
        <BookingScheduleSummary checkInAt={booking.checkInAt} checkOutAt={booking.checkOutAt} />
        <hr className="gold-rule" />
        <form className="form-grid" onSubmit={submit}>
          {field("firstName", "First name", { autoComplete: "given-name" })}
          {field("lastName", "Last name", { autoComplete: "family-name" })}
          {field("email", "Email", { type: "email", autoComplete: "email" })}
          {field("phone", "Mobile phone", { type: "tel", autoComplete: "tel" })}
          <div className="full">
            <AddressAutocomplete
              id="address"
              value={booking}
              error={addressError}
              onChange={(postal) => {
                updateBooking(postal);
                if (isCompletePostal(postal)) setAddressError("");
              }}
            />
          </div>
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
