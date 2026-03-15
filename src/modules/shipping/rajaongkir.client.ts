import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";
import { City, District, Province } from "./shipping.types";
import { RAJAONGKIR_BASE_URL } from "./shipping.constants";

export class RajaOngkirClient {
  async getProvinces(): Promise<Province[]> {
    const res = await fetch(`${RAJAONGKIR_BASE_URL}/destination/province`, {
      method: "GET",
      headers: {
        accept: "application/json",
        key: env.RAJAONGKIR_API_KEY
      }
    });

    if (!res.ok) {
      throw AppError.serviceUnavailable("Shipping service unavailable");
    }

    const json = (await res.json()) as { data: Province[] };

    return json.data;
  }

  async getCities(provinceId: number): Promise<City[]> {
    const res = await fetch(`${RAJAONGKIR_BASE_URL}/destination/city/${provinceId}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        key: env.RAJAONGKIR_API_KEY
      }
    });

    if (!res.ok) {
      throw AppError.serviceUnavailable("Shipping service unavailable");
    }

    const json = (await res.json()) as { data: City[] };

    return json.data;
  }

  async getDistricts(cityId: number): Promise<District[]> {
    const res = await fetch(`${RAJAONGKIR_BASE_URL}/destination/district/${cityId}`, {
      method: "GET",
      headers: {
        accept: "application/json",
        key: env.RAJAONGKIR_API_KEY
      }
    });

    if (!res.ok) {
      throw AppError.serviceUnavailable("Shipping service unavailable");
    }

    const json = (await res.json()) as { data: District[] };

    return json.data;
  }
}
