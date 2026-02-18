import { Request, Response } from "express";
import { CollectionService } from "./collection.service";
import { sendStoreResponse } from "@/utils/send-store-response";
import { collectionSlugParams } from "./collection.schema";

export class CollectionController {
  constructor(private readonly service: CollectionService) {}

  getCollectionsPreview = async (req: Request, res: Response) => {
    const { dto, etag } = await this.service.getCollectionsPreview();

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 300
    });
  };

  getCollectionDetail = async (req: Request, res: Response) => {
    const params = collectionSlugParams.parse(req.params);
    const { dto, etag } = await this.service.getCollectionDetail(params.slug);

    sendStoreResponse({
      req,
      res,
      data: dto,
      etag,
      maxAge: 300
    });
  };
}
