import type { Metadata } from "next";
import Link from "next/link";
import {
  BookHeart,
  CalendarClock,
  Gift,
  HeartHandshake,
  ListChecks,
  LockKeyhole,
  MapPinned,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-shell";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Features",
  description:
    "Explore DNest features for couples: shared memories, relationship timelines, love notes, meetup countdowns, virtual date ideas, and private planning.",
  path: "/features",
});
const groups = [
  {
    icon: BookHeart,
    title: "Moments, Timeline, and Memory Book",
    text: "Capture a title, story, date, mood, place, and private photos. Every Moment becomes part of a year-grouped relationship timeline and a photo-first Memory Book.",
  },
  {
    icon: MessageCircleHeart,
    title: "Love Notes and Thinking of You",
    text: "Keep intentional notes outside ordinary chat. Send one now, schedule it for a partner’s local time, or share a quiet one-tap reminder without starting a conversation.",
  },
  {
    icon: CalendarClock,
    title: "Meetup countdown and planning",
    text: "Count down to the next hello, keep travel details nearby, and share a checklist for flights, hotels, restaurants, activities, packing, and documents.",
  },
  {
    icon: Sparkles,
    title: "Daily rituals and virtual dates",
    text: "Answer a private daily question, share a mood without scoring it, choose a virtual date idea, or take part in a gentle non-competitive challenge.",
  },
  {
    icon: ListChecks,
    title: "Wishlist and important dates",
    text: "Keep a couple bucket list from Dream to Planning to Done, convert finished wishes into Moments, and remember anniversaries, birthdays, firsts, and milestones.",
  },
  {
    icon: MapPinned,
    title: "Memory Map and recaps",
    text: "See where the relationship story happened and revisit data-backed monthly highlights. Locations and recap details remain inside the authenticated Nest.",
  },
  {
    icon: Gift,
    title: "Time Capsules",
    text: "Seal a message for a future date. Strict capsule contents are not returned to the browser before their server-enforced unlock time.",
  },
  {
    icon: LockKeyhole,
    title: "Private by architecture",
    text: "A Nest has exactly two active members. PostgreSQL row-level security protects shared records, and relationship media lives in private storage buckets.",
  },
];
export default function FeaturesPage() {
  return (
    <>
      <MarketingHeader />
      <main>
        <section className="mx-auto max-w-5xl px-5 py-20 text-center">
          <span className="eyebrow">
            Made for the story around the messages
          </span>
          <h1 className="display mx-auto mt-4 max-w-4xl text-5xl sm:text-6xl">
            A private couple space that grows more meaningful with time.
          </h1>
          <p className="muted mx-auto mt-6 max-w-3xl text-lg leading-8">
            DNest brings relationship memories, plans, rituals, and future
            dreams into one calm home—especially when the two of you cannot be
            in the same room.
          </p>
        </section>
        <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-24 md:grid-cols-2">
          {groups.map(({ icon: Icon, title, text }) => (
            <article key={title} className="surface card p-7">
              <Icon aria-hidden className="size-6 text-[var(--rose)]" />
              <h2 className="display mt-6 text-3xl">{title}</h2>
              <p className="muted mt-3 leading-7">{text}</p>
            </article>
          ))}
        </section>
        <section className="mx-auto mb-20 max-w-5xl px-5">
          <div className="surface card flex flex-col items-start justify-between gap-6 p-8 sm:flex-row sm:items-center">
            <div>
              <HeartHandshake className="size-6 text-[var(--plum)]" />
              <h2 className="display mt-4 text-3xl">
                A place for exactly two.
              </h2>
              <p className="muted mt-2">
                No public performance. Just your relationship’s private history.
              </p>
            </div>
            <Link href="/sign-up" className="btn btn-primary">
              Create your Nest
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
