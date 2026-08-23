import { describe, expect, it } from "vitest";
import { normalizeNest, type RawNest } from "@/lib/nest-context";

describe("normalizeNest", () => {
  it("maps Supabase's nest_members relation to the application members shape", () => {
    const profile = {
      id: "user-1",
      display_name: "Partner",
      avatar_path: null,
      birthday: null,
      timezone: "UTC",
      city: null,
      latitude: null,
      longitude: null,
      location_sharing: false,
      location_updated_at: null,
    };
    const raw: RawNest = {
      id: "nest-1",
      name: "Our Nest",
      relationship_start: null,
      created_by: "user-1",
      nest_members: [{ user_id: "user-1", profiles: [profile] }],
    };

    expect(normalizeNest(raw).members).toEqual([
      { user_id: "user-1", profiles: profile },
    ]);
  });

  it("handles a missing nested relation without crashing the home page", () => {
    const raw: RawNest = {
      id: "nest-1",
      name: "Our Nest",
      relationship_start: null,
      created_by: "user-1",
      nest_members: null,
    };

    expect(normalizeNest(raw).members).toEqual([]);
  });
});
