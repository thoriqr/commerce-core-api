import { Request, Response } from "express";
import { OrdersService } from "./orders.service";
import { sendSuccess } from "@/utils/send-success";
import { verifyMidtransSignature } from "./integrations/midtrans/midtrans.signature";
import { midtransWebhookSchema } from "./order-payments/order-payments.schema";
import { env } from "@/config/env";
import { orderCodeParams, sessionIdParams } from "./orders.schema";

export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  getOrder = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { orderCode } = orderCodeParams.parse(req.params);
    const result = await this.service.getOrder(userId, orderCode);

    return sendSuccess(res, 200, {
      data: result
    });
  };

  confirmCheckout = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const params = sessionIdParams.parse(req.params);
    const orderCode = await this.service.confirmCheckout(userId, params.sessionId);

    return sendSuccess(res, 200, {
      data: orderCode
    });
  };

  cancelOrder = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { orderCode } = orderCodeParams.parse(req.params);
    await this.service.cancelOrder(userId, orderCode);

    return sendSuccess(res, 200, {
      message: "Order cancelled"
    });
  };

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

  createSnapToken = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { orderCode } = orderCodeParams.parse(req.params);

    const result = await this.service.createSnapToken(userId, orderCode);

    return sendSuccess(res, 200, { data: result });
  };
}
