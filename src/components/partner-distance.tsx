"use client";

import Link from "next/link";
import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { distanceKm } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";

type PersonLocation = {
  id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  locationSharing: boolean;
};

function hasLocation(person: PersonLocation) {
  return (
    person.locationSharing &&
    person.latitude != null &&
    person.longitude != null
  );
}

function mapPosition(person: PersonLocation) {
  return {
    left: `${((person.longitude ?? 0) + 180) / 3.6}%`,
    top: `${(90 - (person.latitude ?? 0)) / 1.8}%`,
  };
}

export function PartnerDistance({
  initialMe,
  initialPartner,
}: {
  initialMe: PersonLocation;
  initialPartner: PersonLocation;
}) {
  const [me, setMe] = useState(initialMe);
  const [partner, setPartner] = useState(initialPartner);
  const distance = useMemo(() => distanceKm(me, partner), [me, partner]);

  useEffect(() => {
    const supabase = createClient();
    const update = (
      setter: React.Dispatch<React.SetStateAction<PersonLocation>>,
      payload: { new: Record<string, unknown> },
    ) => {
      setter((current) => ({
        ...current,
        latitude:
          payload.new.latitude == null ? null : Number(payload.new.latitude),
        longitude:
          payload.new.longitude == null ? null : Number(payload.new.longitude),
        locationSharing: Boolean(payload.new.location_sharing),
      }));
    };
    const channel = supabase
      .channel(`distance-${initialMe.id}-${initialPartner.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${initialMe.id}`,
        },
        (payload) => update(setMe, payload),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${initialPartner.id}`,
        },
        (payload) => update(setPartner, payload),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [initialMe.id, initialPartner.id]);

  if (!hasLocation(me)) {
    return (
      <div className="surface card mt-5 flex items-center gap-4 p-4">
        <LocateFixed className="size-6 shrink-0 text-[var(--rose)]" />
        <p className="text-sm">
          {hasLocation(partner)
            ? `${partner.name} is sharing a location. `
            : "Location is off for both of you. "}
          <Link
            className="font-bold text-[var(--rose-deep)] underline"
            href="/settings"
          >
            Turn on your location
          </Link>
          .
        </p>
      </div>
    );
  }

  if (!hasLocation(partner)) {
    return (
      <div className="surface card mt-5 flex items-center gap-4 p-4">
        <LocateFixed className="size-6 shrink-0 text-emerald-600" />
        <p className="text-sm">
          Your location is on. Ask {partner.name} to open Settings and turn on
          their location to see the distance.
        </p>
      </div>
    );
  }

  return (
    <section className="surface card mt-5 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <span className="eyebrow">Live distance</span>
          <p className="display mt-1 text-3xl">
            {distance?.toLocaleString() ?? "â€”"} km apart
          </p>
        </div>
        <span className="chip flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Updates while DNest is open
        </span>
      </div>
      <div
        className="live-distance-map"
        aria-label="Map showing both partner locations"
      >
        {[me, partner].map((person, index) => (
          <div
            className={`live-distance-pin ${index === 0 ? "live-distance-pin-me" : ""}`}
            style={mapPosition(person)}
            key={person.id}
          >
            <MapPin className="size-6 fill-current" />
            <span>{index === 0 ? "You" : person.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
