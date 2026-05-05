import { Knex } from "knex";

export async function insertOrder(db: Knex, order: any) {
  await db.raw(
    `
    INSERT INTO orders (
      id, user_id, status, payment_status,
      subtotal, shipping_cost, total,
      recipient_name, phone, address_line,
      province_name, city_name, district_name, postal_code,
      email,
      expires_at, order_code,
      snap_token, snap_redirect_url,
      origin_name, origin_province_name, origin_city_name,
      origin_district_name, origin_postal_code
    )
    VALUES (
      :id, :user_id, :status, :payment_status,
      :subtotal, :shipping_cost, :total,
      :recipient_name, :phone, :address_line,
      :province_name, :city_name, :district_name, :postal_code,
      :email,
      :expires_at, :order_code,
      :snap_token, :snap_redirect_url,
      :origin_name, :origin_province_name, :origin_city_name,
      :origin_district_name, :origin_postal_code
    )
    `,
    order
  );
}

export async function insertOrderItems(db: Knex, items: any[]) {
  for (const item of items) {
    await db.raw(
      `
      INSERT INTO order_items (
        id, order_id, variant_id, product_name, slug,
        price, quantity, weight,
        option_snapshot, image_key, image_id, product_id
      )
      VALUES (
        :id, :order_id, :variant_id, :product_name, :slug,
        :price, :quantity, :weight,
        :option_snapshot, :image_key, :image_id, :product_id
      )
      `,
      item
    );
  }
}

export async function insertOrderShipment(db: Knex, shipment: any) {
  await db.raw(
    `
    INSERT INTO order_shipments (
      id, order_id,
      courier_code, courier_name, courier_service,
      courier_description, shipping_etd, status
    )
    VALUES (
      :id, :order_id,
      :courier_code, :courier_name, :courier_service,
      :courier_description, :shipping_etd, :status
    )
    `,
    shipment
  );
}
