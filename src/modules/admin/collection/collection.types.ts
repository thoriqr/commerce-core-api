export type CollectionStatus = "ACTIVE" | "INACTIVE";

export type CollectionRow = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  status: CollectionStatus;
};

export type CollectionDetailRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  status: CollectionStatus;
};
