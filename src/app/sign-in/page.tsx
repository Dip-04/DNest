import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { signIn } from "@/features/auth/actions";
import { privateMetadata } from "@/lib/seo";
export const metadata: Metadata = privateMetadata("Sign in");
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; next?: string }>;
}) {
  const { message, next } = await searchParams;
  return (
    <AuthCard
      title="Welcome back to your place"
      subtitle="Open the quiet little world the two of you are building."
      action={signIn}
      submitLabel="Open our Nest"
      message={message}
      hiddenFields={{ next: next ?? "/home" }}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "current-password",
        },
      ]}
      footer={
        <>
          <Link className="text-[var(--rose-deep)]" href="/forgot-password">
            Forgot password?
          </Link>
          <span> · </span>
          <Link className="text-[var(--rose-deep)]" href="/sign-up">
            Create an account
          </Link>
        </>
      }
    />
  );
}
