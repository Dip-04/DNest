import { Clock3, Heart, LockKeyhole, MailOpen } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { EmptyState } from "@/components/empty-state";
import { FormSubmitButton } from "@/components/form-submit-button";
import { createNote, openLoveNote } from "@/features/shared/actions";
import { createClient } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
import type { Profile } from "@/types/database";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const supabase = await createClient();
  const partner = context.nest.members.find((m) => m.user_id !== context.userId)
    ?.profiles as Profile | undefined;
  const { data: notes } = await supabase
    .from("love_notes")
    .select(
      "id,sender_id,recipient_id,body,theme,status,deliver_at,opened_at,created_at",
    )
    .eq("nest_id", context.nest.id)
    .order("created_at", { ascending: false });
  const q = await searchParams;
  return (
    <AnimatedPage>
      <header>
        <span className="eyebrow">Not chat · something to keep</span>
        <h1 className="display mt-2 text-5xl">Love Notes</h1>
        <p className="muted mt-2">
          Small messages that live outside the scroll.
        </p>
      </header>
      {q.message && (
        <p role="status" className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3">
          {q.message}
        </p>
      )}
      <div className="mt-7 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <form
          action={createNote}
          className="letter-compose surface card grid content-start gap-4 p-6"
        >
          <input type="hidden" name="nest_id" value={context.nest.id} />
          <input type="hidden" name="recipient_id" value={partner?.id ?? ""} />
          <h2 className="display text-3xl">Leave something warm</h2>
          <label className="label">
            Theme
            <select className="field" name="theme">
              {[
                "Love",
                "Motivation",
                "Missing You",
                "Good Morning",
                "Good Night",
                "Surprise",
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="label">
            Your note
            <textarea
              className="field min-h-44"
              name="body"
              maxLength={3000}
              required
              placeholder="Just wanted to remind you…"
            />
          </label>
          <label className="label">
            Deliver later{" "}
            <span className="font-normal">
              (optional, interpreted as your browser’s local time)
            </span>
            <input className="field" type="datetime-local" name="deliver_at" />
          </label>
          <button disabled={!partner} className="btn btn-primary" type="submit">
            {partner
              ? `Send to ${partner.display_name}`
              : "Invite your partner first"}
          </button>
        </form>
        <section>
          <h2 className="display text-3xl">Kept between you</h2>
          {notes?.length ? (
            <div className="mt-4 grid gap-4">
              {notes.map((note) => {
                const sealed =
                  note.recipient_id === context.userId && !note.opened_at;
                return (
                  <article
                    className="love-letter surface card"
                    id={`note-${note.id}`}
                    key={note.id}
                  >
                    <div className="flex items-center justify-between">
                      <span className="chip">{note.theme}</span>
                      <span className="muted flex items-center gap-1 text-xs">
                        <Clock3 className="size-3" />
                        {note.status === "scheduled"
                          ? `Scheduled ${new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.deliver_at))}`
                          : new Intl.DateTimeFormat("en", {
                              dateStyle: "medium",
                            }).format(new Date(note.created_at))}
                      </span>
                    </div>
                    {sealed ? (
                      <div className="mt-6 rounded-2xl bg-[var(--rose-soft)] p-6 text-center">
                        <LockKeyhole className="mx-auto size-7 text-[var(--rose-deep)]" />
                        <p className="display mt-3 text-2xl">
                          A Love Note is waiting for you
                        </p>
                        <form action={openLoveNote} className="mt-4">
                          <input type="hidden" name="id" value={note.id} />
                          <FormSubmitButton pendingLabel="Openingâ€¦">
                            <MailOpen className="size-4" />
                            Open Love Note
                          </FormSubmitButton>
                        </form>
                      </div>
                    ) : (
                      <p className="display mt-6 whitespace-pre-wrap text-2xl leading-9">
                        {note.body}
                      </p>
                    )}
                    <p className="muted mt-5 text-xs">
                      {note.sender_id === context.userId
                        ? "From you"
                        : `From ${partner?.display_name ?? "your partner"}`}{" "}
                      · {note.opened_at ? "Opened" : "Unopened"}
                    </p>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-4">
              <EmptyState
                icon={Heart}
                title="The first note is yours to write"
                text="A sentence can become the kind of thing they keep coming back to."
              />
            </div>
          )}
        </section>
      </div>
    </AnimatedPage>
  );
}
