"use client";

import { ChevronLeft, ChevronRight, Droplets, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { deletePeriodCycle, savePeriodCycle, togglePeriodDay } from "@/features/period-tracker/actions";
import { addDays, type PeriodCycle } from "@/lib/period-tracker";

type Prediction = { start: string; end: string; ovulation: string; fertileStart: string; fertileEnd: string };
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function PeriodCalendar({ cycles, predictions, today, defaultPeriodLength }: {
  cycles: PeriodCycle[];
  predictions: Prediction[];
  today: string;
  defaultPeriodLength: number;
}) {
  const now = new Date(`${today}T00:00:00Z`);
  const [month, setMonth] = useState(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
  const [selected, setSelected] = useState<string>();
  const days = useMemo(() => {
    const first = month.getUTCDay();
    const count = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
    return [...Array(first).fill(null), ...Array.from({ length: count }, (_, index) =>
      `${month.getUTCFullYear()}-${String(month.getUTCMonth() + 1).padStart(2, "0")}-${String(index + 1).padStart(2, "0")}`)];
  }, [month]);
  const selectedCycle = selected ? cycles.find((cycle) => selected >= cycle.start_date && selected <= (cycle.end_date ?? cycle.start_date)) : undefined;
  function flags(date: string) {
    const actual = cycles.some((cycle) => date >= cycle.start_date && date <= (cycle.end_date ?? cycle.start_date));
    const predicted = !actual && predictions.some((item) => date >= item.start && date <= item.end);
    const ovulation = predictions.some((item) => item.ovulation === date);
    const fertile = !predicted && predictions.some((item) => date >= item.fertileStart && date <= item.fertileEnd);
    return { actual, predicted, ovulation, fertile };
  }
  function move(delta: number) {
    setMonth((value) => new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + delta, 1)));
  }
  return <>
    <section className="surface card mt-6 overflow-hidden !p-0">
      <header className="flex items-center justify-between gap-3 p-5">
        <button className="btn btn-secondary !px-3" type="button" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft /></button>
        <div className="text-center">
          <span className="eyebrow">Cycle calendar</span>
          <h2 className="display mt-1 text-3xl">{new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(month)}</h2>
          <button className="muted mt-1 text-xs underline" type="button" onClick={() => setMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))}>Current month</button>
        </div>
        <button className="btn btn-secondary !px-3" type="button" onClick={() => move(1)} aria-label="Next month"><ChevronRight /></button>
      </header>
      <div className="period-calendar-grid border-t border-[var(--border)] p-3 sm:p-5">
        {WEEKDAYS.map((name) => <span className="muted py-2 text-center text-[.65rem] font-bold uppercase" key={name}>{name}</span>)}
        {days.map((date, index) => date ? (() => {
          const state = flags(date);
          return <button type="button" key={date} onClick={() => setSelected(date)}
            aria-label={`${date}${state.actual ? ", logged period" : state.predicted ? ", predicted period" : state.ovulation ? ", estimated ovulation" : state.fertile ? ", estimated fertile window" : ""}`}
            className={`period-day ${date === today ? "is-today" : ""} ${date === selected ? "is-selected" : ""} ${state.actual ? "is-period" : ""} ${state.predicted ? "is-predicted" : ""} ${state.fertile ? "is-fertile" : ""}`}>
            <span>{Number(date.slice(-2))}</span>
            <span className="period-day-marks" aria-hidden>{state.actual && <Droplets />}{state.predicted && <span>◌</span>}{state.fertile && <span>♡</span>}{state.ovulation && <Sparkles />}</span>
          </button>;
        })() : <span key={`blank-${index}`} />)}
      </div>
      <div className="period-legend border-t border-[var(--border)] p-4 text-xs">
        <span><Droplets /> Logged period</span><span>◌ Predicted period</span><span>♡ Fertile window</span><span><Sparkles /> Ovulation estimate</span><span className="rounded-full border-2 border-[var(--plum)] px-2">Today</span>
      </div>
    </section>
    {selected && <>
      <button className="mobile-more-backdrop" type="button" aria-label="Close date editor" onClick={() => setSelected(undefined)} />
      <section className="period-date-sheet surface" role="dialog" aria-modal="true" aria-label={`Edit ${selected}`}>
        <header className="flex items-start justify-between gap-3"><div><span className="eyebrow">Selected date</span><h2 className="display mt-1 text-3xl">{new Intl.DateTimeFormat("en", { dateStyle: "long", timeZone: "UTC" }).format(new Date(`${selected}T00:00:00Z`))}</h2></div><button className="btn btn-secondary !px-3" type="button" onClick={() => setSelected(undefined)} aria-label="Close"><X /></button></header>
        <form action={togglePeriodDay} className="mt-5"><input type="hidden" name="date" value={selected} /><button className="btn btn-secondary w-full"><Droplets className="size-4" />{selectedCycle ? "Remove this period day" : "Add this period day"}</button></form>
        <form action={savePeriodCycle} className="mt-5 grid gap-4">
          {selectedCycle && <input type="hidden" name="id" value={selectedCycle.id} />}
          <label className="label">Period start<input className="field" type="date" name="start_date" defaultValue={selectedCycle?.start_date ?? selected} required /></label>
          <label className="label">Period end<input className="field" type="date" name="end_date" defaultValue={selectedCycle?.end_date ?? addDays(selected, defaultPeriodLength - 1)} required /></label>
          <button className="btn btn-primary">{selectedCycle ? "Update logged cycle" : "Log this period"}</button>
        </form>
        {selectedCycle && <form action={deletePeriodCycle} className="mt-3" onSubmit={(event) => { if (!window.confirm("Delete this entire logged cycle?")) event.preventDefault(); }}>
          <input type="hidden" name="id" value={selectedCycle.id} /><input type="hidden" name="confirm" value="delete" />
          <button className="btn btn-danger w-full">Delete entire cycle</button>
        </form>}
      </section>
    </>}
  </>;
}
