import { TransactionManager } from "@/infra/db/transaction-manager";
import { CategoryRepo } from "./category.repo";
import { generateUniqueCategorySlug } from "./category.slug";
import { CategoryReorderSchema, CategoryUpdateSchema, CategoryUpsertSchema } from "./category.schema";

export class CategoryService {
  constructor(
    private tm: TransactionManager,
    private repo: CategoryRepo
  ) {}

  getById = async (id: number) => {
    return await this.repo.getById(id);
  };

  getAllParent = async () => {
    return await this.repo.getAllParent();
  };

  getParentTree = async (parentId: number) => {
    return await this.repo.getParentTree(parentId);
  };

  create = async (input: CategoryUpsertSchema) => {
    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueCategorySlug(trx, { name: input.name, slugFromClient: input.slug ?? null, parentId: input.parentId });

        await this.repo.create(trx, input, slug);
      })
    );
  };

  update = async (categoryId: number, input: CategoryUpdateSchema) => {
    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const existing = await this.repo.findBaseId(categoryId, trx);

        const slug = await generateUniqueCategorySlug(trx, {
          name: input.name,
          slugFromClient: input.slug ?? null,
          parentId: existing.parent_id,
          excludeId: categoryId
        });

        await this.repo.update(trx, categoryId, input, slug);
      })
    );
  };

  reorderCategory = async (parentId: number, input: CategoryReorderSchema) => {
    return this.tm.transaction((trx) => this.repo.reorderCategory(trx, parentId, input));
  };

  remove = async (categoryId: number) => {
    return this.repo.remove(categoryId);
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
