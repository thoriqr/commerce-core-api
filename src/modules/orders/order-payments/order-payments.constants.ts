export const PAYMENT_STATUS_RANK: Record<string, number> = {
  pending: 1,
  authorize: 2,

  capture: 3,
  settlement: 4,

  // final states
  expire: 5,
  cancel: 5,
  deny: 5,
  failure: 5,

  refund: 6,
  partial_refund: 6
};
