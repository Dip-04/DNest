"use client";

import { useSyncExternalStore } from "react";
import { formatDateTimeInput, safeTimeZone } from "@/lib/date";

const subscribe = () => () => undefined;
const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function LocalDateTimeField({
  name,
  value,
  fallbackTimeZone,
  required = false,
}: {
  name: string;
  value: string;
  fallbackTimeZone: string;
  required?: boolean;
}) {
  const timezone = useSyncExternalStore(
    subscribe,
    browserTimeZone,
    () => safeTimeZone(fallbackTimeZone),
  );
  return (
    <>
      <input
        key={timezone}
        className="field"
        name={name}
        type="datetime-local"
        defaultValue={formatDateTimeInput(value, timezone)}
        required={required}
      />
      <input type="hidden" name="timezone" value={timezone} readOnly />
    </>
  );
}
