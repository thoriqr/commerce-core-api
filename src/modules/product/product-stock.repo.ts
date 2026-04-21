import { AppError } from "@/errors/app-error";
import { Knex } from "knex";
import { CheckoutSessionItemRow } from "../user/checkout/checkout.user.types";

export class ProductStockRepo {
  reduceStock = async (items: CheckoutSessionItemRow[], trx: Knex.Transaction) => {
    for (const item of items) {
      const result = await trx.raw(
        `
        UPDATE product_variants
        SET stock = stock - :qty
        WHERE id = :variantId
        AND stock >= :qty
        `,
        {
          variantId: item.variant_id,
          qty: item.quantity
        }
      );

      if (result.rowCount === 0) {
        throw AppError.badRequest("Stock changed, please retry checkout");
      }
    }
  };
}
