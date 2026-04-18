import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { UPLOAD_FILE } from "./product.constants";
import { sendSuccess } from "@/utils/send-success";
import { productIdParams, productQueryParams, productUpsertSchema, updateProductStatusSchema } from "./product.schema";
import { presetDimensionNameParams } from "../variant-preset/variant-preset.schema";

export class ProductController {
  constructor(private service: ProductService) {}

  getAll = async (req: Request, res: Response) => {
    console.log("all product, isDemo:", req.user?.isDemo);
    const qParams = productQueryParams.parse(req.query);
    const { data, meta } = await this.service.getall(qParams);
    sendSuccess(res, 200, { data, meta });
  };

  getById = async (req: Request, res: Response) => {
    const params = productIdParams.parse(req.params);
    const data = await this.service.getById(params.productId);
    sendSuccess(res, 200, { data });
  };

  getCategoryOptions = async (req: Request, res: Response) => {
    const data = await this.service.getCategoryOptions();
    sendSuccess(res, 200, { data });
  };

  getCollectionOptions = async (req: Request, res: Response) => {
    const data = await this.service.getCollectionOptions();
    sendSuccess(res, 200, { data });
  };

  getDimensionOptions = async (req: Request, res: Response) => {
    const data = await this.service.getDimensionOptions();
    sendSuccess(res, 200, { data });
  };

  getValuesByDimensionName = async (req: Request, res: Response) => {
    const params = presetDimensionNameParams.parse(req.params);
    const data = await this.service.getValuesByDimensionName(params.dimensionPresetName);
    sendSuccess(res, 200, { data });
  };

  create = async (req: Request, res: Response) => {
    const filesMap = req.files as Record<string, Express.Multer.File[] | undefined>;
    const productImgs = filesMap[UPLOAD_FILE.PRODUCT_FIELD] ?? [];
    const variantImgs = filesMap[UPLOAD_FILE.VARIANT_FIELD] ?? [];

    const bodyPayload = JSON.parse(req.body.payload);
    const payload = productUpsertSchema.parse(bodyPayload);
    await this.service.create(payload, productImgs, variantImgs);
    sendSuccess(res, 201, { message: "Product created" });
  };

  update = async (req: Request, res: Response) => {
    const filesMap = req.files as Record<string, Express.Multer.File[] | undefined>;
    const productImgs = filesMap[UPLOAD_FILE.PRODUCT_FIELD] ?? [];
    const variantImgs = filesMap[UPLOAD_FILE.VARIANT_FIELD] ?? [];

    const params = productIdParams.parse(req.params);
    const bodyPayload = JSON.parse(req.body.payload);
    const payload = productUpsertSchema.parse(bodyPayload);

    await this.service.update(params.productId, payload, productImgs, variantImgs);
    sendSuccess(res, 200, { message: "Product updated" });
  };

  updateStatus = async (req: Request, res: Response) => {
    const payload = updateProductStatusSchema.parse(req.body);

    await this.service.updateStatus(payload);
    sendSuccess(res, 200, { message: "Products status updated" });
  };
}
