import { Knex } from "knex";

export class ProductMetricsRepo {
  incrementVariantSold = async (orderId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
      UPDATE product_variants pv
      SET sold = pv.sold + oi.quantity
      FROM order_items oi
      WHERE oi.order_id = :orderId
      AND oi.variant_id = pv.id
      `,
      { orderId }
    );
  };
}
