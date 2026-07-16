import { AppError } from "@/errors/app-error";
import { ProductImageService } from "@/modules/product/product-image.service";
import { mapCartItems } from "./cart.mapper";
import { MAX_CART_ITEM_QTY } from "./cart.constants";
import { CartRepo } from "./cart.repo";

export class CartService {
  constructor(
    private readonly repo: CartRepo,
    private readonly productImageService: ProductImageService
  ) {}

  /**
   * Returns the authenticated user's cart.
   * A new cart is automatically created on first access.
   */
  private async resolveUserCart(userId: number): Promise<string> {
    let cart = await this.repo.findCartByUserId(userId);

    if (!cart) {
      cart = await this.repo.createCart(userId);
    }

    return cart.id;
  }

  getCart = async (userId: number) => {
    const cartId = await this.resolveUserCart(userId);

    const rows = await this.repo.findCartItems(cartId);

    if (rows.length === 0) {
      return {
        items: [],
        summary: {
          totalItems: 0,
          subtotal: 0
        }
      };
    }

    const productIds = [...new Set(rows.map((row) => row.product_id))];

    const imageMap =
      await this.productImageService.getVariantImagesBulk(productIds);

    const items = mapCartItems(rows, imageMap);

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

  addItem = async (
    userId: number,
    variantId: number,
    quantity: number
  ) => {
    const cartId = await this.resolveUserCart(userId);

    const variant = await this.repo.findVariantForCart(variantId);

    if (!variant) {
      throw AppError.notFound("Variant not found");
    }

    if (variant.status !== "ACTIVE") {
      throw AppError.badRequest("Variant is not available");
    }

    const safeQty = this.clampQuantity(quantity);

    await this.repo.upsertCartItem(
      cartId,
      variantId,
      safeQty
    );
  };

  updateItem = async (
    userId: number,
    variantId: number,
    quantity: number
  ) => {
    const cartId = await this.resolveUserCart(userId);

    const updated = await this.repo.updateCartItemQuantity(
      cartId,
      variantId,
      quantity
    );

    if (!updated && quantity > 0) {
      throw AppError.notFound("Cart item not found");
    }
  };

  deleteItem = async (
    userId: number,
    variantId: number
  ) => {
    const cartId = await this.resolveUserCart(userId);

    await this.repo.deleteCartItem(
      cartId,
      variantId
    );
  };

  private clampQuantity(qty: number) {
    return Math.min(qty, MAX_CART_ITEM_QTY);
  }
}