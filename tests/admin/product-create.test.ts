/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";
import { buildProductPayload } from "../builders/product.builder";
import { buildVariant } from "../builders/variant.builder";

describe("POST /v1/admin/products", () => {
  // helper: create admin and login to get access_token cookie
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
        idPath: "1", // simple dummy
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

  const imagePath = path.join(__dirname, "../fixtures/images/test-image.png");

  it("should create product with variants (happy path)", async () => {
    const cookies = await createAdminAndLogin();
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

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(201);
  });

  it("should fail if no primary variant", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      name: "No Primary",
      categoryId,
      collectionIds: [collectionId],
      variantDimension: [],
      variants: [
        buildVariant({
          isPrimary: false,
          options: []
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });

  it("should fail if image file missing", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      name: "Missing Image",
      categoryId,
      collectionIds: [collectionId],
      variantDimension: [],
      variants: [
        buildVariant({
          options: []
        })
      ]
    });

    const res = await request(app).post("/v1/admin/products").set("Cookie", cookies).field("payload", JSON.stringify(payload)); // no attach

    expect(res.status).toBe(400);
  });

  it("should fail if category not found", async () => {
    const cookies = await createAdminAndLogin();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      name: "Invalid Category",
      categoryId: 999999,
      collectionIds: [collectionId],
      variantDimension: [],
      variants: [
        buildVariant({
          options: []
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(404);
  });

  it("should fail if multiple primary variants exist", async () => {
    const cookies = await createAdminAndLogin();
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
          isPrimary: true, //  duplicate primary
          options: [{ dimensionId: "color", optionId: "blue" }]
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });

  it("should allow duplicate variant option combinations", async () => {
    const cookies = await createAdminAndLogin();
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
          options: [{ dimensionId: "color", optionId: "red" }] // duplicate combination allowed
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(201);
  });

  it("should fail if primary variant is inactive while product is ACTIVE", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          clientId: "v1",
          isPrimary: true,
          status: "INACTIVE", //  invalid
          options: [{ dimensionId: "color", optionId: "red" }]
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });

  it("should fail if option does not belong to dimension", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          options: [
            {
              dimensionId: "color",
              optionId: "invalid-option" // invalid option not defined in dimension
            }
          ]
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });

  it("should fail if variant price is zero", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          price: 0, // invalid
          options: [{ dimensionId: "color", optionId: "red" }]
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });

  it("should fail if variant stock is negative", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          stock: -1, // invalid
          options: [{ dimensionId: "color", optionId: "red" }]
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });

  it("should fail if variant weight is zero", async () => {
    const cookies = await createAdminAndLogin();
    const categoryId = await createCategory();
    const collectionId = await createCollection();

    const payload = buildProductPayload({
      categoryId,
      collectionIds: [collectionId],
      variants: [
        buildVariant({
          weight: 0, // invalid
          options: [{ dimensionId: "color", optionId: "red" }]
        })
      ]
    });

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(400);
  });
});
