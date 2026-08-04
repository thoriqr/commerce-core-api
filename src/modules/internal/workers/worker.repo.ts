import { db } from "@/infra/db/knex";
import { Knex } from "knex";

export class WorkerRepo {
  async expireOrders(trx: Knex.Transaction) {
    // 1. Select expired unpaid orders with row-level lock
    const { rows } = await trx.raw<{
      rows: { id: number }[];
    }>(`
      SELECT id
      FROM orders
      WHERE
        payment_status = 'UNPAID'
        AND status = 'PENDING'
        AND expires_at < NOW()
      ORDER BY expires_at ASC, id ASC
      LIMIT 500
      FOR UPDATE SKIP LOCKED
    `);

    if (rows.length === 0) {
      return {
        affected: 0
      };
    }

    const orderIds = rows.map((row) => row.id);

    // 2. Release stock
    await trx.raw(
      `
      UPDATE product_variants pv
      SET stock = pv.stock + oi.total_qty
      FROM (
        SELECT variant_id, SUM(quantity) AS total_qty
        FROM order_items
        WHERE order_id = ANY(:orderIds)
        GROUP BY variant_id
      ) oi
      WHERE pv.id = oi.variant_id
      `,
      { orderIds }
    );

    // 3. Update orders
    await trx.raw(
      `
      UPDATE orders
      SET
        payment_status = 'EXPIRED',
        status = 'CANCELLED',
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id = ANY(:orderIds)
      `,
      { orderIds }
    );

    return {
      affected: orderIds.length
    };
  }

  async cleanupExpiredUserSessions() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      DELETE FROM user_sessions
      WHERE id IN (
        SELECT id
        FROM user_sessions
        WHERE
          (
            revoked_at IS NOT NULL
            AND revoked_at < NOW() - INTERVAL '7 days'
          )
          OR (
            last_used_at < NOW() - INTERVAL '90 days'
          )
        ORDER BY last_used_at ASC, id ASC
        LIMIT 500
      )
      RETURNING id
    `);

    return {
      deleted: rows.length
    };
  }

  async cleanupPendingVerifications() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      DELETE FROM pending_verifications
      WHERE id IN (
        SELECT id
        FROM pending_verifications
        WHERE
          used_at IS NULL
          AND expires_at < NOW()
        ORDER BY expires_at ASC, id ASC
        LIMIT 500
      )
      RETURNING id
    `);

    return {
      deleted: rows.length
    };
  }

  async cleanupCheckoutSessions() {
    const { rows } = await db.raw<{
      rows: { id: number }[];
    }>(`
      DELETE FROM checkout_sessions
      WHERE id IN (
        SELECT id
        FROM checkout_sessions
        WHERE
          (
            converted_at IS NULL
            AND expires_at < NOW()
          )
          OR (
            converted_at IS NOT NULL
            AND converted_at < NOW() - INTERVAL '1 hour'
          )
          OR (
            revoked_at IS NOT NULL
            AND revoked_at < NOW() - INTERVAL '1 hour'
          )
        ORDER BY expires_at ASC, id ASC
        LIMIT 500
      )
      RETURNING id
    `);

    return {
      deleted: rows.length
    };
  }

  async cleanupOrphanProductImages() {
    const { rows } = await db.raw<{
      rows: { id: number; image_key: string }[];
    }>(`
    DELETE FROM product_images pi
    USING images_metadata im
    WHERE pi.id IN (
      SELECT pi2.id
      FROM product_images pi2
      WHERE
        pi2.is_orphan = true
        AND pi2.created_at < NOW() - INTERVAL '6 hours'

        AND NOT EXISTS (
          SELECT 1
          FROM order_items oi
          WHERE oi.image_id = pi2.image_id
        )

      ORDER BY pi2.created_at ASC, pi2.id ASC
      LIMIT 50
    )
    AND pi.image_id = im.id
    RETURNING pi.id, im.image_key
  `);

    return rows;
  }

  async cleanupOrphanVariantImages() {
    const { rows } = await db.raw<{
      rows: { id: number; image_key: string }[];
    }>(`
    DELETE FROM product_variant_images pvi
    USING images_metadata im
    WHERE pvi.id IN (
      SELECT pvi2.id
      FROM product_variant_images pvi2
      WHERE
        pvi2.is_orphan = true
        AND pvi2.created_at < NOW() - INTERVAL '6 hours'

        AND NOT EXISTS (
          SELECT 1
          FROM order_items oi
          WHERE oi.image_id = pvi2.image_id
        )

      ORDER BY pvi2.created_at ASC, pvi2.id ASC
      LIMIT 50
    )
    AND pvi.image_id = im.id
    RETURNING pvi.id, im.image_key
  `);

    return rows;
  }
}
