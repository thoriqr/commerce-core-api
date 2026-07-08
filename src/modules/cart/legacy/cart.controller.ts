import { sendSuccess } from "@/utils/send-success";
import { CartService } from "./cart.service";
import { Request, Response } from "express";
import { addItemSchema, deleteCartItemSchema, updateCartItemSchema } from "../cart.schema";
import { baseCookieOptions } from "@/utils/set-auth-cookie";
import { resolveAuthTransport } from "@/utils/auth-helpers";

/**
 * -----------------------------------------------------------------------------
 * LEGACY IMPLEMENTATION
 * -----------------------------------------------------------------------------
 *
 * Guest cart controller.
 *
 * This controller supports both guest and authenticated users by resolving
 * the cart identity from:
 *
 * - x-cart-id (mobile)
 * - cart_id cookie (web)
 *
 * It also creates guest carts when needed and automatically merges a guest
 * cart into the authenticated user's cart after login.
 *
 * This implementation is intentionally preserved for reference and possible
 * future reuse.
 *
 * Current production implementation:
 *   -> UserCartController
 * -----------------------------------------------------------------------------
 */
export class CartController {
  constructor(private readonly service: CartService) {}

  getCart = async (req: Request, res: Response) => {
    const cartIdFromCookie = this.getCartId(req);
    const userId = req.user?.id ?? null;

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      this.setCartId(req, res, cartId);
    }

    const cart = await this.service.getCart(cartId);

    return sendSuccess(res, 200, {
      data: cart
    });
  };

  addItem = async (req: Request, res: Response) => {
    const cartIdFromCookie = this.getCartId(req);
    const userId = req.user?.id ?? null;

    const payload = addItemSchema.parse(req.body);

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      this.setCartId(req, res, cartId);
    }

    await this.service.addItem(cartId, payload.variantId, payload.quantity);

    return sendSuccess(res, 200, {
      message: "Item added to cart"
    });
  };

  updateItem = async (req: Request, res: Response) => {
    const cartIdFromCookie = this.getCartId(req);
    const userId = req.user?.id ?? null;

    const params = updateCartItemSchema.parse({
      variantId: req.params.variantId,
      quantity: req.body.quantity
    });

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      this.setCartId(req, res, cartId);
    }

    await this.service.updateItem(cartId, params.variantId, params.quantity);

    return sendSuccess(res, 200, {
      message: "Cart updated"
    });
  };

  deleteItem = async (req: Request, res: Response) => {
    const cartIdFromCookie = this.getCartId(req);
    const userId = req.user?.id ?? null;

    const params = deleteCartItemSchema.parse({
      variantId: req.params.variantId
    });

    const { cartId, created } = await this.service.resolveCart(cartIdFromCookie, userId);

    if (created) {
      this.setCartId(req, res, cartId);
    }

    await this.service.deleteItem(cartId, params.variantId);

    return sendSuccess(res, 200, {
      message: "Item removed from cart"
    });
  };


  /**
   * Resolve the guest cart identifier from the client.
   *
   * Mobile:
   *   - x-cart-id header
   *
   * Web:
   *   - cart_id cookie
   */
  private getCartId(req: Request) {
    if (resolveAuthTransport(req) === "mobile") {
      return req.get("x-cart-id") ?? null;
    }

    return req.cookies?.cart_id ?? null;
  }

    /**
   * Persist the latest guest cart identifier back to the client.
   *
   * Mobile:
   *   - x-cart-id response header
   *
   * Web:
   *   - cart_id cookie
   */
  private setCartId(req: Request, res: Response, cartId: string) {
    if (resolveAuthTransport(req) === "mobile") {
      res.set("x-cart-id", cartId);
      return;
    }

    res.cookie("cart_id", cartId, {
      ...baseCookieOptions,
      httpOnly: false
    });
  }
}
