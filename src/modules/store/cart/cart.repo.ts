import { AppError } from "@/errors/app-error";
import { db } from "@/infra/db/knex";
import { logger } from "@/libs/logger";
import { Knex } from "knex";
import { CartRow } from "./cart.types";
import { MAX_CART_ITEM_QTY } from "./cart.constants";

export class CartRepo {
  async findCartById(cartId: string, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: { id: string; user_id: number | null }[];
    }>(
      `
    SELECT id, user_id
    FROM carts
    WHERE id = :cartId
    `,
      { cartId }
    );

    return rows[0] ?? null;
  }

  async findCartByUserId(userId: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: CartRow[];
    }>(
      `
    SELECT id, user_id
    FROM carts
    WHERE user_id = :userId
    `,
      { userId }
    );

    return rows[0] ?? null;
  }

  async createCart(userId: number | null = null, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: CartRow[];
    }>(
      `
    INSERT INTO carts (user_id)
    VALUES (:userId)
    RETURNING id, user_id
    `,
      { userId }
    );

    const row = rows[0];

    if (!row) {
      logger.error("Insert carts returned no rows");
      throw AppError.internal();
    }

    return row;
  }

  async findCartItems(cartId: string, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: {
        variant_id: number;
        product_id: number;
        name: string;
        slug: string;
        price: number;
        quantity: number;
        image_key: string | null;
      }[];
    }>(
      `
    SELECT
      ci.variant_id,
      p.id AS product_id,
      p.name,
      p.slug,
      v.price,
      ci.quantity,
      im.image_key

    FROM cart_items ci

    JOIN product_variants v
      ON v.id = ci.variant_id

    JOIN products p
      ON p.id = v.product_id

    LEFT JOIN product_images pi
      ON pi.product_id = p.id
     AND pi.sort_order = 1
     AND pi.is_orphan = false

    LEFT JOIN images_metadata im
      ON im.id = pi.image_id

    WHERE ci.cart_id = :cartId
    `,
      { cartId }
    );

    return rows;
  }

  async findVariantForCart(variantId: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: {
        id: number;
        product_id: number;
        price: number;
        status: string;
      }[];
    }>(
      `
    SELECT
      id,
      product_id,
      price,
      status
    FROM product_variants
    WHERE id = :variantId
    `,
      { variantId }
    );

    return rows[0] ?? null;
  }

  async upsertCartItem(cartId: string, variantId: number, quantity: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    await executor.raw(
      `
    INSERT INTO cart_items (
      cart_id,
      variant_id,
      quantity
    )
    VALUES (
      :cartId,
      :variantId,
      :quantity
    )
    ON CONFLICT (cart_id, variant_id)
    DO UPDATE
    SET quantity = LEAST(cart_items.quantity + EXCLUDED.quantity, :maxQty)
    WHERE cart_items.quantity < :maxQty
    `,
      {
        cartId,
        variantId,
        quantity,
        maxQty: MAX_CART_ITEM_QTY
      }
    );
  }

  async updateCartItemQuantity(cartId: string, variantId: number, quantity: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    if (quantity <= 0) {
      await executor.raw(
        `
      DELETE FROM cart_items
      WHERE cart_id = :cartId
        AND variant_id = :variantId
      `,
        { cartId, variantId }
      );

      return;
    }

    await executor.raw(
      `
    UPDATE cart_items
    SET quantity = :quantity,
        updated_at = NOW()
    WHERE cart_id = :cartId
      AND variant_id = :variantId
    `,
      {
        cartId,
        variantId,
        quantity
      }
    );
  }

  async deleteCartItem(cartId: string, variantId: number, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    await executor.raw(
      `
    DELETE FROM cart_items
    WHERE cart_id = :cartId
      AND variant_id = :variantId
    `,
      { cartId, variantId }
    );
  }

  async deleteCart(cartId: string, trx?: Knex.Transaction) {
    const executor = trx ?? db;

    await executor.raw(
      `
    DELETE FROM carts
    WHERE id = :cartId
    `,
      { cartId }
    );
  }
}
