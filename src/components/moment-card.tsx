import { CalendarDays, MapPin } from "lucide-react";
import { MomentActions } from "@/components/moment-actions";
import type { Moment } from "@/types/database";
import { formatDateInTimeZone } from "@/lib/date";

export function MomentCard({ moment, imageUrl }: { moment: Moment; imageUrl?: string }) {
  if (imageUrl) {
    return (
      <article className="moment-card moment-card-image surface group relative flex min-h-[25rem] overflow-hidden rounded-[1.8rem] bg-cover bg-center text-white"
        style={{ backgroundImage: `linear-gradient(to top, rgba(20,12,19,.92), rgba(20,12,19,.08) 72%), url(${JSON.stringify(imageUrl)})` }}>
        <div className="relative z-10 mt-auto w-full p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="chip border-white/30 bg-black/25 text-white">{moment.category}</span>
            {moment.mood && <span className="text-xs text-white/85">{moment.mood}</span>}
          </div>
          <h2 className="display mt-5 text-3xl text-white">{moment.title}</h2>
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-white/85">{moment.story || "A moment kept between the two of you."}</p>
          <MomentMeta moment={moment} light />
          <MomentActions id={moment.id} />
        </div>
      </article>
    );
  }
  return (
    <article className="moment-card surface group overflow-hidden rounded-[1.8rem]">
      <div className="moment-placeholder grid aspect-[4/3] place-items-center text-5xl" aria-hidden><span>♡</span></div>
      <div className="relative p-5">
        <span className="memory-tape" aria-hidden />
        <div className="flex items-center justify-between gap-2">
          <span className="chip">{moment.category}</span>
          {moment.mood && <span className="muted text-xs">{moment.mood}</span>}
        </div>
        <h2 className="display mt-5 text-3xl">{moment.title}</h2>
        <p className="muted mt-2 line-clamp-3 text-sm leading-6">{moment.story || "A moment kept between the two of you."}</p>
        <MomentMeta moment={moment} />
        <MomentActions id={moment.id} />
      </div>
    </article>
  );
}

function MomentMeta({ moment, light = false }: { moment: Moment; light?: boolean }) {
  return <div className={`mt-5 flex flex-wrap gap-3 text-xs ${light ? "text-white/80" : "muted"}`}>
    <span className="flex items-center gap-1"><CalendarDays className="size-3" />{formatDateInTimeZone(moment.moment_at, moment.timezone, { dateStyle: "medium" })}</span>
    {moment.location_name && <span className="flex items-center gap-1"><MapPin className="size-3" />{moment.location_name}</span>}
  </div>;
}
