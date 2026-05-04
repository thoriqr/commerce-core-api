/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";
import { buildProductPayload } from "../builders/product.builder";
import { buildVariant } from "../builders/variant.builder";

describe("PUT /v1/admin/products/:id", () => {
  const createAdminAndLogin = async () => {
    const email = `admin_${Date.now()}@mail.com`;
    const password = "password123";

    const passwordHash = await bcrypt.hash(password, 10);

    await db.raw(
      `INSERT INTO users (email, password_hash, role, status)
       VALUES (:email, :passwordHash, 'ADMIN', 'ACTIVE')`,
      { email, passwordHash }
    );

    const res = await request(app).post("/v1/auth/login").send({ email, password });

    expect(res.status).toBe(200);

    return res.headers["set-cookie"];
  };

  const createCategory = async () => {
    const slug = `test-category-${Date.now()}`;

    const res = await db.raw(
      `INSERT INTO categories (name, slug, status, id_path, slug_path)
       VALUES (:name, :slug, :status, :idPath, :slugPath)
       RETURNING id`,
      {
        name: "Test Category",
        slug,
        status: "ACTIVE",
        idPath: "1",
        slugPath: slug
      }
    );

    return res.rows[0].id;
  };

  const createCollection = async () => {
    const slug = `test-collection-${Date.now()}`;

    const res = await db.raw(
      `INSERT INTO collections (name, slug, status)
       VALUES (:name, :slug, :status)
       RETURNING id`,
      {
        name: "Test Collection",
        slug,
        status: "ACTIVE"
      }
    );

    return res.rows[0].id;
  };

  const imagePath = path.join(__dirname, "../fixtures/images/test-image.png");

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
    const cookies = await createAdminAndLogin();
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
    const cookies = await createAdminAndLogin();
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
    const cookies = await createAdminAndLogin();
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
    const cookies = await createAdminAndLogin();
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
