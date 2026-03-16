import { SessionItemRow } from "./checkout.types";

export function mapSessionItem(rows: SessionItemRow[]) {
  const dto = rows.map((r) => {
    const variantActive = r.variant_status === "ACTIVE";
    const productActive = r.product_status === "ACTIVE";

    const isAvailable = variantActive && productActive;

    let warning: string | null = null;

    if (!isAvailable) {
      warning = "UNAVAILABLE";
    } else if (r.quantity > r.stock) {
      warning = "INSUFFICIENT_STOCK";
    }

    return {
      variantId: r.variant_id,
      productName: r.product_name,
      slug: r.slug,
      price: r.price,
      quantity: r.quantity,
      stock: r.stock,
      weight: r.weight,
      isAvailable,
      warning
    };
  });

  return dto;
}
