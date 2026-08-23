import { NextResponse } from "next/server";
import { getNestContext } from "@/lib/nest";

type OsrmResponse = {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: { type: "LineString"; coordinates: [number, number][] };
  }>;
};

export async function GET() {
  const context = await getNestContext();
  if (!context)
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  const profiles = context.nest.members
    .map((member) => member.profiles)
    .filter((profile) =>
      Boolean(
        profile?.location_sharing &&
          profile.latitude != null &&
          profile.longitude != null,
      ),
    );
  if (profiles.length !== 2)
    return NextResponse.json({ error: "Both locations are required." }, { status: 409 });
  const [first, second] = profiles;
  const coordinates = `${first!.longitude},${first!.latitude};${second!.longitude},${second!.latitude}`;
  const endpoint = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false`;
  try {
    const response = await fetch(endpoint, {
      cache: "no-store",
      headers: { "User-Agent": "DNest/1.0 (private couple route display)" },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok)
      return NextResponse.json({ error: "Road route unavailable." }, { status: 502 });
    const payload = (await response.json()) as OsrmResponse;
    const route = payload.code === "Ok" ? payload.routes?.[0] : undefined;
    if (!route?.geometry?.coordinates?.length)
      return NextResponse.json({ error: "No driving route was found." }, { status: 404 });
    return NextResponse.json(
      {
        coordinates: route.geometry.coordinates.map(([longitude, latitude]) => [
          latitude,
          longitude,
        ]),
        distanceMeters: route.distance,
        durationSeconds: route.duration,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "Road route unavailable." }, { status: 504 });
  }
}
