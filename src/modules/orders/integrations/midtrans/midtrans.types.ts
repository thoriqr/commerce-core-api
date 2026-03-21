export type MidtransResponse = {
  token: string;
  redirect_url: string;
};

export type MidtransItem = {
  id: string;
  price: number;
  quantity: number;
  name: string;
};

export type MidtransPayload = {
  transaction_details: {
    order_id: string;
    gross_amount: number;
  };
  item_details: MidtransItem[];
  customer_details: {
    first_name: string;
    phone: string;
  };

  notification_url: string;
  expiry: {
    start_time: string;
    unit: string;
    duration: number;
  };
};
