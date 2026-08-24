"use client";

import { Trash2 } from "lucide-react";
import { useFormStatus } from "react-dom";

export function DeleteMomentButton() {
  const { pending } = useFormStatus();
  return (
    <button
      className="moment-delete-action"
      type="submit"
      disabled={pending}
      onClick={(event) => {
        if (!window.confirm("Delete this Moment? Its story and attached photos will be removed from your Nest.")) event.preventDefault();
      }}
    >
      <Trash2 className={`size-4 ${pending ? "animate-pulse" : ""}`} />
      {pending ? "Deleting…" : "Delete moment"}
    </button>
  );
}
