import { Request, Response } from "express";
import { UserService } from "./user.service";
import { sendSuccess } from "@/utils/send-success";
import { addressIdParamsSchema, upsertAddressSchema } from "./user.schema";

export class UserController {
  constructor(private readonly service: UserService) {}

  getAddresses = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const addresses = await this.service.getAddresses(userId);

    sendSuccess(res, 200, { data: addresses });
  };

  getAddressDetail = async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const params = addressIdParamsSchema.parse(req.params);

    const address = await this.service.getAddressDetail(userId, params.addressId);

    sendSuccess(res, 200, { data: address });
  };

  createAddress = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const payload = upsertAddressSchema.parse(req.body);

    await this.service.createAddress(userId, payload);

    sendSuccess(res, 201, { message: "Address created" });
  };

  updateAddress = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const params = addressIdParamsSchema.parse(req.params);
    const payload = upsertAddressSchema.parse(req.body);

    await this.service.updateAddress(userId, params.addressId, payload);

    sendSuccess(res, 200, { message: "Address updated" });
  };

  setDefaultAddress = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const params = addressIdParamsSchema.parse(req.params);

    await this.service.setDefaultAddress(userId, params.addressId);

    sendSuccess(res, 200, { message: "Default address set" });
  };

  deleteAddress = async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const params = addressIdParamsSchema.parse(req.params);

    await this.service.deleteAddress(userId, params.addressId);

    sendSuccess(res, 200, { message: "Address deleted" });
  };
}
