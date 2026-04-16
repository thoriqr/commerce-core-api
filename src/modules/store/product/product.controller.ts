import { Request, Response } from "express";
import { sendStoreResponse } from "@/utils/send-store-response";
import {
  productByCategoryQueryParams,
  productByCollectionQueryParams,
  productBySearchQueryParams,
  productFilterQueryParams,
  productIdParams,
  productVariantIdParams
} from "./product.schema";
import { ProductService } from "./product.service";

export class ProductController {
  constructor(private readonly service: ProductService) {}

  getProductDetail = async (req: Request, res: Response) => {
    const qParams = productIdParams.parse(req.params);

    const { dto, etag } = await this.service.getProductDetail(qParams.productId);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 60
    });
  };

  getVariantDetail = async (req: Request, res: Response) => {
    const qParams = productVariantIdParams.parse(req.params);

    const { dto, etag } = await this.service.getVariantDetail(qParams.productId, qParams.variantId);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 10
    });
  };

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

  getByCollection = async (req: Request, res: Response) => {
    const qParams = productByCollectionQueryParams.parse(req.query);

    const { dto, etag } = await this.service.getByCollection(qParams);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 60
    });
  };

  getBySearch = async (req: Request, res: Response) => {
    const qParams = productBySearchQueryParams.parse(req.query);

    const { dto, etag } = await this.service.getBySearch(qParams);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 60
    });
  };

  getSearchFilters = async (req: Request, res: Response) => {
    const qParams = productFilterQueryParams.parse(req.query);

    const { dto, etag } = await this.service.getSearchFilters(qParams.q);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 60
    });
  };
}
