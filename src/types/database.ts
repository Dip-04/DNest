export type Mood =
  | "Happy"
  | "Loved"
  | "Calm"
  | "Excited"
  | "Tired"
  | "Missing You"
  | "Stressed"
  | "Low"
  | "Other";
export type WishlistStatus = "dream" | "planning" | "done";
export interface Profile {
  id: string;
  display_name: string;
  gender_identity?: string | null;
  avatar_path: string | null;
  birthday: string | null;
  timezone: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  location_sharing: boolean;
  location_updated_at: string | null;
  location_accuracy_m?: number | null;
}
export interface Moment {
  id: string;
  nest_id: string;
  created_by: string;
  title: string;
  story: string;
  moment_at: string;
  timezone: string;
  mood: string | null;
  category: string;
  location_name: string | null;
  is_favorite: boolean;
  created_at: string;
}
export interface NestContext {
  id: string;
  name: string;
  relationship_start: string | null;
  created_by: string;
  members: { user_id: string; profiles: Profile | null }[];
}
