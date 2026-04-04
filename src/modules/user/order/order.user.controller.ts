import { sendSuccess } from "@/utils/send-success";
import { orderCodeParams, ordersByUserQuerySchema } from "./order.user.schema";
import { OrderUserService } from "./order.user.service";
import { Request, Response } from "express";

export class OrderUserController {
  constructor(private readonly service: OrderUserService) {}

  getOrder = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { orderCode } = orderCodeParams.parse(req.params);
    const result = await this.service.getOrder(userId, orderCode);

    return sendSuccess(res, 200, {
      data: result
    });
  };

  getOrders = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const qParams = ordersByUserQuerySchema.parse(req.query);

    const data = await this.service.getOrders(userId, qParams);

    sendSuccess(res, 200, { data });
  };

  cancelOrder = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { orderCode } = orderCodeParams.parse(req.params);
    await this.service.cancelOrder(userId, orderCode);

    return sendSuccess(res, 200, {
      message: "Order cancelled"
    });
  };

  createSnapToken = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const { orderCode } = orderCodeParams.parse(req.params);

    const result = await this.service.createSnapToken(userId, orderCode);

    return sendSuccess(res, 200, { data: result });
  };
}
