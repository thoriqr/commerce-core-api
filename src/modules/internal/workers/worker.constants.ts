export const WORKER_JOB = {
  EXPIRE_ORDERS: "expire-orders",
  MAINTENANCE_SESSION: "maintenance-session",
  MAINTENANCE_ASSETS: "maintenance-assets"
} as const;

export const WORKER_SUCCESS_MESSAGE = {
  [WORKER_JOB.EXPIRE_ORDERS]: "Expire orders completed successfully.",
  [WORKER_JOB.MAINTENANCE_SESSION]: "Session maintenance completed successfully.",
  [WORKER_JOB.MAINTENANCE_ASSETS]: "Asset maintenance completed successfully."
} as const;
