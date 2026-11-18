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
