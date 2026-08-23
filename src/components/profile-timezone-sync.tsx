"use client";

import { useEffect, useRef } from "react";
import { syncProfileTimezone } from "@/features/shared/actions";

export function ProfileTimezoneSync({ storedTimezone }: { storedTimezone: string }) {
  const attempted = useRef(false);
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!detected || detected === storedTimezone || attempted.current) return;
    attempted.current = true;
    void syncProfileTimezone(detected);
  }, [storedTimezone]);
  return null;
}
