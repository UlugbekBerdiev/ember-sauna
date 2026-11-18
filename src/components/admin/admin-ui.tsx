import Link from "next/link";
import type { BookingStatus, PaymentStatus } from "@/generated/prisma/enums";
import { getAdminStatusLabel } from "@/lib/booking-status";
import { formatCurrency } from "@/lib/pricing";

export function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={`admin-status status-${status.toLowerCase()}`}>● {getAdminStatusLabel(status)}</span>;
}

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={`admin-payment payment-${status.toLowerCase()}`}>{status === "PAID" ? "Paid" : titleCase(status)}</span>;
}

export function formatAdminDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function formatAdminDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function AdminMonthCalendar({
  year,
  month,
  bookings,
}: {
  year: number;
  month: number;
  bookings: Array<{
    id: string;
    customerName: string;
    selectedDates: Date[];
    status: BookingStatus;
  }>;
}) {
  const firstDay = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const bookedDays = new Map<number, { id: string; initials: string; canceled: boolean }>();
  bookings.forEach((booking) => {
    booking.selectedDates.forEach((date) => {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        year: "numeric",
        month: "numeric",
        day: "numeric",
      }).formatToParts(date);
      const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
      if (get("year") === year && get("month") === month + 1) {
        bookedDays.set(get("day"), {
          id: booking.id,
          initials: booking.customerName.split(/\s+/).map((name) => name[0]).slice(0, 2).join("").toUpperCase(),
          canceled: booking.status === "CANCELED",
        });
      }
    });
  });

  return (
    <section className="admin-calendar-card" aria-label={`${new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })} booking calendar`}>
      <h2>{new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</h2>
      <div className="admin-calendar-grid">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span className="calendar-weekday" key={`${day}-${index}`}>{day}</span>)}
        {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
        {Array.from({ length: dayCount }, (_, index) => {
          const day = index + 1;
          const booking = bookedDays.get(day);
          return booking ? (
            <Link className={booking.canceled ? "calendar-booked canceled" : "calendar-booked"} href={`/admin/bookings/${booking.id}`} key={day}>
              <strong>{day}</strong><small>{booking.initials}</small>
            </Link>
          ) : <span className="calendar-day" key={day}>{day}</span>;
        })}
      </div>
    </section>
  );
}

export function BookingPrice({ cents }: { cents: number }) {
  return <>{formatCurrency(cents)}</>;
}

function titleCase(value: string) {
  return value.toLowerCase().replace(/(^|_)(\w)/g, (_, space, letter) => `${space ? " " : ""}${letter.toUpperCase()}`);
}
