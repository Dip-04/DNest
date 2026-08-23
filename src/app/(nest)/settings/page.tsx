import Link from "next/link";
import {
  Download,
  KeyRound,
  LockKeyhole,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { FormSubmitButton } from "@/components/form-submit-button";
import {
  createInvite,
  deleteNest,
  savePreferences,
  updateNest,
  updateProfile,
} from "@/features/shared/actions";
import { getNestContext } from "@/lib/nest";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { PushSetup } from "@/components/push-setup";
const kinds = [
  ["love_note", "Love Notes"],
  ["thinking_of_you", "Thinking of You"],
  ["mood", "Mood updates"],
  ["question_unlocked", "Question unlocks"],
  ["challenge", "Challenges"],
  ["meetup", "Meetups"],
  ["important_date", "Important dates"],
  ["capsule", "Time Capsules"],
  ["wishlist", "Wishlist"],
  ["moment", "Moments"],
] as const;
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; invite?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const supabase = await createClient();
  const me = context.nest.members.find((m) => m.user_id === context.userId)
    ?.profiles as Profile;
  const partner = context.nest.members.find(
    (m) => m.user_id !== context.userId,
  );
  const isNestCreator = context.nest.created_by === context.userId;
  const { data: preferences } = await supabase
    .from("user_preferences")
    .select("notifications")
    .eq("user_id", context.userId)
    .single();
  const q = await searchParams;
  const flags = (preferences?.notifications ?? {}) as Record<string, boolean>;
  return (
    <AnimatedPage>
      <header>
        <span className="eyebrow">Your side of the Nest</span>
        <h1 className="display mt-2 text-5xl">Settings & privacy</h1>
        <p className="muted mt-2">
          Control what the app knows, stores, and tells you.
        </p>
      </header>
      {q.message && (
        <p role="status" className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3">
          {q.message}
        </p>
      )}
      <div className="mt-7 grid gap-5 lg:grid-cols-2">
        <form action={updateNest} className="surface card grid gap-4">
          <Pencil className="size-6 text-[var(--rose)]" />
          <h2 className="display text-3xl">Your Nest</h2>
          <input type="hidden" name="nest_id" value={context.nest.id} />
          <label className="label">
            Nest name
            <input
              className="field"
              name="name"
              defaultValue={context.nest.name}
              minLength={2}
              maxLength={80}
              required
            />
          </label>
          <label className="label">
            Relationship start date{" "}
            <span className="font-normal">(optional)</span>
            <input
              className="field"
              type="date"
              name="relationship_start"
              defaultValue={context.nest.relationship_start ?? ""}
            />
          </label>
          <FormSubmitButton pendingLabel="Saving Nest…">
            Save Nest
          </FormSubmitButton>
        </form>
        <form action={updateProfile} className="surface card grid gap-4">
          <h2 className="display text-3xl">Your profile</h2>
          <label className="label">
            Display name
            <input
              className="field"
              name="display_name"
              defaultValue={me.display_name}
              required
            />
          </label>
          <label className="label">
            Birthday <span className="font-normal">(optional)</span>
            <input
              className="field"
              type="date"
              name="birthday"
              defaultValue={me.birthday ?? ""}
            />
          </label>
          <label className="label">
            Time zone
            <input
              className="field"
              name="timezone"
              defaultValue={me.timezone}
              required
            />
          </label>
          <label className="label">
            City <span className="font-normal">(optional and private)</span>
            <input className="field" name="city" defaultValue={me.city ?? ""} />
          </label>
          <button className="btn btn-primary">Save profile</button>
        </form>
        <section className="surface card">
          <KeyRound className="size-6 text-[var(--rose)]" />
          <h2 className="display mt-5 text-3xl">Partner invitation</h2>
          {partner ? (
            <p className="muted mt-3">
              Your Nest is complete. Its two places are held by you and your
              partner.
            </p>
          ) : (
            <>
              <p className="muted mt-3">
                Create a one-use code. It expires in seven days and cannot admit
                a third person.
              </p>
              <form action={createInvite} className="mt-5 grid gap-4">
                <input type="hidden" name="nest_id" value={context.nest.id} />
                <label className="label">
                  Partner’s email{" "}
                  <span className="font-normal">(recommended)</span>
                  <input
                    className="field"
                    type="email"
                    name="email"
                    placeholder="partner@example.com"
                  />
                </label>
                <FormSubmitButton
                  className="btn btn-secondary"
                  pendingLabel="Generating…"
                >
                  Generate a private code
                </FormSubmitButton>
              </form>
              {q.invite && (
                <div className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-5 text-center">
                  <p className="eyebrow">Private invitation code</p>
                  <code className="mt-2 block text-2xl font-bold tracking-[.18em]">
                    {q.invite}
                  </code>
                  <p className="muted mt-2 text-xs">
                    Share it through a channel you trust.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
        <form action={savePreferences} className="surface card">
          <h2 className="display text-3xl">Notification preferences</h2>
          <p className="muted mt-2 text-sm">
            Push requires browser permission. In-app notifications follow the
            same categories.
          </p>
          <div className="mt-5 grid gap-3">
            {kinds.map(([key, label]) => (
              <label
                className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--border)] p-3 text-sm"
                key={key}
              >
                {label}
                <input
                  name={key}
                  type="checkbox"
                  defaultChecked={flags[key] !== false}
                  className="size-5 accent-[var(--rose)]"
                />
              </label>
            ))}
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className="btn btn-secondary">Save preferences</button>
            <PushSetup />
          </div>
        </form>
        <section className="surface card">
          <ShieldCheck className="size-6 text-[var(--sage)]" />
          <h2 className="display mt-5 text-3xl">Your data</h2>
          <div className="muted mt-3 space-y-3 text-sm leading-6">
            <p>
              <LockKeyhole className="mr-2 inline size-4" />
              Private content is protected by Nest membership policies and
              short-lived signed media URLs.
            </p>
            <p>
              Exports are created on demand and never cached. Locked capsule
              contents stay excluded until their unlock time.
            </p>
          </div>
          <Link className="btn btn-secondary mt-5" href="/api/export">
            <Download className="size-4" />
            Download my Nest data
          </Link>
        </section>
        <section className="surface card border-red-300/40 lg:col-span-2">
          <Trash2 className="size-6 text-red-500" />
          <h2 className="display mt-5 text-3xl">Danger zone</h2>
          {isNestCreator ? (
            <>
              <p className="muted mt-3 max-w-3xl text-sm leading-6">
                Deleting this Nest permanently removes its shared Moments,
                Love Notes, plans, settings, and private media for both
                partners. This cannot be undone.
              </p>
              <form action={deleteNest} className="mt-5 grid max-w-xl gap-4">
                <input type="hidden" name="nest_id" value={context.nest.id} />
                <label className="label">
                  Type <strong>{context.nest.name}</strong> to confirm
                  <input
                    className="field"
                    name="confirmation"
                    autoComplete="off"
                    required
                  />
                </label>
                <FormSubmitButton
                  className="btn btn-danger w-fit"
                  pendingLabel="Deleting Nest…"
                  confirmMessage="Permanently delete this Nest and all shared relationship data?"
                >
                  Delete Nest Permanently
                </FormSubmitButton>
              </form>
            </>
          ) : (
            <p className="muted mt-3 text-sm">
              Only the partner who created this Nest can permanently delete
              it.
            </p>
          )}
        </section>
      </div>
    </AnimatedPage>
  );
}
