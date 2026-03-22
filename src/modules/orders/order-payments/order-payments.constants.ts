export const PAYMENT_STATUS_RANK: Record<string, number> = {
  pending: 1,
  capture: 2,
  settlement: 3,

  // failure states (lowest priority)
  deny: 0,
  cancel: 0,
  expire: 0,
  failure: 0
};
