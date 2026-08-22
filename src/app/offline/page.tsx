import type { Metadata } from "next";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { privateMetadata } from "@/lib/seo";
export const metadata: Metadata = privateMetadata("Offline");
export default function OfflinePage() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="surface card max-w-md text-center">
        <WifiOff className="mx-auto size-8 text-[var(--rose)]" />
        <h1 className="display mt-5 text-4xl">Your Nest is still here.</h1>
        <p className="muted mt-3">
          You’re offline right now. Private memories aren’t stored in the
          offline cache; reconnect to open them safely.
        </p>
        <Link href="/" className="btn btn-primary mt-7">
          Try again
        </Link>
      </div>
    </main>
  );
}
