"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => undefined;
const browserTimeZone = () =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function BrowserTimeZoneInput({ fallback = "UTC" }: { fallback?: string }) {
  const timezone = useSyncExternalStore(subscribe, browserTimeZone, () => fallback);
  return <input type="hidden" name="timezone" value={timezone} readOnly />;
}
