import { Request, Response } from "express";
import { sendSuccess } from "@/utils/send-success";
import { UserSuperService } from "./user.super.service";
import { userIdParams, userSuperQuerySchema } from "./user.super.schema";

export class UserSuperController {
  constructor(private readonly userSuperService: UserSuperService) {}

  getUsers = async (req: Request, res: Response) => {
    const qParams = userSuperQuerySchema.parse(req.query);
    const { data, meta } = await this.userSuperService.getUsers(qParams);

    sendSuccess(res, 200, { data, meta });
  };

  revokeUserSessions = async (req: Request, res: Response) => {
    const { userId } = userIdParams.parse(req.params);
    await this.userSuperService.revokeUserSessions(userId);
    sendSuccess(res, 200, { message: "Session revoked" });
  };
}
