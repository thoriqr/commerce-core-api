import { sendSuccess } from "@/utils/send-success";
import { getOrdersQuerySchema, orderIdParams, shipmentSchema } from "./order.schema";
import { OrderService } from "./order.service";
import { Request, Response } from "express";

export class OrderController {
  constructor(private readonly service: OrderService) {}

  getOrders = async (req: Request, res: Response) => {
    const qParams = getOrdersQuerySchema.parse(req.query);
    const { data, meta } = await this.service.getOrders(qParams);

    sendSuccess(res, 200, { data, meta });
  };

  getOrder = async (req: Request, res: Response) => {
    const { orderId } = orderIdParams.parse(req.params);
    const data = await this.service.getOrder(orderId);

    sendSuccess(res, 200, { data });
  };

  markAsShipped = async (req: Request, res: Response) => {
    const { orderId } = orderIdParams.parse(req.params);
    const { trackingNumber } = shipmentSchema.parse(req.body);

    await this.service.markAsShipped(orderId, trackingNumber);

    sendSuccess(res, 200, {
      message: "Order marked as shipped"
    });
  };

  markAsDelivered = async (req: Request, res: Response) => {
    const { orderId } = orderIdParams.parse(req.params);

    await this.service.markAsDelivered(orderId);

    sendSuccess(res, 200, {
      message: "Order marked as delivered"
    });
  };
}
