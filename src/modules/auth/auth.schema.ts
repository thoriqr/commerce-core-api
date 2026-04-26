import { z } from "zod";

const emailSchema = z
  .email()
  .transform((val) => val.trim().toLowerCase())
  .meta({
    example: "user@mail.com",
    description: "User email address"
  });

const passwordSchema = z.string().min(8).max(72).meta({
  example: "password123",
  description: "User password"
});

const tokenSchema = z.string().min(10, "Invalid token");

export const registerSchema = z.object({
  email: emailSchema
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
  displayName: z.string().trim().min(2).max(100),
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

export const validateAdminInviteSchema = z.object({
  token: tokenSchema
});

export const verifyAdminInvite = z.object({
  token: tokenSchema,
  displayName: z.string().trim().min(2).max(100).optional(),
  password: passwordSchema.optional()
});

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyAdminInvite = z.infer<typeof verifyAdminInvite>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestPasswordResetInput = z.infer<typeof requestPasswordResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;

// FOR RESPONSE NOT FOR REQUEST BODY

export const authUserSchema = z.object({
  id: z.number(),
  email: emailSchema,
  role: z.enum(["USER", "ADMIN", "SUPER"]),
  displayName: z.string().nullable(),
  isDemo: z.boolean()
});

export type AuthUserSchema = z.infer<typeof authUserSchema>;
