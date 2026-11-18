import { formatBookingDateTime } from "@/lib/booking-time";

export function BookingScheduleSummary({
  checkInAt,
  checkOutAt,
}: {
  checkInAt: string;
  checkOutAt: string;
}) {
  if (!checkInAt || !checkOutAt) return null;

  return (
    <dl className="schedule-summary">
      <div>
        <dt>Check-in</dt>
        <dd>{formatBookingDateTime(checkInAt)}</dd>
      </div>
      <div>
        <dt>Check-out</dt>
        <dd>{formatBookingDateTime(checkOutAt)}</dd>
      </div>
    </dl>
  );
}
