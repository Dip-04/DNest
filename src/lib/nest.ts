import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";
import { normalizeNest, type RawNest } from "@/lib/nest-context";
import type { NestContext } from "@/types/database";

export const getNestContext = cache(
  async (): Promise<{ userId: string; nest: NestContext } | null> => {
    const session = await requireUser();
    if (!session) return null;
    const { data: membership } = await session.supabase
      .from("nest_members")
      .select("nest_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();
    if (!membership) return null;
    const { data, error } = await session.supabase
      .from("nests")
      .select(
        "id,name,relationship_start,created_by,nest_members(user_id,profiles(id,display_name,avatar_path,birthday,timezone,city,latitude,longitude,location_sharing,location_updated_at))",
      )
      .eq("id", membership.nest_id)
      .single();
    if (error || !data) return null;
    const raw = data as unknown as RawNest;
    return { userId: session.user.id, nest: normalizeNest(raw) };
  },
);
