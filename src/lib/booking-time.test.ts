import { describe, expect, it } from "vitest";
import {
  calculateBookingSchedule,
  CHECK_IN_OPTIONS,
  CHECK_OUT_OPTIONS,
  checkInOptionsForSelection,
  checkOutOptionsForSelection,
  getAvailableCheckInOptions,
  isBookingDateSelectable,
  isDateOccupied,
} from "./booking-time";

describe("booking schedule", () => {
  const beforeExamples = new Date("2026-11-01T12:00:00Z");

  it("offers every hour from 8 AM through 10 PM", () => {
    expect(CHECK_IN_OPTIONS).toHaveLength(15);
    expect(CHECK_IN_OPTIONS[0]).toBe("08:00");
    expect(CHECK_IN_OPTIONS.at(-1)).toBe("22:00");
  });

  it("requires a chosen check-in and check-out time", () => {
    expect(CHECK_OUT_OPTIONS[0]).toBe("07:00");
    expect(CHECK_OUT_OPTIONS.at(-1)).toBe("22:00");
    expect(calculateBookingSchedule(["2026-11-15"], "", "07:00", beforeExamples)).toBeNull();
    expect(calculateBookingSchedule(["2026-11-15"], "08:00", "", beforeExamples)).toBeNull();
    expect(calculateBookingSchedule(["2026-11-15"], "08:00", "07:00", beforeExamples)).toEqual({
      checkInAt: "2026-11-15T08:00:00",
      checkOutAt: "2026-11-16T07:00:00",
    });
  });

  it("checks out on the last selected day for a two-day booking", () => {
    expect(calculateBookingSchedule(["2026-11-15", "2026-11-16"], "17:00", "11:00", beforeExamples)).toEqual({
      checkInAt: "2026-11-15T17:00:00",
      checkOutAt: "2026-11-16T11:00:00",
    });
  });

  it("checks out on the last selected day for a three-day booking", () => {
    expect(calculateBookingSchedule(["2026-11-20", "2026-11-21", "2026-11-22"], "17:00", "16:00", beforeExamples)).toEqual({
      checkInAt: "2026-11-20T17:00:00",
      checkOutAt: "2026-11-22T16:00:00",
    });
  });

  it("crosses month and year boundaries for single-day bookings", () => {
    expect(calculateBookingSchedule(["2026-11-30"], "17:00", "16:00", beforeExamples)?.checkOutAt).toBe("2026-12-01T16:00:00");
    expect(calculateBookingSchedule(["2026-12-31"], "08:00", "07:00", beforeExamples)).toEqual({
      checkInAt: "2026-12-31T08:00:00",
      checkOutAt: "2027-01-01T07:00:00",
    });
  });

  it("sorts and deduplicates dates before finding the schedule bounds", () => {
    expect(calculateBookingSchedule(["2026-11-16", "2026-11-15", "2026-11-15"], "22:00", "21:00", beforeExamples)).toEqual({
      checkInAt: "2026-11-15T22:00:00",
      checkOutAt: "2026-11-16T21:00:00",
    });
  });

  it("filters today's elapsed times using the New York clock", () => {
    const eightThirtyAm = new Date("2026-07-15T12:30:00Z");
    expect(getAvailableCheckInOptions("2026-07-15", eightThirtyAm)[0]).toBe("09:00");
    expect(getAvailableCheckInOptions("2026-07-15", eightThirtyAm)).not.toContain("08:00");
    expect(getAvailableCheckInOptions("2026-07-16", eightThirtyAm)).toEqual(CHECK_IN_OPTIONS);
    expect(getAvailableCheckInOptions("2026-07-15", new Date("2026-07-15T12:00:00Z"))[0]).toBe("08:00");
    expect(getAvailableCheckInOptions("2026-07-15", new Date("2026-07-15T12:00:01Z"))[0]).toBe("09:00");
  });

  it("disables past dates and today after the final check-in time", () => {
    const afterTenPm = new Date("2026-07-16T03:01:00Z");
    expect(isBookingDateSelectable("2026-07-14", afterTenPm)).toBe(false);
    expect(isBookingDateSelectable("2026-07-15", afterTenPm)).toBe(false);
    expect(isBookingDateSelectable("2026-07-16", afterTenPm)).toBe(true);
  });

  it("blocks booked days and opens the checkout day three hours after pickup", () => {
    const stay = {
      checkInAt: new Date("2026-11-18T08:00:00-05:00"),
      checkOutAt: new Date("2026-11-19T07:00:00-05:00"),
    };
    expect(isDateOccupied("2026-11-18", [stay])).toBe(true);
    expect(isDateOccupied("2026-11-19", [stay])).toBe(false);
    expect(isBookingDateSelectable("2026-11-18", beforeExamples, [stay])).toBe(false);
    expect(getAvailableCheckInOptions("2026-11-19", beforeExamples, [stay])[0]).toBe("10:00");
    expect(calculateBookingSchedule(["2026-11-19"], "09:00", "08:00", beforeExamples, [stay])).toBeNull();
    expect(calculateBookingSchedule(["2026-11-19"], "10:00", "09:00", beforeExamples, [stay])).toEqual({
      checkInAt: "2026-11-19T10:00:00",
      checkOutAt: "2026-11-20T09:00:00",
    });
    expect(calculateBookingSchedule(["2026-11-17"], "08:00", "07:00", beforeExamples, [stay])).toBeNull();
  });

  it("closes a day when every check-in would run into the next booking", () => {
    const stays = [
      {
        checkInAt: new Date("2026-11-21T08:00:00-05:00"),
        checkOutAt: new Date("2026-11-22T07:00:00-05:00"),
      },
      {
        checkInAt: new Date("2026-11-23T08:00:00-05:00"),
        checkOutAt: new Date("2026-11-24T07:00:00-05:00"),
      },
    ];
    const morning = new Date("2026-11-18T15:00:00Z");
    expect(checkInOptionsForSelection(["2026-11-20"], morning, stays)).toEqual([]);
    expect(checkOutOptionsForSelection(["2026-11-20"], "08:00", morning, stays)).toEqual([]);
    expect(checkInOptionsForSelection(["2026-11-22"], morning, stays)).toEqual([]);
    expect(checkOutOptionsForSelection(["2026-11-19", "2026-11-20"], "08:00", morning, stays)).toContain("22:00");
    expect(checkInOptionsForSelection(["2026-11-19", "2026-11-20"], morning, stays).length).toBeGreaterThan(0);
  });

  it("validates dates and times in the schedule helper", () => {
    const eightThirtyAm = new Date("2026-07-15T12:30:00Z");
    expect(calculateBookingSchedule([], "08:00", "07:00", eightThirtyAm)).toBeNull();
    expect(calculateBookingSchedule(["2026-07-14"], "08:00", "07:00", eightThirtyAm)).toBeNull();
    expect(calculateBookingSchedule(["2026-07-15"], "08:00", "07:00", eightThirtyAm)).toBeNull();
    expect(calculateBookingSchedule(["2026-07-15"], "09:00", "08:00", eightThirtyAm)).not.toBeNull();
    expect(calculateBookingSchedule(["2026-07-16"], "07:00", "08:00", eightThirtyAm)).toBeNull();
    expect(calculateBookingSchedule(["2026-02-30"], "09:00", "08:00", eightThirtyAm)).toBeNull();
  });
});
