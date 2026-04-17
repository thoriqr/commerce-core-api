import { ImageSignature } from "@/shared/variant-image/types";
import { CartItemDTO } from "./cart.dto";
import { CartItemRow } from "./cart.types";
import { findBestImage } from "@/shared/variant-image/resolver";
import { getVariantWarning } from "../store/product/product.mapper";
import { VariantDetailRow } from "../store/product/product.types";

function getCartWarning(row: CartItemRow): string | null {
  // base warning
  const base = getVariantWarning({
    product_status: row.product_status,
    variant_status: row.variant_status,
    stock: row.stock
  } as VariantDetailRow);

  if (base) return base;

  // cart-specific rule
  if (row.stock < row.quantity) {
    return "INSUFFICIENT_STOCK";
  }

  return null;
}

export function mapCartItems(
  rows: CartItemRow[],
  imageMap: Map<
    number,
    {
      images: ImageSignature[];
      fallback: {
        imageId: number;
        imageKey: string;
      } | null;
    }
  >
): CartItemDTO[] {
  return rows.map((row) => {
    const productImages = imageMap.get(row.product_id);

    const best = productImages ? (findBestImage(productImages.images, row.option_snapshot) ?? productImages.fallback) : null;

    const imageKey = best?.imageKey ?? null;

    const warning = getCartWarning(row);

    const isAvailable = row.product_status === "ACTIVE" && row.variant_status === "ACTIVE" && row.stock > 0;

    return {
      variantId: row.variant_id,
      productId: row.product_id,
      name: row.name,
      slug: row.slug,
      price: row.price,
      quantity: row.quantity,
      stock: row.stock,
      imageKey,
      options: row.option_snapshot ?? [],
      isAvailable,
      warning
    };
  });
}
