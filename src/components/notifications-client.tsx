"use client";

import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { FormSubmitButton } from "@/components/form-submit-button";
import { showToast } from "@/components/toast-viewport";
import { markAllNotificationsReadInline, markNotificationReadInline, openNotification } from "@/features/shared/actions";
import { createClient } from "@/lib/supabase/client";
import { EmptyState } from "@/components/empty-state";

type NotificationItem = {
  id: string;
  recipient_id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
  target_path: string;
};

export function NotificationsClient({ initialItems, userId }: { initialItems: NotificationItem[]; userId: string }) {
  const [items, setItems] = useState(initialItems);
  const [busyId, setBusyId] = useState<string>();
  const [allBusy, setAllBusy] = useState(false);
  const unread = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`notification-list-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, (payload) => {
        const incoming = payload.new as NotificationItem;
        setItems((current) => current.some((item) => item.id === incoming.id) ? current : [incoming, ...current].slice(0, 100));
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications", filter: `recipient_id=eq.${userId}` }, (payload) => {
        const incoming = payload.new as NotificationItem;
        setItems((current) => current.map((item) => item.id === incoming.id ? incoming : item));
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [userId]);

  async function markOne(id: string) {
    if (busyId || allBusy) return;
    const previous = items;
    setBusyId(id);
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item));
    try {
      const result = await markNotificationReadInline(id);
      if (!result.ok) setItems(previous);
      showToast(result.ok ? "success" : "error", result.message);
    } catch {
      setItems(previous);
      showToast("error", "The notification could not be updated.");
    } finally {
      setBusyId(undefined);
    }
  }

  async function markAll() {
    if (!unread || allBusy || busyId) return;
    const previous = items;
    setAllBusy(true);
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })));
    try {
      const result = await markAllNotificationsReadInline();
      if (!result.ok) setItems(previous);
      showToast(result.ok ? "success" : "error", result.message);
    } catch {
      setItems(previous);
      showToast("error", "Notifications could not be marked as read.");
    } finally {
      setAllBusy(false);
    }
  }

  return <>
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <span className="chip">{unread} unread</span>
      <button className="btn btn-secondary" type="button" disabled={!unread || allBusy || Boolean(busyId)} onClick={() => void markAll()}>
        <CheckCheck className={`size-4 ${allBusy ? "animate-pulse" : ""}`} />{allBusy ? "Marking all…" : "Mark all as read"}
      </button>
    </div>
    {items.length ? <div className="mt-7 grid gap-3">
      {items.map((item) => <article className={`notification-card surface card flex items-start gap-4 ${item.read_at ? "notification-read opacity-65" : "notification-unread"}`} key={item.id}>
        <div className="relative grid size-11 shrink-0 place-items-center rounded-2xl bg-[var(--rose-soft)]"><Bell className="size-5 text-[var(--rose-deep)]" />{!item.read_at && <span className="absolute -right-1 -top-1 size-3 rounded-full border-2 border-[var(--surface)] bg-[var(--rose)]" aria-label="Unread" />}</div>
        <div className="min-w-0 flex-1"><h2 className="font-bold">{item.title}</h2><p className="muted mt-1 text-sm">{item.body}</p><p className="muted mt-2 text-xs">{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.created_at))}</p></div>
        <div className="flex shrink-0 gap-2">
          <form action={openNotification}><input type="hidden" name="id" value={item.id} /><FormSubmitButton className="btn btn-primary !px-3" pendingLabel="Opening…"><ExternalLink className="size-4" /><span className="sr-only">Open {item.title}</span></FormSubmitButton></form>
          {!item.read_at && <button className="btn btn-secondary !px-3" type="button" disabled={busyId === item.id || allBusy} onClick={() => void markOne(item.id)} aria-label="Mark as read"><Check className={`size-4 ${busyId === item.id ? "animate-pulse" : ""}`} /></button>}
        </div>
      </article>)}
    </div> : <div className="mt-7"><EmptyState icon={Bell} title="All quiet here" text="When your partner leaves something or a meaningful date is near, it will appear here." /></div>}
  </>;
}
