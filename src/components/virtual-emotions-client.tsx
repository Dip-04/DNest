"use client";

import dynamic from "next/dynamic";
import { Heart, History, RotateCcw, Send, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { LocalDateTime } from "@/components/local-date-time";
import { showToast } from "@/components/toast-viewport";
import { markVirtualEmotionRead, sendVirtualEmotion } from "@/features/emotions/actions";
import { createClient } from "@/lib/supabase/client";
import type { VirtualEmotion, VirtualEmotionType } from "@/types/database";

const EmotionScene = dynamic(
  () => import("@/components/3d/emotion-scene").then((module) => module.EmotionScene),
  { ssr: false, loading: () => <div className="emotion-scene-loading">Preparing your little world…</div> },
);

export const emotionOptions: { type: VirtualEmotionType; emoji: string; label: string }[] = [
  { type: "hug", emoji: "🤗", label: "Hug" },
  { type: "kiss", emoji: "💋", label: "Kiss" },
  { type: "cuddle", emoji: "🫂", label: "Cuddle" },
  { type: "love", emoji: "❤️", label: "Love" },
  { type: "happy", emoji: "😊", label: "Happy" },
  { type: "miss_you", emoji: "😢", label: "Miss You" },
  { type: "flying_kiss", emoji: "😘", label: "Flying Kiss" },
  { type: "need_you", emoji: "🥺", label: "Need You" },
  { type: "celebrate", emoji: "🎉", label: "Celebrate" },
  { type: "hold_hands", emoji: "🤝", label: "Hold Hands" },
  { type: "comfort", emoji: "💗", label: "Comfort" },
];

const optionFor = (type: VirtualEmotionType) => emotionOptions.find((item) => item.type === type)!;

export function VirtualEmotionsClient({ nestId, userId, myName, partnerName, initialEvents, initialPlay }: {
  nestId: string;
  userId: string;
  myName: string;
  partnerName: string;
  initialEvents: VirtualEmotion[];
  initialPlay?: VirtualEmotion;
}) {
  const [events, setEvents] = useState(initialEvents);
  const [active, setActive] = useState<VirtualEmotionType>(initialPlay?.type ?? "hug");
  const [activeEvent, setActiveEvent] = useState<VirtualEmotion | undefined>(initialPlay);
  const [replayKey, setReplayKey] = useState(0);
  const [pending, startTransition] = useTransition();
  const palettes = useMemo(() => [colorFor(userId), colorFor(nestId)], [userId, nestId]);

  useEffect(() => {
    if (initialPlay?.recipient_id === userId && !initialPlay.read_at)
      void markVirtualEmotionRead(initialPlay.id);
  }, [initialPlay, userId]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel(`virtual-emotions-${nestId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "virtual_emotions", filter: `nest_id=eq.${nestId}` }, (payload) => {
        const event = payload.new as VirtualEmotion;
        setEvents((current) => current.some((item) => item.id === event.id) ? current : [event, ...current].slice(0, 60));
        if (event.recipient_id === userId) {
          setActive(event.type);
          setActiveEvent(event);
          setReplayKey((value) => value + 1);
          void markVirtualEmotionRead(event.id);
          showToast("success", `${partnerName} sent ${optionFor(event.type).label} ${optionFor(event.type).emoji}`);
        }
      }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [nestId, partnerName, userId]);

  function send(type: VirtualEmotionType) {
    startTransition(async () => {
      const result = await sendVirtualEmotion(type);
      showToast(result.ok ? "success" : "error", result.message);
      if (!result.ok || !result.event) return;
      const event = result.event as VirtualEmotion;
      setEvents((current) => current.some((item) => item.id === event.id) ? current : [event, ...current]);
      setActive(type);
      setActiveEvent(event);
      setReplayKey((value) => value + 1);
    });
  }

  const activeOption = optionFor(active);
  const received = activeEvent?.recipient_id === userId;
  return (
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
      <section className="emotion-stage surface overflow-hidden">
        <div className="emotion-stage-copy">
          <span className="eyebrow">Playing now</span>
          <h2 className="display mt-1 text-3xl">{activeOption.emoji} {activeOption.label}</h2>
          <p>{received ? `${partnerName} sent this to you` : `A little moment for ${partnerName}`}</p>
        </div>
        <div className="emotion-canvas-wrap">
          <EmotionScene emotion={active} replayKey={replayKey} leftColor={palettes[0]} rightColor={palettes[1]} />
          <div className="emotion-name emotion-name-left">{myName}</div>
          <div className="emotion-name emotion-name-right">{partnerName}</div>
          <div className="emotion-heart-particles" aria-hidden><i>♥</i><i>♥</i><i>♥</i><i>♥</i></div>
        </div>
        <div className="emotion-stage-actions">
          <button className="btn btn-secondary" type="button" onClick={() => setReplayKey((value) => value + 1)}><RotateCcw className="size-4" />Replay</button>
          {received && <><button className="btn btn-primary" type="button" disabled={pending} onClick={() => send("love")}><Heart className="size-4" />Send Back ❤️</button><button className="btn btn-secondary" type="button" disabled={pending} onClick={() => send("hug")}>Hug Back 🤗</button><button className="btn btn-secondary" type="button" disabled={pending} onClick={() => send("kiss")}>Kiss Back 💋</button></>}
        </div>
      </section>

      <aside className="grid content-start gap-6">
        <section className="surface card">
          <div className="flex items-center gap-2"><Sparkles className="size-5 text-[var(--rose)]" /><h2 className="display text-3xl">Send a feeling</h2></div>
          <p className="muted mt-2 text-sm">Choose one and your avatars will share it together.</p>
          <div className="emotion-picker mt-4">
            {emotionOptions.map((item) => <button key={item.type} type="button" disabled={pending} className={active === item.type ? "is-active" : ""} onClick={() => send(item.type)}><span>{item.emoji}</span><small>{item.label}</small></button>)}
          </div>
          <p className="muted mt-3 flex items-center gap-2 text-xs"><Send className="size-3" />Delivered in real time to {partnerName}</p>
        </section>
        <section className="surface card">
          <div className="flex items-center gap-2"><History className="size-5 text-[var(--rose)]" /><h2 className="display text-3xl">Our emotion trail</h2></div>
          <div className="emotion-history mt-4">
            {events.length ? events.slice(0, 12).map((event) => {
              const option = optionFor(event.type);
              const mine = event.sender_id === userId;
              return <button type="button" key={event.id} onClick={() => { setActive(event.type); setActiveEvent(event); setReplayKey((value) => value + 1); if (!mine && !event.read_at) void markVirtualEmotionRead(event.id); }}><span>{option.emoji}</span><span><strong>{mine ? "You" : partnerName} sent {option.label}</strong><small><LocalDateTime value={event.created_at} timeStyle="short" />{!mine && !event.read_at ? " · New" : ""}</small></span></button>;
            }) : <p className="muted text-sm">Your first virtual emotion will appear here.</p>}
          </div>
        </section>
      </aside>
    </div>
  );
}

function colorFor(value: string) {
  const colors = ["#c86f89", "#8f6ca6", "#d48d6f", "#718f86", "#a86578"];
  return colors[[...value].reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length];
}
