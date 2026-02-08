export type CategoryStatus = "ACTIVE" | "INACTIVE";

export type CategoryParentRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  sort_order: number;
  status: CategoryStatus;
};

export type CategoryRow = {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  sort_order: number;
  status: CategoryStatus;
};

export type CategoryDetailRow = {
  id: number;
  parent_id: number | null;
  name: string;
  description: string | null;
  slug: string;
  sort_order: number;
  status: CategoryStatus;
};

export type CategoryFlatRow = {
  id: number;
  path: string; // `Menswear / Men Clothes / Men Jackets`
  depth: number;
};
