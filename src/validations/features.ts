import { z } from "zod";
export const uuid = z.uuid();
export const nestSchema = z.object({
  name: z.string().trim().min(2).max(80),
  relationship_start: z.iso.date().optional().or(z.literal("")),
});
export const nestUpdateSchema = nestSchema.extend({ nest_id: uuid });
export const nestDeleteSchema = z.object({
  nest_id: uuid,
  confirmation: z.string().trim().min(2).max(80),
});
export const inviteSchema = z.object({
  nest_id: uuid,
  email: z.email().optional().or(z.literal("")),
});
export const acceptInviteSchema = z.string().trim().min(8).max(32);
export const momentSchema = z.object({
  nest_id: uuid,
  title: z.string().trim().min(1).max(120),
  story: z.string().trim().max(10000),
  moment_at: z.iso.datetime({ local: true }),
  timezone: z.string().min(1).max(80),
  mood: z.string().max(30).optional(),
  category: z.string().min(1).max(50),
  location_name: z.string().trim().max(160).optional(),
});
export const moodSchema = z.object({
  nest_id: uuid,
  mood: z.enum([
    "Happy",
    "Loved",
    "Calm",
    "Excited",
    "Tired",
    "Missing You",
    "Stressed",
    "Low",
    "Other",
  ]),
  timezone: z.string().max(80),
});
export const noteSchema = z.object({
  nest_id: uuid,
  recipient_id: uuid,
  body: z.string().trim().min(1).max(3000),
  theme: z.string().max(40),
  deliver_at: z.iso.datetime({ local: true }).optional().or(z.literal("")),
  timezone: z.string().min(1).max(80),
});
export const meetupSchema = z.object({
  nest_id: uuid,
  title: z.string().trim().min(1).max(160),
  starts_at: z.iso.datetime({ local: true }),
  timezone: z.string().max(80),
  destination: z.string().trim().min(1).max(160),
  notes: z.string().max(3000).optional(),
});
export const wishlistSchema = z.object({
  nest_id: uuid,
  title: z.string().trim().min(1).max(160),
  description: z.string().max(3000).optional(),
  category: z.string().max(60).optional(),
});
export const capsuleSchema = z.object({
  nest_id: uuid,
  title: z.string().trim().min(1).max(160),
  content: z.string().trim().min(1).max(10000),
  unlock_at: z.iso.datetime({ local: true }),
  timezone: z.string().max(80),
});
export const answerSchema = z.object({
  nest_id: uuid,
  question_id: uuid,
  local_date: z.iso.date(),
  answer: z.string().trim().min(1).max(2000),
});
