"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

export type ToastKind = "success" | "error";
type Toast = { id: number | string; kind: ToastKind; message: string };

export const toastEventName = "dnest:toast";

export function showToast(kind: ToastKind, message: string) {
  window.dispatchEvent(
    new CustomEvent(toastEventName, { detail: { kind, message } }),
  );
}

export function ToastViewport() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [eventToast, setEventToast] = useState<Toast | null>(null);
  const [dismissedId, setDismissedId] = useState<Toast["id"] | null>(null);
  const queryToast = useMemo<Toast | null>(() => {
    const error = searchParams.get("error");
    const success = searchParams.get("success");
    const message = (error ?? success)?.trim().slice(0, 280);
    const nonce = searchParams.get("_toast") ?? message;
    return message
      ? {
          id: `${pathname}:${error ? "error" : "success"}:${nonce}`,
          kind: error ? "error" : "success",
          message,
        }
      : null;
  }, [pathname, searchParams]);
  const toast =
    eventToast ?? (queryToast?.id === dismissedId ? null : queryToast);

  const clearQueryToast = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("error");
    next.delete("success");
    next.delete("_toast");
    const query = next.toString();
    window.history.replaceState(
      null,
      "",
      `${pathname}${query ? `?${query}` : ""}${window.location.hash}`,
    );
  }, [pathname, searchParams]);

  const dismiss = useCallback(() => {
    if (eventToast) setEventToast(null);
    if (queryToast) {
      setDismissedId(queryToast.id);
      clearQueryToast();
    }
  }, [clearQueryToast, eventToast, queryToast]);

  useEffect(() => {
    const receive = (event: Event) => {
      const detail = (
        event as CustomEvent<{ kind?: ToastKind; message?: string }>
      ).detail;
      if (!detail?.message || !["success", "error"].includes(detail.kind ?? ""))
        return;
      setEventToast({
        id: Date.now(),
        kind: detail.kind!,
        message: detail.message.trim().slice(0, 280),
      });
    };
    window.addEventListener(toastEventName, receive);
    return () => window.removeEventListener(toastEventName, receive);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(dismiss, 5200);
    return () => window.clearTimeout(timeout);
  }, [dismiss, toast]);

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex justify-end sm:top-6"
      aria-live="polite"
      aria-atomic="true"
    >
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={`pointer-events-auto relative w-full max-w-md overflow-hidden rounded-2xl border p-4 pr-12 shadow-2xl backdrop-blur-xl ${toast.kind === "error" ? "border-red-300/50 bg-red-950/95 text-red-50" : "border-emerald-300/50 bg-emerald-950/95 text-emerald-50"}`}
            role={toast.kind === "error" ? "alert" : "status"}
          >
            <div className="flex items-start gap-3">
              {toast.kind === "error" ? (
                <CircleAlert className="mt-0.5 size-5 shrink-0 text-red-300" />
              ) : (
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" />
              )}
              <div>
                <p className="text-sm font-extrabold">
                  {toast.kind === "error"
                    ? "Something needs attention"
                    : "All set"}
                </p>
                <p className="mt-1 text-sm leading-5 opacity-90">
                  {toast.message}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={dismiss}
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-full hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
            <motion.span
              aria-hidden
              className={`absolute inset-x-0 bottom-0 h-1 origin-left ${toast.kind === "error" ? "bg-red-300" : "bg-emerald-300"}`}
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 5.2, ease: "linear" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
