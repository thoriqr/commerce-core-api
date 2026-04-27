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

const tokenSchema = z.string().min(10).meta({
  example: "a8f3c9e2b7d4f1a6c0e9"
});

export const registerSchema = z.object({
  email: emailSchema
});

export const verifyEmailSchema = z.object({
  token: tokenSchema,
  displayName: z.string().trim().min(2).max(100).meta({
    example: "John Doe",
    description: "User display name"
  }),
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
  newPassword: passwordSchema.meta({
    example: "newStrongPassword123"
  })
});

export const googleLoginSchema = z.object({
  idToken: z.string().min(10).meta({
    example: "eyJhbGciOiJSUzI1NiIsImtpZCI6Ij...dummy.google.id.token...",
    description: "Google ID token obtained from Google Sign-In"
  })
});

export const changeEmailSchema = z.object({
  email: emailSchema
});

export const confirmEmailChangeSchema = z.object({
  token: tokenSchema
});

export const validateAdminInviteSchema = z.object({
  token: tokenSchema.meta({
    example: "inv_abc123token"
  })
});

export const verifyAdminInvite = z.object({
  token: tokenSchema,
  displayName: z.string().trim().min(2).max(100).optional().meta({
    example: "John Doe",
    description: "User display name"
  }),
  password: passwordSchema.optional().meta({
    description: "Required if the user does not already have a password"
  })
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

export const verifyTokenDataSchema = z.object({
  expiresAt: z.string()
});

export const validateAdminSchemaData = z.object({
  email: z.email().meta({
    example: "admin@example.com"
  }),
  displayName: z.string().meta({
    example: "John Doe"
  }),
  hasPassword: z.boolean().meta({
    example: false,
    description: "Indicates whether the user already has a password set"
  })
});

export type AuthUserSchema = z.infer<typeof authUserSchema>;
