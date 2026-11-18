import type { BookingStatus } from "@/generated/prisma/enums";

export type BookingAction = "MARK_DELIVERED" | "MARK_PICKED_UP" | "CANCEL";

const transitions: Record<BookingAction, Partial<Record<BookingStatus, BookingStatus>>> = {
  MARK_DELIVERED: {
    CONFIRMED: "ACTIVE_ON_SITE",
    AWAITING_DELIVERY: "ACTIVE_ON_SITE",
  },
  MARK_PICKED_UP: {
    ACTIVE_ON_SITE: "COMPLETED",
  },
  CANCEL: {
    CONFIRMED: "CANCELED",
    AWAITING_DELIVERY: "CANCELED",
    ACTIVE_ON_SITE: "CANCELED",
  },
};

export function transitionBookingStatus(
  currentStatus: BookingStatus,
  action: BookingAction,
) {
  const nextStatus = transitions[action][currentStatus];
  if (!nextStatus) {
    throw new Error(`Action ${action} is not allowed from ${currentStatus}.`);
  }
  return nextStatus;
}

export function getAdminStatusLabel(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    CONFIRMED: "Awaiting delivery",
    AWAITING_DELIVERY: "Awaiting delivery",
    ACTIVE_ON_SITE: "Active on site",
    COMPLETED: "Picked up / Completed",
    CANCELED: "Canceled",
  };
  return labels[status];
}
