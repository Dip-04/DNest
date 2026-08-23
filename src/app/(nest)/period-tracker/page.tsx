import Link from "next/link";
import { CalendarHeart, CircleGauge, Droplets, Sparkles } from "lucide-react";
import { PeriodCalendar } from "@/components/period-calendar";
import { FormSubmitButton } from "@/components/form-submit-button";
import { saveTrackerSettings } from "@/features/period-tracker/actions";
import { getNestContext } from "@/lib/nest";
import { trackerModel, type PeriodCycle, type TrackerSettings } from "@/lib/period-tracker";
import { formatCalendarDate, safeTimeZone } from "@/lib/date";
import { createClient } from "@/lib/supabase/server";
import { canEditPeriodTracker } from "@/lib/period-access";

const pretty = (value?: string) => value ? formatCalendarDate(value, { month: "short", day: "numeric" }) : "Not available";

export default async function PeriodTrackerPage({ searchParams }: {
  searchParams: Promise<{ success?: string; error?: string; owner?: string }>;
}) {
  const context = await getNestContext();
  if (!context) return null;
  const params = await searchParams;
  const supabase = await createClient();
  const me = context.nest.members.find((member) => member.user_id === context.userId)?.profiles;
  const partner = context.nest.members.find((member) => member.user_id !== context.userId)?.profiles;
  const canEditOwn = canEditPeriodTracker(me?.gender_identity);
  const partnerCanEdit = canEditPeriodTracker(partner?.gender_identity);
  const memberIds = [context.userId, partner?.id].filter((id): id is string => Boolean(id));
  const { data: visibleSettings } = await supabase.from("period_tracker_settings").select("*").in("user_id", memberIds);
  const ownStored = visibleSettings?.find((item) => item.user_id === context.userId);
  const partnerStored = visibleSettings?.find((item) => item.user_id === partner?.id && item.share_with_partner && partnerCanEdit);
  const viewingPartner = !canEditOwn
    ? Boolean(partnerStored && partner)
    : params.owner === "partner" && Boolean(partnerStored && partner);
  if (!canEditOwn && !viewingPartner) {
    return <div><header><span className="eyebrow">Sensitive cycle information</span><h1 className="display mt-2 text-5xl">Period Tracker</h1><p className="muted mt-2 max-w-2xl">Only women can add or configure period information. Your partner has not shared a tracker view with you.</p></header><section className="surface card mt-7"><h2 className="display text-3xl">Read-only partner access</h2><p className="muted mt-2">When your partner enables sharing, her cycle overview will appear here automatically. Editing and configuration controls will remain hidden.</p></section></div>;
  }
  const ownerId = viewingPartner ? partner!.id : context.userId;
  const ownerName = viewingPartner ? partner!.display_name : me?.display_name ?? "You";
  const selectedStored = viewingPartner ? partnerStored : ownStored;
  const settings: TrackerSettings = selectedStored ?? {
    default_cycle_length: 28,
    default_period_length: 5,
    timezone: safeTimeZone(viewingPartner ? partner?.timezone : me?.timezone),
    share_with_partner: false,
  };
  const [{ data: storedCycles }, { data: moods }] = await Promise.all([
    supabase.from("period_cycles").select("*").eq("user_id", ownerId).order("start_date", { ascending: false }),
    supabase.from("period_day_moods").select("local_date,mood,note").eq("user_id", ownerId),
  ]);
  const cycles = (storedCycles ?? []) as PeriodCycle[];
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: safeTimeZone(settings.timezone), year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const model = trackerModel(cycles, settings, today);
  const progress = model.currentCycleDay ? Math.min(100, Math.round((model.currentCycleDay / model.cycleLength) * 100)) : 0;
  return <div>
    <header><span className="eyebrow">Sensitive cycle information</span><h1 className="display mt-2 text-5xl">{viewingPartner ? `${ownerName}’s Period Tracker` : "Period Tracker"}</h1><p className="muted mt-2 max-w-2xl">{viewingPartner ? `${ownerName} explicitly shared this read-only view with you.` : "You control these records. Partner access remains off until you explicitly enable it below."}</p></header>
    {canEditOwn && partnerStored && <nav className="mt-5 flex flex-wrap gap-2" aria-label="Tracker owner"><Link className={`btn ${!viewingPartner ? "btn-primary" : "btn-secondary"}`} href="/period-tracker">My tracker</Link><Link className={`btn ${viewingPartner ? "btn-primary" : "btn-secondary"}`} href="/period-tracker?owner=partner">{partner?.display_name}’s shared view</Link></nav>}
    {(params.success || params.error) && <p role="status" className={`mt-5 rounded-2xl p-3 text-sm ${params.error ? "bg-red-100 text-red-800" : "bg-[var(--rose-soft)] text-[var(--rose-deep)]"}`}>{params.success ?? params.error}</p>}
    <section className="period-summary mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Summary icon={CircleGauge} label="Cycle day" value={model.currentCycleDay ? String(model.currentCycleDay) : "—"} /><Summary icon={Droplets} label="Next period" value={pretty(model.next?.start)} note={model.daysUntilPeriod != null && model.daysUntilPeriod >= 0 ? `${model.daysUntilPeriod} days away · estimated` : "Estimated"} /><Summary icon={Sparkles} label="Estimated ovulation" value={pretty(model.next?.ovulation)} /><Summary icon={CalendarHeart} label="Fertile window" value={model.next ? `${pretty(model.next.fertileStart)} – ${pretty(model.next.fertileEnd)}` : "Not available"} note="Estimated" /></section>
    <section className="surface card mt-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="eyebrow">Current rhythm</span><h2 className="display mt-1 text-3xl">{model.phase}</h2></div><span className="chip">Average {model.cycleLength}-day cycle</span></div><div className="cycle-progress mt-5"><span style={{ width: `${progress}%` }} /></div><div className="muted mt-3 grid grid-cols-4 text-center text-[.65rem] font-bold"><span>Period</span><span>Follicular</span><span>Ovulation</span><span>Luteal</span></div></section>
    <PeriodCalendar cycles={cycles} predictions={model.predictions} today={today} defaultPeriodLength={model.periodLength} readOnly={!canEditOwn || viewingPartner} moods={moods ?? []} />
    <p className="muted surface mt-5 rounded-3xl p-4 text-xs leading-5">Cycle, fertile-window and ovulation dates are estimates based on logged cycle information and should not be used as a substitute for medical advice or contraception.</p>
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="surface card"><h2 className="display text-3xl">Cycle history</h2>{cycles.length ? <div className="mt-4 grid gap-3">{cycles.map((cycle) => <div className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] p-3" key={cycle.id}><div><strong>{pretty(cycle.start_date)} – {pretty(cycle.end_date ?? cycle.start_date)}</strong><p className="muted text-xs">{cycle.period_length ?? 1}-day period{cycle.cycle_length ? ` · ${cycle.cycle_length}-day cycle` : ""}</p></div><span className="chip">Logged</span></div>)}</div> : <p className="muted mt-3">{viewingPartner ? "No shared cycles have been logged." : "Select a calendar date to log your first period."}</p>}</section>
      {canEditOwn && !viewingPartner && <form action={saveTrackerSettings} className="surface card grid gap-4"><h2 className="display text-3xl">Prediction & sharing</h2><p className="muted text-sm">History automatically replaces defaults when enough cycles are available.</p><label className="label">Usual cycle length<input className="field" type="number" name="default_cycle_length" min="20" max="45" defaultValue={settings.default_cycle_length} required /></label><label className="label">Usual period length<input className="field" type="number" name="default_period_length" min="1" max="15" defaultValue={settings.default_period_length} required /></label><label className="label">Your timezone<input className="field" name="timezone" defaultValue={safeTimeZone(settings.timezone)} required /></label><label className="flex items-start gap-3 rounded-2xl border border-[var(--border)] p-4 text-sm"><input className="mt-1 size-5 accent-[var(--rose)]" type="checkbox" name="share_with_partner" defaultChecked={Boolean(settings.share_with_partner)} /><span><strong>Share a read-only view with my partner</strong><small className="muted mt-1 block">They can see cycles and moods but cannot add, edit, or delete anything.</small></span></label><FormSubmitButton pendingLabel="Saving…">Save private settings</FormSubmitButton></form>}
    </div>
  </div>;
}

function Summary({ icon: Icon, label, value, note }: { icon: typeof CircleGauge; label: string; value: string; note?: string }) {
  return <article className="surface card"><Icon className="size-5 text-[var(--rose)]" /><p className="eyebrow mt-4">{label}</p><strong className="display mt-1 block text-3xl">{value}</strong>{note && <small className="muted mt-1 block">{note}</small>}</article>;
}
