/// <reference types="jest" />

import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";
import { buildProductPayload } from "../helpers/builders/product.builder";
import { buildVariant } from "../helpers/builders/variant.builder";
import { createAdminAndLogin, createCategory, createCollection } from "../helpers/test-data.helper";

describe("POST /v1/admin/products", () => {
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
  RESTART IDENTITY CASCADE
`);
  });

  const imagePath = path.join(__dirname, "../helpers/fixtures/images/test-image.png");

  it("should create product with variants", async () => {
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
    const { cookies } = await createAdminAndLogin();
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
