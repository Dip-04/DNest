"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { thinkOfPartner } from "@/features/shared/actions";

function ThinkingSubmit({
  partnerPresent,
  remainingSeconds,
}: {
  partnerPresent: boolean;
  remainingSeconds: number;
}) {
  const { pending } = useFormStatus();
  const disabled = pending || !partnerPresent || remainingSeconds > 0;
  const minutes = Math.ceil(remainingSeconds / 60);
  return (
    <button
      className="thinking-button btn btn-primary w-full"
      disabled={disabled}
      type="submit"
    >
      <Heart className="size-5 fill-current" />
      {pending
        ? "Sending..."
        : !partnerPresent
          ? "Invite your partner first"
          : remainingSeconds > 0
            ? `Send again in ${minutes} min`
            : "Thinking of You"}
    </button>
  );
}

export function ThinkingOfYouButton({
  nestId,
  partnerPresent,
  lastSentAt,
}: {
  nestId: string;
  partnerPresent: boolean;
  lastSentAt: string | null;
}) {
  const cooldownUntil = lastSentAt
    ? new Date(lastSentAt).getTime() + 15 * 60 * 1000
    : 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [cooldownUntil]);

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  return (
    <form action={thinkOfPartner} className="mt-6">
      <input type="hidden" name="nest_id" value={nestId} />
      <ThinkingSubmit
        partnerPresent={partnerPresent}
        remainingSeconds={remainingSeconds}
      />
      {remainingSeconds > 0 && (
        <p className="muted mt-2 text-center text-xs">
          A short pause keeps this gesture meaningful.
        </p>
      )}
    </form>
  );
}
