import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth-card";
import { forgotPassword } from "@/features/auth/actions";
import { privateMetadata } from "@/lib/seo";
export const metadata: Metadata = privateMetadata("Forgot password");
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <AuthCard
      title="Find your way back"
      subtitle="We’ll send a secure reset link if the address belongs to an account."
      action={forgotPassword}
      submitLabel="Send reset link"
      message={message}
      fields={[
        { name: "email", label: "Email", type: "email", autoComplete: "email" },
      ]}
      footer={<Link href="/sign-in">Back to sign in</Link>}
    />
  );
}
