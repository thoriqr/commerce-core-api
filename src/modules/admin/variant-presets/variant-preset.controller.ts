import { Request, Response } from "express";
import { VariantPresetService } from "./variant-preset.service";
import { sendSuccess } from "@/utils/send-success";
import { presetDimensionIdParams, presetDimensionUpsertSchema, presetDimensionValueReorderSchema } from "./variant-preset.schema";

export class VariantPresetController {
  constructor(private service: VariantPresetService) {}

  getAll = async (req: Request, res: Response) => {
    const data = await this.service.getAll();
    sendSuccess(res, 200, { data });
  };

  getById = async (req: Request, res: Response) => {
    const params = presetDimensionIdParams.parse(req.params);
    const data = await this.service.getById(params.dimensionPresetId);
    sendSuccess(res, 200, { data });
  };

  create = async (req: Request, res: Response) => {
    const payload = presetDimensionUpsertSchema.parse(req.body);
    await this.service.create(payload);
    sendSuccess(res, 201, { message: "Preset dimension created" });
  };

  update = async (req: Request, res: Response) => {
    const params = presetDimensionIdParams.parse(req.params);
    const payload = presetDimensionUpsertSchema.parse(req.body);
    await this.service.update(params.dimensionPresetId, payload);
    sendSuccess(res, 200, { message: "Preset dimension updated" });
  };

  remove = async (req: Request, res: Response) => {
    const params = presetDimensionIdParams.parse(req.params);
    await this.service.remove(params.dimensionPresetId);
    sendSuccess(res, 200, { message: "Preset dimension removed" });
  };

  reorderDimensionValues = async (req: Request, res: Response) => {
    const payload = presetDimensionValueReorderSchema.parse(req.body);
    await this.service.reorderDimensionValues(payload);
    sendSuccess(res, 200, { message: "Preset dimension value reordered" });
  };
}
