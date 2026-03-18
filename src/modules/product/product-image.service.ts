import { redis } from "@/libs/redis";
import { ProductImageRepo } from "./product-image.repo";
import { buildImageMap } from "@/shared/variant-image/resolver";
import { ImageSignature } from "@/shared/variant-image/types";
import { REDIS_KEYS } from "@/shared/cache/redis-keys";
import { REDIS_TTL } from "@/shared/cache/redis.ttl";

export class ProductImageService {
  constructor(private readonly repo: ProductImageRepo) {}

  getVariantImagesBulk = async (productIds: number[]) => {
    const uniqueIds = [...new Set(productIds)];

    const result = new Map<
      number,
      {
        images: ImageSignature[];
        fallback: {
          imageId: number;
          imageKey: string;
        } | null;
      }
    >();

    const keys = uniqueIds.map((id) => REDIS_KEYS.VARIANT_IMAGES(id));

    const cacheResults = await redis.mGet(keys);

    const missingIds: number[] = [];

    cacheResults.forEach((cached, idx) => {
      const productId = uniqueIds[idx]!;

      if (cached) {
        try {
          const parsed = JSON.parse(cached) as {
            images: ImageSignature[];
            fallback: { imageId: number; imageKey: string } | null;
          };

          result.set(productId, parsed);
        } catch {
          // optional cleanup
          redis.del(REDIS_KEYS.VARIANT_IMAGES(productId));
          missingIds.push(productId);
        }
      } else {
        missingIds.push(productId);
      }
    });

    if (missingIds.length > 0) {
      const imageRows = await this.repo.getProductImagesWithSignatures(missingIds);
      const fallbackRows = await this.repo.getFallbackImages(missingIds);

      const imageMap = buildImageMap(imageRows);

      const fallbackMap = new Map(
        fallbackRows.map((r) => [
          r.product_id,
          {
            imageId: r.image_id,
            imageKey: r.image_key
          }
        ])
      );

      await Promise.all(
        missingIds.map(async (productId) => {
          const data = {
            images: imageMap.get(productId) ?? [],
            fallback: fallbackMap.get(productId) ?? null
          };

          await redis.set(REDIS_KEYS.VARIANT_IMAGES(productId), JSON.stringify(data), { EX: REDIS_TTL.VARIANT_IMAGES });

          result.set(productId, data);
        })
      );
    }

    return result;
  };
}
