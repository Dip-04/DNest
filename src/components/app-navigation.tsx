"use client";

import Link from "next/link";
import {
  BookHeart,
  Heart,
  Home,
  MessageCircleHeart,
  Plane,
  Plus,
  Sparkles,
  UserRound,
} from "lucide-react";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/moments", label: "Moments", icon: BookHeart },
  { href: "/notes", label: "Love Notes", icon: MessageCircleHeart },
  { href: "/together", label: "Together", icon: Sparkles },
  { href: "/plans", label: "Plans", icon: Plane },
  { href: "/us", label: "Us", icon: UserRound },
];

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopAppNavigation() {
  const pathname = usePathname();
  return (
    <nav aria-label="Nest navigation" className="app-nav mt-9 grid gap-1">
      {nav.map(({ href, label, icon: Icon }) => (
        <Link
          href={href}
          key={href}
          aria-current={active(pathname, href) ? "page" : undefined}
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
  const mobileNav = [
    nav[0],
    nav[1],
    { href: "/moments/new", label: "Add", icon: Plus, add: true },
    nav[3],
    nav[5],
  ];
  return (
    <nav aria-label="Mobile navigation" className="mobile-app-nav lg:hidden">
      {mobileNav.map(({ href, label, icon: Icon, ...item }) => (
        <Link
          href={href}
          key={href}
          aria-current={active(pathname, href) ? "page" : undefined}
          className={`mobile-nav-link ${"add" in item ? "mobile-nav-add" : ""}`}
        >
          <span className="mobile-nav-icon">
            <Icon className="size-5" />
            {label === "Add" && (
              <Heart
                aria-hidden
                className="absolute -right-1 -top-1 size-2.5 fill-current"
              />
            )}
          </span>
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
