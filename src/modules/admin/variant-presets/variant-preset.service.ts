import { TransactionManager } from "@/infra/db/transaction-manager";
import { VariantPresetRepo } from "./variant-preset.repo";
import { PresetDimensionUpsertSchema, PresetDimensionValueReorderSchema } from "./variant-preset.schema";

export class VariantPresetService {
  constructor(
    private tm: TransactionManager,
    private readonly repo: VariantPresetRepo
  ) {}

  getAll = async () => {
    return this.repo.getAll();
  };

  getById = async (dimensionPresetId: number) => {
    return this.repo.getById(dimensionPresetId);
  };

  create = async (input: PresetDimensionUpsertSchema) => {
    return this.tm.transaction((trx) => this.repo.create(trx, input));
  };

  update = async (dimensionPresetId: number, input: PresetDimensionUpsertSchema) => {
    return this.tm.transaction((trx) => this.repo.update(trx, dimensionPresetId, input));
  };

  remove = async (dimensionPresetId: number) => {
    return this.repo.remove(dimensionPresetId);
  };

  getDimensionOptions = async () => {
    return this.repo.getDimensionOptions();
  };

  getValuesByDimensionName = async (name: string) => {
    return this.repo.getValuesByDimensionName(name);
  };

  reorderDimensionValues = async (input: PresetDimensionValueReorderSchema) => {
    return this.tm.transaction((trx) => this.repo.reorderDimensionValues(trx, input));
  };
}
