import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { CreateAddressRepoInput, UpdateAddressRepoInput, UserAddressRow } from "./user.repo.types";

export class UserRepo {
  getUserAddress = async (userId: number) => {
    const { rows } = await db.raw<{ rows: Array<{ id: number }> }>(
      `
    SELECT id
    FROM user_addresses
    WHERE user_id = :userId
    LIMIT 1
    `,
      { userId }
    );

    return rows[0] ?? null;
  };

  getUserAddresses = async (userId: number) => {
    const { rows } = await db.raw<{
      rows: UserAddressRow[];
    }>(
      `
    SELECT
      id,
      label,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      postal_code,
      is_default
    FROM user_addresses
    WHERE user_id = :userId
    ORDER BY is_default DESC, id ASC
    `,
      { userId }
    );

    return rows;
  };

  getAddressDetail = async (userId: number, addressId: number) => {
    const { rows } = await db.raw<{
      rows: Array<{
        label: string | null;
        recipientName: string;
        phone: string;
        addressLine: string;

        shippingProvinceId: number;
        shippingCityId: number;
        shippingDistrictId: number;

        isDefault: boolean;
      }>;
    }>(
      `
    SELECT
      label,
      recipient_name AS "recipientName",
      phone,
      address_line AS "addressLine",

      shipping_province_id AS "shippingProvinceId",
      shipping_city_id AS "shippingCityId",
      shipping_district_id AS "shippingDistrictId",

      is_default AS "isDefault"
    FROM user_addresses
    WHERE id = :addressId
      AND user_id = :userId
    `,
      { userId, addressId }
    );

    return rows[0] ?? null;
  };

  getAddressById = async (userId: number, addressId: number) => {
    const { rows } = await db.raw<{ rows: Array<{ id: number; is_default: boolean }> }>(
      `
    SELECT id, is_default
    FROM user_addresses
    WHERE id = :addressId
      AND user_id = :userId
    `,
      { userId, addressId }
    );

    return rows[0] ?? null;
  };

  clearDefaultAddress = async (userId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE user_addresses
    SET is_default = false
    WHERE user_id = :userId
    `,
      { userId }
    );
  };

  createAddress = async (data: CreateAddressRepoInput, trx: Knex.Transaction) => {
    await trx.raw(
      `
    INSERT INTO user_addresses (
      user_id,
      label,
      recipient_name,
      phone,
      address_line,
      province_name,
      city_name,
      district_name,
      shipping_province_id,
      shipping_city_id,
      shipping_district_id,
      is_default
    )
    VALUES (
      :userId,
      :label,
      :recipientName,
      :phone,
      :addressLine,
      :provinceName,
      :cityName,
      :districtName,
      :shippingProvinceId,
      :shippingCityId,
      :shippingDistrictId,
      :isDefault
    )
    `,
      data
    );
  };

  updateAddress = async (data: UpdateAddressRepoInput, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE user_addresses
    SET
      label = :label,
      recipient_name = :recipientName,
      phone = :phone,
      address_line = :addressLine,

      province_name = :provinceName,
      city_name = :cityName,
      district_name = :districtName,

      shipping_province_id = :shippingProvinceId,
      shipping_city_id = :shippingCityId,
      shipping_district_id = :shippingDistrictId,

      is_default = :isDefault
    WHERE id = :addressId
      AND user_id = :userId
    `,
      data
    );
  };

  setDefaultAddress = async (userId: number, addressId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    UPDATE user_addresses
    SET is_default = true
    WHERE id = :addressId
      AND user_id = :userId
    `,
      { userId, addressId }
    );
  };

  getAnotherAddress = async (userId: number, addressId: number, trx: Knex.Transaction) => {
    const { rows } = await trx.raw<{ rows: Array<{ id: number }> }>(
      `
    SELECT id
    FROM user_addresses
    WHERE user_id = :userId
      AND id <> :addressId
    LIMIT 1
    `,
      { userId, addressId }
    );

    return rows[0] ?? null;
  };

  deleteAddress = async (userId: number, addressId: number, trx: Knex.Transaction) => {
    await trx.raw(
      `
    DELETE FROM user_addresses
    WHERE id = :addressId
      AND user_id = :userId
    `,
      { userId, addressId }
    );
  };

  countUserAddresses = async (userId: number) => {
    const { rows } = await db.raw<{ rows: Array<{ count: number }> }>(
      `
    SELECT COUNT(*)::int AS count
    FROM user_addresses
    WHERE user_id = :userId
    `,
      { userId }
    );

    return rows[0]?.count ?? 0;
  };
}
