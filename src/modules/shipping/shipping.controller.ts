import { Request, Response } from "express";
import { sendSuccess } from "@/utils/send-success";
import { ShippingService } from "./shipping.service";
import { getCitiesParamsSchema, getDistrictsParamsSchema } from "./shipping.schema";

export class ShippingController {
  constructor(private readonly service: ShippingService) {}

  getProvinces = async (req: Request, res: Response) => {
    const provinces = await this.service.getProvinces();

    return sendSuccess(res, 200, {
      data: provinces
    });
  };

  getCities = async (req: Request, res: Response) => {
    const { provinceId } = getCitiesParamsSchema.parse(req.params);

    const cities = await this.service.getCities(provinceId);

    return sendSuccess(res, 200, { data: cities });
  };

  getDistricts = async (req: Request, res: Response) => {
    const { cityId } = getDistrictsParamsSchema.parse(req.params);

    const districts = await this.service.getDistricts(cityId);

    return sendSuccess(res, 200, { data: districts });
  };
}
