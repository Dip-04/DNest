"use client";

import { Trash2 } from "lucide-react";

export function DeleteMomentButton() {
  return (
    <button
      className="btn btn-danger"
      type="submit"
      onClick={(event) => {
        if (
          !window.confirm(
            "Delete this Moment? Its story and attached photos will be removed from your Nest.",
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <Trash2 className="size-4" />
      Delete
    </button>
  );
}
