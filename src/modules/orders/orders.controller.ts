import { Request, Response } from "express";
import { OrdersService } from "./orders.service";
import { verifyMidtransSignature } from "./webhooks/midtrans.util";
import { sendSuccess } from "@/utils/send-success";

export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  handleMidtransWebhook = async (req: Request, res: Response) => {
    try {
      const payload = req.body;

      const isValid = verifyMidtransSignature(payload, process.env.MIDTRANS_SERVER_KEY!);

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
