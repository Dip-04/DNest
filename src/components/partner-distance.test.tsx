import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PartnerDistance } from "@/components/partner-distance";

const realtime = vi.hoisted(() => {
  const channel = {
    on: vi.fn(),
    subscribe: vi.fn(),
  };
  channel.on.mockReturnValue(channel);
  channel.subscribe.mockReturnValue(channel);
  return {
    channel,
    client: {
      channel: vi.fn(() => channel),
      removeChannel: vi.fn(),
    },
  };
});

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => realtime.client,
}));

const me = {
  id: "me",
  name: "Me",
  latitude: 19.076,
  longitude: 72.8777,
  locationSharing: true,
};
const partner = {
  id: "partner",
  name: "Partner",
  localTime: "1:18 PM",
  latitude: 28.6139,
  longitude: 77.209,
  locationSharing: true,
};

describe("partner distance status", () => {
  it("asks the current user to enable location when theirs is off", () => {
    render(
      <PartnerDistance
        initialMe={{ ...me, locationSharing: false }}
        initialPartner={partner}
      />,
    );
    expect(screen.getByText("Turn on your location")).toHaveAttribute(
      "href",
      "/settings",
    );
  });

  it("asks the partner when only the current user is sharing", () => {
    render(
      <PartnerDistance
        initialMe={me}
        initialPartner={{ ...partner, locationSharing: false }}
      />,
    );
    expect(screen.getByText(/Your location is on/)).toBeVisible();
  });

  it("shows distance and the live map when both are sharing", () => {
    render(<PartnerDistance initialMe={me} initialPartner={partner} />);
    expect(screen.getByText(/km apart/)).toBeVisible();
    expect(
      screen.getByLabelText("Map showing both partner locations"),
    ).toBeVisible();
    expect(
      screen.getByTitle("OpenStreetMap showing both partner locations"),
    ).toHaveAttribute(
      "src",
      expect.stringContaining("openstreetmap.org/export/embed.html"),
    );
    expect(screen.getByText("Partner · 1:18 PM")).toBeVisible();
  });
});
