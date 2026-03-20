import { z } from "zod";

export const midtransWebhookSchema = z.object({
  transaction_id: z.string(),
  order_id: z.string(),
  payment_type: z.string(),
  transaction_status: z.string(),
  fraud_status: z.string().optional(),

  gross_amount: z.string(),
  currency: z.string(),

  status_code: z.string(),
  signature_key: z.string(),

  payment_code: z.string().optional(),
  store: z.string().optional(),
  bank: z.string().optional(),

  va_numbers: z
    .array(
      z.object({
        bank: z.string(),
        va_number: z.string()
      })
    )
    .optional(),

  transaction_time: z.string().optional(),
  settlement_time: z.string().optional()
});

export type MidtransWebhookPayload = z.infer<typeof midtransWebhookSchema>;
