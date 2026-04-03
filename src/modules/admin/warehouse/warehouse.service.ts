import { TransactionManager } from "@/infra/db/transaction-manager";
import { WarehouseRepo } from "./warehouse.repo";
import { ShippingService } from "@/modules/shipping/shipping.service";
import { InputWarehouse } from "./warehouse.types";
import { AppError } from "@/errors/app-error";
import { UpsertWarehouseInput } from "./warehouse.schema";
import { redis } from "@/libs/redis";
import { REDIS_KEYS } from "@/shared/cache/redis-keys";

export class WarehouseService {
  constructor(
    private readonly tm: TransactionManager,
    private readonly repo: WarehouseRepo,
    private readonly shippingService: ShippingService
  ) {}

  getWarehouse = async () => {
    const warehouse = await this.tm.transaction(async (trx) => {
      return this.repo.getWarehouse(trx);
    });

    if (!warehouse) {
      return null; // FE handle empty state
    }

    return {
      id: warehouse.id,
      name: warehouse.name,

      shippingProvinceId: warehouse.shipping_province_id,
      shippingProvinceName: warehouse.shipping_province_name,

      shippingCityId: warehouse.shipping_city_id,
      shippingCityName: warehouse.shipping_city_name
    };
  };

  upsertWarehouse = async (input: UpsertWarehouseInput) => {
    // 1. VALIDATE PROVINCE
    const provinces = await this.shippingService.getProvinces();
    const province = provinces.find((p) => p.id === input.shippingProvinceId);

    if (!province) {
      throw AppError.badRequest("Invalid province");
    }

    // 2. VALIDATE CITY
    const cities = await this.shippingService.getCities(input.shippingProvinceId);
    const city = cities.find((c) => c.id === input.shippingCityId);

    if (!city) {
      throw AppError.badRequest("Invalid city");
    }

    // 3. PREPARE DATA (snapshot)
    const data: InputWarehouse = {
      name: input.name,
      provinceId: province.id,
      provinceName: province.name,
      cityId: city.id,
      cityName: city.name
    };

    // 4. TRANSACTION
    await this.tm.transaction(async (trx) => {
      const existing = await this.repo.getWarehouse(trx);

      if (!existing) {
        await this.repo.createWarehouse(data, trx);
      } else {
        await this.repo.updateWarehouse(existing.id, data, trx);
      }
    });

    await redis.del(REDIS_KEYS.WAREHOUSE_ORIGIN);
  };
}
