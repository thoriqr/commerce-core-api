import { redis } from "@/libs/redis";
import { RajaOngkirClient } from "./rajaongkir.client";
import { SHIPPING_CACHE_KEY, SHIPPING_CACHE_TTL, SHIPPING_ORIGIN_CITY_ID } from "./shipping.constants";
import { City, District, Province, ShippingCost } from "./shipping.types";
import { WarehousesRepo } from "../admin/warehouses/warehouses.repo";
import { AppError } from "@/errors/app-error";
import { getWarehouseOriginCityId } from "@/shared/cache/warehouse";

export class ShippingService {
  constructor(
    private readonly client: RajaOngkirClient,
    private readonly warehouseRepo: WarehousesRepo
  ) {}

  async getProvinces(): Promise<Province[]> {
    const cacheKey = SHIPPING_CACHE_KEY.PROVINCES;

    const raw = await redis.get(cacheKey);

    if (raw) {
      try {
        return JSON.parse(raw) as Province[];
      } catch {
        // corrupted cache
        await redis.del(cacheKey);
      }
    }

    const provinces = await this.client.getProvinces();

    await redis.set(cacheKey, JSON.stringify(provinces), {
      EX: SHIPPING_CACHE_TTL.PROVINCES
    });

    return provinces;
  }

  async getCities(provinceId: number): Promise<City[]> {
    const cacheKey = SHIPPING_CACHE_KEY.CITIES(provinceId);

    const raw = await redis.get(cacheKey);

    if (raw) {
      try {
        return JSON.parse(raw) as City[];
      } catch {
        // corrupted cache
        await redis.del(cacheKey);
      }
    }

    const cities = await this.client.getCities(provinceId);

    await redis.set(cacheKey, JSON.stringify(cities), {
      EX: SHIPPING_CACHE_TTL.CITIES
    });

    return cities;
  }

  async getDistricts(cityId: number): Promise<District[]> {
    const cacheKey = SHIPPING_CACHE_KEY.DISTRICTS(cityId);

    const raw = await redis.get(cacheKey);

    if (raw) {
      try {
        return JSON.parse(raw) as District[];
      } catch {
        // corrupted cache
        await redis.del(cacheKey);
      }
    }

    const districts = await this.client.getDistricts(cityId);

    await redis.set(cacheKey, JSON.stringify(districts), {
      EX: SHIPPING_CACHE_TTL.DISTRICTS
    });

    return districts;
  }

  async calculateDomesticCost(destination: number, weight: number, courier: string): Promise<ShippingCost[]> {
    const origin = await getWarehouseOriginCityId();

    const cacheKey = SHIPPING_CACHE_KEY.COST(origin, destination, weight, courier);

    const raw = await redis.get(cacheKey);

    if (raw) {
      try {
        return JSON.parse(raw) as ShippingCost[];
      } catch {
        await redis.del(cacheKey);
      }
    }

    const result = await this.client.calculateDomesticCost({
      origin,
      destination,
      weight,
      courier
    });

    await redis.set(cacheKey, JSON.stringify(result), {
      EX: SHIPPING_CACHE_TTL.COST
    });

    return result;
  }
}
