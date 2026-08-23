"use client";

import { useState } from "react";
import { MapPinned, Smartphone } from "lucide-react";

export function AndroidWidgetConnect() {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState(
    "Connect this Samsung phone securely to your private Nest.",
  );
  const [retryLink, setRetryLink] = useState<string | null>(null);

  const connect = async () => {
    setPending(true);
    setRetryLink(null);
    setMessage("Creating a private connection…");
    try {
      const response = await fetch("/api/native-widget/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform: "android" }),
      });
      const body = (await response.json()) as {
        token?: string;
        error?: string;
      };
      if (!response.ok || !body.token)
        throw new Error(body.error || "Could not create the connection.");

      const origin = window.location.origin;
      const intent =
        "intent://connect?server=" +
        encodeURIComponent(origin) +
        "&token=" +
        encodeURIComponent(body.token) +
        "#Intent;scheme=dnest;package=com.dnest.app;" +
        "S.browser_fallback_url=" +
        encodeURIComponent(origin + "/downloads/dnest-android.apk?v=1.4") +
        ";end";
      setRetryLink(intent);
      setMessage(
        "Opening DNest Android. Approve location and notifications when asked.",
      );
      window.location.assign(intent);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not connect this phone. Please try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <section className="surface card mx-auto max-w-xl">
      <MapPinned className="size-8 text-[var(--rose)]" />
      <p className="eyebrow mt-5">Between Us widget</p>
      <h1 className="display mt-2 text-4xl">Connect this Android phone</h1>
      <p className="muted mt-4 text-sm leading-6">{message}</p>
      <button
        className="btn btn-primary mt-6 w-full"
        type="button"
        disabled={pending}
        onClick={() => void connect()}
      >
        <Smartphone className="size-4" />
        {pending ? "Connecting…" : "Connect and show my map"}
      </button>
      {retryLink && (
        <a className="btn btn-secondary mt-3 w-full" href={retryLink}>
          Open DNest Android again
        </a>
      )}
      <p className="muted mt-5 text-xs leading-5">
        This creates a private device key. Never copy or share that key. The map
        appears after both partners enable location sharing.
      </p>
    </section>
  );
}
