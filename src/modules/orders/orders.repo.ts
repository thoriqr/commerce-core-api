import { Knex } from "knex";
import { CheckoutSessionItemRow, CheckoutSessionRow } from "./orders.types";

export class OrdersRepo {
  getCheckoutSessionForUpdate = async (sessionId: number, userId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: CheckoutSessionRow[] }>(
      `
    SELECT *
    FROM checkout_sessions
    WHERE id = :sessionId
    AND user_id = :userId
    FOR UPDATE
    `,
      { sessionId, userId }
    );

    return rows[0] ?? null;
  };

  getCheckoutItemsForUpdate = async (sessionId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: CheckoutSessionItemRow[] }>(
      `
    SELECT
      csi.variant_id,
      csi.product_name,
      csi.price,
      csi.quantity,
      csi.weight,

      pv.stock,
      pv.status AS variant_status,
      pv.option_snapshot,
      pv.product_id,

      p.status AS product_status

    FROM checkout_session_items csi
    JOIN product_variants pv ON pv.id = csi.variant_id
    JOIN products p ON p.id = pv.product_id

    WHERE csi.checkout_session_id = :sessionId
    FOR UPDATE
    `,
      { sessionId }
    );

    return rows;
  };

  createOrder = async (input: CreateOrderInput, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: { id: number }[] }>(
      `
    INSERT INTO orders (
      user_id,
      subtotal,
      shipping_cost,
      total,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      postal_code,
      note
    )
    VALUES (
      :userId,
      :subtotal,
      :shippingCost,
      :total,
      :recipientName,
      :phone,
      :addressLine,
      :provinceName,
      :cityName,
      :districtName,
      :postalCode,
      :note
    )
    RETURNING id
    `,
      input
    );

    return rows[0].id;
  };

  insertOrderItems = async (orderId: number, items: CheckoutSessionItemRow[], trx: Knex.Transaction) => {
    const values = items
      .map((_, i) => `(:orderId, :variantId${i}, :productName${i}, :price${i}, :qty${i}, :imageKey${i}, :optionSnapshot${i})`)
      .join(",");

    const bindings: any = { orderId };

    items.forEach((item, i) => {
      bindings[`variantId${i}`] = item.variant_id;
      bindings[`productName${i}`] = item.product_name;
      bindings[`price${i}`] = item.price;
      bindings[`qty${i}`] = item.quantity;

      bindings[`imageKey${i}`] = item.image_key ?? null;

      bindings[`optionSnapshot${i}`] = JSON.stringify(item.option_snapshot ?? []);
    });

    await trx.raw(
      `
    INSERT INTO order_items (
      order_id,
      variant_id,
      product_name,
      price,
      quantity,
      image_key,
      option_snapshot
    )
    VALUES ${values}
    `,
      bindings
    );
  };

  insertShipment = async (input: ShipmentInput, trx: Knex.Transaction) => {
    await trx.raw(
      `
    INSERT INTO order_shipments (
      order_id,
      courier_code,
      courier_name,
      courier_service,
      shipping_cost,
      etd
    )
    VALUES (
      :orderId,
      :courierCode,
      :courierName,
      :courierService,
      :shippingCost,
      :etd
    )
    `,
      input
    );
  };

  reduceStock = async (items: CheckoutSessionItemRow[], trx: Knex.Transaction) => {
    for (const item of items) {
      await trx.raw(
        `
      UPDATE product_variants
      SET stock = stock - :qty
      WHERE id = :variantId
      `,
        {
          variantId: item.variant_id,
          qty: item.quantity
        }
      );
    }
  };

  deleteCheckoutSession = async (sessionId: number, userId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    DELETE FROM checkout_sessions
    WHERE id = :sessionId
    AND user_id = :userId
    `,
      { sessionId, userId }
    );
  };
}
