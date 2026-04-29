import { z } from "zod";

export const midtransWebhookSchema = z.object({
  transaction_id: z.string().meta({
    example: "a1b2c3d4-transaction-id"
  }),

  order_id: z.string().meta({
    example: "ORD-20260430-XYZ123"
  }),

  payment_type: z.string().meta({
    example: "bank_transfer"
  }),

  transaction_status: z.string().meta({
    example: "settlement"
  }),

  fraud_status: z.string().optional().meta({
    example: "accept"
  }),

  gross_amount: z.string().meta({
    example: "150000.00"
  }),

  currency: z.string().meta({
    example: "IDR"
  }),

  status_code: z.string().meta({
    example: "200"
  }),

  signature_key: z.string().meta({
    example: "generated-signature-key"
  }),

  payment_code: z.string().optional(),
  store: z.string().optional(),

  bank: z.string().optional().meta({
    example: "bca"
  }),

  va_numbers: z
    .array(
      z.object({
        bank: z.string(),
        va_number: z.string()
      })
    )
    .optional()
    .meta({
      example: [
        {
          bank: "bca",
          va_number: "1234567890"
        }
      ]
    }),

  transaction_time: z.string().optional().meta({
    example: "2026-04-30 10:00:00"
  }),

  settlement_time: z.string().optional().meta({
    example: "2026-04-30 10:05:00"
  })
});

export type MidtransWebhookPayload = z.infer<typeof midtransWebhookSchema>;
