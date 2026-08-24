export type PeriodCycle = {
  id: string;
  start_date: string;
  end_date: string | null;
  cycle_length: number | null;
  period_length: number | null;
};

export type TrackerSettings = {
  default_cycle_length: number;
  default_period_length: number;
  timezone: string;
  share_with_partner?: boolean;
};

export type PeriodPrediction = {
  start: string;
  end: string;
  ovulation: string;
  fertileStart: string;
  fertileEnd: string;
};

export type FertilityEstimate = {
  level: "high" | "medium" | "low" | "unknown";
  label: "High" | "Medium" | "Low" | "Not available";
  detail: string;
};

const DAY = 86_400_000;
export const parseDay = (value: string) => new Date(`${value}T00:00:00Z`);
export const formatDay = (date: Date) => date.toISOString().slice(0, 10);
export const addDays = (value: string, days: number) =>
  formatDay(new Date(parseDay(value).getTime() + days * DAY));
export const dayDifference = (from: string, to: string) =>
  Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY);

export function periodEnd(cycle: PeriodCycle, fallbackLength = 5) {
  if (cycle.end_date) return cycle.end_date;
  const length = Math.max(5, cycle.period_length ?? fallbackLength);
  return addDays(cycle.start_date, length - 1);
}

export function fertilityEstimateForDate(
  date: string,
  predictions: PeriodPrediction[],
): FertilityEstimate {
  if (!predictions.length) {
    return {
      level: "unknown",
      label: "Not available",
      detail: "Log a period to begin estimating the fertile window.",
    };
  }

  const window = predictions.find(
    (item) => date >= item.fertileStart && date <= item.fertileEnd,
  );
  if (!window) {
    return {
      level: "low",
      label: "Low",
      detail:
        "Outside the estimated fertile window. Pregnancy is still possible because cycle timing can change.",
    };
  }

  const daysFromOvulation = dayDifference(window.ovulation, date);
  if (daysFromOvulation >= -2 && daysFromOvulation <= 0) {
    return {
      level: "high",
      label: "High",
      detail:
        "Close to estimated ovulation, when pregnancy is more likely if sperm enters the vagina.",
    };
  }

  return {
    level: "medium",
    label: "Medium",
    detail:
      "Inside the estimated fertile window. Pregnancy is possible if sperm enters the vagina.",
  };
}

export function trackerModel(cycles: PeriodCycle[], settings: TrackerSettings, today: string) {
  const sorted = [...cycles].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const intervals = sorted.slice(1).map((cycle, index) =>
    dayDifference(sorted[index].start_date, cycle.start_date),
  ).filter((value) => value >= 20 && value <= 45).slice(-6);
  const lengths = sorted.map((cycle) =>
    dayDifference(cycle.start_date, periodEnd(cycle, settings.default_period_length)) + 1,
  ).filter((value) => value >= 1 && value <= 15).slice(-6);
  const cycleLength = intervals.length
    ? Math.round(intervals.reduce((sum, value) => sum + value, 0) / intervals.length)
    : settings.default_cycle_length;
  const periodLength = lengths.length
    ? Math.round(lengths.reduce((sum, value) => sum + value, 0) / lengths.length)
    : settings.default_period_length;
  const last = sorted.at(-1);
  const predictions: PeriodPrediction[] = [];
  if (last) {
    let start = addDays(last.start_date, cycleLength);
    while (predictions.length < 8) {
      const ovulation = addDays(start, -14);
      predictions.push({
        start,
        end: addDays(start, periodLength - 1),
        ovulation,
        fertileStart: addDays(ovulation, -5),
        fertileEnd: addDays(ovulation, 1),
      });
      start = addDays(start, cycleLength);
    }
  }
  const next = predictions.find((item) => item.start >= today) ?? predictions.at(-1);
  const currentCycleDay = last && today >= last.start_date
    ? dayDifference(last.start_date, today) + 1
    : null;
  const daysUntilPeriod = next ? dayDifference(today, next.start) : null;
  const inFertileWindow = Boolean(next && today >= next.fertileStart && today <= next.fertileEnd);
  let phase = "Log a period to begin";
  if (last && currentCycleDay && currentCycleDay <= periodLength) phase = "Period";
  else if (next && today === next.ovulation) phase = "Estimated ovulation";
  else if (inFertileWindow) phase = "Estimated fertile window";
  else if (next && today < next.ovulation) phase = "Follicular phase";
  else if (last) phase = "Luteal phase";
  const fertilityToday = fertilityEstimateForDate(today, predictions);
  return { cycleLength, periodLength, predictions, next, currentCycleDay, daysUntilPeriod, inFertileWindow, fertilityToday, phase };
}
