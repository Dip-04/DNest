"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useState } from "react";

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
  const [interactive, setInteractive] = useState(false);
  return (
    <div
      className={`hero-visual ${interactive ? "is-interactive" : ""}`}
      aria-label="A handcrafted nest holding a warm private room and floating memories"
      onPointerEnter={() => setInteractive(true)}
    >
      <div className="hero-orbit" aria-hidden />
      <div className="nest-fallback" aria-hidden>
        <Image
          src="/images/dnest-hero-fallback.webp"
          alt=""
          fill
          priority
          fetchPriority="high"
          unoptimized
          sizes="(max-width: 767px) 100vw, 54vw"
          className="object-cover"
        />
      </div>
      {interactive && <DnestHeroScene />}
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
