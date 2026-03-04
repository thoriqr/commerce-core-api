import {
  ProductCardDTO,
  ProductDetailDTO,
  ProductFilterDimensionDTO,
  ProductFilterValueDTO,
  ProductListingDTO,
  VariantDetailDTO
} from "./product.dto";
import { DimensionRow, ImageRow, ProductBasicRow, ProductCardRow, ProductFilterRow, VariantDetailRow, VariantRow } from "./product.types";

export function mapProductListing(rows: ProductCardRow[], nextCursor: string | null, hasMore: boolean): ProductListingDTO {
  return {
    items: rows.map((r) => mapProductCard(r)),
    nextCursor,
    hasMore
  };
}

function mapProductCard(row: ProductCardRow): ProductCardDTO {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageKey: row.image_key,
    displayPrice: Number(row.display_price)
  };
}

export function mapProductDetail(data: {
  product: ProductBasicRow;
  variantRows: VariantRow[];
  dimensionRows: DimensionRow[];
  imageRows: ImageRow[];
}): ProductDetailDTO {
  const { product, variantRows, dimensionRows, imageRows } = data;

  const [firstVariant] = variantRows;

  if (!firstVariant) {
    throw new Error("Invariant violation: product has no variants");
  }

  const initialVariantId = firstVariant.variant_id;

  // =========================
  // Variants
  // =========================
  const variantsMap = new Map<number, any>();

  for (const row of variantRows) {
    if (!variantsMap.has(row.variant_id)) {
      variantsMap.set(row.variant_id, {
        id: row.variant_id,
        options: []
      });
    }

    if (row.dimension_key && row.value_key) {
      variantsMap.get(row.variant_id).options.push({
        dimensionKey: row.dimension_key,
        valueKey: row.value_key
      });
    }
  }

  // =========================
  // Dimensions
  // =========================
  const dimensionMap = new Map<string, any>();

  for (const row of dimensionRows) {
    if (!dimensionMap.has(row.dimension_key)) {
      dimensionMap.set(row.dimension_key, {
        key: row.dimension_key,
        label: row.dimension_label,
        values: []
      });
    }

    dimensionMap.get(row.dimension_key).values.push({
      key: row.value_key,
      label: row.value_label,
      hexColor: row.hex_color
    });
  }

  // =========================
  // Images
  // =========================
  const images = imageRows.map((r) => {
    if (r.image_type === "product") {
      return {
        id: r.image_id,
        imageKey: r.image_key,
        type: "product" as const
      };
    }

    return {
      id: r.image_id,
      imageKey: r.image_key,
      type: "variant" as const,
      signature: {
        dimensionKey: r.dimension_key,
        valueKey: r.value_key
      }
    };
  });

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    status: product.status,
    isVariant: product.is_variant,
    initialVariantId,
    category: {
      name: product.category_name,
      slugPath: product.category_slug_path
    },
    dimensions: Array.from(dimensionMap.values()),
    variants: Array.from(variantsMap.values()),
    images
  };
}

export function mapVariantDetail(row: VariantDetailRow): VariantDetailDTO {
  const isAvailable = row.product_status === "ACTIVE" && row.variant_status === "ACTIVE" && row.stock > 0;

  return {
    variantId: row.variant_id,
    price: row.price,
    stock: row.stock,
    sku: row.sku,
    currency: row.currency,
    weight: row.weight,
    weightUnit: row.weight_unit,
    isAvailable
  };
}

const SIZE_ORDER = ["xxs", "xs", "s", "m", "l", "xl", "xxl", "xxxl"];

function isSizeDimension(name: string) {
  return name.toLowerCase().includes("size");
}

function sortSizeValues(values: ProductFilterValueDTO[]) {
  // Numeric size (38, 39, 40)
  const isNumeric = values.every((v) => /^\d+$/.test(v.value));

  if (isNumeric) {
    return values.sort((a, b) => Number(a.value) - Number(b.value));
  }

  // Alpha size (XS, S, M, etc)
  return values.sort((a, b) => {
    const aIndex = SIZE_ORDER.indexOf(a.value.toLowerCase());
    const bIndex = SIZE_ORDER.indexOf(b.value.toLowerCase());

    if (aIndex === -1 && bIndex === -1) {
      return a.label.localeCompare(b.label);
    }

    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;

    return aIndex - bIndex;
  });
}

export function mapProductFilters(rows: ProductFilterRow[]): ProductFilterDimensionDTO[] {
  const map = new Map<string, ProductFilterDimensionDTO>();

  for (const r of rows) {
    if (!map.has(r.dimension_name)) {
      map.set(r.dimension_name, {
        name: r.dimension_name,
        label: r.dimension_display_name,
        values: []
      });
    }

    map.get(r.dimension_name)!.values.push({
      value: r.value_normalized,
      label: r.value_display,
      count: Number(r.product_count),
      hexColor: r.hex_color
    });
  }

  const result = Array.from(map.values());

  // 🔥 SORT PER DIMENSION
  for (const dimension of result) {
    if (isSizeDimension(dimension.name)) {
      dimension.values = sortSizeValues(dimension.values);
    } else {
      dimension.values.sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  return result;
}
