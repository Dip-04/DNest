import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IPhonePwaInstall } from "@/components/iphone-pwa-install";

describe("iPhone PWA install", () => {
  afterEach(cleanup);

  it("shows Apple's required Safari installation steps", () => {
    render(<IPhonePwaInstall />);

    fireEvent.click(
      screen.getByRole("button", { name: "Install DNest on iPhone" }),
    );

    expect(
      screen.getByRole("heading", { name: "Install DNest from Safari" }),
    ).toBeVisible();
    expect(screen.getByText("Add to Home Screen")).toBeVisible();
  });
});
