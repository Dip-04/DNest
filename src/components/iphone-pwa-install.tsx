"use client";

import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, X } from "lucide-react";

function runningStandalone() {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    iosNavigator.standalone === true
  );
}

export function IPhonePwaInstall() {
  const [open, setOpen] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(runningStandalone());
  }, []);

  if (installed) {
    return (
      <span className="btn btn-secondary" role="status">
        DNest web app installed
      </span>
    );
  }

  return (
    <>
      <button
        className="btn btn-secondary"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Download className="size-4" />
        Install DNest on iPhone
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] grid place-items-end bg-black/45 p-3 sm:place-items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="iphone-install-title"
          onClick={() => setOpen(false)}
        >
          <div
            className="surface w-full max-w-md rounded-3xl p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow">No App Store or IPA needed</p>
                <h2 id="iphone-install-title" className="display mt-2 text-3xl">
                  Install DNest from Safari
                </h2>
              </div>
              <button
                className="rounded-full p-2"
                type="button"
                aria-label="Close install instructions"
                onClick={() => setOpen(false)}
              >
                <X className="size-5" />
              </button>
            </div>

            <ol className="mt-6 grid gap-4 text-sm leading-6">
              <li className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--rose-soft)] font-bold">
                  1
                </span>
                Open this page in <strong>Safari</strong>.
              </li>
              <li className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--rose-soft)] font-bold">
                  2
                </span>
                <span>
                  Tap <Share className="mx-1 inline size-5" />{" "}
                  <strong>Share</strong> at the bottom of Safari.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-[var(--rose-soft)] font-bold">
                  3
                </span>
                <span>
                  Choose <SquarePlus className="mx-1 inline size-5" />{" "}
                  <strong>Add to Home Screen</strong>, then tap{" "}
                  <strong>Add</strong>.
                </span>
              </li>
            </ol>

            <p className="muted mt-6 text-xs leading-5">
              Apple does not let websites press Add automatically. After this
              one-time step, open DNest from its Home Screen icon.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
