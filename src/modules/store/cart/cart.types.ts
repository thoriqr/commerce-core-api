import { ProductStatus, ProductVariantStatus } from "@/shared/product/product.types";

export type ResolveCartResult = {
  cartId: string;
  created: boolean;
};

export type CartRow = {
  id: string;
  user_id: number | null;
};

export type OptionSnapshot = { dimension: string; value: string };

export type CartItemRow = {
  variant_id: number;
  product_id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  quantity: number;
  image_key: string | null;
  option_snapshot: OptionSnapshot[] | null;
  product_status: ProductStatus;
  variant_status: ProductVariantStatus;
};
