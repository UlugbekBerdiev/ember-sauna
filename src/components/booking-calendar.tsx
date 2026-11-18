"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhotoPlaceholder } from "@/components/site-shell";
import { calculateRentalPrice, formatCurrency, fromDateKey, getDailyRate, toDateKey } from "@/lib/pricing";
import { useBooking } from "@/lib/booking-store";

const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

function buildMonth(year: number, month: number) {
  const count = new Date(year, month + 1, 0).getDate();
  const leading = new Date(year, month, 1).getDay();
  return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => new Date(year, month, index + 1))];
}

function datesBetween(start: Date, end: Date) {
  const first = start < end ? start : end;
  const last = start < end ? end : start;
  const dates: Date[] = [];
  const cursor = new Date(first);
  while (cursor <= last) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export function BookingCalendar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { booking, updateBooking } = useBooking();
  const initial = searchParams.get("date");
  const initialDate = initial && /^\d{4}-\d{2}-\d{2}$/.test(initial) ? fromDateKey(initial) : new Date();
  const [view, setView] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selected, setSelected] = useState<Date[]>(() => initial ? [initialDate] : []);

  useEffect(() => {
    if (!booking.dates.length || selected.length) return;
    const timer = window.setTimeout(() => setSelected(booking.dates.map(fromDateKey)), 0);
    return () => window.clearTimeout(timer);
  }, [booking.dates, selected.length]);

  const cells = useMemo(() => buildMonth(view.getFullYear(), view.getMonth()), [view]);
  const pricing = calculateRentalPrice(selected);
  const selectedKeys = new Set(selected.map(toDateKey));

  function selectDate(date: Date) {
    let next: Date[];
    if (selected.length === 0 || selected.length > 1) next = [date];
    else if (toDateKey(selected[0]) === toDateKey(date)) next = [];
    else next = datesBetween(selected[0], date);
    setSelected(next);
    updateBooking({ dates: next.map(toDateKey) });
  }

  function changeMonth(offset: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  return (
    <div className="container booking-layout">
      <section aria-labelledby="calendar-heading">
        <div className="calendar-head">
          <button className="icon-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <h1 id="calendar-heading">{view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h1>
          <button className="icon-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
        </div>
        <p className="placeholder-note">Select a start and end date. Availability is illustrative until the server booking system is connected.</p>
        <div className="calendar-grid" role="grid" aria-label={`${view.toLocaleDateString("en-US", { month: "long", year: "numeric" })} rental calendar`}>
          {weekdays.map((day) => <div className="weekday" role="columnheader" key={day}>{day}</div>)}
          {cells.map((date, index) => date ? (
            <button
              className={`day-cell ${selectedKeys.has(toDateKey(date)) ? "selected" : ""}`}
              type="button"
              role="gridcell"
              aria-selected={selectedKeys.has(toDateKey(date))}
              aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${formatCurrency(getDailyRate(date))}`}
              onClick={() => selectDate(date)}
              key={toDateKey(date)}
            >
              <span className="day-number">{date.getDate()}</span>
              <span className="day-price">{formatCurrency(getDailyRate(date))}</span>
            </button>
          ) : <div className="day-cell" role="gridcell" aria-disabled="true" key={`blank-${index}`} />)}
        </div>
      </section>

      <aside className="summary-card" aria-live="polite">
        <PhotoPlaceholder className="summary-image" label="Ember sauna trailer" />
        <div className="summary-content">
          {pricing.lineItems.length ? pricing.lineItems.map(({ date, amount }) => (
            <div className="summary-line" key={toDateKey(date)}>
              <p>{date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</p>
              <p>{formatCurrency(amount)}</p>
            </div>
          )) : <p>Select your rental date{selected.length === 0 ? "s" : ""} to see a total.</p>}
          <hr className="gold-rule" />
          <div className="summary-line"><p>Subtotal</p><p>{formatCurrency(pricing.subtotal)}</p></div>
          {pricing.discount > 0 && <div className="summary-line"><p>{pricing.lineItems.length}-day {pricing.discountRate * 100}% off</p><p>−{formatCurrency(pricing.discount)}</p></div>}
          <hr className="gold-rule" />
          <div className="summary-line summary-total"><p>Total</p><p>{formatCurrency(pricing.total)}</p></div>
          <button className="button" type="button" disabled={!selected.length} onClick={() => router.push("/book/details")}>Continue</button>
          <p className="placeholder-note">Rental only. No unapproved delivery fee, tax, deposit, or extras are included.</p>
        </div>
      </aside>
    </div>
  );
}
