export interface CategoryParentDTO {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryParentTreeDTO {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  children: CategoryParentTreeDTO[];
}

export interface CategoryDetailDTO {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CategoryFlatDTO {
  value: string;
  label: string;
}
