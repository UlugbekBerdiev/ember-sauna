export type BookingAlert = {
  reference: string;
  name: string;
  phone: string;
  checkInAt: string;
  checkOutAt: string;
  address: string;
};

type AlertEnv = Record<string, string | undefined>;

export function bookingAlertText(alert: BookingAlert) {
  return [
    `New Ember booking ${alert.reference}`,
    `${alert.name} · ${alert.phone}`,
    `In: ${formatWall(alert.checkInAt)}`,
    `Out: ${formatWall(alert.checkOutAt)}`,
    alert.address,
  ].join("\n");
}

export function toE164(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
}

export async function sendBookingAlert(
  alert: BookingAlert,
  env: AlertEnv = process.env as AlertEnv,
  fetchImpl: typeof fetch = fetch,
) {
  const accountSid = env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const token = env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const from = toE164(env.TWILIO_FROM_NUMBER ?? "");
  const to = toE164(env.BOOKING_ALERT_PHONE ?? "");
  if (!/^AC[0-9a-z]{32}$/i.test(accountSid) || !token || !from || !to) return { sent: false };

  try {
    const response = await fetchImpl(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: bookingAlertText(alert) }),
        signal: AbortSignal.timeout(5000),
      },
    );
    return { sent: response.ok };
  } catch {
    return { sent: false };
  }
}

function formatWall(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!match) return value;
  const [, year, month, day, hourText, minute] = match;
  const hour = Number(hourText);
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  const weekday = date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" });
  const monthName = date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  return `${weekday}, ${monthName} ${Number(day)}, ${hour12}:${minute} ${suffix}`;
}
