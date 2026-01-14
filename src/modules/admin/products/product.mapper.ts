import { ProductDetailDTO, ProductVariantDTO } from "./product.dto";
import { ProductDetailRow, VariantDetailRow, VariantOptionRow } from "./product.types";

export function mapProductDetail(productRow: ProductDetailRow, variantRows: VariantDetailRow[], optionRows: VariantOptionRow[]): ProductDetailDTO {
  const variantMap = new Map<number, ProductVariantDTO>();

  for (const v of variantRows) {
    variantMap.set(v.id, {
      variantId: v.id,
      price: v.stock,
      stock: v.stock,
      weight: v.weight,
      sku: v.sku,
      isPrimary: v.is_primary,
      options: []
    });
  }

  for (const opt of optionRows) {
    const variant = variantMap.get(opt.product_variant_id);
    if (variant) {
      variant.options.push({ optionId: opt.id, name: opt.name, value: opt.value });
    }
  }
  return {
    productId: productRow.id,
    name: productRow.name,
    description: productRow.description,
    slug: productRow.slug,
    isVariant: productRow.is_variant,
    status: productRow.status,
    variants: Array.from(variantMap.values())
  };
}
