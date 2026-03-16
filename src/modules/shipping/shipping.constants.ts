export const SHIPPING_CACHE_KEY = {
  PROVINCES: "shipping:provinces",
  CITIES: (provinceId: number) => `shipping:cities:${provinceId}`,
  DISTRICTS: (cityId: number) => `shipping:districts:${cityId}`,
  COST: (origin: number, destination: number, weight: number, courier: string) => `shipping:cost:${origin}:${destination}:${weight}:${courier}`
};

export const SHIPPING_CACHE_TTL = {
  PROVINCES: 60 * 60 * 24 * 7, // 7 days
  CITIES: 60 * 60 * 24 * 7,
  DISTRICTS: 60 * 60 * 24 * 7,
  COST: 60 * 10 // 10 minutes
};

export const SHIPPING_ORIGIN_CITY_ID = 531; // warehouse

export const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";
