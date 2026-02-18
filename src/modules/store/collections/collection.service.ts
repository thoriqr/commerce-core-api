import { generateETag } from "@/utils/generate-etag";
import { mapCollectionDetail, mapCollectionPreview } from "./collection.mapper";
import { CollectionRepo } from "./collection.repo";

export class CollectionService {
  constructor(private readonly repo: CollectionRepo) {}

  getCollectionsPreview = async () => {
    const LIMIT = 7;

    const { rows, etagSeed } = await this.repo.getCollectionsWithProductPreview(LIMIT);

    const dto = mapCollectionPreview(rows, LIMIT);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };

  getCollectionDetail = async (slug: string) => {
    const { row, etagSeed } = await this.repo.getBySlug(slug);

    const dto = mapCollectionDetail(row);
    const etag = generateETag(etagSeed);

    return { dto, etag };
  };
}
