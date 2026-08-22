import { z } from "zod";
export const emailSchema = z.email("Enter a valid email address");
export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .max(128);
export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});
export const signUpSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: emailSchema,
  password: passwordSchema,
});
