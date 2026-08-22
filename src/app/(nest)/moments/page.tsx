import Link from "next/link";
import { BookHeart, Grid2X2, Plus, Rows3 } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { EmptyState } from "@/components/empty-state";
import { MomentCard } from "@/components/moment-card";
import { MomentActions } from "@/components/moment-actions";
import { createClient } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
import type { Moment } from "@/types/database";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; category?: string; q?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const params = await searchParams;
  const supabase = await createClient();
  let query = supabase
    .from("moments")
    .select("*,moment_media(storage_path,sort_order)")
    .eq("nest_id", context.nest.id)
    .order("moment_at", { ascending: false });
  if (params.category) query = query.eq("category", params.category);
  if (params.q)
    query = query.ilike("title", `%${params.q.replaceAll("%", "")}%`);
  const { data } = await query;
  const moments = (data ?? []) as unknown as (Moment & {
    moment_media: { storage_path: string; sort_order: number }[];
  })[];
  const signed = await Promise.all(
    moments.map(async (m) => {
      const path = m.moment_media.sort((a, b) => a.sort_order - b.sort_order)[0]
        ?.storage_path;
      if (!path) return undefined;
      const { data: url } = await supabase.storage
        .from("moment-media")
        .createSignedUrl(path, 900);
      return url?.signedUrl;
    }),
  );
  const years = [
    ...new Set(moments.map((m) => new Date(m.moment_at).getFullYear())),
  ];
  return (
    <AnimatedPage>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">The story of us</span>
          <h1 className="display mt-2 text-5xl">Moments</h1>
          <p className="muted mt-2">The details you’ll be glad you kept.</p>
        </div>
        <Link className="btn btn-primary" href="/moments/new">
          <Plus className="size-4" />
          Add Moment
        </Link>
      </header>
      <form className="mt-7 flex flex-wrap gap-2">
        <input
          className="field max-w-sm"
          name="q"
          defaultValue={params.q}
          placeholder="Search your story"
          aria-label="Search moments"
        />
        <select
          className="field max-w-52"
          name="category"
          defaultValue={params.category ?? ""}
          aria-label="Filter category"
        >
          <option value="">All categories</option>
          {[
            "First Date",
            "Trip",
            "Birthday",
            "Anniversary",
            "Funny Moment",
            "Everyday Memory",
            "Milestone",
            "Celebration",
            "Surprise",
            "Other",
          ].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <button className="btn btn-secondary">Filter</button>
        <div className="ml-auto flex rounded-full border border-[var(--border)] p-1">
          <Link
            href="/moments?view=grid"
            className="rounded-full p-2"
            aria-label="Memory book grid"
          >
            <Grid2X2 className="size-4" />
          </Link>
          <Link
            href="/moments?view=timeline"
            className="rounded-full p-2"
            aria-label="Relationship timeline"
          >
            <Rows3 className="size-4" />
          </Link>
        </div>
      </form>
      {moments.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={BookHeart}
            title="Your story starts here"
            text="Save the moments you’ll want to remember years from now."
            href="/moments/new"
            label="Capture your first Moment"
          />
        </div>
      ) : params.view === "timeline" ? (
        <div className="mt-10 space-y-10">
          {years.map((year) => (
            <section key={year}>
              <h2 className="display sticky top-2 z-10 w-fit rounded-full bg-[var(--surface)] px-4 py-2 text-3xl shadow">
                {year}
              </h2>
              <div className="mt-5 border-l-2 border-[var(--rose-soft)] pl-5">
                {moments.map(
                  (moment, index) =>
                    new Date(moment.moment_at).getFullYear() === year && (
                      <div className="relative mb-7" key={moment.id}>
                        <span className="absolute -left-[1.62rem] top-2 size-3 rounded-full bg-[var(--rose)]" />
                        <p className="eyebrow">
                          {new Intl.DateTimeFormat("en", {
                            month: "long",
                            day: "numeric",
                          }).format(new Date(moment.moment_at))}
                        </p>
                        <h3 className="display mt-1 text-3xl">
                          {moment.title}
                        </h3>
                        <p className="muted mt-1 max-w-2xl line-clamp-2">
                          {moment.story}
                        </p>
                        {signed[index] && (
                          <Link
                            href={signed[index]!}
                            className="mt-2 inline-block text-sm text-[var(--rose-deep)]"
                          >
                            Open photo
                          </Link>
                        )}
                        <MomentActions id={moment.id} />
                      </div>
                    ),
                )}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="mt-7 columns-1 gap-5 sm:columns-2 xl:columns-3">
          {moments.map((moment, index) => (
            <div className="mb-5 break-inside-avoid" key={moment.id}>
              <MomentCard moment={moment} imageUrl={signed[index]} />
            </div>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
