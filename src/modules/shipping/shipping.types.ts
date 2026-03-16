export type Province = {
  id: number;
  name: string;
};

export type City = {
  id: number;
  name: string;
};

export type District = {
  id: number;
  name: string;
};

export type ShippingCost = {
  name: string;
  code: string;
  service: string;
  description: string;
  cost: number;
  etd: string;
};
