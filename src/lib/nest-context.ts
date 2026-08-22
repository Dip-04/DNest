import type { NestContext, Profile } from "@/types/database";

export type RawNestMember = {
  user_id: string;
  profiles: Profile | Profile[] | null;
};

export type RawNest = Omit<NestContext, "members"> & {
  nest_members: RawNestMember[] | null;
};

export function normalizeNest(raw: RawNest): NestContext {
  return {
    id: raw.id,
    name: raw.name,
    relationship_start: raw.relationship_start,
    created_by: raw.created_by,
    members: (raw.nest_members ?? []).map(member => ({
      user_id: member.user_id,
      profiles: Array.isArray(member.profiles) ? (member.profiles[0] ?? null) : member.profiles,
    })),
  };
}
