"use client";

import Link from "next/link";
import { Heart, LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { distanceKm } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";

type PersonLocation = {
  id: string;
  name: string;
  localTime?: string;
  timezone?: string;
  avatarUrl?: string;
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

function mapPresentation(me: PersonLocation, partner: PersonLocation) {
  const meLatitude = me.latitude ?? 0;
  const meLongitude = me.longitude ?? 0;
  const partnerLatitude = partner.latitude ?? 0;
  const partnerLongitude = partner.longitude ?? 0;
  const latitudeSpan = Math.max(Math.abs(meLatitude - partnerLatitude), 0.02);
  const longitudeSpan = Math.max(
    Math.abs(meLongitude - partnerLongitude),
    0.02,
  );
  const latitudePadding = latitudeSpan * 0.45;
  const longitudePadding = longitudeSpan * 0.45;
  const minLatitude = Math.min(meLatitude, partnerLatitude) - latitudePadding;
  const maxLatitude = Math.max(meLatitude, partnerLatitude) + latitudePadding;
  const minLongitude =
    Math.min(meLongitude, partnerLongitude) - longitudePadding;
  const maxLongitude =
    Math.max(meLongitude, partnerLongitude) + longitudePadding;

  const point = (latitude: number, longitude: number) => ({
    x: ((longitude - minLongitude) / (maxLongitude - minLongitude)) * 100,
    y: ((maxLatitude - latitude) / (maxLatitude - minLatitude)) * 100,
  });
  const mine = point(meLatitude, meLongitude);
  const theirs = point(partnerLatitude, partnerLongitude);
  const controlOne = {
    x: mine.x + (theirs.x - mine.x) * 0.34,
    y: Math.max(8, mine.y - 16),
  };
  const controlTwo = {
    x: mine.x + (theirs.x - mine.x) * 0.66,
    y: Math.min(92, theirs.y + 16),
  };
  const bbox = [minLongitude, minLatitude, maxLongitude, maxLatitude].join(",");

  return {
    me: mine,
    partner: theirs,
    route:
      "M " +
      mine.x +
      " " +
      mine.y +
      " C " +
      controlOne.x +
      " " +
      controlOne.y +
      ", " +
      controlTwo.x +
      " " +
      controlTwo.y +
      ", " +
      theirs.x +
      " " +
      theirs.y,
    source:
      "https://www.openstreetmap.org/export/embed.html?bbox=" +
      encodeURIComponent(bbox) +
      "&layer=mapnik",
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
  const map = useMemo(() => mapPresentation(me, partner), [me, partner]);

  useEffect(() => {
    if (!initialPartner.timezone) return;
    const update = () => setPartner((current) => ({
      ...current,
      localTime: new Intl.DateTimeFormat("en", {
        timeZone: initialPartner.timezone,
        hour: "numeric",
        minute: "2-digit",
      }).format(),
    }));
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [initialPartner.timezone]);

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
        <iframe
          className="between-map-frame"
          src={map.source}
          title="OpenStreetMap showing both partner locations"
          loading="lazy"
          referrerPolicy="no-referrer"
          tabIndex={-1}
        />
        <div className="between-map-tint" aria-hidden />
        <svg
          className="between-map-route"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d={map.route} />
        </svg>
        <div
          className="between-map-person between-map-person-me"
          style={{ left: map.me.x + "%", top: map.me.y + "%" }}
        >
          <span
            className="between-map-avatar between-map-avatar-me"
            style={me.avatarUrl ? { backgroundImage: `url(${JSON.stringify(me.avatarUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            aria-hidden
          />
          <Heart className="between-map-heart size-6 fill-current" />
          <strong>Me</strong>
        </div>
        <div
          className="between-map-person between-map-person-partner"
          style={{ left: map.partner.x + "%", top: map.partner.y + "%" }}
        >
          <span
            className="between-map-avatar between-map-avatar-partner"
            style={partner.avatarUrl ? { backgroundImage: `url(${JSON.stringify(partner.avatarUrl)})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            aria-hidden
          />
          <Heart className="between-map-heart size-6 fill-current" />
          <strong>{partner.name}</strong>
        </div>
        <div className="between-map-distance">
          <MapPin className="size-5 text-[var(--rose)]" />
          <span>
            <strong>{distance?.toLocaleString() ?? "-"} km apart</strong>
            <small>
              {partner.name}
              {partner.localTime ? " · " + partner.localTime : ""}
            </small>
          </span>
        </div>
      </div>
      <p className="muted px-5 py-3 text-center text-xs">
        Live in the DNest PWA while both partners share location. Map ©
        OpenStreetMap contributors.
      </p>
    </section>
  );
}
