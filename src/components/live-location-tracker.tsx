"use client";

import { useEffect, useRef } from "react";
import { saveCurrentLocation } from "@/features/shared/actions";

export const liveLocationStorageKey = "dnest-live-location";
export const liveLocationEvent = "dnest:live-location-change";

export function LiveLocationTracker() {
  const watchId = useRef<number | null>(null);
  const lastSentAt = useRef(0);

  useEffect(() => {
    const stop = () => {
      if (watchId.current != null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
      }
    };
    const sync = () => {
      stop();
      if (
        localStorage.getItem(liveLocationStorageKey) !== "on" ||
        !("geolocation" in navigator)
      )
        return;
      watchId.current = navigator.geolocation.watchPosition(
        ({ coords }) => {
          const now = Date.now();
          if (now - lastSentAt.current < 30_000) return;
          lastSentAt.current = now;
          const form = new FormData();
          form.set("latitude", coords.latitude.toString());
          form.set("longitude", coords.longitude.toString());
          form.set("accuracy", coords.accuracy.toString());
          form.set("silent", "true");
          void saveCurrentLocation(form);
        },
        () => stop(),
        { enableHighAccuracy: true, timeout: 30_000, maximumAge: 5_000 },
      );
    };

    sync();
    window.addEventListener(liveLocationEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      stop();
      window.removeEventListener(liveLocationEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return null;
}
