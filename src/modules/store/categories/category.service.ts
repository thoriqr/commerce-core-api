import { generateETag } from "@/utils/generate-etag";
import { CategoryRepo } from "./category.repo";
import { mapCategoryMetadata, mapMegaMenu, mapTopLevelCategories } from "./category.mapper";
import { mapBreadcrumb } from "@/modules/admin/categories/category.mapper";

export class CategoryService {
  constructor(private readonly repo: CategoryRepo) {}

  getMegaMenu = async () => {
    const { rows, etagSeed } = await this.repo.getMegaMenuTree();
    const dto = mapMegaMenu(rows);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getPopular = async () => {
    const { rows, etagSeed } = await this.repo.getTopLevelCategories();

    const dto = mapTopLevelCategories(rows);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getBreadcrumb = async (slugPath: string) => {
    const { rows, etagSeed } = await this.repo.getBreadcrumbBySlugPath(slugPath);

    const dto = mapBreadcrumb(rows);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getMetadata = async (slugPath: string) => {
    const { row, etagSeed } = await this.repo.getMetadataBySlugPath(slugPath);

    const dto = mapCategoryMetadata(row);
    const etag = generateETag(etagSeed);

    return {
      dto,
      etag
    };
  };
}
