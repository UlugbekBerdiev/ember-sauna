"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useBooking } from "@/lib/booking-store";

export function QuickBooking() {
  const router = useRouter();
  const { updateBooking } = useBooking();
  const [date, setDate] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!date) return setError("Choose a rental date.");
    if (!/^\d{5}$/.test(zip)) return setError("Enter a valid 5-digit ZIP code.");
    updateBooking({ dates: [date], zip });
    setError("");
    router.push(`/book?date=${date}`);
  }

  return (
    <form className="quick-form" onSubmit={submit} noValidate>
      <div className="field">
        <label htmlFor="quick-date">Rental date</label>
        <input className="input" id="quick-date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="quick-zip">Delivery ZIP code</label>
        <input className="input" id="quick-zip" inputMode="numeric" autoComplete="postal-code" placeholder="5-digit ZIP" value={zip} onChange={(event) => setZip(event.target.value)} required />
      </div>
      <button className="button" type="submit">Check availability</button>
      {error && <p className="status" role="alert">{error}</p>}
      <p className="placeholder-note status">Phase 1 note: ZIP eligibility and live availability require the booking backend.</p>
    </form>
  );
}
