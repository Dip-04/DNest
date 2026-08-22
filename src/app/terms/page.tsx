import type { Metadata } from "next";
import { MarketingFooter, MarketingHeader } from "@/components/marketing-shell";
import { publicPageMetadata } from "@/lib/seo";

export const metadata: Metadata = publicPageMetadata({
  title: "Terms",
  description:
    "Read the baseline terms for using DNest, a private relationship companion for two partners.",
  path: "/terms",
});
export default function TermsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="mx-auto max-w-3xl px-5 py-16">
        <span className="eyebrow">Using DNest thoughtfully</span>
        <h1 className="display mt-4 text-5xl sm:text-6xl">Terms of use</h1>
        <p className="muted mt-5 text-lg leading-8">
          These are baseline product terms for the DNest application. The
          production operator must have legal counsel review and complete the
          governing entity, jurisdiction, contact, age requirements, retention
          policy, and effective date before public launch.
        </p>
        <div className="mt-12 space-y-10">
          <section>
            <h2 className="display text-3xl">Your account and Nest</h2>
            <p className="muted mt-3 leading-7">
              Provide accurate account information, protect your credentials,
              and invite only the intended partner. Do not share invitation
              codes publicly or attempt to access another couple’s Nest.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Your content</h2>
            <p className="muted mt-3 leading-7">
              You remain responsible for text, images, locations, and other
              content you add. Upload only content you have the right and
              consent to store. Do not use DNest for unlawful, abusive, or
              harmful material.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Shared-content decisions</h2>
            <p className="muted mt-3 leading-7">
              Moments and plans may be meaningful to both members. Export or
              deletion requests involving shared content may require a retention
              and notification process designed to avoid one partner silently
              destroying the other’s archive.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Availability and changes</h2>
            <p className="muted mt-3 leading-7">
              The service may change as it improves and may occasionally be
              unavailable for maintenance or circumstances outside the
              operator’s control. Material policy changes should be communicated
              through the production application.
            </p>
          </section>
          <section>
            <h2 className="display text-3xl">Contact</h2>
            <p className="muted mt-3 leading-7">
              The production deployment must publish a monitored support and
              privacy contact before accepting real users.
            </p>
          </section>
        </div>
      </main>
      <MarketingFooter />
    </>
  );
}
