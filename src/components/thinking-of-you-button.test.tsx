import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThinkingOfYouButton } from "@/components/thinking-of-you-button";

vi.mock("@/features/shared/actions", () => ({
  thinkOfPartner: vi.fn(),
}));

describe("Thinking of You button", () => {
  it("is available when the cooldown has passed", () => {
    render(
      <ThinkingOfYouButton
        nestId="018f3f13-c112-7bc1-9bac-5fbdaf62c001"
        partnerPresent
        lastSentAt="2020-01-01T00:00:00Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: "Thinking of You" }),
    ).toBeEnabled();
  });

  it("shows a cooldown instead of submitting an error", () => {
    render(
      <ThinkingOfYouButton
        nestId="018f3f13-c112-7bc1-9bac-5fbdaf62c001"
        partnerPresent
        lastSentAt={new Date().toISOString()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /Send again in/ }),
    ).toBeDisabled();
    expect(screen.getByText(/short pause/)).toBeVisible();
  });
});
