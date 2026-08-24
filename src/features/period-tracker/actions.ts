"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { addDays, dayDifference } from "@/lib/period-tracker";
import {
  formatCalendarDate,
  isValidTimeZone,
} from "@/lib/date";
import { canEditPeriodTracker } from "@/lib/period-access";
import { notifyPartner } from "@/lib/partner-notifications";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
type Session = NonNullable<Awaited<ReturnType<typeof requireUser>>>;

function done(message: string): never {
  revalidatePath("/period-tracker");
  redirect(`/period-tracker?success=${encodeURIComponent(message)}`);
}

async function session() {
  const value = await requireUser();
  if (!value) redirect("/sign-in");
  return value;
}

async function editableSession() {
  const value = await session();
  const { data: profile } = await value.supabase
    .from("profiles")
    .select("gender_identity")
    .eq("id", value.user.id)
    .single();
  if (!canEditPeriodTracker(profile?.gender_identity))
    redirect("/period-tracker?error=Only+women+can+edit+period+information.");
  return value;
}

function day(value: FormDataEntryValue | null) {
  const text = String(value ?? "");
  return DAY_PATTERN.test(text) &&
    !Number.isNaN(Date.parse(`${text}T00:00:00Z`))
    ? text
    : null;
}

async function notifySharedTrackerPartner(
  value: Session,
  title: string,
  body: string,
) {
  const [{ data: settings }, { data: membership }] = await Promise.all([
    value.supabase
      .from("period_tracker_settings")
      .select("share_with_partner")
      .eq("user_id", value.user.id)
      .maybeSingle(),
    value.supabase
      .from("nest_members")
      .select("nest_id")
      .eq("user_id", value.user.id)
      .eq("status", "active")
      .maybeSingle(),
  ]);
  if (!settings?.share_with_partner || !membership?.nest_id) return;

  await notifyPartner({
    nestId: membership.nest_id,
    actorId: value.user.id,
    kind: "period_tracker",
    title,
    body,
    targetPath: "/period-tracker?owner=partner",
  });
}

export async function saveTrackerSettings(form: FormData) {
  const cycle = Number(form.get("default_cycle_length"));
  const period = Number(form.get("default_period_length"));
  const timezone = String(form.get("timezone") ?? "UTC");
  if (
    cycle < 20 ||
    cycle > 45 ||
    period < 1 ||
    period > 15 ||
    !isValidTimeZone(timezone)
  )
    redirect("/period-tracker?error=Check+your+cycle+defaults+and+timezone.");
  const value = await editableSession();
  const { error } = await value.supabase
    .from("period_tracker_settings")
    .upsert({
      user_id: value.user.id,
      default_cycle_length: cycle,
      default_period_length: period,
      timezone,
      share_with_partner: form.get("share_with_partner") === "on",
    });
  if (error)
    redirect("/period-tracker?error=Tracker+settings+could+not+be+saved.");

  await notifySharedTrackerPartner(
    value,
    "Period tracker settings updated",
    `Your partner’s shared tracker now uses a ${cycle}-day average cycle and ${period}-day period estimate.`,
  );
  done("Tracker settings saved.");
}

export async function savePeriodDayMood(form: FormData) {
  const selected = day(form.get("date"));
  const mood = String(form.get("mood") ?? "").trim().slice(0, 40);
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || null;
  if (!selected || !mood)
    redirect("/period-tracker?error=Choose+a+period-day+mood.");
  const value = await editableSession();
  const { data: cycle } = await value.supabase
    .from("period_cycles")
    .select("id")
    .eq("user_id", value.user.id)
    .lte("start_date", selected)
    .gte("end_date", selected)
    .maybeSingle();
  if (!cycle)
    redirect(
      "/period-tracker?error=Mood+can+only+be+added+to+a+logged+period+day.",
    );
  const { error } = await value.supabase.from("period_day_moods").upsert({
    user_id: value.user.id,
    local_date: selected,
    mood,
    note,
  });
  if (error)
    redirect("/period-tracker?error=That+mood+could+not+be+saved.");

  await notifySharedTrackerPartner(
    value,
    "Period-day check-in",
    `Your partner felt ${mood.toLowerCase()} on ${formatCalendarDate(selected)}. Open the shared tracker for details.`,
  );
  done("Period-day mood saved.");
}

export async function startPeriod(form: FormData) {
  const start = day(form.get("start_date"));
  if (!start) redirect("/period-tracker?error=Choose+a+valid+first+day.");
  const end = addDays(start, 4);
  const value = await editableSession();
  const { data: previous } = await value.supabase
    .from("period_cycles")
    .select("start_date")
    .eq("user_id", value.user.id)
    .lt("start_date", start)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await value.supabase.from("period_cycles").insert({
    user_id: value.user.id,
    start_date: start,
    end_date: end,
    period_length: 5,
    cycle_length: previous ? dayDifference(previous.start_date, start) : null,
  });
  if (error)
    redirect("/period-tracker?error=That+period+could+not+be+logged.");

  await notifySharedTrackerPartner(
    value,
    "Period started",
    `Your partner logged ${formatCalendarDate(start)} as day 1. DNest automatically added the five-day window through ${formatCalendarDate(end)}.`,
  );
  done("Period started. The next four days were added automatically.");
}

export async function savePeriodCycle(form: FormData) {
  const start = day(form.get("start_date"));
  const end = day(form.get("end_date"));
  const id = String(form.get("id") ?? "");
  if (!id || !start || !end || end < start || dayDifference(start, end) > 14)
    redirect(
      "/period-tracker?error=Choose+a+valid+period+of+15+days+or+less.",
    );
  const value = await editableSession();
  const { data: previous } = await value.supabase
    .from("period_cycles")
    .select("start_date")
    .eq("user_id", value.user.id)
    .lt("start_date", start)
    .order("start_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: updated, error } = await value.supabase
    .from("period_cycles")
    .update({
      user_id: value.user.id,
      start_date: start,
      end_date: end,
      period_length: dayDifference(start, end) + 1,
      cycle_length: previous ? dayDifference(previous.start_date, start) : null,
    })
    .eq("id", id)
    .eq("user_id", value.user.id)
    .select("id")
    .maybeSingle();
  if (error || !updated)
    redirect("/period-tracker?error=That+cycle+could+not+be+saved.");

  await notifySharedTrackerPartner(
    value,
    "Period dates updated",
    `Your partner updated the shared period window to ${formatCalendarDate(start)} through ${formatCalendarDate(end)}. Predictions were recalculated.`,
  );
  done("Cycle updated. Predictions recalculated.");
}

export async function deletePeriodCycle(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!id || form.get("confirm") !== "delete")
    redirect("/period-tracker?error=Deletion+was+not+confirmed.");
  const value = await editableSession();
  const { data: deleted, error } = await value.supabase
    .from("period_cycles")
    .delete()
    .eq("id", id)
    .eq("user_id", value.user.id)
    .select("start_date,end_date")
    .maybeSingle();
  if (error || !deleted)
    redirect("/period-tracker?error=That+cycle+could+not+be+deleted.");

  await notifySharedTrackerPartner(
    value,
    "Period entry removed",
    `Your partner removed the period entry beginning ${formatCalendarDate(deleted.start_date)}. Cycle predictions were recalculated.`,
  );
  done("Cycle deleted. Predictions recalculated.");
}
