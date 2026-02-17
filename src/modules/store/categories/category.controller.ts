import { Request, Response } from "express";

import { sendStoreResponse } from "@/utils/send-store-response";
import { CategoryService } from "./category.service";
import { categorySlugPathQueryParams } from "./category.schema";

export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  getMegaMenu = async (req: Request, res: Response) => {
    const { dto, etag } = await this.service.getMegaMenu();

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 300
    });
  };

  getPopular = async (req: Request, res: Response) => {
    const { dto, etag } = await this.service.getPopular();

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 300
    });
  };

  getDetail = async (req: Request, res: Response) => {
    const qParams = categorySlugPathQueryParams.parse(req.query);

    const { dto, etag } = await this.service.getCategoryDetail(qParams.slugPath);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 300
    });
  };

  getFilters = async (req: Request, res: Response) => {
    const qParams = categorySlugPathQueryParams.parse(req.query);

    const { nodes, etag } = await this.service.getCategoryFilters(qParams.slugPath);

    sendStoreResponse({
      req,
      res,
      data: nodes,
      etag,
      maxAge: 300
    });
  };
}
