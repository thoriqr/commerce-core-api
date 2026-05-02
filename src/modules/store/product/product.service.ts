import { generateETag } from "@/utils/generate-etag";
import { ProductRepo } from "./product.repo";
import { ProductByCategoryQueryParams, ProductByCollectionQueryParams, ProductBySearchQueryParams } from "./product.schema";
import { mapProductDetail, mapProductFilters, mapProductListing, mapVariantDetail } from "./product.mapper";

export class ProductService {
  constructor(private readonly repo: ProductRepo) {}

  getProductDetail = async (productId: number) => {
    const { product, variantRows, dimensionRows, imageRows, etagSeed } = await this.repo.getProductDetailById(productId);

    const dto = mapProductDetail({ product, variantRows, dimensionRows, imageRows });
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getVariantDetail = async (productId: number, variantId: number) => {
    const { row, etagSeed } = await this.repo.getVariantDetail(productId, variantId);

    const dto = mapVariantDetail(row);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getByCategory = async (qParams: ProductByCategoryQueryParams) => {
    const idPath = await this.repo.getIdPathBySlugPath(qParams.slugPath);

    const { rows, nextCursor, hasMore, etagSeed } = await this.repo.getByCategoryIdPath(idPath, qParams);

    const dto = mapProductListing(rows);
    const etag = generateETag(etagSeed);

    return { data: dto, meta: { hasMore, nextCursor }, etag };
  };

  getByCollection = async (qParams: ProductByCollectionQueryParams) => {
    const { rows, nextCursor, hasMore, etagSeed } = await this.repo.getByCollectionSlug(qParams);

    const dto = mapProductListing(rows);
    const etag = generateETag(etagSeed);

    return { data: dto, meta: { hasMore, nextCursor }, etag };
  };

  getBySearch = async (qParams: ProductBySearchQueryParams) => {
    const { rows, nextCursor, hasMore, etagSeed } = await this.repo.getBySearch(qParams);

    const dto = mapProductListing(rows);
    const etag = generateETag(etagSeed);

    return { data: dto, meta: { hasMore, nextCursor }, etag };
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
