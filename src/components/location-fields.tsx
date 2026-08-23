"use client";

import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { showToast } from "@/components/toast-viewport";
import { saveCurrentLocation } from "@/features/shared/actions";

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
        const result = await saveCurrentLocation(form).catch(() => ({
          ok: false,
          message: "Your location could not be saved.",
        }));
        setLocating(false);
        showToast(result.ok ? "success" : "error", result.message);
      },
      () => {
        setLocating(false);
        showToast(
          "error",
          "Location permission was not granted. Allow it and try again.",
        );
      },
      { enableHighAccuracy: false, timeout: 12_000, maximumAge: 300_000 },
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
          {latitude != null && longitude != null
            ? "Private location saved. Distance appears when your partner saves theirs too."
            : "Add your private location to calculate the distance between you."}
        </p>
        <button
          className="btn btn-secondary mt-3"
          type="button"
          disabled={locating}
          onClick={captureLocation}
        >
          <LocateFixed className="size-4" />
          {locating ? "Saving locationâ€¦" : "Use my current location"}
        </button>
      </div>
    </>
  );
}
