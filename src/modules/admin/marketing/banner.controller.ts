import { Request, Response } from "express";

import { sendSuccess } from "@/utils/send-success";
import { bannerIdParams, bannerUpsertSchema } from "./banner.schema";
import { BannerService } from "./banner.service";
import { BANNER_PLACEMENT_OPTIONS, BANNER_TARGET_TYPE_OPTIONS } from "./banner.constants";

export class BannerController {
  constructor(private service: BannerService) {}

  getOptions = async (req: Request, res: Response) => {
    sendSuccess(res, 200, {
      data: {
        placements: BANNER_PLACEMENT_OPTIONS,
        targetTypes: BANNER_TARGET_TYPE_OPTIONS
      }
    });
  };

  create = async (req: Request, res: Response) => {
    const file = req.file;

    const image = {
      id: req.body["image.id"],
      originalFileName: req.body["image.originalFileName"]
    };

    const payload = bannerUpsertSchema.parse({
      ...req.body,
      image
    });

    await this.service.create(payload, file);
    sendSuccess(res, 201, { message: "Banner created" });
  };

  update = async (req: Request, res: Response) => {
    const file = req.file;
    const params = bannerIdParams.parse(req.params);
    const payload = bannerUpsertSchema.parse(req.body);
    await this.service.update(params.bannerId, payload, file);
    sendSuccess(res, 200, { message: "Banner updated" });
  };
}
