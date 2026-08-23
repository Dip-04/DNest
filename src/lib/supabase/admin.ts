import "server-only";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { getPublicEnv } from "@/lib/env";

const serviceRoleSchema = z.string().min(20);

export function createAdminClient() {
  const key = serviceRoleSchema.safeParse(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
  if (!key.success) return null;
  return createClient(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, key.data, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
