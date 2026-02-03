import { ProductDetailDTO, ProductListDTO } from "./product.dto";
import {
  ImageRow,
  ProductDetailRow,
  ProductListRow,
  VariantDimensionRow,
  VariantDimensionValueRow,
  VariantImageRow,
  VariantOptionValueRow,
  VariantRow
} from "./product.types";

export function mapProductDetail(
  productRow: ProductDetailRow,
  imageRows: ImageRow[],
  variantRows: VariantRow[],
  dimensionRows: VariantDimensionRow[],
  dimensionValueRows: VariantDimensionValueRow[],
  optionValueRows: VariantOptionValueRow[],
  variantImageRows: VariantImageRow[]
): ProductDetailDTO {
  const images = imageRows.map((r) => ({
    id: String(r.id),
    imageKey: r.image_key,
    sortOrder: r.sort_order
  }));

  if (variantRows.length === 1) {
    return {
      productId: String(productRow.id),
      name: productRow.name,
      description: productRow.description,
      images,
      isVariant: productRow.is_variant,
      status: productRow.status,
      categoryId: productRow.category_id ? String(productRow.category_id) : null,
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

  const valueByDimension = dimensionValueRows.reduce<Record<number, { id: string; value: string; normalized_value: string }[]>>((acc, value) => {
    if (!acc[value.dimension_id]) {
      acc[value.dimension_id] = [];
    }

    acc[value.dimension_id]?.push({
      id: String(value.id),
      value: value.value,
      normalized_value: value.normalized_value
    });

    return acc;
  }, {});

  const variantImageMap = new Map<string, { id: string; imageKey: string }>();
  variantImageRows.forEach((row) => {
    const key = `${row.dimension_key}:${row.value_key}`;
    variantImageMap.set(key, {
      id: String(row.id),
      imageKey: row.image_key
    });
  });

  const variantDimension = dimensionRows.map((d) => ({
    id: String(d.id),
    name: d.name,
    options: (valueByDimension[d.id] ?? []).map((opt) => {
      const key = `${d.normalized_name}:${opt.normalized_value}`;
      const image = variantImageMap.get(key);

      return {
        id: String(opt.id),
        value: opt.value,
        image: image ? { id: image.id, imageKey: image.imageKey } : undefined
      };
    })
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
    description: productRow.description,
    isVariant: productRow.is_variant,
    status: productRow.status,
    categoryId: productRow.category_id ? String(productRow.category_id) : null,
    variantDimension,
    images,
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

export function mapProductList(rows: ProductListRow[]): ProductListDTO[] {
  return rows.map((row) => ({
    productId: row.id,
    name: row.name,
    slug: row.slug,
    thumbnailImage: row.thumbnail_image,
    minPrice: row.min_price,
    maxPrice: row.max_price,
    totalStock: row.total_stock,
    sku: row.representative_sku ?? "-",
    status: row.status,
    categoryName: row.category_name ?? "-",
    isVariant: row.is_variant,
    variantCount: row.variant_count,
    createdAt: row.created_at
  }));
}
