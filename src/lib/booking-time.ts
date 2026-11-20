import { fromDateKey, toDateKey } from "./pricing";

export const CHECK_IN_OPTIONS = Array.from({ length: 15 }, (_, index) => {
  const hour = index + 8;
  return `${String(hour).padStart(2, "0")}:00`;
});

export const BUSINESS_TIME_ZONE = "America/New_York";

export const TURNOVER_MS = 3 * 60 * 60 * 1000;

export type BookingSchedule = {
  checkInAt: string;
  checkOutAt: string;
};

export type StayWindow = {
  checkInAt: Date;
  checkOutAt: Date;
};

export function calculateBookingSchedule(
  dateKeys: string[],
  checkInTime = "08:00",
  now = new Date(),
  stays: StayWindow[] = [],
): BookingSchedule | null {
  if (!dateKeys.length) return null;

  const sortedDates = [...new Set(dateKeys)].sort();
  if (
    sortedDates.some((dateKey) => !isBookingDateSelectable(dateKey, now, stays)) ||
    !getAvailableCheckInOptions(sortedDates[0], now, stays).includes(checkInTime)
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

  const schedule = {
    checkInAt: toLocalDateTime(checkIn),
    checkOutAt: toLocalDateTime(checkOut),
  };
  if (scheduleConflicts(schedule.checkInAt, schedule.checkOutAt, stays)) return null;
  return schedule;
}

export function getAvailableCheckInOptions(
  dateKey: string,
  now = new Date(),
  stays: StayWindow[] = [],
) {
  if (!isValidDateKey(dateKey) || isDateOccupied(dateKey, stays)) return [];
  const businessNow = getBusinessClock(now);
  if (dateKey < businessNow.dateKey) return [];
  const earliest = earliestCheckInForDate(dateKey, stays);
  const open = dateKey > businessNow.dateKey
    ? [...CHECK_IN_OPTIONS]
    : CHECK_IN_OPTIONS.filter((time) => {
      const seconds = Number(time.slice(0, 2)) * 60 * 60;
      return seconds >= businessNow.seconds;
    });
  return open.filter((time) => time >= earliest);
}

export function checkInOptionsForSelection(
  dateKeys: string[],
  now = new Date(),
  stays: StayWindow[] = [],
) {
  const first = [...dateKeys].sort()[0];
  if (!first) return [];
  return getAvailableCheckInOptions(first, now, stays).filter((time) =>
    calculateBookingSchedule(dateKeys, time, now, stays),
  );
}

export function isBookingDateSelectable(
  dateKey: string,
  now = new Date(),
  stays: StayWindow[] = [],
) {
  return getAvailableCheckInOptions(dateKey, now, stays).length > 0;
}

export function isDateOccupied(dateKey: string, stays: StayWindow[]) {
  return stays.some((stay) => occupancyFor(stay, dateKey) === "blocked");
}

export function scheduleConflicts(checkInAt: string, checkOutAt: string, stays: StayWindow[]) {
  const start = wallInstant(checkInAt).getTime();
  const end = wallInstant(checkOutAt).getTime() + TURNOVER_MS;
  return stays.some((stay) => {
    const stayStart = stay.checkInAt.getTime();
    const stayEnd = stay.checkOutAt.getTime() + TURNOVER_MS;
    return start < stayEnd && stayStart < end;
  });
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

export function businessDateKey(now = new Date()) {
  return getBusinessClock(now).dateKey;
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

function wallInstant(value: string) {
  return new Date(`${value}-05:00`);
}

function releaseClock(checkOutAt: Date) {
  const release = new Date(checkOutAt.getTime() + TURNOVER_MS);
  const clock = getBusinessClock(release);
  const hour = Math.floor(clock.seconds / 3600);
  const minute = Math.floor((clock.seconds % 3600) / 60);
  const second = clock.seconds % 60;
  const rounded = hour + (minute > 0 || second > 0 ? 1 : 0);
  if (rounded >= 24) return { dateKey: clock.dateKey, time: "24:00" };
  return { dateKey: clock.dateKey, time: `${String(rounded).padStart(2, "0")}:00` };
}

function occupancyFor(stay: StayWindow, dateKey: string) {
  const checkInKey = getBusinessClock(stay.checkInAt).dateKey;
  const checkOutKey = getBusinessClock(stay.checkOutAt).dateKey;
  const release = releaseClock(stay.checkOutAt);
  if (dateKey >= checkInKey && dateKey < checkOutKey) return "blocked";
  if (dateKey !== checkOutKey) return "open";
  if (release.dateKey !== checkOutKey || release.time > CHECK_IN_OPTIONS.at(-1)!) return "blocked";
  return "open";
}

function earliestCheckInForDate(dateKey: string, stays: StayWindow[]) {
  let earliest = "00:00";
  for (const stay of stays) {
    const checkOutKey = getBusinessClock(stay.checkOutAt).dateKey;
    if (dateKey !== checkOutKey) continue;
    const release = releaseClock(stay.checkOutAt);
    if (release.dateKey === dateKey && release.time > earliest) earliest = release.time;
  }
  return earliest;
}
