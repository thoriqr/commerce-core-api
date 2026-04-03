export interface ProductCardDTO {
  id: number;
  name: string;
  slug: string;
  imageKey: string;
  displayPrice: number;
}

export interface ProductListingDTO {
  items: ProductCardDTO[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface VariantDetailDTO {
  variantId: number;
  price: number;
  stock: number;
  sku: string | null;
  currency: string;
  weight: number;
  weightUnit: string;
  isAvailable: boolean;
}

export interface ProductDetailDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
  isVariant: boolean;
  initialVariantId: number;
  isAvailable: boolean;
  category: {
    name: string;
    slugPath: string;
  };

  dimensions: {
    key: string;
    label: string;
    values: {
      key: string;
      label: string;
      hexColor: string | null;
    }[];
  }[];

  variants: {
    id: number;
    options: {
      dimensionKey: string;
      valueKey: string;
    }[];
  }[];

  images: (
    | {
        id: number;
        imageKey: string;
        type: "product";
      }
    | {
        id: number;
        imageKey: string;
        type: "variant";
        signature: {
          dimensionKey: string | null;
          valueKey: string | null;
        };
      }
  )[];
}

export type ProductFilterValueDTO = {
  value: string; // normalized_value
  label: string; // display_value
  count: number; // distinct product count
  hexColor: string | null;
};

export type ProductFilterDimensionDTO = {
  name: string; // normalized_name
  label: string; // display_name
  values: ProductFilterValueDTO[];
};
