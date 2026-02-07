export interface CollectionDTO {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

export interface CollectionDetailDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CollectionOptionDTO {
  value: string;
  label: string;
}
