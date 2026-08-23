import { describe, expect, it } from "vitest";
import { trackerModel } from "@/lib/period-tracker";

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
});
