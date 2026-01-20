import { Knex } from "knex";
import { TransactionManager } from "../../../infra/db/transaction-manager";
import { ProductRepo } from "./product.repo";
import { ProductQueryParamsSchema, ProductUpsertSchema, VariantSchema } from "./product.schema";
import { AppError } from "../../../errors/app-error";
import { generateUniqueSlug } from "./product.slug";

export class ProductService {
  constructor(
    private tm: TransactionManager,
    private repo: ProductRepo
  ) {}

  getall = async (qParams: ProductQueryParamsSchema) => {
    const { page, limit } = qParams;

    const [items, total] = await Promise.all([this.repo.getAll(qParams), this.repo.getCount(qParams)]);
    return {
      data: items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  };

  getById = async (id: number) => {
    return await this.repo.getDetailById(id);
  };

  create = async (input: ProductUpsertSchema) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const slug = await generateUniqueSlug(trx, input.name);

        await this.repo.create(trx, input, finalIsVariant, slug);
      })
    );
  };

  update = async (id: number, input: ProductUpsertSchema) => {
    const finalIsVariant = this.validateVariantRules(input.variants);

    return this.withSlugRetry(() =>
      this.tm.transaction(async (trx) => {
        const product = await this.repo.findBaseById(id, trx);

        const finalSlug = input.name === product.name ? product.slug : await generateUniqueSlug(trx, input.name);

        await this.repo.update(trx, id, input, finalIsVariant, finalSlug);
      })
    );
  };

  private validateVariantRules(variants: VariantSchema) {
    const finalIsVariant = variants.length > 1;
    const primaries = variants.filter((v) => v.isPrimary);

    if (primaries.length !== 1) {
      throw AppError.badRequest("Exactly one primary variant is required");
    }

    // SINGLE PRODUCT MUST NOT HAVE options
    if (!finalIsVariant) {
      const hasOptions = variants[0]?.options?.length;
      if (hasOptions) {
        throw AppError.badRequest("Single product must not have variant options");
      }
    }

    // VARIANT PRODUCT MUST HAVE options
    if (finalIsVariant) {
      for (const v of variants) {
        if (!v.options || v.options.length === 0) {
          throw AppError.badRequest("Variant product must have options");
        }
      }
    }

    // RULE:
    // - single variant must not have options
    // - multi variant must have options
    // - exactly one primary variant

    return finalIsVariant;
  }

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
