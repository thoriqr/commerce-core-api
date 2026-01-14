import { ProductStatus } from "./product.types";

export interface ProductVariantDTO {
  variantId: number;
  price: number;
  stock: number;
  weight: number;
  sku: string | null;
  isPrimary: boolean;
  options: {
    optionId: number;
    name: string;
    value: string;
  }[];
}

export interface ProductDetailDTO {
  productId: number;
  name: string;
  slug: string;
  description: string;
  isVariant: boolean;
  status: ProductStatus;
  variants: ProductVariantDTO[];
}
