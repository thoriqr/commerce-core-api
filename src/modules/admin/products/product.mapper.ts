import { ProductDetailDTO, ProductVariantDTO } from "./product.dto";
import { ProductDetailRow, VariantDimensionRow, VariantDimensionValueRow, VariantOptionValueRow, VariantRow } from "./product.types";

export function mapProductDetail(
  productRow: ProductDetailRow,
  variantRows: VariantRow[],
  dimensionRows: VariantDimensionRow[],
  dimensionValueRows: VariantDimensionValueRow[],
  optionValueRows: VariantOptionValueRow[]
): ProductDetailDTO {}
