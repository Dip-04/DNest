"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";
import { addDays, dayDifference } from "@/lib/period-tracker";
import { isValidTimeZone } from "@/lib/date";
import { canEditPeriodTracker } from "@/lib/period-access";

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
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
  return DAY_PATTERN.test(text) && !Number.isNaN(Date.parse(`${text}T00:00:00Z`)) ? text : null;
}

export async function saveTrackerSettings(form: FormData) {
  const cycle = Number(form.get("default_cycle_length"));
  const period = Number(form.get("default_period_length"));
  const timezone = String(form.get("timezone") ?? "UTC");
  if (cycle < 20 || cycle > 45 || period < 1 || period > 15 || !isValidTimeZone(timezone))
    redirect("/period-tracker?error=Check+your+cycle+defaults+and+timezone.");
  const { supabase, user } = await editableSession();
  const { error } = await supabase.from("period_tracker_settings").upsert({
    user_id: user.id,
    default_cycle_length: cycle,
    default_period_length: period,
    timezone,
    share_with_partner: form.get("share_with_partner") === "on",
  });
  if (error) redirect("/period-tracker?error=Tracker+settings+could+not+be+saved.");
  done("Tracker settings saved.");
}

export async function savePeriodDayMood(form: FormData) {
  const selected = day(form.get("date"));
  const mood = String(form.get("mood") ?? "").trim().slice(0, 40);
  const note = String(form.get("note") ?? "").trim().slice(0, 300) || null;
  if (!selected || !mood)
    redirect("/period-tracker?error=Choose+a+period-day+mood.");
  const { supabase, user } = await editableSession();
  const { data: cycle } = await supabase
    .from("period_cycles")
    .select("id")
    .eq("user_id", user.id)
    .lte("start_date", selected)
    .gte("end_date", selected)
    .maybeSingle();
  if (!cycle)
    redirect("/period-tracker?error=Mood+can+only+be+added+to+a+logged+period+day.");
  const { error } = await supabase.from("period_day_moods").upsert({
    user_id: user.id,
    local_date: selected,
    mood,
    note,
  });
  if (error)
    redirect("/period-tracker?error=That+mood+could+not+be+saved.");
  done("Period-day mood saved.");
}

export async function savePeriodCycle(form: FormData) {
  const start = day(form.get("start_date"));
  const end = day(form.get("end_date")) ?? start;
  const id = String(form.get("id") ?? "");
  if (!start || !end || end < start || dayDifference(start, end) > 14)
    redirect("/period-tracker?error=Choose+a+valid+period+of+15+days+or+less.");
  const { supabase, user } = await editableSession();
  const { data: previous } = await supabase.from("period_cycles").select("start_date")
    .eq("user_id", user.id).lt("start_date", start).order("start_date", { ascending: false }).limit(1).maybeSingle();
  const values = {
    user_id: user.id,
    start_date: start,
    end_date: end,
    period_length: dayDifference(start, end) + 1,
    cycle_length: previous ? dayDifference(previous.start_date, start) : null,
  };
  const result = id
    ? await supabase.from("period_cycles").update(values).eq("id", id).eq("user_id", user.id)
    : await supabase.from("period_cycles").insert(values);
  if (result.error) redirect("/period-tracker?error=That+cycle+could+not+be+saved.");
  done(id ? "Cycle updated. Predictions recalculated." : "Period logged. Predictions are ready.");
}

export async function deletePeriodCycle(form: FormData) {
  const id = String(form.get("id") ?? "");
  if (!id || form.get("confirm") !== "delete") redirect("/period-tracker?error=Deletion+was+not+confirmed.");
  const { supabase, user } = await editableSession();
  const { error } = await supabase.from("period_cycles").delete().eq("id", id).eq("user_id", user.id);
  if (error) redirect("/period-tracker?error=That+cycle+could+not+be+deleted.");
  done("Cycle deleted. Predictions recalculated.");
}

export async function togglePeriodDay(form: FormData) {
  const selected = day(form.get("date"));
  if (!selected) redirect("/period-tracker?error=Choose+a+valid+date.");
  const { supabase, user } = await editableSession();
  const { data: cycle } = await supabase.from("period_cycles").select("*")
    .eq("user_id", user.id).lte("start_date", selected).gte("end_date", selected).maybeSingle();
  if (!cycle) {
    const end = addDays(selected, 4);
    const { error } = await supabase.from("period_cycles").insert({
      user_id: user.id, start_date: selected, end_date: end, period_length: 5,
    });
    if (error) redirect("/period-tracker?error=That+day+could+not+be+logged.");
    done("Five-day period window added. You can adjust the end date anytime.");
  }
  if (cycle.start_date === selected && cycle.end_date === selected) {
    await supabase.from("period_cycles").delete().eq("id", cycle.id).eq("user_id", user.id);
  } else if (cycle.start_date === selected) {
    const start = addDays(selected, 1);
    await supabase.from("period_cycles").update({ start_date: start, period_length: dayDifference(start, cycle.end_date) + 1 })
      .eq("id", cycle.id).eq("user_id", user.id);
  } else if (cycle.end_date === selected) {
    const end = addDays(selected, -1);
    await supabase.from("period_cycles").update({ end_date: end, period_length: dayDifference(cycle.start_date, end) + 1 })
      .eq("id", cycle.id).eq("user_id", user.id);
  } else {
    const oldEnd = cycle.end_date as string;
    const firstEnd = addDays(selected, -1);
    const secondStart = addDays(selected, 1);
    await supabase.from("period_cycles").update({ end_date: firstEnd, period_length: dayDifference(cycle.start_date, firstEnd) + 1 })
      .eq("id", cycle.id).eq("user_id", user.id);
    await supabase.from("period_cycles").insert({ user_id: user.id, start_date: secondStart, end_date: oldEnd, period_length: dayDifference(secondStart, oldEnd) + 1 });
  }
  done("Period day removed. Predictions recalculated.");
}
