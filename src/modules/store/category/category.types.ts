export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  id_path: string;
  slug_path: string;
  sort_order: number;
};

export type CategoryPopularRow = {
  id: number;
  name: string;
  slug: string;
  slug_path: string;
  total_sold: number;
  updated_at: Date;
};

export type CategoryDetailRow = {
  id: number;
  name: string;
  description: string | null;
  slug: string;
  slug_path: string;
  id_path: string;
  updated_at: Date;
};

export type CategoryBreadcrumbRow = {
  id: number;
  name: string;
  slug: string;
  slug_path: string;
  id_path: string;
  updated_at: Date;
};

export type CategoryChildRow = {
  id: number;
  name: string;
  slug: string;
  slug_path: string;
};

export type CategoryFilterRow = {
  dimension_name: string;
  dimension_display_name: string;
  value_normalized: string;
  value_display: string;
  product_count: number;
  hex_color: string | null;
};
