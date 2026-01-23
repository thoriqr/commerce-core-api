import { ProductStatus } from "./product.types";

export interface ProductVariantDTO {
  id: string;
  price: number;
  stock: number;
  weight: number;
  sku: string;
  isPrimary: boolean;
  options: {
    dimensionId: string;
    optionId: string;
  }[];
}

export interface ProductDetailDTO {
  productId: string;
  name: string;
  description: string;
  isVariant: boolean;
  status: ProductStatus;
  variantDimension: {
    id: string;
    name: string;
    options: {
      id: string;
      value: string;
      image:
        | {
            id: string;
            imageKey: string;
          }
        | undefined;
    }[];
  }[];
  variants: ProductVariantDTO[];
}

export interface ProductListDTO {
  productId: number;
  name: string;
  slug: string;
  isVariant: boolean;
  status: ProductStatus;
  totalStock: number;
  variantCount: number;
  minPrice: number;
  maxPrice: number;
  sku: string;
  createdAt: Date;
}
