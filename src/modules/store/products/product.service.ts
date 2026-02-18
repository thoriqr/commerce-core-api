import { generateETag } from "@/utils/generate-etag";
import { ProductRepo } from "./product.repo";
import { ProductByCategoryQueryParams } from "./product.schema";
import { mapProductListing } from "./product.mapper";

export class ProductService {
  constructor(private readonly repo: ProductRepo) {}

  getByCategory = async (qParams: ProductByCategoryQueryParams) => {
    const idPath = await this.repo.getIdPathBySlugPath(qParams.slugPath);

    const { items, nextCursor, hasMore, etagSeed } = await this.repo.getByCategoryIdPath(idPath, qParams);

    const dto = mapProductListing(items, nextCursor, hasMore);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };
}
