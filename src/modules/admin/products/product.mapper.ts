import { ProductDetailDTO, ProductVariantDTO } from "./product.dto";
import { ProductDetailRow, VariantDimensionRow, VariantDimensionValueRow, VariantOptionValueRow, VariantRow } from "./product.types";

export function mapProductDetail(
  productRow: ProductDetailRow,
  variantRows: VariantRow[],
  dimensionRows: VariantDimensionRow[],
  dimensionValueRows: VariantDimensionValueRow[],
  optionValueRows: VariantOptionValueRow[]
): ProductDetailDTO {
  if (variantRows.length === 1) {
    return {
      productId: String(productRow.id),
      name: productRow.name,
      slug: productRow.slug,
      description: productRow.description,
      isVariant: productRow.is_variant,
      status: productRow.status,
      variantDimension: [],
      variants: variantRows.map((v) => ({
        id: String(v.id),
        price: v.price,
        stock: v.stock,
        weight: v.weight,
        sku: v.sku ?? "",
        isPrimary: v.is_primary,
        options: []
      }))
    };
  }

  const valueByDimension = dimensionValueRows.reduce<Record<number, { id: string; value: string }[]>>((acc, value) => {
    if (!acc[value.dimension_id]) {
      acc[value.dimension_id] = [];
    }

    acc[value.dimension_id]?.push({
      id: String(value.id),
      value: value.value
    });

    return acc;
  }, {});

  const variantDimension = dimensionRows.map((d) => ({
    id: String(d.id),
    name: d.name,
    options: valueByDimension[d.id] ?? []
  }));

  const optValMap = new Map<string, Array<{ dimensionId: string; optionId: string }>>();

  optionValueRows.forEach((opt) => {
    const vid = String(opt.variant_id);

    if (!optValMap.has(vid)) {
      optValMap.set(vid, []);
    }

    optValMap.get(vid)?.push({
      dimensionId: String(opt.dimension_id),
      optionId: String(opt.value_id)
    });
  });

  return {
    productId: String(productRow.id),
    name: productRow.name,
    slug: productRow.slug,
    description: productRow.description,
    isVariant: productRow.is_variant,
    status: productRow.status,
    variantDimension,
    variants: variantRows.map((v) => ({
      id: String(v.id),
      price: v.price,
      stock: v.stock,
      weight: v.weight,
      sku: v.sku ?? "",
      isPrimary: v.is_primary,
      options: optValMap.get(String(v.id)) ?? []
    }))
  };
}
