import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
export const dynamic = "force-dynamic";
export async function GET() {
  const session = await requireUser();
  const context = await getNestContext();
  if (!session || !context)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tables = [
    "profiles",
    "nests",
    "nest_members",
    "moments",
    "moment_media",
    "love_notes",
    "thinking_of_you_events",
    "daily_moods",
    "daily_question_assignments",
    "daily_question_answers",
    "saved_date_ideas",
    "nest_challenges",
    "challenge_completions",
    "meetups",
    "meetup_tasks",
    "wishlist_items",
    "important_dates",
    "notifications",
    "recaps",
  ] as const;
  const entries = await Promise.all(
    tables.map(async (table) => {
      let query = session.supabase.from(table).select("*");
      if (
        ![
          "profiles",
          "nests",
          "nest_members",
          "daily_question_answers",
          "notifications",
          "challenge_completions",
        ].includes(table)
      )
        query = query.eq("nest_id", context.nest.id);
      const { data, error } = await query;
      return [table, error ? [] : data] as const;
    }),
  );
  const body = JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      nest_id: context.nest.id,
      data: Object.fromEntries(entries),
    },
    null,
    2,
  );
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="dnest-export-${new Date().toISOString().slice(0, 10)}.json"`,
      "cache-control": "private, no-store",
    },
  });
}
