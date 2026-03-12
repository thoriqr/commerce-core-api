import { CartItemDTO } from "./cart.dto";
import { CartItemRow } from "./cart.types";

export function mapCartItems(rows: CartItemRow[]): CartItemDTO[] {
  return rows.map((row) => {
    const isAvailable = row.product_status === "ACTIVE" && row.variant_status === "ACTIVE";

    const stockWarning = row.stock === 0 ? "OUT_OF_STOCK" : row.stock < row.quantity ? "INSUFFICIENT_STOCK" : null;

    return {
      variantId: row.variant_id,
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      quantity: row.quantity,
      stock: row.stock,
      imageKey: row.image_key,
      options: row.option_snapshot ?? [],
      isAvailable,
      stockWarning
    };
  });
}
