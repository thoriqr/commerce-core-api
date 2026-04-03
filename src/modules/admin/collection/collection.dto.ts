import { CollectionStatus } from "./collection.types";

export interface CollectionDTO {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  status: CollectionStatus;
  productCount: number;
}

export interface CollectionDetailDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  status: CollectionStatus;
}

export interface CollectionOptionDTO {
  value: string;
  label: string;
}
