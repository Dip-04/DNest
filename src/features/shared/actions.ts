"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { notifyPartner } from "@/lib/partner-notifications";
import { safeNextPath } from "@/lib/route-access";
import {
  acceptInviteSchema,
  answerSchema,
  capsuleSchema,
  inviteSchema,
  meetupSchema,
  momentSchema,
  moodSchema,
  nestDeleteSchema,
  nestSchema,
  nestUpdateSchema,
  noteSchema,
  uuid,
  wishlistSchema,
} from "@/validations/features";

async function auth() {
  const value = await requireUser();
  if (!value) redirect("/sign-in");
  return value;
}
function withToast(
  path: string,
  kind: "success" | "error",
  message: string,
): string {
  const url = new URL(path, "https://dnest.invalid");
  url.searchParams.set(kind, message.slice(0, 280));
  url.searchParams.set("_toast", crypto.randomUUID());
  return `${url.pathname}${url.search}`;
}
function fail(path: string, message: string): never {
  redirect(withToast(path, "error", message));
}
function succeed(path: string, message: string): never {
  redirect(withToast(path, "success", message));
}
function firstIssue(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Check the form and try again.";
}

export async function createNest(form: FormData) {
  const parsed = nestSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/onboarding", firstIssue(parsed.error));
  const { supabase } = await auth();
  const { error } = await supabase.rpc("create_nest", {
    p_name: parsed.data.name,
    p_relationship_start: parsed.data.relationship_start || null,
  });
  if (error)
    fail(
      "/onboarding",
      "We couldn’t create your Nest. Check the details and try again.",
    );
  succeed("/home", "Your private Nest is ready.");
}
export async function createInvite(form: FormData) {
  const parsed = inviteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/settings", firstIssue(parsed.error));
  const { supabase } = await auth();
  const { data, error } = await supabase.rpc("create_nest_invitation", {
    p_nest_id: parsed.data.nest_id,
    p_email: parsed.data.email || null,
  });
  if (error || !data)
    fail(
      "/settings",
      "We couldn’t create an invitation code. Please try again.",
    );
  succeed(
    `/settings?invite=${encodeURIComponent(String(data))}`,
    "A private invitation code was created.",
  );
}
export async function updateNest(form: FormData) {
  const parsed = nestUpdateSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/settings", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { data, error } = await supabase
    .from("nests")
    .update({
      name: parsed.data.name,
      relationship_start: parsed.data.relationship_start || null,
    })
    .eq("id", parsed.data.nest_id)
    .select("id")
    .maybeSingle();
  if (error || !data)
    fail("/settings", "We could not update your Nest. Please try again.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "moment",
    title: "Nest details updated",
    body: "Your partner updated your shared Nest.",
    targetPath: "/settings",
  });
  revalidatePath("/", "layout");
  succeed("/settings", "Your Nest details were updated.");
}

async function collectNestStorageFiles(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
  bucket: string,
  prefix: string,
): Promise<{ paths: string[]; error: boolean }> {
  const paths: string[] = [];
  let offset = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: pageSize,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) return { paths, error: true };
    const entries = data ?? [];
    for (const entry of entries) {
      const path = `${prefix}/${entry.name}`;
      if (entry.id) {
        paths.push(path);
      } else {
        const nested = await collectNestStorageFiles(admin, bucket, path);
        if (nested.error) return { paths, error: true };
        paths.push(...nested.paths);
      }
    }
    if (entries.length < pageSize) break;
    offset += pageSize;
  }
  return { paths, error: false };
}

export async function deleteNest(form: FormData) {
  const parsed = nestDeleteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/settings", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { data: nest, error: nestError } = await supabase
    .from("nests")
    .select("name,created_by")
    .eq("id", parsed.data.nest_id)
    .maybeSingle();
  if (nestError || !nest) fail("/settings", "That Nest could not be found.");
  if (nest.created_by !== user.id)
    fail("/settings", "Only the person who created this Nest can delete it.");
  if (parsed.data.confirmation !== nest.name)
    fail("/settings", `Type ${nest.name} exactly to confirm deletion.`);

  const admin = createAdminClient();
  if (!admin)
    fail(
      "/settings",
      "Nest deletion is not configured. Add the server-only Supabase service role key.",
    );

  const buckets = [
    "moment-media",
    "time-capsules",
    "wishlist-images",
    "relationship-assets",
  ];
  const filesByBucket: { bucket: string; paths: string[] }[] = [];
  for (const bucket of buckets) {
    const result = await collectNestStorageFiles(
      admin,
      bucket,
      parsed.data.nest_id,
    );
    if (result.error)
      fail(
        "/settings",
        "Private media could not be checked, so the Nest was not deleted.",
      );
    filesByBucket.push({ bucket, paths: result.paths });
  }
  for (const { bucket, paths } of filesByBucket) {
    for (let index = 0; index < paths.length; index += 100) {
      const { error } = await admin.storage
        .from(bucket)
        .remove(paths.slice(index, index + 100));
      if (error)
        fail(
          "/settings",
          "Private media could not be removed, so Nest deletion stopped.",
        );
    }
  }

  const { error } = await supabase.rpc("delete_owned_nest", {
    p_nest_id: parsed.data.nest_id,
  });
  if (error)
    fail("/settings", "The Nest could not be deleted. Please try again.");
  revalidatePath("/", "layout");
  succeed("/onboarding", "Your Nest and its shared data were deleted.");
}

