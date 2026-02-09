import request from "supertest";
import app from "../src/app.js";
import { connect, getDb, close } from "../src/config/db.js";
import { ensureUsageIndexes } from "../src/models/usageModel.js";
import { COLLECTION_NAME } from "../src/helpers/constants.js";

beforeAll(async () => {
  process.env.DB_NAME = process.env.DB_NAME || "rate_limiter_test";
  await connect();
  await ensureUsageIndexes();
});

afterAll(async () => {
  await close();
});

beforeEach(async () => {
  const db = getDb();
  await db.collection(COLLECTION_NAME).deleteMany({});
});

test("first hit returns 200 with count 1", async () => {
  const res = await request(app)
    .post("/api/hit")
    .set("Content-Type", "application/json")
    .send({ userId: "user_basic" });
  expect(res.status).toBe(200);
  expect(res.body.count).toBe(1);
});

test("limit of 5 per minute enforced with 429 on sixth", async () => {
  for (let i = 0; i < 5; i++) {
    const res = await request(app)
      .post("/api/hit")
      .set("Content-Type", "application/json")
      .send({ userId: "user_basic2" });
    expect(res.status).toBe(200);
  }
  const res6 = await request(app)
    .post("/api/hit")
    .set("Content-Type", "application/json")
    .send({ userId: "user_basic2" });
  expect(res6.status).toBe(429);
});

test("usage endpoint returns current count", async () => {
  for (let i = 0; i < 3; i++) {
    await request(app)
      .post("/api/hit")
      .set("Content-Type", "application/json")
      .send({ userId: "user_usage" });
  }
  const res = await request(app).get("/api/usage/user_usage");
  expect(res.status).toBe(200);
  expect(res.body.count).toBe(3);
});
