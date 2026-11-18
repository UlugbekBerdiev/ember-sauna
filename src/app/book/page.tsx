import { Suspense } from "react";
import { BookingCalendar } from "@/components/booking-calendar";
import { BookingShell } from "@/components/booking-shell";

export const metadata = { title: "Choose dates" };

export default function BookPage() {
  return (
    <BookingShell activeStep={1}>
      <Suspense fallback={<p className="container">Loading booking calendar…</p>}>
        <BookingCalendar />
      </Suspense>
    </BookingShell>
  );
}
