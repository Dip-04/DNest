"use client";

import { LocateFixed } from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { showToast } from "@/components/toast-viewport";
import {
  saveCurrentLocation,
  stopCurrentLocation,
} from "@/features/shared/actions";
import {
  liveLocationEvent,
  liveLocationStorageKey,
} from "@/components/live-location-tracker";

export function LocationFields({
  defaultCity,
  defaultLatitude,
  defaultLongitude,
}: {
  defaultCity: string;
  defaultLatitude: number | null;
  defaultLongitude: number | null;
}) {
  const [latitude, setLatitude] = useState<number | null>(defaultLatitude);
  const [longitude, setLongitude] = useState<number | null>(defaultLongitude);
  const [locating, setLocating] = useState(false);
  const live = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener(liveLocationEvent, onStoreChange);
      window.addEventListener("storage", onStoreChange);
      return () => {
        window.removeEventListener(liveLocationEvent, onStoreChange);
        window.removeEventListener("storage", onStoreChange);
      };
    },
    () => localStorage.getItem(liveLocationStorageKey) === "on",
    () => false,
  );

  function setLiveSharing(enabled: boolean) {
    if (enabled) localStorage.setItem(liveLocationStorageKey, "on");
    else localStorage.removeItem(liveLocationStorageKey);
    window.dispatchEvent(new Event(liveLocationEvent));
  }

  function captureLocation() {
    if (!("geolocation" in navigator)) {
      showToast("error", "Location is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        setLatitude(coords.latitude);
        setLongitude(coords.longitude);
        const form = new FormData();
        form.set("latitude", coords.latitude.toString());
        form.set("longitude", coords.longitude.toString());
        form.set("accuracy", coords.accuracy.toString());
        const result = await saveCurrentLocation(form).catch(() => ({
          ok: false,
          message: "Your location could not be saved.",
        }));
        setLocating(false);
        if (result.ok) setLiveSharing(true);
        showToast(result.ok ? "success" : "error", result.message);
      },
      () => {
        setLocating(false);
        showToast(
          "error",
          "Location permission was not granted. Allow it and try again.",
        );
      },
      { enableHighAccuracy: true, timeout: 30_000, maximumAge: 0 },
    );
  }

  return (
    <>
      <label className="label">
        City <span className="font-normal">(optional and private)</span>
        <input className="field" name="city" defaultValue={defaultCity} />
      </label>
      <input type="hidden" name="latitude" value={latitude?.toString() ?? ""} />
      <input
        type="hidden"
        name="longitude"
        value={longitude?.toString() ?? ""}
      />
      <div className="rounded-2xl border border-[var(--border)] p-3">
        <p className="muted text-xs">
          {live
            ? "Live location is on. It updates while DNest is open."
            : latitude != null && longitude != null
              ? "Your last private location is saved. Turn on live location to keep it updated."
              : "Add your private location to calculate the distance between you."}
        </p>
        <button
          className="btn btn-secondary mt-3"
          type="button"
          disabled={locating}
          onClick={captureLocation}
        >
          <LocateFixed className="size-4" />
          {locating
            ? "Turning on location…"
            : live
              ? "Update location now"
              : "Turn on live location"}
        </button>
        {live && (
          <button
            className="btn mt-3"
            type="button"
            onClick={async () => {
              const result = await stopCurrentLocation().catch(() => ({
                ok: false,
                message: "Live location could not be stopped.",
              }));
              if (result.ok) setLiveSharing(false);
              showToast(result.ok ? "success" : "error", result.message);
            }}
          >
            Stop live sharing
          </button>
        )}
      </div>
    </>
  );
}
