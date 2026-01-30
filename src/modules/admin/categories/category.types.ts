export type CategoryParentRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  sort_order: number;
};

export type CategoryRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  sort_order: number;
};

export type CategoryDetailRow = {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  slug: string;
  sort_order: number;
};
