import { Knex } from "knex";
import { CheckoutItemSeed, CheckoutSessionSeed } from "../../types/checkout";

export async function insertCheckout(db: Knex, session: CheckoutSessionSeed, items: CheckoutItemSeed[]): Promise<void> {
  // insert checkout session
  await db.raw(
    `
    INSERT INTO checkout_sessions (
      id, user_id, address_id,
      courier_code, courier_service, courier_description, courier_name,
      shipping_cost, shipping_etd,
      subtotal, total,
      expires_at, created_at, updated_at,
      converted_at, revoked_at,
      recipient_name, phone, address_line,
      province_name, city_name, district_name, postal_code,
      shipping_city_id, shipping_district_id
    )
    VALUES (
      :id, :user_id, :address_id,
      :courier_code, :courier_service, :courier_description, :courier_name,
      :shipping_cost, :shipping_etd,
      :subtotal, :total,
      :expires_at, :created_at, :updated_at,
      :converted_at, :revoked_at,
      :recipient_name, :phone, :address_line,
      :province_name, :city_name, :district_name, :postal_code,
      :shipping_city_id, :shipping_district_id
    )
    `,
    session
  );

  // insert checkout items
  for (const item of items) {
    await db.raw(
      `
      INSERT INTO checkout_session_items (
        id, checkout_session_id, variant_id,
        product_name, price, quantity, weight,
        product_id, slug, option_snapshot, created_at
      )
      VALUES (
        :id, :checkout_session_id, :variant_id,
        :product_name, :price, :quantity, :weight,
        :product_id, :slug, :option_snapshot, :created_at
      )
      `,
      {
        ...item,
        option_snapshot: JSON.stringify(item.option_snapshot)
      }
    );
  }
}
