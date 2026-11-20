"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PhotoPlaceholder } from "@/components/site-shell";
import { BookingScheduleSummary } from "@/components/booking-schedule-summary";
import { calculateRentalPrice, formatCurrency, fromDateKey, getDailyRate, toDateKey } from "@/lib/pricing";
import { useBooking } from "@/lib/booking-store";
import {
  calculateBookingSchedule,
  checkInOptionsForSelection,
  isBookingDateSelectable,
  isDateOccupied,
  type StayWindow,
} from "@/lib/booking-time";

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
  const now = useMemo(() => new Date(), []);
  const [stays, setStays] = useState<StayWindow[]>([]);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const initial = searchParams.get("date");
  const hasValidInitial = Boolean(
    initial &&
    /^\d{4}-\d{2}-\d{2}$/.test(initial) &&
    isBookingDateSelectable(initial, now, stays),
  );
  const initialDate = hasValidInitial ? fromDateKey(initial!) : now;
  const [view, setView] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selected, setSelected] = useState<Date[]>(() => hasValidInitial ? [initialDate] : []);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/availability")
      .then(async (response) => {
        if (!response.ok) throw new Error("unavailable");
        const body = await response.json() as { stays?: Array<{ checkInAt: string; checkOutAt: string }> };
        if (cancelled) return;
        setStays((body.stays ?? []).map((stay) => ({
          checkInAt: new Date(stay.checkInAt),
          checkOutAt: new Date(stay.checkOutAt),
        })));
        setAvailabilityReady(true);
      })
      .catch(() => {
        if (!cancelled) setAvailabilityReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!booking.dates.length || selected.length) return;
    const validDates = booking.dates.filter((dateKey) => isBookingDateSelectable(dateKey, now, stays));
    if (!validDates.length) return;
    const timer = window.setTimeout(() => setSelected(validDates.map(fromDateKey)), 0);
    return () => window.clearTimeout(timer);
  }, [booking.dates, now, selected.length, stays]);

  useEffect(() => {
    if (!availabilityReady) return;
    const timer = window.setTimeout(() => {
      setSelected((current) => current.filter((date) => isBookingDateSelectable(toDateKey(date), now, stays)));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [availabilityReady, now, stays]);

  const cells = useMemo(() => buildMonth(view.getFullYear(), view.getMonth()), [view]);
  const pricing = calculateRentalPrice(selected);
  const selectedKeys = new Set(selected.map(toDateKey));
  const selectedDateKeys = selected.map(toDateKey);
  const availableCheckInOptions = selectedDateKeys.length
    ? checkInOptionsForSelection(selectedDateKeys, now, stays)
    : [];
  const checkInTime = availableCheckInOptions.includes(booking.checkInTime)
    ? booking.checkInTime
    : availableCheckInOptions[0] ?? booking.checkInTime;
  const schedule = calculateBookingSchedule(selectedDateKeys, checkInTime, now, stays);

  function selectDate(date: Date) {
    let next: Date[];
    if (selected.length === 0 || selected.length > 1) next = [date];
    else if (toDateKey(selected[0]) === toDateKey(date)) next = [];
    else next = datesBetween(selected[0], date);
    const nextDateKeys = next.map(toDateKey);
    const nextOptions = nextDateKeys.length
      ? checkInOptionsForSelection(nextDateKeys, now, stays)
      : [];
    const nextCheckInTime = nextOptions.includes(checkInTime) ? checkInTime : nextOptions[0] ?? "08:00";
    const nextSchedule = calculateBookingSchedule(nextDateKeys, nextCheckInTime, now, stays);
    if (nextDateKeys.length && !nextSchedule) return;
    setSelected(next);
    updateBooking({
      dates: nextDateKeys,
      checkInTime: nextCheckInTime,
      checkInAt: nextSchedule?.checkInAt ?? "",
      checkOutAt: nextSchedule?.checkOutAt ?? "",
    });
  }

  function changeMonth(offset: number) {
    setView((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));
  }

  function changeCheckInTime(value: string) {
    const nextSchedule = calculateBookingSchedule(selectedDateKeys, value, now, stays);
    updateBooking({
      checkInTime: value,
      checkInAt: nextSchedule?.checkInAt ?? "",
      checkOutAt: nextSchedule?.checkOutAt ?? "",
    });
  }

  function continueBooking() {
    if (!schedule) return;
    updateBooking({
      dates: selectedDateKeys,
      checkInTime,
      checkInAt: schedule.checkInAt,
      checkOutAt: schedule.checkOutAt,
    });
    router.push("/book/details");
  }

  return (
    <div className="container booking-layout">
      <section aria-labelledby="calendar-heading">
        <div className="calendar-head">
          <button className="icon-button" type="button" onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button>
          <h1 id="calendar-heading">{view.toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h1>
          <button className="icon-button" type="button" onClick={() => changeMonth(1)} aria-label="Next month">›</button>
        </div>
        <p className="placeholder-note">Select a start and end date. Booked days are closed. A checkout day opens three hours after the pickup time.</p>
        <div className="calendar-grid" role="grid" aria-label={`${view.toLocaleDateString("en-US", { month: "long", year: "numeric" })} rental calendar`}>
          {weekdays.map((day) => <div className="weekday" role="columnheader" key={day}>{day}</div>)}
          {cells.map((date, index) => {
            if (!date) return <div className="day-cell" role="gridcell" aria-disabled="true" key={`blank-${index}`} />;
            const dateKey = toDateKey(date);
            const occupied = isDateOccupied(dateKey, stays);
            const selectable = availabilityReady && isBookingDateSelectable(dateKey, now, stays);
            return (
              <button
                className={`day-cell ${selectedKeys.has(dateKey) ? "selected" : ""} ${occupied ? "booked" : ""}`}
                type="button"
                role="gridcell"
                aria-selected={selectedKeys.has(dateKey)}
                aria-label={`${date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}, ${formatCurrency(getDailyRate(date))}${selectable ? "" : ", unavailable"}`}
                onClick={() => selectDate(date)}
                disabled={!selectable}
                key={dateKey}
              >
                <span className="day-number">{date.getDate()}</span>
                <span className="day-price">{occupied ? "Booked" : formatCurrency(getDailyRate(date))}</span>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="summary-card" aria-live="polite">
        <PhotoPlaceholder className="summary-image" label="Ember sauna trailer" />
        <div className="summary-content">
          {selected.length > 0 && (
            <>
              <div className="field booking-time-field">
                <label htmlFor="check-in-time">Check-in time</label>
                <select className="input" id="check-in-time" value={checkInTime} onChange={(event) => changeCheckInTime(event.target.value)}>
                  {availableCheckInOptions.map((time) => (
                    <option value={time} key={time}>
                      {new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </option>
                  ))}
                </select>
              </div>
              {schedule && (
                <BookingScheduleSummary checkInAt={schedule.checkInAt} checkOutAt={schedule.checkOutAt} />
              )}
              {!availableCheckInOptions.length && (
                <p className="placeholder-note">That check-in is too close to another pickup. Choose another day.</p>
              )}
              <hr className="gold-rule" />
            </>
          )}
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
          <button className="button" type="button" disabled={!schedule} onClick={continueBooking}>Continue</button>
          <p className="placeholder-note">Rental only. No unapproved delivery fee, tax, deposit, or extras are included.</p>
        </div>
      </aside>
    </div>
  );
}
