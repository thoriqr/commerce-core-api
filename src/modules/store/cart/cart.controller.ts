import { sendSuccess } from "@/utils/send-success";
import { CartService } from "./cart.service";
import { Request, Response } from "express";
import { addItemSchema } from "./cart.schema";

export class CartController {
  constructor(private readonly service: CartService) {}

  getCart = async (req: Request, res: Response) => {
    const cartIdFromCookie = req.cookies?.cart_id ?? null;
    const userId = req.user?.id ?? null;

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      res.cookie("cart_id", cartId, {
        httpOnly: false,
        sameSite: "lax",
        path: "/"
      });
    }

    const cart = await this.service.getCart(cartId);

    return sendSuccess(res, 200, {
      data: cart
    });
  };

  addItem = async (req: Request, res: Response) => {
    const cartIdFromCookie = req.cookies?.cart_id ?? null;
    const userId = req.user?.id ?? null;

    const payload = addItemSchema.parse(req.body);

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      res.cookie("cart_id", cartId, {
        httpOnly: false,
        sameSite: "lax",
        path: "/"
      });
    }

    const cart = await this.service.addItem(cartId, payload.variantId, payload.quantity);

    return sendSuccess(res, 200, {
      message: "Item added to cart",
      data: cart
    });
  };
}
