import { JOB_NAMES } from "@/shared/queues/job-names";
import { runCleanup } from "./cleanup.helper";

export const cleanupAbandonedGuestCartsJob = {
  name: JOB_NAMES.CLEANUP_ABANDONED_GUEST_CARTS,

  async handler() {
    return runCleanup(
      JOB_NAMES.CLEANUP_ABANDONED_GUEST_CARTS,
      `
      DELETE FROM carts
      WHERE id IN (
        SELECT id
        FROM carts
        WHERE user_id IS NULL
          AND updated_at < NOW() - INTERVAL '7 days'
        ORDER BY updated_at ASC, id ASC
        LIMIT 500
      )
      RETURNING id
      `
    );
  }
};
