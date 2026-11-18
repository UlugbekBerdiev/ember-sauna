import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatCurrency } from "@/lib/pricing";
import {
  PaymentBadge,
  StatusBadge,
  formatAdminDate,
  formatAdminDateTime,
} from "@/components/admin/admin-ui";
import { StatusActionForm } from "@/components/admin/status-action-form";
import { updateBookingStatusAction } from "@/app/admin/(protected)/bookings/actions";

type PriceSnapshot = Array<{ date: string; amountCents: number }>;

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      auditLogs: {
        orderBy: { createdAt: "desc" },
        include: { adminUser: { select: { username: true } } },
      },
    },
  });
  if (!booking) notFound();

  const priceSnapshot = booking.perDayPriceSnapshot as PriceSnapshot;
  const selectedRange = booking.selectedDates
    .map(formatAdminDate)
    .join(booking.selectedDates.length > 1 ? " – " : "");
  const mapsQuery = encodeURIComponent(
    `${booking.deliveryAddress}, ${booking.city}, ${booking.state} ${booking.postalCode}`,
  );
  const markDelivered = updateBookingStatusAction.bind(null, booking.id, "MARK_DELIVERED");
  const markPickedUp = updateBookingStatusAction.bind(null, booking.id, "MARK_PICKED_UP");
  const cancel = updateBookingStatusAction.bind(null, booking.id, "CANCEL");

  return (
    <>
      <div className="admin-detail-heading">
        <Link href="/admin/bookings" aria-label="Back to bookings">‹</Link>
        <h1>Booking #{booking.reference}</h1>
        <StatusBadge status={booking.status} />
      </div>

      <div className="admin-detail-grid">
        <section className="admin-panel">
          <h2>Customer</h2>
          <strong className="admin-detail-name">{booking.customerName}</strong>
          <p><span className="admin-label">Phone</span> <a href={`tel:${booking.phone.replace(/\D/g, "")}`}>{booking.phone} · tap to call</a></p>
          <p><span className="admin-label">Email</span> <a href={`mailto:${booking.email}`}>{booking.email}</a></p>
        </section>
        <section className="admin-panel">
          <h2>Delivery</h2>
          <address>{booking.deliveryAddress}<br />{booking.city}, {booking.state} {booking.postalCode}</address>
          <a className="admin-gold-link" href={`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`} target="_blank" rel="noreferrer">Open in Maps ↗</a>
          {booking.deliveryNotes && <p><span className="admin-label">Notes</span> {booking.deliveryNotes}</p>}
        </section>
      </div>

      <section className="admin-panel admin-schedule-panel">
        <h2>Rental schedule</h2>
        <p><span className="admin-label">Selected days</span> {selectedRange} · {booking.durationDays} {booking.durationDays === 1 ? "day" : "days"}</p>
        <div className="admin-time-grid">
          <div><span>Check-in</span><strong>{formatAdminDateTime(booking.checkInAt)}</strong></div>
          <div><span>Check-out</span><strong>{formatAdminDateTime(booking.checkOutAt)}</strong></div>
        </div>
        <p className="placeholder-note">Automatic rule: check-out is one hour before check-in on the last selected day, or the next day for a one-day rental.</p>
        <div className="admin-price-lines">
          {priceSnapshot.map((line) => <span key={line.date}>{formatAdminDate(new Date(`${line.date}T12:00:00-05:00`))} {formatCurrency(line.amountCents)}</span>)}
        </div>
        <p><strong>Subtotal {formatCurrency(booking.subtotalCents)}</strong> · Multi-day discount −{formatCurrency(booking.discountCents)} · <strong>Total {formatCurrency(booking.totalCents)}</strong></p>
        <p><span className="admin-label">Stripe</span> <PaymentBadge status={booking.paymentStatus} /> {booking.stripeReference && <> · <code>{booking.stripeReference}</code></>}</p>
      </section>

      <section className="admin-panel admin-status-panel">
        <h2>Status &amp; actions</h2>
        <ol className="admin-status-path">
          <li className={booking.status !== "CANCELED" ? "done" : ""}>Confirmed</li>
          <li className={["ACTIVE_ON_SITE", "COMPLETED"].includes(booking.status) ? "done" : ""}>Mark delivered</li>
          <li className={booking.status === "ACTIVE_ON_SITE" ? "current" : booking.status === "COMPLETED" ? "done" : ""}>Active on site</li>
          <li className={booking.status === "COMPLETED" ? "current" : ""}>Mark picked up</li>
        </ol>
        <div className="admin-action-row">
          <a className="button" href={`mailto:${booking.email}`}>Message customer</a>
          {["CONFIRMED", "AWAITING_DELIVERY"].includes(booking.status) && <StatusActionForm action={markDelivered} label="Mark delivered" />}
          {booking.status === "ACTIVE_ON_SITE" && <StatusActionForm action={markPickedUp} label="Mark picked up" />}
          {!["COMPLETED", "CANCELED"].includes(booking.status) && <StatusActionForm action={cancel} label="Cancel" destructive />}
        </div>
      </section>

      <section className="admin-panel admin-audit">
        <h2>Audit log</h2>
        {booking.auditLogs.length ? booking.auditLogs.map((entry) => (
          <p key={entry.id}>{formatAdminDateTime(entry.createdAt)} · {entry.adminUser.username} changed {entry.previousStatus.toLowerCase().replaceAll("_", " ")} to {entry.newStatus.toLowerCase().replaceAll("_", " ")}.</p>
        )) : <p className="admin-empty">No status changes recorded yet.</p>}
      </section>
    </>
  );
}
