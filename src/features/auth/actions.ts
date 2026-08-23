"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/route-access";
import { getSiteUrl } from "@/lib/seo";
import {
  signInSchema,
  signUpSchema,
  emailSchema,
  passwordSchema,
} from "@/validations/auth";

type ToastKind = "success" | "error";

function authCallbackUrl(next?: string): string {
  const callback = new URL("/auth/callback", getSiteUrl());
  if (next) callback.searchParams.set("next", next);
  return callback.toString();
}

function withToast(path: string, kind: ToastKind, message: string): string {
  const url = new URL(path, "https://dnest.invalid");
  url.searchParams.set(kind, message.slice(0, 280));
  url.searchParams.set("_toast", crypto.randomUUID());
  return `${url.pathname}${url.search}`;
}

export async function signIn(formData: FormData) {
  const parsed = signInSchema.safeParse(Object.fromEntries(formData));
  const next = safeNextPath(formData.get("next"));
  if (!parsed.success)
    redirect(
      withToast(
        `/sign-in?next=${encodeURIComponent(next)}`,
        "error",
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
      ),
    );

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message =
      error.code === "email_not_confirmed"
        ? "Confirm your email using the link we sent you, then sign in. Check your spam folder too."
        : "We couldn’t sign you in. Check your details and try again.";
    redirect(
      withToast(`/sign-in?next=${encodeURIComponent(next)}`, "error", message),
    );
  }

  redirect(
    withToast(next, "success", "Welcome back. Your private Nest is open."),
  );
}
export async function signUp(formData: FormData) {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success)
    redirect(
      withToast(
        "/sign-up",
        "error",
        parsed.error.issues[0]?.message ?? "Check the form and try again.",
      ),
    );

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.name,
        gender_identity: parsed.data.gender_identity || null,
      },
      emailRedirectTo: authCallbackUrl(),
    },
  });
  if (error)
    redirect(
      withToast(
        "/sign-up",
        "error",
        "We couldn’t create the account. Check the details and try again.",
      ),
    );

  // With email confirmation disabled, Supabase returns a session immediately.
  if (data.session)
    redirect(
      withToast(
        "/onboarding",
        "success",
        "Your account is ready. Create or join your private Nest.",
      ),
    );
  redirect(
    withToast(
      "/sign-in",
      "success",
      "Your account is ready. Sign in to continue.",
    ),
  );
}
export async function forgotPassword(formData: FormData) {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success)
    redirect(
      withToast("/forgot-password", "error", "Enter a valid email address."),
    );
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: authCallbackUrl("/reset-password"),
  });
  redirect(
    withToast(
      "/forgot-password",
      "success",
      "If that account exists, a reset link is on its way.",
    ),
  );
}
export async function resetPassword(formData: FormData) {
  const parsed = passwordSchema.safeParse(formData.get("password"));
  if (!parsed.success)
    redirect(
      withToast(
        "/reset-password",
        "error",
        parsed.error.issues[0]?.message ?? "Choose a valid password.",
      ),
    );
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error)
    redirect(
      withToast(
        "/reset-password",
        "error",
        "This reset link may have expired. Request a new one.",
      ),
    );
  redirect(
    withToast(
      "/sign-in",
      "success",
      "Your password has been updated. Sign in with the new password.",
    ),
  );
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(
    withToast("/", "success", "You’re signed out. Your Nest is safely closed."),
  );
}
