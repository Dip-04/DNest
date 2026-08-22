"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signInSchema, signUpSchema, emailSchema, passwordSchema } from "@/validations/auth";

function toQuery(path:string,message:string){return `${path}?message=${encodeURIComponent(message)}`}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(toQuery("/sign-in", parsed.error.issues[0]?.message ?? "Invalid form"));

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message = error.code === "email_not_confirmed"
      ? "Confirm your email using the link we sent you, then sign in. Check your spam folder too."
      : "We couldn’t sign you in. Check your details and try again.";
    redirect(toQuery("/sign-in", message));
  }

  redirect("/home");
}
export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(toQuery("/sign-up", parsed.error.issues[0]?.message ?? "Invalid form"));

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { display_name: parsed.data.name }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(toQuery("/sign-up", "We couldn’t create the account. Please try again."));

  // With email confirmation disabled, Supabase returns a session immediately.
  if (data.session) redirect("/onboarding");
  redirect(toQuery("/sign-in", "Your account is ready. Sign in to continue."));
}
export async function forgotPassword(formData:FormData){ const parsed=emailSchema.safeParse(formData.get("email")); if(!parsed.success) redirect(toQuery("/forgot-password","Enter a valid email address.")); const supabase=await createClient(); const origin=process.env.NEXT_PUBLIC_APP_URL??"http://localhost:3000"; await supabase.auth.resetPasswordForEmail(parsed.data,{redirectTo:`${origin}/auth/callback?next=/reset-password`}); redirect(toQuery("/forgot-password","If that account exists, a reset link is on its way.")); }
export async function resetPassword(formData:FormData){ const parsed=passwordSchema.safeParse(formData.get("password")); if(!parsed.success) redirect(toQuery("/reset-password",parsed.error.issues[0]?.message??"Invalid password")); const supabase=await createClient(); const {error}=await supabase.auth.updateUser({password:parsed.data}); if(error) redirect(toQuery("/reset-password","This reset link may have expired. Request a new one.")); redirect(toQuery("/sign-in","Your password has been updated.")); }
export async function signOut(){ const supabase=await createClient(); await supabase.auth.signOut(); redirect("/"); }
