/// <reference types="jest" />

import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";
import { buildProductPayload } from "../helpers/builders/product.builder";
import { buildVariant } from "../helpers/builders/variant.builder";
import { createAdminAndLogin, createCategory, createCollection } from "../helpers/test-data.helper";

import { buildCheckoutSeed } from "../helpers/builders/checkout.builder";
import { insertCheckout } from "../helpers/seeds/checkout.seed";
import { seedWarehouse } from "../helpers/seeds/warehouse.seed";

describe("POST /v1/user/checkout-sessions/:sessionId/confirm", () => {
  const imagePath = path.join(__dirname, "../helpers/fixtures/images/test-image.png");

  beforeEach(async () => {
    await db.raw(`
      TRUNCATE 
        product_collections,
        product_images,
        product_variant_image_signatures,
        product_variant_images,
        product_variant_option_values,
        product_variant_dimensions,
        product_variants,
        products,
        categories,
        collections,
        users,
        refresh_tokens,
        checkout_sessions,
        checkout_session_items,
        orders,
        order_items,
        order_shipments,
        carts,
        cart_items,
        warehouses
      RESTART IDENTITY CASCADE
    `);
  });

  it("should confirm checkout and create order successfully", async () => {
    // 🔹 login (use admin as user)
    const { cookies, userId } = await createAdminAndLogin();

    // 🔹 create product dependency
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          clientId: "v1",
          isPrimary: true,
          options: [{ dimensionId: "color", optionId: "red" }]
        }),
        buildVariant({
          clientId: "v2",
          isPrimary: false,
          options: [{ dimensionId: "color", optionId: "blue" }]
        })
      ]
    });

    const createRes = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(createRes.status).toBe(201);

    // 🔹 get product + variant
    const productRes = await db.raw(`SELECT id FROM products LIMIT 1`);
    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`SELECT id FROM product_variants LIMIT 1`);
    const variantId = variantRes.rows[0].id;

    // 🔹 seed warehouse
    await seedWarehouse(db);

    // 🔹 seed checkout
    const { session, items } = buildCheckoutSeed({
      userId,
      addressId: null, // not used logically (snapshot already in session)
      productId,
      variantId
    });

    await insertCheckout(db, session, items);

    // 🔹 confirm checkout
    const res = await request(app).post(`/v1/user/checkout-sessions/${session.id}/confirm`).set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // 🔹 assert order created
    const orderRes = await db.raw(`SELECT * FROM orders`);
    expect(orderRes.rows.length).toBe(1);

    const orderItemsRes = await db.raw(`SELECT * FROM order_items`);
    expect(orderItemsRes.rows.length).toBe(1);

    // 🔹 assert session converted
    const sessionRes = await db.raw(`SELECT converted_at FROM checkout_sessions WHERE id = :id`, { id: session.id });

    expect(sessionRes.rows[0].converted_at).not.toBeNull();
  });

  it("should fail if stock is insufficient", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const categoryId = await createCategory();
    const collectionId = await createCollection();

    // create product
    const createRes = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field(
        "payload",
        JSON.stringify(
          buildProductPayload({
            categoryId,
            collectionIds: [collectionId],
            variantDimension: [],
            variants: [
              buildVariant({
                stock: 1, // low stock
                isPrimary: true,
                options: []
              })
            ]
          })
        )
      )
      .attach("productImages", imagePath);

    expect(createRes.status).toBe(201);

    const productId = (await db.raw(`SELECT id FROM products LIMIT 1`)).rows[0].id;
    const variantId = (await db.raw(`SELECT id FROM product_variants LIMIT 1`)).rows[0].id;

    await seedWarehouse(db);

    const { session, items } = buildCheckoutSeed({
      userId,
      addressId: null,
      productId,
      variantId,
      quantity: 5 // greater than stock
    });

    await insertCheckout(db, session, items);

    const res = await request(app).post(`/v1/user/checkout-sessions/${session.id}/confirm`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });

  it("should fail if checkout session expired", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const categoryId = await createCategory();
    const collectionId = await createCollection();

    // create product
    const createRes = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field(
        "payload",
        JSON.stringify(
          buildProductPayload({
            categoryId,
            collectionIds: [collectionId],
            variantDimension: [],
            variants: [buildVariant()]
          })
        )
      )
      .attach("productImages", imagePath);

    expect(createRes.status).toBe(201);

    const productId = (await db.raw(`SELECT id FROM products LIMIT 1`)).rows[0].id;
    const variantId = (await db.raw(`SELECT id FROM product_variants LIMIT 1`)).rows[0].id;

    await seedWarehouse(db);

    const { session, items } = buildCheckoutSeed({
      userId,
      addressId: null,
      productId,
      variantId
    });

    session.expires_at = new Date(Date.now() - 1000); //  expired

    await insertCheckout(db, session, items);

    const res = await request(app).post(`/v1/user/checkout-sessions/${session.id}/confirm`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });

  it("should fail if session already converted", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const categoryId = await createCategory();
    const collectionId = await createCollection();

    // create product
    const createRes = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field(
        "payload",
        JSON.stringify(
          buildProductPayload({
            categoryId,
            collectionIds: [collectionId],
            variantDimension: [],
            variants: [buildVariant()]
          })
        )
      )
      .attach("productImages", imagePath);

    expect(createRes.status).toBe(201);

    const productId = (await db.raw(`SELECT id FROM products LIMIT 1`)).rows[0].id;
    const variantId = (await db.raw(`SELECT id FROM product_variants LIMIT 1`)).rows[0].id;

    await seedWarehouse(db);

    const { session, items } = buildCheckoutSeed({
      userId,
      addressId: null,
      productId,
      variantId
    });

    session.converted_at = new Date(); // already used

    await insertCheckout(db, session, items);

    const res = await request(app).post(`/v1/user/checkout-sessions/${session.id}/confirm`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });

  it("should fail if warehouse is not configured", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const createRes = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field(
        "payload",
        JSON.stringify(
          buildProductPayload({
            categoryId,
            collectionIds: [collectionId],
            variantDimension: [],
            variants: [buildVariant()]
          })
        )
      )
      .attach("productImages", imagePath);

    expect(createRes.status).toBe(201);

    const productId = (await db.raw(`SELECT id FROM products LIMIT 1`)).rows[0].id;
    const variantId = (await db.raw(`SELECT id FROM product_variants LIMIT 1`)).rows[0].id;

    // NO seedWarehouse here

    const { session, items } = buildCheckoutSeed({
      userId,
      addressId: null,
      productId,
      variantId
    });

    await insertCheckout(db, session, items);

    const res = await request(app).post(`/v1/user/checkout-sessions/${session.id}/confirm`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });
});
