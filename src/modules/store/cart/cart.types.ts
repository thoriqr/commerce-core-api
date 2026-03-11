export type ResolveCartResult = {
  cartId: string;
  created: boolean;
};

export type CartRow = {
  id: string;
  user_id: number | null;
};
