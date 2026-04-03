import { sendSuccess } from "@/utils/send-success";
import { midtransWebhookSchema } from "./payment.schema";
import { PaymentService } from "./payment.service";
import { verifyMidtransSignature } from "./midtrans/midtrans.signature";
import { env } from "@/config/env";

import { Request, Response } from "express";

export class PaymentController {
  constructor(private readonly service: PaymentService) {}

  handleMidtransWebhook = async (req: Request, res: Response) => {
    try {
      const parsed = midtransWebhookSchema.safeParse(req.body);

      if (!parsed.success) {
        console.warn("Invalid webhook payload");

        return sendSuccess(res, 200, {
          message: "ignored"
        });
      }

      const payload = parsed.data;

      const isValid = verifyMidtransSignature(payload, env.MIDTRANS_SERVER_KEY!);

      if (!isValid) {
        console.warn("Invalid Midtrans signature");

        return sendSuccess(res, 200, {
          message: "ignored"
        });
      }

      await this.service.handleMidtransWebhook(payload);

      return sendSuccess(res, 200, {
        message: "ok"
      });
    } catch (err) {
      console.error("Midtrans webhook error:", err);

      return sendSuccess(res, 200, {
        message: "error_handled"
      });
    }
  };
}
