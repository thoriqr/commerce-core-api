import { z } from "zod";
import { WORKER_JOB } from "./worker.constants";

export const runWorkerSchema = z.object({
  job: z.enum([WORKER_JOB.EXPIRE_ORDERS, WORKER_JOB.MAINTENANCE_SESSION, WORKER_JOB.MAINTENANCE_ASSETS])
});

export type RunWorkerInput = z.infer<typeof runWorkerSchema>;
