import Link from "next/link";
import { prisma } from "@/lib/db";
import { PaymentBadge, formatAdminDateTime } from "@/components/admin/admin-ui";
import { formatCurrency } from "@/lib/pricing";

export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const bookings = await prisma.booking.findMany({
    where: { paymentStatus: "PAID" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <div className="admin-page-heading">
        <div><p className="eyebrow">Operations</p><h1>Payments</h1></div>
        <span>{bookings.length} paid</span>
      </div>
      <section className="admin-panel admin-booking-list">
        {bookings.map((booking) => (
          <Link className="admin-booking-list-row" href={`/admin/bookings/${booking.id}`} key={booking.id}>
            <div><span className="eyebrow">{booking.reference}</span><strong>{booking.customerName}</strong></div>
            <div><small>Paid</small><span>{formatAdminDateTime(booking.createdAt)}</span></div>
            <div><small>Card</small><span>{booking.stripeReference ?? "No card charge"}</span></div>
            <PaymentBadge status={booking.paymentStatus} />
            <span>{formatCurrency(booking.totalCents)}</span>
            <span aria-hidden="true">›</span>
          </Link>
        ))}
        {!bookings.length && <p className="admin-empty">No paid bookings yet.</p>}
      </section>
    </>
  );
}