export async function acceptInvite(form: FormData) {
  const parsed = acceptInviteSchema.safeParse(form.get("token"));
  if (!parsed.success) fail("/onboarding", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { data: nestId, error } = await supabase.rpc("accept_nest_invitation", {
    p_token: parsed.data,
  });
  if (error)
    fail(
      "/onboarding",
      "That invitation is invalid, expired, or the Nest is already full.",
    );
  await notifyPartner({
    nestId: String(nestId),
    actorId: user.id,
    kind: "moment",
    title: "Your Nest is complete",
    body: "Your partner joined your private Nest.",
    targetPath: "/home",
  });
  succeed("/home", "You joined your private Nest.");
}
export async function createMoment(form: FormData) {
  const parsed = momentSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/moments/new", firstIssue(parsed.error));
  const files = form
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > 10)
    fail("/moments/new", "Add no more than 10 photos at once.");
  const allowed = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);
  for (const file of files) {
    if (!allowed.has(file.type) || file.size > 15 * 1024 * 1024)
      fail(
        "/moments/new",
        "Photos must be JPG, PNG, WebP, or AVIF and no larger than 15 MB.",
      );
  }
  const { supabase, user } = await auth();
  const { data: moment, error } = await supabase
    .from("moments")
    .insert({
      ...parsed.data,
      moment_at: new Date(parsed.data.moment_at).toISOString(),
      created_by: user.id,
      location_name: parsed.data.location_name || null,
      mood: parsed.data.mood || null,
    })
    .select("id")
    .single();
  if (error || !moment) fail("/moments/new", "That moment couldn’t be saved.");
  for (const [index, file] of files.entries()) {
    const extension = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const path = `${parsed.data.nest_id}/${user.id}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("moment-media")
      .upload(path, file, {
        contentType: file.type,
        upsert: false,
        cacheControl: "3600",
      });
    if (uploadError) {
      await supabase.from("moments").delete().eq("id", moment.id);
      fail(
        "/moments/new",
        "A photo upload was interrupted, so the moment was not saved. Please try again.",
      );
    }
    const { error: mediaError } = await supabase.from("moment_media").insert({
      nest_id: parsed.data.nest_id,
      moment_id: moment.id,
      storage_path: path,
      mime_type: file.type,
      alt_text: `Photo for ${parsed.data.title}`,
      sort_order: index,
    });
    if (mediaError) {
      await supabase.storage.from("moment-media").remove([path]);
      await supabase.from("moments").delete().eq("id", moment.id);
      fail("/moments/new", "A photo could not be attached. Please try again.");
    }
  }
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "moment",
    title: "A new Moment",
    body: "Your partner added something to your shared memories.",
    targetPath: "/moments",
  });
  revalidatePath("/moments");
  revalidatePath("/home");
  succeed("/moments", "Your Moment was saved safely.");
}
export async function updateMoment(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  const parsed = momentSchema.safeParse(Object.fromEntries(form));
  if (!id.success || !parsed.success)
    fail("/moments", "Check the Moment and try again.");
  const { supabase, user } = await auth();
  const { data: updated, error } = await supabase
    .from("moments")
    .update({
      title: parsed.data.title,
      story: parsed.data.story,
      moment_at: new Date(parsed.data.moment_at).toISOString(),
      timezone: parsed.data.timezone,
      category: parsed.data.category,
      location_name: parsed.data.location_name || null,
      mood: parsed.data.mood || null,
    })
    .eq("id", id.data)
    .eq("nest_id", parsed.data.nest_id)
    .select("id")
    .maybeSingle();
  if (error || !updated) fail("/moments", "That Moment could not be updated.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "moment",
    title: "A Moment was updated",
    body: "Your partner updated one of your shared memories.",
    targetPath: "/moments",
  });
  revalidatePath("/moments");
  revalidatePath("/home");
  succeed("/moments", "Your Moment was updated.");
}
export async function deleteMoment(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  if (!id.success) fail("/moments", "That Moment could not be identified.");
  const { supabase, user } = await auth();
  const { data: media } = await supabase
    .from("moment_media")
    .select("storage_path")
    .eq("moment_id", id.data);
  const { data: deleted, error } = await supabase
    .from("moments")
    .delete()
    .eq("id", id.data)
    .select("id,nest_id")
    .maybeSingle();
  if (error || !deleted) fail("/moments", "That Moment could not be removed.");
  const paths = (media ?? []).map(({ storage_path }) => storage_path);
  if (paths.length > 0) {
    await supabase.storage.from("moment-media").remove(paths);
  }
  await notifyPartner({
    nestId: deleted.nest_id,
    actorId: user.id,
    kind: "moment",
    title: "A Moment was removed",
    body: "Your partner removed an item from your shared memories.",
    targetPath: "/moments",
  });
  revalidatePath("/moments");
  revalidatePath("/home");
  succeed("/moments", "The Moment was removed.");
}
export async function setMood(form: FormData) {
  const parsed = moodSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/home", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: parsed.data.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const { error } = await supabase.from("daily_moods").upsert(
    {
      nest_id: parsed.data.nest_id,
      user_id: user.id,
      local_date: localDate,
      mood: parsed.data.mood,
    },
    { onConflict: "user_id,local_date" },
  );
  if (error) fail("/home", "Your mood couldn’t be saved.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "mood",
    title: "A mood update",
    body: "Your partner shared how they are feeling today.",
    targetPath: "/home",
  });
  revalidatePath("/home");
  succeed("/home", "Today’s mood was saved.");
}
export async function thinkOfPartner(form: FormData) {
  const nestId = uuid.safeParse(form.get("nest_id"));
  if (!nestId.success) fail("/home", "That Nest could not be identified.");
  const { supabase, user } = await auth();
  const { error } = await supabase.rpc("send_thinking_of_you", {
    p_nest_id: nestId.data,
  });
  if (error)
    fail(
      "/home",
      "That signal couldn’t be sent yet. Wait a moment and try again.",
    );
  await notifyPartner({
    nestId: nestId.data,
    actorId: user.id,
    kind: "thinking_of_you",
    title: "Thinking of you",
    body: "Your partner is thinking about you.",
    targetPath: "/home",
    createInApp: false,
  });
  succeed("/home", "Sent with love.");
}
export async function createNote(form: FormData) {
  const parsed = noteSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/notes", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const scheduled = Boolean(parsed.data.deliver_at);
  const { error } = await supabase.from("love_notes").insert({
    nest_id: parsed.data.nest_id,
    sender_id: user.id,
    recipient_id: parsed.data.recipient_id,
    body: parsed.data.body,
    theme: parsed.data.theme,
    status: scheduled ? "scheduled" : "delivered",
    deliver_at: parsed.data.deliver_at
      ? new Date(parsed.data.deliver_at).toISOString()
      : new Date().toISOString(),
    delivered_at: scheduled ? null : new Date().toISOString(),
  });
  if (error) fail("/notes", "Your note couldn’t be saved. Please try again.");
  if (!scheduled) {
    await notifyPartner({
      nestId: parsed.data.nest_id,
      actorId: user.id,
      kind: "love_note",
      title: "A Love Note is waiting",
      body: "Your partner left something for you.",
      targetPath: "/notes",
    });
  }
  revalidatePath("/notes");
  succeed(
    "/notes",
    scheduled
      ? "Your Love Note is scheduled safely."
      : "Your Love Note is safely on its way.",
  );
}
export async function createMeetup(form: FormData) {
  const parsed = meetupSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/plans", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { error } = await supabase.from("meetups").insert({
    ...parsed.data,
    starts_at: new Date(parsed.data.starts_at).toISOString(),
    created_by: user.id,
  });
  if (error) fail("/plans", "The meetup couldn’t be saved.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "meetup",
    title: "A meetup was added",
    body: "Your partner added a plan for your next hello.",
    targetPath: "/plans",
  });
  revalidatePath("/plans");
  succeed("/plans", "Your next hello was added.");
}
export async function createWishlistItem(form: FormData) {
  const parsed = wishlistSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/plans", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { error } = await supabase
    .from("wishlist_items")
    .insert({ ...parsed.data, created_by: user.id });
  if (error) fail("/plans", "That dream couldn’t be saved.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "wishlist",
    title: "A new shared dream",
    body: "Your partner added something to your couple wishlist.",
    targetPath: "/plans",
  });
  revalidatePath("/plans");
  succeed("/plans", "Added to your couple wishlist.");
}
export async function createCapsule(form: FormData) {
  const parsed = capsuleSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/us", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { error } = await supabase.from("time_capsules").insert({
    nest_id: parsed.data.nest_id,
    created_by: user.id,
    title: parsed.data.title,
    encrypted_content: parsed.data.content,
    unlock_at: new Date(parsed.data.unlock_at).toISOString(),
    target_timezone: parsed.data.timezone,
    strict_lock: true,
  });
  if (error) fail("/us", "The capsule couldn’t be sealed.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "capsule",
    title: "A Time Capsule was added",
    body: "Your partner sealed something for the future.",
    targetPath: "/us",
  });
  revalidatePath("/us");
  succeed("/us", "Your Time Capsule is sealed until its unlock date.");
}
export async function answerQuestion(form: FormData) {
  const parsed = answerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) fail("/questions", firstIssue(parsed.error));
  const { supabase, user } = await auth();
  const { error } = await supabase.from("daily_question_answers").upsert(
    {
      ...parsed.data,
      user_id: user.id,
      answered_at: new Date().toISOString(),
    },
    { onConflict: "nest_id,local_date,user_id" },
  );
  if (error) fail("/questions", "Your answer couldn’t be saved.");
  await notifyPartner({
    nestId: parsed.data.nest_id,
    actorId: user.id,
    kind: "question_unlocked",
    title: "Your partner answered",
    body: "Your daily question is waiting for your answer.",
    targetPath: "/questions",
  });
  revalidatePath("/questions");
  succeed(
    "/questions",
    "Your answer is safe. It will open when both of you reply.",
  );
}
export async function markNotificationRead(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  if (!id.success)
    fail("/notifications", "That notification could not be identified.");
  const { supabase } = await auth();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id.data);
  if (error) fail("/notifications", "The notification couldn’t be updated.");
  revalidatePath("/notifications");
  succeed("/notifications", "Notification marked as read.");
}

export async function openNotification(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  if (!id.success)
    fail("/notifications", "That notification could not be identified.");
  const { supabase } = await auth();
  const { data: notification, error } = await supabase
    .from("notifications")
    .select("target_path")
    .eq("id", id.data)
    .maybeSingle();
  if (error || !notification)
    fail("/notifications", "That notification could not be opened.");
  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id.data);
  revalidatePath("/notifications");
  redirect(safeNextPath(notification.target_path, "/notifications"));
}
export async function saveDateIdea(form: FormData) {
  const nestId = uuid.safeParse(form.get("nest_id"));
  const ideaId = uuid.safeParse(form.get("idea_id"));
  if (!nestId.success || !ideaId.success)
    fail("/together", "That date idea could not be identified.");
  const { supabase, user } = await auth();
  const { error } = await supabase
    .from("saved_date_ideas")
    .upsert({ nest_id: nestId.data, idea_id: ideaId.data, saved_by: user.id });
  if (error) fail("/together", "The date idea couldn’t be saved.");
  await notifyPartner({
    nestId: nestId.data,
    actorId: user.id,
    kind: "wishlist",
    title: "A date idea was saved",
    body: "Your partner saved a new idea for the two of you.",
    targetPath: "/together",
  });
  revalidatePath("/together");
  succeed("/together", "Date idea saved for the two of you.");
}
export async function startChallenge(form: FormData) {
  const nestId = uuid.safeParse(form.get("nest_id"));
  const challengeId = uuid.safeParse(form.get("challenge_id"));
  if (!nestId.success || !challengeId.success)
    fail("/together", "That challenge could not be identified.");
  const { supabase, user } = await auth();
  const { error } = await supabase.from("nest_challenges").insert({
    nest_id: nestId.data,
    challenge_id: challengeId.data,
    started_by: user.id,
    starts_on: new Date().toISOString().slice(0, 10),
  });
  if (error) fail("/together", "The challenge couldn’t be started.");
  await notifyPartner({
    nestId: nestId.data,
    actorId: user.id,
    kind: "challenge",
    title: "A couple challenge started",
    body: "Your partner started a challenge for the two of you.",
    targetPath: "/together",
  });
  revalidatePath("/together");
  succeed("/together", "Your couple challenge has started.");
}
export async function createMeetupTask(form: FormData) {
  const nestId = uuid.safeParse(form.get("nest_id"));
  const meetupId = uuid.safeParse(form.get("meetup_id"));
  const title = String(form.get("title") ?? "")
    .trim()
    .slice(0, 160);
  if (!nestId.success || !meetupId.success || !title)
    fail("/plans", "Add a valid checklist item.");
  const { supabase, user } = await auth();
  const { error } = await supabase.from("meetup_tasks").insert({
    nest_id: nestId.data,
    meetup_id: meetupId.data,
    created_by: user.id,
    title,
    category: String(form.get("category") ?? "Custom").slice(0, 40),
  });
  if (error) fail("/plans", "The checklist item couldn’t be added.");
  await notifyPartner({
    nestId: nestId.data,
    actorId: user.id,
    kind: "meetup",
    title: "A checklist item was added",
    body: "Your partner updated your shared meetup checklist.",
    targetPath: "/plans",
  });
  revalidatePath("/plans");
  succeed("/plans", "Checklist item added.");
}
export async function toggleMeetupTask(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  if (!id.success)
    fail("/plans", "That checklist item could not be identified.");
  const completed = form.get("completed") !== "true";
  const { supabase, user } = await auth();
  const { data: task } = await supabase
    .from("meetup_tasks")
    .select("nest_id")
    .eq("id", id.data)
    .maybeSingle();
  const { error } = await supabase
    .from("meetup_tasks")
    .update({ completed })
    .eq("id", id.data);
  if (error) fail("/plans", "The checklist item couldn’t be updated.");
  if (task) {
    await notifyPartner({
      nestId: task.nest_id,
      actorId: user.id,
      kind: "meetup",
      title: "Meetup checklist updated",
      body: "Your partner updated your shared meetup checklist.",
      targetPath: "/plans",
    });
  }
  revalidatePath("/plans");
  succeed(
    "/plans",
    completed ? "Checklist item completed." : "Checklist item reopened.",
  );
}
export async function updateWishlistStatus(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  const status = String(form.get("status"));
  if (!id.success || !["dream", "planning", "done"].includes(status))
    fail("/plans", "Choose a valid wishlist status.");
  const { supabase, user } = await auth();
  const { data: item } = await supabase
    .from("wishlist_items")
    .select("nest_id")
    .eq("id", id.data)
    .maybeSingle();
  const { error } = await supabase
    .from("wishlist_items")
    .update({ status })
    .eq("id", id.data);
  if (error) fail("/plans", "The wishlist item couldn’t be updated.");
  if (item) {
    await notifyPartner({
      nestId: item.nest_id,
      actorId: user.id,
      kind: "wishlist",
      title: "Wishlist updated",
      body: "Your partner updated one of your shared dreams.",
      targetPath: "/plans",
    });
  }
  revalidatePath("/plans");
  succeed("/plans", "Wishlist status updated.");
}
export async function convertWishlist(form: FormData) {
  const id = uuid.safeParse(form.get("id"));
  if (!id.success)
    fail("/plans", "That wishlist item could not be identified.");
  const { supabase, user } = await auth();
  const { data: item } = await supabase
    .from("wishlist_items")
    .select("nest_id")
    .eq("id", id.data)
    .maybeSingle();
  const { error } = await supabase.rpc("convert_wishlist_to_moment", {
    p_item_id: id.data,
    p_moment_at: new Date().toISOString(),
  });
  if (error) fail("/plans", "That dream couldn’t be turned into a Moment.");
  if (item) {
    await notifyPartner({
      nestId: item.nest_id,
      actorId: user.id,
      kind: "moment",
      title: "A shared dream became a Moment",
      body: "Your partner added a completed dream to your memories.",
      targetPath: "/moments",
    });
  }
  revalidatePath("/plans");
  revalidatePath("/moments");
  succeed("/moments", "Your completed dream is now a Moment.");
}
export async function savePreferences(form: FormData) {
  const { supabase, user } = await auth();
  const kinds = [
    "love_note",
    "thinking_of_you",
    "mood",
    "question_unlocked",
    "challenge",
    "meetup",
    "important_date",
    "capsule",
    "wishlist",
    "moment",
  ];
  const notifications = Object.fromEntries(
    kinds.map((kind) => [kind, form.get(kind) === "on"]),
  );
  const { error } = await supabase
    .from("user_preferences")
    .update({ notifications })
    .eq("user_id", user.id);
  if (error) fail("/settings", "Notification preferences couldn’t be saved.");
  succeed("/settings", "Notification preferences saved.");
}
export async function createImportantDate(form: FormData) {
  const nestId = uuid.safeParse(form.get("nest_id"));
  const title = String(form.get("title") ?? "")
    .trim()
    .slice(0, 160);
  const eventDate = String(form.get("event_date") ?? "");
  if (!nestId.success || !title || !/\d{4}-\d{2}-\d{2}/.test(eventDate))
    fail("/us", "Add a title and valid date.");
  const { supabase, user } = await auth();
  const { error } = await supabase.from("important_dates").insert({
    nest_id: nestId.data,
    created_by: user.id,
    title,
    event_date: eventDate,
    timezone: String(form.get("timezone") ?? "UTC"),
    category: String(form.get("category") ?? "Custom").slice(0, 50),
    recurring_yearly: form.get("recurring_yearly") === "on",
  });
  if (error) fail("/us", "That important date couldn’t be saved.");
  await notifyPartner({
    nestId: nestId.data,
    actorId: user.id,
    kind: "important_date",
    title: "An important date was added",
    body: "Your partner added a date to remember together.",
    targetPath: "/us",
  });
  revalidatePath("/us");
  succeed("/us", "Important date saved.");
}

export async function saveCurrentLocation(form: FormData): Promise<{
  ok: boolean;
  message: string;
}> {
  const latitude = Number(form.get("latitude"));
  const longitude = Number(form.get("longitude"));
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  ) {
    return { ok: false, message: "Your device returned an invalid location." };
  }

  const { supabase, user } = await auth();
  const { error } = await supabase
    .from("profiles")
    .update({
      latitude,
      longitude,
      location_sharing: true,
      location_updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) {
    return { ok: false, message: "Your location could not be saved." };
  }

  const { data: membership } = await supabase
    .from("nest_members")
    .select("nest_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membership && form.get("silent") !== "true") {
    await notifyPartner({
      nestId: membership.nest_id,
      actorId: user.id,
      kind: "moment",
      title: "Distance is ready to update",
      body: "Your partner updated their private location.",
      targetPath: "/home",
    });
  }
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: "Location saved. Distance will show when both partners save it.",
  };
}

export async function stopCurrentLocation(): Promise<{
  ok: boolean;
  message: string;
}> {
  const { supabase, user } = await auth();
  const { error } = await supabase
    .from("profiles")
    .update({ location_sharing: false })
    .eq("id", user.id);
  if (error)
    return { ok: false, message: "Live location could not be stopped." };
  revalidatePath("/", "layout");
  return { ok: true, message: "Live location is off." };
}

export async function updateProfile(form: FormData) {
  const name = String(form.get("display_name") ?? "")
    .trim()
    .slice(0, 60);
  const timezone = String(form.get("timezone") ?? "UTC").slice(0, 80);
  const city =
    String(form.get("city") ?? "")
      .trim()
      .slice(0, 100) || null;
  const birthday = String(form.get("birthday") ?? "") || null;
  const latitudeValue = String(form.get("latitude") ?? "").trim();
  const longitudeValue = String(form.get("longitude") ?? "").trim();
  const latitude = latitudeValue ? Number(latitudeValue) : null;
  const longitude = longitudeValue ? Number(longitudeValue) : null;
  if (name.length < 2)
    fail("/settings", "Your name needs at least two characters.");
  if (
    (latitude == null) !== (longitude == null) ||
    (latitude != null &&
      (!Number.isFinite(latitude) || Math.abs(latitude) > 90)) ||
    (longitude != null &&
      (!Number.isFinite(longitude) || Math.abs(longitude) > 180))
  )
    fail("/settings", "Capture a valid location and try again.");
  const { supabase, user } = await auth();
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: name,
      timezone,
      city,
      birthday,
      latitude,
      longitude,
    })
    .eq("id", user.id);
  if (error) fail("/settings", "Your profile couldn’t be updated.");
  const { data: membership } = await supabase
    .from("nest_members")
    .select("nest_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membership) {
    await notifyPartner({
      nestId: membership.nest_id,
      actorId: user.id,
      kind: "moment",
      title: "Partner profile updated",
      body: "Your partner updated their profile in your Nest.",
      targetPath: "/home",
    });
  }
  revalidatePath("/", "layout");
  succeed("/settings", "Profile saved.");
}
