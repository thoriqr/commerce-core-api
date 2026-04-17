import { OptionSnapshot } from "@/shared/variant-image/types";

export type CartItemDTO = {
  variantId: number;
  productId: number;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  stock: number;
  imageKey: string | null;
  options: OptionSnapshot[];
  isAvailable: boolean;
  warning: string | null;
};
