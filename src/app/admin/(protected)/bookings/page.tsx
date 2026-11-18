import Link from "next/link";
import type { BookingStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { StatusBadge, PaymentBadge, formatAdminDateTime } from "@/components/admin/admin-ui";
import { formatCurrency } from "@/lib/pricing";

const filters: Array<{ label: string; value: BookingStatus | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Awaiting delivery", value: "AWAITING_DELIVERY" },
  { label: "Active on site", value: "ACTIVE_ON_SITE" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Canceled", value: "CANCELED" },
];

export const metadata = { title: "Bookings" };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const requested = (await searchParams).status ?? "ALL";
  const filter = filters.some((item) => item.value === requested) ? requested : "ALL";
  const statuses =
    filter === "AWAITING_DELIVERY"
      ? ["CONFIRMED", "AWAITING_DELIVERY"]
      : filter === "ALL"
        ? undefined
        : [filter];
  const bookings = await prisma.booking.findMany({
    where: statuses ? { status: { in: statuses as BookingStatus[] } } : undefined,
    orderBy: { checkInAt: "desc" },
  });

  return (
    <>
      <div className="admin-page-heading">
        <div><p className="eyebrow">Operations</p><h1>Bookings</h1></div>
        <span>{bookings.length} results</span>
      </div>
      <nav className="admin-filters" aria-label="Filter bookings by status">
        {filters.map((item) => <Link className={filter === item.value ? "active" : ""} href={item.value === "ALL" ? "/admin/bookings" : `/admin/bookings?status=${item.value}`} key={item.value}>{item.label}</Link>)}
      </nav>
      <section className="admin-panel admin-booking-list">
        {bookings.map((booking) => (
          <Link className="admin-booking-list-row" href={`/admin/bookings/${booking.id}`} key={booking.id}>
            <div><span className="eyebrow">{booking.reference}</span><strong>{booking.customerName}</strong></div>
            <div><small>Schedule</small><span>{formatAdminDateTime(booking.checkInAt)} → {formatAdminDateTime(booking.checkOutAt)}</span></div>
            <div><small>Location</small><span>{booking.city}, MD</span></div>
            <StatusBadge status={booking.status} />
            <span><PaymentBadge status={booking.paymentStatus} /> {formatCurrency(booking.totalCents)}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
        {!bookings.length && <p className="admin-empty">No bookings match this filter.</p>}
      </section>
    </>
  );
}
