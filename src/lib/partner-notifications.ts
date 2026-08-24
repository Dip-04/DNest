import "server-only";

import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationKind =
  | "love_note"
  | "thinking_of_you"
  | "mood"
  | "question_unlocked"
  | "challenge"
  | "meetup"
  | "important_date"
  | "capsule"
  | "wishlist"
  | "moment"
  | "period_tracker";

type PartnerNotification = {
  nestId: string;
  actorId: string;
  kind: NotificationKind;
  title: string;
  body: string;
  targetPath: `/${string}`;
  createInApp?: boolean;
};

function preferenceEnabled(value: unknown, kind: NotificationKind) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return true;
  return (value as Record<string, unknown>)[kind] !== false;
}

export async function notifyPartner({
  nestId,
  actorId,
  kind,
  title,
  body,
  targetPath,
  createInApp = true,
}: PartnerNotification): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) {
      console.error("Partner notifications require SUPABASE_SERVICE_ROLE_KEY");
      return;
    }

    const { data: members, error: memberError } = await admin
      .from("nest_members")
      .select("user_id")
      .eq("nest_id", nestId)
      .eq("status", "active");
    if (memberError || !members?.some(({ user_id }) => user_id === actorId))
      return;
    const recipientId = members.find(
      ({ user_id }) => user_id !== actorId,
    )?.user_id;
    if (!recipientId) return;

    const { data: preferences } = await admin
      .from("user_preferences")
      .select("notifications")
      .eq("user_id", recipientId)
      .maybeSingle();
    if (!preferenceEnabled(preferences?.notifications, kind)) return;

    if (createInApp) {
      const { error } = await admin.from("notifications").insert({
        nest_id: nestId,
        recipient_id: recipientId,
        actor_id: actorId,
        kind,
        title,
        body,
        target_path: targetPath,
      });
      if (error) console.error("In-app partner notification failed", error);
    }

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
    const subject = process.env.VAPID_SUBJECT?.trim();
    if (!publicKey || !privateKey || !subject) return;
    webpush.setVapidDetails(subject, publicKey, privateKey);

    const { data: subscriptions, error: subscriptionError } = await admin
      .from("push_subscriptions")
      .select("id,endpoint,p256dh,auth")
      .eq("user_id", recipientId);
    if (subscriptionError || !subscriptions?.length) return;

    const payload = JSON.stringify({ title, body, url: targetPath });
    await Promise.all(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            payload,
          );
          await admin
            .from("push_subscriptions")
            .update({ last_used_at: new Date().toISOString() })
            .eq("id", subscription.id);
        } catch (error) {
          const statusCode =
            typeof error === "object" && error && "statusCode" in error
              ? Number(error.statusCode)
              : null;
          if (statusCode === 404 || statusCode === 410) {
            await admin
              .from("push_subscriptions")
              .delete()
              .eq("id", subscription.id);
          } else {
            console.error("Web Push delivery failed", error);
          }
        }
      }),
    );
  } catch (error) {
    // A notification outage must never roll back the shared action itself.
    console.error("Partner notification dispatch failed", error);
  }
}
