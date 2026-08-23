import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ImageUploadField } from "@/components/image-upload-field";
import { FormSubmitButton } from "@/components/form-submit-button";
import { BrowserTimeZoneInput } from "@/components/browser-timezone-input";
import { createMoment } from "@/features/shared/actions";
import { getNestContext } from "@/lib/nest";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const { message } = await searchParams;
  const me = context.nest.members.find((member) => member.user_id === context.userId)?.profiles;
  return (
    <div className="mx-auto max-w-3xl">
      <Link className="muted flex items-center gap-2 text-sm" href="/moments">
        <ArrowLeft className="size-4" />
        Back to Moments
      </Link>
      <header className="mt-6">
        <span className="eyebrow">Hold onto this</span>
        <h1 className="display mt-2 text-5xl">Capture a Moment</h1>
        <p className="muted mt-2">The story matters as much as the photo.</p>
      </header>
      {message && (
        <p role="alert" className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3">
          {message}
        </p>
      )}
      <form
        action={createMoment}
        className="surface card mt-7 grid gap-5 p-6 sm:p-8"
        encType="multipart/form-data"
      >
        <input type="hidden" name="nest_id" value={context.nest.id} />
        <BrowserTimeZoneInput fallback={me?.timezone} />
        <label className="label">
          Title
          <input
            className="field"
            name="title"
            maxLength={120}
            placeholder="The sunset we nearly missed"
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
              required
            />
          </label>
          <label className="label">
            Category
            <select
              className="field"
              name="category"
              defaultValue="Everyday Memory"
            >
              {[
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
              ].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="label">
          Story
          <textarea
            className="field min-h-40 resize-y"
            name="story"
            maxLength={10000}
            placeholder="What do you never want the two of you to forget?"
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="label">
            Mood
            <select className="field" name="mood">
              <option value="">No mood</option>
              {[
                "Romantic",
                "Funny",
                "Emotional",
                "Celebration",
                "Peaceful",
                "Special",
              ].map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Location <span className="font-normal">(optional)</span>
            <input
              className="field"
              name="location_name"
              maxLength={160}
              placeholder="Marine Drive, Mumbai"
            />
          </label>
        </div>
        <ImageUploadField name="photos" label="Moment image (optional)" />
        <FormSubmitButton pendingLabel="Saving Moment…">
          Save Moment ♥
        </FormSubmitButton>
      </form>
    </div>
  );
}
