import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  createNativeWidgetToken,
  hashNativeWidgetToken,
} from "@/lib/native-widget-access";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/server";

const schema = z.object({ platform: z.enum(["ios", "android"]) });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.NEXT_PUBLIC_APP_URL ?? request.url)
    .origin;
  if (origin && origin !== expected)
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const session = await requireUser();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });

  const admin = createAdminClient();
  if (!admin)
    return NextResponse.json(
      { error: "Native widgets are not configured on this deployment" },
      { status: 503 },
    );

  const token = createNativeWidgetToken();
  const now = new Date().toISOString();
  await admin
    .from("native_widget_access")
    .update({ revoked_at: now })
    .eq("user_id", session.user.id)
    .eq("platform", parsed.data.platform)
    .is("revoked_at", null);
  const { error } = await admin.from("native_widget_access").insert({
    user_id: session.user.id,
    platform: parsed.data.platform,
    token_hash: hashNativeWidgetToken(token),
  });
  if (error)
    return NextResponse.json(
      { error: "Could not create a widget key" },
      { status: 500 },
    );

  return NextResponse.json(
    { token, platform: parsed.data.platform },
    { headers: { "Cache-Control": "no-store" } },
  );
}

