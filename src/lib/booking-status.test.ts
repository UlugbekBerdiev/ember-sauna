import { describe, expect, it } from "vitest";
import { getAdminStatusLabel, transitionBookingStatus } from "./booking-status";

describe("booking status transitions", () => {
  it("moves an awaiting booking to active when delivered", () => {
    expect(transitionBookingStatus("CONFIRMED", "MARK_DELIVERED")).toBe("ACTIVE_ON_SITE");
    expect(transitionBookingStatus("AWAITING_DELIVERY", "MARK_DELIVERED")).toBe("ACTIVE_ON_SITE");
  });

  it("moves an active booking to completed when picked up", () => {
    expect(transitionBookingStatus("ACTIVE_ON_SITE", "MARK_PICKED_UP")).toBe("COMPLETED");
  });

  it("supports cancellation only before completion", () => {
    expect(transitionBookingStatus("CONFIRMED", "CANCEL")).toBe("CANCELED");
    expect(transitionBookingStatus("ACTIVE_ON_SITE", "CANCEL")).toBe("CANCELED");
    expect(() => transitionBookingStatus("COMPLETED", "CANCEL")).toThrow();
    expect(() => transitionBookingStatus("CANCELED", "MARK_DELIVERED")).toThrow();
  });

  it("shows confirmed bookings as awaiting delivery", () => {
    expect(getAdminStatusLabel("CONFIRMED")).toBe("Awaiting delivery");
    expect(getAdminStatusLabel("ACTIVE_ON_SITE")).toBe("Active on site");
  });
});
