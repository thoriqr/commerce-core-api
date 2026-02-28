import { z } from "zod";

/* =========================
   Base Validators
========================= */

const emailSchema = z.email();

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"); // bcrypt safe range

const tokenSchema = z.string().min(10, "Invalid token");

/* =========================
   Register (Step 1)
   Send magic link
========================= */

export const registerSchema = z.object({
  email: emailSchema
});

/* =========================
   Verify Email (Step 2)
   Complete registration
========================= */

export const verifyEmailSchema = z.object({
  token: tokenSchema,
  displayName: z.string().trim().min(2, "Display name too short").max(100, "Display name too long"),
  password: passwordSchema
});

/* =========================
   Login
========================= */

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

/* =========================
   Refresh
   (no body needed if cookie-based)
========================= */

export const refreshSchema = z.object({});

/* =========================
   Request Password Reset
========================= */

export const requestPasswordResetSchema = z.object({
  email: emailSchema
});

/* =========================
   Reset Password
========================= */

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema
});

/* =========================
   Google Login
========================= */

export const googleLoginSchema = z.object({
  idToken: z.string().min(10)
});

/* =========================
   Types
========================= */

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
