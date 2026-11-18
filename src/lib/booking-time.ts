import { fromDateKey, toDateKey } from "./pricing";

export const CHECK_IN_OPTIONS = Array.from({ length: 15 }, (_, index) => {
  const hour = index + 8;
  return `${String(hour).padStart(2, "0")}:00`;
});

export const BUSINESS_TIME_ZONE = "America/New_York";

export type BookingSchedule = {
  checkInAt: string;
  checkOutAt: string;
};

export function calculateBookingSchedule(
  dateKeys: string[],
  checkInTime = "08:00",
  now = new Date(),
): BookingSchedule | null {
  if (!dateKeys.length) return null;

  const sortedDates = [...new Set(dateKeys)].sort();
  if (
    sortedDates.some((dateKey) => !isBookingDateSelectable(dateKey, now)) ||
    !getAvailableCheckInOptions(sortedDates[0], now).includes(checkInTime)
  ) {
    return null;
  }

  const firstDate = fromDateKey(sortedDates[0]);
  const lastDate = fromDateKey(sortedDates.at(-1)!);
  const hour = Number(checkInTime.slice(0, 2));

  const checkIn = new Date(
    firstDate.getFullYear(),
    firstDate.getMonth(),
    firstDate.getDate(),
    hour,
  );
  const checkOut = new Date(
    lastDate.getFullYear(),
    lastDate.getMonth(),
    lastDate.getDate() + (sortedDates.length === 1 ? 1 : 0),
    hour - 1,
  );

  return {
    checkInAt: toLocalDateTime(checkIn),
    checkOutAt: toLocalDateTime(checkOut),
  };
}

export function getAvailableCheckInOptions(dateKey: string, now = new Date()) {
  if (!isValidDateKey(dateKey)) return [];
  const businessNow = getBusinessClock(now);
  if (dateKey < businessNow.dateKey) return [];
  if (dateKey > businessNow.dateKey) return [...CHECK_IN_OPTIONS];

  return CHECK_IN_OPTIONS.filter((time) => {
    const seconds = Number(time.slice(0, 2)) * 60 * 60;
    return seconds >= businessNow.seconds;
  });
}

export function isBookingDateSelectable(dateKey: string, now = new Date()) {
  return getAvailableCheckInOptions(dateKey, now).length > 0;
}

export function formatBookingDateTime(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function getBusinessClock(now: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return {
    dateKey: `${value("year")}-${value("month")}-${value("day")}`,
    seconds:
      Number(value("hour")) * 60 * 60 +
      Number(value("minute")) * 60 +
      Number(value("second")),
  };
}

function isValidDateKey(dateKey: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && toDateKey(fromDateKey(dateKey)) === dateKey;
}

function toLocalDateTime(date: Date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${toDateKey(date)}T${hours}:${minutes}:00`;
}
