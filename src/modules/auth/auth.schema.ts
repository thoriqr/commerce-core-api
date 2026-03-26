import { z } from "zod";

const emailSchema = z.email().transform((val) => val.trim().toLowerCase());

const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72, "Password is too long"); // bcrypt safe range

const tokenSchema = z.string().min(10, "Invalid token");

export const registerSchema = z.object({
  email: emailSchema
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
  displayName: z.string().trim().min(2, "Display name too short").max(100, "Display name too long"),
  password: passwordSchema
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema
});

export const resetPasswordSchema = z.object({
  token: tokenSchema,
  password: passwordSchema
});

export const checkVerificationTokenSchema = z.object({
  token: tokenSchema,
  type: z.enum(["REGISTER", "RESET_PASSWORD"])
});

export const setPasswordSchema = z.object({
  password: passwordSchema
});

export const changePasswordSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(10)
});

export const changeEmailSchema = z.object({
  email: emailSchema
});

export const confirmEmailChangeSchema = z.object({
  token: tokenSchema
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
