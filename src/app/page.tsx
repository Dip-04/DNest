import Link from "next/link";
import {
  ArrowRight,
  BookHeart,
  CalendarHeart,
  Heart,
  ListChecks,
  LockKeyhole,
  MapPinned,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";
import { HeroVisual } from "@/components/3d/hero-visual";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { Reveal } from "@/components/reveal";
import { getSiteUrl, siteDescription, siteName } from "@/lib/seo";

const featureCards = [
  {
    icon: BookHeart,
    title: "Moments and Memory Book",
    text: "Save photos with the story around them, then revisit everything as an editorial memory book or a chronological relationship timeline.",
  },
  {
    icon: MessageCircleHeart,
    title: "Love Notes that last",
    text: "Leave an intentional note now or schedule one for the right moment in your partner’s time zone. DNest is not another chat inbox.",
  },
  {
    icon: CalendarHeart,
    title: "The next hello",
    text: "Keep a shared meetup countdown, travel details, and a gentle checklist so anticipation has a place of its own.",
  },
  {
    icon: Sparkles,
    title: "Virtual date ideas",
    text: "Find small things to do together—from a fifteen-minute ritual to a full date night—without competitive streaks or scores.",
  },
  {
    icon: ListChecks,
    title: "A couple bucket list",
    text: "Collect someday dreams, move them from planning to done, and turn a completed wish into a memory without rewriting it.",
  },
  {
    icon: MapPinned,
    title: "Your story across places",
    text: "See meaningful locations on a private memory map. Exact coordinates and photos remain protected inside your shared Nest.",
  },
];

export default function LandingPage() {
  const siteUrl = getSiteUrl().toString();
  const structuredData = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: siteUrl,
      description: siteDescription,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: siteName,
      url: siteUrl,
      description: siteDescription,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      browserRequirements:
        "Requires a modern web browser with JavaScript enabled",
    },
  ];

  return (
    <>
      <JsonLd data={structuredData} />
      <MarketingHeader />
      <main className="landing-page overflow-hidden">
        <section className="hero-section mx-auto grid min-h-[82vh] max-w-7xl items-center gap-10 px-5 py-12 lg:grid-cols-[.92fr_1.08fr] lg:py-20">
          <div className="hero-copy">
            <span className="eyebrow">A private relationship app for two</span>
            <h1 className="display mt-5 max-w-3xl text-6xl leading-[.92] font-semibold sm:text-7xl xl:text-[5.5rem]">
              Your relationship deserves{" "}
              <em className="text-[var(--rose-deep)]">a place of its own.</em>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 sm:text-xl">
              DNest is your private couple space for shared memories, love
              notes, meetup plans, and the story you are building across any
              distance.
            </p>
            <p className="muted mt-3 max-w-xl text-lg">
              Our little place, no matter the distance.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="btn btn-primary" href="/sign-up">
                Create your Nest <ArrowRight className="size-4" />
              </Link>
              <Link className="btn btn-secondary" href="/features">
                Explore features
              </Link>
            </div>
            <p className="muted mt-5 flex items-center gap-2 text-sm">
              <LockKeyhole className="size-4" />
              Exactly two members. No feeds, followers, or public profiles.
            </p>
          </div>
          <HeroVisual />
        </section>

        <section
          id="features"
          className="editorial-section mx-auto max-w-7xl px-5 py-24"
        >
      <Reveal className="section-intro">
            <span className="eyebrow">Everything around talking</span>
            <h2 className="display mt-3 max-w-3xl text-4xl sm:text-6xl">
              A private scrapbook and relationship companion for long-distance
              couples.
            </h2>
            <p className="muted mt-5 max-w-3xl text-lg leading-8">
              Messaging helps you talk today. DNest keeps the memories, plans,
              rituals, and milestones you will want to return to years from now.
            </p>
      </Reveal>
      <Reveal className="memory-gallery mt-14" delay={.08}>
            {featureCards
              .slice(0, 3)
              .map(({ icon: Icon, title, text }, index) => (
                <article
                  className={`feature-story feature-story-${index + 1}`}
                  key={title}
                >
                  <div className="feature-visual" aria-hidden>
                    <Icon className="size-8" />
                    <span>{String(index + 1).padStart(2, "0")}</span>
      </Reveal>
                  <div>
                    <h3 className="display text-3xl">{title}</h3>
                    <p className="muted mt-3 leading-7">{text}</p>
                  </div>
                </article>
              ))}
          </div>
        </section>

        <section className="relationship-path mx-auto max-w-7xl px-5 py-24">
          <div className="path-line" aria-hidden />
      <Reveal className="grid gap-6 lg:grid-cols-3">
            {featureCards.slice(3).map(({ icon: Icon, title, text }, index) => (
              <article className="surface path-card" key={title}>
                <span className="path-dot" aria-hidden />
                <Icon aria-hidden className="size-6 text-[var(--rose)]" />
                <p className="eyebrow mt-8">0{index + 4}</p>
                <h3 className="display mt-2 text-3xl">{title}</h3>
                <p className="muted mt-3 leading-7">{text}</p>
              </article>
            ))}
      </Reveal>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-24">
      <Reveal className="ritual-card surface grid gap-10 p-7 sm:p-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
            <div>
              <Heart
                aria-hidden
                className="size-7 fill-[var(--rose-soft)] text-[var(--rose)]"
              />
              <span className="eyebrow mt-5 block">A simple daily rhythm</span>
              <h2 className="display mt-3 text-4xl sm:text-5xl">
                Open it. Feel close. Add one meaningful thing.
              </h2>
      </Reveal>
            <div className="grid gap-5 sm:grid-cols-2">
              <article className="paper-note">
                <span className="paper-tape" aria-hidden />
                <h3 className="font-bold">Remember together</h3>
                <p className="muted mt-2 text-sm leading-6">
                  On This Day resurfaces past Moments without exposing them to
                  public pages or search engines.
                </p>
              </article>
              <article className="question-card">
                <Sparkles className="size-5 text-[var(--plum)]" />
                <h3 className="mt-5 font-bold">Discover together</h3>
                <p className="muted mt-2 text-sm leading-6">
                  Daily questions keep each answer hidden until both partners
                  have replied.
                </p>
              </article>
            </div>
          </div>
        </section>

        <section className="mx-auto mb-24 max-w-7xl px-5 pt-16">
      <Reveal className="privacy-card surface grid gap-8 p-8 sm:p-12 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <LockKeyhole className="size-7 text-[var(--plum)]" />
              <h2 className="display mt-5 text-4xl sm:text-5xl">
                This place belongs only to you two.
              </h2>
              <p className="muted mt-3 max-w-2xl leading-7">
                DNest has no searchable couples, public Moment pages, or social
                feed. Shared rows and private media are protected by Nest
                membership—not by a hidden button in the browser.
              </p>
              <Link
                href="/privacy"
                className="mt-5 inline-block font-bold text-[var(--rose-deep)]"
              >
                Read how privacy works →
              </Link>
      </Reveal>
            <Link className="btn btn-primary" href="/sign-up">
              Create your private space
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
