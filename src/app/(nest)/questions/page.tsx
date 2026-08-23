import { Eye, EyeOff, MessageCircleHeart } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { answerQuestion } from "@/features/shared/actions";
import { createClient } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
import type { Profile } from "@/types/database";
import { safeTimeZone } from "@/lib/date";
type AnswerRow = {
  user_id: string;
  answer: string | null;
  answered_at: string;
  unlocked: boolean;
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const supabase = await createClient();
  const me = context.nest.members.find((m) => m.user_id === context.userId)
    ?.profiles as Profile | undefined;
  const partner = context.nest.members.find((m) => m.user_id !== context.userId)
    ?.profiles as Profile | undefined;
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimeZone(me?.timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [{ data: questions }, { data: rawAnswers }] = await Promise.all([
    supabase.rpc("get_or_assign_daily_question", {
      p_nest_id: context.nest.id,
      p_date: today,
    }),
    supabase.rpc("get_daily_answers", {
      p_nest_id: context.nest.id,
      p_date: today,
    }),
  ]);
  const answers = (rawAnswers ?? []) as AnswerRow[];
  const question = questions?.[0];
  const myAnswer = answers.find((a) => a.user_id === context.userId);
  const partnerAnswer = answers.find((a) => a.user_id === partner?.id);
  const unlocked = answers.some((a) => a.unlocked);
  const q = await searchParams;
  return (
    <AnimatedPage>
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <MessageCircleHeart className="mx-auto size-8 text-[var(--rose)]" />
          <span className="eyebrow mt-4 block">
            A daily ritual of discovery
          </span>
          <h1 className="display mt-3 text-5xl">Today’s question</h1>
        </header>
        {q.message && (
          <p
            role="status"
            className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-3 text-center"
          >
            {q.message}
          </p>
        )}
        <section className="daily-question-card surface card mt-8 p-7 sm:p-10">
          <span className="chip">{question?.category ?? "relationship"}</span>
          <h2 className="display mt-7 text-4xl leading-tight">
            {question?.question ?? "A new question will be ready soon."}
          </h2>
          {question && !myAnswer && (
            <form action={answerQuestion} className="mt-8 grid gap-4">
              <input type="hidden" name="nest_id" value={context.nest.id} />
              <input type="hidden" name="question_id" value={question.id} />
              <input type="hidden" name="local_date" value={today} />
              <label className="label">
                Your answer
                <textarea
                  name="answer"
                  className="field min-h-36"
                  maxLength={2000}
                  required
                />
              </label>
              <button className="btn btn-primary">Seal my answer</button>
            </form>
          )}
        </section>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <article className="answer-card surface card">
            <p className="eyebrow">{me?.display_name ?? "You"}</p>
            {myAnswer ? (
              <>
                <Eye className="mt-5 size-5 text-[var(--sage)]" />
                <p className="mt-3">{myAnswer.answer}</p>
              </>
            ) : (
              <p className="muted mt-5">Waiting for your answer.</p>
            )}
          </article>
          <article className="answer-card surface card">
            <p className="eyebrow">{partner?.display_name ?? "Your partner"}</p>
            {unlocked && partnerAnswer ? (
              <>
                <Eye className="mt-5 size-5 text-[var(--sage)]" />
                <p className="mt-3">{partnerAnswer.answer}</p>
              </>
            ) : (
              <>
                <EyeOff className="mt-5 size-5 text-[var(--muted)]" />
                <p className="muted mt-3">
                  {partnerAnswer
                    ? "Answered and safely hidden until you both reply."
                    : `Waiting for ${partner?.display_name ?? "your partner"} ♥`}
                </p>
              </>
            )}
          </article>
        </div>
      </div>
    </AnimatedPage>
  );
}
