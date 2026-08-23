"use client";

import { useState } from "react";
import { Smartphone } from "lucide-react";

type Platform = "ios" | "android";

export function NativeWidgetSetup() {
  const [token, setToken] = useState<string | null>(null);
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [message, setMessage] = useState(
    "Create a private key on each phone, then open it with the DNest native app.",
  );
  const [pending, setPending] = useState(false);

  const connect = async (nextPlatform: Platform) => {
    setPending(true);
    setMessage("Creating a private widget key…");
    try {
      const response = await fetch("/api/native-widget/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: nextPlatform }),
      });
      const body = (await response.json()) as {
        token?: string;
        error?: string;
      };
      if (!response.ok || !body.token) throw new Error(body.error);
      setToken(body.token);
      setPlatform(nextPlatform);
      setMessage(
        "Keep this key private. Creating another key for this platform revokes it.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error && error.message
          ? error.message
          : "The widget key could not be created.",
      );
    } finally {
      setPending(false);
    }
  };

  const deepLink =
    token && platform && typeof window !== "undefined"
      ? `dnest://connect?server=${encodeURIComponent(window.location.origin)}&token=${encodeURIComponent(token)}`
      : null;

  return (
    <section className="surface card lg:col-span-2">
      <Smartphone className="size-6 text-[var(--rose)]" />
      <h2 className="display mt-5 text-3xl">Lock-screen widgets</h2>
      <p className="muted mt-3 max-w-3xl text-sm leading-6">{message}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="btn btn-secondary"
          type="button"
          disabled={pending}
          onClick={() => void connect("android")}
        >
          Connect Android
        </button>
        <button
          className="btn btn-secondary"
          type="button"
          disabled={pending}
          onClick={() => void connect("ios")}
        >
          Connect iPhone
        </button>
      </div>
      {token && deepLink && (
        <div className="mt-5 rounded-2xl bg-[var(--rose-soft)] p-5">
          <p className="eyebrow">Private {platform} widget key</p>
          <code className="mt-2 block break-all text-sm font-bold">{token}</code>
          <div className="mt-4 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={deepLink}>
              Open in DNest app
            </a>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(token);
                setMessage("Widget key copied. Paste it into the native app.");
              }}
            >
              Copy key
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

