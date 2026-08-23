"use client";
import { BellRing } from "lucide-react";
import { showToast } from "@/components/toast-viewport";
function decode(value: string) {
  const padding = "=".repeat((4 - (value.length % 4)) % 4);
  const raw = atob((value + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}
export function PushSetup() {
  const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  async function enable() {
    try {
      if (
        !key ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        showToast(
          "error",
          "Push notifications are not configured for this deployment.",
        );
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        showToast(
          "error",
          "Push permission was not granted. In-app notifications still work.",
        );
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decode(key),
        }));
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(subscription),
      });
      showToast(
        response.ok ? "success" : "error",
        response.ok
          ? "Push notifications are enabled on this device."
          : "This device could not be registered. Please try again.",
      );
    } catch {
      showToast(
        "error",
        "Push notifications could not be enabled on this device.",
      );
    }
  }
  return (
    <div>
      <button type="button" className="btn btn-secondary" onClick={enable}>
        <BellRing className="size-4" />
        Enable push on this device
      </button>
    </div>
  );
}
