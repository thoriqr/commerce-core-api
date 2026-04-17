export interface CategoryNodeDTO {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  slugPath: string;
  children: CategoryNodeDTO[];
}

export interface CategoryTopLevelDTO {
  id: number;
  name: string;
  slug: string;
}

export interface CategoryDetailDTO {
  category: {
    id: number;
    name: string;
    description: string | null;
    slug: string;
    slugPath: string;
  };
  breadcrumb: {
    id: number;
    name: string;
    slugPath: string;
  }[];
  children: {
    id: number;
    name: string;
    slugPath: string;
  }[];
}

export type CategoryFilterValueDTO = {
  value: string; // normalized_value
  label: string; // display_value
  count: number; // distinct product count
  hexColor: string | null;
};

export type CategoryFilterDimensionDTO = {
  name: string; // normalized_name
  label: string; // display_name
  values: CategoryFilterValueDTO[];
};
