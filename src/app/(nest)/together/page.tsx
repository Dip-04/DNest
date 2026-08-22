/* eslint-disable react-hooks/purity -- randomness runs once per async Server Component request. */
import Link from "next/link";
import { Clock3, Heart, Shuffle, Sparkles } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { saveDateIdea, startChallenge } from "@/features/shared/actions";
import { createClient } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ duration?: string; surprise?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const params = await searchParams;
  const supabase = await createClient();
  let ideasQuery = supabase.from("date_ideas").select("*").eq("active", true);
  if (params.duration) ideasQuery = ideasQuery.eq("category", params.duration);
  const [
    { data: ideas },
    { data: saved },
    { data: challenges },
    { data: active },
  ] = await Promise.all([
    ideasQuery.order("duration_minutes"),
    supabase
      .from("saved_date_ideas")
      .select("idea_id")
      .eq("nest_id", context.nest.id),
    supabase.from("challenges").select("*"),
    supabase
      .from("nest_challenges")
      .select(
        "id,starts_on,completed_at,challenges(title,duration_days,prompts)",
      )
      .eq("nest_id", context.nest.id)
      .is("completed_at", null),
  ]);
  const displayed =
    params.surprise && ideas?.length
      ? [ideas[Math.floor(Math.random() * ideas.length)]]
      : ideas;
  return (
    <AnimatedPage>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">What should we do tonight?</span>
          <h1 className="display mt-2 text-5xl">Together</h1>
          <p className="muted mt-2">
            Low-pressure ways to share a little time, apart.
          </p>
        </div>
        <Link className="btn btn-primary" href="/together?surprise=1">
          <Shuffle className="size-4" />
          Surprise Us
        </Link>
      </header>
      <nav className="mt-7 flex flex-wrap gap-2" aria-label="Activity duration">
        {[
          ["", "All"],
          ["15-minute", "15 minutes"],
          ["30-minute", "30 minutes"],
          ["1-hour", "1+ hour"],
        ].map(([value, label]) => (
          <Link
            key={value}
            className="chip"
            href={value ? `/together?duration=${value}` : "/together"}
          >
            {label}
          </Link>
        ))}
      </nav>
      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {displayed?.map((idea) => (
          <article className="date-idea-card surface card flex flex-col" key={idea.id}>
            <div className="flex justify-between">
              <span className="chip">
                <Clock3 className="size-3" />
                {idea.duration_minutes} min
              </span>
              <span className="muted text-xs">{idea.category}</span>
            </div>
            <h2 className="display mt-6 text-3xl">{idea.title}</h2>
            <p className="muted mt-3 leading-6">{idea.description}</p>
            <ol className="muted mt-5 list-inside list-decimal text-sm">
              {idea.instructions.map((step: string) => (
                <li className="mb-1" key={step}>
                  {step}
                </li>
              ))}
            </ol>
            <form action={saveDateIdea} className="mt-auto pt-6">
              <input type="hidden" name="nest_id" value={context.nest.id} />
              <input type="hidden" name="idea_id" value={idea.id} />
              <button className="btn btn-secondary w-full">
                <Heart
                  className={`size-4 ${saved?.some((s) => s.idea_id === idea.id) ? "fill-[var(--rose)] text-[var(--rose)]" : ""}`}
                />
                Save for us
              </button>
            </form>
          </article>
        ))}
      </section>
      <section className="mt-12">
        <span className="eyebrow">Shared, never competitive</span>
        <h2 className="display mt-2 text-4xl">Couple challenges</h2>
        {active?.length ? (
          <div className="surface card mt-5">
            <Sparkles className="size-5 text-[var(--rose)]" />
            <h3 className="display mt-3 text-3xl">
              {(active[0].challenges as unknown as { title: string })?.title}
            </h3>
            <p className="muted mt-2">
              Started{" "}
              {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
                new Date(active[0].starts_on),
              )}
              . Take it gently—there is no streak to protect.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {challenges?.map((challenge) => (
              <article className="surface card" key={challenge.id}>
                <span className="chip">{challenge.duration_days} days</span>
                <h3 className="display mt-5 text-2xl">{challenge.title}</h3>
                <p className="muted mt-2 text-sm">{challenge.description}</p>
                <form action={startChallenge} className="mt-5">
                  <input type="hidden" name="nest_id" value={context.nest.id} />
                  <input
                    type="hidden"
                    name="challenge_id"
                    value={challenge.id}
                  />
                  <button className="btn btn-secondary">Start together</button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </AnimatedPage>
  );
}
