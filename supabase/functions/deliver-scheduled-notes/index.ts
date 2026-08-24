import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async request => {
  if (request.headers.get("authorization") !== `Bearer ${Deno.env.get("CRON_SECRET")}`) return new Response("Unauthorized", { status: 401 });
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: delivered, error } = await supabase.rpc("deliver_scheduled_love_notes");
  if (error) return Response.json({ error: "Delivery job failed" }, { status: 500 });
  return Response.json({ delivered: delivered ?? 0 });
});
