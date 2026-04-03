import { Knex } from "knex";
import { CartItemRow, CheckoutSessionItemRow, CheckoutSessionRow, DefaultAddressRow } from "./checkout.user.types";
import { db } from "@/infra/db/knex";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";

export class CheckoutUserRepo {
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
    SELECT *
    FROM checkout_sessions
    WHERE id = :sessionId
    AND user_id = :userId
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
    SELECT *
    FROM checkout_sessions
    WHERE id = :sessionId
      AND user_id = :userId
      AND converted_at IS NULL
      AND revoked_at IS NULL
    FOR UPDATE
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
      rows: DefaultAddressRow[];
    }>(
      `
    SELECT 
      id,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      postal_code,
      shipping_city_id,
      shipping_district_id
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
        recipient_name: string;
        phone: string;
        address_line: string;
        province_name: string;
        city_name: string;
        district_name: string;
        postal_code: string | null;
        shipping_city_id: number;
        shipping_district_id: number | null;
      }>;
    }>(
      `
    SELECT
      id,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      postal_code,
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
        shipping_city_id: number | null;
        shipping_district_id: number | null;
      }>;
    }>(
      `
    SELECT
      shipping_city_id,
      shipping_district_id
    FROM checkout_sessions
    WHERE id = :sessionId
      AND user_id = :userId
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

  updateCheckoutSessionAddress = async (
    sessionId: number,
    address: {
      id: number;
      recipient_name: string;
      phone: string;
      address_line: string;
      province_name: string;
      city_name: string;
      district_name: string;
      postal_code: string | null;
      shipping_city_id: number;
      shipping_district_id: number | null;
    },
    trx: Knex.Transaction
  ) => {
    await trx.raw(
      `
    UPDATE checkout_sessions
    SET
      address_id = :addressId,
      recipient_name = :recipientName,
      phone = :phone,
      address_line = :addressLine,
      province_name = :provinceName,
      city_name = :cityName,
      district_name = :districtName,
      postal_code = :postalCode,
      shipping_city_id = :shippingCityId,
      shipping_district_id = :shippingDistrictId
    WHERE id = :sessionId
    `,
      {
        sessionId,
        addressId: address.id,
        recipientName: address.recipient_name,
        phone: address.phone,
        addressLine: address.address_line,
        provinceName: address.province_name,
        cityName: address.city_name,
        districtName: address.district_name,
        postalCode: address.postal_code,
        shippingCityId: address.shipping_city_id,
        shippingDistrictId: address.shipping_district_id
      }
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

  createCheckoutSession = async (
    userId: number,
    expiresAt: Date,
    address: {
      address_id: number | null;
      recipient_name: string;
      phone: string;
      address_line: string;
      province_name: string;
      city_name: string;
      district_name: string;
      postal_code: string | null;
      shipping_city_id: number | null;
      shipping_district_id: number | null;
    } | null,
    trx: Knex.Transaction
  ) => {
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    INSERT INTO checkout_sessions (
      user_id,
      expires_at,
      address_id,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      postal_code,
      shipping_city_id,
      shipping_district_id
    )
    VALUES (
      :userId,
      :expiresAt,
      :addressId,
      :recipientName,
      :phone,
      :addressLine,
      :provinceName,
      :cityName,
      :districtName,
      :postalCode,
      :shippingCityId,
      :shippingDistrictId
    )
    RETURNING id
  `,
      {
        userId,
        expiresAt,
        addressId: address?.address_id ?? null,
        recipientName: address?.recipient_name ?? null,
        phone: address?.phone ?? null,
        addressLine: address?.address_line ?? null,
        provinceName: address?.province_name ?? null,
        cityName: address?.city_name ?? null,
        districtName: address?.district_name ?? null,
        postalCode: address?.postal_code ?? null,
        shippingCityId: address?.shipping_city_id ?? null,
        shippingDistrictId: address?.shipping_district_id ?? null
      }
    );

    const row = rows[0];
    if (!row) {
      logger.error("INSERT checkout_sessions no returning row");
      throw AppError.internal();
    }

    return row.id;
  };

  setCheckoutSessionAddressSnapshot = async (
    sessionId: number,
    address: {
      address_id: number;
      recipient_name: string;
      phone: string;
      address_line: string;
      province_name: string;
      city_name: string;
      district_name: string;
      postal_code: string | null;
      shipping_city_id: number;
      shipping_district_id: number | null;
    },
    trx: Knex.Transaction
  ) => {
    await trx.raw(
      `
    UPDATE checkout_sessions
    SET
      address_id = :addressId,
      recipient_name = :recipientName,
      phone = :phone,
      address_line = :addressLine,
      province_name = :provinceName,
      city_name = :cityName,
      district_name = :districtName,
      postal_code = :postalCode,
      shipping_city_id = :shippingCityId,
      shipping_district_id = :shippingDistrictId
    WHERE id = :sessionId
    `,
      {
        sessionId,
        addressId: address.address_id,
        recipientName: address.recipient_name,
        phone: address.phone,
        addressLine: address.address_line,
        provinceName: address.province_name,
        cityName: address.city_name,
        districtName: address.district_name,
        postalCode: address.postal_code,
        shippingCityId: address.shipping_city_id,
        shippingDistrictId: address.shipping_district_id
      }
    );
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
