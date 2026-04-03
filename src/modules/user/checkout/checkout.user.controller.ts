import { sendSuccess } from "@/utils/send-success";
import { sessionIdParams } from "./checkout.user.schema";
import { CheckoutUserService } from "./checkout.user.service";
import { Request, Response } from "express";

export class CheckoutUserController {
  constructor(private readonly service: CheckoutUserService) {}

  confirmCheckout = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const params = sessionIdParams.parse(req.params);
    const orderCode = await this.service.confirmCheckout(userId, params.sessionId);

    return sendSuccess(res, 200, {
      data: { orderCode }
    });
  };
}
