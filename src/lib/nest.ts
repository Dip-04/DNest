import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";
import { normalizeNest, type RawNest } from "@/lib/nest-context";
import type { NestContext } from "@/types/database";

const coreNestSelect =
  "id,name,relationship_start,created_by,nest_members(user_id,profiles(id,display_name,avatar_path,birthday,timezone,city,latitude,longitude,location_sharing,location_updated_at))";
const enrichedNestSelect =
  "id,name,relationship_start,created_by,nest_members(user_id,profiles(id,display_name,gender_identity,avatar_path,birthday,timezone,city,latitude,longitude,location_sharing,location_updated_at,location_accuracy_m))";

export const getNestContext = cache(
  async (): Promise<{ userId: string; nest: NestContext } | null> => {
    const session = await requireUser();
    if (!session) return null;
    const { data: membership, error: membershipError } = await session.supabase
      .from("nest_members")
      .select("nest_id")
      .eq("user_id", session.user.id)
      .eq("status", "active")
      .maybeSingle();
    if (membershipError || !membership) return null;
    const enriched = await session.supabase
      .from("nests")
      .select(enrichedNestSelect)
      .eq("id", membership.nest_id)
      .single();
    let data: unknown = enriched.data;
    if (enriched.error || !data) {
      // Optional profile columns may lag behind an application deployment.
      // A schema mismatch must never make a valid Nest membership look absent.
      const fallback = await session.supabase
        .from("nests")
        .select(coreNestSelect)
        .eq("id", membership.nest_id)
        .single();
      if (fallback.error || !fallback.data) return null;
      data = fallback.data;
    }
    const raw = data as RawNest;
    return { userId: session.user.id, nest: normalizeNest(raw) };
  },
);
