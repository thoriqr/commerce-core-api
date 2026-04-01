export type UserOrderListItemDTO = {
  orderCode: string;

  status: string;
  total: number;
  createdAt: Date;

  itemCount: number;

  previewItem: {
    name: string;
    imageKey: string | null;
  };
};
