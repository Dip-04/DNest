import Link from "next/link";
import { Pencil } from "lucide-react";
import { DeleteMomentButton } from "@/components/delete-moment-button";
import { deleteMoment } from "@/features/shared/actions";

export function MomentActions({ id }: { id: string }) {
  return (
    <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
      <Link className="btn btn-secondary" href={`/moments/${id}/edit`}>
        <Pencil className="size-4" />
        Edit
      </Link>
      <form action={deleteMoment}>
        <input type="hidden" name="id" value={id} />
        <DeleteMomentButton />
      </form>
    </div>
  );
}
