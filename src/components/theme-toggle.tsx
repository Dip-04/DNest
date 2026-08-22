"use client";

import { AnimatePresence, motion } from "framer-motion";
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
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme ?? "loading"}
          initial={{ opacity: 0, rotate: -35, scale: 0.65 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 35, scale: 0.65 }}
          transition={{ type: "spring", stiffness: 420, damping: 24 }}
        >
          {theme === null ? (
            <Sparkles aria-hidden className="size-5" />
          ) : isDark ? (
            <SunMedium aria-hidden className="size-5" />
          ) : (
            <MoonStar aria-hidden className="size-5" />
          )}
        </motion.span>
      </AnimatePresence>
      <Sparkles
        aria-hidden
        className="absolute -right-0.5 -top-0.5 size-3 text-[var(--rose)]"
      />
    </button>
  );
}
