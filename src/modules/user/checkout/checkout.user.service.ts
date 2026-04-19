import { TransactionManager } from "@/infra/db/transaction-manager";
import { CheckoutUserRepo } from "./checkout.user.repo";
import { AppError } from "@/errors/app-error";
import { assertCheckoutReady, assertItemsValid, assertSessionActive } from "./checkout.user.utils";
import { ProductImageService } from "@/modules/product/product-image.service";
import { findBestImage } from "@/shared/variant-image/resolver";
import { UserRepo } from "../user.repo";
import { generateOrderCode } from "../order/order.user.utils";
import { mapSessionToCreateOrderInput } from "../order/order.user.mapper";
import { OrderUserRepo } from "../order/order.user.repo";
import { ProductStockRepo } from "@/modules/product/product-stock.repo";
import { buildAddressSnapshot, mapCheckoutSession } from "./checkout.user.mapper";
import { ShippingService } from "@/modules/shipping/shipping.service";
import { CheckoutSessionItemRow } from "./checkout.user.types";
import { WarehouseRepo } from "@/modules/warehouse/warehouse.repo";

export class CheckoutUserService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly userRepo: UserRepo,
    private readonly orderUserRepo: OrderUserRepo,
    private readonly checkoutUserRepo: CheckoutUserRepo,
    private readonly shippingService: ShippingService,
    private readonly productStockRepo: ProductStockRepo,
    private readonly productImageService: ProductImageService,
    private readonly warehouseRepo: WarehouseRepo
  ) {}

  createCheckoutSession = async (userId: number) => {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return this.tm.transaction(async (trx) => {
      // 1. revoke expired → IMPORTANT (state fix)
      await this.checkoutUserRepo.revokeExpiredSessions(userId, trx);

      // 2. cart
      const items = await this.checkoutUserRepo.getCartItems(userId, trx);

      if (items.length === 0) {
        throw AppError.badRequest("Cart is empty");
      }

      // 3. existing active session
      const existing = await this.checkoutUserRepo.getActiveSession(userId, trx);

      if (existing) {
        await this.checkoutUserRepo.replaceSessionItems(existing.id, items, trx);

        const defaultAddress = await this.checkoutUserRepo.getDefaultAddress(userId, trx);

        if (defaultAddress) {
          const snapshot = buildAddressSnapshot(defaultAddress);

          await this.checkoutUserRepo.setCheckoutSessionAddressSnapshot(existing.id, snapshot, trx);
        }

        return { sessionId: existing.id };
      }

      // 4. default address
      const defaultAddress = await this.checkoutUserRepo.getDefaultAddress(userId, trx);
      const addressSnapshot = defaultAddress ? buildAddressSnapshot(defaultAddress) : null;

      // 5. create session (NOW SAFE)
      const sessionId = await this.checkoutUserRepo.createCheckoutSession(userId, expiresAt, addressSnapshot, trx);

      // 6. insert items
      await this.checkoutUserRepo.insertCheckoutSessionItems(sessionId, items, trx);

      return { sessionId };
    });
  };

  getCheckoutSession = async (userId: number, sessionId: number) => {
    const session = await this.checkoutUserRepo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    assertSessionActive(session);

    const items = await this.checkoutUserRepo.getCheckoutSessionItems(sessionId);

    const productIds = [...new Set(items.map((r) => r.product_id))];

    // image map (cache + DB)
    const imageMap = await this.productImageService.getVariantImagesBulk(productIds);

    const dto = mapCheckoutSession(session, items, imageMap);

    return dto;
  };

  setCheckoutAddress = async (userId: number, sessionId: number, addressId: number) => {
    const session = await this.checkoutUserRepo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }
    assertSessionActive(session);

    const address = await this.checkoutUserRepo.getUserAddress(userId, addressId);

    if (!address) {
      throw AppError.badRequest("Invalid address");
    }

    await this.tm.transaction(async (trx) => {
      await this.checkoutUserRepo.updateCheckoutSessionAddress(sessionId, address, trx);
    });
  };

  calculateShippingCost = async (userId: number, sessionId: number, courier: string) => {
    const session = await this.checkoutUserRepo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    assertSessionActive(session);

    const address = await this.checkoutUserRepo.getCheckoutAddress(sessionId, userId);

    if (!address || !address.shipping_district_id) {
      throw AppError.badRequest("Please select a valid address before calculating shipping");
    }

    const items = await this.checkoutUserRepo.getCheckoutItemsWeight(sessionId);

    const totalWeight = items.reduce((acc, item) => acc + item.weight * item.quantity, 0);

    const weight = Math.max(totalWeight, 1000); // minimal 1kg rule

    const result = await this.shippingService.calculateDomesticCost(address.shipping_district_id, weight, courier);

    return {
      courier,
      services: result
    };
  };

  setShippingMethod = async (userId: number, sessionId: number, courierCode: string, courierService: string) => {
    const session = await this.checkoutUserRepo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    assertSessionActive(session);

    const address = await this.checkoutUserRepo.getCheckoutAddress(sessionId, userId);

    if (!address || !address.shipping_district_id) {
      throw AppError.badRequest("Please select a valid address before choosing shipping");
    }

    const items = await this.checkoutUserRepo.getCheckoutItemsWeight(sessionId);

    const totalWeight = items.reduce((acc, item) => acc + item.weight * item.quantity, 0);

    const weight = Math.max(totalWeight, 1000);

    const services = await this.shippingService.calculateDomesticCost(address.shipping_district_id, weight, courierCode);

    const selected = services.find((s) => s.service === courierService);

    if (!selected) {
      throw AppError.badRequest("Invalid shipping service");
    }

    const fullItems = await this.checkoutUserRepo.getCheckoutSessionItems(sessionId);

    const subtotal = fullItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const total = subtotal + selected.cost;

    await this.tm.transaction(async (trx) => {
      await this.checkoutUserRepo.setShippingMethod(
        sessionId,
        courierCode,
        selected.name,
        courierService,
        selected.description,
        selected.cost,
        selected.etd,
        subtotal,
        total,
        trx
      );
    });
  };

  confirmCheckout = async (userId: number, sessionId: number) => {
    return this.tm.transaction(async (trx) => {
      // GET SESSION
      const session = await this.checkoutUserRepo.getCheckoutSessionForUpdate(sessionId, userId, trx);

      if (!session) {
        throw AppError.badRequest("Session already used or invalid");
      }

      if (session.expires_at < new Date()) {
        throw AppError.badRequest("Checkout session expired");
      }

      assertCheckoutReady(session);

      // GET ITEMS + LOCK STOCK
      const items = await this.checkoutUserRepo.getCheckoutSessionItemsForUpdate(sessionId, trx);

      if (items.length === 0) {
        throw AppError.badRequest("No items");
      }

      // VALIDATE ITEMS
      assertItemsValid(items);

      // PREPARE DATA
      const enrichedItems = await this.enrichItemsWithImages(items);

      const user = await this.userRepo.getUserById(userId, trx);

      if (!user) {
        throw AppError.notFound("User not found");
      }

      const warehouse = await this.warehouseRepo.getWarehouse(trx);

      if (!warehouse || !warehouse.shipping_district_id) {
        throw AppError.badRequest("Warehouse is not properly configured");
      }

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      const base = mapSessionToCreateOrderInput(session, userId);

      const input = {
        ...base,
        email: user.email,
        expiresAt,
        orderCode: generateOrderCode(),
        originName: warehouse.name,
        originProvinceName: warehouse.shipping_province_name,
        originCityName: warehouse.shipping_city_name,
        originDistrictName: warehouse.shipping_district_name,
        originPostalCode: warehouse.postal_code
      };

      // 7. CREATE ORDER
      const order = await this.orderUserRepo.createOrder(input, trx);

      // INSERT ITEMS
      await this.orderUserRepo.insertOrderItems(order.id, enrichedItems, trx);

      // SHIPMENT
      await this.orderUserRepo.insertShipment(
        {
          orderId: order.id,
          courierCode: session.courier_code,
          courierName: session.courier_name,
          courierService: session.courier_service,
          courierDescription: session.courier_description,
          shippingEtd: session.shipping_etd
        },
        trx
      );

      // REDUCE STOCK
      await this.productStockRepo.reduceStock(items, trx);

      // MARK SESSION
      await this.checkoutUserRepo.markSessionConverted(sessionId, trx);

      return order.order_code;
    });
  };

  private enrichItemsWithImages = async (items: CheckoutSessionItemRow[]) => {
    const productIds = [...new Set(items.map((i) => i.product_id))];

    const imageMap = await this.productImageService.getVariantImagesBulk(productIds);

    return items.map((item) => {
      const productImages = imageMap.get(item.product_id);

      const best = productImages ? (findBestImage(productImages.images, item.option_snapshot) ?? productImages.fallback) : null;

      return {
        ...item,
        image_id: best?.imageId ?? null,
        image_key: best?.imageKey ?? null
      };
    });
  };
}
