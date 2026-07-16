import { sendSuccess } from "@/utils/send-success";
import { Request, Response } from "express";
import { CartService } from "./cart.service";
import { addItemSchema, deleteCartItemSchema, updateCartItemSchema } from "./cart.schema";

export class CartController {
  constructor(private readonly service: CartService) {}

  /**
   * Returns the authenticated user's cart.
   */
  getCart = async (req: Request, res: Response) => {
    const cart = await this.service.getCart(req.user!.id);

    return sendSuccess(res, 200, {
      data: cart
    });
  };


  addItem = async (req: Request, res: Response) => {
    const payload = addItemSchema.parse(req.body);

    await this.service.addItem(
      req.user!.id,
      payload.variantId,
      payload.quantity
    );

    return sendSuccess(res, 200, {
      message: "Item added to cart"
    });
  };


  updateItem = async (req: Request, res: Response) => {
    const params = updateCartItemSchema.parse({
      variantId: req.params.variantId,
      quantity: req.body.quantity
    });

    await this.service.updateItem(
      req.user!.id,
      params.variantId,
      params.quantity
    );

    return sendSuccess(res, 200, {
      message: "Cart updated"
    });
  };


  deleteItem = async (req: Request, res: Response) => {
    const params = deleteCartItemSchema.parse({
      variantId: req.params.variantId
    });

    await this.service.deleteItem(
      req.user!.id,
      params.variantId
    );

    return sendSuccess(res, 200, {
      message: "Item removed from cart"
    });
  };
}