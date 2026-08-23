"use client";

import Link from "next/link";
import {
  Bell,
  BookHeart,
  CalendarHeart,
  Heart,
  Home,
  Menu,
  MessageCircleHeart,
  Plane,
  Plus,
  ScrollText,
  Settings,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const nav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/moments", label: "Moments", icon: BookHeart, exact: true },
  { href: "/moments/new", label: "Add Moment", icon: Plus, exact: true },
  { href: "/notes", label: "Love Notes", icon: MessageCircleHeart },
  { href: "/together", label: "Together", icon: Sparkles },
  { href: "/plans", label: "Plans", icon: Plane },
  { href: "/us", label: "Us", icon: UserRound },
  { href: "/period-tracker", label: "Period Tracker", icon: CalendarHeart },
  { href: "/settings", label: "Settings", icon: Settings },
];

function active(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopAppNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Nest navigation" className="app-nav mt-9 grid gap-1">
      {nav.map(({ href, label, icon: Icon, exact }) => (
        <Link
          href={href}
          key={href}
          aria-current={active(pathname, href, exact) ? "page" : undefined}
          className="app-nav-link"
        >
          <Icon className="size-[1.1rem]" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function MobileAppNavigation() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const mobileNav = [
    nav[0],
    nav[1],
    { href: "/moments/new", label: "Add", icon: Plus, add: true, exact: true },
    nav[3],
  ];
  const moreNav = [
    nav[4],
    nav[5],
    nav[6],
    { href: "/questions", label: "Daily Question", icon: ScrollText },
    { href: "/notifications", label: "Notifications", icon: Bell },
    nav[7],
    nav[8],
  ];

  useEffect(() => {
    if (!moreOpen) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMoreOpen(false);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [moreOpen]);

  const moreIsActive = moreNav.some(({ href, exact }) =>
    active(pathname, href, exact),
  );
  return (
    <>
      {moreOpen && (
        <>
          <button
            type="button"
            className="mobile-more-backdrop lg:hidden"
            aria-label="Close feature menu"
            onClick={() => setMoreOpen(false)}
          />
          <section
            id="mobile-more-features"
            className="mobile-more-sheet lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="All Nest features"
          >
            <header className="flex items-center justify-between gap-3">
              <div>
                <span className="eyebrow">Your whole Nest</span>
                <h2 className="display mt-1 text-3xl">More</h2>
              </div>
              <button
                type="button"
                className="btn btn-secondary !px-3"
                aria-label="Close feature menu"
                onClick={() => setMoreOpen(false)}
              >
                <X className="size-5" />
              </button>
            </header>
            <nav
              className="mt-5 grid grid-cols-2 gap-3"
              aria-label="More features"
            >
              {moreNav.map(({ href, label, icon: Icon, exact }) => (
                <Link
                  href={href}
                  key={href}
                  aria-current={
                    active(pathname, href, exact) ? "page" : undefined
                  }
                  className="mobile-more-link"
                  onClick={() => setMoreOpen(false)}
                >
                  <Icon className="size-5" />
                  <span>{label}</span>
                </Link>
              ))}
            </nav>
          </section>
        </>
      )}
      <nav aria-label="Mobile navigation" className="mobile-app-nav lg:hidden">
        {mobileNav.map(({ href, label, icon: Icon, exact, ...item }) => (
          <Link
            href={href}
            key={href}
            aria-current={active(pathname, href, exact) ? "page" : undefined}
            className={`mobile-nav-link ${"add" in item ? "mobile-nav-add" : ""}`}
          >
            <span className="mobile-nav-icon">
              <Icon className="size-5" />
              {label === "Add" && (
                <Heart
                  aria-hidden
                  className="absolute -top-1 -right-1 size-2.5 fill-current"
                />
              )}
            </span>
            <span>{label}</span>
          </Link>
        ))}
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="mobile-more-features"
          aria-current={moreIsActive ? "page" : undefined}
          className="mobile-nav-link"
          onClick={() => setMoreOpen((open) => !open)}
        >
          <span className="mobile-nav-icon">
            <Menu className="size-5" />
          </span>
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
