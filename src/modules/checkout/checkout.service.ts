import { TransactionManager } from "@/infra/db/transaction-manager";
import { CheckoutRepo } from "./checkout.repo";
import { ShippingService } from "../shipping/shipping.service";
import { AppError } from "@/errors/app-error";
import { buildAddressSnapshot, mapCheckoutSession } from "./checkout.mapper";
import { ProductImageService } from "../product/product-image.service";
import { assertSessionActive } from "./checkout.util";

export class CheckoutService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: CheckoutRepo,
    private readonly shippingService: ShippingService,
    private readonly productImageService: ProductImageService
  ) {}

  createCheckoutSession = async (userId: number) => {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return this.tm.transaction(async (trx) => {
      // 1. revoke expired → IMPORTANT (state fix)
      await this.repo.revokeExpiredSessions(userId, trx);

      // 2. cart
      const items = await this.repo.getCartItems(userId, trx);

      if (items.length === 0) {
        throw AppError.badRequest("Cart is empty");
      }

      // 3. existing active session
      const existing = await this.repo.getActiveSession(userId, trx);

      if (existing) {
        await this.repo.replaceSessionItems(existing.id, items, trx);

        const defaultAddress = await this.repo.getDefaultAddress(userId, trx);

        if (defaultAddress) {
          const snapshot = buildAddressSnapshot(defaultAddress);

          await this.repo.setCheckoutSessionAddressSnapshot(existing.id, snapshot, trx);
        }

        return { sessionId: existing.id };
      }

      // 4. default address
      const defaultAddress = await this.repo.getDefaultAddress(userId, trx);
      const addressSnapshot = defaultAddress ? buildAddressSnapshot(defaultAddress) : null;

      // 5. create session (NOW SAFE)
      const sessionId = await this.repo.createCheckoutSession(userId, expiresAt, addressSnapshot, trx);

      // 6. insert items
      await this.repo.insertCheckoutSessionItems(sessionId, items, trx);

      return { sessionId };
    });
  };

  getCheckoutSession = async (userId: number, sessionId: number) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    assertSessionActive(session);

    const items = await this.repo.getCheckoutSessionItems(sessionId);

    const productIds = [...new Set(items.map((r) => r.product_id))];

    // image map (cache + DB)
    const imageMap = await this.productImageService.getVariantImagesBulk(productIds);

    const dto = mapCheckoutSession(session, items, imageMap);

    return dto;
  };

  setCheckoutAddress = async (userId: number, sessionId: number, addressId: number) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }
    assertSessionActive(session);

    const address = await this.repo.getUserAddress(userId, addressId);

    if (!address) {
      throw AppError.badRequest("Invalid address");
    }

    await this.tm.transaction(async (trx) => {
      await this.repo.updateCheckoutSessionAddress(sessionId, address, trx);
    });
  };

  calculateShippingCost = async (userId: number, sessionId: number, courier: string) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    assertSessionActive(session);

    const address = await this.repo.getCheckoutAddress(sessionId, userId);

    if (!address || !address.shipping_city_id) {
      throw AppError.badRequest("Please select a valid address before calculating shipping");
    }

    const items = await this.repo.getCheckoutItemsWeight(sessionId);

    const totalWeight = items.reduce((acc, item) => acc + item.weight * item.quantity, 0);

    const weight = Math.max(totalWeight, 1000); // minimal 1kg rule

    const result = await this.shippingService.calculateDomesticCost(address.shipping_city_id, weight, courier);

    return {
      courier,
      services: result
    };
  };

  setShippingMethod = async (userId: number, sessionId: number, courierCode: string, courierService: string) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    assertSessionActive(session);

    const address = await this.repo.getCheckoutAddress(sessionId, userId);

    if (!address || !address.shipping_city_id) {
      throw AppError.badRequest("Please select a valid address before choosing shipping");
    }

    const items = await this.repo.getCheckoutItemsWeight(sessionId);

    const totalWeight = items.reduce((acc, item) => acc + item.weight * item.quantity, 0);

    const weight = Math.max(totalWeight, 1000);

    const services = await this.shippingService.calculateDomesticCost(address.shipping_city_id, weight, courierCode);

    const selected = services.find((s) => s.service === courierService);

    if (!selected) {
      throw AppError.badRequest("Invalid shipping service");
    }

    const fullItems = await this.repo.getCheckoutSessionItems(sessionId);

    const subtotal = fullItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const total = subtotal + selected.cost;

    await this.tm.transaction(async (trx) => {
      await this.repo.setShippingMethod(
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
}
