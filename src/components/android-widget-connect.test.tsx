import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AndroidWidgetConnect } from "@/components/android-widget-connect";

describe("Android widget connection", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("creates a private Android key without displaying it", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "a".repeat(43) }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    render(<AndroidWidgetConnect />);

    fireEvent.click(
      screen.getByRole("button", { name: "Connect and show my map" }),
    );

    expect(
      await screen.findByRole("link", { name: "Open DNest Android again" }),
    ).toHaveAttribute("href", expect.stringContaining("intent://connect"));
    expect(screen.queryByText("a".repeat(43))).not.toBeInTheDocument();
  });
});
