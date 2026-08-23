"use client";

import Link from "next/link";
import { LocateFixed, MapPin } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { BetweenUsMap } from "@/components/between-us-map";
import { distanceKm } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";

type PersonLocation = {
  id: string;
  name: string;
  localTime?: string;
  timezone?: string;
  avatarUrl?: string;
  avatarPath?: string | null;
  latitude: number | null;
  longitude: number | null;
  locationSharing: boolean;
  accuracy?: number | null;
};
const hasLocation = (person: PersonLocation) =>
  person.locationSharing && person.latitude != null && person.longitude != null;

export function PartnerDistance({ initialMe, initialPartner }: {
  initialMe: PersonLocation;
  initialPartner: PersonLocation;
}) {
  const [me, setMe] = useState(initialMe);
  const [partner, setPartner] = useState(initialPartner);
  const distance = useMemo(() => distanceKm(me, partner), [me, partner]);

  useEffect(() => {
    if (!partner.timezone) return;
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const localZone = partner.timezone === "UTC" && detected ? detected : partner.timezone;
    const update = () => setPartner((current) => ({ ...current,
      localTime: new Intl.DateTimeFormat("en", { timeZone: localZone, hour: "numeric", minute: "2-digit" }).format(),
    }));
    update();
    const timer = window.setInterval(update, 30_000);
    return () => window.clearInterval(timer);
  }, [partner.timezone]);

  useEffect(() => {
    const supabase = createClient();
    const update = async (
      setter: React.Dispatch<React.SetStateAction<PersonLocation>>,
      payload: { new: Record<string, unknown> },
    ) => {
      const avatarChanged = "avatar_path" in payload.new;
      const avatarPath = typeof payload.new.avatar_path === "string" ? payload.new.avatar_path : null;
      const avatarUrl = avatarChanged && avatarPath
        ? (await supabase.storage.from("avatars").createSignedUrl(avatarPath, 900)).data?.signedUrl
        : undefined;
      setter((current) => ({
        ...current,
        name: typeof payload.new.display_name === "string" ? payload.new.display_name : current.name,
        avatarUrl: avatarChanged ? avatarUrl : current.avatarUrl,
        avatarPath: avatarChanged ? avatarPath : current.avatarPath,
        timezone: typeof payload.new.timezone === "string" ? payload.new.timezone : current.timezone,
        latitude: payload.new.latitude == null ? null : Number(payload.new.latitude),
        longitude: payload.new.longitude == null ? null : Number(payload.new.longitude),
        locationSharing: Boolean(payload.new.location_sharing),
        accuracy:
          payload.new.location_accuracy_m == null
            ? null
            : Number(payload.new.location_accuracy_m),
      }));
    };
    const channel = supabase.channel(`distance-${initialMe.id}-${initialPartner.id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${initialMe.id}` }, (payload) => void update(setMe, payload))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${initialPartner.id}` }, (payload) => void update(setPartner, payload))
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [initialMe.id, initialPartner.id]);

  useEffect(() => {
    const supabase = createClient();
    const refresh = async (
      avatarPath: string | null | undefined,
      setter: React.Dispatch<React.SetStateAction<PersonLocation>>,
    ) => {
      if (!avatarPath) return;
      const signed = await supabase.storage
        .from("avatars")
        .createSignedUrl(avatarPath, 86_400);
      if (signed.data?.signedUrl)
        setter((current) => ({ ...current, avatarUrl: signed.data.signedUrl }));
    };
    const refreshBoth = () => {
      void refresh(me.avatarPath, setMe);
      void refresh(partner.avatarPath, setPartner);
    };
    refreshBoth();
    const timer = window.setInterval(refreshBoth, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, [me.avatarPath, partner.avatarPath]);

  if (!hasLocation(me)) return <LocationMessage icon="off" text={hasLocation(partner) ? `${partner.name} is sharing a location. Precise GPS gives the most accurate result.` : "Location is off for both of you."} action="Turn on your location" />;
  if (!hasLocation(partner)) return <LocationMessage icon="on" text={`Your location is on. Ask ${partner.name} to turn on precise location to see the distance.`} />;

  const mappedMe = { ...me, latitude: me.latitude!, longitude: me.longitude! };
  const mappedPartner = { ...partner, latitude: partner.latitude!, longitude: partner.longitude! };
  return <section className="between-us-widget surface card mt-5 overflow-hidden p-0">
    <div className="flex flex-wrap items-center justify-between gap-3 p-5"><div><span className="eyebrow">Between us</span><p className="display mt-1 text-3xl">{distance?.toLocaleString() ?? "—"} km apart</p></div><span className="chip flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-emerald-500" />Live</span></div>
    <div className="live-distance-map">
      <BetweenUsMap me={mappedMe} partner={mappedPartner} />
      <div className="between-map-distance"><MapPin className="size-5 text-[var(--rose)]" /><span><strong>{distance?.toLocaleString() ?? "—"} km apart</strong><small>{partner.name}{partner.localTime ? ` · ${partner.localTime}` : ""}</small></span></div>
    </div>
    <p className="muted px-5 py-3 text-center text-xs">Precise live positions update while DNest is open.{me.accuracy != null && partner.accuracy != null ? ` GPS accuracy: you ±${Math.round(me.accuracy)} m · ${partner.name} ±${Math.round(partner.accuracy)} m.` : ""} Map.</p>
  </section>;
}

function LocationMessage({ icon, text, action }: { icon: "on" | "off"; text: string; action?: string }) {
  return <div className="surface card mt-5 flex items-center gap-4 p-4"><LocateFixed className={`size-6 shrink-0 ${icon === "on" ? "text-emerald-600" : "text-[var(--rose)]"}`} /><p className="text-sm">{text}{action && <> <Link className="font-bold text-[var(--rose-deep)] underline" href="/settings">{action}</Link>.</>}</p></div>;
}
