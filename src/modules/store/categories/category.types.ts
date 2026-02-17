export type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  id_path: string;
  sort_order: number;
};

export type CategoryTopLevelRow = {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  updated_at: Date;
};

export type BreadcrumbRow = {
  id: number;
  name: string;
  slug: string;
  slug_path: string;
  id_path: string;
  updated_at: Date;
};

export type CategoryMetadataRow = {
  name: string;
  description: string | null;
  slug_path: string;
  updated_at: Date;
};
