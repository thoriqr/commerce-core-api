import { db } from "@/infra/db/knex";
import { Knex } from "knex";
import { CreateAddressRepoInput, UpdateAddressRepoInput, UserAddressRow } from "./user.repo.types";
import { UpdateProfileInput } from "./user.schema";
import { UserProfileRow } from "./user.types";

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
      postal_code,
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
      :postalCode,
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
      postal_code = :postalCode,

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

  getUserById = async (userId: number, trx?: Knex.Transaction) => {
    const executor = trx ?? db;

    const { rows } = await executor.raw<{
      rows: {
        id: number;
        email: string;
        display_name: string | null;
        role: string;
        status: string;
        last_login_at: Date | null;
      }[];
    }>(
      `
    SELECT id, email, display_name, role, status
    FROM users
    WHERE id = :userId
    LIMIT 1
  `,
      { userId }
    );

    return rows[0] ?? null;
  };

  getUserProfile = async (userId: number) => {
    const { rows } = await db.raw<{ rows: UserProfileRow[] }>(
      `
      SELECT
      u.id,
      u.email,
      u.display_name,
      u.role,
      u.status,
      (u.password_hash IS NOT NULL) AS has_password,

      -- default address
      ua.id AS address_id,
      ua.recipient_name,
      ua.phone,
      ua.address_line,
      ua.city_name,
      ua.province_name,
      ua.postal_code,

      -- providers (aggregate)
      COALESCE(
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'provider', up.provider,
            'provider_email', up.provider_email,
            'provider_display_name', up.provider_display_name,
            'provider_avatar_url', up.provider_avatar_url
          )
        ) FILTER (WHERE up.id IS NOT NULL),
        '[]'
      ) AS providers

    FROM users u

    LEFT JOIN user_addresses ua
      ON ua.user_id = u.id
      AND ua.is_default = true

    LEFT JOIN user_providers up
      ON up.user_id = u.id

    WHERE u.id = :userId

    GROUP BY u.id, ua.id`,
      { userId }
    );

    return rows[0] ?? null;
  };

  updateProfile = async (userId: number, input: UpdateProfileInput) => {
    const { displayName } = input;
    await db.raw(
      `
    UPDATE users
    SET display_name = :displayName,
        updated_at = NOW()
    WHERE id = :userId
    `,
      {
        userId,
        displayName
      }
    );
  };
}
