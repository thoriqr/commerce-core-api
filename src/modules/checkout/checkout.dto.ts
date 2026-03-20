import { OptionSnapshot } from "@/shared/variant-image/types";
import { CheckoutBlockReason } from "./checkout.types";

export interface CheckoutSessionDTO {
  sessionId: number;
  expiresAt: Date;
  subtotal: number;
  shippingCost: number;
  total: number;
  totalWeight: number;
  address: {
    id: number | null;
    recipientName: string | null;
    phone: string | null;
    addressLine: string | null;
    provinceName: string | null;
    cityName: string | null;
    districtName: string | null;
    postalCode: string | null;
  } | null;
  courierCode: string | null;
  courierName: string | null;
  courierService: string | null;
  shippingEtd: string | null;
  items: {
    variantId: number;
    productId: number;
    productName: string;
    slug: string;
    price: number;
    quantity: number;
    stock: number;
    weight: number;
    isAvailable: boolean;
    imageKey: string | null;
    warning: string | null;
    options: OptionSnapshot[] | null;
  }[];
  canPlaceOrder: boolean;
  reason: CheckoutBlockReason | null;
}
