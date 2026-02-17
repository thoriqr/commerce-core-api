export interface CategoryNodeDTO {
  id: number;
  name: string;
  slug: string;
  children: CategoryNodeDTO[];
}

export interface CategoryTopLevelDTO {
  id: number;
  name: string;
  slug: string;
}

export interface BreadcrumbDTO {
  name: string;
  slug: string;
  fullSlug: string;
}

export type CategoryMetadataDTO = {
  title: string;
  description: string;
};
