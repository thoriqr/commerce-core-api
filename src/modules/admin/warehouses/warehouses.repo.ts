import { Knex } from "knex";
import { InputWarehouse, WarehousesRow } from "./warehouses.types";
import { db } from "@/infra/db/knex";

export class WarehousesRepo {
  getWarehouse = async (trx?: Knex.Transaction) => {
    const executor = trx ?? db;
    const { rows } = await executor.raw<{ rows: WarehousesRow[] }>(`
    SELECT * FROM warehouses LIMIT 1
  `);

    return rows[0] ?? null;
  };

  createWarehouse = async (input: InputWarehouse, trx: Knex.Transaction) => {
    const { rows } = await trx.raw(
      `
    INSERT INTO warehouses (
      name,
      shipping_province_id,
      shipping_province_name,
      shipping_city_id,
      shipping_city_name
    )
    VALUES (
      :name,
      :provinceId,
      :provinceName,
      :cityId,
      :cityName
    )
    RETURNING id
  `,
      {
        name: input.name,
        provinceId: input.provinceId,
        provinceName: input.provinceName,
        cityId: input.cityId,
        cityName: input.cityName
      }
    );

    return rows[0];
  };

  updateWarehouse = async (id: number, input: InputWarehouse, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE warehouses
    SET
      name = :name,
      shipping_province_id = :provinceId,
      shipping_province_name = :provinceName,
      shipping_city_id = :cityId,
      shipping_city_name = :cityName
    WHERE id = :id
  `,
      {
        id,
        name: input.name,
        provinceId: input.provinceId,
        provinceName: input.provinceName,
        cityId: input.cityId,
        cityName: input.cityName
      }
    );
  };
}
