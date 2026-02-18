import { ProductCardDTO } from "../products/product.dto";

export interface CollectionPreviewDTO {
  id: number;
  name: string;
  slug: string;
  hasMoreProducts: boolean;
  products: ProductCardDTO[];
}

export interface CollectionDetailDTO {
  id: number;
  name: string;
  slug: string;
  description: string;
}
