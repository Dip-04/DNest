import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MobileAppNavigation } from "@/components/app-navigation";

const { usePathname } = vi.hoisted(() => ({
  usePathname: vi.fn(() => "/home"),
}));

vi.mock("next/navigation", () => ({ usePathname }));

describe("mobile app navigation", () => {
  beforeEach(() => usePathname.mockReturnValue("/home"));

  it("keeps Love Notes directly reachable and exposes every other feature", () => {
    render(<MobileAppNavigation />);

    expect(screen.getByRole("link", { name: "Love Notes" })).toHaveAttribute(
      "href",
      "/notes",
    );
    fireEvent.click(screen.getByRole("button", { name: "More" }));

    expect(
      screen.getByRole("dialog", { name: "All Nest features" }),
    ).toBeVisible();
    for (const [name, href] of [
      ["Together", "/together"],
      ["Plans", "/plans"],
      ["Us", "/us"],
      ["Daily Question", "/questions"],
      ["Notifications", "/notifications"],
      ["Settings", "/settings"],
    ]) {
      expect(screen.getByRole("link", { name })).toHaveAttribute("href", href);
    }
  });
});
