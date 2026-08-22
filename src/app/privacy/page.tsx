import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-shell";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Privacy",
  description:
    "Learn how DNest protects private couple memories, photos, notes, locations, account information, and authenticated relationship content.",
  path: "/privacy",
});
export default function PrivacyPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <span className="eyebrow">Privacy by design</span>
        <h1 className="display mt-4 text-5xl sm:text-6xl">
          Your relationship is not public content.
        </h1>
        <p className="muted mt-5 text-lg leading-8">
          DNest is designed as a private space shared by exactly two
          authenticated partners. This page explains the application’s technical
          privacy model; a production operator should add its legal entity,
          contact, jurisdiction, and retention dates before launch.
        </p>
        <div className="mt-12 space-y-10">
          <section>
            <h2 className="display text-3xl">What DNest stores</h2>
            <p className="muted mt-3 leading-7">
              Account and profile details, Nest membership, relationship Moments
              and private media, Love Notes, moods, question answers, meetup
              plans, wishlist items, important dates, notifications, locations
              you choose to add, and Time Capsules.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Who can access shared content</h2>
            <p className="muted mt-3 leading-7">
              Shared relationship records belong to a Nest. Database row-level
              security checks active membership on private reads and writes. A
              Nest cannot accept a third active member. Private storage uses
              membership policies and short-lived signed URLs.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Search engines and analytics</h2>
            <p className="muted mt-3 leading-7">
              Authenticated pages, invitation flows, account pages, API routes,
              private photos, and couple-specific URLs are excluded from the
              sitemap and marked noindex where HTML is rendered. DNest does not
              send memory bodies, notes, moods, answers, exact locations, or
              private images to analytics.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Locked and hidden content</h2>
            <p className="muted mt-3 leading-7">
              Daily Question answers remain hidden from the partner until both
              respond. Strict Time Capsule contents are not returned to either
              browser before the unlock time. These controls are enforced on the
              server or in PostgreSQL rather than with visual hiding alone.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Control and deletion</h2>
            <p className="muted mt-3 leading-7">
              Authenticated users can request an export. Because shared memories
              belong to both partners, full Nest deletion should follow a
              reviewed retention workflow that informs both members and removes
              private storage alongside database records.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
