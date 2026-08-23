import { NextResponse } from "next/server";
import { z } from "zod";
import { distanceKm, formatLocalTime, safeTimeZone } from "@/lib/date";
import { authenticateNativeWidget } from "@/lib/native-widget-access";

const locationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

function noStore(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  return response;
}

export async function GET(request: Request) {
  const session = await authenticateNativeWidget(request);
  if (!session) return noStore({ error: "Unauthorized" }, { status: 401 });

  const { data: membership } = await session.admin
    .from("nest_members")
    .select("nest_id")
    .eq("user_id", session.userId)
    .eq("status", "active")
    .maybeSingle();
  if (!membership)
    return noStore({ error: "No active Nest" }, { status: 404 });

  const { data: members, error } = await session.admin
    .from("nest_members")
    .select(
      "user_id,profiles(id,display_name,timezone,latitude,longitude,location_sharing,location_updated_at)",
    )
    .eq("nest_id", membership.nest_id)
    .eq("status", "active");
  if (error)
    return noStore({ error: "Could not load widget state" }, { status: 500 });

  const normalized = (members ?? []).map((member) => ({
    userId: String(member.user_id),
    profile: Array.isArray(member.profiles)
      ? member.profiles[0]
      : member.profiles,
  }));
  const mine = normalized.find((member) => member.userId === session.userId)
    ?.profile;
  const theirs = normalized.find((member) => member.userId !== session.userId)
    ?.profile;
  if (!mine)
    return noStore({ error: "Profile not found" }, { status: 404 });

  const bothSharing = Boolean(
    theirs && mine.location_sharing && theirs.location_sharing,
  );
  const distance =
    bothSharing && theirs ? distanceKm(mine, theirs) : null;
  const exposeLocation = (profile: typeof mine | null | undefined) =>
    profile && bothSharing
      ? {
          latitude:
            profile.latitude == null ? null : Number(profile.latitude),
          longitude:
            profile.longitude == null ? null : Number(profile.longitude),
          updatedAt: profile.location_updated_at,
        }
      : null;

  void session.admin
    .from("native_widget_access")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", session.accessId);

  return noStore({
    generatedAt: new Date().toISOString(),
    sharing: bothSharing,
    distanceKm: distance,
    me: {
      name: mine.display_name,
      timezone: safeTimeZone(mine.timezone),
      localTime: formatLocalTime(safeTimeZone(mine.timezone)),
      location: exposeLocation(mine),
    },
    partner: theirs
      ? {
          name: theirs.display_name,
          timezone: safeTimeZone(theirs.timezone),
          localTime: formatLocalTime(safeTimeZone(theirs.timezone)),
          location: exposeLocation(theirs),
        }
      : null,
  });
}

export async function POST(request: Request) {
  const session = await authenticateNativeWidget(request);
  if (!session) return noStore({ error: "Unauthorized" }, { status: 401 });
  const parsed = locationSchema.safeParse(
    await request.json().catch(() => null),
  );
  if (!parsed.success)
    return noStore({ error: "Invalid location" }, { status: 400 });

  const { error } = await session.admin
    .from("profiles")
    .update({
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      location_sharing: true,
      location_updated_at: new Date().toISOString(),
    })
    .eq("id", session.userId);
  if (error)
    return noStore({ error: "Could not save location" }, { status: 500 });
  return noStore({ ok: true });
}

