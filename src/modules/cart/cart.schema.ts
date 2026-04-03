import z from "zod";
import { MAX_CART_ITEM_QTY } from "./cart.constants";

export const addItemSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().positive().max(MAX_CART_ITEM_QTY)
});

export const updateCartItemSchema = z.object({
  variantId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(0).max(MAX_CART_ITEM_QTY)
});

export const deleteCartItemSchema = z.object({
  variantId: z.coerce.number().int().positive()
});
