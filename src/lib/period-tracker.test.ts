import { describe, expect, it } from "vitest";
import {
  fertilityEstimateForDate,
  trackerModel,
} from "@/lib/period-tracker";

describe("trackerModel", () => {
  it("averages recent cycles and crosses year boundaries", () => {
    const model = trackerModel([
      { id: "1", start_date: "2025-11-05", end_date: "2025-11-09", cycle_length: null, period_length: 5 },
      { id: "2", start_date: "2025-12-04", end_date: "2025-12-08", cycle_length: 29, period_length: 5 },
    ], { default_cycle_length: 28, default_period_length: 5, timezone: "Asia/Kolkata" }, "2025-12-20");
    expect(model.cycleLength).toBe(29);
    expect(model.next?.start).toBe("2026-01-02");
    expect(model.next?.ovulation).toBe("2025-12-19");
    expect(model.predictions).toHaveLength(8);
  });

  it("assigns conservative daily fertility levels around ovulation", () => {
    const prediction = [{
      start: "2026-02-01",
      end: "2026-02-05",
      ovulation: "2026-01-18",
      fertileStart: "2026-01-13",
      fertileEnd: "2026-01-19",
    }];

    expect(fertilityEstimateForDate("2026-01-16", prediction).level).toBe("high");
    expect(fertilityEstimateForDate("2026-01-18", prediction).level).toBe("high");
    expect(fertilityEstimateForDate("2026-01-13", prediction).level).toBe("medium");
    expect(fertilityEstimateForDate("2026-01-19", prediction).level).toBe("medium");
    expect(fertilityEstimateForDate("2026-01-22", prediction).level).toBe("low");
    expect(fertilityEstimateForDate("2026-01-22", []).level).toBe("unknown");
  });
});
