import { describe, expect, it } from "vitest";
import { applyPercentDiscount, generatePromoCode, normalizePromoCode } from "./promo-code";

describe("promo codes", () => {
  it("normalizes a guest-entered code", () => {
    expect(normalizePromoCode("  ember-ab12  ")).toBe("EMBER-AB12");
    expect(normalizePromoCode("no")).toBe("");
    expect(normalizePromoCode("ok code!")).toBe("OK-CODE");
  });

  it("covers the full amount at 100 percent", () => {
    expect(applyPercentDiscount(91000, 100)).toEqual({ discountCents: 91000, totalCents: 0 });
  });

  it("rounds a partial percent off the amount due", () => {
    expect(applyPercentDiscount(91000, 25)).toEqual({ discountCents: 22750, totalCents: 68250 });
  });

  it("rejects a percent outside 1 to 100", () => {
    expect(() => applyPercentDiscount(1000, 0)).toThrow(/1 to 100/);
    expect(() => applyPercentDiscount(1000, 101)).toThrow(/1 to 100/);
  });

  it("generates a one-time style code", () => {
    expect(generatePromoCode()).toMatch(/^EMBER-[A-Z2-9]{6}$/);
  });
});
