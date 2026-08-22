"use client";
import { useEffect } from "react";
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="surface card max-w-md text-center">
        <h1 className="display text-4xl">The Nest needs a moment.</h1>
        <p className="muted mt-3">
          Nothing private was exposed. Please try opening this page again.
        </p>
        <button className="btn btn-primary mt-6" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  );
}
