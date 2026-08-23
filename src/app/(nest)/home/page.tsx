import Link from "next/link";
import {
  BookHeart,
  CalendarDays,
  Clock3,
  Heart,
  MapPin,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { EmptyState } from "@/components/empty-state";
import { MeetupCountdown } from "@/components/meetup-countdown";
import { MoodPicker } from "@/components/mood-picker";
import { PartnerDistance } from "@/components/partner-distance";
import { thinkOfPartner } from "@/features/shared/actions";
import { createClient } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
import {
  daysTogether,
  distanceKm,
  formatLocalTime,
  yearsAgoOnThisDay,
} from "@/lib/date";
import type { Moment, Profile } from "@/types/database";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const supabase = await createClient();
  const members = context.nest.members;
  const me = members.find((m) => m.user_id === context.userId)?.profiles as
    Profile | undefined;
  const partner = members.find((m) => m.user_id !== context.userId)
    ?.profiles as Profile | undefined;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: me?.timezone ?? "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [
    { data: meetups },
    { data: moods },
    { data: moments },
    { count: unreadCount },
  ] = await Promise.all([
    supabase
      .from("meetups")
      .select("*")
      .eq("nest_id", context.nest.id)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at")
      .limit(1),
    supabase
      .from("daily_moods")
      .select("user_id,mood")
      .eq("nest_id", context.nest.id)
      .eq("local_date", today),
    supabase
      .from("moments")
      .select("*")
      .eq("nest_id", context.nest.id)
      .order("moment_at", { ascending: false })
      .limit(8),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);
  const meetup = meetups?.[0];
  const recent = (moments ?? []) as Moment[];
  const onThisDay = recent.find((moment) =>
    yearsAgoOnThisDay(moment.moment_at),
  );
  const distance =
    me?.location_sharing && partner?.location_sharing
      ? distanceKm(me, partner)
      : null;
  const query = await searchParams;
  const greeting = new Intl.DateTimeFormat("en", {
    timeZone: me?.timezone ?? "UTC",
    hour: "numeric",
    hour12: false,
  }).format(new Date());
  const hour = Number(greeting);
  const daypart = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  return (
    <AnimatedPage>
      <header className="flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">Your private front door</span>
          <h1 className="display mt-2 text-4xl sm:text-5xl">
            Good {daypart}, {me?.display_name ?? "love"}{" "}
            <span aria-hidden>♥</span>
          </h1>
          <p className="muted mt-2">
            {partner
              ? `${partner.display_name}’s time is ${formatLocalTime(partner.timezone)}${distance != null ? ` · ${distance.toLocaleString()} km apart` : ""}`
              : "Your Nest is ready for the person you love."}
          </p>
        </div>
        <Link
          href="/notifications"
          className="btn btn-secondary !px-3"
          aria-label="Notifications"
        >
          <Heart className="size-5" />
          <span className="sr-only">Unread notifications</span>
          {(unreadCount ?? 0) > 0 && (
            <span className="size-2 rounded-full bg-[var(--rose)]" />
          )}
        </Link>
      </header>
      {me && partner && (
        <PartnerDistance
          initialMe={{
            id: me.id,
            name: me.display_name,
            latitude: me.latitude,
            longitude: me.longitude,
            locationSharing: me.location_sharing,
          }}
          initialPartner={{
            id: partner.id,
            name: partner.display_name,
            latitude: partner.latitude,
            longitude: partner.longitude,
            locationSharing: partner.location_sharing,
          }}
        />
      )}
      {query.message && (
        <p
          role="status"
          className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3 text-sm text-[var(--rose-deep)]"
        >
          {query.message}
        </p>
      )}
      <section className="mt-7 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <article className="surface card relative overflow-hidden bg-[linear-gradient(135deg,var(--surface),var(--rose-soft))] p-7">
          <span className="eyebrow">The two of you</span>
          <h2 className="display mt-4 text-4xl">
            {me?.display_name ?? "You"}{" "}
            <span className="text-[var(--rose)]">♥</span>{" "}
            {partner?.display_name ?? "Your partner"}
          </h2>
          <div className="mt-7 flex flex-wrap gap-5">
            <div>
              <strong className="display text-3xl">
                {daysTogether(
                  context.nest.relationship_start,
                )?.toLocaleString() ?? "—"}
              </strong>
              <p className="muted text-xs">days together</p>
            </div>
            <div>
              <strong className="display text-xl">
                {context.nest.relationship_start
                  ? new Intl.DateTimeFormat("en", {
                      dateStyle: "long",
                      timeZone: "UTC",
                    }).format(new Date(context.nest.relationship_start))
                  : "Add your date"}
              </strong>
              <p className="muted text-xs">the story began</p>
            </div>
          </div>
        </article>
        {meetup ? (
          <article className="meetup-hero card overflow-hidden p-7 text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <CalendarDays className="size-4" />
              Next hello · {meetup.destination}
            </div>
            <h2 className="display my-5 text-3xl">{meetup.title}</h2>
            <MeetupCountdown target={meetup.starts_at} />
          </article>
        ) : (
          <article className="surface card">
            <EmptyState
              icon={Clock3}
              title="No countdown yet"
              text="Add the next day you’ll be together and let the anticipation have a home."
              href="/plans"
              label="Plan our next hello"
            />
          </article>
        )}
      </section>
      <section className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <article className="surface card">
          <span className="eyebrow">A small signal</span>
          <h2 className="display mt-3 text-3xl">No words needed.</h2>
          <p className="muted mt-2">
            Send one quiet reminder that they’re loved.
          </p>
          <form action={thinkOfPartner} className="mt-6">
            <input type="hidden" name="nest_id" value={context.nest.id} />
            <button
              className="thinking-button btn btn-primary w-full"
              disabled={!partner}
              type="submit"
            >
              <Heart className="size-5 fill-current" />
              Thinking of You
            </button>
          </form>
        </article>
        <article className="surface card">
          <span className="eyebrow">Today’s mood</span>
          <h2 className="display mt-3 text-3xl">How are you, really?</h2>
          <p className="muted mt-2 mb-5 text-sm">
            A gentle check-in, never a score.
          </p>
          <MoodPicker
            nestId={context.nest.id}
            timezone={me?.timezone ?? "UTC"}
            current={moods?.find((m) => m.user_id === context.userId)?.mood}
          />
          {partner && (
            <p className="muted mt-4 text-sm">
              {partner.display_name}:{" "}
              <strong className="text-[var(--foreground)]">
                {moods?.find((m) => m.user_id === partner.id)?.mood ??
                  "Not checked in yet"}
              </strong>
            </p>
          )}
        </article>
        <article className="surface card">
          <span className="eyebrow">Today’s question</span>
          <h2 className="display mt-3 text-2xl">
            What’s one small thing your partner did recently that made you
            smile?
          </h2>
          <p className="muted mt-3 text-sm">
            Your answer stays hidden until both of you reply.
          </p>
          <Link className="btn btn-secondary mt-5" href="/questions">
            Answer privately
          </Link>
        </article>
      </section>
      {onThisDay && (
        <section className="surface card mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--rose-soft)]">
            <Sparkles className="size-6 text-[var(--rose-deep)]" />
          </div>
          <div className="flex-1">
            <span className="eyebrow">
              On this day · {yearsAgoOnThisDay(onThisDay.moment_at)} years ago
            </span>
            <h2 className="display mt-2 text-3xl">{onThisDay.title}</h2>
            <p className="muted mt-1 line-clamp-2">{onThisDay.story}</p>
          </div>
          <Link href="/moments" className="btn btn-secondary">
            Remember this
          </Link>
        </section>
      )}
      <section className="mt-8">
        <div className="flex items-end justify-between">
          <div>
            <span className="eyebrow">The story of us</span>
            <h2 className="display mt-2 text-4xl">Recent moments</h2>
          </div>
          <Link
            href="/moments"
            className="text-sm font-bold text-[var(--rose-deep)]"
          >
            See the timeline →
          </Link>
        </div>
        {recent.length ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {recent.slice(0, 4).map((moment) => (
              <article className="surface card min-h-48" key={moment.id}>
                <span className="chip">{moment.category}</span>
                <h3 className="display mt-7 text-2xl">{moment.title}</h3>
                <p className="muted mt-2 line-clamp-2 text-sm">
                  {moment.story || "A moment held safely between you."}
                </p>
                <p className="muted mt-5 flex items-center gap-1 text-xs">
                  <MapPin className="size-3" />
                  {moment.location_name ??
                    new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(moment.moment_at))}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              icon={BookHeart}
              title="Your story starts here"
              text="Save the moments you’ll want to remember years from now."
              href="/moments/new"
              label="Capture a Moment"
            />
          </div>
        )}
      </section>
      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link
          className="surface card flex items-center gap-3 font-bold"
          href="/moments/new"
        >
          <BookHeart className="text-[var(--rose)]" />
          Capture a Moment
        </Link>
        <Link
          className="surface card flex items-center gap-3 font-bold"
          href="/notes"
        >
          <MessageCircleHeart className="text-[var(--rose)]" />
          Leave a Love Note
        </Link>
        <Link
          className="surface card flex items-center gap-3 font-bold"
          href="/together"
        >
          <Sparkles className="text-[var(--plum)]" />
          Find something to do
        </Link>
      </section>
    </AnimatedPage>
  );
}
