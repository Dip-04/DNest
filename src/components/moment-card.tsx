import Image from "next/image";
import { CalendarDays, MapPin } from "lucide-react";
import type { Moment } from "@/types/database";

export function MomentCard({
  moment,
  imageUrl,
}: {
  moment: Moment;
  imageUrl?: string;
}) {
  return (
    <article className="moment-card surface group overflow-hidden rounded-[1.8rem]">
      {imageUrl ? (
        <div className="moment-photo relative aspect-[4/3]">
          <Image
            src={imageUrl}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            alt={`A memory from ${moment.title}`}
            className="object-cover transition duration-700 group-hover:scale-[1.035]"
          />
          <span className="photo-grain" aria-hidden />
        </div>
      ) : (
        <div
          className="moment-placeholder grid aspect-[4/3] place-items-center text-5xl"
          aria-hidden
        >
          <span>♡</span>
        </div>
      )}
      <div className="relative p-5">
        <span className="memory-tape" aria-hidden />
        <div className="flex items-center justify-between gap-2">
          <span className="chip">{moment.category}</span>
          {moment.mood && <span className="muted text-xs">{moment.mood}</span>}
        </div>
        <h2 className="display mt-5 text-3xl">{moment.title}</h2>
        <p className="muted mt-2 line-clamp-3 text-sm leading-6">
          {moment.story || "A moment kept between the two of you."}
        </p>
        <div className="muted mt-5 flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1">
            <CalendarDays className="size-3" />
            {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
              new Date(moment.moment_at),
            )}
          </span>
          {moment.location_name && (
            <span className="flex items-center gap-1">
              <MapPin className="size-3" />
              {moment.location_name}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
