import { generateETag } from "@/utils/generate-etag";
import { CategoryRepo } from "./category.repo";
import { mapCategoryDetail, mapCategoryFilters, mapMegaMenu, mapPopularCategories } from "./category.mapper";

export class CategoryService {
  constructor(private readonly repo: CategoryRepo) {}

  getMegaMenu = async () => {
    const { rows, etagSeed } = await this.repo.getMegaMenuTree();
    const dto = mapMegaMenu(rows);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getPopular = async () => {
    const LIMIT = 7;
    const { rows, etagSeed } = await this.repo.getPopularCategories(LIMIT);

    const dto = mapPopularCategories(rows);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getCategoryDetail = async (slugPath: string) => {
    const { current, breadcrumbRows, childrenRows, etagSeed } = await this.repo.getCategoryDetail(slugPath);

    const dto = mapCategoryDetail(current, breadcrumbRows, childrenRows);

    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getCategoryFilters = async (slugPath: string) => {
    const { rows, etagSeed } = await this.repo.getCategoryFilters(slugPath);

    const nodes = mapCategoryFilters(rows);

    const etag = generateETag(etagSeed);

    return {
      nodes,
      etag
    };
  };
}
