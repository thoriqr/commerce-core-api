import { OptionSnapshot } from "@/shared/variant-image/types";
import { CheckoutBlockReason } from "./checkout.user.types";

export interface CheckoutSessionDTO {
  sessionId: number;
  expiresAt: Date;
  subtotal: number;
  shippingCost: number;
  total: number;
  totalWeight: number;
  address: {
    id: number | null;
    recipientName: string;
    phone: string;
    addressLine: string;
    provinceName: string;
    cityName: string;
    districtName: string;
    postalCode: string;
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
    options: OptionSnapshot[];
  }[];
  canPlaceOrder: boolean;
  reason: CheckoutBlockReason | null;
}
