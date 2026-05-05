/// <reference types="jest" />

import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";
import { buildProductPayload } from "../helpers/builders/product.builder";
import { buildVariant } from "../helpers/builders/variant.builder";
import { createAdminAndLogin, createCategory, createCollection } from "../helpers/test-data.helper";

describe("PUT /v1/admin/products/:id", () => {
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
        refresh_tokens
      CASCADE
    `);
  });

  it("should update product successfully", async () => {
    const { cookies } = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    // create first
    const createPayload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId]
    });

    const createRes = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(createPayload))
      .attach("productImages", imagePath);

    expect(createRes.status).toBe(201);

    const product = await db.raw(`SELECT id FROM products LIMIT 1`);
    const productId = product.rows[0].id;

    // update
    const updatePayload = buildProductPayload({
      name: "Updated Product Name",
      categoryId,
      collectionIds: [collectionId]
    });

    const res = await request(app)
      .put(`/v1/admin/products/${productId}`)
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(updatePayload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(200);
  });

  it("should return 404 if product not found", async () => {
    const { cookies } = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId]
    });

    const res = await request(app)
      .put("/v1/admin/products/999999")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(404);
  });

  it("should update existing variant price", async () => {
    const { cookies } = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    // create
    const createPayload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId]
    });

    await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(createPayload))
      .attach("productImages", imagePath);

    const product = await db.raw(`SELECT id FROM products LIMIT 1`);
    const productId = product.rows[0].id;

    const variant = await db.raw(`SELECT id FROM product_variants LIMIT 1`);
    const variantId = variant.rows[0].id;

    // update price
    const updatePayload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          id: variantId,
          price: 20000 // updated
        })
      ],
      variantDimension: []
    });

    const res = await request(app)
      .put(`/v1/admin/products/${productId}`)
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(updatePayload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(200);
  });

  it("should archive removed variants on update", async () => {
    const { cookies } = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    // create with 2 variants
    const createPayload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId]
    });

    await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(createPayload))
      .attach("productImages", imagePath);

    const product = await db.raw(`SELECT id FROM products LIMIT 1`);
    const productId = product.rows[0].id;

    const variants = await db.raw(`SELECT id FROM product_variants`);
    const keepVariantId = variants.rows[0].id;

    // update → only 1 variant left
    const updatePayload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          id: keepVariantId
        })
      ],
      variantDimension: []
    });

    const res = await request(app)
      .put(`/v1/admin/products/${productId}`)
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(updatePayload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(200);
  });
});
