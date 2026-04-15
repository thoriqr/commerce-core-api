import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  PORT: z.coerce.number().default(3000),

  DATABASE_URL: z.string().min(1),
  CLIENT_ORIGINS: z
    .string()
    .min(1)
    .transform((v) => v.split(",").map((o) => o.trim())),

  ADMIN_ORIGIN: z.string().min(1),
  STOREFRONT_ORIGIN: z.string().min(1),

  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_URL: z.string().min(1),

  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  SUPER_EMAIL: z.string().min(1),
  SUPER_PASSWORD: z.string().min(1),

  RAJAONGKIR_API_KEY: z.string().min(1),
  MIDTRANS_SERVER_KEY: z.string().min(1),
  NOTIFICATION_WEBHOOK_URL: z.string().min(1)
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(z.treeifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
