import { Request, Response } from "express";
import { sendSuccess } from "@/utils/send-success";
import { bannerIdParams, bannerImagesQueryParams, bannerReorderSchema, bannerUpsertSchema, imageIdParams } from "./banner.schema";
import { BannerService } from "./banner.service";
import { BANNER_PLACEMENT_OPTIONS, BANNER_TARGET_TYPE_OPTIONS } from "./banner.constants";

export class BannerController {
  constructor(private service: BannerService) {}

  getAll = async (req: Request, res: Response) => {
    const data = await this.service.getAll();
    sendSuccess(res, 200, { data });
  };

  getById = async (req: Request, res: Response) => {
    const params = bannerIdParams.parse(req.params);
    const data = await this.service.getById(params.bannerId);
    sendSuccess(res, 200, { data });
  };

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

    const image = {
      id: req.body["image.id"],
      originalFileName: req.body["image.originalFileName"]
    };

    const payload = bannerUpsertSchema.parse({
      ...req.body,
      image
    });
    await this.service.update(params.bannerId, payload, file);
    sendSuccess(res, 200, { message: "Banner updated" });
  };

  reorderBanner = async (req: Request, res: Response) => {
    const payload = bannerReorderSchema.parse(req.body);
    await this.service.reorderBanner(payload);
    sendSuccess(res, 200, { message: "Banner reordered" });
  };

  remove = async (req: Request, res: Response) => {
    const params = bannerIdParams.parse(req.params);
    await this.service.remove(params.bannerId);
    sendSuccess(res, 200, { message: "Banner removed" });
  };

  getBannerImages = async (req: Request, res: Response) => {
    const qParams = bannerImagesQueryParams.parse(req.query);
    const { data, meta } = await this.service.getBannerImages(qParams);
    sendSuccess(res, 200, { data, meta });
  };

  removeBannerImage = async (req: Request, res: Response) => {
    const params = imageIdParams.parse(req.params);
    await this.service.removeBannerImage(params.imageId);
    sendSuccess(res, 200, { message: "Banner image removed" });
  };
}
