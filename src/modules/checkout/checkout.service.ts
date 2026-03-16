import { TransactionManager } from "@/infra/db/transaction-manager";
import { CheckoutRepo } from "./checkout.repo";
import { ShippingService } from "../shipping/shipping.service";
import { AppError } from "@/errors/app-error";
import { mapSessionItem } from "./checkout.mapper";

export class CheckoutService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: CheckoutRepo,
    private readonly shippingService: ShippingService
  ) {}

  createCheckoutSession = async (userId: number) => {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    return this.tm.transaction(async (trx) => {
      const items = await this.repo.getCartItems(userId, trx);

      if (items.length === 0) {
        throw AppError.badRequest("Cart is empty");
      }

      await this.repo.deleteActiveSessions(userId, trx);

      const sessionId = await this.repo.createCheckoutSession(userId, expiresAt, trx);

      await this.repo.insertCheckoutSessionItems(sessionId, items, trx);

      return { sessionId };
    });
  };

  getCheckoutSession = async (userId: number, sessionId: number) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    if (session.expires_at < new Date()) {
      throw AppError.badRequest("Checkout session expired");
    }

    const items = await this.repo.getCheckoutSessionItems(sessionId);

    const mappedItems = mapSessionItem(items);

    const subtotal = mappedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    const totalWeight = mappedItems.reduce((acc, item) => acc + item.weight * item.quantity, 0);

    return {
      sessionId: session.id,
      expiresAt: session.expires_at,
      subtotal,
      totalWeight,
      addressId: session.address_id,
      courierCode: session.courier_code,
      courierService: session.courier_service,
      items: mappedItems
    };
  };

  setCheckoutAddress = async (userId: number, sessionId: number, addressId: number) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    if (session.expires_at < new Date()) {
      throw AppError.badRequest("Checkout session expired");
    }

    const address = await this.repo.getUserAddress(userId, addressId);

    if (!address) {
      throw AppError.badRequest("Invalid address");
    }

    await this.tm.transaction(async (trx) => {
      await this.repo.updateCheckoutSessionAddress(sessionId, addressId, trx);
    });
  };

  calculateShippingCost = async (userId: number, sessionId: number, courier: string) => {
    const session = await this.repo.getCheckoutSession(sessionId, userId);

    if (!session) {
      throw AppError.notFound("Checkout session not found");
    }

    if (session.expires_at < new Date()) {
      throw AppError.badRequest("Checkout session expired");
    }

    const address = await this.repo.getCheckoutAddress(sessionId, userId);

    if (!address) {
      throw AppError.badRequest("Address not set");
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

    if (session.expires_at < new Date()) {
      throw AppError.badRequest("Checkout session expired");
    }

    const address = await this.repo.getCheckoutAddress(sessionId, userId);

    if (!address) {
      throw AppError.badRequest("Address not set");
    }

    const items = await this.repo.getCheckoutItemsWeight(sessionId);

    const totalWeight = items.reduce((acc, item) => acc + item.weight * item.quantity, 0);

    const weight = Math.max(totalWeight, 1000);

    const services = await this.shippingService.calculateDomesticCost(address.shipping_city_id, weight, courierCode);

    const selected = services.find((s) => s.service === courierService);

    if (!selected) {
      throw AppError.badRequest("Invalid shipping service");
    }

    await this.tm.transaction(async (trx) => {
      await this.repo.setShippingMethod(sessionId, courierCode, courierService, selected.cost, trx);
    });
  };
}
