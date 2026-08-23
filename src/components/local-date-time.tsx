"use client";

import { useSyncExternalStore } from "react";
import { safeTimeZone } from "@/lib/date";

const subscribe = () => () => undefined;
const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function LocalDateTime({
  value,
  fallbackTimeZone = "UTC",
  dateStyle = "medium",
  timeStyle,
  prefix,
}: {
  value: string;
  fallbackTimeZone?: string;
  dateStyle?: "full" | "long" | "medium" | "short";
  timeStyle?: "full" | "long" | "medium" | "short";
  prefix?: string;
}) {
  const timezone = useSyncExternalStore(
    subscribe,
    browserTimeZone,
    () => safeTimeZone(fallbackTimeZone),
  );
  const formatted = new Intl.DateTimeFormat("en", {
    dateStyle,
    timeStyle,
    timeZone: timezone,
  }).format(new Date(value));
  return (
    <time dateTime={value} suppressHydrationWarning>
      {prefix}
      {formatted}
    </time>
  );
}
