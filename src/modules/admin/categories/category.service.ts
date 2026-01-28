import { TransactionManager } from "@/infra/db/transaction-manager";
import { CategoryRepo } from "./category.repo";
import { generateUniqueCategorySlug } from "./category.slug";
import { CategoryUpsertSchema } from "./category.schema";

export class CategoryService {
  constructor(
    private tm: TransactionManager,
    private repo: CategoryRepo
  ) {}

  create = async (input: CategoryUpsertSchema) => {
    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueCategorySlug(trx, { name: input.name, slugFromClient: input.slug ?? null, parentId: input.parentId });

        await this.repo.create(trx, input, slug);
      })
    );
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
