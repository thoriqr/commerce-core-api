export interface CategoryParentDTO {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface CategoryParentTreeDTO {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  children: CategoryParentTreeDTO[];
}

export interface CategoryDetailDTO {
  id: number;
  parentId: number | null;
  name: string;
  description: string | null;
  slug: string;
  sortOrder: number;
}
