const DAY_MS = 86_400_000;
export function daysTogether(start: string | null, now = new Date()) {
  if (!start) return null;
  const startDate = new Date(`${start}T00:00:00Z`);
  if (Number.isNaN(startDate.getTime()) || startDate > now) return 0;
  return (
    Math.floor(
      (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) -
        startDate.getTime()) /
        DAY_MS,
    ) + 1
  );
}
export function countdown(target: string, now = new Date()) {
  const diff = Math.max(0, new Date(target).getTime() - now.getTime());
  return {
    totalMs: diff,
    days: Math.floor(diff / DAY_MS),
    hours: Math.floor(diff / 3_600_000) % 24,
    minutes: Math.floor(diff / 60_000) % 60,
    isPast: new Date(target).getTime() <= now.getTime(),
  };
}
export function yearsAgoOnThisDay(iso: string, now = new Date()) {
  const date = new Date(iso);
  if (
    date.getUTCMonth() !== now.getUTCMonth() ||
    date.getUTCDate() !== now.getUTCDate()
  )
    return null;
  const years = now.getUTCFullYear() - date.getUTCFullYear();
  return years > 0 ? years : null;
}
export function distanceKm(
  a: { latitude: number | null; longitude: number | null },
  b: { latitude: number | null; longitude: number | null },
) {
  if (
    a.latitude == null ||
    a.longitude == null ||
    b.latitude == null ||
    b.longitude == null
  )
    return null;
  const rad = (n: number) => (n * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude),
    dLon = rad(b.longitude - a.longitude);
  const v =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) *
      Math.cos(rad(b.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v)));
}
export function formatLocalTime(timezone: string, now = new Date()) {
  try {
    return new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      hour: "numeric",
      minute: "2-digit",
    }).format(now);
  } catch {
    return "Time zone not set";
  }
}

export function isValidTimeZone(timezone: string) {
  try {
    new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
    return true;
  } catch {
    return false;
  }
}

export function safeTimeZone(timezone: string | null | undefined) {
  return timezone && isValidTimeZone(timezone) ? timezone : "UTC";
}

type LocalDateTimeParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

function parseLocalDateTime(value: string): LocalDateTimeParts | null {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!match) return null;
  const [, year, month, day, hour, minute, second = "0"] = match;
  return {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: Number(second),
  };
}

export function partsInTimeZone(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  ) as Record<keyof LocalDateTimeParts, number>;
}

/** Convert an HTML datetime-local wall time in an IANA zone into UTC storage. */
export function zonedDateTimeToISOString(value: string, timezone: string) {
  const requested = parseLocalDateTime(value);
  if (!requested) throw new RangeError("Invalid local date and time");
  const zone = safeTimeZone(timezone);
  const wallClockUtc = Date.UTC(
    requested.year,
    requested.month - 1,
    requested.day,
    requested.hour,
    requested.minute,
    requested.second,
  );
  let candidate = wallClockUtc;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const shown = partsInTimeZone(new Date(candidate), zone);
    const shownAsUtc = Date.UTC(
      shown.year,
      shown.month - 1,
      shown.day,
      shown.hour,
      shown.minute,
      shown.second,
    );
    candidate += wallClockUtc - shownAsUtc;
  }
  const result = new Date(candidate);
  const shown = partsInTimeZone(result, zone);
  if (
    requested.year !== shown.year ||
    requested.month !== shown.month ||
    requested.day !== shown.day ||
    requested.hour !== shown.hour ||
    requested.minute !== shown.minute
  ) {
    throw new RangeError("That local time does not exist in this timezone");
  }
  return result.toISOString();
}

export function formatDateTimeInput(value: string, timezone: string) {
  const shown = partsInTimeZone(new Date(value), timezone);
  return `${shown.year}-${String(shown.month).padStart(2, "0")}-${String(shown.day).padStart(2, "0")}T${String(shown.hour).padStart(2, "0")}:${String(shown.minute).padStart(2, "0")}`;
}

export function formatDateInTimeZone(
  value: string | Date,
  timezone: string,
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat("en", {
    ...options,
    timeZone: safeTimeZone(timezone),
  }).format(typeof value === "string" ? new Date(value) : value);
}

/** Date-only values have no timezone; noon UTC prevents calendar-day drift. */
export function formatCalendarDate(
  value: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
) {
  return new Intl.DateTimeFormat("en", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00Z`));
}
