import { CalendarDays, Heart, MapPin } from "lucide-react";
import { MomentActions } from "@/components/moment-actions";
import { MomentImage } from "@/components/moment-image";
import type { Moment } from "@/types/database";
import { formatDateInTimeZone } from "@/lib/date";

export function MomentCard({ moment, imageUrl }: { moment: Moment; imageUrl?: string }) {
  return (
    <article className="moment-card surface group flex h-full min-w-0 flex-col overflow-hidden">
      {imageUrl ? (
        <MomentImage src={imageUrl} alt={moment.title} />
      ) : (
        <div className="moment-placeholder" aria-label="No photo added">
          <span aria-hidden><Heart className="size-7" strokeWidth={1.4} /></span>
          <small>A memory held close</small>
        </div>
      )}
      <div className="moment-card-body">
        <div className="flex items-center justify-between gap-2">
          <span className="chip">{moment.category}</span>
          {moment.mood && <span className="muted text-xs">{moment.mood}</span>}
        </div>
        <h2 className="display mt-4 line-clamp-2 text-[1.65rem] leading-tight">{moment.title}</h2>
        <p className="muted mt-2 line-clamp-2 text-sm leading-6">{moment.story || "A moment kept between the two of you."}</p>
        <MomentMeta moment={moment} />
        <MomentActions id={moment.id} />
      </div>
    </article>
  );
}

function MomentMeta({ moment }: { moment: Moment }) {
  return (
    <div className="muted mt-4 flex min-h-5 flex-wrap gap-x-3 gap-y-1 pr-10 text-xs">
      <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDateInTimeZone(moment.moment_at, moment.timezone, { dateStyle: "medium" })}</span>
      {moment.location_name && <span className="flex items-center gap-1"><MapPin className="size-3" />{moment.location_name}</span>}
    </div>
  );
}
