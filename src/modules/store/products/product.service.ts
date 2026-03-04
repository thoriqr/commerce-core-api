import { generateETag } from "@/utils/generate-etag";
import { ProductRepo } from "./product.repo";
import { ProductByCategoryQueryParams, ProductByCollectionQueryParams, ProductBySearchQueryParams } from "./product.schema";
import { mapProductDetail, mapProductFilters, mapProductListing, mapVariantDetail } from "./product.mapper";

export class ProductService {
  constructor(private readonly repo: ProductRepo) {}

  getProductDetail = async (slug: string) => {
    const { product, variantRows, dimensionRows, imageRows, etagSeed } = await this.repo.getProductDetailBySlug(slug);

    const dto = mapProductDetail({ product, variantRows, dimensionRows, imageRows });
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getVariantDetail = async (productSlug: string, variantId: number) => {
    const { row, etagSeed } = await this.repo.getVariantDetail(productSlug, variantId);

    const dto = mapVariantDetail(row);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getByCategory = async (qParams: ProductByCategoryQueryParams) => {
    const idPath = await this.repo.getIdPathBySlugPath(qParams.slugPath);

    const { items, nextCursor, hasMore, etagSeed } = await this.repo.getByCategoryIdPath(idPath, qParams);

    const dto = mapProductListing(items, nextCursor, hasMore);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getByCollection = async (qParams: ProductByCollectionQueryParams) => {
    const { items, nextCursor, hasMore, etagSeed } = await this.repo.getByCollectionSlug(qParams);

    const dto = mapProductListing(items, nextCursor, hasMore);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getBySearch = async (qParams: ProductBySearchQueryParams) => {
    const { items, nextCursor, hasMore, etagSeed } = await this.repo.getBySearch(qParams);

    const dto = mapProductListing(items, nextCursor, hasMore);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getSearchFilters = async (q: string) => {
    const { rows, etagSeed } = await this.repo.getSearchFilters(q);

    const dto = mapProductFilters(rows);

    const etag = generateETag(etagSeed);

    return {
      dto,
      etag
    };
  };
}
