import { AppError } from "@/errors/app-error";
import { CartRepo } from "./cart.repo";
import { ResolveCartResult } from "./cart.types";
import { TransactionManager } from "@/infra/db/transaction-manager";
import { MAX_CART_ITEM_QTY } from "./cart.constants";
import { mapCartItems } from "./cart.mapper";
import { ProductImageService } from "@/modules/product/product-image.service";

export class CartService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: CartRepo,
    private readonly productImageService: ProductImageService
  ) {}

  resolveCart = async (cartIdFromCookie: string | null, userId: number | null): Promise<ResolveCartResult> => {
    // USER FLOW
    if (userId) {
      let userCart = await this.repo.findCartByUserId(userId);

      if (!userCart) {
        userCart = await this.repo.createCart(userId);
      }

      // merge guest cart
      if (cartIdFromCookie && cartIdFromCookie !== userCart.id) {
        const guestCart = await this.repo.findCartById(cartIdFromCookie);

        if (guestCart && guestCart.user_id === null) {
          await this.mergeGuestCart(guestCart.id, userCart.id);
        }
      }

      return {
        cartId: userCart.id,
        created: false
      };
    }

    // GUEST FLOW
    if (cartIdFromCookie) {
      const guestCart = await this.repo.findCartById(cartIdFromCookie);

      if (guestCart) {
        return {
          cartId: guestCart.id,
          created: false
        };
      }
    }

    const newCart = await this.repo.createCart(null);

    return {
      cartId: newCart.id,
      created: true
    };
  };

  getCart = async (cartId: string) => {
    const rows = await this.repo.findCartItems(cartId);

    if (rows.length === 0) {
      return {
        items: [],
        summary: { totalItems: 0, subtotal: 0 }
      };
    }

    const productIds = [...new Set(rows.map((r) => r.product_id))];

    // 2. image map (cache + DB)
    const imageMap = await this.productImageService.getVariantImagesBulk(productIds);

    // 3. map items + resolve image
    const items = mapCartItems(rows, imageMap);

    // 4. summary
    let totalItems = 0;
    let subtotal = 0;

    for (const item of items) {
      totalItems += item.quantity;
      subtotal += item.price * item.quantity;
    }

    return {
      items,
      summary: {
        totalItems,
        subtotal
      }
    };
  };

  addItem = async (cartId: string, variantId: number, quantity: number) => {
    const variant = await this.repo.findVariantForCart(variantId);

    if (!variant) {
      throw AppError.notFound("Variant not found");
    }

    if (variant.status !== "ACTIVE") {
      throw AppError.badRequest("Variant is not available");
    }

    const safeQty = this.clampQuantity(quantity);

    await this.repo.upsertCartItem(cartId, variantId, safeQty);
  };

  updateItem = async (cartId: string, variantId: number, quantity: number) => {
    const updated = await this.repo.updateCartItemQuantity(cartId, variantId, quantity);

    if (!updated && quantity > 0) {
      throw AppError.notFound("Cart item not found");
    }
  };

  deleteItem = async (cartId: string, variantId: number) => {
    await this.repo.deleteCartItem(cartId, variantId);
  };

  private mergeGuestCart = async (guestCartId: string, userCartId: string) => {
    await this.tm.transaction(async (trx) => {
      const items = await this.repo.findCartItems(guestCartId, trx);

      for (const item of items) {
        const safeQty = this.clampQuantity(item.quantity);

        await this.repo.upsertCartItem(userCartId, item.variant_id, safeQty, trx);
      }

      await this.repo.deleteCart(guestCartId, trx);
    });
  };

  private clampQuantity(qty: number) {
    return Math.min(qty, MAX_CART_ITEM_QTY);
  }
}
