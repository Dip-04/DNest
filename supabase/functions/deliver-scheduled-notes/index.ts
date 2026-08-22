import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async request => {
  if (request.headers.get("authorization") !== `Bearer ${Deno.env.get("CRON_SECRET")}`) return new Response("Unauthorized", { status: 401 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: notes, error } = await supabase.from("love_notes").select("id,nest_id,sender_id,recipient_id").eq("status", "scheduled").lte("deliver_at", new Date().toISOString()).limit(100);
  if (error) return Response.json({ error: "Delivery query failed" }, { status: 500 });
  for (const note of notes ?? []) {
    const { error: updateError } = await supabase.from("love_notes").update({ status: "delivered", delivered_at: new Date().toISOString() }).eq("id", note.id).eq("status", "scheduled");
    if (!updateError) await supabase.from("notifications").insert({ nest_id: note.nest_id, recipient_id: note.recipient_id, actor_id: note.sender_id, kind: "love_note", title: "A Love Note is waiting", body: "Your partner left something for you.", target_path: "/notes" });
  }
  return Response.json({ delivered: notes?.length ?? 0 });
});
