import { describe, expect, it } from "vitest";
import { bookingAlertText, sendBookingAlert, toE164 } from "./booking-alert";

const alert = {
  reference: "ES106EDD",
  name: "Ada Ember",
  phone: "301-555-0100",
  checkInAt: "2026-11-15T17:00:00",
  checkOutAt: "2026-11-16T16:00:00",
  address: "26100 Ridge Rd, Damascus, MD 20872",
};

describe("booking alerts", () => {
  it("formats the owner text from the chosen clock times", () => {
    expect(bookingAlertText(alert)).toBe([
      "New Ember booking ES106EDD",
      "Ada Ember · 301-555-0100",
      "In: Sun, Nov 15, 5:00 PM",
      "Out: Mon, Nov 16, 4:00 PM",
      "26100 Ridge Rd, Damascus, MD 20872",
    ].join("\n"));
  });

  it("turns a US number into E.164", () => {
    expect(toE164("(240) 555-0199")).toBe("+12405550199");
    expect(toE164("+1 240-555-0199")).toBe("+12405550199");
    expect(toE164("555")).toBeNull();
  });

  it("skips the text when Twilio is not configured", async () => {
    const result = await sendBookingAlert(alert, {}, fetch);
    expect(result).toEqual({ sent: false });
  });

  it("sends the text to the owner number", async () => {
    let body = "";
    const result = await sendBookingAlert(alert, {
      TWILIO_ACCOUNT_SID: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      TWILIO_AUTH_TOKEN: "secret",
      TWILIO_FROM_NUMBER: "+12025550123",
      BOOKING_ALERT_PHONE: "2405550199",
    }, async (_url, init) => {
      body = String(init?.body ?? "");
      return new Response("", { status: 201 });
    });
    expect(result).toEqual({ sent: true });
    expect(body).toContain("To=%2B12405550199");
    expect(body).toContain("From=%2B12025550123");
    expect(body).toContain("ES106EDD");
  });
});
