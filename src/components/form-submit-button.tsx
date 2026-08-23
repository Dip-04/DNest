"use client";

import { useFormStatus } from "react-dom";
import { Heart } from "lucide-react";

export function FormSubmitButton({
  children,
  pendingLabel,
  className = "btn btn-primary",
  confirmMessage,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  confirmMessage?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      className={className}
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      onClick={(event) => {
        if (confirmMessage && !window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? <><Heart className="size-4 animate-pulse fill-current" />{pendingLabel}</> : children}
    </button>
  );
}
