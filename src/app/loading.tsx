export default function Loading() {
  return (
    <main className="grid min-h-screen place-items-center">
      <div role="status" className="text-center">
        <div className="mx-auto size-10 animate-pulse rounded-full bg-[var(--rose-soft)]" />
        <p className="muted mt-4 text-sm">Opening your Nest…</p>
      </div>
    </main>
  );
}
