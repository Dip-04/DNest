"use client";
import { useState } from "react";
import { MapPin } from "lucide-react";
type Pin = {
  id: string;
  title: string;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
};
export function MemoryMap({ pins }: { pins: Pin[] }) {
  const valid = pins.filter(
    (p): p is Pin & { latitude: number; longitude: number } =>
      p.latitude != null && p.longitude != null,
  );
  const [active, setActive] = useState(valid[0]?.id);
  if (!valid.length)
    return (
      <p className="muted mt-3">
        Add coordinates to a Moment and its private pin will appear here.
      </p>
    );
  return (
    <div
      className="memory-map relative mt-5 aspect-[2/1] overflow-hidden rounded-3xl"
      role="group"
      aria-label="Private relationship location map"
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)",
          backgroundSize: "12.5% 25%",
        }}
      />
      {valid.map((pin) => {
        const left = ((pin.longitude + 180) / 360) * 100;
        const top = ((90 - pin.latitude) / 180) * 100;
        return (
          <button
            key={pin.id}
            onClick={() => setActive(pin.id)}
            aria-label={`${pin.title} at ${pin.location_name}`}
            className="absolute z-10 -translate-x-1/2 -translate-y-full text-[var(--rose-deep)]"
            style={{ left: `${left}%`, top: `${top}%` }}
          >
            <MapPin
              className={`size-7 drop-shadow ${active === pin.id ? "fill-[var(--rose-soft)] scale-125" : "fill-white"}`}
            />
          </button>
        );
      })}
      {valid.map(
        (pin) =>
          active === pin.id && (
            <div
              key={pin.id}
              className="surface absolute right-3 bottom-3 z-20 max-w-[70%] rounded-2xl p-3 text-xs"
            >
              <strong>{pin.title}</strong>
              <p className="muted mt-1">{pin.location_name}</p>
            </div>
          ),
      )}
    </div>
  );
}
