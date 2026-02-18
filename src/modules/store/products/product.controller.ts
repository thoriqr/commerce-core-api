import { Request, Response } from "express";
import { sendStoreResponse } from "@/utils/send-store-response";
import { productByCategoryQueryParams } from "./product.schema";
import { ProductService } from "./product.service";

export class ProductController {
  constructor(private readonly service: ProductService) {}

  getByCategory = async (req: Request, res: Response) => {
    const qParams = productByCategoryQueryParams.parse(req.query);

    const { dto, etag } = await this.service.getByCategory(qParams);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 60
    });
  };
}
