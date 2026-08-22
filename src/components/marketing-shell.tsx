import Link from "next/link";
import { Heart } from "lucide-react";

const links = [{ href: "/features", label: "Features" }, { href: "/privacy", label: "Privacy" }, { href: "/terms", label: "Terms" }];

export function MarketingHeader() {
  return <header><nav aria-label="Main navigation" className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-6"><Link href="/" aria-label="DNest home" className="display shrink-0 text-2xl font-bold"><Heart aria-hidden className="mr-2 inline size-5 fill-[var(--rose)] text-[var(--rose)]"/>DNest</Link><div className="hidden items-center gap-5 text-sm font-bold md:flex">{links.map(link => <Link key={link.href} href={link.href} className="hover:text-[var(--rose-deep)]">{link.label}</Link>)}</div><div className="flex gap-2"><Link className="btn btn-secondary" href="/sign-in">Sign in</Link><Link className="btn btn-primary hidden sm:inline-flex" href="/sign-up">Create your Nest</Link></div></nav></header>;
}

export function MarketingFooter() {
  return <footer className="border-t border-[var(--border)]"><div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 text-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="display text-xl font-bold">DNest</p><p className="muted mt-1">Our little place, no matter the distance.</p></div><nav aria-label="Footer navigation" className="flex flex-wrap gap-5">{links.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}<Link href="/sign-in">Sign in</Link></nav><p className="muted">Private by design.</p></div></footer>;
}
