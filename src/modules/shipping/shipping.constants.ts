export const SHIPPING_CACHE_KEY = {
  PROVINCES: "shipping:provinces",
  CITIES: (provinceId: number) => `shipping:cities:${provinceId}`,
  DISTRICTS: (cityId: number) => `shipping:districts:${cityId}`
};

export const SHIPPING_CACHE_TTL = {
  PROVINCES: 60 * 60 * 24 * 7, // 7 days
  CITIES: 60 * 60 * 24 * 7,
  DISTRICTS: 60 * 60 * 24 * 7
};

export const RAJAONGKIR_BASE_URL = "https://rajaongkir.komerce.id/api/v1";
