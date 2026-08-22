import { ImageResponse } from "next/og";

export const alt = "DNest — Our little place, no matter the distance.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#f7f2eb",
        color: "#2b2426",
        padding: "74px 82px",
        fontFamily: "Georgia, serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 520,
          height: 520,
          borderRadius: 520,
          right: -120,
          top: -180,
          background: "#f1dadd",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 300,
          height: 300,
          borderRadius: 300,
          right: 110,
          bottom: -170,
          background: "#d8cfdd",
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 36,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#7d3f4b",
              color: "#fffaf5",
              fontSize: 30,
            }}
          >
            D
          </div>
          DNest
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 78,
              lineHeight: 1.02,
              maxWidth: 820,
              letterSpacing: -3,
            }}
          >
            <span>Our little place,</span>
            <span style={{ color: "#7d3f4b", fontStyle: "italic" }}>
              no matter the distance.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 18,
              marginTop: 38,
              fontFamily: "Arial, sans-serif",
              fontSize: 24,
              color: "#655b5d",
            }}
          >
            Private memories <span>·</span> Love notes <span>·</span> Your story
            together
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
