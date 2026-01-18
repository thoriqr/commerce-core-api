import { ProductStatus } from "./product.types";

export interface ProductVariantDTO {
  id: string;
  price: number;
  stock: number;
  weight: number;
  sku: string | null;
  isPrimary: boolean;
  options: {
    dimensionId: string;
    optionId: string;
  }[];
}

export interface ProductDetailDTO {
  productId: number;
  name: string;
  slug: string;
  description: string;
  isVariant: boolean;
  status: ProductStatus;
  variantDimension: {
    id: string;
    name: string;
    options: {
      id: string;
      value: string;
    }[];
  }[];
  variants: ProductVariantDTO[];
}
