/// <reference types="jest" />

import request from "supertest";
import app from "../../src/app";
import { db } from "../../src/infra/db/knex";

import { createAdminAndLogin } from "../helpers/test-data.helper";
import { buildOrderSeed, buildOrderItemSeed } from "../helpers/builders/order.builder";

import { insertOrder, insertOrderItems } from "../helpers/seeds/order.seed";

import { createSnapTransaction } from "../../src/modules/payment/midtrans/midtrans.client";

jest.mock("@/modules/payment/midtrans/midtrans.client", () => ({
  createSnapTransaction: jest.fn()
}));

describe("POST /v1/user/orders/:orderCode/snap-token", () => {
  beforeEach(async () => {
    await db.raw(`
      TRUNCATE 
        orders,
        order_items,
        order_shipments
      RESTART IDENTITY CASCADE
    `);
  });

  it("should create snap token successfully", async () => {
    // 🔹 mock midtrans
    (createSnapTransaction as jest.Mock).mockResolvedValue({
      token: "mock-token",
      redirect_url: "https://mock-url"
    });

    // 🔹 login
    const { cookies, userId } = await createAdminAndLogin();

    // 🔹 seed order
    const order = buildOrderSeed({
      userId,
      snapToken: null
    });

    await insertOrder(db, order);

    // 🔹 seed items
    const item = buildOrderItemSeed({
      orderId: order.id
    });

    await insertOrderItems(db, [item]);

    // 🔹 call API
    const res = await request(app).post(`/v1/user/orders/${order.order_code}/snap-token`).set("Cookie", cookies);

    // 🔹 assertions
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBe("mock-token");
    expect(res.body.data.redirect_url).toBe("https://mock-url");

    // 🔹 assert DB updated
    const updated = await db.raw(`SELECT snap_token, snap_redirect_url FROM orders WHERE id = :id`, { id: order.id });

    expect(updated.rows[0].snap_token).toBe("mock-token");
    expect(updated.rows[0].snap_redirect_url).toBe("https://mock-url");
  });

  it("should reuse existing snap token", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const order = buildOrderSeed({
      userId,
      snapToken: "existing-token",
      snapRedirectUrl: "https://existing-url"
    });

    await insertOrder(db, order);

    const item = buildOrderItemSeed({
      orderId: order.id
    });

    await insertOrderItems(db, [item]);

    // clear mock to ensure it's NOT called
    (createSnapTransaction as jest.Mock).mockClear();

    const res = await request(app).post(`/v1/user/orders/${order.order_code}/snap-token`).set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBe("existing-token");
    expect(res.body.data.redirect_url).toBe("https://existing-url");

    // ensure midtrans NOT called
    expect(createSnapTransaction).not.toHaveBeenCalled();
  });

  it("should return 404 if order not found", async () => {
    const { cookies } = await createAdminAndLogin();

    const res = await request(app).post(`/v1/user/orders/INVALID_CODE/snap-token`).set("Cookie", cookies);

    expect(res.status).toBe(404);
  });

  it("should fail if order expired", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const order = buildOrderSeed({
      userId,
      expiresAt: new Date(Date.now() - 1000) // expired
    });

    await insertOrder(db, order);

    const item = buildOrderItemSeed({
      orderId: order.id
    });

    await insertOrderItems(db, [item]);

    const res = await request(app).post(`/v1/user/orders/${order.order_code}/snap-token`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });

  it("should fail if order already paid", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const order = buildOrderSeed({
      userId,
      paymentStatus: "PAID"
    });

    await insertOrder(db, order);

    const item = buildOrderItemSeed({
      orderId: order.id
    });

    await insertOrderItems(db, [item]);

    const res = await request(app).post(`/v1/user/orders/${order.order_code}/snap-token`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });

  it("should fail if order is cancelled", async () => {
    const { cookies, userId } = await createAdminAndLogin();

    const order = buildOrderSeed({
      userId,
      status: "CANCELLED"
    });

    await insertOrder(db, order);

    const item = buildOrderItemSeed({
      orderId: order.id
    });

    await insertOrderItems(db, [item]);

    const res = await request(app).post(`/v1/user/orders/${order.order_code}/snap-token`).set("Cookie", cookies);

    expect(res.status).toBe(400);
  });

  it("should fail if midtrans request fails", async () => {
    (createSnapTransaction as jest.Mock).mockRejectedValue(new Error("Midtrans error"));

    const { cookies, userId } = await createAdminAndLogin();

    const order = buildOrderSeed({ userId });

    await insertOrder(db, order);

    const item = buildOrderItemSeed({
      orderId: order.id
    });

    await insertOrderItems(db, [item]);

    const res = await request(app).post(`/v1/user/orders/${order.order_code}/snap-token`).set("Cookie", cookies);

    expect(res.status).toBe(500);
  });
});
