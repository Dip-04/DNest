import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NativeWidgetSetup } from "@/components/native-widget-setup";

describe("native widget setup", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("offers Android installation before the install-aware app link", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ platform: "android", token: "a".repeat(43) }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<NativeWidgetSetup />);

    fireEvent.click(screen.getByRole("button", { name: "Connect Android" }));

    expect(
      await screen.findByRole("link", { name: "1. Install Android app" }),
    ).toHaveAttribute("href", "/downloads/dnest-android.apk");
    await waitFor(() =>
      expect(
        screen.getByRole("link", { name: "2. Open installed app" }),
      ).toHaveAttribute("href", expect.stringContaining("intent://connect")),
    );
  });

  it("warns that the signed iPhone app must be installed first", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ platform: "ios", token: "b".repeat(43) }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<NativeWidgetSetup />);

    fireEvent.click(screen.getByRole("button", { name: "Connect iPhone" }));

    expect(
      await screen.findByText(/Install the signed DNest iPhone app/),
    ).toBeVisible();
  });
});
