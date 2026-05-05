import { Knex } from "knex";

export async function seedWarehouse(db: Knex): Promise<void> {
  await db.raw(`DELETE FROM warehouses`);

  await db.raw(
    `
    INSERT INTO warehouses (
      name,
      shipping_city_id,
      shipping_city_name,
      shipping_province_id,
      shipping_province_name,
      shipping_district_id,
      shipping_district_name,
      postal_code
    )
    VALUES (
      :name,
      :cityId,
      :cityName,
      :provinceId,
      :provinceName,
      :districtId,
      :districtName,
      :postalCode
    )
    `,
    {
      name: "Main Warehouse",
      cityId: 577,
      cityName: "SURABAYA",
      provinceId: 10,
      provinceName: "JAWA TIMUR",
      districtId: 5874,
      districtName: "BENOWO",
      postalCode: "60195"
    }
  );
}
