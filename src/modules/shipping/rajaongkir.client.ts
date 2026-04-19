import { env } from "@/config/env";
import { AppError } from "@/errors/app-error";
import { City, District, Province, ShippingCost } from "./shipping.types";
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

    const json = (await res.json()) as { data: Province[] | null };

    if (!json.data) {
      return [];
    }

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

    const json = (await res.json()) as { data: City[] | null };

    if (!json.data) {
      return [];
    }

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

    const json = (await res.json()) as { data: District[] | null };

    if (!json.data) {
      return [];
    }

    return json.data;
  }

  async calculateDomesticCost(input: {
    origin: number; // district_id
    destination: number; // district_id
    weight: number;
    courier: string;
  }): Promise<ShippingCost[]> {
    const body = new URLSearchParams({
      origin: String(input.origin),
      destination: String(input.destination),
      weight: String(input.weight),
      courier: input.courier,
      price: "lowest"
    });

    const res = await fetch(`${RAJAONGKIR_BASE_URL}/calculate/district/domestic-cost`, {
      method: "POST",
      headers: {
        accept: "application/json",
        key: env.RAJAONGKIR_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body
    });

    if (!res.ok) {
      throw AppError.serviceUnavailable("Shipping cost service unavailable");
    }

    const json = (await res.json()) as {
      data: ShippingCost[] | null;
    };

    return json.data ?? [];
  }
}
