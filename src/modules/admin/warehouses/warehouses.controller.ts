import { Request, Response } from "express";
import { sendSuccess } from "@/utils/send-success";
import { WarehousesService } from "./warehouses.service";
import { upsertWarehousesSchema } from "./warehouses.schema";

export class WarehousesController {
  constructor(private readonly service: WarehousesService) {}

  getWarehouse = async (req: Request, res: Response) => {
    const data = await this.service.getWarehouse();

    sendSuccess(res, 200, { data });
  };

  upsertWarehouse = async (req: Request, res: Response) => {
    const payload = upsertWarehousesSchema.parse(req.body);
    await this.service.upsertWarehouse(payload);

    sendSuccess(res, 200, { message: "Warehouse saved" });
  };
}
