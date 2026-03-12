import { sendSuccess } from "@/utils/send-success";
import { CartService } from "./cart.service";
import { Request, Response } from "express";
import { addItemSchema, deleteCartItemSchema, updateCartItemSchema } from "./cart.schema";

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

    await this.service.addItem(cartId, payload.variantId, payload.quantity);

    return sendSuccess(res, 200, {
      message: "Item added to cart"
    });
  };

  updateItem = async (req: Request, res: Response) => {
    const cartIdFromCookie = req.cookies?.cart_id ?? null;
    const userId = req.user?.id ?? null;

    const params = updateCartItemSchema.parse({
      variantId: req.params.variantId,
      quantity: req.body.quantity
    });

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      res.cookie("cart_id", cartId, {
        httpOnly: false,
        sameSite: "lax",
        path: "/"
      });
    }

    await this.service.updateItem(cartId, params.variantId, params.quantity);

    return sendSuccess(res, 200, {
      message: "Cart updated"
    });
  };

  deleteItem = async (req: Request, res: Response) => {
    const cartIdFromCookie = req.cookies?.cart_id ?? null;
    const userId = req.user?.id ?? null;

    const params = deleteCartItemSchema.parse({
      variantId: req.params.variantId
    });

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      res.cookie("cart_id", cartId, {
        httpOnly: false,
        sameSite: "lax",
        path: "/"
      });
    }

    await this.service.deleteItem(cartId, params.variantId);

    return sendSuccess(res, 200, {
      message: "Item removed from cart"
    });
  };
}
