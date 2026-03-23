import { Request, Response } from "express";

import { getDashboardSchema } from "./dashboard.schema";
import { DashboardService } from "./dashboard.service";
import { sendSuccess } from "@/utils/send-success";

export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  getDashboard = async (req: Request, res: Response) => {
    const query = getDashboardSchema.parse(req.query);

    const data = await this.service.getDashboard(query);

    sendSuccess(res, 200, { data });
  };
}
