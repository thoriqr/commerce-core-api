/// <reference types="jest" />

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";

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

    const payload = {
      name: "Test Product",
      description: "Valid product description", // must be >= 5 chars
      status: "ACTIVE",
      categoryId,
      collectionIds: [collectionId], // required
      images: [
        {
          sortOrder: 0,
          originalFileName: "test-image.png" // MUST match attach filename
        }
      ],
      variantDimension: [
        {
          id: "color",
          name: "Color",
          options: [
            { id: "red", value: "Red" },
            { id: "blue", value: "Blue" }
          ]
        }
      ],
      variants: [
        {
          clientId: "v1",
          price: 10000,
          stock: 10,
          weight: 100,
          status: "ACTIVE",
          isPrimary: true,
          options: [{ dimensionId: "color", optionId: "red" }]
        },
        {
          clientId: "v2",
          price: 10000,
          stock: 5,
          weight: 100,
          status: "ACTIVE",
          isPrimary: false,
          options: [{ dimensionId: "color", optionId: "blue" }]
        }
      ]
    };

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

    const payload = {
      name: "No Primary",
      description: "Valid description",
      status: "ACTIVE",
      categoryId,
      collectionIds: [collectionId],
      images: [
        {
          sortOrder: 0,
          originalFileName: "test-image.png"
        }
      ],
      variantDimension: [], // SINGLE VARIANT → NO DIMENSION
      variants: [
        {
          clientId: "v1",
          price: 10000,
          stock: 10,
          weight: 100,
          status: "ACTIVE",
          isPrimary: false, // no primary
          options: []
        }
      ]
    };

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

    const payload = {
      name: "Missing Image",
      description: "Valid description",
      status: "ACTIVE",
      categoryId,
      collectionIds: [collectionId],
      images: [
        {
          sortOrder: 0,
          originalFileName: "test-image.png"
        }
      ],
      variantDimension: [],
      variants: [
        {
          clientId: "v1",
          price: 10000,
          stock: 10,
          weight: 100,
          status: "ACTIVE",
          isPrimary: true,
          options: []
        }
      ]
    };

    const res = await request(app).post("/v1/admin/products").set("Cookie", cookies).field("payload", JSON.stringify(payload)); // no attach

    expect(res.status).toBe(400);
  });

  it("should fail if category not found", async () => {
    const cookies = await createAdminAndLogin();
    const collectionId = await createCollection();

    const payload = {
      name: "Invalid Category",
      description: "Valid description",
      status: "ACTIVE",
      categoryId: 999999, //  invalid
      collectionIds: [collectionId],
      images: [
        {
          sortOrder: 0,
          originalFileName: "test-image.png"
        }
      ],
      variantDimension: [],
      variants: [
        {
          clientId: "v1",
          price: 10000,
          stock: 10,
          weight: 100,
          status: "ACTIVE",
          isPrimary: true,
          options: []
        }
      ]
    };

    const res = await request(app)
      .post("/v1/admin/products")
      .set("Cookie", cookies)
      .field("payload", JSON.stringify(payload))
      .attach("productImages", imagePath);

    expect(res.status).toBe(404); // now will hit service
  });
});
