import { describe, expect, it } from "vitest";
import { canEditPeriodTracker } from "@/lib/period-access";

describe("period tracker access", () => {
  it.each(["Woman", "Female", "Girl", "Cis woman", "Trans woman"])(
    "allows %s to edit",
    (identity) => expect(canEditPeriodTracker(identity)).toBe(true),
  );

  it.each(["Man", "Non-binary", "Agender", null, undefined])(
    "keeps %s read-only",
    (identity) => expect(canEditPeriodTracker(identity)).toBe(false),
  );
});
