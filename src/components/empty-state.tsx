import type { LucideIcon } from "lucide-react";
import Link from "next/link";
export function EmptyState({
  icon: Icon,
  title,
  text,
  href,
  label,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="empty-state rounded-[1.6rem] border border-dashed border-[var(--border)] p-8 text-center">
      <div className="empty-nest mx-auto" aria-hidden>
        <span />
        <span />
        <Icon className="relative z-10 size-6 text-[var(--rose)]" />
      </div>
      <h3 className="display mt-5 text-2xl">{title}</h3>
      <p className="muted mx-auto mt-2 max-w-md">{text}</p>
      {href && label && (
        <Link className="btn btn-secondary mt-5" href={href}>
          {label}
        </Link>
      )}
    </div>
  );
}
