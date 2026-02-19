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
  status: "ACTIVE" | "INACTIVE";
  isVariant: boolean;
  initialVariantId: number;

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
