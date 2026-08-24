"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/server";
import { notifyPartner } from "@/lib/partner-notifications";

const emotionSchema = z.enum([
  "hug",
  "kiss",
  "cuddle",
  "love",
  "happy",
  "miss_you",
  "flying_kiss",
  "need_you",
  "celebrate",
  "hold_hands",
  "comfort",
]);

const labels = {
  hug: ["virtual hug", "🤗"],
  kiss: ["kiss", "💋"],
  cuddle: ["cuddle", "🫂"],
  love: ["love", "❤️"],
  happy: ["happy moment", "😊"],
  miss_you: ["miss you", "😢"],
  flying_kiss: ["flying kiss", "😘"],
  need_you: ["need you", "🥺"],
  celebrate: ["celebration", "🎉"],
  hold_hands: ["hand hold", "🤝"],
  comfort: ["comfort", "💗"],
} as const;

export async function sendVirtualEmotion(typeValue: string) {
  const parsed = emotionSchema.safeParse(typeValue);
  if (!parsed.success) return { ok: false, message: "Choose a valid emotion." };
  const session = await requireUser();
  if (!session) return { ok: false, message: "Sign in to send an emotion." };

  const { data: membership } = await session.supabase
    .from("nest_members")
    .select("nest_id")
    .eq("user_id", session.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) return { ok: false, message: "Your Nest could not be found." };

  const { data: partner } = await session.supabase
    .from("nest_members")
    .select("user_id")
    .eq("nest_id", membership.nest_id)
    .eq("status", "active")
    .neq("user_id", session.user.id)
    .maybeSingle();
  if (!partner) return { ok: false, message: "Invite your partner first." };

  const { data: event, error } = await session.supabase
    .from("virtual_emotions")
    .insert({
      nest_id: membership.nest_id,
      sender_id: session.user.id,
      recipient_id: partner.user_id,
      type: parsed.data,
    })
    .select("id,nest_id,sender_id,recipient_id,type,read_at,created_at")
    .single();
  if (error || !event)
    return { ok: false, message: "That emotion could not be sent." };

  const { data: profile } = await session.supabase
    .from("profiles")
    .select("display_name")
    .eq("id", session.user.id)
    .single();
  const [label, emoji] = labels[parsed.data];
  await notifyPartner({
    nestId: membership.nest_id,
    actorId: session.user.id,
    kind: "virtual_emotion",
    title: `${profile?.display_name ?? "Your partner"} sent you a ${label} ${emoji}`,
    body: "Open DNest to feel the moment together.",
    targetPath: `/emotions?play=${event.id}`,
  });
  revalidatePath("/emotions");
  return { ok: true, message: `${label} sent ${emoji}`, event };
}

export async function markVirtualEmotionRead(id: string) {
  if (!z.uuid().safeParse(id).success) return;
  const session = await requireUser();
  if (!session) return;
  await session.supabase
    .from("virtual_emotions")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("recipient_id", session.user.id)
    .is("read_at", null);
}
