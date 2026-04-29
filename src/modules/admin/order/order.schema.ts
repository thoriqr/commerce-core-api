import z from "zod";

export const shipmentSchema = z.object({
  trackingNumber: z.string().min(5).max(100).meta({
    description: "Shipment tracking number (simulated)",
    example: "TRX-9F3K2L8M1N"
  })
});

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(50).default(10),

  status: z.enum(["WAITING_PAYMENT", "READY_TO_SHIP", "SHIPPED", "COMPLETED", "CANCELLED", "FAILED", "EXPIRED"]).optional(),

  paymentStatus: z.enum(["UNPAID", "PAID", "FAILED", "EXPIRED"]).optional(),

  search: z.string().trim().min(1).max(100).optional(),

  createdFrom: z.coerce.date().optional(),

  createdTo: z.coerce.date().optional()
});

export const orderIdParams = z.object({
  orderId: z.coerce.number()
});

export type GetOrdersQuery = z.infer<typeof getOrdersQuerySchema>;
