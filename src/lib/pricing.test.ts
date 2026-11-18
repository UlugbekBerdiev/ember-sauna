import { describe, expect, it } from "vitest";
import { calculateRentalPrice, getDailyRate, getDiscountRate, toDateKey } from "./pricing";

describe("daily pricing", () => {
  it("uses weekday, Friday, and weekend rates", () => {
    expect(getDailyRate(new Date(2024, 10, 14))).toBe(35000);
    expect(getDailyRate(new Date(2024, 10, 15))).toBe(40000);
    expect(getDailyRate(new Date(2024, 10, 16))).toBe(45000);
    expect(getDailyRate(new Date(2024, 10, 17))).toBe(45000);
  });

  it("applies the approved placeholder multi-day schedule", () => {
    expect(getDiscountRate(1)).toBe(0);
    expect(getDiscountRate(2)).toBe(0.2);
    expect(getDiscountRate(3)).toBe(0.3);
    expect(getDiscountRate(4)).toBe(0.4);
    expect(getDiscountRate(9)).toBe(0.4);
  });

  it("matches the canonical Friday-through-Sunday example", () => {
    const quote = calculateRentalPrice([
      new Date(2024, 10, 15),
      new Date(2024, 10, 16),
      new Date(2024, 10, 17),
    ]);
    expect(quote.subtotal).toBe(130000);
    expect(quote.discount).toBe(39000);
    expect(quote.total).toBe(91000);
  });

  it("deduplicates dates before pricing", () => {
    const date = new Date(2024, 10, 15);
    expect(calculateRentalPrice([date, new Date(date)]).lineItems).toHaveLength(1);
  });

  it("uses local calendar fields for stable date keys", () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});
