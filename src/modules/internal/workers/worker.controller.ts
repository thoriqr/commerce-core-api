import { sendSuccess } from "@/utils/send-success";
import { WORKER_JOB, WORKER_SUCCESS_MESSAGE } from "./worker.constants";
import { runWorkerSchema } from "./worker.schema";
import { WorkerService } from "./worker.service";
import { Request, Response } from "express";
import { AppError } from "@/errors/app-error";

export class WorkerController {
  constructor(private readonly service: WorkerService) {}

  run = async (req: Request, res: Response) => {
    const { job } = runWorkerSchema.parse(req.body);

    let result;

    switch (job) {
      case WORKER_JOB.EXPIRE_ORDERS:
        result = await this.service.expireOrders();
        break;

      case WORKER_JOB.MAINTENANCE_SESSION:
        result = await this.service.maintenanceSession();
        break;

      case WORKER_JOB.MAINTENANCE_ASSETS:
        result = await this.service.maintenanceAssets();
        break;

      default:
        throw AppError.internal("Unknown worker job");
    }

    return sendSuccess(res, 200, {
      message: WORKER_SUCCESS_MESSAGE[job],
      data: result
    });
  };
}
