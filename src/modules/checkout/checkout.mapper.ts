import { ImageSignature } from "@/shared/variant-image/types";
import { CheckoutSessionDTO } from "./checkout.dto";
import { SessionItemRow, SessionRow } from "./checkout.types";
import { findBestImage } from "@/shared/variant-image/resolver";

function resolveCheckoutState(items: ReturnType<typeof mapSessionItem>, sessionRow: SessionRow, hasAddress: boolean) {
  // 1. items
  for (const item of items) {
    if (!item.isAvailable) {
      return { canPlaceOrder: false, reason: "INVALID_ITEMS" as const };
    }

    if (item.warning === "INSUFFICIENT_STOCK") {
      return { canPlaceOrder: false, reason: "INVALID_ITEMS" as const };
    }
  }

  // 2. address
  if (!hasAddress) {
    return { canPlaceOrder: false, reason: "NO_ADDRESS" as const };
  }

  // 3. shipping
  if (!sessionRow.courier_code || !sessionRow.courier_service) {
    return { canPlaceOrder: false, reason: "NO_SHIPPING" as const };
  }

  if (!sessionRow.shipping_cost) {
    return { canPlaceOrder: false, reason: "SHIPPING_NOT_CALCULATED" as const };
  }

  return { canPlaceOrder: true, reason: null };
}

export function mapSessionItem(
  rows: SessionItemRow[],
  imageMap: Map<
    number,
    {
      images: ImageSignature[];
      fallback: {
        imageId: number;
        imageKey: string;
      } | null;
    }
  >
) {
  return rows.map((r) => {
    const productImages = imageMap.get(r.product_id);
    const best = productImages ? (findBestImage(productImages.images, r.option_snapshot) ?? productImages.fallback) : null;

    const imageKey = best?.imageKey ?? null;

    const variantActive = r.variant_status === "ACTIVE";
    const productActive = r.product_status === "ACTIVE";

    const isAvailable = variantActive && productActive;

    let warning: string | null = null;

    if (!isAvailable) {
      warning = "UNAVAILABLE";
    } else if (r.quantity > r.stock) {
      warning = "INSUFFICIENT_STOCK";
    }

    return {
      variantId: r.variant_id,
      productId: r.product_id,
      productName: r.product_name,
      imageKey,
      slug: r.slug,
      price: r.price,
      quantity: r.quantity,
      stock: r.stock,
      weight: r.weight,
      options: r.option_snapshot ?? [],
      isAvailable,
      warning
    };
  });
}

export function mapUserAddress(sessionRow: SessionRow) {
  return {
    id: sessionRow.address_id,
    recipientName: sessionRow.recipient_name,
    phone: sessionRow.phone,
    addressLine: sessionRow.address_line,
    provinceName: sessionRow.province_name,
    cityName: sessionRow.city_name,
    districtName: sessionRow.district_name ?? "",
    postalCode: sessionRow.postal_code ?? ""
  };
}

export function mapCheckoutSession(
  sessionRow: SessionRow,
  sessionItemRow: SessionItemRow[],
  imageMap: Map<
    number,
    {
      images: ImageSignature[];
      fallback: {
        imageId: number;
        imageKey: string;
      } | null;
    }
  >
): CheckoutSessionDTO {
  const mappedItems = mapSessionItem(sessionItemRow, imageMap);

  const totalWeight = mappedItems.reduce((acc, item) => acc + item.weight * item.quantity, 0);

  // temporary subtotal (fallback)
  const computedSubtotal = mappedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const subtotal = sessionRow.subtotal ?? computedSubtotal;
  const shippingCost = sessionRow.shipping_cost ?? 0;
  const total = sessionRow.total ?? 0;

  const address = sessionRow.address_id && sessionRow.recipient_name ? mapUserAddress(sessionRow) : null;

  const { canPlaceOrder, reason } = resolveCheckoutState(mappedItems, sessionRow, !!address);

  return {
    sessionId: sessionRow.id,
    expiresAt: sessionRow.expires_at,

    subtotal,
    shippingCost,
    total,

    totalWeight,

    address,

    courierCode: sessionRow.courier_code,
    courierName: sessionRow.courier_name,
    courierService: sessionRow.courier_service,
    shippingEtd: sessionRow.shipping_etd,
    items: mappedItems,
    canPlaceOrder,
    reason
  };
}
