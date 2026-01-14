import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../../utils/send-success";
import { createProduct, productIdParams } from "./product.schema";
import { ProductService } from "./product.service";

export class ProductController {
  constructor(private service: ProductService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    const payload = createProduct.parse(req.body);
    await this.service.create(payload);
    sendSuccess(res, 201, { message: "Product created" });
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    const params = productIdParams.parse(req.params);
    const data = await this.service.getById(params.productId);
    sendSuccess(res, 200, { message: "Product loaded", data });
  };
}
