"use client";

import Link from "next/link";
import { Heart, LocateFixed, MapPin } from "lucide-react";
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
    <section className="between-us-widget surface card mt-5 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div>
          <span className="eyebrow">Between us</span>
          <p className="display mt-1 text-3xl">
            {distance?.toLocaleString() ?? "â€”"} km apart
          </p>
        </div>
        <span className="chip flex items-center gap-2">
          <span className="size-2 animate-pulse rounded-full bg-emerald-500" />
          Live
        </span>
      </div>
      <div
        className="live-distance-map"
        aria-label="Map showing both partner locations"
      >
        <div className="between-person">
          <span className="between-avatar">
            {me.name.slice(0, 1).toUpperCase()}
          </span>
          <strong>You</strong>
        </div>
        <div className="between-route">
          <svg viewBox="0 0 180 92" aria-hidden="true">
            <path d="M10 16 C 55 5, 40 82, 90 50 S 132 12, 170 70" />
          </svg>
          <Heart className="between-heart between-heart-start size-5 fill-current" />
          <Heart className="between-heart between-heart-end size-5 fill-current" />
          <div className="between-distance">
            <MapPin className="size-4" />
            <strong>{distance?.toLocaleString() ?? "-"} km</strong>
          </div>
        </div>
        <div className="between-person">
          <span className="between-avatar between-avatar-partner">
            {partner.name.slice(0, 1).toUpperCase()}
          </span>
          <strong>{partner.name}</strong>
        </div>
      </div>
      <p className="muted px-5 py-3 text-center text-xs">
        Updates while DNest is open; the last location remains available when
        closed.
      </p>
    </section>
  );
}
