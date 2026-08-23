import Link from "next/link";
import { LogOut, Map } from "lucide-react";
import { signOut } from "@/features/auth/actions";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { LiveLocationTracker } from "@/components/live-location-tracker";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandMark } from "@/components/brand-mark";
import {
  DesktopAppNavigation,
  MobileAppNavigation,
} from "@/components/app-navigation";

export function AppShell({
  children,
  nestName,
}: {
  children: React.ReactNode;
  nestName: string;
}) {
  return (
    <div className="app-shell min-h-screen lg:grid lg:grid-cols-[17rem_1fr]">
      <ServiceWorkerRegistration />
      <LiveLocationTracker />
      <aside className="app-sidebar fixed inset-y-0 left-0 z-20 hidden w-[17rem] flex-col p-6 lg:flex">
        <Link
          href="/home"
          className="display flex items-center gap-2 text-2xl font-bold"
        >
          <BrandMark className="size-10 text-[var(--rose-deep)]" />
          DNest
        </Link>
        <p className="nest-name muted mt-3 truncate text-xs">{nestName}</p>
        <DesktopAppNavigation />
        <div className="mt-auto grid gap-1">
          <div className="flex items-center gap-3 px-3 py-2 text-sm">
            <ThemeToggle />
            <span>Appearance</span>
          </div>
          <Link
            href="/notifications"
            className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm"
          >
            <Map className="size-4" />
            Notifications
          </Link>
          <form action={signOut}>
            <button
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm"
              type="submit"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <ThemeToggle className="fixed right-4 bottom-24 z-30 lg:hidden" />
      <main className="app-content mx-auto w-full max-w-7xl px-4 pt-6 pb-28 sm:px-7 lg:col-start-2 lg:px-10 lg:py-10">
        {children}
      </main>
      <MobileAppNavigation />
    </div>
  );
}
