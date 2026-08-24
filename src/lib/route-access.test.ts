import { describe, expect, it } from "vitest";
import {
  isGuestOnlyPage,
  isPrivatePage,
  isProtectedApi,
  safeNextPath,
} from "@/lib/route-access";

describe("route access policy", () => {
  it.each([
    "/home",
    "/moments/new",
    "/emotions",
    "/us/capsules/one",
    "/onboarding",
    "/reset-password",
  ])("protects %s", (path) => {
    expect(isPrivatePage(path)).toBe(true);
  });

  it("does not match lookalike public paths", () => {
    expect(isPrivatePage("/homepage")).toBe(false);
    expect(isPrivatePage("/features")).toBe(false);
  });

  it("recognizes guest-only and API routes", () => {
    expect(isGuestOnlyPage("/sign-in")).toBe(true);
    expect(isProtectedApi("/api/export")).toBe(true);
  });

  it("allows only same-origin relative return paths", () => {
    expect(safeNextPath("/moments?view=timeline")).toBe(
      "/moments?view=timeline",
    );
    expect(safeNextPath("//evil.example/steal")).toBe("/home");
    expect(safeNextPath("https://evil.example/steal")).toBe("/home");
  });
});
