import z from "zod";
import { MAX_CART_ITEM_QTY } from "./cart.constants";

export const addItemSchema = z.object({
  variantId: z.coerce.number().int().positive().meta({
    description: "Product variant ID",
    example: 101
  }),

  quantity: z.coerce.number().int().positive().max(MAX_CART_ITEM_QTY).meta({
    description: "Quantity to add",
    example: 1
  })
});

export const updateCartItemSchema = z.object({
  variantId: z.coerce.number().int().positive(),

  quantity: z.coerce.number().int().min(0).max(MAX_CART_ITEM_QTY).meta({
    description: "Updated quantity (0 to remove item)",
    example: 2
  })
});
export const deleteCartItemSchema = z.object({
  variantId: z.coerce.number().int().positive()
});
