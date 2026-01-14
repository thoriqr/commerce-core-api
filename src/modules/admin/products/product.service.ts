import { Knex } from "knex";
import { TransactionManager } from "../../../infra/db/transaction-manager";
import { ProductRepo } from "./product.repo";
import { CreateProductSchema } from "./product.schema";
import { AppError } from "../../../errors/app-error";

export class ProductService {
  constructor(private tm: TransactionManager, private repo: ProductRepo) {}

  create = async (input: CreateProductSchema) => {
    return this.tm.transaction(async (trx) => {
      const variants = input.variants;
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

      await this.repo.create(trx as Knex.Transaction, input, finalIsVariant);
    });
  };

  getById = async (id: number) => {
    return await this.repo.getById(id);
  };
}
