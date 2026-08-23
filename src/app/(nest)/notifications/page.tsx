import { Bell, Check, ExternalLink } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { EmptyState } from "@/components/empty-state";
import {
  markNotificationRead,
  openNotification,
} from "@/features/shared/actions";
import { createClient } from "@/lib/supabase/server";
export default async function Page() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  return (
    <AnimatedPage>
      <header>
        <span className="eyebrow">Quiet signals from your shared place</span>
        <h1 className="display mt-2 text-5xl">Notifications</h1>
        <p className="muted mt-2">
          Useful reminders only. Every category can be turned off.
        </p>
      </header>
      {data?.length ? (
        <div className="mt-7 grid gap-3">
          {data.map((item) => (
            <article
              className={`notification-card surface card flex items-start gap-4 ${item.read_at ? "opacity-65" : ""}`}
              key={item.id}
            >
              <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--rose-soft)]">
                <Bell className="size-5 text-[var(--rose-deep)]" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold">{item.title}</h2>
                <p className="muted mt-1 text-sm">{item.body}</p>
                <p className="muted mt-2 text-xs">
                  {new Intl.DateTimeFormat("en", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(new Date(item.created_at))}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <form action={openNotification}>
                  <input type="hidden" name="id" value={item.id} />
                  <button
                    className="btn btn-primary !px-3"
                    aria-label={`Open ${item.title}`}
                    title="Open related page"
                  >
                    <ExternalLink className="size-4" />
                  </button>
                </form>
                {!item.read_at && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      className="btn btn-secondary !px-3"
                      aria-label="Mark as read"
                    >
                      <Check className="size-4" />
                    </button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7">
          <EmptyState
            icon={Bell}
            title="All quiet here"
            text="When your partner leaves something or a meaningful date is near, it will appear here."
          />
        </div>
      )}
    </AnimatedPage>
  );
}
