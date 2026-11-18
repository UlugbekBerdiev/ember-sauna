"use server";

import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import type { BookingAction } from "@/lib/booking-status";
import { transitionBookingStatus } from "@/lib/booking-status";
import { requireAdmin } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export async function updateBookingStatusAction(
  bookingId: string,
  action: BookingAction,
) {
  const admin = await requireAdmin();
  await prisma.$transaction(async (transaction) => {
    const booking = await transaction.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });
    if (!booking) notFound();
    const nextStatus = transitionBookingStatus(booking.status, action);
    const updated = await transaction.booking.updateMany({
      where: { id: bookingId, status: booking.status },
      data: { status: nextStatus },
    });
    if (updated.count !== 1) {
      throw new Error("Booking status changed in another session. Refresh and try again.");
    }
    await transaction.auditLog.create({
      data: {
        bookingId,
        adminUserId: admin.id,
        previousStatus: booking.status,
        newStatus: nextStatus,
      },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${bookingId}`);
}
