import { HeartHandshake } from "lucide-react";
import { AnimatedPage } from "@/components/animated-page";
import { VirtualEmotionsClient } from "@/components/virtual-emotions-client";
import { createClient } from "@/lib/supabase/server";
import { getNestContext } from "@/lib/nest";
import type { Profile, VirtualEmotion } from "@/types/database";

export default async function VirtualEmotionsPage({ searchParams }: { searchParams: Promise<{ play?: string }> }) {
  const context = await getNestContext();
  if (!context) return null;
  const params = await searchParams;
  const supabase = await createClient();
  const me = context.nest.members.find((member) => member.user_id === context.userId)?.profiles as Profile | undefined;
  const partner = context.nest.members.find((member) => member.user_id !== context.userId)?.profiles as Profile | undefined;
  const { data } = await supabase.from("virtual_emotions").select("id,nest_id,sender_id,recipient_id,type,read_at,created_at").eq("nest_id", context.nest.id).order("created_at", { ascending: false }).limit(60);
  const events = (data ?? []) as VirtualEmotion[];
  const initialPlay = params.play ? events.find((event) => event.id === params.play) : undefined;
  return <AnimatedPage>
    <header className="flex flex-wrap items-end justify-between gap-4"><div><span className="eyebrow">Feel close, even from far away</span><h1 className="display mt-2 text-5xl">Virtual Emotions</h1><p className="muted mt-2 max-w-2xl">Send a hug, kiss or tiny celebration and watch your two avatars share it together.</p></div><span className="chip"><HeartHandshake className="size-4" />Private to your Nest</span></header>
    {partner ? <VirtualEmotionsClient nestId={context.nest.id} userId={context.userId} myName={me?.display_name ?? "You"} partnerName={partner.display_name} myGender={me?.gender_identity} partnerGender={partner.gender_identity} initialEvents={events} initialPlay={initialPlay} /> : <section className="surface card mt-7"><h2 className="display text-3xl">Your second avatar is waiting</h2><p className="muted mt-2">Invite your partner to unlock shared emotions.</p></section>}
  </AnimatedPage>;
}
