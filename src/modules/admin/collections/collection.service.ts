import { TransactionManager } from "@/infra/db/transaction-manager";
import { CollectionRepo } from "./collection.repo";
import { CollectionReorderSchema, CollectionUpsertSchema } from "./collection.schema";
import { generateUniqueSlug } from "./collection.slug";

export class CollectionService {
  constructor(
    private tm: TransactionManager,
    private repo: CollectionRepo
  ) {}

  getAll = async () => {
    return this.repo.getAll();
  };

  getById = async (collectionId: number) => {
    return this.repo.getById(collectionId);
  };

  create = async (input: CollectionUpsertSchema) => {
    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueSlug(trx, { name: input.name, slugFromClient: input.slug ?? null });

        await this.repo.create(trx, input, slug);
      })
    );
  };

  update = async (collectionId: number, input: CollectionUpsertSchema) => {
    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const existing = await this.repo.findBaseId(collectionId, trx);

        const slug = await generateUniqueSlug(trx, {
          name: input.name,
          slugFromClient: input.slug ?? null,
          excludeId: existing.id
        });

        await this.repo.update(trx, collectionId, input, slug);
      })
    );
  };

  reorderCollection = async (input: CollectionReorderSchema) => {
    await this.tm.transaction((trx) => this.repo.reorderCollection(trx, input));
  };

  remove = async (collectionId: number) => {
    return this.repo.remove(collectionId);
  };

  private async withSlugRetry<T>(fn: () => Promise<T>, attempt = 0): Promise<T> {
    try {
      return await fn();
    } catch (err: any) {
      // retry if unique violation
      if (err?.code === "23505" && attempt < 1) {
        return this.withSlugRetry(fn, attempt + 1);
      }
      throw err;
    }
  }
}
