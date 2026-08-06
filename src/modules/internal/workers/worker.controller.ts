import { sendSuccess } from "@/utils/send-success";
import { WORKER_JOB, WORKER_SUCCESS_MESSAGE } from "./worker.constants";
import { runWorkerSchema } from "./worker.schema";
import { WorkerService } from "./worker.service";
import { Request, Response } from "express";
import { AppError } from "@/errors/app-error";
import { logger } from "@/libs/logger";

export class WorkerController {
  constructor(private readonly service: WorkerService) {}

  run = async (req: Request, res: Response) => {
    const startedAt = Date.now();

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

    const message = WORKER_SUCCESS_MESSAGE[job];

    logger.info(message, {
      workerJob: job,
      result,
      durationMs: Date.now() - startedAt
    });

    return sendSuccess(res, 200, {
      message,
      data: result
    });
  };
}
