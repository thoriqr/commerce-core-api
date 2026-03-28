import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { CartItemRow, CheckoutSessionItemRow, CheckoutSessionRow } from "./checkout.types";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";

export class CheckoutRepo {
  getCartItems = async (userId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: CartItemRow[];
    }>(
      `
      SELECT
        ci.variant_id,
        ci.quantity,
        pv.price,
        pv.weight,
        p.id AS product_id,
        p.slug,
        p.name AS product_name,
        pv.stock,
        pv.option_snapshot
      FROM cart_items ci
      JOIN product_variants pv ON pv.id = ci.variant_id
      JOIN products p ON p.id = pv.product_id
      JOIN carts c ON c.id = ci.cart_id
      WHERE c.user_id = :userId
        FOR UPDATE
    `,
      { userId }
    );

    return rows;
  };

  getCheckoutSession = async (sessionId: number, userId: number) => {
    const { rows } = await db.raw<{
      rows: CheckoutSessionRow[];
    }>(
      `
    SELECT
      cs.*,

      ua.recipient_name,
      ua.phone,
      ua.address_line,
      ua.province_name,
      ua.city_name,
      ua.district_name,
      ua.postal_code

    FROM checkout_sessions cs
    LEFT JOIN user_addresses ua ON ua.id = cs.address_id

    WHERE cs.id = :sessionId
    AND cs.user_id = :userId
    `,
      { sessionId, userId }
    );

    return rows[0] ?? null;
  };

  getCheckoutSessionItems = async (sessionId: number) => {
    const { rows } = await db.raw<{
      rows: CheckoutSessionItemRow[];
    }>(
      `
    SELECT
        csi.variant_id,
        csi.product_id,
        csi.slug,
        csi.product_name,
        csi.price,
        csi.quantity,
        csi.weight,
        csi.option_snapshot,

        pv.stock,
        pv.status AS variant_status,

        p.status AS product_status

      FROM checkout_session_items csi
      JOIN product_variants pv ON pv.id = csi.variant_id
      JOIN products p ON p.id = csi.product_id
      WHERE csi.checkout_session_id = :sessionId
    `,
      { sessionId }
    );

    return rows;
  };

  getCheckoutSessionForUpdate = async (sessionId: number, userId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: CheckoutSessionRow[] }>(
      `
      SELECT
      cs.*,

      ua.recipient_name,
      ua.phone,
      ua.address_line,
      ua.province_name,
      ua.city_name,
      ua.district_name,
      ua.postal_code

    FROM checkout_sessions cs
    LEFT JOIN user_addresses ua
      ON ua.id = cs.address_id

    WHERE cs.id = :sessionId
    AND cs.user_id = :userId
    AND cs.converted_at IS NULL
    AND cs.revoked_at IS NULL

    FOR UPDATE OF cs
    `,
      { sessionId, userId }
    );

    return rows[0] ?? null;
  };

  getCheckoutSessionItemsForUpdate = async (sessionId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: CheckoutSessionItemRow[] }>(
      `
        SELECT
          csi.variant_id,
          csi.product_id,
          csi.slug,
          csi.product_name,
          csi.price,
          csi.quantity,
          csi.weight,
          csi.option_snapshot,

          pv.stock,
          pv.status AS variant_status,

          p.status AS product_status

        FROM checkout_session_items csi
        JOIN product_variants pv ON pv.id = csi.variant_id
        JOIN products p ON p.id = csi.product_id

        WHERE csi.checkout_session_id = :sessionId
        FOR UPDATE OF pv
        `,
      { sessionId }
    );

    return rows;
  };

  getDefaultAddress = async (userId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{
      rows: Array<{ id: number }>;
    }>(
      `
    SELECT id
    FROM user_addresses
    WHERE user_id = :userId
      AND is_default = true
    LIMIT 1
    `,
      { userId }
    );

    return rows[0] ?? null;
  };

  getUserAddress = async (userId: number, addressId: number) => {
    const { rows } = await db.raw<{
      rows: Array<{
        id: number;
        shipping_city_id: number;
        shipping_district_id: number | null;
      }>;
    }>(
      `
    SELECT
      id,
      shipping_city_id,
      shipping_district_id
    FROM user_addresses
    WHERE id = :addressId
    AND user_id = :userId
    `,
      { userId, addressId }
    );

    return rows[0] ?? null;
  };

  getCheckoutAddress = async (sessionId: number, userId: number) => {
    const { rows } = await db.raw<{
      rows: Array<{
        shipping_city_id: number;
        shipping_district_id: number | null;
      }>;
    }>(
      `
    SELECT
      ua.shipping_city_id,
      ua.shipping_district_id
    FROM checkout_sessions cs
    JOIN user_addresses ua ON ua.id = cs.address_id
    WHERE cs.id = :sessionId
    AND cs.user_id = :userId
    `,
      { sessionId, userId }
    );

    return rows[0] ?? null;
  };

  getCheckoutItemsWeight = async (sessionId: number) => {
    const { rows } = await db.raw<{
      rows: Array<{ weight: number; quantity: number }>;
    }>(
      `
    SELECT
      weight,
      quantity
    FROM checkout_session_items
    WHERE checkout_session_id = :sessionId
    `,
      { sessionId }
    );

    return rows;
  };

  setShippingMethod = async (
    sessionId: number,
    courierCode: string,
    courierName: string,
    courierService: string,
    courierDescription: string,
    shippingCost: number,
    shippingEtd: string,
    subtotal: number,
    total: number,
    trx: Knex.Transaction
  ) => {
    await trx.raw(
      `
    UPDATE checkout_sessions
    SET
      courier_code = :courierCode,
      courier_name = :courierName,
      courier_service = :courierService,
      courier_description = :courierDescription,
      shipping_cost = :shippingCost,
      shipping_etd = :shippingEtd,
      subtotal = :subtotal,
      total = :total
    WHERE id = :sessionId
    `,
      {
        sessionId,
        courierCode,
        courierName,
        courierService,
        courierDescription,
        shippingCost,
        shippingEtd,
        subtotal,
        total
      }
    );
  };

  updateCheckoutSessionAddress = async (sessionId: number, addressId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE checkout_sessions
    SET address_id = :addressId
    WHERE id = :sessionId
    `,
      { sessionId, addressId }
    );
  };

  insertCheckoutSessionItems = async (sessionId: number, items: CartItemRow[], trx: Knex.Transaction) => {
    const values = items
      .map(
        (i, idx) =>
          `(:sessionId, :variantId${idx}, :productId${idx}, :slug${idx}, :productName${idx}, :price${idx}, :quantity${idx}, :weight${idx}, :optionSnapshot${idx})`
      )
      .join(",");

    const bindings: any = { sessionId };

    items.forEach((item, i) => {
      bindings[`variantId${i}`] = item.variant_id;
      bindings[`productId${i}`] = item.product_id;
      bindings[`slug${i}`] = item.slug;
      bindings[`productName${i}`] = item.product_name;
      bindings[`price${i}`] = item.price;
      bindings[`quantity${i}`] = item.quantity;
      bindings[`weight${i}`] = item.weight;
      bindings[`optionSnapshot${i}`] = item.option_snapshot ? JSON.stringify(item.option_snapshot) : null;
    });

    await trx.raw(
      `
    INSERT INTO checkout_session_items
    (checkout_session_id, variant_id, product_id, slug, product_name, price, quantity, weight, option_snapshot)
    VALUES ${values}
    `,
      bindings
    );
  };

  replaceSessionItems = async (sessionId: number, items: CartItemRow[], trx: Knex.Transaction) => {
    // 1. delete old
    await trx.raw(
      `
    DELETE FROM checkout_session_items
    WHERE checkout_session_id = :sessionId
    `,
      { sessionId }
    );

    // 2. re-insert
    await this.insertCheckoutSessionItems(sessionId, items, trx);
  };

  createCheckoutSession = async (userId: number, expiresAt: Date, addressId: number | null, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: Array<{ id: number }> }>(
      `
    INSERT INTO checkout_sessions (user_id, expires_at, address_id)
    VALUES (:userId, :expiresAt, :addressId)
    RETURNING id
    `,
      {
        userId,
        expiresAt,
        addressId
      }
    );

    const row = rows[0];
    if (!row) {
      logger.error("INSERT checkout_sessions no returning row");
      throw AppError.internal();
    }

    return row.id;
  };

  getActiveSession = async (userId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
     SELECT id
      FROM checkout_sessions
      WHERE user_id = :userId
      AND converted_at IS NULL
      AND revoked_at IS NULL
      LIMIT 1
    `,
      { userId }
    );

    return rows[0] ?? null;
  };

  revokeExpiredSessions = async (userId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE checkout_sessions
    SET revoked_at = NOW()
    WHERE user_id = :userId
    AND converted_at IS NULL
    AND revoked_at IS NULL
    AND expires_at <= NOW()
    `,
      { userId }
    );
  };

  markSessionConverted = async (sessionId: number, trx: Knex.Transaction) => {
    const { rowCount } = await trx.raw(
      `
    UPDATE checkout_sessions
      SET 
      converted_at = NOW(),
      updated_at = NOW()
      WHERE id = :sessionId
      AND converted_at IS NULL
      AND revoked_at IS NULL
  `,
      { sessionId }
    );

    if (rowCount === 0) {
      throw AppError.badRequest("Session already used or invalid");
    }
  };
}
