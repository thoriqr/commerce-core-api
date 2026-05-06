/// <reference types="jest" />

import crypto from "crypto";
import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";
import path from "path";
import { buildProductPayload } from "../helpers/builders/product.builder";
import { buildVariant } from "../helpers/builders/variant.builder";
import { createAdminAndLogin, createCategory, createCollection } from "../helpers/test-data.helper";

import { buildOrderSeed, buildOrderItemSeed } from "../helpers/builders/order.builder";

import { insertOrder, insertOrderItems } from "../helpers/seeds/order.seed";
import { env } from "../../src/config/env";

describe("POST /v1/payments/midtrans/webhook", () => {
  const imagePath = path.join(__dirname, "../helpers/fixtures/images/test-image.png");

  beforeEach(async () => {
    await db.raw(`
      TRUNCATE
        order_payments,
        order_shipments,
        order_items,
        orders,

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

  function generateSignature(orderId: string, statusCode: string, grossAmount: string) {
    const raw = orderId + statusCode + grossAmount + env.MIDTRANS_SERVER_KEY;

    return crypto.createHash("sha512").update(raw, "utf8").digest("hex");
  }

  it("should mark order as paid and create payment record", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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

    await request(app).post("/v1/admin/products").set("Cookie", cookies).field("payload", JSON.stringify(payload)).attach("productImages", imagePath);

    // 🔹 get product + variant
    const productRes = await db.raw(`
      SELECT id
      FROM products
      LIMIT 1
    `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
      SELECT id, sold
      FROM product_variants
      LIMIT 1
    `);

    const variantId = variantRes.rows[0].id;
    const initialSold = variantRes.rows[0].sold;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed order item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    // 🔹 webhook payload
    const grossAmount = String(order.total);

    const webhookPayload = {
      transaction_id: "trx-midtrans-123",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "settlement",
      fraud_status: "accept",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount),

      va_numbers: [
        {
          bank: "bca",
          va_number: "1234567890"
        }
      ],

      transaction_time: "2026-05-07 10:00:00",
      settlement_time: "2026-05-07 10:05:00"
    };

    // 🔹 hit webhook
    const res = await request(app).post("/v1/payments/midtrans/webhook").send(webhookPayload);

    // 🔹 response
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("ok");

    // 🔹 payment created
    const paymentRes = await db.raw(
      `
      SELECT *
      FROM order_payments
      WHERE transaction_id = :transactionId
      `,
      {
        transactionId: "trx-midtrans-123"
      }
    );

    expect(paymentRes.rows.length).toBe(1);

    const payment = paymentRes.rows[0];

    expect(payment.transaction_status).toBe("settlement");
    expect(payment.payment_type).toBe("bank_transfer");

    expect(payment.bank).toBe("bca");
    expect(payment.payment_code).toBe("1234567890");

    // 🔹 order updated
    const orderRes = await db.raw(
      `
      SELECT payment_status, paid_at
      FROM orders
      WHERE id = :id
      `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("PAID");
    expect(orderRes.rows[0].paid_at).not.toBeNull();

    // 🔹 sold incremented
    const variantAfter = await db.raw(
      `
      SELECT sold
      FROM product_variants
      WHERE id = :id
      `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(initialSold + 2);
  });

  it("should ignore duplicate webhook", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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

    await request(app).post("/v1/admin/products").set("Cookie", cookies).field("payload", JSON.stringify(payload)).attach("productImages", imagePath);

    // 🔹 get product + variant
    const productRes = await db.raw(`
    SELECT id
    FROM products
    LIMIT 1
  `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
    SELECT id, sold
    FROM product_variants
    LIMIT 1
  `);

    const variantId = variantRes.rows[0].id;
    const initialSold = variantRes.rows[0].sold;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    // 🔹 payload
    const grossAmount = String(order.total);

    const webhookPayload = {
      transaction_id: "trx-duplicate-123",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "settlement",
      fraud_status: "accept",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount),

      va_numbers: [
        {
          bank: "bca",
          va_number: "1234567890"
        }
      ],

      transaction_time: "2026-05-07 10:00:00",
      settlement_time: "2026-05-07 10:05:00"
    };

    // 🔹 first webhook
    const firstRes = await request(app).post("/v1/payments/midtrans/webhook").send(webhookPayload);

    expect(firstRes.status).toBe(200);

    // 🔹 second webhook (duplicate)
    const secondRes = await request(app).post("/v1/payments/midtrans/webhook").send(webhookPayload);

    expect(secondRes.status).toBe(200);

    // 🔹 payment should only exist once
    const paymentRes = await db.raw(
      `
    SELECT *
    FROM order_payments
    WHERE transaction_id = :transactionId
    `,
      {
        transactionId: "trx-duplicate-123"
      }
    );

    expect(paymentRes.rows.length).toBe(1);

    // 🔹 order should remain paid
    const orderRes = await db.raw(
      `
    SELECT payment_status, paid_at
    FROM orders
    WHERE id = :id
    `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("PAID");
    expect(orderRes.rows[0].paid_at).not.toBeNull();

    // 🔹 sold increment should happen only once
    const variantAfter = await db.raw(
      `
    SELECT sold
    FROM product_variants
    WHERE id = :id
    `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(initialSold + 2);
  });

  it("should update payment status from capture to settlement", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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
    const productRes = await db.raw(`
    SELECT id
    FROM products
    LIMIT 1
  `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
    SELECT id, sold
    FROM product_variants
    LIMIT 1
  `);

    const variantId = variantRes.rows[0].id;
    const initialSold = variantRes.rows[0].sold;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    const grossAmount = String(order.total);

    // 🔹 capture payload
    const capturePayload = {
      transaction_id: "trx-capture-123",
      order_id: order.order_code,

      payment_type: "credit_card",
      transaction_status: "capture",
      fraud_status: "accept",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount),

      transaction_time: "2026-05-07 10:00:00"
    };

    // 🔹 first webhook (capture)
    const captureRes = await request(app).post("/v1/payments/midtrans/webhook").send(capturePayload);

    expect(captureRes.status).toBe(200);

    // 🔹 settlement payload
    const settlementPayload = {
      transaction_id: "trx-capture-123",
      order_id: order.order_code,

      payment_type: "credit_card",
      transaction_status: "settlement",
      fraud_status: "accept",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount),

      settlement_time: "2026-05-07 10:05:00"
    };

    // 🔹 second webhook (settlement)
    const settlementRes = await request(app).post("/v1/payments/midtrans/webhook").send(settlementPayload);

    expect(settlementRes.status).toBe(200);

    // 🔹 payment should still be single row
    const paymentRes = await db.raw(
      `
    SELECT *
    FROM order_payments
    WHERE transaction_id = :transactionId
    `,
      {
        transactionId: "trx-capture-123"
      }
    );

    expect(paymentRes.rows.length).toBe(1);

    const payment = paymentRes.rows[0];

    // 🔹 status upgraded
    expect(payment.transaction_status).toBe("settlement");

    // 🔹 order should be paid
    const orderRes = await db.raw(
      `
    SELECT payment_status, paid_at
    FROM orders
    WHERE id = :id
    `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("PAID");
    expect(orderRes.rows[0].paid_at).not.toBeNull();

    // 🔹 sold increment should only happen once
    const variantAfter = await db.raw(
      `
    SELECT sold
    FROM product_variants
    WHERE id = :id
    `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(initialSold + 2);
  });

  it("should ignore lower transaction status progression", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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
    const productRes = await db.raw(`
    SELECT id
    FROM products
    LIMIT 1
  `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
    SELECT id, sold
    FROM product_variants
    LIMIT 1
  `);

    const variantId = variantRes.rows[0].id;
    const initialSold = variantRes.rows[0].sold;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    const grossAmount = String(order.total);

    // 🔹 first webhook (settlement)
    const settlementPayload = {
      transaction_id: "trx-downgrade-123",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "settlement",
      fraud_status: "accept",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount),

      va_numbers: [
        {
          bank: "bca",
          va_number: "1234567890"
        }
      ],

      settlement_time: "2026-05-07 10:05:00"
    };

    const settlementRes = await request(app).post("/v1/payments/midtrans/webhook").send(settlementPayload);

    expect(settlementRes.status).toBe(200);

    // 🔹 second webhook (downgrade → pending)
    const pendingPayload = {
      transaction_id: "trx-downgrade-123",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "pending",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount)
    };

    const pendingRes = await request(app).post("/v1/payments/midtrans/webhook").send(pendingPayload);

    expect(pendingRes.status).toBe(200);

    // 🔹 payment should remain settlement
    const paymentRes = await db.raw(
      `
    SELECT transaction_status
    FROM order_payments
    WHERE transaction_id = :transactionId
    `,
      {
        transactionId: "trx-downgrade-123"
      }
    );

    expect(paymentRes.rows.length).toBe(1);
    expect(paymentRes.rows[0].transaction_status).toBe("settlement");

    // 🔹 order should remain PAID
    const orderRes = await db.raw(
      `
    SELECT payment_status, paid_at
    FROM orders
    WHERE id = :id
    `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("PAID");
    expect(orderRes.rows[0].paid_at).not.toBeNull();

    // 🔹 sold increment should still happen only once
    const variantAfter = await db.raw(
      `
    SELECT sold
    FROM product_variants
    WHERE id = :id
    `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(initialSold + 2);
  });

  it("should ignore webhook with invalid signature", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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
    const productRes = await db.raw(`
    SELECT id
    FROM products
    LIMIT 1
  `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
    SELECT id
    FROM product_variants
    LIMIT 1
  `);

    const variantId = variantRes.rows[0].id;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    const grossAmount = String(order.total);

    // 🔹 invalid signature payload
    const webhookPayload = {
      transaction_id: "trx-invalid-signature",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "settlement",
      fraud_status: "accept",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      // ❌ intentionally invalid
      signature_key: "invalid-signature",

      va_numbers: [
        {
          bank: "bca",
          va_number: "1234567890"
        }
      ],

      settlement_time: "2026-05-07 10:05:00"
    };

    // 🔹 hit webhook
    const res = await request(app).post("/v1/payments/midtrans/webhook").send(webhookPayload);

    // 🔹 should still return 200
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("ignored");

    // 🔹 payment should NOT be created
    const paymentRes = await db.raw(
      `
    SELECT *
    FROM order_payments
    WHERE transaction_id = :transactionId
    `,
      {
        transactionId: "trx-invalid-signature"
      }
    );

    expect(paymentRes.rows.length).toBe(0);

    // 🔹 order should remain unpaid
    const orderRes = await db.raw(
      `
    SELECT payment_status, paid_at
    FROM orders
    WHERE id = :id
    `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("UNPAID");
    expect(orderRes.rows[0].paid_at).toBeNull();

    // 🔹 sold should not change
    const variantAfter = await db.raw(
      `
    SELECT sold
    FROM product_variants
    WHERE id = :id
    `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(0);
  });

  it("should mark order as expired", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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
    const productRes = await db.raw(`
    SELECT id
    FROM products
    LIMIT 1
  `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
    SELECT id, sold
    FROM product_variants
    LIMIT 1
  `);

    const variantId = variantRes.rows[0].id;
    const initialSold = variantRes.rows[0].sold;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    const grossAmount = String(order.total);

    // 🔹 expire payload
    const webhookPayload = {
      transaction_id: "trx-expire-123",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "expire",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount)
    };

    // 🔹 hit webhook
    const res = await request(app).post("/v1/payments/midtrans/webhook").send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("ok");

    // 🔹 payment created
    const paymentRes = await db.raw(
      `
    SELECT *
    FROM order_payments
    WHERE transaction_id = :transactionId
    `,
      {
        transactionId: "trx-expire-123"
      }
    );

    expect(paymentRes.rows.length).toBe(1);

    expect(paymentRes.rows[0].transaction_status).toBe("expire");

    // 🔹 order should become expired
    const orderRes = await db.raw(
      `
    SELECT payment_status, paid_at
    FROM orders
    WHERE id = :id
    `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("EXPIRED");
    expect(orderRes.rows[0].paid_at).toBeNull();

    // 🔹 sold should NOT increment
    const variantAfter = await db.raw(
      `
    SELECT sold
    FROM product_variants
    WHERE id = :id
    `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(initialSold);
  });

  it("should mark order as failed", async () => {
    // 🔹 create user/admin
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
          stock: 10,
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
    const productRes = await db.raw(`
    SELECT id
    FROM products
    LIMIT 1
  `);

    const productId = productRes.rows[0].id;

    const variantRes = await db.raw(`
    SELECT id, sold
    FROM product_variants
    LIMIT 1
  `);

    const variantId = variantRes.rows[0].id;
    const initialSold = variantRes.rows[0].sold;

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      paymentStatus: "UNPAID",
      status: "PENDING",
      snapToken: "existing-snap-token"
    });

    await insertOrder(db, order);

    // 🔹 seed item
    const item = buildOrderItemSeed({
      orderId: order.id,
      productId,
      variantId,
      quantity: 2
    });

    await insertOrderItems(db, [item]);

    const grossAmount = String(order.total);

    // 🔹 cancel payload
    const webhookPayload = {
      transaction_id: "trx-cancel-123",
      order_id: order.order_code,

      payment_type: "bank_transfer",
      transaction_status: "cancel",

      gross_amount: grossAmount,
      currency: "IDR",

      status_code: "200",

      signature_key: generateSignature(order.order_code, "200", grossAmount)
    };

    // 🔹 hit webhook
    const res = await request(app).post("/v1/payments/midtrans/webhook").send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("ok");

    // 🔹 payment created
    const paymentRes = await db.raw(
      `
    SELECT *
    FROM order_payments
    WHERE transaction_id = :transactionId
    `,
      {
        transactionId: "trx-cancel-123"
      }
    );

    expect(paymentRes.rows.length).toBe(1);

    expect(paymentRes.rows[0].transaction_status).toBe("cancel");

    // 🔹 order should become failed
    const orderRes = await db.raw(
      `
    SELECT payment_status, paid_at
    FROM orders
    WHERE id = :id
    `,
      { id: order.id }
    );

    expect(orderRes.rows[0].payment_status).toBe("FAILED");
    expect(orderRes.rows[0].paid_at).toBeNull();

    // 🔹 sold should NOT increment
    const variantAfter = await db.raw(
      `
    SELECT sold
    FROM product_variants
    WHERE id = :id
    `,
      { id: variantId }
    );

    expect(variantAfter.rows[0].sold).toBe(initialSold);
  });
});
