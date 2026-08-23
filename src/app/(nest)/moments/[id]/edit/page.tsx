import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { updateMoment } from "@/features/shared/actions";
import { ImageUploadField } from "@/components/image-upload-field";
import { FormSubmitButton } from "@/components/form-submit-button";
import { getNestContext } from "@/lib/nest";
import { createClient } from "@/lib/supabase/server";
import type { Moment } from "@/types/database";

const categories = [
  "First Date",
  "Trip",
  "Birthday",
  "Anniversary",
  "Funny Moment",
  "Everyday Memory",
  "Milestone",
  "Celebration",
  "Surprise",
  "Other",
];

const moods = [
  "Romantic",
  "Funny",
  "Emotional",
  "Celebration",
  "Peaceful",
  "Special",
];

export default async function EditMomentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("moments")
    .select("*,moment_media(storage_path,sort_order)")
    .eq("id", id)
    .eq("nest_id", context.nest.id)
    .maybeSingle();
  if (!data) notFound();
  const moment = data as Moment;
  const media = (
    data as unknown as {
      moment_media: { storage_path: string; sort_order: number }[];
    }
  ).moment_media.sort((a, b) => a.sort_order - b.sort_order)[0];
  const currentImageUrl = media
    ? (await supabase.storage.from("moment-media").createSignedUrl(media.storage_path, 900))
        .data?.signedUrl
    : undefined;

  return (
    <div className="mx-auto max-w-3xl">
      <Link className="muted flex items-center gap-2 text-sm" href="/moments">
        <ArrowLeft className="size-4" />
        Back to Moments
      </Link>
      <header className="mt-6">
        <span className="eyebrow">Keep the details true</span>
        <h1 className="display mt-2 text-5xl">Edit Moment</h1>
        <p className="muted mt-2">
          Update this memory without creating a new one.
        </p>
      </header>
      <form
        action={updateMoment}
        className="surface card mt-7 grid gap-5 p-6 sm:p-8"
        encType="multipart/form-data"
      >
        <input type="hidden" name="id" value={moment.id} />
        <input type="hidden" name="nest_id" value={context.nest.id} />
        <input type="hidden" name="timezone" value={moment.timezone || "UTC"} />
        <label className="label">
          Title
          <input
            className="field"
            name="title"
            maxLength={120}
            defaultValue={moment.title}
            required
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="label">
            Date and time
            <input
              className="field"
              name="moment_at"
              type="datetime-local"
              defaultValue={new Date(moment.moment_at)
                .toISOString()
                .slice(0, 16)}
              required
            />
          </label>
          <label className="label">
            Category
            <select
              className="field"
              name="category"
              defaultValue={moment.category}
            >
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>
        </div>
        <ImageUploadField
          name="image"
          label="Moment image (optional)"
          currentUrl={currentImageUrl}
        />
        <label className="label">
          Story
          <textarea
            className="field min-h-40 resize-y"
            name="story"
            maxLength={10000}
            defaultValue={moment.story}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="label">
            Mood
            <select
              className="field"
              name="mood"
              defaultValue={moment.mood ?? ""}
            >
              <option value="">No mood</option>
              {moods.map((mood) => (
                <option key={mood}>{mood}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Location <span className="font-normal">(optional)</span>
            <input
              className="field"
              name="location_name"
              maxLength={160}
              defaultValue={moment.location_name ?? ""}
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <FormSubmitButton pendingLabel="Saving changes…">
            <Save className="size-4" />
            Save Changes
          </FormSubmitButton>
          <Link className="btn btn-secondary" href="/moments">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
