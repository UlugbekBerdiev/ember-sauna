export type DailyRate = {
  weekday: number;
  friday: number;
  weekend: number;
};

export const PLACEHOLDER_RATES: DailyRate = {
  weekday: 35000,
  friday: 40000,
  weekend: 45000,
};

export const DISCOUNTS: Readonly<Record<number, number>> = {
  1: 0,
  2: 0.2,
  3: 0.3,
  4: 0.4,
};

export function getDailyRate(date: Date, rates = PLACEHOLDER_RATES) {
  const day = date.getDay();
  if (day === 5) return rates.friday;
  if (day === 0 || day === 6) return rates.weekend;
  return rates.weekday;
}

export function getDiscountRate(dayCount: number) {
  if (dayCount < 1) return 0;
  return DISCOUNTS[Math.min(dayCount, 4)] ?? 0;
}

export function calculateRentalPrice(dates: Date[], rates = PLACEHOLDER_RATES) {
  const uniqueDates = [...new Map(dates.map((date) => [toDateKey(date), date])).values()];
  const lineItems = uniqueDates
    .sort((a, b) => a.getTime() - b.getTime())
    .map((date) => ({ date, amount: getDailyRate(date, rates) }));
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discountRate = getDiscountRate(lineItems.length);
  const discount = Math.round(subtotal * discountRate);

  return {
    lineItems,
    subtotal,
    discountRate,
    discount,
    total: subtotal - discount,
  };
}

export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function rentalDayCount(checkInAt: string, checkOutAt: string) {
  const start = wallUtc(checkInAt);
  const end = wallUtc(checkOutAt);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  const elapsed = end - start;
  const fullDays = Math.floor(elapsed / DAY_MS);
  return fullDays + (elapsed % DAY_MS > 0 ? 1 : 0);
}

export function billableDateKeys(selectedDateKeys: string[], checkInAt: string, checkOutAt: string) {
  const selected = [...new Set(selectedDateKeys)]
    .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && toDateKey(fromDateKey(key)) === key)
    .sort();
  const count = Math.max(selected.length, rentalDayCount(checkInAt, checkOutAt));
  if (!selected.length || count <= selected.length) return selected;
  const cursor = fromDateKey(selected[selected.length - 1]);
  const keys = [...selected];
  while (keys.length < count) {
    cursor.setDate(cursor.getDate() + 1);
    keys.push(toDateKey(cursor));
  }
  return keys;
}

function wallUtc(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/.exec(value);
  if (!match) return Number.NaN;
  const [, year, month, day, hour, minute, second] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second ?? 0));
}
