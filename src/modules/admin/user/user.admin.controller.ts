import { sendSuccess } from "@/utils/send-success";
import { userAdminQuerySchema } from "./user.admin.schema";
import { UserAdminService } from "./user.admin.service";
import { Request, Response } from "express";

export class UserAdminController {
  constructor(private readonly userAdminService: UserAdminService) {}

  getUsers = async (req: Request, res: Response) => {
    const qParams = userAdminQuerySchema.parse(req.query);
    const { data, meta } = await this.userAdminService.getUsers(qParams);

    sendSuccess(res, 200, { data, meta });
  };
}
