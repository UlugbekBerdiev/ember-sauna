import Link from "next/link";
import { prisma } from "@/lib/db";
import {
  AdminMonthCalendar,
  BookingPrice,
  PaymentBadge,
  StatusBadge,
  formatAdminDateTime,
} from "@/components/admin/admin-ui";

export const metadata = { title: "Admin dashboard" };

export default async function AdminDashboardPage() {
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    orderBy: { checkInAt: "asc" },
  });
  const upcoming = bookings.filter(
    (booking) =>
      booking.checkOutAt >= now &&
      booking.status !== "CANCELED" &&
      booking.status !== "COMPLETED",
  );
  const businessMonth = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "numeric",
  }).formatToParts(now);
  const year = Number(businessMonth.find((part) => part.type === "year")?.value);
  const month = Number(businessMonth.find((part) => part.type === "month")?.value) - 1;

  const stats = [
    ["Upcoming", upcoming.length],
    ["Awaiting delivery", bookings.filter((booking) => ["CONFIRMED", "AWAITING_DELIVERY"].includes(booking.status)).length],
    ["Active on site", bookings.filter((booking) => booking.status === "ACTIVE_ON_SITE").length],
    ["Completed", bookings.filter((booking) => booking.status === "COMPLETED").length],
  ];

  return (
    <>
      <h1 className="sr-only">Dashboard</h1>
      <section className="admin-stats" aria-label="Booking summary">
        {stats.map(([label, value]) => <article key={label}><strong>{value}</strong><span>{label}</span></article>)}
      </section>

      <div className="admin-dashboard-grid">
        <AdminMonthCalendar year={year} month={month} bookings={bookings} />
        <section className="admin-panel admin-upcoming">
          <h2>Upcoming Bookings</h2>
          {upcoming.length ? (
            <div className="admin-booking-table" role="table" aria-label="Upcoming bookings">
              <div className="admin-table-head" role="row">
                {["Start", "End", "Duration", "Customer", "Phone", "Location", "Status", "Paid"].map((heading) => <span role="columnheader" key={heading}>{heading}</span>)}
              </div>
              {upcoming.map((booking) => (
                <div className="admin-booking-row" role="row" key={booking.id}>
                  <Link className="admin-row-link" href={`/admin/bookings/${booking.id}`} aria-label={`View booking ${booking.reference}`} />
                  <span data-label="Start">{formatAdminDateTime(booking.checkInAt)}</span>
                  <span data-label="End">{formatAdminDateTime(booking.checkOutAt)}</span>
                  <span data-label="Duration">{booking.durationDays} {booking.durationDays === 1 ? "day" : "days"}</span>
                  <strong data-label="Customer">{booking.customerName}</strong>
                  <span data-label="Phone"><a className="admin-phone" href={`tel:${booking.phone.replace(/\D/g, "")}`}>{booking.phone}</a></span>
                  <span data-label="Location">{booking.city} · {booking.deliveryAddress}</span>
                  <span data-label="Status"><StatusBadge status={booking.status} /></span>
                  <span data-label="Paid"><PaymentBadge status={booking.paymentStatus} /> <BookingPrice cents={booking.totalCents} /></span>
                </div>
              ))}
            </div>
          ) : <p className="admin-empty">No upcoming bookings.</p>}
        </section>
      </div>

      <section className="admin-panel admin-operations">
        <h2>Deliveries &amp; Pickups</h2>
        <p className="admin-panel-note">Open a row to view booking details.</p>
        {upcoming.flatMap((booking) => [
          { action: "Deliver", at: booking.checkInAt, booking },
          { action: "Pickup", at: booking.checkOutAt, booking },
        ]).sort((left, right) => left.at.getTime() - right.at.getTime()).map(({ action, at, booking }) => (
          <Link className="admin-operation-row" href={`/admin/bookings/${booking.id}`} key={`${booking.id}-${action}`}>
            <strong>{action}</strong>
            <span>{formatAdminDateTime(at)}</span>
            <span>{booking.deliveryAddress}, {booking.city} MD</span>
            <span>{booking.reference}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
      </section>
    </>
  );
}
