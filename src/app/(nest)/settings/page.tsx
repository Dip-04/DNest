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
import { EditableFormSection } from "@/components/editable-form-section";
import { LocationFields } from "@/components/location-fields";
import { ImageUploadField } from "@/components/image-upload-field";
import {
  cancelNestDeletion,
  createInvite,
  deleteNest,
  requestNestDeletion,
  respondToNestDeletion,
  savePreferences,
  updateNest,
  updateProfile,
} from "@/features/shared/actions";
import { getNestContext } from "@/lib/nest";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/database";
import { PushSetup } from "@/components/push-setup";
import { safeTimeZone } from "@/lib/date";
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
  ["period_tracker", "Period tracker updates"],
  ["virtual_emotion", "Virtual emotions"],
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
  const { data: deletionRequest } = await supabase
    .from("nest_deletion_requests")
    .select(
      "status,requested_by,partner_id,partner_note,requested_at,responded_at",
    )
    .eq("nest_id", context.nest.id)
    .maybeSingle();
  const avatarUrl = me.avatar_path
    ? (
        await supabase.storage
          .from("avatars")
          .createSignedUrl(me.avatar_path, 900)
      ).data?.signedUrl
    : undefined;
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
        <EditableFormSection
          action={updateNest}
          className="surface card grid gap-4"
        >
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
        </EditableFormSection>
        <EditableFormSection
          action={updateProfile}
          className="surface card grid gap-4"
          encType="multipart/form-data"
        >
          <h2 className="display text-3xl">Your profile</h2>
          <ImageUploadField
            name="avatar"
            label="Profile image"
            currentUrl={avatarUrl}
            removeName="remove_avatar"
          />
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
            Gender identity <span className="font-normal">(optional)</span>
            <input
              className="field"
              name="gender_identity"
              defaultValue={me.gender_identity ?? ""}
              list="gender-identities"
              maxLength={60}
              placeholder="Choose or describe your identity"
            />
            <datalist id="gender-identities">
              <option value="Woman" />
              <option value="Man" />
              <option value="Non-binary" />
              <option value="Genderfluid" />
              <option value="Agender" />
              <option value="Questioning" />
              <option value="Prefer not to say" />
            </datalist>
          </label>
          <label className="label">
            Time zone
            <input
              className="field"
              name="timezone"
              defaultValue={safeTimeZone(me.timezone)}
              placeholder="Asia/Kolkata"
              required
            />
          </label>
          <LocationFields
            defaultCity={me.city ?? ""}
            defaultLatitude={me.latitude}
            defaultLongitude={me.longitude}
          />
        </EditableFormSection>
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
                Deleting affects both of you, so your partner must approve the
                request before the final decision returns to you. A deleted Nest
                can be recovered with all its memories for 30 days.
              </p>
              {deletionRequest?.status === "pending_partner" ? (
                <div className="mt-5">
                  <p className="font-bold">Waiting for your partner</p>
                  <p className="muted mt-1 text-sm">
                    Nothing can be deleted until they respond. You can withdraw
                    the request at any time.
                  </p>
                  <form action={cancelNestDeletion} className="mt-4">
                    <input
                      type="hidden"
                      name="nest_id"
                      value={context.nest.id}
                    />
                    <FormSubmitButton
                      className="btn btn-secondary"
                      pendingLabel="Cancelling…"
                    >
                      Cancel deletion request
                    </FormSubmitButton>
                  </form>
                </div>
              ) : deletionRequest?.status === "approved" ? (
                <div className="mt-5 grid max-w-xl gap-4">
                  <div>
                    <p className="font-bold">
                      {deletionRequest.partner_id
                        ? "Your partner approved the request"
                        : "Your deletion request is ready"}
                    </p>
                    <p className="muted mt-1 text-sm">
                      The choice is back with you. This final step hides the
                      Nest for both of you, but you can recover it for 30 days.
                    </p>
                    {deletionRequest.partner_note && (
                      <blockquote className="mt-4 border-l-4 border-[var(--rose)] pl-4 text-sm italic leading-6">
                        <span className="eyebrow mb-1 block">
                          Your partner’s final note
                        </span>
                        {deletionRequest.partner_note}
                      </blockquote>
                    )}
                  </div>
                  <form action={deleteNest} className="grid gap-4">
                    <input
                      type="hidden"
                      name="nest_id"
                      value={context.nest.id}
                    />
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
                      confirmMessage="Are you sure you are ready to let this shared place go? Your memories can be rescued for 30 days."
                    >
                      Delete Nest
                    </FormSubmitButton>
                  </form>
                  <form action={cancelNestDeletion}>
                    <input
                      type="hidden"
                      name="nest_id"
                      value={context.nest.id}
                    />
                    <FormSubmitButton
                      className="btn btn-secondary"
                      pendingLabel="Keeping Nest…"
                    >
                      Keep our Nest
                    </FormSubmitButton>
                  </form>
                </div>
              ) : (
                <>
                  {deletionRequest?.status === "declined" && (
                    <div className="mt-4">
                      <p className="text-sm font-bold">
                        Your partner declined the previous request. Your Nest is
                        still here.
                      </p>
                      {deletionRequest.partner_note && (
                        <blockquote className="mt-3 border-l-4 border-[var(--rose)] pl-4 text-sm italic leading-6">
                          <span className="eyebrow mb-1 block">
                            Your partner’s note
                          </span>
                          {deletionRequest.partner_note}
                        </blockquote>
                      )}
                    </div>
                  )}
                  <form
                    action={requestNestDeletion}
                    className="mt-5 grid max-w-xl gap-4"
                  >
                    <input
                      type="hidden"
                      name="nest_id"
                      value={context.nest.id}
                    />
                    <label className="label">
                      Type <strong>{context.nest.name}</strong> to request
                      deletion
                      <input
                        className="field"
                        name="confirmation"
                        autoComplete="off"
                        required
                      />
                    </label>
                    <FormSubmitButton
                      className="btn btn-danger w-fit"
                      pendingLabel="Sending request…"
                      confirmMessage="Are you sure you want to ask your partner to delete the place holding your shared memories?"
                    >
                      Ask to delete our Nest
                    </FormSubmitButton>
                  </form>
                </>
              )}
            </>
          ) : deletionRequest?.status === "pending_partner" &&
            deletionRequest.partner_id === context.userId ? (
            <div className="mt-3 max-w-3xl">
              <p className="text-lg font-bold">
                Your partner wants to delete your Nest.
              </p>
              <p className="muted mt-2 text-sm leading-6">
                This place carries memories you made together. Are you sure you
                are ready to let it go? Approval does not delete it immediately;
                the final choice goes back to the partner who created it.
              </p>
              <form action={respondToNestDeletion} className="mt-5 grid gap-4">
                <input type="hidden" name="nest_id" value={context.nest.id} />
                <label className="label">
                  Your reason and final note to your partner
                  <textarea
                    className="field min-h-28 resize-y"
                    name="partner_note"
                    maxLength={1000}
                    placeholder="Say what you feel and why you made this choice…"
                    required
                  />
                </label>
                <p className="muted text-xs">
                  Your partner will see this note before making the final
                  decision.
                </p>
                <div className="flex flex-wrap gap-3">
                  <FormSubmitButton
                    className="btn btn-danger"
                    pendingLabel="Responding…"
                    confirmMessage="Are you sure you approve deleting your shared Nest? Your note will be shown to your partner before their final decision."
                    name="decision"
                    value="approve"
                  >
                    Approve deletion
                  </FormSubmitButton>
                  <FormSubmitButton
                    className="btn btn-secondary"
                    pendingLabel="Keeping Nest…"
                    name="decision"
                    value="decline"
                  >
                    Keep our Nest
                  </FormSubmitButton>
                </div>
              </form>
            </div>
          ) : deletionRequest?.status === "approved" ? (
            <p className="muted mt-3 text-sm">
              You approved this request. The creator must now make the final
              decision, and the Nest remains available until then.
            </p>
          ) : deletionRequest?.status === "declined" ? (
            <p className="muted mt-3 text-sm">
              You chose to keep this Nest. Nothing has been deleted.
            </p>
          ) : (
            <p className="muted mt-3 text-sm">
              Only the partner who created this Nest can start deletion. You
              will be asked for approval before anything changes.
            </p>
          )}
        </section>
      </div>
    </AnimatedPage>
  );
}
