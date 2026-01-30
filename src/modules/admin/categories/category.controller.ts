import { Request, Response } from "express";
import { categoryIdParams, categoryParentIdParams, categoryUpsertSchema } from "./category.schema";
import { CategoryService } from "./category.service";
import { sendSuccess } from "@/utils/send-success";

export class CategoryController {
  constructor(private service: CategoryService) {}

  getById = async (req: Request, res: Response) => {
    const params = categoryIdParams.parse(req.params);
    const data = await this.service.getById(params.categoryId);
    sendSuccess(res, 200, { data });
  };

  getAllParent = async (req: Request, res: Response) => {
    const data = await this.service.getAllParent();
    sendSuccess(res, 200, { data });
  };

  getParentTree = async (req: Request, res: Response) => {
    const params = categoryParentIdParams.parse(req.params);
    const data = await this.service.getParentTree(params.parentId);
    sendSuccess(res, 200, { data });
  };

  create = async (req: Request, res: Response) => {
    const payload = categoryUpsertSchema.parse(req.body);
    await this.service.create(payload);
    sendSuccess(res, 201, { message: "Category created" });
  };
}
