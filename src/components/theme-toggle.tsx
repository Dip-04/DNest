"use client";

import { MoonStar, Sparkles, SunMedium } from "lucide-react";
import { useSyncExternalStore } from "react";

type Theme = "light" | "dark";
const storageKey = "dnest-theme";
const listeners = new Set<() => void>();

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    localStorage.setItem(storageKey, theme);
  } catch {}
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", theme === "dark" ? "#121318" : "#a95f69");
  listeners.forEach((listener) => listener());
  window.dispatchEvent(new Event("dnest-theme-change"));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => null);

  function toggleTheme() {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
  }

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      aria-label={label}
      title={label}
    >
      <span className="theme-icon" key={theme ?? "loading"}>
        {theme === null ? (
          <Sparkles aria-hidden className="size-5" />
        ) : isDark ? (
          <SunMedium aria-hidden className="size-5" />
        ) : (
          <MoonStar aria-hidden className="size-5" />
        )}
      </span>
      <Sparkles
        aria-hidden
        className="absolute -right-0.5 -top-0.5 size-3 text-[var(--rose)]"
      />
    </button>
  );
}
