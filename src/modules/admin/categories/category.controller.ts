import { Request, Response } from "express";
import { categoryUpsertSchema } from "./category.schema";
import { CategoryService } from "./category.service";
import { sendSuccess } from "@/utils/send-success";

export class CategoryController {
  constructor(private service: CategoryService) {}

  create = async (req: Request, res: Response) => {
    const payload = categoryUpsertSchema.parse(req.body);
    await this.service.create(payload);
    sendSuccess(res, 201, { message: "Category created" });
  };
}
