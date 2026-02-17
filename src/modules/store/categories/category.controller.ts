import { Request, Response } from "express";

import { sendStoreResponse } from "@/utils/send-store-reponse";
import { CategoryService } from "./category.service";
import { categorySlugPathQueryParams } from "./category.schema";

export class CategoryController {
  constructor(private readonly service: CategoryService) {}

  getMegaMenu = async (req: Request, res: Response) => {
    const { nodes, etag } = await this.service.getMegaMenu();

    sendStoreResponse({
      req,
      res,
      data: nodes,
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

  getBreadcrumb = async (req: Request, res: Response) => {
    const qParams = categorySlugPathQueryParams.parse(req.query);

    const { dto, etag } = await this.service.getBreadcrumb(qParams.slugPath);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 300
    });
  };

  getMetadata = async (req: Request, res: Response) => {
    const qParams = categorySlugPathQueryParams.parse(req.query);

    const { data, etag } = await this.service.getMetadata(qParams.slugPath);

    sendStoreResponse({
      req,
      res,
      data,
      etag,
      maxAge: 300
    });
  };
}
