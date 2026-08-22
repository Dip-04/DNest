"use client";

import dynamic from "next/dynamic";

const DnestHeroScene = dynamic(() => import("./dnest-hero-scene"), {
  ssr: false,
  loading: () => (
    <div className="nest-fallback is-loading" aria-hidden>
      <span />
      <span />
      <span />
      <i />
    </div>
  ),
});

export function HeroVisual() {
  return (
    <div
      className="hero-visual"
      aria-label="A handcrafted nest holding a warm private room and floating memories"
    >
      <div className="hero-orbit" aria-hidden />
      <DnestHeroScene />
      <div className="memory-slip memory-slip-left" aria-hidden>
        <span>08 · 14</span>
        <strong>our little world</strong>
      </div>
      <div className="memory-slip memory-slip-right" aria-hidden>
        <span>17 days</span>
        <strong>until hello</strong>
      </div>
    </div>
  );
}
