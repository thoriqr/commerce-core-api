import { ProductDetailDTO, ProductListDTO, ProductVariantDTO } from "./product.dto";
import {
  ImageRow,
  ProductCollectionIdRow,
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
  colIdRows: ProductCollectionIdRow[],
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
      collectionIds: colIdRows.map((r) => String(r.collection_id)),
      images,
      isVariant: productRow.is_variant,
      status: productRow.status,
      categoryId: productRow.category_id ? String(productRow.category_id) : null,
      variantDimension: [],
      variants: variantRows.map((v) => ({
        id: v.id,
        clientId: String(v.id),
        price: v.price,
        stock: v.stock,
        weight: v.weight,
        sku: v.sku ?? "",
        isPrimary: v.is_primary,
        status: v.status,
        options: []
      }))
    };
  }

  // ================= VALUE GROUPING =================

  const valueByDimension = dimensionValueRows.reduce<
    Record<number, { id: string; value: string; normalized_value: string; hexColor: string | undefined }[]>
  >((acc, value) => {
    if (!acc[value.dimension_id]) {
      acc[value.dimension_id] = [];
    }

    acc[value.dimension_id]?.push({
      id: String(value.id),
      value: value.value,
      normalized_value: value.normalized_value,
      hexColor: value.hex_color ? value.hex_color : undefined
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
        image: image ? { id: image.id, imageKey: image.imageKey } : undefined,
        hexColor: opt.hexColor
      };
    })
  }));

  // ================= BUILD OPTION MAP =================

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

  // ================= BUILD VARIANTS =================

  const variants: ProductVariantDTO[] = variantRows.map((v) => ({
    id: v.id,
    clientId: String(v.id),
    price: v.price,
    stock: v.stock,
    weight: v.weight,
    sku: v.sku ?? "",
    isPrimary: v.is_primary,
    status: v.status,
    options: optValMap.get(String(v.id)) ?? []
  }));

  // ================= SORT VARIANTS  =================

  // Build order map per dimension
  const optionOrderMap = new Map<string, string[]>();

  variantDimension.forEach((dim) => {
    optionOrderMap.set(
      dim.id,
      dim.options.map((o) => o.id)
    );
  });

  variants.sort((a, b) => {
    for (const dim of variantDimension) {
      const order = optionOrderMap.get(dim.id) ?? [];

      const aOpt = a.options.find((o) => o.dimensionId === dim.id);
      const bOpt = b.options.find((o) => o.dimensionId === dim.id);

      const aIndex = order.indexOf(aOpt?.optionId ?? "");
      const bIndex = order.indexOf(bOpt?.optionId ?? "");

      if (aIndex !== bIndex) {
        return aIndex - bIndex;
      }
    }

    return 0;
  });

  // ================= FINAL RETURN =================

  return {
    productId: String(productRow.id),
    name: productRow.name,
    description: productRow.description,
    isVariant: productRow.is_variant,
    status: productRow.status,
    categoryId: productRow.category_id ? String(productRow.category_id) : null,
    collectionIds: colIdRows.map((r) => String(r.collection_id)),
    variantDimension,
    images,
    variants
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
    activeMinPrice: row.active_min_price,
    activeMaxPrice: row.active_max_price,
    totalStock: row.total_stock,
    totalSold: row.total_sold,
    sku: row.representative_sku ?? "-",
    status: row.status,
    categoryName: row.category_name ?? "-",
    isVariant: row.is_variant,
    variantCount: row.variant_count,
    createdAt: row.created_at
  }));
}
