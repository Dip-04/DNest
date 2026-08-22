import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { MarketingActions } from "@/components/marketing-actions";

const links = [
  { href: "/features", label: "Features" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function MarketingHeader() {
  return (
    <header className="marketing-header">
      <nav
        aria-label="Main navigation"
        className="marketing-nav mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4"
      >
        <Link
          href="/"
          aria-label="DNest home"
          className="display flex shrink-0 items-center gap-2 text-2xl font-bold"
        >
          <BrandMark className="size-9 text-[var(--rose-deep)]" />
          <span className="brand-word">DNest</span>
        </Link>
        <div className="hidden items-center gap-5 text-sm font-bold md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-[var(--rose-deep)]"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <MarketingActions />
      </nav>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer border-t border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="display flex items-center gap-2 text-xl font-bold">
            <BrandMark className="size-8 text-[var(--rose-deep)]" />
            DNest
          </p>
          <p className="muted mt-1">
            Our little place, no matter the distance.
          </p>
        </div>
        <nav aria-label="Footer navigation" className="flex flex-wrap gap-5">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
          <Link href="/sign-in">Sign in</Link>
        </nav>
        <p className="muted">Private by design.</p>
      </div>
    </footer>
  );
}
