import Link from "next/link";
import { MoreHorizontal, Pencil } from "lucide-react";
import { DeleteMomentButton } from "@/components/delete-moment-button";
import { deleteMoment } from "@/features/shared/actions";

export function MomentActions({ id }: { id: string }) {
  return (
    <details className="moment-actions">
      <summary aria-label="Moment actions"><MoreHorizontal className="size-5" /></summary>
      <div className="moment-actions-menu">
        <Link href={`/moments/${id}/edit`}><Pencil className="size-4" />Edit moment</Link>
        <form action={deleteMoment}>
          <input type="hidden" name="id" value={id} />
          <DeleteMomentButton />
        </form>
      </div>
    </details>
  );
}
