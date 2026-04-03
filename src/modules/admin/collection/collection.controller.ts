import { Request, Response } from "express";
import { collectionIdParams, collectionReorderSchema, collectionUpsertSchema } from "./collection.schema";
import { CollectionService } from "./collection.service";
import { sendSuccess } from "@/utils/send-success";

export class CollectionController {
  constructor(private service: CollectionService) {}

  getAll = async (req: Request, res: Response) => {
    const data = await this.service.getAll();
    sendSuccess(res, 200, { data });
  };

  getById = async (req: Request, res: Response) => {
    const params = collectionIdParams.parse(req.params);
    const data = await this.service.getById(params.collectionId);
    sendSuccess(res, 200, { data });
  };

  create = async (req: Request, res: Response) => {
    const payload = collectionUpsertSchema.parse(req.body);
    await this.service.create(payload);
    sendSuccess(res, 201, { message: "Collection created" });
  };

  update = async (req: Request, res: Response) => {
    const params = collectionIdParams.parse(req.params);
    const payload = collectionUpsertSchema.parse(req.body);
    await this.service.update(params.collectionId, payload);
    sendSuccess(res, 200, { message: "Collection updated" });
  };

  reorderCollection = async (req: Request, res: Response) => {
    const payload = collectionReorderSchema.parse(req.body);
    await this.service.reorderCollection(payload);
    sendSuccess(res, 200, { message: "Collection reordered" });
  };

  remove = async (req: Request, res: Response) => {
    const params = collectionIdParams.parse(req.params);
    await this.service.remove(params.collectionId);
    sendSuccess(res, 200, { message: "Collection removed" });
  };
}
