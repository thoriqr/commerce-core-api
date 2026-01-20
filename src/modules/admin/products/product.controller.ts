import { Request, Response } from "express";
import { sendSuccess } from "../../../utils/send-success";
import { productIdParams, productQueryParams, productUpsertSchema } from "./product.schema";
import { ProductService } from "./product.service";

export class ProductController {
  constructor(private service: ProductService) {}

  getAll = async (req: Request, res: Response) => {
    const qParams = productQueryParams.parse(req.query);
    const { data, meta } = await this.service.getall(qParams);
    sendSuccess(res, 200, { data, meta });
  };

  getById = async (req: Request, res: Response) => {
    const params = productIdParams.parse(req.params);
    const data = await this.service.getById(params.productId);
    sendSuccess(res, 200, { data });
  };

  create = async (req: Request, res: Response) => {
    const payload = productUpsertSchema.parse(req.body);
    await this.service.create(payload);
    sendSuccess(res, 201, { message: "Product created" });
  };

  update = async (req: Request, res: Response) => {
    const params = productIdParams.parse(req.params);
    const payload = productUpsertSchema.parse(req.body);
    await this.service.update(params.productId, payload);
    sendSuccess(res, 200, { message: "Product updated" });
  };
}
