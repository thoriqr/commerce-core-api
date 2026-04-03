import { ImageSignature } from "@/shared/variant-image/types";
import { CartItemDTO } from "./cart.dto";
import { CartItemRow } from "./cart.types";
import { findBestImage } from "@/shared/variant-image/resolver";

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
      imageKey,
      options: row.option_snapshot ?? [],
      isAvailable,
      stockWarning
    };
  });
}
