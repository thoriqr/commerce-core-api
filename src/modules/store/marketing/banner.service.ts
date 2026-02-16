import { generateETag } from "@/utils/generate-etag";
import { BannerDTO } from "./banner.dto";
import { BannerRepo } from "./banner.repo";
import { BannerQueryParams } from "./banner.schema";

export class BannerService {
  constructor(private readonly repo: BannerRepo) {}

  getActiveByPlacement = async (qParams: BannerQueryParams) => {
    const { rows, etagSeed } = await this.repo.getActiveByPlacement(qParams);

    const resolved: BannerDTO[] = await Promise.all(
      rows.map(async (r) => {
        const url = await this.resolveUrl(r.target_type, r.target_entity_id);

        return {
          id: r.id,
          title: r.title,
          imageKey: r.image_key,
          url
        };
      })
    );

    const etag = generateETag(etagSeed);

    return { resolved, etag };
  };

  private async resolveUrl(targetType: string, targetEntityId: number | null): Promise<string> {
    if (!targetEntityId) return "#";

    if (targetType === "category") {
      return this.repo.buildCategoryUrl(targetEntityId);
    }

    if (targetType === "collection") {
      return this.repo.buildCollectionUrl(targetEntityId);
    }

    return "#";
  }
}
