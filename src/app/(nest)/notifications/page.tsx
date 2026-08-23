import { AnimatedPage } from "@/components/animated-page";
import { NotificationsClient } from "@/components/notifications-client";
import { requireUser } from "@/lib/supabase/server";

export default async function Page() {
  const session = await requireUser();
  if (!session) return null;
  const { data } = await session.supabase
    .from("notifications")
    .select("id,recipient_id,title,body,created_at,read_at,target_path")
    .order("created_at", { ascending: false })
    .limit(100);
  return <AnimatedPage>
    <header><span className="eyebrow">Quiet signals from your shared place</span><h1 className="display mt-2 text-5xl">Notifications</h1><p className="muted mt-2">Useful reminders only. Every category can be turned off.</p></header>
    <NotificationsClient initialItems={data ?? []} userId={session.user.id} />
  </AnimatedPage>;
}
