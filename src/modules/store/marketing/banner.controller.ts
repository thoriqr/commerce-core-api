import { Request, Response } from "express";
import { bannerQueryParams } from "./banner.schema";
import { BannerService } from "./banner.service";
import { sendStoreResponse } from "@/utils/send-store-response";

export class BannerController {
  constructor(private service: BannerService) {}

  getBanners = async (req: Request, res: Response) => {
    const qParams = bannerQueryParams.parse(req.query);
    const { resolved, etag } = await this.service.getActiveByPlacement(qParams);
    sendStoreResponse({
      req,
      res,
      data: resolved,
      etag,
      maxAge: 60
    });
  };
}
