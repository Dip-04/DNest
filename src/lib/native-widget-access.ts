import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type NativeWidgetPlatform = "ios" | "android";

export function createNativeWidgetToken() {
  return randomBytes(32).toString("base64url");
}

export function hashNativeWidgetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function authenticateNativeWidget(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9_-]{40,})$/i.exec(authorization);
  if (!match) return null;

  const admin = createAdminClient();
  if (!admin) return null;
  const tokenHash = hashNativeWidgetToken(match[1]);
  const { data } = await admin
    .from("native_widget_access")
    .select("id,user_id,platform")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();
  if (!data) return null;

  return {
    admin,
    accessId: String(data.id),
    userId: String(data.user_id),
    platform: data.platform as NativeWidgetPlatform,
  };
}

