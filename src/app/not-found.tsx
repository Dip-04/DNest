import Link from "next/link";
import { HeartCrack } from "lucide-react";
export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="surface card max-w-md text-center">
        <HeartCrack className="mx-auto size-7 text-[var(--rose)]" />
        <h1 className="display mt-5 text-4xl">This page wandered away.</h1>
        <p className="muted mt-3">
          The link may be old, or this item may no longer belong to your Nest.
        </p>
        <Link className="btn btn-primary mt-6" href="/home">
          Back home
        </Link>
      </div>
    </main>
  );
}
