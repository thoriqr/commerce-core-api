import { redis } from "@/libs/redis";
import { RajaOngkirClient } from "./rajaongkir.client";
import { SHIPPING_CACHE_KEY, SHIPPING_CACHE_TTL } from "./shipping.constants";
import { City, District, Province } from "./shipping.types";

export class ShippingService {
  constructor(private readonly client: RajaOngkirClient) {}

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
}
