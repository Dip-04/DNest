import Link from "next/link";
import {
  BarChart3,
  CalendarHeart,
  Gift,
  LockKeyhole,
  MapPinned,
  Sparkles,
} from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { EmptyState } from "@/components/empty-state";
import { MemoryMap } from "@/components/memory-map";
import { createCapsule, createImportantDate } from "@/features/shared/actions";
import { daysTogether } from "@/lib/date";
import { getNestContext } from "@/lib/nest";
import { createClient } from "@/lib/supabase/server";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const supabase = await createClient();
  const [moments, wishlist, notes, challenges, meetups, capsules, dates] =
    await Promise.all([
      supabase
        .from("moments")
        .select("id,location_name,latitude,longitude,title,moment_at", {
          count: "exact",
        })
        .eq("nest_id", context.nest.id),
      supabase
        .from("wishlist_items")
        .select("id", { count: "exact", head: true })
        .eq("nest_id", context.nest.id)
        .eq("status", "done"),
      supabase
        .from("love_notes")
        .select("id", { count: "exact", head: true })
        .eq("nest_id", context.nest.id),
      supabase
        .from("nest_challenges")
        .select("id", { count: "exact", head: true })
        .eq("nest_id", context.nest.id)
        .not("completed_at", "is", null),
      supabase
        .from("meetups")
        .select("id", { count: "exact", head: true })
        .eq("nest_id", context.nest.id),
      supabase
        .from("time_capsules")
        .select(
          "id,title,unlock_at,target_timezone,strict_lock,opened_at,created_at",
        )
        .eq("nest_id", context.nest.id)
        .order("unlock_at"),
      supabase
        .from("important_dates")
        .select("*")
        .eq("nest_id", context.nest.id)
        .order("event_date"),
    ]);
  const stats = [
    [daysTogether(context.nest.relationship_start) ?? 0, "Days together"],
    [moments.count ?? 0, "Moments saved"],
    [
      new Set(
        moments.data?.map((moment) => moment.location_name).filter(Boolean),
      ).size,
      "Places held",
    ],
    [notes.count ?? 0, "Love notes"],
    [wishlist.count ?? 0, "Dreams completed"],
    [challenges.count ?? 0, "Challenges"],
    [meetups.count ?? 0, "Meetups"],
  ];
  const now = new Date();
  const monthMoments =
    moments.data?.filter((moment) => {
      const date = new Date(moment.moment_at);
      return (
        date.getUTCMonth() === now.getUTCMonth() &&
        date.getUTCFullYear() === now.getUTCFullYear()
      );
    }) ?? [];
  const query = await searchParams;

  return (
    <AnimatedPage>
      <header>
        <span className="eyebrow">The shape of your shared story</span>
        <h1 className="display mt-2 text-5xl">Us</h1>
        <p className="muted mt-2">
          Memories, milestones, places, and future gifts—never a relationship
          score.
        </p>
      </header>
      {query.message && (
        <p className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3">
          {query.message}
        </p>
      )}

      <section className="mt-8">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-5 text-[var(--rose)]" />
          <h2 className="display text-3xl">
            Our relationship, in little numbers
          </h2>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
          {stats.map(([value, label]) => (
            <article className="stat-keepsake surface card text-center" key={label}>
              <strong className="display text-3xl">{value}</strong>
              <p className="muted mt-1 text-xs">{label}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-5 lg:grid-cols-2">
        <article className="surface card">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-[var(--rose)]" />
            <span className="eyebrow">
              Our {new Intl.DateTimeFormat("en", { month: "long" }).format(now)}
            </span>
          </div>
          <h2 className="display mt-4 text-4xl">A month worth remembering</h2>
          <p className="muted mt-3">
            {monthMoments.length}{" "}
            {monthMoments.length === 1 ? "memory" : "memories"} saved ·{" "}
            {
              new Set(
                monthMoments
                  .map((moment) => moment.location_name)
                  .filter(Boolean),
              ).size
            }{" "}
            places · {notes.count ?? 0} notes kept overall.
          </p>
          <p className="muted mt-5 text-sm">
            Recaps use only private Nest data and are never shared publicly
            without your action.
          </p>
        </article>
        <article className="surface card">
          <div className="flex items-center gap-2">
            <MapPinned className="size-5 text-[var(--plum)]" />
            <span className="eyebrow">Memory map</span>
          </div>
          <h2 className="display mt-4 text-4xl">Where your story happened</h2>
          <MemoryMap pins={moments.data ?? []} />
        </article>
      </section>

      <section className="mt-12">
        <span className="eyebrow">A gift for your future selves</span>
        <h2 className="display mt-2 text-4xl">Time Capsules</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <form
            action={createCapsule}
            className="capsule-compose surface card grid content-start gap-4"
          >
            <input type="hidden" name="nest_id" value={context.nest.id} />
            <input type="hidden" name="timezone" value="UTC" />
            <label className="label">
              Title
              <input
                className="field"
                name="title"
                required
                placeholder="Our anniversary capsule"
              />
            </label>
            <label className="label">
              Message
              <textarea className="field min-h-32" name="content" required />
            </label>
            <label className="label">
              Unlock date and time
              <input
                className="field"
                type="datetime-local"
                name="unlock_at"
                required
              />
            </label>
            <p className="muted text-xs">
              <LockKeyhole className="mr-1 inline size-3" />
              The message is not returned to either browser before this time.
            </p>
            <button className="btn btn-primary">Seal this capsule</button>
          </form>
          <div>
            {capsules.data?.length ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {capsules.data.map((capsule) => (
                  <Link
                    href={`/us/capsules/${capsule.id}`}
                    className="time-capsule surface card block"
                    key={capsule.id}
                  >
                    <Gift className="size-6 text-[var(--rose)]" />
                    <h3 className="display mt-5 text-2xl">{capsule.title}</h3>
                    <p className="muted mt-2 text-sm">
                      {new Date(capsule.unlock_at) > now
                        ? `Opens ${new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(new Date(capsule.unlock_at))}`
                        : "Ready to open ♥"}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Gift}
                title="Nothing sealed away yet"
                text="Write something for an anniversary, a birthday, or an ordinary future day."
              />
            )}
          </div>
        </div>
      </section>

      <section className="mt-12">
        <span className="eyebrow">Nothing meaningful forgotten</span>
        <h2 className="display mt-2 text-4xl">Important Dates</h2>
        <div className="mt-5 grid gap-5 lg:grid-cols-[.7fr_1.3fr]">
          <form
            action={createImportantDate}
            className="surface card grid content-start gap-4"
          >
            <input type="hidden" name="nest_id" value={context.nest.id} />
            <input type="hidden" name="timezone" value="UTC" />
            <label className="label">
              What day is this?
              <input className="field" name="title" required />
            </label>
            <label className="label">
              Date
              <input className="field" type="date" name="event_date" required />
            </label>
            <label className="label">
              Category
              <select className="field" name="category">
                {[
                  "Anniversary",
                  "Birthday",
                  "First Date",
                  "Trip",
                  "Milestone",
                  "Custom",
                ].map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="recurring_yearly" />
              Repeat every year
            </label>
            <button className="btn btn-secondary">Remember this date</button>
          </form>
          <div className="grid content-start gap-3">
            {dates.data?.length ? (
              dates.data.map((date) => (
                <article
                  className="surface card flex items-center gap-4"
                  key={date.id}
                >
                  <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[var(--rose-soft)]">
                    <CalendarHeart className="size-5 text-[var(--rose-deep)]" />
                  </div>
                  <div>
                    <h3 className="font-bold">{date.title}</h3>
                    <p className="muted text-sm">
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "long",
                        timeZone: "UTC",
                      }).format(new Date(`${date.event_date}T00:00:00Z`))}
                      {date.recurring_yearly ? " · yearly" : ""}
                    </p>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState
                icon={CalendarHeart}
                title="Add a day that matters"
                text="Anniversaries, birthdays, firsts, and personal milestones belong here."
              />
            )}
          </div>
        </div>
      </section>
    </AnimatedPage>
  );
}
