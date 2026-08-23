import { describe, expect, it } from "vitest";
import {
  countdown,
  daysTogether,
  distanceKm,
  isValidTimeZone,
  safeTimeZone,
  yearsAgoOnThisDay,
} from "@/lib/date";
describe("relationship dates", () => {
  it("counts the first day", () =>
    expect(daysTogether("2026-08-22", new Date("2026-08-22T12:00:00Z"))).toBe(
      1,
    ));
  it("does not produce negative days for future dates", () =>
    expect(daysTogether("2027-01-01", new Date("2026-08-22T00:00:00Z"))).toBe(
      0,
    ));
  it("handles a leap-day memory only on leap day", () => {
    expect(
      yearsAgoOnThisDay(
        "2024-02-29T12:00:00Z",
        new Date("2028-02-29T08:00:00Z"),
      ),
    ).toBe(4);
    expect(
      yearsAgoOnThisDay(
        "2024-02-29T12:00:00Z",
        new Date("2027-02-28T08:00:00Z"),
      ),
    ).toBeNull();
  });
});
describe("countdown", () => {
  it("breaks down time", () =>
    expect(
      countdown("2026-08-24T03:30:00Z", new Date("2026-08-22T01:00:00Z")),
    ).toMatchObject({ days: 2, hours: 2, minutes: 30, isPast: false }));
  it("clamps past dates", () =>
    expect(countdown("2020-01-01", new Date("2026-01-01"))).toMatchObject({
      totalMs: 0,
      isPast: true,
    }));
});
describe("distance", () => {
  it("uses haversine distance", () =>
    expect(
      distanceKm(
        { latitude: 19.076, longitude: 72.8777 },
        { latitude: 28.6139, longitude: 77.209 },
      ),
    ).toBeGreaterThan(1100));
  it("returns null without sensitive location", () =>
    expect(
      distanceKm(
        { latitude: null, longitude: null },
        { latitude: 1, longitude: 1 },
      ),
    ).toBeNull());
});

describe("timezones", () => {
  it("falls back safely for an invalid profile timezone", () => {
    expect(isValidTimeZone("LTC")).toBe(false);
    expect(safeTimeZone("LTC")).toBe("UTC");
    expect(safeTimeZone("Asia/Kolkata")).toBe("Asia/Kolkata");
  });
});
