"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function NotificationCountBadge({ initialCount = 0 }: { initialCount?: number }) {
  const [count, setCount] = useState(initialCount);
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    let userId: string | undefined;
    const channel = supabase.channel(`notification-count-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => void refresh())
      .subscribe();
    async function refresh() {
      if (!userId) userId = (await supabase.auth.getUser()).data.user?.id;
      if (!userId) return;
      const { count: unread } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", userId).is("read_at", null);
      setCount(unread ?? 0);
    }
    void refresh();
    return () => { void supabase.removeChannel(channel); };
  }, []);
  return count > 0 ? <span className="notification-count-badge" aria-label={`${count} unread notifications`}>{count > 99 ? "99+" : count}</span> : null;
}
