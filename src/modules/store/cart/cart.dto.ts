import { OptionSnapshot } from "./cart.types";

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
  stockWarning: "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | null;
};
