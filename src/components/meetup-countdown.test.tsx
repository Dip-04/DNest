import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MeetupCountdown } from "@/components/meetup-countdown";
describe("MeetupCountdown", () => {
  it("announces a completed countdown", () => {
    vi.setSystemTime(new Date("2026-08-22T12:00:00Z"));
    render(<MeetupCountdown target="2026-08-22T10:00:00Z" />);
    expect(screen.getByText(/Today is the day/)).toBeInTheDocument();
    vi.useRealTimers();
  });
});
