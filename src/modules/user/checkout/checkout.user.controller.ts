import { sendSuccess } from "@/utils/send-success";
import {
  calculateShippingSchema,
  checkoutSessionParamsSchema,
  sessionIdParams,
  setCheckoutAddressSchema,
  setShippingMethodSchema
} from "./checkout.user.schema";
import { CheckoutUserService } from "./checkout.user.service";
import { Request, Response } from "express";

export class CheckoutUserController {
  constructor(private readonly service: CheckoutUserService) {}

  createCheckoutSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const result = await this.service.createCheckoutSession(userId);

    sendSuccess(res, 201, { data: result });
  };

  getCheckoutSession = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const { sessionId } = checkoutSessionParamsSchema.parse(req.params);

    const result = await this.service.getCheckoutSession(userId, sessionId);

    sendSuccess(res, 200, { data: result });
  };

  setAddress = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const { sessionId } = checkoutSessionParamsSchema.parse(req.params);

    const payload = setCheckoutAddressSchema.parse(req.body);

    await this.service.setCheckoutAddress(userId, sessionId, payload.addressId);

    sendSuccess(res, 200, { message: "Checkout address updated" });
  };

  calculateShippingCost = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const { sessionId } = checkoutSessionParamsSchema.parse(req.params);

    const { courier } = calculateShippingSchema.parse(req.body);

    const result = await this.service.calculateShippingCost(userId, sessionId, courier);

    sendSuccess(res, 200, { data: result });
  };

  setShippingMethod = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const { sessionId } = checkoutSessionParamsSchema.parse(req.params);

    const payload = setShippingMethodSchema.parse(req.body);

    await this.service.setShippingMethod(userId, sessionId, payload.courierCode, payload.courierService);

    sendSuccess(res, 200, { message: "Shipping method selected" });
  };

  confirmCheckout = async (req: Request, res: Response) => {
    const userId = req.user?.id!;
    const params = sessionIdParams.parse(req.params);
    const orderCode = await this.service.confirmCheckout(userId, params.sessionId);

    return sendSuccess(res, 200, {
      data: { orderCode }
    });
  };

  getWarehouseOrigin = async (req: Request, res: Response) => {
    const data = await this.service.getWarehouseOrigin();

    sendSuccess(res, 200, { data });
  };
}
