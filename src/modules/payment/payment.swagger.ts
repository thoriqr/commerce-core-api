import { ROUTES } from "@/constants/routes";
import { midtransWebhookSchema } from "./payment.schema";
import { successResponse } from "@/docs/swagger/helpers/success.helper";

const PAYMENT_BASE = `${ROUTES.PAYMENT}`;

export const paymentSwagger = {
  tags: [
    {
      name: "Payment Webhooks",
      description: "External payment notifications (e.g. Midtrans)"
    }
  ],

  paths: {
    [`${PAYMENT_BASE}/midtrans/webhook`]: {
      post: {
        tags: ["Payment Webhooks"],
        summary: "Midtrans payment webhook",
        description: `
Receive payment status notifications from Midtrans.

This endpoint is called automatically by Midtrans after a transaction status changes.

Note:
- Payload structure follows Midtrans API specification.
- Requests are verified using a signature key.
- Invalid or unverified payloads will be ignored.
- Maps external payment status to internal order state.
- This endpoint is idempotent and always returns a success response to prevent retries.
`,

        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: midtransWebhookSchema
            }
          }
        },

        responses: {
          200: {
            description: "OK",
            content: {
              "application/json": {
                schema: successResponse({
                  message: "ok"
                })
              }
            }
          }
        }
      }
    }
  }
};
