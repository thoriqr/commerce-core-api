import { Request, Response } from "express";
import { sendSuccess } from "@/utils/send-success";
import { WarehouseService } from "./warehouse.service";
import { upsertWarehousesSchema } from "./warehouse.schema";

export class WarehouseController {
  constructor(private readonly service: WarehouseService) {}

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
