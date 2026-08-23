import { describe, expect, it } from "vitest";
import {
  momentSchema,
  nestDeleteSchema,
  nestUpdateSchema,
  noteSchema,
} from "@/validations/features";
const id = "018f3f13-c112-7bc1-9bac-5fbdaf62c001";
describe("moment validation", () => {
  it("rejects oversized stories", () =>
    expect(
      momentSchema.safeParse({
        nest_id: id,
        title: "Us",
        story: "x".repeat(10001),
        moment_at: "2026-08-22T10:00",
        timezone: "UTC",
        category: "Trip",
      }).success,
    ).toBe(false));
  it("accepts a photo-free moment", () =>
    expect(
      momentSchema.safeParse({
        nest_id: id,
        title: "Coffee",
        story: "Small and lovely",
        moment_at: "2026-08-22T10:00",
        timezone: "UTC",
        category: "Everyday Memory",
      }).success,
    ).toBe(true));
});
describe("note validation", () => {
  it("requires body text", () =>
    expect(
      noteSchema.safeParse({
        nest_id: id,
        recipient_id: id,
        body: "",
        theme: "Love",
        deliver_at: "",
        timezone: "Asia/Kolkata",
      }).success,
    ).toBe(false));
});

describe("Nest management validation", () => {
  it("accepts editable Nest details", () =>
    expect(
      nestUpdateSchema.safeParse({
        nest_id: id,
        name: "Our Place",
        relationship_start: "2024-02-14",
      }).success,
    ).toBe(true));

  it("requires confirmation before deletion", () =>
    expect(
      nestDeleteSchema.safeParse({ nest_id: id, confirmation: "" }).success,
    ).toBe(false));
});
