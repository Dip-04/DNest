"use client";

import { useEffect, useState } from "react";
import { formatLocalTime } from "@/lib/date";

export function PartnerLocalTime({ name, timezone, city, initialTime }: {
  name: string;
  timezone: string;
  city?: string | null;
  initialTime: string;
}) {
  const [time, setTime] = useState(initialTime);
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localZone = timezone === "UTC" && detected ? detected : timezone;
    const update = () => setTime(formatLocalTime(localZone));
    const timer = window.setInterval(update, 30_000);
    update();
    return () => window.clearInterval(timer);
  }, [timezone]);
  return <span>{name}’s time is {time}{city ? ` · ${city}` : ""}</span>;
}
